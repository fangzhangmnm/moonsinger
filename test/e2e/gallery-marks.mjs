// test/e2e/gallery-marks.mjs —— 真浏览器 E2E：收 store 2.3.1 + gallery 0.9.2 之后歌库里新到的四样——星（加了星的送不进回收站）/ 收起 / 存一版 / 文件夹和歌排在同一条时间线。
// created 2026-11-10 by Claude Fable 5.2（修改锁设计稿第十节第 2 步「只收库，不开锁」；家族修改锁标准第七节）。
//   真 app + 真库 + 真 IndexedDB；家 = 文件夹（假 FSA = OPFS 子目录，同 store.mjs）。修改锁的开关 v0.16.97 打开了：锁的行为在 edit-lock-gallery.mjs，这里只看菜单里有没有。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/gallery-marks.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { FAKE_FSA, pickFolderFromEntry, folderFiles } from "./fake-fsa.mjs";
import os from "node:os"; import path from "node:path"; import { mkdirSync } from "node:fs";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } }); await ctx.addInitScript(FAKE_FSA);
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(500);
  await pickFolderFromEntry(p); await p.waitForTimeout(400);
  /** 从没写进文件夹的歌，回来时问一次「现在传 / 稍后」（规则书第 15 条）；这里测的不是这张面。 */
  const later = async () => { const x = await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('稍后')", { timeout: 800 }).catch(() => null); if (x) { await x.click(); await p.waitForTimeout(150); } };
  // 一首歌：新建 → 写三个音 → 按「存」的那条路（落本机 + 写进文件夹）→ 回歌库
  await p.click('#galleryFull [data-v="new"]'); await p.click('[data-v="new-song"]'); await p.waitForTimeout(400);   // 歌库的「新建 → 新建歌」：回到谱上
  await p.evaluate(() => { if (document.querySelector(".pad-panel")?.hidden) document.querySelector("#padTab")?.click(); });
  await p.click("#score", { position: { x: 300, y: 200 } }); for (const k of ["1", "2", "3"]) await p.keyboard.press(k);
  await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await p.waitForTimeout(300);
  const id = await p.evaluate(() => window.__moonsinger.identifier()), stem = id.replace(/\.mxl$/, "");
  await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(600); await later();
  const tile = `#galleryFull .gallery-tile:has-text("${stem}")`;
  check(!!(await p.$(tile)), "歌库里有这首歌的卡片", id);
  check(await p.evaluate(() => window.__moonsinger.store().files.fileMarks === true && window.__moonsinger.store().files.lockByDefault === true), "库：星 / 收起的记号开着，修改锁的开关也开着（v0.16.97 起）");

  /** 点开这张卡的「⋯」→ 点菜单里写着这几个字的那一项。 */
  const menu = async (sel, label) => {
    await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(150);
    const item = p.locator(".gallery-tile-menu-popup:not(.hidden) button", { hasText: label }).first();
    if (!(await item.count())) { await p.keyboard.press("Escape"); return false; }
    await item.click(); await p.waitForTimeout(350); return true;
  };
  const menuLabels = async (sel) => { await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(150); const t = await p.$$eval(".gallery-tile-menu-popup:not(.hidden) button", (bs) => bs.map((x) => x.textContent.trim())); await p.click(`${sel} .gallery-tile-menu-btn`); await p.waitForTimeout(100); return t; };

  // ── 图标：库的模板里点名的图标页面里都有（「⋯」从接歌库那天起一直是空的，v0.16.95 补齐；单元守卫 test/package-icons.test.mjs 管名字，这里看真的画出来了）──
  const inked = async (sel) => { const loc = p.locator(sel).first(); if (!(await loc.count())) return "没有这个元素"; return loc.evaluate((el) => { const u = el.querySelector("use"); if (!u) return "没有 <use>"; const ref = (u.getAttribute("href") ?? "").slice(1); const sym = document.getElementById(ref); return sym && sym.querySelector("path, circle, rect, line, polyline, polygon, ellipse") ? "ok" : `#${ref} 是空的`; }); };
  check((await inked(`${tile} .gallery-tile-menu-btn`)) === "ok", "卡片右上角的「⋯」有图标", await inked(`${tile} .gallery-tile-menu-btn`));
  const labels0 = await menuLabels(tile);
  check(["加星", "收起", "存一版"].every((w) => labels0.some((l) => l.includes(w))), "「⋯」菜单里有 加星 / 收起 / 存一版", labels0.join(" | "));
  check(labels0.some((l) => l.includes("锁上")) && !labels0.some((l) => l.includes("解锁")), "这台设备上新建的歌生来解着：菜单里是「锁上（先不改了）」，没有解锁", labels0.join(" | "));
  {
    await p.click(`${tile} .gallery-tile-menu-btn`); await p.waitForTimeout(150);
    const bad = await p.$$eval(".gallery-tile-menu-popup:not(.hidden) button", (bs) => bs.filter((x) => { const u = x.querySelector("use"); if (!u) return false; const sym = document.getElementById((u.getAttribute("href") ?? "").slice(1)); return !sym || !sym.querySelector("path, circle, rect, line, polyline, polygon, ellipse"); }).map((x) => x.textContent.trim()));
    check(bad.length === 0, "菜单里每一项的图标都画得出来", bad.join(" | "));
    await p.screenshot({ path: path.join(OUT, "gallery-marks-menu.png") });
    await p.click(`${tile} .gallery-tile-menu-btn`); await p.waitForTimeout(100);
  }

  // ── 星：加了星的送不进回收站；撤星之后才行 ──
  check(await menu(tile, "加星"), "点「加星」");
  check(!!(await p.$(`${tile} .gallery-tile-star`)), "卡片上有星");
  check((await inked(`${tile} .gallery-tile-star`)) === "ok", "星的图标画得出来（图标库里还没有，先用烤出来的「星」字顶位）", await inked(`${tile} .gallery-tile-star`));
  check(await p.evaluate((x) => window.__moonsinger.store().files.watchFolder && new Promise((res) => { const s = window.__moonsinger.store(); let off; off = s.files.watchFolder("", (f) => { res(f.items.some((i) => i.identifier === x && i.starred === true)); setTimeout(() => off?.(), 0); }); }), id), "库的列举里这首带着星");
  await menu(tile, "回收站"); await p.waitForTimeout(300);
  {   // 库拒绝（StarredError），图库的面自己说；不管它问没问「确定」，卡片都还在
    const ask = await p.$(".offer:not(.gate-sheet) button.primary, .offer:not(.gate-sheet) button.danger"); if (ask) { await ask.click(); await p.waitForTimeout(400); }
    check(!!(await p.$(tile)), "加了星：送回收站被拒，卡片还在");
    const files = await folderFiles(p);
    check(Object.keys(files).includes(id), "文件夹里那首歌的文件没动", Object.keys(files).join(" "));
  }
  check(await menu(tile, "撤星"), "点「撤星」");
  check(!(await p.$(`${tile} .gallery-tile-star`)), "星没了");

  // ── 存一版：复制一份「原名.backup-日期」，同一个文件夹，收在原作卡片下面 ──
  check(await menu(tile, "存一版"), "点「存一版」"); await p.waitForTimeout(600);
  {
    const files = Object.keys(await folderFiles(p)), ver = files.filter((f) => f.startsWith(stem) && /\.backup-\d{8}/.test(f));
    check(ver.length === 1, "文件夹里多了一份 .backup-日期", files.join(" "));
    check(files.includes(id), "原来那首还在");
    check(!!(await p.$(`${tile} .gallery-tile-versions`)), "原作卡片上有「+1」那颗（存下来的各版收在它下面）");
    check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)), "存一版之后人还在歌库里");
  }

  // ── 收起：纯显示，文件原地不动；挨着的合成一条细条，点开原地摊开 ──
  check(await menu(tile, "收起"), "点「收起」"); await p.waitForTimeout(300);
  check(!!(await p.$("#galleryFull .gallery-fold-strip")), "收起的那份变成一条细条");
  check(Object.keys(await folderFiles(p)).includes(id), "收起不动文件");
  await p.click("#galleryFull .gallery-fold-strip"); await p.waitForTimeout(300);
  check(!!(await p.$(tile)), "点细条 = 原地摊开，卡片回来");
  check(await menu(tile, "取消收起"), "点「取消收起」"); await p.waitForTimeout(300);
  check(!(await p.$("#galleryFull .gallery-fold-strip")) && !!(await p.$(tile)), "细条没了，卡片照常");

  // ── 文件夹和歌同一条时间线：名字以 8 位日期开头的按日期排（新的在上），不再把文件夹钉在最上面 ──
  await p.evaluate(() => window.__moonsinger.store().files.newFolder("20200101-老歌")); await p.waitForTimeout(200);
  await p.click('#galleryFull [data-v="refresh"]').catch(() => {}); await p.waitForTimeout(600);
  {
    const order = await p.$$eval("#galleryFull .gallery-tile", (ts) => ts.map((t) => (t.querySelector(".gallery-tile-name")?.textContent ?? t.textContent).trim().slice(0, 24)));
    const iSong = order.findIndex((x) => x.includes(stem)), iFolder = order.findIndex((x) => x.includes("20200101-老歌"));
    check(iSong >= 0 && iFolder >= 0 && iSong < iFolder, "今天的歌排在 2020 年的文件夹前面", order.join(" | "));
  }
  check(errs.length === 0, "页面零报错", errs.join(" ; "));
} finally { await b.close(); }
console.log(`\ngallery-marks: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
