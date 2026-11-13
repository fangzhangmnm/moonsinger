import { type ClefName, type Token, type Song } from "./song.ts";
/** 这个谱号下，同一个实际音高在谱上要往上挪几级（高音谱号 = 0）。下加 8 = 谱上写高一个八度（实际低八度）= +7。 */
export declare const CLEF_SHIFT: Record<ClefName, number>;
export declare const isFClef: (c: ClefName) => boolean;
/** 谱号的「本家」（调号的位置、谱号字形挂在哪条线跟它走）。 */
export declare const baseClef: (c: ClefName) => "G" | "F";
/** 八度线：8va（1）= 谱上画低一个八度 → −7；15ma（2）→ −14；8vb（−1）→ +7；结束（0）→ 0。 */
export declare const ottavaShift: (s: number) => number;
export declare const CLEF_LABEL: Record<ClefName, string>;
export declare const CLEF_TITLE: Record<ClefName, string>;
export declare const OTTAVA_LABEL: Record<number, string>;
/** 谱上这个位置要几条加线。 */
export declare const ledgerLines: (pos: number) => number;
/** 自动谱号：给一串谱上的位置（diatonicIndex，已经算上八度线），挑加线最省的那个谱号（加线越多越难读，按三角数算）；没有音 = 上一张纸的（没有 = 高音）。
 *  滞后：上一张纸用的谱号只要不比最好的多太多（多 max(1, 一成) 条以内）就接着用，翻纸不来回跳。 */
export declare function autoClef(positions: readonly number[], prev?: ClefName | null): ClefName;
/** 这条 track（一张纸）开头的谱号：声部写了 = 它；没写 = 自动（按开头到第一个谱号记号之前的音挑，算上八度线）。
 *  autoOtt（v0.9.37）= 这位开着自动八度线：比较每个谱号时，先在那个谱号下把自动八度线画上再数加线（每段记 RUN_COST）——
 *  临时冒出去几个音 = 原来的谱号 + 8va；整段都高（自动八度线不画，超过三分之一）= 换谱号（设计稿：「为了这几个音换谱号读起来更累」）。 */
export declare function startClef(tokens: readonly Token[], partClef: ClefName | undefined, prev: ClefName | null, autoOtt?: boolean): ClefName;
/** 合租叠起来的那一行（v0.10.28，src/score/merge.ts）用不用双手谱：一个谱号（自动挑 + 自动八度线）的阅读成本 vs 双手谱（中央 C 以上上谱、以下下谱）+ 每个音 GRAND_BIAS。
 *  user「share之后能不能选双手谱号，这样爽一点」→「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」：按音自动，不存。 */
export declare function wantsGrand(tokens: readonly Token[]): boolean;
/** 每个下标处生效的谱号和八度线（开头 = start）：画的时候每个音按这两个挪位置。 */
export declare function displayStates(tokens: readonly Token[], start: ClefName): {
    clef: ClefName[];
    ott: number[];
};
/** 自动八度线（v0.9.37；user 2026-10-10「自动加」，设计 = ai-docs/20261010-design-answers.md「8va 自动怎么做、什么粒度」）：在已经挑好的谱号下，
 *  连续两个以上、每个都要三条以上加线的音（往上 = 8va，往下 = 8vb；8va 之后还要三条以上 = 15ma）画一段八度线；中间只隔一个音或一个休止的两串并成一段
 *  （隔着的那个音挪了八度也不能反过来要三条以上加线）；这种音超过这张纸的三分之一 = 整段都高，归自动谱号管，不画；手写的八度线说了算（那一段里不自动）。
 *  只管画，不存进谱（随时重算）。返回新的 ott（手写的照旧）+ auto（哪些下标是自动的）+ runs（每一段：起止下标、几度）。 */
export declare function autoOttava(tokens: readonly Token[], ds: {
    clef: ClefName[];
    ott: number[];
}): {
    ott: number[];
    auto: boolean[];
    runs: {
        from: number;
        to: number;
        shift: 1 | 2 | -1;
    }[];
};
/** 导出用（v0.9.37）：把自动八度线临时插成记号（auto: true，写 MusicXML 时带 ms-auto id），别的软件照样看得到；读回来认出是自动的就跳过。
 *  这一段结束在整条最后一个音上 = 不插「结束」（不然末尾多出一个空小节）。 */
export declare function withAutoOttava(tokens: readonly Token[], start: ClefName): Token[];
export declare function autoGrand(tokens: readonly Token[], single: ClefName, autoOtt: boolean, prevGrand: boolean): boolean;
/** 一段 × 一个声部最后怎么画（resolveSongLooks）。clef = 单谱表开头挑的谱号（纸头手选的谱号记号另算，画的时候照记号走）；大谱表时 = 退回单谱表会用的那个（写进每段那份谱用）。
 *  first = 第一个音那里实际用着的谱号（纸头手选的算上；合租分家谱用）。grand：explicit = 手选的、auto = 自动变出来的、null = 一行。 */
export interface ResolvedLook {
    staves: 1 | 2;
    clef: ClefName;
    first: ClefName;
    autoOtt: boolean;
    grand: "explicit" | "auto" | null;
}
/** 整首：每张纸每个声部怎么画（按纸的顺序一路接：自动的谱号和大谱表看这个声部在上一张纸的样子，滞后、不来回跳）。和视图无关——本段 / 全部 / PDF 一样。
 *  noAutoGrand = 不许自动变大谱表的声部（鼓、固定敲一个键的；合租的一家这里自己跳过）。 */
/** trackLook = 每张纸每个声部那几样（自动八度线开没开、手选的大谱表）：调用方从 src/look trackLookOf 拿来交进来（第 17 条 17-1：「没写 = 开 / 一行」的退路只在那里；谱这一层不 import 它）。 */
export type TrackLookFn = (paperId: string, partId: string) => {
    autoOttava: boolean;
    grand: boolean;
};
export declare function resolveSongLooks(song: Song, trackLook: TrackLookFn, noAutoGrand?: ReadonlySet<string>): Map<string, Map<string, ResolvedLook>>;
/** 只要单谱表开头的谱号（老接口；大谱表的不在里面）。 */
export declare function resolveSongClefs(song: Song, trackLook: TrackLookFn, noAutoGrand?: ReadonlySet<string>): Map<string, Map<string, ClefName>>;
