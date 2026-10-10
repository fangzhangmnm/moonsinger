// test/e2e/reading.mjs —— 真浏览器 E2E：歌词框下面显示月读念成什么（v0.9.34；user 10-10「小件做」——全假名时助词 は 会被注成 ha，看得见才改得了）。
//   这里把 singer.read 换成假的，只核接线：框开了 → 问这一句的读音 → 框下面一条、这个字加粗；引擎没起来 = 不出；不是月读 = 不出。真引擎另核（tmp probe）。
//   created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/reading.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 800 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), TPQ = 1680, head = s.song.papers[0].tracks[s.at.part].slice(0, 3);
  let id = 9300; const n = (lyric) => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ, lyric });
  const toks = [...head, ...[..."だんごはめを"].map(n)];
  const papers = s.song.papers.map((pp, i) => (i === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp));
  m.set({ ...s, song: { ...s.song, papers }, caret: toks.length, nextId: id });
  window.__readAsked = [];
  window.__readMode = "ready";
  m.singer.read = async (sc) => { window.__readAsked.push(sc.TEXT); return window.__readMode === "ready" ? { ready: true, labels: sc.SCORE.map((e) => ({ だ: "da", ん: "N_ng", ご: "go", は: "ha", め: "me", を: "o" })[e.kana] ?? "?"), said: [] } : { ready: false, labels: null, said: [] }; };
});
await p.waitForTimeout(300);
await p.evaluate(() => window.__moonsinger.setMode("lyrics"));
const openAt = async (ch) => { const c = await p.$$eval("#score text.lyric", (es, ch) => { const e = es.find((x) => x.textContent === ch); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, ch); await p.mouse.click(c.x, c.y); await p.waitForTimeout(300); };
const reading = () => p.$eval(".lyric-reading", (e) => (e.hidden ? null : { text: e.textContent, bold: e.querySelector("b")?.textContent ?? "" })).catch(() => null);
await openAt("は");
const r1 = await reading();
check(!!r1, "开了「は」的歌词框 = 框下面一条读音", JSON.stringify(r1));
check(r1 && r1.text.includes("月读念成") && r1.text.includes("da n go ha me o"), "这一句的读音（ん 写成 n）", r1?.text);
check(r1?.bold === "ha", "这个字加粗", r1?.bold);
check((await p.evaluate(() => window.__readAsked.length)) >= 1, "问了 worker 一次这一句");
const asked = await p.evaluate(() => window.__readAsked.length);
await p.keyboard.press("Tab"); await p.waitForTimeout(250);
const r2 = await reading();
check(r2?.bold === "me", "Tab 到下一个字 = 加粗跟着走", r2?.bold);
check((await p.evaluate(() => window.__readAsked.length)) === asked, "同一句不重复问（按唱谱内容缓存）");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(!(await reading()), "收了框 = 读音也收");
// 引擎没起来 = 不出（不为看读音起引擎）
await p.evaluate(() => { window.__readMode = "notReady"; const m = window.__moonsinger, s = m.state(), toks = s.song.papers[0].tracks[s.at.part].slice(); const i = toks.findIndex((t) => t.kind === "note" && t.lyric === "を"); toks[i] = { ...toks[i], lyric: "に" }; m.set({ ...s, song: { ...s.song, papers: s.song.papers.map((pp, k) => (k === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp)) } }); });
await p.waitForTimeout(200);
await openAt("に");
check(!(await reading()), "引擎还没起来（ready false）= 不出读音条");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nreading: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
