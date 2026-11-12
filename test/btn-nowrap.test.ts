// 按钮字不折行的护栏（7-R，2026-11-12；user「建议是统一做一个代码里面的护栏，而不是靠测试」）。created 2026-11-12 by Claude Opus 5.5
//   静态查 styles.css：① .btn 自带 white-space: nowrap；② 除了按钮里的灰色说明小字（.btn small），没有规则把按钮的字放开折行；
//   ③ 一排按钮的类只有 .btn-row 一个（格子排、一样高），老的 .strip-btns 已退役、src 里也不许再用。不逐处开浏览器量。
import { describe, it, assert, eq } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, enc: string): string; readdirSync(p: string | URL, o: { recursive: true }): string[] };
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));
describe("按钮的字不折行（styles.css）", () => {
  it(".btn 自带 white-space: nowrap", () => {
    assert(rules.some((r) => r.sel.split(",").map((s) => s.trim()).includes(".btn") && /white-space:\s*nowrap/.test(r.body)), ".btn 规则里要有 white-space: nowrap");
  });
  // 明着的例外名单（名单外 = 红）；加一条要写清为什么、要统筹点头（2026-11-12 两条都已报统筹待定）
  const ALLOW: Record<string, string> = {
    ".set-tabs .btn": "设置的五个页签：一排五格，放不下折两行、不截断（v0.16.90：英文「Music theory helper」在 iPad mini 竖屏放不下）",
    ".sheet-choices .btn": "面板里一行一个的选项（整句说明）= 列表，不是一排按钮",
  };
  it("没有规则把按钮的字放开折行（按钮里的 small 说明、名单上的除外）", () => {
    const bad = rules.filter((r) => /white-space:\s*(normal|pre-wrap|pre-line|break-spaces)/.test(r.body))
      .flatMap((r) => r.sel.split(",").map((s) => s.trim())).filter((s) => /\.btn(?![\w-])/.test(s) && !/\.btn\s+small$/.test(s) && !(s in ALLOW));
    assert(!bad.length, `这些规则让按钮的字能折行：${bad.join(" | ")}`);
  });
  it("一排按钮 = .btn-row（格子、一样高）；.strip-btns 退役", () => {
    const row = rules.filter((r) => r.sel === ".btn-row");
    eq(row.length, 1, ".btn-row 只定义一次");
    assert(/display:\s*grid/.test(row[0]!.body) && /grid-auto-rows:\s*1fr/.test(row[0]!.body), ".btn-row 是格子、每格一样高");
    const src = new URL("../src/", import.meta.url), hits: string[] = [];
    for (const f of fs.readdirSync(src, { recursive: true })) if (/\.ts$/.test(f) && /strip-btns/.test(fs.readFileSync(new URL(f, src), "utf8"))) hits.push(f);
    assert(!hits.length && !/strip-btns/.test(css), `老的一排按钮类还在用：${hits.join(" ")}`);
  });
});
