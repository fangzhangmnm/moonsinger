export declare function span<T>(name: string, fn: () => T): T;
export declare function record(name: string, ms: number): void;
export interface PerfRow {
    n: number;
    med: number;
    max: number;
    last: number;
}
/** 每个名字最近 KEEP 次的 中位 / 最大 / 最后一次（ms，保留一位小数）。 */
export declare function perfReport(): Record<string, PerfRow>;
export declare function perfReset(): void;
