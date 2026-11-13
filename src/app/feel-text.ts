// feel-text.ts —— 手感横幅那一行字（纯函数，test/feel-text.test.ts）。原来拼在 main.ts 的探针宿主里。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）；施工单「手感横幅照实说『这次起来时多算了多少』」（统筹，2026-11-12 傍晚）。
// 起因：user 18:42 又碰到按键晚半秒（开发版，iPad），横幅上写着「声音排队 3 ms」——那只表每清一次从零重新量，清完读到几毫秒是必然的，横幅在说它不知道的事。
// 现在：
//   · 这一次声音起来时量到的多算了多少（src/singer/audio.ts audioStartBurst：清过不归零）超过 30 ms = 照实写「这次声音起来时多算了 N ms」，宿主在后面放一颗「重启声音」；
//   · 「声音排队 N ms」那一项拿掉（它量不到已经交出去的那一截、清一次就从零重量，不能当证据；起来时的那个数才是能对上「按键晚了多少」的）；
//   · 排着的多到要清（> 100 ms）那一句留着，数字写成「至少」（量到的只是还没交出去的那一截）。
// 只改显示；起、清、垫脚的行为不归这里。
import { _t } from "../i18n/index.ts";
import type { FeelReading } from "./feel-probe.ts";

/** 起来时多算了这么多以上 = 横幅上照实写、放「重启声音」（统筹定的线；和 audio.ts 的 FLUSH_IDLE_MS 同一个数，干净的读数是 1–7 ms）。 */
export const START_BURST_SHOW_MS = 30;

export interface FeelBanner {
  text: string;
  /** 点这一行字 = 清掉排着的声音（不是收起）。 */
  flush: boolean;
  /** 后面放一颗「重启声音」（和设置里那一颗同一个动作）。 */
  revive: boolean;
}

/** late = 有一项超了门槛；startBurst = 这一次声音起来时多算了多少（ms；没量过 = null）；slow = 分账秒表里最慢的一步（宿主拼好的字）。 */
export function feelBanner(r: FeelReading, late: boolean, startBurst: number | null, slow: string): FeelBanner {
  const revive = startBurst !== null && startBurst > START_BURST_SHOW_MS;
  const start = revive ? _t("这次声音起来时多算了 {n} ms：按键可能晚这么多", { n: startBurst }) + " ｜ " : "";
  const flush = (r.queued ?? 0) > 100;   // 平时空当里会自己清（audio.ts ②）；到了横幅会自己露出来的量（FEEL_LIMITS.queued）还没清掉 = 点这一行手动清
  if (flush) return { flush, revive, text: start + _t("声音排着队：至少 {qd} ms（量不到已经交出去的那一截）· 点这里清掉 ｜ 等主线程 {q} ms · 到出声 {s} ms · 声音块 平常 {t} ms / 最长 {a} ms", { qd: r.queued ?? 0, q: r.queue, s: r.toSound, t: r.audioTypical, a: r.audioStep }) };
  return { flush, revive, text: start + (late
    ? _t("按键晚了：等主线程 {q} ms · 到出声 {s} ms · 主线程最长停 {st} ms · 声音块 平常 {t} ms / 最长 {a} ms · 最慢一步 {slow}（点一下收起这一次）", { q: r.queue, s: r.toSound, st: r.stall, t: r.audioTypical, a: r.audioStep, slow })
    : _t("手感：等主线程 {q} ms · 到出声 {s} ms · 主线程最长停 {st} ms · 声音块 平常 {t} ms / 最长 {a} ms（点一下收起这一次）", { q: r.queue, s: r.toSound, st: r.stall, t: r.audioTypical, a: r.audioStep })) };
}
