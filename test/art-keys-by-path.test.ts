// 乐手身上的键按力度走哪条路分（统筹 2026-11-12 夜「v0.17.13 收」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 插件报的力度路是格式契约：现有三个引擎各走哪条路钉在这里（改了 = 红；想换路 = 换新的引擎名）。
//   ② 键表和出声对得上（照 honors.test.ts 的做法）：每条路，表里每个键改一下值，这一路的出声真的变；不在表里的键改了不变。出声 = 真的时间线（buildTimeline）
//     给这条路的乐手排出来的东西（音符表、每个音的力度、音量曲线、唱谱块）。这条路上除了真插件，还跑一位「什么记号都认、能叠音」的乐手——只按力度路分、不按认不认分。
//   ③ 存档只写这一路有定义的键：另一路的、哪条路都不读的（tenutoGate）不补、不写。
import { describe, it, eq, assert } from "./runner.mjs";
import { performerOf } from "../src/performers/index.ts";
import { initState, TPQ, type Token } from "../src/score/song.ts";
import { templateExtras, activePerfSpec, saveMxl, ART_KEYS_BY, type Extras } from "../src/format/project.ts";
import { buildTimeline, type PerformerInfo } from "../src/engine/timeline.ts";
import { ALL_MARKS } from "../src/score/perform.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";

let nid = 61000;
const n = (step: string, oct: number, dur: number, art?: string[], extra: Record<string, unknown> = {}): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: oct }, dur, lyric: "ら", ...(art ? { art } : {}), ...extra }) as Token;
const st0 = initState(), pid = st0.song.parts[0]!.id, p1 = st0.song.papers[0]!, role = st0.song.parts[0]!.role;
/** 一条把记号都用上的谱：每种音头 / 起伏 / 断连、和弦上的琶音、滚奏、没终点的渐强。 */
const body: Token[] = [
  { kind: "dyn", id: nid++, value: "mf" } as Token, n("C", 4, TPQ, ["staccato"]), n("D", 4, TPQ, ["accent"]), n("E", 4, TPQ, ["marcato"]), n("F", 4, TPQ, ["sfz"]), n("G", 4, TPQ, ["fp"]),
  n("A", 4, TPQ, ["tenuto"]), n("B", 4, TPQ, ["breath"]), n("C", 5, TPQ, [], { slur: true }), n("D", 5, TPQ), n("E", 5, 2 * TPQ, ["swellUp"]), n("F", 5, 2 * TPQ, ["swellDown"]),
  n("G", 4, TPQ, ["stress"]), n("A", 4, TPQ, ["unstress"]), n("B", 4, TPQ, ["ghost"]), n("G", 4, TPQ, ["arpeggio"], { chord: [{ step: "E", alter: 0, octave: 4 }, { step: "C", alter: 0, octave: 4 }] }),
  n("C", 4, 2 * TPQ, ["roll"]), n("D", 4, TPQ), n("E", 4, TPQ), { kind: "hairpin", id: nid++, dir: "cresc" } as Token, n("F", 4, TPQ), n("G", 4, TPQ), { kind: "rest", id: nid++, dur: TPQ } as Token,
];
const song = { ...st0.song, papers: [{ ...p1, tracks: { [pid]: [...p1.tracks[pid]!.slice(0, 3), ...body] } }] };
const ENGINES = { gain: ["tsukuyomi", "vowel-sampler"], velocity: ["soundfont"] } as const;
/** 这一路上「什么记号都认、能叠音」的乐手：拿这条路的真插件改 honors / poly（只按力度路分）。 */
const fullOf = (engine: string) => ({ ...performerOf(engine)!, honors: [...ALL_MARKS], poly: true, connected: false });
const play = (engine: string, spec: PerformerInfo["spec"], full: boolean): string => {
  const info = (): PerformerInfo => ({ engine: engine as PerformerInfo["engine"], hum: "n", plugin: full ? fullOf(engine) : performerOf(engine), spec, velocity: 0.8, transpose: 0, gm: engine === "soundfont" ? { sha: "S", presetIndex: 3 } : null, chunk: "phrase", follow: () => 0, velDb: (_m, v) => 40 * Math.log10(Math.max(1, v) / 127) });
  const t = buildTimeline({ song, order: [p1.id], parts: st0.song.parts, info, singOpt: {} });
  return JSON.stringify([t.tracks, t.chunks.map((c) => c.score)]);
};
const base = { ...activePerfSpec(templateExtras(song), role), rollHz: 10 } as PerformerInfo["spec"];
const ALL_ART = [...new Set([...ART_KEYS_BY.gain, ...ART_KEYS_BY.velocity, "tenutoGate"])];
/** 改一下值：开关取反；缝试大一点（缝的上限要缝比「这个音长度的几分之几」大才起作用）；数乘一下再挪一点。 */
const bumped = (k: string, s: Record<string, any>): Record<string, any> => {
  if (k === "dynamicsDb" || k === "dynamicsVel") return { ...s, [k]: { ...s[k], mf: s[k].mf - 3 } };
  const v = s[k], next = typeof v === "boolean" ? !v : k === "rollHz" ? 23 : k === "gapSec" ? 0.05 : typeof v === "number" ? (v === 0 ? 0.07 : v * 0.73 + (v < 1 ? 0.01 : 1)) : 0.3;
  return { ...s, [k]: next };
};
const reads = (path: "gain" | "velocity", k: string): boolean => ENGINES[path].some((e) => [false, true].some((full) => {
  const s0 = { ...base, gapSec: k === "gapShare" ? 0.2 : k === "gapSec" ? 0.04 : base.gapSec } as Record<string, any>;
  return play(e, s0 as never, full) !== play(e, bumped(k, s0) as never, full);
}));

describe("乐手身上的键按力度路分", () => {
  it("力度路是格式契约：tsukuyomi / vowel-sampler 走音量、soundfont 走力度（改了 = 红；想换路 = 换新的引擎名）", () => {
    eq(JSON.stringify(["tsukuyomi", "vowel-sampler", "soundfont"].map((e) => [e, performerOf(e)!.dynamics])), JSON.stringify([["tsukuyomi", "gain"], ["vowel-sampler", "gain"], ["soundfont", "velocity"]]));
  });
  for (const path of ["gain", "velocity"] as const) {
    it(`${path === "gain" ? "音量那一路" : "力度那一路"}：表里的每个键改一下值，出声真的变；不在表里的改了不变（演奏法 + 力度那张表）`, () => {
      const table = ART_KEYS_BY[path], bad: string[] = [];
      for (const k of ALL_ART) { const r = reads(path, k), inTable = table.has(k); if (r !== inTable) bad.push(`${k}：${inTable ? "在表里但出声不读" : "不在表里但出声读"}`); }
      const mine = path === "gain" ? "dynamicsDb" : "dynamicsVel", other = path === "gain" ? "dynamicsVel" : "dynamicsDb";
      if (!reads(path, mine)) bad.push(`${mine}：这一路的力度表改了出声不变`); if (reads(path, other)) bad.push(`${other}：另一路的力度表改了出声变了`);
      assert(!bad.length, bad.join("；"));
    });
  }
  it("tenutoGate 哪条路都不读 → 没有定义；两路的表都不含它", () => { assert(!ART_KEYS_BY.gain.has("tenutoGate") && !ART_KEYS_BY.velocity.has("tenutoGate")); });
  it("存档：每位乐手只写这一路有定义的演奏法键（另一路的、tenutoGate 不补不写）", () => {
    const x: Extras = templateExtras(song), r = structuredClone(x.lounge[role]) as { candidates: Record<string, any>[] };
    const everything = Object.fromEntries(ALL_ART.map((k) => [k, k === "canSwell" ? true : 1]));
    r.candidates = [...r.candidates.map((c) => ({ ...c, articulation: { ...everything } })), { id: "c7", name: "sf", instrument: { engine: "soundfont", bank: 0, program: 0, subsetSha256: "0".repeat(64), source: { embedded: null }, origin: {} }, articulation: { ...everything } }];
    const z = unzipSync(saveMxl({ song, extras: { ...x, lounge: { ...x.lounge, [role]: r as never } }, app: "t", date: "2026-11-12T00:00:00.000Z" }));
    for (const c of JSON.parse(strFromU8(z[`.moonsinger/lounge/${role}.json`]!)).candidates as Record<string, any>[]) {
      const path = performerOf(c.instrument.engine)!.dynamics;
      eq(JSON.stringify(Object.keys(c.articulation).sort()), JSON.stringify([...ART_KEYS_BY[path]].sort()), `${c.id}（${c.instrument.engine}）`);
    }
  });
});
