// 不印的提示最后贴、只躲不推（frame/hints.ts，第八刀 8-5）：纯几何。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
import { describe, it, eq, assert } from "./runner.mjs";
import { placeHints, type Hint } from "../src/render/frame/hints.ts";
const box = (x0: number, x1: number, y0: number, y1: number) => ({ x0, x1, y0, y1 });
const h = (tries: { x: number; y: number }[], climb?: number): Hint => ({ part: { ink: box(0, 10, -8, 2), prims: [] }, tries, ...(climb ? { climb } : {}) });
describe("不印的提示（frame/hints.ts）", () => {
  it("取第一个不压墨的位置；印的东西一个都不挪", () => {
    const printed = [box(0, 20, 0, 10)], at = placeHints(printed, [h([{ x: 0, y: 5 }, { x: 30, y: 5 }])]);
    eq(at[0]!.x, 30); assert(at[0]!.ok, "找到了"); eq(JSON.stringify(printed), JSON.stringify([box(0, 20, 0, 10)]), "印的墨没被改");
  });
  it("都压墨又不许往上找 = 用最后一个、ok = false（不相撞检查会报出来）", () => {
    const at = placeHints([box(-100, 100, -100, 100)], [h([{ x: 0, y: 0 }, { x: 5, y: 5 }])]);
    eq(`${at[0]!.x},${at[0]!.y},${at[0]!.ok}`, "5,5,false");
  });
  it("都压墨、给了一格多高：把这几个位置一格一格往上挪着找", () => {
    const at = placeHints([box(0, 20, -30, 10)], [h([{ x: 0, y: 5 }], 12)]);
    assert(at[0]!.ok && at[0]!.y === 5 - 4 * 12, `y = ${at[0]!.y}`);
  });
  it("先贴的提示也算墨：后贴的躲开它", () => {
    const at = placeHints([], [h([{ x: 0, y: 0 }]), h([{ x: 0, y: 0 }, { x: 20, y: 0 }])]);
    eq(at[1]!.x, 20);
  });
  it("pad：离墨至少这么远", () => {
    eq(placeHints([box(11, 20, -8, 2)], [h([{ x: 0, y: 0 }, { x: 40, y: 0 }])], 2)[0]!.x, 40, "差 1 < pad 2 = 算压");
    eq(placeHints([box(13, 20, -8, 2)], [h([{ x: 0, y: 0 }, { x: 40, y: 0 }])], 2)[0]!.x, 0, "差 3 ≥ pad = 不压");
  });
});
