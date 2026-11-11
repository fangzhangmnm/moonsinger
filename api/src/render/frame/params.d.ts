import type { Density } from "../../score/paper.ts";
export declare const SCROLL_TAIL = 6;
/** 谱前简写那一列的宽度参照（7 个半角宽 = part-colors.ts ABBR_W）。 */
export declare const ABBR_REF = "Vln.Vc.";
export declare const NAME_MAX = 6.5;
export declare const NAME_MIN: number;
export declare const SQUEEZE = 0.15;
/** 防抖：行的上下留白、歌词基线往下让，超出版式最小值的那一截按这么多线间距一格往上取（刀 4b 之后，user 11-09）。 */
export declare const ROW_STEP = 1;
export declare const MARGIN = 1.2, BAR_W = 1.6, TITLE_H = 5.4;
export declare const PAPER_H = 3.4, PAPER_GAP = 1.6;
/** 纸上的小控件（不印）：在自己那一条里尽量大（2026-10-10 user「纸张上的小控件既然打印的时候不显示。在不影响点击和排版的时候为什么不做大一点，好点」）——
 *  高 = 曲段名那一条（3.4）减上下各 0.2；字放大；那一条本身不变高（排版 / 分页 / PDF 都不动）。 */
export declare const CTL_H = 3;
/** 版式（sp）：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、行与行之间不留、没歌词的那条谱更矮。 */
export declare const SPACING: Record<Density, {
    staffAbove: number;
    rowH: number;
    rowHNoLyric: number;
    graveUpper: number;
    lyricBelow: number;
    sysGap: number;
}>;
