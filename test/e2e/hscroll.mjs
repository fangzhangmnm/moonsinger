// test/e2e/hscroll.mjs —— 真浏览器 E2E：排法「横卷」（v0.9.35；user 2026-10-10「那个无限往右的总谱模式也做一下」）。
//   纸的设置（扳手）里排法第三个：每张纸一行、一直往右，谱面板横着滚；写音时光标横着跟；滚开了歌手名钉在左边；换回连续 = 照旧折行。跟着歌走（desk view.scroll）。
//   created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/hscroll.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1000, height: 800 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 48; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 6}`); await p.waitForTimeout(15); }
await p.waitForTimeout(200);
const rows = () => p.evaluate(() => new Set(window.__moonsinger.layout().systems.map((s) => s.sys)).size);
check((await rows()) > 1, "连续：48 个音折成好几行", String(await rows()));
// 扳手 → 排法 → 横卷
const openSheet = async () => { const c = await p.evaluate(() => { const L = window.__moonsinger.layout(), b = L.paperChip, sc = document.querySelector("#score .sheet").getBoundingClientRect(); return b ? { x: sc.left + L.pageX.left + b.x + b.w / 2, y: sc.top + b.y + b.h / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForTimeout(200); };
await p.evaluate(() => { document.querySelector("#score").scrollLeft = 0; document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(100);
await openSheet();
check(!!(await p.$('[data-v="flow:scroll"]')), "纸的设置里排法有「横卷」");
await p.click('[data-v="flow:scroll"]'); await p.waitForTimeout(300);
check(await p.$eval('[data-v="flow:scroll"]', (e) => e.classList.contains("is-on")), "「横卷」亮着");
await p.keyboard.press("Escape"); await p.mouse.click(990, 790).catch(() => {}); await p.waitForTimeout(200);
await p.click('.offer [data-v="close"]').catch(() => {}); await p.waitForTimeout(200);
check((await rows()) === 1, "横卷：一行（不折行）", String(await rows()));
const g = await p.evaluate(() => { const el = document.querySelector("#score"); return { sw: el.scrollWidth, cw: el.clientWidth, sl: el.scrollLeft, h: el.classList.contains("hscroll") }; });
check(g.h && g.sw > g.cw * 1.5, "谱面板横着能滚（纸按内容撑宽）", JSON.stringify(g));
check(g.sl > 0, "光标在最后 = 横着跟过去了", String(g.sl));
const caretIn = () => p.evaluate(() => { const L = window.__moonsinger.layout(), el = document.querySelector("#score"), sh = el.querySelector(".sheet"), x = sh.offsetLeft + L.pageX.left + (L.head?.x ?? -1e9); return x >= el.scrollLeft && x <= el.scrollLeft + el.clientWidth; });
check(await caretIn(), "光标在屏幕里");
check(await p.$eval(".pin-names", (e) => e.classList.contains("is-on")).catch(() => false), "滚开了 = 歌手名钉在左边露出来");
// 再写几个：还在屏幕里
for (let i = 0; i < 12; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 6}`); await p.waitForTimeout(15); }
await p.waitForTimeout(200);
check(await caretIn(), "接着写，光标照样跟着（横着）");
// 滚回最左边：钉住的名字收起来（纸上原来的名字看得见）
await p.evaluate(() => { document.querySelector("#score").scrollLeft = 0; }); await p.waitForTimeout(200);
check(!(await p.$eval(".pin-names", (e) => e.classList.contains("is-on"))), "滚回最左 = 钉住的名字收起");
// 放的时候横着跟：播放头摆到行尾附近 → 谱面板平滑滚过去（自动翻默认开）
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), pp = s.song.papers[0], toks = pp.tracks[s.at.part]; let t = 0; for (const k of toks) if (k.kind === "note" || k.kind === "rest") t += k.dur; m.view.setPlayhead({ paperId: pp.id, tick: t - 10 }); });
await p.waitForTimeout(900);
const sl = await p.$eval("#score", (e) => e.scrollLeft);
check(sl > 300, "放的时候横着跟（播放头到了右边 = 滚过去）", String(sl));
await p.evaluate(() => window.__moonsinger.view.setPlayhead(null));
// 跟着歌走
check((await p.evaluate(() => window.__moonsinger.desk().scroll)) === true, "视图态里记着横卷（存时进 score.json view.scroll）");
// 换回连续（纸的扳手在卷首那一屏：先滚回最左）
await p.evaluate(() => { document.querySelector("#score").scrollLeft = 0; document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(150);
await openSheet(); await p.click('[data-v="flow:cont"]'); await p.waitForTimeout(300); await p.click('.offer [data-v="close"]').catch(() => {}); await p.waitForTimeout(200);
check((await rows()) > 1, "换回连续 = 照旧折行", String(await rows()));
check(!(await p.$eval("#score", (e) => e.classList.contains("hscroll"))) && !(await p.$(".pin-names")), "不横滚了、钉住的名字没了");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nhscroll: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
