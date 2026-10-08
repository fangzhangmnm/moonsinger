// synth.ts —— 主线程这边的实时 SoundFont 合成器：装 worklet（dist/synth-worklet-<hash>.mjs）、把 WASM 编好递进去、载歌里嵌的子集、按下 / 松开。
// created 2026-10-07 by Claude Fable 5.1。试听走它（pad 按下 note-on、松开 note-off，长音乐器按着就一直响）；以后的实时播放也走它（事件带时间戳提前排）。
// 一个 app 一个实例；换候选 = 换载的子集（几 MB，瞬时）。没载好之前的按键丢掉（不排队——试听要的是即时，迟到的音更烦）。
import type { SynthIn, SynthOut } from "./synth-processor.ts";

export class GmSynth {
  private node: AudioWorkletNode | null = null;
  private moduleAdded: Promise<void> | null = null;
  private wasm: Promise<WebAssembly.Module> | null = null;
  private readyP: Promise<void> | null = null;
  private seq = 0;
  private pending = new Map<number, { ok: () => void; fail: (e: Error) => void }>();
  private loadedSha = "";
  private loading: Promise<void> | null = null;
  private presets = new Map<string, number>();   // "bank:program" → 预设下标
  private meterCb: ((peak: number, active: number) => void) | null = null;

  private ctx: () => AudioContext; private moduleUrl: URL; private wasmUrl: URL;
  constructor(ctx: () => AudioContext, moduleUrl: URL, wasmUrl: URL) { this.ctx = ctx; this.moduleUrl = moduleUrl; this.wasmUrl = wasmUrl; }

  /** 装好 worklet + WASM（第一次用才做；AudioContext 可以还没解锁）。 */
  private ensure(): Promise<void> {
    if (this.readyP) return this.readyP;
    this.readyP = (async () => {
      const ctx = this.ctx();
      this.moduleAdded ??= ctx.audioWorklet.addModule(this.moduleUrl.href);
      this.wasm ??= fetch(this.wasmUrl).then(async (r) => { if (!r.ok) throw new Error(`TinySoundFont (standalone): HTTP ${r.status}`); return WebAssembly.compile(await r.arrayBuffer()); });
      const [, module] = await Promise.all([this.moduleAdded, this.wasm]);
      const node = new AudioWorkletNode(ctx, "gm-synth", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { module } });
      await new Promise<void>((ok, fail) => {
        node.port.onmessage = (e: MessageEvent<SynthOut>) => {
          const m = e.data;
          if (m.type === "ready") ok();
          else if (m.type === "loaded") { this.pending.get(m.id)?.ok(); this.pending.delete(m.id); this.presets = new Map(m.presets.map(([b, p], i) => [`${b}:${p}`, i])); }
          else if (m.type === "error") { if (m.id !== undefined) { this.pending.get(m.id)?.fail(new Error(m.message)); this.pending.delete(m.id); } else fail(new Error(m.message)); }
          else if (m.type === "meter") this.meterCb?.(m.peak, m.active);
        };
      });
      node.connect(ctx.destination);
      this.node = node;
    })().catch((e) => { this.readyP = null; throw e; });
    return this.readyP;
  }
  private post(m: SynthIn, transfer: Transferable[] = []): void { this.node?.port.postMessage(m, transfer); }

  /** 载一份子集（同一份不重载）。 */
  async load(sha: string, bytes: Uint8Array): Promise<void> {
    if (this.loadedSha === sha) return;
    if (this.loading) await this.loading.catch(() => {});
    if (this.loadedSha === sha) return;
    this.loading = (async () => {
      await this.ensure();
      const id = ++this.seq, copy = bytes.slice();
      await new Promise<void>((ok, fail) => { this.pending.set(id, { ok, fail }); this.post({ type: "load", id, sha, bytes: copy }, [copy.buffer]); });
      this.loadedSha = sha;
    })().finally(() => { this.loading = null; });
    return this.loading;
  }
  get loaded(): string { return this.loadedSha; }
  /** 预设下标（载好的子集里按 bank:program 找；没有 = −1）。 */
  presetIndex(bank: number, program: number): number { return this.presets.get(`${bank}:${program}`) ?? -1; }
  /** 按下 / 松开（t = AudioContext 的秒，不给 = 立刻）。 */
  noteOn(bank: number, program: number, key: number, vel: number, t?: number): void { const p = this.presetIndex(bank, program); if (p >= 0) this.post({ type: "noteOn", preset: p, key, vel, t }); }
  noteOff(bank: number, program: number, key: number, t?: number): void { const p = this.presetIndex(bank, program); if (p >= 0) this.post({ type: "noteOff", preset: p, key, t }); }
  allOff(): void { this.post({ type: "allOff" }); }
  unload(): void { this.post({ type: "unload" }); this.loadedSha = ""; this.presets.clear(); }
  /** 电平表（e2e / 调试用）：每 1024 帧回报峰值和正在发声的 voice 数。 */
  meter(cb: ((peak: number, active: number) => void) | null): void { this.meterCb = cb; this.post({ type: "meter", on: !!cb }); }
  get now(): number { return this.ctx().currentTime; }
}
