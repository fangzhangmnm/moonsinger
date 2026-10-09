// speech-cache.ts —— 月读的「念」缓存：piper 的两遍（预测时长 / 带 override 真念）和 WORLD 的分析只依赖歌词 / 语言 / 哼的参数，不依赖音符
//   （刀 0 核过 sing-core.mjs:110-136）。缓存做在 piper.run / world.analyze 的包装层：唱法核心一行不动，命中时交回去的是同样的数——
//   noise 0 逐样本不变（这一层不换精度；bf16 / 8 bit 的存法是另一个实验，要重定基线）。
// created 2026-10-09 by Claude Fable 5.1（提案 §7 / §13.7；user「歌词的transformer可以很早就算好，基本不需要动，动了也只动极少的」「智能cache要看计算的代价」）。
// 规矩：按字节预算 LRU（分析 Float64 sp + ap ≈ 1.6 MB / 语音秒，最贵也最值得留——刀 0：念 + 分析命中后只剩合成 ≈ 27 ms / 歌秒）；
//   命中交出去的是拷贝（唱法核心会不会就地改这些数组不用管）；两遍 piper 的键里带 override（第二遍的时长表）。

type Piper = { run(ids: number[], pros: number[][], o: Record<string, unknown>): Promise<{ audio: Float32Array; durations?: Float32Array }> } & Record<string, unknown>;
type Analysis = { f0: Float64Array; sp: Float64Array; ap: Float64Array };   // 其余字段（frames / fft / bins…）原样带着，这里不管
type World = { analyze(x: ArrayLike<number>, fs: number, o?: Record<string, unknown>): Analysis };

interface Entry { bytes: number; run?: { audio: Float32Array; durations?: Float32Array }; an?: Analysis }

export class SpeechCache {
  private map = new Map<string, Entry>();   // 插入顺序 = 最久没用的在前
  private bytes = 0;
  /** 分析按它来自哪段 piper 输出记（同一个 Float32Array 对象 → 同一次念） */
  private audioKey = new WeakMap<Float32Array, string>();
  hits = 0; misses = 0;
  budget: number;
  constructor(budget = 32e6) { this.budget = budget; }   // 不用参数属性：Node 的 strip-only TS 不认
  get used(): number { return this.bytes; }
  setBudget(b: number): void { this.budget = b; this.trim(); }
  private touch(k: string, e: Entry): void { this.map.delete(k); this.map.set(k, e); }
  private put(k: string, e: Entry): void { const old = this.map.get(k); if (old) { this.bytes -= old.bytes; this.map.delete(k); } this.map.set(k, e); this.bytes += e.bytes; this.trim(); }
  private trim(): void { for (const [k, e] of this.map) { if (this.bytes <= this.budget) break; this.map.delete(k); this.bytes -= e.bytes; } }
  clear(): void { this.map.clear(); this.bytes = 0; }

  wrapPiper<P extends Piper>(piper: P): P {
    const self = this, run = piper.run.bind(piper);
    return { ...piper, run: async (ids: number[], pros: number[][], o: Record<string, unknown>) => {
      const k = "p:" + JSON.stringify([ids, pros, o]);
      const had = self.map.get(k);
      if (had?.run) { self.hits++; self.touch(k, had); const a = had.run.audio.slice(); self.audioKey.set(a, k); return { audio: a, durations: had.run.durations?.slice() }; }
      self.misses++;
      const r = await run(ids, pros, o);
      const keep = { audio: r.audio.slice(), durations: r.durations?.slice() };
      self.put(k, { bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), run: keep });
      self.audioKey.set(r.audio, k);
      return r;
    } } as P;
  }
  wrapWorld<W extends World>(world: W): W {
    const self = this, analyze = world.analyze.bind(world);
    return { ...world, analyze: (x: ArrayLike<number>, fs: number, o?: Record<string, unknown>) => {
      const from = x instanceof Float32Array ? self.audioKey.get(x) : undefined;
      const k = from ? `a:${from}:${fs}:${JSON.stringify(o ?? {})}` : null;
      const had = k ? self.map.get(k) : undefined;
      if (had?.an) { self.hits++; self.touch(k!, had); return { ...had.an, f0: had.an.f0.slice(), sp: had.an.sp.slice(), ap: had.an.ap.slice() }; }
      self.misses++;
      const an = analyze(x, fs, o);
      if (k) self.put(k, { bytes: an.f0.byteLength + an.sp.byteLength + an.ap.byteLength, an: { ...an, f0: an.f0.slice(), sp: an.sp.slice(), ap: an.ap.slice() } });
      return an;
    } } as W;
  }
}
