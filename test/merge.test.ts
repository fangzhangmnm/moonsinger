// 合租叠起来 = 一条虚拟的多声部 track（src/score/merge.ts，v0.10.28）+ 太宽用双手谱（clef.ts wantsGrand）。created 2026-10-10 by Claude Opus 5.5
// user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」「…use the already-have rendering procedure for that virtual track」
import { describe, it, eq, assert } from "./runner.mjs";
import { mergeTracks } from "../src/score/merge.ts";
import { wantsGrand } from "../src/score/clef.ts";
import { initState, tr, headLen, TPQ, type Token, type NoteTok } from "../src/score/song.ts";
import { midiOf, spellMidi, type Pitch } from "../src/score/pitch.ts";

let nid = 9500;
const P = (m: number): Pitch => spellMidi(m, 0);
const n = (m: number, dur = TPQ, lyric: string | null = null): Token => ({ kind: "note", id: nid++, pitch: P(m), dur, lyric } as Token);
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur } as Token);
const head = () => tr(initState()).slice(0, headLen(tr(initState())));
const body = (t: Token[]) => t.slice(headLen(t));
const show = (t: Token[]) => body(t).map((x) => x.kind === "note" ? `${[x.pitch!, ...(x.chord ?? [])].map(midiOf).join("+")}/${x.dur / TPQ}${x.tie ? "~" : ""}` : x.kind === "rest" ? `r/${x.dur / TPQ}` : x.kind).join(" ");

describe("合租并成一条", () => {
  it("同一时刻起的 = 一个和弦（从高到低、同音只留一个）；谱头用主人的", () => {
    const m = mergeTracks([[...head(), n(64), n(67)], [...head(), n(72), n(67)]]);
    eq(show(m), "72+64/1 67/1");
    eq(headLen(m), headLen(head()));
  });
  it("节奏不一样：切在每个人的音开始 / 结束的地方；有新起的音时还在响的长音照样画进和弦；只是别人结束了 = 连着上一段", () => {
    eq(show(mergeTracks([[...head(), n(72, 2 * TPQ)], [...head(), n(64), n(67)]])), "72+64/1 72+67/1", "二分音符 + 两个四分");
    eq(show(mergeTracks([[...head(), n(72, 4 * TPQ)], [...head(), n(64), r(3 * TPQ)]])), "72+64/1 72/3~", "别人停了：长音接着、连起来");
  });
  it("没人响 = 休止（连着的空并成一个）；比较长的那位定长度", () => {
    eq(show(mergeTracks([[...head(), r(), n(60)], [...head(), r(), r(), r(), n(62)]])), "r/1 60/1 r/1 62/1");
  });
  it("主人的记号按原位置留着（原 token）；谱号 / 八度线不要；歌词 = 主人的", () => {
    const dyn: Token = { kind: "dyn", id: nid++, value: "f" } as Token, clef: Token = { kind: "clef", id: nid++, clef: "F" } as Token, ott: Token = { kind: "ottava", id: nid++, shift: 1 } as Token;
    const m = mergeTracks([[...head(), n(64, TPQ, "あ"), dyn, clef, ott, n(65, TPQ, "い")], [...head(), n(60), n(60)]]);
    eq(show(m), "64+60/1 dyn 65+60/1");
    assert(body(m).includes(dyn), "力度 = 主人那个 token（id 不变）");
    eq(body(m).filter((x): x is NoteTok => x.kind === "note").map((x) => x.lyric).join(","), "あ,い");
    assert(body(m).every((x) => x.kind === "dyn" || x.id < 0), "新造的音 / 休止 id 是负的");
  });
  it("keyOf：一家全是鼓 = 每位换成自己那件的鼓键", () => {
    const m = mergeTracks([[...head(), n(60), n(60)], [...head(), r(), n(60)]], { keyOf: (k) => P(k === 0 ? 36 : 38) });
    eq(show(m), "36/1 38+36/1");
  });
});
describe("隔得太远 = 两个声部（user「隔得太远的音符可以分开来的而不是强行用一根超长的棒子连。以前钢琴家也是这么写的」）", () => {
  it("跨过八度以上的和弦在最大的空当处劈开：上面 = 声部 1、下面 = 声部 2；八度以内不劈（声部 2 空着）", () => {
    const tracks = [[...head(), n(84), n(76)], [...head(), n(60), n(72)]];   // 第一拍 C6+C4（两个八度）、第二拍 E5+C5（以内）
    eq(show(mergeTracks(tracks, { voice: 1 })), "84/1 76+72/1");
    eq(show(mergeTracks(tracks, { voice: 2 })), "60/1 r/1");
    eq(show(mergeTracks(tracks)), "84+60/1 76+72/1", "不给 voice = 不劈");
  });
  it("连音线各算各的：声部 2 的长音碰到声部 1 新起的音 = 照样连着", () => {
    const tracks = [[...head(), n(84), n(86)], [...head(), n(48, 2 * TPQ)]];
    eq(show(mergeTracks(tracks, { voice: 2 })), "48/1 48/1~");
  });
});
describe("双手谱的两条（keep / marks: bars）", () => {
  it("中央 C 以上一条、以下一条；下面那条只留小节线、没有歌词 / 力度", () => {
    const dyn: Token = { kind: "dyn", id: nid++, value: "f" } as Token;
    const tracks = [[...head(), dyn, n(72, TPQ, "あ"), n(74)], [...head(), n(48), n(43)]];
    eq(show(mergeTracks(tracks, { keep: (p) => midiOf(p) >= 60 })), "dyn 72/1 74/1");
    const lo = mergeTracks(tracks, { keep: (p) => midiOf(p) < 60, marks: "bars" });
    eq(show(lo), "48/1 43/1"); assert(body(lo).every((x) => x.kind !== "note" || !x.lyric), "下面那条没有歌词");
  });
});
describe("太宽 = 双手谱（自动，不存）", () => {
  it("高音和低音隔得远 = 双手；一个谱号放得下 = 不用", () => {
    eq(wantsGrand([...head(), n(84), n(40), n(86), n(38), n(83), n(41)]), true);
    eq(wantsGrand([...head(), n(64), n(67), n(72), n(69)]), false);
  });
});
