import type { Song } from "../../score/song.ts";
import { type ResolvedLook } from "../../score/clef.ts";
export { staffRows, staffTracks, type FoldFamily, type StaffRows } from "./rows.ts";
export { measureTrack, lineStartWidth, lyricAnchors, type StaffTrack } from "./measure.ts";
export { drawStaff, type LyricPart, type LyricSpot, type StaffDrawCtx } from "./draw.ts";
export { yAt, dAt, anchors, caretSpan, previewAt, pitchAxis, bandTop, staffGhost, type StaffRowData } from "./geometry.ts";
export type { Unit, Chunk } from "../frame/units.ts";
/** 每张纸每个声部怎么画（谱号 / 大谱表 / 自动八度线，v0.16.88 按段；自动的按整首一路挑，和视图无关）。noAutoGrand = 鼓 / 固定敲一个键的不自动变大谱表。 */
export declare function staffLooks(song: Song, noAutoGrand: ReadonlySet<string>): (paperId: string, partId: string) => ResolvedLook | undefined;
