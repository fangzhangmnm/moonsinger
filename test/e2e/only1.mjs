// test/e2e/only1.mjs —— 真浏览器 E2E：纸的设置「显示 · 只看一号轨」（v0.9.29；user 2026-10-10「然后视图加一个只看一号轨的功能」）。
//   = 全曲第一位歌手的「只看它」：别的歌手缩成细行；再点 = 都看；和歌手牌那个是同一个开关。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/only1.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { ddOptions, ddValue, pickOnPage } from "./dd.mjs";   // 页面设置的下拉（7-C）：先翻到那一页再选
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const part = (id, o) => `<part id="${id}"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("C", o)}${N("D", o)}${N("E", o)}${N("F", o)}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>${part("P1", 5)}${part("P2", 4)}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
const shownParts = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((s) => s.part))].join(","));
check((await shownParts()) === "P1,P2", "两位歌手都画着", await shownParts());
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForTimeout(200); };
await openSheet();
check(!!(await p.$('[data-pg="only1"]')), "页面设置里有「只看一号轨」");
await pickOnPage(p, '[data-pg="only1"]', "on"); await p.waitForTimeout(200);
check((await shownParts()) === "P1", "点了 = 只画一号轨（别的缩成细行）", await shownParts());
check((await ddValue(p, '[data-pg="only1"]')) === "on", "下拉里是「只看…」");
await pickOnPage(p, '[data-pg="only1"]', "off"); await p.waitForTimeout(200);
check((await shownParts()) === "P1,P2", "再点 = 都看", await shownParts());
// 歌词怎么排（v0.9.40；user「先试下你说的两个歌词开关吧，approved」）：按歌词（默认）/ 按节奏；进歌里、能撤销
check((await ddValue(p, '[data-pg="lyr"]')) === "rhythm" && (await p.$eval('[data-pg="lyr"]', (e) => e.textContent ?? "")).includes("按节奏"), "（第 21 条：新歌写下来的「按节奏」）页面设置里有歌词两种排法；新歌跟着软件，现在是「按节奏」（user「默认用修歌词的那个排版方式吧」；17-1）");
await pickOnPage(p, '[data-pg="lyr"]', "lyrics"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.lyricFit)) === "lyrics" && (await ddValue(p, '[data-pg="lyr"]')) === "lyrics", "选「按歌词」= 歌里记着、下拉跟着");
await p.keyboard.press("Escape"); await p.mouse.click(5, 880); await p.waitForTimeout(150);
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.lyricFit)) === "rhythm", "撤销 = 回到进门时写下来的「按节奏」（第 21 条）");
// 小节号（v0.9.42）：纸的设置里「每行开头 / 不印」，默认每行开头；进歌里
await openSheet();
check((await ddValue(p, '[data-pg="bn"]')) === "on" && (await p.$eval('[data-pg="bn"]', (e) => e.textContent ?? "")).includes("每行开头"), "（第 21 条：新歌写下来的「每行开头」）页面设置里有小节号；新歌跟着软件，现在是「每行开头」（17-1）");
await pickOnPage(p, '[data-pg="bn"]', "off"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.barNumbers)) === "off" && (await p.$$eval("#score text.bar-no", (e) => e.length)) === 0, "选「不印」= 歌里记着、谱上没有小节号");
await pickOnPage(p, '[data-pg="bn"]', "on"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.barNumbers)) === "line", "再选「每行开头」= 明写 line（16-4 A3）");
// 别家文件写的谱高（统筹 2026-11-12）：音符密度下拉如实显示「自定义（6.5 毫米）」（user「得如实那么说」）；换纸带着它；选了舒适 / 紧凑才换
await p.keyboard.press("Escape"); await p.mouse.click(5, 880); await p.waitForTimeout(150);
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, paper: { kind: "A5" }, staffMm: 6.5 } }); });   // 17-1：纸张和谱高是歌顶层的选择 await p.waitForTimeout(250);
await openSheet(); await p.click('[data-tab="layout"]'); await p.waitForTimeout(100);
check((await ddValue(p, '[data-pg="density"]')) === "file" && (await ddOptions(p, '[data-pg="density"]').catch(() => [])).some((o) => o.value === "file" && /^自定义（6\.5 毫米）$/.test(o.label)), "音符密度下拉 = 「自定义（6.5 毫米）」（不说成舒适 / 紧凑）");
await pickOnPage(p, '[data-pg="paper"]', "A4"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.staffMm)) === 6.5, "换成 A4：谱高带着走");
check((await p.$$eval(".popup-menu [data-id]", () => 0), true) && !/（[^）]*（/.test(await p.$eval('[data-pg="paper"]', (e) => e.textContent ?? "")), "纸张那一项没有括号套括号");
await pickOnPage(p, '[data-pg="density"]', "compact"); await p.waitForTimeout(200);
{ const sg = await p.evaluate(() => { const s = window.__moonsinger.state().song; return { staffMm: s.staffMm, density: s.density }; }); check(sg.staffMm === "default" && sg.density === "compact", "选「紧凑」= 谱高回到跟着紧凑那一档", JSON.stringify(sg)); }
// 跟着（第 17 条 17-1；第 21 条起在最后一格、叫「跟着我的习惯（现在是：X）」）：选它 = 写回 default；「套用我的习惯」（原「全部跟着软件」）= 一步写成现在的值
check((await ddOptions(p, '[data-pg="paper"]').catch(() => [])).at(-1)?.label === "跟着我的习惯（现在是：A5）", "纸张最后一格 = 跟着我的习惯（现在是：A5）");
await pickOnPage(p, '[data-pg="paper"]', "?follow"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.state().song.paper)) === "default", "选「跟着我的习惯」= 纸张写回 default");
await p.click('[data-panel-btn="alldef"]'); await p.waitForTimeout(200);
{ const sg = await p.evaluate(() => { const s = window.__moonsinger.state().song; return [s.notation, s.barNumbers, s.lyricFit, JSON.stringify(s.paper), s.density, s.staffMm, s.marginMm].join(","); });
  check(sg === 'staff,line,rhythm,{"kind":"A5"},cozy,default,default', "「套用我的习惯」= 写成现在的值（没设习惯 = 软件的默认）；谱高、边距回 default", sg); }
check(await p.$eval('[data-panel-btn="alldef"]', (e) => e.disabled), "已经是现在的值 = 那颗钮灰着");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nonly1: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
