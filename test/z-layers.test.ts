// 层级守卫（v0.9.43；user「随手修，即兴的时候键盘窗口的滑窗，点不出弹窗。是不是应该收深模块」）：挂在 body 上浮着的东西（position: fixed）层级一律用 :root 的
//   --z-* 变量，不许写死数字——滑窗的滚轮写死 40，「即兴」从歌库叠上来的舞台是 --z-overlay + 1，滚轮就压在下面看不见。created 2026-10-10 by Claude Opus 5.5
import { describe, it, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, enc: string): string };
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
describe("层级（styles.css）", () => {
  it("position: fixed 的规则里 z-index 都是 var(--z-…)", () => {
    const bad: string[] = [];
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2];
      if (!/position:\s*fixed/.test(body)) continue;
      const z = /z-index:\s*([^;]+);?/.exec(body)?.[1]?.trim();
      if (z && !/^(var\(--z-|calc\(var\(--z-)/.test(z)) bad.push(`${m[1].trim()} → ${z}`);
    }
    assert(!bad.length, bad.join("\n"));
  });
});
