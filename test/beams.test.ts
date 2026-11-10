// 符杠按拍号分组（v0.16.6，2026-11-07 by Claude Opus 5.5；user 11-07「三拍子的时候还是按照二拍子逻辑分组的」→ 查清是那首歌拍号写 3/4、内容是 6/8 →
//   「普尾严格跟拍号走」「六八拍的支持能帮我补上去吗」）：3/4 = 每拍（四分）一组；6/8 / 9/8 / 12/8 = 每拍（附点四分）三个八分一组；3/8 = 一小节三个连一组（原来漏了）
import { describe, it, eq } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { initState, headLen, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

let nid = 9500;
const e8 = (): Token => ({ kind: "note", id: nid++, pitch: { step: "B", alter: 0, octave: 4 }, dur: TPQ / 2, lyric: null } as Token);
function bar(beats: number, beatType: number, n: number): EditorState {
  const st = initState(), pp = st.song.papers[0], pid = st.song.parts[0].id, t = pp.tracks[pid], h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats, beatType } : x));
  return { ...st, song: { ...st.song, papers: [{ ...pp, tracks: { [pid]: [...h, ...Array.from({ length: n }, e8)] } }] } };
}
const groups = (st: EditorState) => engrave(st.song, { width: 1200, sp: 10, at: st.at, parts: st.song.parts.map((p, k) => ({ id: p.id, name: `V${k}`, empty: false, first: k === 0, hidden: false, badges: [], mono: false })), measure: createTextMeasure((s: string) => s.length * 10), autoBars: true })
  .prims.filter((p) => p.t === "path" && typeof p.cls === "string" && p.cls.split(" ").includes("beam")).length;   // 只有八分 = 一组一道符杠

describe("符杠按拍号分组", () => {
  it("3/4：六个八分 = 三组（每拍两个）", () => eq(groups(bar(3, 4, 6)), 3));
  it("6/8：六个八分 = 两组（每拍三个）", () => eq(groups(bar(6, 8, 6)), 2));
  it("9/8 / 12/8：每拍三个", () => { eq(groups(bar(9, 8, 9)), 3); eq(groups(bar(12, 8, 12)), 4); });
  it("3/8：三个八分 = 一组（原来漏了：每个八分各一拍、不连）", () => eq(groups(bar(3, 8, 3)), 1));
  it("4/4：八个八分 = 四组；2/2：每拍（二分）四个 = 两组", () => { eq(groups(bar(4, 4, 8)), 4); eq(groups(bar(2, 2, 8)), 2); });
});
