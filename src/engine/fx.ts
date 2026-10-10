// fx.ts —— 录音房的效果原语（纯 JS，零分配、确定性；音频线程和离线导出共用）：EQ（双二阶）、压缩器（可侧链）、延迟、算法混响、增益。
// created 2026-10-10 by Claude Fable 5.1（实时试听刀 4；user「空间效果器这些具体的content应该opus做就可以了吧，除非有性能敏感的复杂优化算法…侧链之类的我也不懂但算法层面应该考虑到」
//   「那几个基础的东西都做一下，性能代价几乎是零」）。内容（预设、什么风用什么、界面）归 Opus / user；这里只有数学。
// 规矩：
//   · 每种效果一张参数表（id / 量纲 / 范围 / 默认 / 公式）——vault 自描述，anti-abandonware（user「必须存latex公式…或者github链接，在歌里面」）。
//   · 参数只在 setParams 时算系数；process 里只乘加。全部零延迟（限幅器那种要前瞻的不放这里）。
//   · 不认识的 kind = 不出声、原样带着（画灰归界面）。
import type { FxV2 } from "../format/contract.ts";

export interface ParamDef { id: string; unit: "dB" | "Hz" | "ms" | "ratio" | "0..1" | "bool"; min: number; max: number; default: number; label: string }
export interface FxKindDef { kind: string; name: string; params: ParamDef[]; /** 算法一句话 + 公式（伪码 / latex），进 vault README */ formula: string; stereoOnly?: boolean }
/** 一个效果实例：process 就地改 L（和 R；单声道链 R = null）；key = 侧链信号（压缩器才看）。 */
export interface FxInstance { readonly kind: string; readonly id: string; on: boolean; setParams(p: Record<string, number>): void; process(L: Float32Array, R: Float32Array | null, n: number, key: Float32Array | null): void }

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const dbToLin = (dB: number) => 10 ** (dB / 20);

// ── 双二阶（RBJ Audio EQ Cookbook）────────────────────────────────────────────────────────────────────────────────
class Biquad {
  b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0;
  z1 = 0; z2 = 0;   // 直接 II 型转置
  set(type: "lp" | "hp" | "lowshelf" | "highshelf" | "peak", f: number, Q: number, gainDb: number, sr: number): void {
    f = clamp(f, 10, sr * 0.45); Q = clamp(Q, 0.1, 20);
    const w = (2 * Math.PI * f) / sr, cs = Math.cos(w), sn = Math.sin(w), A = 10 ** (gainDb / 40), alpha = sn / (2 * Q);
    let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
    switch (type) {
      case "lp": b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; break;
      case "hp": b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; break;
      case "peak": b0 = 1 + alpha * A; b1 = -2 * cs; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cs; a2 = 1 - alpha / A; break;
      case "lowshelf": { const s = 2 * Math.sqrt(A) * alpha; b0 = A * (A + 1 - (A - 1) * cs + s); b1 = 2 * A * (A - 1 - (A + 1) * cs); b2 = A * (A + 1 - (A - 1) * cs - s); a0 = A + 1 + (A - 1) * cs + s; a1 = -2 * (A - 1 + (A + 1) * cs); a2 = A + 1 + (A - 1) * cs - s; break; }
      case "highshelf": { const s = 2 * Math.sqrt(A) * alpha; b0 = A * (A + 1 + (A - 1) * cs + s); b1 = -2 * A * (A - 1 + (A + 1) * cs); b2 = A * (A + 1 + (A - 1) * cs - s); a0 = A + 1 - (A - 1) * cs + s; a1 = 2 * (A - 1 - (A + 1) * cs); a2 = A + 1 - (A - 1) * cs - s; break; }
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  bypass(): void { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; }
  process(x: Float32Array, n: number): void {
    const { b0, b1, b2, a1, a2 } = this; let z1 = this.z1, z2 = this.z2;
    for (let i = 0; i < n; i++) { const v = x[i], y = b0 * v + z1; z1 = b1 * v - a1 * y + z2; z2 = b2 * v - a2 * y; x[i] = y; }
    this.z1 = z1; this.z2 = z2;
  }
}

// ── EQ：高切 / 低切 + 低架 / 高架 + 一个峰 ────────────────────────────────────────────────────────────────────────
const EQ: FxKindDef = { kind: "eq", name: "均衡", formula: "每段一个双二阶 H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)，系数按 RBJ Audio EQ Cookbook（hp / lp Q = 0.707；架子 Q = 0.707；峰 Q 可调）。hpHz / lpHz = 0 关。",
  params: [
    { id: "hpHz", unit: "Hz", min: 0, max: 2000, default: 0, label: "低切" }, { id: "lpHz", unit: "Hz", min: 0, max: 20000, default: 0, label: "高切" },
    { id: "lowDb", unit: "dB", min: -24, max: 24, default: 0, label: "低架" }, { id: "lowHz", unit: "Hz", min: 40, max: 1000, default: 200, label: "低架频率" },
    { id: "midDb", unit: "dB", min: -24, max: 24, default: 0, label: "中峰" }, { id: "midHz", unit: "Hz", min: 100, max: 10000, default: 1500, label: "中峰频率" }, { id: "midQ", unit: "ratio", min: 0.2, max: 10, default: 1, label: "中峰宽" },
    { id: "highDb", unit: "dB", min: -24, max: 24, default: 0, label: "高架" }, { id: "highHz", unit: "Hz", min: 1000, max: 16000, default: 5000, label: "高架频率" },
  ] };
type EqSection = [boolean, "hp" | "lp" | "lowshelf" | "peak" | "highshelf", number, number, number];
/** EQ 的五段（录音房设系数和画响应曲线共用这一份，v0.10.11）：开不开、类型、频率、Q、增益。 */
function eqSections(p: Record<string, number>): EqSection[] {
  const g = (k: string) => p[k] ?? EQ.params.find((d) => d.id === k)!.default;
  return [
    [g("hpHz") > 0, "hp", g("hpHz"), 0.707, 0], [g("lpHz") > 0, "lp", g("lpHz"), 0.707, 0],
    [g("lowDb") !== 0, "lowshelf", g("lowHz"), 0.707, g("lowDb")], [g("midDb") !== 0, "peak", g("midHz"), g("midQ"), g("midDb")], [g("highDb") !== 0, "highshelf", g("highHz"), 0.707, g("highDb")],
  ];
}
/** EQ 在这些频率上的响应（dB；混音台 EQ 页卡片背景上那条曲线，v0.10.11）：同录音房的双二阶系数，|H(e^{jω})| 连乘。 */
export function eqResponseDb(p: Record<string, number>, sr: number, freqs: readonly number[]): number[] {
  const bq = eqSections(p).filter(([on]) => on).map(([, type, f, q, db]) => { const b = new Biquad(); b.set(type, f, q, db, sr); return b; });
  return freqs.map((f) => {
    const w = (2 * Math.PI * f) / sr, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    let mag = 1;
    for (const b of bq) {
      const nr = b.b0 + b.b1 * c1 + b.b2 * c2, ni = -(b.b1 * s1 + b.b2 * s2), dr = 1 + b.a1 * c1 + b.a2 * c2, di = -(b.a1 * s1 + b.a2 * s2);
      mag *= Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
    }
    return 20 * Math.log10(Math.max(1e-9, mag));
  });
}
class Eq implements FxInstance {
  readonly kind = "eq"; on = true;
  private sec: [Biquad, Biquad][] = Array.from({ length: 5 }, () => [new Biquad(), new Biquad()]);
  private use = [false, false, false, false, false];
  readonly id: string; private sr: number;
  constructor(id: string, sr: number, p: Record<string, number>) { this.id = id; this.sr = sr; this.setParams(p); }   // 不用参数属性：Node 的 strip-only TS 不认
  setParams(p: Record<string, number>): void {
    const defs = eqSections(p);
    defs.forEach(([on, type, f, q, db], k) => { this.use[k] = on; for (const b of this.sec[k]) if (on) b.set(type, f, q, db, this.sr); else b.bypass(); });
  }
  process(L: Float32Array, R: Float32Array | null, n: number): void {
    if (!this.on) return;
    for (let k = 0; k < 5; k++) { if (!this.use[k]) continue; this.sec[k][0].process(L, n); if (R) this.sec[k][1].process(R, n); }
  }
}

// ── 压缩器（峰值检波、软拐点、可侧链；立体声联动）────────────────────────────────────────────────────────────────
const COMP: FxKindDef = { kind: "comp", name: "压缩", formula: "包络 e[n] = max(|x|, e[n-1]·r) 起（attack）落（release）各一个时间常数；超过 threshold 的部分按 ratio 压（kneeDb 内软拐点：g = -(x - T + K/2)^2 · (1 - 1/R) / (2K)）；增益 = 10^(g/20) × 10^(makeup/20)。key 给了 = 听别的轨（侧链），不给 = 听自己。",
  params: [
    { id: "thresholdDb", unit: "dB", min: -60, max: 0, default: -18, label: "阈值" }, { id: "ratio", unit: "ratio", min: 1, max: 20, default: 3, label: "比例" },
    { id: "attackMs", unit: "ms", min: 0.1, max: 200, default: 10, label: "起" }, { id: "releaseMs", unit: "ms", min: 5, max: 2000, default: 120, label: "落" },
    { id: "kneeDb", unit: "dB", min: 0, max: 24, default: 6, label: "拐点" }, { id: "makeupDb", unit: "dB", min: -12, max: 24, default: 0, label: "补偿" },
  ] };
class Comp implements FxInstance {
  readonly kind = "comp"; on = true;
  private env = 0; private aAtt = 0; private aRel = 0; private T = -18; private R = 3; private K = 6; private makeup = 1;
  gainReductionDb = 0;   // 表用（最近一块压了多少）
  inPeak = 0; outPeak = 0;   // 表用（最近一块进 / 出的峰值，线性；压缩页的波形图，v0.10.21）
  readonly id: string; private sr: number;
  constructor(id: string, sr: number, p: Record<string, number>) { this.id = id; this.sr = sr; this.setParams(p); }
  setParams(p: Record<string, number>): void {
    const g = (k: string) => p[k] ?? COMP.params.find((d) => d.id === k)!.default;
    this.T = g("thresholdDb"); this.R = Math.max(1, g("ratio")); this.K = Math.max(0, g("kneeDb")); this.makeup = dbToLin(g("makeupDb"));
    this.aAtt = Math.exp(-1 / (Math.max(0.0001, g("attackMs") / 1000) * this.sr)); this.aRel = Math.exp(-1 / (Math.max(0.001, g("releaseMs") / 1000) * this.sr));
  }
  private gainDb(levelDb: number): number {
    const { T, R, K } = this, over = levelDb - T;
    if (K > 0 && over > -K / 2 && over < K / 2) { const t = over + K / 2; return -((t * t) * (1 - 1 / R)) / (2 * K); }
    return over <= 0 ? 0 : -over * (1 - 1 / R);
  }
  process(L: Float32Array, R: Float32Array | null, n: number, key: Float32Array | null): void {
    if (!this.on) return;
    let env = this.env, minG = 0, pin = 0, pout = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(Math.abs(L[i]), R ? Math.abs(R[i]) : 0), k = key ? Math.abs(key[i]) : a;
      env = k > env ? k + (env - k) * this.aAtt : k + (env - k) * this.aRel;
      const lvl = env > 1e-7 ? 20 * Math.log10(env) : -140, gdb = this.gainDb(lvl), g = dbToLin(gdb) * this.makeup;
      if (gdb < minG) minG = gdb;
      if (a > pin) pin = a; if (a * g > pout) pout = a * g;
      L[i] *= g; if (R) R[i] *= g;
    }
    this.env = env; this.gainReductionDb = minG; this.inPeak = pin; this.outPeak = pout;
  }
}

// ── 延迟（反馈里一个低通，立体声同长）─────────────────────────────────────────────────────────────────────────────
const DELAY: FxKindDef = { kind: "delay", name: "延迟", formula: "y[n] = x[n]·dry + d[n]·mix（dry 没写 = 1 − mix，v0.10.10 前的写法），d[n] = x[n - D] + fb · LP(d[n - D])，LP = 一阶低通 dampHz。D = timeMs（最长 2 s）。",
  params: [
    { id: "timeMs", unit: "ms", min: 1, max: 2000, default: 375, label: "时间" }, { id: "feedback", unit: "0..1", min: 0, max: 0.95, default: 0.35, label: "反馈" },
    { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.3, label: "湿" }, { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "原声" }, { id: "dampHz", unit: "Hz", min: 500, max: 20000, default: 6000, label: "反馈高切" },
  ] };
class Delay implements FxInstance {
  readonly kind = "delay"; on = true;
  private bufL: Float32Array; private bufR: Float32Array; private wr = 0; private D = 1; private fb = 0.35; private mix = 0.3; private dry = 0.7; private lpK = 0.5; private lpL = 0; private lpR = 0;
  readonly id: string; private sr: number;
  constructor(id: string, sr: number, p: Record<string, number>) { this.id = id; this.sr = sr; const max = Math.ceil(2 * sr) + 1; this.bufL = new Float32Array(max); this.bufR = new Float32Array(max); this.setParams(p); }
  setParams(p: Record<string, number>): void {
    const g = (k: string) => p[k] ?? DELAY.params.find((d) => d.id === k)!.default;
    this.D = clamp(Math.round((g("timeMs") / 1000) * this.sr), 1, this.bufL.length - 1); this.fb = clamp(g("feedback"), 0, 0.95); this.mix = clamp(g("mix"), 0, 1); this.dry = dryOf(p, this.mix);
    this.lpK = 1 - Math.exp((-2 * Math.PI * clamp(g("dampHz"), 100, this.sr * 0.45)) / this.sr);
  }
  process(L: Float32Array, R: Float32Array | null, n: number): void {
    if (!this.on) return;
    const len = this.bufL.length, D = this.D, fb = this.fb, mix = this.mix, dry = this.dry, k = this.lpK;
    for (let i = 0; i < n; i++) {
      const rd = (this.wr - D + len) % len;
      const dl = this.bufL[rd]; this.lpL += (dl - this.lpL) * k; this.bufL[this.wr] = L[i] + this.lpL * fb; L[i] = L[i] * dry + dl * mix;
      if (R) { const dr = this.bufR[rd]; this.lpR += (dr - this.lpR) * k; this.bufR[this.wr] = R[i] + this.lpR * fb; R[i] = R[i] * dry + dr * mix; }
      this.wr = (this.wr + 1) % len;
    }
  }
}

// ── 算法混响（Freeverb 结构：8 条梳状 + 4 条全通，每边一组、右边错开；公共领域的经典结构）────────────────────────────
const REVERB: FxKindDef = { kind: "reverb", name: "混响", formula: "Freeverb：8 条低通反馈梳状（长度 1116…1617 @44.1k，按采样率缩放；反馈 = 0.7 + 0.28·room，低通 = damp）并联，再串 4 条全通（g = 0.5）；右边各长 23 个采样；前面一段 preDelayMs 纯延迟；y = x·(1-mix) + wet·mix。",
  params: [
    { id: "room", unit: "0..1", min: 0, max: 1, default: 0.5, label: "房间大小" }, { id: "damp", unit: "0..1", min: 0, max: 1, default: 0.5, label: "高频吸收" },
    { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.3, label: "湿" }, { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "原声" }, { id: "preDelayMs", unit: "ms", min: 0, max: 200, default: 10, label: "预延迟" }, { id: "width", unit: "0..1", min: 0, max: 1, default: 1, label: "宽度" },
  ], stereoOnly: true };
const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], ALLPASS = [556, 441, 341, 225], SPREAD = 23;
class Comb { buf: Float32Array; idx = 0; store = 0; constructor(n: number) { this.buf = new Float32Array(n); }
  tick(x: number, fb: number, damp: number): number { const out = this.buf[this.idx]; this.store = out * (1 - damp) + this.store * damp; this.buf[this.idx] = x + this.store * fb; this.idx = (this.idx + 1) % this.buf.length; return out; } }
class Allpass { buf: Float32Array; idx = 0; constructor(n: number) { this.buf = new Float32Array(n); }
  tick(x: number): number { const b = this.buf[this.idx], out = -x + b; this.buf[this.idx] = x + b * 0.5; this.idx = (this.idx + 1) % this.buf.length; return out; } }
class Reverb implements FxInstance {
  readonly kind = "reverb"; on = true;
  private cL: Comb[]; private cR: Comb[]; private aL: Allpass[]; private aR: Allpass[];
  private pre: Float32Array; private preW = 0; private preD = 0;
  private fb = 0.84; private damp = 0.5; private mix = 0.3; private dry = 0.7; private width = 1;
  readonly id: string; private sr: number;
  constructor(id: string, sr: number, p: Record<string, number>) {
    this.id = id; this.sr = sr;
    const s = sr / 44100, len = (n: number) => Math.max(2, Math.round(n * s));
    this.cL = COMBS.map((n) => new Comb(len(n))); this.cR = COMBS.map((n) => new Comb(len(n + SPREAD)));
    this.aL = ALLPASS.map((n) => new Allpass(len(n))); this.aR = ALLPASS.map((n) => new Allpass(len(n + SPREAD)));
    this.pre = new Float32Array(Math.ceil(0.2 * sr) + 1); this.setParams(p);
  }
  setParams(p: Record<string, number>): void {
    const g = (k: string) => p[k] ?? REVERB.params.find((d) => d.id === k)!.default;
    this.fb = 0.7 + 0.28 * clamp(g("room"), 0, 1); this.damp = clamp(g("damp"), 0, 1) * 0.4; this.mix = clamp(g("mix"), 0, 1); this.dry = dryOf(p, this.mix); this.width = clamp(g("width"), 0, 1);
    this.preD = clamp(Math.round((g("preDelayMs") / 1000) * this.sr), 0, this.pre.length - 1);
  }
  process(L: Float32Array, R: Float32Array | null, n: number): void {
    if (!this.on) return;
    const Rr = R ?? L, mix = this.mix, dry = this.dry, w1 = (1 + this.width) / 2, w2 = (1 - this.width) / 2, plen = this.pre.length;
    for (let i = 0; i < n; i++) {
      const inp = (L[i] + Rr[i]) * 0.015;   // Freeverb 的固定输入增益
      this.pre[this.preW] = inp; const x = this.pre[(this.preW - this.preD + plen) % plen]; this.preW = (this.preW + 1) % plen;
      let oL = 0, oR = 0;
      for (let c = 0; c < 8; c++) { oL += this.cL[c].tick(x, this.fb, this.damp); oR += this.cR[c].tick(x, this.fb, this.damp); }
      for (let a = 0; a < 4; a++) { oL = this.aL[a].tick(oL); oR = this.aR[a].tick(oR); }
      const wl = oL * w1 + oR * w2, wr = oR * w1 + oL * w2;
      L[i] = L[i] * dry + wl * mix; if (R) R[i] = R[i] * dry + wr * mix;
    }
  }
}

// ── 合唱 / 加倍（user 2026-10-10「齐唱 我想的是用混音效果做，clannad也只有茶太一名歌手啊」）：几条短延迟各自被低频抖动（= 轻微的音高抖动），分到左右，和干声叠在一起 ──
const CHORUS: FxKindDef = { kind: "chorus", name: "合唱", formula: "v 条延迟 d_k(t) = delayMs + depthMs · sin(2π · rateHz · t + 2πk/v)（线性插值读），第 k 条摆在 pan_k = spread · (2k/(v-1) - 1)；y = x·(1-mix) + mix · Σ_k d_k / v。",
  params: [
    { id: "voices", unit: "ratio", min: 1, max: 4, default: 3, label: "几条" }, { id: "delayMs", unit: "ms", min: 5, max: 40, default: 18, label: "延迟" },
    { id: "depthMs", unit: "ms", min: 0, max: 10, default: 2.5, label: "抖动深度" }, { id: "rateHz", unit: "Hz", min: 0.05, max: 5, default: 0.6, label: "抖动快慢" },
    { id: "spread", unit: "0..1", min: 0, max: 1, default: 0.8, label: "左右铺开" }, { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.5, label: "湿" }, { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "原声" },
  ] };
class Chorus implements FxInstance {
  readonly kind = "chorus"; on = true;
  readonly id: string; private sr: number;
  private buf: Float32Array; private wr = 0; private phase = 0;
  private voices = 3; private delay = 0; private depth = 0; private rate = 0.6; private spread = 0.8; private mix = 0.5; private dry = 0.5;
  constructor(id: string, sr: number, p: Record<string, number>) { this.id = id; this.sr = sr; this.buf = new Float32Array(Math.ceil(0.06 * sr) + 2); this.setParams(p); }
  setParams(p: Record<string, number>): void {
    const g = (k: string) => p[k] ?? CHORUS.params.find((d) => d.id === k)!.default;
    this.voices = clamp(Math.round(g("voices")), 1, 4); this.delay = (clamp(g("delayMs"), 5, 40) / 1000) * this.sr; this.depth = (clamp(g("depthMs"), 0, 10) / 1000) * this.sr;
    this.rate = clamp(g("rateHz"), 0.05, 5); this.spread = clamp(g("spread"), 0, 1); this.mix = clamp(g("mix"), 0, 1); this.dry = dryOf(p, this.mix);
  }
  process(L: Float32Array, R: Float32Array | null, n: number): void {
    if (!this.on) return;
    const len = this.buf.length, v = this.voices, mix = this.mix, dry = this.dry, dphi = (2 * Math.PI * this.rate) / this.sr;
    for (let i = 0; i < n; i++) {
      const x = R ? (L[i] + R[i]) * 0.5 : L[i];
      this.buf[this.wr] = x;
      let wl = 0, wr = 0;
      for (let k = 0; k < v; k++) {
        const d = this.delay + this.depth * Math.sin(this.phase + (2 * Math.PI * k) / v), rp = this.wr - d, ri = Math.floor(rp), f = rp - ri;
        const a = this.buf[((ri % len) + len) % len], b = this.buf[(((ri + 1) % len) + len) % len], y = (a * (1 - f) + b * f) / v;
        const pan = v === 1 ? 0 : this.spread * ((2 * k) / (v - 1) - 1), gl = Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2, gr = Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
        wl += y * gl; wr += y * gr;
      }
      this.phase += dphi; if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
      this.wr = (this.wr + 1) % len;
      L[i] = L[i] * dry + wl * mix; if (R) R[i] = R[i] * dry + wr * mix;
    }
  }
}

// ── 增益 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const GAIN: FxKindDef = { kind: "gain", name: "增益", formula: "y = x · 10^(dB/20)", params: [{ id: "dB", unit: "dB", min: -60, max: 24, default: 0, label: "增益" }] };
class Gain implements FxInstance {
  readonly kind = "gain"; on = true; private g = 1;
  readonly id: string;
  constructor(id: string, _sr: number, p: Record<string, number>) { this.id = id; this.setParams(p); }
  setParams(p: Record<string, number>): void { this.g = dbToLin(clamp(p.dB ?? 0, -60, 24)); }
  process(L: Float32Array, R: Float32Array | null, n: number): void { if (!this.on || this.g === 1) return; for (let i = 0; i < n; i++) { L[i] *= this.g; if (R) R[i] *= this.g; } }
}

/** 原声留多少（混响 / 延迟 / 合唱；v0.10.10，user「开了混响结果铃声都哑掉了…标准插件怎么做的？反正fl studio是没有这个问题的」）：
 *  标准插件原声和湿声是两个旋钮（原声默认 100%，加效果不削原声；当发送的返回轨才把原声关掉）。没写 dry = 原来的交叉混合 1 − mix（旧歌逐样本不变）。 */
function dryOf(p: Record<string, number>, mix: number): number { return p.dry === undefined || !Number.isFinite(p.dry) ? 1 - mix : clamp(p.dry, 0, 1); }
export const FX_KINDS: Record<string, FxKindDef> = { eq: EQ, comp: COMP, delay: DELAY, reverb: REVERB, chorus: CHORUS, gain: GAIN };
/** 按 FxV2 建实例；不认识的 kind = null（不出声、原样带着）。 */
export function createFx(spec: FxV2, sr: number): FxInstance | null {
  const p = Object.fromEntries(Object.entries(spec.params ?? {}).filter(([, v]) => typeof v === "number" && Number.isFinite(v))) as Record<string, number>;
  let fx: FxInstance | null = null;
  switch (spec.kind) {
    case "eq": fx = new Eq(spec.id, sr, p); break;
    case "comp": fx = new Comp(spec.id, sr, p); break;
    case "delay": fx = new Delay(spec.id, sr, p); break;
    case "reverb": fx = new Reverb(spec.id, sr, p); break;
    case "chorus": fx = new Chorus(spec.id, sr, p); break;
    case "gain": fx = new Gain(spec.id, sr, p); break;
  }
  if (fx) fx.on = spec.on !== false;
  return fx;
}
/** 一条链：按 spec 建 / 复用实例（同 id 同 kind 的留着状态，只换参数；不认识的跳过）。 */
export function buildChain(specs: readonly FxV2[], prev: FxInstance[], sr: number): FxInstance[] {
  const out: FxInstance[] = [];
  for (const s of specs) {
    const had = prev.find((f) => f.id === s.id && f.kind === s.kind);
    if (had) { had.setParams(Object.fromEntries(Object.entries(s.params ?? {}).filter(([, v]) => typeof v === "number")) as Record<string, number>); had.on = s.on !== false; out.push(had); continue; }
    const fx = createFx(s, sr); if (fx) out.push(fx);
  }
  return out;
}
/** vault README 用：这条链每个效果的算法说明。 */
export function describeFx(spec: FxV2): string { const d = FX_KINDS[spec.kind]; return d ? `${d.name}（${spec.kind}）：${d.formula}` : `${spec.kind}：这一版不认识`; }
