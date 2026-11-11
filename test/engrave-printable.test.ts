// 刀 1 的 N1 / N2 守卫（2026-11-08 Opus 5.5；施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §2）：
//   N1 = 三首样张 × 六种视图，排出来的可印图元 + 锚点和冻结的快照逐个相同（test/fixtures/layout/*.json.gz，scripts/freeze-layout.mjs 写）；
//   N2 = 三首样张的 PDF 字节和冻结的 sha256 相同。编辑器的控件搬出排版器 = 这两样都不该动；版面本来就该变时（施工单 §4 第 5 条）先看这里报的差别，再重冻。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string };
const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): { toString(e: string): string } };
import { describe, it, assert, eq } from "./runner.mjs";
import { SONGS, VIEWS, caseLayout, snapshotRaw, fixturePath, pdfSha, pdfShaPath } from "./fixtures/layout/cases.ts";
import { tolDiffs, PATH_NOISE_MAX } from "./fixtures/layout/full.ts";

/** 两份快照第一批不一样的地方（路径 + 两边的值），最多 n 条。 */
function diffs(a: unknown, b: unknown, path = "", out: string[] = [], n = 6): string[] {
  if (out.length >= n) return out;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || a === null || b === null || typeof a !== "object") {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${path || "(根)"}: 冻结 ${JSON.stringify(a)?.slice(0, 140)} ≠ 现在 ${JSON.stringify(b)?.slice(0, 140)}`);
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) out.push(`${path}: 冻结 ${a.length} 个 ≠ 现在 ${b.length} 个`);
  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
  for (const k of keys) diffs((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, out, n);
  return out;
}

describe("刀 1 守卫 N1：可印图元 + 锚点和冻结的一样", () => {
  for (const key of Object.keys(SONGS)) for (const v of VIEWS) {
    it(`${key} · ${v.name}`, () => {
      const want = JSON.parse(gunzipSync(fs.readFileSync(fixturePath(key, v.name))).toString("utf8"));
      const got = JSON.parse(JSON.stringify(snapshotRaw(caseLayout(key, v))));
      const d = tolDiffs(want, got);   // 1b-6c 起按容差比（同守卫 3，统筹裁定）
      assert(d.out.length === 0, `版面变了（真该变 = node scripts/freeze-layout.mjs 重冻）：\n    ${d.out.join("\n    ")}`);
      assert(d.maxPath <= PATH_NOISE_MAX, `路径里的数字差 ${d.maxPath} px：不是浮点尾数，停下来查`);
    });
  }
});
describe("刀 1 守卫 N2：PDF 一字节不变", () => {
  const want = JSON.parse(fs.readFileSync(pdfShaPath, "utf8")) as Record<string, string>;
  for (const key of Object.keys(SONGS)) it(`${key} 的 PDF`, async () => { eq(await pdfSha(key), want[key], `${key} 的 PDF 字节变了`); });
});
