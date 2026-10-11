// 合租叠起来 = 一条虚拟的多声部 track（src/score/merge.ts，v0.10.28）+ 太宽用双手谱（clef.ts wantsGrand）。created 2026-10-10 by Claude Opus 5.5
// user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」「…use the already-have rendering procedure for that virtual track」
import { describe, it, eq, assert } from "./runner.mjs";
import { mergeTracks, planHands } from "../src/score/merge.ts";
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
describe("合租怎么分手 / 分声部（planHands，v0.10.31；user「我现在觉得合租的时候还是智能分左右手和声部的对应关系比较好」「以及你也可以选择合租的时候不用双手谱」）", () => {
  const mm = (ms: number[], d = 1) => ms.map((m) => n(m, d * TPQ));   // 一串音（每个 d 拍）
  const bar = (m: number) => mm([m, m, m, m]);                         // 4/4 一小节 = 四个四分
  it("两位都在高音区、一张谱读得下 = 一张谱；上面那位 = 声部 1、下面那位 = 声部 2", () => {
    const tracks = [[...head(), ...bar(76)], [...head(), ...bar(64)]], pl = planHands(tracks, wantsGrand);
    eq(pl.grand, false);
    eq(show(mergeTracks(tracks, { pick: pl.pick(0, 1) })), "76/1 76/1 76/1 76/1");
    eq(show(mergeTracks(tracks, { pick: pl.pick(0, 2) })), "64/1 64/1 64/1 64/1");
  });
  it("一位几乎都是高音、一位几乎都是低音 = 双手谱，各在自己的家谱；几个出格的音不乱认领", () => {
    const tracks = [[...head(), ...mm([79, 81, 55, 79]), ...bar(81)], [...head(), ...bar(40), ...mm([40, 62, 40, 40])]];   // 上面那位第一小节有个 G3、下面那位第二小节有个 D4
    const pl = planHands(tracks, wantsGrand);
    eq(pl.grand, true);
    eq(show(mergeTracks(tracks, { pick: pl.pick(0, 1) })), "79/1 81/1 55/1 79/1 81/1 81/1 81/1 81/1", "上谱 = 上面那位，连它的 G3");
    eq(show(mergeTracks(tracks, { pick: pl.pick(1, 1) })), "40/1 40/1 40/1 40/1 40/1 62/1 40/1 40/1", "下谱 = 下面那位，连它的 D4");
  });
  it("乱跑的那位按小节换谱：这一小节明显在另一边才过去", () => {
    const tracks = [[...head(), ...bar(79), ...bar(79)], [...head(), ...bar(40), ...bar(40)], [...head(), ...bar(72), ...bar(43)]];   // 第三位：第一小节高、第二小节低
    const pl = planHands(tracks, wantsGrand);
    eq(pl.grand, true);
    const up = mergeTracks(tracks, { pick: (m, t) => m === 2 && (pl.pick(0, 1)(m, t) || pl.pick(0, 2)(m, t)) }), lo = mergeTracks(tracks, { pick: (m, t) => m === 2 && (pl.pick(1, 1)(m, t) || pl.pick(1, 2)(m, t)) });
    eq(show(up), "72/1 72/1 72/1 72/1 r/4", "第一小节在上谱"); eq(show(lo), "r/4 43/1 43/1 43/1 43/1", "第二小节在下谱");
  });
});
describe("太宽 = 双手谱（自动，不存）", () => {
  it("高音和低音隔得远 = 双手；一个谱号放得下 = 不用", () => {
    eq(wantsGrand([...head(), n(84), n(40), n(86), n(38), n(83), n(41)]), true);
    eq(wantsGrand([...head(), n(64), n(67), n(72), n(69)]), false);
  });
});
