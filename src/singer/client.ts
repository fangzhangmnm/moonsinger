// client.ts —— 主线程这边：把乐谱发给月读的 worker、拿回歌声、用 WebAudio 播。created 2026-10-06 by Claude Opus 5.5
// worker 第一次用到才创建（家规：重资源要等用户有意图才加载）。
import type { LabScore } from "../score/lab-score.ts";
import type { SingReply, SingRequest } from "./worker.ts";
import { audioCtx } from "./audio.ts";

export interface SingResult { samples: Float32Array; sr: number; ms: { load: number; sing: number } }

export class Singer {
  private w: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { ok: (r: SingResult) => void; fail: (e: Error) => void; progress: (s: string) => void }>();
  private src: AudioBufferSourceNode | null = null;

  private worker(): Worker {
    if (this.w) return this.w;
    this.w = new Worker(new URL("./singer-worker.mjs", import.meta.url), { type: "module" });
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

  sing(s: LabScore, progress: (stage: string) => void = () => {}, extra: Partial<Pick<SingRequest, "opt" | "atlas" | "breath">> = {}): Promise<SingResult> {
    const id = ++this.seq;
    const req: SingRequest = { type: "sing", id, score: s.SCORE, text: s.TEXT, tempo: s.TEMPO_QUARTER, lang: s.LANG, ...extra };
    return new Promise((ok, fail) => { this.pending.set(id, { ok, fail, progress }); this.worker().postMessage(req); });
  }

  /** 播放（必须在用户手势里先调过 unlock()，iPad 才放声）。播完回调 onEnd。 */
  play(r: SingResult, onEnd: () => void): void {
    this.stop();
    const ctx = this.unlock();
    const buf = ctx.createBuffer(1, r.samples.length, r.sr);
    buf.copyToChannel(r.samples as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
    src.onended = () => { if (this.src === src) { this.src = null; onEnd(); } };
    src.start(); this.src = src;
  }
  stop(): void { const s = this.src; this.src = null; if (s) { s.onended = null; try { s.stop(); } catch { /* 已停 */ } } }
  get playing(): boolean { return this.src !== null; }
  unlock(): AudioContext { return audioCtx(); }   // 全 app 共用一个（audio.ts）
}
