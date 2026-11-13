// test/e2e/overlay-touch.mjs —— 真浏览器 E2E（iPad 竖屏、手指）：谱面上面那一层（覆盖层）的钮不吃手势——
//   手指按在纸角的小钮、虚线框上再拖 = 照样滚谱（钮不触发）；一根手指在钮上、另一根在谱上 = 照样捏合缩放；没动就松手 = 点（手指抖一点也算）。
//   2026-11-12（施工单第 12 条 12-2）：名字上面的眼睛 / 喇叭搬进小卡了，这里改用纸角的小钮当样本（同一层、同一套手势判法）；开关本身的点 / 长按在 part-toggles.mjs。
//   另守一条：曲段 / 声部的编号（文件里读进来的）带引号也拼不出多余的属性。
// created 2026-11-08 by Claude Fable 5.1（审刀 1 时查出：v0.16.25 覆盖层的钮 pointerdown 就拦下、谱面收不到 → 手指落在钮上滚不动、捏不了；
//   刀 1 之前这些钮画在谱里，按住拖 = 滚动。施工单 N3「手感不变」，原有 E2E 没有一条量这个）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/overlay-touch.mjs（MS_E2E_BASE 可改地址；改之前的构建也能跑：坐标按那一版的点击框找）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`, S = "CDEFGAB";
let ms = ""; for (let k = 0; k < 60; k++) { let body = k ? "" : `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`; for (let j = 0; j < 4; j++) body += N(S[(k + j) % 7], 4); ms += `<measure number="${k + 1}">${body}</measure>`; }
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1">${ms}</part></score-partwise>`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const cdp = await ctx.newCDPSession(p);
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(400);
const top = (v) => v === undefined ? p.$eval("#score", (e) => e.scrollTop) : p.$eval("#score", (e, v) => { e.scrollTop = v; }, v);
const zoom = () => p.$eval("#score .sheet", (e) => Number(e.style.zoom || 1));
const hidden = () => p.evaluate(() => window.__moonsinger.partViews().find((v) => v.id === "P1")?.hidden ?? null).catch(() => null);
const shown = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((r) => r.part))].join(","));
// 钮在屏幕上的中心：覆盖层的 DOM；改之前的构建 = 排版器吐的点击框
const at = (sel, old) => p.evaluate(([sel, old]) => {
  const el = document.querySelector(`#score .score-overlay ${sel}`);
  if (el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  const L = window.__moonsinger.layout(), bx = old === "tg" ? L.partToggles?.[0] : L.paperAdds?.at(-1); if (!bx) return null;
  const sc = document.querySelector("#score .sheet").getBoundingClientRect(), z = Number(document.querySelector("#score .sheet").style.zoom || 1);
  return { x: sc.left + (L.pageX.left + bx.x + bx.w / 2) * z, y: sc.top + (bx.y + bx.h / 2) * z };
}, [sel, old]);
const drag = async (from, dy, steps = 10) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y, id: 1 }] });
  for (let k = 1; k <= steps; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x, y: from.y + dy * k / steps, id: 1 }] }); await p.waitForTimeout(16); }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(350);
};

// ① 手指按在纸角的小钮上往上推 = 滚谱；钮不触发
await top(0); await p.waitForTimeout(150);
const opened = () => p.evaluate(() => document.querySelectorAll(".sheet-panel, .offer, .wbe-panel, .ctx-menu, .track-card, dialog[open], .modal").length);
const eye = await at(".ov-paper-chip", "none");
check(!!eye, "找得到纸角的小钮");
const s0 = await shown(), t0 = await top(), o0 = await opened();
await drag(eye, -400);
const t1 = await top();
check(t1 > t0 + 200, "手指按在纸角的小钮上拖 = 滚谱", `${t0} → ${t1}`);
check((await opened()) === o0 && (await shown()) === s0, "拖过的那一下钮不触发（没开纸的设置）");

// ② 滚到底：手指按在虚线框上往下拉 = 滚谱；不开「＋」的菜单
await p.$eval("#score", (e) => { e.scrollTop = e.scrollHeight; }); await p.waitForTimeout(250);
const add = await at(".ov-add", "add");
const inView = add && add.y > 60 && add.y < 1100;
if (!inView && add) { await p.$eval("#score", (e, dy) => { e.scrollTop += dy; }, add.y - 500); await p.waitForTimeout(250); }
const add2 = await at(".ov-add", "add");
check(!!add2 && add2.y > 60 && add2.y < 1100, "虚线框在屏幕里", JSON.stringify(add2));
const t2 = await top();
await drag(add2, 400);
const t3 = await top();
check(t3 < t2 - 200, "手指按在虚线框上拖 = 滚谱", `${t2} → ${t3}`);
check(!(await p.$(".ctx-menu, .offer, .wbe-panel, .track-card, .parts-page")), "拖过的那一下虚线框不触发（没开菜单）");

// ③ 一根手指在眼睛钮上、另一根在谱上，张开 = 捏合缩放
await top(0); await p.waitForTimeout(200);
const eye2 = await at(".ov-paper-chip", "none"), z0 = await zoom();
const f2 = { x: eye2.x - 250, y: eye2.y + 150 };   // 纸角的小钮在右上角：第二根手指放在它左下，往左下张开
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...eye2, id: 1 }] }); await p.waitForTimeout(30);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...eye2, id: 1 }, { ...f2, id: 2 }] }); await p.waitForTimeout(30);
for (let k = 1; k <= 8; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...eye2, id: 1 }, { x: f2.x - k * 25, y: f2.y + k * 20, id: 2 }] }); await p.waitForTimeout(16); }
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(400);
const z1 = await zoom();
check(z1 > z0 * 1.3, "一根手指在钮上也能捏合缩放", `zoom ${z0} → ${z1}`);
check((await shown()) === s0 && (await opened()) === o0, "捏合的那一下钮不触发", await shown());
await p.evaluate(() => document.querySelector(".zoom-reset")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await p.waitForTimeout(250);

// ④ 手指抖一点（< 10 px）也算轻点：纸角的小钮照样开纸的设置
await top(0); await p.waitForTimeout(200);
{ const c = await at(".ov-paper-chip", "none"), before = await opened();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...c, id: 1 }] }); await p.waitForTimeout(30);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c.x + 4, y: c.y + 5, id: 1 }] }); await p.waitForTimeout(30);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(350);
  check((await opened()) > before, "手指抖一点也算轻点（纸的设置开了）");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250); }

// ⑤ 手指轻点别的钮 = 照样开（点完菜单还在，不被这同一下的抬手收掉）
const sheetBefore = await p.evaluate(() => document.querySelectorAll(".sheet-panel, .offer, .wbe-panel, .ctx-menu, .track-card, dialog[open], .modal").length);
const chip = await at(".ov-paper-chip", "none");
if (chip) {
  await p.touchscreen.tap(chip.x, chip.y); await p.waitForTimeout(400);
  const opened = await p.evaluate(() => document.querySelectorAll(".sheet-panel, .offer, .wbe-panel, .ctx-menu, .track-card, dialog[open], .modal").length);
  check(opened > sheetBefore, "手指轻点纸角的小钮 = 纸的设置开着", `${sheetBefore} → ${opened}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
}

// ⑥ 曲段 / 声部的编号是文件里读进来的：带引号 / 尖括号也拼不出多余的属性（覆盖层拼 HTML 的地方都转义）
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), evil = 'x" data-evil="1"><i data-evil2="1', p0 = s.song.papers[0];
  const papers = [p0, { ...p0, id: evil, name: "B" }];
  m.set({ ...s, song: { ...s.song, papers } });
});
await p.waitForTimeout(400);
const evil = await p.evaluate(() => ({ navs: document.querySelectorAll("#score .score-overlay .ov-nav").length, bad: document.querySelectorAll("[data-evil], [data-evil2]").length }));
check(evil.navs >= 1, "两张纸 = 有曲段控件组", JSON.stringify(evil));
check(evil.bad === 0, "编号里带引号 / 尖括号 = 拼不出多余的属性", JSON.stringify(evil));
// ⑦ 印出来的样子（v0.16.74，带谱视频用）：覆盖层 / 光标藏起来，强调色不上（拿一个字临时挂上 hot 看它的颜色）；关掉还原
const look = async (on) => p.evaluate((on) => {
  window.__moonsinger.printLook(on);
  const vis = (sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).display !== "none");
  const t = document.querySelector(".staff-svg text"); t?.classList.add("hot"); const hot = t ? getComputedStyle(t).fill : null; t?.classList.remove("hot");
  return { overlay: vis("#score .score-overlay"), caret: vis(".staff-svg .caret"), hot };
}, on);
const on = await look(true), off = await look(false), INK = "rgb(42, 42, 42)";
check(!on.overlay && !on.caret && on.hot === INK, "印出来的样子：覆盖层、光标藏了，强调色不上（墨色）", JSON.stringify(on));
check(off.overlay && off.hot !== null && off.hot !== INK, "关掉 = 覆盖层回来、强调色照旧", JSON.stringify(off));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
