// test/e2e/dock-side.mjs —— 真浏览器 E2E：底座（键盘 / 混音台）默认贴底——宽屏横屏也在下面；只有「横屏且矮」（winmini 档）才在左边一栏，小条跟着挂、谱让出小条。
// created 2026-10-21 by Claude Fable 5.1（user「ui默认键盘在下面，就是很长很宽的屏幕，键盘，混音台，都在下面，只有极端情况（其实就是winmini一个）才考虑放左边」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dock-side.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const geo = (p) => p.evaluate(() => {
  const r = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
  const s = r("#score"), k = r(".pad-panel"), t = r(".dock-tab"), st = r("#stage");
  return { stage: { w: st.width, h: st.height }, score: { l: s.left, r: s.right, t: s.top, b: s.bottom, ml: parseFloat(getComputedStyle(document.querySelector("#score")).marginLeft) }, pad: k && { l: k.left, r: k.right, t: k.top, b: k.bottom, w: k.width, h: k.height }, tab: t && { l: t.left, r: t.right, t: t.top, b: t.bottom },
    areas: getComputedStyle(document.querySelector("#stage")).gridTemplateAreas };
});
const open = async (viewport) => { const p = await (await b.newContext({ viewport })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700); return { p, errs }; };
try {
  // ① 宽屏横屏（1400 × 820）：贴底
  { const { p, errs } = await open({ width: 1400, height: 820 });
    const g = await geo(p);
    check(g.pad && g.pad.t >= g.score.b - 1 && Math.abs(g.pad.w - g.stage.w) <= 1, "宽屏横屏：键盘在谱下面、整宽", JSON.stringify({ padTop: g.pad?.t, scoreBottom: g.score.b, padW: g.pad?.w, stageW: g.stage.w }));
    check(/"main" "pad"/.test(g.areas), "舞台 = 上下两行", g.areas);
    check(g.tab && Math.abs(g.tab.b - g.pad.t) <= 1 && g.tab.l >= g.pad.l && g.tab.l < g.pad.l + 40, "小条挂在键盘左上角、往上", JSON.stringify(g.tab));
    check(g.score.ml === 0, "谱不让边（小条不在谱的左边）", String(g.score.ml));
    // 混音台（听）也在下面
    await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(400);
    const st = await p.evaluate(() => { const e = document.querySelector(".studio"); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(), s = document.querySelector("#score").getBoundingClientRect(); return { below: r.top >= s.bottom - 1, w: r.width, stageW: document.querySelector("#stage").getBoundingClientRect().width }; });
    check(st && st.below && Math.abs(st.w - st.stageW) <= 1, "「听」：混音台也在谱下面、整宽", JSON.stringify(st));
    check(errs.length === 0, "宽屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
  // ② winmini 档（1100 × 600：横屏且矮）：左边一栏
  { const { p, errs } = await open({ width: 1100, height: 600 });
    const g = await geo(p);
    check(g.pad && g.pad.r <= g.score.l + 1 && Math.abs(g.pad.h - g.stage.h) <= 1, "横屏且矮：键盘在谱左边一栏、整高", JSON.stringify({ padRight: g.pad?.r, scoreLeft: g.score.l, padH: g.pad?.h, stageH: g.stage.h }));
    check(/"pad main"/.test(g.areas), "舞台 = pad | main", g.areas);
    check(g.tab && Math.abs(g.tab.l - g.pad.r) <= 1 && g.tab.t >= g.pad.t && g.tab.t < g.pad.t + 40, "小条挂在键盘右边、竖着排、贴顶", JSON.stringify(g.tab));
    check(g.score.ml === 46, "谱的左边让出小条那 46 px", String(g.score.ml));
    check(errs.length === 0, "矮屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
  // ③ 竖屏（744 × 1133）：照旧贴底
  { const { p, errs } = await open({ width: 744, height: 1133 });
    const g = await geo(p);
    check(g.pad && g.pad.t >= g.score.b - 1 && /"main" "pad"/.test(g.areas), "竖屏：键盘贴底（没变）", g.areas);
    check(errs.length === 0, "竖屏：没有页面错误", errs.join(" | ")); await p.context().close(); }
} finally { console.log(`\n  ${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0); }
