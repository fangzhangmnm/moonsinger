// test/e2e/jianpu.mjs —— 真浏览器 E2E：简谱数字行（谱面分家第四刀 4-6；施工单 ai-docs/20261111-score-surface-construction-plan.md 第三节「4」）。
// created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
// 守：纸角的「页面设置」钮 = 「1 / ♪」图标；面板第一行 = 谱种；切到简谱 = 谱上是数字行、能撤销；按 C 调看在简谱下变灰写明为什么；
//   数字行上：轻点 = 光标（画在数字行的上下沿之间）、长按 = 选中（选区带）、竖着拖不改音高（user 11-11「简谱第一天能不能打字 能」、没有「纵向 = 音高」）、
//   「词」里点数字 = 开它的歌词框、「弹」时按住音键 = 一个淡数字的鬼音符（谱面 svg 一个字节都不变）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/jianpu.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o = 4) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list>` +
  `<part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${N("C") + N("D") + N("E") + N("F")}</measure>` +
  `<measure number="2">${N("G") + N("A") + N("B") + N("C", 5)}</measure></part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
for (const x of await p.$$(".notice-stack .toast button.dismiss")) await x.click();   // 外来谱的提示条（没人上场）先关掉，免得盖住要点的地方
await p.waitForTimeout(100);
const S = () => p.evaluate(() => window.__moonsinger.state());
const kinds = () => p.evaluate(() => window.__moonsinger.layout().systems.map((r) => r.kind).join(","));
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForSelector(".settings-card"); };
/** 第 k 个音的数字在屏幕上的中心（点击框 = 数字那一格）。 */
const digitAt = (k) => p.evaluate((k) => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), n = L.notes[k]; return { x: sh.left + L.pageX.left + n.x + n.w / 2, y: sh.top + n.y, index: n.index, d: n.d, row: n.system }; }, k);

// ① 纸角的钮 = 「1 / ♪」；面板第一行 = 谱种
check((await p.evaluate(() => document.querySelector("#score .score-overlay .ov-paper-chip use")?.getAttribute("href"))) === "#jianpu-staff", "纸角的「页面设置」钮 = 「1 / ♪」图标（jianpu-staff）");
await openSheet();
check((await p.$eval(".settings-card .part-sec", (e) => e.textContent)) === "谱种", "面板第一行 = 谱种");
check(await p.$eval('.settings-card [data-v="nota:staff"]', (e) => e.classList.contains("is-on")), "没写谱种 = 五线谱亮着");
check(!(await p.$eval('.settings-card [data-v="inc:on"]', (e) => e.disabled)), "五线谱时「按 C 调看」能点");
// ② 点「简谱」= 谱上是数字行；按 C 调看那两颗变灰、写明为什么
await p.click('.settings-card [data-v="nota:jianpu"]'); await p.waitForTimeout(300);
check((await S()).song.notation === "jianpu", "写进歌里（notation: jianpu）");
check((await kinds()).split(",").every((k) => k === "jianpu"), "谱上每一行都是数字行", await kinds());
check((await p.evaluate(() => [...document.querySelectorAll("#score text.jp-digit")].map((t) => t.textContent).join(""))) === "12345671", "数字 = 1234 5671（高八度的 1 带点）");
check(await p.$eval('.settings-card [data-v="inc:on"]', (e) => e.disabled) && await p.$eval('.settings-card [data-v="inc:off"]', (e) => e.disabled), "简谱时「按 C 调看」两颗都变灰");
check((await p.$$eval(".settings-card .offer-msg", (ms) => ms.map((m) => m.textContent).join("|"))).includes("首调"), "写明为什么（简谱本来就是首调）");
await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(200);
// ③ 能撤销 / 重做（这首歌怎么看进撤销）
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await S()).song.notation === undefined && (await kinds()).split(",").every((k) => k === "staff"), "撤销 = 回到五线谱");
await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(250);
check((await S()).song.notation === "jianpu", "重做 = 又是简谱");
// ④ 轻点数字 = 光标到它后面；光标画在数字行的上下沿之间
let d = await digitAt(1);
await p.mouse.click(d.x, d.y); await p.waitForTimeout(200);
check((await S()).caret === d.index + 1, "轻点第 2 个数字 = 光标到它后面", String((await S()).caret));
const caretOk = await p.evaluate((row) => { const L = window.__moonsinger.layout(), r = L.systems[row], ln = document.querySelector("#score .ink-caret line.caret"); if (!ln) return false; const y1 = +ln.getAttribute("y1"), y2 = +ln.getAttribute("y2"); return y1 < r.staffTop + L.sp * 1.2 && y2 > r.staffTop + L.sp * 3.5 && y2 - y1 < L.sp * 5; }, d.row);
check(caretOk, "光标 = 数字行上下沿之间的一根竖线");
// ⑤ 鼠标长按数字 = 选中（选区带）；接着竖着拖 = 不改音高（数字行没有「纵向 = 音高」）
const pitch0 = JSON.stringify((await S()).song.papers[0].tracks[(await S()).at.part][d.index].pitch);
d = await digitAt(2);
await p.mouse.move(d.x, d.y); await p.mouse.down(); await p.waitForTimeout(550); await p.mouse.up(); await p.waitForTimeout(200);
const s5 = await S();
check(!!s5.sel && s5.sel.from === d.index, "长按数字 = 选中这个音", JSON.stringify(s5.sel));
check(await p.evaluate(() => document.querySelectorAll("#score .selbox").length > 0), "画了选区带");
d = await digitAt(1);
const pitchB = JSON.stringify((await S()).song.papers[0].tracks[(await S()).at.part][d.index].pitch);
await p.mouse.move(d.x, d.y); await p.mouse.down(); await p.waitForTimeout(550);
await p.mouse.move(d.x, d.y - 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(200);
const pitchA = JSON.stringify((await S()).song.papers[0].tracks[(await S()).at.part][d.index].pitch);
check(pitchA === pitchB && pitchB === pitch0, "长按后竖着拖 = 音高不变", `${pitchB} → ${pitchA}`);
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
// ⑥ 「弹」时按住音键 = 一个淡数字的鬼音符；谱面 svg 一个字节都不变
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, sel: null, caret: s.song.papers[0].tracks[s.at.part].length }); });
await p.waitForTimeout(150);
await p.keyboard.press("Backquote"); await p.waitForTimeout(200);   // 「弹」
const svg0 = await p.evaluate(() => document.querySelector("#score svg.staff-svg").outerHTML);
await p.keyboard.down("Digit5"); await p.waitForTimeout(200);
const g = await p.evaluate(() => ({ t: [...document.querySelectorAll(".ghost-preview text")].map((x) => x.textContent).join(""), svg: document.querySelector("#score svg.staff-svg").outerHTML }));
check(/5/.test(g.t), "弹 + 按住 5 = 鬼音符是一个数字「5」", g.t);
check(g.svg === svg0, "谱面 svg 一个字节都没变");
await p.keyboard.up("Digit5"); await p.waitForTimeout(150);
await p.keyboard.press("Backquote"); await p.waitForTimeout(150);
// ⑦ 「词」里点数字 = 开它的歌词框
await p.click('.mode-seg [data-mode="lyrics"]'); await p.waitForTimeout(200);
d = await digitAt(0);
await p.mouse.click(d.x, d.y); await p.waitForTimeout(250);
check(!(await p.$eval(".lyric-input", (e) => e.hidden)), "「词」里点数字 = 开它的歌词框");
await p.keyboard.type("la"); await p.keyboard.press("Enter"); await p.waitForTimeout(250);
check((await S()).song.papers[0].tracks[(await S()).at.part][d.index].lyric === "la", "写进了这个音的歌词");
check(await p.evaluate(() => [...document.querySelectorAll("#score text.lyric")].some((t) => t.textContent === "la")), "歌词画在数字行下面");
await p.keyboard.press("Escape"); await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(150);

check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
