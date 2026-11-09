// E2E 分区表守卫（W-20 测试分档）：每个 E2E 文件至少属一个区、表里列的都存在、源码 → 区的表只指向存在的区。
//   新加 E2E 没登记分区 = 这里红——分档靠的是「改了哪类东西必须跑哪一档」，漏登记 = 那一档静默漏跑。
// created 2026-10-13 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { AREAS, HELPERS, AREA_OF_PATH, SLOW, slowFor, areasOf } from "./e2e/areas.mjs";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL): string[]; readFileSync(u: URL, enc: "utf8"): string };

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
  // 2026-11-08 Fable：这台机器（WSL2）的墙上钟大约每 32 秒被往回拨 1.8 秒（量过：75 秒拨了 3 次）。E2E 拿 Date.now() 量时长 / 排先后，撞上一次就错——
  //   gate「硬超时 8 s 左右」量成 6.2–6.6 s（页面里实际 8001 ms）、follow「换行后 450 ms 那一次采样」找错采样，都是它（两条「偶尔红」查了一晚上的根因）。
  //   量时长一律用单调钟 performance.now()。真要墙上钟（文件名里的日期之类）= 行尾写 // wall-clock-ok。
  it("E2E 里不用墙上钟量时长（Date.now() 会被系统对时往回拨；用 performance.now()）", () => {
    const bad: string[] = [];
    for (const n of [...files, ...(HELPERS as string[])]) {
      fs.readFileSync(new URL(`./e2e/${n}.mjs`, import.meta.url), "utf8").split("\n").forEach((line, k) => { if (/Date\.now\(\)/.test(line) && !/wall-clock-ok/.test(line)) bad.push(`${n}.mjs:${k + 1}`); });
    }
    eq(bad.join(" "), "", `用了 Date.now()：${bad.join(" ")}`);
  });
  it("专项（慢 / 要外网的）：列的都是真的 E2E；改到它管的源码才点到它，别的改动不点", () => {
    for (const n of Object.keys(SLOW as object)) assert(files.includes(n), `SLOW 里的 ${n} 不是 E2E 文件`);
    eq(slowFor(["src/cloud-gate.ts"]).join(" "), "gate"); eq(slowFor(["src/i18n/strings.ts"]).join(" "), "i18n-en");
    eq(slowFor(["src/library-home.ts"]).join(" "), "folder-home"); eq(slowFor(["src/app-store.ts"]).join(" "), "gate folder-home");
    eq(slowFor(["src/ui/score-overlay.ts", "src/app/main.ts", "styles.css"]).join(" "), "", "改谱面 / 中枢文件不带专项");
  });
  it("源码路径表只指向存在的区；几个关键路径落对了档", () => {
    for (const [, a] of AREA_OF_PATH as [RegExp, string | string[]][]) if (Array.isArray(a)) for (const x of a) assert(x in (AREAS as object), `AREA_OF_PATH 指向不存在的区 ${x}`);
    eq(areasOf("src/app/main.ts"), "all"); eq(areasOf("styles.css"), "all"); eq(areasOf("index.html"), "all");
    eq(areasOf("service-worker.js"), "smoke"); eq(areasOf("src/app/pwa-shell.ts"), "smoke");
    eq(JSON.stringify(areasOf("src/keyboard/pad.ts")), JSON.stringify(["pad"])); eq(JSON.stringify(areasOf("src/keyboard/wheel.ts")), JSON.stringify(["pad", "studio", "play"]));
    eq(JSON.stringify(areasOf("src/ui/score-view.ts")), JSON.stringify(["score"])); eq(JSON.stringify(areasOf("src/ui/score-overlay.ts")), JSON.stringify(["score", "pad", "studio"]));
    eq(JSON.stringify(areasOf("src/engine/studio.ts")), JSON.stringify(["studio", "play"])); eq(JSON.stringify(areasOf("src/sources/sounds.ts")), JSON.stringify(["play", "studio"]));
    eq(JSON.stringify(areasOf("ai-docs/x.md")), "[]"); eq(JSON.stringify(areasOf("src/version.ts")), "[]");
    eq(areasOf("src/new-dir/thing.ts"), "all", "没登记的 src 目录 = 整套（宁多跑不漏跑）");
  });
});
