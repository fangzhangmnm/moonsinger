// test/strip-layout.test.ts —— 一行横着滑的小卡片：放不下时露出来的永远是「整数格 + 半格」（统筹 1dda0433）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   宽度照统筹列的：320 / 360 / 390 / 430 的手机（卡里那一行可见的宽 = 屏宽 − 两边各 16 的遮罩边 − 两边各 16 的卡片内边距）、520 / 600 的卡 × 三格和五格。
import { describe, it, eq, assert } from "./runner.mjs";
import { stripLayout } from "../src/app/panels/strip-layout.ts";

const GAP = 10, BASE = 150;
/** 放不下时：右边界切在第几格的百分之几；滑到最右时左边界切在第几格的百分之几。 */
function cuts(visible: number, n: number) {
  const { cell, scroll } = stripLayout(visible, n, GAP, BASE);
  const left = (i: number) => i * (cell + GAP), total = n * cell + (n - 1) * GAP;
  const at = (x: number) => { for (let i = 0; i < n; i++) if (x > left(i) && x < left(i) + cell) return (x - left(i)) / cell; return null; };
  return { cell, scroll, right: at(visible), leftAtEnd: at(total - visible), fills: Math.abs(total - (scroll ? total : visible)) < 1e-6 };
}

describe("一行横着滑的小卡片多宽（初始设置卡第一行）", () => {
  const widths = [...[320, 360, 390, 430].map((w) => w - 64), 520, 600];
  for (const n of [3, 5]) for (const v of widths) it(`${n} 格 × 可见宽 ${v}`, () => {
    const c = cuts(v, n);
    if (n * BASE + (n - 1) * GAP <= v) { eq(c.scroll, false); assert(c.fills, "放得下 = 均分、不滑"); return; }
    assert(c.scroll, "放不下 = 滑");
    assert(c.right !== null && c.right >= 0.3 && c.right <= 0.7, `右边界切在某一格的 30%–70%（实得 ${c.right}）`);
    assert(c.leftAtEnd !== null && c.leftAtEnd >= 0.3 && c.leftAtEnd <= 0.7, `滑到最右：左边露半格（实得 ${c.leftAtEnd}）`);
  });
  it("手机（390）三格 = 两格半、每格 120 上下", () => {
    const c = cuts(390 - 64, 3);
    assert(c.scroll && Math.abs(c.cell - 120) < 12, `格宽 ${c.cell}`);
  });
});
