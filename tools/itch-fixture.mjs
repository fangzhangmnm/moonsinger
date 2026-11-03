// itch-fixture.mjs —— itch 版的无头夹具：本机两个端口模拟「被 itch 的页面跨站套着」。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 6 步；规则书 §4 第 9 项）
//   外页 http://localhost:P1/ 用 iframe 套 http://127.0.0.1:P2/index.html（= scripts/pack-itch.mjs 打出来的 .itch-build/site，带 <meta name="deployment" content="itch">）。
//   核：部署标记 / 被套着 / 不注册离线壳 / 开局一行「去官网」/ 资源从同站点读（小月相真唱一句 → 5 个模型包里要用的从 127.0.0.1 下、核哈希）/ 后台线程起 / 出声线程起 /
//       存 = 下载 / 歌库里网盘入口灰 + 「去官网」/ 网络里没有 MSAL / **脏文档关页时 beforeunload 对话框弹不弹**（如实记，对照：同一包不套 iframe 直接开）。
//   用法：node scripts/pack-itch.mjs && node tools/itch-fixture.mjs [--site=.itch-build/site]
//   浏览器一律无头（家规）。playwright 借 WeebPaint 那一份（test/e2e/pw.mjs）。
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "../test/e2e/pw.mjs";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const SITE = resolve(arg("site", ".itch-build/site"));
const SITE_URL = "https://sing.weebpaint.com";
const MIME = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm",
  ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8" };

/** 静态服务器：记下每个请求（路径 + 状态），这是「资源从哪来、有没有人要 MSAL」的权威记录。 */
function serve(root, port, host) {
  const log = [];
  const srv = http.createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = join(root, path.endsWith("/") ? `${path}index.html` : path);
    try {
      if (!file.startsWith(root)) throw new Error("outside");
      const st = await stat(file); if (!st.isFile()) throw new Error("dir");
      res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream", "content-length": st.size, "cache-control": "no-cache" });
      res.end(await readFile(file)); log.push({ path, status: 200 });
    } catch { res.writeHead(404); res.end("not found"); log.push({ path, status: 404 }); }
  });
  return new Promise((ok) => srv.listen(port, host, () => ok({ srv, log, port: srv.address().port })));
}

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`); };
const note = (name, detail) => { results.push({ name, ok: null, detail }); console.log(`  · ${name} — ${detail}`); };

const inner = await serve(SITE, 0, "127.0.0.1");
const P2 = inner.port;
const outerHtml = `<!doctype html><meta charset="utf-8"><title>itch 外页（夹具）</title><body style="margin:0">
<iframe id="game" src="http://127.0.0.1:${P2}/index.html" style="width:1200px;height:800px;border:0"
  allow="autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr; cross-origin-isolated; web-share"></iframe></body>`;
const outer = http.createServer((req, res) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(outerHtml); });
await new Promise((ok) => outer.listen(0, "localhost", ok));
const P1 = outer.address().port;

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const t0 = Date.now();
try {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1240, height: 840 } });
  const net = [];
  ctx.on("request", (r) => net.push(r.url()));
  await ctx.route((u) => !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(u.href) && !/^(data|blob):/.test(u.href), (r) => r.abort());   // 外网一律掐断（记在 net 里）
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`http://localhost:${P1}/`);
  const frame = await (async () => { for (let i = 0; i < 100; i++) { const f = page.frames().find((x) => x.url().includes(`127.0.0.1:${P2}`)); if (f) return f; await page.waitForTimeout(100); } throw new Error("iframe 没出来"); })();
  await frame.waitForSelector("#playBtn", { timeout: 30000 });
  await frame.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 });
  console.log(`[itch-fixture] 外页 localhost:${P1} 套 127.0.0.1:${P2}（${SITE}）`);

  // ① 认法 / 被套着 / 离线壳
  const env = await frame.evaluate(async () => ({ marker: document.querySelector('meta[name="deployment"]')?.getAttribute("content"), embedded: (() => { try { return window.self !== window.top; } catch { return true; } })(),
    sw: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : -1 }));
  check("index.html 烤了 itch 标记", env.marker === "itch", String(env.marker));
  check("被跨站套着（embedded）", env.embedded === true);
  check("没注册离线壳（service worker 0 个）", env.sw === 0, `注册 ${env.sw} 个`);

  // ② 开局一行「完整版在官网」
  const line = await frame.evaluate(() => [...document.querySelectorAll("*")].map((e) => e.childElementCount === 0 ? e.textContent : "").find((t) => /itch 上的试玩版/.test(t ?? "")) ?? null);
  check("开局一行「itch 上的试玩版 … 完整版在 sing.weebpaint.com」", !!line && line.includes("sing.weebpaint.com"), line ?? "没找到");
  check("开局那一行带「去官网」钮", await frame.locator("button", { hasText: "去官网" }).count() > 0);

  // ③ 出声线程（AudioWorklet）起
  const worklet = await frame.evaluate(() => window.__moonsinger.engine.ensure().then(() => "ok", (e) => String(e)));
  check("出声线程（AudioWorklet）起来了", worklet === "ok", worklet);

  // ④ 写一个音（键盘 = 用户激活落在框里）、真唱一句：后台线程（小月相 worker）起 + 模型包从同站点下
  await frame.click("#score", { position: { x: 300, y: 220 } });
  for (const k of ["Digit1", "Digit2", "Digit3"]) await page.keyboard.press(k);
  await page.waitForTimeout(300);
  const wrote = await frame.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[Object.keys(window.__moonsinger.state().song.papers[0].tracks)[0]].filter((t) => t.kind === "note").length);
  check("写进了音（键盘在框里管用）", wrote >= 3, `${wrote} 个音`);
  await frame.click("#playBtn");
  const played = await frame.waitForFunction(() => { const e = window.__moonsinger.engine, r = window.__moonsinger.resource().snapshot; return e.playing && e.position > 0.3 && !e.waiting && r.chunks > 0 && r.lanes.some((l) => l && l.wasm > 0); }, null, { timeout: 90000, polling: 200 }).then(() => true, () => false);
  const modelHits = inner.log.filter((r) => r.path.startsWith("/pwa-models/packs/"));
  check("小月相唱起来了（后台线程起、模型包到手）", played, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check("模型包从同站点（zip 里那份）下", modelHits.length > 0 && modelHits.every((r) => r.status === 200), modelHits.map((r) => `${r.path.split("/")[3]}/${r.path.split("/")[4]}`).join("、"));
  check("没去 GitHub Pages 拿模型", !net.some((u) => /github\.io\/pwa-models/.test(u)));
  await frame.click("#playBtn").catch(() => undefined);   // 停

  // ⑤ GM 音源也能从同站点读（字节核 sha256 = app 里钉的）
  const sf = await frame.evaluate(async () => { const r = await fetch(new URL("pwa-sounds/generaluser-gs-2.0.3/GeneralUser-GS.sf2", location.href)); const b = await r.arrayBuffer(); return { status: r.status, bytes: b.byteLength, sha: [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("") }; });
  check("GM 音源从同站点读、哈希对", sf.status === 200 && sf.sha === "9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe", `${sf.status} · ${(sf.bytes / 1e6).toFixed(1)} MB`);

  // ⑥ 存 = 下载（被套着 = 没有系统保存框）
  const dl = page.waitForEvent("download", { timeout: 15000 }).then((d) => d.suggestedFilename(), () => null);
  await frame.click("#saveBtn");
  await frame.locator('[data-v="download"]').first().click({ timeout: 10000 }).catch(() => undefined);
  const fname = await dl;
  check("存 = 下载 .mxl", !!fname && /\.mxl$/.test(fname), fname ?? "没下载");

  // ⑦ 脏文档关页：beforeunload 对话框弹不弹（如实记）
  await frame.click("#score", { position: { x: 300, y: 220 } }); await page.keyboard.press("Digit4"); await page.waitForTimeout(300);
  const dirty = await frame.evaluate(() => ({ title: document.getElementById("docTitle")?.textContent ?? "", kind: document.getElementById("saveBtn")?.dataset.kind }));
  check("关页前文档是脏的（改过没存）", /•/.test(dirty.title) || /unsaved|fileDirty/.test(dirty.kind ?? ""), `标题「${dirty.title}」· 存钮 ${dirty.kind}`);
  const dialogs = []; page.on("dialog", (d) => { dialogs.push(d.type()); void d.dismiss(); });
  // 先测歌库（关页之后就没了）——放在这里是因为进歌库 = 放下手里的歌
  // ⑧ 歌库：网盘入口灰 + 「去官网」
  // （关页测试要在最后：先复制一份页面状态做歌库那一项会改掉脏态，所以歌库在另一个页面里测）
  await page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 1500));
  const iframeDialog = dialogs.includes("beforeunload");
  note("脏文档关页：beforeunload 对话框（跨站 iframe 里）", iframeDialog ? "弹了" : "**没弹**");

  // 对照：同一个包不套 iframe、直接顶层开（官网就是这样），同样写音、同样关
  const top = await ctx.newPage(); const topDialogs = []; top.on("dialog", (d) => { topDialogs.push(d.type()); void d.dismiss(); });
  await top.goto(`http://127.0.0.1:${P2}/index.html`); await top.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 });
  await top.click("#score", { position: { x: 300, y: 220 } }); await top.keyboard.press("Digit1"); await top.waitForTimeout(300);
  await top.close({ runBeforeUnload: true }); await new Promise((r) => setTimeout(r, 1500));
  note("对照：同一个包顶层打开、脏文档关页", topDialogs.includes("beforeunload") ? "弹了" : "没弹");

  // ⑧ 歌库：网盘入口灰 + 「去官网」（新开一页、同样被套着）
  const p3 = await ctx.newPage(); await p3.goto(`http://localhost:${P1}/`);
  const f3 = await (async () => { for (let i = 0; i < 100; i++) { const f = p3.frames().find((x) => x.url().includes(`127.0.0.1:${P2}`)); if (f) return f; await p3.waitForTimeout(100); } throw new Error("iframe 没出来"); })();
  await f3.waitForFunction(() => !!window.__moonsinger, null, { timeout: 30000 });
  await f3.click("#libBtn"); await f3.waitForSelector("#galleryFull:not([hidden])", { timeout: 15000 });
  const g = await f3.evaluate(() => { const b = document.querySelector('#galleryFull [data-v="cloud"]'); const a = document.querySelector("#galleryFull .site-hint-link"); return { disabled: !!b?.disabled, link: a?.getAttribute("href"), text: a?.textContent }; });
  check("歌库：网盘按钮灰着点不了", g.disabled);
  check("歌库：旁边一行「网盘在官网」链到 SITE_URL", g.link === SITE_URL && /官网/.test(g.text ?? ""), `${g.text} → ${g.link}`);

  // ⑨ 网络：整场没有 MSAL / 微软登录
  const msal = [...net.filter((u) => /msal|login\.microsoftonline|graph\.microsoft/i.test(u)), ...inner.log.filter((r) => /msal/i.test(r.path)).map((r) => r.path)];
  check("网络里没有 MSAL / 微软登录请求", msal.length === 0, msal.join("、"));
  const external = [...new Set(net.filter((u) => !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(u) && !/^(data|blob):/.test(u)).map((u) => new URL(u).host))];
  note("想去的外网（都被掐断）", external.length ? external.join("、") : "无");
  check("页面没有未接住的脚本错误", errs.length === 0, errs.slice(0, 3).join(" | "));
} finally {
  await browser.close(); inner.srv.close(); outer.close();
}
const bad = results.filter((r) => r.ok === false);
console.log(`\n[itch-fixture] ${results.filter((r) => r.ok).length} 过 · ${bad.length} 红 · ${results.filter((r) => r.ok === null).length} 条如实记（${((Date.now() - t0) / 1000).toFixed(1)} s）`);
process.exit(bad.length ? 1 : 0);
