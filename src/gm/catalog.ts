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
  styles?: { tag: string; ear: string; as?: string }[];
  substitutes?: { program: number; bank: number; note?: number; gmNumber: number; gmName: string; basis: "official" | "lineage" | "family" | "name-only"; hsCommon?: string; reason?: string }[];
  icon?: { id: string | null; candidates?: string[]; license?: string; borrowedFrom?: string } | null;
  fundamentalRank: number | null;
}
export interface GmRow { program: number; bank: number; note?: number; gmNumber: number; gmName: string; family?: string; concept: string; relation: "self" | "substitute"; musicxmlSound?: string; year?: number | null; era?: string; basis?: string; reason?: string }
export interface Defs { eras: { id: string; zh: string; from: number | null; to: number | null }[]; families: { id: string; en: string; zh: string }[]; kinds: { id: string; zh: string }[]; styles?: { id?: string; tag?: string; zh?: string; en?: string }[] }
export interface Catalog {
  version: number; concepts: Concept[]; byId: Map<string, Concept>;
  gmSelf: Map<string, GmRow>;                     // "bank:program" → 本尊行
  rows: GmRow[]; defs: Defs;
}
/** 一个概念的「谁能演」（GM 这边）：本尊预设；没本尊时列平替（写明依据）。bank 128 = 鼓组。 */
export interface Provider { kind: "self" | "substitute"; bank: number; program: number; gmName: string; sound: string | null; basis?: string; reason?: string }

export function loadCatalogFromJson(concepts: { v?: number; defs: Defs; concepts: Concept[] }, gmMap: { rows: GmRow[] }): Catalog {
  const rows = gmMap.rows, gmSelf = new Map<string, GmRow>();
  for (const r of rows) if (r.relation === "self") gmSelf.set(`${r.bank}:${r.program}`, r);
  const list = concepts.concepts;
  return { version: concepts.v ?? 0, concepts: list, byId: new Map(list.map((c) => [c.id, c])), gmSelf, rows, defs: concepts.defs };
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
  const self = (c.ids.gm ?? []).map((g) => { const r = cat.gmSelf.get(`${g.bank}:${g.program}`); return { kind: "self" as const, bank: g.bank, program: g.program, gmName: r?.gmName ?? `GM ${g.program + 1}`, sound: r?.musicxmlSound ?? c.ids.musicxml }; });
  if (self.length) return self;
  return (c.substitutes ?? []).map((s) => ({ kind: "substitute" as const, bank: s.bank, program: s.program, gmName: s.gmName, sound: c.ids.musicxml, basis: s.basis, reason: s.reason }));
}
/** 谱上写的角色名：目录里的英文名首字母大写（打谱惯例；Vocals / Piano 同款）。 */
export const roleNameOf = (c: Concept): string => c.names.en.replace(/^./, (ch) => ch.toUpperCase());
/** 角色的官方乐器语义 id：概念自己的；没有就用本尊预设的；再没有 = null（角色沿用原来的）。 */
export const roleSoundOf = (cat: Catalog, c: Concept): string | null => c.ids.musicxml ?? providersOf(cat, c)[0]?.sound ?? null;

export type SortMode = "family" | "year" | "hs" | "style";
export const SORT_LABEL: Record<SortMode, string> = { family: "按族（GM 的顺序）", year: "按年代", hs: "按发声方式", style: "按〇〇风" };
const HS_CLASS: Record<string, string> = { "1": "体鸣（敲它自己）", "2": "膜鸣（敲皮）", "3": "弦鸣（弦）", "4": "气鸣（气）", "5": "电鸣（电）" };
export interface Group { id: string; label: string; concepts: Concept[] }
/** 分组 + 组内排序。搜索词按中 / 英 / 日名子串过滤。 */
export function groupConcepts(cat: Catalog, mode: SortMode, query = ""): Group[] {
  const q = query.trim().toLowerCase();
  const hit = (c: Concept) => !q || [c.names.zh, c.names.en, c.names.ja ?? ""].some((n) => n.toLowerCase().includes(q));
  const list = cat.concepts.filter(hit);
  const byGm = (a: Concept, b: Concept) => ((a.ids.gm ?? [])[0]?.program ?? 999) - ((b.ids.gm ?? [])[0]?.program ?? 999) || a.names.zh.localeCompare(b.names.zh, "zh");
  const groups = new Map<string, Group>();
  const put = (id: string, label: string, c: Concept) => { let g = groups.get(id); if (!g) { g = { id, label, concepts: [] }; groups.set(id, g); } g.concepts.push(c); };
  if (mode === "family") {
    const order = new Map(cat.defs.families.map((f, i) => [f.id, i]));
    for (const c of list) { const f = (c.family ?? [])[0] ?? "other"; put(f, cat.defs.families.find((x) => x.id === f)?.zh ?? (c.kind === "voice" ? "人声" : c.kind === "sound" ? "音效" : "其他"), c); }   // GM 以外的乐器（二胡）没有 family
    return [...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort(byGm) }));
  }
  if (mode === "year") {
    const eras = cat.defs.eras;
    for (const c of list) { const e = eras.find((x) => x.id === c.era); put(e?.id ?? "unknown", e ? `${e.zh}${e.from !== null ? `（${fmtYear(e.from)} 起）` : ""}` : "年代不详", c); }
    const order = new Map(eras.map((e, i) => [e.id, i]));
    return [...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9)) }));
  }
  if (mode === "hs") {
    for (const c of list) { const k = c.ids.hs?.[0] ?? "?"; put(k, HS_CLASS[k] ?? "分类不详", c); }
    return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id)).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.ids.hs ?? "~").localeCompare(b.ids.hs ?? "~")) }));
  }
  for (const c of list) { const tags = [...new Set((c.styles ?? []).map((s) => s.tag))]; if (!tags.length) put("none", "没贴风格", c); for (const t of tags) put(t, styleLabel(cat, t), c); }
  return [...groups.values()].sort((a, b) => (a.id === "none" ? 1 : b.id === "none" ? -1 : a.label.localeCompare(b.label, "zh"))).map((g) => ({ ...g, concepts: g.concepts.sort(byGm) }));
}
function styleLabel(cat: Catalog, tag: string): string { const s = cat.defs.styles?.find((x) => (x.id ?? x.tag) === tag); return s?.zh ?? s?.en ?? tag; }
export const fmtYear = (y: number): string => (y < 0 ? `公元前 ${-y}` : String(y));
export const eraLabel = (cat: Catalog, c: Concept): string => cat.defs.eras.find((e) => e.id === c.era)?.zh ?? "";
