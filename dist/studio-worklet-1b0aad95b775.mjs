// src/gm/tsf-standalone.ts
async function instantiateTsf(module) {
  const imports = { env: { emscripten_notify_memory_growth: () => {
  } } };
  const inst = module instanceof WebAssembly.Module ? await WebAssembly.instantiate(module, imports) : (await WebAssembly.instantiate(module, imports)).instance;
  const ex = inst.exports;
  ex._initialize();
  return new Tsf(ex);
}
var Tsf = class {
  ex;
  outPtr = 0;
  outCap = 0;
  constructor(ex) {
    this.ex = ex;
  }
  // 不用参数属性：Node 的 strip-only TS 不认
  u8() {
    return new Uint8Array(this.ex.memory.buffer);
  }
  cstr(p) {
    const m = this.u8();
    let s = "";
    for (let i = p; m[i]; i++) s += String.fromCharCode(m[i]);
    return s;
  }
  /** 载一份 sf2（字节拷进 wasm 堆、载完就还）。失败 = null。 */
  load(bytes, sampleRate2, maxVoices = 64) {
    const p = this.ex.malloc(bytes.length);
    this.u8().set(bytes, p);
    const handle = this.ex.sf_load(p, bytes.length, sampleRate2);
    this.ex.free(p);
    if (!handle) return null;
    this.ex.sf_set_max_voices(handle, maxVoices);
    const n = this.ex.sf_preset_count(handle), presets = Array.from({ length: n }, (_, i) => ({ index: i, bank: this.ex.sf_preset_bank(handle, i), program: this.ex.sf_preset_num(handle, i), name: this.cstr(this.ex.sf_preset_name(handle, i)) }));
    return { handle, presets };
  }
  close(b) {
    this.ex.sf_close(b.handle);
  }
  noteOn(b, preset, key, vel) {
    this.ex.sf_note_on(b.handle, preset, key, vel);
  }
  noteOff(b, preset, key) {
    this.ex.sf_note_off(b.handle, preset, key);
  }
  allOff(b) {
    this.ex.sf_note_off_all(b.handle);
  }
  /** 所有声音快速收掉（tsf_reset = endquick：几毫秒淡出，不是硬切）。 */
  reset(b) {
    this.ex.sf_reset(b.handle);
  }
  active(b) {
    return this.ex.sf_active(b.handle);
  }
  /** 渲染 n 个单声道采样进 out（从 offset 起）。 */
  render(b, out, offset = 0, n = out.length - offset) {
    if (n <= 0) return;
    if (this.outCap < n) {
      if (this.outPtr) this.ex.free(this.outPtr);
      this.outPtr = this.ex.malloc(n * 4);
      this.outCap = n;
    }
    this.ex.sf_render(b.handle, this.outPtr, n);
    out.set(new Float32Array(this.ex.memory.buffer, this.outPtr, n), offset);
  }
};

// src/engine/fx.ts
var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
var dbToLin = (dB) => 10 ** (dB / 20);
var Biquad = class {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  z1 = 0;
  z2 = 0;
  // 直接 II 型转置
  set(type, f, Q, gainDb, sr) {
    f = clamp(f, 10, sr * 0.45);
    Q = clamp(Q, 0.1, 20);
    const w = 2 * Math.PI * f / sr, cs = Math.cos(w), sn = Math.sin(w), A = 10 ** (gainDb / 40), alpha = sn / (2 * Q);
    let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
    switch (type) {
      case "lp":
        b0 = (1 - cs) / 2;
        b1 = 1 - cs;
        b2 = (1 - cs) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "hp":
        b0 = (1 + cs) / 2;
        b1 = -(1 + cs);
        b2 = (1 + cs) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "peak":
        b0 = 1 + alpha * A;
        b1 = -2 * cs;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cs;
        a2 = 1 - alpha / A;
        break;
      case "lowshelf": {
        const s = 2 * Math.sqrt(A) * alpha;
        b0 = A * (A + 1 - (A - 1) * cs + s);
        b1 = 2 * A * (A - 1 - (A + 1) * cs);
        b2 = A * (A + 1 - (A - 1) * cs - s);
        a0 = A + 1 + (A - 1) * cs + s;
        a1 = -2 * (A - 1 + (A + 1) * cs);
        a2 = A + 1 + (A - 1) * cs - s;
        break;
      }
      case "highshelf": {
        const s = 2 * Math.sqrt(A) * alpha;
        b0 = A * (A + 1 + (A - 1) * cs + s);
        b1 = -2 * A * (A - 1 + (A + 1) * cs);
        b2 = A * (A + 1 + (A - 1) * cs - s);
        a0 = A + 1 - (A - 1) * cs + s;
        a1 = 2 * (A - 1 - (A + 1) * cs);
        a2 = A + 1 - (A - 1) * cs - s;
        break;
      }
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }
  bypass() {
    this.b0 = 1;
    this.b1 = 0;
    this.b2 = 0;
    this.a1 = 0;
    this.a2 = 0;
  }
  process(x, n) {
    const { b0, b1, b2, a1, a2 } = this;
    let z1 = this.z1, z2 = this.z2;
    for (let i = 0; i < n; i++) {
      const v = x[i], y = b0 * v + z1;
      z1 = b1 * v - a1 * y + z2;
      z2 = b2 * v - a2 * y;
      x[i] = y;
    }
    this.z1 = z1;
    this.z2 = z2;
  }
};
var EQ = {
  kind: "eq",
  name: "\u5747\u8861",
  formula: "\u6BCF\u6BB5\u4E00\u4E2A\u53CC\u4E8C\u9636 H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)\uFF0C\u7CFB\u6570\u6309 RBJ Audio EQ Cookbook\uFF08hp / lp Q = 0.707\uFF1B\u67B6\u5B50 Q = 0.707\uFF1B\u5CF0 Q \u53EF\u8C03\uFF09\u3002hpHz / lpHz = 0 \u5173\u3002",
  params: [
    { id: "hpHz", unit: "Hz", min: 0, max: 2e3, default: 0, label: "\u4F4E\u5207" },
    { id: "lpHz", unit: "Hz", min: 0, max: 2e4, default: 0, label: "\u9AD8\u5207" },
    { id: "lowDb", unit: "dB", min: -24, max: 24, default: 0, label: "\u4F4E\u67B6" },
    { id: "lowHz", unit: "Hz", min: 40, max: 1e3, default: 200, label: "\u4F4E\u67B6\u9891\u7387" },
    { id: "midDb", unit: "dB", min: -24, max: 24, default: 0, label: "\u4E2D\u5CF0" },
    { id: "midHz", unit: "Hz", min: 100, max: 1e4, default: 1500, label: "\u4E2D\u5CF0\u9891\u7387" },
    { id: "midQ", unit: "ratio", min: 0.2, max: 10, default: 1, label: "\u4E2D\u5CF0\u5BBD" },
    { id: "highDb", unit: "dB", min: -24, max: 24, default: 0, label: "\u9AD8\u67B6" },
    { id: "highHz", unit: "Hz", min: 1e3, max: 16e3, default: 5e3, label: "\u9AD8\u67B6\u9891\u7387" }
  ]
};
function eqSections(p) {
  const g = (k) => p[k] ?? EQ.params.find((d) => d.id === k).default;
  return [
    [g("hpHz") > 0, "hp", g("hpHz"), 0.707, 0],
    [g("lpHz") > 0, "lp", g("lpHz"), 0.707, 0],
    [g("lowDb") !== 0, "lowshelf", g("lowHz"), 0.707, g("lowDb")],
    [g("midDb") !== 0, "peak", g("midHz"), g("midQ"), g("midDb")],
    [g("highDb") !== 0, "highshelf", g("highHz"), 0.707, g("highDb")]
  ];
}
var Eq = class {
  kind = "eq";
  on = true;
  sec = Array.from({ length: 5 }, () => [new Biquad(), new Biquad()]);
  use = [false, false, false, false, false];
  id;
  sr;
  constructor(id, sr, p) {
    this.id = id;
    this.sr = sr;
    this.setParams(p);
  }
  // 不用参数属性：Node 的 strip-only TS 不认
  setParams(p) {
    const defs = eqSections(p);
    defs.forEach(([on, type, f, q, db], k) => {
      this.use[k] = on;
      for (const b of this.sec[k]) if (on) b.set(type, f, q, db, this.sr);
      else b.bypass();
    });
  }
  process(L, R, n) {
    if (!this.on) return;
    for (let k = 0; k < 5; k++) {
      if (!this.use[k]) continue;
      this.sec[k][0].process(L, n);
      if (R) this.sec[k][1].process(R, n);
    }
  }
};
var COMP = {
  kind: "comp",
  name: "\u538B\u7F29",
  formula: "\u5305\u7EDC e[n] = max(|x|, e[n-1]\xB7r) \u8D77\uFF08attack\uFF09\u843D\uFF08release\uFF09\u5404\u4E00\u4E2A\u65F6\u95F4\u5E38\u6570\uFF1B\u8D85\u8FC7 threshold \u7684\u90E8\u5206\u6309 ratio \u538B\uFF08kneeDb \u5185\u8F6F\u62D0\u70B9\uFF1Ag = -(x - T + K/2)^2 \xB7 (1 - 1/R) / (2K)\uFF09\uFF1B\u589E\u76CA = 10^(g/20) \xD7 10^(makeup/20)\u3002key \u7ED9\u4E86 = \u542C\u522B\u7684\u8F68\uFF08\u4FA7\u94FE\uFF09\uFF0C\u4E0D\u7ED9 = \u542C\u81EA\u5DF1\u3002",
  params: [
    { id: "thresholdDb", unit: "dB", min: -60, max: 0, default: -18, label: "\u9608\u503C" },
    { id: "ratio", unit: "ratio", min: 1, max: 20, default: 3, label: "\u6BD4\u4F8B" },
    { id: "attackMs", unit: "ms", min: 0.1, max: 200, default: 10, label: "\u8D77" },
    { id: "releaseMs", unit: "ms", min: 5, max: 2e3, default: 120, label: "\u843D" },
    { id: "kneeDb", unit: "dB", min: 0, max: 24, default: 6, label: "\u62D0\u70B9" },
    { id: "makeupDb", unit: "dB", min: -12, max: 24, default: 0, label: "\u8865\u507F" }
  ]
};
var Comp = class {
  kind = "comp";
  on = true;
  env = 0;
  aAtt = 0;
  aRel = 0;
  T = -18;
  R = 3;
  K = 6;
  makeup = 1;
  gainReductionDb = 0;
  // 表用（最近一块压了多少）
  inPeak = 0;
  outPeak = 0;
  // 表用（最近一块进 / 出的峰值，线性；压缩页的波形图，v0.10.21）
  id;
  sr;
  constructor(id, sr, p) {
    this.id = id;
    this.sr = sr;
    this.setParams(p);
  }
  setParams(p) {
    const g = (k) => p[k] ?? COMP.params.find((d) => d.id === k).default;
    this.T = g("thresholdDb");
    this.R = Math.max(1, g("ratio"));
    this.K = Math.max(0, g("kneeDb"));
    this.makeup = dbToLin(g("makeupDb"));
    this.aAtt = Math.exp(-1 / (Math.max(1e-4, g("attackMs") / 1e3) * this.sr));
    this.aRel = Math.exp(-1 / (Math.max(1e-3, g("releaseMs") / 1e3) * this.sr));
  }
  gainDb(levelDb) {
    const { T, R, K } = this, over = levelDb - T;
    if (K > 0 && over > -K / 2 && over < K / 2) {
      const t = over + K / 2;
      return -(t * t * (1 - 1 / R)) / (2 * K);
    }
    return over <= 0 ? 0 : -over * (1 - 1 / R);
  }
  process(L, R, n, key) {
    if (!this.on) return;
    let env = this.env, minG = 0, pin = 0, pout = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(Math.abs(L[i]), R ? Math.abs(R[i]) : 0), k = key ? Math.abs(key[i]) : a;
      env = k > env ? k + (env - k) * this.aAtt : k + (env - k) * this.aRel;
      const lvl = env > 1e-7 ? 20 * Math.log10(env) : -140, gdb = this.gainDb(lvl), g = dbToLin(gdb) * this.makeup;
      if (gdb < minG) minG = gdb;
      if (a > pin) pin = a;
      if (a * g > pout) pout = a * g;
      L[i] *= g;
      if (R) R[i] *= g;
    }
    this.env = env;
    this.gainReductionDb = minG;
    this.inPeak = pin;
    this.outPeak = pout;
  }
};
var DELAY = {
  kind: "delay",
  name: "\u5EF6\u8FDF",
  formula: "y[n] = x[n]\xB7dry + d[n]\xB7mix\uFF08dry \u6CA1\u5199 = 1 \u2212 mix\uFF0Cv0.10.10 \u524D\u7684\u5199\u6CD5\uFF09\uFF0Cd[n] = x[n - D] + fb \xB7 LP(d[n - D])\uFF0CLP = \u4E00\u9636\u4F4E\u901A dampHz\u3002D = timeMs\uFF08\u6700\u957F 2 s\uFF09\u3002",
  params: [
    { id: "timeMs", unit: "ms", min: 1, max: 2e3, default: 375, label: "\u65F6\u95F4" },
    { id: "feedback", unit: "0..1", min: 0, max: 0.95, default: 0.35, label: "\u53CD\u9988" },
    { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.3, label: "\u6E7F" },
    { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "\u539F\u58F0" },
    { id: "dampHz", unit: "Hz", min: 500, max: 2e4, default: 6e3, label: "\u53CD\u9988\u9AD8\u5207" }
  ]
};
var Delay = class {
  kind = "delay";
  on = true;
  bufL;
  bufR;
  wr = 0;
  D = 1;
  fb = 0.35;
  mix = 0.3;
  dry = 0.7;
  lpK = 0.5;
  lpL = 0;
  lpR = 0;
  id;
  sr;
  constructor(id, sr, p) {
    this.id = id;
    this.sr = sr;
    const max = Math.ceil(2 * sr) + 1;
    this.bufL = new Float32Array(max);
    this.bufR = new Float32Array(max);
    this.setParams(p);
  }
  setParams(p) {
    const g = (k) => p[k] ?? DELAY.params.find((d) => d.id === k).default;
    this.D = clamp(Math.round(g("timeMs") / 1e3 * this.sr), 1, this.bufL.length - 1);
    this.fb = clamp(g("feedback"), 0, 0.95);
    this.mix = clamp(g("mix"), 0, 1);
    this.dry = dryOf(p, this.mix);
    this.lpK = 1 - Math.exp(-2 * Math.PI * clamp(g("dampHz"), 100, this.sr * 0.45) / this.sr);
  }
  process(L, R, n) {
    if (!this.on) return;
    const len = this.bufL.length, D = this.D, fb = this.fb, mix = this.mix, dry = this.dry, k = this.lpK;
    for (let i = 0; i < n; i++) {
      const rd = (this.wr - D + len) % len;
      const dl = this.bufL[rd];
      this.lpL += (dl - this.lpL) * k;
      this.bufL[this.wr] = L[i] + this.lpL * fb;
      L[i] = L[i] * dry + dl * mix;
      if (R) {
        const dr = this.bufR[rd];
        this.lpR += (dr - this.lpR) * k;
        this.bufR[this.wr] = R[i] + this.lpR * fb;
        R[i] = R[i] * dry + dr * mix;
      }
      this.wr = (this.wr + 1) % len;
    }
  }
};
var REVERB = {
  kind: "reverb",
  name: "\u6DF7\u54CD",
  formula: "Freeverb\uFF1A8 \u6761\u4F4E\u901A\u53CD\u9988\u68B3\u72B6\uFF08\u957F\u5EA6 1116\u20261617 @44.1k\uFF0C\u6309\u91C7\u6837\u7387\u7F29\u653E\uFF1B\u53CD\u9988 = 0.7 + 0.28\xB7room\uFF0C\u4F4E\u901A = damp\uFF09\u5E76\u8054\uFF0C\u518D\u4E32 4 \u6761\u5168\u901A\uFF08g = 0.5\uFF09\uFF1B\u53F3\u8FB9\u5404\u957F 23 \u4E2A\u91C7\u6837\uFF1B\u524D\u9762\u4E00\u6BB5 preDelayMs \u7EAF\u5EF6\u8FDF\uFF1By = x\xB7(1-mix) + wet\xB7mix\u3002",
  params: [
    { id: "room", unit: "0..1", min: 0, max: 1, default: 0.5, label: "\u623F\u95F4\u5927\u5C0F" },
    { id: "damp", unit: "0..1", min: 0, max: 1, default: 0.5, label: "\u9AD8\u9891\u5438\u6536" },
    { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.3, label: "\u6E7F" },
    { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "\u539F\u58F0" },
    { id: "preDelayMs", unit: "ms", min: 0, max: 200, default: 10, label: "\u9884\u5EF6\u8FDF" },
    { id: "width", unit: "0..1", min: 0, max: 1, default: 1, label: "\u5BBD\u5EA6" }
  ],
  stereoOnly: true
};
var COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
var ALLPASS = [556, 441, 341, 225];
var SPREAD = 23;
var Comb = class {
  buf;
  idx = 0;
  store = 0;
  constructor(n) {
    this.buf = new Float32Array(n);
  }
  tick(x, fb, damp) {
    const out = this.buf[this.idx];
    this.store = out * (1 - damp) + this.store * damp;
    this.buf[this.idx] = x + this.store * fb;
    this.idx = (this.idx + 1) % this.buf.length;
    return out;
  }
};
var Allpass = class {
  buf;
  idx = 0;
  constructor(n) {
    this.buf = new Float32Array(n);
  }
  tick(x) {
    const b = this.buf[this.idx], out = -x + b;
    this.buf[this.idx] = x + b * 0.5;
    this.idx = (this.idx + 1) % this.buf.length;
    return out;
  }
};
var Reverb = class {
  kind = "reverb";
  on = true;
  cL;
  cR;
  aL;
  aR;
  pre;
  preW = 0;
  preD = 0;
  fb = 0.84;
  damp = 0.5;
  mix = 0.3;
  dry = 0.7;
  width = 1;
  id;
  sr;
  constructor(id, sr, p) {
    this.id = id;
    this.sr = sr;
    const s = sr / 44100, len = (n) => Math.max(2, Math.round(n * s));
    this.cL = COMBS.map((n) => new Comb(len(n)));
    this.cR = COMBS.map((n) => new Comb(len(n + SPREAD)));
    this.aL = ALLPASS.map((n) => new Allpass(len(n)));
    this.aR = ALLPASS.map((n) => new Allpass(len(n + SPREAD)));
    this.pre = new Float32Array(Math.ceil(0.2 * sr) + 1);
    this.setParams(p);
  }
  setParams(p) {
    const g = (k) => p[k] ?? REVERB.params.find((d) => d.id === k).default;
    this.fb = 0.7 + 0.28 * clamp(g("room"), 0, 1);
    this.damp = clamp(g("damp"), 0, 1) * 0.4;
    this.mix = clamp(g("mix"), 0, 1);
    this.dry = dryOf(p, this.mix);
    this.width = clamp(g("width"), 0, 1);
    this.preD = clamp(Math.round(g("preDelayMs") / 1e3 * this.sr), 0, this.pre.length - 1);
  }
  process(L, R, n) {
    if (!this.on) return;
    const Rr = R ?? L, mix = this.mix, dry = this.dry, w1 = (1 + this.width) / 2, w2 = (1 - this.width) / 2, plen = this.pre.length;
    for (let i = 0; i < n; i++) {
      const inp = (L[i] + Rr[i]) * 0.015;
      this.pre[this.preW] = inp;
      const x = this.pre[(this.preW - this.preD + plen) % plen];
      this.preW = (this.preW + 1) % plen;
      let oL = 0, oR = 0;
      for (let c = 0; c < 8; c++) {
        oL += this.cL[c].tick(x, this.fb, this.damp);
        oR += this.cR[c].tick(x, this.fb, this.damp);
      }
      for (let a = 0; a < 4; a++) {
        oL = this.aL[a].tick(oL);
        oR = this.aR[a].tick(oR);
      }
      const wl = oL * w1 + oR * w2, wr = oR * w1 + oL * w2;
      L[i] = L[i] * dry + wl * mix;
      if (R) R[i] = R[i] * dry + wr * mix;
    }
  }
};
var CHORUS = {
  kind: "chorus",
  name: "\u5408\u5531",
  formula: "v \u6761\u5EF6\u8FDF d_k(t) = delayMs + depthMs \xB7 sin(2\u03C0 \xB7 rateHz \xB7 t + 2\u03C0k/v)\uFF08\u7EBF\u6027\u63D2\u503C\u8BFB\uFF09\uFF0C\u7B2C k \u6761\u6446\u5728 pan_k = spread \xB7 (2k/(v-1) - 1)\uFF1By = x\xB7(1-mix) + mix \xB7 \u03A3_k d_k / v\u3002",
  params: [
    { id: "voices", unit: "ratio", min: 1, max: 4, default: 3, label: "\u51E0\u6761" },
    { id: "delayMs", unit: "ms", min: 5, max: 40, default: 18, label: "\u5EF6\u8FDF" },
    { id: "depthMs", unit: "ms", min: 0, max: 10, default: 2.5, label: "\u6296\u52A8\u6DF1\u5EA6" },
    { id: "rateHz", unit: "Hz", min: 0.05, max: 5, default: 0.6, label: "\u6296\u52A8\u5FEB\u6162" },
    { id: "spread", unit: "0..1", min: 0, max: 1, default: 0.8, label: "\u5DE6\u53F3\u94FA\u5F00" },
    { id: "mix", unit: "0..1", min: 0, max: 1, default: 0.5, label: "\u6E7F" },
    { id: "dry", unit: "0..1", min: 0, max: 1, default: 1, label: "\u539F\u58F0" }
  ]
};
var Chorus = class {
  kind = "chorus";
  on = true;
  id;
  sr;
  buf;
  wr = 0;
  phase = 0;
  voices = 3;
  delay = 0;
  depth = 0;
  rate = 0.6;
  spread = 0.8;
  mix = 0.5;
  dry = 0.5;
  constructor(id, sr, p) {
    this.id = id;
    this.sr = sr;
    this.buf = new Float32Array(Math.ceil(0.06 * sr) + 2);
    this.setParams(p);
  }
  setParams(p) {
    const g = (k) => p[k] ?? CHORUS.params.find((d) => d.id === k).default;
    this.voices = clamp(Math.round(g("voices")), 1, 4);
    this.delay = clamp(g("delayMs"), 5, 40) / 1e3 * this.sr;
    this.depth = clamp(g("depthMs"), 0, 10) / 1e3 * this.sr;
    this.rate = clamp(g("rateHz"), 0.05, 5);
    this.spread = clamp(g("spread"), 0, 1);
    this.mix = clamp(g("mix"), 0, 1);
    this.dry = dryOf(p, this.mix);
  }
  process(L, R, n) {
    if (!this.on) return;
    const len = this.buf.length, v = this.voices, mix = this.mix, dry = this.dry, dphi = 2 * Math.PI * this.rate / this.sr;
    for (let i = 0; i < n; i++) {
      const x = R ? (L[i] + R[i]) * 0.5 : L[i];
      this.buf[this.wr] = x;
      let wl = 0, wr = 0;
      for (let k = 0; k < v; k++) {
        const d = this.delay + this.depth * Math.sin(this.phase + 2 * Math.PI * k / v), rp = this.wr - d, ri = Math.floor(rp), f = rp - ri;
        const a = this.buf[(ri % len + len) % len], b = this.buf[((ri + 1) % len + len) % len], y = (a * (1 - f) + b * f) / v;
        const pan = v === 1 ? 0 : this.spread * (2 * k / (v - 1) - 1), gl = Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, gr = Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
        wl += y * gl;
        wr += y * gr;
      }
      this.phase += dphi;
      if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
      this.wr = (this.wr + 1) % len;
      L[i] = L[i] * dry + wl * mix;
      if (R) R[i] = R[i] * dry + wr * mix;
    }
  }
};
var Gain = class {
  kind = "gain";
  on = true;
  g = 1;
  id;
  constructor(id, _sr, p) {
    this.id = id;
    this.setParams(p);
  }
  setParams(p) {
    this.g = dbToLin(clamp(p.dB ?? 0, -60, 24));
  }
  process(L, R, n) {
    if (!this.on || this.g === 1) return;
    for (let i = 0; i < n; i++) {
      L[i] *= this.g;
      if (R) R[i] *= this.g;
    }
  }
};
function dryOf(p, mix) {
  return p.dry === void 0 || !Number.isFinite(p.dry) ? 1 - mix : clamp(p.dry, 0, 1);
}
function createFx(spec, sr) {
  const p = Object.fromEntries(Object.entries(spec.params ?? {}).filter(([, v]) => typeof v === "number" && Number.isFinite(v)));
  let fx = null;
  switch (spec.kind) {
    case "eq":
      fx = new Eq(spec.id, sr, p);
      break;
    case "comp":
      fx = new Comp(spec.id, sr, p);
      break;
    case "delay":
      fx = new Delay(spec.id, sr, p);
      break;
    case "reverb":
      fx = new Reverb(spec.id, sr, p);
      break;
    case "chorus":
      fx = new Chorus(spec.id, sr, p);
      break;
    case "gain":
      fx = new Gain(spec.id, sr, p);
      break;
  }
  if (fx) fx.on = spec.on !== false;
  return fx;
}
function buildChain(specs, prev, sr) {
  const out = [];
  for (const s of specs) {
    const had = prev.find((f) => f.id === s.id && f.kind === s.kind);
    if (had) {
      had.setParams(Object.fromEntries(Object.entries(s.params ?? {}).filter(([, v]) => typeof v === "number")));
      had.on = s.on !== false;
      out.push(had);
      continue;
    }
    const fx = createFx(s, sr);
    if (fx) out.push(fx);
  }
  return out;
}

// src/engine/studio.ts
var BLOCK = 128;
var CEILING = 0.98;
var LIM_ATTACK = 3e-3;
var LIM_RELEASE = 0.15;
var LIM_LOOK_TAUS = 3;
var TAIL_MAX = 2;
var CLIP_FADE_OUT = 0.03;
var CLIP_FADE_IN = 0.01;
var GAIN_TAU = 4e-3;
var POS_EVERY = 8 * BLOCK;
var MAX_VOWEL_VOICES = 24;
var V_ATTACK = 0.01;
var V_RELEASE = 0.04;
var V_CUT = 6e-3;
var V_GLIDE = 0.012;
var LOOKAHEAD = 30;
var dbToLin2 = (dB) => dB === -Infinity ? 0 : 10 ** (dB / 20);
var now = typeof performance !== "undefined" && typeof performance.now === "function" ? () => performance.now() : () => Date.now();
var I16 = 1 / 32768;
function toInt16(x) {
  const out = new Int16Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    out[i] = v >= 1 ? 32767 : v <= -1 ? -32768 : Math.round(v * 32767);
  }
  return out;
}
var panGains = (gainDb, pan) => {
  const g = dbToLin2(gainDb), p = Math.max(-1, Math.min(1, pan));
  return [g * Math.cos((p + 1) * Math.PI / 4), g * Math.sin((p + 1) * Math.PI / 4)];
};
var DEFAULT_CH = { gainDb: 0, pan: 0, mute: false, solo: false };
var Studio = class {
  sr;
  tsf;
  post;
  banks = /* @__PURE__ */ new Map();
  vowels = null;
  chunks = /* @__PURE__ */ new Map();
  tracks = /* @__PURE__ */ new Map();
  order = [];
  channels = /* @__PURE__ */ new Map();
  // 时间线换了也留着（边放边调不丢）
  buses = /* @__PURE__ */ new Map();
  /** 处理总线的顺序：送出去的在被送进的前面（busOrder）。 */
  busList = [];
  master = { gainDb: 0, limiter: true };
  masterLin = 1;
  masterFx = [];
  // 走带
  playing = false;
  pos = 0;
  // 秒（时间线）
  range = { from: 0, to: 0 };
  loop = false;
  loopFrom = null;
  tail = -1;
  // ≥0 = 范围尾：已经等了几秒
  draining = false;
  drainPos = 0;
  drainSecs = 0;
  // 停了之后：释放中的尾巴照响到静（不渲染 = 冻住，下次放才漏出来；user「每次点play的时候会漏上次的最后一个音」）
  forgetLater = /* @__PURE__ */ new Set();
  // 主线程要放掉、但正被 hold 着的块：响完再删
  waiting = null;
  // 块没到：等它（走带冻住）
  gen = 0;
  // 走带代号（主线程给；报告带着它）
  // 试听
  auditionSf = /* @__PURE__ */ new Map();
  // sha → 试听用的 player（和时间线的分开：绕过静音 / 独奏）
  auditions = /* @__PURE__ */ new Map();
  // src → 正在按着的
  auditionVowels = [];
  auditionClips = [];
  lastAud = /* @__PURE__ */ new Map();
  // sha → 最后一次试听的增益 / 声像（松开后尾巴照这个）
  // 缓冲（零分配）
  mono = new Float32Array(BLOCK);
  busL = new Float32Array(BLOCK);
  busR = new Float32Array(BLOCK);
  audL = new Float32Array(BLOCK);
  audR = new Float32Array(BLOCK);
  // 限幅器
  look;
  delayL;
  delayR;
  need;
  attPow;
  wr = 0;
  gPrev = 1;
  aRel;
  // 表 / 报告
  meterOn = false;
  meterPeak = 0;
  meterFrames = 0;
  /** 每条轨 / 混音轨这一段推子后的峰值（只在 meterOn 时攒；混音台开着才开）。 */
  trackPeaks = /* @__PURE__ */ new Map();
  specOn = false;
  specFrames = 0;
  /** 平均电平 / 压缩的表（meterOn 时攒）：均方的和 + 帧数；最多压了多少 dB。 */
  trackMs = /* @__PURE__ */ new Map();
  grMin = /* @__PURE__ */ new Map();
  compLv = /* @__PURE__ */ new Map();
  /** 李萨如图：总轨 / 混音轨推子后的左右最近 STEREO_N 个采样。 */
  stereoOn = false;
  stereoFrames = 0;
  stereoRings = /* @__PURE__ */ new Map();
  stereoPush(id, l, r) {
    let g = this.stereoRings.get(id);
    if (!g) {
      g = { L: new Float32Array(STEREO_N), R: new Float32Array(STEREO_N), w: 0 };
      this.stereoRings.set(id, g);
    }
    g.L[g.w] = l;
    g.R[g.w] = r;
    g.w = g.w + 1 & STEREO_N - 1;
  }
  /** 第一台压缩（压缩页摊开的就是它）这一块压了多少 + 进 / 出的峰值。没有压缩 / 关着 = 进出都按这条轨链尾、推子前的峰值 `pre`，压了 0
   *  （v0.10.26，user「效果器的动画没开效果器的卡上面也应该有」：每张卡都有波形，看得出哪儿冲、要不要压）。 */
  grOf(id, fx, pre) {
    const c = fx.find((f) => f.kind === "comp");
    const on = !!c && c.on, lv = this.compLv.get(id) ?? [0, 0];
    if (!on) {
      this.compLv.set(id, [Math.max(lv[0], pre), Math.max(lv[1], pre)]);
      return;
    }
    const v = c.gainReductionDb ?? 0;
    this.grMin.set(id, Math.min(this.grMin.get(id) ?? 0, v));
    this.compLv.set(id, [Math.max(lv[0], c.inPeak ?? 0), Math.max(lv[1], c.outPeak ?? 0)]);
  }
  specRings = /* @__PURE__ */ new Map();
  /** 往某条轨的频谱环里写一段（单声道；立体声的传两路取平均）；g0 → g1 = 这一段的推子（线性渐变，和出声同一条斜坡）。 */
  specPush(id, a, b, n, g0 = 1, g1 = g0) {
    let r = this.specRings.get(id);
    if (!r) {
      r = { buf: new Float32Array(SPEC_N), w: 0 };
      this.specRings.set(id, r);
    }
    const buf = r.buf, dg = (g1 - g0) / n;
    let w = r.w, g = g0;
    for (let i = 0; i < n; i++) {
      g += dg;
      buf[w] = (b ? (a[i] + b[i]) * 0.5 : a[i]) * g;
      w = w + 1 & SPEC_N - 1;
    }
    r.w = w;
  }
  loadBusy = 0;
  loadFrames = 0;
  chunkBytes = 0;
  // 负载 / 内存监控（刀 6）
  posFrames = 0;
  /** 宿主的音频时钟：这一块开头的 AudioContext 时间（worklet 每块前设 = currentTime；离线 / 测试不设）。位置报告带上「块尾的时钟」。 */
  clock = null;
  missingSent = /* @__PURE__ */ new Set();
  constructor(sampleRate2, tsf, post) {
    this.sr = sampleRate2;
    this.tsf = tsf;
    this.post = post;
    this.look = Math.max(1, Math.round(LIM_ATTACK * LIM_LOOK_TAUS * sampleRate2));
    this.delayL = new Float32Array(this.look);
    this.delayR = new Float32Array(this.look);
    this.need = new Float32Array(this.look).fill(1);
    const aAtt = Math.exp(-1 / (LIM_ATTACK * sampleRate2));
    this.attPow = Float32Array.from({ length: this.look + 1 }, (_, k) => aAtt ** k);
    this.aRel = Math.exp(-1 / (LIM_RELEASE * sampleRate2));
  }
  /** 限幅器带来的固定延迟（采样）：导出时从输出里扣掉。 */
  get latency() {
    return this.master.limiter ? this.look : 0;
  }
  get isPlaying() {
    return this.playing;
  }
  get position() {
    return this.pos;
  }
  get waitingFor() {
    return this.waiting;
  }
  hasChunk(key) {
    return this.chunks.has(key);
  }
  // ── 消息 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  handle(m) {
    switch (m.type) {
      case "bank": {
        let b = this.banks.get(m.sha);
        if (!b) {
          const loaded = this.tsf.load(m.bytes, this.sr, 256);
          if (!loaded) {
            this.post({ type: "error", message: `studio: not a SoundFont 2 file (${m.sha.slice(0, 12)})` });
            return;
          }
          b = loaded;
          this.banks.set(m.sha, b);
          for (const t of this.tracks.values()) if (t.spec.kind === "sf" && t.spec.sha === m.sha && !t.sf) t.sf = this.playerFor(b);
        }
        this.post({ type: "banked", sha: m.sha, presets: b.presets.map((p) => [p.bank, p.program]) });
        return;
      }
      case "unbank": {
        const b = this.banks.get(m.sha);
        if (!b) return;
        for (const t of this.tracks.values()) if (t.sf && t.sf.bank === b) {
          this.tsf.close(t.sf.player);
          t.sf = null;
        }
        const a = this.auditionSf.get(m.sha);
        if (a) {
          this.tsf.close(a.player);
          this.auditionSf.delete(m.sha);
        }
        for (const [src, au] of this.auditions) if (au.inst.kind === "sf" && au.inst.sha === m.sha) this.auditions.delete(src);
        this.tsf.close(b);
        this.banks.delete(m.sha);
        return;
      }
      case "vowels": {
        const entries = m.entries.map((e) => {
          const data = new Float32Array(e.len);
          for (let k = 0; k < e.len; k++) data[k] = m.pcm[e.start + k] / 32768;
          return { ...e, data };
        });
        this.vowels = { sr: m.sr, entries };
        return;
      }
      case "timeline":
        this.setTimeline(m.tl);
        return;
      case "chunk": {
        this.dropChunk(m.key);
        const samples = m.samples instanceof Int16Array ? m.samples : toInt16(m.samples);
        this.chunks.set(m.key, { sr: m.sr, samples });
        this.chunkBytes += samples.byteLength;
        this.missingSent.delete(m.key);
        return;
      }
      case "getChunks": {
        const items = m.keys.flatMap((k) => {
          const c = this.chunks.get(k);
          return c ? [{ key: k, sr: c.sr, samples: c.samples.slice() }] : [];
        });
        this.post({ type: "chunks", items }, items.map((x) => x.samples.buffer));
        return;
      }
      case "forget":
        for (const k of m.keys) {
          if (this.held(k) || this.sounding(k)) this.forgetLater.add(k);
          else this.dropChunk(k);
        }
        return;
      // 正在响 / hold 着的块：响完再删（主线程换时间线之前就会先来清块）
      case "channel": {
        const cur = this.channels.get(m.id) ?? { ...DEFAULT_CH }, next = { ...cur, ...m.p };
        this.channels.set(m.id, next);
        const t = this.tracks.get(m.id);
        if (t) {
          t.ch = next;
          if (m.p.chain !== void 0) t.chFx = buildChain(m.p.chain, t.chFx, this.sr);
        }
        return;
      }
      case "buses": {
        const old = this.buses;
        this.buses = /* @__PURE__ */ new Map();
        for (const b of m.buses) {
          const had = old.get(b.id);
          this.buses.set(b.id, { id: b.id, gainDb: b.gainDb, pan: b.pan, mute: !!b.mute, gl: had?.gl ?? 0, gr: had?.gr ?? 0, fx: buildChain(b.chain, had?.fx ?? [], this.sr), L: had?.L ?? new Float32Array(BLOCK), R: had?.R ?? new Float32Array(BLOCK), out: null, sends: [] });
        }
        this.busList = busOrder(m.buses, this.buses);
        return;
      }
      case "master":
        this.master = { ...this.master, ...m.p };
        this.masterLin = dbToLin2(this.master.gainDb);
        if (m.p.chain !== void 0) this.masterFx = buildChain(m.p.chain, this.masterFx, this.sr);
        return;
      case "play":
        if (m.gen !== void 0) this.gen = m.gen;
        this.play(m.at, m.quiet);
        return;
      case "stop":
        this.stop();
        return;
      case "seek":
        this.seek(m.at, m.quiet);
        return;
      case "audition":
        this.audition(m);
        return;
      case "auditionClip": {
        for (const v of this.auditionClips) if (v.src === m.src) v.state = "cut";
        const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0);
        while (this.auditionClips.length >= 8) this.auditionClips.shift();
        this.auditionClips.push({ src: m.src, data: m.samples, ratio: m.sr / this.sr, pos: 0, env: 0, state: "attack", gl, gr });
        this.auditions.set(m.src, { inst: { kind: "clip" }, key: 0, gl, gr });
        return;
      }
      case "meter":
        this.meterOn = m.on;
        this.meterPeak = 0;
        this.meterFrames = 0;
        this.trackPeaks.clear();
        this.trackMs.clear();
        this.grMin.clear();
        this.compLv.clear();
        return;
      case "stereo":
        this.stereoOn = m.on;
        this.stereoFrames = 0;
        if (!m.on) this.stereoRings.clear();
        return;
      case "spectrum":
        this.specOn = m.on;
        this.specFrames = 0;
        if (!m.on) this.specRings.clear();
        return;
    }
  }
  playerFor(bank) {
    const handle = this.tsf.ex.sf_copy(bank.handle);
    this.tsf.ex.sf_set_max_voices(handle, 256);
    return { bank, player: { handle, presets: bank.presets } };
  }
  setTimeline(tl) {
    const old = this.tracks;
    this.tracks = /* @__PURE__ */ new Map();
    this.order = [];
    const pos0 = this.pos, shift = this.playing && tl.shift ? tl.shift : 0;
    const prevClips = /* @__PURE__ */ new Map();
    for (const spec of tl.tracks) {
      const prev = old.get(spec.id);
      if (prev && prev.spec.kind === "clips") prevClips.set(spec.id, prev.spec.clips);
      const t = prev ?? { spec, ch: this.channels.get(spec.id) ?? { ...DEFAULT_CH }, gl: 0, gr: 0, y: 1, gk: 0, nextNote: 0, offs: [], sf: null, vowels: [], env: 1, envTarget: 1, hold: null, src: new Float32Array(BLOCK), out: new Float32Array(BLOCK), perfFx: [], chFx: [] };
      t.spec = spec;
      t.ch = this.channels.get(spec.id) ?? t.ch;
      t.perfFx = buildChain(spec.chain ?? [], t.perfFx, this.sr);
      if (!prev) t.chFx = buildChain(t.ch.chain ?? [], [], this.sr);
      if (spec.kind === "sf") {
        const bank = this.banks.get(spec.sha) ?? null;
        if (t.sf && t.sf.bank !== bank) {
          this.tsf.close(t.sf.player);
          t.sf = null;
        }
        if (!t.sf && bank) t.sf = this.playerFor(bank);
      } else if (t.sf) {
        this.tsf.close(t.sf.player);
        t.sf = null;
      }
      this.tracks.set(spec.id, t);
      this.order.push(spec.id);
      old.delete(spec.id);
    }
    for (const t of old.values()) {
      if (t.sf) this.tsf.close(t.sf.player);
      this.endHold(t);
    }
    this.range = { ...tl.range };
    this.loop = tl.loop;
    this.loopFrom = tl.loopFrom ?? null;
    if (this.playing) {
      if (shift) {
        this.pos = Math.max(this.range.from, Math.min(this.range.to, pos0 + shift));
        for (const t of this.tracks.values()) {
          for (const o of t.offs) o.t += shift;
          if (t.hold) {
            t.hold.t0 += shift;
            t.hold.until += shift;
          }
        }
      }
      for (const t of this.tracks.values()) {
        if (t.spec.kind !== "clips") {
          this.endHold(t);
          continue;
        }
        const cur = t.spec.clips.find((c) => c.t0 <= this.pos && c.t0 + c.dur > this.pos);
        if (!cur) {
          this.endHold(t);
          continue;
        }
        if (t.hold && t.hold.until > this.pos) continue;
        this.endHold(t);
        if (this.chunks.has(cur.key)) continue;
        const o = prevClips.get(t.spec.id)?.find((c) => c.t0 <= pos0 && c.t0 + c.dur > pos0 && c.key !== cur.key && this.chunks.has(c.key));
        if (o) t.hold = { key: o.key, t0: o.t0 + shift, dur: o.dur, gain: o.gain, until: Math.min(o.t0 + o.dur, cur.t0 + cur.dur - shift) + shift };
      }
      this.resetCursors(false);
      this.checkMissing();
    } else {
      for (const t of this.tracks.values()) {
        this.endHold(t);
        t.gk = 0;
        t.nextNote = 0;
      }
      if (this.pos < this.range.from || this.pos > this.range.to) this.pos = this.range.from;
    }
    this.sweepForget();
  }
  // ── 走带 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  /** 起点（见 play 消息的 quiet）：-Infinity = 没有。跳转 / 循环绕回 / 停 = 清掉（循环第二遍前一段照常响）。
   *  user 2026-10-10「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」：从某一段放时起点提前 PRE_ROLL（月读的辅音在拍子前），这一小截落在前一段最后一个音里，追音把它补按下去、前一句的块（带收尾余音）也放出来。 */
  quiet = -Infinity;
  mutedNote(n) {
    return n.t1 <= this.quiet;
  }
  mutedClip(c) {
    return c.end !== void 0 && c.end <= this.quiet;
  }
  play(at, quiet) {
    this.quiet = quiet ?? -Infinity;
    if (at !== void 0) this.pos = at;
    if (this.pos < this.range.from || this.pos >= this.range.to) this.pos = this.range.from;
    this.playing = true;
    this.draining = false;
    this.tail = -1;
    this.waiting = null;
    this.posFrames = POS_EVERY;
    for (const t of this.tracks.values()) {
      this.killAll(t);
      this.endHold(t);
    }
    this.resetCursors(true);
    this.checkMissing();
  }
  /** 停：不排新音、块 30 ms 淡出、释放中的尾巴接着响到静（不是冻住）。播放头留在原地。 */
  stop() {
    this.quiet = -Infinity;
    this.playing = false;
    this.tail = -1;
    this.waiting = null;
    this.draining = true;
    this.drainPos = this.pos;
    this.drainSecs = 0;
    for (const t of this.tracks.values()) {
      this.releaseAll(t);
      t.envTarget = 0;
      this.endHold(t);
    }
    this.sweepForget();
  }
  seek(at, quiet) {
    this.quiet = quiet ?? -Infinity;
    this.pos = at;
    this.posFrames = POS_EVERY;
    if (this.playing) {
      this.tail = -1;
      this.waiting = null;
      for (const t of this.tracks.values()) this.endHold(t);
      this.resetCursors(true);
      this.checkMissing();
    }
  }
  /** 旧块响完 / 不要了：撤 hold；主线程早就说要放掉的这时才真删。 */
  endHold(t) {
    if (!t.hold) return;
    t.hold = null;
    this.sweepForget();
  }
  dropChunk(key) {
    const c = this.chunks.get(key);
    if (c) {
      this.chunkBytes -= c.samples.byteLength;
      this.chunks.delete(key);
    }
  }
  held(key) {
    for (const t of this.tracks.values()) if (t.hold?.key === key) return true;
    return false;
  }
  /** 放着的时候这个块正在响（时间线里它盖着播放头）。 */
  sounding(key) {
    if (!this.playing) return false;
    for (const t of this.tracks.values()) if (t.spec.kind === "clips") {
      for (const c of t.spec.clips) if (c.key === key && c.t0 <= this.pos && c.t0 + c.dur > this.pos) return true;
    }
    return false;
  }
  /** 主线程早说要放掉的块：既没 hold 着、时间线里也不再用 = 这时才真删。 */
  sweepForget() {
    for (const k of this.forgetLater) {
      if (this.held(k)) continue;
      let used = false;
      for (const t of this.tracks.values()) if (t.spec.kind === "clips" && t.spec.clips.some((c) => c.key === k)) {
        used = true;
        break;
      }
      if (!used) {
        this.forgetLater.delete(k);
        this.dropChunk(k);
      }
    }
  }
  /** 所有正在响的声音快速收掉（几毫秒的淡出，不是硬切）：起放时清上一次的尾巴。 */
  killAll(t) {
    if (t.sf) this.tsf.reset(t.sf.player);
    t.offs.length = 0;
    for (const v of t.vowels) v.state = "cut";
  }
  /** 游标对齐到 pos；chase = 把 pos 这一刻该响着的音按下（起放 / seek / 续放），正在响的先松开。 */
  resetCursors(chase) {
    for (const t of this.tracks.values()) {
      if (chase) {
        this.releaseAll(t);
        t.env = 0;
      }
      t.envTarget = 1;
      const segs = t.spec.gain;
      if (segs && segs.length) {
        let k = 0;
        while (k < segs.length - 1 && this.pos >= segs[k].t1) k++;
        t.gk = k;
        if (chase) t.y = dbToLin2(segs[k].dB);
      }
      if (t.spec.kind === "clips") continue;
      const notes = t.spec.notes;
      let i = 0;
      while (i < notes.length && notes[i].t0 < this.pos) {
        if (chase && notes[i].t1 > this.pos && !this.mutedNote(notes[i])) this.noteOn(t, notes[i]);
        i++;
      }
      t.nextNote = i;
    }
  }
  releaseAll(t) {
    if (t.sf) this.tsf.allOff(t.sf.player);
    t.offs.length = 0;
    for (const v of t.vowels) if (v.state !== "release" && v.state !== "cut") v.state = "release";
  }
  noteOn(t, n) {
    if (t.spec.kind === "sf") {
      if (!t.sf) return;
      this.tsf.noteOn(t.sf.player, n.preset, n.key, n.vel);
    } else if (t.spec.kind === "vowel") this.vowelOn(t.vowels, null, t.spec.kana, n.key, 1, 1);
    else return;
    const off = { t: Math.max(n.t0, n.t1), key: n.key, preset: n.preset };
    let k = t.offs.length;
    while (k > 0 && t.offs[k - 1].t > off.t) k--;
    t.offs.splice(k, 0, off);
  }
  noteOff(t, key, preset) {
    if (t.spec.kind === "sf") {
      if (t.sf) this.tsf.noteOff(t.sf.player, preset, key);
    } else if (t.spec.kind === "vowel") {
      for (const v of t.vowels) if (v.src === null && v.key === key && v.state !== "release" && v.state !== "cut") v.state = "release";
    }
  }
  /** 播放头前面（提前量内）的块到齐了没有；没到的报上去（主线程去算）。 */
  checkMissing() {
    const miss = [];
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) if (c.t0 + c.dur > this.pos && c.t0 < this.pos + LOOKAHEAD && !this.mutedClip(c) && !this.chunks.has(c.key) && !this.missingSent.has(c.key)) {
        miss.push(c.key);
        this.missingSent.add(c.key);
      }
    }
    if (miss.length) this.post({ type: "missing", keys: miss });
  }
  /** 走带从 pos 往前最多能走到哪（≤ end）：没到的块的头挡住；正站在没到的块上 = 返回 null（要等它）。 */
  clipBarrier(end) {
    let stop = end;
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) {
        if (this.chunks.has(c.key) || t.hold && c.t0 < t.hold.until || this.mutedClip(c)) continue;
        if (c.t0 <= this.pos && c.t0 + c.dur > this.pos) return { stop: this.pos, wait: c.key };
        if (c.t0 > this.pos && c.t0 < stop) stop = c.t0;
      }
    }
    return { stop, wait: null };
  }
  keyStartingAt(t0) {
    for (const t of this.tracks.values()) if (t.spec.kind === "clips") {
      for (const c of t.spec.clips) if (!this.chunks.has(c.key) && !(t.hold && c.t0 < t.hold.until) && Math.abs(c.t0 - t0) < 1e-6) return c.key;
    }
    return null;
  }
  freeze(key) {
    this.waiting = key;
    for (const t of this.tracks.values()) this.releaseAll(t);
    this.checkMissing();
  }
  // ── 渲染 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  /** 出一块：outL / outR 长 n（≤ BLOCK）。 */
  render(outL, outR, n) {
    const tStart = now();
    this.busL.fill(0, 0, n);
    this.busR.fill(0, 0, n);
    this.audL.fill(0, 0, n);
    this.audR.fill(0, 0, n);
    for (const b of this.buses.values()) {
      b.L.fill(0, 0, n);
      b.R.fill(0, 0, n);
    }
    if (this.playing) this.renderTransport(n);
    else if (this.draining) this.renderDrain(n);
    for (const b of this.busList) {
      for (const fx of b.fx) fx.process(b.L, b.R, n, null);
      const [gl, gr] = b.mute ? [0, 0] : panGains(b.gainDb, b.pan), dl = (gl - b.gl) / n, dr = (gr - b.gr) / n;
      let cl = b.gl, cr = b.gr;
      if (this.specOn) this.specPush(b.id, b.L, b.R, n, Math.hypot(b.gl, b.gr), Math.hypot(gl, gr));
      const L = b.out ? b.out.L : this.busL, R = b.out ? b.out.R : this.busR;
      let pk = 0, ms = 0, pre = 0;
      for (let i = 0; i < n; i++) {
        cl += dl;
        cr += dr;
        const l = b.L[i] * cl * Math.SQRT2, r = b.R[i] * cr * Math.SQRT2;
        L[i] += l;
        R[i] += r;
        if (this.meterOn) {
          const a = Math.abs(l), c = Math.abs(r);
          if (a > pk) pk = a;
          if (c > pk) pk = c;
          ms += (l * l + r * r) * 0.5;
          const u = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i]));
          if (u > pre) pre = u;
        }
        if (this.stereoOn) this.stereoPush(b.id, l, r);
      }
      if (this.meterOn) {
        this.trackPeaks.set(b.id, Math.max(this.trackPeaks.get(b.id) ?? 0, pk));
        this.trackMs.set(b.id, (this.trackMs.get(b.id) ?? 0) + ms);
        this.grOf(b.id, b.fx, pre);
      }
      for (const sd of b.sends) {
        const sl = gl * sd.lin * Math.SQRT2, sr = gr * sd.lin * Math.SQRT2;
        for (let i = 0; i < n; i++) {
          sd.bus.L[i] += b.L[i] * sl;
          sd.bus.R[i] += b.R[i] * sr;
        }
      }
      b.gl = gl;
      b.gr = gr;
    }
    for (const fx of this.masterFx) fx.process(this.busL, this.busR, n, null);
    this.renderAuditions(n);
    const g = this.masterLin;
    if (this.master.limiter) this.limit(n, g);
    else for (let i = 0; i < n; i++) {
      this.busL[i] *= g;
      this.busR[i] *= g;
    }
    for (let i = 0; i < n; i++) {
      outL[i] = this.busL[i] + this.audL[i] * g;
      outR[i] = this.busR[i] + this.audR[i] * g;
    }
    if (this.specOn) {
      this.specPush("__master", outL, outR, n);
      this.specFrames += n;
      if (this.specFrames >= SPEC_N * 2) {
        this.specFrames = 0;
        const tracks = {};
        for (const [id, r] of this.specRings) {
          const o = new Float32Array(SPEC_N);
          o.set(r.buf.subarray(r.w));
          o.set(r.buf.subarray(0, r.w), SPEC_N - r.w);
          tracks[id] = o;
        }
        this.post({ type: "spectrum", sr: this.sr, tracks }, Object.values(tracks).map((x) => x.buffer));
      }
    }
    if (this.stereoOn) {
      for (let i = 0; i < n; i++) this.stereoPush("__master", outL[i], outR[i]);
      this.stereoFrames += n;
      if (this.stereoFrames >= STEREO_N * 2) {
        this.stereoFrames = 0;
        const tracks = {}, bufs = [];
        for (const [id, g2] of this.stereoRings) {
          const L = new Float32Array(STEREO_N), R = new Float32Array(STEREO_N);
          L.set(g2.L.subarray(g2.w));
          L.set(g2.L.subarray(0, g2.w), STEREO_N - g2.w);
          R.set(g2.R.subarray(g2.w));
          R.set(g2.R.subarray(0, g2.w), STEREO_N - g2.w);
          tracks[id] = { L, R };
          bufs.push(L.buffer, R.buffer);
        }
        this.post({ type: "stereo", tracks }, bufs);
      }
    }
    if (this.meterOn) {
      let ms = 0, pk = 0;
      for (let i = 0; i < n; i++) {
        const a = Math.abs(outL[i]), b = Math.abs(outR[i]);
        if (a > pk) pk = a;
        if (b > pk) pk = b;
        ms += (outL[i] * outL[i] + outR[i] * outR[i]) * 0.5;
      }
      if (pk > this.meterPeak) this.meterPeak = pk;
      this.trackMs.set("__master", (this.trackMs.get("__master") ?? 0) + ms);
      this.grOf("__master", this.masterFx, pk);
      this.meterFrames += n;
      if (this.meterFrames >= 1024) {
        const f = this.meterFrames, ms2 = {};
        for (const [k, v] of this.trackMs) ms2[k] = v / f;
        this.post({ type: "meter", peak: this.meterPeak, active: this.activeVoices(), tracks: Object.fromEntries(this.trackPeaks), ms: ms2, gr: Object.fromEntries(this.grMin), cl: Object.fromEntries(this.compLv) });
        this.meterPeak = 0;
        this.meterFrames = 0;
        this.trackPeaks.clear();
        this.trackMs.clear();
        this.grMin.clear();
        this.compLv.clear();
      }
    }
    this.loadBusy += now() - tStart;
    this.loadFrames += n;
    if (this.loadFrames >= this.sr) {
      this.post({ type: "load", busy: Math.min(1, this.loadBusy / (this.loadFrames / this.sr * 1e3)), chunkBytes: this.chunkBytes, chunks: this.chunks.size, voices: this.activeVoices() });
      this.loadBusy = 0;
      this.loadFrames = 0;
    }
  }
  activeVoices() {
    let a = this.auditionVowels.length;
    for (const t of this.tracks.values()) {
      if (t.sf) a += this.tsf.active(t.sf.player);
      a += t.vowels.length;
    }
    for (const p of this.auditionSf.values()) a += this.tsf.active(p.player);
    return a;
  }
  renderTransport(n) {
    const sr = this.sr;
    let done = 0;
    while (done < n) {
      const left = n - done;
      for (const t of this.tracks.values()) if (t.hold && this.pos >= t.hold.until) this.endHold(t);
      if (this.waiting) {
        if (!this.chunks.has(this.waiting)) {
          this.renderTracks(done, left, false, false);
          done = n;
          break;
        }
        this.waiting = null;
        this.resetCursors(true);
      }
      if (this.tail >= 0 && this.loop) {
        this.loopBack();
        continue;
      }
      if (this.tail >= 0) {
        this.renderTracks(done, left, false, true);
        this.pos += left / sr;
        this.tail += left / sr;
        done = n;
        if (this.tail >= TAIL_MAX || this.silent()) {
          this.stop();
          this.post({ type: "ended", gen: this.gen });
        }
        break;
      }
      const blockEnd = this.pos + left / sr;
      const { stop, wait } = this.clipBarrier(Math.min(blockEnd, this.range.to));
      if (wait) {
        this.freeze(wait);
        continue;
      }
      const cnt = Math.min(left, Math.max(0, Math.round((stop - this.pos) * sr)));
      if (cnt > 0) {
        this.renderTracks(done, cnt, true, true);
        this.pos += cnt / sr;
        done += cnt;
      }
      if (this.pos >= this.range.to - 0.5 / sr) {
        if (this.loop) this.loopBack();
        else {
          this.tail = 0;
          for (const t of this.tracks.values()) {
            this.releaseAll(t);
            t.envTarget = 0;
          }
        }
        continue;
      }
      if (cnt === 0) {
        const key = this.keyStartingAt(stop);
        if (!key) {
          this.renderTracks(done, left, false, false);
          done = n;
          break;
        }
        this.freeze(key);
      }
    }
    this.posFrames += n;
    if (this.posFrames >= POS_EVERY) {
      this.posFrames = 0;
      this.post({ type: "pos", sec: this.pos, playing: this.playing, waiting: this.waiting, gen: this.gen, ...this.clock !== null ? { at: this.clock + n / sr } : {} });
    }
  }
  /** 停了之后：尾巴（释放中的音、淡出中的块）照响到静或 TAIL_MAX；播放头不动，块按自己的钟走。 */
  renderDrain(n) {
    this.renderTracks(0, n, false, true, this.drainPos);
    this.drainPos += n / this.sr;
    this.drainSecs += n / this.sr;
    if (this.drainSecs >= TAIL_MAX || this.silent()) this.draining = false;
  }
  /** 循环跳回循环头（到范围尾时；或尾巴还在响时开了循环）。 */
  loopBack() {
    this.quiet = -Infinity;
    this.tail = -1;
    this.posFrames = POS_EVERY;
    this.pos = Math.max(this.range.from, Math.min(this.loopFrom ?? this.range.from, this.range.to));
    for (const t of this.tracks.values()) this.endHold(t);
    this.resetCursors(false);
    this.chaseAtLoop();
    this.checkMissing();
  }
  chaseAtLoop() {
    for (const t of this.tracks.values()) {
      if (t.spec.kind === "clips") continue;
      for (const nte of t.spec.notes) if (nte.t0 < this.pos && nte.t1 > this.pos) this.noteOn(t, nte);
    }
  }
  silent() {
    for (const t of this.tracks.values()) {
      if (t.sf && this.tsf.active(t.sf.player) > 0) return false;
      if (t.vowels.length) return false;
      if (t.spec.kind === "clips" && t.env > 1e-4) return false;
    }
    return true;
  }
  /** 各声部出 cnt 个采样进母线 / 总线（从 off 起）。notesOn = 排新音；clipsOn = 块前进（false = 冻着，块不出声）。
   *  两趟（侧链要先看到别的轨的声）：① 每轨 出声 → 表情曲线 → 块淡入淡出 → 演奏者的链 → src；② 每轨 src → 通道链（压缩器的 key 读别的轨的 src）→ 静音 / 独奏 → 推子 / 声像 → 去总轨或总线，再按发送量发到总线。 */
  renderTracks(off, cnt, notesOn, clipsOn, t0 = this.pos) {
    const solo = this.order.some((id) => this.tracks.get(id).ch.solo);
    const sr = this.sr;
    for (const id of this.order) {
      const t = this.tracks.get(id), mono = t.src;
      mono.fill(0, 0, cnt);
      if (t.spec.kind === "clips") {
        if (clipsOn && !(t.env === 0 && t.envTarget === 0)) this.renderClips(t, mono, cnt, t0);
      } else this.renderNotes(t, mono, cnt, t0, notesOn);
      const segs = t.spec.gain;
      if (segs && segs.length) {
        const a = 1 - Math.exp(-1 / (GAIN_TAU * sr));
        for (let i = 0; i < cnt; i++) {
          const tt = t0 + i / sr;
          while (t.gk < segs.length - 1 && tt >= segs[t.gk].t1) t.gk++;
          t.y += (dbToLin2(segs[t.gk].dB) - t.y) * a;
          mono[i] *= t.y;
        }
      }
      if (t.spec.kind === "clips" && t.env !== t.envTarget) {
        const step = t.envTarget > t.env ? 1 / (CLIP_FADE_IN * sr) : -1 / (CLIP_FADE_OUT * sr);
        for (let i = 0; i < cnt; i++) {
          if (t.env !== t.envTarget) {
            t.env += step;
            if (step > 0 && t.env >= t.envTarget || step < 0 && t.env <= t.envTarget) t.env = t.envTarget;
          }
          mono[i] *= t.env;
        }
      }
      for (const fx of t.perfFx) fx.process(mono, null, cnt, null);
    }
    for (const id of this.order) {
      const t = this.tracks.get(id), out = t.out;
      out.set(t.src.subarray(0, cnt));
      for (const fx of t.chFx) fx.process(out, null, cnt, fx.kind === "comp" ? this.keyOf(t, fx.id) : null);
      const audible = solo ? t.ch.solo : !t.ch.mute;
      const [gl, gr] = audible ? panGains(t.ch.gainDb, t.ch.pan) : [0, 0];
      if (this.specOn) this.specPush(id, out, null, cnt, Math.hypot(t.gl, t.gr), Math.hypot(gl, gr));
      const dl = (gl - t.gl) / cnt, dr = (gr - t.gr) / cnt;
      const bus = t.ch.to && t.ch.to !== "master" ? this.buses.get(t.ch.to) : void 0, L = bus ? bus.L : this.busL, R = bus ? bus.R : this.busR;
      let cl = t.gl, cr = t.gr, pk = 0, ms = 0;
      const sto = this.stereoOn;
      let pre = 0;
      for (let i = 0; i < cnt; i++) {
        cl += dl;
        cr += dr;
        L[off + i] += out[i] * cl;
        R[off + i] += out[i] * cr;
        if (sto) this.stereoPush(id, out[i] * cl, out[i] * cr);
        if (this.meterOn) {
          const u = Math.abs(out[i]);
          if (u > pre) pre = u;
          const a = u * Math.max(cl, cr) * Math.SQRT2;
          if (a > pk) pk = a;
          ms += out[i] * out[i] * (cl * cl + cr * cr);
        }
      }
      if (this.meterOn) {
        this.trackPeaks.set(id, Math.max(this.trackPeaks.get(id) ?? 0, pk));
        this.trackMs.set(id, (this.trackMs.get(id) ?? 0) + ms);
        this.grOf(id, t.chFx, pre);
      }
      if (t.ch.sends) for (const sd of t.ch.sends) {
        const b = this.buses.get(sd.to);
        if (!b) continue;
        const g = dbToLin2(sd.gainDb), sl = gl * g, sr2 = gr * g;
        for (let i = 0; i < cnt; i++) {
          b.L[off + i] += out[i] * sl;
          b.R[off + i] += out[i] * sr2;
        }
      }
      t.gl = gl;
      t.gr = gr;
    }
  }
  /** 压缩器的侧链：通道条上 id 是 fxId 的那台写了 key = 别的轨 id → 那条轨这一段的第一趟输出；没写 / 找不到 = null（听自己）。 */
  keyOf(t, fxId) {
    const spec = t.ch.chain?.find((f) => f.id === fxId);
    if (!spec?.key || spec.key === t.spec.id) return null;
    return this.tracks.get(spec.key)?.src ?? null;
  }
  renderClips(t, mono, cnt, t0) {
    if (t.spec.kind !== "clips") return;
    if (t.hold) this.renderClip(t.hold, mono, cnt, t0);
    for (const c of t.spec.clips) {
      if (t.hold && c.t0 < t.hold.until || this.mutedClip(c)) continue;
      this.renderClip(c, mono, cnt, t0);
    }
  }
  renderClip(c, mono, cnt, t0) {
    const sr = this.sr, tEnd = t0 + cnt / sr;
    const ch = this.chunks.get(c.key);
    if (!ch) return;
    const len = ch.samples.length, cEnd = c.t0 + len / ch.sr;
    if (c.t0 >= tEnd || cEnd <= t0) return;
    const s = ch.samples, g = c.gain * I16;
    for (let i = 0; i < cnt; i++) {
      const p = (t0 + i / sr - c.t0) * ch.sr;
      if (p < 0) continue;
      const k = p | 0;
      if (k >= len - 1) break;
      const f = p - k;
      mono[i] += (s[k] * (1 - f) + s[k + 1] * f) * g;
    }
  }
  /** 快引擎的轨：事件按采样位置施加（同原 synth-processor），中间逐段渲染。 */
  renderNotes(t, mono, cnt, t0, notesOn) {
    if (t.spec.kind === "clips") return;
    const sr = this.sr, notes = t.spec.notes, tEnd = t0 + cnt / sr;
    let pos = 0;
    const renderTo = (at) => {
      if (at <= pos) return;
      if (t.spec.kind === "sf") {
        if (t.sf) this.tsf.render(t.sf.player, mono, pos, at - pos);
      } else this.renderVowels(t.vowels, mono, null, null, pos, at - pos);
      pos = at;
    };
    if (notesOn) {
      for (; ; ) {
        const nextOn = t.nextNote < notes.length ? notes[t.nextNote].t0 : Infinity, nextOff = t.offs.length ? t.offs[0].t : Infinity;
        if (nextOn >= tEnd && nextOff >= tEnd) break;
        if (nextOff <= nextOn) {
          renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOff - t0) * sr))));
          const o = t.offs.shift();
          this.noteOff(t, o.key, o.preset);
        } else {
          renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOn - t0) * sr))));
          const nn = notes[t.nextNote++];
          if (!this.mutedNote(nn)) this.noteOn(t, nn);
        }
      }
    }
    renderTo(cnt);
  }
  // ── 元音采样器（原 src/singer/sampler.ts 的做法搬进音频线程：最近音高的样本变速、按住循环稳态段、松开淡出）────────
  vowelOn(pool, src, kana, key, gl, gr) {
    if (!this.vowels) return null;
    const es = this.vowels.entries.filter((e2) => e2.kana === kana);
    if (!es.length) return null;
    const e = es.reduce((a, b) => Math.abs(b.midi - key) < Math.abs(a.midi - key) ? b : a);
    while (pool.length >= MAX_VOWEL_VOICES) pool.shift();
    const rate = 2 ** ((key - e.midi) / 12) * (this.vowels.sr / this.sr);
    const v = { src, data: e.data, pos: 0, rate, target: rate, loopStart: e.loopStart, loopEnd: e.loopEnd, env: 0, state: "attack", gl, gr, key, baseMidi: e.midi };
    pool.push(v);
    return v;
  }
  /** 一池声音出 cnt 个采样：单声道 mono（时间线轨）或立体声 L / R（试听，自带增益声像）。 */
  renderVowels(pool, mono, L, R, off, cnt) {
    const sr = this.sr, attack = 1 / (V_ATTACK * sr), relK = Math.exp(-1 / (V_RELEASE * sr)), cutK = Math.exp(-1 / (V_CUT * sr)), glideK = 1 - Math.exp(-1 / (V_GLIDE * sr));
    for (let vi = pool.length - 1; vi >= 0; vi--) {
      const v = pool[vi], d = v.data, span = v.loopEnd - v.loopStart;
      for (let i = 0; i < cnt; i++) {
        if (v.state === "attack") {
          v.env += attack;
          if (v.env >= 1) {
            v.env = 1;
            v.state = "hold";
          }
        } else if (v.state === "release") v.env *= relK;
        else if (v.state === "cut") v.env *= cutK;
        v.rate += (v.target - v.rate) * glideK;
        const k = v.pos | 0, f = v.pos - k, s = d[k] * (1 - f) + (d[k + 1] ?? d[k]) * f, y = s * v.env;
        if (mono) mono[off + i] += y;
        else {
          L[off + i] += y * v.gl;
          R[off + i] += y * v.gr;
        }
        v.pos += v.rate;
        if (span > 0) {
          while (v.pos >= v.loopEnd) v.pos -= span;
        } else if (v.pos >= d.length - 1) {
          v.env = 0;
          v.state = "cut";
          break;
        }
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) pool.splice(vi, 1);
    }
  }
  // ── 按键试听 ──────────────────────────────────────────────────────────────────────────────────────────────────────
  audition(m) {
    if (m.ev === "alloff") {
      for (const src of [...this.auditions.keys()]) this.auditionOff(src);
      for (const v of this.auditionVowels) v.state = "cut";
      for (const v of this.auditionClips) v.state = "cut";
      return;
    }
    if (m.ev === "off") {
      this.auditionOff(m.src);
      return;
    }
    if (m.ev === "glide") {
      const au = this.auditions.get(m.src);
      if (!au || m.key === void 0) return;
      if (au.inst.kind === "vowel" && this.vowels) {
        const near = Math.abs(m.key - au.key) <= 3;
        if (near) {
          for (const v of this.auditionVowels) if (v.src === m.src) {
            v.target = 2 ** ((m.key - v.baseMidi) / 12) * (this.vowels.sr / this.sr);
            v.key = m.key;
          }
          au.key = m.key;
          return;
        }
      }
      this.auditionOff(m.src);
      this.audition({ ...m, ev: "on", inst: au.inst, gainDb: m.gainDb, pan: m.pan });
      return;
    }
    if (!m.inst || m.key === void 0) return;
    this.auditionOff(m.src);
    const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0), vel = m.vel ?? 0.8;
    if (m.inst.kind === "sf") {
      const bank = this.banks.get(m.inst.sha);
      if (!bank) return;
      let p = this.auditionSf.get(m.inst.sha);
      if (!p) {
        p = this.playerFor(bank);
        this.auditionSf.set(m.inst.sha, p);
      }
      this.tsf.noteOn(p.player, m.inst.preset, m.key, vel);
      this.lastAud.set(m.inst.sha, [gl, gr]);
    } else if (m.inst.kind === "vowel") {
      for (const v of this.auditionVowels) if (v.src === m.src) v.state = "cut";
      this.vowelOn(this.auditionVowels, m.src, m.inst.kana, m.key, gl, gr);
    } else return;
    this.auditions.set(m.src, { inst: m.inst, key: m.key, gl, gr });
  }
  auditionOff(src) {
    const au = this.auditions.get(src);
    if (!au) return;
    this.auditions.delete(src);
    if (au.inst.kind === "sf") {
      const p = this.auditionSf.get(au.inst.sha);
      if (p) this.tsf.noteOff(p.player, au.inst.preset, au.key);
    } else if (au.inst.kind === "clip") {
      for (const v of this.auditionClips) if (v.src === src && v.state !== "cut") v.state = "release";
    } else for (const v of this.auditionVowels) if (v.src === src && v.state !== "cut") v.state = "release";
  }
  renderAuditions(n) {
    if (this.auditionVowels.length) this.renderVowels(this.auditionVowels, null, this.audL, this.audR, 0, n);
    if (this.auditionClips.length) this.renderClipVoices(n);
    for (const [sha, p] of this.auditionSf) {
      if (this.tsf.active(p.player) === 0) continue;
      this.tsf.render(p.player, this.mono, 0, n);
      const [gl, gr] = this.lastAud.get(sha) ?? [1, 1];
      for (let i = 0; i < n; i++) {
        this.audL[i] += this.mono[i] * gl;
        this.audR[i] += this.mono[i] * gr;
      }
    }
  }
  /** 试听的一段声音：线性重采样放一遍（不循环），起 5 ms、松开 40 ms 淡出、被顶掉 6 ms。 */
  renderClipVoices(n) {
    const sr = this.sr, attack = 1 / (5e-3 * sr), relK = Math.exp(-1 / (0.04 * sr)), cutK = Math.exp(-1 / (6e-3 * sr));
    for (let vi = this.auditionClips.length - 1; vi >= 0; vi--) {
      const v = this.auditionClips[vi], d = v.data, len = d.length;
      for (let i = 0; i < n; i++) {
        if (v.state === "attack") {
          v.env += attack;
          if (v.env >= 1) {
            v.env = 1;
            v.state = "hold";
          }
        } else if (v.state === "release") v.env *= relK;
        else if (v.state === "cut") v.env *= cutK;
        const k = v.pos | 0;
        if (k >= len - 1) {
          v.env = 0;
          v.state = "cut";
          break;
        }
        const f = v.pos - k, y = (d[k] * (1 - f) + d[k + 1] * f) * v.env;
        this.audL[i] += y * v.gl;
        this.audR[i] += y * v.gr;
        v.pos += v.ratio;
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) {
        this.auditionClips.splice(vi, 1);
        if (this.auditions.get(v.src)?.inst.kind === "clip") this.auditions.delete(v.src);
      }
    }
  }
  // ── 母线前瞻限幅（原 src/audio/mix.ts limitBus 的实时版：输出晚 look 个采样；每个未来的峰按 attack 曲线提前收、过了峰按 release 慢慢放开；左右同一条增益）───
  limit(n, g) {
    const look = this.look, c = CEILING, L = this.busL, R = this.busR, dL = this.delayL, dR = this.delayR, need = this.need, att = this.attPow;
    for (let i = 0; i < n; i++) {
      const l = L[i] * g, r = R[i] * g, p = Math.max(Math.abs(l), Math.abs(r));
      const slot = this.wr, outL = dL[slot], outR = dR[slot];
      let gq = need[slot];
      dL[slot] = l;
      dR[slot] = r;
      need[slot] = p > c ? c / p : 1;
      for (let d = 1; d <= look; d++) {
        const v = 1 - (1 - need[(slot + d) % look]) * att[d];
        if (v < gq) gq = v;
      }
      this.wr = (slot + 1) % look;
      gq = Math.min(gq, 1 - (1 - this.gPrev) * this.aRel);
      this.gPrev = gq;
      let a = outL * gq, b = outR * gq;
      if (a > c) a = c;
      else if (a < -c) a = -c;
      if (b > c) b = c;
      else if (b < -c) b = -c;
      L[i] = a;
      R[i] = b;
    }
  }
};
var SPEC_N = 2048;
var STEREO_N = 1024;
function busOrder(specs, buses) {
  const edges = /* @__PURE__ */ new Map();
  const reach = (from, to) => {
    const seen = /* @__PURE__ */ new Set(), st = [from];
    while (st.length) {
      const x = st.pop();
      if (x === to) return true;
      if (seen.has(x)) continue;
      seen.add(x);
      st.push(...edges.get(x) ?? []);
    }
    return false;
  };
  const link = (a, b) => {
    if (!buses.has(b) || a === b || reach(b, a)) return false;
    edges.set(a, [...edges.get(a) ?? [], b]);
    return true;
  };
  for (const sp of specs) {
    const b = buses.get(sp.id);
    b.out = null;
    b.sends = [];
    if (sp.to && sp.to !== "master" && link(sp.id, sp.to)) b.out = buses.get(sp.to);
    for (const sd of sp.sends ?? []) if (link(sp.id, sd.to)) b.sends.push({ bus: buses.get(sd.to), lin: dbToLin2(sd.gainDb) });
  }
  const out = [], done = /* @__PURE__ */ new Set(), visiting = /* @__PURE__ */ new Set();
  const visit = (id) => {
    if (done.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const sp of specs) if ((edges.get(sp.id) ?? []).includes(id)) visit(sp.id);
    visiting.delete(id);
    done.add(id);
    out.push(buses.get(id));
  };
  for (const sp of specs) visit(sp.id);
  return out;
}

// src/engine/studio-processor.ts
var StudioProcessor = class extends AudioWorkletProcessor {
  studio = null;
  queue = [];
  lastCrash = "";
  constructor(options) {
    super();
    this.port.onmessage = (e) => {
      if (this.studio) this.studio.handle(e.data);
      else this.queue.push(e.data);
    };
    void instantiateTsf(options.processorOptions.module).then((tsf) => {
      this.studio = new Studio(sampleRate, tsf, (m, transfer) => this.port.postMessage(m, transfer ?? []));
      for (const m of this.queue) this.studio.handle(m);
      this.queue = [];
      this.port.postMessage({ type: "ready" });
    }).catch((err) => this.port.postMessage({ type: "error", message: `studio: wasm ${err.message}` }));
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    if (!out || !out.length) return true;
    const L = out[0], R = out[1] ?? out[0];
    if (!this.studio) {
      for (const c of out) c.fill(0);
      return true;
    }
    this.studio.clock = currentTime;
    try {
      this.studio.render(L, R, L.length);
    } catch (err) {
      for (const c of out) c.fill(0);
      const e = err, msg = `${e?.message ?? String(err)}
${(e?.stack ?? "").split("\n").slice(0, 6).join("\n")}`;
      if (msg !== this.lastCrash) {
        this.lastCrash = msg;
        this.port.postMessage({ type: "crash", message: msg });
      }
      try {
        this.studio.handle({ type: "stop" });
      } catch {
      }
    }
    return true;
  }
};
registerProcessor("studio", StudioProcessor);
//# sourceMappingURL=studio-worklet-1b0aad95b775.mjs.map
