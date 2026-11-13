// desk.ts —— 视图态（照 WeebPaint 的 desk，workbench-state.ts；user 2026-10-08「undo 可以参考 weebpaint 的视图 vs 文件。视图会顺手捞进文件」）。created 2026-10-08 by Claude Fable 5.1
// 什么算视图态：**不改歌本身、只改你怎么看 / 怎么听这次**——范围（本段 / 全部）、排法（连续 / 分页）、现在在哪张纸、每个声部的 隐藏 / 只看 / 静音 / 独奏。
// 规矩（三条，和 WeebPaint 一样）：① **存时顺手捞进文件**（score.json 可选字段 view；契约 ViewV1）——下次打开回到原样；② **改了不标脏**（不出「•」、不触发自动存，
//   「存」那一下顺手带走；人类 2026-06-10 在 WeebPaint 钉的「切棋盘不让画变未保存」）；③ **不进 undo**（undo 只盖进文件的内容；history.ts）。
// 缩放（捏合、CSS zoom）**不在这里**：它跟屏幕大小走，是设备的事，不随歌。
// pad 的状态（1= / 调式 / 时值 / 连音 / 音域）**在这里**（2026-10-08 Opus 5.5；user「学一下weebpaint的editorstate，键盘的状态之类的也应该持久化，比如1=几，时值. shift可以不用持久化」——
//   同 WeebPaint 的笔 / dial 跟着画走；此前这里写的是「pad 是独立设备，换歌不换它」，按 user 这句改了）。升降 / 叠 / 减半（Shift 类）不存；pad 的行 / 列 / 首调绝对（跟屏幕走）不在这里。
// 这个模块只管「一个对象 ↔ 文件里的 JSON」；变量本身仍住在 main.ts（viewScope / pageFlow / partView），存时 deskNow() 聚一下、开时 applyDesk() 散回去——不搬家，少改线。
import { SCALES } from "./scales.ts";
/** 时值存 MusicXML 的音符类型名（不存 LADDER 下标：下标哪天变了老文件就错）；顺序 = song.ts LADDER。 */
export type PadUnit = "32nd" | "16th" | "eighth" | "quarter" | "half" | "whole";
export const PAD_UNITS: readonly PadUnit[] = ["32nd", "16th", "eighth", "quarter", "half", "whole"];
/** pad 的状态。low = 音域窗口最低那个键的 MIDI（换个行数 / 键位的设备也落在差不多的音域）；null = 默认那一档。 */
/** auto = 「1=」跟谱（v0.16.9；新歌默认）。文件里不另加字段：写了 fifths / scale = 手动（手动 1=C 大调也写 fifths: 0），都没写 = 跟谱——
 *  v0.16.8 及以前存的歌里写着 1= / 调式的 = 当时拨过 = 手动；没写的 = 当时是 1=C 大调、现在跟谱（新歌的谱头本来就是 C）。 */
export interface PadDesk { auto: boolean; fifths: number; scale: string; unit: PadUnit; tuplet: 0 | 3 | 5 | 6 | 7; low: number | null }
export const freshPad = (): PadDesk => ({ auto: true, fifths: 0, scale: "major", unit: "eighth", tuplet: 0, low: null });   // 同 song.ts initInput（八分 = DEFAULT_UNIT）
export interface PartViewState { hidden: boolean; only: boolean; muted: boolean; solo: boolean }
export const freshPartView = (): PartViewState => ({ hidden: false, only: false, muted: false, solo: false });
/** mp3 = 导出歌声的音质（导出面板里选的；2026-10-08 by Claude Opus 5.5，user「音质配置就是应该也跟着吧」——跟这首歌走、存时顺手带、不标脏、不进 undo）。 */
/** ref = 参考窗的窗（开着没有 + 位置 / 大小，CSS 像素；2026-10-08 深夜 Opus 5.5，v0.8；同 WXHW 的 refPanel）——这首歌里开过窗才有；里面的卡不在这里（进文件、标脏，见 src/app/reference-host.ts）。 */
export interface RefPanelDesk { open: boolean; left: number; top: number; width: number; height: number }
/** pdf = 乐谱 PDF 的字体（导出面板里选的；同 mp3 音质跟着这首歌走、不标脏；2026-10-09 Opus 5.5，user「字体可以选普通的和那个拼音可爱的」）。 */
/** scroll = 排法「横卷」（v0.9.35；一行无限往右；和 pageFlow 互斥，两个都写着 = 横卷说了算）。 */
/** mode = 打开时进哪个模式（v0.10.21；user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」）：存的时候记下当时的模式，默认「音」不写。 */
/** 乐器目录翻到哪（v0.16.6，user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置…即兴的滚动归 App 记，然后文件内的滚动归文件记」）：
 *  mode = 排序；open = 每种排序展开的那一组；scroll = 列表滚到哪（px）；row = 点开的那一件（「组::概念」）；pick = 试听台上的那一位。
 *  在歌里打开的 = 这首歌的视图态（下面 Desk.finder，存时顺手带、不标脏、不进撤销）；从歌库「即兴」打开的 = 设备上的一个键（main.ts KV_FINDER_IMPRO）。 */
export interface FinderMemo { mode: string; open: Record<string, string>; scroll: number; row: string | null; pick: string }
export const FINDER_MODES = ["year", "style", "family", "hs"] as const;
export const freshFinderMemo = (): FinderMemo => ({ mode: "year", open: {}, scroll: 0, row: null, pick: "" });
/** 文件 / 设备里的形状（只写不是默认的；全默认 = 不写）。 */
export interface FinderMemoJson { mode?: string; open?: Record<string, string>; scroll?: number; row?: string; pick?: string }
export function serializeFinderMemo(m: FinderMemo): FinderMemoJson | null {
  const o: FinderMemoJson = {};
  if (m.mode !== "year") o.mode = m.mode;
  if (Object.keys(m.open).length) o.open = { ...m.open };
  if (m.scroll > 0) o.scroll = Math.round(m.scroll);
  if (m.row) o.row = m.row;
  if (m.pick) o.pick = m.pick;
  return Object.keys(o).length ? o : null;
}
/** 宽容：不认识的排序 / 不是字符串 / 不是有限的数 = 那一项默认。 */
export function unserializeFinderMemo(json: unknown): FinderMemo {
  const m = freshFinderMemo();
  if (!json || typeof json !== "object") return m;
  const j = json as Record<string, unknown>;
  if ((FINDER_MODES as readonly unknown[]).includes(j.mode)) m.mode = j.mode as string;
  if (j.open && typeof j.open === "object") for (const [k, v] of Object.entries(j.open as Record<string, unknown>)) if ((FINDER_MODES as readonly string[]).includes(k) && typeof v === "string") m.open[k] = v;
  if (typeof j.scroll === "number" && Number.isFinite(j.scroll) && j.scroll > 0) m.scroll = j.scroll;
  if (typeof j.row === "string" && j.row) m.row = j.row;
  if (typeof j.pick === "string") m.pick = j.pick;
  return m;
}
export interface Desk { scope: "all" | "segment"; pageFlow: boolean; scroll: boolean; paper: string | null; parts: Record<string, PartViewState>; mp3: "standard" | "small"; pad: PadDesk; ref: RefPanelDesk | null; mode: "notes" | "lyrics" | "symbols" | "listen"; finder: FinderMemo }
export const freshDesk = (): Desk => ({ scope: "segment", pageFlow: false, scroll: false, paper: null, parts: {}, mp3: "standard", pad: freshPad(), ref: null, mode: "notes", finder: freshFinderMemo() });

/** 文件里的形状（只写非默认值；全默认 = 不写这个字段）。 */
export interface DeskJson { scope?: "all"; pageFlow?: true; scroll?: true; paper?: string; parts?: Record<string, { hidden?: true; only?: true; muted?: true; solo?: true }>; mp3?: "small"; pad?: PadJson; ref?: { open?: true; left: number; top: number; width: number; height: number }; mode?: "lyrics" | "symbols" | "listen"; finder?: FinderMemoJson }
/** pad 在文件里的形状：只写不是默认的；全默认 = 不写。 */
export interface PadJson { fifths?: number; scale?: string; unit?: PadUnit; tuplet?: 3 | 5 | 6 | 7; low?: number }
export function serializeDesk(d: Desk): DeskJson | null {
  const out: DeskJson = {};
  if (d.scope === "all") out.scope = "all";
  if (d.mp3 === "small") out.mp3 = "small";
  if (d.mode !== "notes") out.mode = d.mode;
  if (d.scroll) out.scroll = true; else if (d.pageFlow) out.pageFlow = true;
  if (d.paper) out.paper = d.paper;
  const parts: NonNullable<DeskJson["parts"]> = {};
  for (const [id, p] of Object.entries(d.parts)) {
    const v: { hidden?: true; only?: true; muted?: true; solo?: true } = {};
    if (p.hidden) v.hidden = true; if (p.only) v.only = true; if (p.muted) v.muted = true; if (p.solo) v.solo = true;
    if (Object.keys(v).length) parts[id] = v;
  }
  if (Object.keys(parts).length) out.parts = parts;
  const pd = d.pad, def = freshPad(), pj: PadJson = {};
  if (!pd.auto) { pj.fifths = pd.fifths; if (pd.scale !== def.scale) pj.scale = pd.scale; }   // 手动 = 一定写 fifths（跟谱 = 都不写）
  if (pd.unit !== def.unit) pj.unit = pd.unit;
  if (pd.tuplet) pj.tuplet = pd.tuplet;
  if (pd.low !== null) pj.low = pd.low;
  if (Object.keys(pj).length) out.pad = pj;
  if (d.ref) { const { open, left, top, width, height } = d.ref; out.ref = { ...(open ? { open: true as const } : {}), left, top, width, height }; }
  const fm = serializeFinderMemo(d.finder); if (fm) out.finder = fm;
  return Object.keys(out).length ? out : null;
}
/** 读文件里的（宽容：不是对象 / 字段不认识 = 当默认；别家 / 更新版写的多余字段不管）。 */
export function unserializeDesk(json: unknown): Desk {
  const d = freshDesk();
  if (!json || typeof json !== "object") return d;
  const j = json as Record<string, unknown>;
  if (j.scope === "all") d.scope = "all";
  if (j.pageFlow === true) d.pageFlow = true;
  if (j.scroll === true) { d.scroll = true; d.pageFlow = false; }
  if (j.mp3 === "small") d.mp3 = "small";
  // j.pdf（乐谱 PDF 的字体，只写过 "pinyin"）：拼音字体 7-J 退役，读到不理、不再写（score patch 1）
  if (j.mode === "lyrics" || j.mode === "symbols" || j.mode === "listen") d.mode = j.mode;
  if (typeof j.paper === "string" && j.paper) d.paper = j.paper;
  if (j.parts && typeof j.parts === "object") {
    for (const [id, v] of Object.entries(j.parts as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const p = v as Record<string, unknown>;
      d.parts[id] = { hidden: p.hidden === true, only: p.only === true, muted: p.muted === true, solo: p.solo === true };
    }
  }
  if (j.pad && typeof j.pad === "object") {   // 每一项各自宽容：不认识 / 越界 = 那一项默认
    const q = j.pad as Record<string, unknown>;
    if (Number.isInteger(q.fifths) && Math.abs(q.fifths as number) <= 7) { d.pad.fifths = q.fifths as number; d.pad.auto = false; }
    if (typeof q.scale === "string" && SCALES.some((sc) => sc.id === q.scale)) d.pad.scale = q.scale;   // 调式照写的读；跟谱 / 手动只看有没有写 fifths（第 16 条：不再把「只写了调式」猜成手动）
    if (PAD_UNITS.includes(q.unit as PadUnit)) d.pad.unit = q.unit as PadUnit;
    if (q.tuplet === 3 || q.tuplet === 5 || q.tuplet === 6 || q.tuplet === 7) d.pad.tuplet = q.tuplet;
    if (Number.isInteger(q.low) && (q.low as number) >= 0 && (q.low as number) <= 127) d.pad.low = q.low as number;
  }
  if (j.ref && typeof j.ref === "object") {   // 参考窗的窗：四个数都得是有限的数，不然整个当没有（窗按库的默认位置开）
    const r = j.ref as Record<string, unknown>, n = (v: unknown) => typeof v === "number" && Number.isFinite(v);
    if (n(r.left) && n(r.top) && n(r.width) && n(r.height)) d.ref = { open: r.open === true, left: r.left as number, top: r.top as number, width: r.width as number, height: r.height as number };
  }
  if (j.finder) d.finder = unserializeFinderMemo(j.finder);
  return d;
}
