// 混音母线（纯函数）。created 2026-10-08 by Claude Opus 5.5
// 守的是数学，不是听感：① 没超天花板 = 逐样本不动；② 绝不超天花板；③ 一处响的乐器不会把别处（只有月读的段落）一起压小（旧做法的病）；
// ④ 相加和旧 main.ts renderMix 逐样本相同（增益 / 等功率声像 / 线性重采样 / leadIn 对齐）。
import { describe, it, eq, assert } from "./runner.mjs";
import { sumTracks, limitBus, mixTracks, CEILING, type MixTrack } from "../src/audio/mix.ts";

const SR = 44100;
const sine = (secs: number, amp: number, hz = 440, sr = SR) => Float32Array.from({ length: Math.round(secs * sr) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / sr));
const peakOf = (a: Float32Array, from = 0, to = a.length) => { let p = 0; for (let i = from; i < to; i++) p = Math.max(p, Math.abs(a[i])); return p; };

/** 旧 main.ts renderMix 的相加段（v0.6.7 原样抄来，只去掉峰值缩放）——对照用。 */
function oldSum(tracks: MixTrack[], sr: number, pad = 0.3) {
  const start = Math.min(0, ...tracks.map((x) => x.at)), end = Math.max(...tracks.map((x) => x.at + x.samples.length / x.sr)) + pad;
  const n = Math.ceil((end - start) * sr), left = new Float32Array(n), right = new Float32Array(n);
  for (const r of tracks) {
    const g = 10 ** (r.gainDb / 20), gl = g * Math.cos(((r.pan + 1) * Math.PI) / 4), gr = g * Math.sin(((r.pan + 1) * Math.PI) / 4);
    const off = Math.round((r.at - start) * sr), ratio = r.sr / sr, len = Math.floor(r.samples.length / ratio);
    for (let i = 0; i < len; i++) { const p = i * ratio, k = Math.floor(p), f = p - k, v = r.samples[k] * (1 - f) + (r.samples[k + 1] ?? 0) * f; left[off + i] += v * gl; right[off + i] += v * gr; }
  }
  return { left, right };
}

describe("混音母线（src/audio/mix.ts）", () => {
  it("相加和旧 renderMix 逐样本相同（月读 24 kHz leadIn −0.5 s + 钢琴 44.1 kHz −6 dB 偏右）", () => {
    const tracks: MixTrack[] = [
      { samples: sine(1.2, 0.3, 220, 24000), sr: 24000, at: -0.5, gainDb: 0, pan: 0 },
      { samples: sine(0.8, 0.4, 330), sr: SR, at: 0.2, gainDb: -6, pan: 0.4 },
    ];
    const a = sumTracks(tracks, SR), b = oldSum(tracks, SR);
    eq(a.left.length, b.left.length); eq(a.start, -0.5);
    for (let i = 0; i < a.left.length; i++) if (a.left[i] !== b.left[i] || a.right[i] !== b.right[i]) throw new Error(`第 ${i} 个采样不同`);
  });
  it("没超天花板 = 逐样本不动、报 0 dB", () => {
    const m = sumTracks([{ samples: sine(0.5, 0.5), sr: SR, at: 0, gainDb: 0, pan: 0 }], SR);
    const l = m.left.slice(), r = m.right.slice();
    eq(limitBus(m.left, m.right, SR), 0);
    for (let i = 0; i < l.length; i++) if (l[i] !== m.left[i] || r[i] !== m.right[i]) throw new Error(`第 ${i} 个采样被动了`);
  });
  it("超了：处处 ≤ 天花板", () => {
    const m = mixTracks([{ samples: sine(0.5, 1.6), sr: SR, at: 0, gainDb: 0, pan: 0 }, { samples: sine(0.5, 1.2, 550), sr: SR, at: 0.1, gainDb: 0, pan: -0.5 }], SR);
    assert(m.limitedDb < 0, "应该压过");
    const c32 = Math.fround(CEILING);   // 采样是 float32：0.98 存进去就是 0.98000001…
    assert(peakOf(m.left) <= c32 && peakOf(m.right) <= c32, `峰值 ${peakOf(m.left)} / ${peakOf(m.right)} 超了天花板`);
  });
  it("乐器后面才进来、很响：前面只有月读的那段逐样本不变（旧做法会整条一起缩）", () => {
    const voice: MixTrack = { samples: sine(4, 0.6, 220), sr: SR, at: 0, gainDb: 0, pan: 0 };
    const loud: MixTrack = { samples: sine(1, 1.5, 330), sr: SR, at: 3, gainDb: 0, pan: 0 };   // 第 3 秒进来，和月读加起来远超 0 dB
    const alone = mixTracks([voice], SR), both = mixTracks([voice, loud], SR);
    const upto = Math.round(2.9 * SR);   // 乐器进来前 0.1 s（远大于 attack 3 ms）
    for (let i = 0; i < upto; i++) if (alone.left[i] !== both.left[i]) throw new Error(`第 ${(i / SR).toFixed(3)} 秒月读变了：${alone.left[i]} → ${both.left[i]}`);
    // 对照：旧做法（整条按峰值缩）这里会变轻
    const old = oldSum([voice, loud], SR); let pk = 0; for (let i = 0; i < old.left.length; i++) pk = Math.max(pk, Math.abs(old.left[i]), Math.abs(old.right[i]));
    assert(pk > 0.98 && Math.abs(old.left[1000] * (0.98 / pk)) < Math.abs(alone.left[1000]), "旧做法确实会把前面一起压小（测试本身的前提）");
  });
  it("压过之后会回来：峰过去 1 s 增益回到 1 附近（release 0.15 s）", () => {
    const n = SR * 3, left = new Float32Array(n), right = new Float32Array(n);
    for (let i = 0; i < n; i++) { const v = 0.5 * Math.sin((2 * Math.PI * 200 * i) / SR); left[i] = v; right[i] = v; }
    for (let i = SR; i < SR + 441; i++) { left[i] *= 4; right[i] *= 4; }   // 第 1 秒处 10 ms 的尖
    const ref = left.slice(); limitBus(left, right, SR);
    const k = Math.round(2.2 * SR); let worst = 0;
    for (let i = k; i < k + 2000; i++) if (Math.abs(ref[i]) > 0.1) worst = Math.max(worst, 1 - left[i] / ref[i]);
    assert(worst < 1e-3, `1.2 s 之后还压着 ${(worst * 100).toFixed(2)}%`);
    // 尖之前 0.1 s 不受影响（attack 只提前几毫秒）
    for (let i = SR - 4410; i < SR - 4410 + 500; i++) if (left[i] !== ref[i]) throw new Error("尖之前 0.1 s 就被压了");
  });
  it("左右同一条增益（声像不歪）", () => {
    const m = mixTracks([{ samples: sine(0.3, 1.8), sr: SR, at: 0, gainDb: 0, pan: 0.6 }], SR);
    const raw = sumTracks([{ samples: sine(0.3, 1.8), sr: SR, at: 0, gainDb: 0, pan: 0.6 }], SR);
    for (let i = 0; i < m.left.length; i += 37) if (Math.abs(raw.left[i]) > 0.05 && Math.abs(m.left[i] / raw.left[i] - m.right[i] / raw.right[i]) > 1e-5) throw new Error(`第 ${i} 个采样左右增益不同`);
  });
});
