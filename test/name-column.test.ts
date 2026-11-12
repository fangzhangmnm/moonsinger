// 名字那一栏的宽只看谱上真有的字（施工单第 12 条 12-2，统筹选 A；user「声部上面的两个钮还是难看…打印的时候会很奇怪，能不能排版的时候不看这些钮」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。原来这一栏至少 6.4 个线间距（NAME_MIN，为了覆盖层两颗钮放得下），名字短时印出来左边空一大块。
//   守：两个都比原来那个最小宽窄的名字，第一行第一个音的 x 不一样（栏宽跟着名字走）；简谱整套鼓的图例照样放得下（它自己报宽，见 test/jianpu.test.ts 那一条）。
import { describe, it, assert } from "./runner.mjs";
import { initState, withTrack, tr, TPQ, type Token } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";
import { editorBase } from "./fixtures/layout/cases.ts";

const notes: Token[] = Array.from({ length: 4 }, (_, k) => ({ kind: "note", id: 9900 + k, pitch: { step: "CDEF"[k], alter: 0, octave: 5 }, dur: TPQ, lyric: null }) as Token);
const firstX = (name: string): number => {
  const st = initState(), song = withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...notes]);
  const L = engrave(song, editorBase(song, [name]));
  return Math.min(...L.notes.map((n) => n.x));
};
describe("名字那一栏只看名字（12-2）", () => {
  it("「V」和「VVVV」（都比原来 6.4 个线间距的最小宽窄）：第一个音的位置不一样——栏宽跟着名字走，不再为钮留一块", () => {
    const a = firstX("V"), b = firstX("VVVV");
    assert(a < b - 1, `「V」${a.toFixed(1)} 应该比「VVVV」${b.toFixed(1)} 靠左`);
  });
});
