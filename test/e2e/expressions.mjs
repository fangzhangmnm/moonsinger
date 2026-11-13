// test/e2e/expressions.mjs —— 真浏览器 E2E：页面设置「看谱」页「演奏法和表情：显示 / 不显示」（施工单 7-G）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   守：① 切「不显示」= 歌里记着、谱上没有力度 / 渐强渐弱的点击框、「折叠 N」小标在、数对；点它 = 开页面设置、停在「看谱」页 ② 撤销 = 回到显示、小标没了
//   ③ 不显示时写一个力度 = 轻轻说一句「写上了，但现在没显示」，同一种第二次不说；删一个带重音的音 = 「改到了没显示的重音」
//   ④ PDF 面板那句写「不印演奏法和表情」 ⑤ 没有页面错误
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/expressions.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pickOnPage, ddValue } from "./dd.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 一首小歌：mp、渐强、四个音（重音 + 跳音、连线两个、一个光的）
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].filter((t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo"); let id = 900;
  const n = (step, o = {}) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: null, ...o });
  const toks = [...head, { kind: "dyn", id: id++, value: "mp" }, { kind: "hairpin", id: id++, dir: "cresc" }, n("C", { art: ["accent", "staccato"] }), n("D", { slur: true }), n("E", { slur: true }), n("F")];
  m.set({ ...st, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: toks } }] }, caret: toks.length, sel: null });
});
await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
const S = () => p.evaluate(() => window.__moonsinger.state());
const dynHits = () => p.evaluate(() => new Set(window.__moonsinger.layout().dyns.filter((d) => d.kind === "dyn" || d.kind === "hairpin").map((d) => d.index)).size);   // 指着几个记号（发夹末端的推定灰字另有一块框、指同一条发夹，7-N 补）
const chip = () => p.evaluate(() => { const c = document.querySelector("#score .score-overlay .ov-fold-hint"); return c ? c.textContent : null; });   // 「演奏法和表情：不显示」的淡提示（7-G 重做；原来的「折叠 N」小标）
const toasts = () => p.evaluate(() => [...document.querySelectorAll(".notice-stack [data-notice-id], .notice-stack .toast")].map((n) => n.textContent ?? "").join(" | "));
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForSelector(".settings-card"); };
const closeSheet = async () => { await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(200); };

check((await dynHits()) === 2 && (await chip()) === null, "显示着：力度 / 渐强渐弱有点击框、没有淡提示", `${await dynHits()} / ${await chip()}`);
await openSheet();
check((await ddValue(p, '.settings-card [data-pg="expr"]')) === "?follow" && (await p.$eval('.settings-card [data-pg="expr"]', (e) => e.textContent ?? "")).includes("跟着软件（现在是：显示）"), "页面设置「看谱」页有「演奏法和表情」，新歌跟着软件、现在是显示（17-1）");
await pickOnPage(p, '.settings-card [data-pg="expr"]', "off"); await p.waitForTimeout(250);
check((await S()).song.expressions === false, "选「不显示」= 歌里记着 expressions: false");
await closeSheet();
check((await dynHits()) === 0, "谱上没有力度 / 渐强渐弱的点击框（不交给排版）", String(await dynHits()));
check((await chip()) === "演奏法和表情：不显示", "第一行谱头那一行右端：淡字「演奏法和表情：不显示」（不写数字）", String(await chip()));
await p.click("#score .score-overlay .ov-fold-hint"); await p.waitForTimeout(250);
check(await p.evaluate(() => { const pg = document.querySelector('.settings-card .set-page[data-page="look"]'), dd = pg?.querySelector('[data-pg="expr"]'); return !!pg && !pg.hidden && !!dd && dd.closest(".set-item").classList.contains("is-target") && document.activeElement === dd; }), "点淡提示 = 开页面设置「看谱」页、落在「演奏法和表情」那一项（高亮、焦点在它的下拉上）");
await closeSheet();
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await S()).song.expressions === "default" && (await chip()) === null && (await dynHits()) === 2, "撤销 = 回到跟着软件（显示）、小标没了、点击框回来了");
await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(250);
check((await S()).song.expressions === false && (await chip()) !== null, "重做 = 又不显示");

// ③ 不显示时写力度：说一句；同一种再写不说
await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
const symOpen = () => p.evaluate(() => !!document.querySelector(".pad-grid.symbols"));
if (!(await symOpen())) { await p.click(".pad-head [data-kbswitch]"); await p.waitForTimeout(100); }
await p.click('.pad-head [data-sympage="dyn"]'); await p.waitForTimeout(100);
await p.click('[data-sym="dyn:f"]'); await p.waitForTimeout(250);
const t1 = await toasts();
check(/写上了，但现在没显示：力度记号/.test(t1), "写一个力度 = 「写上了，但现在没显示：力度记号」", t1.slice(0, 80));
check((await S()).song.papers[0].tracks[(await S()).at.part].some((t) => t.kind === "dyn" && t.value === "f"), "力度真写进谱里了（只是不画）");
await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
await p.click('[data-sym="dyn:p"]'); await p.waitForTimeout(250);
check(!/写上了，但现在没显示/.test(await toasts()), "同一种第二次不说");
// 删带重音 / 跳音的那个音：说「改到了」
await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), t = st.song.papers[0].tracks[st.at.part], i = t.findIndex((x) => x.kind === "note" && (x.art ?? []).includes("accent")); m.set({ ...st, caret: i, sel: { from: i, to: i + 1 } }); });
await p.waitForTimeout(150);
await p.keyboard.press("Delete"); await p.waitForTimeout(250);
const t2 = await toasts();
check(/改到了没显示的/.test(t2) && /重音/.test(t2), "删带重音的音 = 「改到了没显示的重音…」", t2.slice(0, 80));
// ④ PDF 面板那一句
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(200);
await p.click('.offer [data-v="pdf"]'); await p.waitForTimeout(200);
check((await p.$$eval(".offer .offer-msg", (ms) => ms.map((m) => m.textContent).join("|"))).includes("不印演奏法和表情"), "PDF 面板写「不印演奏法和表情」");
await p.click('.offer [data-v="close"]'); await p.waitForTimeout(150);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
