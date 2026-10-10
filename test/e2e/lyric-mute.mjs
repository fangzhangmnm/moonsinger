// test/e2e/lyric-mute.mjs —— 真浏览器 E2E：台上这位唱不出来的歌词画灰（月读：汉字 / 一个音两拍 / 字母），歌手牌小卡说几个、为什么，歌词框上面小字说为什么。
// created 2026-10-08 by Claude Opus 5.5（user「不能成功发音识别的歌词也标灰，我觉得这个可以变成这个项目的纪律了哈哈」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/lyric-mute.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), TPQ = 1680, head = s.song.papers[0].tracks[s.at.part].slice(0, 3);
  let id = 9100; const n = (lyric) => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ, lyric });
  const toks = [...head, n("な"), n("か"), n("星"), n("ラー"), n("la"), n("よ"), n("し")];
  const papers = s.song.papers.map((pp, i) => (i === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp));
  m.set({ ...s, song: { ...s.song, papers }, caret: toks.length, nextId: id });
});
await p.waitForTimeout(300);
const muted = await p.$$eval("#score text.lyric.lyric-mute", (es) => es.map((e) => e.textContent).join(","));
check(muted === "星,ラー,la", "谱上画灰的字（默认上场 = 月读）", muted);
await p.click("#score text.part-name"); await p.waitForTimeout(200);
const warn = await p.$eval(".track-card .tc-warn", (e) => e.textContent).catch(() => "");
check(!!warn, "歌手牌小卡里说了", warn);
await p.keyboard.press("Escape"); await p.mouse.click(1050, 700); await p.waitForTimeout(150);
await p.evaluate(() => window.__moonsinger.setMode("lyrics"));   // v0.9.19：歌词框只在「词」模式里点得开
// 点「星」那个字 = 歌词框 + 上面的小字
const star = await p.$$eval("#score text.lyric", (es) => { const e = es.find((x) => x.textContent === "星"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(star.x, star.y); await p.waitForTimeout(250);
const hint = await p.$eval(".lyric-hint", (e) => (e.hidden ? "" : e.textContent));
check(/汉字/.test(hint), "歌词框上面的小字说为什么", hint);
// 不唱字的声部（换成元音版）：空着的歌词位点了不开框、说一句；已经写了的字点开照样能改 / 删（user 2026-10-10「wishlist 不支持唱歌的track可以删歌词，但是不会误点创建歌词文本框」）
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), toks = s.song.papers[0].tracks[s.at.part].slice(); const i = toks.findIndex((t) => t.kind === "note" && t.lyric === "よ"); toks[i] = { ...toks[i], lyric: null }; m.set({ ...s, song: { ...s.song, papers: s.song.papers.map((pp, k) => (k === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp)) } }); });
await p.waitForTimeout(150);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const vs = await p.$$eval('[data-v^="cand:"]', (es) => es.map((e) => ({ v: e.dataset.v, t: e.textContent })));
const vowel = vs.find((x) => /元音/.test(x.t));
check(!!vowel, "乐器页里有元音版这个候选", JSON.stringify(vs));
if (vowel) await p.click(`[data-v="${vowel.v}"]`);
await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(250);
await p.evaluate(() => window.__moonsinger.setMode("lyrics")); await p.waitForTimeout(100);
const slot = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), s = m.state(), toks = s.song.papers[0].tracks[s.at.part], i = toks.findIndex((t) => t.kind === "note" && t.lyric === null), n = L.notes.find((q) => q.index === i), sc = document.querySelector("#score .sheet").getBoundingClientRect(); return n ? { x: sc.left + L.pageX.left + n.x + n.w / 2, y: sc.top + L.lyricY(n.system) } : null; });
await p.mouse.click(slot.x, slot.y); await p.waitForTimeout(250);
const open1 = await p.$eval(".lyric-input", (e) => !e.hidden).catch(() => false);
check(!open1, "元音版：点空着的歌词位 = 不开框");
check(await p.evaluate(() => /只哼/.test(document.body.innerText)), "说了一句为什么（元音版只哼）");
const na = await p.$$eval("#score text.lyric", (es) => { const e = es.find((x) => x.textContent === "な"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(na.x, na.y); await p.waitForTimeout(250);
check(await p.$eval(".lyric-input", (e) => !e.hidden && e.value === "な").catch(() => false), "已经写了的字点开照样能改 / 删");
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
