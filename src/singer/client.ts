// client.ts —— 主线程这边：把乐谱发给月读的 worker、拿回歌声、用 WebAudio 播。created 2026-10-06 by Claude Opus 5.5
// worker 第一次用到才创建（家规：重资源要等用户有意图才加载）。
import type { LabScore } from "../score/lab-score.ts";
import type { SingReply, SingRequest, GmRequest } from "./worker.ts";
import { audioCtx } from "./audio.ts";

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

  sing(s: LabScore, progress: (stage: string) => void = () => {}, extra: Partial<Pick<SingRequest, "opt" | "atlas" | "breath" | "models">> = {}): Promise<SingResult> {
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
  /** 播放（必须在用户手势里先调过 unlock()，iPad 才放声）。播完回调 onEnd。 */
  play(r: { samples: Float32Array; sr: number; right?: Float32Array }, onEnd: () => void): void {
    this.stop();
    const ctx = this.unlock();
    const buf = ctx.createBuffer(r.right ? 2 : 1, r.samples.length, r.sr);   // 混音给左右两路（多声部的声像）；单路照旧
    buf.copyToChannel(r.samples as Float32Array<ArrayBuffer>, 0);
    if (r.right) buf.copyToChannel(r.right as Float32Array<ArrayBuffer>, 1);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
    src.onended = () => { if (this.src === src) { this.src = null; onEnd(); } };
    src.start(); this.src = src;
  }
  stop(): void { const s = this.src; this.src = null; if (s) { s.onended = null; try { s.stop(); } catch { /* 已停 */ } } }
  get playing(): boolean { return this.src !== null; }
  unlock(): AudioContext { return audioCtx(); }   // 全 app 共用一个（audio.ts）
}
