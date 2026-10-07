// test/shell-smoke.mjs —— PWA 壳冒烟（真浏览器 + 真 service worker）。created 2026-10-07 by Claude Opus 5.5
// 跑：先 bash scripts/build.sh，再 node test/shell-smoke.mjs（借 WeebPaint 的 playwright，同 JRB 的冒烟）。不在 npm test 里（要起浏览器）。
// 查四件事：① SW 装上、预缓存进 moonsinger-<主 bundle 哈希>；② 断网刷新照样开；③「新部署」后顶上出「有新版本」，点刷新换到新 bundle；
//   ④「清缓存重启」只清自己前缀的缓存——家族共享的 pwa-models、兄弟 app 的壳缓存都还在（家规 2026-10-01）。
// 本机 localhost 不注册 SW（pwa-shell 跳过），所以用 moonsinger.localhost：浏览器把 *.localhost 指回本机、当安全来源（SW 要安全来源）。
import { chromium } from "../../20260524 WeebPaint/node_modules/playwright/index.mjs";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn } from "node:child_process"; import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = fs.mkdtempSync(path.join(os.tmpdir(), "moonsinger-shell-"));
const FILES = ["index.html", "styles.css", "manifest.webmanifest", "service-worker.js", "icon.svg", "icon-192.png", "icon-512.png", "dist", "vendor", "assets"];
for (const f of FILES) fs.cpSync(path.join(ROOT, f), path.join(SITE, f), { recursive: true, dereference: true });
const PORT = 8790 + Math.floor(Math.random() * 100), HOST = "moonsinger.localhost", ORIGIN = `http://${HOST}:${PORT}`;
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", SITE], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));

let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "moonsinger-profile-"));
const ctx = await chromium.launchPersistentContext(profile, {});
const page = ctx.pages()[0] ?? await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
try {
  await page.goto(ORIGIN + "/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const bundle = (fs.readFileSync(path.join(SITE, "index.html"), "utf8").match(/dist\/(moonsinger-[a-z0-9]+)\.mjs/) ?? [])[1];
  const keys = await page.evaluate(() => caches.keys());
  check(keys.includes(bundle), "① SW 装上，壳缓存名 = 主 bundle", JSON.stringify(keys));

  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector("#bar .title");
  check((await page.textContent("#bar .title")) === "MoonSinger", "② 断网刷新照样开");
  await ctx.setOffline(false);

  // ③ 模拟一次新部署：主 bundle 换个名字（内容不变），index.html 指过去（再加一行注释让长度也变——本机 python 服务没有 ETag，SW 靠长度比）
  const nb = bundle.replace(/[a-z0-9]{4}$/, "beef");
  fs.copyFileSync(path.join(SITE, "dist", bundle + ".mjs"), path.join(SITE, "dist", nb + ".mjs"));
  fs.writeFileSync(path.join(SITE, "index.html"), fs.readFileSync(path.join(SITE, "index.html"), "utf8").replace(bundle, nb).replace("</html>", "<!-- next deploy -->\n</html>"));
  // 真实网络有延迟：SW 后台核对 index.html 的那次请求慢 600 ms 回来（本机服务太快，消息会在页面挂上监听前就发出去——那种情况下次打开直接就是新版）
  await ctx.route((u) => u.pathname === "/" || u.pathname === "/index.html", async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
  await page.reload();   // cache-first：先给旧的，后台核对发现变了 → 页面出「有新版本」
  await page.waitForSelector("#updateBar", { timeout: 15000 }).catch(() => {});
  check(!!(await page.$("#updateBar")), "③ 新部署后顶上出「有新版本」");
  if (await page.$("#updateBar")) {
    await ctx.unrouteAll();
    await Promise.all([page.waitForNavigation(), page.click('#updateBar [data-v="reload"]')]);
    await page.waitForSelector("#bar .title");
    const src = await page.evaluate(() => document.querySelector('script[type="module"]')?.getAttribute("src"));
    check(src?.includes(nb), "   点「刷新」后换到新 bundle", src ?? "");
  }

  // ④ 清缓存重启只动自己的
  await page.evaluate(async () => { await (await caches.open("pwa-models")).put("/__pwa-models__/x/chunk-000", new Response("x")); await (await caches.open("jrb-sibling")).put("/x", new Response("x")); });
  await page.click("#setBtn"); await page.click('[data-v="reset"]');
  await page.waitForURL(/\?reset=/, { timeout: 10000 }); await page.waitForSelector("#bar .title");
  const after = await page.evaluate(() => caches.keys());
  check(after.includes("pwa-models") && after.includes("jrb-sibling"), "④「清缓存重启」后共享模型缓存和兄弟 app 的缓存都还在", JSON.stringify(after));
  check(errs.length === 0, "页面无报错", errs.join(" | "));
} finally {
  await ctx.close(); server.kill(); fs.rmSync(SITE, { recursive: true, force: true }); fs.rmSync(profile, { recursive: true, force: true });
}
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
