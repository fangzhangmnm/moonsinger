// mp3-worker.ts —— 在 worker 里把样本编成 mp3（不卡界面）。created 2026-10-07 by Claude Opus 5.5；立体声 2026-10-08 by Claude Opus 5.5（导出面板「标准」档）
// 编码器 = vendored lamejs（LGPL-3.0，见 vendor/lamejs/README.md）；只打进这个 worker 文件，点导出才加载。
import { Mp3Encoder } from "../../vendor/lamejs/lamejs.js";

/** right 给了 = 立体声（left / right 等长）；没给 = 单声道（left）。 */
export interface Mp3Request { left: Float32Array; right?: Float32Array; sr: number; kbps: number }
export type Mp3Reply = { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false; message: string };

const toPcm = (src: Float32Array, i: number, n: number, pcm: Int16Array) => {
  for (let k = 0; k < n; k++) { const x = Math.max(-1, Math.min(1, src[i + k])); pcm[k] = Math.round(x < 0 ? x * 32768 : x * 32767); }
  return n === pcm.length ? pcm : pcm.subarray(0, n);
};
self.onmessage = (ev: MessageEvent<Mp3Request>) => {
  try {
    const { left, right, sr, kbps } = ev.data, stereo = !!right, enc = new Mp3Encoder(stereo ? 2 : 1, sr, kbps), parts: Uint8Array[] = [];
    const BLOCK = 1152 * 16, pl = new Int16Array(BLOCK), pr = new Int16Array(BLOCK);
    for (let i = 0; i < left.length; i += BLOCK) {
      const n = Math.min(BLOCK, left.length - i);
      const out = stereo ? enc.encodeBuffer(toPcm(left, i, n, pl), toPcm(right!, i, n, pr)) : enc.encodeBuffer(toPcm(left, i, n, pl));
      if (out.length) parts.push(out.slice());
    }
    const tail = enc.flush(); if (tail.length) parts.push(tail.slice());
    const bytes = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0; for (const p of parts) { bytes.set(p, o); o += p.length; }
    (self as unknown as Worker).postMessage({ ok: true, bytes } satisfies Mp3Reply, [bytes.buffer]);
  } catch (e) {
    (self as unknown as Worker).postMessage({ ok: false, message: (e as Error).message } satisfies Mp3Reply);
  }
};
