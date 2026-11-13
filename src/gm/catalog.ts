// catalog.ts —— 找人视图的目录：乐器概念（百科，表 ①）+ GM 映射（表 ②）。纯数据层：加载 / 核 sha256 / 排序分组 / 「谁能演」。
// created 2026-10-07 by Claude Fable 5.1。数据 = vendor/instruments/（scripts/gen-instruments.mjs 从仓鼠会话的 export 拷来；user：两张表、id 束、GM 只是头脑风暴的起点）。
// 这是视图层的目录，不进歌：歌里钉的是角色的 id 束 + 名字（契约 §6⅞）；目录常改没关系。
import { _t, lang } from "../i18n/index.ts";
import { conceptName, defLabel, zhOnly } from "./catalog-i18n.ts";
import { INSTRUMENT_FILES } from "./instruments.gen.ts";
import { getBytes } from "../resources.ts";
import { GS_LIBRARY_ID } from "./library-ids.ts";

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
  /** 出版谱简写（v12；MuseScore instruments.xml 的 shortName，如 Vln. / Pno. / Glock.）：总谱第二行起每行谱前写它（user「乐手名和颜色同意」）。没有 zh（仓鼠没找到中文通行简称的出处，不现编）。 */
  abbr?: { en: string; basis?: string } | null;
  /** 谱上名（v15）：谱表开头印的、乐手对这个声部的叫法（Western concert flute → Flute、各型号 → 功能名 Electric Guitar / Synthesizer）；names = 详细说明（百科名），不上谱。
   *  user 2026-11-07「为什么我从era里面选的flute在sheet上面显示western concept flute」「所以应该是有详细解释，名字，简写？」「不只是长笛，而是系统的看一下」。 */
  scoreName?: { en: string; basis?: string } | null;
  /** 记谱惯例（v12）：clef = 按惯例写谱的谱号；concertClef = 按实际音高显示时的谱号（钟琴 G15ma、短笛 / 木琴 G8va、低音提琴 F8vb）；
   *  sounds = 实际音高 − 按基础谱号读的谱面音高（半音）；octave = sounds 里整八度的部分。 */
  notation?: { clef: string; clefs?: string[]; concertClef: string; concertClefs?: string[]; sounds: number; octave: number; basis?: string; wikipedia?: unknown } | null;
}
/** 铃类的八度实测（v12，gm-map GM 9–16 / 99 / 113 / 115）：measured = 最强分音比键名高几个半音；perceived = 耳朵听到的音比键名高几个半音（null = 判不准）。 */
export interface OctaveCheck { keys: number[]; measured: number; measuredOctave: number; lowest: number; perceived: number | null; perceivedNote?: string; basis?: string; sources?: unknown }
export interface GmRow { program: number; bank: number; note?: number; gmNumber: number; gmName: string; family?: string; concept: string; relation: "self" | "substitute"; primary?: boolean;
  /** 这个音色自己在哪些风里（仓鼠 v8 起逐个音色判；本尊行才有）：as = 在这种风里顶替哪个概念（平替认领）。概念上的 styles 是这些聚合出来的，只拿来说「这件乐器属于哪些风」。 */
  styles?: { tag: string; ear: string; weight?: number; as?: string }[]; musicxmlSound?: string; year?: number | null; era?: string; basis?: string; reason?: string;   // primary = 一个号多重认领时的主本尊（v3）
  /** GM 116–128 音效：在 GS + TinySoundFont 里按哪个键是采样原速（v8 按 TSF 的音高公式重算；换音色库 / 引擎就不算数）。 */
  joint?: RowJoint; excitation?: { id: string; basis?: string }; breath?: { id: string; basis?: string };
  sustain?: { id: string; attackMs?: number; noteOffCuts?: boolean; basis?: string };   // 仓鼠 v11：sustained / decaying / oneshot（实测）
  velLayers?: { soundfont?: string; key?: number; count: number; ranges: [number, number][]; mpMfSwitchesLayer?: boolean; basis?: string };
  octaveCheck?: OctaveCheck;   // 铃类的八度实测（v12）   // 仓鼠 v11：GS 里这个预设的力度层（实测）
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
/** 同站点那一份（resources.ts：官网 / itch = fetch，备用版 = 老实脚本），核过 app 内嵌的哈希才用。2026-11-03 起不再按主 bundle 的地址拼路径（备用版的主程序内联在 index.html 里）。 */
async function fetchChecked(k: keyof typeof INSTRUMENT_FILES): Promise<Uint8Array> {
  const e = INSTRUMENT_FILES[k], b = await getBytes(e.file, { sha256: e.sha256 });
  if (b.length !== e.bytes || (await sha256Hex(b)) !== e.sha256) throw new Error(_t("{file} 和 app 内嵌的不一样（被改过？）", { file: e.file }));
  return b;
}
/** 打开找人视图时才加载（两份 JSON 共 260 KB）。 */
export function loadCatalog(): Promise<Catalog> {
  return (cached ??= (async () => {
    const [c, g] = await Promise.all([fetchChecked("concepts"), fetchChecked("gmMap")]);
    const dec = new TextDecoder();
    return loadCatalogFromJson(JSON.parse(dec.decode(c)), JSON.parse(dec.decode(g)));
  })().catch((e) => { cached = null; throw e; }));
}
/** 图标 sprite（103 KB，49 个），核过 sha256 的字节。 */
export async function loadIconSprite(): Promise<string> { return new TextDecoder().decode(await fetchChecked("icons")); }

export function providersOf(cat: Catalog, c: Concept): Provider[] {
  const self = (c.ids.gm ?? []).map((g) => { const r = cat.gmSelf.get(gmKey(g)); return { kind: "self" as const, bank: g.bank, program: g.program, ...(g.note !== undefined ? { note: g.note } : {}), gmName: r?.gmName ?? (g.note !== undefined ? _t("鼓件 {note}", { note: g.note }) : `GM ${g.program + 1}`), sound: r?.musicxmlSound ?? c.ids.musicxml }; });
  if (self.length) return self;
  return (c.substitutes ?? []).map((s) => ({ kind: "substitute" as const, bank: s.bank, program: s.program, ...(s.note !== undefined ? { note: s.note } : {}), gmName: s.gmName, sound: c.ids.musicxml, basis: s.basis, reason: s.reason }));
}
/** 这个概念在 pad 上提示哪几个键（提示条 / 试听时窗口跟进用）：有常用音域 = 那一段；音效有「最像的键」= 就那一个；都没有 = null。 */
export function rangeOf(c: Concept | undefined): { lo: number; hi: number; title: string } | null {
  const r = c?.range;
  if (r && Number.isFinite(r.low) && Number.isFinite(r.high) && r.low <= r.high) return { lo: r.low, hi: r.high, title: _t("{zh}的常用音域{basis}", { zh: conceptName(c!.names), basis: r.basis && zhOnly(r.basis) ? _t("（依据：{basis}）", { basis: r.basis }) : "" }) };
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
  return { key: k.recommended, title: _t("原速键：按这个键，采样不拉伸不压缩{recommendedBasis}", { recommendedBasis: k.recommendedBasis && zhOnly(k.recommendedBasis) ? `（${k.recommendedBasis}）` : "" }),
    ...(main ? { midi: Math.round(main.peakAtRecommended!.midi * 100) / 100, centsPerKey: main.centsPerKey } : {}) };
}
/** 连断的底色（仓鼠 v11 的 joint）：这个 GM 号建议音和音之间留多大缝 + 中文名 + 依据。目录里没有 / 没写（旧版目录、鼓件、音效）= null。
 *  按 GM 号逐个（user 2026-10-08「midi的string系乐器是有不同的演奏方法的，你不能按乐器一刀切」）。 */
export function jointOf(cat: Catalog, bank: number, program: number, note?: number): { gapSec: number; zh: string; basis: string } | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === note && r.joint) ?? cat.rows.find((r) => r.bank === bank && r.program === program && r.joint);
  const j = row?.joint; if (!j || j.id === null || j.gapMs === null) return null;
  const zh = defLabel((cat.defs as Defs & { joints?: { id: string; zh: string }[] }).joints?.find((x) => x.id === j.id)?.zh ?? j.id);
  return { gapSec: j.gapMs / 1000, zh, basis: j.basis ?? "" };
}
/** 这个预设能不能一直响（仓鼠 v11 实测）："sustained" / "decaying" / "oneshot"；没有 = null。 */
export function sustainOf(cat: Catalog, bank: number, program: number, note?: number): string | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === note && r.sustain) ?? cat.rows.find((r) => r.bank === bank && r.program === program && r.sustain);
  return row?.sustain?.id ?? null;
}
/** GS 预设上场 / 试听时带的键设置：鼓件 = 固定那个键；音效（GM 116–128，仓鼠 v8 的 sampleKey）= **默认固定原速**（note = 原速键）+ 按值抄原速键和音高锚点（sfx）；
 *  其余不带（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）。 */
//   2026-11-13（16-6）从 main.ts 搬来：上场时抄进乐手的和乐器页「现在的默认」（src/performers/defaults.ts）问的是同一个函数。
export function castArgsOf(cat: Catalog, bank: number, program: number, drumNote?: number): { note?: number; sfx?: { key: number; midi?: number; centsPerKey?: number }; gapSec?: number; canSwell?: boolean } {
  // 连断的底色也是目录（仓鼠 v11 的 joint，按 GM 号逐个）按值给的；没有 = 不写 = 0（user「你不能按乐器一刀切」「让音乐仓鼠准备一下分类用的元数据」）
  const gap = jointOf(cat, bank, program, drumNote)?.gapSec, sus = sustainOf(cat, bank, program, drumNote);
  const g = { ...(gap ? { gapSec: gap } : {}), ...(sus && sus !== "sustained" ? { canSwell: false } : {}) };   // 仓鼠 v11 实测：不是一直能持续的 = 音内变强做不到
  if (drumNote !== undefined) return { note: drumNote, ...g };
  const sk = sampleKeyOf(cat, bank, program); if (!sk) return g;
  return { note: sk.key, sfx: { key: sk.key, ...(sk.midi !== undefined ? { midi: sk.midi } : {}), ...(sk.centsPerKey ? { centsPerKey: sk.centsPerKey } : {}) }, ...g };
}
/** 这个预设在 GS 里的力度层（仓鼠 v11 实测；在 key 那个键上测的）。没有 = null。 */
export function velLayersOf(cat: Catalog, bank: number, program: number, note?: number): { count: number; ranges: [number, number][]; key?: number } | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === note && r.velLayers) ?? cat.rows.find((r) => r.bank === bank && r.program === program && r.velLayers);
  return row?.velLayers && row.velLayers.count > 0 ? { count: row.velLayers.count, ranges: row.velLayers.ranges ?? [], key: row.velLayers.key } : null;
}
/** 铃类的八度实测（仓鼠 v12，GM 9–16 / 99 / 113 / 115）。 */
export function octaveCheckOf(cat: Catalog, bank: number, program: number, note?: number): OctaveCheck | null {
  const row = cat.rows.find((r) => r.bank === bank && r.program === program && r.note === note && r.octaveCheck) ?? cat.rows.find((r) => r.bank === bank && r.program === program && r.octaveCheck);
  return row?.octaveCheck ?? null;
}
/** 角色记着的概念（id 束）→ 目录里的那件。 */
export function conceptOfIds(cat: Catalog, ids: { wikidata?: string | null; local?: string | null } | undefined): Concept | undefined {
  if (!ids) return undefined;
  return (ids.wikidata ? cat.byId.get(ids.wikidata) : undefined) ?? (ids.local ? cat.byId.get(ids.local) ?? cat.byId.get(`x:${ids.local}`) : undefined);
}
/** 乐器页「八度」那一行说的话（v0.9.32；user「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」）：没有可说的 = null。clefLabel = 谱号的中文名（「高音 15ma」）。 */
export function octaveDisclosure(nt: Concept["notation"] | undefined, oc: OctaveCheck | null, clefLabel: (c: string) => string): string | null {
  if (!oc && !(nt && nt.octave)) return null;
  const parts = [_t("谱上写的就是实际音高（MoonSinger 不按乐器移调），发给音源的也是这个音。")];
  if (nt && nt.octave) parts.push(_t("这件乐器的谱习惯写{p} {octave} 个八度（实际{p2}）；想要谱面好读，用谱号（这件乐器按实际音高时常用「{concertClef}」，谱号「自动」也会挑）或 8va 线，出声不变。", { p: nt.octave > 0 ? _t("低") : _t("高"), octave: Math.abs(nt.octave) / 12, p2: nt.octave > 0 ? _t("高") : _t("低"), concertClef: clefLabel(nt.concertClef) }));
  if (oc) parts.push(oc.perceived === null ? _t("GS 这个音色实测：判不准——每个键最强的那个分音比键名高 {measured} 半音，听起来多半跟着它。", { measured: Math.round(oc.measured) })
    : oc.perceived === 0 && Math.abs(oc.measured) < 0.5 ? _t("GS 这个音色实测：按哪个键，耳朵听到的就是那个音。")
    : oc.perceived === 0 ? _t("GS 这个音色实测：最强的分音比键名高 {measured} 半音（{measuredOctave} 个八度），但耳朵听到的音名还是键名（钟的打击音）——听着觉得高了是这个原因。", { measured: Math.round(oc.measured), measuredOctave: oc.measuredOctave })
    : _t("GS 这个音色实测：耳朵听到的比键名{p} {perceived} 半音。", { p: oc.perceived > 0 ? _t("高") : _t("低"), perceived: Math.abs(oc.perceived) }));
  return parts.join("");
}
/** GS 在家族音源库里的 id（sampleKey 只对它成立）。常数住在 library-ids.ts（读文件的门口也要用，不拖进这里的取数），这里照旧导出。 */
export { GS_LIBRARY_ID } from "./library-ids.ts";
/** 谱上写的角色名：目录里的英文名首字母大写（打谱惯例；Vocals / Piano 同款）。 */
/** 谱上写的名字 = 目录的谱上名（v15）；老目录没有 = 百科英文名去掉括号、首字母大写（原来整个百科名上谱：「Western concert flute」「Solid-body electric guitar (Fender Stratocaster)」）。 */
export const roleNameOf = (c: Concept): string => c.scoreName?.en || c.names.en.replace(/\s*\([^)]*\)/g, "").trim().replace(/^./, (ch) => ch.toUpperCase());
/** 角色的官方乐器语义 id：概念自己的；没有就用本尊预设的；再没有 = null（角色沿用原来的）。 */
export const roleSoundOf = (cat: Catalog, c: Concept): string | null => c.ids.musicxml ?? providersOf(cat, c)[0]?.sound ?? null;

export type SortMode = "family" | "year" | "hs" | "style" | "kind";
// 「按曲风」= 原「按〇〇风」（user 2026-10-08「按OO风换一个更正式好懂的名字」）；组名（和风 / 中华风 / 贝多风…）照旧用仓鼠表里的
export const SORT_LABEL: Record<SortMode, string> = { year: _t("按年代"), style: _t("按曲风"), kind: _t("按种类（鼓、Pad…）"), family: _t("按族（GM 的顺序）"), hs: _t("按发声方式") };   // 下拉的顺序 = 这里的顺序（默认的排第一；v0.15.7 起默认按年代，user 11-05「还是默认年代排序的那个order」）
const HS_CLASS: Record<string, string> = { "1": _t("体鸣（敲它自己）"), "2": _t("膜鸣（敲皮）"), "3": _t("弦鸣（弦）"), "4": _t("气鸣（气）"), "5": _t("电鸣（电）") };
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
    for (const c of list) { const f = (c.family ?? [])[0] ?? "other"; put(f, (lang() === "zh" ? cat.defs.families.find((x) => x.id === f)?.zh : cat.defs.families.find((x) => x.id === f)?.en) ?? (c.kind === "voice" ? _t("人声") : c.kind === "sound" ? _t("音效") : _t("其他")), c); }   // GM 以外的乐器（二胡）没有 family
    return asItems([...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort(byGm) })));
  }
  if (mode === "year") {
    const eras = cat.defs.eras;
    for (const c of list) { const e = eras.find((x) => x.id === c.era); put(e?.id ?? "unknown", e ? `${defLabel(e.zh)}${e.from !== null ? _t("（{from} 起）", { from: fmtYear(e.from) }) : ""}` : _t("年代不详"), c); }
    const order = new Map(eras.map((e, i) => [e.id, i]));
    return asItems([...groups.values()].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9)) })));
  }
  if (mode === "kind") return kindGroups(cat, list, q, hit);
  if (mode === "hs") {
    for (const c of list) { const k = c.ids.hs?.[0] ?? "?"; put(k, HS_CLASS[k] ?? _t("分类不详"), c); }
    return asItems([...groups.values()].sort((a, b) => (a.id.localeCompare(b.id))).map((g) => ({ ...g, concepts: g.concepts.sort((a, b) => (a.ids.hs ?? "~").localeCompare(b.ids.hs ?? "~")) })));
  }
  return styleGroups(cat, q, hit);
}
/** 按种类（v0.16.81，user 11-07「我要找所有的鼓，我要找所有的 pad 这种分类方式，可以先只算鼓和 pad，这个可以要求不全」）：
 *  · 鼓和打击乐 = 概念的家族里有 GM 的 percussion（第 10 通道的鼓件）或 percussive（太鼓、木鱼、合成鼓…）；鼓件按键号、其余按 GM 号排。
 *  · Pad = GM 家族 synth-pad 的那几个**音色**（一个音色一行：它们在目录里挂在「合成器」「语音合成」名下，按乐器列就找不到）。
 *  · 其余 = 还没按种类分的（不藏：这一种排法里也找得到）。分类全用目录快照里现成的家族标记，app 里不另编表；以后要加类 = 给音乐仓鼠开工单。 */
function kindGroups(cat: Catalog, list: Concept[], q: string, hit: (c: Concept) => boolean): Group[] {
  const isDrum = (c: Concept) => (c.family ?? []).some((f) => f === "percussion" || f === "percussive");
  const drumKey = (c: Concept) => { const g = (c.ids.gm ?? [])[0]; return !g ? 9999 : g.bank === 128 ? (g.note ?? 0) : 1000 + g.program; };
  const drums = list.filter(isDrum).sort((a, b) => drumKey(a) - drumKey(b) || a.names.zh.localeCompare(b.names.zh, "zh"));
  const pads: Entry[] = [...cat.gmSelf.values()].filter((r) => r.family === "synth-pad" && r.note === undefined).sort((a, b) => a.program - b.program)
    .flatMap((r) => { const c = cat.byId.get(r.concept); return c && (hit(c) || (!!q && r.gmName.toLowerCase().includes(q))) ? [{ concept: c, preset: r }] : []; });
  const rest = list.filter((c) => !isDrum(c)).sort((a, b) => a.names.zh.localeCompare(b.names.zh, "zh"));
  return [
    { id: "drums", label: _t("鼓和打击乐"), items: drums.map((concept) => ({ concept })) },
    { id: "pads", label: _t("Pad（合成器的铺底音色）"), items: pads },
    { id: "rest", label: _t("其余（还没按种类分）"), items: rest.map((concept) => ({ concept })) },
  ].filter((g) => g.items.length);
}
/** 按曲风：**以 GM 音色为单位**（user 2026-10-08「评级和是否入选能不能精确到合成器里面的子音色」「每个不同的音色都单列单评级」「音色为单位而不是家族一把捞」「丢了子音的排序和策展」）。
 *  成员 = 本尊行自己的 styles（仓鼠 v8 起逐个音色判；一个号多重认领只看主本尊）；没有 GM 音色能演的概念（古筝 / 风铃…）照旧按概念、星级用概念的。
 *  组内：承重降序 → 年份升序 → GM 号（user「每个风里面按照承重排」；同承重按时间 = 仓鼠转述的 user 口径）。 */
function styleGroups(cat: Catalog, q: string, hit: (c: Concept) => boolean): Group[] {
  const groups = new Map<string, Group>();
  const put = (tag: string, e: Entry) => { let g = groups.get(tag); if (!g) { g = { id: tag, label: tag === "none" ? _t("没贴风格") : styleLabel(cat, tag), items: [] }; groups.set(tag, g); } g.items.push(e); };
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
export const weightLabel = (cat: Catalog, w: number): string => defLabel(cat.defs.weights?.find((x) => x.id === w)?.zh ?? "");
function styleLabel(cat: Catalog, tag: string): string { const s = cat.defs.styles?.find((x) => (x.id ?? x.tag) === tag); return (s?.zh ? defLabel(s.zh) : s?.en) ?? tag; }
export const fmtYear = (y: number): string => (y < 0 ? _t("公元前 {y}", { y: -y }) : String(y));
export const eraLabel = (cat: Catalog, c: Concept): string => defLabel(cat.defs.eras.find((e) => e.id === c.era)?.zh ?? "");
