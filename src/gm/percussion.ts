// percussion.ts —— 不分音高的「一下」：台上那位是鼓 / 音效时，谱上怎么写（几线谱、哪一线、什么符头、符干朝哪）+ 着力点（录音房提前多少秒开始放）。
// created 2026-10-10 by Claude Opus 5.5（user「这个做好之后鼓谱做一下。团子只剩下鼓和音效了」「单乐器一线谱同意」；设计账 ai-docs/20261010-shared-staff-percussion-design.md §2–3）。
// 数据 = 音乐仓鼠 export v13（percussion.gen.ts，按值烤进源码）。这里只按「台上那位是谁（SoundFont 的 bank / program / 固定的键）」查表，不进歌。
import { PERC, type PercInfo } from "./percussion.gen.ts";
export type { PercInfo, PercHead } from "./percussion.gen.ts";

/** 一个 SoundFont 预设 + 敲的键 → 鼓谱写法（没有 = 有音高的乐器，照五线谱）。鼓组（bank 128）各套都按 GM 标准鼓组的键位（GS 的 Room / Power / Jazz…键位一样）。 */
export function percOf(bank: number, program: number, note?: number): PercInfo | null {
  if (bank === 128) return note === undefined ? null : PERC[`128:0:${note}`] ?? null;
  return (note !== undefined ? PERC[`${bank}:${program}:${note}`] : undefined) ?? PERC[`${bank}:${program}`] ?? null;
}

/** 台上那位怎么记谱：kit = 整套鼓（bank 128 没固定键：写的音高 = 敲哪个鼓，五线鼓谱）；one = 固定敲一件（鼓件 / 固定原速的音效：一线谱，写的音高不出声）；null = 有音高。 */
export type PercKind = { kind: "kit" } | { kind: "one"; info: PercInfo };
export function percKindOf(inst: { bank: number; program: number; note?: number }): PercKind | null {
  if (inst.bank === 128 && inst.note === undefined) return { kind: "kit" };
  if (inst.note === undefined) return null;   // note = 每个音都敲这个键（鼓件 / 音效「固定原速」）；音效关了固定原速（猫叫歌）= 按写的音变调 = 有音高
  const info = percOf(inst.bank, inst.program, inst.bank === 128 ? inst.note : undefined);
  return info ? { kind: "one", info } : null;
}
