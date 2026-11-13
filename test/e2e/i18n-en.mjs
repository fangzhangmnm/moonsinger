// test/e2e/i18n-en.mjs —— 英文界面巡检：走主要界面，查还剩中文的字、被撑爆的控件。created 2026-11-04 by Claude Opus 5.5（v0.15.0）
//   user 2026-11-04「关键是UI的宽度」：宽度不靠肉眼，几种屏幕都量一遍。
//   查两件事：① 看得见的字里没有汉字（放过：用户的数据、语言名「中文」、小月相条款原文 / 译文）
//             ② 控件里的字没有超出控件（字的实际宽度 > 控件内宽 = 撑爆）
//   跑：npm run build → npm run serve（8710）→ node test/e2e/i18n-en.mjs；加 --verbose 打印全部。
import { chromium } from "./pw.mjs";
import { pick } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const b = await chromium.launch();

/** 看得见的元素里：还带汉字的字 + 撑爆的控件。 */
const scanPage = () => {
  const han = /[一-鿿]/;
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.02; };
  const leftovers = new Set(), overflow = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (!t || !han.test(t)) continue;
    const el = n.parentElement; if (!el || !visible(el)) continue;
    if (el.closest("script,style,[data-i18n-skip],.credit-original,.credit-zh")) continue;
    leftovers.add(t.slice(0, 80));
  }
  for (const el of document.querySelectorAll("[title],[placeholder],[aria-label]")) {
    if (!visible(el)) continue;
    for (const a of ["title", "placeholder", "aria-label"]) { const v = el.getAttribute(a); if (v && han.test(v)) leftovers.add(`@${a}: ${v.slice(0, 70)}`); }
  }
  for (const el of document.querySelectorAll("button, select, .btn, .chip")) {
    if (!visible(el)) continue;
    const box = el.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width < 1) continue;
    const cs = getComputedStyle(el);
    const inner = box.width - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0);
    if (r.width > inner + 1.5) {
      overflow.push(`${(el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 28)} [${Math.round(r.width)}×${Math.round(r.height)} in ${Math.round(box.width)}×${Math.round(box.height)}]`);
    }
  }
  return { leftovers: [...leftovers], overflow };
};

const SIZES = [["iPad mini 竖", 768, 1024], ["iPad mini 横", 1024, 768], ["手机", 390, 844], ["桌面", 1280, 800]];
const verbose = process.argv.includes("--verbose");
const seenHan = new Map();
const seenOver = new Map();
const note = (where, res) => {
  for (const t of res.leftovers) if (!seenHan.has(t)) seenHan.set(t, where);
  for (const t of res.overflow) { const k = t.replace(/ \[.*/, ""); if (!seenOver.has(k)) seenOver.set(k, `${where}: ${t}`); }
};

const MUST_REACH = ["写音", "词", "听 · 基础", "☰", "导出", "声音与署名", "封面", "设置 ui", "设置 sound", "设置 input", "设置 upkeep", "设置 about", "设置 dev",
  "这一段的菜单", "谱头面板", "声部小卡", "乐器目录", "乐器页", "声部管理", "选区条", "选区菜单", "歌库 / 选家"];
const cardBad = [];
for (const [size, w, h] of SIZES) {
  const reached = new Set();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: "en-US" });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(900);
  if (size === SIZES[0][0]) {
    check(await p.evaluate(() => document.documentElement.lang) === "en", "系统语言 en-US = 英文界面，<html lang> = en");
    check(await p.$eval(".mode-seg [data-mode=notes]", (e) => e.title.startsWith("Notes")), "模式钮的提示是英文");
  }
  const scan = async (name) => { await p.waitForTimeout(180); reached.add(name); note(`${size} · ${name}`, await p.evaluate(scanPage)); };
  const tap = async (sel) => { try { await p.click(sel, { timeout: 1200 }); return true; } catch { return false; } };
  const esc = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(120); };

  await scan("写音");
  // 符号格三页
  if (await tap(".pad-head [data-kbswitch]")) {
    await scan("符号格 演奏法");
    for (const page of ["art", "dyn", "mark"]) { if (await tap(`[data-sympage="${page}"]`)) await scan(`符号格 ${page}`); }
    await tap(".pad-head [data-kbswitch]");
  }
  // 词 / 听 + 混音台五页
  await tap('.mode-seg [data-mode="lyrics"]'); await scan("词");
  await tap('.mode-seg [data-mode="listen"]'); await scan("听 · 基础");
  for (const tab of await p.$$eval("[data-tab]", (els) => els.map((e) => e.dataset.tab))) { if (await tap(`[data-tab="${tab}"]`)) await scan(`混音台 ${tab}`); }
  await tap('.mode-seg [data-mode="notes"]');
  // ☰ 菜单 + 设置 + 导出
  if (await tap("#setBtn")) {
    await scan("☰");
    const items = await p.$$eval(".ctx-menu button, .main-menu button, .offer-card button", (bs) => bs.map((x) => x.innerText.trim()));
    if (verbose) console.log("   menu:", items.join(" | "));
    await esc();
  }
  await tap("#setBtn"); if (await tap('button:has-text("Export…")')) { await scan("导出"); await esc(); }
  await tap("#setBtn"); if (await tap('button:has-text("Sounds and credits…")')) { await scan("声音与署名"); await esc(); }
  await tap("#setBtn"); if (await tap('button:has-text("Cover image…")')) { await scan("封面"); await esc(); }
  // 设置五页（v0.16.90 起分页）：逐页量
  await tap("#setBtn");
  if (await tap('button:has-text("Settings…")')) {
    for (const tab of await p.$$eval(".set-tabs [data-tab]", (els) => els.map((e) => e.dataset.tab))) { if (await tap(`.set-tabs [data-tab="${tab}"]`)) await scan(`设置 ${tab}`); }
    await esc();
  }
  // 这一段的菜单（纸顶 ⋯）+ 谱头面板（v0.16.8）
  if (await tap('#score [data-ov="menu"], [data-ov="menu"]')) { await scan("这一段的菜单"); await esc(); }
  if (await p.evaluate(() => { const m = window.__moonsinger; m.openHeader(m.state().at.part); return true; }).catch(() => false)) { await scan("谱头面板"); await esc(); }
  // 点谱上的声部名 = 小卡（换乐器 / 乐器设置 / 声部管理 / 删掉声部）；三颗各走一遍
  const card = async () => { if (await tap("#score text.part-name")) { await p.waitForTimeout(150); return true; } return false; };
  if (await card()) {
    await scan("声部小卡");
    { const bad = await p.evaluate(() => [...document.querySelectorAll(".part-card .tc-row .btn")].filter((x) => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().height > 40).map((x) => x.textContent)); if (bad.length) cardBad.push(`${size}: ${bad.join(" / ")}`); }   // v0.16.100：撑爆量不出折行，user 截图抓到
    if (await tap('.track-card [data-v="swap"]')) { await p.waitForTimeout(500); await scan("乐器目录"); await esc(); await esc(); }
  }
  if (await card() && await tap('.track-card [data-v="inst"]')) { await p.waitForTimeout(300); await scan("乐器页"); await esc(); await esc(); }
  if (await card() && await tap('.track-card [data-v="parts"]')) { await p.waitForTimeout(200); await scan("声部管理"); await esc(); }
  // 有音的界面：选区条（两排）、选区菜单、力度 / 风格 / 速度的小菜单
  await p.click("#score", { position: { x: Math.min(w - 60, 300), y: 160 } }).catch(() => {});
  for (const k of ["Digit1", "Digit2", "Digit3", "Digit5"]) await p.keyboard.press(k);
  await p.waitForTimeout(150);
  await p.keyboard.press("Control+a"); await scan("选区条");
  if (await tap('.sel-bar [data-v="transpose"]')) { await scan("选区菜单"); await esc(); }
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(120);
  if (await tap(".pad-head [data-kbswitch]")) {
    if (await tap('[data-sympage="mark"]')) {
      if (await tap('[data-sym="groove"]')) { await scan("风格小菜单"); await esc(); }
      if (await tap('[data-sym="repeat"]')) { await scan("反复小菜单"); await esc(); }
      if (await tap('[data-sym="clef"]')) { await scan("谱号小菜单"); await esc(); }
      if (await tap('[data-sym="tempo"]')) { await scan("速度"); await esc(); }
      if (await tap('[data-sym="key"]')) { await scan("调号"); await esc(); }
    }
    await tap(".pad-head [data-kbswitch]");
  }
  if (await tap(".pad-head .k-more")) { await scan("⋯"); await esc(); }
  if (await tap(".pad-head .k-key")) { await scan("调 + 调式"); await esc(); }
  // 歌库
  if (await tap(".tb-lib")) { await p.waitForTimeout(400); await scan("歌库 / 选家"); await esc(); }
  if (size === SIZES[0][0]) {
    check(errs.length === 0, "英文界面走一圈没有报错", errs.slice(0, 2).join(" | "));
    // 路线没悄悄过时：入口改名 / 退役了，这里会少一个（v0.16.97 起；之前「定稿…」退役了它还在点，没人发现）
    const missing = MUST_REACH.filter((n) => !reached.has(n));
    check(missing.length === 0, `该走到的面板都走到了（${MUST_REACH.length - missing.length}/${MUST_REACH.length}）`, missing.join("、"));
    if (verbose) console.log("   reached:", [...reached].join(" | "));
  }
  await ctx.close();
}

// 修改锁（v0.16.96）：干净的新页面里，把这首当「硬盘上的单个文件」打开（OPFS 句柄，同 edit-lock.mjs）= 门；
//   接着改之后 ☰ 里有「锁上」。放在单独的页面：前面走过一圈歌已经改过，再打开会先问「离开这首吗」，没人点就一直等。
for (const [size, w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: "en-US" });
  const p = await ctx.newPage(); await p.goto(BASE); await p.waitForTimeout(700);
  const where = (n) => `${size} · ${n}`;
  const opened = await Promise.race([
    p.evaluate(async () => {
      const dir = await navigator.storage.getDirectory(), fh = await dir.getFileHandle("i18n-en.mxl", { create: true });
      const wr = await fh.createWritable(); await wr.write(await window.__moonsinger.bytes()); await wr.close();
      return window.__moonsinger.openFileHandle(await dir.getFileHandle("i18n-en.mxl"));
    }).catch(() => false),
    new Promise((f) => setTimeout(() => f(false), 6000)),
  ]);
  if (size === SIZES[0][0]) check(!!opened && await p.evaluate(() => window.__moonsinger.editLock().locked), "当硬盘文件打开 = 锁着（能量到门）");
  if (opened) {
    await p.waitForTimeout(300); note(where("锁着的门"), await p.evaluate(scanPage));
    try { await p.click('[data-v="continue"]', { timeout: 1200 }); await p.waitForTimeout(200); await p.click("#setBtn", { timeout: 1200 }); await p.waitForTimeout(180); note(where("☰（解开之后）"), await p.evaluate(scanPage)); } catch { if (size === SIZES[0][0]) check(false, "门上「接着改」→ ☰"); }
  }
  await ctx.close();
}

check(cardBad.length === 0, "声部名小卡三颗钮：不折行、字不被切", cardBad.join("; "));
check(seenHan.size === 0, `界面上没有剩下的中文（${seenHan.size} 条）`);
for (const [t, w] of seenHan) console.log(`      中文 ${w}: ${t}`);
check(seenOver.size === 0, `没有被撑爆的控件（${seenOver.size} 个）`);
for (const [, v] of seenOver) console.log(`      撑爆 ${v}`);

// 触屏长按 = 说明气泡；这一下不算点（iPad 没有 tooltip）
{
  const ctx = await b.newContext({ viewport: { width: 768, height: 1024 }, locale: "en-US", hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE); await p.waitForTimeout(700);
  const press = (sel, ms) => p.evaluate(async ([sel, ms]) => {
    const el = document.querySelector(sel), r = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, composed: true, pointerType: "touch", pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, isPrimary: true };
    el.dispatchEvent(new PointerEvent("pointerdown", o));
    await new Promise((f) => setTimeout(f, ms));
    const tip = document.querySelector(".touch-tip")?.textContent ?? null;
    el.dispatchEvent(new PointerEvent("pointerup", o));
    el.click();
    return tip;
  }, [sel, ms]);
  const mode = () => p.evaluate(() => window.__moonsinger.workspace().mode);
  const tip = await press('.mode-seg [data-mode="listen"]', 600);
  check(!!tip && tip.startsWith("Listen"), "长按「听」的图标：冒出英文说明", String(tip).slice(0, 40));
  check((await mode()) === "notes", "长按过的这一下不算点（还在写音）");
  const quick = await press('.mode-seg [data-mode="listen"]', 60);
  check(quick === null && (await mode()) === "listen", "轻点：没有气泡，照常切模式");
  await ctx.close();
}

// 设置里切语言：选中文 = 重载后是中文、跟系统 = 回英文
{
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, locale: "en-US" });
  const p = await ctx.newPage();
  await p.goto(BASE); await p.waitForTimeout(700);
  await p.click("#setBtn"); await p.click('button:has-text("Settings…")'); await p.waitForTimeout(150);
  await Promise.all([p.waitForNavigation(), pick(p, '[data-set="lang"]', "zh")]); await p.waitForTimeout(700);
  check(await p.evaluate(() => document.documentElement.lang) === "zh-CN", "设置里选中文：重载后 <html lang> = zh-CN");
  check((await p.$eval(".mode-seg [data-mode=notes]", (e) => e.title)).startsWith("音"), "选了中文：英文系统上界面也是中文");
  await p.click("#setBtn"); await p.click('button:has-text("设置…")'); await p.waitForTimeout(150);
  await Promise.all([p.waitForNavigation(), pick(p, '[data-set="lang"]', "auto")]); await p.waitForTimeout(700);
  check(await p.evaluate(() => document.documentElement.lang) === "en", "跟系统：回到英文");
  await ctx.close();
}
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
