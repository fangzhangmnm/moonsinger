// test/e2e/pw.mjs —— 借 WeebPaint 的 playwright（家族里只装了那一份，本仓不另装）。created 2026-10-08 by Claude Fable 5.1
//   位置从 git 的 common dir 往上找：主目录里 `.git` 在仓根，worktree 里 common dir 指回主仓的 `.git`——两种 checkout 都能定位到家族目录
//   `<家族目录>/20260524 WeebPaint/node_modules/playwright/`（以前写死 `../../../…`，在 `.claude/worktrees/<名>/` 里深了三层就找不到）。
import { execSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
const common = path.resolve(execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim());   // 主仓的 .git
const family = path.dirname(path.dirname(common));                                                       // 主仓 → 家族目录
const pw = process.env.PLAYWRIGHT_INDEX ?? path.join(family, "20260524 WeebPaint", "node_modules", "playwright", "index.mjs");
const mod = await import(pathToFileURL(pw).href);
export const { chromium, firefox, webkit } = mod;
