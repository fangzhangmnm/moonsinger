// test/e2e/mixer-height.mjs —— 真浏览器 E2E（iPad mini 竖屏 744 × 1133）：混音台高度 = 整排卡片（半屏放得下几排就几排，这里一排），不切在半中间；全屏 = 铺满、下面不露谱（v0.10.38）。
// created 2026-10-10 by Claude Opus 5.5（user「混音台的高度是怎么决定的，现在怎么不三不四的」→「好」；「混音台全屏有bug，下面谱子露出来了，可能高度没有适配」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/mixer-height.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const A = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const ids = ["P1", "P2", "P3", "P4"];
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list>${ids.map((i) => `<score-part id="${i}"><part-name>${i}</part-name></score-part>`).join("")}</part-list>${ids.map((i) => `<part id="${i}"><measure number="1">${A}${N("C")}${N("D")}${N("E")}${N("F")}</measure></part>`).join("")}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("listen"); }, XML);
await p.waitForTimeout(500);
const geo = () => p.evaluate(() => { const st = document.querySelector(".studio"), box = st.querySelector(".studio-strips"), cards = [...box.querySelectorAll(".strip")], c = cards[0].getBoundingClientRect(), b = box.getBoundingClientRect(), s = st.getBoundingClientRect();
  const visibleRows = new Set(cards.filter((x) => { const r = x.getBoundingClientRect(); return r.top < b.bottom - 2; }).map((x) => Math.round(x.getBoundingClientRect().top)));
  const cut = cards.some((x) => { const r = x.getBoundingClientRect(); return r.top < b.bottom - 2 && r.bottom > b.bottom + 2; });
  return { studioH: Math.round(s.height), stripsH: Math.round(b.height), cardH: Math.round(c.height), cards: cards.length, rows: visibleRows.size, cut, top: Math.round(s.top), vh: innerHeight }; });
const g1 = await geo();
check(g1.cards >= 5 && g1.rows === 1 && !g1.cut, "竖屏：正好一整排卡片、没有切在半中间", JSON.stringify(g1));
check(g1.studioH <= g1.vh * 0.5 + 2, "不超过半屏", JSON.stringify(g1));
await p.click('.studio [data-v="full"]'); await p.waitForTimeout(300);
const g2 = await p.evaluate(() => { const s = document.querySelector(".studio").getBoundingClientRect(), stage = document.getElementById("stage").getBoundingClientRect(); return { top: Math.round(s.top), bottom: Math.round(s.bottom), st: Math.round(stage.top), sb: Math.round(stage.bottom) }; });
check(Math.abs(g2.top - g2.st) <= 1 && Math.abs(g2.bottom - g2.sb) <= 1, "全屏 = 铺满舞台（下面不露谱）", JSON.stringify(g2));
await p.click('.studio [data-v="full"]'); await p.waitForTimeout(300);
const g3 = await geo();
check(g3.rows === 1 && !g3.cut, "再点 = 回到一整排", JSON.stringify(g3));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmixer-height: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
