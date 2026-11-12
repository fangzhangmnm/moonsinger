#!/usr/bin/env node
// test/e2e/run.mjs —— E2E 运行器（W-20 测试分档）。created 2026-10-13 by Claude Fable 5.1。细则 = ai-docs/20261013-test-tiers.md。
//   原来 package.json 里 60 个文件用 && 串着跑：串行 8 分钟、第一个红了后面的全不跑、看不出每个文件多慢。
//   这里：① 并行跑（默认 8 条，--jobs=N）；② 红了继续，最后一起报；③ 每个文件计时、慢的先跑（上次的时长记在 .e2e-times.json）；
//        ④ 自己起服务、端的是开跑那一刻**冻住的一份**（scripts/serve.sh SERVE_DIR = 拷进临时目录，跑完关掉、删掉；跑的过程中工作区怎么改 / 重新构建都不影响这一轮，
//          开头和结尾印这一轮对应哪个提交、端出去的东西有没有没提交的改动；2026-11-12 施工单「整套 E2E 跑的那一份要和工作区隔开」）；⑤ 能筛：区名 `@pad` / 文件名子串 `rest lift` / `--changed`（按 git 里改了什么推区）。
//   用法：
//     node test/e2e/run.mjs                 平时的整套（= npm run e2e）：不含「专项」——areas.mjs 的 SLOW：一份就要几分钟的、要连外网的；跳过了哪几份会印出来
//     node test/e2e/run.mjs --all           真的全部，含专项（推正式版那一档 = npm run test:full；专门查测试的时候）
//     node test/e2e/run.mjs @pad @modes     只跑这两个区（区在 areas.mjs）
//     node test/e2e/run.mjs rest lift       文件名含 rest / lift 的
//     node test/e2e/run.mjs --changed       看 git 改了哪些文件 → 推出该跑哪些区（main.ts / styles.css / index.html = 整套）
//     node test/e2e/run.mjs --smoke         顺带把两份冒烟（shell-smoke / file-smoke）也当两个任务一起跑（它们自己起服务，不用 8710）
//     --task-timeout=秒（默认 300）：单个任务超时 = 杀掉整组进程（含它起的浏览器）、记成红、接着跑别的（家族周账 F-144：2026-11-03 sync.mjs 卡死过两次，运行器原来会一直等）
//     --jobs=N  --list  --base=http://…（不自己起服务 = 不冻，跑的是那边端的东西）  MS_E2E_BASE 同 --base  --port=N（冻住的那一份端在这个端口；不给 = 从 8720 往上找一个空的，不借 8710）
//   每个 E2E 文件照旧能单独 `node test/e2e/x.mjs`（要 8710 在跑）——这里只是调度，不改它们。
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, HELPERS, SLOW, slowFor, areasOf } from "./areas.mjs";

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
const TASK_TIMEOUT_S = Number(opt("task-timeout")) || 300;

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
  // 专项只在改到它自己管的源码（SLOW[x].when）或者改了它自己这个文件时跑；「整套」和按区推出来的都不带它们
  const slowHit = slowFor(changed);
  picked = [...new Set([...files, ...slowHit, ...(everything ? all : [...areas].flatMap((a) => AREAS[a])).filter((n) => !(n in SLOW))])];
  for (const n of slowHit) why.push(`专项 ${n}：改到了它管的源码`);
  console.log("按改动推档：\n  " + why.join("\n  "));
  if (!picked.length) { console.log(smokeHint ? "\n没有要跑的 E2E；改的是壳 → npm run smoke" : "\n没有要跑的 E2E（只跑 npm test 就够）。"); process.exit(0); }
} else if (words.length) {
  const set = new Set();
  for (const w of words) {
    if (w === "all") { all.filter((n) => flag("all") || !(n in SLOW)).forEach((n) => set.add(n)); continue; }
    if (w.startsWith("@")) { const a = AREAS[w.slice(1)]; if (!a) { console.error(`没有这个区：${w}（有：${Object.keys(AREAS).map((k) => "@" + k).join(" ")}）`); process.exit(2); } a.filter((n) => flag("all") || !(n in SLOW)).forEach((n) => set.add(n)); continue; }   // 按区跑也不带专项；点名（文件名子串）才带
    const hits = all.filter((n) => n.includes(w)); if (!hits.length) { console.error(`没有文件名含「${w}」的 E2E`); process.exit(2); } hits.forEach((n) => set.add(n));
  }
  picked = [...set];
} else picked = flag("all") ? all : all.filter((n) => !(n in SLOW));
{ const skipped = Object.keys(SLOW).filter((n) => known.has(n) && !picked.includes(n));   // 不静默：跳过了谁、为什么、怎么跑
  if (skipped.length && !flag("list")) console.log(`没跑的专项 ${skipped.length} 份：${skipped.map((n) => `${n}（${SLOW[n].why}）`).join("、")}。要跑：点名（node test/e2e/run.mjs ${skipped[0]}）或 --all`); }

// 慢的先跑（上次时长；没记过的排在最前面当作未知）
let times = {}; try { times = JSON.parse(fs.readFileSync(TIMES, "utf8")); } catch { /* 第一次 */ }
picked.sort((a, b) => (times[b] ?? 1e9) - (times[a] ?? 1e9));
const tasks = picked.map((n) => ({ name: n, file: path.join(HERE, n + ".mjs"), needsServer: true }));
if (flag("smoke")) for (const s of SMOKES) tasks.unshift({ name: s, file: path.join(ROOT, "test", s + ".mjs"), needsServer: false });

// ── 服务 ─────────────────────────────────────────────────────────────────────────────────
// 整套跑的是开跑那一刻冻住的一份（2026-11-12）：要端的东西（清单只在 scripts/serve.sh 的 SERVED）拷进一个新的临时目录，服务只端它。
//   不再借 8710 上别人起的服务（那一份是软链读工作区：上一件在跑、下一件在改，就会读到改了一半的样式 / 半新的构建——同一类出过两次）。
//   --base / MS_E2E_BASE = 明着要跑那边端的东西：不冻，开头说一声。
// 2026-10-14：WSL（mirrored 网络）上连一个关着的端口有时不拒绝、一直等，没有超时 = 运行器在这儿卡死、一行都不印；1.5 s 没接上就当没人听
const listening = (port) => new Promise((ok) => { const s = net.createConnection({ port, host: "127.0.0.1" }); const t = setTimeout(() => { s.destroy(); ok(false); }, 1500); s.once("connect", () => { clearTimeout(t); s.destroy(); ok(true); }); s.once("error", () => { clearTimeout(t); ok(false); }); });
const sh = (cmd) => { try { return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } };
/** 这一轮对应哪个提交：端出去的东西 / E2E 脚本本身有没有没提交的改动（E2E 脚本每份开跑时从工作区读，不在冻住的那一份里）。 */
function stampOf() {
  const head = sh("git rev-parse --short HEAD") || "?";
  const served = sh("bash scripts/serve.sh --list").split("\n").filter(Boolean);
  const dirty = (paths) => (paths.length ? sh(`git status --porcelain -- ${paths.map((p) => JSON.stringify(p)).join(" ")}`).split("\n").filter(Boolean).map((l) => l.replace(/^\s*\S{1,2}\s+/, "")) : []);   // git status 一行 = 「XY 路径」；sh() 去掉了整段开头的空格，第一行的「 M」只剩「M」，按「状态码 + 空格」剥
  const ds = dirty(served), dt = dirty(["test/e2e"]);
  return `提交 ${head}` + (ds.length ? `（端出去的含未提交的改动：${ds.slice(0, 6).join(" ")}${ds.length > 6 ? ` 等 ${ds.length} 处` : ""}）` : "（端出去的和提交一样）") + (dt.length ? `；E2E 脚本含未提交的改动：${dt.slice(0, 4).join(" ")}${dt.length > 4 ? " 等" : ""}` : "");
}
const PORT0 = Number(opt("port")) || 0;
let server = null, frozen = null, stamp = null;
const FROZEN_PREFIX = path.join(os.tmpdir(), "moonsinger-e2e-");
const dropFrozen = () => { if (frozen && frozen.startsWith(FROZEN_PREFIX)) { try { fs.rmSync(frozen, { recursive: true, force: true }); } catch { /* 临时目录，删不掉也不碍事 */ } } frozen = null; };
if (tasks.some((t) => t.needsServer) && !base) {
  let port = PORT0;
  if (port) { if (await listening(port)) { console.error(`--port=${port} 已经有人在听；换一个端口，或用 --base 指过去`); process.exit(2); } }
  else { for (port = 8720; port < 8800 && (await listening(port)); port++); if (port >= 8800) { console.error("8720–8799 都有人在听，用 --port=N 指一个空的"); process.exit(2); } }
  stamp = stampOf();
  frozen = fs.mkdtempSync(FROZEN_PREFIX);
  server = spawn("bash", ["scripts/serve.sh"], { cwd: ROOT, env: { ...process.env, PORT: String(port), BIND: "127.0.0.1", SERVE_DIR: frozen }, stdio: "ignore" });
  for (let i = 0; i < 300 && !(await listening(port)); i++) await new Promise((r) => setTimeout(r, 100));   // 先拷（几十 MB）再起服务：最多等 30 s
  if (!(await listening(port))) { console.error("起不来本机服务（scripts/serve.sh SERVE_DIR）"); server.kill(); dropFrozen(); process.exit(2); }
  base = `http://127.0.0.1:${port}/`;
}
const stopServer = () => { if (server) { server.kill(); server = null; } dropFrozen(); };
process.on("SIGINT", () => { stopServer(); process.exit(130); });

// ── 跑 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s` : `${s.toFixed(1)}s`);
console.log(`E2E：${tasks.length} 个任务 · ${JOBS} 条并行${base ? ` · ${base}` : ""}${server ? `（冻住的一份 · ${stamp}）` : base ? "（--base：没冻，跑的是那边端的东西）" : ""}`);
const results = [];
const t0 = performance.now();
let next = 0;
const runOne = (t) => new Promise((done) => {
  const start = performance.now();
  // detached = 自成一个进程组：超时能连它起的浏览器一起杀（只杀 node 的话，浏览器还攥着输出管道，close 永远不来）
  const child = spawn(process.execPath, [t.file], { cwd: ROOT, detached: true, env: { ...process.env, ...(t.needsServer ? { MS_E2E_BASE: base } : {}) } });
  let buf = "", settled = false;
  child.stdout.on("data", (d) => (buf += d)); child.stderr.on("data", (d) => (buf += d));
  const fin = (code) => {
    if (settled) return;
    settled = true; clearTimeout(timer);
    const m = /(\d+) passed, (\d+) failed/.exec(buf);
    done({ ok: code === 0, secs: (performance.now() - start) / 1000, out: buf, counts: m ? `${m[1]}/${Number(m[1]) + Number(m[2])}` : "" });
  };
  const timer = setTimeout(() => {
    buf += `\n✗ 超时：${TASK_TIMEOUT_S} s 没跑完，整组进程杀掉（--task-timeout 可调）\n`;
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* 已经没了 */ } }
    // 当场印最后几行：单跑一遍绿了之后这份输出就被盖掉了，下次卡住要看得出卡在哪（2026-11-03 gate + sync 同时卡满 5 分钟一次、重跑三次没复现、没留下线索）
    console.log(`  ⏱ ${t.name} 超时，最后几行：\n    ` + buf.split("\n").filter((l) => l.trim()).slice(-7, -1).join("\n    "));
    fin(124);
  }, TASK_TIMEOUT_S * 1000);
  child.on("close", fin); child.on("error", (e) => { buf += String(e); fin(1); });
});
const mark = (ok) => (ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m");
async function worker() {
  while (next < tasks.length) {
    const t = tasks[next++], r = await runOne(t);
    results.push({ name: t.name, ...r });
    console.log(`  ${mark(r.ok)} ${t.name.padEnd(18)} ${fmt(r.secs).padStart(6)}${r.counts ? "  " + r.counts : ""}`);
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, worker));
// 并行红的单跑一遍（2026-10-14）：8 个浏览器抢一台机子时，「放着 = 表上有数」「翻谱提前量」这类等时间的会迟到——follow / routing / mixer-fx 一再并行红、单跑绿。
//   单跑也红才算真红；单跑绿 = 并行负载 flake，**明说**（不静默洗白）。--no-retry 关掉（查 flake 本身时用）。
const flaky = [];
if (!flag("no-retry") && results.some((r) => !r.ok) && JOBS > 1) {
  console.log("\n  并行红的单跑一遍：");
  for (const r of results.filter((x) => !x.ok)) {
    const again = await runOne(tasks.find((t) => t.name === r.name));
    console.log(`  ${mark(again.ok)} ${r.name.padEnd(18)} ${fmt(again.secs).padStart(6)}${again.counts ? "  " + again.counts : ""}  ${again.ok ? "单跑绿 = 并行负载 flake" : "单跑也红"}`);
    if (again.ok) { flaky.push(r.name); Object.assign(r, again, { flaky: true }); }
    else r.out = again.out;
  }
}
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
if (flaky.length) console.log(`  并行红、单跑绿（负载 flake，已算过）：${flaky.join(" ")}`);
if (stamp) console.log(`  这一轮跑的是：${stamp}`);
if (smokeHint) console.log("  改的里面有壳的文件 → 另跑 npm run smoke");
process.exit(failed.length ? 1 : 0);
