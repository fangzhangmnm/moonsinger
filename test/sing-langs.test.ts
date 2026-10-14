// 唱的语言 = 小月相唱的那一段的语言（engine/timeline.ts sungPlan；切分只有 singChunks 一份）。created 2026-10-13 by Claude Fable 5.1；rewritten by Claude Opus 5.5 同日
// user「打了日文之后想换成中文翻译会说不能打汉字然后报错」→「每一段里面有假名就算日文」「就是句子的单位」→「小月相不是本来就是默认模式一句一句吃的吗，用同一个深模块」。
import { describe, it, eq } from "./runner.mjs";
import { initState, tr, TPQ, type Token } from "../src/score/song.ts";
import { sungPlan, songLangOf } from "../src/engine/timeline.ts";
import { singChunks, type SingChunkMode } from "../src/score/lab-score.ts";
import { lyricIssues } from "../src/score/lyric-check.ts";

let nid = 8000;
const head = () => tr(initState()).slice(0, 3);   // ♩ = 90：一拍休止 0.67 s ≥ 0.25 s = 段界（每句）
const n = (lyric: string | null, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric });
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur });
const ph = (): Token => ({ kind: "phrase", id: nid++ });
const plan = (toks: Token[], mode: SingChunkMode = "phrase", bounds: number[] = []) => sungPlan(toks, undefined, bounds, mode, "n");
const langsOf = (toks: Token[], mode: SingChunkMode = "phrase", bounds: number[] = []) => plan(toks, mode, bounds).at.map((l, i) => (toks[i].kind === "note" ? l : "·")).join(" ");
const segs = (toks: Token[], mode: SingChunkMode = "phrase", bounds: number[] = []) => { const p = plan(toks, mode, bounds); return p.ranges.map(([a, b], k) => `${p.langs[k]}:${toks.slice(a, b).flatMap((t) => (t.kind === "note" ? [(t as { lyric: string | null }).lyric ?? "_"] : [])).join("")}`).join(" "); };
const grays = (toks: Token[], mode: SingChunkMode = "phrase") => { const at = plan(toks, mode).at, m = lyricIssues(toks, "words", (i) => at[i]); return [...m.entries()].map(([i, x]) => `${(toks[i] as { lyric: string }).lyric}:${x.why}`).join(" "); };

describe("唱的语言 = 小月相唱的那一段", () => {
  const song = [...head(), n("か"), n("星"), r(), n("月"), n("亮"), r(), n("la"), n("la")];
  it("每句（默认）：一段有假名 = 日（夹着的汉字画灰），只有汉字 = 中，只有字母 = 英", () => {
    eq(segs(song), "ja:か星 zh:月亮 en:lala");
    eq(grays(song), "星:kanji", "日语段里的汉字照旧画灰；中文段 / 英文段的字不灰");
  });
  it("段和唱的完全是同一份切分（singChunks）", () => {
    for (const mode of ["phrase", "sheet", "whole"] as const) eq(JSON.stringify(plan(song, mode, [6]).ranges), JSON.stringify(singChunks(song, undefined, mode === "sheet" ? [6] : [], mode)), mode);
  });
  it("每张纸：一张纸里有假名就整张日语；只有汉字的纸 = 中", () => {
    const toks = [...head(), n("か"), r(), n("月"), n("亮"), n("天"), n("空")];
    eq(segs(toks, "sheet", [5]), "ja:か zh:月亮天空", "纸界在「か 休止」之后");
    eq(segs(toks, "sheet", [7]), "ja:か月亮 zh:天空", "同一张纸里有假名 = 那张纸的汉字都按日语（画灰）");
    eq(grays(toks, "whole"), "月:kanji 亮:kanji 天:kanji 空:kanji", "一整首：整首有假名 = 整首日语（= 原来的行为）");
  });
  it("「句」记号不是段界（小月相不在那儿切）；休止不够长也不是", () => {
    eq(langsOf([...head(), n("か"), n("な"), ph(), n("月"), n("亮")]), "· · · ja ja · ja ja");
    eq(langsOf([...head(), n("か"), n("な"), r(TPQ / 8), n("月"), n("亮")]), "· · · ja ja · ja ja", "三十二分休止 0.08 s < 0.25 s");
  });
  it("没字的段（哼）跟前一段；开头没字跟后面第一个有字的段；整条没字 = 哼法定（la / 呜 = 中）", () => {
    eq(segs([...head(), n(null), r(), n("月"), r(), n(null), r(), n("か"), r(), n(null)]), "zh:_ zh:月 zh:_ ja:か ja:_");
    eq(songLangOf([...head(), n(null)], "la"), "zh"); eq(songLangOf([...head(), n(null)], "n"), "ja");
    eq(segs([...head(), n(null)]), "ja:_");
  });
});
