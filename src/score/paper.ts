// paper.ts —— 纸：A4 / A5 / A6（默认 A5）。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「五线谱宽度：要不还是按照固定物理页框？看看webxiaoheiwu的选项。正经纸和小册子？」→「嗯A4 A5 A6三种，可以定」
//   「默认A5同意」「非打印的时候不用断页」；纸的模型（数据契约草稿 §6¾）：纸只属于谱这一层，整首歌一个纸张设置。
// · 照 WXHW「字号绝对」：五线谱的实际大小三档一样（STAFF_MM），纸越大一行放的小节越多。
// · 屏上：放得下就严格按纸的版心宽排（所见即所得），放不下（手机）按屏宽重新折行——那是 score-view 的事，这里只给数。
// · 存档 = MusicXML 标准的 <defaults>（<scaling> 五线谱多大 + <page-layout> 页宽高、边距），不加扩展；别的软件的别的纸原样保留（kind = "other"）。

export type PaperKind = "A3L" | "A4" | "A5" | "A6";   // A3 竖 2026-10-08 user「不要A3竖直」
/** density = 版式两档：舒适（默认）/ 紧凑（谱小一号、行距 / 谱距 / 歌词距都收紧、没歌词的声部不留歌词位）——2026-10-08 user「排版引擎还是要支持小字号。不然的话交响总谱的话A3也承重不了吧」
 *  →「比起字号，就一个舒适一个紧凑两个选项？然后紧凑你可以多帮我优化一些，包括字号，行距之类的」。
 *  staffMm = 五线谱高（四个线间距）mm：别的软件的文件带的大小原样留着；自家只按 density 定（没有 = 舒适 7 / 紧凑 5）。 */
export type Density = "cozy" | "compact";
export interface Paper { kind: PaperKind | "other"; widthMm: number; heightMm: number; marginMm: { l: number; r: number; t: number; b: number }; density?: Density; staffMm?: number }

/** 五线谱高（四个线间距）mm：7 mm = 一个线间距 1.75 mm（打谱软件的常用大小）= 舒适档；紧凑 5 mm。 */
export const STAFF_MM = 7, STAFF_MM_COMPACT = 5;
export const DENSITIES: { id: Density; label: string; note: string }[] = [{ id: "cozy", label: "舒适", note: "谱大" }, { id: "compact", label: "紧凑", note: "谱小一号、行距再卷一点；总谱声部多用这个" }];
export const densityOf = (p: Paper): Density => p.density ?? "cozy";
export const staffMmOf = (p: Paper): number => p.staffMm ?? (densityOf(p) === "compact" ? STAFF_MM_COMPACT : STAFF_MM);
/** 一个线间距 mm（按这张纸的谱大小）。 */
export const spMm = (p: Paper): number => staffMmOf(p) / 4;
/** 宽、高、四边边距（mm）。A5 的边距让版心正好放得进 iPad mini 竖屏（触屏 11 px 一格 ≈ 729 px）。A3 横 = 交响总谱 / 大电视（user 2026-10-08「加一个A3横版」）。 */
const SIZES: Record<PaperKind, { w: number; h: number; m: number }> = { A3L: { w: 420, h: 297, m: 18 }, A4: { w: 210, h: 297, m: 15 }, A5: { w: 148, h: 210, m: 16 }, A6: { w: 105, h: 148, m: 10 } };
export const PAPER_KINDS: PaperKind[] = ["A3L", "A4", "A5", "A6"];
export const DEFAULT_PAPER: PaperKind = "A5";
/** 档名后面的一句话（纸的设置面板里）。 */
export const PAPER_NOTE: Record<PaperKind, string> = { A3L: "横放：总谱 / 大屏", A4: "正经纸", A5: "小册子（A4 对折）", A6: "口袋本" };
export const PAPER_LABEL: Record<PaperKind, string> = { A3L: "A3 横", A4: "A4", A5: "A5", A6: "A6" };

export function paperOf(kind: PaperKind, density: Density = "cozy"): Paper {
  const s = SIZES[kind];
  return { kind, widthMm: s.w, heightMm: s.h, marginMm: { l: s.m, r: s.m, t: s.m, b: s.m }, ...(density === "compact" ? { density } : {}) };
}
/** 一行（版心）多宽，单位 = 线间距（谱越小一行放得越多）。 */
export const lineSp = (p: Paper): number => (p.widthMm - p.marginMm.l - p.marginMm.r) / spMm(p);

/** 按页面尺寸认档：差 2 mm 内算同一档（边距照文件里的）；都不是 = other（原样保留）。
 *  density 照文件里的 staff-distance 认（musicxml.ts）；谱的大小正好是那一档的就不另记 staffMm，别的大小（别的软件的）原样记下来。 */
export function detectPaper(widthMm: number, heightMm: number, marginMm: Paper["marginMm"], staffMm = STAFF_MM, density: Density = "cozy"): Paper {
  const near = (a: number, b: number) => Math.abs(a - b) <= 2;
  const kind = PAPER_KINDS.find((k) => near(widthMm, SIZES[k].w) && near(heightMm, SIZES[k].h));
  const want = density === "compact" ? STAFF_MM_COMPACT : STAFF_MM;
  const extra = { ...(density === "compact" ? { density } : {}), ...(Math.abs(staffMm - want) < 0.05 ? {} : { staffMm: +staffMm.toFixed(2) }) };
  return kind ? { ...paperOf(kind), marginMm, ...extra } : { kind: "other", widthMm, heightMm, marginMm, ...extra };
}
/** 「其他」纸的样子：「216 × 279 mm」。 */
export const paperSizeText = (p: Paper): string => `${Math.round(p.widthMm)} × ${Math.round(p.heightMm)} mm`;
