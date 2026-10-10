// 自动八度线（v0.9.37；user 2026-10-10「自动加」；设计 = ai-docs/20261010-design-answers.md「8va 自动怎么做、什么粒度」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, initState, tr, type Token, type Song } from "../src/score/song.ts";
import { autoOttava, displayStates, withAutoOttava } from "../src/score/clef.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
const { unzipSync, strFromU8 } = (await import("../vendor/fflate/fflate.esm.js" as string)) as { unzipSync(b: Uint8Array): Record<string, Uint8Array>; strFromU8(b: Uint8Array): string };

let nid = 9700;
const P = (s: string) => { const m = /^([A-G])(\d)$/.exec(s)!; return { step: m[1] as "C", alter: 0, octave: Number(m[2]) }; };
const n = (s: string): Token => ({ kind: "note", id: nid++, pitch: P(s), dur: TPQ, lyric: null });
const r = (): Token => ({ kind: "rest", id: nid++, dur: TPQ });
const head = () => tr(initState()).slice(0, 3);
/** 每个音（休止 = _）的八度线：0 不画 / 1 = 8va / 2 = 15ma / -1 = 8vb；* = 自动 */
const show = (toks: Token[]) => { const ds = autoOttava(toks, displayStates(toks, "G")); return toks.flatMap((t, i) => (t.kind === "note" || t.kind === "rest" ? [`${ds.ott[i]}${ds.auto[i] ? "*" : ""}`] : [])).join(" "); };
const pad = (k: number) => Array.from({ length: k }, () => n("E5"));   // 普通音域的音（门槛：自动的不能超过三分之一）

describe("自动八度线", () => {
  it("连续两个以上、每个都要三条以上加线 = 8va；单独一个不画", () => {
    eq(show([...head(), ...pad(6), n("A6"), n("B6"), n("C7"), n("E5")]), "0 0 0 0 0 0 1* 1* 1* 0");
    eq(show([...head(), ...pad(6), n("A6"), n("E5"), n("E5"), n("B6"), n("E5")]), "0 0 0 0 0 0 0 0 0 0 0", "隔两个 = 两段各一个 = 都不画");
  });
  it("只隔一个音或一个休止 = 并成一段（隔着的跟着挪八度）", () => {
    eq(show([...head(), ...pad(6), n("A6"), n("E5"), n("B6"), r(), n("C7")]), "0 0 0 0 0 0 1* 1* 1* 1* 1*");
  });
  it("8va 之后还要三条以上 = 15ma；往下 = 8vb", () => {
    eq(show([...head(), ...pad(6), n("E8"), n("F8"), n("E5")]), "0 0 0 0 0 0 2* 2* 0");
    eq(show([...head(), ...pad(6), n("C3"), n("B2"), n("E5")]), "0 0 0 0 0 0 -1* -1* 0");
  });
  it("这种音超过三分之一 = 整段都高，归自动谱号管，不画", () => {
    eq(show([...head(), n("E5"), n("A6"), n("B6"), n("C7")]), "0 0 0 0");
  });
  it("手写的八度线说了算：那一段里不自动", () => {
    const toks = [...head(), ...pad(6), { kind: "ottava", id: nid++, shift: 1 } as Token, n("A6"), n("B6"), { kind: "ottava", id: nid++, shift: 0 } as Token, n("E5")];
    eq(show(toks), "0 0 0 0 0 0 1 1 0");
  });
});

const song1 = (toks: Token[], off = false): Song => { const s = initState().song; return { ...s, parts: s.parts.map((p) => (off ? { ...p, autoOttava: false as const } : p)), papers: [{ ...s.papers[0], tracks: { [s.parts[0].id]: toks } }] }; };
const save = (s: Song) => saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-10-10T00:00:00.000Z" });
describe("自动八度线：存", () => {
  it("写出去带 ms-auto id（别的软件照样画）；读回来不变成手写记号", () => {
    const s = song1([...head(), ...pad(6), n("A6"), n("B6"), n("C7"), n("E5")]);
    const files = unzipSync(save(s)), xmls = Object.entries(files).filter(([k]) => k.endsWith(".musicxml")).map(([, v]) => strFromU8(v));
    assert(xmls.length >= 2 && xmls.every((x) => /<octave-shift type="down" size="8" id="ms-auto-\d+"\/>/.test(x) && /<octave-shift type="stop" size="8" id="ms-auto-\d+"\/>/.test(x)), "正本和压平件都写了");
    const o = openBytes("x.mxl", save(s));
    eq(o.song.papers[0].tracks[o.song.parts[0].id].filter((t) => t.kind === "ottava").length, 0, "读回来没有八度线记号");
    eq(o.song.parts[0].autoOttava, undefined, "开着 = 不写");
  });
  it("这一段结束在最后一个音上 = 不插「结束」（不多出空小节）", () => {
    const toks = [...head(), ...pad(6), n("A6"), n("B6")];
    const w = withAutoOttava(toks, "G");
    eq(w.filter((t) => t.kind === "ottava").length, 1);
  });
  it("关掉 = score.json parts[].autoOttava false，读回来还是关；不写自动的八度线", () => {
    const s = song1([...head(), ...pad(6), n("A6"), n("B6"), n("C7"), n("E5")], true), bytes = save(s), files = unzipSync(bytes);
    assert(!Object.values(files).some((v) => strFromU8(v).includes("ms-auto")), "没写自动的");
    eq(openBytes("x.mxl", bytes).song.parts[0].autoOttava, false);
  });
});
