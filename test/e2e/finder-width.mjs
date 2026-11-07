// test/e2e/finder-width.mjs —— 真浏览器 E2E：乐器目录的列表不比屏幕宽、不能横着滚（v0.15.6）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「找乐器的时候往下拉的时候页面总是左右摆」「找东西的时候累的我快癫痫了」；
//   根因 = 英文长名字 / 曲风排序里的音色名设成不换行，撑出格子 → 列表比屏幕宽 ~130 px → iPad 上竖着划一带斜就左右晃）
// 守：每种排序 × 中 / 英 × iPad 竖 / 横 / 手机，列表里没有一个元素伸出列表右边；列表只许竖滚（overflow-x hidden + touch-action pan-y）；
//   点开一件长名字的乐器（「谁能演」那一块）也不撑宽。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-width.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const base = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const b = await chromium.launch();

/** 列表里伸出右边的元素（最多列 4 个）+ 列表的宽 / 内容宽。 */
const measure = (p) => p.evaluate(() => {
  const l = document.querySelector(".finder-list"), right = l.getBoundingClientRect().left + l.clientWidth, out = [];
  for (const e of l.querySelectorAll("*")) { const r = e.getBoundingClientRect(); if (r.width && r.right > right + 0.5) out.push(`${e.className?.baseVal ?? e.className}+${Math.round(r.right - right)}「${(e.textContent || "").slice(0, 30)}」`); }
  return { sw: l.scrollWidth, cw: l.clientWidth, out: out.slice(0, 4), n: out.length };
});

async function openFinder(locale, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base); await p.waitForTimeout(800);
  await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
  await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
  await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h");
  return { ctx, p, errs };
}

// iPad 竖屏英文：四种排序逐个量（原来最宽的情形：内容 958 / 屏 820）
{
  const { ctx, p, errs } = await openFinder("en-US", 820, 1180);
  const modes = await p.$$eval(".finder-sort option", (os) => os.map((o) => o.value));
  for (const m of modes) {
    await p.selectOption(".finder-sort", m); await p.waitForTimeout(150);
    // 手风琴（v0.16.3）：一组一组点开再量（收着的组里的行不画）
    const ng = await p.$$eval(".finder-group", (gs) => gs.length); let worst = { n: 0, sw: 0, cw: 0, out: [] };
    for (let k = 0; k < ng; k++) {
      if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(40); }
      const r = await measure(p); if (r.n > worst.n || r.sw > worst.sw) worst = r;
    }
    const r = worst;
    check(r.n === 0 && r.sw <= r.cw, `en 820×1180 按 ${m}：${ng} 组逐个点开，没有东西伸出列表`, r.n ? `${r.sw}/${r.cw} ${r.out.join(" | ")}` : "");
  }
  const st = await p.evaluate(() => { const l = document.querySelector(".finder-list"), cs = getComputedStyle(l); l.scrollLeft = 200; return { ox: cs.overflowX, ta: cs.touchAction, left: l.scrollLeft }; });
  check(st.ox === "hidden" && st.ta === "pan-y", "列表只许竖着滚（overflow-x hidden + touch-action pan-y）", JSON.stringify(st));
  check(st.left === 0, "硬设 scrollLeft = 200 也横不过去", String(st.left));
  // 点开名字最长的那件（按族排），「谁能演」那块也不撑宽
  await p.selectOption(".finder-sort", modes.includes("family") ? "family" : modes[0]); await p.waitForTimeout(150);
  await p.evaluate(() => { const rows = [...document.querySelectorAll(".finder-list .inst-row")]; rows.sort((a, b) => b.textContent.length - a.textContent.length); rows[0].scrollIntoView(); rows[0].click(); });
  await p.waitForSelector(".inst-prov"); await p.waitForTimeout(150);
  const r2 = await measure(p);
  check(r2.n === 0, "点开名字最长的那件：「谁能演」也不撑宽", r2.out.join(" | "));
  check(errs.length === 0, "页面没有报错", errs.join(" | "));
  await ctx.close();
}
// iPad 横屏英文 / 手机中文：默认排序量一遍
for (const [loc, w, h] of [["en-US", 1180, 820], ["zh-CN", 390, 844]]) {
  const { ctx, p } = await openFinder(loc, w, h);
  const ng = await p.$$eval(".finder-group", (gs) => gs.length); let r = { n: 0, sw: 0, cw: 0, out: [] };
  for (let k = 0; k < ng; k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(40); }
    const m = await measure(p); if (m.n > r.n || m.sw > r.sw) r = m;
  }
  check(r.n === 0 && r.sw <= r.cw, `${loc} ${w}×${h}：没有东西伸出列表`, r.n ? `${r.sw}/${r.cw} ${r.out.join(" | ")}` : "");
  await ctx.close();
}
await b.close();
console.log(`\nfinder-width: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
