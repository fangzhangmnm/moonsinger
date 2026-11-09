// engrave-textscale.test.ts —— 刀 2：字和谱分开缩（紧凑档只缩谱，字照舒适档）。created 2026-11-09 by Claude Opus 5.5
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §3.3：同一首歌、同一个谱间距，textScale 1 和 1.4——「跟字」的字号正好 1.4 倍，「跟谱」的字和字形一样大；
//   字（歌名 / 曲段名 / 声部名 / 歌词）不压五线谱、不互相压。舒适档版面逐个相同由版面快照守（print-cozy + 两首小样张）。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, LYRIC_EM, LYRIC_SX_COMPACT, type Layout, type Prim } from "../src/render/engrave.ts";
import { primInk } from "../src/render/skyline.ts";
import { textScaleOf, paperOf, DEFAULT_PAPER } from "../src/score/paper.ts";
import { VIEWS, loadSong, measure } from "./fixtures/layout/cases.ts";

/** 「跟字」的类（施工单 §3.2 那张表）；其余的字（cresc. / 8va / 吸 / 推定的灰字）跟谱。 */
const FOLLOW_TEXT = /^(song-title|credits|arr|arr-label|arr-issue|paper-name|part-name|part-badge|lyric|phrase-mark|tempo|tempo-change|groove-mark|nav-mark|keysig key-label|bar-no|chord-tag|page-no)\b/;
const sizeOf = (p: Prim, sp: number) => (p.t === "text" ? p.size ?? LYRIC_EM * sp : p.t === "glyph" ? p.size ?? 4 * sp : 0);
const compact = (key: string) => { const { song, labels } = loadSong(key), paper = song.paper ?? paperOf(DEFAULT_PAPER); return { song: { ...song, paper: { ...paper, density: "compact" as const, staffMm: undefined } }, labels }; };
/** 同一首紧凑档的歌排两遍：字的尺子 = 谱（1）/ 字照舒适档（1.4）。量字跟着字号。 */
function pair(key: string, view = "edit-all"): [Layout, Layout, number] {
  const { song, labels } = compact(key), v = VIEWS.find((x) => x.name === view)!, o = v.opts(song, labels), ts = textScaleOf(song.paper);
  return [engrave(song, { ...o, textScale: 1, measureLyric: measure }), engrave(song, { ...o, textScale: ts, measureLyric: (s) => measure(s) * ts }), ts];
}

describe("刀 2：紧凑档的字照舒适档那么大（textScale = 7 / 5）", () => {
  it("紧凑档 textScale = 1.4、舒适档 = 1", () => { eq(textScaleOf(paperOf(DEFAULT_PAPER)), 1); assert(Math.abs(textScaleOf({ ...paperOf(DEFAULT_PAPER), density: "compact" }) - 1.4) < 1e-9); });
  for (const key of ["once", "v2-2-2-2"]) for (const view of ["edit-all", "print"]) it(`${key} · ${view}：跟字的字号 ×1.4，跟谱的字和字形不变`, () => {
    const [A, B, ts] = pair(key, view), sp = A.sp;
    eq(B.sp, A.sp, "谱的尺子不变"); assert(Math.abs(B.tp - A.tp * ts) < 1e-9, "字的尺子 ×1.4");
    const sizes = (L: Layout) => { const m = new Map<string, Set<number>>(); for (const p of L.prims) { if (p.t !== "text" && p.t !== "glyph") continue; const k = `${p.t}|${p.cls ?? ""}|${p.t === "text" ? p.s : p.ch}`; const s = m.get(k) ?? new Set(); s.add(Math.round(sizeOf(p, sp) * 1000) / 1000); m.set(k, s); } return m; };
    const a = sizes(A), b = sizes(B), bad: string[] = [];
    let text = 0, staff = 0;
    for (const [k, sa] of a) {
      const sb = b.get(k); if (!sb) continue;   // 折行不一样时某个字可能只在一边（比如行首的小节号）
      const [t, cls] = k.split("|"), follow = (t === "text" && FOLLOW_TEXT.test(cls!)) || (t === "glyph" && /^tempo\b/.test(cls!));   // 速度里的小音符跟速度字
      const want = [...sa].map((x) => Math.round(x * (follow ? ts : 1) * 1000) / 1000).sort().join(), got = [...sb].sort().join();
      const squeezed = cls!.startsWith("lyric") && [...sb].every((x) => [...sa].some((y) => Math.abs(x - Math.round(y * ts * 0.8 * 1000) / 1000) < 1e-3 || Math.abs(x - Math.round(y * ts * 1000) / 1000) < 1e-3));   // 歌词放大后挤了 = 按节奏排的让路缩到八成（fitLyrics 第 ② 步，原有规矩）
      if (want !== got && !squeezed) bad.push(`${k.slice(0, 40)}：${[...sa].join("/")} → ${got}（要 ${want}）`);
      if (follow) text++; else staff++;
    }
    assert(text > 3 && staff > 10, `两类都有（跟字 ${text}、跟谱 ${staff}）`);
    assert(bad.length === 0, bad.slice(0, 5).join("；"));
  });
  it("紧凑档的歌词横向压到 0.85（字高照舒适档，只压宽）；舒适档不压", () => {
    const [A, B] = pair("v2-2-2-2"), ly = (L: Layout) => L.prims.filter((p) => p.t === "text" && /^lyric\b/.test(p.cls ?? "")) as { sx?: number }[];
    assert(ly(A).length > 3 && ly(A).every((p) => p.sx === undefined), "比例 1：不压");
    assert(ly(B).every((p) => p.sx === LYRIC_SX_COMPACT), "比例 1.4：每个歌词字 sx = 0.85");
  });
  for (const key of ["once", "v2-2-2-2"]) it(`${key}：紧凑档的歌名 / 曲段名 / 声部名 / 歌词不压五线谱、不互相压`, () => {
    const [, B, ts] = pair(key), sp = B.sp, m = (s: string, size: number) => (measure(s) * ts * size) / (LYRIC_EM * sp * ts);
    const ink = (p: Prim) => { const out: number[][] = []; primInk(p, sp, m, (x0, x1, y0, y1) => out.push([x0, x1, y0, y1])); return out; };
    const words = B.prims.filter((p) => p.t === "text" && /^(song-title|paper-name|part-name|lyric)\b/.test(p.cls ?? "") && !/\bhyphen\b/.test(p.cls ?? "")).map((p) => ({ p, b: ink(p) }));
    const lines = B.prims.filter((p) => p.t === "line" && p.cls === "staff").map((p) => ({ p, b: ink(p) }));
    const tol = 0.05 * sp, hit = (a: number[][], b: number[][]) => a.some((x) => b.some((y) => x[0]! + tol < y[1]! && y[0]! + tol < x[1]! && x[2]! + tol < y[3]! && y[2]! + tol < x[3]!));
    const bad: string[] = [];
    words.forEach((w, i) => {
      for (const l of lines) if (hit(w.b, l.b)) { bad.push(`${w.p.cls} 「${(w.p as { s: string }).s}」压五线`); break; }
      for (let j = i + 1; j < words.length; j++) if (hit(w.b, words[j]!.b)) bad.push(`${w.p.cls}「${(w.p as { s: string }).s}」× ${words[j]!.p.cls}「${(words[j]!.p as { s: string }).s}」`);
    });
    assert(words.length > 5, `量到了字（${words.length}）`);
    assert(bad.length === 0, `${bad.length} 处：${[...new Set(bad)].slice(0, 5).join("；")}`);
  });
});
