// 乐手身上按值带着的数和「现在的默认」比（第 16 条 16-6，统筹 2026-11-13「16-6 摆法」补的第一条）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 照出厂样子新上场的每一种乐手（小月相 / 元音版 / GS 的有音高乐器、音效、整套鼓、鼓件 / 自己的 .sf2）= 一行都不标。
//   ② 按「这位的声音变不变」核（不按键表）：候选身上每个键（身份那几样除外）改一下，出声那一侧（核心的时间线 + 混音参数）变了 = 页面上恰好有一行被标出来、
//      这一行管着这个键；没变 = 不要求有行。③ 能改回的那一行点「默认」= 声音回到原样、一行不标；只读的那一行（这位自己的效果）没有「默认」。
//   ④ 目录没载：要问目录的那几行先不比（pending），别的照比。
import { describe, it, eq, assert } from "./runner.mjs";
import "../src/performers/index.ts";
import { initState, TPQ, type Token } from "../src/score/song.ts";
import { templateExtras, withActive, withSf2Candidate, withSfxFixed, CANDIDATE_ID, activeCandidate, type Extras } from "../src/format/project.ts";
import { timelineOf, mixParamsOf } from "../src/core/render.ts";
import { defaultsReport, resetRow, rowsFor } from "../src/performers/defaults.ts";
import { performerOf } from "../src/performers/registry.ts";
import { loadCatalogFromJson, castArgsOf, GS_LIBRARY_ID, type Catalog } from "../src/gm/catalog.ts";
import { INSTRUMENT_FILES } from "../src/gm/instruments.gen.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL): Uint8Array };

const read = (k: keyof typeof INSTRUMENT_FILES) => JSON.parse(new TextDecoder().decode(fs.readFileSync(new URL(`../${INSTRUMENT_FILES[k].file}`, import.meta.url))));
const cat: Catalog = loadCatalogFromJson(read("concepts"), read("gmMap"));
let nid = 81000;
const n = (step: string, oct: number, dur: number, art?: string[], extra: Record<string, unknown> = {}): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: oct }, dur, lyric: "ら", ...(art ? { art } : {}), ...extra }) as Token;
const dyn = (value: string): Token => ({ kind: "dyn", id: nid++, value }) as Token;
const st0 = initState(), pid = st0.song.parts[0]!.id, p1 = st0.song.papers[0]!, role = st0.song.parts[0]!.role;
/** 把记号都用上：开头两个音前面没写力度（「没写力度记号的音」那一个数）、每种音头 / 起伏 / 断连、琶音、滚奏、没终点的渐强、八档力度、不写歌词的音（哼的字）。 */
const body: Token[] = [
  n("C", 4, TPQ), n("D", 4, TPQ, [], { lyric: "" }),
  dyn("mf"), n("C", 4, TPQ, ["staccato"]), n("D", 4, TPQ, ["accent"]), n("E", 4, TPQ, ["marcato"]), n("F", 4, TPQ, ["sfz"]), n("G", 4, TPQ, ["fp"]),
  n("A", 4, TPQ, ["tenuto"]), n("B", 4, TPQ, ["breath"]), n("C", 5, TPQ, [], { slur: true }), n("D", 5, TPQ), n("E", 5, 2 * TPQ, ["swellUp"]), n("F", 5, 2 * TPQ, ["swellDown"]),
  n("G", 4, TPQ, ["stress"]), n("A", 4, TPQ, ["unstress"]), n("B", 4, TPQ, ["ghost"]), n("G", 4, TPQ, ["arpeggio"], { chord: [{ step: "E", alter: 0, octave: 4 }, { step: "C", alter: 0, octave: 4 }] }),
  n("C", 4, 2 * TPQ, ["roll"]), n("D", 4, TPQ), n("E", 4, TPQ), { kind: "hairpin", id: nid++, dir: "cresc" } as Token, n("F", 4, TPQ), n("G", 4, TPQ), { kind: "rest", id: nid++, dur: TPQ } as Token,
  dyn("ppp"), n("A", 4, TPQ), dyn("pp"), n("B", 4, TPQ), dyn("p"), n("C", 5, TPQ), dyn("mp"), n("D", 5, TPQ), dyn("f"), n("E", 5, TPQ), dyn("ff"), n("F", 5, TPQ), dyn("fff"), n("G", 5, TPQ),
  { kind: "rest", id: nid++, dur: TPQ } as Token,
];
const song = { ...st0.song, papers: [{ ...p1, tracks: { [pid]: [...p1.tracks[pid]!.slice(0, 3), ...body] } }] };
const banks = { presetIndex: () => 3, velCurve: () => ({ at: (_k: number, v: number) => 40 * Math.log10(Math.max(1, v) / 127), regions: () => [0] }) };
/** 出声那一侧：核心的时间线（谁上场、音符表、每个音的力度和起止、音量曲线、唱谱块和它的参数）+ 混音参数（推子 + 乐手响度、链）。 */
const sound = (x: Extras): string => {
  const plan = { song, extras: x, parts: song.parts }, tl = timelineOf(plan, banks) as unknown as { tracks: unknown; chunks?: Record<string, unknown>[] };
  return JSON.stringify([tl.tracks, tl.chunks?.map((c) => [c.key, c.score, c.opt, c.gain, c.start]), mixParamsOf(plan, () => ({ muted: false, solo: false })).channels]);
};
const sub = new Uint8Array(32), credit = { attribution: [], license: { name: "unknown" } };
/** GS 货架上的一件，照上场那一刻的做法（目录按值抄的那几样一起）。 */
const gs = (bank: number, program: number, note?: number) => withSf2Candidate(templateExtras(song), role, { name: `${bank}:${program}`, bank, program, ...castArgsOf(cat, bank, program, note), subset: sub, sha256: String(bank * 1000 + program + (note ?? 0)).padStart(64, "0"),
  embed: true, origin: { library: GS_LIBRARY_ID, name: "GeneralUser-GS.sf2", fileSha256: "f".repeat(64), bytes: 1 }, credit, calibrationDb: 0 }, "n");
const KINDS: Record<string, Extras> = {
  "小月相": templateExtras(song),
  "小月相（元音）": withActive(templateExtras(song), role, CANDIDATE_ID.light, "n"),
  "GS 小提琴": gs(0, 40),
  "GS 钢琴（不能音内渐强）": gs(0, 0),
  "GS 音效（能对齐音高）": gs(0, 124),
  "GS 整套鼓": gs(128, 0),
  "GS 鼓件（小军鼓）": gs(128, 0, 38),
  "自己的 .sf2": withSf2Candidate(templateExtras(song), role, { name: "mine", bank: 0, program: 5, subset: sub, sha256: "9".repeat(64), embed: true, origin: { name: "mine.sf2", fileSha256: "e".repeat(64), bytes: 1 }, credit, calibrationDb: 0 }, "n"),
};
/** 身份那几样（是哪一位、哪个库哪件、署名）：不是「怎么演」的设置，不比。鼓件敲哪个键也是身份（是哪一件鼓）。 */
const identity = (path: string, c: Record<string, unknown>) => /^(id|name|gm|credit|spec)(\.|$)|^instrument\.(engine|model|source|bank|program|table)(\.|$)/.test(path) || (path === "instrument.note" && (c.instrument as { bank?: number }).bank === 128);
const leaves = (o: Record<string, unknown>, pre: string[] = []): string[] => Object.entries(o).flatMap(([k, v]) => {
  const p = [...pre, k];
  return v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Uint8Array) ? leaves(v as Record<string, unknown>, p) : k === "chain" ? [p.join(".")] : Array.isArray(v) || v instanceof Uint8Array ? [] : [p.join(".")];
});
const ALT: Record<string, string[]> = { chunk: ["sheet", "whole"], hum: ["a", "la"], mark: ["v", "^", "O"], at: ["this", "next"] };
/** 改一下（照人能做到的样子）：音效固定的那个键 = 关掉固定原速（同乐器页那颗开关）；效果链 = 加一格；数 = 挪一点（移调挪一个八度）；开关取反；字换一个。 */
function bumped(x: Extras, path: string): Extras {
  if (path === "instrument.note") return withSfxFixed(x, role, false, "n");
  const y = structuredClone(x), r = y.lounge[role] as { active: string; candidates: Record<string, unknown>[] }, c = r.candidates.find((e) => e.id === r.active)!;
  if (path === "chain") { c.chain = [{ id: "fx9", kind: "gain", on: true, params: { dB: -3 } }]; return y; }
  const ks = path.split("."), last = ks.pop()!; let o = c; for (const k of ks) o = o[k] as Record<string, unknown>;
  const v = o[last];
  o[last] = typeof v === "boolean" ? !v : typeof v === "number" ? (last === "transpose" ? v + 12 : v === 0 ? 0.07 : v * 0.73 + (Math.abs(v) < 1 ? 0.01 : 1)) : typeof v === "string" ? (ALT[last] ?? []).find((a) => a !== v) ?? `${v}x` : v;
  return y;
}

describe("乐手和现在的默认比（16-6）", () => {
  for (const [kind, x] of Object.entries(KINDS)) {
    it(`${kind}：照出厂样子新上场 = 一行都不标`, () => {
      const r = defaultsReport(x, role, cat);
      eq(r.rows.map((e) => e.id).join("、"), "", kind); eq(r.pending, 0);
    });
    it(`${kind}：每个键改一下——声音变了 = 恰好一行被标出来、管着这个键；能改回的点「默认」= 声音回到原样、一行不标`, () => {
      const cand = activeCandidate(x, role)!, base = sound(x), bad: string[] = [];
      for (const path of leaves(cand)) {
        if (identity(path, cand)) continue;
        const y = bumped(x, path); if (sound(y) === base) continue;
        const rows = defaultsReport(y, role, cat).rows;
        if (rows.length !== 1 || !rows[0]!.keys.some((k) => path === k || path.startsWith(`${k}.`))) { bad.push(`${path} → ${rows.map((e) => e.id).join("、") || "没有行"}`); continue; }
        const back = resetRow(y, role, rows[0]!.id, cat, "n");
        if (!rows[0]!.resettable) { if (back !== null) bad.push(`${path}：只读的行有了「默认」`); continue; }
        if (!back) { bad.push(`${path}：「默认」没改`); continue; }
        if (defaultsReport(back, role, cat).rows.length || sound(back) !== base) bad.push(`${path}：点了「默认」没回到原样`);
      }
      assert(!bad.length, bad.join("；"));
    });
  }
  it("目录没载：要问目录的那几行先不比（GS 的缝、能不能音内渐强、音效），别的照比", () => {
    const x = KINDS["GS 音效（能对齐音高）"]!, r0 = defaultsReport(x, role, null);
    eq(r0.rows.length, 0); assert(r0.pending >= 3, `pending ${r0.pending}`);
    const y = bumped(x, "calibrationDb"), r1 = defaultsReport(y, role, null);
    eq(r1.rows.map((e) => e.id).join("、"), "cal");
    eq(resetRow(bumped(x, "articulation.gapSec"), role, "gap", null, "n"), null, "目录没载不替人改");
  });
  it("乐器页上插件自报的行带的 id 都是能比的那一行（页面靠 id 打点）", () => {
    const bad: string[] = [];
    for (const [kind, x] of Object.entries(KINDS)) {
      const c = activeCandidate(x, role)!, p = performerOf((c.instrument as { engine: string }).engine)!, ids = new Set(rowsFor(p, c).map((r) => r.id));
      const ctx = { extras: x, role, hum: "n" as const, roleLabel: "r", catalog: cat, esc: (s: string) => s, chip: (v: string, l: string) => `<b data-v="${v}">${l}</b>`, bankBytes: () => undefined };
      for (const r of p.inspector?.(ctx) ?? []) if (r.id && !ids.has(r.id)) bad.push(`${kind}：${r.id}`);
    }
    eq(bad.join("、"), "");
  });
  it("没人上场 = 没有可比的", () => { eq(defaultsReport({ ...templateExtras(song), lounge: {} }, role, cat).rows.length, 0); });
});
describe("没有角色的声部（16-6，统筹 2026-11-13）", () => {
  it("存 MusicXML：休息室里没有这个角色 = 不写 <instrument-sound>（不替读不到的东西造内容）；有角色照写", async () => {
    const { saveMxl } = await import("../src/format/project.ts"), { unzipSync, strFromU8 } = await import("../vendor/fflate/fflate.esm.js");
    const xml = (x: Extras) => strFromU8(unzipSync(saveMxl({ song, extras: x, app: "t", date: "2026-11-13T00:00:00.000Z" }))["score.musicxml"]!);
    assert(/<instrument-sound>[^<]+<\/instrument-sound>/.test(xml(templateExtras(song))), "有角色：写");
    assert(!/<instrument-sound>/.test(xml({ ...templateExtras(song), lounge: {} })), "没有角色：不写");
  });
});
describe("力度记号表逐档改（v0.17.20）", () => {
  const val = (x: Extras, k: "dynamicsDb" | "dynamicsVel") => (activeCandidate(x, role) as Record<string, Record<string, number>>)[k]!;
  it("按音量走的：改 dB 表的一档，记到 0.01、夹在 −60 … +24；不碰 MIDI 力度表；标出「力度记号」那一行，「默认」改回", async () => {
    const { withDynLevel } = await import("../src/format/project.ts");
    const x = KINDS["小月相"]!, y = withDynLevel(x, role, "mf", -3.333, "n");
    eq(val(y, "dynamicsDb").mf, -3.33); eq(val(y, "dynamicsDb").f, val(x, "dynamicsDb").f, "别的档不动");
    eq((activeCandidate(y, role) as Record<string, unknown>).dynamicsVel, undefined, "不写另一路的表");
    eq(val(withDynLevel(x, role, "ppp", -99, "n"), "dynamicsDb").ppp, -60); eq(val(withDynLevel(x, role, "fff", 99, "n"), "dynamicsDb").fff, 24);
    eq(defaultsReport(y, role, cat).rows.map((r) => r.id).join("、"), "dyn");
    eq(defaultsReport(resetRow(y, role, "dyn", cat, "n")!, role, cat).rows.length, 0);
  });
  it("按力度敲的：改 MIDI 力度表的一档，整数、夹在 1 … 127；不碰 dB 表", async () => {
    const { withDynLevel } = await import("../src/format/project.ts");
    const x = KINDS["GS 小提琴"]!, y = withDynLevel(x, role, "p", 52.6, "n");
    eq(val(y, "dynamicsVel").p, 53); eq((activeCandidate(y, role) as Record<string, unknown>).dynamicsDb, undefined);
    eq(val(withDynLevel(x, role, "ppp", -5, "n"), "dynamicsVel").ppp, 1); eq(val(withDynLevel(x, role, "fff", 300, "n"), "dynamicsVel").fff, 127);
    assert(sound(y) !== sound(x), "改了一档出声变了");
  });
  it("不强制单调：改出来比更响的一档还响照存（不拦）", async () => {
    const { withDynLevel } = await import("../src/format/project.ts");
    eq(val(withDynLevel(KINDS["小月相"]!, role, "mf", 0, "n"), "dynamicsDb").mf, 0);
  });
});
