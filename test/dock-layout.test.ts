// 底座在哪（styles.css ↔ src/app/workspace.ts SIDE_DOCK_MQ）：默认贴底，只有「横屏且矮」（winmini 档）才放左边一栏——CSS 里每一个按长宽比分的 @media 都必须是这一串，
//   JS 里按长宽比的 matchMedia 也只许这一串（不然 CSS 和 JS 各算各的、底座在左边时谱宽算错）。created 2026-10-21 by Claude Fable 5.1
//   user 2026-10-21「ui默认键盘在下面，就是很长很宽的屏幕，键盘，混音台，都在下面，只有极端情况（其实就是winmini一个）才考虑放左边」
import { describe, it, eq, assert } from "./runner.mjs";
import { SIDE_DOCK_MQ } from "../src/app/workspace.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string; readdirSync(u: URL): string[]; statSync(u: URL): { isDirectory(): boolean } };
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
function* walk(dir: URL): Generator<URL> { for (const f of fs.readdirSync(dir)) { const u = new URL(f + (fs.statSync(new URL(f, dir)).isDirectory() ? "/" : ""), dir); if (u.pathname.endsWith("/")) yield* walk(u); else if (/\.ts$/.test(f)) yield u; } }

describe("底座在哪：贴底是默认，左边一栏只有 winmini 档", () => {
  it("styles.css 里按长宽比分的 @media 只有 SIDE_DOCK_MQ 这一串（没有裸的 min- / max-aspect-ratio）", () => {
    const lines = css.split("\n").filter((l) => /^@media[^\n]*aspect-ratio/.test(l.trim()) && !/^\s*\/\*|^\s{2,}/.test(l));   // 只看顶层的 @media 行（注释 / 缩进在块里的不算）
    assert(lines.length >= 3, "至少三块（舞台 / 工具条折行 / 小条）");
    for (const l of lines) eq(l.trim(), `@media ${SIDE_DOCK_MQ} {`, l.trim());
  });
  it("基础规则（不在 @media 里）= main 上 pad 下", () => {
    assert(/^#stage \{[^}]*grid-template-areas: "main" "pad"/m.test(css), "#stage 基础（顶层、不缩进）= 上下两行");
    assert(!/grid-template-areas: "main pad"/.test(css), "右边一栏的旧排法没了");
    assert(/grid-template-areas: "pad main"/.test(css.slice(css.indexOf(`@media ${SIDE_DOCK_MQ}`))), "winmini 档 = pad 在左");
  });
  it("src 里按长宽比的 matchMedia 只许 SIDE_DOCK_MQ", () => {
    const bad: string[] = [];
    for (const u of walk(new URL("../src/", import.meta.url))) {
      const t = fs.readFileSync(u, "utf8");
      if (u.pathname.endsWith("/workspace.ts")) continue;
      for (const m of t.matchAll(/matchMedia\(([^)]*)\)/g)) if (/aspect-ratio/.test(m[1])) bad.push(`${u.pathname.split("/src/")[1]}: ${m[0]}`);
    }
    eq(bad.join("; "), "", "裸写的长宽比 matchMedia");
  });
});
