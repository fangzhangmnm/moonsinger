import type { Chunk } from "../frame/units.ts";
import { type Cell } from "../frame/cell.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux } from "./chunk.ts";
export interface NoteCellIn {
    u: Chunk;
    q: JianpuTrack;
    mode: JianpuMode;
    aux?: JianpuAux;
    /** 这一处的调（级数按它算）和八度基准（draw.ts 按整条轨定的；没有 = 0）。 */
    fifths: number;
    base: number;
    /** 后面的横线 / 0 一拍多宽（数字行的单位）：画的时候按排完版之后占到的宽算；量的时候 = null（最少的 DASH_PITCH）。 */
    step: number | null;
    /** 这一段占到哪（数字行的单位，相对这一列）：换气的 V 不越过它（离它留一点），挤不下最多贴到离最后一个字形 0.1；量的时候不用给。 */
    limit?: number;
    /** 第一条下划线的中线（局部 y）：同一拍的一组先对齐到组里最低的核（8-3「成组的」）——画的时候 draw.ts 按组算好给；没给 = 按自己的核（量的时候）。 */
    ulY?: number;
    tok?: number;
    /** 演奏法的类名（台上那位不认的画灰）；量的时候不用给。 */
    artCls?: (a: string, base?: string) => string;
}
export interface NoteCellOut {
    cell: Cell;
    /** 第一个字形从哪起、中心、多宽（数字行的单位，相对这一列）。 */
    x0: number;
    cx: number;
    glyphW: number;
    /** 叠着的每个音：ps 里的下标、基线（点击框用）；最上面那个的基线。 */
    members: {
        i: number;
        yb: number;
    }[];
    hiBase: number;
    /** 画了数字的音（不是接着上一段的横线）：弧线要的上沿（局部 y）。 */
    top?: number;
    /** 盒子下边到哪（局部 y；含下划线、低八度点、滚奏）：连音的数字 / 括号贴在一组里最低的那个下面。 */
    bot: number;
    /** 左边挂了东西（升降号、琶音）：紧挨着音的那一个离音多远。量的时候框架按它要求「前一个音的墨到这个挂件」至少 4 倍（统筹定的规矩）。 */
    leftGap?: number;
}
/** 核的下沿（局部 y）：最低的那个字形的底——数字 / 0 / X = 基线；字母谱 = 右下角八度数字的底；整套鼓的件字往上挪了一点。下划线按一组里最低的这个对齐（8-3）。 */
export declare function coreBottom(u: Chunk, q: JianpuTrack, mode: JianpuMode, aux?: JianpuAux): number;
/** 第一条下划线离核的下沿多远（中线；样张：数字基线下 0.273 字号）。 */
export declare const UL_DROP: number;
/** 这一种行的主字（局部 y）：小节线（7-I，user 2026-11-12 定第 3 种「固定的短线」）以它为中心——top / bottom = 主字的顶和底，layer = 「一层」= 主字的底到第一条下划线的底
 *  （下划线从核的下沿往下贴，同 coreBottom + UL_DROP）。小节线 = 主字上下各出头一层（统筹 2026-11-12：「以这种行的字为中心，上下出头一样多」；原来下面出头是上面的两倍多）。
 *  数字 = 数字的顶 / 基线；字母谱 = 大写字母的顶 / 基线，第一条下划线在右下角八度数字下面（一层就大一些）；一件鼓 = X；整套鼓 = 件字（●，往上挪过）。
 *  和弦叠上去的、八度点、右上角的升降号都不算主字——露在线外（user 定的那一种）。 */
export declare function rowGlyphSpan(mode: JianpuMode, kit: boolean, letters: boolean): {
    top: number;
    bottom: number;
    layer: number;
};
export declare function noteCell(a: NoteCellIn): NoteCellOut;
/** 画的时候横线 / 0 按「这一段占到的宽 − 它」一拍一个摆：只给附点让（附点和横线同高）。换气的 V 在上面、不挤横线（统筹看 5-6 样张定的；量的时候照样给它留了宽）。 */
export declare function tailW(u: Chunk): number;
