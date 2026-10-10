// test/e2e/pad-ghost.mjs —— 真浏览器 E2E（v0.10.6）：① 短的声部后面补齐的淡色休止 + 点那个小节写到那里（user「点小节写这里好」「新轨在显示的时候自动补齐小节号。然后自动补的休止也是自动的淡色」）
//   ② 「弹」的鬼音符：盖在谱上、排版一个像素都不动（user「弹模式下面能不能在谱子上面光标对应的那个地方显示鬼音符？」「如果是叠的话会在前面一个音上面加东西，但是不能动排版！！！」「鬼音符的时候千万不能动排版！」）。
// created 2026-10-10 by Claude Opus 5.5。跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pad-ghost.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const meas = (k, body, first) => `<measure number="${k}">${first ? '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ""}${body}</measure>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>` +
  `<part id="P1">${[1, 2, 3].map((k) => meas(k, N("C") + N("D") + N("E") + N("F"), k === 1)).join("")}</part><part id="P2">${meas(1, N("G"), true)}</part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
const p2 = () => p.evaluate(() => { const s = window.__moonsinger.state(), pid = s.song.parts[1].id; return s.song.papers[0].tracks[pid].filter((t) => t.kind === "note" || t.kind === "rest").map((t) => t.kind === "rest" ? `r${t.dur}` : `${t.pitch.step}${t.dur}`).join(" "); });
check(await p.evaluate(() => document.querySelectorAll("#score .rest.pad-rest").length) === 0 && await p.evaluate(() => window.__moonsinger.layout().slots.some((x) => x.lead)), "B 后面空着的小节：不画休止（v0.10.19，user「remove the ghost mute idea」），点那儿的落点还在");
const before = await p2();
// 点 B 的第 3 小节开头（落点 lead = 离尾巴 7 拍）
const pt = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), s = L.slots.filter((x) => x.lead).sort((a, c) => c.lead - a.lead)[0], svg = document.querySelector("#score svg").getBoundingClientRect(); return { x: svg.left + L.pageX.left + s.x + 4, y: svg.top + L.yOf(s.system, 34), lead: s.lead }; });
await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200);
const st1 = await p.evaluate(() => { const s = window.__moonsinger.state(); return { lead: s.lead ?? 0, part: s.at.part === s.song.parts[1].id }; });
check(st1.part && Math.abs(st1.lead - pt.lead) < 1 && (await p2()) === before, "点空着的小节 = 光标到 B、带着 lead；谱一点没变", JSON.stringify(st1));
await p.keyboard.press("5"); await p.waitForTimeout(200);
const after = await p2();
check(after.startsWith("G1680 r5040 r6720 G"), "按 5 = 先补满第 1 小节、补一整个第 2 小节，G 写在第 3 小节开头", after);
// 鬼音符：弹 + 按住 3；谱面 svg 一个字节都不变
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, part: s.song.parts[0].id }, sel: null, caret: s.song.papers[0].tracks[s.song.parts[0].id].length }); });
await p.waitForTimeout(150);
await p.keyboard.press("Backquote"); await p.waitForTimeout(200);   // 「弹」
const svg0 = await p.evaluate(() => document.querySelector("#score svg.staff-svg").outerHTML);
await p.keyboard.down("Digit3"); await p.waitForTimeout(200);
const g1 = await p.evaluate(() => ({ n: document.querySelectorAll(".ghost-preview text").length, svg: document.querySelector("#score svg.staff-svg").outerHTML }));
check(g1.n >= 1, "弹 + 按住 3 = 谱上出现鬼音符", String(g1.n));
check(g1.svg === svg0, "谱面 svg 一个字节都没变（鬼音符盖在上面，不动排版）");
await p.keyboard.up("Digit3"); await p.waitForTimeout(150);
check(await p.evaluate(() => document.querySelectorAll(".ghost-preview text").length) === 0, "松开 = 鬼音符没了");
// 叠（只选了一个音）：鬼音符画在那个音上
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part], i = t.findIndex((x) => x.kind === "note"); m.set({ ...s, sel: { from: i, to: i + 1 }, caret: i + 1 }); });
await p.waitForTimeout(150);
await p.keyboard.down("Digit5"); await p.waitForTimeout(200);
const g2 = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), s = m.state(), h = L.notes.find((n) => n.index === s.sel.from), t = document.querySelector(".ghost-preview text"); return { gx: t ? Number(t.getAttribute("x")) : null, nx: h?.x ?? null }; });
check(g2.gx !== null && Math.abs(g2.gx - g2.nx) < 1, "只选了一个音 = 鬼音符画在那个音上", JSON.stringify(g2));
await p.keyboard.up("Digit5");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npad-ghost: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
