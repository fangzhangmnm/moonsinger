// 歌词按节奏排（v0.9.40；user 2026-10-10「先试下你说的两个歌词开关吧，approved」；设计 = ai-docs/20261010-design-answers.md「歌词不想影响音符的位置」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, fitLyrics, lyricBlockSx } from "../src/render/engrave.ts";
import { LYRIC_MIN_SX } from "../src/render/text-style.ts";
import { initState, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";

describe("歌词让路（fitLyrics）：字高不动、只收宽度（v0.16.44；user 11-09「字高固定，宽度会收」）", () => {
  it("放得下 = 不动", () => {
    const f = fitLyrics([{ cx: 0, w: 1.5 }, { cx: 3, w: 1.5 }, { cx: 6, w: 1.5 }]);
    assert(f.every((x) => x.dx === 0 && x.sx === 1 && !x.tight), JSON.stringify(f));
  });
  it("挤一点 = 左右借空、不收", () => {
    const f = fitLyrics([{ cx: 0, w: 1.5 }, { cx: 2.4, w: 3 }, { cx: 6, w: 1.5 }]);
    assert(f.some((x) => x.dx !== 0) && f.every((x) => x.sx === 1 && !x.tight), JSON.stringify(f));
  });
  it("借不够 = 英文各收各的：挤的那几个收窄，不挤的照原宽（「宽窄的节奏」）", () => {
    const f = fitLyrics([{ cx: 0, w: 3 }, { cx: 0.5, w: 3 }, { cx: 8, w: 1 }]);
    assert(f[2].sx === 1, "不挤的不收");
    assert((f[0].sx < 1 || f[1].sx < 1) && f.every((x) => x.sx >= LYRIC_MIN_SX && !x.tight), JSON.stringify(f));
  });
  it("收到最窄还挤 = 照写、标 tight（画灰）", () => {
    const g = fitLyrics([{ cx: 0, w: 9 }, { cx: 1, w: 9 }, { cx: 2, w: 9 }, { cx: 3, w: 9 }]);
    assert(g.some((x) => x.tight), "挤了");
    assert(g.every((x) => !x.tight || x.sx === LYRIC_MIN_SX), `画灰的都已经收到最窄：${JSON.stringify(g.map((x) => [x.sx, x.tight]))}`);
  });
  it("方块字：一行要压到多宽（lyricBlockSx）；摆的时候所有方块字一个宽度，不挤的也一样（「方块字的美感」）", () => {
    const row = [0, 1.5, 3, 4.5].map((cx) => ({ cx, w: 1.8, block: true })), loose = [0, 4, 8].map((cx) => ({ cx, w: 1.8, block: true }));
    const t = lyricBlockSx(row);
    assert(t < 1 && t >= LYRIC_MIN_SX, `要压：${t}`);
    eq(lyricBlockSx(loose), 1);
    const f = fitLyrics(loose, t);
    assert(f.every((x) => x.sx === t && !x.tight), "不挤的那一行也跟整段同一个宽度");
    assert(fitLyrics(row, t).every((x) => !x.tight), "按这个宽度挤的那一行放得下");
  });
  it("方块字挨方块字的缝比英文小（0.25 vs 0.5）", () => {
    const zh = fitLyrics([{ cx: 0, w: 1.6, block: true }, { cx: 1.9, w: 1.6, block: true }]), en = fitLyrics([{ cx: 0, w: 1.6 }, { cx: 1.9, w: 1.6 }]);
    assert(zh.every((x) => x.dx === 0 && x.sx === 1), "方块字：1.6 宽、中心差 1.9 = 放得下");
    assert(en.some((x) => x.dx !== 0 || x.sx < 1), "英文要借空");
  });
});
describe("排出来：歌词字高一律一样，方块字整段一个宽度", () => {
  const zh = "月光照在小河上星星眨着眼睛风儿轻轻地吹过山坡和田野我们一起唱这首歌唱到天亮也不停".split("");
  it("挤的地方只收宽度：每个歌词字号一样；方块字 sx 全段相同", () => {
    let id = 7100; const st = initState();
    const toks = [...tr(st).slice(0, 3), ...zh.map((ch): Token => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ / 4, lyric: ch }) as Token)];
    const song = { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) };
    const L = engrave(song, { width: 700, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 22 } as never);   // 一个字 2.2 个线间距宽：十六分音符放不下
    const ly = L.prims.filter((p) => p.t === "text" && /^lyric\b/.test(p.cls ?? "") && !/hyphen/.test(p.cls ?? "")) as { size?: number; sx?: number }[];
    assert(ly.length === zh.length, `${ly.length} 个字`);
    eq(new Set(ly.map((p) => p.size ?? 0)).size, 1, "字高一样");
    eq(new Set(ly.map((p) => p.sx ?? 1)).size, 1, "宽度一样");
    assert((ly[0].sx ?? 1) < 1, "十六分音符一字一个：要压");
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
