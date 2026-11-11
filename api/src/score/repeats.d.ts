import { type Token, type PaperSeg, type Song, type NavTok } from "./song.ts";
export interface Seg {
    t0: number;
    t1: number;
}
/** 每个 token 前面的 tick（音 / 休止 = 起点；记号 = 它所在的位置）。 */
export declare function tickOf(tokens: readonly Token[]): number[];
/** 这条 track 上有没有反复 / 跳转。 */
export declare const hasRepeats: (tokens: readonly Token[]) => boolean;
/** 一条 track 的反复结构 → 放的顺序（tick 段，[t0, t1)）。没有反复 / 跳转 = null（照原样放）。len = 这张纸的长度。 */
export declare function playSegments(tokens: readonly Token[], len: number): Seg[] | null;
/** 一条 track 按段切开再接起来（见文件头）。newId = 抄出来的给负 id。 */
export declare function sliceBySegments(tokens: readonly Token[], segs: readonly Seg[], newId: () => number): Token[];
/** 一张纸按反复结构展开（放 / 压平件用）：结构看最上面那位在场的歌手；没有反复 = 原样返回。 */
export declare function expandPaper(song: Song, paper: PaperSeg, newId: () => number): PaperSeg;
/** 谱上画灰用：这一行的反复 / 跳转记号起不起作用；不起 = 为什么。 */
export declare function navWhy(song: Song, paper: PaperSeg, partId: string, t: Token): string | null;
export type { NavTok };
