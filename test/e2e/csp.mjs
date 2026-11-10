// test/e2e/csp.mjs —— 真浏览器 E2E：页面安全策略（index.html 的 Content-Security-Policy）底下，正常用一圈一条都不被拦；混进页面的内联脚本 / 内联事件处理器跑不起来。
// created 2026-11-10 by Claude Fable 5.2（总表第 5 条「读文件时的安全」的后一半）。加策略那天当场抓到一条：只把 Vue 的一部分递给图库 = 图库运行时编译模板 = 要 eval = 歌库打不开——所以歌库在这里走一遍。
//   注意：page.evaluate 走 DevTools、不受策略约束——反证那几条是往页面里真插元素，不是在 evaluate 里 eval。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/csp.mjs
import { chromium } from "./pw.mjs";
import { FAKE_FSA } from "./fake-fsa.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.addInitScript(FAKE_FSA);
await ctx.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI || "inline"} @${(e.sourceFile || "").split("/").pop()}:${e.lineNumber}`)); });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForFunction(() => !!window.__moonsinger, null, { timeout: 20000 });
const blockedSoFar = () => p.evaluate(() => window.__csp.slice());

check(await p.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')), "页面带着安全策略");
check(await p.evaluate(() => typeof window.__msShowError === "function"), "开机兜底脚本（boot-guard.js，从内联搬成了文件）跑起来了");

// 正常用一圈
for (const k of ["1", "2", "3", "4", "5"]) { await p.keyboard.press(k); await p.waitForTimeout(50); }
await p.keyboard.press("Space"); await p.waitForTimeout(2000); await p.keyboard.press("Space");                       // 放：引擎线程、录音房、WASM
await p.evaluate(async () => { try { await window.__moonsinger.renderMix?.(); } catch { /* 没人上场也算走过 */ } });   // 离线渲染
await p.evaluate(() => document.querySelector('[data-mode="listen"]')?.click()); await p.waitForTimeout(500);          // 听 + 混音台
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check((await blockedSoFar()).length === 0, "写音 / 播放 / 离线渲染 / 混音台：一条都没被拦", (await blockedSoFar()).join(" | "));

// 歌库（图库的界面：预编译的 render 函数，不许退回运行时编译）。另开一页干净的（上面那页写过音，进歌库前会先问那首没存的怎么办）
const g = await ctx.newPage(); const gerrs = []; g.on("pageerror", (e) => gerrs.push(e.message));
await g.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await g.waitForFunction(() => !!window.__moonsinger, null, { timeout: 20000 });
await g.click("#libBtn");
await g.waitForSelector(".offer:not(.gate-sheet) button:has-text('选一个文件夹')");
await g.click(".offer:not(.gate-sheet) button:has-text('选一个文件夹')");
const opened = await g.waitForFunction(() => { const el = document.getElementById("galleryFull"); return !!el && !el.hidden; }, null, { timeout: 8000 }).then(() => true, () => false);
check(opened, "歌库打得开");
const gBlocked = await g.evaluate(() => window.__csp.slice());
check(gBlocked.length === 0, "开歌库：一条都没被拦（没有 eval）", gBlocked.join(" | "));
check(!(await g.evaluate(() => { const bar = document.getElementById("errBanner"); return !!bar && !bar.hidden; })) && gerrs.length === 0, "歌库那一页没有红条、没有报错", gerrs.join(" | "));
await g.close();

// 反证：往页面里真插内联脚本和内联事件处理器（歌文件里混进了能当 HTML 的字、又漏了转义时就是这个样子）
const before = (await blockedSoFar()).length;
const pwned = await p.evaluate(() => new Promise((res) => {
  window.__pwned = 0;
  const s = document.createElement("script"); s.textContent = "window.__pwned = 1"; document.body.append(s);
  const d = document.createElement("div"); d.innerHTML = `<img src="data:image/gif;base64,AAAA" onerror="window.__pwned = 2"><button id="evilBtn" onclick="window.__pwned = 3">x</button>`; document.body.append(d);
  setTimeout(() => { d.querySelector("#evilBtn").click(); setTimeout(() => { d.remove(); res(window.__pwned); }, 200); }, 400);
}));
check(pwned === 0, "插进去的内联脚本 / onerror / onclick 都没跑起来", String(pwned));
check((await blockedSoFar()).length - before >= 2, "拦下的都记了下来", String((await blockedSoFar()).length - before));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ncsp: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
