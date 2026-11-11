export interface SchedChunk {
    key: string;
    t0: number;
    dur: number; /** 唱的最后一个音在哪一秒结束（t0 + dur 还含收尾的余音）。 */
    end?: number;
}
/** 从某一段放（起点提前了一点）：唱完在起点 quiet 之前的块这次不放（v0.10.3；user 2026-10-10「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」）——排队别把它排在前面、开播别等它。 */
export declare const mutedAt: (c: SchedChunk, quiet: number) => boolean;
/** 从 pos 起该算的顺序（键，去重）。loop = 循环区（到尾绕回 from）；没有 = 后面的算完再算前面的（往回 seek 也有）。 */
export declare function chunkOrder(chunks: readonly SchedChunk[], pos: number, loop: {
    from: number;
    to: number;
} | null, has: (key: string) => boolean, quiet?: number): string[];
/** 预卷：从 pos 起的前 n 块（站在上面的 + 后面的）都到齐了没有。 */
export declare function readyToStart(chunks: readonly SchedChunk[], pos: number, n: number, has: (key: string) => boolean, quiet?: number): boolean;
/** 预卷几块：按这台设备的速度（算一秒歌要多少毫秒；没量过 = 保守）——比实时快很多 = 2 块就开，慢 = 多攒几块。 */
export declare function prerollCount(msPerSongSec: number | null): number;
