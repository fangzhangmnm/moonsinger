// client.ts —— 主线程这边：把乐谱发给月读的 worker、拿回歌声。created 2026-10-06 by Claude Opus 5.5
// worker 第一次用到才创建（家规：重资源要等用户有意图才加载）。
// 2026-10-09（Claude Fable 5.1，实时试听刀 1 / 刀 2）：播放和 SoundFont 的离线渲染都搬去了录音房（src/engine/）——这里只剩「唱」；
//   唱的请求在这边排队（借朗读库 cancelPending 的做法：排多了用户一跳就全作废），cancelPending() 扔掉还没开始算的。
// 2026-10-10（Claude Fable 5.1，刀 6 ③）：**几条工作道（lane）并行唱**——每条道一个 worker（各自一份引擎 + 念缓存）；PC 两条、iPad 一条（主线程按设备定 setLanes）。
//   句子按内容哈希认一条「自己的道」（同一句的念缓存只在那条道上有：按键试听永远去自己的道，整句唱优先自己的道、它忙就去空着的那条）。
//   内存吃紧 = 主线程 setLanes(1)：多出来的道算完手上的就关（WASM 堆只有关掉 worker 才还回去）。
import type { LabScore } from "../score/lab-score.ts";
import type { SingReply, SingRequest, WarmRequest, CancelRequest, CacheRequest } from "./worker.ts";
import { audioCtx } from "./audio.ts";
import { diagNote } from "../app/report-error.ts";

/** 内存不够的样子（onnxruntime-web 起不来时报「no available backend found. ERR: [wasm] RangeError: Out of memory」）。 */
const OOM = /out of memory|no available backend/i;

export interface SingResult { samples: Float32Array; sr: number; ms: { load: number; sing: number; boot?: Record<string, number> } }
export interface LaneMem { wasm: number; cache: number }
export interface DiskInfo { bytes: number; entries: number; budget: number }
type Extra = Partial<Pick<SingRequest, "opt" | "atlas" | "breath" | "models" | "raw" | "cacheBytes" | "diskBytes" | "only">> & { /** 宿主给这一句贴的标签（块的键）：cancelInflight(tag) 只取消它。 */ tag?: string };
interface Job { s: LabScore; progress: (stage: string) => void; extra: Extra; ok: (r: SingResult) => void; fail: (e: Error) => void }
interface Pending { ok: (r: SingResult) => void; fail: (e: Error) => void; progress: (s: string) => void; lane: Lane; tag?: string }
interface Lane {
  w: Worker | null;
  inflightId: number;           // 正在算的整句（0 = 空着）
  inflightTag?: string;
  onlyId: number;               // 最近一次按键试听的请求（新的来了旧的取消）
  warming: Promise<void> | null;
  mem: LaneMem | null;          // 最近一次报的占用
  closing: boolean;             // setLanes 减掉的：算完手上的就关
}
const newLane = (): Lane => ({ w: null, inflightId: 0, onlyId: 0, warming: null, mem: null, closing: false });
const hash = (s: string): number => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

export class Singer {
  private lanes: Lane[] = [newLane()];
  private retiring: Lane[] = [];   // 减掉但还在算的道
  private seq = 0;
  private pending = new Map<number, Pending>();
  private queue: Job[] = [];
  /** 每次有道报占用就叫一下（刀 6 内存监控）。 */
  onMem: ((lane: number, mem: LaneMem) => void) | null = null;

  /** 几条道（主线程按设备定；内存吃紧降到 1）。 */
  get parallelism(): number { return this.lanes.length; }
  setLanes(n: number): void {
    n = Math.max(1, Math.floor(n));
    while (this.lanes.length < n) this.lanes.push(newLane());
    while (this.lanes.length > n) { const l = this.lanes.pop()!; if (l.inflightId || [...this.pending.values()].some((p) => p.lane === l)) { l.closing = true; this.retiring.push(l); } else this.closeLane(l); }
  }
  /** 每条道最近报的占用（没起的道不在里面）。 */
  memory(): LaneMem[] { return this.lanes.map((l) => l.mem).filter((m): m is LaneMem => !!m); }
  laneBusy(i: number): boolean { const l = this.lanes[i]; return !!l && (l.inflightId !== 0 || [...this.pending.values()].some((p) => p.lane === l)); }

  private laneFor(s: LabScore): Lane { return this.lanes[hash(`${s.LANG}|${s.TEXT}`) % this.lanes.length]; }
  private laneIndex(l: Lane): number { return this.lanes.indexOf(l); }
  private worker(l: Lane): Worker {
    if (l.w) return l.w;
    const w = new Worker(new URL(`./${__SINGER_WORKER__}`, import.meta.url), { type: "module" });
    l.w = w;
    w.onmessage = (ev: MessageEvent<SingReply>) => {
      const m = ev.data, p = this.pending.get(m.id); if (!p) return;
      if (m.type === "progress") { p.progress(m.stage); return; }
      this.pending.delete(m.id);
      if (m.type === "cache") { (p as Pending & { cache?: (d: DiskInfo | null) => void }).cache?.(m.disk); return; }
      if (m.type === "done") { if (m.mem) { l.mem = m.mem; const i = this.laneIndex(l); if (i >= 0) this.onMem?.(i, m.mem); } p.ok({ samples: m.samples, sr: m.sr, ms: m.ms }); }
      else p.fail(new Error(m.message));
      if (l.closing && ![...this.pending.values()].some((q) => q.lane === l)) this.closeLane(l);
    };
    w.onerror = (e) => {   // 坏了就丢掉，下次用重建（不然下一次永远等不到回复）
      this.failLane(l, new Error(e.message || "月读的 worker 出错"));
    };
    return w;
  }
  private closeLane(l: Lane): void { l.w?.terminate(); l.w = null; l.mem = null; l.inflightId = 0; l.onlyId = 0; const k = this.retiring.indexOf(l); if (k >= 0) this.retiring.splice(k, 1); }
  private failLane(l: Lane, err: Error): void {
    l.w?.terminate(); l.w = null; l.mem = null; l.inflightId = 0; l.onlyId = 0;
    for (const [id, p] of [...this.pending]) if (p.lane === l) { this.pending.delete(id); p.fail(err); }
    void this.pump();
  }

  /** 重开所有道：wasm 的内存只涨不落，只有整个 worker 关掉才真还回去。 */
  restart(): void { for (const l of this.lanes) this.failLane(l, new Error("月读的 worker 重开了")); }
  /** 只重开一条道（内存监控：这条道的堆超了预算、现在空着）。 */
  restartLane(i: number): void { const l = this.lanes[i]; if (l) this.failLane(l, new Error("月读的 worker 重开了")); }
  /** 还没开始算的全扔掉（以 "cancelled" 拒绝）；正在算的照常回来。返回扔了几个。 */
  cancelPending(): number {
    const n = this.queue.length;
    for (const j of this.queue.splice(0)) j.fail(new Error("cancelled"));
    return n;
  }
  /** 取消正在算的整句（worker 在段与段之间认；正在跑的那一段跑完才停）。给了 tag = 只取消贴着这个标签的那句；不给 = 全部。 */
  cancelInflight(tag?: string): void {
    for (const l of [...this.lanes, ...this.retiring]) if (l.inflightId && (tag === undefined || l.inflightTag === tag)) { const req: CancelRequest = { type: "cancel", id: l.inflightId }; l.w?.postMessage(req); }
  }
  /** 只把引擎起起来（打开歌就起；user 10-10「冷启动做」）：第一条道。别的道第一次用到才起（起在并行里，不另花等待）。失败不抛（第一次真唱会再报）。 */
  warm(models?: string[], diskBytes?: number): Promise<void> {
    const l = this.lanes[0];
    return (l.warming ??= new Promise<void>((ok) => {
      const id = ++this.seq, req: WarmRequest = { type: "warm", id, models, diskBytes };
      this.pending.set(id, { ok: () => ok(), fail: () => ok(), progress: () => {}, lane: l }); this.worker(l).postMessage(req);
    }).finally(() => { l.warming = null; }));
  }
  /** 念缓存持久层（全局池）：看大小 / 清空。走第一条道（不起引擎）。 */
  cache(op: "info" | "clear", diskBytes?: number): Promise<DiskInfo | null> {
    const l = this.lanes[0], id = ++this.seq, req: CacheRequest = { type: "cache", id, op, diskBytes };
    return new Promise((ok, fail) => { this.pending.set(id, { ok: () => ok(null), fail, progress: () => {}, lane: l, cache: ok } as Pending & { cache: (d: unknown) => void }); this.worker(l).postMessage(req); });
  }
  get busy(): boolean { return this.queue.length > 0 || this.lanes.some((l) => l.inflightId !== 0); }
  get queued(): number { return this.queue.length; }

  /** 唱（排队；每条道一次一句）。内存不够（换着试很多音色之后 wasm 堆撑大了，月读的引擎起不来——user 2026-10-08 iPad「Out of memory」「感觉是没有gc」）
   *  = 重开那条道（全部还回去）再试一次；还不行才报错。同一位演奏者重来，不是换人（不自动替补）。 */
  sing(s: LabScore, progress: (stage: string) => void = () => {}, extra: Extra = {}): Promise<SingResult> {
    return new Promise<SingResult>((ok, fail) => { this.queue.push({ s, progress, extra, ok, fail }); void this.pump(); });
  }
  private pump(): void {
    for (;;) {
      const j = this.queue[0]; if (!j) return;
      const pref = this.laneFor(j.s), lane = pref.inflightId === 0 ? pref : this.lanes.find((l) => l.inflightId === 0);
      if (!lane) return;   // 都忙：等哪条道算完再来
      this.queue.shift();
      lane.inflightId = -1;   // 占住（真正的 id 在 singOnce 里给）
      void this.singRetry(lane, j.s, j.progress, j.extra).then(j.ok, j.fail).finally(() => { lane.inflightId = 0; lane.inflightTag = undefined; this.pump(); });
    }
  }
  private async singRetry(lane: Lane, s: LabScore, progress: (stage: string) => void, extra: Extra): Promise<SingResult> {
    try { return await this.singOnce(lane, s, progress, extra); }
    catch (e) {
      const msg = (e as Error).message ?? "";
      if (!OOM.test(msg)) throw e;
      diagNote("singer", `out of memory, restarting worker and retrying once: ${msg}`);
      this.failLane(lane, new Error("月读的 worker 重开了")); progress("内存不够：重开月读的引擎再试一次");
      try { return await this.singOnce(lane, s, progress, extra); }
      catch (e2) {
        const m2 = (e2 as Error).message ?? "";
        diagNote("singer", `retry after restart failed: ${m2}`);
        if (OOM.test(m2)) throw new Error("这台设备的内存不够，月读的引擎起不来（已经重开过一次引擎）。可以把别的乐器声部静音再放，或者关掉 app 重新打开；也可以给这个声部换「月读（元音）」");
        throw e2;
      }
    }
  }
  private singOnce(lane: Lane, s: LabScore, progress: (stage: string) => void, extra: Extra): Promise<SingResult> {
    const id = ++this.seq;
    const { tag, ...rest } = extra;
    if (rest.only) { if (lane.onlyId) lane.w?.postMessage({ type: "cancel", id: lane.onlyId } satisfies CancelRequest); lane.onlyId = id; } else { lane.inflightId = id; lane.inflightTag = tag; }
    const req: SingRequest = { type: "sing", id, score: s.SCORE, text: s.TEXT, tempo: s.TEMPO_QUARTER, lang: s.LANG, ...rest };
    return new Promise((ok, fail) => { this.pending.set(id, { ok, fail, progress, lane, tag }); this.worker(lane).postMessage(req); });
  }
  /** 只唱一个字（按键试听，刀 3）：不排队、直接给这一句自己的道（排在整句后面 = 迟到的音更烦；worker 在段界之间就会插进来）；念缓存命中时几毫秒。 */
  singOnly(s: LabScore, only: { entry: number; midi: number; secs: number }, extra: Omit<Extra, "only" | "raw" | "tag"> = {}): Promise<SingResult> {
    return this.singOnce(this.laneFor(s), s, () => {}, { ...extra, only, raw: true });
  }
  /** 全 app 共用的 AudioContext（必须在用户手势里先调过一次，iPad 才放声）。 */
  unlock(): AudioContext { return audioCtx(); }
}
