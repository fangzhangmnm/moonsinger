// 冻结样本用的歌（把能存的东西都用上）+ 比较用的规范化。created 2026-10-07 by Claude Fable 5.1（test/format.test.ts bigSong 同款，独立一份免得测试改了样本跟着漂）。
// scripts/freeze-format-sample.mjs 用它生成 test/fixtures/format/v<版本>/sample.mxl + expected.json；test/format-guard.test.ts 用它算形状快照。
import { TPQ, type Song, type Token } from "../../../src/score/song.ts";
import { MELISMA_MARK } from "../../../src/score/lyrics.ts";
import { paperOf } from "../../../src/score/paper.ts";

const Q = TPQ, E = TPQ / 2, T3 = (TPQ / 2) * 2 / 3;
const p = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
export function sampleSong(): Song {
  let id = 1;
  const t = (x: Omit<Token, "id"> & Record<string, unknown>) => ({ ...x, id: id++ }) as Token;
  return { title: "冻结样本", credits: "词曲：样本\n演唱：月读", hum: "u", paper: paperOf("A5"), tokens: [
    t({ kind: "key", fifths: 2 }), t({ kind: "time", beats: 3, beatType: 4 }), t({ kind: "tempo", bpm: 96 }),
    t({ kind: "note", pitch: p("F", 4, 1), dur: Q, lyric: "う" }),
    t({ kind: "note", pitch: p("A"), dur: E, lyric: "さ" }),
    t({ kind: "note", pitch: p("A"), dur: E, lyric: null, tie: true }),
    t({ kind: "note", pitch: p("B"), dur: Q, lyric: MELISMA_MARK }),
    t({ kind: "bar" }),
    t({ kind: "note", pitch: p("D", 5), dur: T3, lyric: "hap", hyph: true }),
    t({ kind: "note", pitch: p("C", 5, 1), dur: T3, lyric: "py" }),
    t({ kind: "note", pitch: null, dur: T3, lyric: "爱", lang: "zh" }),
    t({ kind: "note", pitch: p("B"), dur: Q * 1.5, lyric: "你" }),
    t({ kind: "key", fifths: -1 }),
    t({ kind: "rest", dur: Q }),
    t({ kind: "note", pitch: p("F"), dur: Q * 3, lyric: "ね" }),
    t({ kind: "tempo", bpm: 72 }),
    t({ kind: "time", beats: 4, beatType: 4 }),
    t({ kind: "note", pitch: p("G"), dur: Q, lyric: "る" }),
    t({ kind: "rest", dur: Q * 3 }),
    t({ kind: "bar" }),
  ] };
}
/** 比较用：键排序；小节线 / 记号的 id 是编辑器自己的（文件里不存），归零。 */
export const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
export const canonTokens = (s: Song) => canon(s.tokens.map((t) => (t.kind === "note" || t.kind === "rest" ? t : { ...t, id: 0 })));
/** 形状指纹：值换成类型名、数组取第一个元素的形状、键排序——写出来的键集合变了就不一样。 */
export const shapeOf = (v: unknown): unknown => Array.isArray(v) ? (v.length ? [shapeOf(v[0])] : []) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shapeOf((v as Record<string, unknown>)[k])])) : v === null ? "null" : typeof v;
