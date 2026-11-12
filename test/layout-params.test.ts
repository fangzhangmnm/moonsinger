// 排版参数表（谱面分家第四刀 4-5；src/render/layout-params.ts）：纸一级「一行最多拉宽多少」、行一级按这一行的种类、行身只从画法的竖向锚点来。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。五线谱「一个图元都不变」由 score-surface 的底本守着，这里只守新的量。
import { describe, it, eq, assert } from "./runner.mjs";
import { mergeColumns, arrangeColumns, type ArrangeTrack } from "../src/render/frame/arrange.ts";
import { curveOf, SP_DEFAULTS } from "../src/render/spacing.ts";
import { PAPER_PARAMS, ROW_PARAMS } from "../src/render/layout-params.ts";
import { DRAWERS } from "../src/render/notations.ts";
import { engrave } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { initState, TPQ, type Song, type Token } from "../src/score/song.ts";
import { setNotation } from "../src/score/song-view.ts";
import { paperOf, lineSp, pageGeoOf, spMm, textScaleOf } from "../src/score/paper.ts";

/** 一条轨：n 个小节，每小节 4 个四分音符（列条目：音 = 弹簧，小节线 = 固定宽）。 */
function track(bars: number): ArrangeTrack<null> {
  const entries: ArrangeTrack<null>["entries"] = [];
  for (let b = 0; b < bars; b++) {
    for (let k = 0; k < 4; k++) { const tick = (b * 4 + k) * TPQ; entries.push({ tick, slot: 10, w: 0, chunk: { items: [{ row: 0, left: 0, right: 1.4, dur: TPQ }], span: TPQ }, ref: null }); }
    entries.push({ tick: (b + 1) * 4 * TPQ, slot: 0, w: 1.2, bar: true, ref: null });
  }
  return { entries, laneBase: 0 };
}
const lineEnds = (bars: number, width: number, maxStretch: number) => {
  const tr = [track(bars)], cols = mergeColumns(tr);
  const a = arrangeColumns(cols, tr, { paperLen: bars * 4 * TPQ, spacing: { curve: curveOf("normal"), ...SP_DEFAULTS }, width, squeeze: 0.15, maxStretch, endPad: 1.6, lineStart: () => 0 });
  return a.lineFrom.map((from, s) => { const to = s + 1 < a.lineFrom.length ? a.lineFrom[s + 1]! : cols.length; return a.xs[to - 1]! + a.ws[to - 1]!; });
};

describe("排版参数表", () => {
  it("一行最多拉宽（纸一级）：上限 1.3 = 不是最后一行的行宽 ≤ 自然宽 × 1.3、到了上限右边空着；不设上限 = 拉满（五线谱现在的样子）", () => {
    const w1 = lineEnds(1, 1000, 1)[0]!, W = w1 / 0.7;   // 一行只放得下一个小节、自然宽约占七成：拉满要 1.43 倍，过了上限
    const nat = lineEnds(3, W, 1), cap = lineEnds(3, W, 1.3), full = lineEnds(3, W, Infinity);
    assert(nat.length >= 2 && nat.length === cap.length && cap.length === full.length, "折行一样");
    for (let s = 0; s < nat.length - 1; s++) {
      assert(Math.abs(full[s]! - W) < 0.01, `不设上限：第 ${s + 1} 行拉满（${full[s]} / ${W}）`);
      assert(Math.abs(cap[s]! - nat[s]! * 1.3) < 0.05, `上限 1.3：第 ${s + 1} 行 ${cap[s]} = 自然 ${nat[s]} × 1.3`);
    }
  });
  it("简谱的纸 = 最多 1.3 倍；五线谱的纸 = 不设上限（第六刀才改）", () => {
    for (const d of ["cozy", "compact"] as const) { eq(PAPER_PARAMS.jianpu[d].maxStretch, 1.3); eq(PAPER_PARAMS.staff[d].maxStretch, Infinity); }
  });
  it("行身从画法的竖向锚点来（不假设 0–4）；数字行的行高按数字行自己的那一行参数", () => {
    const st = DRAWERS.staff.anchors(0, 0.5), jp = DRAWERS.jianpu.anchors(0, 0.5);
    eq([st.top, st.bottom].join(","), "0,4", "五线谱 = 五条线");
    assert(Math.abs(jp.top - (2.95 - 1.82 * 2.5)) < 1e-6 && Math.abs(jp.bottom - (2.95 + 1.0 * 2.5)) < 1e-6, `数字行有自己的行身 = 样张的小节线那一段（基线上 1.82 到基线下 1.0 个数字字号）：${jp.top}–${jp.bottom}`);
    // 一首没有歌词、没有记号的长歌，切成简谱：中间那几行（谱头不在、墨在最小值里）的行高 = 数字行的「没歌词」最小行高
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    let id = 1000; const body = Array.from({ length: 128 }, (_, i) => ({ kind: "note", pitch: { step: "CDEFGAB"[i % 7] as "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null, id: id++ }) as Token);
    const sp = 10, heights = (barNumbers?: "off") => {
      let s: Song = { ...st0.song, ...(barNumbers ? { barNumbers } : {}), papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...paper.tracks[part]!, ...body] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const L = engrave(s, { width: 600, sp, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      const mid = L.systems.filter((r) => r.kind === "jianpu").slice(1, -1);
      assert(mid.length >= 2, "折成了好几行");
      return mid.map((r) => Math.round(((r.bottom - r.top) / sp) * 100) / 100);
    };
    for (const h of heights("off")) assert(Math.abs(h - ROW_PARAMS.jianpu.cozy.rowHNoLyric) < 0.006, `不印小节号：数字行的行高 = 最小值（${h} vs ${ROW_PARAMS.jianpu.cozy.rowHNoLyric}）`);
    for (const h of heights()) assert(h <= ROW_PARAMS.jianpu.cozy.rowHNoLyric + 1, `印小节号：最多高一格（${h}）——小节号贴着行身，不按五线谱躲符干的 2.4`);
  });
  // 验收按拍子算（统筹看第四刀成品样张后定的第 3 处，user「字有点大……有点太舒适了」）：A5 舒适档，四拍子、四分和八分为主的单声部旋律一行约 6 小节（约 24 个四分音符）；三拍子约 8 小节
  const melody = (beats: number, bars: number, paperKind: "A5" | "A6", compact = false) => {
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const head = paper.tracks[part]!.map((t) => (t.kind === "time" ? { ...t, beats, beatType: 4 } : t));
    let id = 5000, k = 0; const body: Token[] = [];
    for (let b = 0; b < bars; b++) for (const d of beats === 4 ? (b % 2 ? [1, 0.5, 0.5, 1, 1] : [1, 1, 0.5, 0.5, 1]) : (b % 2 ? [1, 0.5, 0.5, 1] : [1, 1, 1])) body.push({ kind: "note", id: id++, pitch: { step: "CDEFGAB"[k++ % 7] as "C", alter: 0, octave: 4 }, dur: TPQ * d, lyric: null } as Token);
    const pp = { ...paperOf(paperKind), ...(compact ? { density: "compact" as const } : {}) };
    let s: Song = { ...st0.song, paper: pp, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head, ...body] } }] };
    s = setNotation({ ...st0, song: s }, "jianpu").song;
    const sp = 10, ts = textScaleOf(pp), L = engrave(s, { width: lineSp(pp) * sp, sp, locale: "zh", ...(ts !== 1 ? { textScale: ts } : {}), at: { paper: paper.id, part }, parts: [{ id: part, name: "Vocals", first: true }], measure: createTextMeasure((x: string, px: number) => [...x].length * 0.55 * px), autoBars: true, page: pageGeoOf(pp) });
    const by = new Map<number, number>(); for (const b of L.bars) by.set(b.system, (by.get(b.system) ?? 0) + 1);
    const digitMm = (L.prims.find((p) => /jp-digit/.test(p.cls ?? "")) as { size: number }).size / sp * spMm(pp);
    return { perRow: L.systems.map((_, i) => by.get(i) ?? 0).slice(0, -1), digitMm };
  };
  it("一拍占多宽 = 样张的比例（第五刀：简谱的样子以当时的样张为准；统筹定的验收：比例对、每行几小节只报数不卡）", () => {
    // 一行排得下（最后一行不拉宽）：相邻两个音的中心距 ÷ 数字字号 = 样张的弹簧（字号 22 px 时 5 + 6.8·log2(1 + 4×几拍) px）和「一列至少多宽」里大的那个
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const gap = (q: number) => {
      let id = 6000; const body = Array.from({ length: 4 }, (_, i) => ({ kind: "note", id: id++, pitch: { step: "CDEF"[i] as "C", alter: 0, octave: 4 }, dur: TPQ * q, lyric: null }) as Token);
      const pp = paperOf("A5"); let s: Song = { ...st0.song, paper: pp, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...paper.tracks[part]!, ...body] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const sp = 10, L = engrave(s, { width: lineSp(pp) * sp, sp, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "Vocals", first: true }], measure: createTextMeasure((x: string, px: number) => [...x].length * 0.55 * px), autoBars: true, page: pageGeoOf(pp) });
      const ds = L.prims.filter((p) => /jp-digit/.test(p.cls ?? "")) as { x: number; size: number }[];
      return (ds[2]!.x - ds[1]!.x) / ds[0]!.size;
    };
    const mock = (q: number) => (5 + 6.8 * Math.log2(1 + 4 * q)) / 22;
    for (const [q, want] of [[1, mock(1)], [0.5, Math.max(mock(0.5), 0.756)], [0.25, Math.max(mock(0.25), 0.492)]] as const) {
      const g = gap(q); assert(Math.abs(g - want) < 0.01, `${q} 拍的音：中心距 ${g.toFixed(3)} 个字号 = 样张 ${want.toFixed(3)}`);
    }
    const four = melody(4, 32, "A5"), three = melody(3, 32, "A5");
    console.log(`    （只报数）A5 舒适：四拍子每行 ${four.perRow.join(" ")} 小节；三拍子每行 ${three.perRow.join(" ")} 小节`);
  });
  it("数字字号：舒适 3.6 mm、紧凑约 3.0 mm，不跟着纸变（A5、A6 同一档一样大）", () => {
    eq(Math.round(melody(4, 4, "A5").digitMm * 100) / 100, 3.6, "舒适 A5");
    eq(Math.round(melody(4, 4, "A6").digitMm * 100) / 100, 3.6, "舒适 A6");
    eq(Math.round(melody(4, 4, "A5", true).digitMm * 100) / 100, 3, "紧凑 A5");
  });
});
