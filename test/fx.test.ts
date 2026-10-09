// 效果原语（src/engine/fx.ts）：守数学，不守听感。EQ 的高低切在频点上真的衰减；压缩器超阈值真的压、侧链听别的信号；延迟在对的采样处回声；混响有尾巴、确定性；不认识的 kind = null。
// created 2026-10-10 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { createFx, buildChain, FX_KINDS, describeFx } from "../src/engine/fx.ts";

const SR = 48000;
const sine = (hz: number, secs: number, amp = 0.5) => Float32Array.from({ length: Math.round(secs * SR) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / SR));
const rms = (a: Float32Array, from = 0, to = a.length) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, to - from)); };
const peak = (a: Float32Array, from = 0, to = a.length) => { let p = 0; for (let i = from; i < to; i++) p = Math.max(p, Math.abs(a[i])); return p; };
const run = (fx: ReturnType<typeof createFx>, x: Float32Array, key: Float32Array | null = null) => { const y = x.slice(); for (let i = 0; i < y.length; i += 128) { const n = Math.min(128, y.length - i); fx!.process(y.subarray(i, i + n), null, n, key ? key.subarray(i, i + n) : null); } return y; };
const dB = (r: number) => 20 * Math.log10(r);

describe("效果原语", () => {
  it("每种都有参数表（量纲 / 范围 / 默认 / 公式）；不认识的 kind = null", () => {
    for (const k of Object.keys(FX_KINDS)) { const d = FX_KINDS[k]; assert(d.params.length > 0 && d.formula.length > 10, k); }
    eq(createFx({ id: "x", kind: "nope", params: {} }, SR), null);
    assert(describeFx({ id: "x", kind: "nope", params: {} }).includes("不认识"));
  });
  it("EQ：低切 1 kHz 把 100 Hz 压掉 ≥ 20 dB、5 kHz 几乎不动；高架 +6 dB 把 10 kHz 抬 ≈6 dB", () => {
    const hp = createFx({ id: "e", kind: "eq", params: { hpHz: 1000 } }, SR)!;
    const lo = run(hp, sine(100, 1)), hi = run(createFx({ id: "e", kind: "eq", params: { hpHz: 1000 } }, SR), sine(5000, 1));
    assert(dB(rms(lo, SR / 2) / rms(sine(100, 1))) < -20, `100 Hz ${dB(rms(lo, SR / 2) / rms(sine(100, 1))).toFixed(1)} dB`);
    assert(Math.abs(dB(rms(hi, SR / 2) / rms(sine(5000, 1)))) < 1, "5 kHz 不动");
    const sh = run(createFx({ id: "e", kind: "eq", params: { highDb: 6, highHz: 3000 } }, SR), sine(10000, 1));
    assert(Math.abs(dB(rms(sh, SR / 2) / rms(sine(10000, 1))) - 6) < 1, `高架 ${dB(rms(sh, SR / 2) / rms(sine(10000, 1))).toFixed(1)} dB`);
  });
  it("压缩器：−6 dBFS 的音过 −20 dB 阈值、比例 4 → 压掉约 10 dB（稳态）；低于阈值不动；侧链 = 听 key 不听自己", () => {
    const c = createFx({ id: "c", kind: "comp", params: { thresholdDb: -20, ratio: 4, attackMs: 1, releaseMs: 50, kneeDb: 0 } }, SR)!;
    const loud = run(c, sine(440, 1));
    const got = dB(peak(loud, SR / 2) / 0.5);
    assert(Math.abs(got - -10.5) < 1.5, `压了 ${got.toFixed(1)} dB（期望 ≈ −10.5：超 14 dB 的 3/4）`);
    const quiet = run(createFx({ id: "c", kind: "comp", params: { thresholdDb: -20, ratio: 4, kneeDb: 0 } }, SR), sine(440, 1, 0.05));
    assert(Math.abs(peak(quiet, SR / 2) - 0.05) < 1e-3, "低于阈值不动");
    const ducked = run(createFx({ id: "c", kind: "comp", params: { thresholdDb: -20, ratio: 4, attackMs: 1, releaseMs: 50, kneeDb: 0 } }, SR), sine(440, 1, 0.05), sine(100, 1, 0.5));
    assert(peak(ducked, SR / 2) < 0.03, `侧链：自己很轻也被别人压下去（${peak(ducked, SR / 2).toFixed(3)}）`);
  });
  it("延迟：375 ms 后出现回声、反馈再 375 ms 更轻；mix 0 = 原样", () => {
    const d = createFx({ id: "d", kind: "delay", params: { timeMs: 375, feedback: 0.5, mix: 0.5, dampHz: 20000 } }, SR)!;
    const x = new Float32Array(SR); x[0] = 1;
    const y = run(d, x), D = Math.round(0.375 * SR);
    assert(Math.abs(y[D] - 0.5) < 0.02 && Math.abs(y[2 * D] - 0.25) < 0.03, `回声 ${y[D].toFixed(3)} / ${y[2 * D].toFixed(3)}`);
    assert(Math.abs(y[0] - 0.5) < 1e-6, "干 ×(1-mix)");
    eq(peak(run(createFx({ id: "d", kind: "delay", params: { timeMs: 375, mix: 0 } }, SR), x)), 1);
  });
  it("混响：脉冲之后有尾巴（0.5 s 处还有声、1.5 s 后衰减）；同样输入逐样本相同", () => {
    const mk = () => createFx({ id: "r", kind: "reverb", params: { room: 0.6, damp: 0.3, mix: 1, preDelayMs: 0 } }, SR)!;
    const x = new Float32Array(2 * SR); x[100] = 1;
    const L = x.slice(), R = x.slice(); const r = mk(); for (let i = 0; i < L.length; i += 128) r.process(L.subarray(i, i + 128), R.subarray(i, i + 128), 128, null);
    assert(peak(L, SR * 0.4, SR * 0.6) > 1e-4, "0.5 s 还有尾巴"); assert(peak(L, SR * 1.8, SR * 2) < peak(L, SR * 0.4, SR * 0.6), "后面更轻");
    const L2 = x.slice(), R2 = x.slice(); const r2 = mk(); for (let i = 0; i < L2.length; i += 128) r2.process(L2.subarray(i, i + 128), R2.subarray(i, i + 128), 128, null);
    assert(L.every((v, i) => v === L2[i]), "确定性");
  });
  it("合唱：单声道进去左右不一样（铺开了）、和干声不同、mix 0 = 原样、确定性", () => {
    const mk = () => createFx({ id: "ch", kind: "chorus", params: { voices: 3, mix: 0.5, spread: 0.8 } }, SR)!;
    const x = sine(440, 0.5), L = x.slice(), R = x.slice(), c = mk();
    for (let i = 0; i < L.length; i += 128) c.process(L.subarray(i, i + 128), R.subarray(i, i + 128), 128, null);
    let diffLR = 0, diffX = 0; for (let i = SR / 4; i < L.length; i++) { diffLR = Math.max(diffLR, Math.abs(L[i] - R[i])); diffX = Math.max(diffX, Math.abs(L[i] - x[i])); }
    assert(diffLR > 0.01, `左右不一样（${diffLR.toFixed(3)}）`); assert(diffX > 0.01, "和干声不同");
    const L2 = x.slice(), R2 = x.slice(), c2 = mk(); for (let i = 0; i < L2.length; i += 128) c2.process(L2.subarray(i, i + 128), R2.subarray(i, i + 128), 128, null);
    assert(L.every((v, i) => v === L2[i]), "确定性");
    const dry = run(createFx({ id: "ch", kind: "chorus", params: { mix: 0 } }, SR), x); assert(Math.abs(peak(dry) - 0.5) < 1e-6, "mix 0 = 原样");
  });
  it("buildChain：同 id 同 kind 的实例留着（状态不丢）、只换参数；不认识的跳过；on: false 旁通", () => {
    const a = buildChain([{ id: "1", kind: "gain", params: { dB: -6 } }, { id: "2", kind: "nope", params: {} }], [], SR);
    eq(a.length, 1);
    const b = buildChain([{ id: "1", kind: "gain", params: { dB: 0 }, on: false }], a, SR);
    assert(b[0] === a[0] && b[0].on === false);
    const y = run(b[0], sine(440, 0.1)); assert(Math.abs(peak(y) - 0.5) < 1e-6, "旁通 = 原样");
  });
});
