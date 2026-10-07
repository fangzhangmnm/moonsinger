// 角色（声部）名测试：同名同种的声部带号（Vocals 1 / Vocals 2），单独一个不带号，名字一样种类不同不一起编。
// created 2026-10-07 by Claude Opus 5.5（user「然后default name如果重名的话会变成vocals vocals2这样？」→「这个应该可以现在做」）
import { describe, it, eq } from "./runner.mjs";
import { numberParts, ROLE_PRESETS } from "../src/score/roles.ts";

describe("同名声部编号", () => {
  const v = { name: "Vocals", sound: "voice.vocals" }, p = { name: "Piano", sound: "keyboard.piano" };
  it("单独一个不带号；两个同名同种 = 1 / 2（第一个也补）；别的不动", () => {
    eq(numberParts([v]).join("|"), "Vocals");
    eq(numberParts([v, p, v]).join("|"), "Vocals 1|Piano|Vocals 2");
    eq(numberParts([v, v, v]).join("|"), "Vocals 1|Vocals 2|Vocals 3");
  });
  it("名字一样但不是同一种（合唱的 Bass 和贝斯）不一起编", () => {
    const [sat, gtr] = ["voice.bass", "pluck.bass"].map((s) => ROLE_PRESETS.find((r) => r.sound === s)!);
    eq(numberParts([sat, gtr]).join("|"), "Bass|Bass");
    eq(numberParts([sat, gtr, sat]).join("|"), "Bass 1|Bass|Bass 2");
  });
});
