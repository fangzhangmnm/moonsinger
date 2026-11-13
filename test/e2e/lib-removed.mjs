// test/e2e/lib-removed.mjs —— 真浏览器 E2E：删掉的库不自己下回来（v0.17.25，统筹「v0.17.24：…删掉的库不许自己下回来」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：设备上有「小月相你删了」的记号（设置音源页删成功时记的那一个）→ 新歌（默认小月相上场）写几个音、等预唱 → 一次都没去拿模型包；
//   那位挂「不出声」（|▶ 上的数）、清单里原因写「小月相被你删了」、有「装回来」；设置音源页那一栏写「你删了 · 不会自己下载」+「装回来」。
//   对照：没有记号时同样写几个音 = 照原来去拿模型包（用到时自己下载）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/lib-removed.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", KV = "moonsinger-5b1e7c0a92d34f6e:lib-removed-voice";
const b = await chromium.launch();
/** 开一个新的浏览器上下文（removed = 设备上有没有「你删了」的记号），新歌里写三个音、等预唱；回记下的模型包请求和页面。 */
async function run(removed) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
  if (removed) await ctx.addInitScript((k) => localStorage.setItem(k, "1"), KV);
  const p = await ctx.newPage(), packs = [], errs = []; p.on("pageerror", (e) => errs.push(e.message));
  p.on("request", (r) => { if (/pwa-models/.test(r.url())) packs.push(r.url()); });
  await p.goto(BASE); await p.waitForTimeout(900);
  for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(60); }
  await p.waitForTimeout(2500);   // 改谱停 700 ms 后预唱；再留一点给 worker 起来
  return { ctx, p, packs, errs };
}
{ const { ctx, p, packs, errs } = await run(true);
  check(packs.length === 0, "有「你删了」的记号：写音、预唱之后一次都没去拿模型包", packs.slice(0, 2).join(" "));
  const badge = await p.$eval("#playBtn", (e) => e.querySelector(".issues-badge")?.textContent ?? "");
  check(badge === "1", "那位挂「不出声」：|▶ 上的数 = 1", badge);
  await p.click("#playBtn .issues-badge"); await p.waitForTimeout(250);
  const sheet = await p.$eval(".offer .offer-card", (e) => e.textContent ?? "").catch(() => "");
  check(/小月相被你删了/.test(sheet) && !!(await p.$('.offer [data-v="libadd:voice"]')), "清单里原因写「小月相被你删了」、有「装回来」", sheet.slice(0, 60));
  await p.click('.offer [data-v="close"]').catch(() => {}); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel"); await p.click('.set-panel [data-tab="sound"]'); await p.waitForTimeout(600);
  const col = await p.$eval('.wbe-row[data-lib="voice"]', (e) => e.textContent ?? "");
  check(/你删了 · 不会自己下载/.test(col) && /装回来/.test(col) && !/现在下载/.test(col), "设置音源页：「你删了 · 不会自己下载」+「装回来」", col.slice(0, 40));
  check(!errs.length, "没有页面错误", errs.join(" / "));
  await ctx.close(); }
{ const { ctx, packs } = await run(false);
  check(packs.length > 0, "对照：没有记号 = 照原来，用到时自己去拿模型包", String(packs.length));
  await ctx.close(); }
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
