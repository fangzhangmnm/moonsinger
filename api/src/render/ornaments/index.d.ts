import { type Song, type PaperSeg, type Token } from "../../score/song.ts";
import type { NotationId } from "../../score/song-view.ts";
import { type TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { Prim, EngraveOpts, DynHit, MarkHit } from "../engrave.ts";
import type { Unit, Chunk, NavU } from "../frame/units.ts";
/** 渐强渐弱和两头的字之间留多少（sp）；比一整行还长 = 写「cresc. - - -」（字的大概宽 / 虚线一节多长、隔多远）；渐到的虚线。原样从 staff/glyphs.ts 搬来。 */
export declare const PIN_GAP = 0.7;
/** 一个楔形（发夹 / 渐到）最短多长（sp）：整条短于它就拉到它；折到下一行的那一段短于它就不画。 */
export declare const PIN_MIN = 1.4;
export declare const PIN_WORD: {
    readonly w: {
        readonly cresc: 4.7;
        readonly dim: 3.5;
    };
}, DASH: {
    readonly len: 0.6;
    readonly gap: 1;
};
/** 渐到的虚线（统筹看样张 ⑩：原来固定 0.5 / 0.4 的小段，A5 上短的发夹碎成一串点）：段数跟着这一段发夹的长度定——每段大约 len（sp）、空隙 = 段长 × gapK，
 *  至少两段；短的发夹 = 更少、更长的段，两头都落在发夹的两端。空隙是段长的一半 = 一眼看得出是虚线（渐到），不是实线（手写的渐强渐弱）。 */
export declare const RAMP_DASH: {
    readonly len: 1.2;
    readonly gapK: 0.5;
    readonly min: 2;
};
/** 一段长 L 的渐到发夹切成几段、每段多长、隔多远（同一个单位进出）。 */
export declare const rampDashes: (L: number, unit: number) => {
    n: number;
    on: number;
    per: number;
};
/** 画法交给挂件的（一条轨在这张纸上）。 */
export interface OrnCtx {
    /** notation = 记号表查哪一栏 = 这一行的种类（不是这首歌的谱种：简谱歌里照旧排五线谱的行查五线谱那一栏）。 */
    song: Song;
    paper: PaperSeg;
    o: EngraveOpts;
    notation: NotationId;
    P: (v: number) => number;
    tx: (role: TextRole) => number;
    TR: (role: TextRole, v: number) => number;
    RS: (role: TextRole) => number;
    mw: (role: TextRole, s: string) => number;
    sp: number;
    prims: Prim[];
    dyns: DynHit[];
    marks: MarkHit[];
    placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
    attach: (row: number, lane: LaneKind, run: () => void) => void;
    /** 这一行的右边界（sp）。 */
    right: number;
    /** 这一行字形的尺寸比例（力度字、突强 / 强后弱）：数字行 = 排版参数表行一级的 scale（第五刀 5-0c）；五线谱不给 = 原样。 */
    glyphScale?: number;
    tokens: Token[];
    units: Unit[];
    /** 这条轨第 s 行挂挂件的那一行（五线谱 = 第一张谱表）。 */
    row: (s: number) => number;
    /** 音的墨的左边 / 右边（px）：五线谱 = 符头；简谱 = 数字。 */
    noteX: (c: Chunk) => number;
    noteEnd: (c: Chunk) => number;
    /** 被紧跟着的强后即弱盖掉的力度记号（画灰）；不起作用的跳转（画灰的 class 后缀）。 */
    dynOff: ReadonlySet<number>;
    navMute: (i: number) => string;
}
/** 速度记号画在基线 y（「Andante ♩ = 88」：词 + 四分音符 + 数）；change = 这一段开头比上一段快 / 慢（前面标 ↑ / ↓）。 */
export declare function tempoAt(c: OrnCtx, r: number, x0: number, v: number, cls: string, index: number, change: "up" | "down" | undefined, y: number): void;
/** 速度记号（挂件第 7 样）：这一段天际线往上 0.5。 */
export declare function layTempo(c: OrnCtx, r: number, x0: number, v: number, cls: string, index: number, change?: "up" | "down"): void;
/** 风格记号（拍子轻重）：斜体字、和后面那个音左对齐；不认识的预设（以后的版本写的）= 灰字 + 说明（纪律）。挂件第 8 样：速度之后、贴天际线往上 0.5（挤了自然叠上去）。 */
export declare function layGroove(c: OrnCtx, u: Unit): void;
/** 谱内反复 / 跳转（2026-10-09）：挂件第 6 样（刀 4b：它那一段天际线往上 0.6）；不起作用的（不是最上面那位的行 / D.S. 没 Segno…）画灰，点开说为什么（repeats.ts navWhy）。
 *  repeatBarX(v) = 这种画法里反复小节线的右端（房子的钩下到那里）；没给 = 小节线的位置 + 0.7（单线）。 */
export declare function layNav(c: OrnCtx, u: NavU, repeatBarX: (v: Unit) => number): void;
/** 力度那一层（挂件第 4 样）：力度字 / 发夹 / cresc. 字 / 渐到，各一块；用发夹连着的一串（字—发夹—字）共用一条基线 = 这一串里最高的那个，贴它们自己那几段天际线往上 0.4。
 *  力度字画成什么查记号表（五线谱 = Bravura 字形；简谱中文界面 = 中文字）。 */
export declare function layDynamics(c: OrnCtx): void;
/** 音内的起伏（< / > / <>）+ 突强 / 强后即弱：音自己的修饰，挂件第 3 样（刀 4b：这个音自己那一段天际线往上 0.5）。突强 / 强后即弱的字对着音的中心（user「还是居中对齐」）；
 *  小发夹从音的左缘（有字 = 字后面）到这个音的宽，中线在字的半腰；做不到的画灰。原样从 staff/draw.ts 搬出（第四刀 4-4）：cx = 音的中心、x0 = 音的左缘、w = 这一列的宽（px）。 */
export declare function layNoteDynamics(c: OrnCtx, row: number, _ch: Chunk, a: {
    cx: number;
    x0: number;
    w: number;
    tok: number | undefined;
    cls: string | undefined;
    ign: ReadonlySet<string>;
    swl: "<" | ">" | "<>" | undefined;
    atk: readonly ("sfz" | "fp")[];
}): void;
