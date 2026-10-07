// pad 的调式表测试：每个调式按音高排好、主音在表里、梯子上的音对（1=C 羽 = A C D E G，和声小调有 G♯ …）。
// created 2026-10-07 by Claude Opus 5.5（user「1=F能不能也做成两个的滚轮，右边可以换调性。多放几种。五声民族之类的全一点」）
import { describe, it, eq, assert } from "./runner.mjs";
import { SCALES, scaleById, ladderAt, ladderFirstAtOrAbove, ladderHome, degLabel } from "../src/score/scales.ts";
import { midiOf, pitchName, diatonicIndex } from "../src/score/pitch.ts";

const C4 = diatonicIndex({ step: "C", alter: 0, octave: 4 });
const names = (id: string, k0: number, n: number, tonicD = C4, f = 0) =>
  Array.from({ length: n }, (_, i) => pitchName(ladderAt(scaleById(id), k0 + i, tonicD, f).pitch)).join(" ");

describe("调式表", () => {
  it("id 不重复、名字不重复、主音在表里", () => {
    eq(new Set(SCALES.map((s) => s.id)).size, SCALES.length);
    eq(new Set(SCALES.map((s) => s.name)).size, SCALES.length);
    for (const s of SCALES) assert(s.home >= 0 && s.home < s.degs.length, `${s.id} 的主音不在表里`);
  });
  it("每个调式一个八度里按音高严格上行（梯子不会倒着走、不会重音）", () => {
    for (const s of SCALES) {
      const m = Array.from({ length: s.degs.length * 2 + 1 }, (_, k) => midiOf(ladderAt(s, k - s.degs.length, C4, 0).pitch));
      for (let i = 1; i < m.length; i++) assert(m[i] > m[i - 1], `${s.id} 第 ${i} 格没往上走：${m.join(",")}`);
      eq(m[s.degs.length * 2] - m[0], 24, `${s.id} 两个八度不是 24 个半音`);
    }
  });
  it("梯子上的音", () => {
    eq(names("major", 0, 8), "C4 D4 E4 F4 G4 A4 B4 C5");
    eq(names("yu", ladderHome(scaleById("yu"), C4, 0), 6), "A3 C4 D4 E4 G4 A4");   // 1=C 羽调式：主音 A（离 do 最近的那个）
    eq(names("harmonic-minor", -2, 8), "A3 B3 C4 D4 E4 F4 G#4 A4");
    eq(names("blues", 0, 7), "C4 Eb4 F4 Gb4 G4 Bb4 C5");
    eq(names("miyakobushi", 1, 5), "E4 F4 A4 B4 C5");
    eq(names("major", 0, 8, diatonicIndex({ step: "D", alter: 0, octave: 4 }), 2), "D4 E4 F#4 G4 A4 B4 C#5 D5");   // 1=D
    eq(names("yanyue", 6, 1, diatonicIndex({ step: "F", alter: 0, octave: 4 }), -1), "Eb5");   // 1=F 燕乐的 ♭7
    eq(names("chromatic", 0, 13).split(" ").length, 13);
  });
  it("绝对排法：第一个 ≥ C4 的音", () => {
    eq(pitchName(ladderAt(scaleById("major"), ladderFirstAtOrAbove(scaleById("major"), 60, C4, 0), C4, 0).pitch), "C4");
    const D4 = diatonicIndex({ step: "D", alter: 0, octave: 4 });
    eq(pitchName(ladderAt(scaleById("major"), ladderFirstAtOrAbove(scaleById("major"), 60, D4, 2), D4, 2).pitch), "C#4");   // 1=D：C♯
    eq(pitchName(ladderAt(scaleById("gong"), ladderFirstAtOrAbove(scaleById("gong"), 60, D4, 2), D4, 2).pitch), "D4");      // 1=D 宫：D E F♯ A B → C4 以上第一个是 D4
  });
  it("简谱写法", () => { eq(scaleById("blues").degs.map(degLabel).join(" "), "1 ♭3 4 ♭5 5 ♭7"); });
});
