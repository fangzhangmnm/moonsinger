// scopes.ts —— 混音台「基础」页总轨 / 混音轨卡片背景的李萨如图（立体声相位表）+ 左右相关（v0.10.16）。纯函数。
// created 2026-10-10 by Claude Opus 5.5（user「声像对应的是莉萨如图吗？」「三个页同意」「记得我说的省cpu，只有看见的时候才进行统计和绘制」）
// 刻度固定（对数半径：−48 dBFS 在中心、0 dBFS 在边上，不跟着自动放大；几张卡片之间能比大小）；坐标（照相位表的老规矩）：竖 = 中 (L+R)/√2（往上）、横 = (R−L)/√2（只有左声道 = 左上那条斜线、只有右 = 右上）；单声道 = 一根竖线，越宽越圆，反相 = 横线。

/** 画多少个点（隔几个采样取一个）。v0.10.41 起 = **散点**（user「顺便李萨如试一下散点」；对数半径之后再试一次）。
 *  历史：v0.10.17 user「李萨如图既然采样率就是个笑话，用散点？」→「还是用线不要用散点，就是能让线看起来圆润一点吗」= 过中点的二次曲线连（v0.10.17–40）。 */
export const SCOPE_POINTS = 512;
/** 固定的**对数半径**（v0.10.39；user「李萨如图目前的normalization下面太小了，可能0db是错误的」→ AI 提对数半径、user「试试，不知道这个是不是正确的李萨如，先试试」）：
 *  每个点的方向照旧（= 左右关系：竖 = 单声道、横 = 反相、左上 / 右上 = 只有左 / 右），离中心多远按分贝：FLOOR_DB（−48 dBFS）在中心、0 dBFS 在边上（0.9）。
 *  不自动放大（v0.10.25：停了以后尾巴被放大成一团）；几张卡之间照样能比大小，小声的轨也有形状。线性刻度（v0.10.25–38：满格 = 0 dBFS）一般轨道只占中间一小点。 */
const EDGE = 0.9, FLOOR_DB = 48, FS = Math.SQRT2;   // FS = 两边都满的单声道 (L+R)/√2 的长度 = 0 dBFS
const radius = (len: number): number => (len <= 0 ? 0 : (EDGE * Math.max(0, Math.min(1, (20 * Math.log10(len / FS) + FLOOR_DB) / FLOOR_DB))) / len);   // 乘到 (x, y) 上的倍数
/** 比这还小 = 当没声，不画（停了不留一个点）。 */
const SILENT = 1e-4;

/** 一帧左右采样 → SVG path（viewBox -1 -1 2 2；每个点一小截圆头的线 = 一个圆点）+ 左右相关（−1…+1；几乎没声 = null）。 */
export function stereoShape(L: Float32Array, R: Float32Array): { path: string; corr: number | null } {
  const n = Math.min(L.length, R.length);
  let lr = 0, ll = 0, rr = 0, pk = 0;
  for (let i = 0; i < n; i++) { const l = L[i], r = R[i]; lr += l * r; ll += l * l; rr += r * r; const m = Math.abs(l + r), s = Math.abs(l - r); if (m > pk) pk = m; if (s > pk) pk = s; }
  pk *= Math.SQRT1_2;
  const corr = ll > 1e-9 && rr > 1e-9 ? Math.max(-1, Math.min(1, lr / Math.sqrt(ll * rr))) : ll + rr > 1e-9 ? 0 : null;   // 只有一边有声 = 0
  if (pk < SILENT) return { path: "", corr };
  const step = Math.max(1, Math.floor(n / SCOPE_POINTS));
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i += step) { const x = (R[i] - L[i]) * Math.SQRT1_2, y = -(L[i] + R[i]) * Math.SQRT1_2, k = radius(Math.hypot(x, y)); xs.push(x * k); ys.push(y * k); }
  const f = (v: number) => v.toFixed(3);
  let d = ""; for (let i = 0; i < xs.length; i++) d += `M${f(xs[i])},${f(ys[i])}h.002`;   // 极短一截 + 圆头 = 点（不用 h0：零长的子路径有的浏览器不画）
  return { path: d, corr };
}
