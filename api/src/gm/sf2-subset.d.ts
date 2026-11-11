export interface Sf2PresetId {
    bank: number;
    program: number;
}
export interface Sf2PresetInfo extends Sf2PresetId {
    name: string;
}
/** 列出一个 sf2 里的预设（不含末尾的 EOP）。 */
export declare function listSf2Presets(input: Uint8Array): Sf2PresetInfo[];
/** 只留 want 里的预设。缺的预设 = 抛错（调用方决定怎么报）。 */
export declare function subsetSf2(input: Uint8Array, want: readonly Sf2PresetId[]): Uint8Array;
/** INFO 块里给人看的字（SoundFont 2.04 §5）：INAM 名字、IENG 作者、ICOP 版权、ICMT 注释（GeneralUser GS 把许可证写在这里）。没有的不出现。 */
export declare function sf2Info(input: Uint8Array): {
    name?: string;
    engineer?: string;
    copyright?: string;
    comment?: string;
    product?: string;
};
