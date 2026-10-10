// test/e2e/mixer-narrow.mjs —— 真浏览器 E2E：iPad mini 竖屏（744 × 1133）混音台每一页一排都是三张卡（v0.10.26）。
// created 2026-10-10 by Claude Opus 5.5（user「能稍微抠一点让ipadmini竖屏显示三张混音卡吗。整体放小字号？」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/mixer-narrow.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
for (const tab of ["basic", "eq", "comp", "send", "chain"]) {
  await p.click(`.mix-tabs [data-tab="${tab}"]`); await p.waitForTimeout(200);
  if (tab === "eq" || tab === "comp") for (let k = 0; k < 4; k++) { const btn = await p.$(`.strip [data-v="fxaddkind"]`); if (!btn) break; await btn.click(); await p.waitForTimeout(150); }   // 满载：每张卡都摊开这一页的插件
  const r = await p.evaluate(() => {
    const box = document.querySelector(".studio-strips"), cols = getComputedStyle(box).gridTemplateColumns.split(" ").length;
    // 卡片里第一排钮（开着 / 一键·全量 / 拷参数）没折行：同一个 top
    const heads = [...box.querySelectorAll(".fx-inline-head")].map((h) => { const ys = [...h.children].filter((c) => c.getBoundingClientRect().width > 0).map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; }); return Math.round(Math.max(...ys) - Math.min(...ys)); });   // 各钮中线差几 px
    const over = [...box.querySelectorAll(".strip")].some((s) => s.scrollWidth > s.clientWidth + 1);
    return { cols, heads, over };
  });
  check(r.cols === 3 && r.heads.every((n) => n <= 6) && !r.over, `「${tab}」：一排三张、卡片头一排钮不折行、不横着溢出`, JSON.stringify(r));
}
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmixer-narrow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
