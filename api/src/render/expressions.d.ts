import type { Song, Token, Art } from "../score/song.ts";
/** 整个 token 不交给排版的种类（建排版单元时跳过）。 */
export declare const FOLDED_TOKEN_KINDS: ReadonlySet<Token["kind"]>;
/** 排版入口的换算：每条轨里音身上的演奏法 / 圆滑线 / 出声的换气去掉（token 个数、先后、下标都不变——点击框按下标对回谱）。没动的轨 / 纸原样共享。 */
export declare function foldExpressions(song: Song): Song;
/** 一处不显示的记号：挂在哪个 token 上 + 哪一种（说给人听用）。 */
export interface FoldedMark {
    tok: number;
    what: "dyn" | "hairpin" | "pedal" | "slur" | `art:${Art}`;
}
/** 一条轨里不显示的记号（每个力度字 / 渐强渐弱 / 踏板记号 / 演奏法各算一处；圆滑线一串算一处；出声的换气跟着呼吸、不另算）。 */
export declare function foldedMarks(tokens: readonly Token[]): FoldedMark[];
/** 这几条轨一共折叠了几处（排版记在 PaperHit.folded：测试核数用；界面上不再写数字，user 11-12「折叠八十…又不好懂」）。 */
export declare const foldedCount: (tracks: readonly (readonly Token[] | undefined)[]) => number;
