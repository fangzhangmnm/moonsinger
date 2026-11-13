// test/e2e/performer-defaults.mjs —— 真浏览器 E2E：乐器页里和「现在的默认」不一样的行标出来 + 「默认」钮 + 顶上一句 + 混音台「乐手 N 处不同」（第 16 条 16-6）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。统筹 2026-11-13「16-6 摆法」四问 + 补的六条。
// 守：新歌 = 顶上一句淡字「都一样」、没有点；小月相带一张老 dB 表 + 幽灵音改过（模拟老歌）= 顶上一句列出两处、力度记号那一行打点、表下面一排「现在的默认」对齐；
//   点「幽灵音」= 打开记号表、那一行在屏幕里、写着现在的默认；「默认」= 这一行改回模板的数、一步撤销；混音台基础页「乐手 2 处不同」，点 = 乐器页顶上那一句在屏幕里；
//   修改锁锁着：点 / 顶上一句照样在、顶上一句照样能点，「默认」钮灰着。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/performer-defaults.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", FILE = "defaults-test.mxl";
await p.goto(BASE); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const art = (k) => p.evaluate((k) => { const m = window.__moonsinger, role = m.state().song.parts[0].role, r = m.extras().lounge[role]; return r.candidates.find((c) => c.id === r.active)[k]; }, k);
const OLD_DB = { ppp: -24, pp: -18, p: -12, mp: -6, mf: 0, f: 3, ff: 6, fff: 9 };   // 一张「老歌」的 dB 表（随手编的，只要和模板不一样）
const openInst = async () => { await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300); };
const sum = () => p.$eval(".inst-page .ip-diff-sum", (e) => e.textContent ?? "").catch(() => "（没有）");
const inView = (sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }).catch(() => false);

await openInst();
check(/和现在的默认都一样/.test(await sum()), "新歌：顶上一句淡字「和现在的默认都一样」", await sum());
check((await p.$$(".inst-page .ip-k.is-diff, .inst-page tr.is-diff")).length === 0, "新歌：一行都不打点");

// 力度记号表逐档改（v0.17.20）：点一格 = 选中这一档；+ / − 一步 0.5 dB；改出来比更响的一档还响 = 下面说一句、照存；连着点并成一步撤销
const db = () => art("dynamicsDb");
const mf0 = (await db()).mf;
await p.click('.inst-page .dyn-tab [data-v="dynsel:mf"]'); await p.waitForTimeout(150);
check(!!(await p.$('.inst-page .dyn-tab .dyn-cell.is-sel[data-v="dynsel:mf"]')) && /\+0\.5/.test(await p.$eval('.inst-page [data-row="dyn"] + .ip-v .ip-ctl', (e) => e.textContent ?? "")), "点 mf 那一格 = 选中、这一行出 −0.5 / +0.5");
for (let i = 0; i < 6; i++) { await p.click('.inst-page [data-v="dyn:1"]'); await p.waitForTimeout(60); }
check(Math.abs((await db()).mf - (mf0 + 3)) < 1e-9, "+0.5 × 6 = mf 大 3 dB", `${mf0} → ${(await db()).mf}`);
check(/mf 比 f 还响/.test(await p.$eval('.inst-page [data-row="dyn"] + .ip-v', (e) => e.textContent ?? "")) && !!(await p.$('.inst-page .dyn-cell.is-loud[data-v="dynsel:mf"]')), "比 f 还响：那一格带记号、下面一句，照存");
check(!!(await p.$('.inst-page .dyn-tab tr:not(.ip-def-row) td.is-diff')) && !(await p.$('.inst-page .dyn-tab tr.ip-def-row td.is-diff')), "不一样的格子：点打在当前那一排，不打在「现在的默认」那一排");
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await db()).mf === mf0, "连着点的六下 = 一步撤销", String((await db()).mf));
await p.click('.inst-page .dyn-tab [data-v="dynsel:mf"]'); await p.waitForTimeout(150);
check(!(await p.$('.inst-page .dyn-cell.is-sel')), "再点一次 = 取消选中");

// 模拟老歌：小月相带着一张老 dB 表、幽灵音 −6（模板 −9）
await p.evaluate((t) => { const m = window.__moonsinger, role = m.state().song.parts[0].role, ex = structuredClone(m.extras()), c = ex.lounge[role].candidates.find((x) => x.id === ex.lounge[role].active);
  c.dynamicsDb = t; c.articulation = { ...c.articulation, ghostDb: -6 }; m.commit({ extras: ex }, { locus: { kind: "lounge", label: "test" } }); }, OLD_DB);
await p.waitForTimeout(200);
const s1 = await sum();
check(/不一样的有 2 处/.test(s1) && /力度记号/.test(s1) && /幽灵音/.test(s1), "顶上一句：2 处——力度记号、幽灵音", s1);
check(!!(await p.$('.inst-page .ip-k.is-diff[data-row="dyn"]')), "力度记号那一行打点");
check(await p.$$eval('.inst-page .dyn-tab tr.ip-def-row td', (tds) => tds.length) === 8, "力度表下面一排「现在的默认」，八格对齐");
check(!!(await p.$('.inst-page [data-v="def:dyn"]')), "力度记号那一行有「默认」钮");
await p.click('.inst-page .ip-diff-sum [data-jump="m:ghost"]'); await p.waitForTimeout(250);
check(await p.$eval(".inst-page details.ip-marks", (e) => e.open), "点「幽灵音」= 记号表打开");
check(await inView('.inst-page tr[data-row="m:ghost"]'), "幽灵音那一行在屏幕里");
check(/现在的默认：整个音 -9 dB/.test(await p.$eval('.inst-page tr[data-row="m:ghost"]', (e) => e.textContent ?? "")), "写着现在的默认（−9 dB）", await p.$eval('.inst-page tr[data-row="m:ghost"]', (e) => e.textContent ?? ""));
await p.click('.inst-page [data-v="def:m:ghost"]'); await p.waitForTimeout(200);
check((await art("articulation")).ghostDb === -9, "「默认」= 改回模板的 −9（写成数）", String((await art("articulation")).ghostDb));
check(/不一样的有 1 处/.test(await sum()), "顶上一句剩 1 处", await sum());
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await art("articulation")).ghostDb === -6, "撤销一步 = 回到 −6", String((await art("articulation")).ghostDb));

// 混音台：「乐手 2 处不同」，点 = 乐器页顶上那一句
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
const chip = await p.$$eval(".strip:not(.master):not(.bus) .strip-perfdiff", (bs) => bs.map((x) => x.textContent).join("|"));
check(chip === "乐手 2 处不同", "混音台基础页：推子旁边「乐手 2 处不同」", chip);
check((await p.$$eval(".strip:not(.master):not(.bus) .strip-perfdb", (bs) => bs.length)) === 0, "响度没改：「乐手 −6 dB」那一颗不出");
await p.click(".strip:not(.master):not(.bus) .strip-perfdiff"); await p.waitForTimeout(400);
check(await inView(".inst-page .ip-diff-sum"), "点了 = 乐器页、顶上那一句在屏幕里");

// 没有角色的声部（16-6，统筹 2026-11-13）：乐器页那一行照实说 MusicXML 代号没写，不说成人声
await p.evaluate(() => { const m = window.__moonsinger, ex = structuredClone(m.extras()); ex.lounge = {}; m.commit({ extras: ex }, { locus: { kind: "lounge", label: "test" } }); }); await p.waitForTimeout(200);
const what = await p.$eval(".inst-page .ip-what", (e) => e.textContent ?? "").catch(() => "");
check(/MusicXML 的乐器代号：歌里没写/.test(what) && !/voice\.vocals/.test(what), "没有角色：乐器页写「MusicXML 的乐器代号：歌里没写」", what);
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);

// 修改锁：存进一个文件、再打开 = 锁着
await p.evaluate(async (name) => { const fh = await (await navigator.storage.getDirectory()).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(window.__moonsinger.bytes()); await w.close(); }, FILE);
await p.goto(BASE); await p.waitForTimeout(700);
await p.evaluate(async (name) => window.__moonsinger.openFileHandle(await (await navigator.storage.getDirectory()).getFileHandle(name)), FILE); await p.waitForTimeout(500);
check((await p.evaluate(() => window.__moonsinger.editLock())).state === "locked", "打开的文件锁着");
await openInst();
check(/不一样的有 2 处/.test(await sum()), "锁着：顶上一句照样在", await sum());
check(!!(await p.$('.inst-page .ip-k.is-diff[data-row="dyn"]')), "锁着：点照样在");
check(await p.$eval('.inst-page [data-v="def:dyn"]', (e) => Number(getComputedStyle(e).opacity) < 0.6), "锁着：「默认」钮灰着");
await p.click('.inst-page .ip-diff-sum [data-jump="m:ghost"]'); await p.waitForTimeout(250);
check(await p.$eval(".inst-page details.ip-marks", (e) => e.open), "锁着：顶上一句照样能点（只是跳过去）");
await p.$eval('.inst-page [data-v="def:dyn"]', (e) => e.click()); await p.waitForTimeout(200);
check(JSON.stringify(await art("dynamicsDb")) === JSON.stringify(OLD_DB), "锁着：「默认」点了也不改", JSON.stringify(await art("dynamicsDb")));
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
