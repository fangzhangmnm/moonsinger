// speech-cache.ts —— 月读的「念」缓存：piper 的两遍（预测时长 / 带 override 真念）和 WORLD 的分析只依赖歌词 / 语言 / 哼的参数，不依赖音符
//   （刀 0 核过 sing-core.mjs:110-136）。缓存做在 piper.run / world.analyze 的包装层：唱法核心一行不动，命中时交回去的是同样的数——
//   noise 0 逐样本不变（这一层不换精度；bf16 / 8 bit 的存法是另一个实验，要重定基线）。
// created 2026-10-09 by Claude Fable 5.1（提案 §7 / §13.7；user「歌词的transformer可以很早就算好，基本不需要动，动了也只动极少的」「智能cache要看计算的代价」）。
// 规矩：按字节预算 LRU（分析 Float64 sp + ap ≈ 1.6 MB / 语音秒，最贵也最值得留——刀 0：念 + 分析命中后只剩合成 ≈ 27 ms / 歌秒）；
//   念的结果命中交出去的是拷贝；分析交出去的是共享只读对象（hot）；两遍 piper 的键里带 override（第二遍的时长表）。
// 2026-10-10（Claude Fable 5.1）：**持久层 = 全局池**（src/singer/speech-store.ts，IndexedDB；user「建议一个全局池by key and model config hash而不是每首歌」）：
//   内存是热层；念的结果内存没有就去盘上拿（run 是 async 的）；分析是同步调用、不能等盘——所以在 run 回来那一刻把同一句的分析从盘上预取进内存。
//   未命中 = 算完后台写盘（写不进不影响唱）。盘上的键 = 模型配置标签 + 内容键的 sha256（attachStore 给的 model）。
import type { SpeechStore, StoredEntry } from "./speech-store.ts";

type Piper = { run(ids: number[], pros: number[][], o: Record<string, unknown>): Promise<{ audio: Float32Array; durations?: Float32Array }> } & Record<string, unknown>;
type Analysis = { f0: Float64Array; sp: Float64Array; ap: Float64Array };   // 其余字段（frames / fft / bins…）原样带着，这里不管
type Hooks = { stage?: (name: string) => void; check?: () => void } | null;
type World = { analyze(x: ArrayLike<number>, fs: number, o?: Record<string, unknown>, hooks?: Hooks): Analysis };

interface Entry { bytes: number; run?: { audio: Float32Array; durations?: Float32Array }; an?: { meta: Record<string, unknown>; f0: Float64Array; sp: Uint16Array; ap: Uint16Array } }
/** bf16（f32 的高 16 位，就近舍入）：分析的 sp / ap 存成它，内存 = f64 的 1/4（刀 5 精度分级；user「可以试试啊，样本本来就是你冻得，我不在乎」）。
 *  命中和未命中都经过同一次舍入 → 输出不随缓存状态变；和 Lab 命令行（f64）差几个 LSB。 */
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
export function toBf16(x: ArrayLike<number>): Uint16Array { const out = new Uint16Array(x.length); for (let i = 0; i < x.length; i++) { f32[0] = x[i]; const b = u32[0]; out[i] = ((b + 0x7fff + ((b >>> 16) & 1)) >>> 16) & 0xffff; } return out; }
export function fromBf16(x: Uint16Array): Float64Array { const out = new Float64Array(x.length); for (let i = 0; i < x.length; i++) { u32[0] = x[i] << 16; out[i] = f32[0]; } return out; }

export class SpeechCache {
  private map = new Map<string, Entry>();   // 插入顺序 = 最久没用的在前
  private bytes = 0;
  /** 分析按它来自哪段 piper 输出记（同一个 Float32Array 对象 → 同一次念） */
  private audioKey = new WeakMap<Float32Array, string>();
  /** 最近一次解好码的分析（按键试听连按同一句：不用每次把 bf16 解成 Float64 ≈ 1M 个数）。交出去的不拷贝——唱法核心不就地改这些数组（core 里 grep 过）。 */
  private hot: { key: string; an: Analysis } | null = null;
  hits = 0; misses = 0; diskHits = 0;
  budget: number;
  private store: SpeechStore | null = null; private model = "";
  private touched = new Map<string, number>();   // 盘上的 at 一分钟最多碰一次
  private diskKeys = new Map<string, string>();  // 内存键 → 盘键（算过一次就记着）
  private warned = false;
  constructor(budget = 32e6) { this.budget = budget; }   // 不用参数属性：Node 的 strip-only TS 不认
  get used(): number { return this.bytes; }
  setBudget(b: number): void { this.budget = b; this.trim(); }
  private touch(k: string, e: Entry): void { this.map.delete(k); this.map.set(k, e); }
  private put(k: string, e: Entry): void { const old = this.map.get(k); if (old) { this.bytes -= old.bytes; this.map.delete(k); } this.map.set(k, e); this.bytes += e.bytes; this.trim(); }
  private trim(): void { for (const [k, e] of this.map) { if (this.bytes <= this.budget) break; this.map.delete(k); this.bytes -= e.bytes; } }
  clear(): void { this.map.clear(); this.bytes = 0; this.hot = null; }
  /** 接上持久层；model = 模型配置标签（语音包 + 运行时包的 id）：换模型 = 另一组键。 */
  attachStore(store: SpeechStore | null, model: string): void { this.store = store; this.model = model; this.diskKeys.clear(); }
  get disk(): SpeechStore | null { return this.store; }
  private async diskKey(kind: "p" | "a", memKey: string, sub = ""): Promise<string> {
    const id = `${kind}|${memKey}`; let h = this.diskKeys.get(id);
    if (!h) { h = await sha256(memKey); this.diskKeys.set(id, h); }
    return `${this.model}|${kind}|${h}${sub}`;
  }
  private diskFail(e: unknown): void { if (this.warned) return; this.warned = true; console.warn("speech store: " + ((e as Error)?.message ?? e)); }
  private touchDisk(diskKey: string): void {
    const t = Date.now(); if ((this.touched.get(diskKey) ?? 0) > t - 60_000) return; this.touched.set(diskKey, t);
    this.store?.touch(diskKey).catch((e) => this.diskFail(e));
  }
  /** run 回来那一刻：这一句念的分析（可能几份：不同 fs / 参数）从盘上预取进内存，让同步的 analyze 能命中。 */
  private async prefetchAnalyses(pKey: string): Promise<void> {
    if (!this.store) return;
    for (const k of this.map.keys()) if (k.startsWith(`a:${pKey}:`)) return;   // 内存里已经有 = 不查盘
    try {
      const prefix = await this.diskKey("a", pKey, "|");
      for (const { key, e } of await this.store.scan(prefix)) {
        if (e.kind !== "a" || this.map.has(e.k)) continue;
        this.put(e.k, { bytes: e.bytes, an: { meta: e.meta, f0: e.f0, sp: e.sp, ap: e.ap } });
        this.diskKeys.set(`a|${e.k}`, key.slice(prefix.length - 1 - 64, prefix.length - 1));   // 盘键里的哈希就是内存键的 sha256
        this.diskHits++;
      }
    } catch (e) { this.diskFail(e); }
  }

  wrapPiper<P extends Piper>(piper: P): P {
    const self = this, run = piper.run.bind(piper);
    return { ...piper, run: async (ids: number[], pros: number[][], o: Record<string, unknown>) => {
      const k = "p:" + JSON.stringify([ids, pros, o]);
      let had = self.map.get(k);
      if (!had?.run && self.store) {   // 内存没有 → 盘上
        try { const dk = await self.diskKey("p", k), e = await self.store.get(dk); if (e?.kind === "p") { had = { bytes: e.bytes, run: { audio: e.audio, durations: e.durations } }; self.put(k, had); self.diskHits++; self.touchDisk(dk); } } catch (e) { self.diskFail(e); }
      }
      if (had?.run) { self.hits++; self.touch(k, had); const a = had.run.audio.slice(); self.audioKey.set(a, k); await self.prefetchAnalyses(k); return { audio: a, durations: had.run.durations?.slice() }; }
      self.misses++;
      const r = await run(ids, pros, o);
      const keep = { audio: r.audio.slice(), durations: r.durations?.slice() };
      self.put(k, { bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), run: keep });
      self.audioKey.set(r.audio, k);
      if (self.store) void self.diskKey("p", k).then((dk) => self.store!.put(dk, { kind: "p", k, bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), audio: keep.audio, durations: keep.durations })).catch((e) => self.diskFail(e));
      await self.prefetchAnalyses(k);
      return r;
    } } as P;
  }
  wrapWorld<W extends World>(world: W): W {
    const self = this, analyze = world.analyze.bind(world);
    return { ...world, analyze: (x: ArrayLike<number>, fs: number, o?: Record<string, unknown>, hooks: Hooks = null) => {
      const from = x instanceof Float32Array ? self.audioKey.get(x) : undefined;
      const k = from ? `a:${from}:${fs}:${JSON.stringify(o ?? {})}` : null;
      const had = k ? self.map.get(k) : undefined;
      if (had?.an) {
        self.hits++; self.touch(k!, had); hooks?.stage?.("cached"); hooks?.check?.();
        if (self.store && from) void self.diskKey("a", from, `|${self.diskKeys.get(`a|${k}`) ?? ""}`).then((dk) => { if (self.diskKeys.has(`a|${k}`)) self.touchDisk(dk); }).catch(() => undefined);
        if (self.hot?.key === k) return self.hot.an;
        const an = { ...had.an.meta, f0: had.an.f0.slice(), sp: fromBf16(had.an.sp), ap: fromBf16(had.an.ap) } as Analysis; self.hot = { key: k!, an }; return an;
      }
      self.misses++;
      const an = analyze(x, fs, o, hooks), { f0, sp, ap, ...meta } = an, spB = toBf16(sp), apB = toBf16(ap);
      if (k) {
        const bytes = f0.byteLength + spB.byteLength + apB.byteLength, f0c = f0.slice();
        self.put(k, { bytes, an: { meta, f0: f0c, sp: spB, ap: apB } });
        if (self.store && from) void Promise.all([self.diskKey("a", from, "|"), sha256(k)]).then(([pre, h]) => { self.diskKeys.set(`a|${k}`, h); return self.store!.put(pre + h, { kind: "a", k, bytes, meta: structuredClone(meta), f0: f0c, sp: spB, ap: apB }); }).catch((e) => self.diskFail(e));
      }
      const outAn = { ...meta, f0, sp: fromBf16(spB), ap: fromBf16(apB) } as Analysis;   // 未命中也走一遍 bf16：和命中时一样的数
      if (k) self.hot = { key: k, an: outAn };
      return outAn;
    } } as W;
  }
}

/** 内容键 → 盘键用的哈希（SHA-256 十六进制；没有 crypto.subtle 时退回两段 FNV-1a，只是键不是安全）。 */
async function sha256(text: string): Promise<string> {
  const sub = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
  if (sub) { const d = await sub.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
  let a = 2166136261, b = 16777619 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b ^ c, 16777619) ^ (b >>> 13); }
  return ((a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0")).padEnd(64, "0");
}
