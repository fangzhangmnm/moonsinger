// 排版进 worker（src/render/layout-worker.ts + engrave.ts 的 LayoutData / attachLayoutFns）：过线的平数据装回闭包后和原装的逐行相同；worker 的纯函数回的 parts = 主线程直接串的。
//   created 2026-10-21 by Claude Fable 5.1（user「怎么样大歌能做到实时输入演奏，尽量做到音游级别的延迟」）
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, attachLayoutFns, stripLayoutFns, TOP_LINE } from "../src/render/engrave.ts";
import { toSvgParts } from "../src/render/svg.ts";
import { runLayoutJob } from "../src/render/layout-worker.ts";
import { initState, type EditorState } from "../src/score/song.ts";
import { apply } from "../src/score/commands.ts";
import { sampleSong } from "./fixtures/format/sample-song.ts";

const measure = (s: string) => s.length * 7.5;   // 假尺子（node 没有 canvas）；worker 和主线程各自配真尺子，这里只核形状和闭包
function songs(): { name: string; st: EditorState; parts: Parameters<typeof engrave>[1]["parts"] }[] {
  let st = initState();
  for (let i = 0; i < 40; i++) st = apply(st, { k: "degree", degree: (i % 7) + 1, dir: "near" }, 1000 + i);
  const one = { name: "一条声部写 40 个音（折几行）", st, parts: [{ id: st.at.part, name: "V", empty: false }] };
  const sample = initState(sampleSong());
  const grand = { name: "冻结样本（两纸两声部）+ 大谱表", st: sample, parts: sample.song.parts.map((p, k) => ({ id: p.id, name: p.id, empty: false, ...(k === 0 ? { staves: 2 as const } : {}) })) };
  return [one, grand];
}
const opts = (parts: Parameters<typeof engrave>[1]["parts"], at: EditorState["at"], width = 420) => ({ width, sp: 10, at, parts, titlePlaceholder: true, autoBars: true, paperLabel: "A5", margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } });

describe("排版进 worker", () => {
  it("attachLayoutFns(stripLayoutFns(L))：yOf / dOf / lyricY 每一行、各种 d 都和 engrave 原装的闭包相同；lyricYs 对得上", () => {
    for (const { name, st, parts } of songs()) {
      const L = engrave(st.song, { ...opts(parts, st.at), measureLyric: measure });
      assert(L.systems.length >= 2, `${name}：至少两行`);
      eq(L.lyricYs.length, L.systems.length, `${name}：每行一个 lyricY`);
      const data = stripLayoutFns(L);
      assert(!("yOf" in data) && !("dOf" in data) && !("lyricY" in data), "平数据里没有闭包");
      structuredClone(data);   // 过线：有函数 / 不能克隆的东西在这儿就炸
      const R = attachLayoutFns(data);
      for (let r = 0; r < L.systems.length; r++) {
        eq(R.lyricY(r), L.lyricY(r), `${name}：lyricY(${r})`);
        for (const d of [TOP_LINE, 34, 30, 44, 20, 27.5]) { eq(R.yOf(r, d), L.yOf(r, d), `${name}：yOf(${r}, ${d})`); eq(R.dOf(r, L.yOf(r, d)), L.dOf(r, L.yOf(r, d)), `${name}：dOf 回去`); }
        eq(R.dOf(r, L.systems[r].staffTop + 3.3), L.dOf(r, L.systems[r].staffTop + 3.3), `${name}：dOf 取整一致`);
      }
    }
  });
  it("runLayoutJob：同一把尺子 = 和主线程直接 engrave + toSvgParts 的字符串逐组相同；data 里的命中数据和原装相同；seq 原样带回", () => {
    for (const { name, st, parts } of songs()) {
      const o = opts(parts, st.at);
      const want = engrave(st.song, { ...o, measureLyric: measure }), wantParts = toSvgParts(want);
      const r = runLayoutJob({ seq: 7, song: st.song, opts: o, font: "16px x" }, measure, () => 0);
      assert(!("error" in r), `${name}：没报错`);
      if ("error" in r) continue;
      eq(r.seq, 7); eq(r.parts.open, wantParts.open); eq(r.parts.groups.length, wantParts.groups.length, `${name}：组数`);
      for (let k = 0; k < wantParts.groups.length; k++) eq(r.parts.groups[k], wantParts.groups[k], `${name}：第 ${k} 组`);
      eq(JSON.stringify(r.data.notes), JSON.stringify(want.notes), `${name}：notes`); eq(JSON.stringify(r.data.systems), JSON.stringify(want.systems), `${name}：systems`);
      eq(JSON.stringify(r.data.slots), JSON.stringify(want.slots), `${name}：slots`); eq(r.data.height, want.height);
    }
  });
});
