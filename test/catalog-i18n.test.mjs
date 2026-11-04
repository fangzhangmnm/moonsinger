// 乐器目录的分类标签都有英文对照（取货换了字 / 多了标签 = 红）。created 2026-11-04 by Claude Opus 5.5
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, assert } from "./runner.mjs";
import { DEF_EN } from "../src/gm/catalog-i18n.ts";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(ROOT, "vendor/instruments");
const file = (re) => JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).find((f) => re.test(f))), "utf8"));

describe("乐器目录的英文标签", () => {
  it("年代 / 曲风 / 承重 / 连断都有英文对照", () => {
    const defs = { ...file(/^instruments-.*\.json$/).defs, ...file(/^gm-map-.*\.json$/).defs };
    const missing = [];
    for (const k of ["eras", "styles", "weights", "joints"]) {
      for (const x of defs[k]) if (!DEF_EN[x.zh]) missing.push(`${k}: ${x.zh}`);
    }
    assert(missing.length === 0, `缺对照：${missing.join("、")}`);
  });
});
