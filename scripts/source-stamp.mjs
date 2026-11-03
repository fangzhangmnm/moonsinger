// source-stamp.mjs —— 「dist 是从哪一份源码打出来的」的戳。created 2026-11-03 by Claude Opus 5.5（家族工单 A2 ③：防再犯）
//   起因：v0.14.9 / 10 / 11（10-26）只提交了源码、没重打 dist，线上 /dev/ 一直跑 v0.14.8 的包，当时的 E2E 也是对着旧包跑的（serve 不构建）。
//   build.sh 打完包调 `node scripts/source-stamp.mjs --write`：把进 bundle 的那些输入的 git blob 哈希合成一个指纹，连同版本号、主 bundle 名写进 dist/build-stamp.json。
//   test/dist-fresh.test.mjs 只看 HEAD（提交了的东西）：HEAD 里的戳 = HEAD 里这些输入的指纹，否则红 =「源码提交了、dist 没重打」。
//   改着源码还没提交时不红（HEAD 自洽）；打了包没提交也不红（HEAD 照旧自洽）。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** 进 bundle 的输入（src + 打进去的 vendor + 收货的包 + 样式（CSS 哈希 --define 进主 bundle）+ 构建脚本本身）。 */
export const STAMP_PATHS = ["src", "vendor-pkgs", "package-lock.json", "styles.css", "vendor/internal-css", "vendor/fflate", "vendor/vue", "vendor/upng", "scripts/build.sh", "scripts/core-hash.mjs"];
const git = (args, input) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", input, maxBuffer: 64 << 20 });

/** 指纹：按路径排序的「blob 哈希 + 路径」逐行 → sha256。两边（打包时的工作区 / HEAD 的树）用同一个函数。 */
export function fingerprint(entries) {
  const lines = entries.map(([blob, path]) => `${blob} ${path}`).sort((a, b) => (a.slice(41) < b.slice(41) ? -1 : a.slice(41) > b.slice(41) ? 1 : 0));
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}
/** 工作区（打包这一刻）：受管的 + 没忽略的新文件，按内容算 blob 哈希（和提交后 git 存的一样）。 */
export function workingEntries() {
  const files = git(["ls-files", "-co", "--exclude-standard", "--", ...STAMP_PATHS]).split("\n").filter(Boolean);
  const blobs = git(["hash-object", "--stdin-paths"], files.join("\n") + "\n").split("\n").filter(Boolean);
  return files.map((f, i) => [blobs[i], f]);
}
/** HEAD 的树。 */
export function headEntries() {
  return git(["ls-tree", "-r", "HEAD", "--", ...STAMP_PATHS]).split("\n").filter(Boolean).map((l) => { const [meta, path] = l.split("\t"); return [meta.split(" ")[2], path]; });
}

if (process.argv.includes("--write")) {
  const version = /APP_VERSION = "([^"]+)"/.exec(readFileSync(join(ROOT, "src/version.ts"), "utf8"))?.[1];
  const main = /src="\.\/dist\/(moonsinger-[a-z0-9]+\.mjs)"/.exec(readFileSync(join(ROOT, "index.html"), "utf8"))?.[1];
  if (!version || !main) { console.error("[stamp] ✗ 读不到版本号 / 主 bundle 名"); process.exit(1); }
  const stamp = { source: fingerprint(workingEntries()), version, main, paths: STAMP_PATHS };
  writeFileSync(join(ROOT, "dist/build-stamp.json"), JSON.stringify(stamp, null, 1) + "\n");
  console.log(`[stamp] dist/build-stamp.json：源码指纹 ${stamp.source.slice(0, 12)} · ${version} · ${main}`);
}
