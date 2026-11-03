// local-smoke.mjs —— 备用版的无头烟测：file:// 双击打开那个文件夹。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 7 步；规则书 §3.5 / §4 第 11 项）
//   核：不白屏、认成备用版、开局一行「去官网」、线程都从 data: 起（小月相 / mp3 / 录音房 / 排版 / 存档编码）、经 .data.js 载模型分片且哈希过（真唱一句）、
//       老实脚本的哈希不对就不交、存 = 下载、设置跨刷新还在、歌库网盘入口灰 + 「去官网」；再模拟「这个浏览器不给存储」（Safari 双击的样子）看「没测过 + 报告入口」那一句和歌库画灰。
//   浏览器用默认启动参数（不加 --allow-file-access-from-files 之类放宽的开关：和用户双击打开一样）；一律无头（家规）。
//   用法：node scripts/pack-local.mjs && node tools/local-smoke.mjs [--dir=.local-build/MoonSinger]
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "../test/e2e/pw.mjs";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const DIR = resolve(arg("dir", ".local-build/MoonSinger"));
const URL0 = pathToFileURL(`${DIR}/index.html`).href;
const SITE_URL = "https://sing.weebpaint.com";
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`); };
const note = (name, detail) => { results.push({ name, ok: null, detail }); console.log(`  · ${name} — ${detail}`); };

const t0 = Date.now();
const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1240, height: 840 } });
  const net = []; ctx.on("request", (r) => net.push(r.url()));
  await ctx.route((u) => /^https?:/.test(u.href), (r) => r.abort());   // 备用版不该联网（外网一律掐断、记下来）
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  // 桌面 Chromium 双击打开时有系统保存框（存 = 写回文件，有家）；无头里点不了那个框 → 这里拿掉它，走「存 = 下载」那条路（报告里写明）
  const pickerThere = await (async () => { const p = await ctx.newPage(); await p.goto(URL0); const has = await p.evaluate(() => typeof window.showSaveFilePicker === "function"); await p.close(); return has; })();
  await page.addInitScript(() => { try { delete window.showSaveFilePicker; delete window.showOpenFilePicker; } catch { /* ignore */ } });
  await page.goto(URL0);
  await page.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 }).catch(() => undefined);
  console.log(`[local-smoke] ${URL0}`);

  // ① 不白屏 + 认法
  const boot = await page.evaluate(() => ({ app: !!window.__moonsinger, play: !!document.getElementById("playBtn"), marker: document.querySelector('meta[name="deployment"]')?.getAttribute("content"), proto: location.protocol, avail: window.__moonsinger?.availability?.() }));
  check("不白屏（主程序起来了、顶栏在）", boot.app && boot.play);
  check("认成备用版（file: + 标记 local）", boot.proto === "file:" && boot.marker === "local", `${boot.proto} · ${boot.marker}`);
  note("存储（Chromium 双击打开 = 和别的双击打开的网页共用一个桶）", String(boot.avail));
  const line = await page.evaluate(() => [...document.querySelectorAll("*")].map((e) => e.childElementCount === 0 ? e.textContent : "").find((t) => /下载下来的备用版/.test(t ?? "")) ?? null);
  check("开局一行「备用版 … 完整版在 sing.weebpaint.com」+「去官网」钮", !!line && line.includes("sing.weebpaint.com") && await page.locator("button", { hasText: "去官网" }).count() > 0, line ?? "没找到");

  // ② 线程：起法全是 data:（blob: 后备）
  const kinds = await page.evaluate(() => window.__moonsinger.threadKinds());
  check("五个线程都按 data: → blob: 的顺序起", Object.values(kinds).every((k) => k[0] === "data" && k[1] === "blob"), JSON.stringify(kinds));
  const worklet = await page.evaluate(() => window.__moonsinger.engine.ensure().then(() => "ok", (e) => String(e)));
  check("出声线程（AudioWorklet）从 data: 起来了", worklet === "ok", worklet);
  const mp3 = await page.evaluate(() => window.__moonsinger.mp3Test().then((n) => n, (e) => String(e)));
  check("mp3 线程从 data: 起来、LAME 由主线程经老实脚本交过去、编出来了", typeof mp3 === "number" && mp3 > 1000, `${mp3} 字节`);

  // ③ 资源读口：经 .data.js 读一个文件、核哈希；哈希不对就不交
  const ok1 = await page.evaluate(() => window.__moonsinger.readSite("vendor/tsf/tsf-standalone.wasm").then((n) => n, (e) => String(e)));
  check("经 .data.js 读 app 文件、核过哈希才交出", typeof ok1 === "number" && ok1 > 0, `${ok1} 字节`);
  const bad = await page.evaluate(() => window.__moonsinger.readSite("vendor/tsf/tsf-standalone.wasm", "0".repeat(64)).then(() => "交出来了（错）", (e) => String(e)));
  check("给错的哈希 = 不交、如实报", /哈希对不上/.test(bad), bad);
  const gone = await page.evaluate(() => typeof window.__pwaData === "object" ? Object.keys(window.__pwaData).length : 0);
  check("读完那个键立刻 delete（全局里不留 base64 字符串）", gone === 0, `剩 ${gone} 个键`);

  // ④ 写三个音、真唱：小月相 worker（data:）向主线程要 WORLD + 模型包分片（老实脚本、核哈希）
  await page.click("#score", { position: { x: 300, y: 220 } });
  for (const k of ["Digit1", "Digit2", "Digit3"]) await page.keyboard.press(k);
  await page.click("#playBtn");
  const sang = await page.waitForFunction(() => { const e = window.__moonsinger.engine, r = window.__moonsinger.resource().snapshot; return e.playing && e.position > 0.3 && !e.waiting && r.chunks > 0 && r.lanes.some((l) => l && l.wasm > 0); }, null, { timeout: 120000, polling: 250 }).then(() => true, () => false);
  check("小月相唱起来了（模型包经 .data.js 读、核哈希；后台线程 data: 起）", sang, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await page.click("#playBtn").catch(() => undefined);
  const layoutDrop = await page.evaluate(() => /layout[^\n]*(worker error|unavailable)/i.test(window.__moonsinger.diagText()));
  check("排版线程没掉回主线程", !layoutDrop);

  // ⑤ 存 = 下载
  const dl = page.waitForEvent("download", { timeout: 15000 }).then((d) => d.suggestedFilename(), () => null);
  await page.click("#saveBtn");
  await page.locator('[data-v="download"]').first().click({ timeout: 10000 }).catch(() => undefined);
  const fname = await dl;
  check("存 = 下载 .mxl（存档编码线程 data: 起）", !!fname && /\.mxl$/.test(fname), fname ?? "没下载");
  note("真浏览器里双击打开时", pickerThere ? "桌面 Chromium 有系统保存框（存 = 选位置写成文件、以后 Ctrl+S 写回）；这里无头点不了那个框，拿掉后测的是下载那条路" : "没有系统保存框（存 = 下载）");

  // ⑥ 设置跨刷新还在（谱面缩放按设备记，device-kv）
  const zoom = () => page.evaluate(() => Number(document.querySelector("#score .sheet").style.zoom || 1));
  const sc = await page.evaluate(() => { const r = document.getElementById("score").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 3 }; });
  await page.mouse.move(sc.x, sc.y);
  await page.keyboard.down("Control"); for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(60); } await page.keyboard.up("Control"); await page.waitForTimeout(300);
  const z1 = await zoom();
  page.on("dialog", (d) => void d.accept());   // 改过没存的挽留框（第 4 个音之前存过了，这里一般不弹）
  await page.reload(); await page.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 }); await page.waitForTimeout(400);
  const z2 = await zoom();
  check("设置跨刷新还在（缩放按设备记）", Math.abs(z1 - 1) > 0.01 && Math.abs(z2 - z1) < 0.01, `缩放 ${z1.toFixed(3)} → 刷新后 ${z2.toFixed(3)}`);

  // ⑦ 歌库：入口灰 + 去官网
  // 2026-11-03 A2 ④（Fable 裁定）：备用版里歌库画灰 +「去官网」（歌没有浏览器外的家；存 = 下载 / 开 = 选文件照旧）
  const g = await page.evaluate(async () => { const b = document.getElementById("libBtn"); return { off: b.classList.contains("is-off"), title: b.title }; });
  check("歌库钮画灰（这里的歌没有浏览器外的家）", g.off && /官网/.test(g.title), g.title);
  await page.click("#libBtn"); await page.waitForTimeout(400);
  const g2 = await page.evaluate(async () => ({ gallery: !!document.getElementById("galleryFull"), line: [...document.querySelectorAll("*")].map((e) => e.childElementCount === 0 ? e.textContent : "").find((t) => /歌库只在官网版里有/.test(t ?? "")) ?? null,
    go: [...document.querySelectorAll("button")].filter((b) => /去官网/.test(b.textContent ?? "")).length, dbs: indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : [] }));
  check("点歌库 = 一行「歌库只在官网版里有 …」+「去官网」，不进歌库", !g2.gallery && !!g2.line && g2.line.includes("sing.weebpaint.com") && g2.go > 0, g2.line ?? "没找到");
  check("没建歌库的本机库（store 的 IndexedDB 一个都没有）", !g2.dbs.some((n) => /^moonsinger\./.test(n ?? "")), JSON.stringify(g2.dbs));
  check("页面没有未接住的脚本错误", errs.length === 0, errs.slice(0, 3).join(" | "));

  // ⑧ 模拟「这个浏览器不给双击打开的网页用存储」（Safari 的样子；Chromium 里拿 localStorage 抛 SecurityError 来演）
  const p2 = await ctx.newPage(); const errs2 = []; p2.on("pageerror", (e) => errs2.push(e.message));
  await p2.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("The operation is insecure.", "SecurityError"); } }); });
  await p2.goto(URL0); await p2.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 }).catch(() => undefined);
  const s2 = await p2.evaluate(() => ({ app: !!window.__moonsinger, avail: window.__moonsinger?.availability?.(), line: [...document.querySelectorAll("*")].map((e) => e.childElementCount === 0 ? e.textContent : "").find((t) => /没测过/.test(t ?? "")) ?? null, lib: document.getElementById("libBtn")?.classList.contains("is-off"), report: [...document.querySelectorAll("button")].some((b) => /报告问题/.test(b.textContent ?? "")) }));
  check("（模拟不给存储）不白屏", s2.app);
  check("（模拟不给存储）availability = unavailable", s2.avail === "unavailable", String(s2.avail));
  check("（模拟不给存储）「没测过 + 存不住 + 报告入口」那一句 + 「报告问题」钮", !!s2.line && /存不住/.test(s2.line) && /github\.com\/fangzhangmnm\/moonsinger\/issues/.test(s2.line) && s2.report, s2.line ?? "没找到");
  check("（模拟不给存储）歌库入口画灰", s2.lib === true);
  check("（模拟不给存储）没有未接住的脚本错误", errs2.length === 0, errs2.slice(0, 3).join(" | "));

  const outside = net.filter((u) => /^https?:/.test(u));
  check("整场没联网（备用版不依赖任何网站）", outside.length === 0, [...new Set(outside.map((u) => new URL(u).host))].join("、"));
} finally { await browser.close(); }
const bad = results.filter((r) => r.ok === false);
console.log(`\n[local-smoke] ${results.filter((r) => r.ok).length} 过 · ${bad.length} 红 · ${results.filter((r) => r.ok === null).length} 条如实记（${((Date.now() - t0) / 1000).toFixed(1)} s）`);
process.exit(bad.length ? 1 : 0);
