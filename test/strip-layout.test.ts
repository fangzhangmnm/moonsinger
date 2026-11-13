// test/strip-layout.test.ts —— 一行横着滑的小卡片：放不下时露出来的永远是「整数格 + 半格」（统筹 1dda0433）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   v0.17.35（统筹 dc2b1b44）：放得下 = 格宽就是基准宽（122）、靠左排，不再均分可见宽。
//   宽度照统筹列的：320 / 360 / 390 / 430 的手机（卡里那一行可见的宽 = 屏宽 − 两边各 16 的遮罩边 − 两边各 16 的卡片内边距）、520 / 600 的卡 × 三格和五格。
import { describe, it, eq, assert } from "./runner.mjs";
import { stripLayout } from "../src/app/panels/strip-layout.ts";

const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, e: "utf8"): string };
/** 基准宽 = 卡里真用的那个（habits-card.ts TILE_BASE；v0.17.35 起 122），从源码读，两边不会各写各的。 */
const BASE = Number(/const TILE_BASE = (\d+)/.exec(fs.readFileSync(new URL("../src/app/panels/habits-card.ts", import.meta.url), "utf8"))![1]), GAP = 10;
/** 放不下时：右边界切在第几格的百分之几；滑到最右时左边界切在第几格的百分之几。 */
function cuts(visible: number, n: number) {
  const { cell, scroll } = stripLayout(visible, n, GAP, BASE);
  const left = (i: number) => i * (cell + GAP), total = n * cell + (n - 1) * GAP;
  const at = (x: number) => { for (let i = 0; i < n; i++) if (x > left(i) && x < left(i) + cell) return (x - left(i)) / cell; return null; };
  return { cell, scroll, right: at(visible), leftAtEnd: at(total - visible) };
}

describe("一行横着滑的小卡片多宽（初始设置卡第一行）", () => {
  const widths = [...[320, 360, 390, 430].map((w) => w - 64), 520, 600];
  for (const n of [3, 5]) for (const v of widths) it(`${n} 格 × 可见宽 ${v}`, () => {
    const c = cuts(v, n);
    if (n * BASE + (n - 1) * GAP <= v) { eq(c.scroll, false); eq(c.cell, BASE, "放得下 = 格宽就是基准宽、不拉宽、不滑（v0.17.35）"); return; }
    assert(c.scroll, "放不下 = 滑");
    assert(c.right !== null && c.right >= 0.3 && c.right <= 0.7, `右边界切在某一格的 30%–70%（实得 ${c.right}）`);
    assert(c.leftAtEnd !== null && c.leftAtEnd >= 0.3 && c.leftAtEnd <= 0.7, `滑到最右：左边露半格（实得 ${c.leftAtEnd}）`);
  });
  // 五格的每个吸附位置（统筹「v0.17.30 收」跟进第 3 条）：前面几格吸附在左（格子的左边对齐可见区的左边），最后一格吸附在右（滑到头）。
  //   每个吸附位置上：左边是整格、右边切在一格的 30%–70%；滑到头那一个反过来（右边整格、左边露半格）
  for (const v of widths) it(`五格 × 可见宽 ${v}：每个吸附位置都是整数格 + 半格`, () => {
    const n = 5, { cell, scroll } = stripLayout(v, n, GAP, BASE); if (!scroll) return;
    const left = (i: number) => i * (cell + GAP), total = n * cell + (n - 1) * GAP, max = total - v;
    const at = (x: number) => { for (let i = 0; i < n; i++) if (x > left(i) + 1e-6 && x < left(i) + cell - 1e-6) return (x - left(i)) / cell; return null; };
    const snaps = [...new Set([...Array.from({ length: n }, (_, i) => Math.min(left(i), max)), max].map((x) => +x.toFixed(6)))];
    for (const x of snaps) {
      const r = at(x + v), l = at(x);
      if (x < max - 1e-6) assert(l === null && r !== null && r >= 0.3 && r <= 0.7, `吸在 ${x.toFixed(1)}：左边整格、右边切在 ${r}`);
      else assert(at(x + v - 1e-3) !== null && l !== null && l >= 0.3 && l <= 0.7, `滑到头 ${x.toFixed(1)}：左边露 ${l}`);
    }
  });
  it("手机（390）三格 = 两格半、每格 120 上下", () => {
    const c = cuts(390 - 64, 3);
    assert(c.scroll && Math.abs(c.cell - 120) < 12, `格宽 ${c.cell}`);
  });
});
