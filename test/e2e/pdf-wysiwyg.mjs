// test/e2e/pdf-wysiwyg.mjs —— 真浏览器 E2E：PDF = 「全部 + 分页」预览（除了控件和提示）。created 2026-10-09 by Claude Opus 5.5
// user「pdf画出来和开分页预览的不一样，没有respect track hidding，到时候记得都一起修一下，做到除了控件和提示外的wysiwyg」。
// 守：两个声部、三张纸（中间那张隐藏）、够排好几页；分页 + 全部视图下预览的页数 = PDF 的页数；隐藏一个声部之后两边一起变少（PDF 不印隐藏的声部）。
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].slice(0, 3); let id = 3000;
  const S = "CDEFGAB", L = "月亮出来了照在大地上";
  const notes = (n, ly) => Array.from({ length: n }, (_, k) => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave: 4 }, dur: k % 3 ? 1680 : 840, lyric: ly ? L[k % L.length] : null }));
  const P2 = { id: "P9", role: "r9", mic: "m9" };
  const paper = (pid2, name, a, b2, hidden) => ({ id: pid2, name, ...(hidden ? { hidden: true } : {}), tracks: { [pid]: [...head, ...notes(a, true)], ...(b2 ? { P9: [...head, ...notes(b2, false)] } : {}) } });
  m.set({ ...st, song: { ...st.song, title: "月亮", parts: [...st.song.parts, P2], papers: [paper(st.song.papers[0].id, "A", 160, 160), paper("pB", "B", 40, 40, true), paper("pC", "C", 50, 0)] } });
  m.setScope("all"); m.setPages(true);
});
await p.waitForTimeout(200);
const both = async () => p.evaluate(async () => { const m = window.__moonsinger, pv = m.layout().pages.length, x = await m.makePdf("sans"); return { preview: pv, pdf: x.pages, miss: x.stats.missing.length + x.stats.missingMusic.length }; });
let r = await both();
check(r.preview >= 2 && r.preview === r.pdf && r.miss === 0, "两个声部都显示：PDF 页数 = 分页预览页数", JSON.stringify(r));
const shown = r.pdf;
await p.evaluate(() => window.__moonsinger.partView("P9", { hidden: true })); await p.waitForTimeout(200);
r = await both();
check(r.preview === r.pdf && r.pdf < shown, "隐藏一个声部：两边一起变少（PDF 不印隐藏的声部）", JSON.stringify({ ...r, shown }));
await p.evaluate(() => window.__moonsinger.partView("P9", { hidden: false, only: false })); await p.evaluate(() => window.__moonsinger.partView(window.__moonsinger.state().song.parts[0].id, { only: true })); await p.waitForTimeout(200);
r = await both();
check(r.preview === r.pdf && r.pdf < shown, "「只看它」一个声部：同样只印看得见的", JSON.stringify(r));
// 印哪些（2026-10-09，user「只印一段或一个声部 这个也到时候需要做，和wxhw差不多，在只显示一个声部的时候你可以选」）
await p.evaluate(() => { const m = window.__moonsinger; m.partView(m.state().song.parts[0].id, { only: false }); m.partView("P9", { hidden: true }); });
const one = await p.evaluate(async () => { const m = window.__moonsinger; m.setScope("segment"); await new Promise((ok) => setTimeout(ok, 150)); const pv = m.layout().pages.length, x = await m.makePdf("sans", { paper: m.state().at.paper }); m.setScope("all"); return { preview: pv, pdf: x.pages, name: x.name }; });
check(one.preview === one.pdf && /-A-\d{8}-\d{4}\.pdf$/.test(one.name), "只印这一段 = 「本段」分页预览的页数；文件名带曲段名和导出时间（名-A-YYYYMMDD-HHMM）", JSON.stringify(one));
const sh = await p.evaluate(async () => { const m = window.__moonsinger, view = await m.makePdf("sans"), x = await m.makePdf("sans", { onlyShown: true }); return { view: view.pages, shown: x.pages, name: x.name }; });
check(sh.shown <= sh.view && /Vocals/.test(sh.name), "只排看得见的声部：不留空位（页数不比照预览多）、文件名带声部名", JSON.stringify(sh));
// 面板：多张纸 = 有「整首 / 这一段」；有隐藏的声部 = 有「照分页预览 / 只排看得见的」
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(200); await p.click('.offer [data-v="pdf"]'); await p.waitForTimeout(200);
check(!!(await p.$('.offer [data-v="paper:one"]')) && !!(await p.$('.offer [data-v="parts:shown"]')), "PDF 面板：「这一段」「只排看得见的」都在");
await p.click('.offer [data-v="parts:shown"]'); await p.waitForTimeout(100);
check(/和分页预览不一样/.test(await p.$eval(".offer", (e) => e.textContent)), "选了只排看得见的 = 明说和预览不一样");
await p.click('.offer [data-v="close"]');
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
