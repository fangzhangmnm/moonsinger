// 歌词按节奏排（v0.9.40；user 2026-10-10「先试下你说的两个歌词开关吧，approved」；设计 = ai-docs/20261010-design-answers.md「歌词不想影响音符的位置」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, fitLyrics, lyricBlockSx } from "../src/render/engrave.ts";
import { LYRIC_MIN_SX } from "../src/render/text-style.ts";
import { DEFAULT_GAPS, GAP_MIN } from "../src/render/engrave.ts";
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
  it("借不够 = 挤的那一串一起收到刚好放得下，不挤的照原宽", () => {
    const f = fitLyrics([{ cx: 0, w: 3 }, { cx: 1.6, w: 3 }, { cx: 3.2, w: 3 }, { cx: 4.8, w: 3 }, { cx: 12, w: 1 }]);   // 中间两个两边都有邻居：最多各挪到中点
    assert(f[4].sx === 1, "不挤的不收");
    assert(f.slice(0, 4).some((x) => x.sx < 1) && f.every((x) => x.sx >= LYRIC_MIN_SX && !x.tight), JSON.stringify(f));
  });
  it("收到最窄还挤 = 照写、标 tight（v0.16.45 起不画灰，只在歌词框说「挤了」）", () => {
    const g = fitLyrics([{ cx: 0, w: 9 }, { cx: 1, w: 9 }, { cx: 2, w: 9 }, { cx: 3, w: 9 }]);
    assert(g.some((x) => x.tight), "挤了");
    assert(g.slice(1, 3).every((x) => x.sx === LYRIC_MIN_SX), `中间挤的两个收到最窄：${JSON.stringify(g.map((x) => [x.sx, x.tight]))}`);   // 两头的外侧没有邻居，可以往外挪，放宽了也不多叠
  });
  it("方块字：一行要压到多宽（lyricBlockSx）；摆的时候所有方块字一个宽度，不挤的也一样（「方块字的美感」）", () => {
    const row = [0, 1.2, 2.4, 3.6].map((cx) => ({ cx, w: 1.8, block: true })), loose = [0, 4, 8].map((cx) => ({ cx, w: 1.8, block: true }));
    const t = lyricBlockSx(row);
    assert(t < 1 && t >= LYRIC_MIN_SX, `要压：${t}`);
    eq(lyricBlockSx(loose), 1);
    const f = fitLyrics(loose, t);
    assert(f.every((x) => x.sx === t && !x.tight), "不挤的那一行也跟整段同一个宽度");
    assert(fitLyrics(row, t).every((x) => !x.tight), "按这个宽度挤的那一行放得下");
  });
  it("对齐（user「怎么样算跑到外面没对齐」）：挪了也还盖着自己的音、没越过和邻居音的中点", () => {
    const items = [{ cx: 0, w: 4 }, { cx: 2, w: 4 }, { cx: 4, w: 4 }, { cx: 6, w: 1 }], f = fitLyrics(items);
    f.forEach((x, i) => {
      const it = items[i], half = (it.w * x.sx) / 2, nb = items[i + (x.dx < 0 ? -1 : 1)], toward = nb ? Math.abs(nb.cx - it.cx) / 2 : Infinity;   // 往哪边挪就看哪边的邻居
      if (!x.tight) assert(Math.abs(x.dx) <= Math.max(0.2, Math.min(half - 0.15, toward)) + 1e-6, `第 ${i} 个挪了 ${x.dx.toFixed(2)}`);
    });
  });
  it("空格跟着左右更窄的那个字收（user「空格和最窄的邻居宽度对齐」）：放得下就不叠", () => {
    const items = [{ cx: 0, w: 3 }, { cx: 2.2, w: 3 }, { cx: 4.4, w: 3 }], f = fitLyrics(items);
    for (let i = 1; i < items.length; i++) {
      const gap = items[i].cx + f[i].dx - (items[i].w * f[i].sx) / 2 - (items[i - 1].cx + f[i - 1].dx + (items[i - 1].w * f[i - 1].sx) / 2);
      if (!f[i].tight) assert(gap >= DEFAULT_GAPS.space * GAP_MIN * Math.min(f[i].sx, f[i - 1].sx) - 1e-6, `第 ${i} 道缝 ${gap.toFixed(3)}`);
    }
  });
  it("挤的时候先压缝、再压字（user「连字符和空格…可读性可以牺牲的最多」）：缝压一压就放得下 = 字不收", () => {
    const sp = DEFAULT_GAPS.space, items = [0, 1, 2, 3].map((k) => ({ cx: k * (1 + sp * 0.5), w: 1 }));   // 中心差 = 字宽 + 半个缝：缝压到一半就够、字不用动
    const f = fitLyrics(items);
    assert(f.every((x) => x.sx === 1 && !x.tight), JSON.stringify(f.map((x) => [x.sx, +x.dx.toFixed(2)])));
  });
  it("方块字旁边的连字符不占地方（挂在缝里，user「方块字的排版最好能忽视连字符」）", () => {
    const a = fitLyrics([{ cx: 0, w: 1.6, block: true, hy: true }, { cx: 1.9, w: 1.6, block: true }]), b = fitLyrics([{ cx: 0, w: 1.6, block: true }, { cx: 1.9, w: 1.6, block: true }]);
    eq(JSON.stringify(a), JSON.stringify(b));
  });
});
describe("排出来：歌词字高一律一样，方块字整段一个宽度", () => {
  const zh = "月光照在小河上星星眨着眼睛风儿轻轻地吹过山坡和田野我们一起唱这首歌唱到天亮也不停".split("");
  it("挤的地方只收宽度：每个歌词字号一样；方块字 sx 全段相同", () => {
    let id = 7100; const st = initState();
    const toks = [...tr(st).slice(0, 3), ...zh.map((ch): Token => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ / 4, lyric: ch }) as Token)];
    const song = { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) };
    const L = engrave(song, { width: 700, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 30 } as never);   // 一个字 3 个线间距宽：十六分音符放不下（最后一行 v0.16.45 起跟上一行一样松，要更宽的字才挤）
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
