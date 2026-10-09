// test/e2e/groove.mjs —— 真浏览器 E2E：风格记号（拍子轻重）——pad 记号页「风格」放在光标前那个音上、马上开小菜单；换风格 / 幅度 / 删；
// 小菜单明说（这张纸上谁跟多少、摇摆还没接）；出声：流行 = 第二拍比第一拍响（月读换成一段平的声音，看音量曲线乘上去的样子）。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「点开之后可以设置具体的细节」「预设可以…做成数据驱动的」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/groove.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, input: { ...st.input, unit: 3 } }); });   // 四分音符
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, caret: 3 }); });   // 光标到最前面 = 放在第一个音上
await p.click('.mode-seg [data-mode="symbols"]'); await p.waitForTimeout(100); await p.click('.pad-head [data-sympage="mark"]'); await p.waitForTimeout(100);
await p.click('[data-sym="groove"]'); await p.waitForTimeout(250);
const grooves = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "groove").map((t) => `${t.style}${t.amount ? "×" + t.amount : ""}`).join(","); });
check(await grooves() === "classical", "放了一个风格记号（先放古典）", await grooves());
check(!!(await p.$(".groove-menu")), "马上开了它的小菜单");
check(await p.$$eval("#score text.groove-mark", (e) => e.map((x) => x.textContent).join()) === "Style: Classical", "谱上画「Style: Classical」");
await p.click('.groove-menu [data-v="style:pop"]'); await p.waitForTimeout(250);
check(await grooves() === "pop", "换成流行");
check(!!(await p.$(".groove-menu")) && (await p.$eval('.groove-menu [data-v="style:pop"]', (e) => e.classList.contains("is-on"))), "换了接着开着（看说明）");
// 两小节一轮（v2：波萨 / 拉丁；2026-10-09）：只有这种风格出「3-2 / 2-3」；点 2-3 = 错开一小节
check(!(await p.$(".groove-menu .ctx-phase")), "流行：没有 3-2 / 2-3");
await p.click('.groove-menu [data-v="style:latin"]'); await p.waitForTimeout(250);
check(!!(await p.$(".groove-menu .ctx-phase")), "拉丁：出「3-2 / 2-3」");
await p.click('.groove-menu [data-v="shift:1"]'); await p.waitForTimeout(250);
check(await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].find((t) => t.kind === "groove")?.shift === true; }), "点 2-3 = 记号带上错开一小节");
check(/2-3/.test(await p.$$eval("#score text.groove-mark", (e) => e.map((x) => x.textContent).join())), "谱上写「… 2-3」");
await p.click('.groove-menu [data-v="style:pop"]'); await p.waitForTimeout(250);
const hints = await p.$$eval(".groove-menu .ctx-hint", (e) => e.map((x) => x.textContent).join(" | "));
check(/这张纸上：.*跟 30%/.test(hints), "明说这张纸上的歌手跟多少（月读 = 人声 30%）", hints);
await p.click('.groove-menu [data-v="amount:2"]'); await p.waitForTimeout(250);
check(await grooves() === "pop×2", "幅度 ×2");
check(await p.$$eval("#score text.groove-mark", (e) => e.map((x) => x.textContent).join()) === "Style: Pop ×2", "谱上「Style: Pop ×2」");
await p.click('.groove-menu [data-v="style:swing"]'); await p.waitForTimeout(250);
check(/摇摆.*还没接/.test(await p.$$eval(".groove-menu .ctx-hint", (e) => e.map((x) => x.textContent).join(" | "))), "Swing：明说摇摆（时值）还没接");
await p.click('.groove-menu [data-v="style:pop"]'); await p.waitForTimeout(250);
await p.click('.groove-menu [data-v="amount:1"]'); await p.waitForTimeout(250);
await p.mouse.click(5, 880); await p.waitForTimeout(150);
check(!(await p.$(".groove-menu")), "点外面 = 收起");
// 出声：月读唱一段平的声音（换掉）→ 音量曲线里流行的轻重：第二拍音头比第一拍音头响
const lv = await p.evaluate(async () => {
  const m = window.__moonsinger;
  m.singer.sing = async () => ({ samples: new Float32Array(48000 * 4).fill(0.1), sr: 48000 });
  const got = await m.renderMix(); if (!got) return null;   // 离线混音（录音房同一份数学；2026-10-09 实时试听刀 1）：samples[0] = 谱上第 start 秒（= −0.5，月读的提前量）
  const at = (sec) => Math.abs(got.samples[Math.round((sec - got.start) * got.sr)]), q = 60 / 90;
  return [at(0.03), at(q + 0.03), at(2 * q + 0.03), at(q + 0.4)];
});
check(!!lv && lv[1] > lv[0] * 1.02 && Math.abs(lv[2] - lv[0]) < lv[0] * 1e-4, "流行：第二拍音头比第一拍响（第三拍 = 第一拍；相对误差，月读分段唱后整首归一化过）", JSON.stringify(lv));
check(!!lv && lv[3] < lv[1], "音头过了回到原来的音量", JSON.stringify(lv));
// 删
const gx = await p.$eval("#score text.groove-mark", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 6, y: r.y + r.height / 2 }; });
await p.mouse.click(gx.x, gx.y); await p.waitForTimeout(250);
await p.click('.groove-menu [data-v="del"]'); await p.waitForTimeout(200);
check(await grooves() === "" && (await p.$$eval("#score text.groove-mark", (e) => e.length)) === 0, "删除 = 记号没了");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
