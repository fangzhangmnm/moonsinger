// 内嵌的音源库目录不许漂移：src/gm/sounds.gen.ts == scripts/gen-sounds.mjs 现在的输出（音源库仓不在就跳过）。created 2026-10-07 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
const { readFileSync } = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };
const { render } = (await import(new URL("../scripts/gen-sounds.mjs", import.meta.url).href)) as { render(): string | null };
describe("音源库目录", () => {
  it("sounds.gen.ts 是最新的（不是就跑 node scripts/gen-sounds.mjs）", () => {
    const out = render();
    if (out === null) return;
    eq(readFileSync(new URL("../src/gm/sounds.gen.ts", import.meta.url), "utf8") === out, true);
  });
});
