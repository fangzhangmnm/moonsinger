// test/e2e/status-hit.mjs —— 真浏览器 E2E：不印的状态提示（第一行谱头那一行右端的淡字）手指点的时候点击区在屏幕上至少 30 px 高。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。统筹 2026-11-12：「手指的点击区按屏幕上的大小算、不按纸上的大小算…这一串：手指点的时候点击区在屏幕上至少 30 px 高
//   （不盖别的点得到的东西；盖得到就各让一半）」。起因：390 宽时整张纸按屏宽缩，原来只剩 17 px。
//   守：① 手机（手指）390 宽：从提示中心往上 / 往下量，落在提示上的有 ≥ 30 屏幕 px ② 缩小谱面（Ctrl+−）之后照样 ≥ 30 ③ 不盖下面的谱：提示正下方 30 px 外点的不是它
//   ④ 鼠标设备（不是手指）不扩：同样 390 宽仍是排版给的大小（< 30）⑤ 没有页面错误
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/status-hit.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(), errs = [];
async function page(touch) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
  await p.evaluate(() => {   // 一首小歌、「演奏法和表情：不显示」= 第一行谱头那一行右端一条提示
    const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].filter((t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo"); let id = 900;
    const n = (s) => ({ kind: "note", id: id++, pitch: { step: s, alter: 0, octave: 5 }, dur: 1680, lyric: null });
    m.set({ ...st, song: { ...st.song, expressions: false, papers: [{ ...st.song.papers[0], tracks: { [pid]: [...head, n("C"), n("D"), n("E"), n("F"), n("G"), n("A"), n("B"), n("C")] } }] }, caret: 0, sel: null });
  });
  await p.waitForTimeout(500); await p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
  return p;
}
/** 提示中心那一竖线上，落在提示（或它的点击区）上的屏幕高度：从中心往上、往下每 0.5 px 问一次 elementFromPoint。 */
const span = (p) => p.evaluate(() => {
  const el = document.querySelector("#score .score-overlay .ov-fold-hint"); if (!el) return null;
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, cy = r.top + r.height / 2, on = (y) => document.elementFromPoint(x, y)?.closest(".ov-fold-hint") === el;
  let up = 0, dn = 0; while (up < 80 && on(cy - up - 0.5)) up += 0.5; while (dn < 80 && on(cy + dn + 0.5)) dn += 0.5;
  return { h: up + dn, up, dn, text: r.height, x, cy };
});

const p = await page(true);
const s1 = await span(p);
check(!!s1 && s1.h >= 29.5, "手机 390 宽（手指）：提示的点击区在屏幕上 ≥ 30 px 高", s1 ? `${s1.h} px（字 ${s1.text.toFixed(1)} px，上 ${s1.up} 下 ${s1.dn}）` : "没有提示");
const z0 = await p.$eval("#score .sheet", (e) => Number(e.style.zoom || 1));
await p.keyboard.press("Control+Minus"); await p.waitForTimeout(400);
const z1 = await p.$eval("#score .sheet", (e) => Number(e.style.zoom || 1)), s2 = await span(p);
check(z1 < z0 - 0.01 && !!s2 && s2.h >= 29.5, "缩小谱面之后照样 ≥ 30 屏幕 px（按屏幕算，不跟着纸缩）", s2 ? `缩放 ${z0} → ${z1.toFixed(2)}，${s2.h} px（字 ${s2.text.toFixed(1)} px）` : "没有提示");
const below = s2 && await p.evaluate(({ x, cy, dn }) => document.elementFromPoint(x, cy + dn + 2)?.closest(".ov-fold-hint") ?? null, s2);
check(!!s2 && below === null, "点击区下沿外面点的不是它（只扩到和下面东西之间空当的一半）");
await p.context().close();

const q = await page(false);
const s3 = await span(q);
check(!!s3 && s3.h < 29.5, "鼠标设备不扩：同样 390 宽仍是排版给的大小", s3 ? `${s3.h} px` : "没有提示");
await q.context().close();
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
