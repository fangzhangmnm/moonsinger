// test/e2e/roll-variation.mjs —— 真浏览器 E2E：乐器页「滚奏的变化（试验）」（施工单 7-N 第三批）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   user「默认没有变化，我试了之后告诉你该sunset变化还是默认变化」；统筹：试验期间只在这次打开里有效、不进歌、不进撤销。守：
//   ① 认滚奏的乐手的乐器页有这一行，默认「没有（均匀）」亮着 ② 选「左右手交替 + 小随机」= 放的时候录音房吃的那一串变了（同样多下、第一下不挪、有的下挪了 / 力度变了）
//   ③ 不进歌（休息室快照里没有）、不进撤销（撤销一步不把它撤掉）④ 换歌复位 ⑤ 没有页面错误
// 用仓里 24 KB 的 test/fixtures/sf2/gu-square-castanets.sf2（不下 GS）。跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/roll-variation.mjs
import { chromium } from "./pw.mjs";
import { fileURLToPath } from "node:url";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const SF2 = fileURLToPath(new URL("../fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 台上换成测试音源里的响板（SoundFont = 认滚奏）
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);
{ const [fc] = await Promise.all([p.waitForEvent("filechooser"), p.click(".finder-bar .finder-file")]); await fc.setFiles(SF2); await p.waitForSelector(".finder-own"); await p.waitForTimeout(150); }
await p.click('.finder-own .prov[data-p="sf2|8:115"] [data-v="cast"]'); await p.waitForTimeout(500);
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
// 一首小歌：mf、一个全音符滚奏、一个四分音符
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].filter((t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo");
  const toks = [...head, { kind: "dyn", id: 990, value: "mf" }, { kind: "note", id: 991, pitch: { step: "C", alter: 0, octave: 4 }, dur: 6720, lyric: null, art: ["roll"] }, { kind: "note", id: 992, pitch: { step: "C", alter: 0, octave: 4 }, dur: 1680, lyric: null }];
  m.set({ ...st, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: toks } }] }, caret: toks.length, sel: null });
});
await p.waitForTimeout(300);
const openInst = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForSelector(".inst-page .ip-body"); await p.waitForTimeout(200); };
/** 录音房这一刻会吃的这一轨的音符表（做一次「准备播放」，和点 |▶ 同一个准备；不经过播放钮）：只要滚奏那一段（最后那个四分音符之前）。 */
const hits = async () => (await p.evaluate(async () => { const ts = await window.__moonsinger.tracksNow(); const tr = ts?.find((x) => x.notes); return tr ? tr.notes.map((n) => [n.t0, n.t1, Math.round(n.vel * 127)]) : []; })).slice(0, -1);
await openInst();
check(!!(await p.$('.inst-page [data-v="rollvar:none"]')) && !!(await p.$('.inst-page [data-v="rollvar:hands"]')), "乐器页有「滚奏的变化（试验）」两格");
check(await p.$eval('.inst-page [data-v="rollvar:none"]', (e) => e.classList.contains("is-on")), "默认「没有（均匀）」亮着");
const plain = await hits();
check(plain.length >= 8 && plain.every((h, i) => i === 0 || Math.abs(h[0] - plain[i - 1][1]) < 1e-9) && new Set(plain.map((h) => h[2])).size === 1, "没有变化 = 一样长、一样重", JSON.stringify(plain.slice(0, 4)));
const lounge0 = await p.evaluate(() => JSON.stringify(window.__moonsinger.extras().lounge));
const undo0 = await p.evaluate(() => window.__moonsinger.history().past);
await p.click('.inst-page [data-v="rollvar:hands"]'); await p.waitForTimeout(200);
check(await p.$eval('.inst-page [data-v="rollvar:hands"]', (e) => e.classList.contains("is-on")) && await p.evaluate(() => window.__moonsinger.trialOn()), "选「左右手交替 + 小随机」= 那一格亮、试验开着");
const varied = await hits();
check(varied.length === plain.length, "同样多下", `${varied.length} vs ${plain.length}`);
check(varied.length > 0 && Math.abs(varied[0][0] - plain[0][0]) < 1e-9, "第一下不挪");
check(varied.some((h, i) => Math.abs(h[0] - plain[i][0]) > 1e-6) && new Set(varied.map((h) => h[2])).size > 1, "有的下挪了、力度不再一样", JSON.stringify(varied.slice(0, 4)));
check(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras().lounge)) === lounge0, "不进歌（休息室快照没变）");
check((await p.evaluate(() => window.__moonsinger.history().past)) === undo0, "不进撤销（撤销栈没多一步）");
await p.click('.inst-page [data-v="rollvar:none"]'); await p.waitForTimeout(200);
check(!(await p.evaluate(() => window.__moonsinger.trialOn())) && JSON.stringify(await hits()) === JSON.stringify(plain), "选回「没有」= 和原来逐下一样");
await p.click('.inst-page [data-v="rollvar:hands"]'); await p.waitForTimeout(200);
// 换歌复位
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="new"]'); await p.waitForTimeout(400);
const ask = await p.$('.offer [data-v="go"]'); if (ask) { await ask.click(); await p.waitForTimeout(400); }   // 改过没存：「不存，换」
check(!(await p.evaluate(() => window.__moonsinger.trialOn())), "换歌 = 试验选项回到「没有」");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
