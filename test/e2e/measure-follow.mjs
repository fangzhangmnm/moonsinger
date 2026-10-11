// test/e2e/measure-follow.mjs —— 真浏览器 E2E：播放的小节底色按播放的位置找小节（v0.10.28），跨小节的长音后半截也跟得上。
// created 2026-10-10 by Claude Opus 5.5（user「0.10.27小节高亮也算错了…碰到跨小节的音小节高亮没有update」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/measure-follow.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 一位：四分 ×3、二分（跨进第二小节）、四分 ×3
const Q = await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pp = st.song.papers[0], pid = st.at.part, t = pp.tracks[pid], Q = 1680;   // song.ts TPQ
  const head = t.filter((x) => x.kind !== "note" && x.kind !== "rest").slice(0, 3);
  let id = 90000; const n = (dur) => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 5 }, dur, lyric: null });
  m.set({ ...st, song: { ...st.song, papers: [{ ...pp, tracks: { ...pp.tracks, [pid]: [...head, n(Q), n(Q), n(Q), n(2 * Q), n(Q), n(Q), n(Q)] } }] }, caret: 0, sel: null });
  return Q;
});
await p.waitForTimeout(300);
const barAt = async (tick) => p.evaluate((tick) => {
  const m = window.__moonsinger, st = m.state(); m.view.setPlayhead({ paperId: st.song.papers[0].id, tick });
  const bar = document.querySelector(".play-bar"); if (!bar) return null;
  const L = m.layout(), xs = L.bars.filter((x) => x.system === L.systems.findIndex((r) => r.part === st.at.part)).map((x) => x.x).sort((a, b) => a - b);
  return { left: parseFloat(bar.style.left), bars: xs };
}, tick);
const b1 = await barAt(Q * 2.5), b2 = await barAt(Q * 4.5);   // 第一小节中间 / 第二小节第一拍后半（那个二分音符还在响，它是在第一小节开始的）
check(!!b1 && !!b2 && b2.left > b1.left + 5, "长音跨进第二小节：小节底色跟着到第二小节", JSON.stringify({ b1, b2 }));
check(!!b2 && b2.bars.length > 0 && Math.abs(b2.left - b2.bars[0]) < 2, "第二小节的底色从第一条小节线起", JSON.stringify(b2));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmeasure-follow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
