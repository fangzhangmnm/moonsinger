// test/e2e/render-cache.mjs —— 真浏览器 E2E：定稿退役之后，渲好的声音只记在这台设备上（src/app/render-cache.ts），歌文件里不再有 mp3；歌库封面上的 ▶ 从设备上取。
// created 2026-11-10 by Claude Fable 5.2（取代 test/e2e/final.mjs；设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md 第九、十一节）。
//   user 11-09「完全不应该保管理 MP 三」「软件在设备上记着不就行了？」；11-10「对，以后统一不存mp3，旧的也删掉」「本地歌缓存？最好能有锁屏播放？这样我可以听歌」。
//   ① 导出一次 = 记在设备上、挂到这首歌名下；内容没变再导出 = 直接拿（不重唱）；歌文件里没有 mp3
//   ② 歌库：没记着的没有 ▶；记着的有 ▶、点了放（播放条 / 循环 / 从头放 / 停）；歌改了 = ▶ 收掉；改回去 = 又认得
//   ③ 老文件（旧版本定稿过、里面带着 mp3）：歌库里照旧有 ▶；打开 = 那份 mp3 搬进设备缓存；解锁、改、存 = 文件里不再带它，说一句
// 真 app + 真库 + 真 IndexedDB；家 = 文件夹（假 FSA = OPFS 子目录）；小月相在测试里 = 静音块（同 transport.mjs）。跑：npm run build → npm run serve（8710）→ node test/e2e/render-cache.mjs
import { chromium } from "./pw.mjs";
import { FAKE_FSA, pickFolderFromEntry, folderBytes, folderFiles, seedFolderFile } from "./fake-fsa.mjs";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../../vendor/fflate/fflate.esm.js";
import { contentFingerprint } from "../../src/format/final.ts";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } }); await ctx.addInitScript(FAKE_FSA);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const title = () => p.textContent("#docTitle");
const saved = async () => { for (let i = 0; i < 80 && /•/.test((await title()) ?? ""); i++) await p.waitForTimeout(100); };
const later = async () => { const x = await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('稍后')", { timeout: 600 }).catch(() => null); if (x) { await x.click(); await p.waitForTimeout(150); } };
const rc = () => p.evaluate(() => window.__moonsinger.renders());
/** 等到设备上记着的那本账变成想要的样子（挂名 / 摘名是存完之后异步做的：机器忙的时候几百毫秒不够）；到点还不是 = 把最后一次看到的交回去，让断言如实红。 */
const rcUntil = async (ok, ms = 6000) => { const t0 = performance.now(); for (;;) { const r = await rc(); if (ok(r) || performance.now() - t0 > ms) return r; await p.waitForTimeout(100); } };
const fakeSinger = () => p.evaluate(() => { window.__sung = 0; window.__moonsinger.singer.sing = async () => { window.__sung++; return { samples: new Float32Array(22050 * 2).fill(0.02), sr: 22050 }; }; });
const sung = () => p.evaluate(() => window.__sung);
/** 导出一次整首歌声，回「好了」面板上的字（然后关掉面板）。 */
const exportOnce = async () => {
  await p.evaluate(() => { void window.__moonsinger.exportSong({ quality: "standard", scope: "all" }); });
  await p.waitForSelector(".offer .offer-title:has-text('歌声导出好了')", { timeout: 40000 });
  const text = await p.$eval(".offer", (e) => e.textContent ?? "");
  await p.click(".offer button:has-text('关')").catch(() => p.keyboard.press("Escape")); await p.waitForTimeout(150);
  return text;
};
const openGallery = async () => { await p.evaluate(() => window.__moonsinger.openGallery()); await p.waitForTimeout(700); await later(); };
const tileOf = (name) => `#galleryFull .gallery-tile:has(.gallery-tile-name[title="${name}"])`;
const hasPlay = async (name) => { for (let i = 0; i < 60; i++) { if (await p.$(`${tileOf(name)} .gallery-tile-action.ready`)) return true; await p.waitForTimeout(100); } return false; };
const noPlay = async (name) => { for (let i = 0; i < 60; i++) { if (!(await p.$(`${tileOf(name)} .gallery-tile-action`))) return true; await p.waitForTimeout(100); } return false; };
const entriesOf = async (path) => Object.keys(unzipSync(await folderBytes(p, path)));

await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(600);
await pickFolderFromEntry(p); await p.waitForTimeout(300);
await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(500);
await fakeSinger();
await p.click("#score", { position: { x: 600, y: 200 } });
for (const k of ["Digit1", "Digit3", "Digit5"]) { await p.keyboard.press(k); await p.waitForTimeout(40); }
await p.waitForFunction(() => !!window.__moonsinger.identifier()); await saved();
const id = await p.evaluate(() => window.__moonsinger.identifier());
await p.evaluate(() => window.__moonsinger.rendersReady());
check(/\.mxl$/.test(id ?? "") && (await rc()).stats.count === 0, "歌库里新建了一首；设备上还什么都没记", `${id} ${JSON.stringify(await rc())}`);
check(await p.evaluate(() => ["final", "finalize", "unfinalize"].every((k) => !(k in window.__moonsinger)) && !document.body.classList.contains("doc-final")), "定稿的口都没了");
await p.click("#setBtn"); await p.waitForTimeout(150);
check(!(await p.$('.main-menu [data-v="final"]')) && !(await p.$('.main-menu [data-v="unfinal"]')), "三条杠里没有「定稿…」「改稿…」");
await p.keyboard.press("Escape"); await p.waitForTimeout(100);

// ── ① 导出一次 = 记在设备上；内容没变再导出 = 直接拿 ──
{ const t1 = await exportOnce(), n1 = await sung(), r1 = await rc();
  check(/放进渲染缓存了/.test(t1) && n1 >= 1, "第一次导出：现渲（唱了），面板说记在这台设备上了", `${n1} ${t1.slice(0, 80)}`);
  check(r1.stats.count === 1 && r1.stats.bytes > 1000 && !!r1.hit, "设备上记着 1 份", JSON.stringify(r1.stats));
  { const lp = r1.hit && r1.hit.loop;   // 2026-11-11：记着循环那一圈（歌库循环按它切，不等余音）
    check(!!lp && lp.start >= 0 && lp.end > lp.start + 0.25 && lp.end < r1.hit.secs, "记着循环那一圈：在声音里面、余音在它后面", JSON.stringify({ loop: lp, secs: r1.hit && r1.hit.secs })); }
  const r1b = await rcUntil((r) => !!r.link);
  check(!!r1b.link && r1b.link.identifier === id && r1b.link.stamp.length === 32, "挂在这首歌名下了（带着这个文件的戳）", JSON.stringify(r1b.link && { id: r1b.link.identifier, stamp: r1b.link.stamp }));
  const t2 = await exportOnce(), n2 = await sung();
  check(/用的是这台设备上记着的/.test(t2) && n2 === n1, "内容没变再导出：直接拿，没有重唱", `${n1} → ${n2}`);
  check((await rc()).stats.count === 1, "还是 1 份");
  const stamp1 = (await rc()).link.stamp;
  await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await saved(); await p.waitForTimeout(400);   // 按「存」：写进文件夹（文件戳跟着变：总目录里记着存的时刻）
  { const r = await rcUntil((x) => !!x.link && x.link.stamp !== stamp1), l = r.link; check(!!l && l.stamp !== stamp1 && !!r.hit, "按了存（内容没变、文件戳变了）：挂名跟着换了戳，还挂着", JSON.stringify(l && l.stamp)); }
  const names = await entriesOf(id);
  check(!names.includes(".moonsinger/final.mp3") && !/"final"/.test(strFromU8(unzipSync(await folderBytes(p, id))[".moonsinger/manifest.json"])), "文件夹里那首歌的文件里没有 mp3、总目录里没有 final", names.join(" ")); }

// ── ①½ 进歌库 = 放下手里的歌：出声的也停（施工单第五节 2026-11-12，user「首先是你退回图库的时候，播放应该停掉吧」）──
//   编辑器里开着循环放（不会自己放完），然后进歌库：录音房不许还在放；下面点封面 ▶ 之后也只有歌库的播放器在响
const engPlaying = () => p.evaluate(() => window.__moonsinger.engine.playing);
const until = async (f, want, ms = 4000) => { const t0 = performance.now(); for (;;) { const v = await f(); if (v === want || performance.now() - t0 > ms) return v; await p.waitForTimeout(80); } };
const loopMenu = async () => { await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(80); await p.click('.ctx-menu [data-v="loop"]'); await p.waitForTimeout(100); };
await loopMenu(); await p.click("#playBtn");
check(await until(engPlaying, true), "进歌库之前：编辑器里循环放着");
await openGallery();
check((await until(engPlaying, false, 1500)) === false, "进歌库 = 编辑器的走带停了（原来接着响）");

// ── ② 歌库：记着的有 ▶，点了放 ──
check(await hasPlay(id), "歌库封面上有 ▶（这台设备记着它的声音）");
check(/渲染缓存里的这一遍/.test(await p.$eval(`${tileOf(id)} .gallery-tile-action`, (e) => e.getAttribute("title") ?? e.getAttribute("aria-label") ?? "")), "▶ 的提示说的是设备上记着的那一遍");
await p.click(`${tileOf(id)} .gallery-tile-action`); await p.waitForTimeout(900);
check(!(await p.$eval(".ms-player", (e) => e.hidden)), "底边出了播放条");
check((await p.evaluate(() => window.__moonsinger.gallery()?.playerState().key)) === id, "装进播放器的是这首");
check(await p.evaluate(() => !document.getElementById("galleryFull").hidden && window.__moonsinger.identifier() === null), "没有打开那首歌（人还在歌库里）");
check(!(await engPlaying()), "点了封面 ▶：编辑器的走带没跟着响（只有歌库的播放器）");
await p.click('.ms-player [data-p="loop"]'); await p.waitForTimeout(60);
check(await p.evaluate(() => window.__moonsinger.gallery().playerState().loop), "点「循环」= 开");
await p.click('.ms-player [data-p="restart"]'); await p.waitForTimeout(80);
check((await p.evaluate(() => window.__moonsinger.gallery().playerState().time)) < 0.5, "点「从头放」= 回到开头");
{ // 「分享 mp3」（设计稿第三节；v0.16.99）：无头浏览器没有系统分享 = 走下载；文件名「歌名-年月日-时分.mp3」、字节是正在放的那一份
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 4000 }).catch(() => null), p.click('.ms-player [data-p="share"]')]);
  const name = dl?.suggestedFilename() ?? "", path = dl ? await dl.path() : null;
  const size = path ? (await import("node:fs")).statSync(path).size : 0;
  check(/-\d{8}-\d{4}\.mp3$/.test(name) && size > 1000, "播放条「分享 / 下载」：没有系统分享时下载这首的 mp3", `${name} ${size} B`); }
await p.click('.ms-player [data-p="close"]'); await p.waitForTimeout(100);
check(await p.$eval(".ms-player", (e) => e.hidden), "✕ = 停、播放条收起");

// ── 歌改了 = 摘名；改回去 = 又认得；歌库的 ▶ 跟着 ──
await p.click(tileOf(id)); await p.waitForTimeout(800); await later(); await fakeSinger();
check((await p.evaluate(() => window.__moonsinger.editLock().state)) === "unlocked", "这台设备上新建的歌：解着（新建不锁）");
{ const r = await rcUntil((x) => !!x.hit && !!x.link), n0 = await sung(); check(!!r.hit && !!r.link, "回歌库再打开、没改：还认得那份声音（重开之后音的内部编号重排过，写出来的谱不看它）");
  const t3 = await exportOnce(); check(/用的是这台设备上记着的/.test(t3) && (await sung()) === n0, "重开之后再导出：直接拿，没有重唱"); }
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 2, dir: "near" })); await saved(); await p.waitForTimeout(300);
{ const r = await rcUntil((x) => !x.hit); check(!r.hit && !!r.link, "写了一个音、存了：现在的内容没渲过；那份旧的还挂着（v0.16.101：不自动删，歌库里标「旧」）", JSON.stringify(r.link && r.link.stamp)); }
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(100);   // 撤销回去（退格在这儿是「音变成一样长的休止」，回不到原样）
await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await saved(); await p.waitForTimeout(400);
{ const r = await rcUntil((x) => !!x.link && !!x.hit);
  check(!!r.link && !!r.hit, "撤销回去、存了：内容和渲的时候一样 = 又挂上了", JSON.stringify(r.link && r.link.stamp)); }
await openGallery();
check(await hasPlay(id), "歌库封面上的 ▶ 还在（文件戳换过几回，挂名都跟上了）");
await p.click(tileOf(id)); await p.waitForTimeout(800); await later(); await fakeSinger();
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 2, dir: "near" })); await saved(); await p.waitForTimeout(300);
await openGallery();
check(await hasPlay(id), "又写了一个音、存了：歌库封面上的 ▶ 还在（放的是改之前那遍）");
check((await p.$eval(`${tileOf(id)}`, (e) => e.querySelector(".ms-cover-tag")?.textContent ?? "")) === "旧" && /之后改过/.test(await p.$eval(`${tileOf(id)} .gallery-tile-action`, (e) => e.getAttribute("title") ?? e.getAttribute("aria-label") ?? "")),
  "封面印「旧」，▶ 的提示说之后改过（不删、不报警，user 11-11）");
// ── 放旧的：播放条写「之后改过」+「重新渲染」；点了 = 按现在的样子重渲、接着放，「旧」没了 ──
await p.click(`${tileOf(id)} .gallery-tile-action`); await p.waitForTimeout(900);
check(/之后改过/.test(await p.$eval(".ms-player-title", (e) => e.textContent ?? "")) && !(await p.$eval(".ms-player-rerender", (e) => e.hidden)), "放的是旧的：播放条写「之后改过」，有「重新渲染」");
{ const n0 = (await rc()).stats.count;
  await p.click('.ms-player [data-p="rerender"]');
  const fresh = async () => { for (let i = 0; i < 120; i++) { const t = await p.$eval(".ms-player-title", (e) => e.textContent ?? "").catch(() => ""); if (t && !/之后改过/.test(t) && !(await p.$eval(".ms-player", (e) => e.hidden))) return true; await p.waitForTimeout(250); } return false; };
  check(await fresh(), "重新渲染完：接着放，播放条上不再写「之后改过」");
  check((await rc()).stats.count === n0 + 1 && !(await p.$(`${tileOf(id)} .ms-cover-tag`)), "设备上多记了一遍（旧的那遍留着）；封面上的「旧」没了");
  check(await p.evaluate(() => !document.getElementById("galleryFull").hidden), "全程人还在歌库里");
  await p.click('.ms-player [data-p="close"]'); await p.waitForTimeout(100); }
// ── 没渲过的歌：卡片上是淡的钮，点了在歌库里渲、渲完直接放（v0.16.101；user 11-09「在歌库里不打开歌直接渲」→ 11-11「做」）──
await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(500);
await fakeSinger();
await p.click("#score", { position: { x: 600, y: 200 } });
for (const k of ["Digit5", "Digit3", "Digit1"]) { await p.keyboard.press(k); await p.waitForTimeout(40); }
await p.waitForFunction((was) => !!window.__moonsinger.identifier() && window.__moonsinger.identifier() !== was, id); await saved();
const id2 = await p.evaluate(() => window.__moonsinger.identifier());
{ const n0 = (await rc()).stats.count;
  await p.click("#setBtn"); await p.waitForTimeout(150);
  check(!!(await p.$('.main-menu [data-v="renderHere"]')), "歌库里的歌：三条杠里有「渲一遍（歌库里能听）」");
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  await openGallery();
  const dim = await p.$eval(`${tileOf(id2)} .gallery-tile-action`, (e) => ({ cls: e.className, title: e.getAttribute("title") ?? e.getAttribute("aria-label") ?? "" })).catch(() => null);
  check(!!dim && !/\bready\b/.test(dim.cls) && /渲染缓存里还没有这首/.test(dim.title), "没渲过的歌：卡片上有钮（不是 ready），提示「还没渲过：点 = 在这里渲一遍」", JSON.stringify(dim));
  await p.click(`${tileOf(id2)} .gallery-tile-action`);
  const playing = async () => { for (let i = 0; i < 120; i++) { if ((await p.evaluate(() => window.__moonsinger.gallery()?.playerState().key).catch(() => null)) === id2) return true; await p.waitForTimeout(250); } return false; };
  check(await playing(), "点了：渲完直接放这首");
  check((await rc()).stats.count === n0 + 1 && await hasPlay(id2) && await p.evaluate(() => !document.getElementById("galleryFull").hidden), "设备上多记了一遍、卡片上是 ▶、人还在歌库里");
  await p.click('.ms-player [data-p="close"]'); await p.waitForTimeout(100); }
// ── 导出时选「不记」：只导出这一份，设备上不多 ──
await p.click(tileOf(id2)); await p.waitForTimeout(800); await later(); await fakeSinger();
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 4, dir: "near" })); await saved(); await p.waitForTimeout(300);
{ const n0 = (await rc()).stats.count;
  await p.evaluate(() => { void window.__moonsinger.exportSong({ quality: "standard", scope: "all", keep: false }); });
  await p.waitForSelector(".offer .offer-title:has-text('歌声导出好了')", { timeout: 40000 });
  const text = await p.$eval(".offer", (e) => e.textContent ?? "");
  await p.click(".offer button:has-text('关')").catch(() => p.keyboard.press("Escape")); await p.waitForTimeout(150);
  check((await rc()).stats.count === n0 && !/放进渲染缓存了/.test(text), "导出时选「不记」：设备上的份数不变，面板也不说记下了", `${n0} → ${(await rc()).stats.count}`); }
await openGallery();

// ── ③ 老文件：旧版本定稿过、里面带着一份 mp3 ──
const OLD = "20200101-老定稿.mxl", MP3 = new Uint8Array(4000).map((_, i) => (i * 13) & 0xff);
{ const z = unzipSync(await folderBytes(p, id)), sj = JSON.parse(strFromU8(z[".moonsinger/score.json"]));
  const noStamp = (t) => { const { minor: _m, patch: _p, ...rest } = JSON.parse(t); return JSON.stringify(rest, null, 2) + "\n"; };
  const papers = {}, lounge = {};
  for (const pp of sj.papers) papers[pp.id] = strFromU8(z[pp.file]);
  for (const k of Object.keys(z)) { const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(k); if (m) lounge[m[1]] = noStamp(strFromU8(z[k])); }
  const fp = contentFingerprint({ papers, scoreExt: noStamp(strFromU8(z[".moonsinger/score.json"])), lounge, studio: noStamp(strFromU8(z[".moonsinger/studio.json"])), sounds: Object.keys(z).filter((k) => k.startsWith(".moonsinger/sounds/")), thumbnail: z["Thumbnails/thumbnail.png"] ?? null });
  const mf = JSON.parse(strFromU8(z[".moonsinger/manifest.json"]));
  mf.final = { at: "2026-10-20T00:00:00.000Z", rev: 2, app: "v0.12.25", core: { version: "0.1.0", hash: "0123456789abcdef" }, fingerprint: fp, mp3: { path: ".moonsinger/final.mp3", bytes: MP3.length, sha256: "0".repeat(64), secs: 7, sr: 44100, kbps: 128, stereo: true }, parts: ["P1"] };
  mf.finalRev = 2; mf.patch = 0;
  const out = {}; for (const [k, v] of Object.entries(z)) if (k !== ".moonsinger/manifest.json" && k !== "Thumbnails/thumbnail.png") out[k] = v;
  out[".moonsinger/final.mp3"] = MP3; out[".moonsinger/manifest.json"] = strToU8(JSON.stringify(mf, null, 2) + "\n"); if (z["Thumbnails/thumbnail.png"]) out["Thumbnails/thumbnail.png"] = z["Thumbnails/thumbnail.png"];
  await seedFolderFile(p, OLD, [...zipSync(out, { level: 0 })]); }
await p.click('#galleryFull [data-v="refresh"]'); await p.waitForTimeout(900);
check(!!(await p.waitForSelector(tileOf(OLD), { timeout: 8000 }).catch(() => null)), "歌库里出现了那首老歌");
check(await hasPlay(OLD), "老文件：封面上照旧有 ▶（文件里还带着 mp3）");
check(/歌里带着的那份 mp3/.test(await p.$eval(`${tileOf(OLD)} .gallery-tile-action`, (e) => e.getAttribute("title") ?? e.getAttribute("aria-label") ?? "")), "▶ 的提示说的是歌里带着的那份");
const before = (await rc()).stats.count;
await p.click(tileOf(OLD)); await p.waitForTimeout(1200); await later();
{ const r = await rcUntil((x) => x.stats.count === before + 1 && !!x.link), lk = await p.evaluate(() => window.__moonsinger.editLock());
  check(r.stats.count === before + 1 && !!r.link && r.link.identifier === OLD, "打开它：那份 mp3 搬进了设备缓存、挂在它名下", JSON.stringify({ n: r.stats.count, link: r.link && r.link.identifier }));
  check(lk.locked && !lk.dirty, "别处来的老歌：打开是锁着的，没有任何改动", JSON.stringify(lk));
  check((await entriesOf(OLD)).includes(".moonsinger/final.mp3"), "锁着、没存过：文件原样（mp3 还在里面）");
  const d = await p.evaluate(() => { const x = document.getElementById("lockBar"); return x && !x.hidden ? [...x.querySelectorAll("button")].map((y) => y.textContent) : null; });
  check(!!d && d.join("|") === "接着改|存一版再改", "歌库里的歌锁着：门上两个钮", JSON.stringify(d)); }
await p.click('#lockBar [data-v="continue"]'); await p.waitForTimeout(500);
check((await p.evaluate(() => window.__moonsinger.editLock().state)) === "unlocked", "点「接着改」= 解了");
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 4, dir: "near" }));
// 那句话是存下去的那一下说的、过几秒自己收：先等到它（机器忙的时候后面几步做完它已经收了）
let said = ""; for (let i = 0; i < 100 && !/不再存进歌里/.test(said); i++) { said = await p.$$eval(".notice-stack [data-notice-id]", (es) => es.map((e) => e.textContent ?? "").join(" | ")); if (!/不再存进歌里/.test(said)) await p.waitForTimeout(100); }
await saved(); await p.waitForTimeout(300);
await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await saved(); await p.waitForTimeout(400);   // 按「存」：写进文件夹（自动保存只落本机）
{ const names = await entriesOf(OLD), mf = strFromU8(unzipSync(await folderBytes(p, OLD))[".moonsinger/manifest.json"]);
  check(!names.includes(".moonsinger/final.mp3") && !/"final"|"finalRev"/.test(mf), "解锁、改了、存下去：文件里不再有那份 mp3，总目录里没有 final / finalRev", names.join(" "));
  check(/不再存进歌里/.test(said), "存掉它的那一下说了一句", said.slice(0, 120));
  check((await rc()).stats.count === before + 1, "设备上那份还在（清了能重来，但没清）"); }
check(Object.keys(await folderFiles(p)).every((f) => !/\.mp3$/.test(f)), "文件夹里没有多出任何 mp3 文件");

// ── 7-S（2026-11-12；user「以及加一个删旧渲染缓存和删缓存的功能」）：旧版本的引擎渲的 = 标出来、照样能听、播放条上重渲；设置里一键删旧（不自动删）──
await openGallery();
await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(500);
await fakeSinger();
await p.click("#score", { position: { x: 600, y: 200 } });
for (const k of ["Digit2", "Digit4", "Digit6"]) { await p.keyboard.press(k); await p.waitForTimeout(40); }
await p.waitForFunction((was) => !!window.__moonsinger.identifier() && !was.includes(window.__moonsinger.identifier()), [id, id2, OLD]); await saved();
const id3 = await p.evaluate(() => window.__moonsinger.identifier());
await exportOnce(); await rcUntil((r) => !!r.link && !!r.hit);
/** 把这首挂着的那条记录改成旧版本的渲染核心渲的（索引里的记录就是这个对象；字节不动）。 */
const ageIt = () => p.evaluate(() => { const l = window.__moonsinger.renders().link; if (!l) return false; l.meta.core = { version: "0.2.1", hash: "0ld0ld0ld0ld0ld0" }; return true; });
check(await ageIt() && !(await rc()).hit, "造一条旧引擎渲的：导出时不再直接拿它（核心变了要重渲）");
await openGallery();
check(await hasPlay(id3) && (await p.$eval(tileOf(id3), (e) => e.querySelector(".ms-cover-tag")?.textContent ?? "")) === "旧"
  && /旧版本的引擎渲的/.test(await p.$eval(`${tileOf(id3)} .gallery-tile-action`, (e) => e.getAttribute("title") ?? e.getAttribute("aria-label") ?? "")),
  "歌库：旧引擎渲的照样有 ▶、封面印「旧」、▶ 的提示说是旧版本的引擎渲的");
check(/旧版本的引擎/.test(await p.$eval(`${tileOf(id3)} .ms-cover-tag`, (e) => e.getAttribute("title") ?? "")), "「旧」的说明写着是旧版本的引擎（和「之后改过」分得开）");
await p.click(`${tileOf(id3)} .gallery-tile-action`); await p.waitForTimeout(900);
check(/旧版本的引擎渲的/.test(await p.$eval(".ms-player-title", (e) => e.textContent ?? "")) && !(await p.$eval(".ms-player-rerender", (e) => e.hidden)), "放的是旧引擎渲的：播放条写出来，有「重新渲染」");
{ const n0 = (await rc()).stats.count;
  await p.click('.ms-player [data-p="rerender"]');
  const fresh = async () => { for (let i = 0; i < 120; i++) { const t = await p.$eval(".ms-player-title", (e) => e.textContent ?? "").catch(() => ""); if (t && !/旧/.test(t) && !(await p.$eval(".ms-player", (e) => e.hidden))) return true; await p.waitForTimeout(250); } return false; };
  check(await fresh(), "重新渲染完：接着放，播放条上不再写「旧」");
  check((await rc()).stats.count === n0 && !(await p.$(`${tileOf(id3)} .ms-cover-tag`)) && !!(await rc()).hit, "用现在的引擎渲的换掉了那一条（内容没变 = 同一条，份数不变）；封面上的「旧」没了", `${n0} → ${(await rc()).stats.count}`);
  await p.click('.ms-player [data-p="close"]'); await p.waitForTimeout(100); }
// 设置里一键删旧：每条标「这一版渲的 / 旧版本渲的」，钮上写几条、多大；删完旧的没了、这一版渲的留着
await p.click(tileOf(id3)); await p.waitForTimeout(800); await later();   // 回到编辑器（设置在三条杠里）
check(await ageIt(), "再造一条旧的");
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".settings-card"); await p.click('.set-tabs [data-tab="sound"]'); await p.waitForTimeout(150);   // 渲染缓存在「音源与缓存」那一页
const rcText = async () => { for (let i = 0; i < 40; i++) { const t = await p.$eval("#rcList", (e) => e.textContent ?? "").catch(() => ""); if (t && t !== "…") return t; await p.waitForTimeout(100); } return ""; };
{ const t = await rcText(), oldRows = (t.match(/旧版本渲的（渲染核心/g) ?? []).length, newRows = (t.match(/这一版渲的/g) ?? []).length, n0 = (await rc()).stats.count;
  const btn = await p.$eval('#rcList [data-v="rc:old"]', (e) => e.textContent ?? "").catch(() => "");
  check(oldRows >= 1 && newRows >= 1 && oldRows + newRows === n0 && /渲染核心 0\.2\.1/.test(t), "设置的渲染缓存列表：每条标「这一版渲的 / 旧版本渲的（渲染核心 …）」", `旧 ${oldRows} · 新 ${newRows} · 共 ${n0}`);
  check(new RegExp(`删掉旧版本渲的（${oldRows} 条，共 `).test(btn), "有「删掉旧版本渲的（N 条，共多大）」，N = 标旧的条数", btn);
  await p.click('#rcList [data-v="rc:old"]');
  let after = ""; for (let i = 0; i < 40; i++) { after = await rcText(); if (!/旧版本渲的（渲染核心/.test(after)) break; await p.waitForTimeout(100); }
  check(!/旧版本渲的（渲染核心/.test(after) && !(await p.$('#rcList [data-v="rc:old"]')) && (await rc()).stats.count === n0 - oldRows, "点了：旧的都删了、钮没了，这一版渲的留着", `${n0} → ${(await rc()).stats.count}`); }
await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(200);
await openGallery();
{ const a = await p.$eval(`${tileOf(id3)} .gallery-tile-action`, (e) => e.className).catch(() => "");
  check(!!a && !/\bready\b/.test(a) && await hasPlay(id), "歌库：删掉的那首回到「还没渲」（点了能渲）；别的照旧有 ▶", a); }

check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\nrender-cache: ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
