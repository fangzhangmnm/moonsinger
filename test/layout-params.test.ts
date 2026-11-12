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
    assert(jp.top > 0 && jp.bottom < 4 && jp.bottom > jp.top, "数字行有自己的行身");
    // 一首没有歌词、没有记号的长歌，切成简谱：中间那几行（谱头不在、墨在最小值里）的行高 = 数字行的「没歌词」最小行高
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    let id = 1000; const body = Array.from({ length: 64 }, (_, i) => ({ kind: "note", pitch: { step: "CDEFGAB"[i % 7] as "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null, id: id++ }) as Token);
    const sp = 10, heights = (barNumbers?: "off") => {
      let s: Song = { ...st0.song, ...(barNumbers ? { barNumbers } : {}), papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...paper.tracks[part]!, ...body] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const L = engrave(s, { width: 600, sp, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      const mid = L.systems.filter((r) => r.kind === "jianpu").slice(1, -1);
      assert(mid.length >= 2, "折成了好几行");
      return mid.map((r) => Math.round(((r.bottom - r.top) / sp) * 100) / 100);
    };
    for (const h of heights("off")) eq(h, ROW_PARAMS.jianpu.cozy.rowHNoLyric, "不印小节号：数字行的行高 = 最小值");
    for (const h of heights()) assert(h <= ROW_PARAMS.jianpu.cozy.rowHNoLyric + 1, `印小节号：最多高一格（${h}）——小节号贴着行身，不按五线谱躲符干的 2.4`);
  });
});
