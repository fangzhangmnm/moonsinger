import { type PercInfo } from "./percussion.gen.ts";
export type { PercInfo, PercHead } from "./percussion.gen.ts";
/** 一个 SoundFont 预设 + 敲的键 → 鼓谱写法（没有 = 有音高的乐器，照五线谱）。鼓组（bank 128）各套都按 GM 标准鼓组的键位（GS 的 Room / Power / Jazz…键位一样）。 */
export declare function percOf(bank: number, program: number, note?: number): PercInfo | null;
/** 台上那位怎么记谱：kit = 整套鼓（bank 128 没固定键：写的音高 = 敲哪个鼓，五线鼓谱）；one = 固定敲一件（鼓件 / 固定原速的音效：一线谱，写的音高不出声）；null = 有音高。 */
export type PercKind = {
    kind: "kit";
} | {
    kind: "one";
    info: PercInfo;
    key: number;
};
export declare function percKindOf(inst: {
    bank: number;
    program: number;
    note?: number;
}): PercKind | null;
