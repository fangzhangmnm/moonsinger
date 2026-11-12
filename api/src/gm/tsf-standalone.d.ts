export interface TsfExports {
    memory: WebAssembly.Memory;
    _initialize(): void;
    malloc(n: number): number;
    free(p: number): void;
    sf_load(p: number, n: number, sr: number): number;
    sf_copy(f: number): number;
    sf_close(f: number): void;
    sf_reset(f: number): void;
    sf_preset_count(f: number): number;
    sf_preset_name(f: number, i: number): number;
    sf_preset_bank(f: number, i: number): number;
    sf_preset_num(f: number, i: number): number;
    sf_preset_index(f: number, bank: number, num: number): number;
    sf_set_max_voices(f: number, n: number): number;
    sf_set_volume(f: number, g: number): void;
    sf_note_on(f: number, preset: number, key: number, vel: number): number;
    sf_note_off(f: number, preset: number, key: number): void;
    sf_note_off_all(f: number): void;
    sf_active(f: number): number;
    sf_render(f: number, out: number, n: number): void;
}
export interface TsfBank {
    handle: number;
    presets: {
        index: number;
        bank: number;
        program: number;
        name: string;
    }[];
}
/** 实例化（module 可以是 WebAssembly.Module 或 wasm 字节）。 */
export declare function instantiateTsf(module: WebAssembly.Module | BufferSource): Promise<Tsf>;
export declare class Tsf {
    readonly ex: TsfExports;
    private outPtr;
    private outCap;
    constructor(ex: TsfExports);
    private u8;
    private cstr;
    /** 载一份 sf2（字节拷进 wasm 堆、载完就还）。失败 = null。 */
    load(bytes: Uint8Array, sampleRate: number, maxVoices?: number): TsfBank | null;
    close(b: TsfBank): void;
    /** 敲下去（vel 0–1）。力度 → 响度归引擎自己（施工单 9-4，2026-11-12：vendor/tsf/patch-tsf.py 补丁 2 照 FluidSynth 读库给每件乐器写的力度曲线，
     *  响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)；第 9 节那个「敲之前把总音量设成力度」的包装退场了）。 */
    noteOn(b: TsfBank, preset: number, key: number, vel: number): void;
    noteOff(b: TsfBank, preset: number, key: number): void;
    allOff(b: TsfBank): void;
    /** 所有声音快速收掉（tsf_reset = endquick：几毫秒淡出，不是硬切）。 */
    reset(b: TsfBank): void;
    active(b: TsfBank): number;
    /** 渲染 n 个单声道采样进 out（从 offset 起）。 */
    render(b: TsfBank, out: Float32Array, offset?: number, n?: number): void;
}
