// resource-watch.ts —— 刀 6 ④：负载和内存监控防闪退（user 2026-10-10「负载和内存监控防闪退 做」；阶梯 = user 同日「超预算先放块 / 减并行 / 明说」）。
// created 2026-10-10 by Claude Fable 5.1
// 纯函数：主线程把能算到的数（每条月读 worker 的 WASM 堆 + 念缓存、录音房里的块、音源在内存里的整包、音频线程的忙闲）凑成一张快照，
//   这里按设备预算给出建议；真的动手（放块 / 关一条道 / 重开引擎 / 说一句）在 main.ts。
// 为什么是预算不是真量：iPad / Safari 量不到页面总内存，闪退（jetsam）也没有任何事件——只能把我们自己占的那部分管在预算内、涨上去就减。
// 听不见的事不自动做：减并行 / 放块对声音零影响；效果链 / 声部从不自动动（那是用户的混音）。
// 重开引擎（v0.10.3 改，Claude Opus 5.5；user「现在还是天天报内存太多的错，有时候月读还会内存不够读不了」）：**同一首歌里不重开**——堆涨上去 = 这首歌最长那一句要的
//   （实测 WORLD 的堆约 3.3 MB / 秒句长、只涨不落；起引擎 307 MB），重开了下一遍放又涨回来，白白多建三块 WASM 内存、每次还弹一句。
//   只在换歌时把上一首长句撑大的那条道静默还回去（trimOnSongSwitch；念缓存盘上那份还在，不用重念）。

export interface DeviceInfo { ios: boolean; cores: number; deviceMemoryGB: number | null }
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
export interface LaneMem { wasm: number; cache: number; base?: number }
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
  | { kind: "audioHot"; busy: number };

const MB = 1e6;
/** 设备预算：iPad / 手机按「别被系统杀」来；桌面宽松。cores / deviceMemory 浏览器不给就按保守的算。 */
export function budgetFor(d: DeviceInfo): Budget {
  const small = d.ios || (d.deviceMemoryGB !== null && d.deviceMemoryGB <= 4);
  if (small) return { lanes: 1, total: 600 * MB, chunkBytes: 24 * MB, speechDisk: 128 * MB };
  const mid = d.deviceMemoryGB !== null && d.deviceMemoryGB < 8;
  return { lanes: !mid && d.cores >= 4 ? 2 : 1, total: mid ? 1200 * MB : 2500 * MB, chunkBytes: mid ? 64 * MB : 160 * MB, speechDisk: 512 * MB };
}
export const totalBytes = (s: Snapshot): number => s.lanes.reduce((n, l) => n + l.wasm + l.cache, 0) + s.chunkBytes + s.soundMem;

/** 音频线程算「热」的门槛（忙闲比；超过 = 可能爆音）。 */
export const AUDIO_HOT = 0.85;

/** 重开一条道能还回来多少：比基线多涨的那一截（没有基线 = 不知道 = 当 0）。 */
const freeable = (l: LaneMem): number => (l.base !== undefined ? Math.max(0, l.wasm - l.base) : 0);
/** 值不值得重开：多涨的超过 100 MB 或基线的三成（取大的）≈ 上一首有句子长过 30 秒。 */
const worth = (l: LaneMem): boolean => freeable(l) > Math.max(100 * MB, 0.3 * (l.base ?? 0));
/** 换歌时哪几条道该重开（下标；没起的道 = null 跳过）：比引擎刚起来多涨了一大截的。忙不忙由宿主看（正在唱的不动，下次换歌再说）。 */
export function trimOnSongSwitch(lanes: readonly (LaneMem | null)[]): number[] {
  return lanes.flatMap((l, i) => (l && worth(l) ? [i] : []));
}
/** 超预算的阶梯（按顺序，一次只建议一步，做了再看下一次快照）：① 块超了先放块 ② 两条道关一条 ③ 音频线程热 = 明说（并减并行）。
 *  同一首歌里不重开引擎（见文件头 v0.10.3）。 */
export function advise(s: Snapshot, b: Budget): Advice[] {
  const out: Advice[] = [];
  const over = totalBytes(s) > b.total;
  if (s.chunkBytes > b.chunkBytes || (over && s.chunkBytes > b.chunkBytes / 2)) out.push({ kind: "pruneChunks", toBytes: Math.floor(Math.min(b.chunkBytes, s.chunkBytes) / 2) });
  else if (over && s.lanes.length > 1) out.push({ kind: "fewerLanes", lanes: 1 });
  if (s.audioBusy !== null && s.audioBusy > AUDIO_HOT) { out.push({ kind: "audioHot", busy: s.audioBusy }); if (s.lanes.length > 1 && !out.some((a) => a.kind === "fewerLanes")) out.push({ kind: "fewerLanes", lanes: 1 }); }
  return out;
}

const sizeText = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${(n / 1e3).toFixed(0)} KB`);
/** 设置页 / 诊断用的一句人话（能算的那部分，不假装是页面总内存）。 */
export function describe(s: Snapshot, b: Budget): string {
  const lanes = s.lanes.length ? s.lanes.map((l, i) => `道 ${i + 1}：堆 ${sizeText(l.wasm)}${l.base !== undefined ? `（刚起来 ${sizeText(l.base)}）` : ""} + 念缓存 ${sizeText(l.cache)}`).join("；") : "月读引擎没起";
  const audio = s.audioBusy === null ? "音频线程：没在报" : `音频线程最近 1 s 忙 ${Math.round(s.audioBusy * 100)}%${s.audioBusy > AUDIO_HOT ? "（热：可能爆音）" : ""}`;
  return `能算到的占用 ${sizeText(totalBytes(s))} / 预算 ${sizeText(b.total)}（${lanes}；录音房里 ${s.chunks} 块 ${sizeText(s.chunkBytes)}；音源内存 ${sizeText(s.soundMem)}）。${audio}。`;
}
