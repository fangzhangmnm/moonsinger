// audio-watch.test.ts —— 盯音频时钟（src/singer/audio.ts createAudioWatch）：state 写着 running 而时钟不走 = 记一条；又走了再记一条。**只记账，不动上下文**。
// created 2026-11-08 by Claude Fable 5.1。同一晚改过一次：v0.16.26 这里会 suspend + resume「踢一脚」，真机上把正在起的设备打断重来（第一个音从等 1 秒变成 6.7 秒），撤了。
//   这份测试守的头一条就是「它不许碰上下文」。
import { describe, it, eq, assert } from "./runner.mjs";
import { createAudioWatch, STUCK_MS } from "../src/singer/audio.ts";

function rig() {
  // 上下文只给读的两样；suspend / resume 留着当绊线：谁叫了就记下来
  const c = { state: "running", currentTime: 0, touched: 0, suspend() { this.touched++; return Promise.resolve(); }, resume() { this.touched++; return Promise.resolve(); } };
  let hidden = false, has = true; const notes: string[] = [];
  const w = createAudioWatch({ ctx: () => (has ? c : null), hidden: () => hidden, note: (m) => notes.push(m) });
  return { c, w, notes, hide: (v: boolean) => { hidden = v; }, drop: () => { has = false; } };
}

describe("盯音频时钟（只记账）", () => {
  it("时钟在走 = ok，不记", () => {
    const r = rig(); r.w.arm(0);
    for (let t = 16; t < 5000; t += 16) { r.c.currentTime += 0.016; eq(r.w.check(t), "ok"); }
    eq(r.notes.length, 0); eq(r.c.touched, 0);
  });
  it("刚起的设备停 1 秒多再走（真机上量到的）= 不记", () => {
    const r = rig(); r.w.arm(0);
    for (let t = 16; t < 1600; t += 16) eq(r.w.check(t), "wait");
    r.c.currentTime = 0.344; eq(r.w.check(1616), "ok");
    eq(r.notes.length, 0); assert(STUCK_MS >= 2000, "门槛要比设备正常起的时间长得多");
  });
  it("state 写着 running、时钟超过 STUCK_MS 没走 = 记一条（只一条）；又走了再记一条带停了多久；从头到尾不碰上下文", () => {
    const r = rig(); r.c.currentTime = 21.229; r.w.arm(0);
    const got: string[] = [];
    for (let t = 250; t <= STUCK_MS + 3000; t += 250) got.push(r.w.check(t));
    eq(got.at(-1), "frozen"); eq(r.notes.length, 1, r.notes.join(" | "));
    assert(/clock frozen \d+ ms while state=running/.test(r.notes[0]), r.notes[0]);
    r.c.currentTime += 0.2; eq(r.w.check(STUCK_MS + 3250), "ok");
    assert(/clock running again after \d+ ms frozen/.test(r.notes[1]), r.notes[1]);
    eq(r.c.touched, 0, "不许 suspend / resume（v0.16.26 踢一脚 = 帮倒忙）");
  });
  it("suspended / interrupted = 不算停着（叫醒是别处的事），醒来之后才开始算", () => {
    const r = rig(); r.c.state = "interrupted"; r.w.arm(0);
    for (let t = 250; t <= 6000; t += 250) eq(r.w.check(t), "wait");
    eq(r.notes.length, 0);
    r.c.state = "running"; eq(r.w.check(6250), "wait", "刚醒：从这儿起算");
  });
  it("看不见 / 没有上下文 = 什么都不做", () => {
    const r = rig(); r.w.arm(0); r.hide(true);
    for (let t = 250; t <= 6000; t += 250) eq(r.w.check(t), "none");
    eq(r.notes.length, 0);
    r.hide(false); r.drop(); eq(r.w.check(7000), "none");
  });
  it("回前台那一刻 arm = 后台里停的那一段不算", () => {
    const r = rig(); r.c.currentTime = 21.229; r.w.arm(0);
    r.hide(true); r.w.check(30_000); r.hide(false);
    r.w.arm(34_000);
    eq(r.w.check(34_250), "wait"); eq(r.notes.length, 0);
    r.c.currentTime += 0.2; eq(r.w.check(34_500), "ok");
  });
});
