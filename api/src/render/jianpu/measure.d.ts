import type { Token } from "../../score/song.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { PartView } from "../engrave.ts";
import type { Unit, Chunk, Head } from "../frame/units.ts";
import type { ChordFold } from "../../theory/index.ts";
/** 一条要排的简谱轨（一个声部在这张纸上；框架交来的单元已经切好了时值）。 */
export interface JianpuTrack {
    p: PartView;
    tokens: Token[];
    units: Unit[];
    head: Head;
    realLen: number;
    realTicks: number;
    staves: number;
    focused: boolean;
    pickup: boolean;
    /** 字母谱（7-B）：数字换成字母 + 右上升降号 + 右下八度数字；值 = 中央 C 叫 C 几（默认 4）。别的一样不动。 */
    letters?: number;
}
/** 接着上一段的长音，这一段画成横线（不重写数字）：只在**同一小节之内**、正好整拍、不是连音的才行——一条横线 = 一拍（UX 稿第 4 节）。
 *  跨过小节线的（这一段从小节头起）一律在小节线后面重写数字、用连线连到前一段（课本写法、样张也是；统筹 5-6「横线只在一小节之内用」）；
 *  不是整拍的同样重写（附点、下划线照常；统筹看第四刀成品样张后定的第 1 处：原来一律画横线、按 round 算根数，3/4 里连过来的一拍半画成两条横线，读成三拍半）。 */
export declare const contDash: (u: Chunk) => boolean;
/** 这一段除了第一个字形（数字 / 0 / 横线）后面还有几个：长音的横线、几拍的休止一拍一个 0。 */
export declare function extraGlyphs(u: Chunk): number;
/** 这一段有没有附点（画在数字右边）：附点的四分 / 八分…；附点二分以上写成横线，不画点；几拍的休止剩下的半拍也画点。 */
export declare function hasAugDot(u: Chunk): boolean;
/** 数字行的两种写法：digits = 数字（有音高的声部）；x = 鼓的 X 行（音画成 X，没有升降号 / 八度点 / 琶音；UX 稿第 7 节，第五刀 5-4）。 */
export type JianpuMode = "digits" | "x";
/** 框架交来的这一条轨的预处理里数字行用得上的：叠着的和弦折成的和弦名（token 下标 → 折法；这条轨的和弦选项是「折叠」才有；第五刀 5-4）。 */
export interface JianpuAux {
    folds?: ReadonlyMap<number, ChordFold>;
}
/** 这一段画成和弦名吗（接着上一段、画成横线的那一段不算：第一个字形是横线）：是 = 折法。 */
export declare const foldOf: (u: Chunk, aux: JianpuAux | undefined) => ChordFold | undefined;
/** 字母谱（7-B）里这一段第一个字形（字母 + 右上的升降号 / 右下的八度数字）多宽；不是字母谱 / 不写音高的（横线、没写音高的、和弦名）= null。 */
export declare const lettersOf: (q: {
    letters?: number;
}, u: Chunk, mode: JianpuMode, aux: JianpuAux | undefined) => {
    w: number;
} | null;
export declare const glyphWOf: (u: Chunk, aux: JianpuAux | undefined, q?: {
    letters?: number;
}) => number;
/** 这一段要写临时记号的那几个音（叠音 = 每个音各自的；单音 = 它自己的）：只有第一段写（同五线谱）。 */
export declare const accsOf: (u: Chunk) => (number | null)[];
/** 这一段画不画琶音的竖波浪（只挂在和弦上：单音的琶音核心那边已经去掉了）。 */
export declare const hasArp: (u: Chunk) => boolean;
/** 第几层下划线（八分 = 1、十六分 = 2…；四分以上 = 0）。 */
export declare const underlines: (u: Chunk) => number;
/** 中途换调 / 换拍号写的那几个字（「1=♭B」「3/4」）大约多宽（sp）。 */
export declare const midTextW: (s: string) => number;
/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号：数字那一道 = 0、歌词那一道 = 1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；升降号）：光标画在它左边。k = 行里的尺寸比例（排版参数表行一级；数字行自己的宽都乘它，第五刀 5-0c）。 */
export declare function measureJianpu(q: JianpuTrack, k?: number, mode?: JianpuMode, aux?: JianpuAux): {
    entries: ColEntry<Unit>[];
    inkL: Map<Chunk, number>;
};
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距）；数字行行首不画谱号 / 调号（谱头「1=C 4/4」写在第一行上方），只留一点空。 */
export declare const jianpuLineStart: (_q: JianpuTrack, _key: number, _first: boolean, base: number, k?: number) => number;
/** 歌词锚点：每个带字的音在第几行、字的中心在哪（sp：数字的中心）。拖腔线不算。 */
export declare const jianpuLyricAnchors: (q: JianpuTrack, k?: number, aux?: JianpuAux) => {
    index: number;
    system: number;
    cx: number;
    lyric: string;
    hyph: boolean;
}[];
