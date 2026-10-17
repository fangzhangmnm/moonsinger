// sing-core-defaults.test.ts —— 小月相唱法核心旋钮的持久化（候选 defaults，by value）：默认表、没写 = 默认、写了跟着候选走、别的引擎不写。created 2026-10-15 by Claude Fable 5.1
//   2026-10-15 user 拍板「齐平默认关…齐平和其他的也都放在高级设置里面可以持久化」；2026-10-17 改回齐平 0.8 + 连续（user「…加上连续过渡然后用那个默认」「齐平还是默认开吧」）。
import { describe, it, eq, assert } from "./runner.mjs";
import { emptyExtras, activeSingCore, withSingCore, SING_CORE_KEYS, type Extras } from "../src/format/project.ts";
import { TSUKUYOMI_DEFAULTS } from "../src/format/performance.ts";

describe("小月相唱法核心的旋钮（候选 defaults）", () => {
  it("默认表：齐平 0.8（= v0.12.9 之前的默认）、连续、上限 6、借元音门槛 0.4、实声；没这个角色 / 没写 = 默认表", () => {
    eq(TSUKUYOMI_DEFAULTS.level, 0.8); eq(TSUKUYOMI_DEFAULTS.levelContinuous, 1); eq(TSUKUYOMI_DEFAULTS.levelMaxDb, 6); eq(TSUKUYOMI_DEFAULTS.cleanMax, 0.4); eq(TSUKUYOMI_DEFAULTS.breath, 0);
    const got = activeSingCore(emptyExtras(), "r1");
    for (const k of SING_CORE_KEYS) eq(got[k], TSUKUYOMI_DEFAULTS[k], k);
  });
  it("写了 = 存在候选的 defaults 里、读回来；别的键还是默认；旧候选 defaults 空着 = 默认表", () => {
    const ex = withSingCore(emptyExtras(), "r1", "level", 0, "n");
    eq(activeSingCore(ex, "r1").level, 0); eq(activeSingCore(ex, "r1").levelContinuous, 1);
    const ex2 = withSingCore(ex, "r1", "levelContinuous", 0, "n");
    eq(activeSingCore(ex2, "r1").level, 0); eq(activeSingCore(ex2, "r1").levelContinuous, 0);
    assert(JSON.stringify(ex2).includes('"levelContinuous":0'), "按值进了休息室快照");
    const old = JSON.parse(JSON.stringify(ex2).replace(/"defaults":\{[^}]*\}/g, '"defaults":{}')) as Extras;   // 旧歌：候选里没写过这些键
    for (const k of SING_CORE_KEYS) eq(activeSingCore(old, "r1")[k], TSUKUYOMI_DEFAULTS[k], `旧候选 ${k}`);
    assert(activeSingCore(ex, "r1") !== activeSingCore(ex2, "r1"), "每次返回新的表");
  });
});
