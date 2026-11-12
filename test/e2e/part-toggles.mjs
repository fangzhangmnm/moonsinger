// test/e2e/part-toggles.mjs —— 真浏览器 E2E：声部的显示 / 出声开关（点声部名弹出的小卡上的四颗）。
// created 2026-11-08 by Claude Opus 5.5（v0.16.22：谱上名字上面的两颗大钮）。
// 2026-11-12 重写（施工单第 12 条 12-1 / 12-2，user「声部上面的两个钮还是难看，而且不对齐，打印的时候会很奇怪，能不能排版的时候不看这些钮。然后这些钮找个聪明的地方放」
//   「乐器设置和换乐器的大按钮在同一行比较好」）：两颗钮从谱上拿掉，放到点声部名弹出的小卡最上面。
// 2026-11-12 再改（12-2 补，user 看了图「如果收进去的话，那么可以变回四个按钮的情况，这样好懂」「换乐器和乐器设置加图标」「声部管理和删除也加」）：
//   四颗明摆着的开关（隐藏、只看它、静音、独奏），开着的亮着；没有长按 / 右键（同一件事只留一种做法）；放不下按「显示」「出声」两组整组换行。
// 守：谱上没有钮；小卡最上面四颗；每颗点 = 切它自己那一样（录音房马上收到、角标、亮着）；右键 / 长按不切；窄屏两组不拆开；换乐器 / 乐器设置同一行一样宽、四颗大钮都有图标。
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part];   // 第二个声部（同一张纸上）
  m.set({ ...s, song: { ...s.song, parts: [...s.song.parts, { id: "P9", role: "r9", mic: "m9" }], papers: [{ ...paper, tracks: { ...paper.tracks, P9: t.map((x) => ({ ...x })) } }, ...s.song.papers.slice(1)] } }); });
await p.waitForTimeout(300);
const pv = (part) => p.evaluate((part) => window.__moonsinger.desk().parts?.[part] ?? {}, part);
const shown = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((r) => r.part))].join(","));
const badges = () => p.evaluate(() => window.__moonsinger.layout().prims.filter((x) => /part-badge/.test(x.cls ?? "")).map((x) => x.s).join(","));
const tgOn = () => p.evaluate(() => [...document.querySelectorAll(".part-card .tc-tg.on")].map((e) => e.dataset.v).join(","));
const tgBox = (kind) => p.evaluate((kind) => { const r = document.querySelector(`.part-card [data-v="tg:${kind}"]`)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, kind);
const openCard = async (nth = 0) => { await p.click(`#score text.part-name >> nth=${nth}`); await p.waitForTimeout(250); };
const P1 = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__ch = []; const ch = e.channel.bind(e); e.channel = (id, prm) => { window.__ch.push([id, !!prm.mute, !!prm.solo]); return ch(id, prm); }; });

check((await p.$$("#score .score-overlay .ov-tg")).length === 0, "谱上没有眼睛 / 喇叭了（排版和覆盖层都不放）");
await openCard(0);
check(!!(await p.$(".part-card")), "点声部名 = 小卡");
const firstFour = await p.evaluate(() => [...document.querySelectorAll(".part-card [data-v]")].slice(0, 4).map((e) => e.dataset.v).join(","));
check(firstFour === "tg:hidden,tg:only,tg:muted,tg:solo", "小卡最上面四颗：隐藏、只看它、静音、独奏", firstFour);
const tops = await p.evaluate(() => ["hidden", "only", "muted", "solo"].map((k) => Math.round(document.querySelector(`.part-card [data-v="tg:${k}"]`).getBoundingClientRect().top)));
check(new Set(tops).size === 1, "宽的时候一排四颗", tops.join(","));
const tiles = await p.evaluate(() => ["swap", "inst"].map((v) => { const r = document.querySelector(`.part-card [data-v="${v}"]`).getBoundingClientRect(); return { w: r.width, top: r.top }; }));
check(Math.abs(tiles[0].w - tiles[1].w) < 1 && Math.abs(tiles[0].top - tiles[1].top) < 1, "换乐器、乐器设置同一行、一样宽", JSON.stringify(tiles));
const icons = await p.evaluate(() => ["swap", "inst", "parts", "delpart"].map((v) => { const u = document.querySelector(`.part-card [data-v="${v}"] use`)?.getAttribute("href"); return u && document.querySelector(u) ? u : `${v}:没有`; }).join(","));
check(icons === "#instrument-swap,#sliders,#layers-stack,#trash-can", "四颗大钮都有图标、页面里有这几个图标", icons);
// 静音：点 = 静音、亮着、角标；再点 = 出声
await p.click('.part-card [data-v="tg:muted"]'); await p.waitForTimeout(250);
check((await pv(P1)).muted && (await p.evaluate(() => window.__ch.some(([, m]) => m))), "点静音 = 静音、录音房马上收到");
check(/静音/.test(await badges()), "谱上名字下面角标「静音」（不印）", await badges());
check(!!(await p.$(".part-card")) && (await tgOn()) === "tg:muted", "小卡还开着、静音那颗亮着", await tgOn());
await p.click('.part-card [data-v="tg:muted"]'); await p.waitForTimeout(250);
check(!(await pv(P1)).muted && !/静音/.test(await badges()) && (await tgOn()) === "", "再点 = 出声、角标没了、不亮");
// 独奏
await p.click('.part-card [data-v="tg:solo"]'); await p.waitForTimeout(250);
check((await pv(P1)).solo && /独奏/.test(await badges()) && (await tgOn()) === "tg:solo", "点独奏 = 独奏（角标「独奏」、亮着）");
await p.click('.part-card [data-v="tg:solo"]'); await p.waitForTimeout(250);
check(!(await pv(P1)).solo, "再点 = 独奏关掉");
// 只看它
await p.click('.part-card [data-v="tg:only"]'); await p.waitForTimeout(250);
check((await pv(P1)).only && !(await shown()).includes("P9") && (await tgOn()) === "tg:only", "点只看它 = 别人缩成细行", await shown());
await p.click('.part-card [data-v="tg:only"]'); await p.waitForTimeout(250);
check(!(await pv(P1)).only && (await shown()).includes("P9"), "再点 = 都看", await shown());
// 长按 / 右键不再有另一种意思（同一件事只留一种做法）
{ const c = await tgBox("muted"); await p.mouse.click(c.x, c.y, { button: "right" }); await p.waitForTimeout(250); }
check(!(await pv(P1)).muted && !(await pv(P1)).solo, "右键静音那颗 = 什么都不切");
{ const c = await tgBox("hidden"); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(250); }
check(!(await pv(P1)).only && (await pv(P1)).hidden, "长按隐藏那颗 = 只是点了一下（隐藏），不是只看它");
await p.click('.part-card [data-v="tg:hidden"]'); await p.waitForTimeout(250);
check(!(await pv(P1)).hidden, "再点 = 显示");
// 隐藏第二位（从它自己的小卡）
await p.mouse.click(5, 5); await p.waitForTimeout(150);
await openCard(1);
await p.click('.part-card [data-v="tg:hidden"]'); await p.waitForTimeout(250);
check((await pv("P9")).hidden && !(await shown()).includes("P9") && !!(await p.$("#score .score-overlay .ov-hidden")), "点隐藏 = 这位不排、不占地方，曲段那一条上冒出「隐藏 N」", await shown());
// 窄屏：四颗放不下 = 两组各一排，不拆开一组
await p.mouse.click(5, 5); await p.waitForTimeout(150);
await p.setViewportSize({ width: 300, height: 800 }); await p.waitForTimeout(300);
await openCard(0);
const nt = await p.evaluate(() => Object.fromEntries(["hidden", "only", "muted", "solo"].map((k) => [k, Math.round(document.querySelector(`.part-card [data-v="tg:${k}"]`).getBoundingClientRect().top)])));
check(nt.hidden === nt.only && nt.muted === nt.solo, "窄屏：隐藏 / 只看它同一排、静音 / 独奏同一排（整组换行）", JSON.stringify(nt));
const clipped = await p.evaluate(() => [...document.querySelectorAll(".part-card .tc-tg span")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent).join(","));
check(clipped === "", "窄屏：四颗的字都没被截", clipped);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npart-toggles: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
