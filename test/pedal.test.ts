// 踏板：「键按多久」（src/score/pedal.ts）+ 接进时间线 + 录音房的追音（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；设计 = ai-docs/20261112-pedals-and-ring-design.md）
//   守：规矩一（每张纸开头抬着、纸尾还踩着 = 纸尾抬起）、二（写的结尾落在踩着的一段里 = 到抬起 / 换踏板才松；那一刻键还按着的不受影响）、三（同音高再弹松旧的）、
//   七（不跨纸）、八（从中间起放：只靠踏板留着的，会衰减的乐器不补按、不衰减的照补）；不认踏板的演奏者照写的；四个八度的半音阶一直踩着一个音不丢。
import { describe, it, eq, assert } from "./runner.mjs";
import { performerOf } from "../src/performers/index.ts";
import { initState, addPaper, TPQ, DEFAULT_BPM, type EditorState, type Token, type Song, type PaperSeg, type PartDef, type PedalTok } from "../src/score/song.ts";
import { emptyExtras, activePerfSpec } from "../src/format/project.ts";
import { buildTimeline, LEAD_IN, type PerformerInfo } from "../src/engine/timeline.ts";
import { sustainSpans, holdBySustain } from "../src/score/pedal.ts";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { Studio, BLOCK, type TrackSpec } from "../src/engine/studio.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL | string): Uint8Array };

let nid = 9100;
const n = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", dur = TPQ, octave = 4): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave }, dur, lyric: null });
const ped = (act: PedalTok["act"], which: PedalTok["which"] = "sustain"): Token => ({ kind: "pedal", id: nid++, which, act });
const Q = 60 / DEFAULT_BPM;
const spec = activePerfSpec(emptyExtras(), "r");
const info = (engine: PerformerInfo["engine"]): PerformerInfo => ({ engine, plugin: performerOf(engine), spec, velocity: 0.8, transpose: 0, gm: engine === "soundfont" ? { sha: "S", presetIndex: 3 } : null, chunk: "phrase", follow: () => 0 });
const two = (a: Token[], b: Token[]): { song: Song; parts: PartDef[] } => {
  let st: EditorState = initState(); st = addPaper(st);
  const [p1, p2] = st.song.papers, pid = st.song.parts[0]!.id;
  const papers: PaperSeg[] = [{ ...p1!, tracks: { [pid]: [...p1!.tracks[pid]!.slice(0, 3), ...a] } }, { ...p2!, tracks: { [pid]: [...p2!.tracks[pid]!.slice(0, 3), ...b] } }];
  return { song: { ...st.song, papers }, parts: st.song.parts };
};
const notesOf = (s: { song: Song; parts: PartDef[] }, engine: PerformerInfo["engine"]) => {
  const t = buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => info(engine), hum: "n", singOpt: { leadIn: LEAD_IN } });
  return (t.tracks[0] as { notes: { t0: number; t1: number; key?: number; w1?: number }[] }).notes;
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("踏板 · 键按多久（规矩一、二、三、七）", () => {
  it("踩下 → 写的结尾延到抬起那一刻；抬起之后的照写的；记下写的结尾（w1）", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), ped("up"), n("E")], [n("F")]), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q) && near(ns[0]!.w1!, Q), `C 留到 D 结束（抬起挂在 E 上 = 2 拍处）：${ns[0]!.t1 / Q} 拍`);
    assert(near(ns[1]!.t1, 2 * Q) && ns[1]!.w1 === undefined, "D 写的结尾正好就是抬起那一刻 = 照写的（不算留长）");
    assert(near(ns[2]!.t1, 3 * Q) && ns[2]!.w1 === undefined, "抬起之后的 E 照写的");
  });
  it("换踏板：那一刻之前留着的全松、接着踩着；那一刻键还按着的不受影响", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D", 2 * TPQ), ped("change"), n("E"), ped("up"), n("F")], []), "soundfont");
    // C(0–1) D(1–3) 换(3) E(3–4) 抬(4) F(4–5)
    assert(near(ns[0]!.t1, 3 * Q), "C 留到换踏板那一刻（3 拍）"); assert(near(ns[1]!.t1, 3 * Q) && ns[1]!.w1 === undefined, "D 写的结尾正好是换的那一刻 = 照写的");
    assert(near(ns[2]!.t1, 4 * Q), "E 写的结尾正好是抬起 = 4 拍"); assert(near(ns[3]!.t1, 5 * Q), "F 照写的");
  });
  it("同音高再弹：被踏板留着的那个在那一刻松（规矩三）", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), n("C"), n("E"), ped("up"), n("F")], []), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q) && near(ns[0]!.w1!, Q), `第一个 C 留到第二个 C 弹下（2 拍）：${ns[0]!.t1 / Q}`);
    assert(near(ns[2]!.t1, 4 * Q), "第二个 C 留到抬起（4 拍）"); assert(near(ns[1]!.t1, 4 * Q), "D 留到抬起");
  });
  it("每张纸开头抬着、纸尾还踩着 = 纸尾抬起（不跨纸，规矩一 / 七）；纸尾的踏板记号挂在纸尾那一刻", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D")], [n("E"), n("F"), ped("down"), ped("up")]), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q), "第一张纸 C 留到纸尾（2 拍），不留进第二张"); assert(near(ns[2]!.t1, 3 * Q) && near(ns[3]!.t1, 4 * Q), "第二张纸照写的（纸尾踩下又抬起 = 没有音被留住）");
    const pp = two([ped("down"), n("C")], [n("D"), ped("down")]).song.papers.map((p) => p.tracks[Object.keys(p.tracks)[0]!]!), sp = sustainSpans(pp.flat(), undefined, [0, pp[0]!.length]);
    eq(sp.length, 2, "纸尾踩下 = 一段零长的（纸尾抬）");
  });
  it("不起作用的（已经踩着又踩、没踩就抬）不改状态；持音 / 弱音这一刀不管", () => {
    const ns = notesOf(two([ped("up"), ped("down"), n("C"), ped("down"), n("D"), ped("up"), n("E"), ped("down", "sostenuto"), n("F")], []), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q), "C 留到真正的抬起（2 拍）"); assert(near(ns[3]!.t1, 4 * Q), "持音这一刀不起作用");
  });
  it("反复跳回去：补上跳到的那一刻的踏板状态（第一遍结尾踩着的不带进第二遍）", () => {
    const bar = (repeat: "start" | "end"): Token => ({ kind: "bar", id: nid++, repeat }) as Token;
    const ns = notesOf(two([bar("start"), ped("down"), n("C"), n("D"), bar("end")], []), "soundfont");
    eq(ns.length, 4, "展开成两遍");
    assert(near(ns[1]!.t1, 2 * Q), `第一遍的 D 在跳回去那一刻松（2 拍），不留到第二遍再弹 D：${ns[1]!.t1 / Q} 拍`);
    assert(near(ns[2]!.t1, 4 * Q), "第二遍的 C 被第二遍的踩下留到纸尾");
  });
  it("不认踏板的演奏者（元音版）照写的", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), ped("up"), n("E")], []), "vowel-sampler");
    assert(near(ns[0]!.t1, Q), "元音版照写的");
  });
  it("没写踏板 = 一个音都不变（旧歌逐样本不变的前提）", () => {
    const toks = [n("C"), n("D"), n("C")], a = holdBySustain([{ midi: 60, t0: 0, t1: 1 }], sustainSpans(toks, undefined));
    eq(JSON.stringify(a), JSON.stringify([{ midi: 60, t0: 0, t1: 1 }]));
  });
});

describe("踏板 · 录音房（规矩八、半音阶不丢音）", async () => {
  const SR = 48000, wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)), sf2 = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
  const studio = async () => { const s = new Studio(SR, await instantiateTsf(wasm), () => {}); s.handle({ type: "bank", sha: "F", bytes: sf2 }); return s; };
  const run = (s: Studio, secs: number) => { const L = new Float32Array(BLOCK), R = new Float32Array(BLOCK); for (let i = 0; i < Math.round(secs * SR); i += BLOCK) s.render(L, R, BLOCK); };
  const active = (s: Studio) => { const t = (s as unknown as { tracks: Map<string, { sf: { player: unknown } | null }> }).tracks.get("p")!; return (s as unknown as { tsf: { active(p: unknown): number } }).tsf.active(t.sf!.player); };
  const track = (notes: TrackSpec extends infer T ? T extends { kind: "sf"; notes: infer N } ? N : never : never, decays: boolean): TrackSpec => ({ id: "p", kind: "sf", sha: "F", notes, gain: null, ...(decays ? { decays: true as const } : {}) });
  it("四个八度的半音阶一直踩着：48 个键一个不丢（同时发声上限 256）", async () => {
    const raw = Array.from({ length: 48 }, (_, k) => ({ midi: 36 + k, t0: k * 0.05, t1: k * 0.05 + 0.04 }));
    const held = holdBySustain(raw, [{ down: 0, up: 10, changes: [] }]);
    const s = await studio(); s.handle({ type: "timeline", tl: { tracks: [track(held.map((x) => ({ t0: x.t0, t1: x.t1, key: x.midi, vel: 0.8, preset: 0, ...(x.w1 !== undefined ? { w1: x.w1 } : {}) })), false)], range: { from: 0, to: 10 }, loop: false } });
    s.handle({ type: "play" }); run(s, 3);
    assert(active(s) >= 48, `3 秒时还在响的发声 ${active(s)}（应 ≥ 48）`);
  });
  it("从中间起放：只靠踏板留着的音——会衰减的乐器不补按、不衰减的照补；写的时值盖住起点的照补", async () => {
    const held = holdBySustain([{ midi: 60, t0: 0, t1: 0.5 }, { midi: 64, t0: 0, t1: 3 }], [{ down: 0, up: 4, changes: [] }]);
    const at1 = async (decays: boolean) => { const s = await studio(); s.handle({ type: "timeline", tl: { tracks: [track(held.map((x) => ({ t0: x.t0, t1: x.t1, key: x.midi, vel: 0.8, preset: 0, ...(x.w1 !== undefined ? { w1: x.w1 } : {}) })), decays)], range: { from: 0, to: 5 }, loop: false } }); s.handle({ type: "play", at: 1 }); run(s, 0.01); return active(s); };
    const d = await at1(true), k = await at1(false);
    assert(d > 0 && k === 2 * d, `会衰减的补了 ${d} 个发声（= 一个音：写的时值盖住起点的 E）、不衰减的 ${k} 个（= 两个音）`);
  });
});
