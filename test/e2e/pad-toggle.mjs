// test/e2e/pad-toggle.mjs —— 真浏览器 E2E（iPad mini 竖屏 744 × 1133）：开合键盘不把谱拽回光标那儿；点亮着的模式 = 弹出它的键盘 / 混音台（v0.10.42）。
// created 2026-10-11 by Claude Opus 5.5（user「toggle软键盘之后谱子还是会跳到奇怪的地方」「idiempotent点听，音也应该跳出相应的软键盘」）
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
const togglePad = async () => { if (await padShown()) { const bs = await p.$$("#padPanel button"); for (const x of bs) if ((await x.textContent()).trim() === "收起") { await x.click(); break; } } else await p.click("#padTab"); await p.waitForTimeout(300); };
// 光标放在开头附近，然后滚开很远
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: 5, sel: null }); }); await p.waitForTimeout(200);
await p.evaluate(() => { document.getElementById("score").scrollTop = 3000; }); await p.waitForTimeout(200);
const t0 = await top(); check(!(await caretSeen()), "滚开了：光标那行不在视野里", String(t0));
await togglePad(); const t1 = await top(); await togglePad(); const t2 = await top();
check(Math.abs(t1 - t0) <= 2 && Math.abs(t2 - t0) <= 2, "开合键盘两次：谱不跳回光标那儿（以前一开合就拽回去）", `${t0} → ${t1} → ${t2}`);
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
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`pad-toggle: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
