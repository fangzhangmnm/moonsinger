// 小字自己占了一个音（っ / ゃ…）时月读照样能唱（2026-10-08 Opus 5.5）。user 报「90 sung syllables in the text, 92 in the score」（ふって / でっかい 的 っ 各占一个音），
//   「我大tsu小tsu大yo小yo确实分不清」→ 打字照原样，唱的那一路兜住：っ = 前一个音节后面停这么长、下一个字前面顿一下不换气（^）；ゃ… = 前一个音节拖过这个音。
import { describe, it, eq } from "./runner.mjs";
import { initState, withTrack, tr, toggleArtSel, select, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { splitSyllables, ELISION } from "../src/score/lyrics.ts";

let nid = 7000;
const n = (lyric: string | null): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric });
function song(items: Token[]): EditorState { const st = initState(); return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...items]) }; }
const lab = (st: EditorState) => toLabScore(tr(st), "n");

describe("っ 自己占一个音", () => {
  it("ふ | っ | て = 两个音节：ふっ 后面停一个四分（2 个八分）、て 前面顿一下不换气", () => {
    const L = lab(song([n("ふ"), n("っ"), n("て")]));
    eq(L.SCORE.length, 2); eq(L.SCORE[0].kana, "ふっ"); eq(L.SCORE[0].rest, 2); eq(L.SCORE[1].before, "^"); eq(L.TEXT, "ふっ、て。");
  });
  it("前面本来要换气（v）= 照旧换气，不被 ^ 顶掉", () => {
    let st = song([n("ふ"), n("っ"), n("て")]); const i = tr(st).findIndex((t) => t.kind === "note");
    st = toggleArtSel(select(st, i, i + 1), "breath");
    eq(lab(st).SCORE[1].before, "v");
  });
  it("开头就是 っ = 当休止（不出音节）", () => { const L = lab(song([n("っ"), n("て")])); eq(L.SCORE.length, 1); eq(L.SCORE[0].kana, "て"); });
  it("一个音上「ふ‿っ」= 一个音节 ふっ（不加停顿）", () => {
    const L = lab(song([n(`ふ${ELISION}っ`), n("て")])); eq(L.SCORE.map((e) => e.kana).join(","), "ふっ,て"); eq(L.SCORE[0].rest, undefined);
  });
});

describe("ゃ… 自己占一个音", () => {
  it("き | ゃ = 一个音节 きゃ，拖过两个音", () => { const L = lab(song([n("き"), n("ゃ")])); eq(L.SCORE.length, 1); eq(L.SCORE[0].kana, "きゃ"); eq(L.SCORE[0].notes.length, 2); });
});

describe("user 那首（団子大家族）：っ 各占一个音 = 92 个音，唱的音节 = 90", () => {
  it("和输入法一次上屏（っ 并进前一个）一样多", () => {
    const text = "なかよし だんご てをつなぎ おおきな まるいわに なるよ まちを つくり だんご ほしのうえ みんなで わらいあうよ うさぎも さらで てをふって みてる でっかい おつきさま うれしいこと かなしいことも ぜんぶ まるめて";
    const merged = splitSyllables(text).map((s) => s.text);
    const notes = merged.flatMap((k) => (k.length > 1 && k.endsWith("っ") ? [k.slice(0, -1), "っ"] : [k]));   // っ 拆出来自己占一个音
    eq(notes.length, 92); eq(merged.length, 90);
    const L = lab(song(notes.map((k) => n(k))));
    eq(L.SCORE.length, 90); eq(L.SCORE.map((e) => e.kana).join(""), merged.join(""));
  });
});
