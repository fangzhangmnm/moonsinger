import { type RawMeasure, type TextMeasure } from "../render/text/index.ts";
import { type PartView, type EngraveOpts } from "../render/engrave.ts";
import type { Song } from "../score/song.ts";
import { type Seg, type MusicOutlines, type PdfStats } from "./pdf.ts";
import type { TtfFont } from "./ttf.ts";
/** 这个图元印不印（按样式类；测试用）。 */
export declare const isPrinted: (cls: string | undefined) => boolean;
/** 一串字在这款字体里多宽（em；按 shape 出来的字形——注音字体按词换的字形宽度一样）。 */
export declare function textEm(font: TtfFont, s: string): number;
/** SVG 路径（engrave 画的：M / L / Q / C / Z，绝对坐标；H / V 也认）→ 页面坐标的段（平移 dx, dy）。 */
export declare function segsOf(d: string, dx: number, dy: number): Seg[];
export interface ScorePdfArgs {
    song: Song;
    parts: PartView[];
    font: TtfFont;
    music: MusicOutlines;
    title: string;
    created?: Date;
    /** 量文字宽的原始尺子（文字模块 RawMeasure）：和分页预览同一把（score-view rawMeasure）。不给 = 用这款字体自己的字宽（测试用）。 */
    measure?: RawMeasure;
    /** 自动小节线（和编辑器的开关一致）。 */
    autoBars?: boolean;
    /** 只印这一张纸（= 分页预览的「本段」；2026-10-09 user「只印一段或一个声部 这个也到时候需要做，和wxhw差不多」）。不给 = 整首。 */
    onlyPaper?: string;
}
/** 印的排版参数 = 分页预览去掉控件的那一套（光标、选区、占位提示、曲段控件都不要）。分页预览 = 这一套 + 控件开关（test/pdf-wysiwyg.test.ts 核：控件开关不改版面）。 */
export declare function printOpts(song: Song, sp: number, parts: PartView[], measure: TextMeasure, autoBars: boolean, onlyPaper?: string): EngraveOpts;
/** 排版 + 翻成 PDF。返回字节、页数、缺字（这款字体里没有的字 / 轮廓里没有的音乐字形——调用方如实说）。 */
export declare function scorePdf(a: ScorePdfArgs): {
    bytes: Uint8Array;
    pages: number;
    stats: PdfStats;
};
