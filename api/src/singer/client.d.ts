import type { LabScore } from "../score/lab-score.ts";
import type { SingRequest } from "./worker.ts";
export interface SingResult {
    samples: Float32Array;
    sr: number;
    ms: {
        load: number;
        sing: number;
        boot?: Record<string, number>;
    };
}
export interface LaneMem {
    wasm: number;
    cache: number; /** 引擎刚加载完那一刻的堆（worker 自己量，v0.10.3；换歌时按它判断重开值不值）。 */
    base?: number;
}
export interface DiskInfo {
    bytes: number;
    entries: number;
    budget: number;
}
/** 读音（v0.9.34）：labels[k] = 第 k 条念成的音素；对不上 = null + said（念出来的每个音节）；ready false = 引擎还没起来（不为此起引擎）。 */
export interface Reading {
    ready: boolean;
    labels: string[] | null;
    said: string[];
}
type Extra = Partial<Pick<SingRequest, "opt" | "breath" | "models" | "raw" | "cacheBytes" | "diskBytes" | "only">> & {
    tag?: string;
};
export declare class Singer {
    /** 小月相被人删了（设置「音源」页的记号，宿主给）：每个 warm / sing 请求都带上，worker 缺包时就不下载（v0.17.25）。 */
    noDownload: () => boolean;
    private lanes;
    private retiring;
    private seq;
    private pending;
    private queue;
    /** 每次有道报占用就叫一下（刀 6 内存监控）。 */
    onMem: ((lane: number, mem: LaneMem) => void) | null;
    /** 几条道（主线程按设备定；内存吃紧降到 1）。 */
    get parallelism(): number;
    setLanes(n: number): void;
    /** 每条道最近报的占用（没起的道不在里面）。 */
    memory(): LaneMem[];
    /** 按道的下标排的占用（没起 = null；下标和 laneBusy / restartLane 对得上）。 */
    laneMems(): (LaneMem | null)[];
    laneBusy(i: number): boolean;
    private laneFor;
    private laneIndex;
    private worker;
    private closeLane;
    private failLane;
    /** 重开所有道：wasm 的内存只涨不落，只有整个 worker 关掉才真还回去。 */
    restart(): void;
    /** 只重开一条道（换歌时：上一首的长句把这条道的堆撑大了、现在空着；念缓存盘上那份还在）。 */
    restartLane(i: number): void;
    /** 还没开始算的全扔掉（以 "cancelled" 拒绝）；正在算的照常回来。返回扔了几个。 */
    cancelPending(): number;
    /** 取消正在算的整句（worker 在段与段之间认；正在跑的那一段跑完才停）。给了 tag = 只取消贴着这个标签的那句；不给 = 全部。 */
    cancelInflight(tag?: string): void;
    /** 只把引擎起起来（打开歌就起；user 10-10「冷启动做」）：第一条道。别的道第一次用到才起（起在并行里，不另花等待）。失败不抛（第一次真唱会再报）。 */
    warm(models?: string[], diskBytes?: number): Promise<void>;
    /** 念缓存持久层（全局池）：看大小 / 清空。走第一条道（不起引擎）。 */
    cache(op: "info" | "clear", diskBytes?: number): Promise<DiskInfo | null>;
    /** 读音（歌词旁显示引擎念成什么，v0.9.34）：问已经起来的那条道（第一条优先）；一条都没起 = ready false，不为此建 worker、不起引擎。 */
    read(s: LabScore): Promise<Reading>;
    get busy(): boolean;
    get queued(): number;
    /** 唱（排队；每条道一次一句）。内存不够（换着试很多音色之后 wasm 堆撑大了，月读的引擎起不来——user 2026-10-08 iPad「Out of memory」「感觉是没有gc」）
     *  = 重开那条道（全部还回去）再试一次；还不行才报错。同一位演奏者重来，不是换人（不自动替补）。 */
    sing(s: LabScore, progress?: (stage: string) => void, extra?: Extra): Promise<SingResult>;
    private pump;
    private singRetry;
    private singOnce;
    /** 只唱一个字（按键试听，刀 3）：不排队、直接给这一句自己的道（排在整句后面 = 迟到的音更烦；worker 在段界之间就会插进来）；念缓存命中时几毫秒。 */
    singOnly(s: LabScore, only: {
        entry: number;
        midi: number;
        secs: number;
    }, extra?: Omit<Extra, "only" | "raw" | "tag">): Promise<SingResult>;
    /** 全 app 共用的 AudioContext（必须在用户手势里先调过一次，iPad 才放声）。 */
    unlock(): AudioContext;
}
export {};
