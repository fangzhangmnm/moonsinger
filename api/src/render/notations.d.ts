import type { NotationId } from "../score/song-view.ts";
import type { ColEntry } from "./frame/arrange.ts";
import type { LaneKind } from "./frame/lanes.ts";
import type { LyricPart } from "./frame/lyric-spots.ts";
import { staffLooks, staffRows, staffTracks, type StaffTrack, type StaffDrawCtx, type Unit, type Chunk } from "./staff/index.ts";
import type { SystemBox } from "./engrave.ts";
import type { GhostNote } from "./frame/ghost.ts";
export type { GhostNote } from "./frame/ghost.ts";
export type { FoldFamily, StaffTrack, StaffDrawCtx, Unit, Chunk } from "./staff/index.ts";
/** 一行用哪种画法（SystemBox.kind，每一行都写）。 */
export type RowKind = "staff" | "jianpu";
/** 一条要排的轨（现在 = 五线谱建轨那一步出的；数字行只用时间那一半和摆好的位置）。 */
export type Track = StaffTrack;
/** 框架交给画法的（两种画法共用一个对象；数字行只用其中一部分）。 */
export type RowDrawCtx = StaffDrawCtx;
export interface LyricAnchor {
    index: number;
    system: number;
    cx: number;
    lyric: string;
    hyph: boolean;
}
/** 一种行的画法（设计稿第 7 节提案里的 RowDrawer，按两个真的实现收成这个形状）。 */
export interface RowDrawer {
    readonly kind: RowKind;
    /** 量（第 3 步）：一条轨 → 列条目 + 每个音的墨往对齐线左边伸多远（光标画在它左边）。纯函数，只看这一条轨。 */
    measure(q: Track): {
        entries: ColEntry<Unit>[];
        inkL: Map<Chunk, number>;
    };
    /** 行首多宽（sp）：base = 框架给的缩进 + 边距；key = 这一行开头生效的调号；first = 这张纸第一行。 */
    lineStart(q: Track, key: number, first: boolean, base: number): number;
    /** 歌词让路要的锚点（字的中心）。 */
    lyricAnchors(q: Track): LyricAnchor[];
    /** 画（第 5 步）：mine = 这种行的那几条轨在 per 里的下标。交回歌词锚点（字归框架）；挂件往道上登记（attach）。 */
    draw(c: RowDrawCtx, mine: readonly number[]): {
        lyricParts: LyricPart[];
    };
    /** 贴挂件的先后（道名 = frame/lanes.ts；框架把各种的并起来按先后贴）。 */
    readonly lanes: readonly LaneKind[];
    /** 这一行的竖向锚点（px）：上沿 / 中线 / 下沿 = 行身。框架的家具（名字、色条、括号、左边的竖线、歌词基线）和行距只认这三个（不假设行身是 0–4）。
     *  origin = 这一行的原点（SystemBox.staffTop）；anchors(0, 0.5) = 行身在局部坐标里的上下沿（sp）。 */
    anchors(origin: number, half: number): {
        top: number;
        mid: number;
        bottom: number;
    };
}
export declare const DRAWERS: Readonly<Record<RowKind, RowDrawer>>;
/** 一种行在主线程上的几何（设计稿第 3.3 节末；统筹审第四刀接口第 2 条：和 DRAWERS 并排、按行的种类查）。谱面（score-view）只查这张表，不写「如果是简谱」。
 *  row = 排好的那一行（Layout.systems[行]），half = 半个线间距（px）。 */
export interface RowGeometry {
    /** 光标长什么样：一根竖线从哪画到哪（px）。 */
    caretSpan(row: SystemBox, half: number): {
        y1: number;
        y2: number;
    };
    /** 选区带的上沿（px）。 */
    bandTop(row: SystemBox, half: number): number;
    /** 鬼音符：x = 那个音的位置（atCaret = 光标处，下一个音要写进去的地方）；交回盖在谱上的 svg 片段（不占排版）。 */
    ghost(row: SystemBox, x: number, notes: readonly GhostNote[], half: number, atCaret: boolean): string;
    /** 纵向 = 音高（可选）：这个 y 是第几级、竖着拖了 dy 是几级。没有 = 谱面不提供竖着拖改音高、鬼音符不看谱号位移（数字行）。 */
    readonly pitchAxis?: {
        stepAt(row: SystemBox, y: number, half: number): number;
        stepsOfDrag(dy: number, half: number): number;
    };
}
export declare const GEOMETRY: Readonly<Record<RowKind, RowGeometry>>;
/** 一种谱：这种谱里一条轨用哪种行；home = 这种谱的主行（一行都没有的纸按它留高）。 */
export interface Notation {
    readonly id: NotationId;
    readonly home: RowKind;
    rowKindOf(q: Track): RowKind;
}
export declare const NOTATIONS: Readonly<Record<NotationId, Notation>>;
/** 建轨（第 1–2 步的前一半）：合租叠成虚拟轨、分手、声部 2、谱号、补齐——照五线谱那一套（staff/rows.ts）；两种谱都先走这一步，再按谱种分行。 */
export declare const BUILD: {
    readonly looks: typeof staffLooks;
    readonly rows: typeof staffRows;
    readonly tracks: typeof staffTracks;
};
