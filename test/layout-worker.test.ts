// 排版进 worker（src/render/layout-worker.ts + engrave.ts 的 engraveData / LayoutData + staff/geometry.ts withStaffGeometry）：过线的是平数据，主线程装上 yOf / dOf / lyricY；worker 的纯函数回的 parts = 主线程直接串的。
//   1b-8（2026-11-11 Claude Opus 5.5）：原来的 strip / attachLayoutFns 退场；yOf / dOf / lyricY 逐行和底本相同由 test/score-surface.test.ts 核（快照每行采样）。
//   created 2026-10-21 by Claude Fable 5.1（user「怎么样大歌能做到实时输入演奏，尽量做到音游级别的延迟」）
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, engraveData } from "../src/render/engrave.ts";
import { TOP_LINE } from "../src/render/staff/glyphs.ts";
import { withStaffGeometry, caretSpan, previewAt, pitchAxis, bandTop } from "../src/render/staff/geometry.ts";
import { toSvgParts } from "../src/render/svg.ts";
import { runLayoutJob } from "../src/render/layout-worker.ts";
import { initState, type EditorState } from "../src/score/song.ts";
import { apply } from "../src/score/commands.ts";
import { sampleSong } from "./fixtures/format/sample-song.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const measure = (s: string) => s.length * 7.5;   // 假尺子（node 没有 canvas）；worker 和主线程各自配真尺子，这里只核形状和闭包
function songs(): { name: string; st: EditorState; parts: Parameters<typeof engrave>[1]["parts"] }[] {
  let st = initState();
  for (let i = 0; i < 40; i++) st = apply(st, { k: "degree", degree: (i % 7) + 1, dir: "near" }, 1000 + i);
  const one = { name: "一条声部写 40 个音（折几行）", st, parts: [{ id: st.at.part, name: "V", empty: false }] };
  const sample = initState(sampleSong());
  const grand = { name: "冻结样本（两纸两声部）+ 大谱表", st: sample, parts: sample.song.parts.map((p, k) => ({ id: p.id, name: p.id, empty: false, ...(k === 0 ? { staves: 2 as const } : {}) })) };
  return [one, grand];
}
const opts = (parts: Parameters<typeof engrave>[1]["parts"], at: EditorState["at"], width = 420) => ({ width, sp: 10, locale: "zh" as const, at, parts, titlePlaceholder: true, autoBars: true, paperLabel: "A5", margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } });

describe("排版进 worker", () => {
  it("engraveData = 平数据（能过线、没有函数）；withStaffGeometry 装上的 yOf / dOf / lyricY = 按定义算的（第五线 + (38 − 级) × 半个线间距、取整回去、lyricYs）", () => {
    for (const { name, st, parts } of songs()) {
      const o = { ...opts(parts, st.at), locale: "zh" as const, measure: createTextMeasure(measure) };
      const data = engraveData(st.song, o);
      assert(data.systems.length >= 2, `${name}：至少两行`);
      eq(data.lyricYs.length, data.systems.length, `${name}：每行一个 lyricY`);
      assert(!("yOf" in data) && !("dOf" in data) && !("lyricY" in data), "平数据里没有函数");
      structuredClone(data);   // 过线：有函数 / 不能克隆的东西在这儿就炸
      const R = withStaffGeometry(data), L = engrave(st.song, o), half = data.sp / 2;
      for (let r = 0; r < data.systems.length; r++) {
        const top = data.systems[r]!.staffTop;
        eq(R.lyricY(r), data.lyricYs[r], `${name}：lyricY(${r})`); eq(L.lyricY(r), R.lyricY(r), `${name}：engrave 交出去的 lyricY(${r})`);
        for (const d of [TOP_LINE, 34, 30, 44, 20, 27.5]) { eq(R.yOf(r, d), top + (TOP_LINE - d) * half, `${name}：yOf(${r}, ${d})`); eq(R.dOf(r, R.yOf(r, d)), Math.round(d), `${name}：dOf 回去`); eq(L.yOf(r, d), R.yOf(r, d), `${name}：engrave 交出去的 yOf`); }
      }
    }
  });
  it("几何纯函数（第二刀谱面视图改用）= 谱面视图现在的写法：光标 42→26 级、鬼音符的加线、纵向 ↔ 第几级、拖多远几级、选区带上沿 44 级", () => {
    const row = { staffTop: 100, staff: 1 as const }, half = 5, yOf = (d: number) => row.staffTop + (TOP_LINE - d) * half;
    const c = caretSpan(row, half); eq(c.y1, yOf(42)); eq(c.y2, yOf(26));
    eq(bandTop(row, half), yOf(44));
    const lo = previewAt(row, 24, half); eq(lo.y, yOf(24)); eq(JSON.stringify(lo.ledgers), JSON.stringify([yOf(28), yOf(26), yOf(24)]), "谱下方：28、26、24 三条加线");
    const hi = previewAt(row, 43, half); eq(JSON.stringify(hi.ledgers), JSON.stringify([yOf(40), yOf(42)]), "谱上方：40、42");
    eq(previewAt(row, 34, half).ledgers.length, 0, "谱里面不画加线");
    eq(pitchAxis.stepAt(row, yOf(31) + 1, half), 31); eq(pitchAxis.stepsOfDrag(-12, half), 2, "往上拖 12 px（2.4 个半格）= 2 级"); eq(pitchAxis.stepsOfDrag(8, half), -2);
  });
  it("runLayoutJob：同一把尺子 = 和主线程直接 engrave + toSvgParts 的字符串逐组相同；data 里的命中数据和原装相同；seq 原样带回", () => {
    for (const { name, st, parts } of songs()) {
      const o = opts(parts, st.at);
      const want = engrave(st.song, { ...o, locale: "zh", measure: createTextMeasure(measure) }), wantParts = toSvgParts(want);
      const r = runLayoutJob({ seq: 7, song: st.song, opts: o }, measure, () => 0);
      assert(!("error" in r), `${name}：没报错`);
      if ("error" in r) continue;
      eq(r.seq, 7); eq(r.parts.open, wantParts.open); eq(r.parts.groups.length, wantParts.groups.length, `${name}：组数`);
      for (let k = 0; k < wantParts.groups.length; k++) eq(r.parts.groups[k], wantParts.groups[k], `${name}：第 ${k} 组`);
      eq(JSON.stringify(r.data.notes), JSON.stringify(want.notes), `${name}：notes`); eq(JSON.stringify(r.data.systems), JSON.stringify(want.systems), `${name}：systems`);
      eq(JSON.stringify(r.data.slots), JSON.stringify(want.slots), `${name}：slots`); eq(r.data.height, want.height);
    }
  });
});
