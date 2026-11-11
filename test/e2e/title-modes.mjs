// test/e2e/title-modes.mjs —— 真浏览器 E2E：「词」「听」模式里歌名 / 编排那一行也能改（v0.16.14）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「以及歌词和听模式，歌曲名和arrangment应该也可以编辑」）。
// 守（触屏）：「听」里点歌名 / 编排 = 开框（谱别的地方照旧锁着：点音不放光标）；「词」里歌词框开着时点歌名 = 一下就开（不用先点一下收框）；「听」里歌名框打得进空格。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/title-modes.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, hasTouch: true })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, papers: [...s.song.papers, { ...s.song.papers[0], id: "s2", name: "B" }] } }); m.setScope?.("all"); });   // 两张纸 + 全部视图 = 编排那一行才画
await p.waitForTimeout(300);
const box = (k) => p.evaluate((k) => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), b = L[k]; return b ? { x: sc.left + L.pageX.left + b.x + b.w / 2, y: sc.top + b.y + b.h / 2 } : null; }, k);
const focused = () => p.evaluate(() => { const a = document.activeElement; return a && a.tagName === "INPUT" ? a.className : null; });
const done = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(150); await p.evaluate(() => document.activeElement?.blur?.()); await p.waitForTimeout(100); };
// ①「听」
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(200);
const caret0 = await p.evaluate(() => window.__moonsinger.state().caret);
let bx = await box("title"); await p.touchscreen.tap(bx.x, bx.y); await p.waitForTimeout(250);
check((await focused()) === "title-input", "听：点歌名 = 歌名框", String(await focused()));
await p.keyboard.type("a b"); await p.waitForTimeout(100);
check((await p.evaluate(() => document.activeElement?.value ?? "")).endsWith("a b"), "听：歌名框打得进空格（不被拿去放）");
await done();
bx = await box("arrangement"); await p.touchscreen.tap(bx.x, bx.y); await p.waitForTimeout(250);
check((await focused()) === "title-input arr", "听：点编排那一行 = 编排框", String(await focused()));
await done();
const n0 = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), n = L.notes[0]; return { x: sc.left + L.pageX.left + n.x + n.w / 2, y: sc.top + n.y }; });
await p.touchscreen.tap(n0.x, n0.y); await p.waitForTimeout(250);
check((await p.evaluate(() => window.__moonsinger.state().caret)) === caret0, "听：点音照旧不放光标（谱别的地方还锁着）");
// ②「词」：歌词框开着时点歌名 = 一下就开
await p.evaluate(() => window.__moonsinger.setMode("lyrics")); await p.waitForTimeout(200);
const ly = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), n = L.notes[1]; return { x: sc.left + L.pageX.left + n.x + n.w / 2, y: sc.top + L.lyricYs[n.system] }; });
await p.touchscreen.tap(ly.x, ly.y); await p.waitForTimeout(250);
check(await p.evaluate(() => !!document.querySelector(".lyric-input") && document.activeElement?.classList.contains("lyric-input")), "词：点歌词位 = 歌词框开着");
bx = await box("title"); await p.touchscreen.tap(bx.x, bx.y); await p.waitForTimeout(300);
check((await focused()) === "title-input", "词：歌词框开着时点歌名 = 一下就开歌名框", String(await focused()));
await done();
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntitle-modes: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
