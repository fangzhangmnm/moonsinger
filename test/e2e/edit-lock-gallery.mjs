// test/e2e/edit-lock-gallery.mjs —— 真浏览器 E2E：修改锁在「歌库里的歌」这条路上（库的开关 lockByDefault 打开之后，v0.16.97）。
// created 2026-11-10 by Claude Fable 5.2（设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md 第十节第 9 步；硬盘上的单个文件那条路在 edit-lock.mjs）。
//   真 app + 真库 + 真 IndexedDB；家 = 文件夹（假 FSA = OPFS 子目录，同 store.mjs）。验的是：
//   ① 这台设备上新建的歌生来解着、没有门；三条杠「锁上（先不改了）」= 先存好再锁
//   ② 锁着：键盘 / 写入口写不进去、只闪不弹；本机那份和文件夹里那份一个字节都不变；直接叫库写 = 库自己拒（第五道）；隐藏一段（看法）能点、不存
//   ③ 歌库卡片：锁着没有「解着锁」的标记、菜单里是两个解锁；菜单「解锁：接着改」= 解了直接打开；回歌库标记在、菜单里能锁上；再打开 = 锁着，门上「接着改」
//   ④ 解锁记在这台设备上：刷新页面还解着
//   ⑤ 门上「存一版再改」= 文件夹里多一份 .backup-日期，然后解锁
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/edit-lock-gallery.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { FAKE_FSA, pickFolderFromEntry, folderBytes, folderFiles } from "./fake-fsa.mjs";
import os from "node:os"; import path from "node:path"; import { mkdirSync } from "node:fs";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); await ctx.addInitScript(FAKE_FSA);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const title = () => p.textContent("#docTitle");
const saved = async () => { for (let i = 0; i < 80 && /•/.test((await title()) ?? ""); i++) await p.waitForTimeout(100); };
const later = async () => { const x = await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('稍后')", { timeout: 600 }).catch(() => null); if (x) { await x.click(); await p.waitForTimeout(150); } };
const notes = () => p.evaluate(() => window.__moonsinger.state().song.papers.reduce((n, pp) => n + Object.values(pp.tracks).reduce((m, t) => m + t.filter((x) => x.kind === "note").length, 0), 0));
const lk = () => p.evaluate(() => window.__moonsinger.editLock());
const door = () => p.evaluate(() => { const d = document.getElementById("lockBar"); return d && !d.hidden ? [...d.querySelectorAll("button")].map((x) => x.textContent) : null; });
const armFlash = () => p.evaluate(() => document.getElementById("lockBar")?.classList.remove("flash"));
const flashed = () => p.evaluate(() => !!document.getElementById("lockBar")?.classList.contains("flash"));
const errorToasts = () => p.evaluate(() => [...document.querySelectorAll(".notice-stack [data-notice-id]")].map((n) => n.textContent ?? "").filter((t) => /改不了|没存|锁着，有改动/.test(t)));
/** 本机那一份的总目录文本（里面记着存的时刻：每存一次都变）。 */
const localStamp = (id) => p.evaluate(async (x) => { const bl = await window.__moonsinger.store().zip(x, { mode: "existing" }).getPeek({ bytesLength: 128 * 1024, zipEntry: ".moonsinger/manifest.json", source: "local" }); return bl ? await bl.text() : null; }, id);
const sigOf = (u) => { let h = 0; for (const x of u) h = (h * 31 + x) >>> 0; return `${u.length}:${h}`; };
const openGallery = async () => { await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(700); await later(); };
const tileOf = (name) => `#galleryFull .gallery-tile:has(.gallery-tile-name[title="${name}"])`;
const menuLabels = async (sel) => { await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(150); const t = await p.$$eval(".gallery-tile-menu-popup:not(.hidden) button", (bs) => bs.map((x) => x.textContent.trim())); await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(100); return t; };
const menu = async (sel, label) => {
  await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(150);
  const item = p.locator(".gallery-tile-menu-popup:not(.hidden) button", { hasText: label }).first();
  if (!(await item.count())) { await p.keyboard.press("Escape"); return false; }
  await item.click(); await p.waitForTimeout(400); return true;
};
const unlockedMark = (sel) => p.$(`${sel} [title^="解着锁"]`);

await p.goto(BASE); await p.waitForTimeout(600);
await pickFolderFromEntry(p); await p.waitForTimeout(300);
await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(500);
await p.click("#score", { position: { x: 600, y: 200 } });
for (const k of ["Digit1", "Digit3", "Digit5"]) { await p.keyboard.press(k); await p.waitForTimeout(40); }
await p.waitForFunction(() => !!window.__moonsinger.identifier()); await saved();
const id = await p.evaluate(() => window.__moonsinger.identifier()), stem = id.replace(/\.mxl$/, "");
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(150);
await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await saved(); await p.waitForTimeout(400);
const hidPaper = await p.evaluate(() => window.__moonsinger.state().song.papers[1].id);

// ── ① 新建的歌生来解着；三条杠「锁上」 ──
check(await p.evaluate(() => window.__moonsinger.store().files.lockByDefault === true), "库的开关开了：歌库里的歌默认锁着");
{ const s = await lk(); check(s.state === "unlocked" && !s.locked && (await door()) === null, "这台设备上新建的歌：生来解着，没有门", JSON.stringify(s)); }
await p.click("#setBtn"); await p.waitForTimeout(200);
check(await p.isVisible('.main-menu [data-v="lockEdit"]'), "解着：三条杠里有「锁上（先不改了）」");
await p.click('.main-menu [data-v="lockEdit"]'); await p.waitForTimeout(600);
{ const s = await lk(), d = await door();
  check(s.locked && !s.dirty, "锁上了，没有没存的东西", JSON.stringify(s));
  check(!!d && d.join("|") === "接着改|存一版再改", "歌库里的歌锁着：门上两个钮", JSON.stringify(d));
  check(await p.evaluate(() => document.body.classList.contains("doc-locked")), "界面是锁着的样子");
  await p.screenshot({ path: path.join(OUT, "lock-gallery-door.png") }); }

// ── ② 锁着：哪一道都写不进去 ──
const n0 = await notes(), stamp0 = await localStamp(id), sig0 = sigOf(await folderBytes(p, id));
await p.click("#score", { position: { x: 300, y: 200 } });
await p.keyboard.press("5"); await p.waitForTimeout(200);
check((await notes()) === n0, "电脑键盘按音键：谱没变（锁着键盘只弹不写，同「弹」；不算蹭，不闪）");
await armFlash(); await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 2, dir: "near" })); await p.waitForTimeout(200);
check((await notes()) === n0 && (await flashed()), "直接走写入口：拒了，门闪了一下");
check((await errorToasts()).length === 0, "只闪不弹（没有报错的提示）", (await errorToasts()).join(" | "));
{ const r = await p.evaluate(async (x) => { try { await window.__moonsinger.store().zip(x, { mode: "existing" }).save(new Blob([new Uint8Array([1, 2, 3])])); return "wrote"; } catch (e) { return `${e?.name ?? ""} ${e?.constructor?.name ?? ""}`; } }, id);
  check(/LockedError/.test(r), "绕过 app 直接叫库写：库自己拒（第五道）", r); }
await p.evaluate((pid) => window.__moonsinger.setPaperHidden(pid, true), hidPaper); await p.waitForTimeout(200);
{ const s = await lk(), hid = await p.evaluate((pid) => !!window.__moonsinger.state().song.papers.find((x) => x.id === pid)?.hidden, hidPaper);
  check(hid && s.dirtyKind === "looks" && s.dirty && !s.owes, "隐藏一段（看法）：锁着能点；脏的是「看法」、没有要存的东西", JSON.stringify(s)); }
await p.waitForTimeout(2600);   // 过了自动保存的节拍
check((await localStamp(id)) === stamp0, "锁着期间：本机那一份一个字节都没写");
check(sigOf(await folderBytes(p, id)) === sig0, "文件夹里那一份也没动");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check(!(await p.evaluate((pid) => !!window.__moonsinger.state().song.papers.find((x) => x.id === pid)?.hidden, hidPaper)) && !(await lk()).dirty, "撤销：翻的是看法那一步，能翻；回到存着的样子");

// ── ③ 歌库卡片：锁着 / 解着看得出来；菜单里解锁 ──
await openGallery();
check(!(await unlockedMark(tileOf(id))), "歌库卡片：锁着的没有「解着锁」的标记");
{ const ls = await menuLabels(tileOf(id));
  check(ls.some((l) => l.includes("解锁：接着改")) && ls.some((l) => l.includes("解锁：存一版再改")) && !ls.some((l) => l.includes("锁上")), "锁着的卡片菜单：两个解锁，没有「锁上」", ls.join(" | ")); }
check(await menu(tileOf(id), "解锁：接着改"), "菜单里点「解锁：接着改」"); await p.waitForTimeout(800); await later();
{ const s = await lk(); check((await p.evaluate(() => window.__moonsinger.identifier())) === id && s.state === "unlocked" && (await door()) === null, "解了，直接打开了这首：解着，没有门", JSON.stringify(s)); }
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 2, dir: "near" })); await saved();
// 等「本机那一份变了」本身（最多 8 s）：写完「•」可能还没冒出来，saved() 就直接回了，固定等 300 ms 会撞上 2 s 一跳的自动落盘（2026-11-12 单跑 4 次红 1 次；Claude Opus 5.5）
{ let st = stamp0; for (let i = 0; i < 80 && (st = await localStamp(id)) === stamp0; i++) await p.waitForTimeout(100);
  check((await notes()) === n0 + 1 && st !== stamp0, "能写了，自动存进了本机那一份"); }
await openGallery();
check(!!(await p.waitForSelector(`${tileOf(id)} [title^="解着锁"]`, { timeout: 3000 }).catch(() => null)), "回歌库：卡片上有「解着锁」的标记");
{ const ls = await menuLabels(tileOf(id)); check(ls.some((l) => l.includes("锁上")) && !ls.some((l) => l.includes("解锁")), "解着的卡片菜单：只有「锁上（先不改了）」", ls.join(" | "));
  await p.click(`${tileOf(id)} .gallery-tile-menu-btn`); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, "lock-gallery-tile.png") }); await p.click(`${tileOf(id)} .gallery-tile-menu-btn`); await p.waitForTimeout(100); }
check(await menu(tileOf(id), "锁上"), "菜单里点「锁上（先不改了）」");
{ let gone = false; for (let i = 0; i < 20 && !gone; i++) { gone = !(await unlockedMark(tileOf(id))); if (!gone) await p.waitForTimeout(100); } check(gone, "标记收掉了"); }
await p.click(tileOf(id)); await p.waitForTimeout(800); await later();
{ const s = await lk(), d = await door(); check(s.locked && !!d && d.length === 2 && (await notes()) === n0 + 1, "打开它：锁着，门在；内容是刚才写的", JSON.stringify(s)); }
await p.click('#lockBar [data-v="continue"]'); await p.waitForTimeout(500);
{ const s = await lk(); check(s.state === "unlocked" && (await door()) === null, "门上点「接着改」：解了，门收了", JSON.stringify(s)); }

// ── ④ 解锁记在这台设备上：刷新还解着 ──
await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await saved(); await p.waitForTimeout(400);
await p.reload(); await p.waitForFunction(() => !!window.__moonsinger?.editLock); await p.waitForTimeout(1200); await later();
if ((await p.evaluate(() => window.__moonsinger.identifier())) !== id) { await openGallery(); await p.click(tileOf(id)); await p.waitForTimeout(800); await later(); }
{ const s = await lk(); check((await p.evaluate(() => window.__moonsinger.identifier())) === id && s.state === "unlocked", "刷新页面再打开：还解着（记在这台设备上，一天不动才自己锁）", JSON.stringify(s)); }
check((await notes()) === n0 + 1, "内容是刷新前存下的");

// ── ⑤ 再锁上；门上「存一版再改」= 留一份底，再解锁 ──
await p.evaluate(() => window.__moonsinger.lockEditNow()); await p.waitForTimeout(600);
check((await lk()).locked && !!(await door()), "再锁上：门回来了");
await p.click('#lockBar [data-v="version"]'); await p.waitForTimeout(1200);
{ const files = Object.keys(await folderFiles(p)), ver = files.filter((f) => f.startsWith(stem) && /\.backup-\d{8}/.test(f)), s = await lk();
  check(ver.length === 1, "「存一版再改」：文件夹里多了一份 .backup-日期", files.join(" "));
  check(s.state === "unlocked" && (await door()) === null, "然后解了，门收了", JSON.stringify(s)); }
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 3, dir: "near" })); await saved(); await p.waitForTimeout(200);
check((await notes()) === n0 + 2, "接着改得动");

check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\nedit-lock-gallery: ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
