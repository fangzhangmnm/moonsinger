// test/e2e/dock-side.mjs —— 真浏览器 E2E：底座（键盘 / 混音台）默认贴底——宽屏横屏也在下面；只有贴底后谱面只剩约一行能看（矮屏）才在**右边**一栏，小条挂在它左边、谱让出小条。
// created 2026-10-21 by Claude Fable 5.1（user「ui默认键盘在下面，就是很长很宽的屏幕，键盘，混音台，都在下面」；同日下午「实在做不到再贴右边。比如只能看到一行谱子」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dock-side.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const geo = (p) => p.evaluate(() => {
  const r = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
  const s = r("#score"), k = r(".pad-panel"), t = r(".dock-tab"), st = r("#stage"), cs = getComputedStyle(document.querySelector("#score"));
  return { stage: { w: st.width, h: st.height, r: st.right }, score: { l: s.left, r: s.right, t: s.top, b: s.bottom, ml: parseFloat(cs.marginLeft), mr: parseFloat(cs.marginRight) }, pad: k && { l: k.left, r: k.right, t: k.top, b: k.bottom, w: k.width, h: k.height }, tab: t && { l: t.left, r: t.right, t: t.top, b: t.bottom },
    areas: getComputedStyle(document.querySelector("#stage")).gridTemplateAreas, side: window.__moonsinger.dockSide() };
});
const open = async (viewport) => { const p = await (await b.newContext({ viewport })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700); return { p, errs }; };
try {
  // ① 宽屏横屏（1400 × 820）：贴底（贴底后谱面还剩 409 px ≈ 3 行）
  { const { p, errs } = await open({ width: 1400, height: 820 });
    const g = await geo(p);
    check(g.pad && g.pad.t >= g.score.b - 1 && Math.abs(g.pad.w - g.stage.w) <= 1 && g.side === null, "宽屏横屏：键盘在谱下面、整宽", JSON.stringify({ padTop: g.pad?.t, scoreBottom: g.score.b, padW: g.pad?.w, stageW: g.stage.w, side: g.side }));
    check(/"main" "pad"/.test(g.areas), "舞台 = 上下两行", g.areas);
    check(g.tab && Math.abs(g.tab.b - g.pad.t) <= 1 && g.tab.l >= g.pad.l && g.tab.l < g.pad.l + 40, "小条挂在键盘左上角、往上", JSON.stringify(g.tab));
    check(g.score.ml === 0 && g.score.mr === 0, "谱不让边", JSON.stringify({ ml: g.score.ml, mr: g.score.mr }));
    // 混音台（听）也在下面
    await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(400);
    const st = await p.evaluate(() => { const e = document.querySelector(".studio"); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(), s = document.querySelector("#score").getBoundingClientRect(); return { below: r.top >= s.bottom - 1, w: r.width, stageW: document.querySelector("#stage").getBoundingClientRect().width }; });
    check(st && st.below && Math.abs(st.w - st.stageW) <= 1, "「听」：混音台也在谱下面、整宽", JSON.stringify(st));
    check(errs.length === 0, "宽屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
  // ② 矮屏（1100 × 600：贴底后谱面只剩 189 px，不到两行）：右边一栏
  { const { p, errs } = await open({ width: 1100, height: 600 });
    const g = await geo(p);
    check(g.pad && g.pad.l >= g.score.r - 1 && Math.abs(g.pad.h - g.stage.h) <= 1 && g.side === "right", "贴底只剩约一行：键盘在谱**右边**一栏、整高", JSON.stringify({ padLeft: g.pad?.l, scoreRight: g.score.r, padH: g.pad?.h, stageH: g.stage.h, side: g.side }));
    check(/"main pad"/.test(g.areas), "舞台 = main | pad", g.areas);
    check(g.tab && Math.abs(g.tab.r - g.pad.l) <= 1 && g.tab.t >= g.pad.t && g.tab.t < g.pad.t + 40, "小条挂在键盘左边、竖着排、贴顶", JSON.stringify(g.tab));
    check(g.score.mr === 46 && g.score.ml === 0, "谱的右边让出小条那 46 px", JSON.stringify({ ml: g.score.ml, mr: g.score.mr }));
    // 底座空着（「词」= 用系统键盘）= 小条贴屏幕右上、判断不变
    await p.evaluate(() => window.__moonsinger.setMode("lyrics")); await p.waitForTimeout(300);
    const g2 = await geo(p);
    check(g2.pad === null || (await p.$eval(".pad-panel", (e) => e.hidden)), "「词」：底座空着");
    check(g2.side === "right" && g2.tab && Math.abs(g2.tab.r - g2.stage.r) <= 1 && g2.tab.t < g2.score.t + 40, "底座空着：小条贴屏幕右上、还是贴右边那一档", JSON.stringify({ side: g2.side, tab: g2.tab, stageR: g2.stage.r }));
    check(errs.length === 0, "矮屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
  // ③ 竖屏（744 × 1133）：照旧贴底
  { const { p, errs } = await open({ width: 744, height: 1133 });
    const g = await geo(p);
    check(g.pad && g.pad.t >= g.score.b - 1 && /"main" "pad"/.test(g.areas) && g.side === null, "竖屏：键盘贴底（没变）", g.areas);
    check(errs.length === 0, "竖屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
  // ④ 1024 × 768（贴底后剩 357 px ≈ 2.5 行）：贴底——不是按长宽比 / 固定高度，是按剩几行
  { const { p, errs } = await open({ width: 1024, height: 768 });
    const g = await geo(p);
    check(g.pad && g.pad.t >= g.score.b - 1 && g.side === null, "1024×768：贴底后还看得到两行多 → 贴底", JSON.stringify({ side: g.side, padTop: g.pad?.t, scoreBottom: g.score.b }));
    check(errs.length === 0, "1024×768：没有页面错误", errs.join(" | ")); await p.context().close(); }
} finally { console.log(`\n  ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0); }
