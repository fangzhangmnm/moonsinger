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
export const DASH_L = 1.0, DASH_W = 0.13, DASH_Y = DIGIT_MID, DASH_PITCH = 2.4, AUG_DX = 0.35, AUG_R = 0.14;
/** 小节线从哪画到哪（局部 y）、离列的 x 多远、占多宽；双线 / 终止线的间距和粗线。 */
export const BAR_Y0 = 0.75, BAR_Y1 = 3.55, BAR_DX = 0.5, BAR_THIN = 0.12, BAR_THICK = 0.4, BAR_GAP = 0.35, BAR_W_J = 1.2;
/** 数字行的行身（局部 y：上沿 / 下沿）= 小节线那一段。框架经过竖向锚点（geometry.ts jianpuAnchors）知道它，行距从这里往外算（layout-params.ts ROW_PARAMS）。 */
export const JP_BODY = { top: BAR_Y0, bottom: BAR_Y1 } as const;
/** 中途换调 / 换拍号写的字（「1=D」「3/4」）占多宽（sp，按字数估：这几个字都是半角）。 */
export const MID_TEXT_EM = 1.4, MID_TEXT_CH = 0.62;
/** 换气：音后面的「V」占多宽、「吸 / 深吸」小字占多宽（sp；量的时候留出来）。 */
export const BREATH_W = 0.35 + 0.9, INHALE_W = 2.2;
/** 和弦竖叠（第五刀 5-4；UX 稿第 7 节「只压高、不缩宽」）：数字之间留多少（sp）；数字本身多高（基线到上沿）；琶音的竖波浪往左占多宽。 */
export const CHORD_GAP = 0.25, DIGIT_H = BASE_Y - DIGIT_TOP, ARP_W = 0.9;
/** 和弦里每个数字的基线（局部 y）：dots = 每个音的八度点数（+ 高、− 低），从最低的音起；最低的那个在行的基线上，往上一个叠一个，
 *  间距 = 数字高 + 下面那个的高八度点 + 上面这个的低八度点 + CHORD_GAP（有点才让，没点贴紧 = 只压高）。真画的和弦、鬼音符共用这一个。 */
export function stackBases(dots: readonly number[]): number[] {
  const up = (d: number) => (d > 0 ? DOT_GAP + 2 * DOT_R + (d - 1) * DOT_STEP : 0), down = (d: number) => (d < 0 ? DOT_GAP + 2 * DOT_R + (-d - 1) * DOT_STEP : 0);
  const out: number[] = [];
  dots.forEach((d, k) => { out.push(k === 0 ? BASE_Y : out[k - 1]! - DIGIT_H - up(dots[k - 1]!) - down(d) - CHORD_GAP); });
  return out;
}
/** 光标在数字行上从哪画到哪（局部 y）。 */
export const CARET_Y0 = 0.6, CARET_Y1 = 3.9;

/** 一个实心小圆点（四段三次贝塞尔；PDF 认 M / C / Z）。cx / cy / r 都是 px。 */
export const dotPath = (cx: number, cy: number, r: number): string => {
  const k = 0.5523 * r, f = (v: number) => (Math.round(v * 100) / 100).toString();
  return `M${f(cx + r)},${f(cy)}C${f(cx + r)},${f(cy + k)} ${f(cx + k)},${f(cy + r)} ${f(cx)},${f(cy + r)}C${f(cx - k)},${f(cy + r)} ${f(cx - r)},${f(cy + k)} ${f(cx - r)},${f(cy)}C${f(cx - r)},${f(cy - k)} ${f(cx - k)},${f(cy - r)} ${f(cx)},${f(cy - r)}C${f(cx + k)},${f(cy - r)} ${f(cx + r)},${f(cy - k)} ${f(cx + r)},${f(cy)}Z`;
};
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export const accText = (rel: number): string => (rel > 0 ? "♯".repeat(rel) : rel < 0 ? "♭".repeat(-rel) : "♮");
