// test/e2e/zoom.mjs —— 真浏览器 E2E（iPad mini 竖屏、两指）：捏合 = 像 PDF 阅读器，能放得比屏幕宽、横着滚；手势中只改 transform（不改 CSS zoom、不重排），
//   松手落定一次，两指中点下面的那个纸面点还在原处。created 2026-10-10 by Claude Opus 5.5
//   （user「ipad可以放的很大，就和pdf浏览器一样，懂了吗。可以横着滚」+ 查案「iPad 捏合缩放卡」：原来每个 pointermove 改一次 CSS zoom、马上读布局 = 每帧两次整张谱重排）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/zoom.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`, S = "CDEFGAB";
let ms = ""; for (let k = 0; k < 24; k++) { let body = k ? "" : `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`; for (let j = 0; j < 4; j++) body += N(S[(k + j) % 7], 4 + ((k + j) % 2)); ms += `<measure number="${k + 1}">${body}</measure>`; }
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1">${ms}</part></score-partwise>`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const cdp = await ctx.newCDPSession(p);
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(400); await p.evaluate(() => document.activeElement?.blur?.());
const state = () => p.evaluate(() => { const el = document.querySelector("#score"), sh = el.querySelector(".sheet"), r = sh.getBoundingClientRect(); return { zoom: Number(sh.style.zoom || 1), transform: sh.style.transform, sw: el.scrollWidth, cw: el.clientWidth, sl: el.scrollLeft, st: el.scrollTop, left: r.left, top: r.top }; });
// 两指中点下面的那个音（第 6 个符头）：放大前后它在屏幕上的位置
const pick = await p.$$eval("#score text.note", (ts) => ts.findIndex((t) => { const r = t.getBoundingClientRect(); return r.y > 250 && r.y < 800 && r.x > 150 && r.x < 600; }));   // 屏幕中间看得见的一个音
const noteAt = () => p.$$eval("#score text.note", (ts, i) => { const r = ts[i].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, pick);
const s0 = await state(), n0 = await noteAt();
check(pick >= 0, "挑到一个在屏幕中间的音", `#${pick} (${n0.x.toFixed(0)}, ${n0.y.toFixed(0)})`);
check(s0.zoom === 1, "起手原大");
const cx = Math.round(n0.x), cy = Math.round(n0.y);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx - 40, y: cy, id: 1 }, { x: cx + 40, y: cy, id: 2 }] });
for (let i = 1; i <= 20; i++) { const d = 40 + i * 6; await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }] }); }
await p.waitForTimeout(50);
const mid = await state();
check(mid.zoom === 1 && /scale\(/.test(mid.transform), "手势中：只改 transform，CSS zoom 不动（不重排）", `zoom ${mid.zoom} transform ${mid.transform}`);
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(250);
const s1 = await state(), n1 = await noteAt();
check(s1.zoom > 2.5 && !s1.transform, "松手：落成 CSS zoom（放大到 160/40 = 4 倍附近），transform 清掉", `zoom ${s1.zoom}`);
check(s1.zoom > 1 && s1.sw > s1.cw + 50, "放得比屏幕宽、能横着滚", `scrollWidth ${s1.sw} > ${s1.cw}`);
check(Math.abs(n1.x - cx) < 12 && Math.abs(n1.y - cy) < 12, "两指中点下面那个音还在原处", `(${n1.x.toFixed(0)}, ${n1.y.toFixed(0)}) vs (${cx}, ${cy})`);
// 再捏：最多 6 倍
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 300, y: 500, id: 1 }, { x: 340, y: 500, id: 2 }] });
for (let i = 1; i <= 20; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 300 - i * 12, y: 500, id: 1 }, { x: 340 + i * 12, y: 500, id: 2 }] });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(250);
const s2 = await state();
check(Math.abs(s2.zoom - 6) < 0.01, "最多放到 6 倍", `zoom ${s2.zoom}`);
// 横着滚（单指）
await p.evaluate(() => { document.querySelector("#score").scrollLeft = 0; }); await p.waitForTimeout(50);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 600, y: 600, id: 3 }] });
for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 600 - i * 30, y: 600, id: 3 }] });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(150);
check((await state()).sl > 100, "单指横着拖 = 横着滚", String((await state()).sl));
// 角上 1:1 回原大
await p.evaluate(() => document.querySelector(".zoom-reset").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await p.waitForTimeout(200);
check((await state()).zoom === 1, "1:1 = 回原大");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nzoom: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
