// 排版不读这一页的界面语言（设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.9 节守卫 8；施工单 1b-3）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）
//   排版里要写的几个字（「编排」、编排写错的说明、换气后面的「吸 / 深吸」）按 opts.locale 翻：同样的输入 = 同样的版面，worker / 测试 / PDF 一样。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e: string): string; readdirSync(p: URL, o: { recursive: true }): string[] };
import { describe, it, assert, eq } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const RENDER = new URL("../src/render/", import.meta.url);
describe("守卫 8：排版不读界面语言", () => {
  it("src/render/ 下从 i18n 只拿 _tIn 和 Lang 类型（不用 _t / lang()）", () => {
    for (const f of fs.readdirSync(RENDER, { recursive: true }).filter((x) => x.endsWith(".ts"))) {
      const src = fs.readFileSync(new URL(f, RENDER), "utf8");
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"[^"]*i18n\/index\.ts"/g)) {
        const names = m[1]!.split(",").map((x) => x.trim().replace(/^type\s+/, "")).filter(Boolean);
        for (const n of names) assert(n === "_tIn" || n === "Lang", `${f} 从 i18n 拿了 ${n}`);
      }
      assert(!/\b_t\(/.test(src), `${f} 里调了 _t()`);
    }
  });
  it("同一首歌：locale 换了只换那几个字，别的图元一个不变；没给 locale = 报错", () => {
    const song = fullSong();
    const base = { width: 600, sp: 10, at: { paper: song.papers[0]!.id, part: song.parts[0]!.id }, parts: song.parts.map((p, k) => ({ id: p.id, name: p.id, first: k === 0 })), measure: createTextMeasure((s: string) => s.length * 8), autoBars: true };
    const zh = engrave(song, { ...base, locale: "zh" }).prims, en = engrave(song, { ...base, locale: "en" }).prims;
    const words = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text").map((p) => p.s);
    assert(words(zh).includes("编排　") && words(zh).some((s) => s === "吸" || s === "深吸"), "中文：编排 / 吸 都在");
    assert(words(en).includes("Arrangement ") && words(en).some((s) => s === "in" || s === "deep in"), "英文：Arrangement / in 都在");
    eq(en.length, zh.length, "图元个数一样");
    let diff = 0; zh.forEach((p, i) => { if (JSON.stringify(p) !== JSON.stringify(en[i])) diff++; });
    assert(diff > 0 && diff <= 8, `只有那几个字不一样（实际 ${diff} 个）`);
    let threw = false; try { engrave(song, { ...base } as never); } catch { threw = true; }
    assert(threw, "没给 locale = 报错，不偷偷读当前语言");
  });
});
