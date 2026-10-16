#!/usr/bin/env node
// scripts/core-hash.mjs —— 渲染核心的代码哈希（src/core/version.ts CORE_HASH 的来源）。created 2026-10-16 by Claude Fable 5.1（W-38）
//   哈希 = sha256(按路径排序的 每个文件「相对路径 \0 字节 \0」连起来) 的前 16 位。盖住的 = 出声要经过的一切代码和数据：
//   src/core src/engine src/singer src/performers src/score src/gm src/format（含模型包清单 packs.gen.ts、音源目录 sounds.gen.ts）+ vendor/world vendor/tsf + assets/preview（元音表）。
//   不盖：UI（src/app src/ui src/keyboard src/render）、mp3 编码器（只管装箱，不管声音）、测试。
//   用法：node scripts/core-hash.mjs（打印 16 位）；scripts/build.sh 把它 --define 进主 bundle；scripts/render-song.mjs import coreHash() 现算。
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const CORE_DIRS = ["src/core", "src/engine", "src/singer", "src/performers", "src/score", "src/gm", "src/format", "vendor/world", "vendor/tsf", "assets/preview"];
const SKIP = /\.(d\.ts|d\.mts|md|sh|txt|cpp|c)$|\/LICENSE|\/SOURCE\.md$|\/build-[^/]*\.sh$/;   // 类型 / 文档 / 构建脚本 / 许可证不进（它们不出声）

export function coreFiles(root = ROOT()) {
  const out = [];
  const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else out.push(p); } };
  for (const d of CORE_DIRS) { const p = path.join(root, d); if (fs.existsSync(p)) walk(p); }
  return out.map((p) => path.relative(root, p).split(path.sep).join("/")).filter((p) => !SKIP.test(p)).sort();
}
export function coreHash(root = ROOT()) {
  const h = createHash("sha256");
  for (const rel of coreFiles(root)) { h.update(rel); h.update("\0"); h.update(fs.readFileSync(path.join(root, rel))); h.update("\0"); }
  return h.digest("hex").slice(0, 16);
}
const ROOT = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--list")) for (const f of coreFiles()) console.log(f);
  else process.stdout.write(coreHash() + "\n");
}
