// glyphs.ts —— 简谱数字行的字形尺寸（sp；设计稿第 3.8 节「数字的宽高进表，不现场量」——现场量的只有歌词和名字）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。
//   竖向：和五线谱同一个行框（局部 y：0 = 上沿、4 = 下沿），框架的行距 / 歌词 / 天际线不用分谱种；数字竖着居中在框里。
//   好不好看 AI 不判断（施工单第三节「4」验收）：这些数是第一版，样张交给 user 看过再调（第四刀的排版参数表收）。

/** 数字的字号（sp）和占多宽（等宽数字 ≈ 0.56 em）。 */
export const DIGIT_EM = 2.5, DIGIT_W = 1.4;
/** 数字的基线、上沿、中线（局部 y）。 */
export const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在哪、条与条之间、粗细；八度点的半径、和下划线 / 数字隔多远、点与点之间。 */
export const UL_Y0 = 3.35, UL_GAP = 0.3, UL_W = 0.11, DOT_R = 0.16, DOT_GAP = 0.3, DOT_STEP = 0.42;
/** 升降号（挂在数字左上）：字号、往左挪多少（中心离数字中心）、基线；占多宽（光标让开它）。 */
export const ACC_EM = 1.3, ACC_DX = 1.0, ACC_Y = 1.75, ACC_W = 0.95;
/** 增时线（长音的「–」）：长、粗、在哪个高度；两条之间至少隔多远（中心距）。附点：离数字右边多远、多大。 */
export const DASH_L = 1.0, DASH_W = 0.13, DASH_Y = DIGIT_MID, DASH_PITCH = 1.7, AUG_DX = 0.35, AUG_R = 0.14;
/** 小节线从哪画到哪（局部 y）、离列的 x 多远、占多宽；双线 / 终止线的间距和粗线。 */
export const BAR_Y0 = 0.75, BAR_Y1 = 3.55, BAR_DX = 0.5, BAR_THIN = 0.12, BAR_THICK = 0.4, BAR_GAP = 0.35, BAR_W_J = 1.2;
/** 中途换调 / 换拍号写的字（「1=D」「3/4」）占多宽（sp，按字数估：这几个字都是半角）。 */
export const MID_TEXT_EM = 1.4, MID_TEXT_CH = 0.62;
/** 光标在数字行上从哪画到哪（局部 y）。 */
export const CARET_Y0 = 0.6, CARET_Y1 = 3.9;

/** 一个实心小圆点（四段三次贝塞尔；PDF 认 M / C / Z）。cx / cy / r 都是 px。 */
export const dotPath = (cx: number, cy: number, r: number): string => {
  const k = 0.5523 * r, f = (v: number) => (Math.round(v * 100) / 100).toString();
  return `M${f(cx + r)},${f(cy)}C${f(cx + r)},${f(cy + k)} ${f(cx + k)},${f(cy + r)} ${f(cx)},${f(cy + r)}C${f(cx - k)},${f(cy + r)} ${f(cx - r)},${f(cy + k)} ${f(cx - r)},${f(cy)}C${f(cx - r)},${f(cy - k)} ${f(cx - k)},${f(cy - r)} ${f(cx)},${f(cy - r)}C${f(cx + k)},${f(cy - r)} ${f(cx + r)},${f(cy - k)} ${f(cx + r)},${f(cy)}Z`;
};
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export const accText = (rel: number): string => (rel > 0 ? "♯".repeat(rel) : rel < 0 ? "♭".repeat(-rel) : "♮");
