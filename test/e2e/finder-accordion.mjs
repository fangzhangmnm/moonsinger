// test/e2e/finder-accordion.mjs —— 真浏览器 E2E：乐器目录的分类 = 手风琴（v0.16.3）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「选乐器的每个category自动collapse，而且只能expand一个（我记得你喜欢叫这个控件手风琴？）」）。
// 守：默认全收着（只露组头）；点组头 = 展开它、别的收起；再点 = 收起；「跳到」= 展开那一组；搜索时全露出来；
//   清掉搜索 = 回到手风琴、展开的是搜索时点开的那件所在的组；关掉再开 = 还是那一组；每种排序各记各的。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-accordion.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 点开乐器会先试 GS：不下 32 MB
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const openFinder = async () => { await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300); };
await openFinder();
const state = () => p.evaluate(() => ({ groups: document.querySelectorAll(".finder-group").length, open: [...document.querySelectorAll(".finder-group.is-open")].map((g) => g.dataset.g), rows: document.querySelectorAll(".inst-row").length, acc: document.querySelectorAll(".finder-group.acc").length }));
const head = (k) => p.click(`.finder-group[data-g="${k}"] > .finder-group-h`);

let s = await state();
check(s.groups > 1 && s.acc === s.groups && s.open.length === 0 && s.rows === 0, "默认：每一组都收着，只露组头", JSON.stringify(s));
await head(1); await p.waitForTimeout(150); s = await state();
check(s.open.join() === "1" && s.rows > 0, "点第 2 组的组头 = 只展开它", JSON.stringify(s));
const top1 = await p.evaluate(() => document.querySelector('.finder-group[data-g="1"]').getBoundingClientRect().top - document.querySelector(".finder-list").getBoundingClientRect().top);
check(Math.abs(top1) <= 2, "展开的那组滚到列表顶上", String(top1));
await head(2); await p.waitForTimeout(150); s = await state();
check(s.open.join() === "2", "再点第 3 组 = 第 2 组自动收起（只能开一组）", JSON.stringify(s));
await head(2); await p.waitForTimeout(150); s = await state();
check(s.open.length === 0 && s.rows === 0, "再点同一组 = 收起", JSON.stringify(s));
await pick(p, ".finder-jump-sel", "3"); await p.waitForTimeout(200); s = await state();
check(s.open.join() === "3", "「跳到」第 4 组 = 展开它", JSON.stringify(s));

// 搜索：全露出来；在搜索里点开一件 → 清掉搜索 = 展开的是它那一组
await p.fill(".finder-q", "flute"); await p.waitForTimeout(200); s = await state();
check(s.acc === 0 && s.rows > 0 && s.open.length === s.groups, "搜索时不收：结果全露出来", JSON.stringify(s));
await p.click('.inst-row[data-c="Q209554"]'); await p.waitForTimeout(300);
const fluteGroup = await p.$eval('.inst-row[data-c="Q209554"]', (r) => r.closest(".finder-group").dataset.gid);
await p.fill(".finder-q", ""); await p.waitForTimeout(200); s = await state();
const openGid = await p.evaluate(() => [...document.querySelectorAll(".finder-group.is-open")].map((g) => g.dataset.gid).join());
check(s.acc === s.groups && openGid === fluteGroup && !!(await p.$('.inst-row.is-open[data-c="Q209554"]')), "清掉搜索 = 回到手风琴，展开的是长笛那一组、长笛还点开着", `${openGid} / ${fluteGroup}`);

// 换排序：各记各的（按曲风还没开过 = 全收）；换回来 = 还是长笛那组
await pick(p, ".finder-sort", "style"); await p.waitForTimeout(200); s = await state();
check(s.open.length === 0, "换到按曲风：这种排序还没开过 = 全收着", JSON.stringify(s));
await pick(p, ".finder-sort", "year"); await p.waitForTimeout(200);
check((await p.evaluate(() => [...document.querySelectorAll(".finder-group.is-open")].map((g) => g.dataset.gid).join())) === fluteGroup, "换回按年代 = 还是长笛那一组展开着");

// 关掉再开
await p.click('.finder-bar [data-v="back"]'); await p.waitForTimeout(300); await openFinder();
check((await p.evaluate(() => [...document.querySelectorAll(".finder-group.is-open")].map((g) => g.dataset.gid).join())) === fluteGroup, "关掉再开 = 还是那一组展开着");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-accordion: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
