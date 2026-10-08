// synth-processor.ts —— AudioWorklet 里的实时 SoundFont 合成器（TinySoundFont 独立 WASM）：按下 note-on、松开 note-off，由乐器自己的包络收尾。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「钢琴按了之后一会声音就没了」「preview的时候那些可以长时间的乐器 包络是不是没做」「做，这个以后我们要做实时播放的」。
// · 事件可带时间戳 t（AudioContext 的秒）：在量程（128 帧）里按采样位置施加，采样级精确——给以后的实时播放（主线程提前排事件）打底；不带 t = 立刻。
// · 单声道渲染，拷到每个输出声道；pan / 增益归录音房那层。
// · 这是单独打包的模块（scripts/build.sh → dist/synth-worklet-<hash>.mjs），主线程 audioWorklet.addModule 装进来；WASM Module 由主线程编好经 processorOptions 递进来。
import { instantiateTsf, type Tsf, type TsfBank } from "./tsf-standalone.ts";

declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(options?: unknown) }
declare function registerProcessor(name: string, ctor: new (options: { processorOptions: { module: WebAssembly.Module } }) => AudioWorkletProcessor): void;

export type SynthIn =
  | { type: "load"; id: number; sha: string; bytes: Uint8Array }
  | { type: "unload" }
  | { type: "noteOn"; preset: number; key: number; vel: number; t?: number }
  | { type: "noteOff"; preset: number; key: number; t?: number }
  | { type: "allOff" }
  | { type: "meter"; on: boolean };
export type SynthOut =
  | { type: "ready" }
  | { type: "loaded"; id: number; sha: string; presets: [number, number][] }   // [bank, program] 按预设下标
  | { type: "error"; id?: number; message: string }
  | { type: "meter"; peak: number; active: number };

type Ev = { t: number | null; kind: "on" | "off"; preset: number; key: number; vel: number };

class GmSynthProcessor extends AudioWorkletProcessor {
  private tsf: Tsf | null = null;
  private bank: TsfBank | null = null;
  private sha = "";
  private queue: Ev[] = [];
  private meter = false; private meterPeak = 0; private meterFrames = 0;
  constructor(options: { processorOptions: { module: WebAssembly.Module } }) {
    super();
    this.port.onmessage = (e: MessageEvent<SynthIn>) => void this.onMessage(e.data);
    void instantiateTsf(options.processorOptions.module).then((t) => { this.tsf = t; this.port.postMessage({ type: "ready" } satisfies SynthOut); })
      .catch((err) => this.port.postMessage({ type: "error", message: `synth: wasm ${(err as Error).message}` } satisfies SynthOut));
  }
  private async onMessage(m: SynthIn): Promise<void> {
    switch (m.type) {
      case "load": {
        if (!this.tsf) { this.port.postMessage({ type: "error", id: m.id, message: "synth: wasm not ready" } satisfies SynthOut); return; }
        if (this.bank) { this.tsf.close(this.bank); this.bank = null; this.queue = []; }
        const b = this.tsf.load(m.bytes, sampleRate);
        if (!b) { this.port.postMessage({ type: "error", id: m.id, message: "synth: not a SoundFont 2 file" } satisfies SynthOut); return; }
        this.bank = b; this.sha = m.sha;
        this.port.postMessage({ type: "loaded", id: m.id, sha: m.sha, presets: b.presets.map((p) => [p.bank, p.program]) } satisfies SynthOut);
        return;
      }
      case "unload": if (this.bank && this.tsf) { this.tsf.close(this.bank); this.bank = null; this.sha = ""; this.queue = []; } return;
      case "noteOn": this.push({ t: m.t ?? null, kind: "on", preset: m.preset, key: m.key, vel: m.vel }); return;
      case "noteOff": this.push({ t: m.t ?? null, kind: "off", preset: m.preset, key: m.key, vel: 0 }); return;
      case "allOff": this.queue = []; if (this.bank && this.tsf) this.tsf.allOff(this.bank); return;
      case "meter": this.meter = m.on; this.meterPeak = 0; this.meterFrames = 0; return;
    }
  }
  private push(ev: Ev): void {   // 按时间插入（没时间的排在最前、立刻施加）
    let i = this.queue.length;
    while (i > 0 && (ev.t === null ? this.queue[i - 1].t !== null : this.queue[i - 1].t !== null && this.queue[i - 1].t! > ev.t)) i--;
    this.queue.splice(i, 0, ev);
  }
  private apply(ev: Ev): void {
    if (!this.tsf || !this.bank) return;
    if (ev.kind === "on") this.tsf.noteOn(this.bank, ev.preset, ev.key, ev.vel); else this.tsf.noteOff(this.bank, ev.preset, ev.key);
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]; if (!out || !out.length) return true;
    const ch0 = out[0], n = ch0.length;
    if (!this.tsf || !this.bank) { for (const c of out) c.fill(0); return true; }
    const t0 = currentTime, end = t0 + n / sampleRate;
    let pos = 0;
    while (this.queue.length) {
      const ev = this.queue[0];
      if (ev.t !== null && ev.t >= end) break;
      const at = ev.t === null ? pos : Math.min(n, Math.max(pos, Math.round((ev.t - t0) * sampleRate)));
      if (at > pos) { this.tsf.render(this.bank, ch0, pos, at - pos); pos = at; }
      this.apply(ev); this.queue.shift();
    }
    if (pos < n) this.tsf.render(this.bank, ch0, pos, n - pos);
    for (let c = 1; c < out.length; c++) out[c].set(ch0);
    if (this.meter) {
      for (let i = 0; i < n; i++) { const a = Math.abs(ch0[i]); if (a > this.meterPeak) this.meterPeak = a; }
      this.meterFrames += n;
      if (this.meterFrames >= 1024) { this.port.postMessage({ type: "meter", peak: this.meterPeak, active: this.tsf.active(this.bank) } satisfies SynthOut); this.meterPeak = 0; this.meterFrames = 0; }
    }
    return true;
  }
}
registerProcessor("gm-synth", GmSynthProcessor);
