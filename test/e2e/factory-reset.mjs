// test/e2e/factory-reset.mjs —— 真浏览器 E2E：设置 → 开发者 → 「还原出厂设置…」两步护栏（说明 sheet 可取消、逐字确认不对不动）→ 删干净 → 重开成新装（无地、没有 store、自家前缀的库 / 键全没了）；
//   家族共享的 pwa-models / pwa-sounds 不碰（这里放一个假条目核它还在）。created 2026-10-21 by Claude Fable 5.1（家族规矩 2½）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/factory-reset.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const URL0 = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
await p.goto(URL0); await p.waitForTimeout(500);
const footprint = () => p.evaluate(async () => {
  const dbs = typeof indexedDB.databases === "function" ? (await indexedDB.databases()).map((d) => d.name ?? "") : [];
  const ls = []; for (let i = 0; i < localStorage.length; i++) ls.push(localStorage.key(i));
  const caches_ = typeof caches !== "undefined" ? await caches.keys() : [];
  return { ours: dbs.filter((n) => /^moonsinger[.-]/.test(n)), lsOurs: ls.filter((k) => k && /^moonsinger[.-]/.test(k)), shared: caches_.filter((k) => k === "pwa-models" || k === "pwa-sounds"), ownCache: caches_.filter((k) => k.startsWith("moonsinger-")) };
});
try {
  // 造足迹：进歌库、新建、写几个音（store 的库 + 自动存）；放一个假的家族共享缓存条目
  await p.evaluate(() => window.__moonsinger.attach()); await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(200);
  await p.click("#score", { position: { x: 600, y: 200 } }); for (const k of ["Digit1", "Digit2", "Digit3"]) await p.keyboard.press(k);
  await p.waitForFunction(() => !!window.__moonsinger.identifier()); await p.waitForTimeout(2600);
  await p.evaluate(async () => { const c = await caches.open("pwa-models"); await c.put("/__pwa-models__/fake/chunk-000", new Response("x")); });
  const before = await footprint();
  check(before.ours.some((n) => n.startsWith("moonsinger.")) && before.lsOurs.some((k) => k.endsWith(":storeAttached")), "有足迹：store 的库 + 已进歌库的键", JSON.stringify(before));
  check(before.shared.includes("pwa-models"), "家族共享缓存 pwa-models 在");
  // 设置 → 开发者 → 还原出厂：说明 sheet 取消 = 什么都不动
  const openFactory = async () => { await p.click("#setBtn"); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".settings-card"); await p.click(".set-dev > summary"); await p.click('[data-v="factory"]'); await p.waitForSelector('.offer [data-v="ok"]'); };
  await openFactory();
  const introText = await p.textContent(".offer .offer-msg");
  check(/还没传上去|都传上去了/.test(introText), "说明 sheet 写了传没传上去（dirty.count 口径）", introText.slice(0, 60));
  await p.click('.offer [data-v="no"]'); await p.waitForTimeout(200);
  const hasStoreDb = (f) => f.ours.some((n) => n.startsWith("moonsinger.")), hasAttached = (f) => f.lsOurs.some((k) => k.endsWith(":storeAttached"));
  { const f = await footprint(); check(hasStoreDb(f) && hasAttached(f) && f.shared.includes("pwa-models"), "取消 = 什么都不动（store 的库 / 已进歌库的键 / 共享缓存都在）", JSON.stringify(f.ours)); }
  // 逐字确认写错 = 不动
  await openFactory(); await p.click('.offer [data-v="ok"]'); await p.waitForSelector(".offer input");
  await p.fill(".offer input", "删除"); await p.click('.offer [data-v="ok"]'); await p.waitForTimeout(400);
  { const f = await footprint(); check(hasStoreDb(f) && hasAttached(f), "口令不对 = 不动", JSON.stringify(f.ours)); }
  // 真做：说明 → 逐字 → 完成 sheet → reload 成新装
  await openFactory(); await p.click('.offer [data-v="ok"]'); await p.waitForSelector(".offer input");
  await p.fill(".offer input", "删除全部本地数据"); await p.click('.offer [data-v="ok"]');
  await p.waitForSelector(".offer .offer-title:has-text('还原出厂设置')", { timeout: 15000 });
  const doneText = await p.textContent(".offer .offer-msg");
  check(/删了 \d+ 个库/.test(doneText), "完成 sheet 报删了几个库 / 键", doneText.slice(0, 80));
  await Promise.all([p.waitForNavigation({ waitUntil: "load", timeout: 15000 }).catch(() => {}), p.click('.offer [data-v="ok"]')]);
  await p.waitForFunction(() => !!window.__moonsinger, { timeout: 15000 }); await p.waitForTimeout(600);
  const after = await footprint();
  check(after.ours.length === 0, "重开后：自家的库全没了", JSON.stringify(after.ours));
  check(after.lsOurs.filter((k) => !k.endsWith(":diag-log")).length === 0, "自家的 localStorage 键全没了（新装重开后黑匣子自己写的 diag-log 不算）", JSON.stringify(after.lsOurs));
  check(after.shared.includes("pwa-models"), "家族共享缓存 pwa-models 没动");
  check(await p.evaluate(() => window.__moonsinger.store() === null && window.__moonsinger.identifier() === null), "新装：没进过歌库、无地空谱");
  check(/reset=/.test(p.url()), "带着 reset 参数重开");
  check(errs.length === 0, "没有页面错误", errs.join(" | "));
} finally { console.log(`\n  ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0); }
