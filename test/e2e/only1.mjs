// test/e2e/only1.mjs —— 真浏览器 E2E：纸的设置「显示 · 只看一号轨」（v0.9.29；user 2026-10-10「然后视图加一个只看一号轨的功能」）。
//   = 全曲第一位歌手的「只看它」：别的歌手缩成细行；再点 = 都看；和歌手牌那个是同一个开关。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/only1.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const part = (id, o) => `<part id="${id}"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("C", o)}${N("D", o)}${N("E", o)}${N("F", o)}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>${part("P1", 5)}${part("P2", 4)}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
const shownParts = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((s) => s.part))].join(","));
check((await shownParts()) === "P1,P2", "两位歌手都画着", await shownParts());
const openSheet = async () => { const c = await p.evaluate(() => { const L = window.__moonsinger.layout(), b = L.paperChip, sc = document.querySelector("#score .sheet").getBoundingClientRect(); return b ? { x: sc.left + L.pageX.left + b.x + b.w / 2, y: sc.top + b.y + b.h / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForTimeout(200); };
await openSheet();
check(!!(await p.$('[data-v="only1"]')), "纸的设置里有「只看一号轨」");
await p.click('[data-v="only1"]'); await p.waitForTimeout(200);
check((await shownParts()) === "P1", "点了 = 只画一号轨（别的缩成细行）", await shownParts());
check(await p.$eval('[data-v="only1"]', (e) => e.classList.contains("is-on")), "开关亮着");
await p.click('[data-v="only1"]'); await p.waitForTimeout(200);
check((await shownParts()) === "P1,P2", "再点 = 都看", await shownParts());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nonly1: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
