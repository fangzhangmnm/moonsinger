// test/e2e/sing-experiments.mjs —— 真浏览器 E2E：乐器页小月相的「实验」行（F-16 爆音查案，v0.12.4）。切一个旋钮 = 唱法 opt 里多一个键 = 块的键变了 = 预唱按新旋钮重唱；
//   选回默认 = 键删掉（和没动过一样）。只接线不听（AI 不听）。反证：把 performance.ts humOpt 里的 `...singExperiment` 删掉 = 「切了 = 带着新旋钮唱」那条红。
// created 2026-10-14 by Claude Fable 5.1
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 假唱：记下每次给核心的 opt；写两个字触发预唱
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, a = st.song.papers[0]; let id = 7300;
  window.__opts = [];
  m.singer.sing = (_score, _onStage, o) => { window.__opts.push(o?.opt ?? null); return Promise.resolve({ samples: new Float32Array(22050), sr: 22050 }); };
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly });
  m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: [...a.tracks[pid].slice(0, 3), n("C", "か"), n("D", "な")] } }] } });
});
const lastOpt = async () => { for (let i = 0; i < 40; i++) { const o = await p.evaluate(() => window.__opts.at(-1) ?? null); if (o) return o; await p.waitForTimeout(100); } return null; };
const o0 = await lastOpt();
check(!!o0 && !("breath" in o0) && !("cleanMax" in o0), "默认：预唱给核心的 opt 里没有实验键", JSON.stringify(o0));
// 开乐器页：四行「实验」
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const txt = await p.$eval(".inst-page", (e) => e.textContent ?? "");
check(/借元音门槛（实验）/.test(txt) && /气息（实验）/.test(txt) && /齐平上限（实验）/.test(txt) && /齐平多少（实验）/.test(txt), "乐器页小月相有四行「实验」");
check(await p.$eval('.inst-page [data-v="exp:breath:0"]', (e) => e.classList.contains("is-on")), "默认那一格亮着（气息 0）");
// 切气息 1 → 预唱按新旋钮重唱
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="exp:breath:1"]'); await p.waitForTimeout(100);
check(await p.$eval('.inst-page [data-v="exp:breath:1"]', (e) => e.classList.contains("is-on")), "点了 = 那一格亮");
const o1 = await lastOpt();
check(!!o1 && o1.breath === 1, "切了 = 带着新旋钮重唱（opt.breath = 1）", JSON.stringify(o1));
// 再切借元音门槛 0.3：两个键都在
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="exp:cleanMax:0.3"]');
const o2 = await lastOpt();
check(!!o2 && o2.breath === 1 && o2.cleanMax === 0.3, "两个旋钮叠着", JSON.stringify(o2));
// 回默认 = 键删掉
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="exp:breath:0"]'); await p.click('.inst-page [data-v="exp:cleanMax:0.4"]'); await p.waitForTimeout(100);
// 默认那一句开头就唱过、块还在录音房里 = 不会再唱（缓存命中是对的）；换一个字 = 新的一句，看它带的 opt
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), pid = st.at.part, a = st.song.papers[0]; const tr = a.tracks[pid].map((t) => (t.lyric === "な" ? { ...t, lyric: "に" } : t)); m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: tr } }] } }); });
const o3 = await lastOpt();
check(!!o3 && !("breath" in o3) && !("cleanMax" in o3), "选回默认 = 和没动过一样", JSON.stringify(o3));
check(!(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras()).includes("cleanMax"))), "实验不进歌（extras 里没有）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsing-experiments: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
