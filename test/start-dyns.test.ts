// 每张纸（曲段）开头强制写明力度（song.ts ensureStartDyns，v0.10.39）。created 2026-10-10 by Claude Opus 5.5
// user wishlist「强制要求开头有力度标记」→ AI「每张纸开头没写 = 补这里本来生效的那个」→ user「每张纸（曲段）开头，对」
import { describe, it, eq } from "./runner.mjs";
import { initState, addPaper, ensureStartDyns, headLen, TPQ, type Token, type Song } from "../src/score/song.ts";

let nid = 9800;
const n = (): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null } as Token);
const r = (): Token => ({ kind: "rest", id: nid++, dur: TPQ } as Token);
const d = (v: string): Token => ({ kind: "dyn", id: nid++, value: v } as Token);
const body = (t: Token[]) => t.slice(headLen(t)).map((x) => (x.kind === "dyn" ? (x as { value: string }).value : x.kind === "note" ? "n" : x.kind === "rest" ? "r" : x.kind)).join(" ");
function song(tracks: Token[][]): Song {
  let st = initState(); for (let k = 1; k < tracks.length; k++) st = addPaper(st);
  const pid = st.song.parts[0].id;
  return { ...st.song, papers: st.song.papers.map((pp, k) => ({ ...pp, tracks: { [pid]: [...pp.tracks[pid].slice(0, headLen(pp.tracks[pid])), ...tracks[k]] } })) };
}
describe("每张纸开头强制写明力度", () => {
  it("第一张没写 = mf；第二张没写 = 前一张最后那个（这里本来就生效的）；补在第一个音前面（前面的休止不动）", () => {
    const s = song([[n(), d("f"), n()], [r(), n(), n()]]), out = ensureStartDyns(s, 100), pid = s.parts[0].id;
    eq(body(out.song.papers[0].tracks[pid]), "mf n f n");
    eq(body(out.song.papers[1].tracks[pid]), "r f n n");
    eq(out.added.length, 2); eq(out.nextId, 102);
  });
  it("写了的不补；没有音的纸不补；再过一遍什么都不变", () => {
    const s = song([[d("p"), n()], [r(), r()]]), out = ensureStartDyns(s, 100);
    eq(out.added.length, 0); eq(out.song, s);
    const s2 = ensureStartDyns(song([[n()], [n()]]), 1).song;
    eq(ensureStartDyns(s2, 50).added.length, 0, "补完再过一遍 = 不动");
  });
});
