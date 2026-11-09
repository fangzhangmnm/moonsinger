// audio-watch.test.ts —— 盯音频时钟（src/singer/audio.ts createAudioWatch）：说在跑、其实停着 = 踢一脚；刚起的设备不踢；看不见不动。
// created 2026-11-08 by Claude Fable 5.1（user 真机黑匣子：iPad 主屏独立窗回前台时 ctx running、currentTime 停在 34 秒前；第一次按键时钟停 1 秒才走）
import { describe, it, eq, assert } from "./runner.mjs";
import { createAudioWatch, STUCK_MS, KICK_EVERY_MS } from "../src/singer/audio.ts";

function rig() {
  const c = { state: "running", currentTime: 0, suspends: 0, resumes: 0, suspend() { this.suspends++; return Promise.resolve(); }, resume() { this.resumes++; return Promise.resolve(); } };
  let hidden = false, has = true; const notes: string[] = [];
  const w = createAudioWatch({ ctx: () => (has ? c : null), hidden: () => hidden, note: (m) => notes.push(m) });
  return { c, w, notes, hide: (v: boolean) => { hidden = v; }, drop: () => { has = false; } };
}

describe("盯音频时钟", () => {
  it("时钟在走 = ok，不踢", () => {
    const r = rig(); r.w.arm(0);
    for (let t = 16; t < 5000; t += 16) { r.c.currentTime += 0.016; eq(r.w.check(t), "ok"); }
    eq(r.c.suspends, 0); eq(r.notes.length, 0);
  });
  it("刚起的设备停 1 秒再走（真机上量到的）= 不踢", () => {
    const r = rig(); r.w.arm(0);
    for (let t = 16; t < 1000; t += 16) eq(r.w.check(t), "wait");
    r.c.currentTime = 0.344; eq(r.w.check(1016), "ok");
    eq(r.c.suspends, 0, "没到 STUCK_MS 不踢"); assert(STUCK_MS > 1000, "门槛要比设备正常起的时间长");
  });
  it("state 写着 running、时钟超过 STUCK_MS 没走 = 踢一脚（suspend + resume），记一条；踢完走了再记一条", async () => {
    const r = rig(); r.c.currentTime = 21.229; r.w.arm(0);
    const got: string[] = [];
    for (let t = 250; t <= STUCK_MS; t += 250) got.push(r.w.check(t));
    eq(got.at(-1), "kicked", got.join(",")); eq(got.filter((x) => x === "kicked").length, 1); eq(r.c.suspends, 1); await Promise.resolve(); await Promise.resolve(); eq(r.c.resumes, 1);
    assert(/clock frozen \d+ ms while state=running/.test(r.notes[0]), r.notes[0]);
    eq(r.w.check(STUCK_MS + 500), "wait", "刚踢过：隔 KICK_EVERY_MS 才再踢"); eq(r.c.suspends, 1);
    r.c.currentTime += 0.2; eq(r.w.check(STUCK_MS + 750), "ok");
    assert(/clock running again after 1 kick/.test(r.notes.at(-1)!), r.notes.at(-1));
  });
  it("踢了还不走 = 隔 KICK_EVERY_MS 再踢一次（不连踢）", () => {
    const r = rig(); r.w.arm(0);
    for (let t = 250; t <= STUCK_MS + KICK_EVERY_MS + 500; t += 250) r.w.check(t);
    eq(r.c.suspends, 2);
  });
  it("suspended / interrupted = 不归这里管（叫醒是 wake 的事），醒来之后才开始算停了多久", () => {
    const r = rig(); r.c.state = "interrupted"; r.w.arm(0);
    for (let t = 250; t <= 5000; t += 250) eq(r.w.check(t), "wait");
    eq(r.c.suspends, 0);
    r.c.state = "running";
    eq(r.w.check(5250), "wait", "刚醒：从这儿起算"); eq(r.c.suspends, 0);
  });
  it("看不见 / 没有上下文 = 什么都不做", () => {
    const r = rig(); r.w.arm(0); r.hide(true);
    for (let t = 250; t <= 6000; t += 250) eq(r.w.check(t), "none");
    eq(r.c.suspends, 0);
    r.hide(false); r.drop(); eq(r.w.check(7000), "none");
  });
  it("回前台那一刻 arm = 后台里停的那一段不算", () => {
    const r = rig(); r.c.currentTime = 21.229; r.w.arm(0);
    r.hide(true); r.w.check(30_000); r.hide(false);
    r.w.arm(34_000);   // 回前台
    eq(r.w.check(34_250), "wait", "刚回来不踢"); eq(r.c.suspends, 0);
    r.c.currentTime += 0.2; eq(r.w.check(34_500), "ok");
  });
});
