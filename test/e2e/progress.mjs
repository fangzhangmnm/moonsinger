// test/e2e/progress.mjs —— 真浏览器 E2E：渲染进度条（顶栏底边）。月读换成一段慢一点的静音（看得见条）：渲染时露、条纹在走；完了收起。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「其实我一直不爽渲染没有加进度条…加一下进度条」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1000, height: 800 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => { const m = window.__moonsinger; m.singer.sing = (score, prog) => new Promise((ok) => { prog("下载月读的模型（40 MB，只下这一次）50%"); setTimeout(() => ok({ samples: new Float32Array(48000), sr: 48000 }), 700); }); });
check(await p.$eval(".render-bar", (e) => e.hidden), "平时收着");
await p.click("#playBtn"); await p.waitForTimeout(250);
const mid = await p.$eval(".render-bar", (e) => ({ hidden: e.hidden, fill: e.querySelector(".rb-fill").style.width, known: e.querySelector(".rb-cur").classList.contains("known") }));
check(!mid.hidden, "渲染时露出来");
check(mid.known && parseFloat(mid.fill) > 0, "下载报了百分比 = 那一格按比例填", JSON.stringify(mid));
await p.waitForTimeout(1200);
check(await p.$eval(".render-bar", (e) => e.hidden), "渲染完收起");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
