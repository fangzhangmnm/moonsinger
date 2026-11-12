// chord-fold.test.ts —— 叠着的和弦折成和弦名（乐理模块 fold；谱面分家第五刀 5-4，UX 稿第 7 节「能还原就折」）：
//   照这个名字的标准排法（最低音起、其余一个八度内依次往上、不重复）还原得回这几个音（连拼法）才折；名字多对一 = 有歧义；人挑的还原不回 = 不折。
// created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
import { describe, it, eq, assert } from "./runner.mjs";
import { harmonyTheory } from "../src/theory/index.ts";
import { harmonyTags } from "../src/theory/index.ts";
import { initState, tr, headLen, TPQ, type Token } from "../src/score/song.ts";
import { spellMidi, type Pitch } from "../src/score/pitch.ts";

const th = harmonyTheory(), C = { fifths: 0, minor: false };
const P = (step: Pitch["step"], octave: number, alter = 0): Pitch => ({ step, alter, octave });
const fold = (ps: Pitch[], pin?: Parameters<NonNullable<typeof th.fold>>[2]) => th.fold!(ps, C, pin);
const pinNamed = (ps: Pitch[], name: string) => {
  const head = (() => { const t = tr(initState()); return t.slice(0, headLen(t)); })();
  const rd = harmonyTags(th, { tokens: [...head, { kind: "note", id: 1, pitch: ps[ps.length - 1]!, chord: ps.slice(0, -1), dur: TPQ, lyric: null } as Token] })[0]!.read;
  const g = rd.all.find((x) => x.name === name); assert(!!g, `候选里有 ${name}`); return th.pinOf(g!);
};

describe("叠着的和弦折成和弦名（乐理模块 fold）", () => {
  it("标准排法（最低音起、一个八度内依次往上、不重复）= 折；名字照认的", () => {
    eq(fold([P("C", 4), P("E", 4), P("G", 4)])?.name, "C");
    eq(fold([P("A", 3), P("C", 4), P("E", 4)])?.name, "Am");
    eq(fold([P("G", 3), P("B", 3), P("D", 4), P("F", 4)])?.name, "G7");
    eq(fold([P("E", 4), P("G", 4), P("C", 5)])?.name, "C/E", "转位写斜杠");
    eq(fold([P("C", 4), P("E", 4), P("G", 4)])?.bass.octave, 4, "最低音（八度用点标）");
    eq(fold([P("B", 3, -1), P("D", 4), P("F", 4)])?.name, "B♭");
    eq(fold([P("C", 4), P("E", 4), P("G", 4, 1)])?.name, "Caug", "增三和弦：升五度的拼法");
    eq(fold([P("C", 4), P("E", 4), P("A", 4, -1)])?.name, "A♭aug/C", "拼法定名字：C E A♭ 还原得回的是 A♭aug/C（Caug 要 G♯）");
  });
  it("还原不回 = 不折（照画数字）：开放排法、重复的音、省了音、拼法不一样", () => {
    eq(fold([P("C", 4), P("G", 4), P("E", 5)]), null, "开放排法（E 不在一个八度内）");
    eq(fold([P("C", 4), P("E", 4), P("G", 4), P("C", 5)]), null, "重复的音");
    eq(fold([P("C", 4), P("E", 4), P("B", 4, -1)]), null, "C7 省了五音");
    eq(fold([P("C", 4), P("D", 4)]), null, "两个音认不出和弦");
  });
  it("名字多对一 = 有歧义（小三角）；默认 = 根音是最低音的那个；人挑的还原得回 = 照挑的，还原不回 = 不折", () => {
    const ps = [P("C", 4), P("E", 4), P("G", 4), P("A", 4)], f = fold(ps)!;
    eq(f.name, "C6", "默认：根音是最低音的优先"); eq(f.ambiguous, true, "Am7/C 也还原得回 = 有歧义");
    eq(fold([P("C", 4), P("E", 4), P("G", 4)])!.ambiguous, false, "C 只有一个名字");
    eq(fold(ps, pinNamed(ps, "Am7/C"))!.name, "Am7/C", "挑了 Am7/C = 写 Am7/C");
    const g7 = pinNamed([P("G", 3), P("B", 3), P("D", 4), P("F", 4)], "G7");
    eq(fold(ps, g7), null, "挑的那个还原不回这几个音 = 不折");
  });
});
