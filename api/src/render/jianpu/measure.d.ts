import type { Token } from "../../score/song.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { PartView } from "../engrave.ts";
import type { Unit, Chunk, Head } from "../staff/units.ts";
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
}
/** 这一段除了第一个字形（数字 / 0 / 横线）后面还有几个：长音的横线、几拍的休止一拍一个 0。 */
export declare function extraGlyphs(u: Chunk): number;
/** 这一段有没有附点（画在数字右边）：附点的四分 / 八分…；附点二分以上写成横线，不画点；几拍的休止剩下的半拍也画点。 */
export declare function hasAugDot(u: Chunk): boolean;
/** 第几层下划线（八分 = 1、十六分 = 2…；四分以上 = 0）。 */
export declare const underlines: (u: Chunk) => number;
/** 中途换调 / 换拍号写的那几个字（「1=♭B」「3/4」）大约多宽（sp）。 */
export declare const midTextW: (s: string) => number;
/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号：数字那一道 = 0、歌词那一道 = 1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；升降号）：光标画在它左边。 */
export declare function measureJianpu(q: JianpuTrack): {
    entries: ColEntry<Unit>[];
    inkL: Map<Chunk, number>;
};
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距）；数字行行首不画谱号 / 调号（谱头「1=C 4/4」写在第一行上方），只留一点空。 */
export declare const jianpuLineStart: (_q: JianpuTrack, _key: number, _first: boolean, base: number) => number;
/** 歌词锚点：每个带字的音在第几行、字的中心在哪（sp：数字的中心）。拖腔线不算。 */
export declare const jianpuLyricAnchors: (q: JianpuTrack) => {
    index: number;
    system: number;
    cx: number;
    lyric: string;
    hyph: boolean;
}[];
