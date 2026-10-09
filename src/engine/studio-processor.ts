// studio-processor.ts —— AudioWorklet 壳：音频线程里跑录音房核心（src/engine/studio.ts）。created 2026-10-09 by Claude Fable 5.1
// · 单独打包的模块（scripts/build.sh → dist/studio-worklet-<hash>.mjs）；TinySoundFont 的独立 WASM 由主线程编好经 processorOptions 递进来（同原 synth-processor）。
// · 消息原样交给 Studio.handle；每块调 Studio.render；立体声输出。核心起来之前收到的消息排队。
import { instantiateTsf } from "../gm/tsf-standalone.ts";
import { Studio, type StudioIn, type StudioOut } from "./studio.ts";

declare const sampleRate: number;
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(options?: unknown) }
declare function registerProcessor(name: string, ctor: new (options: { processorOptions: { module: WebAssembly.Module } }) => AudioWorkletProcessor): void;

class StudioProcessor extends AudioWorkletProcessor {
  private studio: Studio | null = null;
  private queue: StudioIn[] = [];
  constructor(options: { processorOptions: { module: WebAssembly.Module } }) {
    super();
    this.port.onmessage = (e: MessageEvent<StudioIn>) => { if (this.studio) this.studio.handle(e.data); else this.queue.push(e.data); };
    void instantiateTsf(options.processorOptions.module).then((tsf) => {
      this.studio = new Studio(sampleRate, tsf, (m: StudioOut, transfer?: Transferable[]) => this.port.postMessage(m, transfer ?? []));
      for (const m of this.queue) this.studio.handle(m); this.queue = [];
      this.port.postMessage({ type: "ready" } satisfies StudioOut);
    }).catch((err) => this.port.postMessage({ type: "error", message: `studio: wasm ${(err as Error).message}` } satisfies StudioOut));
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]; if (!out || !out.length) return true;
    const L = out[0], R = out[1] ?? out[0];
    if (!this.studio) { for (const c of out) c.fill(0); return true; }
    this.studio.render(L, R, L.length);
    return true;
  }
}
registerProcessor("studio", StudioProcessor);
