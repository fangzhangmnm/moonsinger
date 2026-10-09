// tsf-standalone.ts —— 独立 WASM（vendor/tsf/tsf-standalone.wasm，不带 emscripten 运行时）的薄包装：AudioWorklet 里的实时合成器和 Node 测试共用。
// created 2026-10-07 by Claude Fable 5.1。和 vendor/tsf/tsf.mjs（emscripten 胶水版）是同一份 C 代码编的两份；test/synth-wasm.test.ts 守着两边逐样本相同。
// 只 import 一个 emscripten_notify_memory_growth（内存涨了通知一声；我们每次用前都重新取 memory.buffer，所以空桩就行）。
// 调用方自己管 memory：ALLOW_MEMORY_GROWTH 下 buffer 会换（旧的 detach），所以每次访问都从 exports.memory.buffer 新建视图。

export interface TsfExports {
  memory: WebAssembly.Memory; _initialize(): void; malloc(n: number): number; free(p: number): void;
  sf_load(p: number, n: number, sr: number): number; sf_copy(f: number): number; sf_close(f: number): void; sf_reset(f: number): void;
  sf_preset_count(f: number): number; sf_preset_name(f: number, i: number): number; sf_preset_bank(f: number, i: number): number; sf_preset_num(f: number, i: number): number; sf_preset_index(f: number, bank: number, num: number): number;
  sf_set_max_voices(f: number, n: number): number; sf_set_volume(f: number, g: number): void;
  sf_note_on(f: number, preset: number, key: number, vel: number): number; sf_note_off(f: number, preset: number, key: number): void; sf_note_off_all(f: number): void; sf_active(f: number): number;
  sf_render(f: number, out: number, n: number): void;
}
export interface TsfBank { handle: number; presets: { index: number; bank: number; program: number; name: string }[] }

/** 实例化（module 可以是 WebAssembly.Module 或 wasm 字节）。 */
export async function instantiateTsf(module: WebAssembly.Module | BufferSource): Promise<Tsf> {
  const imports = { env: { emscripten_notify_memory_growth: () => {} } };
  const inst = module instanceof WebAssembly.Module ? await WebAssembly.instantiate(module, imports) : (await WebAssembly.instantiate(module, imports)).instance;
  const ex = inst.exports as unknown as TsfExports;
  ex._initialize();
  return new Tsf(ex);
}

export class Tsf {
  readonly ex: TsfExports;
  private outPtr = 0; private outCap = 0;
  constructor(ex: TsfExports) { this.ex = ex; }   // 不用参数属性：Node 的 strip-only TS 不认
  private u8(): Uint8Array { return new Uint8Array(this.ex.memory.buffer); }
  private cstr(p: number): string { const m = this.u8(); let s = ""; for (let i = p; m[i]; i++) s += String.fromCharCode(m[i]); return s; }
  /** 载一份 sf2（字节拷进 wasm 堆、载完就还）。失败 = null。 */
  load(bytes: Uint8Array, sampleRate: number, maxVoices = 64): TsfBank | null {
    const p = this.ex.malloc(bytes.length); this.u8().set(bytes, p);
    const handle = this.ex.sf_load(p, bytes.length, sampleRate); this.ex.free(p);
    if (!handle) return null;
    this.ex.sf_set_max_voices(handle, maxVoices);
    const n = this.ex.sf_preset_count(handle), presets = Array.from({ length: n }, (_, i) => ({ index: i, bank: this.ex.sf_preset_bank(handle, i), program: this.ex.sf_preset_num(handle, i), name: this.cstr(this.ex.sf_preset_name(handle, i)) }));
    return { handle, presets };
  }
  close(b: TsfBank): void { this.ex.sf_close(b.handle); }
  noteOn(b: TsfBank, preset: number, key: number, vel: number): void { this.ex.sf_note_on(b.handle, preset, key, vel); }
  noteOff(b: TsfBank, preset: number, key: number): void { this.ex.sf_note_off(b.handle, preset, key); }
  allOff(b: TsfBank): void { this.ex.sf_note_off_all(b.handle); }
  /** 所有声音快速收掉（tsf_reset = endquick：几毫秒淡出，不是硬切）。 */
  reset(b: TsfBank): void { this.ex.sf_reset(b.handle); }
  active(b: TsfBank): number { return this.ex.sf_active(b.handle); }
  /** 渲染 n 个单声道采样进 out（从 offset 起）。 */
  render(b: TsfBank, out: Float32Array, offset = 0, n = out.length - offset): void {
    if (n <= 0) return;
    if (this.outCap < n) { if (this.outPtr) this.ex.free(this.outPtr); this.outPtr = this.ex.malloc(n * 4); this.outCap = n; }
    this.ex.sf_render(b.handle, this.outPtr, n);
    out.set(new Float32Array(this.ex.memory.buffer, this.outPtr, n), offset);
  }
}
