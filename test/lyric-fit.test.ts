// 歌词按节奏排（v0.9.40；user 2026-10-10「先试下你说的两个歌词开关吧，approved」；设计 = ai-docs/20261010-design-answers.md「歌词不想影响音符的位置」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, fitLyrics } from "../src/render/engrave.ts";
import { initState, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";

describe("歌词让路（fitLyrics）", () => {
  it("放得下 = 不动", () => {
    const f = fitLyrics([{ cx: 0, w: 1.5 }, { cx: 3, w: 1.5 }, { cx: 6, w: 1.5 }]);
    assert(f.every((x) => x.dx === 0 && x.scale === 1 && x.row === 0 && !x.tight), JSON.stringify(f));
  });
  it("挤一点 = 左右借空（不再死死居中）", () => {
    const f = fitLyrics([{ cx: 0, w: 1.5 }, { cx: 2.4, w: 3 }, { cx: 6, w: 1.5 }]);
    assert(f.some((x) => x.dx !== 0) && f.every((x) => x.scale === 1 && x.row === 0 && !x.tight), JSON.stringify(f));
  });
  it("借不够 = 这一行的字一起缩一档（同一行字号统一；v0.16.43 user「挤的时候整行歌词一起缩」）", () => {
    const f = fitLyrics([{ cx: 0, w: 3 }, { cx: 0.5, w: 3 }, { cx: 8, w: 1 }]);   // 中心差 0.5：借空最多 2.7、要 3.5 = 不够；缩一点就够
    assert(f.every((x) => x.scale < 1 && x.scale === f[0].scale && x.row === 0 && !x.tight), JSON.stringify(f));
    assert(f[0].scale >= 0.8, "不小于最小值");
  });
  it("缩到最小（八成）还挤 = 照写、挤的那几个标 tight；不错开到第二排（两排 = 两段词）", () => {
    const g = fitLyrics([{ cx: 0, w: 9 }, { cx: 1, w: 9 }, { cx: 2, w: 9 }, { cx: 3, w: 9 }]);
    assert(g.every((x) => x.row === 0 && x.scale === 0.8), JSON.stringify(g));
    assert(g.some((x) => x.tight), "挤了");
  });
  it("能少缩就少缩：刚好差一点 = 0.95，不一下缩到八成", () => {
    const f = fitLyrics([{ cx: 0, w: 2 }, { cx: 2.6, w: 2 }, { cx: 5.2, w: 2 }, { cx: 7.8, w: 2 }], 0.5);   // 借空只能救一部分
    assert(f.every((x) => x.scale === f[0].scale) && f[0].scale >= 0.8 && !f.some((x) => x.tight), JSON.stringify(f.map((x) => x.scale)));
  });
});

let nid = 6100;
const n = (lyric: string): Token => ({ kind: "note", id: nid++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ / 2, lyric });
const stOf = (lyrics: string[], rhythm: boolean): EditorState => {
  const st = initState(), toks = [...tr(st).slice(0, 3), ...lyrics.map(n)];
  return { ...st, song: { ...st.song, ...(rhythm ? {} : { lyricFit: "lyrics" as const }), papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } };
};
const xs = (st: EditorState) => engrave(st.song, { width: 900, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 10 } as never).notes.map((h) => Math.round(h.x)).join(",");
describe("按节奏排：音的位置只看时值", () => {
  const short = ["a", "b", "c", "d", "e", "f", "g", "h"], long = ["Greensleeves", "was", "all", "my", "joy", "and", "who", "but"];
  it("按节奏排（默认）：短字换成长字，每个音的位置一点不动", () => { eq(xs(stOf(long, true)), xs(stOf(short, true))); });
  it("按歌词排：长字把音推开", () => { assert(xs(stOf(long, false)) !== xs(stOf(short, false)), "应该不一样"); });
});
