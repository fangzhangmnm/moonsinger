// glyphs.ts —— 五线谱这一种行的字形表和五线的位置（d = 第几级：第五线 38、中线 34、第一线 30）。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）
import { DYNS, type Art, type Dyn } from "../../score/song.ts";
import { SIGNS, type SignId } from "../signs.ts";

export const TOP_LINE = 38;   // 五线谱最上面那条线的 d（geometry.ts 的 yAt / dAt 要它）
export const MID_LINE = 34, BOTTOM_LINE = 30;
// 修的字形 / 换气 / 力度字（SMuFL）：第四刀 4-3 起只有一份——记号表 src/render/signs.ts 的五线谱那一栏（数值原样搬过去，这里按它导出）。
//   发夹和两头的字留多宽、cresc. 字、虚线（PIN_GAP / PIN_WORD / DASH / RAMP_DASH）搬到两种行共用的挂件 src/render/ornaments/index.ts。
type ArtG = Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll">;
const glyphOf = (id: SignId): { above: string; below: string; w: number; h: number } => { const d = SIGNS[id].draw.staff; if (d.kind !== "glyph") throw new Error(`signs: ${id} has no staff glyph`); return { above: d.above, below: d.below ?? d.above, w: d.w ?? 0, h: d.h ?? 0 }; };
export const ART_GLYPH: Record<ArtG, { above: string; below: string; w: number; h: number }> = Object.fromEntries((["stress", "unstress", "accent", "marcato", "staccato", "tenuto"] as const).map((a) => [a, glyphOf(`art:${a}`)])) as Record<ArtG, { above: string; below: string; w: number; h: number }>;
export const GLYPH_BREATH = glyphOf("art:breath").above;   // breathMarkComma
export const DYN_GLYPH: Record<Dyn, string> = Object.fromEntries(DYNS.map((d) => [d, glyphOf(`dyn:${d}`).above])) as Record<Dyn, string>;
export const SHARP_POS = [38, 35, 39, 36, 33, 37, 34], FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
export const GLYPH_TUPLET = (n: number) => [...String(n)].map((d) => String.fromCodePoint(0xe880 + Number(d))).join("");

/** 一行里几条谱左边连着的那根竖线多粗（线间距；框架画，粗细归这种谱）。 */
