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
// 基础页的仪表（v0.10.16；user「三个页同意」「然后李萨如图你后来又觉得没必要做？」）：歌手卡片的平均电平、总轨的李萨如图 + 左右相关（正中的单声道 = +1.00）
{ let rv = "—", cv = "—", d = ""; for (let i = 0; i < 30 && (rv === "—" || cv === "—" || !d); i++) { await p.waitForTimeout(150);
    rv = await p.textContent(`.strip[data-id="${partId}"] .rms-val`); cv = await p.textContent(`.strip[data-id="__master"] .corr-val`); d = await p.$eval(`.strip[data-id="__master"] .strip-gonio .gon`, (e) => e.getAttribute("d") ?? ""); }
  check(/^-\d+\.\d dB$/.test(rv), "放着 = 歌手卡片上有平均电平（dB）", rv);
  check(cv === "+1.00" && d.length > 100, "总轨卡片背景有李萨如图，正中的单声道 = 左右相关 +1.00", `${cv} / path ${d.length}`);
  check(!(await p.$(`.strip[data-id="${partId}"] .strip-gonio`)), "歌手卡片（单声道）不画李萨如图"); }
await p.keyboard.press("Space"); await p.waitForTimeout(200);
await tab("eq");
// EQ 页卡片背景（v0.10.11）：频谱面 + EQ 曲线；放着的时候频谱有东西，440 Hz 附近最高；拧「厚 ↔ 亮」曲线跟着变（user「看不到频谱背景调均衡等于瞎子」）
check(!!(await p.$(`.strip[data-id="${partId}"] .strip-spec .eqc`)), "EQ 页：卡片背景有频谱面和 EQ 曲线");
check((await p.$$eval(`.strip[data-id="${partId}"] .spec-ticks span`, (es) => es.map((e) => e.textContent))).join(",") === "100,1k,10k", "频谱底下有频率刻度（100 / 1k / 10k）");
{ await p.click("#playBtn"); let d = ""; for (let i = 0; i < 40 && !d; i++) { await p.waitForTimeout(150); d = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .spec`, (e) => e.getAttribute("d") ?? ""); }
  const top = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .spec`, (e) => { const pts = [...(e.getAttribute("d") ?? "").matchAll(/L([\d.]+),([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([x]) => x > 0 && x < 100); return pts.reduce((a, c) => (c[1] < a[1] ? c : a), [0, 101])[0]; });
  const x440 = 100 * Math.log(440 / 30) / Math.log(16000 / 30);
  check(d.length > 0 && Math.abs(top - x440) < 4, "放着 = 频谱面有东西，最高处在 440 Hz 附近", `最高处 x ${top.toFixed(1)} / 440 Hz 在 ${x440.toFixed(1)}`);
  // 推子之后（v0.10.15；user「spectrum也算了fader，是全量send的东西对吧？」）：推子拉低 24 dB = 频谱面整体往下掉
  const peakY = () => p.$eval(`.strip[data-id="${partId}"] .strip-spec .spec`, (e) => Math.min(...[...(e.getAttribute("d") ?? "").matchAll(/L([\d.]+),([\d.]+)/g)].map((m) => Number(m[2]))));
  const y0 = await peakY();
  await tab("basic"); await p.$eval(`.strip[data-id="${partId}"] input[data-gain]`, (el) => { el.value = "-24"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await tab("eq"); if (!(await p.evaluate(() => window.__moonsinger.engine.playing))) await p.click("#playBtn");   // 那段只有 3 s：放完了 = 再放（推子已经在 −24）
  let y1 = Infinity; for (let i = 0; i < 30 && !Number.isFinite(y1); i++) { await p.waitForTimeout(150); y1 = await peakY(); }
  if (Number.isFinite(y1)) { await p.waitForTimeout(800); y1 = await peakY(); }   // 新开的频谱先涨到位、再等慢落落完
  check(Number.isFinite(y0) && Number.isFinite(y1) && y1 - y0 > 20, "推子拉低 24 dB = 频谱最高处往下掉（频谱在推子之后）", `y ${y0.toFixed(1)} → ${y1.toFixed(1)}（24 dB ≈ ${(24 / 84 * 100).toFixed(1)}）`);
  await tab("basic"); await p.dblclick(`.strip[data-id="${partId}"] input[data-gain]`); await tab("eq");
  await p.click("#playBtn"); await p.waitForTimeout(200); }
const curve0 = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .eqc`, (e) => e.getAttribute("d"));
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`)) && !(await p.$(`.strip[data-id="${partId}"] input[data-gain]`)), "EQ 页：卡片上直接摊开默认 EQ 的一键（厚 ↔ 亮），推子不在这页");
await p.$eval(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`, (el) => { el.value = "0.8"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(120);
check((await p.$eval(`.strip[data-id="${partId}"] .strip-spec .eqc`, (e) => e.getAttribute("d"))) !== curve0, "拧「厚 ↔ 亮」= EQ 曲线跟着变");
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-c="tilt"]`)) && !!(await p.$(`.strip[data-id="${partId}"] .fx-inline [data-v="fxtoggle"]`)), "拧完卡片上的控件还在（不被换成一行字）");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
// 自动低切也画进曲线（user「自动低切好像预览曲线上面没看到」）：曲线 / 读数和送进录音房的同一份换算
await p.click(`.strip[data-id="${partId}"] .fx-inline [data-v="fxtoggle"][data-c="autoLow"]`); await p.waitForTimeout(120);
{ const ys = await p.$eval(`.strip[data-id="${partId}"] .strip-spec .eqc`, (e) => [...(e.getAttribute("d") ?? "").matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((m) => Number(m[2])));
  check(ys[0] > 70 && Math.abs(ys[ys.length - 1] - 50) < 1, "开自动低切 = 曲线最左边（30 Hz）往下掉、高处不动", `${ys[0]} … ${ys[ys.length - 1]}`); }
await p.click(`.strip[data-id="${partId}"] .fx-inline [data-v="fxmode"][data-mode="full"]`); await p.waitForTimeout(120);
check(!(await p.$(".mix-tabbar select")), "顶条上没有全局的一键 / 全量下拉了（卡片里切）");
await tab("comp"); await tab("eq");
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline [data-v="fxmode"][data-mode="full"].is-on`)), "这张卡片记住自己是全量（换页回来还是）");
check(!!(await p.$(`.strip[data-id="${partId}"] .fx-inline input[data-p="midDb"]`)), "卡片里点「全量」= 这张卡片摊开全部参数");
check(/自动：\d+ Hz/.test(await p.textContent(`.strip[data-id="${partId}"] .fx-inline`)), "全量里低切那一行写出自动算出来的 Hz");
await p.click(`.strip[data-id="${partId}"] .fx-inline [data-v="fxmode"][data-mode="simple"]`); await p.waitForTimeout(120);
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
await tab("comp");
check(!!(await p.$(`.strip[data-id="${partId}"] [data-v="fxaddkind"][data-kind="comp"]`)), "压缩页：没有压缩 = 「＋ 压缩」");
// 压缩页的表（v0.10.16）：插上压缩、放着 = 「压了」读数（这台压缩此刻压了几 dB）+ 条；撤销 = 拿掉
await p.click(`.strip[data-id="${partId}"] [data-v="fxaddkind"][data-kind="comp"]`); await p.waitForTimeout(150);
await p.click("#playBtn");
{ let gv = "0 dB"; for (let i = 0; i < 30 && gv === "0 dB"; i++) { await p.waitForTimeout(150); gv = (await p.textContent(`.strip[data-id="${partId}"] .gr-val`)) ?? ""; }
  const w = await p.$eval(`.strip[data-id="${partId}"] .gr-bar > i`, (e) => parseFloat(e.style.width) || 0);
  check(/^-\d+\.\d dB$/.test(gv) && w > 0, "压缩页：放着 = 「压了」读数 + 条", `${gv} / 条 ${w}%`); }
if (await p.evaluate(() => window.__moonsinger.engine.playing)) await p.click("#playBtn");
await p.waitForTimeout(200); await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
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
// 一键锁着 + 「改成最接近的一键」（v0.10.14；user「basic模式下应该有一个project to basic模式的功能，不然的话basic模式会是被锁住，免得不小心override」）
check(!(await p.$('.fx-panel input[data-c="tilt"]')) && !(await p.$('.fx-panel [data-v="fxtoggle"]')) && !!(await p.$('.fx-panel [data-v="fxproject"]')), "在全量里调过 = 一键锁着：旋钮 / 开关不摆出来，只有「改成最接近的一键」（user「没法用一键的时候那些一键的invalid slider可以不显示」）");
await p.click('.fx-panel [data-v="fxproject"]'); await p.waitForTimeout(150);
{ const q = (await chain(partId))[0].params;
  check(q.midDb === 0 && q.highDb === 3 && q.lowDb === -3 && !(await p.$(".fx-panel .fx-note")) && !!(await p.$('.fx-panel input[data-c="tilt"]')), "「改成最接近的一键」= 中频那一刀丢掉、倾斜留着（亮 3 dB），一键解锁", JSON.stringify(q)); }
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check((await chain(partId))[0].params.midDb === -4 && !!(await p.$(".fx-panel .fx-note")), "能撤销：撤回 = 全量里那一刀回来、一键又锁上");
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
// 效果全关（A/B，v0.10.18；user「混音台加一个暂时禁用所有魔法的toggle…给你回到musescore/谱子本身用的，以及听差别」）：插件不响、推子留着；再点回来
await p.click('.studio [data-v="bypass"]'); await p.waitForTimeout(150);
{ const pk2 = await peak();
  await setRange('.fx-panel input[data-c="dB"]', -20); await p.waitForTimeout(150);
  const pk3 = await peak();
  check(Math.abs(pk3 / pk2 - 1) < 0.01 && Math.abs(pk2 / pk1 - 1) > 0.05 && await p.$eval(".mix-ab-note", (e) => !e.hidden) && (await p.textContent('.studio [data-v="bypass"]')) === "效果全关", "效果全关 = 插件不响（总轨那格从 −6 拧到 −20 混音一点不变）、顶上明说", `开着 ${pk1.toFixed(3)} / 全关 ${pk2.toFixed(3)} → 拧了 ${pk3.toFixed(3)}`);
  check((await chain("master"))[0]?.params.dB === -20, "全关时拧的照样进歌（全关只管响不响，不改参数）");
  await setRange('.fx-panel input[data-c="dB"]', -6); await p.waitForTimeout(150);
  await p.click('.studio [data-v="bypass"]'); await p.waitForTimeout(150);
  check(Math.abs((await peak()) / pk1 - 1) < 0.01 && await p.$eval(".mix-ab-note", (e) => e.hidden), "再点 = 效果回来"); }
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
