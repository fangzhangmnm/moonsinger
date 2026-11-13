// 按钮字不折行的护栏（7-R，2026-11-12；user「建议是统一做一个代码里面的护栏，而不是靠测试」）。created 2026-11-12 by Claude Opus 5.5
//   静态查 styles.css：① .btn 自带 white-space: nowrap；② 没有规则把按钮的字放开折行（例外：按钮里的灰色说明小字 .btn small；竖排列表里一行一个的整句选项——按结构认，不按类名；设置页签过渡到 7-C）；
//   ③ 一排按钮的类只有 .btn-row 一个（格子排、一样高），老的 .strip-btns 已退役、src 里也不许再用。不逐处开浏览器量。
import { describe, it, assert, eq } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, enc: string): string; readdirSync(p: string | URL, o: { recursive: true }): string[] };
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));
describe("按钮的字不折行（styles.css）", () => {
  it(".btn 自带 white-space: nowrap", () => {
    assert(rules.some((r) => r.sel.split(",").map((s) => s.trim()).includes(".btn") && /white-space:\s*nowrap/.test(r.body)), ".btn 规则里要有 white-space: nowrap");
  });
  // 例外只有一类（统筹 2026-11-12 定，按「是什么」定义、不按类名开口子）：**竖排列表里一行一个的整句选项**——
  //   规则写成「容器 .btn」，容器自己的规则是 flex-direction: column（一行一个、竖着排），按钮左对齐（整句话，不是钮上的短字）。
  const listItem = (sel: string): boolean => {
    const m = /^(\S+)\s+\.btn$/.exec(sel); if (!m) return false;
    const box = rules.filter((r) => r.sel.split(",").map((x) => x.trim()).includes(m[1]!)), me = rules.filter((r) => r.sel.split(",").map((x) => x.trim()).includes(sel));
    return box.some((r) => /flex-direction:\s*column/.test(r.body)) && me.some((r) => /text-align:\s*left/.test(r.body));
  };
  it("没有规则把按钮的字放开折行（按钮里的 small 说明、竖排列表的整句选项除外）", () => {
    const bad = rules.filter((r) => /white-space:\s*(normal|pre-wrap|pre-line|break-spaces)/.test(r.body))
      .flatMap((r) => r.sel.split(",").map((s) => s.trim())).filter((s) => /\.btn(?![\w-])/.test(s) && !/\.btn\s+small$/.test(s) && !listItem(s));   // 7-C：设置页签那条过渡（UNTIL_7C）去掉了，页签换 .btn-row
    assert(!bad.length, `这些规则让按钮的字能折行：${bad.join(" | ")}`);
  });
  it("竖排列表那一类认得出来（.sheet-choices 是；一排的格子不是）", () => {
    assert(listItem(".sheet-choices .btn"), ".sheet-choices（一行一个、整句）算竖排列表");
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
