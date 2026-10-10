// test/e2e/singer-delete.mjs —— 真浏览器 E2E：纸上不删歌手；歌手管理（录音室）里一张纸都不在的才能删、能撤销。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「在纸上不应该可以直接删歌手，这个功能去掉，只有没引用的时候才可以在歌手管理里面删」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/singer-delete.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
// 加一位新歌手（只在这张纸上）
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200);
check(!(await p.$('.track-card [data-v="delpart"]')), "谱上的歌手牌里没有「删掉」");
await p.click(".track-card [data-v=add]"); await p.waitForTimeout(150); await p.click(".track-card [data-v=addnew]"); await p.waitForTimeout(300);
const parts = () => p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => x.id).join(","));
check((await parts()).split(",").length === 2, "两位歌手", await parts());
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
// 歌手管理 = 录音室（从歌手牌底下进）
const openStudio = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="studio"]'); await p.waitForTimeout(250); };   // 歌手牌底下「歌手管理（录音室）…」（三条杠里不放录音室）
await openStudio();
check(await p.$$eval(".studio .strip [data-v=delpart]", (e) => e.length) === 0, "都在纸上 = 都不能删");
check(/在 1 张纸上/.test(await p.$eval(".studio .strip:not(.master):not(.bus):not(.add-bus) >> nth=0", (e) => e.textContent)), "写着在几张纸上");   // 第一位歌手的卡片（v0.10.9 起卡片顺序 = 总轨 → 混音轨 →「＋ 混音轨」→ 歌手）
await p.click('.studio [data-v="back"]'); await p.waitForTimeout(200);
// 第二位从这张纸上去掉 → 哪张纸都没有 → 录音室里能删
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), p2 = st.song.parts[1].id; m.set({ ...st, at: { ...st.at, part: p2 } }); });
await p.waitForTimeout(150);
await p.click("#score text.part-name >> nth=1"); await p.waitForTimeout(200);
await p.click('.track-card [data-v="droptrack"]'); await p.waitForTimeout(250);
await openStudio();
check(await p.$$eval(".studio .strip [data-v=delpart]", (e) => e.length) === 1, "哪张纸都没有的那位 = 能删");
await p.click(".studio .strip [data-v=delpart]"); await p.waitForTimeout(250);
check((await parts()).split(",").length === 1, "删掉了", await parts());
await p.click('.studio [data-v="back"]'); await p.waitForTimeout(150);
await p.click("#undoBtn"); await p.waitForTimeout(200);
check((await parts()).split(",").length === 2, "撤销能找回来", await parts());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
