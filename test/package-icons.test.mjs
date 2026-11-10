// package-icons.test.mjs —— 内部库（图库 / 参考窗 / workbench-elements）界面里点名要的图标，页面里都得有。created 2026-11-10 by Claude Fable 5.2
//   起因：收 @internal/gallery 0.9.2 时查出来——库的模板里直接写 `<use href="#more"/>` 这类引用，宿主的图标表里没有这个名字 = 那颗钮是空的，没有任何报错。
//   歌库卡片右上角的「⋯」、菜单里的「下载」「移到文件夹」「放回原处」「只留在云端」那几项的图标，从接歌库那天起就一直是空的（v0.16.95 补齐）。
//   以后升级任何一个内部库：它新点名的图标没进 index.html = 这里红（去 assets 重跑 extract-icons.py + scripts/inline-sprites.py）。
//   两种点名都抓：模板里的 `<use href="#名字">`，和代码里的 icon("名字") / iconHtml("名字")。宿主自己传进去的名字不归这里管。
import { describe, it, assert } from "./runner.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const have = new Set([...html.matchAll(/<symbol\b[^>]*\bid="([a-z0-9-]+)"/g)].map((m) => m[1]));

function* walk(dir) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) yield* walk(p); else if (/\.js$/.test(f)) yield p; } }
/** 一个包的 dist 里点名的图标。 */
function wanted(pkg) {
  const out = new Set(), dir = path.join(ROOT, "node_modules", "@internal", pkg, "dist");
  if (!fs.existsSync(dir)) return out;
  for (const f of walk(dir)) {
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/href=\\?"#([a-z0-9-]+)/g)) if (m[1] !== "id") out.add(m[1]);   // 「#id」= 参考窗注释里讲道理用的占位词，不是图标名
    for (const m of src.matchAll(/\bicon(?:Html)?\(\s*["']([a-z0-9-]+)["']/g)) out.add(m[1]);
  }
  return out;
}

describe("内部库点名的图标，页面里都有", () => {
  for (const pkg of ["gallery", "reference-window", "workbench-elements"]) {
    it(`@internal/${pkg}`, () => {
      const missing = [...wanted(pkg)].filter((n) => !have.has(n)).sort();
      assert(missing.length === 0, `index.html 里没有这些图标：${missing.join("、")}（assets 里重跑 extract-icons.py 把它们加进去，再跑 scripts/inline-sprites.py）`);
    });
  }
  it("图库真的点了名（防这条守卫的正则哪天抓不到东西、变成空过）", () => {
    const g = wanted("gallery");
    assert(g.has("more") && g.has("star") && g.size >= 10, `只抓到 ${g.size} 个：${[...g].join(" ")}`);
  });
});
