import type { TtfFont } from "./ttf.ts";
export type Rgb = [number, number, number];
/** 路径的一段（页面坐标）。 */
export type Seg = {
    k: "M" | "L";
    x: number;
    y: number;
} | {
    k: "C";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x: number;
    y: number;
} | {
    k: "Z";
};
/** 粗体 = 字的轮廓再描一圈，线宽 = 字号的这么多（屏幕上是 CSS 600；小字补粗的规矩按它算：render/text/style.ts BOLD_STROKE，测试核着一样）。 */
export declare const PDF_BOLD_STROKE = 0.035;
export type PdfOp = {
    op: "rect";
    x: number;
    y: number;
    w: number;
    h: number;
    color: Rgb;
} | {
    op: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: Rgb;
    width: number;
    dash?: number[];
    round?: boolean;
} | {
    op: "path";
    segs: Seg[];
    color: Rgb;
    fill: boolean;
    width?: number;
    dash?: number[];
    round?: boolean;
} | {
    op: "glyph";
    code: string;
    x: number;
    y: number;
    size: number;
    color: Rgb; /** 描边补粗：线宽 = 字号的这么多（7-P，同屏幕 SVG）。 */
    stroke?: number;
} | {
    op: "text";
    x: number;
    y: number;
    text: string;
    size: number;
    color: Rgb;
    bold?: boolean;
    italic?: boolean; /** 横向压窄（1 = 不压）。 */
    sx?: number;
};
export interface PdfPage {
    w: number;
    h: number;
    ops: PdfOp[];
}
export interface PdfDoc {
    title: string;
    pages: PdfPage[];
    producer?: string;
    created?: Date;
}
/** 音乐字形的轮廓：outlines.json 的形状（字体单位、y 向上；d = SVG 路径）。 */
export interface MusicOutlines {
    unitsPerEm: number;
    glyphs: Record<string, {
        adv: number;
        d: string;
    }>;
}
/** 导出用的一整套音乐字形 = Bravura 的（键 = 码位）+ 和弦级数的衬线字（键 = T + 码位）；两份都是 1000 单位一个 em。app 和测试都用这一个（pdf-assets.ts loadMusicOutlines）。 */
export declare const mergeMusicOutlines: (music: MusicOutlines, serif: MusicOutlines) => MusicOutlines;
export interface PdfStats {
    glyphs: number;
    missing: string[];
    missingMusic: string[];
    fontBytes: number;
}
/** SVG 路径（字体单位的 M L H V Q C Z，绝对坐标；fontTools SVGPathPen 的输出会用 H / V）→ PDF 路径指令（原样坐标，不翻 y：字形用 cm 摆）。
 *  认不出的命令 → 抛错（不静默画缺一笔；2026-10-09 抓到过：漏了 V / H，速度记号的四分音符没了符干）。 */
export declare function svgToPdfPath(d: string): string;
/** 写成 PDF 字节。font = 解析好的 TTF（文字嵌它的子集）；music = 音乐字形轮廓。 */
export declare function writePdf(doc: PdfDoc, font: TtfFont, music: MusicOutlines, opts?: {
    stats?: PdfStats;
}): Uint8Array;
