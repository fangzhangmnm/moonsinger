// test/e2e/finger.mjs —— 真浏览器 E2E：手指（CDP 触摸事件）长按音 = 选中，按偏一点 / 按在符干上 / 按在下面一点也算（碰撞箱按指尖大小，不贴着符头）。
// created 2026-10-08 by Claude Opus 5.5（user「手指，有时候能选中有时候选不中，是不是你碰撞箱literally贴着音符的图像画了？」——是：符头在 iPad 上 11 px 宽，原来只有正中按得中）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finger.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });   // iPad mini 竖屏
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  const hold = async (x, y) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await p.waitForTimeout(650); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(200); };
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
  for (let i = 0; i < 6; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 4}`); await p.waitForTimeout(50); }
  // 符头中心 = 字形的原点（SMuFL 符头的基线在符头正中）；文字的包围盒带着字体的上下留白，不能拿它的中心
  const heads = await p.$$eval("#score text.note", (ts) => ts.map((t) => { const pt = t.ownerSVGElement.createSVGPoint(), r = t.getBoundingClientRect(); pt.x = +t.getAttribute("x"); pt.y = +t.getAttribute("y"); const s = pt.matrixTransform(t.getScreenCTM()); return { x: r.x + r.width / 2, y: s.y, w: r.width }; }));
  check(heads.length >= 3, "写了几个音", String(heads.length));
  const sel = () => p.evaluate(() => JSON.stringify(window.__moonsinger.state().sel));
  const clear = async () => { await p.touchscreen.tap(744 - 30, heads[0].y + 250); await p.waitForTimeout(150); };   // 远处空白轻点 = 放光标、清选区
  const n = heads[2];
  const cases = [["正中", 0, 0, true], ["右边偏 10 px", 10, 0, true], ["左边偏 10 px", -10, 0, true], ["往上 14 px（符干那边）", 0, -14, true], ["往下 12 px", 0, 12, true], ["斜着偏 9/9 px", 9, 9, true], ["空白（往右下 60 px）", 60, 60, false]];
  for (const [label, dx, dy, want] of cases) {
    await clear();
    if ((await sel()) !== "null") { check(false, `${label}之前选区没清掉`); continue; }
    await hold(n.x + dx, n.y + dy);
    const s = await sel();
    check((s !== "null") === want, `手指长按${label} = ${want ? "选中" : "不选"}（符头 ${n.w.toFixed(0)} px 宽）`, s);
  }
  check(errs.length === 0, "没有页面错误", errs.join(" | "));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
