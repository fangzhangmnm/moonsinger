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
/** SF2 规范的放法下，库写的深度 d（cB）让「力度减半」轻多少 dB（乐器页的说明用；响度 = d ÷ 960 × 40·log10(力度 ÷ 127)，960 = 规范默认）。这条公式只住在 gm/ 这一层（16-4 守卫）。 */
export declare const sf2HalfVelocityDb: (depth: number) => number;
export declare function sf2VelocityDepths(input: Uint8Array, bank: number, program: number, key?: number): number[] | null;
/** 「这一下力度让它多响」的那一项（7-N，2026-11-12；统筹选 A）：引擎（vendor/tsf/patch-tsf.py 补丁 2，照 FluidSynth）对每个响的区实际施加的初始衰减（dB），逐区照搬同一套规矩——
 *  发生器（预设一级 + 乐器一级，区里的盖全局区的）× 0.04 dB/cB；「→ 初始衰减」调制器（默认 0x0502 / 960，乐器一级同源盖、预设一级同源加、量 0 不加；来源 = 力度 / 键号 / 无），
 *  按 FluidSynth 的映射算（凹 / 凸表、单极夹 127/128）；和夹在 0–144 dB。
 *  · `regions(key, vel)` = 这个键、这个力度会响的每一个区各自的衰减（dB，引擎 tsf_region_attenuation 的值；test/sf-velcurve.test.ts 拿引擎本身逐格核）。
 *  · `at(key, vel)` = L：这一下的响度（dB，≤ 0）。只有一层响 = −那一层的衰减（和引擎逐值相同）；几层同时响 = 按功率加 10·log10(Σ 10^(−衰减÷10))——
 *    **假定每层的采样一样响**（采样本身多响看不到；GS 里有 2.3% 的「键 × 力度」是几层叠着、深度又不一样，名单在施工记录 7-N）。没有区 = null（这个键不出声）。
 *  · 不进歌的文件；准备声音时从库的字节算，按键懒算、算过的记着。 */
export interface VelCurve {
    at(key: number, vel: number): number | null;
    regions(key: number, vel: number): number[];
}
/** 一个预设的 L（没有这个预设 = null）。 */
export declare function sf2VelocityCurve(input: Uint8Array, bank: number, program: number): VelCurve | null;
