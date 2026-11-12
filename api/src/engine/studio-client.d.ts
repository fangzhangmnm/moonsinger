import { type VelCurve } from "../gm/sf2-subset.ts";
import { type StudioIn, type TimelineMsg, type ChannelParams, type MasterParams, type BusSpec, type VowelEntry, type AuditionInst } from "./studio.ts";
export interface VowelTableMsg {
    sr: number;
    entries: VowelEntry[];
    pcm: Int16Array;
}
export interface LoadInfo {
    busy: number;
    chunkBytes: number;
    chunks: number;
    voices: number;
}
/** 一条位置报告：音频时钟 at 那一刻，走带在 sec；run = 正在往前走（放着、没在等块）。 */
export interface PosSample {
    at: number;
    sec: number;
    run: boolean;
}
/** 扬声器此刻（音频时钟 T）放的是走带的哪儿：找 T 之前最近的一条报告，往前推 T − at（在等块 / 停着 = 不推）。T 比最早一条还早 = 那一条的位置。纯函数（测试用）。 */
export declare function audibleAt(hist: readonly PosSample[], T: number): number | null;
/** 扬声器此刻放到音频时钟的哪一刻，以及按哪一档算的（v0.10.3，Claude Opus 5.5；user「大部分音和动画没对齐都是发生在长锁屏之后回到前台」）。
 *  getOutputTimestamp 给一对（音频时钟, performance 时钟），要用 performance.now() 从那一刻往前推——这一推假定两个时钟一起走；
 *  设备睡过一觉，两个时钟可能对不上（一个算睡眠、一个不算），推出来的时刻会跑到录音房算到的前面，播放头就提前（audibleAt 还会接着往前推）。
 *  所以先查合理：扬声器不可能比录音房算到的（currentTime）更靠前，输出延迟也不会超过 MAX_OUTPUT_LAT。
 *  ① 推出来的合理 = 用它（"ts"）② 不合理 = 不推、只用时间戳里的音频时钟（最多落后一个回调，约 10 ms；"ts-ctx"）③ 那个也不合理（时间戳冻住了）= currentTime − 两个延迟（"estimate"）。 */
export type ClockSource = "ts" | "ts-ctx" | "estimate";
export declare const MAX_OUTPUT_LAT = 1;
export declare function outputClock(o: {
    currentTime: number;
    ts: {
        contextTime: number;
        performanceTime: number;
    } | null;
    perfNow: number;
    baseLatency?: number;
    outputLatency?: number;
}): {
    T: number;
    src: ClockSource;
} | null;
export interface StudioEvents {
    pos: (sec: number, playing: boolean, waiting: string | null) => void;
    ended: () => void;
    missing: (keys: string[]) => void;
    meter: (peak: number, active: number, tracks: Record<string, number>, ms: Record<string, number>, gr: Record<string, number>, cl: Record<string, [number, number]>) => void;
    stereo: (tracks: Record<string, {
        L: Float32Array;
        R: Float32Array;
    }>) => void;
    spectrum: (sr: number, tracks: Record<string, Float32Array>) => void;
    load: (info: LoadInfo) => void;
    crash: (message: string) => void;
}
export declare class StudioClient {
    private node;
    private readyP;
    private wasm;
    private presets;
    private bankWait;
    private bankBytes;
    private vowelTable;
    private tl;
    private chunkKeys;
    private pendingChunks;
    private chunkWait;
    private channels;
    private masterP;
    private busesP;
    private listeners;
    private _playing;
    private _pos;
    private _waiting;
    private gen;
    private hist;
    private ctx;
    private addModule;
    private wasmBytes;
    constructor(ctx: () => AudioContext, addModule: (ctx: AudioContext) => Promise<void>, wasmBytes: () => Promise<Uint8Array>);
    on<K extends keyof StudioEvents>(ev: K, cb: StudioEvents[K]): () => void;
    private emit;
    get playing(): boolean;
    get position(): number;
    get waiting(): string | null;
    get timeline(): TimelineMsg | null;
    hasChunk(key: string): boolean;
    private wasmModule;
    /** 装好 worklet + WASM（第一次用才做；AudioContext 可以还没解锁）。 */
    ensure(): Promise<void>;
    private post;
    /** 载一份 sf2（按 sha 留着，多份并存；同一份不重载）。resolve = worklet 里装好了（预设表可查）。 */
    bank(sha: string, bytes: Uint8Array): Promise<void>;
    hasBank(sha: string): boolean;
    /** 现在装着哪些库（sha；诊断 / 测试看：试听过的只留几件，v0.16.23）。 */
    banks(): string[];
    /** 预设下标（这份库里按 bank:program 找；没有 = −1）。 */
    presetIndex(sha: string, bank: number, program: number): number;
    private curves;
    /** L 曲线（7-N）：从载库时留着的字节算，按预设记着（曲线自己按键懒算）；库没载 / 没有这个预设 = null（不记，载好了再问就有）。 */
    velCurve(sha: string, bank: number, program: number): VelCurve | null;
    unbank(sha: string): void;
    vowels(t: VowelTableMsg): void;
    setTimeline(tl: TimelineMsg): void;
    /** 喂一块：转成 Int16 转移给录音房（只在那边留一份；离线导出再要回来）。worklet 还没装好 = 先排着、装好就发。 */
    chunk(key: string, sr: number, samples: Float32Array | Int16Array): void;
    forget(keys: string[]): void;
    /** 向录音房要几块（拷贝）：离线导出用。 */
    private fetchChunks;
    channel(id: string, p: Partial<ChannelParams>): void;
    master(p: Partial<MasterParams>): void;
    /** 总线（混响 / 延迟这类「留在屋里的」）：整张表一起给。 */
    buses(b: BusSpec[]): void;
    /** 从 at 秒放起（不给 = 从范围头 / 上次位置）。要先在用户手势里解锁过 AudioContext（iPad）。 */
    /** quiet = 起点（从某一段放时 at 比它提前一点）：在它之前就结束的音 / 唱完的块这次不出声（v0.10.3）。 */
    play(at?: number, quiet?: number): Promise<void>;
    stop(): void;
    /** 扬声器此刻在放音频时钟的哪一刻（getOutputTimestamp：浏览器按硬件的输出缓冲报的；没有就用 currentTime − 两个延迟估）。 */
    outputTime(): number | null;
    /** 最近一次 outputTime() 按哪一档算的（黑匣子用）。 */
    clockSrc: ClockSource | null;
    /** 输出延迟（ms）：录音房算到的 vs 扬声器放到的（诊断 / 设置页看）。 */
    latencyMs(): number | null;
    /** 现在**听到的**是走带的哪儿（播放头画这里）；没有报告 = null（退回 position）。 */
    audibleSec(): number | null;
    seek(at: number, quiet?: number): void;
    /** 按键试听（要先 ensure 过；没装好的这一下丢掉——试听要即时，迟到的音更烦）。 */
    audition(m: Omit<Extract<StudioIn, {
        type: "audition";
    }>, "type">): void;
    auditionOn(src: string, inst: AuditionInst, key: number, vel: number, gainDb: number, pan: number): void;
    auditionOff(src: string): void;
    auditionGlide(src: string, key: number): void;
    auditionAllOff(): void;
    /** 放一段现成的声音当试听（月读唱的一个字；samples 转移过去）。 */
    auditionClip(src: string, sr: number, samples: Float32Array, gainDb: number, pan: number): void;
    meter(on: boolean): void;
    /** 频谱开关（混音台 EQ 页看得见才开；v0.10.11）。 */
    spectrum(on: boolean): void;
    /** 李萨如图（总轨 / 混音轨的左右采样）：开着才攒（混音台「基础」页看得见时）。 */
    stereo(on: boolean): void;
    private specOn;
    private stereoOn;
    get now(): number;
    /** 离线导出：同一个 Studio 类在主线程循环里跑同样的块网格（每 400 块让一次事件循环，界面不卡）。输出从 range.from 起、扣掉限幅器的延迟。
     *  tl 不给 = 现在的时间线；progress(0…1)。 */
    renderOffline(tl?: TimelineMsg | null, o?: {
        sr?: number;
        progress?: (f: number) => void;
    }): Promise<{
        left: Float32Array;
        right: Float32Array;
        sr: number;
        start: number;
    }>;
}
