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
  it("哼的字：没歌词的音按这首歌的设置唱（默认嗯），日语 / 中文各换各的字", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "んん");
    st = setHum(st, "la"); eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "らら");
    st = setHum(st, "n");
    eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "んん");
    eq(toLabScore(st.song, "zh").SCORE.map((e) => e.kana).join(""), "嗯嗯");
    st = setHum(st, "o"); eq(toLabScore(st.song, "ja").SCORE.map((e) => e.kana).join(""), "おお"); eq(toLabScore(st.song, "zh").SCORE.map((e) => e.kana).join(""), "哦哦");
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

// 一个音上几个字（「+」= elision；user「日语歌词需支持一个音对应两个假名 也许不一定两个，然后中文也一样」→ 点头）。edited by Claude Opus 5.5 2026-10-07
import { splitSyllables as _split, lyricShow, ELISION, distributeFrom as _dist } from "../src/score/lyrics.ts";
import { toLabScore as _lab } from "../src/score/lab-score.ts";
import { saveMxl as _save, openBytes as _open, emptyExtras as _ex } from "../src/format/project.ts";
import { initState as _init, writePitch as _wp, TPQ as _Q } from "../src/score/song.ts";
describe("一个音上几个字（+）", () => {
  it("だんご、だ+んご、 = だ ん ご だん ご；中文三个字也行；+ 开头 = 并进前一个音", () => {
    eq(_split("だんご、だ+んご、").map((s) => s.text).join("/"), `だ/ん/ご/だ${ELISION}ん/ご`);
    eq(_split("我+的+歌").map((s) => s.text).join("/"), `我${ELISION}的${ELISION}歌`);
    const lead = _split("+ん");
    eq(lead.length, 1); eq(lead[0].joinPrev, true); eq(lead[0].text, "ん");
    eq(_split("ご＋、だ").map((s) => s.text).join("/"), `ご${ELISION}だ`, "全角 ＋ 也认，中间的标点照旧跳过");
  });
  it("纸上：中日文两个字之间不画弧，拉丁字母之间画 ‿", () => {
    eq(lyricShow(`だ${ELISION}ん`), "だん"); eq(lyricShow(`me${ELISION}and`), `me${ELISION}and`);
  });
  it("唱：这个音平分给几个字；存 MusicXML = <elision/>，打开还是一个音", () => {
    let st = _init();
    st = _wp(st, { step: "C", alter: 0, octave: 4 });
    st = _dist(st, st.song.tokens.length - 1, _split("だ+ん")).st;
    const sc = _lab(st.song, "ja");
    eq(sc.SCORE.map((e) => `${e.kana}:${e.notes[0][1]}`).join(" "), `だ:${st.song.tokens[st.song.tokens.length - 1].kind === "note" ? (st.song.tokens[st.song.tokens.length - 1] as { dur: number }).dur / (_Q / 2) / 2 : 0} ん:${(st.song.tokens[st.song.tokens.length - 1] as { dur: number }).dur / (_Q / 2) / 2}`);
    const bytes = _save({ song: st.song, hum: st.song.hum, quality: "full", extras: _ex(), app: "t", date: "d" });
    const o = _open("x.mxl", bytes);
    eq((o.song.tokens[o.song.tokens.length - 1] as { lyric: string }).lyric, `だ${ELISION}ん`);
  });
});
