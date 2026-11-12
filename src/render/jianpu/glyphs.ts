// glyphs.ts —— 简谱数字行的字形尺寸（sp；设计稿第 3.8 节「数字的宽高进表，不现场量」——现场量的只有歌词和名字）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。
//   竖向：和五线谱同一个行框（局部 y：0 = 上沿、4 = 下沿），框架的行距 / 歌词 / 天际线不用分谱种；数字竖着居中在框里。
//   好不好看 AI 不判断（施工单第三节「4」验收）。
//   **第五刀起比例照样张**（统筹转达 user 11-11「这个旧版本就蛮舒服，不知道能不能对齐这个」；施工单第五节「简谱的样子以当时的样张为准」）：
//   数字字号 = 1 个「字号」（FS）= 2.5 个这里的单位；下面每个数后面写的「FS」是样张脚本（私有实验仓里的一次性原型，字号 22 px；施工单第五节有出处）里那个数
//   换算成字号的几倍——只照搬数，不引用、不抄那份脚本。样张里没有的（和弦、鼓、和弦名、合租）照 UX 稿和裁定，比例跟着字号走。
/** 字号 → 这里的单位（FS 换算用）。 */
const FS = 2.5;

/** 数字的字号（sp）和占多宽（样张 0.62 FS）。 */
export const DIGIT_EM = FS, DIGIT_W = 0.62 * FS;
/** 数字的基线、上沿、中线（局部 y）。 */
export const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在基线下 0.27 FS、条与条之间 0.18 FS、粗 0.059 FS（样张）；八度点：半径 0.082 FS、高八度的点中心在基线上 0.9 FS、点与点之间 0.227 FS（样张）。 */
export const UL_Y0 = BASE_Y + 0.273 * FS, UL_GAP = 0.18 * FS, UL_W = 0.059 * FS, DOT_R = 0.082 * FS, DOT_GAP = DIGIT_TOP - (BASE_Y - 0.9 * FS) - 0.082 * FS, DOT_STEP = 0.227 * FS;
/** 低八度的点（样张）：最下面那个数字的，第一个点中心在下划线（没有下划线也照这个位置）再往下 0.27 FS、每多一层下划线再往下一层；叠在上面的数字的，贴着它自己的基线往下 0.27 FS。 */
export const lowDotY = (nUL: number, j: number): number => UL_Y0 + 0.273 * FS + nUL * UL_GAP + j * DOT_STEP;
export const LOW_DOT_UNDER = 0.273 * FS;
/** 升降号（挂在数字左上）：字号 0.59 FS、中心离数字中心往左 0.465 FS、基线在数字基线上 0.364 FS；占多宽（光标让开它，样张这一列多 0.41 FS）。 */
export const ACC_EM = 0.59 * FS, ACC_DX = 0.465 * FS, ACC_Y = BASE_Y - 0.364 * FS, ACC_W = 0.41 * FS;
/** 增时线（长音的「–」）：长 0.545 FS、粗 0.073 FS、在基线上 0.32 FS（样张）；两条之间至少隔一列的最小宽（样张 0.756 FS；放得开时一拍一条，按这一列的宽分）。附点：中心离数字中心 0.5 FS、半径 0.091 FS、在基线上 0.3 FS（样张）。 */
export const DASH_L = 0.545 * FS, DASH_W = 0.073 * FS, DASH_Y = BASE_Y - 0.32 * FS, DASH_PITCH = 0.756 * FS, AUG_R = 0.091 * FS, AUG_DX = 0.8 * 0.62 * FS - 0.31 * FS - 0.091 * FS, AUG_Y = BASE_Y - 0.3 * FS;
/** 一列至少多宽（样张：四分 / 八分 = 数字宽 + 一点缝 = 0.756 FS；十六分及更短 = 0.49 FS「短音只占字宽：密的声部自己挤紧」）。 */
export const COL_MIN = 0.756 * FS, COL_MIN_SHORT = 0.492 * FS;
/** 小节线从哪画到哪（局部 y；样张：从基线上 1.82 FS 到基线下 1.0 FS——上头到力度道下面、下头到歌词上面）、离列的 x 多远、占多宽；双线 / 终止线的间距和粗线。 */
export const BAR_Y0 = BASE_Y - 1.82 * FS, BAR_Y1 = BASE_Y + 1.0 * FS, BAR_DX = 0.5, BAR_THIN = 0.12, BAR_THICK = 0.4, BAR_GAP = 0.35, BAR_W_J = 0.36 * FS;   // 小节线那一列（样张：每小节后面 0.36 FS，线在正中）
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
/** 鼓的 X 行：大写 X 比数字宽，字号按这个比例收到和数字一样宽（不然十六分的一串 X 挨在一起）；幽灵音的小 x 照数字的小号。 */
export const X_EM = 0.8;   // 样张：鼓的 X = 0.8 倍数字
/** 整套鼓的 X 行（统筹看第五刀样张后定的，先顶上的写法）：每一下按五线鼓谱同一张表（src/gm/percussion.gen.ts 的符头种类）换字——
 *  普通符头（底鼓、军鼓、通鼓）= ●、× 符头（镲、踩镲）= ×、圈 × = ⊗、菱形 = ◇、三角 = △ / ▽、方块（la）= □、加号 = +、斜杠 = /、带斜杠的 = ⊘；表里没有的 = ●。
 *  只有一件鼓的行照旧一律 X（行首的名字已经说了是哪件）。这几个字在 PDF 那款字（思源黑体）里都是满一个字宽，字号按 KIT_EM 收到和数字差不多宽。 */
export const KIT_CHAR: Readonly<Record<string, string>> = { normal: "●", x: "×", "circle-x": "⊗", diamond: "◇", "triangle-up": "△", "triangle-down": "▽", ti: "▽", la: "□", plus: "+", slash: "/", slashed1: "⊘", slashed2: "⊘" };
export const KIT_EM = 0.62;   // 数字字号的几倍（字是满宽的：宽 ≈ 数字宽）
/** 叠着的和弦折成的和弦名（第五刀 5-4，UX 稿第 7 节「和弦名用窄字、按实际宽度占位」）：字号（sp，数字原大起）、横向压到几成；每个字占多宽（em，写死的表，不现场量；
 *  表里没有的数字 0.56、别的 0.6）。名字的高（基线往上）。
 *  ♭ ♯ 照 PDF 那款字（vendor/fonts/sans.ttf = 思源黑体 / Noto Sans SC）的前进宽量过一次进表 = 满一个字宽（统筹看样张 ⑨：原来估 0.5 / 0.58，「B♭」带附点时点挤；test/jianpu.test.ts 拿真字体核着）。 */
export const CHORD_EM = 2.0, CHORD_SX = 0.82, CHORD_H = 1.45;
export const CHORD_CH_EM: Readonly<Record<string, number>> = { A: 0.66, B: 0.64, C: 0.66, D: 0.7, E: 0.58, F: 0.55, G: 0.7, m: 0.86, a: 0.55, j: 0.26, d: 0.58, i: 0.25, u: 0.57, g: 0.58, s: 0.48, "/": 0.36, "♭": 1.0, "♯": 1.0, "°": 0.4, ø: 0.6, "(": 0.32, ")": 0.32, "+": 0.6 };
/** 这个和弦名在数字行上占多宽（sp，数字原大起；乘行里的比例才是这一行的）。 */
export const chordNameW = (s: string): number => [...s].reduce((w, ch) => w + (CHORD_CH_EM[ch] ?? (/[0-9]/.test(ch) ? 0.56 : 0.6)), 0) * CHORD_EM * CHORD_SX;
/** 有歧义的小三角（名字右下角，编辑器里）占多宽（sp，数字原大起；量的时候也让出来，不然挨着下一个名字）。 */
export const CHORD_AMB_W = 0.55;
/** 最低音那个字母的中心离名字左边多远（sp，数字原大起）：有斜杠 = 斜杠后面那个字母（转位的最低音），没有 = 第一个字母（根音就是最低音）。八度点标在它上下。 */
export const chordBassCx = (s: string): number => { const cs = [...s], i = cs.indexOf("/") + 1; return chordNameW(cs.slice(0, i).join("")) + chordNameW(cs[i] ?? "") / 2; };
/** 数字上方的记号（样张）：第一个记号离数字（和高八度点）的上沿 0.545 FS；顿音 = 实心窄楔形 宽 0.19 FS、高 0.27 FS，占 0.41 FS；
 *  重音 / 次重音 = 描边的 >（宽 0.455 FS、高 0.364 FS，重音描边 0.068 FS、次重音 0.032 FS），占 0.545 FS；保持 = 短横（长 0.455 FS、粗 0.064 FS），占 0.364 FS；
 *  换气 V = 0.5 FS 的字，在基线上 1.09 FS。 */
export const TEN_DY = 0.136 * FS, MARK_GAP2 = 0.12 * FS, MARCATO_EM = 1.38 * FS, UNSTRESS_EM = 1.82 * FS;   // 保持离第一条线多远；帽子贴在顿音 / 保持上面时的缝；强音 / 弱化（Bravura 字形）的字号
export const MARK_GAP = 0.545 * FS, STACC_W = 0.19 * FS, STACC_H = 0.27 * FS, STACC_STEP = 0.41 * FS, CHEV_W = 0.455 * FS, CHEV_H = 0.364 * FS, CHEV_STROKE = 0.068 * FS, CHEV_STROKE_THIN = 0.032 * FS, CHEV_STEP = 0.545 * FS, TEN_L = 0.455 * FS, TEN_W = 0.064 * FS, TEN_STEP = 0.364 * FS, BREATH_EM = 0.5 * FS, BREATH_Y = BASE_Y - 1.09 * FS;
/** 谱头那一行（「1=C 3/4」）的字号（样张 0.773 FS，常规粗细）。 */
export const HEAD_EM = 0.773 * FS;
/** 幽灵音（演奏法）= 小字：样张 0.62 倍的数字。 */
export const GHOST_K = 0.62;
/** 光标在数字行上从哪画到哪（局部 y）：盖住行身（小节线那一段）再出一点。 */
export const CARET_Y0 = BAR_Y0 - 0.15, CARET_Y1 = BAR_Y1 + 0.15;

/** 一个实心小圆点（四段三次贝塞尔；PDF 认 M / C / Z）。cx / cy / r 都是 px。 */
export const dotPath = (cx: number, cy: number, r: number): string => {
  const k = 0.5523 * r, f = (v: number) => (Math.round(v * 100) / 100).toString();
  return `M${f(cx + r)},${f(cy)}C${f(cx + r)},${f(cy + k)} ${f(cx + k)},${f(cy + r)} ${f(cx)},${f(cy + r)}C${f(cx - k)},${f(cy + r)} ${f(cx - r)},${f(cy + k)} ${f(cx - r)},${f(cy)}C${f(cx - r)},${f(cy - k)} ${f(cx - k)},${f(cy - r)} ${f(cx)},${f(cy - r)}C${f(cx + k)},${f(cy - r)} ${f(cx + r)},${f(cy - k)} ${f(cx + r)},${f(cy)}Z`;
};
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export const accText = (rel: number): string => (rel > 0 ? "♯".repeat(rel) : rel < 0 ? "♭".repeat(-rel) : "♮");
