// 唱不出来的歌词（画灰 + 明说）。created 2026-10-08 by Claude Opus 5.5；user「不能成功发音识别的歌词也标灰，我觉得这个可以变成这个项目的纪律了哈哈」
import { describe, it, eq } from "./runner.mjs";
import { lyricIssues, kanaBeats } from "../src/score/lyric-check.ts";
import { TPQ, type Token } from "../src/score/song.ts";
import { ELISION, MELISMA_MARK } from "../src/score/lyrics.ts";

let id = 1;
const n = (lyric: string | null): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric });
const why = (toks: Token[], eng: string, lang: "ja" | "zh" | "en") => { const m = lyricIssues(toks, eng, lang); return toks.map((_, i) => m.get(i)?.why ?? "-").join(" "); };

describe("月读（日语）", () => {
  it("假名一拍 = 好；小字 / 促音 / ん = 好；汉字 / 字母 / 两拍 = 灰", () => {
    const toks = [n("な"), n("きゃ"), n("ふっ"), n("っ"), n("ん"), n("星"), n("la"), n("ラー"), n(MELISMA_MARK), n(null), n(`だ${ELISION}ん`)];
    eq(why(toks, "tsukuyomi", "ja"), "- - - - - kanji script beats - - -");
    eq(kanaBeats("ラー"), 2); eq(kanaBeats("きゃ"), 1); eq(kanaBeats("ふっ"), 1);
  });
});
describe("月读（中文 / 英文）", () => {
  it("中文：一个音一个汉字；假名 / 字母 = 灰；两个字 = 灰", () => eq(why([n("我"), n("你好"), n("あ"), n("ok")], "tsukuyomi", "zh"), "- beats script script"));
  it("英文：字母 = 好；汉字 = 灰", () => eq(why([n("love"), n("爱")], "tsukuyomi", "en"), "- script"));
});
describe("不唱字的演奏者", () => {
  it("元音版 / 乐器：有字的音都灰；没人上场 = 不逐个画灰", () => {
    const toks = [n("あ"), n(null), n(MELISMA_MARK)];
    eq(why(toks, "vowel-sampler", "ja"), "notSung - -"); eq(why(toks, "soundfont", "ja"), "notSung - -"); eq(why(toks, "unknown", "ja"), "- - -");
  });
});
