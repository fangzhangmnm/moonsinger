// test/e2e/finder-keys.mjs —— 真浏览器 E2E：找乐器（找人视图）开着时，电脑键盘的音键 = 弹（出声、不写谱）（v0.10.31）。
// created 2026-10-10 by Claude Opus 5.5（user「弹着玩/找乐器的时候应该也能键盘弹」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-keys.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await p.click('.ip-btns [data-v="finder"]'); await p.waitForTimeout(500);
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__aud = []; const on = e.auditionOn.bind(e); e.auditionOn = (...a) => { window.__aud.push(a[2]); return on(...a); }; });
const notes0 = await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song));
for (const k of ["Digit1", "Digit2", "Digit3"]) { await p.keyboard.press(k); await p.waitForTimeout(120); }
const aud = await p.evaluate(() => window.__aud);
check(aud.length >= 3, "找乐器时按 1 2 3 = 出声", JSON.stringify(aud));
check(aud.length >= 3 && new Set(aud).size === 3, "三个不同的音", JSON.stringify(aud));
check((await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song))) === notes0, "谱一点没动（只弹不写）");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-keys: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
