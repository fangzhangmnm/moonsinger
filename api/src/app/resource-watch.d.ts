export interface DeviceInfo {
    ios: boolean;
    cores: number;
    deviceMemoryGB: number | null;
}
export interface Budget {
    /** 几条月读的工作道（PC 2、iPad 1；user「两个 worker 并行唱（PC）；iPad 不开」）。 */
    lanes: number;
    /** 我们自己占的那部分（worker 堆 + 念缓存 + 块 + 音源内存）加起来超过这个 = 开始减。 */
    total: number;
    /** 录音房里留的块（Int16）超过这个 = 放远处的。 */
    chunkBytes: number;
    /** 念缓存持久层（全局池，IndexedDB）的字节预算（user 2026-10-10「代价约每首32MB」：小设备约 4 首、桌面约 16 首）。 */
    speechDisk: number;
}
/** base = 引擎刚加载完那一刻的堆（worker 自己量，v0.10.3）：引擎活着本来就要这么多（模型 + 词典 + WORLD 起始），重开只能还回比它多涨的那一截。 */
export interface LaneMem {
    wasm: number;
    cache: number;
    base?: number;
}
export interface Snapshot {
    lanes: LaneMem[];
    chunkBytes: number;
    chunks: number;
    soundMem: number;
    /** 音频线程最近 1 s 的忙闲（0–1；null = 没在报）。 */
    audioBusy: number | null;
}
export type Advice = {
    kind: "pruneChunks";
    toBytes: number;
} | {
    kind: "fewerLanes";
    lanes: number;
} | {
    kind: "audioHot";
    busy: number;
};
/** 设备预算：iPad / 手机按「别被系统杀」来；桌面宽松。cores / deviceMemory 浏览器不给就按保守的算。 */
export declare function budgetFor(d: DeviceInfo): Budget;
export declare const totalBytes: (s: Snapshot) => number;
/** 音频线程算「热」的门槛（忙闲比；超过 = 可能爆音）。 */
export declare const AUDIO_HOT = 0.85;
/** 换歌时哪几条道该重开（下标；没起的道 = null 跳过）：比引擎刚起来多涨了一大截的。忙不忙由宿主看（正在唱的不动，下次换歌再说）。 */
export declare function trimOnSongSwitch(lanes: readonly (LaneMem | null)[]): number[];
/** 超预算的阶梯（按顺序，一次只建议一步，做了再看下一次快照）：① 块超了先放块 ② 两条道关一条 ③ 音频线程热 = 明说（并减并行）。
 *  同一首歌里不重开引擎（见文件头 v0.10.3）。 */
export declare function advise(s: Snapshot, b: Budget): Advice[];
/** 设置页 / 诊断用的一句人话（能算的那部分，不假装是页面总内存）。 */
export declare function describe(s: Snapshot, b: Budget): string;
