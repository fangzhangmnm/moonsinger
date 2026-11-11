export interface TtfFont {
    unitsPerEm: number;
    /** hhea 的上下伸（字体单位）。注音字体会把拼音带算进去——排版别用它定汉字位置，用 inkOf。 */
    ascender: number;
    descender: number;
    capHeight: number;
    bbox: [number, number, number, number];
    numGlyphs: number;
    /** PostScript 名（name id 6；没有就 "Font"）。只含可打印 ASCII。 */
    psName: string;
    /** 码点 → 字形号；0 = 这款字体里没有。 */
    glyphId(codePoint: number): number;
    /** 字形的前进宽（字体单位）。 */
    advance(gid: number): number;
    /** 字形墨迹框 [xMin, yMin, xMax, yMax]（字体单位）；空字形 → null。 */
    inkOf(gid: number): [number, number, number, number] | null;
    /** 只留这些字形（外加 .notdef 与复合字形的部件）的 TTF。字形号不变。 */
    subset(gids: Iterable<number>): Uint8Array;
    /** 一串字 → 一串字形号（一个码点一个）。先查 cmap，再做 GSUB 的 `rclt`（上下文必换）——注音字体靠它按词给多音字选读音（「银行」的行 ≠ 「行走」的行）。
     *  没有 rclt 的字体 = 逐字查 cmap。只做一对一替换，所以长度不变。 */
    shape(text: string): number[];
    /** 把按上下文选好的读音**写进文字里**：哪个字的字形被 rclt 换了，就在它后面补一个变体选择符（cmap 14；萌神给每个读音都留了一个，U+E01E0 起）。
     *  给不做 rclt 的排字引擎用——实测 Chromium 的 canvas 画字不做上下文替换，但认变体选择符（2026-10-01，`tmp/round0930/probe-canvas-rclt.mjs`）。
     *  before / after = 这一行在段落里的前文 / 后文（只参与选读音，不出现在结果里）。选择符不占宽度。没有 rclt 的字体 → 原样返回。 */
    annotate(text: string, before?: string, after?: string): string;
    /** 这款字体有没有 rclt（有 = 逐行单独排会丢掉跨行的上下文，调用方要把前后文一起给）。 */
    contextual: boolean;
    /** rclt 里遇到的、这个引擎不认识的查找表种类（空 = 全认识）。不为空 = 个别读音可能选错，调用方该如实说。 */
    shapeSkipped: string[];
}
export declare class NotTrueTypeError extends Error {
    name: string;
}
export declare function parseTtf(bytes: Uint8Array): TtfFont;
