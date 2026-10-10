// test/e2e/mixer-fx.mjs —— 真浏览器 E2E：混音台的插件格（v0.10.8）：默认 EQ 那一格没碰过不进文件；一键 / 全量是同一组参数；插 / 关 / 拿掉 / 被谁压 / 撤销；插件真进了录音房。
// created 2026-10-10 by Claude Opus 5.5（user「插件：可以随便插…用最general最自由的方式」「几个不同的面版模式背后都是同一个插件。类似专家模式和一键模式…先做同时新手和全量两个面版」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: Float32Array.from({ length: 22050 * 3 }, (_, i) => 0.2 * Math.sin((2 * Math.PI * 440 * i) / 22050)), sr: 22050 }); });   // 440 Hz 正弦（频谱看得出来）
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(250);
const partId = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
const chain = (track) => p.evaluate((t) => { const m = window.__moonsinger, s = m.state(); if (t === "master") return m.extras().studio?.master?.chain ?? []; const mic = s.song.parts.find((x) => x.id === t).mic; return m.studioTracks().find((x) => x.id === mic)?.chain ?? []; }, track);
const chip = (track, fx) => `.strip[data-id="${track}"] [data-fx="${fx}"]`;
const setRange = (sel, v) => p.$eval(sel, (el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const peak = () => p.evaluate(async () => { const m = await window.__moonsinger.renderMix(); let pk = 0; for (const v of m.samples) pk = Math.max(pk, Math.abs(v)); return pk; });

const tab = async (t) => { await p.click(`.mix-tabbar [data-tab="${t}"]`); await p.waitForTimeout(120); };
// 分页（v0.10.10）：默认「基础」；每张卡片顶上一条峰值细线；EQ 页摊开默认 EQ 的一键控件，下拉换全量全部卡片一起换；压缩页没有 = 「＋ 压缩」
check(!!(await p.$('.mix-tabbar [data-tab="basic"].is-on')) && !!(await p.$(`.strip[data-id="${partId}"] input[data-gain]`)), "默认在「基础」页：增益 / 声像");
check((await p.$$(".studio-strips .strip .strip-meter")).length === (await p.$$(".studio-strips .strip")).length, "每张卡片顶上都有峰值细线");
// 小方块问号（iPad 能点）：点了这一行下面展开说明，再点收起；空格在推子上也是放（user「混音台的空格没有捕捉」）
await p.click(`.strip[data-id="${partId}"] .strip-row:has(input[data-gain]) .q`); await p.waitForTimeout(80);
check(await p.$eval(`.strip[data-id="${partId}"] .strip-row:has(input[data-gain])`, (e) => e.classList.contains("show-help") && getComputedStyle(e.querySelector(".row-help")).display !== "none"), "点「?」= 这一行下面展开说明");
await p.click(`.strip[data-id="${partId}"] .strip-row:has(input[data-gain]) .q`); await p.waitForTimeout(80);
check(!(await p.$eval(`.strip[data-id="${partId}"] .strip-row:has(input[data-gain])`, (e) => e.classList.contains("show-help"))), "再点 = 收起");
// 参数行深模块（v0.10.13；user「鼠标滚轮能不能一格一格滚各种slider，帮助强迫症」「我觉得还是滑块吧？」）：滚轮一格 = 一步、触控板攒够才走、横着划不吃、双击回默认
{ const sel = `.strip[data-id="${partId}"] input[data-gain]`, val = () => p.$eval(sel, (e) => Number(e.value)), out = () => p.$eval(sel, (e) => e.parentElement.querySelector("output").textContent);
  const at = async () => { const r = await p.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await p.mouse.move(r.x, r.y); };
  const v0 = await val(); await at();
  await p.mouse.wheel(0, -100); await p.waitForTimeout(80);
  check((await val()) === v0 + 0.5 && (await out()) === "+0.5 dB", "滚轮往上一格 = 推子正好大一步（0.5 dB），读数跟着变", `${v0} → ${await val()} ${await out()}`);
  await p.mouse.wheel(0, 100); await p.mouse.wheel(0, 100); await p.waitForTimeout(80);
  check((await val()) === v0 - 0.5, "往下两格 = 小两步", String(await val()));
  for (let k = 0; k < 3; k++) await p.mouse.wheel(0, -10);
  await p.waitForTimeout(60); const vt = await val();
  await p.mouse.wheel(0, -10); await p.waitForTimeout(80);
  check(vt === v0 - 0.5 && (await val()) === v0, "触控板的小步子攒够 40 px 才走一步", `${vt} → ${await val()}`);
  await p.click('.mix-tabbar [data-tab="eq"]'); await p.waitForTimeout(100); await p.click('.mix-tabbar [data-tab="basic"]'); await p.waitForTimeout(100);
  check((await val()) === v0, "滚出来的值真进了宿主（换页回来还在）");
  await p.mouse.wheel(0, -100); await p.waitForTimeout(80);
  await p.dblclick(sel); await p.waitForTimeout(120);
  check((await val()) === 0 && (await out()) === "0.0 dB", "双击 = 回 0 dB", `${await val()} ${await out()}`); }
await p.focus(`.strip[data-id="${partId}"] input[data-gain]`); await p.keyboard.press("Space");
let started = false; for (let i = 0; i < 40 && !started; i++) { await p.waitForTimeout(100); started = await p.evaluate(() => window.__moonsinger.engine.playing); }
check(started, "焦点在推子上按空格 = 放（原来推子上的空格被放过）");
await p.keyboard.press("Space"); await p.waitForTimeout(200);
await tab("eq");
// EQ 页卡片背景（v0.10.11）：频谱面 + EQ 曲线；放着的时候频谱有东西，440 Hz 附近最高；拧「厚 ↔ 亮」曲线跟着变（user「看不到频谱背景调均衡等于瞎子」）
check(!!(await p.$(`.strip[data-id="${partId}"] .strip-spec .eqc`)), "EQ 页：卡片背景有频谱面和 EQ 曲线");
{ await p.click("#playBtn"); let d = ""; for (let i = 0; i < 40 && !d; i++) { await p.waitForTimeout(150); d = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .spec`, (e) => e.getAttribute("d") ?? ""); }
  const top = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .spec`, (e) => { const pts = [...(e.getAttribute("d") ?? "").matchAll(/L([\d.]+),([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([x]) => x > 0 && x < 100); return pts.reduce((a, c) => (c[1] < a[1] ? c : a), [0, 101])[0]; });
  const x440 = 100 * Math.log(440 / 30) / Math.log(16000 / 30);
  check(d.length > 0 && Math.abs(top - x440) < 4, "放着 = 频谱面有东西，最高处在 440 Hz 附近", `最高处 x ${top.toFixed(1)} / 440 Hz 在 ${x440.toFixed(1)}`);
  await p.click("#playBtn"); await p.waitForTimeout(200); }
const curve0 = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .eqc`, (e) => e.getAttribute("d"));
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`)) && !(await p.$(`.strip[data-id="${partId}"] input[data-gain]`)), "EQ 页：卡片上直接摊开默认 EQ 的一键（厚 ↔ 亮），推子不在这页");
await p.$eval(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`, (el) => { el.value = "0.8"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(120);
check((await p.$eval(`.strip[data-id="${partId}"] .strip-spec .eqc`, (e) => e.getAttribute("d"))) !== curve0, "拧「厚 ↔ 亮」= EQ 曲线跟着变");
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`)) && !!(await p.$(`.strip[data-id="${partId}"] .fx-inline [data-v="fxtoggle"]`)), "拧完卡片上的控件还在（不被换成一行字）");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
await p.selectOption(".mix-tabbar select[data-panelmode]", "full"); await p.waitForTimeout(120);
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-p="midDb"]`)), "下拉换「全量」= 卡片上摊开全部参数");
await p.selectOption(".mix-tabbar select[data-panelmode]", "simple"); await p.waitForTimeout(120);
await tab("comp");
check(!!(await p.$(`.strip[data-id="${partId}"] [data-v="fxaddkind"][data-kind="comp"]`)), "压缩页：没有压缩 = 「＋ 压缩」");
await tab("chain");
check((await p.textContent(chip(partId, "eq"))) === "均衡（平）" && (await chain(partId)).length === 0, "「链」页：歌手轨第一格 = 默认 EQ（平），没碰过不进文件");
await p.click(chip(partId, "eq")); await p.waitForTimeout(150);
check(await p.$eval(".fx-panel", (e) => !e.hidden) && !!(await p.$('.fx-panel [data-mode="simple"].is-on')) && !(await p.$('.fx-panel [data-v="fxdel"]')), "点开 = 顶上展开一键面板；默认那一格没有「拿掉」");
await setRange('.fx-panel input[data-c="tilt"]', 0.5); await p.waitForTimeout(150);
let c = await chain(partId);
check(c.length === 1 && c[0].id === "eq" && c[0].params.highDb === 3 && c[0].params.lowDb === -3, "拧「厚 ↔ 亮」= 默认 EQ 写进链的最前面，全量参数按公式（高架 +3、低架 −3）", JSON.stringify(c[0]?.params));
check((await p.textContent(chip(partId, "eq"))) === "均衡 亮", "卡片上那一格跟着变", await p.textContent(chip(partId, "eq")));
await p.click('.fx-panel [data-mode="full"]'); await p.waitForTimeout(150);
check(!!(await p.$('.fx-panel input[data-p="midDb"]')), "全量 = 每个参数都摊开");
await setRange('.fx-panel input[data-p="midDb"]', -4); await p.waitForTimeout(150);
check((await chain(partId))[0].params.midDb === -4 && (await p.textContent(chip(partId, "eq"))) === "均衡（全量）", "全量里挖一刀中频 = 同一格的参数；卡片上写「全量」");
await p.click('.fx-panel [data-mode="simple"]'); await p.waitForTimeout(150);
check(!!(await p.$(".fx-panel .fx-note")), "回到一键 = 明说「在全量里调过」");
await p.click('.fx-panel [data-v="fxon"]'); await p.waitForTimeout(150);
check((await chain(partId))[0].on === false && (await p.$eval(chip(partId, "eq"), (e) => e.classList.contains("off"))), "关 = 这一格跳过（参数留着），卡片上划掉");
// ＋ 压缩，被谁压
await p.click(`.strip[data-id="${partId}"] [data-v="fxadd"]`); await p.waitForTimeout(100);
await p.click(`.strip[data-id="${partId}"] [data-v="fxpick"][data-kind="comp"]`); await p.waitForTimeout(150);
c = await chain(partId);
check(c.length === 2 && c[1].kind === "comp" && Math.abs(c[1].params.thresholdDb - -15) < 0.01, "＋ 压缩 = 插在后面、一键「压多少」30%（阈值 −15 dB）", JSON.stringify(c[1]?.params));
check(!(await p.$('.fx-panel select[data-key]')), "只有一位歌手 = 没有别的轨可选，不显示「被谁压」（两位的在 routing.mjs）");
await p.click('.fx-panel [data-v="fxdel"]'); await p.waitForTimeout(150);
check((await chain(partId)).length === 1, "拿掉 = 链上没了");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check((await chain(partId)).length === 2, "撤销 = 压缩回来");
// 插件真进了录音房：总轨插一格增益 −6 dB，离线混音峰值减半
const pk0 = await peak();
await p.click(`.strip[data-id="__master"] [data-v="fxadd"]`); await p.waitForTimeout(100);
await p.click(`.strip[data-id="__master"] [data-v="fxpick"][data-kind="gain"]`); await p.waitForTimeout(150);
await setRange('.fx-panel input[data-c="dB"]', -6); await p.waitForTimeout(150);
check((await chain("master"))[0]?.params.dB === -6, "总轨链：增益 −6 dB 进歌", JSON.stringify(await chain("master")));
const pk1 = await peak();
check(Math.abs(pk1 / pk0 - 0.501) < 0.01, "离线混音吃到总轨链上的增益（峰值减半）", `${pk0.toFixed(3)} → ${pk1.toFixed(3)}`);
check(!(await p.$(`.strip[data-id="__master"] [data-fx="eq"]`)), "总轨没有默认 EQ 那一格");
{ const sel = '.fx-panel input[data-c="dB"]', r = await p.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, step: Number(e.step) }; });
  await p.mouse.move(r.x, r.y); await p.mouse.wheel(0, -100); await p.waitForTimeout(150);
  check(Math.abs((await chain("master"))[0]?.params.dB - (-6 + r.step)) < 1e-6, "插件格的滑块也是滚轮一格一步（一样进歌）", JSON.stringify((await chain("master"))[0]?.params));
  await p.dblclick(sel); await p.waitForTimeout(150);
  check((await chain("master"))[0]?.params.dB === 0, "插件格的滑块双击 = 回到刚插上时的样子", JSON.stringify((await chain("master"))[0]?.params)); }
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmixer-fx: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
