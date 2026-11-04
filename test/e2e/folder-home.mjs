// test/e2e/folder-home.mjs —— 文件夹当家 + 歌库必须有家 + 搬家（家族工单 H3；规则书 §1 第 13 条）。created 2026-11-03 by Claude Opus 5.5
//   假 FSA = showDirectoryPicker 给 OPFS 的一个子目录（真句柄、真 IDB 存句柄、folder provider 整条路跑通；同 WeebPaint tools/preflight/f9-gallery-folder.mjs）。
//   权限掉 = 装一层 queryPermission / requestPermission + 写操作抛 NotAllowedError（localStorage e2ePermLost，跨 reload）。登录 = 假的（同 gate.mjs，没账号）。
import { chromium } from "./pw.mjs";
import { FAKE_FSA, folderFiles, folderBytes, seedFolderFile } from "./fake-fsa.mjs";

const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || !extra ? "" : `  ← ${extra}`}`); };
const b = await chromium.launch();
const AUTH_NONE = () => {
  const subs = new Set(), state = (reason) => ({ signedIn: false, account: null, reason });
  window.__moonsingerAuth = {
    isAuthConfigured: () => true, initAuth: async () => state("init"), signIn: async () => { window.__e2eSignInAsked = true; }, signOut: async () => {},
    isSignedIn: () => false, getActiveAccount: () => null, getAuthState: () => state(), getToken: async () => null,
    onAuthChanged: (f) => { subs.add(f); return () => subs.delete(f); }, retrySilentSignIn: async () => false,
  };
};
async function device() {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 }, acceptDownloads: true });
  await ctx.addInitScript(AUTH_NONE);
  await ctx.addInitScript(FAKE_FSA);
  const p = await ctx.newPage(); p.__errs = []; p.__msal = 0;
  p.on("pageerror", (e) => p.__errs.push(e.message));
  p.on("request", (r) => { if (/msal/i.test(r.url()) || /login\.microsoftonline/.test(r.url())) p.__msal++; });
  await p.goto(BASE); await p.waitForFunction(() => !!window.__moonsinger?.gate);
  p.sheet = () => p.evaluate(() => { const o = [...document.querySelectorAll(".offer:not(.gate-sheet)")].find((e) => !e.hidden); return o ? o.textContent : null; });
  p.clickChoice = (label) => p.click(`.offer:not(.gate-sheet) button:has-text("${label}")`);
  p.home = () => p.evaluate(() => ({ store: window.__moonsinger.store() !== null, hasHome: window.__moonsinger.hasHome(), folder: window.__moonsinger.folderHome() }));
  p.bar = () => p.evaluate(() => { const e = document.querySelector(".gallery-home-bar"); return e && !e.hidden ? e.textContent : null; });
  p.galleryOpen = () => p.evaluate(() => { const g = document.getElementById("galleryFull"); return !!g && !g.hidden; });
  p.songs = () => p.evaluate(() => [...document.querySelectorAll("#galleryFull .gallery-mount [data-identifier], #galleryFull .tile[data-id], #galleryFull .gal-tile")].length);
  p.reopen = async () => { await p.reload(); await p.waitForFunction(() => !!window.__moonsinger?.gate); await p.waitForTimeout(500); };
  p.close2 = () => ctx.close();
  return p;
}
const typeNote = async (p, keys = ["Digit1", "Digit2", "Digit3"]) => { await p.evaluate(() => { if (document.querySelector(".pad-panel")?.hidden) document.querySelector("#padTab")?.click(); }); await p.click("#score", { position: { x: 600, y: 200 } }); for (const k of keys) { await p.keyboard.press(k); await p.waitForTimeout(40); } };
/** 选夹那一下：入口的面上点「选一个文件夹」。 */
const pickFromEntry = async (p) => { await p.click("#libBtn"); await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('选一个文件夹')"); await p.clickChoice("选一个文件夹"); await p.waitForFunction(() => { const g = document.getElementById("galleryFull"); return !!g && !g.hidden; }, null, { timeout: 8000 }); await p.waitForTimeout(300); };
/** 歌库里新建一首、写音、按「存」。 */
const newSongSaved = async (p, keys) => { await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(300); await typeNote(p, keys); await p.waitForFunction(() => !!window.__moonsinger.identifier(), null, { timeout: 8000 }); await p.click("#saveBtn"); await p.waitForTimeout(500); return p.evaluate(() => window.__moonsinger.identifier()); };

console.log("\n── 入口：没有家 = 先选家；取消什么都不建");
{
  const p = await device();
  check(!(await p.home()).store, "开局没有 store");
  await p.click("#libBtn"); await p.waitForTimeout(300);
  const t = await p.sheet();
  check(!!t && t.includes("歌库要先有个家") && t.includes("连接网盘") && t.includes("选一个文件夹"), "一句说明 + 两个去处", String(t));
  check(!!t && t.includes("存成文件"), "说了不选也行（文件模式）", String(t));
  await p.clickChoice("算了"); await p.waitForTimeout(200);
  check(!(await p.home()).store, "取消：store 没建");
  check(!(await p.galleryOpen()), "取消：歌库没开");
  const dbs = await p.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  check(!dbs.some((n) => /^moonsinger\./.test(n ?? "")), "取消：store 的 IndexedDB 一个都没有", JSON.stringify(dbs));
  await p.click("#libBtn"); await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('连接网盘')");
  await p.clickChoice("连接网盘"); await p.waitForTimeout(200);
  check(await p.evaluate(() => window.__e2eSignInAsked === true), "连接网盘 = 去登录");
  check(!(await p.home()).store, "登录回来之前不建 store");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
}

console.log("\n── 选夹 → 存一首 → 夹里出现 .mxl；改名 / 回收站在夹内；重开静默恢复");
{
  const p = await device();
  await pickFromEntry(p);
  let h = await p.home();
  check(h.store && h.hasHome && h.folder === "my-songs", "选了夹：有家", JSON.stringify(h));
  const chrome = await p.evaluate(() => { const hb = document.querySelector('#galleryFull [data-v="home"]'), cb = document.querySelector('#galleryFull [data-v="cloud"]'); return { home: !hb.hidden && hb.textContent, cloud: !cb.hidden }; });
  check(chrome.home === "my-songs" && !chrome.cloud, "顶上是文件夹按钮，云按钮让位", JSON.stringify(chrome));
  const id = await newSongSaved(p);
  let files = await folderFiles(p);
  check(!!files[id], "按「存」：夹里出现 .mxl", JSON.stringify(files));
  const head = await folderBytes(p, id);
  check(head[0] === 0x50 && head[1] === 0x4b, "夹里的就是 .mxl（zip）");
  check(await p.evaluate(() => document.getElementById("saveBtn").dataset.kind) === "clean", "状态 = 写进去了");
  check(/文件夹/.test(await p.evaluate(() => document.getElementById("saveBtn").title)), "状态说的是文件夹不是云端", await p.evaluate(() => document.getElementById("saveBtn").title));
  check(p.__msal === 0, "全程没碰微软", String(p.__msal));
  check(!(await p.evaluate(() => [...document.querySelectorAll(".gate-sheet")].some((e) => /检查云端/.test(e.textContent ?? "")))), "没闪过「检查云端」（问的是本机硬盘）");
  await p.reopen(); await p.waitForTimeout(400);
  h = await p.home();
  check(h.folder === "my-songs" && h.store, "重开：静默恢复（没弹框）", JSON.stringify(h));
  check(!(await p.sheet()), "重开：没有面");
  check(await p.evaluate(() => (window.__fsaRequests ?? 0) === 0), "重开：没要权限（只 query）");
  check((await p.evaluate(() => window.__moonsinger.identifier())) === id, "重开：回到这首", String(await p.evaluate(() => window.__moonsinger.identifier())));
  // 改名
  const renamed = id.replace(/\.mxl$/, "-改名.mxl");
  const mv = await p.evaluate(async ([from, to]) => { const r = await window.__moonsinger.store().zip(from, { mode: "existing" }).tryMove(to); return r.status ?? "ok"; }, [id, renamed]);
  await p.waitForTimeout(400);
  files = await folderFiles(p);
  check(!!files[renamed] && !files[id], "改名：夹里跟着改", `${mv} ${JSON.stringify(files)}`);
  // 回收站
  const tr = await p.evaluate(async (x) => (await window.__moonsinger.store().zip(x, { mode: "existing" }).trash()).status, renamed);
  await p.waitForTimeout(400);
  files = await folderFiles(p);
  check(!files[renamed] && Object.keys(files).some((k) => k.startsWith(".trash/")), "回收站 = 夹内的 .trash", `${tr} ${JSON.stringify(files)}`);
  // 不用这个文件夹了：夹里的歌不动，回到没有家
  await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(400);
  await p.click('#galleryFull [data-v="home"]'); await p.waitForSelector('.offer:not(.gate-sheet) button:has-text("不用这个文件夹了")');
  await p.clickChoice("不用这个文件夹了"); await p.waitForTimeout(500);
  const left = await p.sheet(); if (left && left.includes("没写进文件夹")) { await p.clickChoice("照样退出"); await p.waitForTimeout(500); }
  h = await p.home();
  check(!h.store && !h.hasHome && h.folder === null, "离开：没有家了", JSON.stringify(h));
  check(Object.keys(await folderFiles(p)).length > 0, "离开：夹里的东西一个不动");
  await p.reopen();
  check(!(await p.home()).store, "离开后重开：不自动挂回去");
  await pickFromEntry(p);
  check((await p.home()).folder === "my-songs", "再选同一个夹：接上");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
}

console.log("\n── 权限掉了：chip → 一键再授权；中途掉也认");
{
  const p = await device();
  await pickFromEntry(p);
  const id = await newSongSaved(p);
  const bytes0 = (await folderBytes(p, id)).length;
  await p.evaluate(() => localStorage.setItem("e2ePermLost", "1"));
  await p.reopen(); await p.waitForTimeout(400);
  let h = await p.home();
  check(h.hasHome && h.folder === "my-songs", "权限掉 ≠ 没有家（不回到选家）", JSON.stringify(h));
  check(await p.evaluate(() => (window.__fsaRequests ?? 0) === 0), "开机没弹授权");
  check((await p.evaluate(() => window.__moonsinger.identifier())) === id, "本机那份照样打开");
  check(await p.evaluate(() => document.getElementById("saveBtn").dataset.kind) === "offline", "状态 = 离线态");
  await typeNote(p, ["Digit5"]); await p.waitForTimeout(150);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());
  check((await folderBytes(p, id)).length === bytes0, "权限掉的时候不写夹（改动攒在本机）");
  await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(500);
  const t = await p.bar();
  check(!!t && t.includes("权限掉了") && t.includes("重新授权"), "歌库顶上一颗重新授权", String(t));
  await p.click('.gallery-home-bar [data-v="regrant"]'); await p.waitForTimeout(600);
  check(await p.evaluate(() => (window.__fsaRequests ?? 0) === 1), "点了才要权限（手势里）");
  check(!(await p.bar()), "授权后条收了", String(await p.bar()));
  await p.waitForTimeout(200);
  check((await p.home()).folder === "my-songs", "还是这个家");
  // 中途掉：写的时候抛 NotAllowedError
  const later = await p.sheet(); if (later) await p.clickChoice("稍后").catch(() => {});
  await p.evaluate(() => { window.__fsaLost = true; });
  const pushed = await p.evaluate(async (x) => { const f = window.__moonsinger.store().zip(x, { mode: "existing" }); const b = await f.open(); const r = await f.save(new Uint8Array(await b.arrayBuffer()), { tryPush: true }); return r?.pushed; }, id);
  await p.waitForTimeout(500);
  check(pushed !== true, "中途掉：这次没写进去，没谎报", String(pushed));
  const t2 = await p.bar();
  check(!!t2 && t2.includes("权限掉了"), "中途掉：抛错之后认成离线态，条又挂上了", String(t2));
  await p.evaluate(() => { window.__fsaLost = false; });
  await p.click('.gallery-home-bar [data-v="regrant"]'); await p.waitForTimeout(500);
  check(!(await p.bar()), "再授权一次又好了", String(await p.bar()));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
}

// 旧库 = 老版本没登录时建的「只在浏览器里」的歌库：attach 钩子（默认 databaseId、不选家）+ 几首歌
async function seedLegacy(p, n) {
  await p.evaluate(() => window.__moonsinger.attach());
  const out = {};
  for (let i = 0; i < n; i++) {
    await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(250);
    await typeNote(p, [`Digit${(i % 7) + 1}`, "Digit2"]); await p.waitForFunction(() => !!window.__moonsinger.identifier(), null, { timeout: 8000 });
    await p.evaluate(() => window.__moonsinger.es().flushLocal());
    const id = await p.evaluate(() => window.__moonsinger.identifier());
    out[id] = await p.evaluate(async (x) => [...new Uint8Array(await (await window.__moonsinger.store().zip(x, { mode: "existing" }).open()).arrayBuffer())], id);
  }
  return out;
}
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
/** 搬之前那一刻旧库里的字节（切歌时还会再落一次盘，种子那会儿的不算数）。 */
const legacyBytes = (p, ids) => p.evaluate(async (list) => { const out = {}; for (const x of list) out[x] = [...new Uint8Array(await (await window.__moonsinger.store().zip(x, { mode: "existing" }).open()).arrayBuffer())]; return out; }, ids);

console.log("\n── 搬家：旧库 3 首 → 开机问一次 → 新家 3 首字节相等 → 旧库空");
{
  const p = await device();
  const seeded = await seedLegacy(p, 3);
  check(Object.keys(seeded).length === 3, "旧库 3 首（前提）");
  await p.reopen(); await p.waitForTimeout(600);
  const t = await p.sheet();
  check(!!t && t.includes("3 首歌") && t.includes("选一个文件夹") && t.includes("全部导出") && t.includes("稍后"), "开机问一次：三个去处", String(t));
  const before = await legacyBytes(p, Object.keys(seeded));
  await p.clickChoice("选一个文件夹，搬进去"); await p.waitForTimeout(1500);
  const h = await p.home();
  check(h.folder === "my-songs" && h.hasHome, "挂上了刚选的家", JSON.stringify(h));
  const files = await folderFiles(p);
  const songFiles = Object.keys(files).filter((k) => k.endsWith(".mxl") && !k.startsWith("."));
  check(songFiles.length === 3, "新家 3 首", JSON.stringify(files));
  let eq3 = true; for (const [id, bytes] of Object.entries(before)) eq3 = eq3 && same([...(await folderBytes(p, id))], bytes);
  check(eq3, "逐首字节相等");
  check((await p.evaluate(() => window.__moonsinger.legacySongs())).length === 0, "旧库空了");
  await p.reopen(); await p.waitForTimeout(600);
  check(!(await p.sheet()), "重开：不再问", String(await p.sheet()));
  check((await p.home()).folder === "my-songs", "重开：家是文件夹");
  await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(400);
  check(!(await p.bar()), "歌库顶上没有旧歌那条了", String(await p.bar()));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
}

console.log("\n── 搬家：稍后 = 条照挂、入口不收、不再弹；撞名不覆盖");
{
  const p = await device();
  const seeded = await seedLegacy(p, 2);
  await p.reopen(); await p.waitForTimeout(600);
  check(!!(await p.sheet()), "问了一次（前提）");
  await p.clickChoice("稍后"); await p.waitForTimeout(200);
  check((await p.home()).store, "稍后：旧库还开着");
  await p.reopen(); await p.waitForTimeout(600);
  check(!(await p.sheet()), "稍后之后：重开不再弹");
  await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(500);
  check(await p.galleryOpen(), "入口不收：还能进");
  const t = await p.bar();
  check(!!t && t.includes("只在这台设备的浏览器里") && t.includes("搬进一个文件夹") && t.includes("全部导出"), "披露条照挂", String(t));
  check((await p.evaluate(() => window.__moonsinger.legacySongs())).length === 2, "歌都还在");
  // 新家里已经有一首同名、字节不同的
  const [first] = Object.keys(seeded);
  await seedFolderFile(p, first, [1, 2, 3, 4]);
  const before2 = await legacyBytes(p, Object.keys(seeded));
  await p.click('.gallery-home-bar [data-v="move"]'); await p.waitForTimeout(1500);
  const files = await folderFiles(p);
  check(files[first] === 4, "新家原来那份一个字节没动", JSON.stringify(files));
  const clones = Object.keys(files).filter((k) => k.endsWith(".mxl") && k !== first && !k.startsWith("."));
  check(clones.length === 2, "撞名的换了名字，两首都在", JSON.stringify(files));
  const clone = clones.find((k) => k.startsWith(first.replace(/\.mxl$/, "-")));
  check(!!clone && same([...(await folderBytes(p, clone))], before2[first]), "换名那份字节相等", String(clone));
  check((await p.evaluate(() => window.__moonsinger.legacySongs())).length === 0, "旧库空了");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
}

console.log("\n── 没有家、也没有歌：不留一个空库");
{
  const p = await device();
  await p.evaluate(() => window.__moonsinger.attach()); await p.waitForTimeout(200);
  await p.reopen(); await p.waitForTimeout(700);
  check(!(await p.home()).store, "没账号没歌：库拆了", JSON.stringify(await p.home()));
  check(!(await p.galleryOpen()), "没停在一个没有家的歌库里");
  check(!(await p.sheet()), "没有多余的面");
  await p.click("#libBtn"); await p.waitForTimeout(300);
  check(((await p.sheet()) ?? "").includes("歌库要先有个家"), "再点 = 先选家");
  await p.close2();
}

console.log("\n── 这个浏览器选不了夹：那一个去处画灰，不假装能用");
{
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
  await ctx.addInitScript(AUTH_NONE);
  await ctx.addInitScript(() => { delete window.showDirectoryPicker; Object.defineProperty(window, "showDirectoryPicker", { value: undefined, configurable: true }); });
  const p = await ctx.newPage(); await p.goto(BASE); await p.waitForFunction(() => !!window.__moonsinger?.gate);
  await p.click("#libBtn"); await p.waitForTimeout(300);
  const g = await p.evaluate(() => { const bs = [...document.querySelectorAll(".offer:not(.gate-sheet) button")]; const f = bs.find((x) => x.textContent.includes("选一个文件夹")), c = bs.find((x) => x.textContent.includes("连接网盘")); return { off: f?.disabled, cloud: c?.disabled, text: document.querySelector(".offer:not(.gate-sheet)").textContent }; });
  check(g.off === true && g.cloud === false, "文件夹灰、网盘可点", JSON.stringify(g));
  check(g.text.includes("选不了文件夹"), "说了为什么", g.text);
  await ctx.close();
}

await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
