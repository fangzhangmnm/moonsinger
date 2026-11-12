import type { Prim } from "../engrave.ts";
/** 写一个调要的几样：「1=」/「6=」、字母前面的升降号（♭ / ♯ 的字）、字母、右下角的八度数字（没有基准 = 空）。 */
export interface KeyParts {
    pre: string;
    acc: string;
    letter: string;
    oct: string;
}
/** fifths / minor = 调号；base = 这条轨的八度基准（toDegree 的 shift）；middleC = 中央 C 叫 C 几。base = null = 不写八度（字母谱、鼓：调号本来就不印）。 */
export declare function keyParts(fifths: number, minor: boolean, base: number | null, middleC: number): KeyParts;
/** 一个字的大小（数字行的单位，或 px）下：「1=」、升降号、字母、角标各占多宽、从哪起（相对写的起点）；一共多宽。 */
export declare function keyLayout(k: KeyParts, size: number): {
    xAcc: number;
    xLetter: number;
    xOct: number;
    w: number;
    accEm: number;
};
/** 画：写在 (x, y)（y = 基线）、字号 size（px）；cls = 正文那几个字的字样（谱头 jp-head / 中途 jp-head jp-mid）。回图元和一共多宽。 */
export declare function keyPrims(k: KeyParts, x: number, y: number, size: number, cls: string, T: {
    tok?: number;
}): {
    prims: Prim[];
    w: number;
};
