// spectrum.ts —— 混音台 EQ 页卡片背景的频谱（v0.10.11）：录音房拷来的最近 2048 个采样 → 加窗 FFT → 按对数频率并成 96 个频带（dB）→ 平滑。纯函数 + 一个小类。
// created 2026-10-10 by Claude Opus 5.5（user「看不到频谱背景调均衡等于瞎子…做成卡片的背景动画」「记得我说的省cpu，只有看见的时候才进行统计和绘制」）
// 画法 = 半透明的填充面（不是竖条：条形抖、看不出形状；只画线：弱的频段看不出分量）+ 上面一条这一格 EQ 的响应曲线（engine/fx.ts eqResponseDb）。

export const SPEC_BANDS = 96, SPEC_FMIN = 30, SPEC_FMAX = 16000;
/** 第 k 个频带的中心频率（对数等分 30 Hz – 16 kHz）。 */
export const bandHz = (k: number): number => SPEC_FMIN * (SPEC_FMAX / SPEC_FMIN) ** ((k + 0.5) / SPEC_BANDS);
/** 频率 → 横坐标 0–1（同频带的对数刻度）。 */
export const xOfHz = (f: number): number => Math.log(Math.max(SPEC_FMIN, Math.min(SPEC_FMAX, f)) / SPEC_FMIN) / Math.log(SPEC_FMAX / SPEC_FMIN);

/** 原地 radix-2 FFT（re / im 长度 = 2 的幂）。 */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}
/** 一段采样 → 96 个频带的电平（dBFS；0 dB = 满幅正弦；每个频带取它覆盖的 FFT 格子里最大的）。 */
export function bandsDb(x: Float32Array, sr: number): Float32Array {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  let wsum = 0; for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); re[i] = x[i] * w; wsum += w; }   // 汉宁窗
  fft(re, im);
  const out = new Float32Array(SPEC_BANDS).fill(-120), binHz = sr / n, norm = 2 / wsum;
  for (let k = 0; k < SPEC_BANDS; k++) {
    const lo = SPEC_FMIN * (SPEC_FMAX / SPEC_FMIN) ** (k / SPEC_BANDS), hi = SPEC_FMIN * (SPEC_FMAX / SPEC_FMIN) ** ((k + 1) / SPEC_BANDS);
    let b0 = Math.floor(lo / binHz), b1 = Math.ceil(hi / binHz); if (b1 <= b0) b1 = b0 + 1;
    let mx = 0; for (let b = Math.max(1, b0); b < Math.min(n / 2, b1); b++) { const m = Math.hypot(re[b], im[b]) * norm; if (m > mx) mx = m; }
    out[k] = mx > 1e-6 ? 20 * Math.log10(mx) : -120;
  }
  return out;
}
/** 平滑：涨得快（直接到）、落得慢（每次最多落 fall dB）。 */
export function smoothBands(prev: Float32Array | undefined, next: Float32Array, fall = 6): Float32Array {
  if (!prev) return next;
  const o = new Float32Array(next.length); for (let k = 0; k < next.length; k++) o[k] = next[k] >= prev[k] ? next[k] : Math.max(next[k], prev[k] - fall);
  return o;
}
/** 频带 → SVG 填充面的 path（viewBox 0 0 100 100；dB 范围 [lo, hi] 映到 100 → 0）。 */
export function areaPath(b: Float32Array, lo = -90, hi = -6): string {
  const y = (d: number) => (100 * (hi - Math.max(lo, Math.min(hi, d)))) / (hi - lo);
  let d = `M0,100`; for (let k = 0; k < b.length; k++) d += `L${((100 * (k + 0.5)) / b.length).toFixed(2)},${y(b[k]).toFixed(2)}`;
  return d + "L100,100Z";
}
