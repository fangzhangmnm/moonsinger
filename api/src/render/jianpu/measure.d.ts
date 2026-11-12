import type { ColEntry } from "../frame/arrange.ts";
import type { Unit, Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux } from "./chunk.ts";
export type { JianpuTrack, JianpuMode, JianpuAux } from "./chunk.ts";
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
