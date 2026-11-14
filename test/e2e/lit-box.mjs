// test/e2e/lit-box.mjs —— 真浏览器 E2E：亮框（选中规则单行这一版，ai-docs/20261113-selection-rules-design.md 第五节）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）
// 守：鼠标悬浮 = 临时亮框（移开就灭）；点和弦下面的符头点得中（亮框 + 光标）；演奏法（跳音）的框只包住墨迹、不盖住底下的符头（以前用 getBBox = 整个字体的上下伸）；
//     手指点音 = 亮框 + 把手；点演奏法 = 亮框 + 一句说明；点空白 = 灭。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/lit-box.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o, extra = "") => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type>${extra}</note>`;
const C = (s, o) => `<note><chord/><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const ST = `<notations><articulations><staccato/></articulations></notations>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("E", 5)}${C("C", 5)}${C("G", 4)}${N("D", 5, ST)}${N("C", 5)}${N("G", 4)}</measure></part></score-partwise>`;
const b = await chromium.launch();
async function mk(touch) {
  const ctx = await b.newContext({ ...(touch ? { viewport: { width: 744, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1000, height: 640 } }) });
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
  await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
  p.cdp = touch ? await ctx.newCDPSession(p) : null; return p;
}
const boxes = (p, sel) => p.$$eval(sel, (es) => es.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
const inside = (pt, r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
const S = (p) => p.evaluate(() => { const s = window.__moonsinger.state(); return { caret: s.caret, sel: s.sel }; });
// ── 鼠标 ──
{ const p = await mk(false);
  // 量符头：从 text.note 量（和别的 E2E 一样），按 x 排
  const hs = await p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  const byX = [...hs].sort((a, b) => a.x - b.x || a.y - b.y);
  // 1. 悬浮在 D5（带跳音）的符头上 = 亮的是这个音（跳音的框不盖住符头）
  const dHead = byX.filter((h) => h.x > byX[0].x + 5)[0];   // 和弦那一列之后第一个符头 = D5
  await p.mouse.move(dHead.x, dHead.y); await p.waitForTimeout(200);
  let hv = await boxes(p, "#score .lit-box.hover");
  check(hv.length === 1 && inside(dHead, hv[0]), "鼠标悬浮在带跳音的符头上 = 亮这个音的框（框包住符头）", JSON.stringify(hv));
  check(hv.length === 1 && hv[0].h < 60, "亮框不是又细又高（跳音没盖住它）", JSON.stringify(hv));
  await p.mouse.move(5, 5); await p.waitForTimeout(200);
  check((await boxes(p, "#score .lit-box.hover")).length === 0, "移开 = 悬浮框灭");
  // 2. 点和弦最下面那个符头 = 点中（亮框 + 光标到这个和弦后面）
  const col0 = byX.filter((h) => Math.abs(h.x - byX[0].x) < 4), low = col0.reduce((a, h) => (h.y > a.y ? h : a), col0[0]);
  await p.mouse.click(low.x, low.y); await p.mouse.move(5, 5); await p.waitForTimeout(200);
  const lit = await boxes(p, "#score .lit-box:not(.hover)"), st1 = await S(p);
  check(lit.length === 1 && inside(low, lit[0]), "点和弦最下面的符头 = 点中、亮框包住它", JSON.stringify(lit));
  check(!st1.sel && st1.caret > 0, "点音 = 光标到它后面、不选中", JSON.stringify(st1));
  // 3. 跳音的点击框只包住墨迹（高度不到一个间距的两倍）
  const art = await p.evaluate(() => { const e = document.querySelector("#score .art[data-tok]"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(art.x, art.y - 1); await p.waitForTimeout(200);
  hv = await boxes(p, "#score .lit-box.hover");
  const sp = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); return L.sp * sh.width / L.width; });
  check(hv.length === 1 && hv[0].h < sp * 2 && !inside(dHead, hv[0]), "悬浮在跳音上 = 只亮那个点（不到两个间距高、不包住符头）", `${JSON.stringify(hv)} sp=${sp.toFixed(1)}`);
  // 4. 点空白 = 灭
  await p.mouse.click(lit[0].x + 400, low.y); await p.mouse.move(5, 5); await p.waitForTimeout(200);
  check((await boxes(p, "#score .lit-box")).length === 0, "点空白 = 亮框灭");
  check(p.errs.length === 0, "鼠标：没有页面错误", p.errs.join(" | "));
  await p.close(); }
// ── 手指 ──
{ const p = await mk(true);
  const tap = async (x, y) => { await p.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] }); await p.waitForTimeout(40); await p.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(250); };
  const hs = await p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  const last = hs.reduce((a, h) => (h.x > a.x ? h : a), hs[0]);
  await tap(last.x, last.y);
  check((await boxes(p, "#score .lit-box")).length === 1, "手指点音 = 亮框");
  check(await p.$eval("#score .lit-grip", (e) => !e.hidden), "手指点音 = 框旁边有把手");
  const art = await p.evaluate(() => { const e = document.querySelector("#score .art[data-tok]"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await tap(art.x, art.y);
  const say = await p.$$eval("#noticeStack .notice, .notice-stack .notice", (es) => es.map((e) => e.textContent).join(" | "));
  check(/跳音/.test(say), "手指点跳音 = 一句说明", say.slice(0, 80));
  check(await p.$eval("#score .lit-grip", (e) => e.hidden), "演奏法没有把手（只能点）");
  check(p.errs.length === 0, "手指：没有页面错误", p.errs.join(" | "));
  await p.close(); }
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
