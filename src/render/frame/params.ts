// params.ts —— 排版框架自己的尺寸常数（sp）：边距、名字一栏、歌名 / 曲段名那一条、小控件、左边的竖线。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）
// > edited 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-5）：版式表 SPACING 和 SQUEEZE 搬去排版参数表 src/render/layout-params.ts
//   （纸一级按谱种、行一级按行的种类；参数表要知道有哪几种行，住在谱种表那一层，框架这一层不往上 import）。
export const SCROLL_TAIL = 6;
/** 谱前简写那一列的宽度参照（7 个半角宽 = part-colors.ts ABBR_W）。 */
export const ABBR_REF = "Vln.Vc.";   // sp：横卷每张纸内容后面留的尾巴
export const NAME_MAX = 6.5;   // sp：谱前声部名一列最宽（再长折行；engrave() 里 nameLines）
export const NAME_MIN = 3.0 * 2 + 0.4;   // 两颗钮 3.0（v0.16.33 起；改钮的大小要两处一起改）
// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
/** 防抖：行的上下留白、歌词基线往下让，超出版式最小值的那一截按这么多线间距一格往上取（刀 4b 之后，user 11-09）。 */
export const ROW_STEP = 1;
export const MARGIN = 1.2, BAR_W = 1.6, TITLE_H = 5.4;   // TITLE_H = 纸面最上面歌名那一条（v0.10.23：歌名放大了，这一条跟着高）
export const PAPER_H = 3.4, PAPER_GAP = 1.6;
/** 纸上的小控件（不印）：在自己那一条里尽量大（2026-10-10 user「纸张上的小控件既然打印的时候不显示。在不影响点击和排版的时候为什么不做大一点，好点」）——
 *  高 = 曲段名那一条（3.4）减上下各 0.2；字放大；那一条本身不变高（排版 / 分页 / PDF 都不动）。 */
export const CTL_H = 3.0;   // 曲段名那一条里纸上小控件的高（不印）
/** 一张纸几条谱左边连着的那根竖线多粗（sp；框架的家具，和谱种无关）= Bravura 细小节线 0.16 × 1.4（第四刀从 staff/glyphs.ts 挪来，数值逐位一样）。 */
export const SYSTEM_LINE_W = 0.16 * 1.4;
/** 歌词离这一行左右边界至少多远（sp；7-E）：字的前进宽度（含字形自带的留白）不越过「边界往里这么多」。 */
export const LYRIC_EDGE = 0.25;
