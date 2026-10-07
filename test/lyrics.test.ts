// created 2026-10-06 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { splitSyllables, applyLyricLine } from "../src/score/lyrics.ts";
import { initState, writeDegree, setCaret, TPQ, type NoteTok } from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";

describe("lyrics", () => {
  it("假名一拍一个：小字并进前一个，ん 自己一个，ー 是拖腔", () => {
    eq(splitSyllables("じゅうごや").join(" "), "じゅ う ご や");
    eq(splitSyllables("でっかい").join(" "), "でっ か い");
    eq(splitSyllables("みてはーーねる").join(" "), "み て は ー ー ね る");
    eq(splitSyllables("だんご、てを").join(" "), "だ ん ご て を");
  });
  it("汉字一字一个；拉丁字母一词一个；标点空格跳过", () => {
    eq(splitSyllables("小兔子 乖乖，").join(" "), "小 兔 子 乖 乖");
    eq(splitSyllables("la la-la").join(" "), "la la ー la");
  });
  it("先写曲：光标在末尾 → 从第一个没歌词的音开始贴", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    st = applyLyricLine(st, "うさ");
    eq(st.song.tokens.map((t) => (t as NoteTok).lyric).join(""), "うさ");
  });
  it("先写词：空歌里打一行 → 每个字一个空音高的音；光标不动，数字接着填音高", () => {
    let st = initState(); st = applyLyricLine(st, "うさぎ");
    eq(st.song.tokens.length, 3); eq(st.caret, 0);
    eq(st.song.tokens.every((t) => t.kind === "note" && t.pitch === null && t.dur === TPQ), true);
    st = writeDegree(st, 4, "near"); st = writeDegree(st, 4, "near");
    eq(st.song.tokens.map((t) => (t as NoteTok).pitch ? pitchName((t as NoteTok).pitch!) : "?").join(" "), "F4 F4 ?");
    eq(st.song.tokens.length, 3);
  });
  it("改中间：光标放在某个音前，只覆盖从那开始的几个", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near"); st = writeDegree(st, 3, "near");
    st = applyLyricLine(st, "あいう"); st = setCaret(st, 1); st = applyLyricLine(st, "か");
    eq(st.song.tokens.map((t) => (t as NoteTok).lyric).join(""), "あかう");
  });
});
