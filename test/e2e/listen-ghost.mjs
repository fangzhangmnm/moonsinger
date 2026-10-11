// test/e2e/listen-ghost.mjs —— 真浏览器 E2E：听模式右键「从这儿放」点在后面补齐的空小节里 = 起点在那个小节头（v0.10.32）。
// created 2026-10-10 by Claude Opus 5.5（user「在空的sheet（比如ghost 休止符）上右键从这里放小节号错了，系统的整理一下，其实逻辑应该很简单」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/listen-ghost.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const M = (n, attrs = "") => `<measure number="${n}">${attrs}${N("C")}${N("D")}${N("E")}${N("F")}</measure>`;
const A = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>` +
  `<part id="P1">${M(1, A)}${M(2)}${M(3)}${M(4)}</part><part id="P2">${M(1, A)}</part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("listen"); }, XML);
await p.waitForTimeout(400);
// P2 那一行、第三小节中间（P1 那一行第三小节的音的 x）
const pt = await p.evaluate(() => {
  const m = window.__moonsinger, L = m.layout(), st = m.state(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), z = sh.width / L.width;
  const r1 = L.systems.findIndex((r) => r.part === st.song.parts[0].id), r2 = L.systems.findIndex((r) => r.part === st.song.parts[1].id);
  const xs = L.notes.filter((h) => h.system === r1).map((h) => h.x).sort((a, b) => a - b), x = xs[9];   // 第三小节第二个音
  return { x: sh.left + (L.pageX.left + x) * z, y: sh.top + (L.systems[r2].staffTop + 2 * L.sp) * z };
});
await p.mouse.click(pt.x, pt.y, { button: "right" }); await p.waitForTimeout(250);
await p.click('.ctx-menu [data-v="here"]'); await p.waitForTimeout(400);
const sm = await p.evaluate(() => window.__moonsinger.transport().startMark);
check(!!sm && sm.tick === 2 * 4 * 1680, "补齐的空小节里右键「从这儿放」= 第三小节头", JSON.stringify(sm));
await p.evaluate(() => window.__moonsinger.engine.playing && window.__moonsinger.engine.stop?.());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nlisten-ghost: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
