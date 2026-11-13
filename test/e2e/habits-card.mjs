// test/e2e/habits-card.mjs —— 真浏览器 E2E：这台设备看谱的习惯 + 第一次打开问一次的卡（施工单第 18 条第三版；统筹 f73b128a / b149a4d9 / eff00542）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。别的 E2E 都当成「问过了」（pw.mjs）；这一份用 newContext({ firstOpen: true }) 测卡。
// 守：全新的设备 = 卡出来；有别的面板开着 = 等它走了再出；格子 = 谱种表的每一种 + 移调辅助两格 + 中央 C 三颗小钮；字母谱那格照实写、卡底下说钢琴卷帘 / 录音还没做；
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
  const tiles = await p.$$eval(".habits-card [data-h]", (bs) => bs.map((x) => `${x.dataset.h}:${x.dataset.v}`));
  check(tiles.join(",") === "notation:staff,notation:jianpu,notation:letters,viewInC:off,viewInC:on,middleC:3,middleC:4,middleC:5", "格子：谱种表的三种 + 移调辅助两格 + 中央 C 三颗", tiles.join(","));
  const words = await p.$eval(".habits-card", (e) => e.textContent ?? "");
  check(/玩 tracker 的可以先用这个，不完全一样/.test(words) && /钢琴卷帘、录音还没做/.test(words), "字母谱那格照实写；钢琴卷帘 / 录音还没做");
  check(!/新手|刚开始|学过|专家/.test(words), "格子不写水平");
  check(await p.$$eval(".habits-card .hab-tile .hab-prev svg", (s) => s.length === 5 && s.every((x) => x.querySelectorAll("text").length > 5)), "每一大格都有真排出来的预览（5 张）");
  check(await p.$$eval(".habits-card .hab-small [data-h]", (s) => s.every((x) => !x.querySelector("svg"))), "小的辅助（中央 C）不带预览");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  check(!(await p.$(".habits-card")) && (await kv(p))["habits-asked"] === null, "Esc = 收起、不记「问过了」");
  await p.reload(); const again = await p.waitForSelector(".habits-card", { timeout: 6000 }).then(() => true, () => false);
  check(again, "重新载入：没问过 = 还问");
  // 「好」：选简谱 + 按 C 调看 + C3
  await p.click('.hab-tile[data-v="jianpu"]'); await p.click('.hab-tile[data-h="viewInC"][data-v="on"]'); await p.click('.hab-mini[data-v="3"]');
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
  await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200);
  await ctx.close(); }

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
