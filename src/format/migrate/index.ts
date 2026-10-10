// migrate/index.ts —— `.moonsinger/` 各份 JSON 的版本迁移：第 n 版 → 第 n+1 版，每步一个纯函数，读时链式升级到 FORMAT。
// created 2026-10-07 by Claude Fable 5.1。规矩见 src/format/contract.ts 头注释（CatsUp 立宪）。
// 加一步 = 在 MIGRATIONS[kind] 末尾 push 一个函数（下标 n-1 = 从第 n 版升到第 n+1 版）；守卫测试查 MIGRATIONS[kind].length === FORMAT[kind] - 1。
// 写文件永远只写当前版（project.ts）；这里只管读。
import { FORMAT, type FormatFile } from "../contract.ts";
import { ARTICULATION, SOUNDFONT_DEFAULTS, TSUKUYOMI_DEFAULTS, TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, SOUNDFONT_SPEC, TSUKUYOMI_MODEL } from "../performance.ts";
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
    if (gm.variant === "tsukuyomi") return { ...c, ...common, instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, defaults: { ...TSUKUYOMI_DEFAULTS }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC), ...(Object.keys(engines).length ? { engines } : {}) };
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

export const MIGRATIONS: Record<FormatFile, Migration[]> = {
  manifest: [manifestV1toV2],
  score: [scoreV1toV2],
  lounge: [loungeV1toV2],
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
