export declare const MIN_PLAIN: number;
export declare const NOTATABLE: {
    ticks: number;
    base: number;
    dotted: boolean;
}[];
/** 把一个（写出来的）时值拆成能记的几段（贪心取最大的；段之间画连音线）。 */
export declare function splitDur(dur: number): {
    base: number;
    dotted: boolean;
    ticks: number;
}[];
/** 连音：n 个占 m 个（照 song.ts TUPLET）。时值不是三十二分的整数倍时，找一个比例让「写出来的时值」能记。 */
export declare const RATIOS: [number, number][];
export declare function notate(dur: number): {
    ratio: [number, number] | null;
    chunks: {
        base: number;
        dotted: boolean;
        ticks: number;
    }[];
};
export declare const baseWidth: (base: number) => number;
