// migrate/index.ts —— `.moonsinger/` 各份 JSON 的版本迁移：第 n 版 → 第 n+1 版，每步一个纯函数，读时链式升级到 FORMAT。
// created 2026-10-07 by Claude Fable 5.1。规矩见 src/format/contract.ts 头注释（CatsUp 立宪）。
// 加一步 = 在 MIGRATIONS[kind] 末尾 push 一个函数（下标 n-1 = 从第 n 版升到第 n+1 版）；守卫测试查 MIGRATIONS[kind].length === FORMAT[kind] - 1。
// 写文件永远只写当前版（project.ts）；这里只管读。
import { FORMAT, type FormatFile } from "../contract.ts";
/** lounge 1→2 迁移时（2026-10-07）小月相候选的 defaults 是空的：迁移是纯函数，不跟 TSUKUYOMI_DEFAULTS 变（2026-10-15 它有了值）。 */
const TSUKUYOMI_DEFAULTS_V1: Record<string, number> = {};
import { ARTICULATION, SOUNDFONT_DEFAULTS, TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, SOUNDFONT_SPEC, TSUKUYOMI_MODEL } from "../performance.ts";
/** 迁移是冻结的纯函数：用当年那张力度表（v0.9.23 起 app 的默认表多了 ppp / fff，不能让旧文件迁出来的东西跟着变）。 */
const DYNAMICS_DB_V1 = { pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12 } as const;

export type Json = Record<string, unknown>;
/** 第 n 版 → 第 n+1 版的纯函数（不碰入参；version 字段由 migrate() 写）。 */
export type Migration = (json: Json) => Json;

const HUMS = new Set(["la", "n", "u", "o", "a"]);
/** 休息室 1 → 2：候选从「月读形状 + 贴字段」改成按引擎分的乐器（契约 CandidateV2 / InstrumentV2），by value 补齐力度表 / 演奏法 / 署名 / 规格。
 *  v1 的 hum / source / engines 搬进 instrument；没见过的候选 = engine "unknown"，整份原样留。 */
function loungeV1toV2(json: Json): Json {
  const cands = ((json.candidates as Json[] | undefined) ?? []).map((c0): Json => {
    const c = { ...c0 }, gm = (c.gm ?? {}) as Json, src = c.source as Json | undefined, engines = (c.engines ?? {}) as Json;
    const hum = HUMS.has(String(c.hum)) ? String(c.hum) : "n";
    delete c.hum; delete c.source; delete c.engines; delete c.credit; delete c.spec;
    const common = { calibrationDb: Number(c0.calibrationDb ?? 0), chain: (c0.chain as unknown[] | undefined) ?? [], dynamicsDb: { ...DYNAMICS_DB_V1 }, articulation: { ...ARTICULATION } };
    if (gm.variant === "tsukuyomi") return { ...c, ...common, instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, defaults: { ...TSUKUYOMI_DEFAULTS_V1 }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC), ...(Object.keys(engines).length ? { engines } : {}) };
    if (gm.variant === "tsukuyomi-vowels") return { ...c, ...common, instrument: { engine: "vowel-sampler", table: "builtin", hum }, defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC), ...(Object.keys(engines).length ? { engines } : {}) };
    if (src?.kind === "sf2") {
      const embedded = typeof src.embedded === "string" ? src.embedded : null;
      const subsetSha256 = typeof src.subsetSha256 === "string" ? src.subsetSha256 : embedded ? embedded.slice(embedded.lastIndexOf("/") + 1).replace(/\.sf2$/, "") : "";
      return { ...c, ...common, instrument: { engine: "soundfont", bank: Number(src.bank), program: Number(src.program), source: { embedded, subsetBytes: Number(src.subsetBytes ?? 0), subsetSha256, origin: src.origin ?? { name: "", fileSha256: "", bytes: 0 } } },
        defaults: { ...SOUNDFONT_DEFAULTS }, credit: (c0.credit as Json | undefined) ?? { attribution: [], license: { name: "unknown" } }, spec: (c0.spec as Json | undefined) ?? structuredClone(SOUNDFONT_SPEC), ...(Object.keys(engines).length ? { engines } : {}) };
    }
    return { ...c, ...common, instrument: { engine: "unknown", engines }, defaults: {}, credit: (c0.credit as Json | undefined) ?? { attribution: [], license: { name: "unknown" } }, spec: (c0.spec as Json | undefined) ?? { kind: "unknown" } };
  });
  return { ...json, candidates: cands };
}

/** 总目录 1 → 2：加 derived（第 1 版的 score.musicxml 是正本、不是派生件——但读第 1 版文件时纸 p1 就是从它读的，存档后它才变派生件）。 */
const manifestV1toV2 = (json: Json): Json => ({ ...json, derived: [] });
/** 谱的扩展 1 → 2（存法 B）：整首一份 score.musicxml → 一张纸 p1（文件级迁移在 project.ts openBytes：包里没有 papers/p1.musicxml 就读 score.musicxml）；声部并集加 kind。 */
function scoreV1toV2(json: Json): Json {
  const parts = ((json.parts as Json[] | undefined) ?? []).map((p, k) => ({ id: String(p.id ?? `P${k + 1}`), role: String(p.role ?? `r${k + 1}`), mic: String(p.mic ?? `m${k + 1}`), kind: "pitched" }));
  const manualBars = (json.manualBars as Record<string, number[]> | undefined) ?? {};
  return { papers: [{ id: "p1", file: ".moonsinger/papers/p1.musicxml", manualBars: { ...manualBars }, unwritten: [...((json.unwritten as string[] | undefined) ?? [])] }], parts };
}

/** 录音房 1 → 2（2026-10-10 刀 4）：每个麦克风 → 一条 mic 轨（空链、不发送、直通总轨）；总轨补上链（v1 的 master 可选字段照搬）。 */
function studioV1toV2(json: Json): Json {
  const mics = (json.mics as Json[] | undefined) ?? [], m = (json.master as Json | undefined) ?? {};
  return {
    tracks: mics.map((x) => ({ id: String(x.id), kind: "mic", name: String(x.name ?? ""), gainDb: Number(x.gainDb ?? 0), pan: Number(x.pan ?? 0), chain: [], sends: [], to: "master" })),
    master: { gainDb: Number(m.gainDb ?? 0), limiter: m.limiter === undefined ? true : !!m.limiter, chain: [] },
  };
}

/** 休息室 2 → 3（9-2，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；统筹裁定走大版本，理由见 contract.ts FORMAT 注释）：力度 → 响度全体只有一条（40·log10(力度 ÷ 127)），
 *  候选按值存的 dynamicsDb 和 articulation.wedgeStepDb 退役——只删这两个键，别的一个字不动（不补 dynamicsVel：没带 = 标准表，project.ts activePerfSpec）。 */
function loungeV2toV3(json: Json): Json {
  const cs = json.candidates;
  if (!Array.isArray(cs)) return json;
  return { ...json, candidates: cs.map((c0) => {
    if (!c0 || typeof c0 !== "object" || Array.isArray(c0)) return c0;
    const { dynamicsDb: _d, ...c } = c0 as Json, a = c.articulation;
    if (a && typeof a === "object" && !Array.isArray(a) && "wedgeStepDb" in (a as Json)) { const { wedgeStepDb: _w, ...ar } = a as Json; return { ...c, articulation: ar }; }
    return c;
  }) };
}

export const MIGRATIONS: Record<FormatFile, Migration[]> = {
  manifest: [manifestV1toV2],
  score: [scoreV1toV2],
  lounge: [loungeV1toV2, loungeV2toV3],
  studio: [studioV1toV2],
};

/** 读进来的一份 json 升到这一版。比这一版新的不归这里（调用方先拒开）；没有 version 当第 1 版。 */
export function migrate(kind: FormatFile, json: Json): Json {
  let v = Number(json.version ?? 1), out = json;
  while (v < FORMAT[kind]) {
    const step = MIGRATIONS[kind][v - 1];
    if (!step) throw new Error(`[format] no migration for ${kind} v${v} -> v${v + 1}`);
    out = { ...step(out), version: v + 1 };
    v++;
  }
  return out;
}

// ── 休息室 minor 1：角色的名字（施工单 12-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；规矩全文在 src/format/contract.ts lounge minor 1 那段）──────────
//   名字和乐器分开：角色的 name 没有 = 没起（显示乐器的叫法）。老文件（minor 0）在这里判一次，之后运行时只认概念、不比名字。
//   用的两张表是冻住的（legacy-role-names.ts：老预设 → 概念、目录 v15 的谱上英文叫法 + 简写），同一个文件在哪一版打开都迁出一样的东西。
import { LEGACY_PRESETS, LEGACY_LABELS } from "./legacy-role-names.ts";
import { DEFAULT_CONCEPT } from "../../gm/default-concept.gen.ts";
type Concept = { ids: { wikidata: string | null; local: string | null }; name: { zh: string; en: string; ja?: string }; score?: { zh?: string; en: string; ja?: string }; abbr?: { zh?: string; en?: string; ja?: string } };
const isConcept = (c: unknown): c is Concept => !!c && typeof c === "object" && !!(c as Concept).ids && !!(c as Concept).name && typeof (c as Concept).name.en === "string";
const capWiki = (s: string): string => s.replace(/\s*\([^)]*\)/g, "").trim().replace(/^./, (ch) => ch.toUpperCase());
const legacyLabel = (c: Concept) => (c.ids.wikidata ? LEGACY_LABELS.byWikidata[c.ids.wikidata] : undefined) ?? (c.ids.local ? LEGACY_LABELS.byLocal[c.ids.local] : undefined);
const sameConcept = (a: Concept, b: Concept): boolean => (!!a.ids.wikidata && a.ids.wikidata === b.ids.wikidata) || (!!a.ids.local && a.ids.local === b.ids.local);
/** 老概念补上按值存的谱上叫法和简写（缺的才补；进门是冻住的纯函数，只用冻住的表）：en = 冻住的目录表里的叫法 → 百科英文名首字母大写；zh = 百科中文名；
 *  简写 = 冻住的目录表里的英文简写。**不把判成没起的旧名字留成叫法**（12-4 改口：Once 里软件当年抄的「Kick drum」不留——显示先查现行的表，同一个概念老歌新歌一个叫法；
 *  user「我讨厌历史遗留问题导致的convention需要再记一个」）。按值存的这份不是显示的依据，存的时候按现行的表重写（project.ts withCurrentLabels）。 */
function fillConcept(c: Concept): Concept {
  const lab = legacyLabel(c);
  const score = c.score ?? { zh: c.name.zh, en: lab?.en ?? capWiki(c.name.en) };
  const abbr = c.abbr ?? (lab?.abbr ? { en: lab.abbr } : undefined);
  return { ...c, score, ...(abbr ? { abbr } : {}) };
}
/** 进门时理一遍一个角色的名字（project.ts 读休息室那一处调用；fileMinor = 文件里写的休息室 minor）。不碰入参。 */
export function loungeRoleNames(role0: Json, fileMinor: number): Json {
  const role: Json = { ...role0 };
  if (typeof role.name !== "string" || !role.name) delete role.name;   // 空串 / 不是字 = 没有
  const cands = Array.isArray(role.candidates) ? role.candidates as Json[] : null;
  if (fileMinor >= 1) {   // 这一版写的：没名字 = 没起；只补「没起又没概念」这种坏文件（不然显示不出东西）
    if (role.name === undefined && !isConcept(role.concept)) role.concept = structuredClone(DEFAULT_CONCEPT);
    return role;
  }
  // 老文件（minor 0）：判一次
  const name = typeof role.name === "string" ? role.name : null, low = name?.toLowerCase() ?? null;
  if (isConcept(role.concept)) {
    const c = role.concept, castNames = (cands ?? []).flatMap((x) => { const ca = x?.castAs as { name?: unknown; concept?: unknown } | undefined; return ca && typeof ca.name === "string" && isConcept(ca.concept) && sameConcept(ca.concept, c) ? [ca.name] : []; });
    const pool = [c.name.zh, c.name.en, c.name.ja, capWiki(c.name.en), legacyLabel(c)?.en, c.score?.en, c.score?.zh, ...castNames].filter((x): x is string => typeof x === "string" && !!x).map((x) => x.toLowerCase());
    const unnamed = low === null || pool.includes(low);
    role.concept = fillConcept(c);
    if (unnamed) delete role.name;
  } else {
    const sound = String(role.sound ?? ""), preset = low === null ? LEGACY_PRESETS[0] : LEGACY_PRESETS.find((p) => p.sound === sound && p.en.toLowerCase() === low);   // 没名字 = 照以前落到 Vocals（预设表第一项）
    if (preset) { role.concept = structuredClone(preset.concept); delete role.name; }
  }
  if (cands) role.candidates = cands.map((x) => {   // 候选里记的「当初作为哪件乐器上的」：概念同样补谱上的叫法 / 简写（点回旧候选时套回去）
    const ca = x?.castAs as Json | undefined;
    return ca && isConcept(ca.concept) && !ca.concept.score ? { ...x, castAs: { ...ca, concept: fillConcept(ca.concept) } } : x;
  });
  return role;
}
