// paper.ts —— 纸：A4 / A5 / A6（默认 A5）。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「五线谱宽度：要不还是按照固定物理页框？看看webxiaoheiwu的选项。正经纸和小册子？」→「嗯A4 A5 A6三种，可以定」
//   「默认A5同意」「非打印的时候不用断页」；纸的模型（数据契约草稿 §6¾）：纸只属于谱这一层，整首歌一个纸张设置。
// · 照 WXHW「字号绝对」：五线谱的实际大小三档一样（STAFF_MM），纸越大一行放的小节越多。
// · 屏上：放得下就严格按纸的版心宽排（所见即所得），放不下（手机）按屏宽重新折行——那是 score-view 的事，这里只给数。
// · 存档 = MusicXML 标准的 <defaults>（<scaling> 五线谱多大 + <page-layout> 页宽高、边距），不加扩展；别的软件的别的纸原样保留（kind = "other"）。

export type PaperKind = "A4" | "A5" | "A6";
export interface Paper { kind: PaperKind | "other"; widthMm: number; heightMm: number; marginMm: { l: number; r: number; t: number; b: number } }

/** 五线谱高（四个线间距）mm：7 mm = 一个线间距 1.75 mm（打谱软件的常用大小）。三档一样。 */
export const STAFF_MM = 7;
export const SP_MM = STAFF_MM / 4;
/** 宽、高、四边边距（mm）。A5 的边距让版心正好放得进 iPad mini 竖屏（触屏 11 px 一格 ≈ 729 px）。 */
const SIZES: Record<PaperKind, { w: number; h: number; m: number }> = { A4: { w: 210, h: 297, m: 15 }, A5: { w: 148, h: 210, m: 16 }, A6: { w: 105, h: 148, m: 10 } };
export const PAPER_KINDS: PaperKind[] = ["A4", "A5", "A6"];
export const DEFAULT_PAPER: PaperKind = "A5";
/** 档名后面的一句话（纸的设置面板里）。 */
export const PAPER_NOTE: Record<PaperKind, string> = { A4: "正经纸", A5: "小册子（A4 对折）", A6: "口袋本" };

export function paperOf(kind: PaperKind): Paper {
  const s = SIZES[kind];
  return { kind, widthMm: s.w, heightMm: s.h, marginMm: { l: s.m, r: s.m, t: s.m, b: s.m } };
}
/** 一行（版心）多宽，单位 = 线间距。 */
export const lineSp = (p: Paper): number => (p.widthMm - p.marginMm.l - p.marginMm.r) / SP_MM;

/** 按页面尺寸认档：竖放、差 2 mm 内算同一档（边距照文件里的）；都不是 = other（原样保留）。 */
export function detectPaper(widthMm: number, heightMm: number, marginMm: Paper["marginMm"]): Paper {
  const near = (a: number, b: number) => Math.abs(a - b) <= 2;
  const kind = PAPER_KINDS.find((k) => near(widthMm, SIZES[k].w) && near(heightMm, SIZES[k].h));
  return kind ? { ...paperOf(kind), marginMm } : { kind: "other", widthMm, heightMm, marginMm };
}
/** 「其他」纸的样子：「216 × 279 mm」。 */
export const paperSizeText = (p: Paper): string => `${Math.round(p.widthMm)} × ${Math.round(p.heightMm)} mm`;
