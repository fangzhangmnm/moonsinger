/** 一列里某一行的一样东西。left / right = 从对齐线往左 / 往右占多宽（sp）。dur = 时值（tick）；没有 = 不算「正在响的音」（整小节休止：画在小节正中，不参加间距）。 */
export interface SpItem {
    row: number;
    left: number;
    right: number;
    dur?: number;
    /** 这一样东西的墨往右伸到哪（sp，从对齐线起；没写 = 不知道）：后一样要「离前面的墨至少多远」时用。 */
    inkR?: number;
    /** 离同一行前一样东西的墨至少多远（sp；第八刀，统筹定的规矩：左边挂了东西的音，前一个音的墨到这个挂件的空 ≥ 挂件到它自己那个音的空的 4 倍）。
     *  和普通的顶杆一起取大的（所以不会小于普通的最小音距），只在挨得最紧时起作用；前一样没报 inkR = 不起作用。 */
    clear?: number;
}
/** fixed = 固定宽的列（小节线 / 调号 / 拍号 / 行中谱号 / 句号）：到下一列正好这么宽，所有行都被它隔开。没有 fixed = 音列。
 *  fixed = 0（力度 / 渐强 / 风格 / 八度线 / 反复跳转 / 写字头这些不占宽的）= 透明：不顶任何东西、不隔开任何行，位置 = 后面那一列（和后面那个音对齐）。 */
export interface SpCol {
    tick: number;
    fixed?: number;
    items: SpItem[];
}
export interface SpOpts {
    /** 时值（tick）→ 这么长的一个音独占一列时该多宽（sp）。 */
    curve: (ticks: number) => number;
    /** 同一行前后两样东西之间至少留的缝（sp）。 */
    pad: number;
    /** 谁都没在响的一段（各行都是整小节休止）最宽给多少（sp）。 */
    emptyBar: number;
}
export interface Rod {
    from: number;
    to: number;
    min: number;
}
/** 顶杆按「顶到哪一列」分好（摆一行要反复用；rodsOf 的结果整串算一次、分一次）。 */
export interface RodIndex {
    into: Rod[][];
}
export declare function indexRods(rods: readonly Rod[], n: number): RodIndex;
export type SpacingMode = "loose" | "normal" | "tight";
/** 一条自己给的弹簧折线（时值 tick → 宽 sp；按时值从短到长）。简谱的纸用它（排版参数表纸一级，第五刀 5-0c）。 */
export type SpringPts = readonly (readonly [ticks: number, width: number])[];
/** 时值 → 宽（三档；true = 正常、false = 松，老写法）。连音 / 附点按实际时值落在折线上（八分三连音在八分和十六分之间）。 */
export declare const curveOf: (m: SpacingMode | boolean | SpringPts) => (ticks: number) => number;
/** cols 按时间排好（同一时刻的先后 = 画的先后）。endTick = 这一串最后到哪（这张纸的长度）。返回每一列到下一列的理想距离（最后一列 = 到结尾）。 */
export declare function idealGaps(cols: readonly SpCol[], endTick: number, o: SpOpts): number[];
export declare function rodsOf(cols: readonly SpCol[], o: SpOpts): Rod[];
/** 这一行的列（cols[from..to)）按拉伸量 s 摆：弹簧 ×(1 + s)，顶杆是下限。xs[i] = 第 from + i 列的对齐线离行首多远；end = 这一行内容的右端。
 *  gaps / rods 是整串算好的（idealGaps / rodsOf），这里只用落在这一行里的那几条。 */
export declare function placeLine(cols: readonly SpCol[], gaps: readonly number[], rods: readonly Rod[] | RodIndex, from: number, to: number, s: number, even?: boolean): {
    xs: number[];
    end: number;
};
/** 把这一行排进 width 宽：放得下 = 原样（justify 时拉到正好满）；超了 = 压，最多压 squeeze（弹簧的比例），还超 = over（调用方换行）。 */
export declare function fitLine(cols: readonly SpCol[], gaps: readonly number[], rods: readonly Rod[] | RodIndex, from: number, to: number, width: number, opt: {
    squeeze: number;
    justify: boolean;
    even?: boolean;
}): {
    xs: number[];
    end: number;
    stretch: number;
    over: boolean;
};
