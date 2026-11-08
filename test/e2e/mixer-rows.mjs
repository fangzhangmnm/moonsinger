// test/e2e/mixer-rows.mjs —— 真浏览器 E2E：混音台贴底时显示几排卡片（v0.16.14，同小键盘的「行」）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「混音应该和键盘一样，也可以显示能显示几列卡，但是看一下屏幕高度上限」）。
// 守（iPad 竖屏大小）：「⋯」里排数 − n + 自动；手动 1 排 = 一排高；加到顶 = 「+」灰掉、谱还露一条（不超过屏幕高度上限）；自动 = 回到半屏的样子；刷新后记着。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/mixer-rows.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
const more = async () => { if (!(await p.$(".mix-menu:not([hidden])"))) { await p.click(".studio .mix-more"); await p.waitForTimeout(150); } };
for (let i = 0; i < 8; i++) { await more(); await p.click('.mix-menu [data-v="addbus"]'); await p.waitForTimeout(120); }   // 卡片多到好几排
await more();
const st = () => p.evaluate(() => { const s = document.querySelector(".studio"), st = document.querySelector("#stage"), card = s.querySelector(".strip"); return { h: s.getBoundingClientRect().height, top: s.getBoundingClientRect().top, stageTop: st.getBoundingClientRect().top, card: card.getBoundingClientRect().height, n: s.querySelector(".mix-rows-n")?.textContent, plus: s.querySelector('[data-v="rows:+"]')?.disabled, minus: s.querySelector('[data-v="rows:-"]')?.disabled, auto: s.querySelector('[data-v="rows:auto"]')?.classList.contains("is-on") }; });
const a0 = await st();
check(!!a0.n && a0.auto, "「⋯」里有排数，默认自动", JSON.stringify(a0));
if ((await st()).minus) { await p.click('[data-v="rows:+"]'); await p.waitForTimeout(120); }   // 自动本来就 1 排（这个屏幕）：先加一排变手动
for (let i = 0; i < 6; i++) { const s = await st(); if (s.minus) break; await p.click('[data-v="rows:-"]'); await p.waitForTimeout(120); }
const a1 = await st();
check(a1.n === "1" && a1.minus && !a1.auto, "减到 1 排：「−」灰掉", JSON.stringify(a1));
for (let i = 0; i < 12; i++) { const s = await st(); if (s.plus) break; await p.click('[data-v="rows:+"]'); await p.waitForTimeout(120); }
const a2 = await st();
check(a2.plus && Number(a2.n) > Number(a0.n), "加到顶：「+」灰掉，比自动的排数多", JSON.stringify(a2));
check(a1.h < a0.h + a0.card / 2 && a1.h > a1.card, "1 排 = 一排卡片那么高", `${a1.h}`);
check(a2.h > a1.h + a1.card, "排数多了 = 混音台真的变高", `${a1.h} → ${a2.h}`);
check(a2.top - a2.stageTop >= 90, "最高也给谱留一条（屏幕高度上限）", `${(a2.top - a2.stageTop).toFixed(0)} px`);
await p.reload(); await p.waitForTimeout(900); await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300); await more();
check((await st()).n === a2.n && !(await st()).auto, "刷新后记着手动的排数（新歌没存，加的混音轨刷新就没了，只剩一排卡片；排数照样记着）", JSON.stringify(await st()));
await p.click('[data-v="rows:auto"]'); await p.waitForTimeout(150);
check((await st()).auto, "点「自动」= 回到自动");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmixer-rows: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
