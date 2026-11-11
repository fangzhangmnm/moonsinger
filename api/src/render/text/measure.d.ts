import { type TextRole } from "./style.ts";
/** 宿主给的原始尺子：这串字写成歌词那款字（TEXT_FACES.lyric）、px 那么大，多宽（px）。屏幕 / worker = canvas 的 measureText（canvasMeasure）；PDF = 字体自己的字宽；测试 = 假尺子。 */
export type RawMeasure = (s: string, px: number) => number;
/** 排版器看到的尺子：这种字（role）在这个线间距（sp，px）/ 字的尺子（ts，紧凑档 1.4）下写这串多宽——单位 sp（线间距）。 */
export interface TextMeasure {
    width(role: TextRole, s: string, sp: number, ts: number): number;
    /** 这串字写成 px 那么大多宽（px）——已经有字号的图元（天际线算墨迹用）。 */
    widthPx(s: string, px: number, sp: number, ts: number): number;
}
/** 一次排版一把（同样的字只量一次；缓存跟着这把尺子活，下一次排版宿主再建一把——字体中途变了不会用到旧数）。 */
export declare function createTextMeasure(raw: RawMeasure): TextMeasure;
/** 歌词那款字的 CSS 字体串（屏幕、PDF 预览、排版 worker 三处同一串，不然断行不同；2026-10-17 核过 OffscreenCanvas 和主线程 canvas 量出来逐位相同，无头 Chromium）。 */
export declare const lyricFont: (px: number) => string;
/** canvas（或 OffscreenCanvas）上的原始尺子：按 px 换字体（只在变了时改 ctx.font）。 */
export declare function canvasMeasure(ctx: {
    font: string;
    measureText(s: string): {
        width: number;
    };
}): RawMeasure;
/** 这一档的歌词：字号倍数 k（字高，永远不动）+ 平常的宽度 sx（v0.16.44；表 = style.ts LYRIC_LOOK）。ts > 1 = 紧凑档。 */
export declare const lyricLook: (ts: number) => {
    readonly k: 1;
    readonly sx: 1;
    readonly gapFloor: 0.2;
} | {
    readonly k: 1.15;
    readonly sx: 0.85;
    readonly gapFloor: 0.2;
};
/** 这一档歌词平常写出来这串多宽（sp）：这一档的字号、平常的宽度（还没让路）。 */
export declare const lyricWidth: (m: TextMeasure, s: string, sp: number, ts: number) => number;
/** 这一档歌词的字号（px）。 */
export declare const lyricSizePx: (sp: number, ts: number) => number;
