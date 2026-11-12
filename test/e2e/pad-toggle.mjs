// test/e2e/pad-toggle.mjs —— 真浏览器 E2E（iPad mini 竖屏 744 × 1133）：开合键盘不把谱拽回光标那儿；点亮着的模式 = 弹出它的键盘 / 混音台（v0.10.42）。
// created 2026-10-11 by Claude Opus 5.5（user「toggle软键盘之后谱子还是会跳到奇怪的地方」「idiempotent点听，音也应该跳出相应的软键盘」）
//   2026-11-12 Claude Opus 5.5（MoonSinger小弟）：放完光标马上滚轮滚开不被拽回 + 等法改成等跟随落地、真滚轮（原来时红时绿）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pad-toggle.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const A = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>P1</part-name></score-part></part-list><part id="P1">${Array.from({ length: 80 }, (_, k) => `<measure number="${k + 1}">${k ? "" : A}${N("C")}${N("D")}${N("E")}${N("F")}</measure>`).join("")}</part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, XML); await p.waitForTimeout(500);
const top = () => p.evaluate(() => Math.round(document.getElementById("score").scrollTop));
const padShown = () => p.evaluate(() => !document.getElementById("padPanel").hidden);
const caretSeen = () => p.evaluate(() => { const sc = document.getElementById("score").getBoundingClientRect(), c = document.querySelector("#score .caret")?.getBoundingClientRect(); return !!c && c.bottom > sc.top && c.top < sc.bottom; });
const togglePad = async () => { if (await padShown()) { await p.click("#padPanel .hide-pad"); } else await p.click("#padTab"); await p.waitForTimeout(300); };
// 等法（2026-11-12）：光标挪了之后，视图跟过去那一下要等排版回来（光标跨过尾巴 = 整张重排，排版线程里一百来毫秒，负载高更久）。
//   原来固定等 200 毫秒、再用代码设 scrollTop 滚开：排版没回来就滚开 = 回来时被拽回 = 时红时绿。现在：
//   frames = 等几帧（下一帧的画把排版发出去）；land = 让主线程把在路上的排版算完、画掉（跟随就落在这一刻，不靠猜时间）；滚开用真滚轮（人滚开走的那条路）。
const frames = (n = 2) => p.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : r()); f(); }), n);
const land = async () => { await frames(2); await p.evaluate(() => { window.__moonsinger.layout(); }); await frames(2); };
const still = async () => { let a = await top(); for (let i = 0; i < 40; i++) { await frames(3); const b = await top(); if (b === a) return b; a = b; } return a; };
const wheelAway = async (dy) => { const r = await p.$eval("#score", (e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * 0.4 }; }); await p.mouse.move(r.x, r.y); await p.mouse.wheel(0, dy); };
const setCaret = (c) => p.evaluate((c) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: c === "end" ? s.song.papers[0].tracks[s.at.part].length : c, sel: null }); }, c);
// 光标放在开头附近、跟随落地，然后用滚轮滚开很远
await setCaret(5); await land(); await still(); await wheelAway(3000);
const t0 = await still(); check(!(await caretSeen()) && t0 > 1000, "滚开了：光标那行不在视野里", String(t0));
await togglePad(); const t1 = await top(); await togglePad(); const t2 = await top();
check(Math.abs(t1 - t0) <= 2 && Math.abs(t2 - t0) <= 2, "开合键盘两次：谱不跳回光标那儿（以前一开合就拽回去）", `${t0} → ${t1} → ${t2}`);
await setCaret(6); await land(); await still();
check(await caretSeen(), "滚开之后再挪一下光标（打字、方向键同一条）= 照旧跟过去");
// 光标在视野里、被弹出来的键盘挡住 = 拉上来
if (await padShown()) await togglePad();
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), sc = document.getElementById("score"); m.set({ ...s, caret: s.song.papers[0].tracks[s.at.part].length, sel: null }); }); await p.waitForTimeout(300);
await p.evaluate(() => { const sc = document.getElementById("score"), c = document.querySelector("#score .caret").getBoundingClientRect(), r = sc.getBoundingClientRect(); sc.scrollTop += (c.bottom - r.bottom) + 10; }); await p.waitForTimeout(200);
check(await caretSeen(), "键盘收着：光标那行贴在最底下（看得见）");
await togglePad(); check((await padShown()) && (await caretSeen()), "键盘弹出来挡住它 = 照样拉上来");
// 点亮着的模式 = 弹出（只弹不收）
await togglePad(); check(!(await padShown()), "收起键盘");
await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(250);
check(await padShown(), "「音」亮着时再点 = 键盘弹出来");
await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(250);
check(await padShown(), "再点 = 还开着（不会收起）");
await p.click('.pad-head [data-kbswitch]'); await p.waitForTimeout(150); await togglePad();
await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(250);
check((await padShown()) && !!(await p.$(".pad-grid.symbols")), "符号格收起后点「音」= 弹出符号格（还是那张）");
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
check(await p.isVisible(".studio"), "点「听」= 混音台");
await p.click("#padTab"); await p.waitForTimeout(250); check(!(await p.isVisible(".studio")), "收起混音台");
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
check(await p.isVisible(".studio"), "「听」亮着时再点 = 混音台弹出来");
// 键盘只手动开合（v0.16.55；user 11-09「选中音符的时候不应该自动弹键盘…只手动toggle」「鼠标点空白不应该出键盘，不然电脑上很难受」）
await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(300);
if (await padShown()) await togglePad();
check(!(await padShown()), "回到「音」、键盘收着");
const spot = await p.evaluate(() => {
  const r = document.getElementById("score").getBoundingClientRect(), n = document.querySelector("#score .staff-svg [data-tok]")?.getBoundingClientRect();
  const bar = document.getElementById("bar")?.getBoundingClientRect(); let bx = -1, by = -1;
  if (bar) for (let x = bar.left + 4; x < bar.right - 4; x += 6) { const el = document.elementFromPoint(x, bar.top + bar.height / 2); if (el && el.closest("#bar") && !el.closest("button, select, label, input, a")) { bx = x; by = bar.top + bar.height / 2; break; } }
  return { nx: n ? n.left + n.width / 2 : r.left + r.width / 2, ny: n ? n.top + n.height / 2 : r.top + 120, ex: r.left + 8, ey: r.top + r.height * 0.6, bx, by };
});
await p.mouse.click(spot.nx, spot.ny); await p.waitForTimeout(300);
check(!(await padShown()), "键盘收着时用鼠标点音符 = 不弹");
await p.mouse.click(spot.ex, spot.ey); await p.waitForTimeout(300);
check(!(await padShown()), "点谱上空白 = 不弹");
await togglePad(); check(await padShown(), "底下的「键盘」钮 = 弹出");
await p.mouse.click(spot.nx, spot.ny); await p.waitForTimeout(300); await p.mouse.click(spot.ex, spot.ey); await p.waitForTimeout(300);
check(await padShown(), "开着时点音符、点空白 = 不收");
if (spot.bx >= 0) { await p.mouse.click(spot.bx, spot.by); await p.waitForTimeout(300); check(await padShown(), "点顶栏空白处 = 不收（以前会收）"); } else check(false, "顶栏找不到空白处");
// 红条：浏览器的 ResizeObserver 提示不弹（v0.16.56，user 11-09「开的时候经常出这个error可以看一下」）；别的脚本错误照弹
const bannerText = () => p.evaluate(() => { const e = document.getElementById("errBanner"); return e && !e.hidden ? e.textContent : null; });
await p.evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop completed with undelivered notifications." }))); await p.waitForTimeout(100);
check((await bannerText()) === null, "ResizeObserver 的提示 = 不弹红条");
await p.evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "e2e-boom" }))); await p.waitForTimeout(100);
check(/e2e-boom/.test((await bannerText()) ?? ""), "别的脚本错误照样弹红条", String(await bannerText()));
await p.evaluate(() => { const e = document.getElementById("errBanner"); if (e) e.hidden = true; });
// 放完光标、排版还在路上时就用滚轮滚开：排版回来那一刻不许把人拽回光标那儿（人滚开了不拽回去；施工单第五节 2026-11-12）。
//   单开一页、谱长 400 小节：光标从尾巴后面挪进谱里 = 整张重排几百毫秒，滚轮一定落在排版回来之前（80 小节只有一百来毫秒，旧代码上 3 次只红 1 次）
{
  const q = await (await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true })).newPage(); q.on("pageerror", (e) => errs.push(e.message));
  await q.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await q.waitForTimeout(700);
  const BIG = XML.replace(/<part id="P1">[\s\S]*<\/part>/, `<part id="P1">${Array.from({ length: 400 }, (_, k) => `<measure number="${k + 1}">${k ? "" : A}${N("C")}${N("D")}${N("E")}${N("F")}</measure>`).join("")}</part>`);
  await q.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, BIG); await q.waitForTimeout(500);
  const qf = (n = 2) => q.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : r()); f(); }), n);
  const qland = async () => { await qf(2); await q.evaluate(() => { window.__moonsinger.layout(); }); await qf(2); };
  const qtop = () => q.evaluate(() => Math.round(document.getElementById("score").scrollTop));
  const qstill = async () => { let a = await qtop(); for (let i = 0; i < 60; i++) { await qf(3); const c = await qtop(); if (c === a) return c; a = c; } return a; };
  const qset = (c) => q.evaluate((c) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: c === "end" ? s.song.papers[0].tracks[s.at.part].length : c, sel: null }); }, c);
  await qset("end"); await qland(); await qstill();   // 光标先在尾巴后面（排版开着「最后一行五线画到右边」），落定在谱尾
  const mid = await q.$eval("#score", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 }; });
  await qset(5); await qf(2); await q.mouse.move(mid.x, mid.y); await q.mouse.wheel(0, -3000); await qland();   // 放到开头（要往上跟一大截），排版还在路上就往上滚一点点
  const y = await qstill(), seen = await q.evaluate(() => { const sc = document.getElementById("score").getBoundingClientRect(), c = document.querySelector("#score .caret")?.getBoundingClientRect(); return !!c && c.bottom > sc.top && c.top < sc.bottom; });
  check(!seen && y > 5000, "放完光标、视图还没跟过去时滚轮滚开 = 不被拽回（以前排版一回来就拽到光标那儿）", String(y));
  await q.context().close();
}
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`pad-toggle: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
