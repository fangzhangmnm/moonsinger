// desk.ts —— 视图态（照 WeebPaint 的 desk，workbench-state.ts；user 2026-10-08「undo 可以参考 weebpaint 的视图 vs 文件。视图会顺手捞进文件」）。created 2026-10-08 by Claude Fable 5.1
// 什么算视图态：**不改歌本身、只改你怎么看 / 怎么听这次**——范围（本段 / 全部）、排法（连续 / 分页）、现在在哪张纸、每个声部的 隐藏 / 只看 / 静音 / 独奏。
// 规矩（三条，和 WeebPaint 一样）：① **存时顺手捞进文件**（score.json 可选字段 view；契约 ViewV1）——下次打开回到原样；② **改了不标脏**（不出「•」、不触发自动存，
//   「存」那一下顺手带走；人类 2026-06-10 在 WeebPaint 钉的「切棋盘不让画变未保存」）；③ **不进 undo**（undo 只盖进文件的内容；history.ts）。
// 缩放（捏合、CSS zoom）**不在这里**：它跟屏幕大小走，是设备的事，不随歌。pad 的「1=」/ 调式 / 音域也不在：pad 是独立设备，换歌不换它。
// 这个模块只管「一个对象 ↔ 文件里的 JSON」；变量本身仍住在 main.ts（viewScope / pageFlow / partView），存时 deskNow() 聚一下、开时 applyDesk() 散回去——不搬家，少改线。
export interface PartViewState { hidden: boolean; only: boolean; muted: boolean; solo: boolean }
export const freshPartView = (): PartViewState => ({ hidden: false, only: false, muted: false, solo: false });
export interface Desk { scope: "all" | "segment"; pageFlow: boolean; paper: string | null; parts: Record<string, PartViewState> }
export const freshDesk = (): Desk => ({ scope: "segment", pageFlow: false, paper: null, parts: {} });

/** 文件里的形状（只写非默认值；全默认 = 不写这个字段）。 */
export interface DeskJson { scope?: "all"; pageFlow?: true; paper?: string; parts?: Record<string, { hidden?: true; only?: true; muted?: true; solo?: true }> }
export function serializeDesk(d: Desk): DeskJson | null {
  const out: DeskJson = {};
  if (d.scope === "all") out.scope = "all";
  if (d.pageFlow) out.pageFlow = true;
  if (d.paper) out.paper = d.paper;
  const parts: NonNullable<DeskJson["parts"]> = {};
  for (const [id, p] of Object.entries(d.parts)) {
    const v: { hidden?: true; only?: true; muted?: true; solo?: true } = {};
    if (p.hidden) v.hidden = true; if (p.only) v.only = true; if (p.muted) v.muted = true; if (p.solo) v.solo = true;
    if (Object.keys(v).length) parts[id] = v;
  }
  if (Object.keys(parts).length) out.parts = parts;
  return Object.keys(out).length ? out : null;
}
/** 读文件里的（宽容：不是对象 / 字段不认识 = 当默认；别家 / 更新版写的多余字段不管）。 */
export function unserializeDesk(json: unknown): Desk {
  const d = freshDesk();
  if (!json || typeof json !== "object") return d;
  const j = json as Record<string, unknown>;
  if (j.scope === "all") d.scope = "all";
  if (j.pageFlow === true) d.pageFlow = true;
  if (typeof j.paper === "string" && j.paper) d.paper = j.paper;
  if (j.parts && typeof j.parts === "object") {
    for (const [id, v] of Object.entries(j.parts as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const p = v as Record<string, unknown>;
      d.parts[id] = { hidden: p.hidden === true, only: p.only === true, muted: p.muted === true, solo: p.solo === true };
    }
  }
  return d;
}
