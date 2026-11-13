// 歌词按节奏排（v0.9.40；user 2026-10-10「先试下你说的两个歌词开关吧，approved」；设计 = ai-docs/20261010-design-answers.md「歌词不想影响音符的位置」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { fitLyrics, lyricBlockSx, hyphens, DEFAULT_GAPS, GAP_MIN } from "../src/render/text/index.ts";
import { LYRIC_MIN_SX } from "../src/render/text/index.ts";
import { initState, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

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
    const L = engrave(song, { width: 700, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], locale: "zh", measure: createTextMeasure((s: string) => s.length * 30) } as never);   // 一个字 3 个线间距宽：十六分音符放不下（最后一行 v0.16.45 起跟上一行一样松，要更宽的字才挤）
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
const xs = (st: EditorState) => engrave(st.song, { width: 900, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], locale: "zh", measure: createTextMeasure((s: string) => s.length * 10) } as never).notes.map((h) => Math.round(h.x)).join(",");
describe("按节奏排：音的位置只看时值", () => {
  const short = ["a", "b", "c", "d", "e", "f", "g", "h"], long = ["Greensleeves", "was", "all", "my", "joy", "and", "who", "but"];
  it("按节奏排（默认）：短字换成长字，每个音的位置一点不动", () => { eq(xs(stOf(long, true)), xs(stOf(short, true))); });
  it("按歌词排：长字把音推开", () => { assert(xs(stOf(long, false)) !== xs(stOf(short, false)), "应该不一样"); });
});

const J = (v: unknown) => JSON.stringify(v);
describe("连字符摆哪（hyphens，2026-11-09 从排版器抽出来：src/render/text/lyric-fit.ts）", () => {
  it("没走让路（按歌词排）：给了字的半宽 = 摆在缝的正中，不贴宽的那个字；缝窄也照画（v0.16.78，user「un -der」「dar -ling」）", () => {
    const r = hyphens([{ x: 0, hy: true, nw: 1, cjk: false, row: 0 }, { x: 5, nw: 2, cjk: false, row: 0 }], 1, 1.6);
    eq(r[0]!.x, (1 + 3) / 2);   // 缝 = [1, 3]：正中 2（两个中心的正中是 2.5）
    eq(hyphens([{ x: 0, hy: true, nw: 1, cjk: false, row: 0 }, { x: 2.2, nw: 1, cjk: false, row: 0 }], 1, 1.6)[0]!.x, 1.1);   // 缝只有 0.2：照画
  });
  it("同一行：摆在两个字之间那道缝的正中、跟着更窄的字压；缝放不下 = 不画；方块字旁边照画", () => {
    const r = hyphens([{ x: 0, hy: true, hw: 1, sx: 0.8, cjk: false, row: 0 }, { x: 4, hw: 1, sx: 0.6, cjk: false, row: 0 }], 1, 2);
    eq(J(r[0]), J({ x: 2, hf: 0.6 })); eq(J(r[1]), J(null));
    eq(J(hyphens([{ x: 0, hy: true, hw: 1, sx: 1, cjk: false, row: 0 }, { x: 2.5, hw: 1, sx: 1, cjk: false, row: 0 }], 1, 2)[0]), J(null), "缝 0.5 < 一个连字符 1");
    eq(J(hyphens([{ x: 0, hy: true, hw: 1, sx: 1, cjk: true, row: 0 }, { x: 2.5, hw: 1, sx: 1, cjk: false, row: 0 }], 1, 2)[0]), J({ x: 1.25, hf: 1 }), "方块字旁边不占地方");
  });
  it("没走让路 = 两个中心的正中；下一个在别的行 / 没有下一个 = 挂在左边那个字后面", () => {
    eq(J(hyphens([{ x: 0, hy: true, cjk: false, row: 0 }, { x: 4, cjk: false, row: 0 }], 1, 2)[0]), J({ x: 2, hf: 1 }));
    eq(J(hyphens([{ x: 0, hy: true, hw: 1, sx: 1, cjk: false, row: 0 }, { x: 4, hw: 1, sx: 1, cjk: false, row: 1 }], 1, 2)[0]), J({ x: 2, hf: 1 }));
    eq(J(hyphens([{ x: 5, hy: true, cjk: false, row: 0 }], 1, 3)[0]), J({ x: 8, hf: 1 }));
  });
});

// 7-E（user 11-11「排版炸了，文字跑到线前面了」）：歌词不越过这一行的左右边界——左 = 这一行谱的起点（多声部时那根竖线），右 = 这一行的右端；音的位置不动。两种谱、两种歌词排法都管（框架的事）。
import { addPart } from "../src/score/song.ts";
import { setNotation } from "../src/score/song-view.ts";
import { primInk } from "../src/render/skyline.ts";
import { MARGIN, LYRIC_EDGE } from "../src/look/frame.ts";
describe("歌词不越过这一行的左右边界（7-E）", () => {
  const W = 900, SP = 10, raw = (s: string, px: number) => s.length * px * 0.55, M = createTextMeasure(raw);
  /** 两位歌手（第一位带词：每个四分音符一个短词，first / last 换成长词）→ 排一遍，回每个字的墨 [x0, x1]、它在第几行、那一行左边那根竖线。 */
  const run = (notation: "staff" | "jianpu", rhythm: boolean, words: (i: number, n: number) => string) => {
    let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, st.song.papers[0]!.id);
    const N = 60; let id = 8100;   // 60 个：最后一行很短会并进上一行（7-F），40 个的时候简谱并完只剩一行，测不到行首的长词
    const body = Array.from({ length: N }, (_, i): Token => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ, lyric: words(i, N) }) as Token);
    const p0 = st.song.papers[0]!, a = st.song.parts[0]!.id;
    let song = { ...st.song, ...(rhythm ? {} : { lyricFit: "lyrics" as const }), papers: [{ ...p0, tracks: { ...p0.tracks, [a]: [...p0.tracks[a]!.slice(0, 3), ...body] } }] };
    song = setNotation({ ...st, song }, notation).song;
    const L = engrave(song, { width: W, sp: SP, at: { paper: p0.id, part: a }, parts: [{ id: a, name: "Voice", first: true }, { id: "P2", name: "Cello" }], locale: "zh", measure: M } as never);
    const sysLines = L.prims.filter((p): p is Extract<typeof p, { t: "line" }> => p.t === "line" && p.cls === "bar" && p.x1 === p.x2 && p.y2 - p.y1 > 6 * SP).sort((p, q) => p.y1 - q.y1);
    const ink = (p: (typeof L.prims)[number]) => { let r: [number, number] = [0, 0]; primInk(p.t === "text" && !p.anchor ? { ...p, anchor: "middle" } : p, SP, (s, size) => M.widthPx(s, size, SP, 1), (x0, x1) => { r = [x0, x1]; }); return r; };   // 歌词不写 anchor = 居中（SVG / PDF 都这么画）
    const ly = L.lyrics.map((h) => { const p = L.prims.find((q) => q.t === "text" && /^lyric\b/.test(q.cls ?? "") && Math.abs((q as { x: number }).x - h.x) < 1e-6 && Math.abs((q as { y: number }).y - h.y) < 1e-6)!; return { sys: L.systems[h.system]!.sys, ink: ink(p), tight: !!h.tight }; });
    return { L, ly, left: (sys: number) => sysLines[sys]!.x1 + LYRIC_EDGE * SP, right: W - (MARGIN + LYRIC_EDGE) * SP };
  };
  const longEdges = (i: number, n: number) => (i === 0 || i === n - 1 || i % 7 === 6 ? "Fromtheskyabove" : "la");
  for (const notation of ["jianpu", "staff"] as const) for (const rhythm of [true, false]) {
    it(`${notation === "jianpu" ? "简谱" : "五线谱"} · ${rhythm ? "按节奏排" : "按歌词排"}：每个字的左缘 ≥ 这一行的左边界、右缘 ≤ 右边界（行首 / 行尾放长词）`, () => {
      const { L, ly, left, right } = run(notation, rhythm, longEdges);
      assert(L.systems.some((r) => r.sys > 0), "排出了好几行");
      for (const l of ly) assert(l.ink[0] >= left(l.sys) - 0.5 && l.ink[1] <= right + 0.5, `第 ${l.sys + 1} 行的字 [${l.ink.map((v) => v.toFixed(1))}] 越过了 [${left(l.sys).toFixed(1)}, ${right.toFixed(1)}]${l.tight ? "（挤）" : ""} 同行：${ly.filter((m) => m.sys === l.sys).map((m) => m.ink.map((v) => v.toFixed(0)).join("-") + (m.tight ? "!" : "")).join(" ")}`);
    });
  }
  it("按节奏排：收进边界不动音（长词换短词，每个音的位置一样）", () => {
    for (const notation of ["jianpu", "staff"] as const) eq(run(notation, true, longEdges).L.notes.map((h) => Math.round(h.x * 100)).join(","), run(notation, true, () => "la").L.notes.map((h) => Math.round(h.x * 100)).join(","), notation);
  });
});
