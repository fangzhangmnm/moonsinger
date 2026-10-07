// created 2026-10-06 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { splitSyllables, applyLyricLine } from "../src/score/lyrics.ts";
import { initState, writeDegree, setCaret, writeBar, extend, TPQ, type NoteTok } from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { setHum } from "../src/score/song.ts";
const H = 3;   // 谱头三个记号

describe("lyrics", () => {
  it("假名一拍一个：小字并进前一个，ん 自己一个，ー 是拖腔", () => {
    const j = (t: string) => splitSyllables(t).map((s) => s.text + (s.hyph ? "-" : "")).join(" ");
    eq(j("じゅうごや"), "じゅ う ご や");
    eq(j("でっかい"), "でっ か い");
    eq(j("みてはーーねる"), "み て は ー ー ね る");
    eq(j("みては~~ねる"), "み て は ー ー ね る");
    eq(j("だんご、てを"), "だ ん ご て を");
  });
  it("汉字一字一个；英文空格分词、词里 - = 断音节（hyph）；~ _ = 拖腔", () => {
    const j = (t: string) => splitSyllables(t).map((s) => s.text + (s.hyph ? "-" : "")).join(" ");
    eq(j("小兔子 乖乖，"), "小 兔 子 乖 乖");
    eq(j("hap-py birth-day to you"), "hap- py birth- day to you");
    eq(j("oh ~ yeah _"), "oh ー yeah ー");
  });
  it("先写曲：光标在末尾 → 从第一个没歌词的音开始贴", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    st = applyLyricLine(st, "うさ");
    eq(st.song.tokens.map((t) => (t as NoteTok).lyric).join(""), "うさ");
  });
  it("先写词：空歌里打一行 → 每个字一个空音高的音；光标不动，数字接着填音高", () => {
    let st = initState(); st = applyLyricLine(st, "うさぎ");
    eq(st.song.tokens.length, H + 3); eq(st.caret, H);
    eq(st.song.tokens.slice(H).every((t) => t.kind === "note" && t.pitch === null && t.dur === TPQ / 2), true);
    st = writeDegree(st, 4, "near"); st = writeDegree(st, 4, "near");
    eq(st.song.tokens.slice(H).map((t) => (t as NoteTok).pitch ? pitchName((t as NoteTok).pitch!) : "?").join(" "), "F4 F4 ?");
    eq(st.song.tokens.length, H + 3);
  });
  it("改中间：光标放在某个音前，只覆盖从那开始的几个", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near"); st = writeDegree(st, 3, "near");
    st = applyLyricLine(st, "あいう"); st = setCaret(st, H + 1); st = applyLyricLine(st, "か");
    eq(st.song.tokens.map((t) => (t as NoteTok).lyric).join(""), "あかう");
  });
  it("哼的字：没歌词的音按这首歌的设置唱，日语 / 中文各换各的字", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "らら");
    st = setHum(st, "n");
    eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "んん");
    eq(toLabScore(st.song, "zh").SCORE.map((e) => e.kana).join(""), "嗯嗯");
  });
  it("哼的字在给核心的乐谱里带 hum 标记（核心的哼参数只管这些），有歌词的不带", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near"); st = applyLyricLine(st, "あ");
    eq(JSON.stringify(toLabScore(st.song, "ja").SCORE.map((e) => e.hum ?? false)), "[false,true]");
  });
  it("连音线连着的音（tie）不吃歌词", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeBar(st); st = extend(st); st = writeDegree(st, 2, "near");
    st = applyLyricLine(st, "啊呀");
    eq(st.song.tokens.filter((t) => t.kind === "note").map((t) => (t as NoteTok).lyric ?? "·").join(""), "啊·呀");
  });
});
