// 全量摇摆（v0.9.36；user 2026-10-10「全量摇摆同意，放在一号轨？」→ 跟着风格记号走）。三种演奏者同一个时间扭曲：乐器的音符表、月读的唱谱、定位都走 timeline()。
//   created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, initState, tr, timeline, tempoMapOf, swingDelta, flattenPart, type Token, type NoteTok, type Song } from "../src/score/song.ts";
import { swingRatio, timeMapOf } from "../src/score/groove.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { lightNotes } from "../src/engine/timeline.ts";

let nid = 8800;
const E = TPQ / 2;
const head = (time?: { beats: number; beatType: number }) => tr(initState()).slice(0, 3).map((t) => (t.kind === "time" && time ? { ...t, ...time } : t));   // 调 / 拍（4/4）/ 速度 90
const n = (dur = E, extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 5 }, dur, lyric: "ら", ...extra });
const gr = (style: string, amount?: number): Token => ({ kind: "groove", id: nid++, style, ...(amount !== undefined ? { amount } : {}) });
const bar = (): Token => ({ kind: "bar", id: nid++ });
const one = (toks: Token[]): Song => { const s = initState().song; return { ...s, papers: [{ ...s.papers[0], tracks: { [s.parts[0].id]: toks } }] }; };
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const beatSec = 60 / 90;

describe("摇摆：扭曲函数", () => {
  it("拍头拍尾不动；r = 2/3 时后半拍的八分往后挪 1/3 个八分；十六分跟着扭", () => {
    const r = 2 / 3;
    eq(swingDelta(0, 0, r), 0); eq(swingDelta(TPQ, 0, r), 0); eq(swingDelta(3 * TPQ, 0, r), 0);
    assert(close(swingDelta(E, 0, r), E / 3), String(swingDelta(E, 0, r)));
    assert(close(swingDelta(E / 2, 0, r), E / 6), "前半拍的十六分");
    assert(close(swingDelta(E + 100, 100, r), E / 3), "网格从 origin 起数");
  });
  it("摇多少：Swing 0.667；幅度只放大 / 缩小多出来的那一截，夹在 0.5–0.75；不摇的风格 = 0", () => {
    assert(close(swingRatio("swing"), 0.667)); eq(swingRatio("swing", 2), 0.75); assert(close(swingRatio("swing", 0.5), 0.5835));
    eq(swingRatio("pop"), 0); eq(swingRatio(null), 0); eq(swingRatio("none"), 0);
  });
});

describe("摇摆：时间表", () => {
  it("没有摇摆的歌：时间表原样（同一个对象），timeline 没有 dw 字段（旧歌逐样本不变）", () => {
    const s = one([...head(), gr("pop"), n(), n(), n(), n()]);
    const tm = timeMapOf(s), tp = tempoMapOf(s);
    eq(JSON.stringify(tm), JSON.stringify(tp));
    const toks = flattenPart(s, s.parts[0].id).tokens;
    assert(timeline(toks, tm).every((x) => x.dw0 === undefined), "没扭");
  });
  it("Swing：一拍两个八分 = 前长后短（2/3 : 1/3），拍头还在原处", () => {
    const s = one([...head(), gr("swing"), n(), n(), n(), n()]);
    const tl = timeline(flattenPart(s, s.parts[0].id).tokens, timeMapOf(s));
    const ns = tl.filter((x) => x.tok.kind === "note");
    assert(close(ns[0].t0, 0) && close(ns[0].t1, beatSec * 0.667), `第一个 ${ns[0].t0}–${ns[0].t1}`);
    assert(close(ns[1].t0, beatSec * 0.667) && close(ns[1].t1, beatSec), `第二个 ${ns[1].t0}–${ns[1].t1}`);
    assert(close(ns[2].t0, beatSec), "第二拍拍头");
  });
  it("写成连音的不摇；6/8 不摇；风格记号前面的 / 下一张纸不摇", () => {
    const trip = one([...head(), gr("swing"), n(TPQ / 3), n(TPQ / 3), n(TPQ / 3), n(), n()]);
    const tl = timeline(flattenPart(trip, trip.parts[0].id).tokens, timeMapOf(trip)).filter((x) => x.tok.kind === "note");
    assert(close(tl[1].t0, beatSec / 3) && close(tl[2].t0, (2 * beatSec) / 3), "三连音照直");
    assert(close(tl[4].t0, beatSec * (1 + 0.667)), "后面的八分照摇");
    const c68 = one([...head({ beats: 6, beatType: 8 }), gr("swing"), n(), n(), n()]);
    assert(timeline(flattenPart(c68, c68.parts[0].id).tokens, timeMapOf(c68)).every((x) => x.dw0 === undefined), "6/8 不摇");
    const before = one([...head(), n(), n(), gr("swing"), n(), n()]);
    const tb = timeline(flattenPart(before, before.parts[0].id).tokens, timeMapOf(before)).filter((x) => x.tok.kind === "note");
    assert(tb[0].dw0 === undefined && tb[1].dw0 === undefined && tb[3].dw0 !== undefined, "记号前面的直、后面的摇");
  });
  it("弱起：一个八分的弱起 = 后半拍（短的那个），网格对齐到小节线", () => {
    const s = one([...head(), gr("swing"), n(), bar(), n(), n()]);
    const tl = timeline(flattenPart(s, s.parts[0].id).tokens, timeMapOf(s)).filter((x) => x.tok.kind === "note");
    assert(close(tl[0].t1 - tl[0].t0, beatSec * (1 - 0.667)), `弱起长 ${tl[0].t1 - tl[0].t0}`);
    assert(close(tl[1].t1 - tl[1].t0, beatSec * 0.667), "小节线后的第一个八分是长的");
  });
});

describe("摇摆：三种演奏者同一个扭曲", () => {
  it("月读的唱谱（八分音符数）和乐器的音符表（秒）每个音的起点对得上", () => {
    const s = one([...head(), gr("swing"), n(), n(), n(E / 2), n(E / 2), n(E), n(TPQ), n(E), n(E)]);
    const toks = flattenPart(s, s.parts[0].id).tokens, map = timeMapOf(s);
    const inst = lightNotes(toks, map).map((x) => x.t0);
    const lab = toLabScore(toks, "n", "ja", map), eighthSec = 60 / lab.TEMPO_QUARTER / 2;
    let acc = 0; const sung: number[] = [];
    for (const e of lab.SCORE) { sung.push(acc * eighthSec); for (const [, l] of e.notes) acc += l; acc += e.rest ?? 0; }
    eq(sung.length, inst.length);
    sung.forEach((v, k) => assert(close(v, inst[k], 1e-9), `第 ${k} 个：唱 ${v} vs 乐器 ${inst[k]}`));
  });
  it("没有摇摆：唱谱的长度和以前一模一样（整数八分）", () => {
    const s = one([...head(), gr("pop"), n(), n(), n(TPQ)]);
    const lab = toLabScore(flattenPart(s, s.parts[0].id).tokens, "n", "ja", timeMapOf(s));
    eq(JSON.stringify(lab.SCORE.map((e) => e.notes.map(([, l]) => l))), "[[1],[1],[2]]");
  });
});
