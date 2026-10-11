// test/e2e/ctrl-zoom.mjs —— 真浏览器 E2E（大屏电脑）：Ctrl + 滚轮 = 缩放这张纸（能缩到比原大小）、以鼠标那一点为中心；网页不缩放；「1:1」回原大（v0.10.30）。
// created 2026-10-10 by Claude Opus 5.5（user「大屏电脑上面A4放的太大了，有办法zoom吗？还是就是ctrl wheel? ctrl wheel不应该zoom网页，而是应该被拦截」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/ctrl-zoom.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 6; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(40); }
const zoom = () => p.evaluate(() => Number(document.querySelector("#score .sheet").style.zoom || 1));
const sc = await p.evaluate(() => { const r = document.querySelector("#score").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 200 }; });
await p.mouse.move(sc.x, sc.y);
const pt0 = await p.evaluate(({ x, y }) => { const sr = document.querySelector("#score .sheet").getBoundingClientRect(), z = Number(document.querySelector("#score .sheet").style.zoom || 1); return { cx: (x - sr.left) / z, cy: (y - sr.top) / z }; }, sc);
let prevented = null;
await p.evaluate(() => { window.addEventListener("wheel", (e) => { if (e.ctrlKey) setTimeout(() => { window.__ctrlPrevented = e.defaultPrevented; }); }, { capture: true }); });
await p.keyboard.down("Control"); for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); } await p.keyboard.up("Control"); await p.waitForTimeout(200);
prevented = await p.evaluate(() => window.__ctrlPrevented);
const z1 = await zoom();
check(z1 < 0.8, "Ctrl + 滚轮往下 = 纸缩小（能比原大小）", String(z1));
check(prevented === true, "Ctrl + 滚轮被拦下（不缩放网页）", String(prevented));
// 放大（有地方滚）：鼠标下面那一点不动；缩到比窗口还小时纸贴顶 / 居中，那一点跟不住（没有滚动余地）
await p.click(".zoom-reset"); await p.waitForTimeout(200); await p.mouse.move(sc.x, sc.y);
await p.keyboard.down("Control"); for (let i = 0; i < 2; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(60); } await p.keyboard.up("Control"); await p.waitForTimeout(200);
const zin = await zoom(), pt1 = await p.evaluate(({ x, y }) => { const sr = document.querySelector("#score .sheet").getBoundingClientRect(), z = Number(document.querySelector("#score .sheet").style.zoom || 1); return { cx: (x - sr.left) / z, cy: (y - sr.top) / z }; }, sc);
check(zin > 1.2 && Math.abs(pt1.cy - pt0.cy) < 6 && Math.abs(pt1.cx - pt0.cx) < 6, "Ctrl + 滚轮往上 = 放大，鼠标下面那一点不动", JSON.stringify({ zin, pt0, pt1 }));
check(await p.$eval(".zoom-reset", (e) => !e.hidden), "缩小了 = 露出「1:1」");
await p.click(".zoom-reset"); await p.waitForTimeout(200);
check((await zoom()) === 1, "点「1:1」= 回原大");
await p.mouse.move(sc.x, sc.y); await p.mouse.wheel(0, 200); await p.waitForTimeout(200);
check((await zoom()) === 1, "不按 Ctrl 的滚轮 = 照常滚，不缩放");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nctrl-zoom: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
