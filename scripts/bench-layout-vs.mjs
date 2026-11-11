#!/usr/bin/env node
// bench-layout-vs.mjs —— 现在的排版器和某个提交的排版器比快慢：同一个进程里交替跑（负载一样）、各取中位数和逐对比值的中位数。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟，谱面分家第二刀开工前；施工单第五节统筹裁定：以后每刀都和分家前比，累计慢到三成以上停下找原因）。
//   为什么不分开进程量：分开量时两边各热 8 次、负载又乱跳，量出过「慢两成」；同进程配对跑同一时刻的比值是 1.00（施工单第六节 2026-11-12 那行）。
// 用法：node scripts/bench-layout-vs.mjs [提交号，默认 ef5ad79 = 分家前] [视图…，默认 edit-all print]
//   歌 = test/fixtures/layout 的 Once upon a Tale（真实密度的大歌）。老的那份从 git 导出到系统临时目录（src / test / vendor/fflate），用完不删（同一个提交第二次直接用）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [ref = "ef5ad79", ...viewsArg] = process.argv.slice(2);
const VIEWS_RUN = viewsArg.length ? viewsArg : ["edit-all", "print"];
const sha = execFileSync("git", ["rev-parse", "--short", ref], { cwd: ROOT, encoding: "utf8" }).trim();
const OLD = path.join(os.tmpdir(), `moonsinger-bench-${sha}`);
if (!fs.existsSync(path.join(OLD, "src"))) {
  fs.mkdirSync(OLD, { recursive: true });
  const tar = execFileSync("git", ["archive", sha, "src", "test", "vendor/fflate", "package.json"], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", OLD], { input: tar });
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(OLD, "node_modules"));
}
const load = async (root, view) => {
  const C = await import(pathToFileURL(path.join(root, "test/fixtures/layout/cases.ts")).href), E = await import(pathToFileURL(path.join(root, "src/render/engrave.ts")).href);
  const { song, labels } = C.loadSong("once"), v = C.VIEWS.find((x) => x.name === view), sg = v.song ? v.song(song) : song, o = { ...v.opts(sg, labels), locale: "zh" };   // locale：分家前的排版器不认它，多给一个字段无妨
  return () => E.engrave(sg, o);
};
const med = (xs) => { const s = [...xs].sort((p, q) => p - q); return s[s.length >> 1]; };
for (const view of VIEWS_RUN) {
  const a = await load(OLD, view), b = await load(ROOT, view);
  for (let i = 0; i < 20; i++) { a(); b(); }
  const ta = [], tb = [], r = [];
  for (let i = 0; i < 200; i++) { let t = performance.now(); a(); const x = performance.now() - t; t = performance.now(); b(); const y = performance.now() - t; ta.push(x); tb.push(y); r.push(y / x); }
  console.log(`${view}：${sha} ${med(ta).toFixed(2)} ms · 现在 ${med(tb).toFixed(2)} ms · 逐对比值中位数 ${med(r).toFixed(3)}`);
}
