import { type Token, type TempoMap, type PedalKind } from "./song.ts";
/** 一种踏板踩着的一段（秒）：踩下那一刻、抬起那一刻（纸尾还踩着 = 纸尾）、中间换踏板的时刻（从小到大）。 */
export interface PedalSpan {
    down: number;
    up: number;
    changes: number[]; /** 靠默认留住的那一截到哪一刻（踏板 11-3 规矩六）：这一段开头就踩着（乐手的默认 = 留住）、到谱上第一次写的换踏板 / 抬起为止。谱上写的踩下开的 = 没有。 */
    auto?: number;
}
/** 延音那一种（11-1 起的名字，留着）。 */
export type SustainSpan = PedalSpan;
/** 一段（压平后的整条声部，bounds = 每张纸从第几个 token 起）里这一种踏板踩着的几段。
 *  踏板记号挂在后面那个音 / 休止上（时刻 = 它的起点）；纸尾的（后面这张纸里没有音 / 休止了）= 纸尾那一刻。每张纸开头抬着（规矩一 / 七）。
 *  不起作用的（已经踩着又踩、没踩就抬）不改状态；没踩就「换踏板」= 踩下（换完本来就是踩着的）。三种踏板同一个读法（谱上的状态机和 song.ts pedalDownAt 一样）。 */
export declare function pedalSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds?: readonly number[], which?: PedalKind, startDown?: boolean): PedalSpan[];
/** 延音踏板踩着的几段（= pedalSpans 的延音那一种）。 */
export declare function sustainSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds?: readonly number[]): SustainSpan[];
/** 一个音（秒）：t1 = 写的结尾（已经过跳音 / 缝 / 呼吸）。回来的多一个 w1 = 写的结尾（只有被踏板留长了的才有；追音用，规矩八）。 */
export type HeldNote<N extends {
    midi: number;
    t0: number;
    t1: number;
}> = N & {
    w1?: number;
};
/** 按延音踏板改每个音松开的时刻（= holdByPedals 不带持音）。 */
export declare function holdBySustain<N extends {
    midi: number;
    t0: number;
    t1: number;
}>(notes: readonly N[], spans: readonly SustainSpan[]): HeldNote<N>[];
/** 按延音 + 持音改每个音松开的时刻（规矩二、三、四）：
 *  四（持音）：持音踩下那一刻键正按着的音（写的起点不晚于那一刻、写的结尾晚于那一刻；那一刻落下的也算——记号挂在这个音上 = 抓住它）留到持音抬起才松；之后弹的音不归它管。
 *     持音的「换踏板」（只有别家谱可能写）= 那一刻先松、再抓那一刻按着的。
 *  二（延音）：从「写的结尾，或被持音留到的那一刻」算起，落在延音踩着的一段里（踩下之后、抬起之前）= 到下一个「换踏板 / 抬起」才松；那一刻键还按着的不受影响（接着被新的一脚兜住）。
 *  三：被踏板留着的音（写的结尾之后那一截），同一个音高又弹一次 = 旧的在那一刻松（照乐器自己的收尾收）。
 *  输入不改，回新的一串（先后不变）；被留长了的记下写的结尾 w1（追音用，规矩八）。 */
export declare function holdByPedals<N extends {
    midi: number;
    t0: number;
    t1: number;
    stacc?: true;
}>(notes: readonly N[], sustain: readonly PedalSpan[], sostenuto: readonly PedalSpan[]): HeldNote<N>[];
/** 弱音踏板（规矩五）：t 这一刻弱音踩着没有（踩下那一刻算、抬起那一刻不算；换踏板对弱音没有意思 = 一直踩着）。 */
export declare function softAt(spans: readonly PedalSpan[]): (t: number) => boolean;
/** 弱音踩着期间起的音：力度（0–1）加上这位身上的 softVel（MIDI 力度格，负数 = 轻），夹在 1–127。只变轻 / 变响多少由这位身上写的数定；音色不另动（换到更轻的录音层是音色库自己的）。 */
export declare function softened(vel: number, softVel: number): number;
