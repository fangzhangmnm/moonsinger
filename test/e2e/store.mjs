// test/e2e/store.mjs —— 真浏览器 E2E（先 npm run build，再 npm run serve（8710），再 node test/e2e/store.mjs；借 WeebPaint 的 playwright，同 shell-smoke）。created 2026-10-08 by Claude Fable 5.1
// 歌库 E2E（真浏览器、真 IDB、不登录云）：无地开局 → 点「歌库」attach → 新建 → 写几个音 → 自动存 → 刷新回到同一首 → 改名 → 封面图 → 歌库卡片 → 删「打开中」→ 回来变无地稿。
import { chromium } from "./pw.mjs";
import os from "node:os"; import path from "node:path";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
import fs from "node:fs"; import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const URL0 = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
// 一张 64×48 的 PNG（红色）当封面图
function png(w, h) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 200; raw[o + 1] = 40 + x; raw[o + 2] = 60; } }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/已经进了回收站/.test(m.text())) errs.push("console: " + m.text()); });
  const title = () => p.textContent("#docTitle");
  const tokens = () => p.evaluate(() => JSON.stringify(window.__moonsinger.state().song.papers[0].tracks.P1.filter((t) => t.kind === "note").map((t) => t.pitch)));
  await p.goto(URL0); await p.waitForTimeout(500);
  check(await p.evaluate(() => window.__moonsinger.store() === null), "无地开局：store 没建");
  check(await p.evaluate(() => localStorage.length === 0 || ![...Array(localStorage.length)].some((_, i) => localStorage.key(i).includes("moonsinger."))), "无地开局：没有 store 的 localStorage 键");
  // 进歌库（attach）
  await p.click("#libBtn"); await p.waitForTimeout(800);
  check(await p.evaluate(() => window.__moonsinger.store() !== null), "点「歌库」= 建 store");
  check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)), "歌库屏开着");
  check(await p.evaluate(() => document.body.dataset.mode === "gallery"), "body[data-mode=gallery]");
  const emptyText = await p.textContent("#galleryFull"); check(/还没有歌/.test(emptyText), "空歌库文案（歌库口吻）", emptyText.slice(0, 60));
  // 歌库顶条「乐器」= 只弹着玩的乐器目录，盖在歌库上面；「←」回歌库（2026-10-08 Opus；user「歌库应该有一个专门的乐器目录的入口」）
  await p.click('#galleryFull [data-v="instruments"]'); await p.waitForSelector(".inst-row");
  check((await p.textContent(".finder-title")) === "乐器目录（弹着玩）" && !(await p.$('.finder [data-v="cast"]')), "歌库「乐器」= 只弹着玩的目录（没有「上场」）");
  {   // 屏幕够宽 = 多列（2026-10-09，user「挑乐曲界面到时候屏幕空间够的话做成多列的，好挑一点」）
    const fw = await p.$eval(".finder-list", (e) => e.clientWidth), cols = await p.$eval(".finder-items", (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
    check(cols === Math.max(1, Math.floor(fw / 260)), `目录 ${fw}px 宽 = ${cols} 列（每格至少 260 px）`);
    // （点开一件 = 自动选中提供者、去拉 32 MB 的 GS 音源，本地服务器没有 → 不在这里点；点开后「谁能演」横跨整行在下面，靠 CSS .finder-items > .inst-prov，10-09 截图核过）
  }
  await p.click('.finder [data-v="back"]'); await p.waitForTimeout(200);
  check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)) && (await p.$eval(".finder", (f) => f.hidden)), "目录「← 歌库」= 回到歌库");
  // 新建一首
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(600);
  check(await p.evaluate(() => document.getElementById("galleryFull").hidden), "新建后回到谱");
  // 首笔安家（user 2026-10-08「首笔安家做」）：新建 = 空谱没有家、不落盘；第一笔才铸身份、立刻落本地
  check((await p.evaluate(() => window.__moonsinger.identifier())) === null, "新建 = 空谱还没有家");
  check((await p.evaluate(() => document.getElementById("saveBtn").dataset.kind)) === "fresh", "smart save = fresh（新谱没改过）");
  await p.click("#saveBtn"); await p.waitForTimeout(300);
  check((await p.evaluate(() => window.__moonsinger.identifier())) === null, "空谱按「存」= 诚实回话，不塞空壳进歌库");
  await p.click("#score", { position: { x: 600, y: 400 } });
  await p.keyboard.press("Digit1");
  await p.waitForFunction(() => !!window.__moonsinger.identifier()); await p.waitForTimeout(400);
  const id1 = await p.evaluate(() => window.__moonsinger.identifier()); check(/^\d{8}-[0-9a-f]{4}\.mxl$/.test(id1 ?? ""), "第一笔 → 有了 store 身份", id1);
  check(await p.evaluate((id) => window.__moonsinger.store().files.occupied(id), id1), "安家即落本地：身份在 store 里（occupied）");
  const t1 = await title(); check(!/•/.test(t1), "安家那一笔已经存了，没有「•」", t1);
  // 再写几个音 → 「•」→ 2 s 后自动存
  for (const k of ["Digit3", "Digit5"]) await p.keyboard.press(k);
  await p.waitForTimeout(300);
  check(/•$/.test(await title()), "写了之后「•」", await title());
  await p.waitForTimeout(3500);
  check(!/•/.test(await title()), "2 s 内自动存了（「•」消失）", await title());
  const toks1 = await tokens();
  const bytes1 = await p.evaluate(async (id) => { const bl = await window.__moonsinger.store().zip(id, { mode: "existing" }).open(); return bl ? bl.size : -1; }, id1);
  check(bytes1 > 500, "store 里的字节是个 .mxl", String(bytes1));
  // 刷新 → 回到同一首
  await p.reload(); await p.waitForTimeout(1200);
  check(await p.evaluate(() => window.__moonsinger.store() !== null), "刷新后 store 自动建（进过歌库）");
  check((await p.evaluate(() => window.__moonsinger.identifier())) === id1, "刷新后回到同一首", await p.evaluate(() => window.__moonsinger.identifier()));
  check((await tokens()) === toks1, "音符逐个相同");
  check(await p.evaluate(() => document.getElementById("galleryFull").hidden), "刷新后在谱上（上次在谱上离开的）");
  // 三条杠菜单：这首歌的事务 + 设置；歌库 / 云端 / 录音室 / 乐器目录的入口在别处（2026-10-08 user「三条杠里面不应该有乐器目录，云端，歌库 录音室」）
  await p.click("#setBtn"); await p.waitForTimeout(200);
  check(await p.isVisible('.main-menu [data-v="export"]') && await p.isVisible('.main-menu [data-v="settings"]') && !(await p.$('.main-menu [data-v="lib"], .main-menu [data-v="cloud"], .main-menu [data-v="studio"], .main-menu [data-v="finder"]')), "三条杠 = 导出 / 设置…，没有歌库 / 云端 / 录音室 / 乐器目录");
  await p.click("#setBtn"); await p.waitForTimeout(150);
  check(!(await p.$(".main-menu")), "再点三条杠 = 收起");
  // 改名（点文件名 = 改名，同 WXHW）
  await p.click("#fileBtn"); await p.waitForTimeout(200);
  await p.fill(".offer input.sheet-input", "小星星"); await p.keyboard.press("Enter"); await p.waitForTimeout(600);
  const id2 = await p.evaluate(() => window.__moonsinger.identifier()); check(id2 === "小星星.mxl", "改名 = store tryMove 后的新身份", id2);
  check(!(await p.evaluate((id) => window.__moonsinger.store().files.occupied(id), id1)), "旧身份不再占用");
  check((await title()).startsWith("小星星"), "标题跟着新名", await title());
  // 封面图（三条杠 → 封面图…）
  await p.click("#setBtn"); await p.waitForTimeout(200); await p.click('.main-menu [data-v="cover"]'); await p.waitForTimeout(200);
  const tmp = path.join(OUT, "cover.png"); fs.writeFileSync(tmp, png(64, 48));
  await p.setInputFiles("#coverIn", tmp); await p.waitForTimeout(600);
  const thumbLen = await p.evaluate(() => window.__moonsinger.extras().thumbnail?.length ?? 0); check(thumbLen > 100 && thumbLen < 70 * 1024, "封面图缩成 PNG 进 extras", String(thumbLen));
  await p.waitForTimeout(3500);
  const zipHas = await p.evaluate(async (id) => { const bl = await window.__moonsinger.store().zip(id, { mode: "existing" }).open(); const u = new Uint8Array(await bl.arrayBuffer()); const list = window.__moonsinger.zipList(u); return { last: list[list.length - 1], n: list.length }; }, id2);
  check(zipHas.last === "Thumbnails/thumbnail.png", "存的 zip 最后一个 entry = Thumbnails/thumbnail.png（尾读）", JSON.stringify(zipHas));
  const peek = await p.evaluate(async (id) => { const bl = await window.__moonsinger.store().zip(id, { mode: "existing" }).getPeek({ bytesLength: 128 * 1024, zipEntry: "Thumbnails/thumbnail.png", source: "local" }); return bl ? bl.size : -1; }, id2);
  check(peek > 100, "store getPeek 尾读到封面", String(peek));
  // 歌库卡片
  await p.click("#libBtn"); await p.waitForTimeout(1500);
  const cards = await p.$$eval("#galleryFull .gallery-tile", (ts) => ts.map((t) => t.textContent.replace(/\s+/g, " ").trim()));
  check(cards.length === 1 && /小星星/.test(cards[0]), "歌库里一张卡、印着歌名", JSON.stringify(cards));
  check(await p.$("#galleryFull .gallery-tile .ms-cover.v .ms-cover-title") != null, "汉字歌名竖排（.ms-cover.v）");
  const thumbImg = await p.$("#galleryFull .gallery-tile img.gallery-tile-thumb"); check(thumbImg != null, "卡片底下是封面图（img.gallery-tile-thumb）");
  await p.screenshot({ path: path.join(OUT, "store-gallery.png") });
  // gallery-first（2026-10-08 user「7 和weebpaint对齐」）：进歌库 = 放下手里的歌——卡片不再标「打开中」，没有「回到谱」（Esc 不出去），出口 = 打开一首 / 新建
  check(!/打开中/.test(cards[0]), "进歌库 = 放下手里的歌：卡片不标「打开中」");
  check((await p.evaluate(() => window.__moonsinger.identifier())) === null && (await p.evaluate(() => window.__moonsinger.es().currentName())) === null, "进歌库后没有打开中的歌（身份放下了）");
  check(!(await p.$('#galleryFull [data-v="back"]')), "歌库顶条没有「回到谱」");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)), "Esc 不出歌库（没有地方可回）");
  await p.click("#galleryFull .gallery-tile:has-text('小星星')"); await p.waitForTimeout(800);
  check(await p.evaluate(() => document.getElementById("galleryFull").hidden) && (await p.evaluate(() => window.__moonsinger.identifier())) === id2, "点卡片 = 打开它、出歌库");
  check((await tokens()) === toks1, "放下再打开：音符仍相同（进歌库时落盘了）");
  // 刷新在歌库里离开 → 回来在歌库
  await p.click("#libBtn"); await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(1200);
  check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)), "从歌库里刷新 → 回来还在歌库");
  // 第二首：新建后歌库两张卡，点第一张切回
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(600);
  await p.click("#score", { position: { x: 600, y: 400 } }); await p.keyboard.press("Digit2");
  await p.waitForFunction(() => !!window.__moonsinger.identifier()); await p.waitForTimeout(400);
  const id3 = await p.evaluate(() => window.__moonsinger.identifier()); check(id3 !== id2 && /\.mxl$/.test(id3), "第二首：第一笔之后有身份", id3);
  await p.click("#libBtn"); await p.waitForTimeout(1200);
  const n2 = await p.$$eval("#galleryFull .gallery-tile", (ts) => ts.length); check(n2 === 2, "两张卡", String(n2));
  await p.click("#galleryFull .gallery-tile:has-text('小星星')"); await p.waitForTimeout(800);
  check((await p.evaluate(() => window.__moonsinger.identifier())) === id2, "点卡片切回小星星");
  check((await tokens()) === toks1, "切回来音符仍相同");
  // 歌库里把小星星扔进回收站（模拟歌库动词：直接走 store；gallery-first 下它已经不是打开中的）→ 新建再写一笔：绝不把删掉的名字复活
  await p.click("#libBtn"); await p.waitForTimeout(600);
  const del = await p.evaluate(async (id) => (await window.__moonsinger.store().zip(id, { mode: "existing" }).delete()).status, id2);
  check(typeof del === "string", "删掉小星星（store delete）", del);
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(600);
  await p.click("#score", { position: { x: 600, y: 400 } }); await p.keyboard.press("Digit2"); await p.waitForTimeout(3500);
  check(!(await p.evaluate((id) => window.__moonsinger.store().files.occupied(id), id2)), "之后新建再写也不会把删掉的名字复活");
  const id4 = await p.evaluate(() => window.__moonsinger.identifier()); check(!!id4 && id4 !== id2 && id4 !== id3, "新的一首有自己的身份", id4);
  // 新建文件夹（2026-10-10 user「gallery怎么没接新建文件夹的功能，这个应该只是接线吧，不过小心一点」）：歌库顶栏的钮 → 起名 → store.files.newFolder → 歌库里出现这个夹
  await p.click("#libBtn"); await p.waitForTimeout(600);
  const folderNames = () => p.$$eval("#galleryFull .gallery-folder, #galleryFull [data-folder]", (es) => es.map((e) => e.textContent.trim()));
  const before = (await p.textContent("#galleryFull")) ?? "";
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-folder"]'); await p.waitForTimeout(250);
  check(await p.$eval(".offer input.sheet-input", (e) => e.value === "新文件夹").catch(() => false), "新建文件夹：问名字（默认「新文件夹」）");
  await p.fill(".offer input.sheet-input", "副歌草稿"); await p.keyboard.press("Enter"); await p.waitForTimeout(1200);
  const after = (await p.textContent("#galleryFull")) ?? "";
  check(!before.includes("副歌草稿") && after.includes("副歌草稿"), "歌库里出现了「副歌草稿」这个夹", JSON.stringify(await folderNames()));
  // 同名再建 = 说一声、不另建
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-folder"]'); await p.waitForTimeout(250);
  await p.fill(".offer input.sheet-input", "副歌草稿"); await p.keyboard.press("Enter"); await p.waitForTimeout(800);
  check(((await p.textContent("#galleryFull")) ?? "").split("副歌草稿").length - 1 === 1, "同名的夹不再建第二个");
  // 名字里有 / = 不建、说一声
  await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-folder"]'); await p.waitForTimeout(250);
  await p.fill(".offer input.sheet-input", "a/b"); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  check(!((await p.textContent("#galleryFull")) ?? "").includes("a/b") && !(await p.$$eval("#galleryFull *", (es) => es.some((e) => e.textContent.trim() === "a"))), "名字带 / = 不建");
  // 冲突面 / 报错 / busy 接线存在（storeUI 对象）
  const ui = await p.evaluate(() => { const s = window.__moonsinger.store(); return !!s; });
  check(ui, "store 活着");
  check(errs.length === 0, "零页面错误", errs.join(" | ").slice(0, 300));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
