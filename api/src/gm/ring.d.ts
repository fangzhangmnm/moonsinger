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
/** 这位的音色（库 + bank / program，鼓件带 note）→ 出厂值。 */
export declare function ringFactory(src: {
    library: string | null;
    bank: number;
    program: number;
    note?: number;
}): RingFactory;
