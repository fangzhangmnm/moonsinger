// 手感横幅照实说「这次起来时多算了多少」（施工单「手感横幅」，统筹 2026-11-12 傍晚）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：起来时多算 500 ms、随后清过（清完重新量到 3 ms）→ 横幅的字里仍然有 500 和「重启声音」；多算 1 ms = 没有这一段；「声音排队」那一项不再出现；
//   排着的多到要清那一句写「至少」。只测显示和记账，起 / 清 / 垫脚的行为不在这里。
import { describe, it, eq, assert } from "./runner.mjs";
import { feelBanner, START_BURST_SHOW_MS } from "../src/app/feel-text.ts";
import { createStartBurstLog } from "../src/singer/audio.ts";

const R = { queue: 4, toSound: 2, stall: 20, audioStep: 17, audioTypical: 16, queued: 3 as number | null };

describe("手感横幅：起来时多算了多少", () => {
  it("账：起来时量到的记下；清之后重量的那一次不记（清完读到几毫秒是必然的，不能盖掉起来时那个数）；换出声口之后新的那一次照记", () => {
    const log = createStartBurstLog();
    eq(log.get().ms, null, "没量过");
    log.measured("created", 500); eq(log.get().ms, 500);
    log.measured("flush", 3); eq(log.get().ms, 500, "清过不归零"); eq(log.get().seq, 1);
    log.measured("revive", 12); eq(log.get().ms, 12, "点了重启声音之后新的那一次"); eq(log.get().seq, 2);
    log.measured("visible", 240); eq(log.get().ms, 240, "回前台那一次起来");
  });
  it("起来时多算 500 ms、清过：字里有 500、有「重启声音」那颗钮；不再有「声音排队」那一项", () => {
    const log = createStartBurstLog(); log.measured("running", 500); log.measured("flush", 3);
    for (const late of [false, true]) {
      const b = feelBanner(R, late, log.get().ms, "谱 20 ms");
      assert(b.text.includes("500"), b.text); eq(b.revive, true); eq(b.flush, false);
      assert(!b.text.includes("声音排队"), `「声音排队」那一项拿掉了：${b.text}`);
    }
  });
  it("多算 1 ms / 正好在线上 / 没量过 = 没有这一段、没有钮", () => {
    for (const ms of [1, START_BURST_SHOW_MS, null]) { const b = feelBanner(R, false, ms, ""); eq(b.revive, false, String(ms)); assert(!b.text.includes("起来时多算"), b.text); }
    eq(feelBanner(R, false, START_BURST_SHOW_MS + 1, "").revive, true, "过线一毫秒就写");
  });
  it("排着的多到要清（> 100 ms）：点这一行 = 清；数字写「至少」；起来时那个数照写在前面", () => {
    const b = feelBanner({ ...R, queued: 180 }, true, 240, "");
    eq(b.flush, true); eq(b.revive, true);
    assert(/至少 180 ms/.test(b.text) && b.text.indexOf("240") < b.text.indexOf("180"), b.text);
  });
});
