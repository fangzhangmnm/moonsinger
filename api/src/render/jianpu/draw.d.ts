import { type Song, type PaperSeg } from "../../score/song.ts";
import type { SongView } from "../../score/song-view.ts";
import type { Prim, EngraveOpts, HitNote, RestHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox, Layout } from "../engrave.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../staff/units.ts";
import { type JianpuTrack } from "./measure.ts";
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
    put: (row: number, p: Prim) => void;
    hitRow: (hit: object, row: number) => void;
    prims: Prim[];
    notes: HitNote[];
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
export declare function drawJianpu(c: JianpuDrawCtx, mine: readonly number[]): {
    lyricParts: LyricPart[];
};
