// 唱的语言按「句」判（engine/timeline.ts singLangs + splitByLang）。created 2026-10-13 by Claude Fable 5.1
// user「打了日文之后想换成中文翻译会说不能打汉字然后报错」→「每一段不行吗？每一段里面有假名就算日文」「就是句子的单位」。
import { describe, it, eq } from "./runner.mjs";
import { initState, tr, TPQ, type Token } from "../src/score/song.ts";
import { singLangs, splitByLang, songLangOf } from "../src/engine/timeline.ts";
import { singChunks } from "../src/score/lab-score.ts";
import { lyricIssues } from "../src/score/lyric-check.ts";

let nid = 8000;
const head = () => tr(initState()).slice(0, 3);   // ♩ = 90：一拍 0.67 s ≥ 0.25 s = 句界
const n = (lyric: string | null, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric });
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur });
const ph = (): Token => ({ kind: "phrase", id: nid++ });
const langsOf = (toks: Token[], bounds: number[] = []) => singLangs(toks, undefined, bounds, "n").map((l, i) => (toks[i].kind === "note" ? l : "·")).join(" ");

describe("唱的语言按句判", () => {
  it("一句里有假名 = 日（夹着的汉字画灰），只有汉字的句 = 中，只有字母的句 = 英", () => {
    const toks = [...head(), n("か"), n("星"), r(), n("月"), n("亮"), r(), n("la"), n("la")];
    eq(langsOf(toks), "· · · ja ja · zh zh · en en");
    const m = lyricIssues(toks, "tsukuyomi", (i) => singLangs(toks, undefined, [], "n")[i]);
    eq([...m.entries()].map(([i, x]) => `${(toks[i] as { lyric: string }).lyric}:${x.why}`).join(" "), "星:kanji", "日语句里的汉字照旧画灰；中文句 / 英文句的字不灰");
  });
  it("「句」记号也是句界（没有休止也切）；纸界也是", () => {
    const toks = [...head(), n("か"), n("な"), ph(), n("月"), n("亮")];
    eq(langsOf(toks), "· · · ja ja · zh zh");
    const toks2 = [...head(), n("か"), n("な"), n("月"), n("亮")];
    eq(langsOf(toks2), "· · · ja ja ja ja", "同一句里有假名 = 整句日语");
    eq(langsOf(toks2, [5]), "· · · ja ja zh zh", "纸界切开 = 第二张纸只有汉字 = 中");
  });
  it("没字的句（哼）跟前一句；开头没字跟后面第一句有字的；整条没字 = 哼法定（la / 呜 = 中）", () => {
    eq(langsOf([...head(), n(null), r(), n("月"), r(), n(null), r(), n("か"), r(), n(null)]), "· · · zh · zh · zh · ja · ja");
    eq(songLangOf([...head(), n(null)], "la"), "zh"); eq(songLangOf([...head(), n(null)], "n"), "ja");
    eq(langsOf([...head(), n(null)]), "· · · ja");
  });
  it("唱的段按语言再切开：每段一种语言；整首一段（whole）也切", () => {
    const toks = [...head(), n("か"), n("な"), r(), n("月"), n("亮"), r(), n("う")];
    const langs = singLangs(toks, undefined, [], "n");
    const parts = (mode: "whole" | "phrase") => splitByLang(singChunks(toks, undefined, [], mode), langs).map(([a, b]) => `${langs[a]}:${toks.slice(a, b).flatMap((t) => (t.kind === "note" ? [(t as { lyric: string }).lyric] : [])).join("")}`).join(" ");
    eq(parts("whole"), "ja:かな zh:月亮 ja:う", "整首一段也按语言切成三段（休止留给前一段）");
    eq(parts("phrase"), "ja:かな zh:月亮 ja:う", "分句唱本来就是三段");
  });
  it("休止不够长 = 同一句：かな月亮 整句日语，月 / 亮 画灰（写成假名）", () => {
    const toks = [...head(), n("か"), n("な"), r(TPQ / 8), n("月"), n("亮")];   // 三十二分休止 0.08 s < 0.25 s
    eq(langsOf(toks), "· · · ja ja · ja ja");
    const m = lyricIssues(toks, "tsukuyomi", (i) => singLangs(toks, undefined, [], "n")[i]);
    eq([...m.values()].map((x) => x.why).join(" "), "kanji kanji");
  });
});
