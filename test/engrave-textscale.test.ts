// engrave-textscale.test.ts —— 刀 2：字和谱分开缩（紧凑档只缩谱，字照舒适档）。created 2026-11-09 by Claude Opus 5.5
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §3.3：同一首歌、同一个谱间距，textScale 1 和 1.4——「跟字」的字号正好 1.4 倍，「跟谱」的字和字形一样大；
//   字（歌名 / 曲段名 / 声部名 / 歌词）不压五线谱、不互相压。舒适档版面逐个相同由版面快照守（print-cozy + 两首小样张）。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Layout, type Prim } from "../src/render/engrave.ts";
import { LYRIC_LOOK, LYRIC_MIN_SX } from "../src/render/text/index.ts";
import { primInk } from "../src/render/skyline.ts";
import { textScaleOf, paperOf } from "../src/look/paper.ts";
import { lookOf } from "../src/look/index.ts";
import { VIEWS, loadSong, measure } from "./fixtures/layout/cases.ts";
import { createTextMeasure, LYRIC_EM } from "../src/render/text/index.ts";

/** 「跟字」的类（施工单 §3.2 那张表；歌词 v0.16.43 起改回跟谱）；其余的字（歌词、cresc. / 8va / 吸 / 推定的灰字）跟谱。 */
const FOLLOW_TEXT = /^(song-title|credits|arr|arr-label|arr-issue|paper-name|part-name|part-badge|page-no)\b/;   // v0.16.48 起速度、1=X、风格、和弦级数、反复的字、小节号跟谱（user「速度那一串字号…也应该跟着走」）   // 歌词 v0.16.43 起跟谱（紧凑 = 配器，user「紧凑的话其实那个小字就够了」）
const sizeOf = (p: Prim, sp: number) => (p.t === "text" ? p.size ?? LYRIC_EM * sp : p.t === "glyph" ? p.size ?? 4 * sp : 0);
const compact = (key: string) => { const { song, labels } = loadSong(key); return { song: { ...song, density: "compact" as const, staffMm: "default" as const }, labels }; };
/** 同一首紧凑档的歌排两遍：字的尺子 = 谱（1）/ 字照舒适档（1.4）。量字跟着字号。 */
function pair(key: string, view = "edit-all"): [Layout, Layout, number] {
  const { song, labels } = compact(key), v = VIEWS.find((x) => x.name === view)!, o = v.opts(song, labels), ts = textScaleOf(lookOf(song).paper);
  return [engrave(song, { ...o, textScale: 1, locale: "zh", measure: createTextMeasure(measure) }), engrave(song, { ...o, textScale: ts, locale: "zh", measure: createTextMeasure((s) => measure(s) * ts) }), ts];
}

describe("刀 2：紧凑档的字照舒适档那么大（textScale = 7 / 5）", () => {
  it("紧凑档 textScale = 1.4、舒适档 = 1", () => { eq(textScaleOf(paperOf("A5")), 1); assert(Math.abs(textScaleOf(paperOf("A5", "compact")) - 1.4) < 1e-9); });
  for (const key of ["once", "v2-2-2-2"]) for (const view of ["edit-all", "print"]) it(`${key} · ${view}：跟字的字号 ×1.4，跟谱的字和字形不变`, () => {
    const [A, B, ts] = pair(key, view), sp = A.sp;
    eq(B.sp, A.sp, "谱的尺子不变"); assert(Math.abs(B.tp - A.tp * ts) < 1e-9, "字的尺子 ×1.4");
    const sizes = (L: Layout) => { const m = new Map<string, Set<number>>(); for (const p of L.prims) { if (p.t !== "text" && p.t !== "glyph") continue; const k = `${p.t}|${p.cls ?? ""}|${p.t === "text" ? p.s : p.ch}`; const s = m.get(k) ?? new Set(); s.add(Math.round(sizeOf(p, sp) * 1000) / 1000); m.set(k, s); } return m; };
    const a = sizes(A), b = sizes(B), bad: string[] = [];
    let text = 0, staff = 0;
    for (const [k, sa] of a) {
      const sb = b.get(k); if (!sb) continue;   // 折行不一样时某个字可能只在一边（比如行首的小节号）
      const [t, cls] = k.split("|"), follow = t === "text" && FOLLOW_TEXT.test(cls!);
      const want = [...sa].map((x) => Math.round(x * (follow ? ts : 1) * 1000) / 1000).sort().join(), got = [...sb].sort().join();
      // 歌词跟谱的尺子：字高 = 这一档固定的那个（舒适 1 倍、紧凑 LYRIC_LOOK.compact.k 倍；v0.16.44 起挤了只收宽度、字高不动）
      const lyricOk = cls!.startsWith("lyric") && [...sb].every((x) => Math.abs(x - LYRIC_EM * sp * LYRIC_LOOK.compact.k) < 1e-3);
      if (want !== got && !lyricOk) bad.push(`${k.slice(0, 40)}：${[...sa].join("/")} → ${got}（要 ${want}）`);
      if (follow) text++; else staff++;
    }
    assert(text > 3 && staff > 10, `两类都有（跟字 ${text}、跟谱 ${staff}）`);
    assert(bad.length === 0, bad.slice(0, 5).join("；"));
  });
  it("紧凑档歌词：字高固定（k 倍）、平常压到 sx，挤了再往窄收（最窄 sx × LYRIC_MIN_SX）；舒适档平常不压", () => {
    const [A, B, , sp] = [...pair("v2-2-2-2"), pair("v2-2-2-2")[0].sp], ly = (L: Layout) => L.prims.filter((p) => p.t === "text" && /^lyric\b/.test(p.cls ?? "")) as { sx?: number; size?: number }[];
    const c = LYRIC_LOOK.compact;
    assert(ly(A).length > 3 && ly(A).every((p) => (p.sx ?? 1) <= 1 && (p.sx ?? 1) >= LYRIC_MIN_SX - 1e-9), "比例 1：不压，挤了收窄");
    assert(ly(B).every((p) => (p.sx ?? 1) <= c.sx + 1e-9 && (p.sx ?? 1) >= c.sx * LYRIC_MIN_SX - 1e-9), "比例 1.4：平常 0.85，挤了更窄");
    assert(ly(B).every((p) => Math.abs((p.size ?? 0) - LYRIC_EM * sp * c.k) < 1e-6), "字高固定");
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
