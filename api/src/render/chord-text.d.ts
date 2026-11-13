import type { Prim } from "./engrave.ts";
/** 一段和弦标的字在字号 fs（px）下多宽（px）：这款衬线字自己的字宽。天际线算和弦标的墨也用它（skyline.ts primInk）——原来按正文的尺子量，衬线半粗「VII」比量的宽三成，
 *  两个标会挤到同一行贴在一起（v0.17.34 出图时抓到：「♭VII」「V7♯9」排成「♭VIIV7♯9」）。 */
export declare const chordTextW: (s: string, fs: number) => number;
/** 一段：字（从 x 起，字宽 w）或者一个升降号字形（墨从 x 起、宽 w；ch / box = Bravura 的码位和墨迹框，em = 字形字号，stroke = 补粗）。x 相对整串的起点，字号的倍数 × fs = px。 */
export type ChordPiece = {
    kind: "text";
    s: string;
    x: number;
    w: number;
} | {
    kind: "acc";
    ch: string;
    box: readonly number[];
    x: number;
    w: number;
    em: number;
    stroke: number;
};
/** 整串怎么摆（fs = 字号 px）：每一段的位置，和一共多宽（px）。 */
export declare function chordTextLayout(label: string, fs: number): {
    pieces: ChordPiece[];
    w: number;
};
/** 画：写在 (x, y)（y = 基线）、字号 fs（px）；cls = 字的样式类（chord-tag + 人挑的 / 对不上的那几个修饰类）。字一段一个 text 图元；升降号一个 glyph 图元，
 *  类把 chord-tag 换成 chord-acc（颜色跟着同样的修饰类，styles.css；不带 chord-tag = 「text.chord-tag」永远只是字）。回图元和画出来多宽（px）。 */
export declare function chordTextPrims(label: string, x: number, y: number, fs: number, cls: string, T?: {
    tok?: number;
}): {
    prims: Prim[];
    w: number;
};
