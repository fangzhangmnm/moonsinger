// test/e2e/arrange.mjs —— 真浏览器 E2E：编排那一行（歌名下面；只在「全部」视图里有；点了就地改；写错的说为什么；本段视图里没有）。
// created 2026-10-08 by Claude Opus 5.5（user「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/arrange.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const box = () => p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), a = L.arrangement; return a && { x: sh.left + L.pageX.left + a.x + 30, y: sh.top + a.y + a.h / 2 }; });
await p.evaluate(() => window.__moonsinger.setScope("segment")); await p.waitForTimeout(150);
check((await box()) === null, "本段视图：没有编排那一行");
await p.evaluate(() => window.__moonsinger.setScope("all")); await p.waitForTimeout(150);
const at = await box();
check(!!at, "全部视图：有编排那一行");
check(await p.$$eval("#score text.arr-empty", (e) => e.length) === 1, "没写 = 灰字说怎么写");
await p.mouse.click(at.x, at.y); await p.waitForTimeout(150);
check(await p.$eval(".title-input", (e) => !e.hidden && e.classList.contains("arr")), "点了 = 就地开框");
await p.keyboard.type("1 x2"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
check(await p.evaluate(() => window.__moonsinger.state().song.arrangement) === "1 x2", "回车 = 存进歌里");
check(await p.$$eval("#score text.arr", (e) => e.map((x) => x.textContent).join()) === "1 x2", "谱上画出来");
check(await p.$$eval("#score text.arr-issue", (e) => e.length) === 0, "写对了 = 没有灰字");
const at2 = await box();   // 进了文字焦点、谱的位置会挪：重新量
await p.mouse.click(at2.x, at2.y); await p.waitForTimeout(150);
await p.keyboard.type("1 副歌"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);   // 开框时整行已经选中
const why = await p.$$eval("#score text.arr-issue", (e) => e.map((x) => x.textContent).join());
check(/没有叫「副歌」的纸/.test(why), "写错的 = 后面灰字说为什么", why);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
