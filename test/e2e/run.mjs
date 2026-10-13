#!/usr/bin/env node
// test/e2e/run.mjs —— E2E 运行器（W-20 测试分档）。created 2026-10-13 by Claude Fable 5.1。细则 = ai-docs/20261013-test-tiers.md。
//   原来 package.json 里 60 个文件用 && 串着跑：串行 8 分钟、第一个红了后面的全不跑、看不出每个文件多慢。
//   这里：① 并行跑（默认 8 条，--jobs=N）；② 红了继续，最后一起报；③ 每个文件计时、慢的先跑（上次的时长记在 .e2e-times.json）；
//        ④ 没人起 8710 就自己起 scripts/serve.sh、跑完关掉；⑤ 能筛：区名 `@pad` / 文件名子串 `rest lift` / `--changed`（按 git 里改了什么推区）。
//   用法：
//     node test/e2e/run.mjs                 整套（= npm run e2e）
//     node test/e2e/run.mjs @pad @modes     只跑这两个区（区在 areas.mjs）
//     node test/e2e/run.mjs rest lift       文件名含 rest / lift 的
//     node test/e2e/run.mjs --changed       看 git 改了哪些文件 → 推出该跑哪些区（main.ts / styles.css / index.html = 整套）
//     node test/e2e/run.mjs --smoke         顺带把两份冒烟（shell-smoke / file-smoke）也当两个任务一起跑（它们自己起服务，不用 8710）
//     --jobs=N  --list  --base=http://…（不自己起服务）  MS_E2E_BASE 同 --base  --port=N（自己起一口在这个端口；worktree 里用，别借主目录的 8710）
//   每个 E2E 文件照旧能单独 `node test/e2e/x.mjs`（要 8710 在跑）——这里只是调度，不改它们。
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, HELPERS, areasOf } from "./areas.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const TIMES = path.join(ROOT, ".e2e-times.json");   // 上次每个文件跑了多久（gitignored；只用来排序）
const SMOKES = ["shell-smoke", "file-smoke"];        // test/*.mjs，自己起服务

// ── 参数 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => { const a = argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : null; };
const words = argv.filter((a) => !a.startsWith("--"));
const JOBS = Math.max(1, Number(opt("jobs")) || Math.min(8, Math.max(1, (os.availableParallelism?.() ?? os.cpus().length) - 2)));
let base = opt("base") ?? process.env.MS_E2E_BASE ?? null;

const all = fs.readdirSync(HERE).filter((f) => f.endsWith(".mjs")).map((f) => f.slice(0, -4)).filter((n) => !HELPERS.includes(n)).sort();
const known = new Set(all);
const bad = Object.values(AREAS).flat().filter((n) => !known.has(n));
if (bad.length) { console.error(`areas.mjs 列了不存在的 E2E：${bad.join(", ")}`); process.exit(2); }

if (flag("list")) {
  for (const [area, files] of Object.entries(AREAS)) console.log(`@${area.padEnd(7)} ${files.join(" ")}`);
  const orphan = all.filter((n) => !Object.values(AREAS).some((fs) => fs.includes(n)));
  if (orphan.length) console.log(`\n没分区的（test/e2e-areas.test.ts 会红）：${orphan.join(" ")}`);
  process.exit(0);
}

// ── 选文件 ────────────────────────────────────────────────────────────────────────────────────────────────────────────
let picked, why = [];
let smokeHint = false;
if (flag("changed")) {
  const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
  const changed = [...new Set([...git("git diff --name-only HEAD"), ...git("git ls-files --others --exclude-standard")])];
  const areas = new Set(), files = new Set();
  let everything = false;
  for (const p of changed) {
    const m = /^test\/e2e\/([a-z0-9-]+)\.mjs$/.exec(p);
    if (m && known.has(m[1])) { files.add(m[1]); why.push(`${p} → 它自己`); continue; }
    const a = areasOf(p);
    if (a === "all") { everything = true; why.push(`${p} → 整套`); }
    else if (a === "smoke") { smokeHint = true; why.push(`${p} → 冒烟（npm run smoke）`); }
    else if (a.length) { for (const x of a) areas.add(x); why.push(`${p} → ${a.map((x) => "@" + x).join(" ")}`); }
    else why.push(`${p} → （没有 E2E 管）`);
  }
  if (!changed.length) { console.log("git 里没有改动（相对 HEAD）。要跑整套：node test/e2e/run.mjs"); process.exit(0); }
  picked = everything ? all : [...new Set([...files, ...[...areas].flatMap((a) => AREAS[a])])];
  console.log("按改动推档：\n  " + why.join("\n  "));
  if (!picked.length) { console.log(smokeHint ? "\n没有要跑的 E2E；改的是壳 → npm run smoke" : "\n没有要跑的 E2E（只跑 npm test 就够）。"); process.exit(0); }
} else if (words.length) {
  const set = new Set();
  for (const w of words) {
    if (w === "all") { all.forEach((n) => set.add(n)); continue; }
    if (w.startsWith("@")) { const a = AREAS[w.slice(1)]; if (!a) { console.error(`没有这个区：${w}（有：${Object.keys(AREAS).map((k) => "@" + k).join(" ")}）`); process.exit(2); } a.forEach((n) => set.add(n)); continue; }
    const hits = all.filter((n) => n.includes(w)); if (!hits.length) { console.error(`没有文件名含「${w}」的 E2E`); process.exit(2); } hits.forEach((n) => set.add(n));
  }
  picked = [...set];
} else picked = all;

// 慢的先跑（上次时长；没记过的排在最前面当作未知）
let times = {}; try { times = JSON.parse(fs.readFileSync(TIMES, "utf8")); } catch { /* 第一次 */ }
picked.sort((a, b) => (times[b] ?? 1e9) - (times[a] ?? 1e9));
const tasks = picked.map((n) => ({ name: n, file: path.join(HERE, n + ".mjs"), needsServer: true }));
if (flag("smoke")) for (const s of SMOKES) tasks.unshift({ name: s, file: path.join(ROOT, "test", s + ".mjs"), needsServer: false });

// ── 服务 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 8710 已经有人在听 = 借用（假定是这个目录的 npm run serve）。在 worktree 里跑要么 --port=8713 自己起一口（不借别人的构建），要么 --base 指过去。
const PORT = Number(opt("port")) || 8710, ownPort = opt("port") !== null;
const listening = (port) => new Promise((ok) => { const s = net.createConnection({ port, host: "127.0.0.1" }); s.once("connect", () => { s.destroy(); ok(true); }); s.once("error", () => ok(false)); });
let server = null;
if (tasks.some((t) => t.needsServer) && !base) {
  if (await listening(PORT)) { if (ownPort) { console.error(`--port=${PORT} 已经有人在听；换一个端口，或用 --base 指过去`); process.exit(2); } base = `http://127.0.0.1:${PORT}/`; }
  else {
    server = spawn("bash", ["scripts/serve.sh"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), BIND: "127.0.0.1" }, stdio: "ignore" });
    for (let i = 0; i < 50 && !(await listening(PORT)); i++) await new Promise((r) => setTimeout(r, 100));
    if (!(await listening(PORT))) { console.error("起不来本机服务（scripts/serve.sh）"); server.kill(); process.exit(2); }
    base = `http://127.0.0.1:${PORT}/`;
  }
}
const stopServer = () => { if (server) { server.kill(); server = null; } };
process.on("SIGINT", () => { stopServer(); process.exit(130); });

// ── 跑 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s` : `${s.toFixed(1)}s`);
console.log(`E2E：${tasks.length} 个任务 · ${JOBS} 条并行${base ? ` · ${base}` : ""}${server ? "（本机服务自己起的）" : ""}`);
const results = [];
const t0 = performance.now();
let next = 0;
async function worker() {
  while (next < tasks.length) {
    const t = tasks[next++], start = performance.now();
    const out = await new Promise((done) => {
      const child = spawn(process.execPath, [t.file], { cwd: ROOT, env: { ...process.env, ...(t.needsServer ? { MS_E2E_BASE: base } : {}) } });
      let buf = ""; child.stdout.on("data", (d) => (buf += d)); child.stderr.on("data", (d) => (buf += d));
      child.on("close", (code) => done({ code, buf }));
      child.on("error", (e) => done({ code: 1, buf: String(e) }));
    });
    const secs = (performance.now() - start) / 1000;
    const ok = out.code === 0, m = /(\d+) passed, (\d+) failed/.exec(out.buf);
    results.push({ name: t.name, ok, secs, out: out.buf, counts: m ? `${m[1]}/${Number(m[1]) + Number(m[2])}` : "" });
    console.log(`  ${ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${t.name.padEnd(18)} ${fmt(secs).padStart(6)}${results.at(-1).counts ? "  " + results.at(-1).counts : ""}`);
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, worker));
stopServer();
const wall = (performance.now() - t0) / 1000, serial = results.reduce((s, r) => s + r.secs, 0);
for (const r of results) if (r.name && !SMOKES.includes(r.name)) times[r.name] = Math.round(r.secs * 10) / 10;
try { fs.writeFileSync(TIMES, JSON.stringify(times, null, 1) + "\n"); } catch { /* 只是缓存 */ }

const failed = results.filter((r) => !r.ok);
for (const r of failed) {
  const lines = r.out.split("\n").filter((l) => l.trim());
  const bad = lines.filter((l) => l.includes("✗") || /error|Error|failed/.test(l));
  console.log(`\n\x1b[31m── ${r.name} ──\x1b[0m\n  ` + (bad.length ? bad : lines.slice(-25)).slice(0, 40).join("\n  "));
}
const slow = [...results].sort((a, b) => b.secs - a.secs).slice(0, 3).map((r) => `${r.name} ${fmt(r.secs)}`).join(" · ");
console.log(`\n  ${results.length - failed.length} passed, ${failed.length} failed · wall ${fmt(wall)}（串行要 ${fmt(serial)}）· 最慢：${slow}`);
if (smokeHint) console.log("  改的里面有壳的文件 → 另跑 npm run smoke");
process.exit(failed.length ? 1 : 0);
