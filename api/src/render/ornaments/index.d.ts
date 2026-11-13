import { type Song, type PaperSeg, type Token } from "../../score/song.ts";
import type { NotationId } from "../../score/song-view.ts";
import { type TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { Prim, EngraveOpts, DynHit, MarkHit } from "../engrave.ts";
import type { Unit, Chunk, NavU } from "../frame/units.ts";
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
    /** 谱下方贴（踏板用）：同 placeAbove，往下挪到离上面的天际线 gap。 */
    placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: {
        min?: number;
    }) => number;
    attach: (row: number, lane: LaneKind, run: () => void) => void;
    /** 这条轨第 s 行最下面那一行（五线谱 = 最下面那张谱表，大谱表 = 低音那张；数字行 = 它自己）：踏板挂在这一行下面。 */
    rowLow: (s: number) => number;
    /** 台上这位不认的记号（PartView.ignores：演奏法的名字 + 踏板「pedal:sustain」…）：画灰。 */
    ignores: readonly string[];
    /** 第 s 行的线画到哪（px；五线 / 数字行的行尾，最后一根小节线）；contentEnd = 这一行内容的右缘（所有声部的列里最右那一列，不过行尾）。踏板的线用。 */
    rowEnd: (s: number) => number;
    contentEnd: (s: number) => number;
    /** 这一行的右边界（sp）。 */
    right: number;
    /** 这一行内容最左能到哪（px；7-K ⑤）：五线谱 = 行首竖线；数字行 = 行首竖线往右它自己的行首（同 jianpuLineStart）。挂件续到下一行时从不早于这里起，不越过竖线。 */
    left: (s: number) => number;
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
    /** 不印的提示交给框架最后贴、只躲不推（第八刀 8-5；数字行给，五线谱不给 = 照旧当场画）：part 的图元 / 墨相对锚点，tries = 依次试的锚点（这一行局部 px）。 */
    hint?: (row: number, h: {
        part: {
            ink: {
                x0: number;
                x1: number;
                y0: number;
                y1: number;
            };
            prims: Prim[];
        };
        tries: readonly {
            x: number;
            y: number;
        }[];
        climb?: number; /** 摆好之后（落点 = 字的锚点）：登记点击框之类。 */
        onPlace?: (x: number, y: number) => void;
    }) => void;
}
/** 速度记号一共多宽（sp）：词 + 四分音符 + 数（同 tempoAt 的摆法）。不印的提示（8-5）找「速度后面」那个位置用。 */
export declare function tempoW(c: OrnCtx, v: number): number;
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
    swl: "<" | ">" | "<>" | undefined; /** 这个音是滚奏（7-N）：认滚奏的演奏者上，音内起伏谁都能演（滚奏 = 连着敲撑起来的长音），不画灰。 */
    roll?: boolean;
    atk: readonly ("sfz" | "fp")[];
}): void;
export declare function layPedals(c: OrnCtx): void;
