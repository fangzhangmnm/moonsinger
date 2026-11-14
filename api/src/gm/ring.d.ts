/** 歌里存的两个值：留住音 / 不留（articulation.pedal）。 */
export type PedalDefault = "down" | "up";
export declare const PEDAL_DEFAULTS: readonly PedalDefault[];
/** 出厂是哪一边 + 为什么：free = 目录标了不去管它就一直响（why = 目录里那句，中 / 英）；unmarked = 目录没标；own = 自己的音源文件（目录不认识它）。 */
export interface RingFactory {
    pedal: PedalDefault;
    reason: "free" | "unmarked" | "own";
    why: {
        readonly zh: string;
        readonly en: string;
    } | null;
}
/** 整套鼓（128 号库、没固定敲哪一件）= 一位乐手打全套。目录里没有「整套鼓」这个概念、gm-map 也没有不带 note 的那一行，所以在这里明写（v0.17.43；统筹 c5c742ac「怎么进表我定」）。
 *  只列 GS 2.0.3 里 27–87 号键不松键全都会自己停的 11 套（TinySoundFont 实测，施工单第 6 节）；SFX 套（128:56，14 个键循环着一直响）、CM-64/32L 套（128:127，82 / 86 / 87 循环）不进。 */
export declare const RING_FREE_KITS: readonly number[];
/** 这位的音色（库 + bank / program，鼓件带 note）→ 出厂值。 */
export declare function ringFactory(src: {
    library: string | null;
    bank: number;
    program: number;
    note?: number;
}): RingFactory;
