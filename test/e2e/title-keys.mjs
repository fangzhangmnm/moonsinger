// test/e2e/title-keys.mjs —— 真浏览器 E2E：歌名框里 Ctrl / ⌘ 组合归浏览器（贴 / 全选 / 撤销进框，谱不动）；存照样被 app 接住（W-36）。
// created 2026-10-13 by Claude Opus 5.5（user「复制进文本框的时候ctrl v误拦截了」「比如歌名文本框，但是你系统查一下」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/title-keys.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(60); }
const S = () => p.evaluate(() => { const s = window.__moonsinger.state(); return { n: s.song.papers[0].tracks.P1.length, sel: s.sel, title: s.song.title ?? "" }; });
const before = await S();
const box = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), t = L.title; return { x: sh.left + L.pageX.left + t.x + t.w / 2, y: sh.top + t.y + t.h / 2 }; });
await p.mouse.click(box.x, box.y); await p.waitForTimeout(150);
check(await p.evaluate(() => { const i = document.querySelector(".title-input"); return !!i && !i.hidden && document.activeElement === i; }), "点歌名 = 就地开框、焦点在框里");
const val = () => p.$eval(".title-input", (e) => e.value);
// Ctrl+V：系统剪贴板的字进框，谱不变（原来被谱面的 clip.paste 抢走 = 贴到谱上）
await p.evaluate(() => navigator.clipboard.writeText("团子大家族"));
await p.keyboard.press("Control+v"); await p.waitForTimeout(150);
check(await val() === "团子大家族", "Ctrl+V = 贴进歌名框", await val());
let s = await S(); check(s.n === before.n, "Ctrl+V：谱上没多东西", `${before.n} → ${s.n}`);
// Ctrl+A：全选框里的字，不是全选音符
await p.keyboard.press("Control+a"); await p.waitForTimeout(100);
const selRange = await p.$eval(".title-input", (e) => [e.selectionStart, e.selectionEnd]);
s = await S();
check(selRange[0] === 0 && selRange[1] === 5, "Ctrl+A = 全选框里的字", JSON.stringify(selRange));
check(s.sel === null, "Ctrl+A：谱上没选中音", JSON.stringify(s.sel));
// Ctrl+Z：撤的是框里的字，不是谱
await p.keyboard.type("月"); await p.waitForTimeout(80);
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
s = await S(); check(s.n === before.n, "Ctrl+Z：谱没被撤（原来撤掉最后写的音）", `${before.n} → ${s.n}`);
check(await p.evaluate(() => !document.querySelector(".title-input").hidden), "Ctrl+Z：框还开着");
// Ctrl+S 照样是 app 的「存」（挂在最外层），不落到浏览器的「保存网页」
await p.evaluate(() => { window.__sk = []; window.addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) window.__sk.push(e.defaultPrevented); }); });
await p.keyboard.press("Control+s"); await p.waitForTimeout(200);
check(JSON.stringify(await p.evaluate(() => window.__sk)) === "[true]", "歌名框里 Ctrl+S 照样被 app 接住");
const sheet = await p.evaluate(() => [...document.querySelectorAll(".offer, .sheet-overlay, .sheet")].some((e) => e.offsetParent !== null));
if (sheet) { await p.keyboard.press("Escape"); await p.waitForTimeout(150); }
// 框外：谱上的 Ctrl+A 还是全选音符（只放过打字的框，谱面不受影响）
await p.click("#score"); await p.waitForTimeout(100);
if (await p.evaluate(() => !document.querySelector(".title-input").hidden)) { await p.keyboard.press("Escape"); await p.waitForTimeout(100); }
await p.focus("#score"); await p.keyboard.press("Control+a"); await p.waitForTimeout(120);
s = await S(); check(!!s.sel, "谱面上 Ctrl+A 照旧全选音符", JSON.stringify(s.sel));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntitle-keys: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
