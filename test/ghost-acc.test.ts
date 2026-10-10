// 鬼音符的升降号 = 真写下去会画的那个（song.ts shownAccAt；v0.10.23）。created 2026-10-10 by Claude Opus 5.5
// user「鬼音符应该按照对应的谱号和临时升降号来显示升降号。和对应的真音符要一致」
import { describe, it, eq } from "./runner.mjs";
import { shownAccAt, TPQ, type Token } from "../src/score/song.ts";

let nid = 9500;
const key = (fifths: number): Token => ({ kind: "key", id: nid++, fifths } as Token);
const time = (beats = 4, beatType = 4): Token => ({ kind: "time", id: nid++, beats, beatType } as Token);
const n = (step: string, alter = 0, octave = 4, dur = TPQ, tie = false): Token => ({ kind: "note", id: nid++, pitch: { step, alter, octave }, dur, lyric: null, ...(tie ? { tie: true } : {}) } as Token);
const bar = (): Token => ({ kind: "bar", id: nid++ } as Token);
const P = (step: string, alter = 0, octave = 4) => ({ step, alter, octave }) as never;

describe("鬼音符的升降号（和排版同一个规矩）", () => {
  it("调号里有的不画；出了调号 = 还原号", () => {
    const t = [key(2), time(), n("E")];   // D 大调
    eq(shownAccAt(t, t.length, P("F", 1)), null, "F♯ 在调号里");
    eq(shownAccAt(t, t.length, P("F", 0)), 0, "F 本位 = 还原号");
    eq(shownAccAt(t, t.length, P("B", -1)), -1, "B♭ = 降号");
  });
  it("这一小节前面已经升过 = 不再画；同一个音级换回来 = 还原号；别的八度各算各的", () => {
    const t = [key(0), time(), n("F", 1)];
    eq(shownAccAt(t, t.length, P("F", 1)), null);
    eq(shownAccAt(t, t.length, P("F", 0)), 0);
    eq(shownAccAt(t, t.length, P("F", 1, 5)), 1, "高八度的 F♯ 照画");
  });
  it("小节线（自动 / 人插的）之后重新算", () => {
    const auto = [key(0), time(), n("F", 1), n("C"), n("D"), n("E")];   // 4/4 正好满一小节
    eq(shownAccAt(auto, auto.length, P("F", 1)), 1, "自动小节线之后 F♯ 又要画");
    const manual = [key(0), time(), n("F", 1), bar()];
    eq(shownAccAt(manual, manual.length, P("F", 1)), 1, "人插的「|」之后也是");
  });
  it("跨过小节线的音：后半截（连音线连过来的）不算到新的一小节", () => {
    const t = [key(0), time(), n("C"), n("D"), n("E"), n("F", 1, 4, TPQ * 2)];   // F♯ 二分音符从第 4 拍跨进下一小节
    eq(shownAccAt(t, t.length, P("F", 1)), 1, "新的一小节里 F♯ 要画");
    const tied = [key(0), time(), n("C"), n("D"), n("E"), n("F", 1), n("F", 1, 4, TPQ, true)];   // 连音线连过来的 F♯ 在第二小节开头
    eq(shownAccAt(tied, tied.length, P("F", 1)), 1, "连过来的不算：后面的 F♯ 照画");
  });
});
