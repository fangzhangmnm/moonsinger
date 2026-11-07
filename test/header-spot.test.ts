// 谱头这一处（v0.16.8，2026-11-07 by Claude Opus 5.5；user 11-07「调号就开头的调号、拍号和谱号，他们是同一个碰撞箱子你点进去之后，三个都可以设」「速度也要放进谱头面板」）
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, addPart, headLen, headerSpot, headerVals, setHeaderAt, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";

let nid = 9300;
const n = (step = "B", alter = 0): Token => ({ kind: "note", id: nid++, pitch: { step, alter, octave: 4 }, dur: TPQ, lyric: null } as Token);
function song(): EditorState {
  let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" });
  const pp = st.song.papers[0], tracks = Object.fromEntries(Object.entries(pp.tracks).map(([id, t]) => [id, [...t.slice(0, headLen(t)), n("G", -1), n("E", -1), n("C"), n("D")]]));
  return { ...st, song: { ...st.song, papers: [{ ...pp, tracks }] } };
}
const kinds = (t: Token[]) => t.map((x) => x.kind).join(",");

describe("谱头这一处", () => {
  it("开头那一处 = [0, 谱头长度)；读得出调号 / 拍号 / 速度", () => {
    const st = song(), t = tr(st), s = headerSpot(t, 0);
    eq(JSON.stringify(s), JSON.stringify({ a: 0, b: headLen(t), head: true }));
    const v = headerVals(t, s); eq(v.key, 0); assert(!!v.time && v.tempo !== null && v.clef === null);
  });
  it("开头改调号（id 不变、音按新调号拼写）+ 加谱号 = 顺序 调号 → 拍号 → 速度 → 谱号，谱头长度不变", () => {
    const st = song(), t = tr(st), s = headerSpot(t, 0), keyId = t[0].id;
    const st2 = setHeaderAt(st, st.at.paper, st.at.part, s, { key: 2, clef: "F" }), t2 = tr(st2);
    eq(kinds(t2.slice(0, 4)), "key,time,tempo,clef"); eq(t2[0].id, keyId); eq(headLen(t2), 3);
    const g = t2.find((x) => x.kind === "note") as Extract<Token, { kind: "note" }>;
    eq(g.pitch!.step + g.pitch!.alter, "F1", "D 大调里 G♭ 是调内的 F♯，按调号拼成 F♯（调外音照写）");
  });
  it("开头的调号 / 拍号 / 速度去不掉（null 不理）；谱号能去掉", () => {
    let st = song(); const s = headerSpot(tr(st), 0);
    st = setHeaderAt(st, st.at.paper, st.at.part, s, { clef: "F" });
    st = setHeaderAt(st, st.at.paper, st.at.part, headerSpot(tr(st), 0), { key: null, time: null, tempo: null, clef: null });
    eq(kinds(tr(st).slice(0, 3)), "key,time,tempo"); assert(!tr(st).some((x) => x.kind === "clef"), "谱号去掉了");
  });
  it("中途空地插：调号 + 拍号插在两个音之间；光标在后面 = 跟着往后挪", () => {
    const st0 = song(), h = headLen(tr(st0)), at = h + 2, st = { ...st0, caret: tr(st0).length };
    const s = headerSpot(tr(st), at); eq(s.a === at && s.b === at && !s.head, true, "两个音之间 = 空的一处");
    const st2 = setHeaderAt(st, st.at.paper, st.at.part, s, { time: { beats: 6, beatType: 8 }, key: -1 });
    eq(kinds(tr(st2).slice(at, at + 2)), "key,time"); eq(st2.caret, st.caret + 2);
  });
  it("中途全去掉 = 这一处没了", () => {
    const st0 = song(), at = headLen(tr(st0)) + 2;
    const st1 = setHeaderAt(st0, st0.at.paper, st0.at.part, headerSpot(tr(st0), at), { key: 3, clef: "G8vb" });
    const s = headerSpot(tr(st1), at); eq(s.b - s.a, 2);
    const st2 = setHeaderAt(st1, st1.at.paper, st1.at.part, s, { key: null, clef: null });
    eq(kinds(tr(st2)), kinds(tr(st0)));
  });
  it("改开头的速度 = 这张纸每一行都写齐", () => {
    const st = song(), s = headerSpot(tr(st), 0), st2 = setHeaderAt(st, st.at.paper, st.at.part, s, { tempo: 132 });
    for (const t of Object.values(st2.song.papers[0].tracks)) eq((t.find((x) => x.kind === "tempo") as { bpm: number }).bpm, 132);
  });
});
