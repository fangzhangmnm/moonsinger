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
    tok?: number;
    /** 演奏法的类名（台上那位不认的画灰）；量的时候不用给。 */
    artCls?: (a: string, base?: string) => string;
    /** 「吸 / 深吸」那行小字（字、字号，数字行的单位）；量的时候不用给（宽照 INHALE_W 留）。 */
    inhale?: {
        text: string;
        size: number;
    };
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
    /** 画了数字的音（不是接着上一段的横线）：弧线和连音括号要的上下沿（局部 y）。 */
    top?: number;
    bot?: number;
}
export declare function noteCell(a: NoteCellIn): NoteCellOut;
/** 画的时候横线 / 0 按「这一段占到的宽 − 它」一拍一个摆：只给附点让（附点和横线同高）。换气的 V 在上面、不挤横线（统筹看 5-6 样张定的；量的时候照样给它留了宽）。 */
export declare function tailW(u: Chunk): number;
