import type { SpeechStore } from "./speech-store.ts";
type Piper = {
    run(ids: number[], pros: number[][], o: Record<string, unknown>): Promise<{
        audio: Float32Array;
        durations?: Float32Array;
    }>;
} & Record<string, unknown>;
type Analysis = {
    f0: Float64Array;
    sp: Float64Array;
    ap: Float64Array;
};
type Hooks = {
    stage?: (name: string) => void;
    check?: () => void;
} | null;
type World = {
    analyze(x: ArrayLike<number>, fs: number, o?: Record<string, unknown>, hooks?: Hooks): Analysis;
};
export declare function toBf16(x: ArrayLike<number>): Uint16Array;
export declare function fromBf16(x: Uint16Array): Float64Array;
export declare class SpeechCache {
    private map;
    private bytes;
    /** 分析按它来自哪段 piper 输出记（同一个 Float32Array 对象 → 同一次念） */
    private audioKey;
    /** 最近一次解好码的分析（按键试听连按同一句：不用每次把 bf16 解成 Float64 ≈ 1M 个数）。交出去的不拷贝——唱法核心不就地改这些数组（core 里 grep 过）。 */
    private hot;
    hits: number;
    misses: number;
    diskHits: number;
    budget: number;
    private store;
    private model;
    private touched;
    private diskKeys;
    private warned;
    constructor(budget?: number);
    get used(): number;
    setBudget(b: number): void;
    private touch;
    private put;
    private trim;
    clear(): void;
    /** 接上持久层；model = 模型配置标签（语音包 + 运行时包的 id）：换模型 = 另一组键。 */
    attachStore(store: SpeechStore | null, model: string): void;
    get disk(): SpeechStore | null;
    private diskKey;
    private diskFail;
    private touchDisk;
    /** run 回来那一刻：这一句念的分析（可能几份：不同 fs / 参数）从盘上预取进内存，让同步的 analyze 能命中。 */
    private prefetchAnalyses;
    wrapPiper<P extends Piper>(piper: P): P;
    wrapWorld<W extends World>(world: W): W;
}
export {};
