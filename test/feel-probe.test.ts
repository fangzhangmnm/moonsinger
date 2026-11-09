// feel-probe.test.ts —— 手感探针（src/app/feel-probe.ts）：三段时间怎么量、超标才露、回到门槛下收起、没按键就睡。created 2026-11-08 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { createFeelProbe, queueDelay, FEEL_LIMITS, type FeelHost, type FeelReading } from "../src/app/feel-probe.ts";

/** 假时钟 + 假 rAF：tick(ms) 走时间并把排着的帧跑掉。 */
function rig(audio: () => { t: number; state: string; sr: number } | null = () => null) {
  let now = 1000; const frames: (() => void)[] = []; const reports: (string | null)[] = []; const notes: string[] = [];
  const host: FeelHost = { audioNow: audio, report: (t) => reports.push(t), note: (m) => notes.push(m), text: (r: FeelReading) => `q${r.queue} s${r.toSound} st${r.stall} a${r.audioStep}` };
  const probe = createFeelProbe(host, () => now, (cb) => { frames.push(cb); });
  const tick = (ms: number) => { now += ms; const fs = frames.splice(0); for (const f of fs) f(); };
  return { probe, tick, reports, notes, nowAt: () => now };
}

describe("手感探针：按下 → 接到 → 出声", () => {
  it("queueDelay：同一条时间轴才相减；epoch 毫秒 / 负数 = 不算", () => {
    eq(queueDelay(1050, 1000), 50); eq(queueDelay(1000, 1000), 0);
    eq(queueDelay(1000, 1_700_000_000_000), null, "老 WebKit 给 epoch = 不算");
    eq(queueDelay(900, 1000), null);
  });
  it("按下那一刻记排队；sound() 记到出声；都在门槛下 = 不露", () => {
    const r = rig();
    r.probe.touch(r.nowAt() - 10);   // 事件 10 ms 前发出
    r.tick(2); r.probe.sound();
    for (let i = 0; i < 10; i++) r.tick(16);
    const x = r.probe.reading()!; eq(x.queue, 10); assert(x.toSound >= 2 && x.toSound <= 3, `toSound ${x.toSound}`); eq(x.stall, 0);
    eq(r.reports.length, 0, "没超标 = 什么都不露");
  });
  it("主线程停了一下 = stall 超标就露；回到门槛下 5 s 后收起", () => {
    const r = rig();
    r.probe.touch(r.nowAt()); r.tick(16); r.tick(400);   // 两帧之间空了 400 ms
    assert(r.reports.length >= 1 && r.reports.at(-1)!.includes("st400"), `露了 ${r.reports.at(-1)}`);
    eq(r.notes.length, 1, "黑匣子一条"); assert(r.notes[0].includes("max stall 400 ms"), r.notes[0]);
    r.tick(16); eq(r.notes.length, 1, "数字没变 = 不重复记");
    for (let i = 0; i < 12_000 / 16; i++) { r.tick(16); if (r.nowAt() % 3000 < 16) r.probe.touch(r.nowAt()); }   // 继续按着键让它醒着；空档滑出 5 s 窗 + 再安静 5 s
    eq(r.reports.at(-1), null, "回到门槛下 5 s = 收起");
  });
  it("音频时钟一步跳多大 = 系统给的声音块；跳 1 s 就露出来", () => {
    let t = 0; const r = rig(() => ({ t, state: "running", sr: 48000 }));
    r.probe.touch(r.nowAt());
    for (let i = 0; i < 6; i++) { r.tick(16); if (i % 3 === 2) t += 0.048; }   // 48 ms 一跳 = 正常
    eq(r.reports.length, 0, "小步子不露");
    r.tick(16); t += 1.0; r.tick(16);   // 一下跳了 1 s
    assert(r.reports.at(-1)?.includes("a1000"), `${r.reports.at(-1)}`);
  });
  it("平常一步 / 最长：设备起得慢（停 1 秒再走）≠ 每块都大——两个数分开报（user 真机第一张截图分不清的就是这个）", () => {
    // 设备起得慢：时钟先停 1 秒，之后每帧正常走 16 ms
    let t = 0; const r = rig(() => ({ t, state: "running", sr: 48000 }));
    r.probe.touch(r.nowAt());
    for (let i = 0; i < 62; i++) r.tick(16);            // 停着 ~1 s
    for (let i = 0; i < 60; i++) { t += 0.016; r.tick(16); }   // 之后正常
    const a = r.probe.reading()!; assert(a.audioStep > 900, `最长 ${a.audioStep}`); assert(a.audioTypical >= 15 && a.audioTypical <= 17, `平常 ${a.audioTypical}`);
    // 每块都大：每 15 帧跳 240 ms
    let t2 = 0; const r2 = rig(() => ({ t: t2, state: "running", sr: 48000 }));
    r2.probe.touch(r2.nowAt());
    for (let i = 0; i < 150; i++) { if (i % 15 === 14) t2 += 0.24; r2.tick(16); }
    const b = r2.probe.reading()!; assert(b.audioTypical >= 230 && b.audioTypical <= 250, `平常 ${b.audioTypical}`);
  });
  it("黑匣子不刷屏：停一秒（每帧数字都在涨）最多半秒记一条；收起时补一条「最坏到多少」", () => {
    let t = 0; const r = rig(() => ({ t, state: "running", sr: 48000 }));
    r.probe.touch(r.nowAt());
    for (let i = 0; i < 62; i++) r.tick(16);   // 停 ~1 s：原来每帧一条 = 五十条
    assert(r.notes.length >= 1 && r.notes.length <= 3, `记了 ${r.notes.length} 条`);
    for (let i = 0; i < 12_000 / 16; i++) { t += 0.016; r.tick(16); if (r.nowAt() % 3000 < 16) r.probe.touch(r.nowAt()); }   // 之后正常；滑出 5 s 窗 + 再安静 5 s
    eq(r.reports.at(-1), null, "收起了");
    assert(/calm again; worst: .*audio step max 9\d\d ms/.test(r.notes.at(-1)!), r.notes.at(-1));
  });
  it("按键后 20 s 没再按 = 睡（不再排帧、收起小字）", () => {
    const r = rig();
    r.probe.touch(r.nowAt()); r.tick(16); r.tick(300);
    assert(r.reports.at(-1), "露着");
    for (let i = 0; i < 25_000 / 16; i++) r.tick(16);
    eq(r.reports.at(-1), null, "睡了 = 收起");
    const before = r.nowAt(); r.tick(16); eq(r.nowAt(), before + 16);
  });
  it("门槛是人能感觉到的量级", () => { assert(FEEL_LIMITS.queue >= 50 && FEEL_LIMITS.stall >= 100 && FEEL_LIMITS.audioStep >= 100); });
});
