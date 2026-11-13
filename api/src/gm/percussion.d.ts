import { type PercInfo } from "./percussion.gen.ts";
export type { PercInfo, PercHead } from "./percussion.gen.ts";
/** 一个 SoundFont 预设 + 敲的键 → 鼓谱写法（没有 = 有音高的乐器，照五线谱）。鼓组（bank 128）各套都按 GM 标准鼓组的键位（GS 的 Room / Power / Jazz…键位一样）。 */
export declare function percOf(bank: number, program: number, note?: number): PercInfo | null;
/** 着力点表（16-4 E，统筹 2026-11-12 夜）：这位乐手每个敲的键 → 采样开头到「砸下去那一下」几秒。上场 / 开关「固定原速」的那一刻按值抄进乐手（instrument.hitSecByKey），
 *  读老歌时门口补；出声只读乐手身上那一份。整套鼓 = 目录里这套鼓的每个键（实测没有的写 0）；固定敲一件 = 那一个键；有音高的 = null（没有这个键）。 */
export declare function hitSecByKeyOf(inst: {
    bank: number;
    program: number;
    note?: number;
}): Record<string, number> | null;
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
