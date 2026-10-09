// test/file-smoke.mjs —— 无地逃生口冒烟（真浏览器）：写 → Ctrl+S 存 .mxl → 改 → 导出 hub 存一份副本（「•」不变）→ 打开先问 → 打开存的文件逐 token 相同 → 别家谱不自动选角、播放只报错 → 拖进来打开 → 改过没存关页面有挽留框。
// v0.3.0 2026-10-07 edited by Claude Fable 5.1：导出 hub / Ctrl+Shift+S / 拖进来。
// created 2026-10-07 by Claude Opus 5.5。跑：先 bash scripts/build.sh，再 node test/file-smoke.mjs（同 shell-smoke 借 WeebPaint 的 playwright）。
// 走 iPad 那条路（把桌面的文件选择框屏蔽掉 → 存 = 下载、打开 = 选文件）：桌面 Chromium 的系统文件框自动化不了，那条路没有自动测。
import { chromium } from "./e2e/pw.mjs";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn } from "node:child_process"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = fs.mkdtempSync(path.join(os.tmpdir(), "moonsinger-file-")), DIR = fs.mkdtempSync(path.join(os.tmpdir(), "moonsinger-dl-"));
for (const f of ["index.html", "styles.css", "manifest.webmanifest", "service-worker.js", "icon.svg", "icon-192.png", "icon-512.png", "dist", "vendor", "assets"]) fs.cpSync(path.join(ROOT, f), path.join(SITE, f), { recursive: true, dereference: true });
fs.copyFileSync(path.join(ROOT, "test/fixtures/twinkle.musicxml"), path.join(DIR, "twinkle.musicxml"));
const PORT = 8890 + Math.floor(Math.random() * 100);
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", SITE], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 }, acceptDownloads: true });
await ctx.addInitScript(() => { window.showSaveFilePicker = undefined; window.showOpenFilePicker = undefined; });
try {
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const title = () => p.textContent("#docTitle");
const tokens = () => p.evaluate(() => JSON.stringify(window.__moonsinger.state().song.papers[0].tracks.P1));
await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(400);
const stem0 = await title(); check(/^\d{8}-[0-9a-f]{4}$/.test(stem0), "开局 = 默认名 yyyymmdd-hex4、没改过", stem0);
await p.click("#score", { position: { x: 600, y: 400 } });
for (const k of ["Digit1", "Digit2", "Digit3", "Enter", "Digit5", "Minus", "Digit6"]) await p.keyboard.press(k);
await p.evaluate(() => window.__moonsinger.setMode("lyrics")); await p.waitForTimeout(200);   // v0.9.19：歌词框只在「词」里点得开
const n0 = await p.$eval("#score text.note", (t) => { const b = t.getBoundingClientRect(); return { x: b.x + b.width / 2 }; });
const staffBottom = await p.$$eval("#score line.staff", (ls) => Math.max(...ls.slice(0, 5).map((l) => l.getBoundingClientRect().y)));
await p.mouse.click(n0.x, staffBottom + 52); await p.keyboard.type("さくら"); await p.keyboard.press("Enter");
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(150);
await p.click("#score", { position: { x: 700, y: 400 } });
check((await title()) === `${stem0} •`, "写了之后标题带「•」（改过没存）");
// 纸面最上面点歌名、填上
const tb = await p.evaluate(() => { const L = window.__moonsinger.layout(), r = document.querySelector("#score .sheet").getBoundingClientRect(); return { x: r.left + L.pageX.left + L.title.x + L.title.w / 2, y: r.top + L.title.y + L.title.h / 2 }; });   // 歌名的命中框（纸有上边距，2026-10-08）
await p.mouse.click(tb.x, tb.y); await p.waitForSelector(".title-input:not([hidden])");
await p.keyboard.type("春の歌"); await p.keyboard.press("Enter");
const day = stem0.slice(0, 8);   // 文件名 = 年月日-歌名（没存过时跟着歌名；user「用歌名可以，然后也要yyyymmdd规则」）
check((await title()) === `${day}-春の歌 •` && (await p.$$eval("#score text.song-title", (ts) => ts.map((t) => t.textContent).join("|"))) === "春の歌", "点纸面最上面填歌名：纸上画出来、顶栏的文件名 = 年月日-歌名");
await p.click("#score", { position: { x: 700, y: 400 } });
const before = await tokens();
// 存：Ctrl+S → 面板 → 下载
await p.keyboard.press("Control+KeyS");
await p.waitForSelector(".offer .offer-title");
check((await p.textContent(".offer .offer-title")) === "存成 .mxl", "Ctrl+S → 存的面板（这台设备 = 下载 / 分享）");
const [dl] = await Promise.all([p.waitForEvent("download"), p.click('.offer [data-v="download"]')]);
const saved = `${DIR}/${dl.suggestedFilename()}`; await dl.saveAs(saved);
check(dl.suggestedFilename() === `${day}-春の歌.mxl` && (await title()) === `${day}-春の歌`, "存的文件名 = 年月日-歌名、存了之后「•」消失", dl.suggestedFilename());
// 改一下 → 打开 → 先问
await p.keyboard.press("Digit7");
check((await title()) === `${day}-春の歌 •`, "又改了");
// 点文件名 = 改名（同 WXHW：文件名是管理用的把手；2026-10-08 起不再弹文件菜单）
await p.click("#fileBtn"); await p.waitForSelector(".offer #fnIn");
check((await p.inputValue(".offer #fnIn")) === `${day}-春の歌`, "点文件名（还没有家）= 改文件名面板，填着现在的名字");
await p.click('.offer [data-v="cancel"]'); await p.waitForTimeout(100);
// 导出 hub（v0.3.0）：另存为住这里（user 2026-08-20「另存为也变成导出」）；存一份副本 = 下载、文件名带时刻、「•」不变（导出不清 dirty）
await p.click("#setBtn"); await p.waitForSelector(".main-menu");
check(!(await p.$('.main-menu [data-v="saveAs"]')) && !!(await p.$('.main-menu [data-v="export"]')) && !!(await p.$('.main-menu [data-v="rename"]')), "三条杠菜单：没有「另存为」、有「导出…」；还没有家 = 有「改文件名」");
await p.click('.main-menu [data-v="export"]'); await p.waitForFunction(() => document.querySelector(".offer .offer-title")?.textContent === "导出");
check(!!(await p.$('.offer [data-v="mp3"]')) && !!(await p.$('.offer [data-v="mxl"]')), "三条杠「导出…」→ 导出 hub：歌声 mp3 / 存一份 .mxl 副本");
await p.click('.offer [data-v="mxl"]'); await p.waitForSelector('.offer [data-v="download"]');
const [dl2] = await Promise.all([p.waitForEvent("download"), p.click('.offer [data-v="download"]')]);
check(new RegExp(`^${day}-春の歌-\\d{8}-\\d{4}\\.mxl$`).test(dl2.suggestedFilename()) && (await title()) === `${day}-春の歌 •`, "存一份 .mxl 副本：文件名带时刻、「•」还在（导出不清 dirty）", dl2.suggestedFilename());
await p.click("#score", { position: { x: 700, y: 400 } });
await p.keyboard.press("Control+Shift+KeyS"); await p.waitForFunction(() => document.querySelector(".offer .offer-title")?.textContent === "导出");
check(true, "Ctrl+Shift+S → 导出 hub（原来的另存为键）");
await p.click('.offer [data-v="close"]'); await p.waitForTimeout(100);
await p.click("#setBtn"); await p.click('.main-menu [data-v="open"]');
await p.waitForSelector(".offer .offer-title");
check((await p.textContent(".offer .offer-title")) === `「${day}-春の歌」改过还没存`, "改过没存时「打开」先问");
const [fc] = await Promise.all([p.waitForEvent("filechooser"), p.click('.offer [data-v="go"]')]);
await fc.setFiles(saved); await p.waitForTimeout(300);
const after = await tokens();
const canon = (j) => JSON.stringify(JSON.parse(j).map((t) => { const o = (t.kind === "note" || t.kind === "rest") ? t : { ...t, id: 0 }; return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]])); }));
check(canon(after) === canon(before), "打开存的文件：逐 token 相同（小节线 / 记号的 id 是编辑器自己的，不比）");
// 别家的谱
await p.click("#setBtn");
const [fc2] = await Promise.all([p.waitForEvent("filechooser"), p.click('.main-menu [data-v="open"]')]);
await fc2.setFiles(`${DIR}/twinkle.musicxml`); await p.waitForTimeout(300);
const notice = await p.textContent(".notice-error .notice-text"); check(notice.includes("还没人上场") && !notice.includes("叠音"), "别家谱：报出没人上场（叠音 2026-10-08 起读进来，不再算丢）");
const partName = await p.textContent("#score text.part-name");
check(partName.length > 0 && !!(await p.$("#score text.part-name.empty")) && (await title()) === "twinkle" && (await p.textContent("#score text.song-title")) === "Twinkle",
  "别家谱：谱前 = 它的声部名（淡色 = 没人上场）、顶栏 = 文件名、纸上 = 谱里的歌名", partName);
await p.click(".notice-error .dismiss"); await p.click("#playBtn"); await p.waitForTimeout(300);
check((await p.textContent(".notice-error .notice-text")).includes("还没有人上场") && !(await p.evaluate(() => window.__moonsinger.engine.playing)), "别家谱：点播放 = 不出声、报错（不自动替补）");
// 歌手牌：点了选月读 → 不再是未选角
await p.click(".notice-error .dismiss");
const pn = await p.$eval("#score text.part-name", (t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(pn.x, pn.y); await p.waitForSelector(".track-card");
// 2026-10-08 声部设置分两处：轨 = 歌手牌旁边的非模态小卡（没有遮罩、谱照常看得见）；乐器 = 全屏一页（pad 留着只弹不写）
check(!(await p.$(".offer")) && !!(await p.$('.track-card [data-v="hide"]')) && !(await p.$('.track-card [data-v^="cand:"]')), "点角色名 = 轨的小卡（非模态，只有显示 / 出声 / 谱表；乐器的东西不在这）");
await p.click('.track-card [data-v="inst"]'); await p.waitForSelector(".inst-page:not([hidden])");
check(!(await p.$(".track-card")) && (await p.$eval("#score", (s) => s.closest("[hidden]") !== null || s.hidden)), "小卡里「乐器 ›」= 全屏的乐器页（谱藏起来、小卡收了）");
await p.click('.inst-page [data-v="cand:c1"]'); await p.selectOption("#roleSel", "voice.soprano|Soprano"); await p.click('.inst-page [data-v="back"]');
check(await p.$eval(".inst-page", (e) => e.hidden), "乐器页「← 谱」回谱");
check(!(await p.$eval("#score text.part-name", (t) => t.classList.contains("empty"))) && (await p.textContent("#score text.part-name")) === "Soprano" && !!(await p.$("#score text.part-name.empty")),
  "点角色名：谁来演选月读、角色选 Soprano → 谱前写「Soprano」、不再淡色；第二个声部（Bass）还没人上场、仍淡色（0.5.0 起别家谱的声部都读进来）");
// 拖进来打开（v0.3.0；DataTransfer 里放一个 .musicxml；改过没存先问）
await p.click(".notice-error .dismiss").catch(() => undefined);
const b64 = fs.readFileSync(`${DIR}/twinkle.musicxml`).toString("base64");
const dtH = await p.evaluateHandle((b) => { const dt = new DataTransfer(); dt.items.add(new File([Uint8Array.from(atob(b), (c) => c.charCodeAt(0))], "dropped.musicxml", { type: "application/vnd.recordare.musicxml+xml" })); return dt; }, b64);
await p.dispatchEvent("#score", "drop", { dataTransfer: dtH });
await p.waitForSelector(".offer .offer-title");
check((await p.textContent(".offer .offer-title")).includes("改过还没存"), "拖进来：改过没存先问");
await p.click('.offer [data-v="go"]'); await p.waitForTimeout(300);
check((await title()) === "dropped", "拖进来的 .musicxml 打开了（顶栏 = 它的文件名）");
await p.click(".notice-error .dismiss").catch(() => undefined);
// 改过没存关页面 → 挽留框
await p.click("#score", { position: { x: 700, y: 400 } }); await p.keyboard.press("Digit3");
let dialog = "";
p.on("dialog", async (d) => { dialog = d.type(); await d.dismiss(); });
await p.close({ runBeforeUnload: true }); await new Promise((r) => setTimeout(r, 500));
check(errs.length === 0, "页面无报错", errs.join(" | "));
check(dialog === "beforeunload", "改过没存关页面：浏览器挽留框");
} finally { await b.close(); server.kill(); fs.rmSync(SITE, { recursive: true, force: true }); fs.rmSync(DIR, { recursive: true, force: true }); }
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
