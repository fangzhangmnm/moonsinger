// test/e2e/finder-hide.mjs —— 真浏览器 E2E：乐器目录「隐藏找不到的」开关（v0.16.56）。
// created 2026-11-09 by Claude Opus 5.5（user 11-09「选乐器的时候加一个隐藏找不到（包括平替）的乐器的选项。然后默认开」「免得一开始几个都是not avaliable now」）。
// 守：默认开 = 没有谁能演的（目录里连平替也没有）不列（按年代排时第一组「人类以前」原来打头的就是风 / 雷 / 溪流 / 雨 / 火）；搜它 = 说「藏着 N 件」；
//   点开关 = 全列出来；刷新后还记得（记在这台设备上）；再点 = 又藏起来。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-hide.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const NONE = ["Q8094", "Q83301", "Q47521", "Q7925", "Q3196"];   // 风 / 雷 / 溪流 / 雨 / 火：目录里没有谁能演
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 点开乐器会先试 GS：不下 32 MB
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const openFinder = async () => {
  await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
  await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
  await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);
};
const firstGroupIds = async () => { await pick(p, ".finder-sort", "year"); await p.waitForTimeout(150); if (!(await p.$('.finder-group[data-g="0"].is-open'))) { await p.click('.finder-group[data-g="0"] > .finder-group-h'); await p.waitForTimeout(150); }   // 手风琴：已经开着就别再点（再点 = 收起）
  return p.evaluate(() => [...document.querySelectorAll('.finder-group[data-g="0"] .inst-row')].map((r) => r.dataset.c)); };
const hideOn = () => p.evaluate(() => document.querySelector(".finder-hide")?.classList.contains("is-on"));
const search = async (q) => { await p.fill(".finder-q", q); await p.waitForTimeout(200); };

await p.goto(BASE); await p.waitForTimeout(800);
await openFinder();
check(await hideOn(), "默认开着「隐藏找不到的」");
let ids = await firstGroupIds();
check(ids.length > 0 && !ids.some((x) => NONE.includes(x)), "按年代第一组：风 / 雷 / 溪流 / 雨 / 火 都不在", ids.slice(0, 6).join(" "));
await search("牛吼器");
const msg = await p.evaluate(() => document.querySelector(".finder-empty")?.textContent ?? "");
check(/藏着 1 件/.test(msg), "搜一件没人演的 = 说藏着几件、怎么看到", msg);
await p.click(".finder-hide"); await p.waitForTimeout(200);
check(!(await hideOn()) && !!(await p.$('.inst-row[data-c="Q666971"]')), "点开关 = 全列出来（牛吼器出来了）");
await search(""); ids = await firstGroupIds();
check(NONE.some((x) => ids.includes(x)), "关着：第一组里又有风 / 雷这些", ids.slice(0, 6).join(" "));
check(await p.evaluate(() => document.querySelector(".finder") && !document.querySelector(".finder").hidden), "点开关不关目录");
await p.goto(BASE); await p.waitForTimeout(800);
await openFinder();
check(!(await hideOn()), "刷新后还记得（关着）");
await p.click(".finder-hide"); await p.waitForTimeout(200); ids = await firstGroupIds();
check((await hideOn()) && !ids.some((x) => NONE.includes(x)), "再点 = 又藏起来");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`finder-hide: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
