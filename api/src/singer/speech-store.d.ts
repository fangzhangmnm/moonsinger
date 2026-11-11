export type StoredEntry = {
    kind: "p";
    k: string;
    bytes: number;
    audio: Float32Array;
    durations?: Float32Array;
} | {
    kind: "a";
    k: string;
    bytes: number;
    meta: Record<string, unknown>;
    f0: Float64Array;
    sp: Uint16Array;
    ap: Uint16Array;
};
export interface SpeechStore {
    get(key: string): Promise<StoredEntry | null>;
    /** 写一条（同键覆盖）；写完超预算 = 淘汰最久没用的（不淘汰刚写的这条）。 */
    put(key: string, e: StoredEntry): Promise<void>;
    /** 以 prefix 开头的全部（同一句念的几份分析）。 */
    scan(prefix: string): Promise<{
        key: string;
        e: StoredEntry;
    }[]>;
    touch(key: string): Promise<void>;
    info(): Promise<{
        bytes: number;
        entries: number;
        budget: number;
    }>;
    clear(): Promise<void>;
    setBudget(b: number): void;
}
/** 打开（没有 IndexedDB / 打不开 = null，调用方退回只用内存）。 */
export declare function openSpeechStore(name: string, budget: number): Promise<SpeechStore | null>;
/** 内存版（测试 / 没有 IndexedDB 时想要同样语义的地方）。 */
export declare function memorySpeechStore(budget: number): SpeechStore;
