import { type Token, type TempoMap } from "./song.ts";
/** 延音踏板踩着的一段（秒）：踩下那一刻、抬起那一刻（纸尾还踩着 = 纸尾）、中间换踏板的时刻（从小到大）。 */
export interface SustainSpan {
    down: number;
    up: number;
    changes: number[];
}
/** 一段（压平后的整条声部，bounds = 每张纸从第几个 token 起）里延音踏板踩着的几段。
 *  踏板记号挂在后面那个音 / 休止上（时刻 = 它的起点）；纸尾的（后面这张纸里没有音 / 休止了）= 纸尾那一刻。每张纸开头抬着（规矩一 / 七）。
 *  不起作用的（已经踩着又踩、没踩就抬）不改状态；没踩就「换踏板」= 踩下（换完本来就是踩着的）。 */
export declare function sustainSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds?: readonly number[]): SustainSpan[];
/** 一个音（秒）：t1 = 写的结尾（已经过跳音 / 缝 / 呼吸）。回来的多一个 w1 = 写的结尾（只有被踏板留长了的才有；追音用，规矩八）。 */
export type HeldNote<N extends {
    midi: number;
    t0: number;
    t1: number;
}> = N & {
    w1?: number;
};
/** 按延音踏板改每个音松开的时刻（规矩二、三）：
 *  二：写的结尾落在踩着的一段里（踩下之后、抬起之前）= 到下一个「换踏板 / 抬起」才松；那一刻键还按着的音不受影响（接着被新的一脚兜住）。
 *  三：被踏板留着的音，同一个音高又弹一次 = 旧的在那一刻松（照乐器自己的收尾收）。
 *  输入不改，回新的一串（先后不变）。 */
export declare function holdBySustain<N extends {
    midi: number;
    t0: number;
    t1: number;
}>(notes: readonly N[], spans: readonly SustainSpan[]): HeldNote<N>[];
