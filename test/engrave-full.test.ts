// 排版分家（施工单 1b）的守卫 3：分家前后版面逐个相同——所有图元（带注解、带 tok）、Layout 全部平字段、三个闭包按行采样。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。快照 = test/fixtures/layout/full/*.json.gz，在没动排版器的代码上由 scripts/freeze-layout-full.mjs 冻的。
//   红了 = 分家搬错了，先查；不许为了变绿重冻（版面本来就该变时找统筹）。用例和快照的定义在 test/fixtures/layout/full.ts。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL): Uint8Array };
const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): { toString(e: string): string } };
import { describe, it, assert } from "./runner.mjs";
import { fullCases, fullSnapshot, fullPath, diffs } from "./fixtures/layout/full.ts";

describe("排版分家守卫 3：版面和冻结的逐个相同（全量）", () => {
  for (const c of fullCases()) {
    it(`${c.song} · ${c.view}`, () => {
      const want = JSON.parse(gunzipSync(fs.readFileSync(fullPath(c.song, c.view))).toString("utf8"));
      const got = JSON.parse(JSON.stringify(fullSnapshot(c.layout())));
      const d = diffs(want, got);
      assert(d.length === 0, `版面变了：\n    ${d.join("\n    ")}`);
    });
  }
});
