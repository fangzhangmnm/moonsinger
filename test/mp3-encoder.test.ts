// mp3-encoder.test.ts —— 真 LAME（vendor/lame/lame.wasm + src/export/lame.ts）：帧头 mode / 码率 / 采样率、确定性、CBR 大小、单声道。created 2026-10-17 by Claude Fable 5.1
//   起因 user 2026-10-17「定稿的mp3听起来差很多…有破音」→「lamejs一口气修」：lamejs 写死左右各编各的 + 关比特池（比特池那段移植是坏的），换成自己编的 libmp3lame 3.100。
//   守的是「别退回去」：立体声 = 联合立体声帧、码率真生效、同样的输入同样的字节（渲染 = 纯函数的最后一环）。
import { describe, it, eq, assert } from "./runner.mjs";
import createLame from "../vendor/lame/lame.mjs";
import { encodeAll, createMp3Encoder, type LameModule } from "../src/export/lame.ts";

const M: LameModule = await (createLame as () => Promise<LameModule>)();

/** 两秒的立体声：左 440 Hz、右 660 Hz，中间叠一个共用的 220 Hz（有「中间」的成分，joint 才有东西可省）。 */
function signal(n = 44100 * 2): { l: Float32Array; r: Float32Array } {
  const l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / 44100, c = 0.3 * Math.sin(2 * Math.PI * 220 * t); l[i] = 0.4 * Math.sin(2 * Math.PI * 440 * t) + c; r[i] = 0.4 * Math.sin(2 * Math.PI * 660 * t) + c; }
  return { l, r };
}
/** 第一个帧头：MPEG-1 Layer III 的 mode 位（00 stereo / 01 joint / 10 dual / 11 mono）、码率、采样率。 */
function header(b: Uint8Array): { at: number; mode: "stereo" | "joint" | "dual" | "mono"; kbps: number; sr: number } {
  let i = 0; while (i < b.length - 4 && !(b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0)) i++;
  const BR = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], SR = [44100, 48000, 32000];
  return { at: i, mode: (["stereo", "joint", "dual", "mono"] as const)[(b[i + 3] >> 6) & 3], kbps: BR[(b[i + 2] >> 4) & 15], sr: SR[(b[i + 2] >> 2) & 3] };
}
const same = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

describe("mp3 编码器（真 LAME，vendor/lame）", () => {
  const { l, r } = signal();
  it("立体声默认 = 联合立体声帧；文件头就是第一帧（不写 Xing / Info）；码率 / 采样率写对", () => {
    const h = header(encodeAll(M, { channels: 2, sr: 44100, kbps: 192 }, l, r));
    eq(h.at, 0); eq(h.mode, "joint"); eq(h.kbps, 192); eq(h.sr, 44100);
  });
  it("joint: false = 左右各编各的；单声道 = mono（给了 joint 也不管）", () => {
    eq(header(encodeAll(M, { channels: 2, sr: 44100, kbps: 128, joint: false }, l, r)).mode, "stereo");
    eq(header(encodeAll(M, { channels: 1, sr: 44100, kbps: 64 }, l)).mode, "mono");
  });
  it("确定性：同样的输入同样的字节（渲染 = 纯函数的最后一环）", () => {
    assert(same(encodeAll(M, { channels: 2, sr: 44100, kbps: 192 }, l, r), encodeAll(M, { channels: 2, sr: 44100, kbps: 192 }, l, r)));
  });
  it("CBR：192k 两秒 ≈ 48 KB、64k 单声道 ≈ 16 KB（码率真生效）", () => {
    const a = encodeAll(M, { channels: 2, sr: 44100, kbps: 192 }, l, r).length, b = encodeAll(M, { channels: 1, sr: 44100, kbps: 64 }, l).length;
    assert(a > 44_000 && a < 52_000, `192k: ${a}`); assert(b > 14_000 && b < 18_000, `64k mono: ${b}`);
  });
  it("分块喂和一口气喂字节相同；编码器延迟 = 576；关了再用报错", () => {
    const enc = createMp3Encoder(M, { channels: 2, sr: 44100, kbps: 192 });
    const parts = [enc.encode(l.subarray(0, 10000), r.subarray(0, 10000)), enc.encode(l.subarray(10000), r.subarray(10000)), enc.flush()];
    eq(enc.delay, 576); enc.close();
    const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { joined.set(p, o); o += p.length; }
    assert(same(joined, encodeAll(M, { channels: 2, sr: 44100, kbps: 192 }, l, r)));
    let threw = false; try { enc.flush(); } catch { threw = true; } assert(threw);
  });
  it("立体声左右不等长 = 报错，不静默编坏", () => {
    let threw = false; try { encodeAll(M, { channels: 2, sr: 44100, kbps: 128 }, l, r.subarray(0, 100)); } catch { threw = true; } assert(threw);
  });
});
