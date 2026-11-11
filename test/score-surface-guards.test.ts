// 谱面分家（施工单 1b-9）的结构守卫：设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.9 节守卫 1（这一半）和守卫 2。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   守卫 1：公共框架（src/render/frame/、src/render/engrave.ts）不认字形和纵向的意思——不 import 字形表 / 符干 / 谱号模块（smufl、stems、glyph-box、score/clef、staff/glyphs），
//     用五线谱只经过它的入口 staff/index.ts；框架和画法都不 import 键盘、界面、app（施工单第五节裁定 1）。
//   守卫 2：版面数据是平数据——排版交出来的（engraveData）过一次 structuredClone 逐字段相等，没有函数。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e: string): string; readdirSync(p: URL): string[] };
import { describe, it, assert } from "./runner.mjs";
import { engraveData } from "../src/render/engrave.ts";
import { fullCases, FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";

const RENDER = new URL("../src/render/", import.meta.url);
const read = (rel: string) => fs.readFileSync(new URL(rel, RENDER), "utf8");
const importsOf = (src: string) => [...src.matchAll(/^\s*import\s[^;]*?from\s*"([^"]+)"/gm)].map((m) => m[1]!);
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
const NO_UI = /(^|\/)(keyboard|ui|app)\//;

describe("谱面分家守卫 1：框架不认字形和纵向、只经过五线谱的入口", () => {
  const frame = fs.readdirSync(new URL("frame/", RENDER)).filter((f) => f.endsWith(".ts")).map((f) => `frame/${f}`);
  it("frame/ 下：不 import 五线谱的任何模块、字形表、符干、谱号模块、键盘 / 界面 / app", () => {
    for (const f of frame) for (const p of importsOf(read(f))) {
      assert(!/staff\/|smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `${f} import 了 ${p}`);
    }
  });
  it("engrave.ts：五线谱只经过 staff/index.ts；不直接 import 字形表 / 符干 / 谱号模块 / 键盘 / 界面 / app", () => {
    for (const p of importsOf(read("engrave.ts"))) {
      assert(!/smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `engrave.ts import 了 ${p}`);
      if (p.includes("staff/")) assert(p === "./staff/index.ts", `engrave.ts 绕过入口 import 了 ${p}`);
    }
  });
  it("框架的代码里（去掉注释和字串）不出现五线谱的纵向和字形的名字", () => {
    const words = ["TOP_LINE", "MID_LINE", "BOTTOM_LINE", "GLYPH", "ENGRAVE", "notehead", "ledger", "CLEF_", "PERC_"];
    for (const f of ["engrave.ts", ...frame]) { const c = code(read(f)); for (const w of words) assert(!c.includes(w), `${f} 里有 ${w}`); }
  });
  it("五线谱这一种的模块不 import 键盘 / 界面 / app", () => {
    for (const f of fs.readdirSync(new URL("staff/", RENDER)).filter((x) => x.endsWith(".ts"))) for (const p of importsOf(read(`staff/${f}`))) assert(!NO_UI.test(p), `staff/${f} import 了 ${p}`);
  });
});

describe("谱面分家守卫 2：版面数据是平数据（过一次拷贝逐字段相等）", () => {
  const deepEq = (a: unknown, b: unknown, path: string): string | null => {
    if (typeof a === "function" || typeof b === "function") return `${path}：有函数`;
    if (Number.isNaN(a) && Number.isNaN(b)) return null;
    if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return Object.is(a, b) ? null : `${path}：${String(a)} ≠ ${String(b)}`;
    if (Array.isArray(a) !== Array.isArray(b)) return `${path}：数组 / 对象不一样`;
    const ka = Object.keys(a as object), kb = Object.keys(b as object);
    if (ka.length !== kb.length) return `${path}：键数 ${ka.length} ≠ ${kb.length}`;
    for (const k of ka) { const d = deepEq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`); if (d) return d; }
    return null;
  };
  for (const c of fullCases()) {
    if (c.song !== "full" && c.song !== "once") continue;
    it(`${c.song} · ${c.view}`, () => {
      const L = c.layout(), { yOf: _y, dOf: _d, lyricY: _l, ...flat } = L;   // 守卫 3 的用例走的是 engrave()（平数据 + 现算的三个函数）；平的那一份 = engraveData 交出来的
      const d = deepEq(flat, structuredClone(flat), "Layout");
      assert(d === null, d ?? "");
    });
  }
  it("engraveData 交出来的每个字段都不是函数（worker 原样回这一份）", () => {
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, song = fullSong(), D = engraveData(song, v.opts(song)) as unknown as Record<string, unknown>;
    for (const k of Object.keys(D)) assert(typeof D[k] !== "function", `engraveData 的 ${k} 是函数`);
  });
});
