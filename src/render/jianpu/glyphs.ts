// glyphs.ts —— 简谱数字行的字形尺寸（sp；设计稿第 3.8 节「数字的宽高进表，不现场量」——现场量的只有歌词和名字）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。
//   竖向：和五线谱同一个行框（局部 y：0 = 上沿、4 = 下沿），框架的行距 / 歌词 / 天际线不用分谱种；数字竖着居中在框里。
//   好不好看 AI 不判断（施工单第三节「4」验收）。
//   **第五刀起比例照样张**（统筹转达 user 11-11「这个旧版本就蛮舒服，不知道能不能对齐这个」；施工单第五节「简谱的样子以当时的样张为准」）：
//   数字字号 = 1 个「字号」（FS）= 2.5 个这里的单位；下面每个数后面写的「FS」是样张脚本（私有实验仓里的一次性原型，字号 22 px；施工单第五节有出处）里那个数
//   换算成字号的几倍——只照搬数，不引用、不抄那份脚本。样张里没有的（和弦、鼓、和弦名、合租）照 UX 稿和裁定，比例跟着字号走。
/** 字号 → 这里的单位（FS 换算用）。 */
import { STEM_REGULAR, SMALL_STEM_K } from "../text/index.ts";
import { shownOctave } from "../../score/pitch.ts";
const FS = 2.5;

/** 数字的字号（sp）和占多宽（样张 0.62 FS）。 */
export const DIGIT_EM = FS, DIGIT_W = 0.62 * FS;
/** 数字的基线、上沿、中线（局部 y）。 */
export const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在基线下 0.27 FS、条与条之间 0.18 FS、粗 0.059 FS（样张）；八度点：半径 0.082 FS、高八度的点中心在基线上 0.9 FS、点与点之间 0.227 FS（样张）。 */
export const UL_Y0 = BASE_Y + 0.273 * FS, UL_GAP = 0.18 * FS, UL_W = 0.059 * FS, DOT_R = 0.082 * FS, DOT_GAP = DIGIT_TOP - (BASE_Y - 0.9 * FS) - 0.082 * FS, DOT_STEP = 0.227 * FS;
/** 低八度的点（7-D，user「为什么最下面一个点间距这么开」「有下划线的时候点更低」）：和高八度的点对称——没有下划线 = 贴着数字的底（间隙 DOT_GAP，和高八度的点离数字顶一样）；
 *  有下划线 = 贴着最下面一条下划线的底（同样的间隙）。原来照样张脚本：先给下划线留位置、点放在留的位置下面（没下划线时在基线下 0.55 FS、有下划线再往下），
 *  样张本身的数偏大，app 照抄了。叠在上面的数字（和弦里不是最低的那几个）没有下划线：贴着自己的基线往下。 */
export const lowDotY = (nUL: number, j: number): number => (nUL ? UL_Y0 + (nUL - 1) * UL_GAP + UL_W / 2 : BASE_Y) + DOT_GAP + DOT_R + j * DOT_STEP;
export const LOW_DOT_UNDER = DOT_GAP + DOT_R;
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
export const BREATH_W = 0.35 + 0.9;
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
/** 升降号 / 还原号的字形（7-P，user 11-12「b太细了…记得latex的上下标的处理方法」；统筹定：不用文字字体的 ♭，改用乐谱字体 Bravura 的——按谱面的粗细设计的）。
 *  码位 + 墨迹框 [左, 右, 上, 下]（字号 4 时的线间距）：抄自 src/render/glyph-box.gen.ts（数字行不许 import 那个文件，结构守卫；test/jianpu.test.ts 核着两边一样）。 */
/** dom = 主笔画（这个字形最粗的那一笔）有多粗（字号的倍数；vendor/fonts/bravura/outlines.json 的轮廓用扫描线量的：♭ = 肚子右边那一笔、♮ ♯ = 两道斜横；
 *  test/jianpu.test.ts 拿轮廓核着）。缩到实际字号之后不够「主字竖笔 × 0.9」就描边补（accStroke；统筹 11-12：升降号也按小字补粗那条规矩逐个字形算）。 */
export const ACC_GLYPH = {
  flat: { ch: "\u{E260}", box: [0, 0.904, -1.756, 0.7], dom: 0.062 }, natural: { ch: "\u{E261}", box: [0, 0.672, -1.364, 1.34], dom: 0.105 }, sharp: { ch: "\u{E262}", box: [0, 0.996, -1.4, 1.392], dom: 0.09 },
} as const satisfies Record<string, { ch: string; box: readonly [number, number, number, number]; dom: number }>;
/** 升降号这一家（降、重降、还原、升、重升）的补粗规矩（7-P 补，统筹 11-12 定 B，写成规矩不只给 ♭ 开一个数）：
 *  ① 同一家先彼此看齐：主笔画都补到这一家的参照粗细 ACC_FAMILY_DOM——取 ♯ 的 0.09（改前图里 ♮ ♯ 的轻重是对的，取 ♮ 的 0.105 会把 ♯ 也描粗；♮ 本来就更粗，不动）。
 *  ② 看齐之后整家再和主字比：参照粗细缩到实际字号后明显轻于「主字竖笔 × 0.9」（不到它的 FAMILY_LIGHT）才一起补，补到那条线为止；数字行、谱头、字母谱角标现在都不用补（♯ 约是线的 85%–89%）。
 *  字号的几成（描边两边各长一半，所以补的就是差多少）；主字竖笔 = vendor 那款黑体「I」量的（src/look/text.ts STEM_REGULAR），同小字补粗。 */
export const ACC_FAMILY_DOM = ACC_GLYPH.sharp.dom, FAMILY_LIGHT = 0.8;
export const accStroke = (g: { dom: number }, em: number, main: number): number => {
  const align = Math.max(0, ACC_FAMILY_DOM - g.dom), target = SMALL_STEM_K * STEM_REGULAR * main, fam = ACC_FAMILY_DOM * em;
  return align + (fam < FAMILY_LIGHT * target ? (target - fam) / em : 0);
};
/** 数字行上升降号的字号（字形的 size，数字行的单位）：照样张的大小——♭ 的高（含下伸）约等于原来文字 ♭ 的高（0.59 字号的字）。 */
export const ACC_GLYPH_EM = 0.78 * FS;
/** 升降号的顶比它那个数字的顶高多少（样张：文字 ♭ 原来就略高出数字顶）。几个升降号之间的缝。 */
export const ACC_RISE = 0.2, ACC_SEP = 0.08;
/** 相对调内音的升降（+ 升 / − 降 / 0 还原）→ 一串字形（双升 / 双降 = 两个，同简谱老写法逐个写）。 */
export const accGlyphs = (rel: number): (typeof ACC_GLYPH)[keyof typeof ACC_GLYPH][] => (rel > 0 ? Array(rel).fill(ACC_GLYPH.sharp) : rel < 0 ? Array(-rel).fill(ACC_GLYPH.flat) : [ACC_GLYPH.natural]);
/** 字母谱角标里的升降号（写成 ♯ / ♭ 的字）→ 字形。 */
export const accGlyphsOfText = (t: string): (typeof ACC_GLYPH)[keyof typeof ACC_GLYPH][] => [...t].map((c) => (c === "♯" ? ACC_GLYPH.sharp : c === "♭" ? ACC_GLYPH.flat : ACC_GLYPH.natural));
/** 一串升降号字形占多宽（数字行的单位；em = 字号）。 */
export const accRunW = (gs: readonly { box: readonly number[] }[], em: number): number => gs.reduce((w, g, i) => w + ((g.box[1]! - g.box[0]!) * em) / 4 + (i ? ACC_SEP : 0), 0);
/** 字母谱右上角升降号的字号：照数字行的升降号按角标的字号折算（角标 = 字母的 SCRIPT_K 倍，原来文字 ♭ 的字号 = 角标字号），再收到 SUP_ACC_FIT——
 *  Bravura 的 ♯ 比文字 ♯ 往下伸得多，按比例的大小会碰到右下角的八度数字（不相撞检查抓到的）。 */
export const SUP_ACC_FIT = 0.88;
export const supAccEm = (gk = 1): number => (ACC_GLYPH_EM * (SCRIPT_K * DIGIT_EM * gk) * SUP_ACC_FIT) / ACC_EM;
/** 谱头那一行、中途换调 / 换拍号写的字：每个字的前进宽（字号的倍数；vendor 那款字 Noto Sans SC 量的，test/jianpu.test.ts 核着）。第八刀 8-4：宽从字形算，不按字数估。 */
export const HEAD_CH_EM: Readonly<Record<string, number>> = { "0": 0.555, "1": 0.555, "2": 0.555, "3": 0.555, "4": 0.555, "5": 0.555, "6": 0.555, "7": 0.555, "8": 0.555, "9": 0.555, "=": 0.555, "/": 0.392, A: 0.608, B: 0.657, C: 0.638, D: 0.688, E: 0.589, F: 0.552, G: 0.689 };
/** 这串字在这个字号下多宽（同字号的单位）；表里没有的字按 0.6。 */
export const headTextW = (s: string, size: number): number => [...s].reduce((w, c) => w + (HEAD_CH_EM[c] ?? 0.6), 0) * size;
/** 数字行上的字的墨迹框（第八刀守卫 2：盒子报的边 = 真墨迹）：[左, 下, 右, 上]（字号的倍数，y 往上为正、从基线算）+ 前进宽。
 *  vendor 那款字 Noto Sans SC 量的（test/jianpu-cells.test.ts 拿同一款字逐个核）。
 *  **墨和占位宽分开**（8-7，统筹 2026-11-12）：这张表是「墨」——贴身的东西贴它、不相撞看它、「4 倍」那条规矩量它；
 *  一个数字占多宽是另一回事（DIGIT_W、letterW，一律同宽、只定列宽，同样时值的一串数字再挤也等距），不从这张表来。 */
export const GLYPH_INK: Readonly<Record<string, readonly [number, number, number, number, number]>> = {
  "0": [0.05, -0.013, 0.506, 0.746, 0.555], "1": [0.088, 0, 0.49, 0.733, 0.555], "2": [0.04, 0, 0.505, 0.746, 0.555], "3": [0.029, -0.013, 0.499, 0.746, 0.555], "4": [0.02, 0, 0.524, 0.733, 0.555],
  "5": [0.027, -0.013, 0.502, 0.733, 0.555], "6": [0.056, -0.013, 0.512, 0.746, 0.555], "7": [0.049, 0, 0.508, 0.733, 0.555], "8": [0.046, -0.013, 0.509, 0.744, 0.555], "9": [0.044, -0.013, 0.501, 0.746, 0.555],
  A: [0.004, 0, 0.604, 0.733, 0.608], B: [0.101, 0, 0.612, 0.733, 0.657], C: [0.058, -0.013, 0.602, 0.746, 0.638], D: [0.101, 0, 0.629, 0.733, 0.688], E: [0.101, 0, 0.534, 0.733, 0.589],
  F: [0.101, 0, 0.523, 0.733, 0.552], G: [0.058, -0.013, 0.615, 0.746, 0.689], "-": [0.046, 0.245, 0.303, 0.315, 0.347],
  "×": [0.178, 0.054, 0.822, 0.698, 1], V: [0.001, 0, 0.575, 0.733, 0.575], X: [0.017, 0, 0.557, 0.733, 0.573], x: [0.015, 0, 0.483, 0.543, 0.498],
  "●": [0.05, -0.07, 0.95, 0.83, 1], "⊗": [0.13, 0.01, 0.87, 0.75, 1], "◇": [0.012, -0.108, 0.988, 0.868, 1], "△": [0.03, 0.012, 0.97, 0.826, 1], "▽": [0.03, -0.066, 0.97, 0.748, 1],
  "□": [0.1, -0.02, 0.9, 0.78, 1], "+": [0.038, 0.116, 0.518, 0.622, 0.555], "/": [0.011, -0.179, 0.377, 0.794, 0.392], "⊘": [0.13, 0.01, 0.87, 0.75, 1],
};
/** 一个字（表里的）画在 (x, y)（y = 基线）、字号 size、按 anchor 对齐时的墨迹框（局部：y 往下为正）。表里没有的 = 按数字算。 */
export function glyphInk(ch: string, x: number, y: number, size: number, anchor: "start" | "middle"): { x0: number; x1: number; y0: number; y1: number } {
  const g = GLYPH_INK[ch] ?? [0.03, 0, 0.525, DIGIT_H / DIGIT_EM, DIGIT_W / DIGIT_EM], ox = anchor === "middle" ? x - (g[4] * size) / 2 : x;
  return { x0: ox + g[0] * size, x1: ox + g[2] * size, y0: y - g[3] * size, y1: y - g[1] * size };
}
/** 一串字（表里的；字母谱右下角的八度数字「4」「10」「-1」）从 x 起往右写、基线 y、字号 size 时的墨迹框：一个字一个字按前进宽排，各自的墨并起来。 */
export function textInkRun(s: string, x: number, y: number, size: number): { x0: number; x1: number; y0: number; y1: number } {
  let cx = x, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const ch of s) { const k = glyphInk(ch, cx, y, size, "start"); x0 = Math.min(x0, k.x0); x1 = Math.max(x1, k.x1); y0 = Math.min(y0, k.y0); y1 = Math.max(y1, k.y1); cx += (GLYPH_INK[ch]?.[4] ?? DIGIT_W / DIGIT_EM) * size; }
  return { x0, x1, y0, y1 };
}
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export const accText = (rel: number): string => (rel > 0 ? "♯".repeat(rel) : rel < 0 ? "♭".repeat(-rel) : "♮");
/** 字母谱（7-B；user「下标放数字上标放升降号…我们只要保证用tracker的人能看懂就行了」）：大写字母，右上角挂升降号、右下角挂八度数字（中央 C 默认叫 C4，歌里可以改成 C3 / C5）。
 *  字母和简谱的数字同一款字同一个字号；角标 = 缩小的普通字形（字母的 SCRIPT_K 倍），不用 Unicode 的上下标字符。上标略高出字母顶、下标略低于基线（位置按数字字号 FS 算）。
 *  宽按思源黑体的前进宽算（不现场量）：一个音 = 字母 + 角标那一栏（升降号和数字取宽的）。 */
const LETTER_EM: Readonly<Record<string, number>> = { A: 0.608, B: 0.657, C: 0.638, D: 0.688, E: 0.589, F: 0.552, G: 0.689 };
export const letterW = (step: string): number => ((LETTER_EM[step] ?? 0.66) * DIGIT_W) / 0.555;
/** 角标多大（字母的几成）：7-L（user 11-12「数字可以大一点再靠的近一点，以及latex是不是subscript用优化可读性的小字了？」）从六成改成七成（LaTeX 下标 = 正文的七成）；
 *  笔画加粗照小字号专用字的思路做 = 样式表里上下标两种字是半粗（src/look/text.ts TEXT_STYLES 的 jp-letter-sup / jp-letter-sub，屏幕和 PDF 同一张表）。离字母多近（SCRIPT_GAP）等第八刀一起摆。 */
export const SCRIPT_K = 0.7, SCRIPT_GAP = 0.03 * FS;
/** 上标（升降号）的基线、下标（八度数字）的基线：离字母基线多远（数字行的单位；上 = 负）。 */
export const SUP_DY = -0.45 * FS, SUB_DY = 0.18 * FS;
/** 字母谱的行上，字母底下多让出的那一截（下标比基线低多少）：下划线、低处的东西照着往下让。 */
export const SUB_DROP = 0.2 * FS;
/** 上标比字母顶高出多少（和弦竖叠时上面那个字母让开它）：按上标的基线和字号算（字高 = 数字行的字高比例），不另写数（7-L 角标变大时原来写死的 0.15 FS 不够了）。 */
export const SUP_RISE = Math.max(0, -SUP_DY + SCRIPT_K * DIGIT_H - DIGIT_H);
/** 一个音的字母和两个角标：acc = 右上角（没有升降 = 空）、oct = 右下角的八度数字（写的八度 − 4 + 中央 C 叫 C 几）。 */
export const letterParts = (p: { step: string; alter: number; octave: number }, middleC: number): { letter: string; acc: string; oct: string } =>
  ({ letter: p.step, acc: p.alter > 0 ? "♯".repeat(p.alter) : p.alter < 0 ? "♭".repeat(-p.alter) : "", oct: String(shownOctave(p.octave, middleC)) });   // 八度数字走给人看的那一个出口（score/pitch.ts）
/** 角标那一栏多宽（升降号和数字取宽的；升降号照简谱升降号的宽 ACC_W 按字号折算）。 */
export const scriptW = (p: { step: string; alter: number; octave: number }, middleC: number): number => {
  const lp = letterParts(p, middleC); return SCRIPT_GAP + Math.max(lp.acc ? accRunW(accGlyphsOfText(lp.acc), supAccEm()) : 0, lp.oct.length * SCRIPT_K * DIGIT_W);   // 升降号按 Bravura 字形的宽（7-P）
};
/** 一个音（或竖着叠的几个）多宽（sp，数字原大起；叠着的取最宽的）。 */
export const letterNoteW = (ps: readonly { step: string; alter: number; octave: number }[], middleC: number): number => Math.max(...ps.map((p) => letterW(p.step) + scriptW(p, middleC)));
