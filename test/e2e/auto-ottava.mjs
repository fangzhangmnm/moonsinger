// test/e2e/auto-ottava.mjs —— 真浏览器 E2E：自动八度线（v0.9.37；user 2026-10-10「自动加」）。一串很高 / 很低的音自动画 8va / 15ma / 8vb，不存进谱；
//   点它 = 小菜单（固定成手写的 / 这位不要自动）；谱号小菜单里开关；谱号仍然自动（临时冒出去几个音不换谱号）。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/auto-ottava.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1000, height: 800 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), TPQ = 1680, head = s.song.papers[0].tracks[s.at.part].slice(0, 3);
  let id = 9100; const P = (x) => ({ step: x[0], alter: 0, octave: Number(x[1]) }); const n = (x, d = TPQ / 2) => ({ kind: "note", id: id++, pitch: P(x), dur: d, lyric: null });
  const mel = ["E5", "G5", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "A6", "C7", "E7", "D7", "C7", "A6", "G5", "E5", "C5", "D5", "E5", "D5", "C5", "D5"].map((x) => n(x));
  const toks = [...head, ...mel, n("C5", TPQ * 2), n("C3"), n("B2"), n("A2"), n("C4"), n("C5", TPQ * 2)];
  m.set({ ...s, song: { ...s.song, papers: s.song.papers.map((pp, i) => (i === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp)) }, caret: 3, nextId: id });
});
await p.waitForTimeout(400);
const autos = () => p.$$eval("#score svg .ottava.auto", (es) => es.length);
const manualToks = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "ottava").map((t) => t.shift).join(","); });
check((await autos()) === 2, "自动画了两段（15ma 上 / 8vb 下）", String(await autos()));
check((await manualToks()) === "", "谱里没有八度线记号（自动的不存）");
check(await p.$$eval("#score svg .clef", (es) => es.some((e) => e.textContent === "\u{E050}")), "谱号还是普通高音（冒出去几个音不换谱号）");
const hitAt = (kind) => p.evaluate((kind) => { const L = window.__moonsinger.layout(), h = L.clefs.find((c) => c.kind === kind[0] && (kind[1] ? c.index === -1 : true)), sc = document.querySelector("#score .sheet").getBoundingClientRect(); return h ? { x: sc.left + L.pageX.left + h.x + h.w / 2, y: sc.top + h.y + h.h / 2 } : null; }, kind);
const a = await hitAt(["ottava", true]);
check(!!a, "自动的八度线能点");
await p.mouse.click(a.x, a.y); await p.waitForTimeout(200);
check(!!(await p.$('.ctx-menu [data-v="pin"]')) && !!(await p.$('.ctx-menu [data-v="off"]')), "小菜单：固定成手写的 / 这位不要自动");
await p.click('.ctx-menu [data-v="pin"]'); await p.waitForTimeout(250);
check((await manualToks()) === "2,0", "固定成手写的 = 插了 15ma + 结束", await manualToks());
check((await autos()) === 1, "那一段变成手写的了（剩下 8vb 那段还是自动）", String(await autos()));
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await manualToks()) === "" && (await autos()) === 2, "撤销 = 回到自动");
// 谱号小菜单：自动八度线 关
const c = await hitAt(["start", false]);
await p.mouse.click(c.x, c.y); await p.waitForTimeout(200);
check(!!(await p.$('.ctx-menu [data-v="ao:on"].is-on')), "谱号小菜单里有「自动八度线」，默认开");
await p.click('.ctx-menu [data-v="ao:off"]'); await p.waitForTimeout(250);
check((await autos()) === 0, "关了 = 不画自动的");
check((await p.evaluate(() => window.__moonsinger.state().song.parts[0].autoOttava)) === false, "记在声部上（存进 score.json）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nauto-ottava: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
