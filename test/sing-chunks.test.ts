// 月读分段唱（src/score/lab-score.ts singChunks + toLabScore 的 range）。created 2026-10-08 深夜 by Claude Opus 5.5
// user「对我也觉得分开唱复用」「月读至少拆成句级别」「开关是歌手的属性，可以有不同的粒度」。
import { describe, it, eq } from "./runner.mjs";
import { initState, tr, TPQ, type Token } from "../src/score/song.ts";
import { singChunks, toLabScore, PHRASE_REST_SEC } from "../src/score/lab-score.ts";

let nid = 7000;
const head = () => tr(initState()).slice(0, 3);   // ♩ = 90
const n = (step: string, lyric: string, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step: step as "C", alter: 0, octave: 4 }, dur, lyric });
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur });

describe("月读分段唱", () => {
  const toks = [...head(), n("C", "か"), n("D", "な"), r(), n("E", "し"), r(TPQ / 8), n("F", "い"), r(), r(), n("G", "う")];
  it("每句：够长的休止后面起新的一段（♩=90 一拍 0.67 s ≥ 0.25 s；三十二分休止 0.08 s 不切）", () => {
    eq(PHRASE_REST_SEC, 0.25);
    const c = singChunks(toks, undefined, [0], "phrase").map(([a]) => (toks[a].kind === "note" ? (toks[a] as { lyric: string }).lyric : toks[a].kind));
    eq(c.join(" "), "key し う", "第一段从头（谱头）起；し、う 前面是一拍的休止；い 前面太短不切");
  });
  it("各段的唱谱接起来 = 整首一次的唱谱（切开不改唱什么）", () => {
    const whole = toLabScore(toks, "n", "ja").SCORE, parts = singChunks(toks, undefined, [0], "phrase").flatMap((rg) => toLabScore(toks, "n", "ja", undefined, undefined, rg).SCORE);
    eq(JSON.stringify(parts), JSON.stringify(whole));
  });
  it("每张纸 = 只在纸界切；一整首 = 一段；没有音的段不要", () => {
    eq(singChunks(toks, undefined, [0, 8], "sheet").length, 2);
    eq(singChunks(toks, undefined, [0], "whole").length, 1);
    eq(singChunks([...head(), r(), r()], undefined, [0], "phrase").length, 0);
  });
});
