// client.ts —— 主线程这边：把乐谱发给月读的 worker、拿回歌声。created 2026-10-06 by Claude Opus 5.5
// worker 第一次用到才创建（家规：重资源要等用户有意图才加载）。
// 2026-10-09（Claude Fable 5.1，实时试听刀 1 / 刀 2）：播放和 SoundFont 的离线渲染都搬去了录音房（src/engine/）——这里只剩「唱」；
//   唱的请求在这边排队、一次只给 worker 一个（借朗读库 cancelPending 的做法：排多了用户一跳就全作废），cancelPending() 扔掉还没开始算的。
import type { LabScore } from "../score/lab-score.ts";
import type { SingReply, SingRequest } from "./worker.ts";
import { audioCtx } from "./audio.ts";
import { diagNote } from "../app/report-error.ts";

/** 内存不够的样子（onnxruntime-web 起不来时报「no available backend found. ERR: [wasm] RangeError: Out of memory」）。 */
const OOM = /out of memory|no available backend/i;

export interface SingResult { samples: Float32Array; sr: number; ms: { load: number; sing: number } }
type Extra = Partial<Pick<SingRequest, "opt" | "atlas" | "breath" | "models" | "raw" | "cacheBytes">>;
interface Job { s: LabScore; progress: (stage: string) => void; extra: Extra; ok: (r: SingResult) => void; fail: (e: Error) => void }

export class Singer {
  private w: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { ok: (r: SingResult) => void; fail: (e: Error) => void; progress: (s: string) => void }>();
  private queue: Job[] = [];
  private inflight = false;

  private worker(): Worker {
    if (this.w) return this.w;
    this.w = new Worker(new URL(`./${__SINGER_WORKER__}`, import.meta.url), { type: "module" });
    this.w.onmessage = (ev: MessageEvent<SingReply>) => {
      const m = ev.data, p = this.pending.get(m.id); if (!p) return;
      if (m.type === "progress") p.progress(m.stage);
      else if (m.type === "done") { this.pending.delete(m.id); p.ok({ samples: m.samples, sr: m.sr, ms: m.ms }); }
      else { this.pending.delete(m.id); p.fail(new Error(m.message)); }
    };
    this.w.onerror = (e) => {   // 坏了就丢掉，下次点播放重建（不然下一次永远等不到回复）
      this.w?.terminate(); this.w = null;
      for (const p of this.pending.values()) p.fail(new Error(e.message || "月读的 worker 出错")); this.pending.clear();
    };
    return this.w;
  }

  /** 重开 worker：wasm 的内存只涨不落，只有整个 worker 关掉才真还回去。 */
  restart(): void {
    this.w?.terminate(); this.w = null;
    for (const p of this.pending.values()) p.fail(new Error("月读的 worker 重开了")); this.pending.clear();
  }
  /** 还没开始算的全扔掉（以 "cancelled" 拒绝）；正在算的那一句算完照常回来。返回扔了几个。 */
  cancelPending(): number {
    const n = this.queue.length;
    for (const j of this.queue.splice(0)) j.fail(new Error("cancelled"));
    return n;
  }
  get busy(): boolean { return this.inflight || this.queue.length > 0; }
  get queued(): number { return this.queue.length; }

  /** 唱（排队；一次只给 worker 一个）。内存不够（换着试很多音色之后 wasm 堆撑大了，月读的引擎起不来——user 2026-10-08 iPad「Out of memory」「感觉是没有gc」）
   *  = 重开 worker（全部还回去）再试一次；还不行才报错。同一位演奏者重来，不是换人（不自动替补）。 */
  sing(s: LabScore, progress: (stage: string) => void = () => {}, extra: Extra = {}): Promise<SingResult> {
    return new Promise<SingResult>((ok, fail) => { this.queue.push({ s, progress, extra, ok, fail }); void this.pump(); });
  }
  private async pump(): Promise<void> {
    if (this.inflight) return;
    this.inflight = true;
    try {
      for (;;) {
        const j = this.queue.shift(); if (!j) break;
        try { j.ok(await this.singRetry(j.s, j.progress, j.extra)); } catch (e) { j.fail(e as Error); }
      }
    } finally { this.inflight = false; }
  }
  private async singRetry(s: LabScore, progress: (stage: string) => void, extra: Extra): Promise<SingResult> {
    try { return await this.singOnce(s, progress, extra); }
    catch (e) {
      const msg = (e as Error).message ?? "";
      if (!OOM.test(msg)) throw e;
      diagNote("singer", `out of memory, restarting worker and retrying once: ${msg}`);
      this.restart(); progress("内存不够：重开月读的引擎再试一次");
      try { return await this.singOnce(s, progress, extra); }
      catch (e2) {
        const m2 = (e2 as Error).message ?? "";
        diagNote("singer", `retry after restart failed: ${m2}`);
        if (OOM.test(m2)) throw new Error("这台设备的内存不够，月读的引擎起不来（已经重开过一次引擎）。可以把别的乐器声部静音再放，或者关掉 app 重新打开；也可以给这个声部换「月读（元音）」");
        throw e2;
      }
    }
  }
  private singOnce(s: LabScore, progress: (stage: string) => void, extra: Extra): Promise<SingResult> {
    const id = ++this.seq;
    const req: SingRequest = { type: "sing", id, score: s.SCORE, text: s.TEXT, tempo: s.TEMPO_QUARTER, lang: s.LANG, ...extra };
    return new Promise((ok, fail) => { this.pending.set(id, { ok, fail, progress }); this.worker().postMessage(req); });
  }
  /** 全 app 共用的 AudioContext（必须在用户手势里先调过一次，iPad 才放声）。 */
  unlock(): AudioContext { return audioCtx(); }
}
