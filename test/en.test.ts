// 英文：元音核心切分、音节拼回单词、音节和核心对齐、乐谱转换。created 2026-10-07 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { nucleusStarts, wordsOf, alignEnglish } from "../src/singer/en-front.mjs";
import { initState, writeDegree, setHum, type NoteTok, tr } from "../src/score/song.ts";
import { applyLyricLine } from "../src/score/lyrics.ts";
import { toLabScore } from "../src/score/lab-score.ts";

const T = (s: string) => s.split(" ");
const E = (kana: string, len = 1, x: Record<string, unknown> = {}) => ({ kana, notes: [[60, len]] as [number, number][], ...x });

describe("英文：元音核心", () => {
  it("双元音 / 长元音算一个核心，其余元音字符各一个", () => {
    eq(JSON.stringify(nucleusStarts(T("f ˈ a ɪ ɚ"))), "[2,4]");            // fire = aɪ + ɚ
    eq(JSON.stringify(nucleusStarts(T("ˈ ɛ v ɚ i ː"))), "[1,3,4]");        // every = ɛ ɚ iː
    eq(JSON.stringify(nucleusStarts(T("s t ˈ ɑ ː ɹ"))), "[3]");            // star
    eq(JSON.stringify(nucleusStarts(T("m m"))), "[]");                     // mm：没有元音
  });
  it("音节按 hyph 拼回单词", () => {
    eq(wordsOf([E("hap", 1, { hyph: true }), E("py"), E("birth", 1, { hyph: true }), E("day")]).join(" "), "happy birthday");
  });
});

describe("英文：音节和元音核心对齐", () => {
  const al = (es: ReturnType<typeof E>[], n: number[]) => alignEnglish(es, n).entries.map((e) => `${e.kana}:${e.notes.map(([, l]) => l).join("+")}${e.rest ? `r${e.rest}` : ""}`).join(" ");
  it("一样多 = 一对一", () => { eq(al([E("hap", 1, { hyph: true }), E("py")], [2]), "hap:1 py:1"); });
  it("核心少：最后一个核心拖过剩下的音", () => { eq(al([E("ev", 1, { hyph: true }), E("ry", 2)], [1]), "evry:1+2"); });
  it("核心多：最后一个音节的音分给剩下的核心，音不够就平均切开", () => {
    eq(al([E("ev", 1, { hyph: true }), E("ery", 2)], [3]), "ev:1 ery:1 ery:1");
    eq(al([{ kana: "fire", notes: [[60, 1], [62, 1]] }], [2]), "fire:1 fire:1");
  });
  it("没有元音的词：时长并成前一条的休止；在开头就加在前奏后面", () => {
    eq(al([E("la"), E("mm", 2), E("la")], [1, 0, 1]), "la:1r2 la:1");
    eq(alignEnglish([E("mm", 2), E("la")], [0, 1]).leadRest, 2);
  });
  it("休止跟着词的最后一个核心走", () => { eq(al([E("fire", 2, { rest: 1 })], [2]), "fire:1 fire:1r1"); });
});

describe("英文：乐谱转换", () => {
  it("英文歌词带 hyph、TEXT 拼回单词；哼的字用英文", () => {
    let st = initState(); for (const d of [1, 1, 2, 1]) st = writeDegree(st, d, "near"); st = applyLyricLine(st, "hap-py birth-day");
    const lab = toLabScore(tr(st), st.song.hum, "en");
    eq(lab.TEXT, "happy birthday"); eq(JSON.stringify(lab.SCORE.map((e) => !!e.hyph)), "[true,false,true,false]");
    st = initState(); st = writeDegree(st, 1, "near"); st = setHum(st, "n");
    eq(toLabScore(tr(st), st.song.hum, "en").SCORE[0].kana, "hum"); eq((tr(st).at(-1) as NoteTok).lyric, null);
  });
});
