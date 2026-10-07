#!/usr/bin/env node
// gen-keys-doc.mjs —— 从 src/input/keys.ts 的 BINDINGS 生成 docs/keys.md（键盘一览）。created 2026-10-07 by Claude Opus 5.5
// 参考 WeebPaint scripts/gen-shortcuts-doc.mjs；差别：直接 import 那张表（node 24 直跑 .ts），不靠正则抽源码。
// 用法：node scripts/gen-keys-doc.mjs          写 docs/keys.md
//       node scripts/gen-keys-doc.mjs --check  只比对，过期就非零退出（test/keys.test.ts 也守着）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderKeysDoc } from "../src/input/keys.ts";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "keys.md");
const md = renderKeysDoc();
if (process.argv.includes("--check")) {
  let cur = ""; try { cur = readFileSync(out, "utf8"); } catch { /* 没有 = 过期 */ }
  if (cur !== md) { console.error("docs/keys.md 过期了：node scripts/gen-keys-doc.mjs"); process.exit(1); }
  console.log("docs/keys.md ✓");
} else {
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, md);
  console.log(`docs/keys.md ← ${md.split("\n").filter((l) => l.startsWith("| `")).length} 行`);
}
