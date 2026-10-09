// client.ts —— 主线程这边：把乐谱发给月读的 worker、拿回歌声、用 WebAudio 播。created 2026-10-06 by Claude Opus 5.5
// worker 第一次用到才创建（家规：重资源要等用户有意图才加载）。
import type { LabScore } from "../score/lab-score.ts";
import type { SingReply, SingRequest, GmRequest } from "./worker.ts";
import { audioCtx } from "./audio.ts";
import { diagNote } from "../app/report-error.ts";

/** 内存不够的样子（onnxruntime-web 起不来时报「no available backend found. ERR: [wasm] RangeError: Out of memory」）。 */
const OOM = /out of memory|no available backend/i;

export interface SingResult { samples: Float32Array; sr: number; ms: { load: number; sing: number } }

export class Singer {
  private w: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { ok: (r: SingResult) => void; fail: (e: Error) => void; progress: (s: string) => void }>();
  private src: AudioBufferSourceNode | null = null;
  private sent = new Set<string>();   // worker 里已经载过的音色库（sha256）；worker 重建就清

  private worker(): Worker {
    if (this.w) return this.w;
    this.w = new Worker(new URL(`./${__SINGER_WORKER__}`, import.meta.url), { type: "module" });
    this.sent.clear();
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
    this.w?.terminate(); this.w = null; this.sent.clear();
    for (const p of this.pending.values()) p.fail(new Error("月读的 worker 重开了")); this.pending.clear();
  }
  /** 唱。内存不够（换着试很多音色之后，SoundFont 的库把 worker 的 wasm 堆撑大了，月读的引擎起不来——user 2026-10-08 iPad「Out of memory」
   *  「感觉是没有gc」）= 重开 worker（全部还回去）再试一次；还不行才报错。同一位演奏者重来，不是换人（不自动替补）。 */
  async sing(s: LabScore, progress: (stage: string) => void = () => {}, extra: Partial<Pick<SingRequest, "opt" | "atlas" | "breath" | "models" | "raw">> = {}): Promise<SingResult> {
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
  private singOnce(s: LabScore, progress: (stage: string) => void, extra: Partial<Pick<SingRequest, "opt" | "atlas" | "breath" | "models" | "raw">>): Promise<SingResult> {
    const id = ++this.seq;
    const req: SingRequest = { type: "sing", id, score: s.SCORE, text: s.TEXT, tempo: s.TEMPO_QUARTER, lang: s.LANG, ...extra };
    return new Promise((ok, fail) => { this.pending.set(id, { ok, fail, progress }); this.worker().postMessage(req); });
  }

  /** GM 候选按谱出声（契约 §10）：字节只第一次发，之后只发哈希；worker 说没载过就带字节再发一次。 */
  async gm(sf2: Uint8Array, sha256: string, notes: GmRequest["notes"], sampleRate = 44100, tail = 2): Promise<SingResult> {
    const ask = (bytes: boolean) => {
      const id = ++this.seq, w = this.worker();
      const req: GmRequest = { type: "gm", id, sha256, sampleRate, tail, notes, ...(bytes ? { sf2: sf2.slice() } : {}) };
      return new Promise<SingResult>((ok, fail) => { this.pending.set(id, { ok, fail, progress: () => {} }); w.postMessage(req); });
    };
    try { const r = await ask(!this.sent.has(sha256)); this.sent.add(sha256); return r; }
    catch (e) { if (!/bank not loaded/.test((e as Error).message)) throw e; this.sent.delete(sha256); const r = await ask(true); this.sent.add(sha256); return r; }
  }
  /** 播放（必须在用户手势里先调过 unlock()，iPad 才放声）。播完回调 onEnd。
   *  o.loop = 循环区间（这条声音里的秒；放到 end 跳回 start，一直放到 stop()）；o.offset = 从第几秒放起；o.stopAfter = 放几秒就停（接缝试听）。 */
  play(r: { samples: Float32Array; sr: number; right?: Float32Array }, onEnd: () => void, o: { loop?: { start: number; end: number }; offset?: number; stopAfter?: number } = {}): void {
    this.stop();
    const ctx = this.unlock();
    const buf = ctx.createBuffer(r.right ? 2 : 1, r.samples.length, r.sr);   // 混音给左右两路（多声部的声像）；单路照旧
    buf.copyToChannel(r.samples as Float32Array<ArrayBuffer>, 0);
    if (r.right) buf.copyToChannel(r.right as Float32Array<ArrayBuffer>, 1);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
    src.onended = () => { if (this.src === src) { this.src = null; onEnd(); } };
    if (o.loop) { src.loop = true; src.loopStart = o.loop.start; src.loopEnd = o.loop.end; }
    src.start(0, o.offset ?? 0); this.src = src;
    if (o.stopAfter) src.stop(ctx.currentTime + o.stopAfter);
  }
  stop(): void { const s = this.src; this.src = null; if (s) { s.onended = null; try { s.stop(); } catch { /* 已停 */ } } }
  get playing(): boolean { return this.src !== null; }
  unlock(): AudioContext { return audioCtx(); }   // 全 app 共用一个（audio.ts）
}
