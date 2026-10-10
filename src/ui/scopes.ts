// scopes.ts —— 混音台「基础」页总轨 / 混音轨卡片背景的李萨如图（立体声相位表）+ 左右相关（v0.10.16）。纯函数。
// created 2026-10-10 by Claude Opus 5.5（user「声像对应的是莉萨如图吗？」「三个页同意」「记得我说的省cpu，只有看见的时候才进行统计和绘制」）
// 坐标（照相位表的老规矩）：竖 = 中 (L+R)/√2（往上）、横 = (R−L)/√2（只有左声道 = 左上那条斜线、只有右 = 右上）；单声道 = 一根竖线，越宽越圆，反相 = 横线。

/** 画多少个点（隔几个采样取一个）。连成圆滑的线（v0.10.17；user「李萨如图既然采样率就是个笑话，用散点？」→「还是用线不要用散点，就是能让线看起来圆润一点吗」：
 *  原来隔 4 个取一个、直线连 = 一堆没意义的尖刺；现在隔 2 个取一个、过相邻两点中点的二次曲线连）。 */
export const SCOPE_POINTS = 512;
/** 比这还小的帧不放大（静音 / 尾巴不被放大成一团噪声）：按这个当满格的下限。 */
const FLOOR = 0.05;

/** 一帧左右采样 → SVG path（viewBox -1 -1 2 2；过中点的二次曲线 = 圆滑的线）+ 左右相关（−1…+1；几乎没声 = null）。 */
export function stereoShape(L: Float32Array, R: Float32Array): { path: string; corr: number | null } {
  const n = Math.min(L.length, R.length);
  let lr = 0, ll = 0, rr = 0, pk = 0;
  for (let i = 0; i < n; i++) { const l = L[i], r = R[i]; lr += l * r; ll += l * l; rr += r * r; const m = Math.abs(l + r), s = Math.abs(l - r); if (m > pk) pk = m; if (s > pk) pk = s; }
  pk *= Math.SQRT1_2;
  const corr = ll > 1e-9 && rr > 1e-9 ? Math.max(-1, Math.min(1, lr / Math.sqrt(ll * rr))) : ll + rr > 1e-9 ? 0 : null;   // 只有一边有声 = 0
  const k = 0.9 / Math.max(pk, FLOOR), step = Math.max(1, Math.floor(n / SCOPE_POINTS));
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i += step) { xs.push((R[i] - L[i]) * Math.SQRT1_2 * k); ys.push(-(L[i] + R[i]) * Math.SQRT1_2 * k); }
  const f = (v: number) => v.toFixed(3), m = xs.length;
  if (m < 2) return { path: m ? `M${f(xs[0])},${f(ys[0])}` : "", corr };
  // 中点平滑：从第一段的中点起，每个采样点当控制点、到下一段的中点
  let d = `M${f(xs[0])},${f(ys[0])}L${f((xs[0] + xs[1]) / 2)},${f((ys[0] + ys[1]) / 2)}`;
  for (let i = 1; i < m - 1; i++) d += `Q${f(xs[i])},${f(ys[i])} ${f((xs[i] + xs[i + 1]) / 2)},${f((ys[i] + ys[i + 1]) / 2)}`;
  d += `L${f(xs[m - 1])},${f(ys[m - 1])}`;
  return { path: d, corr };
}
