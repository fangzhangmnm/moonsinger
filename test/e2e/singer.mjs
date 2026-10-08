// test/e2e/singer.mjs —— 真浏览器 E2E：声部就是歌手——歌手牌小卡「交给…」换绑（交给新歌手 / 交还 / 对调）、「＋ 加歌手…」只加在这张纸、撤销一步。
// created 2026-10-08 by Claude Opus 5.5（user「嗯声部就是歌手」「新歌手只出现在当前这张纸嗯」「这一段交给别的歌手 就是我刚才说的换绑」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/singer.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(200);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i + 4}`); await p.waitForTimeout(40); }
const who = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers.map((x) => Object.keys(x.tracks).sort().join("+")).join(" | "); });
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers.map((x) => Object.entries(x.tracks).map(([k, t]) => `${k}:${t.filter((u) => u.kind === "note").length}`).sort().join("+")).join(" | "); });
check(await who() === "P1 | P1", "两张纸都是 P1", await who());
// 第二张纸上的歌手牌（光标所在那张：本段视图只画它）
const openCard = async () => { await p.click("#score text.part-name.focus, #score text.part-name >> nth=0"); await p.waitForTimeout(200); };
await openCard();
check(await p.$(".track-card [data-v=give]") != null, "小卡里有「交给…」");
await p.click(".track-card [data-v=give]"); await p.waitForTimeout(150);
const giveList = await p.$$eval(".track-card .tc-list .btn", (bs) => bs.map((x) => x.textContent));
check(giveList.join(",") === "＋ 新歌手…", "只有一位歌手：交给… 只有「新歌手」", giveList.join(","));
await p.click(".track-card [data-v=givenew]"); await p.waitForTimeout(300);
check(await who() === "P1 | P2", "交给新歌手：第二张纸那一行归 P2，第一张照旧 P1", await who());
check(await notes() === "P1:3 | P2:2", "音原样（第二张两个音跟着走）", await notes());
check(await p.evaluate(() => window.__moonsinger.state().song.parts.length) === 2, "全曲两位歌手");
const flatP1 = await p.evaluate(() => window.__moonsinger.state() && window.__moonsinger.flatten().tokens.filter((t) => t.kind === "note").length);
// 关掉乐器页
await p.locator('[data-v="back"]:visible').first().click(); await p.waitForTimeout(250);
// 第二张纸：P2 → 交给 P1（P1 不在这张纸上 = 挪回去）
await openCard();
await p.click(".track-card [data-v=give]"); await p.waitForTimeout(150);
await p.click('.track-card [data-v="give:P1"]'); await p.waitForTimeout(200);
check(await who() === "P1 | P1", "交给 P1：第二张又归 P1", await who());
check(await notes() === "P1:3 | P1:2", "音还在", await notes());
// ＋ 加歌手：P2 加到第二张（只这张）
await openCard();
await p.click(".track-card [data-v=add]"); await p.waitForTimeout(150);
const addList = await p.$$eval(".track-card .tc-list .btn", (bs) => bs.map((x) => x.textContent));
check(addList.length === 2 && addList[1] === "＋ 新歌手…", "加歌手：列出不在这张纸上的那位 + 新歌手", addList.join(","));
await p.click(".track-card .tc-list .btn >> nth=0"); await p.waitForTimeout(200);
check(await who() === "P1 | P1+P2", "P2 只加在第二张", await who());
// 第二张：P1 交给 P2（P2 在这张纸上）= 对调
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { paper: s.at.paper, part: "P1" } }); }); await p.waitForTimeout(150);
await openCard();
await p.click(".track-card [data-v=give]"); await p.waitForTimeout(150);
const swapLabel = await p.$eval('.track-card [data-v="give:P2"]', (e) => e.textContent);
check(/对调/.test(swapLabel), "对方在这张纸上：标着「对调」", swapLabel);
await p.click('.track-card [data-v="give:P2"]'); await p.waitForTimeout(200);
check(await notes() === "P1:3 | P1:0+P2:2", "对调：两个音归 P2、P1 那行空的", await notes());
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check(await notes() === "P1:3 | P1:2+P2:0", "撤销一步回来", await notes());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`    （交给新歌手之后 P1 压平的音数 ${flatP1}）`);
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
