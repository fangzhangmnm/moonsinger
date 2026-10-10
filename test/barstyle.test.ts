// 段落线 ‖ / 终止线（v0.9.32；user 2026-10-07「wishlist两条，1是段分隔（类似||?）」→ 10-10「嗯双小节线的语义不是两个小节线，同意你的归类」= 从「反复」菜单进）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, setBarStyle, setRepeatBar, writeBar, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";

let nid = 9500;
const n = (): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null });
const stOf = (toks: Token[]): EditorState => { const st = initState(); return { ...st, caret: toks.length, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; };
const head = () => tr(initState()).slice(0, 3);
const bars = (st: EditorState) => tr(st).filter((t) => t.kind === "bar").map((t) => (t as { style?: string; repeat?: string }).style ?? (t as { repeat?: string }).repeat ?? "|").join(" ");
describe("段落线 / 终止线", () => {
  it("光标处插；挨着小节线 = 改它；改回普通 / 改成反复 = 样子去掉；「|」的 XOR 不删段落线", () => {
    let st = stOf([...head(), n(), n(), n(), n()]);
    st = setBarStyle(st, "double"); eq(bars(st), "double");
    st = setBarStyle(st, "final"); eq(bars(st), "final", "挨着 = 改");
    st = writeBar(st); eq(bars(st), "final |", "「|」不删终止线（另插一根普通的）");
    st = writeBar(st); eq(bars(st), "final", "普通的那根照旧 XOR");
    st = setRepeatBar(st, "end"); eq(bars(st), "end", "改成反复 = 终止线的样子去掉");
    st = setBarStyle(st, null); eq(bars(st), "|", "改回普通小节线");
  });
  it("MusicXML：<bar-style>light-light / light-heavy 往返", () => {
    const info = { id: "P1", name: "V", instrumentName: "月读", sound: "voice.vocals", program: 55 };
    const toks: Token[] = [...head(), n(), n(), n(), n(), { kind: "bar", id: 1, style: "double" }, n(), n(), n(), n(), { kind: "bar", id: 2, style: "final" }];
    const w = writeMusicXml({ parts: [{ info, tokens: toks }] }, { software: "t", date: "2026-10-10" });
    assert(w.xml.includes("<bar-style>light-light</bar-style>") && w.xml.includes("<bar-style>light-heavy</bar-style>"), "写出来了");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens;
    eq(back.filter((t) => t.kind === "bar").map((t) => (t as { style?: string }).style ?? "|").join(" "), "double final");
  });
  it("简谱文字：|| = 段落线、|] = 终止线", () => {
    const toks = fromJianpu("1 2 || 3 4 |]", 0)!;
    eq(toks.filter((t) => t.kind === "bar").map((t) => (t as { style?: string }).style).join(" "), "double final");
    assert(/\|\|.*\|\]/.test(toJianpu(toks, 0)), toJianpu(toks, 0));
  });
});
