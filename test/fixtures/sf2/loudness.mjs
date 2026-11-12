// loudness.mjs —— 我们的引擎（vendor/tsf/tsf-standalone.wasm）按标准播放器对照表（scripts/fluidsynth-reference.py 出的）同一个量法量响度、对比。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）；施工单 9-4。test/sf-loudness.test.ts（仓里的子集）和 scripts/compare-fluidsynth.mjs（整包，手动跑）共用。
//   量法 = ITU-R BS.1770 的 K 加权（48 kHz 系数）+ 最大瞬时响度（400 ms 窗、100 ms 一跳），和对照脚本逐字一样；997 Hz 满幅正弦自检 = −3.01。
//   每个音一台新的播放器（sf_copy：共用采样、声音从零起），按住 2 秒不松，单声道。
export const SR = 48000;
const N = SR * 2;
function biquad(x, b0, b1, b2, a1, a2) { const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; }
export function maxMomentary(x) {
  const k = biquad(biquad(x, 1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585), 1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621);
  const W = Math.round(0.4 * SR), H = Math.round(0.1 * SR), c = new Float64Array(k.length + 1);
  for (let i = 0; i < k.length; i++) c[i + 1] = c[i] + k[i] * k[i];
  let best = -Infinity; for (let s = 0; s + W <= k.length; s += H) best = Math.max(best, -0.691 + 10 * Math.log10((c[s + W] - c[s]) / W + 1e-30));
  return best;
}
export function selfCheck() { const t = new Float64Array(SR); for (let i = 0; i < SR; i++) t[i] = Math.sin(2 * Math.PI * 997 * i / SR); return maxMomentary(t); }
/** 我们的引擎：一份 sf2 里一个预设、一个键、一个力度（1–127）的响度。tsf = instantiateTsf 的结果，handle = 载好的那一份。 */
export function ourLufs(tsf, handle, bank, program, key, vel) {
  const ex = tsf.ex, pi = ex.sf_preset_index(handle, bank, program);
  if (pi < 0) throw new Error(`没有这个预设 ${bank}:${program}`);
  const f = ex.sf_copy(handle), out = ex.malloc(N * 4); ex.sf_set_max_voices(f, 64);   // 拷出来的那一份没有声部（tsf_copy 不拷），先给
  ex.sf_note_on(f, pi, key, vel / 127); ex.sf_render(f, out, N);
  const a = Float64Array.from(new Float32Array(ex.memory.buffer, out, N)); ex.free(out); ex.sf_close(f);
  return maxMomentary(a);
}
const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** 对比：refCases = 对照表里一个文件的 cases，ours[i][j] = 第 i 件第 j 档我们量的。
 *  回每件：在全体里「mf 的响度 − 全体 mf 的中位数」两边差多少（pos），八档「相对 mf」两边差多少（rel，最大的那个）。 */
export function compare(refCases, ours, velocities) {
  const mfI = velocities.indexOf(80), refMed = median(refCases.map((c) => c.lufs[mfI])), ourMed = median(ours.map((r) => r[mfI]));
  return refCases.map((c, i) => {
    const pos = (ours[i][mfI] - ourMed) - (c.lufs[mfI] - refMed);
    const rels = velocities.map((_, j) => (ours[i][j] - ours[i][mfI]) - (c.lufs[j] - c.lufs[mfI]));
    return { label: c.label, bank: c.bank, program: c.program, key: c.key, pos, rels, rel: rels.reduce((m, d) => (Math.abs(d) > Math.abs(m) ? d : m), 0) };
  });
}
