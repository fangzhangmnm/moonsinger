// test/e2e/pdf.mjs —— 真浏览器 E2E：乐谱 PDF（自己写的 PDF：Bravura 轮廓画成路径 + 歌词嵌字体子集）。
// 守：导出面板里有「乐谱（PDF）」→ 选字体（记进视图态）→ 生成 → 「好了」面板（分享 / 下载）；字节是 PDF、页数对、没有缺字 / 缺记谱符号；拼音字体也能出。
// created 2026-10-09 by Claude Opus 5.5（user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 一首小歌：四个音带歌词（中文 + 日文）、一个力度、一个风格记号
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, toks = st.song.papers[0].tracks[pid].slice(0, 3); let id = 900;
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly });
  m.set({ ...st, song: { ...st.song, title: "月亮", papers: [{ ...st.song.papers[0], tracks: { [pid]: [...toks, { kind: "dyn", id: id++, value: "mp" }, { kind: "groove", id: id++, style: "pop" }, n("C", "月"), n("D", "亮"), n("E", "つ"), n("F", "き")] } }] } });
});
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(200);
check(!!(await p.$('.offer [data-v="pdf"]')), "导出面板里有「乐谱（PDF）」");
await p.click('.offer [data-v="pdf"]'); await p.waitForTimeout(200);
await p.click('.offer [data-v="font:pinyin"]'); await p.waitForTimeout(100);
check(await p.$eval('.offer [data-v="font:pinyin"]', (e) => e.classList.contains("is-on")), "选拼音");
check(await p.evaluate(() => window.__moonsinger.zipText(window.__moonsinger.bytes(), ".moonsinger/score.json").includes('"pdf": "pinyin"')), "字体记进视图态（存时顺手带）");
await p.click('.offer [data-v="font:sans"]'); await p.waitForTimeout(100);
await p.click('.offer [data-v="go"]');
for (let i = 0; i < 60; i++) { if (await p.$(".offer .offer-title")) { const t = await p.$eval(".offer .offer-title", (e) => e.textContent); if (/好了/.test(t)) break; } await p.waitForTimeout(250); }
const done = await p.$eval(".offer", (e) => e.textContent).catch(() => "");
check(/乐谱 PDF 好了/.test(done) && /1 页/.test(done), "生成 → 「好了」面板（1 页）", done.slice(0, 60));
for (const font of ["sans", "pinyin"]) {
  const r = await p.evaluate(async (f) => { const x = await window.__moonsinger.makePdf(f); return { head: new TextDecoder().decode(x.bytes.slice(0, 8)), pages: x.pages, n: x.bytes.length, stats: x.stats, pageObjs: (new TextDecoder("latin1").decode(x.bytes).match(/\/Type \/Page /g) ?? []).length }; }, font);
  check(r.head === "%PDF-1.7" && r.pages === 1 && r.pageObjs === 1, `${font}：是 PDF、1 页`, JSON.stringify({ head: r.head, pages: r.pages, n: r.n }));
  check(r.stats.missing.length === 0 && r.stats.missingMusic.length === 0, `${font}：没有缺字 / 缺记谱符号`, JSON.stringify(r.stats));
}
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
