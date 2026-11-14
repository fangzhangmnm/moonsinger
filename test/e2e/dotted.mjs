// test/e2e/dotted.mjs —— 真浏览器 E2E：长短旋钮带附点的档（键盘这一轮 v1，设计稿 ai-docs/20261113-keyboard-round-design.md 第三节）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）
// 守：3/4 里二分往长拨一档 = 附点二分（连音开着 = 关掉、说一句）、写出来的音就是这么长；6/8 里四分往长一档 = 附点四分、写出来这么长；
//     点开长短滚轮：带附点的那档连音那一列灰着，点它说为什么；旋钮面上带附点。截一张 6/8 的滚轮（MS_SHOTS 给目录才存）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dotted.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const R = `<note><rest/><duration>1</duration><type>quarter</type></note>`;
const xml = (beats, beatType) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${R.repeat(beats * 4 / beatType)}</measure><measure number="2">${R.repeat(beats * 4 / beatType)}</measure></part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 760 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
const said = () => p.$$eval(".notice-stack .notice", (es) => es.map((e) => e.textContent).join(" | "));
const clearNotes = () => p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
// 开一首这个拍号的歌，光标放在谱头后面，长短 / 连音设成给的
async function open(beats, beatType, len, tuplet = 0) {
  await p.evaluate((x) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(x))); }, xml(beats, beatType)); await p.waitForTimeout(250);
  await p.evaluate(([len, tuplet]) => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part], h = t.findIndex((x) => x.kind === "rest");
    m.set({ ...s, caret: h, sel: null, input: { ...s.input, len, tuplet } }); }, [len, tuplet]); await p.waitForTimeout(150);
  if (!(await p.$('[data-knob="unit"]'))) { await p.click("#padTab").catch(() => undefined); await p.waitForTimeout(200); }
}
const input = () => p.evaluate(() => { const i = window.__moonsinger.state().input; return { len: i.len, tuplet: i.tuplet }; });
const wheelKnob = async () => { const k = await p.locator('[data-knob="unit"]').boundingBox(); await p.mouse.move(k.x + k.width / 2, k.y + k.height / 2); await p.mouse.wheel(0, 120); await p.waitForTimeout(200); };
const lastWritten = () => p.evaluate(() => { const s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part][s.caret - 1]; return t ? `${t.kind}:${t.dur}` : "?"; });
const face = () => p.$eval('[data-knob="unit"] .kl', (e) => e.textContent);
const Q = 1680;
// 1. 3/4：二分 + 三连音 → 往长一档 = 附点二分，连音关掉、说一句
await open(3, 4, 2 * Q, 3); await clearNotes();
await wheelKnob();
let i = await input();
check(i.len === 3 * Q && i.tuplet === 0, "3/4：二分往长一档 = 附点二分，连音关掉", JSON.stringify(i));
check(/连音关掉了/.test(await said()), "说一句「带附点的长短不连音」", await said());
check((await face()).includes(""), "旋钮面上带附点");
await p.mouse.move(5, 5); await p.keyboard.press("Digit1"); await p.waitForTimeout(150);
check(await lastWritten() === `note:${3 * Q}`, "写出来的音 = 附点二分", await lastWritten());
// 2. 6/8：四分 → 往长一档 = 附点四分，写出来这么长
await open(6, 8, Q);
await wheelKnob(); i = await input();
check(i.len === 1.5 * Q, "6/8：四分往长一档 = 附点四分", JSON.stringify(i));
await p.mouse.move(5, 5); await p.keyboard.press("Digit1"); await p.waitForTimeout(150);
check(await lastWritten() === `note:${1.5 * Q}`, "写出来的音 = 附点四分", await lastWritten());
// 3. 点开长短滚轮：6/8 的档 + 连音那一列灰着
await clearNotes(); await p.click('[data-knob="unit"]'); await p.waitForTimeout(250);
const cols = await p.$$eval(".drum .drum-col", (cs) => cs.map((c) => ({ n: c.querySelectorAll(".smufl").length, off: c.classList.contains("is-off") })));
check(cols.length === 2 && cols[0].n === 6 && cols[1].off, "滚轮：6/8 的六档（32 16 8 4 附点4 附点2）、连音那一列灰着", JSON.stringify(cols));
if (process.env.MS_SHOTS) await p.screenshot({ path: `${process.env.MS_SHOTS}/knob-6-8.png` });
await clearNotes(); const tb = await p.locator(".drum .drum-col").nth(1).boundingBox(); await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2); await p.waitForTimeout(200);
check(/带附点的长短不连音/.test(await said()) && (await input()).tuplet === 0, "点灰着的连音列 = 说为什么、不连音", await said());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
