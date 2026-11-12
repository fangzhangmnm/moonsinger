// index.ts —— 五线谱这一种（设计稿第 3.3 节「谱种 = 一张表」里的 staff）唯一的入口：框架（engrave.ts）只从这里拿五线谱的东西，不直接碰字形表、符干、谱号模块。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-9；守卫 test/score-surface.test.ts「结构」）。第四刀加简谱 = 旁边再一个这样的入口 + 谱种表里一行。
import type { Song } from "../../score/song.ts";
import { resolveSongLooks, type ResolvedLook } from "../../score/clef.ts";
export { staffRows, staffTracks, type FoldFamily, type StaffRows } from "./rows.ts";
export { measureTrack, lineStartWidth, lyricAnchors, type StaffTrack } from "./measure.ts";
export { drawStaff, STAFF_LANES, type LyricPart, type LyricSpot, type StaffDrawCtx } from "./draw.ts";
export { yAt, dAt, anchors, caretSpan, previewAt, pitchAxis, bandTop, staffGhost, type StaffRowData } from "./geometry.ts";
export type { Unit, Chunk } from "./units.ts";

/** 每张纸每个声部怎么画（谱号 / 大谱表 / 自动八度线，v0.16.88 按段；自动的按整首一路挑，和视图无关）。noAutoGrand = 鼓 / 固定敲一个键的不自动变大谱表。 */
export function staffLooks(song: Song, noAutoGrand: ReadonlySet<string>): (paperId: string, partId: string) => ResolvedLook | undefined {
  const looks = resolveSongLooks(song, noAutoGrand);
  return (paperId, partId) => looks.get(paperId)?.get(partId);
}
