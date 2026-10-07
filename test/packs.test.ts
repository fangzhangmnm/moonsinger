// 内嵌的模型包清单不许漂移：src/singer/packs.gen.ts == scripts/gen-packs.mjs 现在的输出（模型仓不在就跳过）。created 2026-10-07 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
const { readFileSync } = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };
const { render } = (await import(new URL("../scripts/gen-packs.mjs", import.meta.url).href)) as { render(): string | null };
describe("模型包清单", () => {
  it("packs.gen.ts 是最新的（不是就跑 node scripts/gen-packs.mjs）", () => {
    const out = render();
    if (out === null) return;   // 没有模型仓（别的机器）：不查
    eq(readFileSync(new URL("../src/singer/packs.gen.ts", import.meta.url), "utf8") === out, true);
  });
});
