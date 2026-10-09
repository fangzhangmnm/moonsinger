// 被强后即弱盖掉的力度记号（perform.ts dynOverridden）：说它不起作用的，换成别的值真出声一点不变；说起作用的，真变。
// created 2026-10-09 by Claude Opus 5.5（user「要不要按纪律把 mf 画灰、说一句？ 要」）——披露和出声对不上就是谎话（同 test/honors.test.ts）。
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, type Token, type Dyn } from "../src/score/song.ts";
import { gainSegments, noteVelocity, dynOverridden } from "../src/score/perform.ts";
import { DYNAMICS_DB, DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, ARTICULATION } from "../src/format/performance.ts";

let id = 9000;
const n = (art?: string[]): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null, ...(art ? { art } : {}) }) as Token;
const d = (value: Dyn, ramp = false): Token => ({ kind: "dyn", id: id++, value, ...(ramp ? { ramp: true } : {}) }) as Token;
const hp = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: id++, dir }) as Token;
const dbSpec = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb, marcatoDb: MARCATO_DB };
const velSpec = { ...dbSpec, dynamicsVel: { ...DYNAMICS_VEL }, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL };
/** 两条出声的路都算：dB 那一路的音量曲线 + 力度那一路（每个音的 MIDI 力度 + 音量曲线）。 */
const heard = (ts: Token[]) => JSON.stringify([gainSegments(ts, undefined, dbSpec), gainSegments(ts, undefined, velSpec),
  ts.map((t, i) => (t.kind === "note" ? noteVelocity(ts, i, (t as { art?: string[] }).art ?? [], velSpec, 80 / 127) : null))]);
const swap = (ts: Token[], i: number, v: Dyn) => ts.map((t, k) => (k === i ? { ...t, value: v } as Token : t));
/** 断言表和出声一致：表说盖掉 = 换值出声不变；表说没盖掉 = 换值出声变了。 */
function agree(ts: Token[], i: number, expectOff: boolean, what: string) {
  const off = dynOverridden(ts).has(i), v = (ts[i] as { value: Dyn }).value, alt: Dyn = v === "pp" ? "ff" : "pp";
  eq(off, expectOff, `${what}：表说${expectOff ? "" : "没"}盖掉`);
  const same = heard(ts) === heard(swap(ts, i, alt));
  assert(same === off, `${what}：表说${off ? "盖掉" : "起作用"}，换成 ${alt} 出声${same ? "不变" : "变了"}`);
}
describe("被强后即弱盖掉的力度记号（画灰 + 明说）", () => {
  it("mf 紧跟着 fp 的音 = 盖掉（换成 pp 出声一点不变）", () => agree([n(), d("mf"), n(["fp"]), n(), n()], 1, true, "mf fp"));
  it("mf 后面是普通的音 = 起作用", () => agree([n(), d("mf"), n(), n(["fp"]), n()], 1, false, "mf 普通音"));
  it("mf 是渐强的终点（前面 p <）= 起作用（渐强往它那儿走）", () => agree([d("p"), hp("cresc"), n(), n(), d("mf"), n(["fp"]), n()], 4, false, "渐强终点"));
  it("mf 是渐到的终点 = 起作用", () => agree([d("p"), n(), n(), d("mf", true), n(["fp"]), n()], 3, false, "渐到终点"));
  it("mf 后面紧跟渐强、再到 fp 的音 = 起作用（渐强从它起）", () => agree([n(), d("mf"), hp("cresc"), n(["fp"]), n(), d("f"), n()], 1, false, "渐强起点"));
  it("突强（sfz）不盖：sfz 是在当下的力度上冲一下", () => agree([n(), d("mf"), n(["sfz"]), n()], 1, false, "mf sfz"));
});
