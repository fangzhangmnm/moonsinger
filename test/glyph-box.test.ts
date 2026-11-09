// glyph-box.test.ts —— 字形墨迹框表和 Bravura 轮廓一致（src/render/glyph-box.gen.ts ← scripts/gen-glyph-box.mjs）。created 2026-11-09 by Claude Opus 5.5
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e: string): string };
import { describe, it, eq, assert } from "./runner.mjs";
import { GLYPH_BOX } from "../src/render/glyph-box.gen.ts";
import { glyphBoxes } from "../scripts/gen-glyph-box.mjs";

describe("字形墨迹框表（刀 4b 天际线用）", () => {
  it("和轮廓重新算出来的逐个相同（轮廓重出了 = 重跑 node scripts/gen-glyph-box.mjs）", () => {
    const want = glyphBoxes(JSON.parse(fs.readFileSync(new URL("../vendor/fonts/bravura/outlines.json", import.meta.url), "utf8"))) as Record<string, number[]>;
    eq(Object.keys(GLYPH_BOX).length, Object.keys(want).length);
    for (const [k, v] of Object.entries(want)) eq(JSON.stringify(GLYPH_BOX[k]), JSON.stringify(v), `U+${k.codePointAt(0)!.toString(16)}`);
  });
  it("几个已知的：黑符头上下各半格、高音谱号往上 4.39、上符尾挂在原点下面", () => {
    eq(JSON.stringify(GLYPH_BOX["\u{E0A4}"]), JSON.stringify([0, 1.18, -0.5, 0.5]));
    assert(Math.abs(GLYPH_BOX["\u{E050}"]![2] + 4.392) < 1e-9);
    assert(GLYPH_BOX["\u{E240}"]![3] > 3 && GLYPH_BOX["\u{E240}"]![2] < 0.1);
  });
});
