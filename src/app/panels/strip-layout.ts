// src/app/panels/strip-layout.ts —— 一行横着滑的小卡片多宽（「初始设置」卡第一行；统筹 1dda0433）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   user：正好显示整数个卡时不知道右边还有。→ 放不下时，露出来的永远是「整数格 + 半格」。
//   · 都放得下（按基准宽排）= 不滑，格宽 = 基准宽、靠左排（v0.17.35，统筹 dc2b1b44：原来均分可见宽 = 宽屏上格子被拉宽；user「电脑上也用这个宽度的小图」）。
//   · 放不下 = k = 按基准宽能完整放下的格数（至少 1），格宽 =（可见宽 − k × 间隔）÷（k + 0.5）：右边界切在第 k + 1 格的正中；滑到最右 = 左边露半格。
//   纯函数：不碰 DOM（卡里量了可见宽交进来；test/strip-layout.test.ts 按几种宽度核）。

/** 每格多宽、滑不滑。visible = 那一行可见的宽（px），n = 几格，gap = 格子之间的间隔，base = 基准宽。 */
export function stripLayout(visible: number, n: number, gap: number, base: number): { cell: number; scroll: boolean } {
  if (n <= 0 || visible <= 0) return { cell: base, scroll: false };
  if (n * base + (n - 1) * gap <= visible) return { cell: base, scroll: false };
  const k = Math.max(1, Math.floor((visible + gap) / (base + gap)));
  return { cell: (visible - k * gap) / (k + 0.5), scroll: true };
}
