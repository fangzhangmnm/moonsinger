// test/e2e/tall-group.mjs —— 真浏览器 E2E：一组比一页高 = 在行和行之间断开、接到下一页（施工单 7-V，user 2026-11-12「只能接到下一页啦」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 十四个声部一组（比 A5 一页高）、分页预览：每一行都在它那一页里，同一组分在两页上 ② 状态那一串里有「有一组比一页高，接到了下一页」
//   ③ 点它 = 页面设置开在「版面」页 ④ 预览几页、PDF 就几页（所见即所得） ⑤ 换回连续排 = 这条提示没了 ⑥ 没有页面错误
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/tall-group.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {   // 十四位歌手、一张纸、每位十二小节（第一位带歌词）
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].slice(0, 3); let id = 5000;
  const S = "CDEFGAB", L = "月亮出来了照在大地上";
  const notes = (n, ly) => Array.from({ length: n }, (_, k) => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave: 4 }, dur: 1680, lyric: ly ? L[k % L.length] : null }));
  const extra = Array.from({ length: 13 }, (_, k) => ({ id: `Q${k}`, role: `rq${k}`, mic: `mq${k}` }));
  const tracks = { [pid]: [...head, ...notes(48, true)] }; for (const x of extra) tracks[x.id] = [...head, ...notes(48, false)];
  m.set({ ...st, song: { ...st.song, title: "很多声部", parts: [...st.song.parts, ...extra], papers: [{ ...st.song.papers[0], tracks }] } });
  m.setScope("all"); m.setPages(true);
});
await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
const info = () => p.evaluate(() => {
  const L = window.__moonsinger.layout(), pageOf = (y) => L.pages.findIndex((pg) => y >= pg.top && y < pg.top + pg.h);
  const out = L.systems.filter((s) => { const k = pageOf(s.top); return k < 0 || s.bottom > L.pages[k].top + L.pages[k].h; }).length;
  const g = new Map(); for (const s of L.systems) { const key = `${s.paper}:${s.sys}`; g.set(key, new Set([...(g.get(key) ?? []), pageOf(s.top)])); }
  return { pages: L.pages.length, out, split: [...g.values()].filter((x) => x.size > 1).length, kinds: L.statusHints.flatMap((h) => h.items.map((i) => i.kind)), hint: !!document.querySelector("#score .score-overlay .ov-tall-hint") };
});
const a = await info();
check(a.pages > 1 && a.out === 0 && a.split > 0, "分页预览：每一行都在它那一页里，有一组分在了两页上", JSON.stringify(a));
check(a.kinds.includes("tallGroup") && a.hint, "状态那一串里有「有一组比一页高，接到了下一页」（不印，覆盖层上一颗钮）", JSON.stringify(a.kinds));
const both = await p.evaluate(async () => { const m = window.__moonsinger, pv = m.layout().pages.length, x = await m.makePdf(); return { preview: pv, pdf: x.pages }; });
check(both.preview === both.pdf, "预览几页、PDF 就几页", JSON.stringify(both));
// 点提示 = 页面设置开在「版面」页
const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-tall-hint")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
if (c) { await p.evaluate(() => { const el = document.querySelector("#score .score-overlay .ov-tall-hint"); el?.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(200); }
const c2 = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-tall-hint")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
if (c2) await p.mouse.click(c2.x, c2.y); await p.waitForTimeout(300);
const sheet = await p.evaluate(() => { const pg = (k) => document.querySelector(`.offer .set-page[data-page="${k}"]`); return { open: !!document.querySelector(".offer .set-page"), layout: !!pg("layout") && !pg("layout").hidden, look: !!pg("look") && !pg("look").hidden }; });
check(sheet.open && sheet.layout && !sheet.look, "点它 = 页面设置开在「版面」页", JSON.stringify(sheet));
await p.click('.offer [data-v="close"]').catch(() => {}); await p.waitForTimeout(200);
// 换回连续排：不分页 = 没有这条提示
await p.evaluate(() => window.__moonsinger.setPages(false)); await p.waitForTimeout(400);
const z = await info();
check(z.pages === 0 && !z.kinds.includes("tallGroup") && !z.hint, "换回连续排：没有分页、没有这条提示", JSON.stringify(z));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`tall-group: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
