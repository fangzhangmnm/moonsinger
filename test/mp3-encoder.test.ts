// mp3-encoder.test.ts —— vendored lamejs 的本地补丁（vendor/lamejs/README.md）：立体声 = 联合立体声（joint），单声道照旧；帧头的 mode 位守着别退回去。created 2026-10-17 by Claude Fable 5.1
//   起因 user 2026-10-17「定稿的mp3听起来差很多…有破音」：上游 Mp3Encoder 写死左右各编各的（128k = 每边 64k），同一份团子对源的 SNR 16.8 → 23.7 dB（ai-docs/20261017-final-mp3-quality.md）。
import { describe, it, eq, assert } from "./runner.mjs";
import { Mp3Encoder } from "../vendor/lamejs/lamejs.js";

/** 两秒的立体声：左 440 Hz、右 660 Hz，中间叠一个共用的 220 Hz（有「中间」的成分，joint 才有东西可省）。 */
function signal(n = 44100 * 2): { l: Int16Array; r: Int16Array } {
  const l = new Int16Array(n), r = new Int16Array(n);
  for (let i = 0; i < n; i++) { const t = i / 44100, c = 0.3 * Math.sin(2 * Math.PI * 220 * t); l[i] = Math.round(32767 * (0.4 * Math.sin(2 * Math.PI * 440 * t) + c)); r[i] = Math.round(32767 * (0.4 * Math.sin(2 * Math.PI * 660 * t) + c)); }
  return { l, r };
}
function encode(channels: 1 | 2, kbps: number, opts?: { joint?: boolean; reservoir?: boolean; quality?: number }): Uint8Array {
  const { l, r } = signal(), enc = new Mp3Encoder(channels, 44100, kbps, opts), parts: Uint8Array[] = [];
  const B = 1152 * 8;
  for (let i = 0; i < l.length; i += B) { const o = channels === 2 ? enc.encodeBuffer(l.subarray(i, i + B), r.subarray(i, i + B)) : enc.encodeBuffer(l.subarray(i, i + B)); if (o.length) parts.push(new Uint8Array(o.buffer, o.byteOffset, o.length)); }
  const f = enc.flush(); if (f.length) parts.push(new Uint8Array(f.buffer, f.byteOffset, f.length));
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
/** 第一个帧头：MPEG-1 Layer III 的 mode 位（00 stereo / 01 joint / 10 dual / 11 mono）和码率。 */
function header(b: Uint8Array): { mode: "stereo" | "joint" | "dual" | "mono"; kbps: number; sr: number } {
  let i = 0; while (i < b.length - 4 && !(b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0)) i++;
  const BR = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], SR = [44100, 48000, 32000];
  return { mode: (["stereo", "joint", "dual", "mono"] as const)[(b[i + 3] >> 6) & 3], kbps: BR[(b[i + 2] >> 4) & 15], sr: SR[(b[i + 2] >> 2) & 3] };
}

describe("mp3 编码器（vendored lamejs + 本地补丁）", () => {
  it("立体声 + { joint: true }（worker 传的）= 联合立体声帧；码率 / 采样率写对", () => {
    const h = header(encode(2, 128, { joint: true }));
    eq(h.mode, "joint"); eq(h.kbps, 128); eq(h.sr, 44100);
  });
  it("不给 opts = 上游行为（左右各编各的）；单声道给了 joint 也是 mono", () => {
    eq(header(encode(2, 128)).mode, "stereo");
    eq(header(encode(1, 64, { joint: true })).mode, "mono");
  });
  it("128k 两秒 ≈ 32 KB（CBR：码率真生效）", () => {
    const n = encode(2, 128, { joint: true }).length;
    assert(n > 28_000 && n < 36_000, `size ${n}`);
  });
});
