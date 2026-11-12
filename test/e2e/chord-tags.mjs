// test/e2e/chord-tags.mjs —— 真浏览器 E2E：和弦标级数（v0.16.11；谱面分家第三刀 2026-11-11 起是这首歌的设置，在纸的设置「看谱」里，原来在设置「乐理助手」里、存在设备上）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「我根本看不懂我自己摸的和弦，摸出来是几级和弦」「和弦上标级数…写个深模块」）。
// 守：默认开（v0.16.12，user「和弦标级数默认开？」；第三刀：歌里没写 = 标）= 叠音的和弦上方写级数（G B D F = V7、C E G = I）；点了 = 候选小菜单（排第一的是谱上那个）；不动排版（音的位置一样）；
//   关 = 没了、写进歌里（chordTags: false）、能撤销；设置「乐理助手」里只剩一行说搬到哪了；设备上不再记。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/chord-tags.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pickOnPage } from "./dd.mjs";   // 页面设置的下拉（7-C）：先翻到那一页再选
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 谱里放两个叠音：G7（G3 B3 D4 F4）、C 大三和弦（C4 E4 G4）
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part], P = (step, octave) => ({ step, alter: 0, octave });
  const toks = [...t, { kind: "note", id: s.nextId, pitch: P("F", 4), dur: 480, lyric: null, chord: [P("D", 4), P("B", 3), P("G", 3)] }, { kind: "note", id: s.nextId + 1, pitch: P("G", 4), dur: 480, lyric: null, chord: [P("E", 4), P("C", 4)] }];
  m.set({ ...s, nextId: s.nextId + 2, song: { ...s.song, papers: [{ ...paper, tracks: { ...paper.tracks, [s.at.part]: toks } }, ...s.song.papers.slice(1)] } });
});
await p.waitForTimeout(300);
const tags = () => p.$$eval("#score text.chord-tag", (ts) => ts.map((t) => t.textContent).join(" "));
const xs = () => p.evaluate(() => window.__moonsinger.layout().notes.map((n) => Math.round(n.x)).join(","));
const x0 = await xs();
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForSelector(".settings-card"); };
const setChord = async (v) => { await openSheet(); await pickOnPage(p, '.settings-card [data-pg="ct"]', v); await p.waitForTimeout(200); await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(250); };
const songTags = () => p.evaluate(() => window.__moonsinger.state().song.chordTags);
check((await tags()) === "V7 I", "默认开 = G B D F 写 V7、C E G 写 I", await tags());
await setChord("off");
check((await tags()) === "" && (await xs()) === x0, "关 = 没了，音的位置一样（不动排版）", `${x0} / ${await xs()}`);
check((await songTags()) === false, "关 = 写进歌里（chordTags: false）", String(await songTags()));
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await tags()) === "V7 I" && (await songTags()) === undefined, "撤销 = 又标上了（进撤销栈）", `${await tags()} / ${await songTags()}`);
await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(250);
check((await tags()) === "", "重做 = 又没了", await tags());
await setChord("on");
check((await tags()) === "V7 I", "再开 = 又有了", await tags());
const tb = await p.evaluate(() => { const r = document.querySelector("#score text.chord-tag")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
await p.mouse.click(tb.x, tb.y); await p.waitForTimeout(250);
const best = await p.evaluate(() => document.querySelector(".ctx-menu.chord-info .chord-cand.is-best b")?.textContent ?? null);
check(best === "V7", "点「V7」= 候选小菜单，排第一的就是它", String(best));
check((await p.evaluate(() => document.querySelectorAll(".ctx-menu.chord-info .chord-cand").length)) >= 1, "列出候选");
await p.keyboard.press("Escape"); await p.mouse.click(5, 300); await p.waitForTimeout(150);
await setChord("off");
check(!(await p.evaluate(() => { try { return Object.keys(localStorage).some((k) => k.endsWith(":chord-tags")); } catch { return false; } })), "设备上不再记（没有写 chord-tags 这个键）");
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".settings-card"); await p.click('[data-tab="a11y"]'); await p.waitForTimeout(100);
const a11y = await p.evaluate(() => ({ select: !!document.querySelector('.settings-card [data-set="chord"], .settings-card [data-set="view"]'), text: document.querySelector('.settings-card [data-page="a11y"]')?.textContent ?? "" }));
check(!a11y.select && /纸的设置/.test(a11y.text), "设置「乐理助手」里没有开关了，只剩一行说搬到纸的设置里", JSON.stringify(a11y).slice(0, 160));
await p.click('.settings-card [data-v="close"]').catch(() => {}); await p.keyboard.press("Escape");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nchord-tags: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
