// resource-watch.ts —— 刀 6 ④：负载和内存监控防闪退（user 2026-10-10「负载和内存监控防闪退 做」；阶梯 = user 同日「超预算先放块 / 减并行 / 明说」）。
// created 2026-10-10 by Claude Fable 5.1
// 纯函数：主线程把能算到的数（每条月读 worker 的 WASM 堆 + 念缓存、录音房里的块、音源在内存里的整包、音频线程的忙闲）凑成一张快照，
//   这里按设备预算给出建议；真的动手（放块 / 关一条道 / 重开引擎 / 说一句）在 main.ts。
// 为什么是预算不是真量：iPad / Safari 量不到页面总内存，闪退（jetsam）也没有任何事件——只能把我们自己占的那部分管在预算内、涨上去就减。
// 听不见的事不自动做：减并行 / 放块对声音零影响；重开引擎只在那条道空着时做（念缓存会丢，明说）；效果链 / 声部从不自动动（那是用户的混音）。

export interface DeviceInfo { ios: boolean; cores: number; deviceMemoryGB: number | null }
export interface Budget {
  /** 几条月读的工作道（PC 2、iPad 1；user「两个 worker 并行唱（PC）；iPad 不开」）。 */
  lanes: number;
  /** 我们自己占的那部分（worker 堆 + 念缓存 + 块 + 音源内存）加起来超过这个 = 开始减。 */
  total: number;
  /** 一条 worker 的 WASM 堆超过这个 = 空下来就重开（堆只涨不落）。 */
  perWorker: number;
  /** 录音房里留的块（Int16）超过这个 = 放远处的。 */
  chunkBytes: number;
  /** 念缓存持久层（全局池，IndexedDB）的字节预算（user 2026-10-10「代价约每首32MB」：小设备约 4 首、桌面约 16 首）。 */
  speechDisk: number;
}
export interface LaneMem { wasm: number; cache: number }
export interface Snapshot {
  lanes: LaneMem[];           // 每条道最近一次报的数（没报过 = 不在）
  chunkBytes: number; chunks: number;
  soundMem: number;
  /** 音频线程最近 1 s 的忙闲（0–1；null = 没在报）。 */
  audioBusy: number | null;
}
export type Advice =
  | { kind: "pruneChunks"; toBytes: number }
  | { kind: "fewerLanes"; lanes: number }
  | { kind: "restartLane"; lane: number }
  | { kind: "audioHot"; busy: number };

const MB = 1e6;
/** 设备预算：iPad / 手机按「别被系统杀」来；桌面宽松。cores / deviceMemory 浏览器不给就按保守的算。 */
export function budgetFor(d: DeviceInfo): Budget {
  const small = d.ios || (d.deviceMemoryGB !== null && d.deviceMemoryGB <= 4);
  if (small) return { lanes: 1, total: 600 * MB, perWorker: 420 * MB, chunkBytes: 24 * MB, speechDisk: 128 * MB };
  const mid = d.deviceMemoryGB !== null && d.deviceMemoryGB < 8;
  return { lanes: !mid && d.cores >= 4 ? 2 : 1, total: mid ? 1200 * MB : 2500 * MB, perWorker: mid ? 700 * MB : 1400 * MB, chunkBytes: mid ? 64 * MB : 160 * MB, speechDisk: 512 * MB };
}
export const totalBytes = (s: Snapshot): number => s.lanes.reduce((n, l) => n + l.wasm + l.cache, 0) + s.chunkBytes + s.soundMem;

/** 音频线程算「热」的门槛（忙闲比；超过 = 可能爆音）。 */
export const AUDIO_HOT = 0.85;

/** 超预算的阶梯（按顺序，一次只建议一步，做了再看下一次快照）：① 块超了先放块 ② 两条道关一条 ③ 某条道的堆超了 = 重开它 ④ 音频线程热 = 明说（并减并行）。 */
export function advise(s: Snapshot, b: Budget): Advice[] {
  const out: Advice[] = [];
  const over = totalBytes(s) > b.total;
  if (s.chunkBytes > b.chunkBytes || (over && s.chunkBytes > b.chunkBytes / 2)) out.push({ kind: "pruneChunks", toBytes: Math.floor(Math.min(b.chunkBytes, s.chunkBytes) / 2) });
  else if (over && s.lanes.length > 1) out.push({ kind: "fewerLanes", lanes: 1 });
  else { const i = s.lanes.findIndex((l) => l.wasm > b.perWorker); if (i >= 0) out.push({ kind: "restartLane", lane: i }); else if (over && s.lanes.length) out.push({ kind: "restartLane", lane: s.lanes.map((l, k) => [l.wasm, k] as const).sort((a, c) => c[0] - a[0])[0][1] }); }
  if (s.audioBusy !== null && s.audioBusy > AUDIO_HOT) { out.push({ kind: "audioHot", busy: s.audioBusy }); if (s.lanes.length > 1 && !out.some((a) => a.kind === "fewerLanes")) out.push({ kind: "fewerLanes", lanes: 1 }); }
  return out;
}

const sizeText = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${(n / 1e3).toFixed(0)} KB`);
/** 设置页 / 诊断用的一句人话（能算的那部分，不假装是页面总内存）。 */
export function describe(s: Snapshot, b: Budget): string {
  const lanes = s.lanes.length ? s.lanes.map((l, i) => `道 ${i + 1}：堆 ${sizeText(l.wasm)} + 念缓存 ${sizeText(l.cache)}`).join("；") : "月读引擎没起";
  const audio = s.audioBusy === null ? "音频线程：没在报" : `音频线程最近 1 s 忙 ${Math.round(s.audioBusy * 100)}%${s.audioBusy > AUDIO_HOT ? "（热：可能爆音）" : ""}`;
  return `能算到的占用 ${sizeText(totalBytes(s))} / 预算 ${sizeText(b.total)}（${lanes}；录音房里 ${s.chunks} 块 ${sizeText(s.chunkBytes)}；音源内存 ${sizeText(s.soundMem)}）。${audio}。`;
}
