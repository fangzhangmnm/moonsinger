import { type Song, type PaperSeg } from "../../score/song.ts";
import { type PlacedTag } from "../../theory/index.ts";
import type { SongView } from "../../score/song-view.ts";
import type { Prim, EngraveOpts, HitNote, RestHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox, Layout } from "../engrave.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux } from "./chunk.ts";
import type { Part } from "../frame/cell.ts";
/** 框架交给数字行的东西（是五线谱那一份的子集：不要纵向 ↔ 音高的几何）。 */
export interface JianpuDrawCtx {
    song: Song;
    look: SongView;
    paper: PaperSeg;
    o: EngraveOpts;
    P: (v: number) => number;
    tx: (role: TextRole) => number;
    TR: (role: TextRole, v: number) => number;
    RS: (role: TextRole) => number;
    mw: (role: TextRole, s: string) => number;
    sp: number;
    /** 行里的尺寸比例（排版参数表行一级；第五刀 5-0c）：数字行自己的尺寸 / 偏移都乘它。没给 = 1。 */
    scale?: number;
    put: (row: number, p: Prim) => void;
    hitRow: (hit: object, row: number) => void;
    /** 不印的提示交给框架最后贴、只躲不推（第八刀 8-5）：图元 / 墨相对锚点，tries = 依次试的锚点（这一行局部 px），onPlace 拿到最后的位置再登记点击区。 */
    hint: (row: number, h: {
        part: Part;
        tries: readonly {
            x: number;
            y: number;
        }[];
        climb?: number;
        onPlace?: (x: number, y: number) => void;
    }) => void;
    prims: Prim[];
    notes: HitNote[];
    chordHeads: Layout["chordHeads"];
    keyHints: Layout["keyHints"];
    chordTagsOut: Layout["chordTags"];
    rests: RestHit[];
    marks: MarkHit[];
    dyns: DynHit[];
    clefs: ClefHit[];
    slots: Slot[];
    heads: CaretHead[];
    bars: Layout["bars"];
    rows: SystemBox[];
    staffTop: (r: number) => number;
    rowOf: (s: number, r: number, k?: number) => number;
    placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
    placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: {
        min?: number;
        count?: boolean;
    }) => number;
    /** 和弦级数（预处理，theory/families.ts）：合租的一家合起来认、标在这一家最下面那一行；不标 = null。 */
    harmony: ReadonlyMap<string, readonly PlacedTag[]> | null;
    /** 每条轨的预处理（下标同 per）：叠着的和弦折成的和弦名（第五刀 5-4）。 */
    aux: readonly JianpuAux[];
    attach: (row: number, lane: LaneKind, run: () => void) => void;
    /** 这一行的右边界（sp）；速度画在哪一位那行（这张纸最上面在场的那位）、上一段结尾的速度（开头变了标 ↑ / ↓）。 */
    right: number;
    owner: string | null;
    prevBpm: number | null;
    per: readonly JianpuTrack[];
    measured: {
        inkL: Map<Chunk, number>;
    }[];
    nSys: number;
    sysStarts: number[];
    staffEnd: number[];
    cols: {
        x: number;
        w: number;
        system: number;
    }[];
    ind0: number;
    indN: number;
}
/** 名字那一栏至少要多宽才放得下这条轨的鼓的图例（sp；施工单第 12 条 12-2，统筹选 A：栏宽只看谱上真有的字）：一件鼓占一行时最宽的那一行（「● 小鼓」），
 *  最多到声部名的上限 NAME_MAX（再长的名字照旧在栏里折）。按整张纸用到的鼓算（排之前不知道第一行有哪几件）；没有图例 = 0。 */
export declare function kitLegendMin(q: JianpuTrack, mw: (role: TextRole, s: string) => number): number;
export declare function drawJianpu(c: JianpuDrawCtx, mine: readonly number[], mode?: JianpuMode): {
    lyricParts: LyricPart[];
};
