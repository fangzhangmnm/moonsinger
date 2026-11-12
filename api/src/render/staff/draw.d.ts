import { type TextRole } from "../text/index.ts";
import { type Song, type PaperSeg } from "../../score/song.ts";
import { type PlacedTag, type ChordFold } from "../../theory/index.ts";
import type { Chunk } from "../frame/units.ts";
import type { Prim, EngraveOpts, Layout, HitNote, RestHit, LyricHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox } from "../engrave.ts";
import type { StaffTrack } from "./measure.ts";
import type { SongView } from "../../score/song-view.ts";
import type { LaneKind } from "../frame/lanes.ts";
/** 框架交给五线谱画法的东西（施工单 1b-6a：原来是 engrave() 里的局部变量）。以后 6b–6d 收窄：挂件改成清单、每行一张图元表、摆的结果不抄回单元。 */
/** 五线谱这一种贴挂件的先后（原来按编号 later[2..12]：跳音 / 保持在音符层里，不是挂件）。 */
export declare const STAFF_LANES: readonly LaneKind[];
export interface StaffDrawCtx {
    song: Song;
    paper: PaperSeg;
    o: EngraveOpts;
    /** 这首歌怎么看（src/score/song-view.ts；框架读一次传进来：按 C 调看、和弦标级数、每条轨的和弦选项）。 */
    look: SongView;
    /** 尺子：P = 谱（sp → px）；tx / TR / RS / mw = 字（文字模块的样式表）。 */
    P: (v: number) => number;
    tx: (role: TextRole) => number;
    TR: (role: TextRole, v: number) => number;
    RS: (role: TextRole) => number;
    mw: (role: TextRole, str: string) => number;
    sp: number;
    ts: number;
    /** 输出：图元和各张点击表，都在每一行自己的局部坐标里画（第五线 = 0），框架定了行距再整行挪。
     *  put(行, 图元) = 往那一行的图元表里画（贴挂件回调里画的不用写行，框架知道贴在哪一行）；hitRow = 点击框画在哪一行（和它的 system 不同时才记：歌词）。 */
    put: (row: number, p: Prim) => void;
    hitRow: (hit: object, row: number) => void;
    prims: Prim[];
    notes: HitNote[];
    chordHeads: Layout["chordHeads"];
    rests: RestHit[];
    lyrics: LyricHit[];
    marks: MarkHit[];
    dyns: DynHit[];
    clefs: ClefHit[];
    keyHints: Layout["keyHints"];
    chordTagsOut: Layout["chordTags"];
    slots: Slot[];
    heads: CaretHead[];
    bars: Layout["bars"];
    rows: SystemBox[];
    /** 和弦级数（预处理，theory/families.ts）：每一位身上要标的那几处（合租的一家合起来认、标在这一家最下面那一行）；不标 = null。第五刀 5-4。 */
    harmony: ReadonlyMap<string, readonly PlacedTag[]> | null;
    /** 每条轨的预处理（下标同 per；框架交给所有画法，五线谱现在用不上：叠着的和弦折成和弦名只在数字行上画，第五刀 5-4）。 */
    aux: readonly {
        folds?: ReadonlyMap<number, ChordFold>;
    }[];
    /** 纵向：第 r 行的原点（第五线）；歌词基线；（第 s 行、第 r 个声部、第 k 张谱表）→ 行号。第几级 ↔ y 由画法自己算（geometry.ts yAt；第四刀起框架不递 yOf）。 */
    staffTop: (r: number) => number;
    lyricY: (r: number) => number;
    rowOf: (s: number, r: number, k?: number) => number;
    /** 挂件：贴在谱上方 / 下方（天际线）；attach = 往某一道上登记一件（框架按 STAFF_LANES 的先后执行）。 */
    placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
    placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: {
        min?: number;
        count?: boolean;
        step?: number;
    }) => number;
    attach: (row: number, lane: LaneKind, run: () => void) => void;
    /** 每条要排的轨、声部 2 画在哪一行、鼓谱模式、量的结果（墨往左伸多远）。 */
    per: StaffTrack[];
    rowHost: number[];
    pmode: ("five" | "one" | null)[];
    measured: {
        inkL: Map<Chunk, number>;
    }[];
    /** 排的结果：几行、每行行首多宽 / 那里生效的调号、每行五线画到哪、每一列、右边界（sp）、名字一栏的缩进（第一行 / 别的行）。 */
    nSys: number;
    sysStarts: number[];
    sysKeys: Map<string, number>[];
    staffEnd: number[];
    cols: {
        x: number;
        w: number;
        system: number;
    }[];
    right: number;
    ind0: number;
    indN: number;
    /** 速度画在谁那一行、上一段结尾的速度。 */
    owner: string | null;
    prevBpm: number | null;
}
export type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
import type { LyricPart } from "../frame/lyric-spots.ts";
/** 画这几条（mine = per 里的下标；第四刀起同一张纸上别的轨可能是别种行，交给别的画法）五线谱轨。小节号（每行最上面那条的左上角）照旧在这里画，不看 mine（挂件抽成共用模块 = 第四刀 4-3）。 */
export declare function drawStaff(c: StaffDrawCtx, mine?: readonly number[]): {
    lyricParts: LyricPart[];
};
