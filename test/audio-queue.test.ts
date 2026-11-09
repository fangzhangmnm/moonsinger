// audio-queue.test.ts —— 排着的声音有多少（src/singer/audio.ts createQueueMeter / shouldAutoFlush）。created 2026-11-08 by Claude Fable 5.1
//   user 11-08 真机：探针上每一段都正常，听到的却晚 300–700 ms。第一份黑匣子里设备起来时时钟停 1 秒、然后一口气跳 344 + 243 ms——
//   一口气多算的声音排着队播，之后每个音都排在后面。量法 = 时钟走的 − 墙上过的；这里拿那份黑匣子的数当样本。
import { describe, it, eq, assert } from "./runner.mjs";
import { createQueueMeter, shouldAutoFlush, AUTO_FLUSH_MS, BURST_SETTLE_MS } from "../src/singer/audio.ts";

describe("排着的声音：时钟比墙上的钟多走了多少", () => {
  it("真机那一次：停 1 秒，40 ms 里跳 344 + 243 → 排着 ~550 ms，之后一直带着", () => {
    const m = createQueueMeter(); m.arm();
    let now = 0, ct = 0;
    for (; now < 1000; now += 40) m.feed(now, ct);                 // 设备在起：时钟不走
    eq(m.queued(now, ct), null, "时钟还没动 = 量不出");
    ct += 0.344; m.feed(now, ct); now += 40; ct += 0.243; m.feed(now, ct);   // 一口气跳
    for (let k = 0; k < 50; k++) { now += 40; ct += 0.040; m.feed(now, ct); }   // 之后正常走
    const q = m.queued(now, ct)!; assert(q > 480 && q < 600, `排着 ${q}`);
    const b = m.burst()!; assert(b > 480 && b < 600, `这一次多算了 ${b}`);
    eq(m.anchorAt(), 960, "时钟开始走的那一刻 = 动之前最后一下（设备起了多久从这儿算）");
    for (let k = 0; k < 500; k++) { now += 40; ct += 0.040; m.feed(now, ct); }   // 再过 20 秒：还带着
    assert(Math.abs(m.queued(now, ct)! - q) < 5, "正常走的时候排队的量不变");
  });
  it("起得干净（时钟一动就按实际速度走）= 排着 ~0", () => {
    const m = createQueueMeter(); m.arm();
    let now = 0, ct = 0; m.feed(now, ct);
    for (let k = 0; k < 60; k++) { now += 40; ct += 0.040; m.feed(now, ct); }
    assert(m.queued(now, ct)! <= 5, String(m.queued(now, ct))); assert(m.burst()! <= 5);
  });
  it("中途断过音（时钟停了没追回来）不当成负的排队，也不盖住后来的", () => {
    const m = createQueueMeter(); m.arm();
    let now = 0, ct = 0; m.feed(now, ct);
    for (let k = 0; k < 30; k++) { now += 40; ct += 0.040; m.feed(now, ct); }
    now += 800; m.feed(now, ct);                                    // 停了 0.8 秒，没追
    eq(m.queued(now, ct), 0);
    ct += 0.300; now += 40; m.feed(now, ct);                        // 之后又一口气多算 0.3 秒
    const q = m.queued(now, ct)!; assert(q > 220 && q < 320, `排着 ${q}`);
  });
  it("arm = 重新量（清了一次 / 重新起了一次）", () => {
    const m = createQueueMeter(); m.arm();
    m.feed(0, 0); m.feed(40, 0.5); m.feed(80, 0.54);
    assert(m.queued(80, 0.54)! > 400);
    m.arm(); eq(m.queued(120, 0.58), null);
    m.feed(120, 0.58); m.feed(160, 0.62); m.feed(200, 0.66);
    assert(m.queued(200, 0.66)! <= 5);
  });
  it("自动清：多算了才清；关了不清；连着清 2 次还是多 = 不再清（不来回重启）", () => {
    eq(shouldAutoFlush(550, true, 0), true); eq(shouldAutoFlush(550, true, 1), true); eq(shouldAutoFlush(550, true, 2), false);
    eq(shouldAutoFlush(550, false, 0), false, "开关关着 = 以前的样子");
    eq(shouldAutoFlush(AUTO_FLUSH_MS, true, 0), false); eq(shouldAutoFlush(30, true, 0), false);
    assert(BURST_SETTLE_MS >= 300 && BURST_SETTLE_MS <= 1500);
  });
});
