// × 符头：演奏者固定敲一个键（鼓件 / 音效固定原速）的声部画 ×，谱上写的音高照留。created 2026-10-08 by Claude Opus 5.5（user「披露就用x」）
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { GLYPH } from "../src/render/smufl.ts";
import { TPQ, type Song, type Token, songOf } from "../src/score/song.ts";

/** 全音 / 二分 / 四分各一个（全音占满第一小节，不跨小节线被切），音高各不同（写什么都照留）。 */
function song(): Song {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (const [step, dur] of [["G", TPQ * 4], ["E", TPQ * 2], ["C", TPQ]] as const) toks.push({ kind: "note", pitch: { step, alter: 0, octave: 5 }, dur, lyric: null, id: id++ } as Token);
  return songOf(toks, { title: "" });
}
const heads = (xHead: boolean) => engrave(song(), { width: 4000, sp: 10, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "Ringtone", first: true, ...(xHead ? { xHead } : {}) }], caret: 6, sel: null, measureLyric: () => 10 })
  .prims.filter((x) => x.t === "glyph" && x.cls?.split(" ").includes("note"));

describe("× 符头（演奏者固定敲一个键）", () => {
  it("平常：全音 / 白 / 黑符头", () => {
    eq(heads(false).map((x) => (x as { ch: string }).ch).join(","), [GLYPH.noteheadWhole, GLYPH.noteheadHalf, GLYPH.noteheadBlack].join(","));
  });
  it("xHead：同样三个音画成 ×（全音 / 白 / 黑各自的 ×），位置（音高）不变", () => {
    const a = heads(false), b = heads(true);
    eq(b.map((x) => (x as { ch: string }).ch).join(","), [GLYPH.noteheadXWhole, GLYPH.noteheadXHalf, GLYPH.noteheadXBlack].join(","));
    eq(JSON.stringify(b.map((x) => (x as { y: number }).y)), JSON.stringify(a.map((x) => (x as { y: number }).y)), "符头的高度 = 写的音高，不该动");
    assert(new Set(b.map((x) => (x as { y: number }).y)).size === 3, "三个不同的音高还是三个高度");
  });
});
