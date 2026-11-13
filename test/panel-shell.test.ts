// test/panel-shell.test.ts —— 面板外壳是以后唯一的面板外壳（统筹「v0.17.26 收」第 2 条、「v0.17.28 收」选 B）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   规矩：新做的面板一律用壳（界面零件库 openPanelShell）；老的小面板哪一张下次要大改，那次顺手搬。
//   守：① .settings-card 那一套只许是下面这五处老的小问答面板（多一处 = 红；搬走一处 = 从名单里删）② 设置、页面设置在壳上。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL): string[]; statSync(u: URL): { isDirectory(): boolean }; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const read = (f: string): string => fs.readFileSync(new URL(f, ROOT), "utf8");
function* walk(dir: string): Generator<string> { for (const f of fs.readdirSync(new URL(`${dir}/`, ROOT))) { const p = `${dir}/${f}`; if (fs.statSync(new URL(p, ROOT)).isDirectory()) yield* walk(p); else if (/\.ts$/.test(f)) yield p; } }
const code = (f: string) => read(f).replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1").split("\n").map((l: string) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");

/** 还用 .settings-card 的五处（按面板的标题认）。 */
const LEGACY = [/_t\("不出声的声部"\)/, /_t\("导出歌声（mp3）"\)/, /_t\("导出"\)\}/, /_t\("乐谱（PDF）"\)/, /paperLabel\(id\)/];

describe("面板外壳 · 老的 .settings-card 只剩名单上的五处", () => {
  it("src 里用 settings-card 的地方 = 名单上的五处，一处不多", () => {
    const hits = [...walk("src")].flatMap((f) => code(f).split("\n").filter((l) => /settings-card/.test(l)).map((l) => `${f}: ${l.trim().slice(0, 140)}`));
    eq(hits.length, LEGACY.length, hits.join("\n"));
    for (const re of LEGACY) assert(hits.some((h) => re.test(h)), `名单上的这一处找不到了（搬走了就从名单里删）：${re}`);
  });
  it("设置、页面设置在壳上（openPanelShell），不再拼 offer-card", () => {
    const main = code("src/app/main.ts");
    for (const fn of ["function openSettings(", "function openPaperSheet("]) {
      const i = main.indexOf(fn), j = main.indexOf("\nfunction ", i + 10), body = main.slice(i, j > 0 ? j : undefined);
      assert(i > 0 && /openPanelShell</.test(body) && !/offer-card/.test(body), `${fn} 要用壳`);
    }
  });
});
