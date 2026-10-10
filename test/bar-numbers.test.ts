// 小节号（v0.9.42；user 2026-10-10「小节号要，可以页面设置toggle，默认是每行开头有。字小一点」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { initState, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";

let nid = 6600;
const q = (): Token => ({ kind: "note", id: nid++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ, lyric: null });
const bar = (): Token => ({ kind: "bar", id: nid++ });
const stOf = (toks: Token[], off = false): EditorState => {
  const st = initState();
  return { ...st, song: { ...st.song, ...(off ? { barNumbers: "off" as const } : {}), papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: [...tr(st).slice(0, 3), ...toks] } })) } };
};
const lay = (st: EditorState) => engrave(st.song, { width: 360, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 10, autoBars: true } as never);
const nums = (st: EditorState) => lay(st).prims.filter((p) => p.t === "text" && p.cls === "bar-no").map((p) => (p as { s: string }).s);
const firstMeasureOfRows = (st: EditorState) => { const L = lay(st); return [...new Set(L.systems.map((s) => s.sys))].length; };

describe("小节号", () => {
  it("每行开头印这一行第一个小节的号；第一行（1）不印", () => {
    const st = stOf(Array.from({ length: 24 }, q));   // 6 个 4/4 小节
    const ns = nums(st);
    assert(firstMeasureOfRows(st) >= 2, "要折成几行才测得到");
    eq(ns.length, firstMeasureOfRows(st) - 1, "除了第一行每行一个");
    assert(ns.every((x, k) => k === 0 || Number(x) > Number(ns[k - 1])) && Number(ns[0]) > 1, ns.join(","));
  });
  it("弱起算第 0 小节：第二行的号 = 第一行整小节数 + 1（弱起不算）", () => {
    for (const pick of [false, true]) {
      const st = stOf([...(pick ? [q(), bar()] : []), ...Array.from({ length: 24 }, q)]), L = lay(st);
      const row0 = L.notes.filter((h) => L.systems[h.system]?.sys === 0).length, full = (row0 - (pick ? 1 : 0)) / 4;
      assert(Number.isInteger(full), `第一行 ${row0} 个音`);
      eq(nums(st)[0], String(full + 1), pick ? "有弱起" : "没弱起");
    }
  });
  it("关掉 = 不印", () => { eq(nums(stOf(Array.from({ length: 24 }, q), true)).length, 0); });
});
