import { type PaperKind, type Density, type Paper, type ReadPaper, type Margins } from "../score/paper.ts";
/** 五线谱高（四个线间距）mm：7 mm = 一个线间距 1.75 mm（打谱软件的常用大小）= 舒适档；紧凑 5 mm。 */
export declare const STAFF_MM = 7, STAFF_MM_COMPACT = 5;
/** 这一档的谱高。 */
export declare const staffMmFor: (d: Density) => number;
/** 这一种纸自己的边距（四边一样）。 */
export declare const marginsOf: (kind: PaperKind) => Margins;
/** 这一种纸的宽高（mm）。 */
export declare const sizeOf: (kind: PaperKind) => {
    w: number;
    h: number;
};
/** 一张这一种、这一档的纸（谱高 = 这一档的）。 */
export declare function paperOf(kind: PaperKind, density?: Density): Paper;
/** 一个线间距 mm（按这张纸的谱大小）。 */
export declare const spMm: (p: Paper) => number;
/** 字的尺子比谱的尺子大多少（刀 2，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §3）：舒适 = 1，紧凑 = 7 / 5 = 1.4——
 *  紧凑只把五线谱缩小，字（歌名、声部名、歌词、速度字…）和编辑器的钮还是舒适档那么大。屏幕（score-view geo）、PDF（score-pdf printOpts）、排版 worker 量字都用它，三处一起改，不然断行不一样。 */
export declare const textScaleOf: (p: Paper) => number;
/** 一行（版心）多宽，单位 = 线间距（谱越小一行放得越多）。 */
export declare const lineSp: (p: Paper) => number;
/** 分页排版的页面几何（单位 = 线间距）：页高 + 四边边距。分页预览和 PDF 共用（一处算，两边一样）。 */
export declare const pageGeoOf: (p: Paper) => {
    h: number;
    l: number;
    r: number;
    t: number;
    b: number;
};
/** 按页面尺寸认档（读文件的门口）：差 2 mm 内算同一档（边距照文件里的）；都不是 = other（原样保留）。
 *  density 照文件里的 staff-distance 认（musicxml.ts）；谱的大小正好是那一档的就不另记 staffMm，别的大小（别的软件的）原样记下来。 */
export declare function detectPaper(widthMm: number, heightMm: number, marginMm: Margins, staffMm?: number, density?: Density): ReadPaper;
/** 「其他」纸的样子：「216 × 279 mm」。 */
export declare const paperSizeText: (p: {
    widthMm: number;
    heightMm: number;
}) => string;
