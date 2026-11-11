export type PaperKind = "A3L" | "A4" | "A5" | "A6";
/** density = 版式两档：舒适（默认）/ 紧凑（谱小一号、行距 / 谱距 / 歌词距都收紧、没歌词的声部不留歌词位）——2026-10-08 user「排版引擎还是要支持小字号。不然的话交响总谱的话A3也承重不了吧」
 *  →「比起字号，就一个舒适一个紧凑两个选项？然后紧凑你可以多帮我优化一些，包括字号，行距之类的」。
 *  staffMm = 五线谱高（四个线间距）mm：别的软件的文件带的大小原样留着；自家只按 density 定（没有 = 舒适 7 / 紧凑 5）。 */
export type Density = "cozy" | "compact";
export interface Paper {
    kind: PaperKind | "other";
    widthMm: number;
    heightMm: number;
    marginMm: {
        l: number;
        r: number;
        t: number;
        b: number;
    };
    density?: Density;
    staffMm?: number;
}
/** 五线谱高（四个线间距）mm：7 mm = 一个线间距 1.75 mm（打谱软件的常用大小）= 舒适档；紧凑 5 mm。 */
export declare const STAFF_MM = 7, STAFF_MM_COMPACT = 5;
export declare const DENSITIES: {
    id: Density;
    label: string;
    note: string;
}[];
export declare const densityOf: (p: Paper) => Density;
export declare const staffMmOf: (p: Paper) => number;
/** 一个线间距 mm（按这张纸的谱大小）。 */
export declare const spMm: (p: Paper) => number;
/** 字的尺子比谱的尺子大多少（刀 2，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §3）：舒适 = 1，紧凑 = 7 / 5 = 1.4——
 *  紧凑只把五线谱缩小，字（歌名、声部名、歌词、速度字…）和编辑器的钮还是舒适档那么大（user 11-08「舒适和紧凑，能不能只改变谱的大小…文字的大小，还是原来那么大」）。
 *  屏幕（score-view geo）、PDF（score-pdf printOpts）、排版 worker 量字都用它，三处一起改，不然断行不一样。 */
export declare const textScaleOf: (p: Paper) => number;
export declare const PAPER_KINDS: PaperKind[];
export declare const DEFAULT_PAPER: PaperKind;
/** 档名后面的一句话（纸的设置面板里）。 */
export declare const PAPER_NOTE: Record<PaperKind, string>;
export declare const PAPER_LABEL: Record<PaperKind, string>;
export declare function paperOf(kind: PaperKind, density?: Density): Paper;
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
/** 按页面尺寸认档：差 2 mm 内算同一档（边距照文件里的）；都不是 = other（原样保留）。
 *  density 照文件里的 staff-distance 认（musicxml.ts）；谱的大小正好是那一档的就不另记 staffMm，别的大小（别的软件的）原样记下来。 */
export declare function detectPaper(widthMm: number, heightMm: number, marginMm: Paper["marginMm"], staffMm?: number, density?: Density): Paper;
/** 「其他」纸的样子：「216 × 279 mm」。 */
export declare const paperSizeText: (p: Paper) => string;
