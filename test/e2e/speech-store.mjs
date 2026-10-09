// 念缓存全局池（IndexedDB `moonsinger-speech`）在真浏览器里开得起来：看大小 / 清空走 worker 的 cache 请求（不起引擎、不下模型）。
// created 2026-10-10 by Claude Fable 5.1。真唱 + 重开页面命中的那一路要模型包，在 tmp 的 probe 里量（见 CLAUDE.md v0.9.15）。
import { chromium } from "./pw.mjs";
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
let fails = 0; const check = (ok, what, extra = "") => { console.log(`  ${ok ? "✓" : "✗"} ${what}`, extra); if (!ok) fails++; };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const p = await ctx.newPage();
await p.goto(BASE); await p.waitForTimeout(600);
const info0 = await p.evaluate(() => window.__moonsinger.speechCache("info"));
check(info0 !== null && typeof info0.bytes === "number" && typeof info0.entries === "number" && info0.budget > 0, "池开得起来、报大小 / 条数 / 预算", JSON.stringify(info0));
const cleared = await p.evaluate(() => window.__moonsinger.speechCache("clear"));
check(cleared !== null && cleared.bytes === 0 && cleared.entries === 0, "清空 = 0 字节 0 条", JSON.stringify(cleared));
const res = await p.evaluate(() => window.__moonsinger.resource());
check(typeof res.text === "string" && res.lanes >= 1 && res.budgetLanes >= 1, "资源读数：道数 ≥ 1", `lanes ${res.lanes} / budget ${res.budgetLanes}`);
await browser.close();
if (fails) { console.log(`${fails} failed`); process.exit(1); }
console.log("speech-store e2e ok");
