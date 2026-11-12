import type { Token, ClefName, Staff } from "../../score/song.ts";
import { type Pitch } from "../../score/pitch.ts";
import { type PercInfo } from "../../gm/percussion.ts";
import { type StemNote, type StemDir } from "../stems.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { PartView } from "../engrave.ts";
import type { Unit, Chunk, Head } from "../frame/units.ts";
/** 一条要排的五线谱轨（一个声部在这张纸上；合租叠出来的虚拟轨、声部 2、双手谱下面那张也各是一条）。 */
export interface StaffTrack {
    p: PartView;
    tokens: Token[];
    realLen: number;
    realTicks: number;
    focused: boolean;
    staves: 1 | 2;
    start: ClefName;
    ds: {
        clef: ClefName[];
        ott: number[];
        auto: boolean[] | null;
        runs: {
            from: number;
            to: number;
            shift: 1 | 2 | -1;
        }[];
    };
    fFam: boolean;
    vrt: boolean;
    units: Unit[];
    head: Head;
    shortBars: number;
    pickup: boolean;
    /** 字母谱（7-B）：数字行上每个音写字母 + 右上升降号 + 右下八度数字；值 = 中央 C 叫 C 几（建轨时谱种表从「这首歌怎么看」标上；五线谱和简谱不写）。 */
    letters?: number;
    /** 鼓谱：一线谱 / 五线鼓谱 / 不是鼓。 */
    pmode: "five" | "one" | null;
    /** 声部 2（画在主人那一行、符干朝下）/ 这一行有声部 2（符干朝上）。 */
    v2: boolean;
    hasV2: boolean;
}
/** 同一个实际音高在谱上要挪几级：谱号 + 八度线（index < 0 = 这张纸开头的谱号）。大谱表 = 上高音下低音。 */
export declare const shAt: (q: StaffTrack, staff: Staff, index: number) => number;
/** 这个音在鼓谱上的写法（哪一线 / 符头 / 符干）：整套鼓按写的音高（= GM 鼓键）查；固定敲一件的就是那一件。 */
export declare const percAt: (q: StaffTrack, p: Pitch) => PercInfo | null;
/** 谱上的位置（级数）：鼓谱 = 一线谱那条线（一线谱的高 / 低音 ±1）/ 五线鼓谱按 MuseScore 的 line（0 = 第五线，往下 +1 走半格）；有音高 = 实际音高 + 谱号 / 八度线。 */
export declare const posD: (q: StaffTrack, p: Pitch, staff: Staff, index: number) => number;
/** 刀 4a：一条 track 交给 stems.ts 的那一串（null = 打断符杠）+ 朝向的规矩。x = 符头左缘，单位由调用方定（横向间距那一步还不知道 x，给 0.35 = 相对对齐线）。 */
export declare const stemInput: (q: StaffTrack, xOf: (u: Chunk) => number) => {
    seq: (StemNote<Chunk> | null)[];
    dir: StemDir;
};
/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号是这条轨自己的：第几张谱表 × 2，歌词那一道 +1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；临时记号 / 括号 / 琶音线）：光标画在它左边（刀 3）。 */
export declare function measureTrack(q: StaffTrack): {
    entries: ColEntry<Unit>[];
    inkL: Map<Chunk, number>;
};
export declare const clefW: (q: {
    fFam: boolean;
}) => 2.684 | 2.736;
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距），后面是这条轨行首要画的：谱号 + 调号（key = 那里生效的调号）+ 第一行的拍号。加的先后照原来（浮点逐位相同）。 */
export declare const lineStartWidth: (q: StaffTrack, key: number, first: boolean, base: number) => number;
/** 符头的左缘离对齐线（列的 x）多远（sp）：刀 3 起临时记号挂在左边，符头从这儿起。 */
export declare const NOTEHEAD_X = 0.35;
/** 这个音的符头多宽（sp）：× 符头（台上那位固定敲一个键 / 气声）、鼓谱按仓鼠的表、其余按时值挑黑 / 全。画（draw.ts）和歌词的锚点（lyricAnchors）用同一个。 */
export declare function noteheadW(q: StaffTrack, c: Chunk): number;
/** 歌词按节奏排（框架的歌词让路）要的：这条轨每个带字的音在第几行、字的中心在哪（sp）= 符头的中心（对齐线 + NOTEHEAD_X + 半个符头宽），和画字的那一处（draw.ts 歌词锚点）同一个数。拖腔线不算。
 *  （7-F 抓出来的：原来写的是「对齐线往右 0.6」，刀 3 之前的符头位置；画的时候已经是 0.35 + 半个符头宽，黑符头差 0.34 个线间距 = 让路贴着右边那道墙摆，画出来越过去。） */
export declare const lyricAnchors: (q: StaffTrack) => {
    index: number;
    system: number;
    cx: number;
    lyric: string;
    hyph: boolean;
}[];
