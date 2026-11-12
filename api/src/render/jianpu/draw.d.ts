import { type Song, type PaperSeg } from "../../score/song.ts";
import { type PlacedTag } from "../../theory/index.ts";
import type { SongView } from "../../score/song-view.ts";
import type { Prim, EngraveOpts, HitNote, RestHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox, Layout } from "../engrave.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux } from "./measure.ts";
/** 简谱数字行贴挂件的先后（从数字往上：演奏法 → 音的修饰 → 力度道 → 跳转 → 速度 → 风格 → 小节号 → 和弦级数；歌词在下面）。和五线谱同一张道名表（frame/lanes.ts）。 */
export declare const JIANPU_LANES: readonly LaneKind[];
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
/** 画这几条（mine = per 里的下标）简谱轨。 */
/** mode = 数字行（digits）还是鼓的 X 行（x：音画成 X、调号只在编辑器里给淡的提示；第五刀 5-4）。 */
export declare function drawJianpu(c: JianpuDrawCtx, mine: readonly number[], mode?: JianpuMode): {
    lyricParts: LyricPart[];
};
