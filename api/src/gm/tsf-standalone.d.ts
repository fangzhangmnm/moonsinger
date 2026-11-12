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
/** 敲下去（施工单第 9 节，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「立刻最先修」「我无法容忍backward compatibility 错误的convention」）：
 *  照 SoundFont 规范放，**音量 = (力度 ÷ 127)²**——规范的默认调制器「力度 → 衰减、负向单极凹曲线、960 cB」，按 FluidSynth 的凹曲线
 *  （src/gentables/fluid_concave.cpp：concave[i] = −(400 / 960)·log10((127 − i) / 127)，2026-11-12 对过）代进去 = 衰减 −40·log10(力度 / 127) dB。
 *  TinySoundFont 只按一次方算（tsf.h：noteGainDB = globalGainDB − attenuation − gainToDecibels(1 / vel)），所以敲下去之前先把这个播放器的总音量设成这一下的力度：
 *  总音量只在敲下去那一刻读一次、写进这个音自己（globalGainDB = 20·log10(volume)），两样加起来 = 40·log10(力度)。不用改 wasm。
 *  只有这一种放法：所有敲音（实时、离线导出、按键试听、找乐器的试听、滚奏的每一下；独立版和胶水版两份 wasm）都走这一个函数。力度 0 = 引擎当松键，不设音量。 */
export declare function sfNoteOnSquared(ex: {
    sf_set_volume(f: number, g: number): void;
    sf_note_on(f: number, preset: number, key: number, vel: number): number;
}, f: number, preset: number, key: number, vel: number): void;
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
    noteOn(b: TsfBank, preset: number, key: number, vel: number): void;
    noteOff(b: TsfBank, preset: number, key: number): void;
    allOff(b: TsfBank): void;
    /** 所有声音快速收掉（tsf_reset = endquick：几毫秒淡出，不是硬切）。 */
    reset(b: TsfBank): void;
    active(b: TsfBank): number;
    /** 渲染 n 个单声道采样进 out（从 offset 起）。 */
    render(b: TsfBank, out: Float32Array, offset?: number, n?: number): void;
}
