// 速度框的小节拍器（wishlist W-12；user「调速度的时候那个小节拍器的动画应该有物理动画…受迫物理模型让小节拍器跟上你的乱调」）：
// 稳定时摆到一头 = 一拍、摆幅 ±AMP；速度乱变时角度连续不跳；几百毫秒内追上新速度。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { metroStart, metroStep, AMP, type MetroState } from "../src/ui/metronome.ts";

const FRAME = 1 / 60;
/** 跑 secs 秒（每帧 bpmAt(t)），记每帧的角度。 */
function run(s: MetroState, secs: number, bpmAt: (t: number) => number, t0 = 0): { s: MetroState; th: number[]; t: number[] } {
  const th: number[] = [], t: number[] = [];
  for (let k = 0; k * FRAME < secs; k++) { const tt = t0 + k * FRAME; s = metroStep(s, bpmAt(tt), FRAME); th.push(s.th); t.push(tt + FRAME); }
  return { s, th, t };
}
/** 过零（往一个方向）的时刻差 = 整个来回的周期。 */
function period(th: number[], t: number[]): number {
  const ups: number[] = [];
  for (let i = 1; i < th.length; i++) if (th[i - 1] < 0 && th[i] >= 0) ups.push(t[i - 1] + (t[i] - t[i - 1]) * (-th[i - 1] / (th[i] - th[i - 1])));
  return (ups[ups.length - 1] - ups[0]) / (ups.length - 1);
}
describe("小节拍器：自激的摆", () => {
  it("稳定在 ♩=90：整个来回 = 两拍（1.333 s），摆幅 ≈ ±AMP", () => {
    const r = run(metroStart(90), 6, () => 90);
    const tail = r.th.slice(-180), tt = r.t.slice(-180);
    assert(Math.abs(period(tail, tt) - 4 / 3) < 0.01, `周期 ${period(tail, tt).toFixed(3)}`);
    const peak = Math.max(...tail.map(Math.abs));
    assert(Math.abs(peak - AMP) < 1.5, `摆幅 ${peak.toFixed(2)}`);
  });
  it("滚轮乱拨（每帧换一个速度 60…180）：角度每帧变化有上限（不跳），停在 ♩=120 之后 1 秒内周期 = 1 s、摆幅回到 AMP", () => {
    let s = run(metroStart(90), 2, () => 90).s;
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const wild = run(s, 1.5, () => 60 + rnd() * 120);
    const jumps = wild.th.map((x, i) => (i ? Math.abs(x - wild.th[i - 1]) : 0));
    const maxStep = Math.max(...jumps);   // 180 bpm 满摆幅时一帧最多走 ω·A·dt ≈ 9.4 π/… ≈ 8.4°；乱拨不会比这大很多
    assert(maxStep < 12, `一帧最多走 ${maxStep.toFixed(2)}°`);
    s = wild.s;
    const settle = run(s, 4, () => 120);
    const tail = settle.th.slice(-120), tt = settle.t.slice(-120);
    assert(Math.abs(period(tail, tt) - 1) < 0.02, `周期 ${period(tail, tt).toFixed(3)}`);
    assert(Math.abs(Math.max(...tail.map(Math.abs)) - AMP) < 2, "摆幅回来了");
  });
  it("突然从 60 跳到 180：那一帧角度不跳（连续），0.7 秒内频率追到 99%（追的时间常数 0.15 s）", () => {
    const a = run(metroStart(60), 3, () => 60).s;
    const b = metroStep(a, 180, FRAME);
    assert(Math.abs(b.th - a.th) < 12, `跳变那一帧走了 ${Math.abs(b.th - a.th).toFixed(2)}°`);
    const c = run(b, 0.7, () => 180).s;
    eq(Math.abs(c.w - Math.PI * 3) < 0.1, true, `ω ${c.w.toFixed(3)}`);
  });
  it("abuse 之后自愈（user「如果你通过快速调频率abuse节拍器的话应该可以自愈，而不是卡在一个奇怪的动力学位置里面」）：每帧在 20 和 400 之间乱跳 10 秒，再停在 ♩=100 两秒之后 = 周期 1.2 s、摆幅 ±AMP；全程没有非数、角度有界", () => {
    let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const a = run(metroStart(90), 10, (t) => (Math.floor(t * 60) % 2 ? 20 : 400) * (0.5 + rnd()));
    assert(a.th.every(Number.isFinite), "没有非数");
    assert(Math.max(...a.th.map(Math.abs)) < 4 * AMP, `角度有界（最大 ${Math.max(...a.th.map(Math.abs)).toFixed(1)}°）`);
    const b = run(a.s, 5, () => 100), tail = b.th.slice(-180), tt = b.t.slice(-180);   // 停下后再看最后 3 秒（两三个来回）
    assert(Math.abs(period(tail, tt) - 1.2) < 0.03, `周期 ${period(tail, tt).toFixed(3)}`);
    assert(Math.abs(Math.max(...tail.map(Math.abs)) - AMP) < 2, `摆幅 ${Math.max(...tail.map(Math.abs)).toFixed(1)}`);
  });
  it("正中静止（唯一不动的点）也会自己摆起来；算出非数 = 从头放手", () => {
    const r = run({ th: 0, v: 0, w: Math.PI * 1.5 }, 4, () => 90), tail = r.th.slice(-60);
    assert(Math.abs(Math.max(...tail.map(Math.abs)) - AMP) < 2, "从正中静止摆起来了");
    const n = metroStep({ th: NaN, v: 1, w: 3 }, 90, 1 / 60);
    assert(Number.isFinite(n.th) && Number.isFinite(n.v), "非数 = 从头放手");
  });
});
