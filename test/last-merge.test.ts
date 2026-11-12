// 最后一行很短并进上一行（7-F；src/render/frame/arrange.ts lastMerge，参数在 src/render/layout-params.ts LAST_MERGE）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   user 2026-11-11「以及我反而需要最后多了一小节的时候前面能不能再挤一点放进去」，看了做法「嗯动前两行合理，赞」。
//   守：① 7 + 1 能并成 8 ② 塞不进的照旧 7 + 1（硬下限 = 顶杆）③ 只动最后两行（前面的折行一个不变）④ 最后一行不短（超过行宽三成、两小节以上）不并
//   ⑤ 并进来那一行不超出行宽、顶杆一个都没压破。排版那一层（三种谱 × 带歌词、并了之后不相叠、按节奏排时歌词不影响并不并）在 no-collide.test.ts。
import { describe, it, eq, assert } from "./runner.mjs";
import { mergeColumns, arrangeColumns, type ArrangeTrack } from "../src/render/frame/arrange.ts";
import { curveOf, SP_DEFAULTS } from "../src/render/spacing.ts";
import { PAPER_PARAMS } from "../src/render/layout-params.ts";
import { TPQ } from "../src/score/song.ts";

const LM = PAPER_PARAMS.staff.cozy.lastMerge!;
/** 一条轨：n 个小节，每小节 4 个四分音符；rod = 每个音右边顶杆多宽（大 = 压不动）。 */
function track(bars: number, rod = 1.4): ArrangeTrack<null> {
  const entries: ArrangeTrack<null>["entries"] = [];
  for (let b = 0; b < bars; b++) {
    for (let k = 0; k < 4; k++) { const tick = (b * 4 + k) * TPQ; entries.push({ tick, slot: 10, w: 0, chunk: { items: [{ row: 0, left: 0, right: rod, dur: TPQ }], span: TPQ }, ref: null }); }
    entries.push({ tick: (b + 1) * 4 * TPQ, slot: 0, w: 1.2, bar: true, ref: null });
  }
  return { entries, laneBase: 0 };
}
/** 排一遍：每行几个小节、每行右端（sp）、每一列的 x；merge = 开不开 7-F。 */
function lay(bars: number, width: number, merge: boolean, rod = 1.4) {
  const tr = [track(bars, rod)], cols = mergeColumns(tr);
  const a = arrangeColumns(cols, tr, { paperLen: bars * 4 * TPQ, spacing: { curve: curveOf("normal"), ...SP_DEFAULTS }, width, squeeze: 0.15, maxStretch: 1.3, endPad: 1.6, lineStart: () => 0, ...(merge ? { lastMerge: LM } : {}) });
  const per = a.lineFrom.map((from, s) => { const to = s + 1 < a.lineFrom.length ? a.lineFrom[s + 1]! : cols.length; return cols.slice(from, to).filter((c) => c.bar).length; });
  const ends = a.lineFrom.map((from, s) => { const to = s + 1 < a.lineFrom.length ? a.lineFrom[s + 1]! : cols.length; return a.xs[to - 1]! + a.ws[to - 1]!; });
  return { a, cols, per, ends };
}
/** 找一个宽度：不开 7-F 时折成 want（每行几个小节）。 */
function widthFor(bars: number, want: number[], rod = 1.4): number | null {
  for (let w = 20; w < 400; w += 0.25) if (lay(bars, w, false, rod).per.join(",") === want.join(",")) return w;
  return null;
}

describe("最后一行很短并进上一行（7-F，框架）", () => {
  it("7 + 1 → 8：并成一行，没超出行宽", () => {
    const w = widthFor(8, [7, 1]); assert(w !== null, "找得到 7 + 1 的宽度");
    const r = lay(8, w!, true);
    eq(r.per.join(","), "8"); assert(!!r.a.mergedLast, "交出「并了」");
    assert(r.ends[0]! <= w! + 1e-6, `行右端 ${r.ends[0]} ≤ ${w}`);
  });
  it("塞不进的照旧 7 + 1：音的顶杆压不动（硬下限 = 顶杆，不相撞）", () => {
    const w = widthFor(8, [7, 1], 5); assert(w !== null, "找得到 7 + 1 的宽度");
    const r = lay(8, w!, true, 5);
    eq(r.per.join(","), "7,1"); assert(!r.a.mergedLast);
  });
  it("并进来那一行：每个音之间不小于顶杆（没压破）", () => {
    const w = widthFor(8, [7, 1])!, r = lay(8, w, true), xs = r.a.xs;
    const notes = r.cols.map((c, k) => (c.bar ? -1 : k)).filter((k) => k >= 0);
    for (let i = 1; i < notes.length; i++) if (r.cols[notes[i]!]!.tick - r.cols[notes[i - 1]!]!.tick === TPQ && !r.cols.slice(notes[i - 1]! + 1, notes[i]!).some((c) => c.bar)) assert(xs[notes[i]!]! - xs[notes[i - 1]!]! >= 1.4 - 1e-6, `第 ${i} 个音离前一个 ${xs[notes[i]!]! - xs[notes[i - 1]!]!} < 顶杆 1.4`);
  });
  it("只动最后两行：前面的折行一个不变", () => {
    const w = widthFor(15, [7, 7, 1]); assert(w !== null, "找得到 7 + 7 + 1 的宽度");
    const off = lay(15, w!, false), on = lay(15, w!, true);
    eq(on.per.join(","), "7,8");
    eq(on.a.lineFrom[0], off.a.lineFrom[0]); eq(on.a.lineFrom[1], off.a.lineFrom[1]);
  });
  it("最后一行不短（不到一小节、也不到行宽的三成才算短）= 不并", () => {
    // 8 + 3：最后一行 3 小节，自然宽超过行宽三成 → 不并（就算压得进去）
    const w = widthFor(11, [8, 3]); assert(w !== null, "找得到 8 + 3 的宽度");
    eq(lay(11, w!, true).per.join(","), "8,3");
    // 8 + 2：两小节也可能不到三成 → 算短、并得进就并
    const w2 = widthFor(10, [8, 2]);
    if (w2 !== null) { const r = lay(10, w2, true), natLast = lay(10, w2, false).ends[1]!; if (natLast < LM.short * w2) eq(r.per.join(","), "10"); }
  });
  it("参数：两种谱都开、两档都开（短 = 三成、并的那一行弹簧最多压到七成）", () => {
    for (const k of ["staff", "jianpu"] as const) for (const d of ["cozy", "compact"] as const) eq(JSON.stringify(PAPER_PARAMS[k][d].lastMerge), JSON.stringify({ short: 0.3, squeeze: 0.3 }), `${k} ${d}`);
  });
});
