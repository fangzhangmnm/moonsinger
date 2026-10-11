// test/e2e/dock-zoom.mjs —— 真浏览器 E2E（横屏）：切键盘（音 → 符 → 词：底座在 / 不在）谱的大小不跳（v0.10.33）。
// created 2026-10-10 by Claude Opus 5.5（user「切换键盘的时候比如从符号键盘变成文字输入的时候zoom不应该突变」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dock-zoom.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 6; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(40); }
const sp = () => p.evaluate(() => ({ sp: window.__moonsinger.layout().sp, w: Math.round(window.__moonsinger.layout().width), dock: document.getElementById("stage").dataset.dock }));
const a = await sp();
await p.evaluate(() => window.__moonsinger.setMode("symbols")); await p.waitForTimeout(300); const s = await sp();
await p.evaluate(() => window.__moonsinger.setMode("lyrics")); await p.waitForTimeout(300); const l = await sp();
check(a.dock !== "none" && l.dock === "none", "音 = 底座在、词 = 底座不在", JSON.stringify({ a, l }));
check(Math.abs(a.sp - s.sp) < 1e-6 && Math.abs(a.sp - l.sp) < 1e-6 && Math.abs(a.w - l.w) <= 1, "音 → 符 → 词：谱的大小不变", JSON.stringify({ a, s, l }));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ndock-zoom: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
