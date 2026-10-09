// 冻结样本用的歌（把能存的东西都用上）+ 比较用的规范化。created 2026-10-07 by Claude Fable 5.1（test/format.test.ts bigSong 同款，独立一份免得测试改了样本跟着漂）。
// 2026-10-08（0.5.0 多声部多纸，存法 B）：两张纸 × 两个声部，第二张纸只有第一个声部（user「每个sheet的track数量当然不同」）。
// scripts/freeze-format-sample.mjs 用它生成 test/fixtures/format/v<版本>/sample.mxl + expected.json；test/format-guard.test.ts 用它算形状快照。
import { TPQ, type Song, type Token, firstTrack } from "../../../src/score/song.ts";
import { MELISMA_MARK } from "../../../src/score/lyrics.ts";
import { paperOf } from "../../../src/score/paper.ts";

const Q = TPQ, E = TPQ / 2, T3 = (TPQ / 2) * 2 / 3;
const p = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** id 按纸序 × 声部序 × 下标连着编（读回来时 project.ts 也这么重编 → 逐字节可比）。 */
/** 冻结样本里的视图态（score.json 可选字段 view；形状快照要盖到它）。 */
export const sampleView = () => ({ scope: "all" as const, pageFlow: true as const, paper: "p2", parts: { P2: { muted: true as const } }, pad: { fifths: 2, scale: "minor", unit: "quarter" as const, tuplet: 3 as const, low: 55 }, ref: { open: true as const, left: 40, top: 90, width: 320, height: 240 }, pdf: "pinyin" as const });   // pad：2026-10-08 Opus 5.5 加（可选字段，不升版本）；ref = 参考窗的窗（2026-10-08 深夜 v0.8，同上）
export function sampleSong(): Song {
  let id = 1;
  const t = (x: Omit<Token, "id"> & Record<string, unknown>) => ({ ...x, id: id++ }) as Token;
  const p1P1: Token[] = [
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
  ];
  // 第二个声部（贝斯线）：自己的调号 / 拍号（各声部自己的画法），比第一个短（纸界补休止）
  const p1P2: Token[] = [
    t({ kind: "key", fifths: 2 }), t({ kind: "time", beats: 3, beatType: 4 }), t({ kind: "tempo", bpm: 96 }),
    t({ kind: "note", pitch: p("D", 3), dur: Q * 2, lyric: null }),
    t({ kind: "note", pitch: p("A", 2), dur: Q, lyric: null }),
    t({ kind: "bar" }),
    t({ kind: "note", pitch: p("G", 2), dur: Q * 3, lyric: null }),
  ];
  // 第二张纸「副歌」：只有第一个声部
  const p2P1: Token[] = [
    t({ kind: "key", fifths: -1 }), t({ kind: "time", beats: 4, beatType: 4 }), t({ kind: "tempo", bpm: 72 }),
    t({ kind: "note", pitch: p("C", 5), dur: Q, lyric: "la" }),
    t({ kind: "note", pitch: p("B"), dur: Q, lyric: "la" }),
    t({ kind: "rest", dur: Q * 2 }),
  ];
  return { title: "冻结样本", credits: "词曲：样本\n演唱：月读", arrangement: "1 (2)×2", hum: "u", paper: paperOf("A5"),
    parts: [{ id: "P1", role: "r1", mic: "m1" }, { id: "P2", role: "r2", mic: "m2" }],
    papers: [{ id: "p1", name: "", tracks: { P1: p1P1, P2: p1P2 } }, { id: "p2", name: "副歌", tracks: { P1: p2P1 } }] };
}
/** 比较用：键排序；小节线 / 记号的 id 是编辑器自己的（文件里不存），归零。 */
export const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
const zeroMarks = (ts: Token[]) => ts.map((t) => (t.kind === "note" || t.kind === "rest" ? t : { ...t, id: 0 }));
/** 第一张纸第一个声部那串（第 1 版样本的 expected.tokens 比的就是它）。 */
export const canonTokens = (s: Song) => canon(zeroMarks(firstTrack(s)));
/** 所有纸 × 所有声部（「纸 id/声部 id」→ 那串）。 */
export const canonTracks = (s: Song) => canon(Object.fromEntries(s.papers.flatMap((p) => s.parts.flatMap((part) => (p.tracks[part.id] ? [[`${p.id}/${part.id}`, zeroMarks(p.tracks[part.id])]] : [])))));
/** 形状指纹：值换成类型名、数组取第一个元素的形状、键排序——写出来的键集合变了就不一样。 */
export const shapeOf = (v: unknown): unknown => Array.isArray(v) ? (v.length ? [shapeOf(v[0])] : []) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shapeOf((v as Record<string, unknown>)[k])])) : v === null ? "null" : typeof v;
