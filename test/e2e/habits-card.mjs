// test/e2e/habits-card.mjs —— 真浏览器 E2E：这台设备看谱的习惯 + 「初始设置」卡（施工单第 18 条第三版；卡第二版 = 统筹 b7a48b84 / d871aadf）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。别的 E2E 都当成「问过了」（pw.mjs）；这一份用 newContext({ firstOpen: true }) 测卡。
// 守：全新的设备 = 卡出来（标题「初始设置」）；有别的面板开着 = 等它走了再出；格子 = 谱种表的每一种（一行横着滑、三格一样大、预览按 150 : 92 等比——
//   格宽由可见宽算：放得下均分不滑、放不下 = 整数格 + 半格、被切的那一侧淡出）
//   + 移调辅助两颗钮 + 中央 C 一个小下拉（和设置那一行同一处出）；字母谱和「钢琴卷帘、录音还没做」那一行小字；
//   从设置「界面」页「初始设置」打开 = 亮着现在的习惯、「以后再说」/ 关掉什么都不改也不动「问过了」、收了回到设置；
//   Esc = 这次收起、不记、重新载入还问；「好」= 选了的记进设备、不再问，新歌按简谱 / 按 C 调看排、键上的字写 C3；「以后再说」= 什么都不记、不再问；
//   设置「界面」页三行改习惯马上生效、改回「没选」回到软件的默认；锁着的歌照样跟着习惯变；习惯怎么换，存出来的文件逐字节一样。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/habits-card.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick, pickOnPage, ddValue } from "./dd.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", PREFIX = "moonsinger-5b1e7c0a92d34f6e:";
const b = await chromium.launch(), errs = [];
const kv = (p) => p.evaluate((pre) => Object.fromEntries(["habits-asked", "habit-notation", "habit-transpose-aid", "habit-middle-c"].map((k) => [k, localStorage.getItem(pre + k)])), PREFIX);
const rowKind = (p) => p.evaluate(() => window.__moonsinger.layout().systems[0]?.kind ?? null);
const fresh = async () => { const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, firstOpen: true }), p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); return { ctx, p }; };

// ── 全新的设备：卡出来；Esc = 这次收起、不记、重新载入还问 ──
{ const { ctx, p } = await fresh();
  await p.goto(BASE);
  const shown = await p.waitForSelector(".habits-card", { timeout: 6000 }).then(() => true, () => false);
  check(shown, "全新的设备：开 app 之后那张卡出来了");
  check((await p.$eval(".wbe-panel .wbe-panel-title", (e) => e.textContent)) === "初始设置", "标题叫「初始设置」");
  const tiles = await p.$$eval(".habits-card [data-h]", (bs) => bs.map((x) => `${x.dataset.h}:${x.dataset.v}`));
  check(tiles.join(",") === "notation:staff,notation:jianpu,notation:letters,viewInC:off,viewInC:on", "格子：谱种表的三种 + 移调辅助两颗钮", tiles.join(","));
  check(!!(await p.$('.habits-card [data-set="habit:middleC"]')), "中央 C 是一个小下拉（和设置那一行同一处出）");
  const words = await p.$eval(".habits-card", (e) => e.textContent ?? "");
  check(/玩 tracker 的可以先用这个，不完全一样/.test(words) && /钢琴卷帘、录音还没做/.test(words), "字母谱那句和钢琴卷帘 / 录音还没做");
  check(!/新手|刚开始|学过|专家|你是哪一种|？/.test(words), "格子不写水平、不写问句");
  check(await p.$$eval(".habits-card .hab-tile .hab-prev svg", (s) => s.length === 3 && s.every((x) => x.querySelectorAll("text").length > 3)), "只有谱那一行带预览（3 张，真排出来的）");
  const sizes = await p.$$eval(".habits-card .hab-tile", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(), v = t.querySelector(".hab-prev").getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(v.width), Math.round(v.height)].join("x"); }));
  const [, , pw, ph] = sizes[0].split("x").map(Number);
  check(new Set(sizes).size === 1 && Math.abs(pw / ph - 150 / 92) < 0.05, "三格一样大、预览按 150 × 92 等比（不随预览的内容变）", sizes.join(" "));
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  check(!(await p.$(".habits-card")) && (await kv(p))["habits-asked"] === null, "Esc = 收起、不记「问过了」");
  await p.reload(); const again = await p.waitForSelector(".habits-card", { timeout: 6000 }).then(() => true, () => false);
  check(again, "重新载入：没问过 = 还问");
  // 「好」：选简谱 + 按 C 调看 + C3
  await p.click('.hab-tile[data-v="jianpu"]'); await p.click('.habits-card [data-h="viewInC"][data-v="on"]'); await pick(p, '.habits-card [data-set="habit:middleC"]', "3");
  await p.click('.hab-tile[data-v="staff"]'); await p.click('.hab-tile[data-v="staff"]');   // 点亮着的那格 = 取消；点两下回到没选
  check((await p.$$eval('.habits-card .on[data-h="notation"]', (s) => s.length)) === 0, "点亮着的那格 = 取消（每一问都可以不选）");
  await p.click('.hab-tile[data-v="jianpu"]');
  await p.click('.wbe-panel [data-panel-btn="ok"]'); await p.waitForTimeout(300);
  const k1 = await kv(p);
  check(k1["habits-asked"] === "1" && k1["habit-notation"] === "jianpu" && k1["habit-transpose-aid"] === "on" && k1["habit-middle-c"] === "3", "「好」= 选了的记进设备、记「问过了」", JSON.stringify(k1));
  check((await rowKind(p)) === "jianpu", "新歌（谱种「跟着软件」）马上按简谱排", await rowKind(p));
  check(await p.$eval('.pad-key[data-midi="60"] .abs', (e) => e.textContent === "C3").catch(() => false), "键上的字照中央 C 的叫法：中央 C 写 C3");
  await p.reload(); await p.waitForTimeout(3000);
  check(!(await p.$(".habits-card")), "问过了 = 重新载入不再出");
  check((await rowKind(p)) === "jianpu", "重新载入：习惯还在（照简谱排）");
  // 设置「界面」页：改回「没选」= 软件的默认
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel");
  check(/没选（照软件的默认：五线谱）/.test(await p.$eval('.set-panel', (e) => e.textContent ?? "")) || (await ddValue(p, '[data-set="habit:notation"]')) === "jianpu", "设置「界面」页有「习惯看的谱」那一行");
  await pickOnPage(p, '[data-set="habit:notation"]', "none"); await pickOnPage(p, '[data-set="habit:middleC"]', "none"); await p.waitForTimeout(200);
  const k2 = await kv(p);
  check(k2["habit-notation"] === null && k2["habit-middle-c"] === null && k2["habit-transpose-aid"] === "on", "设置里改回「没选」= 删掉那一个键，别的不动", JSON.stringify(k2));
  check((await rowKind(p)) === "staff", "改回没选：照软件的默认（五线谱）", await rowKind(p));
  await pickOnPage(p, '[data-set="habit:notation"]', "letters"); await p.waitForTimeout(200);
  check((await rowKind(p)) === "jianpu" && (await kv(p))["habit-notation"] === "letters", "设置里选字母谱：马上生效（字母谱是简谱那一种行）");
  // 设置里的「初始设置」：亮着现在的习惯；「以后再说」什么都不改；回到设置
  await p.click('.set-panel [data-v="habits:card"]'); await p.waitForSelector(".habits-card");
  check(await p.$eval('.hab-tile[data-v="letters"]', (e) => e.classList.contains("on")) && await p.$eval('.habits-card [data-h="viewInC"][data-v="on"]', (e) => e.classList.contains("on")), "从设置里打开：亮着现在的习惯（字母谱、按 C 调看）");
  const before = JSON.stringify(await kv(p));
  await p.click('.hab-tile[data-v="staff"]'); await p.click('.wbe-panel [data-panel-btn="later"]'); await p.waitForTimeout(300);
  check(JSON.stringify(await kv(p)) === before && !!(await p.$(".set-panel")), "从设置里打开点「以后再说」：什么都不改、回到设置", JSON.stringify(await kv(p)));
  await p.click('.set-panel [data-v="habits:card"]'); await p.waitForSelector(".habits-card");
  await p.click('.hab-tile[data-v="staff"]'); await p.click('.wbe-panel [data-panel-btn="ok"]'); await p.waitForTimeout(300);
  check((await kv(p))["habit-notation"] === "staff" && !!(await p.$(".set-panel")), "从设置里打开点「好」：照写、回到设置");
  await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200);
  await ctx.close(); }

// ── 没问过的设备从设置里打开、点「以后再说」= 不动「问过了」 ──
{ const { ctx, p } = await fresh();
  await p.goto(BASE); await p.waitForSelector(".habits-card", { timeout: 6000 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel");
  await p.click('.set-panel [data-v="habits:card"]'); await p.waitForSelector(".habits-card");
  await p.click('.wbe-panel [data-panel-btn="later"]'); await p.waitForTimeout(250);
  check((await kv(p))["habits-asked"] === null, "没问过的设备：从设置里打开点「以后再说」= 不动「问过了」");
  await ctx.close(); }

// ── 一行小卡片：放不下 = 露出来的永远是「整数格 + 半格」、被切的那一侧淡出；放得下 = 不滑（统筹 1dda0433）──
for (const [w, h] of [[320, 700], [360, 760], [390, 844], [430, 900], [744, 1133]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, firstOpen: true }), p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForSelector(".habits-card", { timeout: 6000 }); await p.waitForTimeout(300);
  const cut = (side) => p.evaluate((side) => { const s = document.querySelector(".hab-strip"), r = s.getBoundingClientRect(), x = side === "r" ? r.right : r.left;
    for (const t of s.querySelectorAll(".hab-tile")) { const q = t.getBoundingClientRect(); if (x > q.left + 0.5 && x < q.right - 0.5) return (x - q.left) / q.width; } return null; }, side);
  const st = await p.$eval(".hab-strip", (s) => ({ scroll: s.scrollWidth > s.clientWidth + 1, fl: s.classList.contains("fade-l"), fr: s.classList.contains("fade-r") }));
  if (!st.scroll) { check(!st.fl && !st.fr, `${w} 宽：三格放得下 = 不滑、不淡出`); await ctx.close(); continue; }
  const r0 = await cut("r");
  check(r0 !== null && r0 >= 0.3 && r0 <= 0.7 && st.fr && !st.fl, `${w} 宽：右边界切在一格的 30%–70%、右边淡出`, `${r0?.toFixed(2)} ${JSON.stringify(st)}`);
  await p.$eval(".hab-strip", (s) => { s.style.scrollSnapType = "none"; s.scrollLeft = s.scrollWidth; }); await p.waitForTimeout(150);
  const l1 = await cut("l"), st1 = await p.$eval(".hab-strip", (s) => ({ fl: s.classList.contains("fade-l"), fr: s.classList.contains("fade-r") }));
  check(l1 !== null && l1 >= 0.3 && l1 <= 0.7 && st1.fl && !st1.fr, `${w} 宽：滑到最右 = 左边露半格、左边淡出、到头的一侧不淡出`, `${l1?.toFixed(2)} ${JSON.stringify(st1)}`);
  await ctx.close();
}

// ── 「以后再说」= 什么都不记、不再问 ──
{ const { ctx, p } = await fresh();
  await p.goto(BASE); await p.waitForSelector(".habits-card", { timeout: 6000 });
  await p.click('.hab-tile[data-v="jianpu"]'); await p.click('.wbe-panel [data-panel-btn="later"]'); await p.waitForTimeout(250);
  const k = await kv(p);
  check(k["habits-asked"] === "1" && k["habit-notation"] === null && k["habit-transpose-aid"] === null && k["habit-middle-c"] === null, "「以后再说」= 记「问过了」、别的什么都不记（点过的格子也不算）", JSON.stringify(k));
  check((await rowKind(p)) === "staff", "「以后再说」之后照软件的默认");
  await ctx.close(); }

// ── 别的面板开着 = 等它走了再出 ──
{ const { ctx, p } = await fresh();
  await p.goto(BASE); await p.waitForSelector("#setBtn");
  await p.click("#setBtn"); await p.waitForTimeout(100); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel");
  await p.waitForTimeout(3000);
  check(!(await p.$(".habits-card")), "设置开着：卡不出来抢");
  await p.click('.set-panel [data-panel-btn="close"]');
  check(await p.waitForSelector(".habits-card", { timeout: 4000 }).then(() => true, () => false), "设置关了：卡出来");
  await ctx.close(); }

// ── 文件一个字节都不跟着变；锁着的歌照样跟着习惯变 ──
{ const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } }), p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(800);
  for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
  // 存出来的每一份（.mxl 里每个条目）逐字节比；只去掉存的时刻（MusicXML 的 encoding-date、清单的 saved）——那两样每存一次都变，和习惯无关
  const bytesB64 = () => p.evaluate(() => { const m = window.__moonsinger, u = m.bytes();
    return JSON.stringify(m.zipList(u).sort().map((k) => [k, m.zipText(u, k).replace(/<encoding-date>[^<]*<\/encoding-date>/g, "").replace(/"saved": "[^"]*"/g, "")])); });
  const a0 = await bytesB64(), a1 = await bytesB64();
  check(a0 === a1, "（前提）同一份谱连着存两次（去掉存的时刻）一样");
  await p.evaluate((pre) => { localStorage.setItem(pre + "habit-notation", "jianpu"); localStorage.setItem(pre + "habit-transpose-aid", "on"); localStorage.setItem(pre + "habit-middle-c", "5"); }, PREFIX);
  // 习惯只在开 app 时读 + 设置里改：这里直接走设置那一行（同一个入口）
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel");
  await pickOnPage(p, '[data-set="habit:notation"]', "jianpu"); await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200);
  check((await rowKind(p)) === "jianpu", "（前提）习惯起作用了：按简谱排");
  check((await bytesB64()) === a0, "习惯换了：存出来的 .mxl 每个条目逐字节一样（只去掉存的时刻）");
  // 锁着的歌
  await p.evaluate(async () => { const fh = await (await navigator.storage.getDirectory()).getFileHandle("habits.mxl", { create: true }); const w = await fh.createWritable(); await w.write(window.__moonsinger.bytes()); await w.close(); });
  await p.goto(BASE); await p.waitForTimeout(700);
  await p.evaluate(async () => window.__moonsinger.openFileHandle(await (await navigator.storage.getDirectory()).getFileHandle("habits.mxl"))); await p.waitForTimeout(500);
  check((await p.evaluate(() => window.__moonsinger.editLock())).state === "locked", "（前提）打开的文件锁着");
  check((await rowKind(p)) === "jianpu", "锁着的歌照样跟着习惯（按简谱排）");
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel");
  await pickOnPage(p, '[data-set="habit:notation"]', "none"); await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200);
  check((await rowKind(p)) === "staff", "锁着时在设置里改习惯：马上跟着变");
  await ctx.close(); }

check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
