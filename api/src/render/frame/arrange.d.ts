import { type SpItem, type SpOpts } from "../spacing.ts";
/** 一条轨报上来的一个条目（= 现在五线谱的一个排版单元）。items 里的 row 是这条轨自己的道号，框架加上这条轨的道基数。 */
export interface ColEntry<R = unknown> {
    tick: number;
    slot: number;
    /** 固定宽的一列（小节线、调号…）占多宽；音那一列不看它。 */
    w: number;
    bar?: boolean;
    /** 音 / 休止那一种（弹簧列）：items = 往左 / 往右占多宽、管多长；span = 这一段从 tick 起占多长（判断哪里能折行）。 */
    chunk?: {
        items: SpItem[];
        span: number;
    };
    ref: R;
}
export interface ArrangeTrack<R = unknown> {
    entries: ColEntry<R>[];
    laneBase: number;
}
/** 合成出来的一列：同一时刻、同一种东西、这条轨里同一种的第 n 个。members = 哪条轨的哪个条目（轨序 × 条目序）。 */
export interface MergedCol<R = unknown> {
    tick: number;
    slot: number;
    n: number;
    w: number;
    bar: boolean;
    chunk: boolean;
    members: {
        track: number;
        entry: ColEntry<R>;
    }[];
}
/** 合成列：一条轨里同一时刻同一种的第 n 个 = 第 n 列；按（时刻、先后、n）排。 */
export declare function mergeColumns<R>(tracks: readonly ArrangeTrack<R>[]): MergedCol<R>[];
export interface ArrangeOpts {
    paperLen: number;
    spacing: SpOpts;
    /** 一行最宽（sp）；Infinity = 横卷，不折行。 */
    width: number;
    /** 一行最多压紧多少（弹簧的比例）。 */
    squeeze: number;
    /** 一行最多拉宽到自然宽的几倍（排版参数表纸一级；Infinity = 不设上限、拉满 = 五线谱现在的样子）。到了上限就不再拉，右边空着（UX 稿第 8 节）。 */
    maxStretch: number;
    /** 一小节里一样长的音等距（顶杆顶开时整小节的弹簧一起放大，不只放大挨着的那一段；简谱 = 是，五线谱 = 否；排版参数表纸一级）。 */
    evenBars?: boolean;
    /** 最后一行很短时并进上一行（7-F；排版参数表 lastMerge）：没给 = 不并。 */
    lastMerge?: {
        short: number;
        squeeze: number;
    };
    /** 一行最后一列不是小节线时，行尾多留多少（sp）。 */
    endPad: number;
    /** 从第 k 列开一行，行首（名字一栏 + 各种行自己的行首）多宽（sp）；first = 这张纸第一行。 */
    lineStart: (k: number, first: boolean) => number;
}
/** 排好的：每行从第几列起、行首多宽；每一列的横坐标 / 宽 / 第几行（sp，下标同 cols）。 */
export interface Arranged {
    lineFrom: number[];
    sysStarts: number[];
    xs: number[];
    ws: number[];
    system: number[]; /** 最后一行很短、并进了上一行（7-F）。 */
    mergedLast?: true;
}
export declare function arrangeColumns<R>(cols: readonly MergedCol<R>[], tracks: readonly ArrangeTrack<R>[], o: ArrangeOpts): Arranged;
