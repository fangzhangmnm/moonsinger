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
/** 一段采样 → 96 个点上的**每八度功率**（dB；v0.10.28）：dP/d log₂f，连续的密度，不是「分成几个格子各装多少」——
 *  点数（96 个，30 Hz – 16 kHz 对数等分，约每八度 10.6 个）只是采样密度，读数不跟着它变；粉噪声 = 平的、白噪声 = 每八度 +3 dB。
 *  · 高处（一个点管的那一小段比 FFT 一格宽）：这一段里所有格子（按格子中心归段，一格只进一段）的功率加起来 ÷ 这一段有几个八度宽；
 *  · 低处（约 350 Hz 以下，比一格还窄；2048 点 / 48 kHz = 23 Hz 一格）：每一格的功率摊到它自己覆盖的那几个八度上（格子越低、覆盖的八度越宽），
 *    点落在两格之间 = 按对数频率在两格之间插（不是台阶）。
 *  功率按汉宁窗的等效噪声带宽归一（一格里一个满幅正弦的功率 = 1）。user 2026-10-10「eq的频谱我记得有两种一个是df一个是d1/f用哪个更合理？…或者就用能量？」
 *  →「both yes」→「not discrete bands, but perhaps power per octave?」「for band how many bands? if it is only three bars it beats the propose of a spectrum」。 */
export function bandsDb(x: Float32Array, sr: number): Float32Array {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  let wsum = 0, w2 = 0; for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); re[i] = x[i] * w; wsum += w; w2 += w * w; }   // 汉宁窗
  fft(re, im);
  const out = new Float32Array(SPEC_BANDS).fill(-120), binHz = sr / n, norm = 2 / wsum, enbw = (n * w2) / (wsum * wsum), half = n / 2;   // 汉宁 ≈ 1.5 格
  const pw = (b: number) => { const m = Math.hypot(re[b], im[b]) * norm; return (m * m) / enbw; };
  const dens = (b: number) => (pw(b) * b * Math.LN2);   // 第 b 格摊开的每八度功率：功率 ÷（这一格宽几个八度 = binHz ÷ (f · ln2)，f = b · binHz）
  const span = Math.log2(SPEC_FMAX / SPEC_FMIN) / SPEC_BANDS;   // 一个点管几个八度
  for (let k = 0; k < SPEC_BANDS; k++) {
    const lo = SPEC_FMIN * (SPEC_FMAX / SPEC_FMIN) ** (k / SPEC_BANDS), hi = SPEC_FMIN * (SPEC_FMAX / SPEC_FMIN) ** ((k + 1) / SPEC_BANDS);
    let e = 0, any = false;
    for (let b = Math.max(1, Math.ceil(lo / binHz)); b < half && b * binHz < hi; b++) { e += pw(b); any = true; }
    let v: number;
    if (any) v = e / span;
    else {   // 比一格还窄：在两格之间按对数频率插（dB 里插）
      const fb = Math.sqrt(lo * hi) / binHz, b0 = Math.min(half - 2, Math.max(1, Math.floor(fb))), t = Math.log(Math.max(fb, 1) / b0) / Math.log((b0 + 1) / b0);
      const d0 = 10 * Math.log10(Math.max(1e-12, dens(b0))), d1 = 10 * Math.log10(Math.max(1e-12, dens(b0 + 1)));
      out[k] = d0 + (d1 - d0) * Math.min(1, Math.max(0, t)); continue;
    }
    out[k] = v > 1e-12 ? 10 * Math.log10(v) : -120;
  }
  return out;
}
/** 平滑：涨得快（直接到）、落得慢（每次最多落 fall dB）。 */
export function smoothBands(prev: Float32Array | undefined, next: Float32Array, fall = 6): Float32Array {
  if (!prev) return next;
  const o = new Float32Array(next.length); for (let k = 0; k < next.length; k++) o[k] = next[k] >= prev[k] ? next[k] : Math.max(next[k], prev[k] - fall);
  return o;
}
/** 96 个点 → SVG 填充面的 path（viewBox 0 0 100 100；dB 范围 [lo, hi] 映到 100 → 0）。每八度功率比以前「一格最大的」高约 10 dB（一个点管 0.094 个八度）：范围跟着往上挪。 */
export function areaPath(b: Float32Array, lo = -80, hi = 4): string {
  const y = (d: number) => (100 * (hi - Math.max(lo, Math.min(hi, d)))) / (hi - lo);
  let d = `M0,100`; for (let k = 0; k < b.length; k++) d += `L${((100 * (k + 0.5)) / b.length).toFixed(2)},${y(b[k]).toFixed(2)}`;
  return d + "L100,100Z";
}
