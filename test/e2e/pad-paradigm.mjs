// test/e2e/pad-paradigm.mjs —— 真浏览器 E2E：键盘自己弹不弹，看操作范式（v0.16.89）。
// created 2026-11-10 by Claude Opus 5.5。user 11-10「我的建议是windows都不自动弹，不然难受。ipad的话应该就是有输入意图的时候弹，空歌弹。取决于操作范式」。
// 守：鼠标点「听」再点「音」= 键盘不自己弹；手指点同一套 = 弹出来。（点亮着的模式钮 = 手动弹，两种范式都弹，pad-toggle.mjs 管）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pad-paradigm.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, hasTouch: true })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const padShown = () => p.evaluate(() => !document.getElementById("padPanel").hidden);
const center = (sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const hide = async () => { if (await padShown()) { await p.click("#padPanel .hide-pad"); await p.waitForTimeout(250); } };
// 鼠标：收起键盘 → 点「听」→ 点「音」= 不弹
await hide();
check(!(await padShown()), "鼠标：先把键盘收起来");
await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(250);
await p.click('.dock-tab [data-mode="notes"]'); await p.waitForTimeout(300);
check(!(await padShown()), "鼠标：换回「音」= 键盘不自己弹（鼠标键盘范式只手动开合）");
// 手指：同一套 = 弹出来
await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(250);
const n = await center('.dock-tab [data-mode="notes"]'); await p.touchscreen.tap(n.x, n.y); await p.waitForTimeout(300);
check(await padShown(), "手指：换回「音」= 键盘弹出来（有输入意图）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npad-paradigm: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
