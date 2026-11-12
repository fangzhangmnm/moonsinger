import type { Prim } from "./engrave.ts";
export declare const STEP = 0.25;
export declare class Skyline {
    readonly up: Float64Array;
    readonly dn: Float64Array;
    /** 行高要算进去的那部分（歌词另算——它有自己的行距规矩）：最高 / 最低。 */
    hUp: number;
    hDn: number;
    constructor(widthSp: number);
    private span;
    /** 记一块墨（count = 算不算进行高）。 */
    ink(x0: number, x1: number, y0: number, y1: number, count?: boolean): void;
    /** x0–x1 这一段往上最远到哪（没有墨 = Infinity）。 */
    top(x0: number, x1: number): number;
    /** x0–x1 这一段往下最远到哪（没有墨 = −Infinity）。 */
    bottom(x0: number, x1: number): number;
}
/** 一个图元的墨迹，切成小块交给 emit（px，和图元同一个坐标系）。measure(s, size) = 这串字在 size px 字号下多宽（px）。 */
export declare function primInk(p: Prim, sp: number, measure: (s: string, size: number) => number, emit: (x0: number, x1: number, y0: number, y1: number) => void): void;
/** 排版器自己写的路径（只有绝对坐标的 M L Q C Z）→ 几条折线（曲线 8 段采样）。 */
export declare function pathPolys(d: string): [number, number][][];
/** 把图元上下挪 dy（px）。路径里每一对「x,y」的 y 都挪（排版器的路径只有绝对坐标：逗号后面那个数就是 y）。 */
export declare function shiftPrim(p: Prim, dy: number): void;
/** 把图元横竖挪（px）：y 照 shiftPrim；x = 路径里每一对「x,y」逗号前那个数（排版器的路径只有绝对坐标）。
 *  第八刀 8-1（2026-11-12 Claude Opus 5.5）：一个音的盒子（frame/cell.ts）整块平移到位用。 */
export declare function movePrim(p: Prim, dx: number, dy: number): void;
/** 把图元放大 f 倍、再挪 (dx, dy)：坐标、字号、线宽、矩形的宽高一起放大（第八刀 8-2：盒子在数字行自己的单位里建，画的时候换成 px）。
 *  路径里每一对「x,y」都换（排版器的路径只有绝对坐标的 M / L / Q / C / Z）。字形没写字号 = 不动字号（默认 4 sp 跟着 px 走，不该出现在盒子里）。 */
export declare function scalePrim(p: Prim, f: number, dx: number, dy: number): void;
/** 图元的一个代表 y（px）：认它是哪一行的。 */
export declare function primY(p: Prim): number;
