import { type Art, type Dyn } from "../../score/song.ts";
export declare const TOP_LINE = 38;
export declare const MID_LINE = 34, BOTTOM_LINE = 30;
type ArtG = Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll">;
export declare const ART_GLYPH: Record<ArtG, {
    above: string;
    below: string;
    w: number;
    h: number;
}>;
export declare const GLYPH_BREATH: string;
export declare const DYN_GLYPH: Record<Dyn, string>;
export declare const SHARP_POS: number[], FLAT_POS: number[];
export declare const GLYPH_TUPLET: (n: number) => string;
export {};
/** 一行里几条谱左边连着的那根竖线多粗（线间距；框架画，粗细归这种谱）。 */
