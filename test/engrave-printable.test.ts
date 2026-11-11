// 刀 1 的 N1 / N2 守卫（2026-11-08 Opus 5.5；施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §2）：
//   N1 = 三首样张 × 六种视图，排出来的可印图元 + 锚点和冻结的快照逐个相同（test/fixtures/layout/*.json.gz，scripts/freeze-layout.mjs 写）；
//   N2 = 三首样张的 PDF 字节和冻结的 sha256 相同。编辑器的控件搬出排版器 = 这两样都不该动；版面本来就该变时（施工单 §4 第 5 条）先看这里报的差别，再重冻。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string };
const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): { toString(e: string): string } };
import { describe, it, assert, eq } from "./runner.mjs";
import { SONGS, pdfSha, pdfShaPath } from "./fixtures/layout/cases.ts";

// N1（可印图元 + 锚点的快照）2026-11-11 并进谱面排版的长期测试（test/score-surface.test.ts：图元全量、带 tok、字段更全；底本 = 分家之后的代码存的）；这里只留 N2。
describe("刀 1 守卫 N2：PDF 一字节不变", () => {
  const want = JSON.parse(fs.readFileSync(pdfShaPath, "utf8")) as Record<string, string>;
  for (const key of Object.keys(SONGS)) it(`${key} 的 PDF`, async () => { eq(await pdfSha(key), want[key], `${key} 的 PDF 字节变了`); });
});
