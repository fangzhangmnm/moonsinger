export declare const SCROLL_TAIL = 6;
/** 谱前简写那一列的宽度参照（7 个半角宽 = part-colors.ts ABBR_W）。 */
export declare const ABBR_REF = "Vln.Vc.";
export declare const NAME_MAX = 6.5;
/** 防抖：行的上下留白、歌词基线往下让，超出版式最小值的那一截按这么多线间距一格往上取（刀 4b 之后，user 11-09）。 */
export declare const ROW_STEP = 1;
export declare const MARGIN = 1.2, BAR_W = 1.6, TITLE_H = 5.4;
export declare const PAPER_H = 3.4, PAPER_GAP = 1.6;
/** 纸上的小控件（不印）：在自己那一条里尽量大（2026-10-10 user「纸张上的小控件既然打印的时候不显示。在不影响点击和排版的时候为什么不做大一点，好点」）——
 *  高 = 曲段名那一条（3.4）减上下各 0.2；字放大；那一条本身不变高（排版 / 分页 / PDF 都不动）。 */
export declare const CTL_H = 3;
/** 一张纸几条谱左边连着的那根竖线多粗（sp；框架的家具，和谱种无关）= Bravura 细小节线 0.16 × 1.4（第四刀从 staff/glyphs.ts 挪来，数值逐位一样）。 */
export declare const SYSTEM_LINE_W: number;
/** 歌词离这一行左右边界至少多远（sp；7-E）：字的前进宽度（含字形自带的留白）不越过「边界往里这么多」。 */
export declare const LYRIC_EDGE = 0.25;
