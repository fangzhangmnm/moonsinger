// test/e2e/part-toggles.mjs —— 真浏览器 E2E：声部的显示 / 出声开关（眼睛 / 喇叭）。
// created 2026-11-08 by Claude Opus 5.5（v0.16.22：谱上名字上面的两颗大钮）。
// 2026-11-12 重写（施工单第 12 条 12-1 / 12-2，user「声部上面的两个钮还是难看，而且不对齐，打印的时候会很奇怪，能不能排版的时候不看这些钮。然后这些钮找个聪明的地方放」
//   「乐器设置和换乐器的大按钮在同一行比较好」）：两颗钮从谱上拿掉，放到点声部名弹出的小卡最上面；点 = 隐藏 / 静音，长按（电脑右键）= 只看它 / 独奏（同原来）。
// 守：谱上没有这两颗钮；小卡最上面两颗大钮，换乐器 / 乐器设置同一行一样宽；点喇叭 = 静音（录音房马上收到、名字下面角标「静音」、图标换）、再点 = 出声；
//   点眼睛 = 隐藏（不排、不占地方，「隐藏 N」冒出来）；长按眼睛 = 只看它；右键喇叭 = 独奏；小卡切完还开着、重画。
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
const cardIcons = () => p.evaluate(() => [...document.querySelectorAll(".part-card .tc-tg use")].map((u) => u.getAttribute("href") ?? "").join(","));
const tgBox = (kind) => p.evaluate((kind) => { const r = document.querySelector(`.part-card [data-v="tg:${kind}"]`)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, kind);
const openCard = async (nth = 0) => { await p.click(`#score text.part-name >> nth=${nth}`); await p.waitForTimeout(250); };
const P1 = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__ch = []; const ch = e.channel.bind(e); e.channel = (id, prm) => { window.__ch.push([id, !!prm.mute, !!prm.solo]); return ch(id, prm); }; });

check((await p.$$("#score .score-overlay .ov-tg")).length === 0, "谱上没有眼睛 / 喇叭了（排版和覆盖层都不放）");
await openCard(0);
check(!!(await p.$(".part-card")), "点声部名 = 小卡");
const firstTwo = await p.evaluate(() => [...document.querySelectorAll(".part-card [data-v]")].slice(0, 2).map((e) => e.dataset.v).join(","));
check(firstTwo === "tg:hidden,tg:muted", "小卡最上面两颗大钮：显示、出声", firstTwo);
const tiles = await p.evaluate(() => ["swap", "inst"].map((v) => { const r = document.querySelector(`.part-card [data-v="${v}"]`).getBoundingClientRect(); return { w: r.width, top: r.top }; }));
check(Math.abs(tiles[0].w - tiles[1].w) < 1 && Math.abs(tiles[0].top - tiles[1].top) < 1, "换乐器、乐器设置同一行、一样宽", JSON.stringify(tiles));
// 喇叭：点 = 静音；名字下面角标「静音」；小卡还开着、钮的图标换了
await p.click('.part-card [data-v="tg:muted"]'); await p.waitForTimeout(250);
check((await pv(P1)).muted && (await p.evaluate(() => window.__ch.some(([, m]) => m))), "点喇叭 = 静音、录音房马上收到");
check(/静音/.test(await badges()), "谱上名字下面角标「静音」（不印）", await badges());
check(!!(await p.$(".part-card")) && /volume-mute/.test(await cardIcons()), "小卡还开着、喇叭换成静音的", await cardIcons());
await p.click('.part-card [data-v="tg:muted"]'); await p.waitForTimeout(250);
check(!(await pv(P1)).muted && !/静音/.test(await badges()), "再点 = 出声、角标没了");
// 右键喇叭 = 独奏
{ const c = await tgBox("muted"); await p.mouse.click(c.x, c.y, { button: "right" }); await p.waitForTimeout(250); }
check((await pv(P1)).solo && /独奏/.test(await badges()) && /volume-solo/.test(await cardIcons()), "右键喇叭 = 独奏（角标「独奏」、图标换）");
{ const c = await tgBox("muted"); await p.mouse.click(c.x, c.y, { button: "right" }); await p.waitForTimeout(250); }
check(!(await pv(P1)).solo, "再右键 = 独奏关掉");
// 长按眼睛 = 只看它（别人隐藏）
{ const c = await tgBox("hidden"); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(250); }
check((await pv(P1)).only && !(await shown()).includes("P9") && /visibility-only/.test(await cardIcons()), "长按眼睛 = 只看它（别人隐藏）", await shown());
check(!(await pv(P1)).hidden, "长按抬手不再算一次点（没有顺手隐藏自己）");
{ const c = await tgBox("hidden"); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(250); }
check(!(await pv(P1)).only && (await shown()).includes("P9"), "再长按 = 只看关掉", await shown());
// 眼睛：点 = 隐藏第二位（从它自己的小卡）
await p.mouse.click(5, 5); await p.waitForTimeout(150);
await openCard(1);
await p.click('.part-card [data-v="tg:hidden"]'); await p.waitForTimeout(250);
check((await pv("P9")).hidden && !(await shown()).includes("P9") && !!(await p.$("#score .score-overlay .ov-hidden")), "点眼睛 = 这位不排、不占地方，曲段那一条上冒出「隐藏 N」", await shown());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npart-toggles: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
