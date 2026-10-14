// E2E 分区表守卫（W-20 测试分档）：每个 E2E 文件至少属一个区、表里列的都存在、源码 → 区的表只指向存在的区。
//   新加 E2E 没登记分区 = 这里红——分档靠的是「改了哪类东西必须跑哪一档」，漏登记 = 那一档静默漏跑。
// created 2026-10-13 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { AREAS, HELPERS, AREA_OF_PATH, areasOf } from "./e2e/areas.mjs";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL): string[] };

const files = fs.readdirSync(new URL("./e2e/", import.meta.url)).filter((f) => f.endsWith(".mjs")).map((f) => f.slice(0, -4)).filter((n) => !(HELPERS as string[]).includes(n));
const listed = new Set(Object.values(AREAS as Record<string, string[]>).flat());

describe("E2E 分区表", () => {
  it("每个 E2E 文件至少属一个区（新加的要登记进 test/e2e/areas.mjs）", () => {
    const orphan = files.filter((n) => !listed.has(n));
    eq(orphan.join(" "), "", `没分区的 E2E：${orphan.join(" ")}`);
  });
  it("表里列的文件都存在（删 / 改名 E2E 要同步改表）", () => {
    const ghost = [...listed].filter((n) => !files.includes(n));
    eq(ghost.join(" "), "", `表里有、目录里没有：${ghost.join(" ")}`);
  });
  it("源码路径表只指向存在的区；几个关键路径落对了档", () => {
    for (const [, a] of AREA_OF_PATH as [RegExp, string | string[]][]) if (Array.isArray(a)) for (const x of a) assert(x in (AREAS as object), `AREA_OF_PATH 指向不存在的区 ${x}`);
    eq(areasOf("src/app/main.ts"), "all"); eq(areasOf("styles.css"), "all"); eq(areasOf("index.html"), "all");
    eq(areasOf("service-worker.js"), "smoke"); eq(areasOf("src/app/pwa-shell.ts"), "smoke");
    eq(JSON.stringify(areasOf("src/keyboard/pad.ts")), JSON.stringify(["pad"])); eq(JSON.stringify(areasOf("src/keyboard/wheel.ts")), JSON.stringify(["pad", "studio", "play"]));
    eq(JSON.stringify(areasOf("src/ui/score-view.ts")), JSON.stringify(["score"]));
    eq(JSON.stringify(areasOf("src/engine/studio.ts")), JSON.stringify(["studio", "play"])); eq(JSON.stringify(areasOf("src/sources/sounds.ts")), JSON.stringify(["play", "studio"]));
    eq(JSON.stringify(areasOf("ai-docs/x.md")), "[]"); eq(JSON.stringify(areasOf("src/version.ts")), "[]");
    eq(areasOf("src/new-dir/thing.ts"), "all", "没登记的 src 目录 = 整套（宁多跑不漏跑）");
  });
});
