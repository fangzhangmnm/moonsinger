// 谱前声部名：长了折行、不挤五线谱。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「谱子前面的乐器名字如果很长的话应该换行而不是占用五线谱的空间」。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, LYRIC_EM } from "../src/render/engrave.ts";
import { TPQ, type Token, songOf } from "../src/score/song.ts";

const SP = 10, CH = 9;   // 假字宽：歌词字号下每个字 9 px（sp = 10）→ 声部名 = 9 × 0.85 / 10 ≈ 0.77 sp 一个字
const song = () => songOf([{ kind: "key", fifths: 0, id: 1 }, { kind: "time", beats: 4, beatType: 4, id: 2 }, { kind: "tempo", bpm: 90, id: 3 },
  { kind: "note", pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null, id: 4 }] as Token[], { title: "" });
const L = (name: string, staves?: 2) => engrave(song(), { width: 2000, sp: SP, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name, first: true, ...(staves ? { staves } : {}) }], caret: 4, sel: null, measureLyric: (s) => [...s].length * CH });
const names = (l: ReturnType<typeof L>) => l.prims.filter((x) => x.t === "text" && x.cls?.startsWith("part-name")).map((x) => (x as { s: string }).s);
const clefX = (l: ReturnType<typeof L>) => Math.min(...l.prims.filter((x) => x.t === "glyph" && x.ch === "\u{E050}").map((x) => (x as { x: number }).x));
const wSp = (s: string) => ([...s].length * CH * (LYRIC_EM * 0.85)) / LYRIC_EM / SP;

describe("谱前声部名", () => {
  it("短名字 = 一行，原样", () => { eq(JSON.stringify(names(L("Vocals"))), JSON.stringify(["Vocals"])); });
  it("长英文名：按词折行，每行不超过 6.5 sp", () => {
    const n = names(L("Acoustic Grand Piano"));
    eq(JSON.stringify(n), JSON.stringify(["Acoustic", "Grand", "Piano"]));
    assert(n.every((x) => wSp(x) <= 6.5), JSON.stringify(n));
  });
  it("长中文名：按字折", () => {
    const n = names(L("高音萨克斯管一号谱"));
    assert(n.length === 2 && n.join("") === "高音萨克斯管一号谱" && n.every((x) => wSp(x) <= 6.5), JSON.stringify(n));
  });
  it("一个词本身太长：按字母折", () => {
    const n = names(L("Glockenspielorchestra"));
    assert(n.length >= 3 && n.join("") === "Glockenspielorchestra".slice(0, n.join("").length) && n.every((x) => wSp(x) <= 6.5), JSON.stringify(n));
  });
  it("超过 3 行（单谱表）：末尾「…」", () => {
    const n = names(L("one two three four five six seven eight nine ten"));
    eq(n.length, 3); assert(n[2].endsWith("…") && wSp(n[2]) <= 6.5, n[2]);
    eq(names(L("one two three four five six seven eight nine ten", 2)).length, 5, "大谱表最多 5 行");
  });
  it("谱号的位置不因名字变长而右移（原来长名字整列变宽、挤五线谱）", () => {
    const capped = clefX(L("Acoustic Grand Piano Long Name")), cap = clefX(L("Abcdefgh"));
    assert(capped <= cap + 1, `${capped} vs ${cap}`);
  });
});
