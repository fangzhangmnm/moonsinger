// test/e2e/playhead.mjs —— 真浏览器 E2E：播放头画的是「现在听到的」地方（扬声器的时钟），不是录音房「正在算」的地方。
// created 2026-10-10 by Claude Opus 5.5（user「ipad后台唤起后音频和动画错位。以及你有没有办法实际测音频播到哪里了来好好对齐？」）
// 守的是：放着的时候 听到的位置 ≤ 算到的位置、差 ≈ 输出延迟（浏览器报的）；播放头真的画出来、跟着走；停了就没了。真机的延迟只能在 iPad 上看（设置页 / 诊断日志有数）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/playhead.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
/** 点主键：离上一下至少 500 ms（> 连按窗口 350 ms；连按两下 = 从头放，v0.9.25）。 */
let lastPlayTap = 0;
const tapPlay = async () => { const w = 500 - (Date.now() - lastPlayTap); if (w > 0) await p.waitForTimeout(w); await p.click("#playBtn"); lastPlayTap = Date.now(); };
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 8; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(30); }
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 6), sr: 22050 }); });   // 月读不唱（静音块），只看走带
await tapPlay();
let ok = false; for (let i = 0; i < 60; i++) { if (await p.evaluate(() => window.__moonsinger.engine.playing)) { ok = true; break; } await p.waitForTimeout(100); }
check(ok, "放起来了");
await p.waitForTimeout(600);
const s = await p.evaluate(() => { const e = window.__moonsinger.engine; return { heard: e.audibleSec(), at: e.position, lat: e.latencyMs(), ts: typeof AudioContext.prototype.getOutputTimestamp === "function" }; });
check(s.heard !== null && s.heard <= s.at + 1e-6, "听到的位置不超过算到的位置", JSON.stringify(s));
check(s.lat !== null && s.lat >= 0 && s.lat < 1000, "输出延迟有数（浏览器报的）", `${s.lat?.toFixed(1)} ms`);
check(s.heard !== null && s.at - s.heard < (s.lat ?? 0) / 1000 + 0.06, "两者之差 ≈ 输出延迟（+ 位置报告的间隔）", `${((s.at - s.heard) * 1000).toFixed(1)} ms`);
// 播放线先不画（user「先试试不用线」）：正在响的音高亮，跟着走
const hl = () => p.evaluate(() => { const e = document.querySelector(".play-hl"); return e ? parseFloat(e.style.left) : null; });
const ph1 = await hl(); await p.waitForTimeout(700); const ph2 = await hl();
check(ph1 !== null && ph2 !== null && ph2 > ph1, "正在响的音高亮了、往右走（没有播放线）", `${ph1} → ${ph2}`);
check(!(await p.$(".playhead")), "不画播放线");
await tapPlay(); await p.waitForTimeout(200);
check(!!(await p.$(".play-hl")) && !(await p.evaluate(() => window.__moonsinger.engine.playing)), "暂停 = 高亮留在停下的那个音（续播从这儿）");
check(!errs.length, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nplayhead: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
