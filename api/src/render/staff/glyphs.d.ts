import type { Art, Dyn } from "../../score/song.ts";
export declare const TOP_LINE = 38;
export declare const MID_LINE = 34, BOTTOM_LINE = 30;
export declare const ART_GLYPH: Record<Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll">, {
    above: string;
    below: string;
    w: number;
    h: number;
}>;
export declare const GLYPH_BREATH = "\uE4CE";
export declare const DYN_GLYPH: Record<Dyn, string>;
/** 力度字的墨迹（sp，相对字的原点：左、右、基线以上、基线以下）：浏览器里 canvas measureText 量的 Bravura（2026-10-08 Opus 5.5；此前估的宽度小了一截，渐强渐弱压到字上）。
 *  渐强渐弱和两头的字之间留 PIN_GAP；点击区域按它。 */
export declare const DYN_INK: Record<string, [number, number, number, number]>;
export declare const PIN_GAP = 0.7;
/** 渐强渐弱比一整行还长 = 不画发夹，写「cresc. - - -」/「dim. - - -」（user 2026-10-08「如果一个超级长的<号不要让它太awkward」；
 *  记谱的老规矩：长的渐变用文字加虚线，发夹留给短的）。字号 / 大概字宽（sp）、虚线一节多长 / 隔多远。 */
export declare const PIN_WORD: {
    readonly size: number;
    readonly w: {
        readonly cresc: 4.7;
        readonly dim: 3.5;
    };
}, DASH: {
    readonly len: 0.6;
    readonly gap: 1;
};
export declare const RAMP_DASH: {
    readonly len: 0.5;
    readonly gap: 0.4;
};
export declare const SHARP_POS: number[], FLAT_POS: number[];
export declare const GLYPH_TUPLET: (n: number) => string;
/** 一行里几条谱左边连着的那根竖线多粗（线间距；框架画，粗细归这种谱）。 */
export declare const SYSTEM_LINE_W: number;
