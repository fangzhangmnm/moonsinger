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
/** 这件乐器（一个预设；给了 key = 只看盖到这个键的区）的「力度深度」：库给每个区写的「力度 → 初始衰减」调制器的量（cB），照 FluidSynth 合
 *  （施工单 9-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；引擎那一半 = vendor/tsf/patch-tsf.py 补丁 2，两边同一套规矩）：
 *  规范默认 960（来源 0x0502 = 力度、负向、单极、凹，量来源 = 无）；乐器一级同源的盖掉它（区里的盖过全局区的），预设一级同源的加上去（量 0 不加）。
 *  响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)；0 = 按多重都一样响。回不重复、从小到大的几个数（一般一件乐器一个数；鼓组按鼓件不同）；没有这个预设 = null。 */
export declare function sf2VelocityDepths(input: Uint8Array, bank: number, program: number, key?: number): number[] | null;
