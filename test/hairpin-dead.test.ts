// 失效的渐强渐弱（perform.ts hairpinDead）：它和终点之间一个音都没有。说它失效的，拿掉它出声真不变；说起作用的，拿掉真变（同 test/dyn-override.test.ts：披露和出声对不上就是谎话）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟；W-70 第 1 项：画灰 + 菜单里说为什么，文件不动——硬规则 #9 不自愈）
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, type Token, type Dyn, songOf } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { gainSegments, noteVelocity, hairpinDead } from "../src/score/perform.ts";
import { gainSpec, velSpec as velSpecOf } from "./fixtures/spec.ts";
import { sf2Curve } from "./fixtures/vel-curve.ts";

let id = 9500;
const n = (): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null }) as Token;
const d = (value: Dyn): Token => ({ kind: "dyn", id: id++, value }) as Token;
const hp = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: id++, dir }) as Token;
const dbSpec = gainSpec(), velSpec = velSpecOf();
const heard = (ts: Token[]) => JSON.stringify([gainSegments(ts, undefined, dbSpec), gainSegments(ts, undefined, velSpec, undefined, undefined, sf2Curve()),
  ts.flatMap((t, i) => (t.kind === "note" ? [noteVelocity(ts, i, [], velSpec, 80 / 127)] : []))]);   // 只比音的（拿掉一个记号 = 后面的下标挪一格，不算出声变了）
/** 表说失效 = 拿掉它出声不变；表说起作用 = 拿掉它出声变了。 */
function agree(ts: Token[], i: number, expectDead: boolean, what: string) {
  const dead = hairpinDead(ts).has(i);
  eq(dead, expectDead, `${what}：表说${expectDead ? "" : "不"}失效`);
  const same = heard(ts) === heard(ts.filter((_, k) => k !== i));
  assert(same === dead, `${what}：表说${dead ? "失效" : "起作用"}，拿掉它出声${same ? "不变" : "变了"}`);
}
describe("失效的渐强渐弱（画灰 + 明说）", () => {
  it("渐强后面紧跟着终点、中间没音 = 失效；拿掉出声不变", () => {
    agree([d("p"), n(), hp("cresc"), d("f"), n(), n()], 2, true, "p 音 < f 音 音");
    agree([hp("cresc"), d("f"), n()], 0, true, "开头 < f 音");
  });
  it("中间有音 = 起作用（到终点、到纸尾走一档都算）", () => {
    agree([d("mf"), hp("cresc"), n(), d("f"), n()], 1, false, "mf < 音 f 音");
    agree([d("mf"), hp("dim"), n(), n()], 1, false, "mf > 音 音（没终点，到纸尾走一档）");
  });
  it("纸尾只剩一个渐强（后面什么都没有）= 失效", () => {
    agree([d("mf"), n(), hp("cresc")], 2, true, "mf 音 <");
  });
  it("一串里只报失效的那几个", () => {
    const ts = [d("p"), hp("cresc"), n(), d("f"), hp("dim"), d("p"), n()];
    eq(JSON.stringify([...hairpinDead(ts)]), "[4]", "只有 f 后面那个 > 失效");
  });
  it("谱上：失效的画灰（hairpin 带 art-mute），起作用的不灰", () => {
    const head = (): Token[] => [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
    const pins = (ts: Token[]) => engrave(songOf([...head(), ...ts], { title: "" }), { width: 700, sp: 10, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "V", first: true }], locale: "zh", measure: createTextMeasure(() => 10) })
      .prims.filter((x) => x.t === "path" && (x as { cls?: string }).cls?.split(" ").includes("hairpin")).map((x) => (x as { cls?: string }).cls!.split(" ").includes("art-mute"));
    eq(JSON.stringify(pins([d("p"), n(), hp("cresc"), d("f"), n(), n()])), "[true]", "p 音 < f 音 音：画灰");
    eq(JSON.stringify(pins([d("p"), hp("cresc"), n(), d("f"), n()])), "[false]", "p < 音 f 音：不灰");
  });
});
