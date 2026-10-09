// 时间线（src/engine/timeline.ts）：谱 → 秒。created 2026-10-09 by Claude Fable 5.1
// 守的是：月读的句不在纸界切（只看休止）；块的键里没有位置（移位再复原照样命中）；SoundFont 的音符秒数；光标 ↔ 秒；没人上场 = unplayable。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, addPaper, addPart, TPQ, DEFAULT_BPM, type EditorState, type Token, type Song, type PaperSeg, type PartDef } from "../src/score/song.ts";
import { emptyExtras, activePerfSpec } from "../src/format/project.ts";
import { buildTimeline, LEAD_IN, type PerformerInfo } from "../src/engine/timeline.ts";

let nid = 7000;
const n = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", ly: string | null = null, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: 4 }, dur, lyric: ly });
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur });
const head = (t: Token[]) => t.slice(0, 3);   // 调号 / 拍号 / 速度
const Q = 60 / DEFAULT_BPM;   // 一个四分音符几秒
const spec = activePerfSpec(emptyExtras(), "r");
const info = (engine: PerformerInfo["engine"]): PerformerInfo => ({ engine, spec, velocity: 0.8, transpose: 0, gm: engine === "soundfont" ? { sha: "S", presetIndex: 3 } : null, chunk: "phrase", follow: () => 0 });
const two = (a: Token[], b: Token[]): { song: Song; parts: PartDef[] } => {
  let st: EditorState = initState(); st = addPaper(st);
  const [p1, p2] = st.song.papers, pid = st.song.parts[0].id;
  const papers: PaperSeg[] = [{ ...p1, tracks: { [pid]: [...head(p1.tracks[pid]), ...a] } }, { ...p2, tracks: { [pid]: [...head(p2.tracks[pid]), ...b] } }];
  return { song: { ...st.song, papers }, parts: st.song.parts };
};
const build = (s: { song: Song; parts: PartDef[] }, engine: PerformerInfo["engine"]) => buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => info(engine), hum: "n", singOpt: { leadIn: LEAD_IN } });

describe("时间线：月读的块", () => {
  it("一句跨两张纸不切（纸界没有休止）；中间有 ≥0.25 s 的休止才切", () => {
    const joined = build(two([n("C", "か"), n("D", "な")], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    eq(joined.chunks.length, 1, "跨纸一句"); eq(joined.chunks[0].score.SCORE.map((e) => e.kana).join(""), "かなしい");
    const cut = build(two([n("C", "か"), n("D", "な"), r()], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    eq(cut.chunks.map((c) => c.score.SCORE.map((e) => e.kana).join("")).join("|"), "かな|しい");
    eq(cut.tracks[0].kind, "clips");
  });
  it("块的位置：t0 = 第一个音 − 提前量；范围从提前量起、到最后一块的尾巴", () => {
    const t = build(two([n("C", "か"), n("D", "な"), r()], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    assert(Math.abs(t.chunks[0].t0 - (0 - LEAD_IN)) < 1e-9); assert(Math.abs(t.chunks[1].t0 - (3 * Q - LEAD_IN)) < 1e-9, `第二句从第 3 拍起（${t.chunks[1].t0}）`);
    assert(Math.abs(t.range.from + LEAD_IN) < 1e-9, "范围头 = −提前量"); assert(t.range.to > t.total, "范围尾含最后一块的尾巴"); assert(Math.abs(t.total - 5 * Q) < 1e-9);
  });
  it("内容键里没有位置：前面多一个休止，键不变（歌词移位再复原照样命中）", () => {
    const a = build(two([n("C", "か"), n("D", "な")], []), "tsukuyomi"), b = build(two([r(), n("C", "か"), n("D", "な")], []), "tsukuyomi");
    eq(a.chunks[0].key, b.chunks[0].key); assert(Math.abs(b.chunks[0].t0 - a.chunks[0].t0 - Q) < 1e-9, "只是位置挪了一拍");
  });
  it("一整首 = 一块", () => {
    const s = two([n("C", "か"), r()], [n("E", "し")]);
    const t = buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => ({ ...info("tsukuyomi"), chunk: "whole" }), hum: "n", singOpt: {} });
    eq(t.chunks.length, 1);
  });
});

describe("时间线：乐器 / 光标 / 纸", () => {
  it("SoundFont：音符的秒数、预设下标、tie 并成一个音", () => {
    const s = two([n("C"), n("D"), { ...n("D"), tie: true } as Token], [n("E")]);   // tie 在后一个音上 = 接着前一个
    const t = build(s, "soundfont"), tr = t.tracks[0];
    assert(tr.kind === "sf"); if (tr.kind !== "sf") return;
    eq(tr.notes.length, 3); eq(tr.notes[0].preset, 3); eq(tr.notes[0].key, 60);
    assert(Math.abs(tr.notes[1].t0 - Q) < 1e-9 && Math.abs(tr.notes[1].t1 - 3 * Q) < 1e-9, "连音线并成 2 拍");
    assert(Math.abs(tr.notes[2].t0 - 3 * Q) < 1e-9, "第二张纸的音接在后面");
    eq(t.range.from, 0); assert(Math.abs(t.range.to - 4 * Q) < 1e-9);
  });
  it("光标 ↔ 秒：第二张纸的第一个音 = 第一张纸的长度；locate 落回那张纸的 tick", () => {
    const s = two([n("C"), n("D")], [n("E"), n("F")]);
    const t = build(s, "soundfont"), pid = s.parts[0].id, e = s.song.papers[1].tracks[pid].find((x) => x.kind === "note")!;
    assert(Math.abs((t.secondsOfToken(pid, e.id) ?? -1) - 2 * Q) < 1e-9);
    const at = t.locate(2.5 * Q)!;
    eq(at.paperId, s.song.papers[1].id); eq(at.tick, Math.floor(0.5 * TPQ));
    eq(t.papers.length, 2); assert(Math.abs(t.papers[1].t0 - 2 * Q) < 1e-9);
  });
  it("没人上场 = unplayable，不出声不替补", () => {
    const t = build(two([n("C")], []), "unknown");
    eq(t.tracks.length, 0); eq(t.unplayable.length, 1);
  });
  it("多声部：第二位歌手只在第二张纸上，秒数照样对齐", () => {
    let st: EditorState = initState(); st = addPaper(st);
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" });   // 当前 = 第二张
    const [p1, p2] = st.song.papers;
    const song: Song = { ...st.song, papers: [{ ...p1, tracks: { P1: [...head(p1.tracks.P1), n("C"), n("D")] } }, { ...p2, tracks: { P1: [...head(p2.tracks.P1), n("E")], P2: [...head(p2.tracks.P1), n("G")] } }] };
    const t = buildTimeline({ song, order: song.papers.map((p) => p.id), parts: st.song.parts, info: () => info("soundfont"), hum: "n", singOpt: {} });
    const p2t = t.tracks.find((x) => x.id === "P2")!; assert(p2t.kind === "sf"); if (p2t.kind !== "sf") return;
    assert(Math.abs(p2t.notes[0].t0 - 2 * Q) < 1e-9, "P2 的音从第二张纸起");
  });
});
