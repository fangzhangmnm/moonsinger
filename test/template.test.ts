// 新文件的模板只住在门口（16-4 A，统筹 2026-11-12 夜「v0.17.13 收」第 3 条）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：出声的代码（src/score、src/engine、src/core）不 import 模板——它们拿到的永远是读文件的门口补全过的（或新建时按值抄的）；
//   模板里每一位出厂乐手的数都过出声那一层的缺数检查（模板自己不缺数）。
import { describe, it, eq, assert } from "./runner.mjs";
import { templateCandidate, TEMPLATE } from "../src/format/template.ts";
import { perfSpecProblems } from "../src/format/project.ts";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[]; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const walk = (dir: string): string[] => fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : /\.(ts|mjs|js)$/.test(e.name) ? [`${dir}${e.name}`] : []));

describe("模板只在门口", () => {
  it("src/score、src/engine、src/core 里没有一处 import 模板（format/template）", () => {
    const bad = ["src/score/", "src/engine/", "src/core/"].flatMap(walk).filter((f) => /from\s+["'][^"']*format\/template(\.ts)?["']|import\(\s*["'][^"']*format\/template/.test(fs.readFileSync(new URL(f, ROOT), "utf8")));
    eq(bad.join("、"), "", "出声那一层不许问模板要数");
  });
  it("三种出厂乐手的数写全了：按力度路拼成出声规格，一个都不缺", () => {
    for (const e of ["tsukuyomi", "vowel-sampler", "soundfont"] as const) {
      const c = templateCandidate(e) as Record<string, any>, vel = e === "soundfont";
      const spec = vel ? { path: "velocity", ...c.articulation, dynamicsVel: c.dynamicsVel, sing: {} } : { path: "gain", ...c.articulation, dynamicsDb: c.dynamicsDb, sing: c.sing ?? {} };
      const bad = perfSpecProblems(spec as never, vel ? c.defaults.velocity : 1);
      eq(bad.join(","), "", e);
    }
    assert(TEMPLATE.lounge.rollHz.drum > 0 && TEMPLATE.lounge.rollHz.pitched > 0);
  });
});
