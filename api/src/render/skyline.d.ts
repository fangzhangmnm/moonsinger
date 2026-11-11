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
/** 图元的一个代表 y（px）：认它是哪一行的。 */
export declare function primY(p: Prim): number;
