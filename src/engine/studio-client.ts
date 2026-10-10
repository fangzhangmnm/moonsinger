// studio-client.ts —— 主线程这边的录音房：装 worklet（dist/studio-worklet-<hash>.mjs）、把 TinySoundFont 的 WASM 编好递进去、喂库 / 元音表 / 时间线 / 块、走带、按键试听、
// 收位置 / 结束 / 缺块。离线导出 = 同一个 Studio 类在这边的循环里跑（同一份数学；提案 §5）。created 2026-10-09 by Claude Fable 5.1
// 一个 app 一个实例；AudioContext 全 app 共用（src/singer/audio.ts）。装 worklet 第一次用才做（家规：重资源要等用户有意图才加载）。
import { instantiateTsf } from "../gm/tsf-standalone.ts";
import { Studio, BLOCK, toInt16, type StudioIn, type StudioOut, type TimelineMsg, type ChannelParams, type MasterParams, type BusSpec, type VowelEntry, type AuditionInst } from "./studio.ts";

export interface VowelTableMsg { sr: number; entries: VowelEntry[]; pcm: Int16Array }
export interface LoadInfo { busy: number; chunkBytes: number; chunks: number; voices: number }
/** 一条位置报告：音频时钟 at 那一刻，走带在 sec；run = 正在往前走（放着、没在等块）。 */
export interface PosSample { at: number; sec: number; run: boolean }
/** 扬声器此刻（音频时钟 T）放的是走带的哪儿：找 T 之前最近的一条报告，往前推 T − at（在等块 / 停着 = 不推）。T 比最早一条还早 = 那一条的位置。纯函数（测试用）。 */
export function audibleAt(hist: readonly PosSample[], T: number): number | null {
  if (!hist.length) return null;
  let i = hist.length - 1; while (i > 0 && hist[i].at > T) i--;
  const s = hist[i];
  if (s.at > T) return s.sec;
  return s.run ? s.sec + (T - s.at) : s.sec;
}
/** 扬声器此刻放到音频时钟的哪一刻，以及按哪一档算的（v0.10.3，Claude Opus 5.5；user「大部分音和动画没对齐都是发生在长锁屏之后回到前台」）。
 *  getOutputTimestamp 给一对（音频时钟, performance 时钟），要用 performance.now() 从那一刻往前推——这一推假定两个时钟一起走；
 *  设备睡过一觉，两个时钟可能对不上（一个算睡眠、一个不算），推出来的时刻会跑到录音房算到的前面，播放头就提前（audibleAt 还会接着往前推）。
 *  所以先查合理：扬声器不可能比录音房算到的（currentTime）更靠前，输出延迟也不会超过 MAX_OUTPUT_LAT。
 *  ① 推出来的合理 = 用它（"ts"）② 不合理 = 不推、只用时间戳里的音频时钟（最多落后一个回调，约 10 ms；"ts-ctx"）③ 那个也不合理（时间戳冻住了）= currentTime − 两个延迟（"estimate"）。 */
export type ClockSource = "ts" | "ts-ctx" | "estimate";
export const MAX_OUTPUT_LAT = 1.0;
export function outputClock(o: { currentTime: number; ts: { contextTime: number; performanceTime: number } | null; perfNow: number; baseLatency?: number; outputLatency?: number }): { T: number; src: ClockSource } | null {
  const c = o.currentTime, ok = (T: number) => T <= c + 0.005 && c - T <= MAX_OUTPUT_LAT;
  if (o.ts && o.ts.contextTime && o.ts.performanceTime) {
    const T = o.ts.contextTime + Math.max(0, o.perfNow - o.ts.performanceTime) / 1000;
    if (ok(T)) return { T, src: "ts" };
    if (ok(o.ts.contextTime)) return { T: o.ts.contextTime, src: "ts-ctx" };
  }
  return c ? { T: c - (o.baseLatency || 0) - (o.outputLatency || 0), src: "estimate" } : null;
}
export interface StudioEvents { pos: (sec: number, playing: boolean, waiting: string | null) => void; ended: () => void; missing: (keys: string[]) => void; meter: (peak: number, active: number, tracks: Record<string, number>) => void; load: (info: LoadInfo) => void }

export class StudioClient {
  private node: AudioWorkletNode | null = null;
  private readyP: Promise<void> | null = null;
  private wasm: Promise<WebAssembly.Module> | null = null;
  private presets = new Map<string, Map<string, number>>();   // sha → "bank:program" → 预设下标
  private bankWait = new Map<string, { ok: () => void; fail: (e: Error) => void }[]>();
  private bankBytes = new Map<string, Uint8Array>();   // 离线导出时再装一遍要用
  private vowelTable: VowelTableMsg | null = null;
  private tl: TimelineMsg | null = null;
  private chunkKeys = new Set<string>();   // 块只在录音房里一份（Int16；刀 5）；主线程只记键
  private pendingChunks: { key: string; sr: number; samples: Int16Array }[] = [];   // worklet 还没装好时先排着
  private chunkWait: ((items: { key: string; sr: number; samples: Int16Array }[]) => void) | null = null;
  private channels = new Map<string, Partial<ChannelParams>>();
  private masterP: Partial<MasterParams> = {};
  private busesP: BusSpec[] = [];
  private listeners = new Map<keyof StudioEvents, Set<(...a: never[]) => void>>();
  private _playing = false; private _pos = 0; private _waiting: string | null = null;
  private gen = 0;
  private hist: PosSample[] = [];   // 最近 3 s 的位置报告（音频时钟 → 走带位置）：播放头按扬声器的时钟查这张表（2026-10-10 Opus 5.5；user「ipad后台唤起后音频和动画错位」）   // 走带代号：play / stop 各加一；录音房的位置报告带着发出时的代号，旧代号的（停了之后还在路上的）扔掉——不然「停」之后一条迟到的 pos 会把 playing 翻回 true

  private ctx: () => AudioContext; private moduleUrl: URL; private wasmUrl: URL;
  constructor(ctx: () => AudioContext, moduleUrl: URL, wasmUrl: URL) { this.ctx = ctx; this.moduleUrl = moduleUrl; this.wasmUrl = wasmUrl; }

  on<K extends keyof StudioEvents>(ev: K, cb: StudioEvents[K]): () => void {
    let set = this.listeners.get(ev); if (!set) { set = new Set(); this.listeners.set(ev, set); }
    set.add(cb as (...a: never[]) => void); return () => { set.delete(cb as (...a: never[]) => void); };
  }
  private emit<K extends keyof StudioEvents>(ev: K, ...args: Parameters<StudioEvents[K]>): void { for (const cb of this.listeners.get(ev) ?? []) (cb as (...a: unknown[]) => void)(...args); }

  get playing(): boolean { return this._playing; }
  get position(): number { return this._pos; }
  get waiting(): string | null { return this._waiting; }
  get timeline(): TimelineMsg | null { return this.tl; }
  hasChunk(key: string): boolean { return this.chunkKeys.has(key); }

  private wasmModule(): Promise<WebAssembly.Module> {
    return (this.wasm ??= fetch(this.wasmUrl).then(async (r) => { if (!r.ok) throw new Error(`TinySoundFont (standalone): HTTP ${r.status}`); return WebAssembly.compile(await r.arrayBuffer()); }));
  }
  /** 装好 worklet + WASM（第一次用才做；AudioContext 可以还没解锁）。 */
  ensure(): Promise<void> {
    if (this.readyP) return this.readyP;
    this.readyP = (async () => {
      const ctx = this.ctx();
      const [, module] = await Promise.all([ctx.audioWorklet.addModule(this.moduleUrl.href), this.wasmModule()]);
      const node = new AudioWorkletNode(ctx, "studio", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { module } });
      await new Promise<void>((ok, fail) => {
        node.port.onmessage = (e: MessageEvent<StudioOut>) => {
          const m = e.data;
          switch (m.type) {
            case "ready": ok(); return;
            case "banked": { this.presets.set(m.sha, new Map(m.presets.map(([b, p], i) => [`${b}:${p}`, i]))); for (const w of this.bankWait.get(m.sha) ?? []) w.ok(); this.bankWait.delete(m.sha); return; }
            case "error": { fail(new Error(m.message)); for (const ws of this.bankWait.values()) for (const w of ws) w.fail(new Error(m.message)); this.bankWait.clear(); return; }
            case "pos": {
              if (m.gen !== this.gen) return; this._pos = m.sec; this._playing = m.playing; this._waiting = m.waiting;
              if (m.at !== undefined) { const h = this.hist; h.push({ at: m.at, sec: m.sec, run: m.playing && !m.waiting }); while (h.length > 2 && h[0].at < m.at - 3) h.shift(); }
              this.emit("pos", m.sec, m.playing, m.waiting); return;
            }
            case "ended": if (m.gen !== this.gen) return; this._playing = false; this.emit("ended"); return;
            case "missing": this.emit("missing", m.keys); return;
            case "meter": this.emit("meter", m.peak, m.active, m.tracks ?? {}); return;
            case "load": this.emit("load", { busy: m.busy, chunkBytes: m.chunkBytes, chunks: m.chunks, voices: m.voices }); return;
            case "chunks": { const w = this.chunkWait; this.chunkWait = null; w?.(m.items); return; }
          }
        };
      });
      node.connect(ctx.destination);
      this.node = node;
      // 装之前记下的状态照发（元音表 / 库 / 通道 / 总轨 / 时间线 / 块）
      if (this.vowelTable) this.post({ type: "vowels", ...this.vowelTable });
      for (const [sha, bytes] of this.bankBytes) this.post({ type: "bank", sha, bytes: bytes.slice() });
      for (const [id, p] of this.channels) this.post({ type: "channel", id, p });
      if (this.busesP.length) this.post({ type: "buses", buses: this.busesP });
      if (Object.keys(this.masterP).length) this.post({ type: "master", p: this.masterP });
      if (this.tl) this.post({ type: "timeline", tl: this.tl });
      for (const c of this.pendingChunks.splice(0)) this.post({ type: "chunk", key: c.key, sr: c.sr, samples: c.samples }, [c.samples.buffer]);
    })().catch((e) => { this.readyP = null; throw e; });
    return this.readyP;
  }
  private post(m: StudioIn, transfer: Transferable[] = []): void { this.node?.port.postMessage(m, transfer); }

  /** 载一份 sf2（按 sha 留着，多份并存；同一份不重载）。resolve = worklet 里装好了（预设表可查）。 */
  async bank(sha: string, bytes: Uint8Array): Promise<void> {
    if (this.presets.has(sha)) return;
    const first = !this.bankBytes.has(sha); this.bankBytes.set(sha, bytes);
    await this.ensure();
    if (this.presets.has(sha)) return;
    const p = new Promise<void>((ok, fail) => { const ws = this.bankWait.get(sha) ?? []; ws.push({ ok, fail }); this.bankWait.set(sha, ws); });
    if (first || !this.bankWait.get(sha)?.length) { /* 装的时候已经在 ensure 里发过一次（bankBytes 先记）；这里补发是幂等的 */ }
    this.post({ type: "bank", sha, bytes: bytes.slice() });
    return p;
  }
  hasBank(sha: string): boolean { return this.presets.has(sha); }
  /** 预设下标（这份库里按 bank:program 找；没有 = −1）。 */
  presetIndex(sha: string, bank: number, program: number): number { return this.presets.get(sha)?.get(`${bank}:${program}`) ?? -1; }
  unbank(sha: string): void { this.presets.delete(sha); this.bankBytes.delete(sha); this.post({ type: "unbank", sha }); }
  vowels(t: VowelTableMsg): void { this.vowelTable = t; this.post({ type: "vowels", ...t }); }

  setTimeline(tl: TimelineMsg): void { this.tl = tl; this.post({ type: "timeline", tl }); }
  /** 喂一块：转成 Int16 转移给录音房（只在那边留一份；离线导出再要回来）。worklet 还没装好 = 先排着、装好就发。 */
  chunk(key: string, sr: number, samples: Float32Array | Int16Array): void {
    const i16 = samples instanceof Int16Array ? samples : toInt16(samples);
    this.chunkKeys.add(key);
    if (this.node) this.post({ type: "chunk", key, sr, samples: i16 }, [i16.buffer]);
    else { this.pendingChunks.push({ key, sr, samples: i16 }); void this.ensure().catch(() => undefined); }
  }
  forget(keys: string[]): void { for (const k of keys) { this.chunkKeys.delete(k); this.pendingChunks = this.pendingChunks.filter((c) => c.key !== k); } this.post({ type: "forget", keys }); }
  /** 向录音房要几块（拷贝）：离线导出用。 */
  private fetchChunks(keys: string[]): Promise<{ key: string; sr: number; samples: Int16Array }[]> {
    if (!keys.length || !this.node) return Promise.resolve([]);
    return new Promise((ok) => { this.chunkWait = ok; this.post({ type: "getChunks", keys }); });
  }
  channel(id: string, p: Partial<ChannelParams>): void { this.channels.set(id, { ...this.channels.get(id), ...p }); this.post({ type: "channel", id, p }); }
  master(p: Partial<MasterParams>): void { this.masterP = { ...this.masterP, ...p }; this.post({ type: "master", p }); }
  /** 总线（混响 / 延迟这类「留在屋里的」）：整张表一起给。 */
  buses(b: BusSpec[]): void { this.busesP = b; this.post({ type: "buses", buses: b }); }

  /** 从 at 秒放起（不给 = 从范围头 / 上次位置）。要先在用户手势里解锁过 AudioContext（iPad）。 */
  /** quiet = 起点（从某一段放时 at 比它提前一点）：在它之前就结束的音 / 唱完的块这次不出声（v0.10.3）。 */
  async play(at?: number, quiet?: number): Promise<void> { await this.ensure(); this.gen++; this._playing = true; this._waiting = null; this.hist = []; if (at !== undefined) this._pos = at; this.post({ type: "play", at, gen: this.gen, ...(quiet !== undefined ? { quiet } : {}) }); }
  stop(): void { this.gen++; this._playing = false; this._waiting = null; this.hist = []; this.post({ type: "stop" }); }
  /** 扬声器此刻在放音频时钟的哪一刻（getOutputTimestamp：浏览器按硬件的输出缓冲报的；没有就用 currentTime − 两个延迟估）。 */
  outputTime(): number | null {
    const ctx = this.ctx(), ts = typeof ctx.getOutputTimestamp === "function" ? ctx.getOutputTimestamp() : null;
    const r = outputClock({ currentTime: ctx.currentTime, ts: ts && ts.contextTime !== undefined && ts.performanceTime !== undefined ? { contextTime: ts.contextTime, performanceTime: ts.performanceTime } : null, perfNow: performance.now(), baseLatency: ctx.baseLatency, outputLatency: (ctx as unknown as { outputLatency?: number }).outputLatency });
    this.clockSrc = r?.src ?? null;
    return r?.T ?? null;
  }
  /** 最近一次 outputTime() 按哪一档算的（黑匣子用）。 */
  clockSrc: ClockSource | null = null;
  /** 输出延迟（ms）：录音房算到的 vs 扬声器放到的（诊断 / 设置页看）。 */
  latencyMs(): number | null { const T = this.outputTime(); return T === null ? null : Math.max(0, (this.ctx().currentTime - T) * 1000); }
  /** 现在**听到的**是走带的哪儿（播放头画这里）；没有报告 = null（退回 position）。 */
  audibleSec(): number | null { const T = this.outputTime(); return T === null ? null : audibleAt(this.hist, T); }
  seek(at: number, quiet?: number): void { this._pos = at; this.post({ type: "seek", at, ...(quiet !== undefined ? { quiet } : {}) }); }
  /** 按键试听（要先 ensure 过；没装好的这一下丢掉——试听要即时，迟到的音更烦）。 */
  audition(m: Omit<Extract<StudioIn, { type: "audition" }>, "type">): void { if (this.node) this.post({ type: "audition", ...m }); }
  auditionOn(src: string, inst: AuditionInst, key: number, vel: number, gainDb: number, pan: number): void { this.audition({ src, ev: "on", inst, key, vel, gainDb, pan }); }
  auditionOff(src: string): void { this.audition({ src, ev: "off" }); }
  auditionGlide(src: string, key: number): void { this.audition({ src, ev: "glide", key }); }
  auditionAllOff(): void { this.audition({ src: "", ev: "alloff" }); }
  /** 放一段现成的声音当试听（月读唱的一个字；samples 转移过去）。 */
  auditionClip(src: string, sr: number, samples: Float32Array, gainDb: number, pan: number): void { if (!this.node) return; const copy = samples.slice(); this.post({ type: "auditionClip", src, sr, samples: copy, gainDb, pan }, [copy.buffer]); }
  meter(on: boolean): void { this.post({ type: "meter", on }); }
  get now(): number { return this.ctx().currentTime; }

  /** 离线导出：同一个 Studio 类在主线程循环里跑同样的块网格（每 400 块让一次事件循环，界面不卡）。输出从 range.from 起、扣掉限幅器的延迟。
   *  tl 不给 = 现在的时间线；progress(0…1)。 */
  async renderOffline(tl: TimelineMsg | null = this.tl, o: { sr?: number; progress?: (f: number) => void } = {}): Promise<{ left: Float32Array; right: Float32Array; sr: number; start: number }> {
    if (!tl) throw new Error("studio: no timeline to render");
    const sr = o.sr ?? 44100, tsf = await instantiateTsf(await this.wasmModule());
    let ended = false;
    const s = new Studio(sr, tsf, (m) => { if (m.type === "ended") ended = true; });
    if (this.vowelTable) s.handle({ type: "vowels", ...this.vowelTable });
    for (const [sha, bytes] of this.bankBytes) s.handle({ type: "bank", sha, bytes });
    for (const [id, p] of this.channels) s.handle({ type: "channel", id, p });
    s.handle({ type: "buses", buses: this.busesP });
    s.handle({ type: "master", p: this.masterP });
    s.handle({ type: "timeline", tl: { ...tl, loop: false } });
    const keys = tl.tracks.flatMap((t) => (t.kind === "clips" ? t.clips.map((c) => c.key) : [])).filter((k) => this.chunkKeys.has(k));
    if (keys.length) { await this.ensure(); for (const c of await this.fetchChunks([...new Set(keys)])) s.handle({ type: "chunk", key: c.key, sr: c.sr, samples: c.samples }); }
    const lat = s.latency, total = Math.ceil((tl.range.to - tl.range.from) * sr) + lat + Math.ceil(2.5 * sr);   // + 尾巴上限
    const L = new Float32Array(total), R = new Float32Array(total), bl = new Float32Array(BLOCK), br = new Float32Array(BLOCK);
    s.handle({ type: "play", at: tl.range.from });
    let n = 0, k = 0;
    while (!ended && n < total) {
      const cnt = Math.min(BLOCK, total - n);
      s.render(bl, br, cnt); L.set(bl.subarray(0, cnt), n); R.set(br.subarray(0, cnt), n); n += cnt;
      if (s.waitingFor) throw new Error(`studio: chunk ${s.waitingFor} missing for export`);
      if (++k % 400 === 0) { o.progress?.(Math.min(1, n / total)); await new Promise<void>((r) => setTimeout(r, 0)); }
    }
    o.progress?.(1);
    const len = Math.max(0, n - lat);
    return { left: L.slice(lat, lat + len), right: R.slice(lat, lat + len), sr, start: tl.range.from };
  }
}
