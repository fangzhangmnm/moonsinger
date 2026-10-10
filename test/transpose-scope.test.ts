// 整段 / 整首移调转调（v0.9.33；user 2026-10-09「杂事记账：段级别和工程级别的整体移调转调」→ 10-10「小件做」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, transposePapers, scopeKey, keyAfterSemis, tr, TPQ, type Token, type EditorState, type NoteTok } from "../src/score/song.ts";
import type { Pitch } from "../src/score/pitch.ts";

let nid = 7000;
const P = (s: string): Pitch => { const m = /^([A-G])(#|b)?(\d)$/.exec(s)!; return { step: m[1] as Pitch["step"], alter: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0, octave: Number(m[3]) }; };
const n = (s: string, chord?: string[]): Token => ({ kind: "note", id: nid++, pitch: P(s), dur: TPQ, lyric: null, ...(chord ? { chord: chord.map(P) } : {}) } as Token);
const key = (f: number): Token => ({ kind: "key", id: nid++, fifths: f });
const head = (f: number) => { const h = tr(initState()).slice(0, 3); return [key(f), ...h.slice(1).map((t) => ({ ...t, id: nid++ }))]; };
const show = (p: Pitch) => `${p.step}${p.alter > 0 ? "#".repeat(p.alter) : "b".repeat(-p.alter)}${p.octave}`;
const line = (toks: Token[]) => toks.slice(3).map((t) => (t.kind === "key" ? `[${t.fifths}]` : t.kind === "note" ? [(t as NoteTok).pitch!, ...((t as NoteTok).chord ?? [])].map(show).join("&") : t.kind)).join(" ");
/** 两张纸 A / B，两个声部 p1 / p2（p2 只在 A 上）。 */
function song(a1: Token[], a2: Token[], b1: Token[]): EditorState {
  const st = initState(), p1 = st.song.parts[0];
  const p2 = { ...p1, id: "p2", role: "r2", mic: "m2" };
  const A = { ...st.song.papers[0], id: "A", name: "A", tracks: { [p1.id]: a1, p2: a2 } };
  const B = { ...st.song.papers[0], id: "B", name: "B", tracks: { [p1.id]: b1 } };
  return { ...st, at: { paper: "A", part: p1.id }, caret: 4, song: { ...st.song, parts: [p1, p2], papers: [A, B] } };
}
const trk = (st: EditorState, paper: string, part: string) => line(st.song.papers.find((p) => p.id === paper)!.tracks[part]);
const P1 = () => initState().song.parts[0].id;

describe("整段 / 整首移调转调", () => {
  it("这一段 ↑半音：所有声部一起挪、调号跟着挪（C → D♭，中途的 G → A♭），别的纸不动；光标原样", () => {
    const st = song([...head(0), n("C5"), n("E5"), key(1), n("F#5")], [...head(0), n("G4", ["E4"])], [...head(0), n("C5")]);
    const r = transposePapers(st, ["A"], { semis: 1 });
    eq(trk(r, "A", P1()), "Db5 F5 [-4] G5");
    eq(trk(r, "A", "p2"), "Ab4&F4");
    eq(trk(r, "B", P1()), "C5", "B 没动");
    eq(r.caret, 4); eq(r.song.papers[0].tracks[P1()].length, st.song.papers[0].tracks[P1()].length, "不插不删");
  });
  it("整首 ↑八度：调号不动、拼写不动（E 大调里写的 A♭ 照旧是 A♭）", () => {
    const st = song([...head(4), n("Ab4")], [...head(4), n("E4")], [...head(4), n("B4")]);
    const r = transposePapers(st, ["A", "B"], { semis: 12 });
    eq(trk(r, "A", P1()), "Ab5"); eq(trk(r, "A", "p2"), "E5"); eq(trk(r, "B", P1()), "B5");
    eq(r.song.papers[0].tracks[P1()][0].kind === "key" && (r.song.papers[0].tracks[P1()][0] as { fifths: number }).fifths, 4);
  });
  it("转调到 E♭：按主音之间的音程挪（C → E♭ = 小三度往上），调号换", () => {
    const st = song([...head(0), n("C5"), n("B4"), n("F#5")], [...head(0), n("C4")], [...head(0), n("C5")]);
    const r = transposePapers(st, ["A"], { toFifths: -3 });
    eq(trk(r, "A", P1()), "Eb5 D5 A5");
    eq((r.song.papers[0].tracks[P1()][0] as { fifths: number }).fifths, -3);
  });
  it("等音调挑升降号少的：F♯ ↑半音 = G；C ↓半音 = B（5 个升号，不是 C♭ 7 个降号）；三全音平手 = 往上升号、往下降号", () => {
    eq(keyAfterSemis(6, 1), 1); eq(keyAfterSemis(0, -1), 5); eq(keyAfterSemis(0, 6), 6); eq(keyAfterSemis(0, -6), -6); eq(keyAfterSemis(7, 12), 7);
  });
  it("skip 的声部（固定敲一个键的）整条不动；参照调 = 最上面那位在场歌手", () => {
    const st = song([...head(2), n("D5")], [...head(2), n("C4")], [...head(0), n("C5")]);
    eq(scopeKey(st.song, ["A"]), 2);
    const r = transposePapers(st, ["A"], { semis: 2 }, new Set(["p2"]));
    eq(trk(r, "A", P1()), "E5"); eq(trk(r, "A", "p2"), "C4", "鼓件那条没动");
    assert(transposePapers(st, ["A"], { semis: 0 }) === st && transposePapers(st, ["A"], { toFifths: 2 }) === st, "不挪 = 原样");
  });
});
