export interface SfPreset {
    index: number;
    bank: number;
    program: number;
    name: string;
}
/** 一个要出声的音：preset = 预设下标；key = MIDI 音高；vel 0–1；t0 / t1 = 起止秒（谱的时钟；t1 = 松键，之后按预设自己的 release 收尾）。 */
export interface SfNote {
    preset: number;
    key: number;
    vel: number;
    t0: number;
    t1: number;
}
export interface SfBank {
    readonly sampleRate: number;
    readonly presets: SfPreset[];
    /** bank / program 找预设下标；没有 = −1（GM 鼓组 = bank 128）。 */
    presetIndex(bank: number, program: number): number;
    /** 把一串音渲染成单声道 float（纯函数：同样的 notes 同样的采样）。tailSec = 最后一个松键之后再算多久（让 release 收完）。 */
    render(notes: readonly SfNote[], tailSec?: number): Float32Array;
    close(): void;
}
/** M = emscripten 的 createTsf() 出来的模块。 */
export declare function wrapTsf(M: any): {
    load(bytes: Uint8Array, sampleRate: number): SfBank;
};
