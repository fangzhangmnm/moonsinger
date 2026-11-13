import { _t } from "../i18n/index.ts";
// paper.ts —— 纸：类型和选项的名字。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「五线谱宽度：要不还是按照固定物理页框？看看webxiaoheiwu的选项。正经纸和小册子？」→「嗯A4 A5 A6三种，可以定」
//   「默认A5同意」「非打印的时候不用断页」；纸的模型（数据契约草稿 §6¾）：纸只属于谱这一层，整首歌一个纸张设置。
// · 照 WXHW「字号绝对」：五线谱的实际大小三档一样，纸越大一行放的小节越多。
// · 存档 = MusicXML 标准的 <defaults>（<scaling> 五线谱多大 + <page-layout> 页宽高、边距），不加扩展；别的软件的别的纸原样保留（kind = "other"）。
// · **第 17 条 17-2（2026-11-13）**：四种纸的宽高边距、两档谱高，和带着数或者带着「没写就当」的函数（paperOf / lineSp / pageGeoOf / detectPaper…）搬进 src/look/paper.ts；
//   这里只留类型和选项的名字（谱这一层不 import src/look）。

export type PaperKind = "A3L" | "A4" | "A5" | "A6";   // A3 竖 2026-10-08 user「不要A3竖直」
/** density = 版式两档：舒适 / 紧凑（谱小一号、行距 / 谱距 / 歌词距都收紧、没歌词的声部不留歌词位）——2026-10-08 user「排版引擎还是要支持小字号…」
 *  →「比起字号，就一个舒适一个紧凑两个选项？然后紧凑你可以多帮我优化一些，包括字号，行距之类的」。 */
export type Density = "cozy" | "compact";
/** 画的时候用的那张纸（每个字段必填；src/look lookOf 交出来的就是这一份）。staffMm = 五线谱高（四个线间距）mm。 */
export interface Paper { kind: PaperKind | "other"; widthMm: number; heightMm: number; marginMm: { l: number; r: number; t: number; b: number }; density: Density; staffMm: number }
/** 从 MusicXML <defaults> 认出来的那一份（只在读文件的门口用，src/look paperChoicesOf 把它变成选择）：版式是紧凑才写、谱高不是那一档的才写。 */
export interface ReadPaper { kind: PaperKind | "other"; widthMm: number; heightMm: number; marginMm: Paper["marginMm"]; density?: Density; staffMm?: number }
/** 四边边距（mm）。 */
export type Margins = Paper["marginMm"];
/** 纸张的选择（第 17 条 17-1；score.json `paper`）：四种之一，或者按值带着的一张（别家的谱带来的大小；以后人自己填的也是这一种）。 */
export type PaperChoice = { kind: PaperKind } | { kind: "other"; widthMm: number; heightMm: number };

export const DENSITIES: { id: Density; label: string; note: string }[] = [{ id: "cozy", label: _t("舒适"), note: _t("音符大，一页放得少") }, { id: "compact", label: _t("紧凑"), note: _t("音符小，一页放得多（歌名和声部名照大的，歌词用小字）") }]   // v0.16.43：音距跟版式（user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧、字也可以紧」）;
export const PAPER_KINDS: PaperKind[] = ["A3L", "A4", "A5", "A6"];
export const isPaperKind = (v: unknown): v is PaperKind => (PAPER_KINDS as readonly unknown[]).includes(v);
/** 档名后面的一句话（纸的设置面板里）。 */
export const PAPER_NOTE: Record<PaperKind, string> = { A3L: _t("横放：总谱 / 大屏"), A4: _t("正经纸"), A5: _t("小册子，A4 对折"), A6: _t("口袋本") };
export const PAPER_LABEL: Record<PaperKind, string> = { A3L: _t("A3 横"), A4: "A4", A5: "A5", A6: "A6" };
