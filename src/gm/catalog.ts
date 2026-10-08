// catalog.ts —— 找人视图的目录：乐器概念（百科，表 ①）+ GM 映射（表 ②）。纯数据层：加载 / 核 sha256 / 排序分组 / 「谁能演」。
// created 2026-10-07 by Claude Fable 5.1。数据 = vendor/instruments/（scripts/gen-instruments.mjs 从仓鼠会话的 export 拷来；user：两张表、id 束、GM 只是头脑风暴的起点）。
// 这是视图层的目录，不进歌：歌里钉的是角色的 id 束 + 名字（契约 §6⅞）；目录常改没关系。
import { INSTRUMENT_FILES } from "./instruments.gen.ts";

export interface GmRef { program: number; bank: number; note?: number }
export interface Concept {
  id: string;                                     // Wikidata QID 或 x:本地
  ids: { wikidata: string | null; local: string | null; musicxml: string | null; gm: GmRef[]; hs: string | null };
  names: { zh: string; en: string; ja?: string; tok?: string };
  kind: "instrument" | "model" | "ensemble" | "voice" | "sound";
  year: number | null; yearApprox?: boolean; lineageYear?: number | null; era?: string | null;
  regions?: string[]; family: string[]; wikipedia?: string;
  styles?: { tag: string; ear: string; as?: string; weight?: number }[];   // weight = 承重 3 / 常用 2 / 点缀 1（v3；defs.weights；AI 判的配器分量，不是 fundamental）
  substitutes?: { program: number; bank: number; note?: number; gmNumber: number; gmName: string; basis: "official" | "lineage" | "imitation" | "family" | "name-only"; hsCommon?: string; reason?: string }[];
  icon?: { id: string | null; candidates?: string[]; license?: string; borrowedFrom?: string } | null;
  fundamentalRank: number | null;
  /** 常用音域（MIDI，实际发声，移调乐器已换算）：v5 起由仓鼠的百科表给（user 2026-10-08「让仓鼠调查」）；没有 = 不画提示。basis = 依据（「原文（Violin）」「AI 常识」…）。 */
  range?: { low: number; high: number; basis?: string } | null;
  /** 音效在现实里最像的那个键（v5；电话 = 102，GS 采样实测 2951 Hz；user「电话铃感觉就是老实的，以你听到的为准」）。 */
  naturalKey?: { note: number; hz?: number; basis?: string } | null;
}
export interface GmRow { program: number; bank: number; note?: number; gmNumber: number; gmName: string; family?: string; concept: string; relation: "self" | "substitute"; primary?: boolean;
  /** 这个音色自己在哪些风里（仓鼠 v8 起逐个音色判；本尊行才有）：as = 在这种风里顶替哪个概念（平替认领）。概念上的 styles 是这些聚合出来的，只拿来说「这件乐器属于哪些风」。 */
  styles?: { tag: string; ear: string; weight?: number; as?: string }[]; musicxmlSound?: string; year?: number | null; era?: string; basis?: string; reason?: string;   // primary = 一个号多重认领时的主本尊（v3）
  /** GM 116–128 音效：在 GS + TinySoundFont 里按哪个键是采样原速（v8 按 TSF 的音高公式重算；换音色库 / 引擎就不算数）。 */
  joint?: RowJoint; excitation?: { id: string; basis?: string }; breath?: { id: string; basis?: string };
  sampleKey?: { soundfont: string; engine?: string; recommended: number; recommendedBasis?: string;
    layers?: { sample?: string; originalSpeedKey?: number; centsPerKey?: number; keyRange?: string; peakAtRecommended?: { hz: number; midi: number; pitched: boolean } | null }[] } }
/** 演奏元数据（仓鼠 v11 起，gm-map 每行都有，各带 basis 依据；W-13：中文标签从 defs 取，不写死）。
 *  joint = 不写记号时音和下一个音怎么接（连断的底色）；鼓件 / 音效 / 一下就完的 id = null。 */
export interface RowJoint { id: string | null; gapMs: number | null; basis?: string }
export interface Defs { eras: { id: string; zh: string; from: number | null; to: number | null }[]; families: { id: string; en: string; zh: string }[]; kinds: { id: string; zh: string }[]; styles?: { id?: string; tag?: string; zh?: string; en?: string }[]; weights?: { id: number; zh: string }[] }
export interface Catalog {
  version: number; concepts: Concept[]; byId: Map<string, Concept>;
  gmSelf: Map<string, GmRow>;                     // gmKey（"bank:program[:note]"）→ 本尊行
  rows: GmRow[]; defs: Defs;
}
/** 一个概念的「谁能演」（GM 这边）：本尊预设；没本尊时列平替（写明依据）。bank 128 = 鼓组。 */
export interface Provider { kind: "self" | "substitute"; bank: number; program: number; note?: number; gmName: string; sound: string | null; basis?: string; reason?: string }   // note = 鼓件（bank 128 的鼓组里固定敲这个键）
export const gmKey = (g: { bank: number; program: number; note?: number }): string => `${g.bank}:${g.program}${g.note !== undefined ? `:${g.note}` : ""}`;

export function loadCatalogFromJson(concepts: { v?: number; defs: Defs; concepts: Concept[] }, gmMap: { rows: GmRow[]; defs?: Partial<Defs> & Record<string, unknown> }): Catalog {
  const rows = gmMap.rows, gmSelf = new Map<string, GmRow>();
  for (const r of rows) if (r.relation === "self" && (r.primary !== false || !gmSelf.has(gmKey(r)))) gmSelf.set(gmKey(r), r);   // 鼓件靠 note 区分（47 个鼓件都在 128:0 下）；一个号多重认领取主本尊
  const list = concepts.concepts;
  // defs：两张表各带一份；演奏元数据的枚举（joints / excitations / sustains / breaths，仓鼠 v11）只在 gm-map 里——并起来，同名的以表 ① 为准
  return { version: concepts.v ?? 0, concepts: list, byId: new Map(list.map((c) => [c.id, c])), gmSelf, rows, defs: { ...(gmMap.defs ?? {}), ...concepts.defs } as Defs };
}
let cached: Promise<Catalog> | null = null;
const sha256Hex = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as unknown as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");
async function fetchChecked(base: URL, k: keyof typeof INSTRUMENT_FILES): Promise<Uint8Array> {
  const e = INSTRUMENT_FILES[k], r = await fetch(new URL(`../${e.file}`, base));
  if (!r.ok) throw new Error(`${e.file}: HTTP ${r.status}`);
  const b = new Uint8Array(await r.arrayBuffer());
  if (b.length !== e.bytes || (await sha256Hex(b)) !== e.sha256) throw new Error(`${e.file} 和 app 内嵌的不一样（被改过？）`);
  return b;
}
/** 打开找人视图时才加载（两份 JSON 共 260 KB）；base = 主 bundle 的 import.meta.url（dist/ 下）。 */
export function loadCatalog(base: URL): Promise<Catalog> {
  return (cached ??= (async () => {
    const [c, g] = await Promise.all([fetchChecked(base, "concepts"), fetchChecked(base, "gmMap")]);
    const dec = new TextDecoder();
    return loadCatalogFromJson(JSON.parse(dec.decode(c)), JSON.parse(dec.decode(g)));
  })().catch((e) => { cached = null; throw e; }));
}
/** 图标 sprite（103 KB，49 个），核过 sha256 的字节。 */
export async function loadIconSprite(base: URL): Promise<string> { return new TextDecoder().decode(await fetchChecked(base, "icons")); }

export function providersOf(cat: Catalog, c: Concept): Provider[] {
  const self = (c.ids.gm ?? []).map((g) => { const r = cat.gmSelf.get(gmKey(g)); return { kind: "self" as const, bank: g.bank, program: g.program, ...(g.note !== undefined ? { note: g.note } : {}), gmName: r?.gmName ?? (g.note !== undefined ? `鼓件 ${g.note}` : `GM ${g.program + 1}`), sound: r?.musicxmlSound ?? c.ids.musicxml }; });
  if (self.length) return self;
  return (c.substitutes ?? []).map((s) => ({ kind: "substitute" as const, bank: s.bank, program: s.program, ...(s.note !== undefined ? { note: s.note } : {}), gmName: s.gmName, sound: c.ids.musicxml, basis: s.basis, reason: s.reason }));
}
/** 这个概念在 pad 上提示哪几个键（提示条 / 试听时窗口跟进用）：有常用音域 = 那一段；音效有「最像的键」= 就那一个；都没有 = null。 */
export function rangeOf(c: Concept | undefined): { lo: number; hi: number; title: string } | null {
  const r = c?.range;
  if (r && Number.isFinite(r.low) && Number.isFinite(r.high) && r.low <= r.high) return { lo: r.low, hi: r.high, title: `${c!.names.zh}的常用音域${r.basis ? `（依据：${r.basis}）` : ""}` };
  // naturalKey（「听起来像哪个音高」）不拿来当提示键：音效的键名 ≠ 听到的音高（仓鼠 v8：电话原速键 64，听到的最强频率在 C7 附近）。按哪个键 = sampleKeyOf
  return null;
}
/** GS 的音效预设在 TinySoundFont 里的原速键（按它采样不拉伸不压缩；仓鼠 v8）；不是 GS 的音效 = null。
 *  只对家族音源库的 GeneralUser GS 成立——调用方确认演奏者用的就是它（origin.library）。 */
export function sampleKeyOf(cat: Catalog, bank: number, program: number): { key: number; title: string; midi?: number; centsPerKey?: number } | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === undefined && r.sampleKey);
  const k = row?.sampleKey;
  if (!k || !Number.isFinite(k.recommended)) return null;
  // 音高对齐的锚点（sf-key.ts）：「原速键 = 推荐键」的那层（仓鼠定推荐键时的主层）；没有就取第一个覆盖推荐键、听得出音高的层。宽带噪声 = 没有锚点（不能对齐）
  const covers = (r?: string) => { const m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(r ?? ""); return !m || (k.recommended >= +m[1] && k.recommended <= +m[2]); };
  const ls = (k.layers ?? []).filter((l) => covers(l.keyRange) && l.peakAtRecommended?.pitched && l.centsPerKey);
  const main = ls.find((l) => Math.round(l.originalSpeedKey ?? NaN) === k.recommended) ?? ls[0];
  return { key: k.recommended, title: `原速键：按这个键，采样不拉伸不压缩${k.recommendedBasis ? `（${k.recommendedBasis}）` : ""}`,
    ...(main ? { midi: Math.round(main.peakAtRecommended!.midi * 100) / 100, centsPerKey: main.centsPerKey } : {}) };
}
/** 连断的底色（仓鼠 v11 的 joint）：这个 GM 号建议音和音之间留多大缝 + 中文名 + 依据。目录里没有 / 没写（旧版目录、鼓件、音效）= null。
 *  按 GM 号逐个（user 2026-10-08「midi的string系乐器是有不同的演奏方法的，你不能按乐器一刀切」）。 */
export function jointOf(cat: Catalog, bank: number, program: number, note?: number): { gapSec: number; zh: string; basis: string } | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === note && r.joint) ?? cat.rows.find((r) => r.bank === bank && r.program === program && r.joint);
  const j = row?.joint; if (!j || j.id === null || j.gapMs === null) return null;
  const zh = (cat.defs as Defs & { joints?: { id: string; zh: string }[] }).joints?.find((x) => x.id === j.id)?.zh ?? j.id;
  return { gapSec: j.gapMs / 1000, zh, basis: j.basis ?? "" };
}
/** GS 在家族音源库里的 id（sampleKey 只对它成立）。 */
export const GS_LIBRARY_ID = "generaluser-gs-2.0.3";
/** 谱上写的角色名：目录里的英文名首字母大写（打谱惯例；Vocals / Piano 同款）。 */
export const roleNameOf = (c: Concept): string => c.names.en.replace(/^./, (ch) => ch.toUpperCase());
/** 角色的官方乐器语义 id：概念自己的；没有就用本尊预设的；再没有 = null（角色沿用原来的）。 */
export const roleSoundOf = (cat: Catalog, c: Concept): string | null => c.ids.musicxml ?? providersOf(cat, c)[0]?.sound ?? null;

export type SortMode = "family" | "year" | "hs" | "style";
// 「按曲风」= 原「按〇〇风」（user 2026-10-08「按OO风换一个更正式好懂的名字」）；组名（和风 / 中华风 / 贝多风…）照旧用仓鼠表里的
export const SORT_LABEL: Record<SortMode, string> = { style: "按曲风", family: "按族（GM 的顺序）", year: "按年代", hs: "按发声方式" };   // 下拉的顺序 = 这里的顺序（默认的排第一）
const HS_CLASS: Record<string, string> = { "1": "体鸣（敲它自己）", "2": "膜鸣（敲皮）", "3": "弦鸣（弦）", "4": "气鸣（气）", "5": "电鸣（电）" };
/** 列表里的一行：一个概念；按曲风时可以是概念名下的**一个音色**（preset = 那一行 GM 映射，星级 / 入选按它自己的，user 2026-10-08「音色为单位而不是家族一把捞」）。 */
export interface Entry { concept: Concept; preset?: GmRow; weight?: number; as?: string }
export interface Group { id: string; label: string; items: Entry[] }
/** 分组 + 组内排序。搜索词按中 / 英 / 日名子串过滤（按曲风时音色行也认 GM 名：搜「Pad」）。 */
export function groupConcepts(cat: Catalog, mode: SortMode, query = ""): Group[] {
  const q = query.trim().toLowerCase();
  const hit = (c: Concept) => !q || [c.names.zh, c.names.en, c.names.ja ?? ""].some((n) => n.toLowerCase().includes(q));
  const list = cat.concepts.filter(hit);
  const byGm = (a: Concept, b: Concept) => ((a.ids.gm ?? [])[0]?.program ?? 999) - ((b.ids.gm ?? [])[0]?.program ?? 999) || a.names.zh.localeCompare(b.names.zh, "zh");
  const groups = new Map<string, { id: string; label: string; concepts: Concept[] }>();
  const put = (id: string, label: string, c: Concept) => { let g = groups.get(id); if (!g) { g = { id, label, concepts: [] }; groups.set(id, g); } g.concepts.push(c); };
  const asItems = (gs: { id: string; label: string; concepts: Concept[] }[]): Group[] => gs.map((g) => ({ id: g.id, label: g.label, items: g.concepts.map((concept) => ({ concept })) }));
  if (mode === "family") {
    const order = new Map(cat.defs.families.map((f, i) => [f.id, i]));
    for (const c of list) { const f = (c.family ?? [])[0] ?? "other"; put(f, cat.defs.families.find((x) => x.id === f)?.zh ?? (c.kind === "voice" ? "人声" : c.kind === "sound" ? "音效" : "其他"), c); }   // GM 以外的乐器（二胡）没有 family
    return asItems([...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort(byGm) })));
  }
  if (mode === "year") {
    const eras = cat.defs.eras;
    for (const c of list) { const e = eras.find((x) => x.id === c.era); put(e?.id ?? "unknown", e ? `${e.zh}${e.from !== null ? `（${fmtYear(e.from)} 起）` : ""}` : "年代不详", c); }
    const order = new Map(eras.map((e, i) => [e.id, i]));
    return asItems([...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9)) })));
  }
  if (mode === "hs") {
    for (const c of list) { const k = c.ids.hs?.[0] ?? "?"; put(k, HS_CLASS[k] ?? "分类不详", c); }
    return asItems([...groups.values()].sort((a, b) => (a.id.localeCompare(b.id))).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.ids.hs ?? "~").localeCompare(b.ids.hs ?? "~")) })));
  }
  return styleGroups(cat, q, hit);
}
/** 按曲风：**以 GM 音色为单位**（user 2026-10-08「评级和是否入选能不能精确到合成器里面的子音色」「每个不同的音色都单列单评级」「音色为单位而不是家族一把捞」「丢了子音的排序和策展」）。
 *  成员 = 本尊行自己的 styles（仓鼠 v8 起逐个音色判；一个号多重认领只看主本尊）；没有 GM 音色能演的概念（古筝 / 风铃…）照旧按概念、星级用概念的。
 *  组内：承重降序 → 年份升序 → GM 号（user「每个风里面按照承重排」；同承重按时间 = 仓鼠转述的 user 口径）。 */
function styleGroups(cat: Catalog, q: string, hit: (c: Concept) => boolean): Group[] {
  const groups = new Map<string, Group>();
  const put = (tag: string, e: Entry) => { let g = groups.get(tag); if (!g) { g = { id: tag, label: tag === "none" ? "没贴风格" : styleLabel(cat, tag), items: [] }; groups.set(tag, g); } g.items.push(e); };
  const self = [...cat.gmSelf.values()];
  const styled = new Set(self.filter((r) => r.styles?.length).map((r) => r.concept));   // 有逐音色风格的概念：成员按音色算
  for (const r of self) {
    const c = cat.byId.get(r.concept); if (!c || !styled.has(c.id)) continue;
    if (!hit(c) && !(q && r.gmName.toLowerCase().includes(q))) continue;
    if (!r.styles?.length) { put("none", { concept: c, preset: r }); continue; }   // 没入选任何风的音色：照样找得到
    for (const s of r.styles) put(s.tag, { concept: c, preset: r, weight: s.weight ?? 0, ...(s.as ? { as: s.as } : {}) });
  }
  for (const c of cat.concepts) {
    if (styled.has(c.id) || !hit(c)) continue;
    const tags = new Map<string, { weight: number; as?: string }>();
    for (const s of c.styles ?? []) { const was = tags.get(s.tag); if (!was || (s.weight ?? 0) > was.weight) tags.set(s.tag, { weight: s.weight ?? 0, ...(s.as ? { as: s.as } : {}) }); }
    if (!tags.size) put("none", { concept: c });
    for (const [t, w] of tags) put(t, { concept: c, ...w });
  }
  const yearOf = (e: Entry) => e.preset?.year ?? e.concept.year ?? 1e9, gmOf = (e: Entry) => e.preset?.gmNumber ?? 999;
  return [...groups.values()].sort((a, b) => (a.id === "none" ? 1 : b.id === "none" ? -1 : a.label.localeCompare(b.label, "zh")))
    .map((g) => ({ ...g, items: g.items.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0) || yearOf(a) - yearOf(b) || gmOf(a) - gmOf(b) || a.concept.names.zh.localeCompare(b.concept.names.zh, "zh")) }));
}
export const weightLabel = (cat: Catalog, w: number): string => cat.defs.weights?.find((x) => x.id === w)?.zh ?? "";
function styleLabel(cat: Catalog, tag: string): string { const s = cat.defs.styles?.find((x) => (x.id ?? x.tag) === tag); return s?.zh ?? s?.en ?? tag; }
export const fmtYear = (y: number): string => (y < 0 ? `公元前 ${-y}` : String(y));
export const eraLabel = (cat: Catalog, c: Concept): string => cat.defs.eras.find((e) => e.id === c.era)?.zh ?? "";
