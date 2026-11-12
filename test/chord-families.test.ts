// chord-families.test.ts —— 一张纸上「哪几个音底下标什么和弦」（src/theory/families.ts paperHarmony）：合租的一家合起来认、不在一家的各认各的。
// created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第五刀 5-4；施工单第五节「小弟问（5-4 一家合起来认和弦）」下面统筹的裁定；user 11-11 纪要第 70 节）。
import { describe, it, eq, assert } from "./runner.mjs";
import { harmonyTags, harmonyTheory, paperHarmony } from "../src/theory/index.ts";
import { initState, tr, headLen, TPQ, type Token, type NoteTok } from "../src/score/song.ts";
import { spellMidi } from "../src/score/pitch.ts";

const th = harmonyTheory();
let id = 9700;
const nn = (m: number, chord: number[] = [], extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: TPQ, lyric: null, ...extra }) as Token;
const rest = (dur = TPQ): Token => ({ kind: "rest", id: id++, dur }) as Token;
const head = () => { const t = tr(initState()); return t.slice(0, headLen(t)); };
const track = (...body: Token[]) => [...head(), ...body];
const H = headLen(track());
/** 某一个和弦的候选里叫这个名字的那个 → 存进音里的写法。 */
const pinNamed = (chord: number[], name: string) => { const rd = harmonyTags(th, { tokens: track(nn(chord[0]!, chord.slice(1))) })[0]!.read, g = rd.all.find((x) => x.name === name); assert(!!g, `候选里有 ${name}`); return th.pinOf(g!); };

describe("和弦级数的预处理（theory/families.ts）", () => {
  it("不在一家的：各认各的，和以前（harmonyTags）一样，画在自己那一行", () => {
    const a = track(nn(60, [64, 67]), nn(62, [65, 69])), b = track(nn(55, [59, 62]));
    const m = paperHarmony(th, { parts: [{ id: "A", tokens: a, broken: true }, { id: "B", tokens: b, broken: true }], families: [] });
    eq((m.get("A") ?? []).map((t) => `${t.index}:${th.label(t.read)}@${t.at}`).join(" "), harmonyTags(th, { tokens: a }).map((t) => `${t.index}:${th.label(t.read)}@A`).join(" "));
    eq((m.get("B") ?? []).map((t) => th.label(t.read)).join(" "), "V");
  });
  it("一家合起来认：女高 G、中 E、男低 C 三位各一个音 = 一个 I，只标一次，标在最下面那一位那一行，挂在最下面那一位的音上", () => {
    const S = track(nn(67)), A = track(nn(64)), B = track(nn(60));
    const m = paperHarmony(th, { parts: [{ id: "S", tokens: S, broken: true }, { id: "A", tokens: A, broken: true }, { id: "B", tokens: B, broken: true }], families: [["S", "A", "B"]] });
    eq([...m.entries()].map(([k, l]) => `${k}:${l.map((t) => `${t.index}:${th.label(t.read)}@${t.at}`).join(",")}`).join(" "), `B:${H}:I@B`, "一个 I，在 B 的音上、画在 B 那一行；S、A 自己不标");
  });
  it("最下面那一位那一刻没起音：挂在从下往上第一位起音的音上（挑法写回它），照样画在最下面那一行", () => {
    const S = track(nn(72)), A = track(nn(67, [64])), B = track(rest());
    const m = paperHarmony(th, { parts: [{ id: "S", tokens: S, broken: true }, { id: "A", tokens: A, broken: true }, { id: "B", tokens: B, broken: true }], families: [["S", "A", "B"]] });
    const a = m.get("A") ?? [];
    eq(a.length, 1, "挂在 A 的那个音上"); eq(a[0]!.index, H); eq(a[0]!.at, "B", "画在最下面那一位（B）那一行"); eq(th.label(a[0]!.read), "I/3", "最低的是 A 的 E = 第一转位");
    eq((m.get("B") ?? []).length + (m.get("S") ?? []).length, 0);
  });
  it("人挑的读法：从下往上第一个「是这个和弦的候选」的算数；不是候选的当没挑（不删、不灰）", () => {
    const am = pinNamed([60, 64, 67, 69], "Am7/C"), c6 = pinNamed([60, 64, 67, 69], "C6"), g7 = pinNamed([55, 59, 62, 65], "G7");
    const fam = (bPin?: object, tPin?: object) => {
      const S = track(nn(69)), A = track(nn(67)), T = track(nn(64, [], tPin ? { harm: tPin as NoteTok["harm"] } : {})), B = track(nn(60, [], bPin ? { harm: bPin as NoteTok["harm"] } : {}));
      const m = paperHarmony(th, { parts: [{ id: "S", tokens: S, broken: true }, { id: "A", tokens: A, broken: true }, { id: "T", tokens: T, broken: true }, { id: "B", tokens: B, broken: true }], families: [["S", "A", "T", "B"]] });
      const t = m.get("B")![0]!; return `${th.label(t.read)}${t.read.pinned ? "（挑的）" : ""}${t.read.stale ? "?" : ""}`;
    };
    eq(fam(), "I6", "没挑 = 自动认的");
    eq(fam(undefined, am), "vi7/1（挑的）", "T 上挑的 Am7/C 是候选 = 算数");
    eq(fam(g7, am), "vi7/1（挑的）", "B 上的 G7 不是这个和弦的候选 = 当没挑，往上找到 T 的");
    eq(fam(c6, am), "I6（挑的）", "B 上的 C6 是候选：从下往上它先算数");
    eq(fam(g7), "I6", "只有一个不是候选的挑法 = 当没挑：自动认的，不灰");
  });
  it("「认不认拆开弹的」按打头那位（主人）", () => {
    const S = track(rest(TPQ * 4)), B = track(nn(60, [], { dur: TPQ / 2 }), nn(64, [], { dur: TPQ / 2 }), nn(67, [], { dur: TPQ / 2 }), nn(72, [], { dur: TPQ / 2 }), rest(TPQ * 2));
    const n = (sb: boolean) => [...paperHarmony(th, { parts: [{ id: "S", tokens: S, broken: sb }, { id: "B", tokens: B, broken: true }], families: [["S", "B"]] }).values()].flat().length;
    eq(n(false), 0, "主人不认拆开弹的 = 不标（哪怕 B 自己认）");
    assert(n(true) > 0, "主人认 = 标");
  });
});
