// src/look/paper.ts —— 纸的数（第 17 条 17-2：从 src/score/paper.ts 搬来，数一个没改）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   四种纸的宽高边距、两档谱高，和带着这些数的函数。画的时候用的纸每个字段必填（Paper）——原来 densityOf 的 `?? "cozy"`、staffMmOf 的 `?? 7` 两处退路没有了；
//   从 MusicXML <defaults> 认出来的那一份是另一个形状（ReadPaper），只在读文件的门口用。
import { PAPER_KINDS, type PaperKind, type Density, type Paper, type ReadPaper, type Margins } from "../score/paper.ts";

/** 五线谱高（四个线间距）mm：7 mm = 一个线间距 1.75 mm（打谱软件的常用大小）= 舒适档；紧凑 5 mm。 */
export const STAFF_MM = 7, STAFF_MM_COMPACT = 5;
/** 这一档的谱高。 */
export const staffMmFor = (d: Density): number => (d === "compact" ? STAFF_MM_COMPACT : STAFF_MM);
/** 宽、高、四边边距（mm）。A5 的边距让版心正好放得进 iPad mini 竖屏（触屏 11 px 一格 ≈ 729 px）。A3 横 = 交响总谱 / 大电视（user 2026-10-08「加一个A3横版」）。 */
const SIZES: Record<PaperKind, { w: number; h: number; m: number }> = { A3L: { w: 420, h: 297, m: 18 }, A4: { w: 210, h: 297, m: 15 }, A5: { w: 148, h: 210, m: 16 }, A6: { w: 105, h: 148, m: 10 } };
/** 这一种纸自己的边距（四边一样）。 */
export const marginsOf = (kind: PaperKind): Margins => { const m = SIZES[kind].m; return { l: m, r: m, t: m, b: m }; };
/** 这一种纸的宽高（mm）。 */
export const sizeOf = (kind: PaperKind): { w: number; h: number } => ({ w: SIZES[kind].w, h: SIZES[kind].h });
/** 一张这一种、这一档的纸（谱高 = 这一档的）。 */
export function paperOf(kind: PaperKind, density: Density = "cozy"): Paper {
  const s = SIZES[kind];
  return { kind, widthMm: s.w, heightMm: s.h, marginMm: marginsOf(kind), density, staffMm: staffMmFor(density) };
}
/** 一个线间距 mm（按这张纸的谱大小）。 */
export const spMm = (p: Paper): number => p.staffMm / 4;
/** 字的尺子比谱的尺子大多少（刀 2，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §3）：舒适 = 1，紧凑 = 7 / 5 = 1.4——
 *  紧凑只把五线谱缩小，字（歌名、声部名、歌词、速度字…）和编辑器的钮还是舒适档那么大。屏幕（score-view geo）、PDF（score-pdf printOpts）、排版 worker 量字都用它，三处一起改，不然断行不一样。 */
export const textScaleOf = (p: Paper): number => STAFF_MM / p.staffMm;
/** 一行（版心）多宽，单位 = 线间距（谱越小一行放得越多）。 */
export const lineSp = (p: Paper): number => (p.widthMm - p.marginMm.l - p.marginMm.r) / spMm(p);
/** 分页排版的页面几何（单位 = 线间距）：页高 + 四边边距。分页预览和 PDF 共用（一处算，两边一样）。 */
export const pageGeoOf = (p: Paper): { h: number; l: number; r: number; t: number; b: number } => { const mm = spMm(p), m = p.marginMm; return { h: p.heightMm / mm, l: m.l / mm, r: m.r / mm, t: m.t / mm, b: m.b / mm }; };
/** 按页面尺寸认档（读文件的门口）：差 2 mm 内算同一档（边距照文件里的）；都不是 = other（原样保留）。
 *  density 照文件里的 staff-distance 认（musicxml.ts）；谱的大小正好是那一档的就不另记 staffMm，别的大小（别的软件的）原样记下来。 */
export function detectPaper(widthMm: number, heightMm: number, marginMm: Margins, staffMm = STAFF_MM, density: Density = "cozy"): ReadPaper {
  const near = (a: number, b: number) => Math.abs(a - b) <= 2;
  const kind = PAPER_KINDS.find((k) => near(widthMm, SIZES[k].w) && near(heightMm, SIZES[k].h));
  const extra = { ...(density === "compact" ? { density } : {}), ...(Math.abs(staffMm - staffMmFor(density)) < 0.05 ? {} : { staffMm: +staffMm.toFixed(2) }) };
  return kind ? { kind, widthMm: SIZES[kind].w, heightMm: SIZES[kind].h, marginMm, ...extra } : { kind: "other", widthMm, heightMm, marginMm, ...extra };
}
/** 「其他」纸的样子：「216 × 279 mm」。 */
export const paperSizeText = (p: { widthMm: number; heightMm: number }): string => `${Math.round(p.widthMm)} × ${Math.round(p.heightMm)} mm`;
