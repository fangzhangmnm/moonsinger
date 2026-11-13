// test/e2e/song-panel.mjs —— 真浏览器 E2E：「这首歌」（施工单 13-3；user 2026-11-12「这首歌 要不要放在页面设置旁边…纸=歌」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：纸右上角页面设置左边有「这首歌」那颗钮；三条杠里不再有「改文件名 / 封面图 / 声音与署名」；面板五块（名字 · 作者和许可 · 封面 · 声音 · 署名）；
//   歌名、作者栏、许可在面板里改、关面板时一起写进去 = 一步撤销；谱上点作者栏 = 同一张面板、落在作者和许可那一块；面板底色 = 白（和设置一样，v0.17.27）；
//   修改锁锁着（v0.17.27，统筹「v0.17.26 收」第 1 条）：面板照样能开，顶上一行「锁着，只能看」+「解锁」；歌名 / 作者栏 / 许可（含预设）/ 选封面灰着不收输入；
//   点面板里的「解锁」= 解了、面板重画、都能改、写得进去。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/song-panel.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", FILE = "song-panel-test.mxl";
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(BASE); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const song = () => p.evaluate(() => { const s = window.__moonsinger.state().song; return { title: s.title ?? "", credits: s.credits ?? "", rights: s.rights ?? "" }; });

// 钮的位置：页面设置那颗的左边、同一行
const pos = await p.evaluate(() => { const a = document.querySelector("#score .score-overlay .ov-song-chip")?.getBoundingClientRect(), c = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return a && c ? { left: a.right <= c.left + 1, row: Math.abs(a.top - c.top) < 2 } : null; });
check(!!pos && pos.left && pos.row, "纸右上角：「这首歌」在页面设置那颗的左边、同一行", JSON.stringify(pos));
await p.click("#setBtn"); await p.waitForTimeout(200);
const menu = await p.$$eval(".main-menu [data-v]", (es) => es.map((e) => e.dataset.v));
check(!menu.includes("rename") && !menu.includes("cover") && !menu.includes("sounds") && menu.includes("settings"), "三条杠里不再有改文件名 / 封面图 / 声音与署名", menu.join(","));
await p.keyboard.press("Escape"); await p.waitForTimeout(150);

// 面板五块；改歌名、作者栏、许可 → 关 = 一起写进去、一步撤销
await p.click("#score .score-overlay .ov-song-chip"); await p.waitForSelector(".wbe-panel");
const bg = await p.$eval(".wbe-panel-card", (e) => getComputedStyle(e).backgroundColor);
check(bg === "rgb(255, 255, 255)", "面板底色 = 白（和设置、页面设置一样）", bg);
const secs = await p.$$eval(".wbe-panel [data-sec]", (es) => es.map((e) => e.dataset.sec));
check(secs.join(",") === "name,credits,cover,sounds,credit-lines", "面板五块：名字 · 作者和许可 · 封面 · 声音 · 署名", secs.join(","));
const before = await song();
await p.fill("#songTitleIn", "小星星"); await p.fill("#crIn", "词：我\n曲：我");
await p.click(".wbe-panel .rights-sec > summary"); await p.click('.wbe-panel [data-r="0"]'); await p.waitForTimeout(80);
await p.click('.wbe-panel [data-panel-btn="ok"]'); await p.waitForTimeout(250);
const after = await song();
check(after.title === "小星星" && after.credits === "词：我\n曲：我" && after.rights.length > 0 && !(await p.$(".wbe-panel")), "关面板：歌名、作者栏、许可都写进去了", JSON.stringify(after));
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check(JSON.stringify(await song()) === JSON.stringify(before), "撤销一步 = 三样一起回去", JSON.stringify(await song()));
await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(250);

// 谱上点作者栏 = 同一张面板，落在作者和许可那一块
const cr = await p.evaluate(() => { const r = document.querySelector("#score .staff-svg .credits")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
if (cr) { await p.mouse.click(cr.x, cr.y); await p.waitForTimeout(300); }
check(!!cr && !!(await p.$(".wbe-panel")) && (await p.evaluate(() => document.activeElement?.id)) === "crIn", "谱上点作者栏 = 这首歌面板、光标在作者栏里");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check(!(await p.$(".wbe-panel")), "Esc 关面板");

// 修改锁锁着：面板能开，改的写不进去
await p.evaluate(async (name) => { const fh = await (await navigator.storage.getDirectory()).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(window.__moonsinger.bytes()); await w.close(); }, FILE);
await p.goto(BASE); await p.waitForTimeout(700);
await p.evaluate(async (name) => window.__moonsinger.openFileHandle(await (await navigator.storage.getDirectory()).getFileHandle(name)), FILE); await p.waitForTimeout(500);
check((await p.evaluate(() => window.__moonsinger.editLock())).state === "locked", "打开的文件锁着");
const t0 = (await song()).title;
await p.click("#score .score-overlay .ov-song-chip"); await p.waitForSelector(".wbe-panel");
const grey = await p.evaluate(() => { const q = (s) => document.querySelector(`.wbe-panel ${s}`);
  return { line: !!q(".lock-line [data-v='unlock']"), title: q("#songTitleIn")?.disabled, credits: q("#crIn")?.disabled, rights: q("#rtIn")?.disabled,
    presets: [...document.querySelectorAll(".wbe-panel [data-r]")].every((b) => b.disabled), cover: q("#coverIn")?.disabled && !!q("label.is-disabled") }; });
check(Object.values(grey).every((v) => v === true), "锁着：顶上「锁着，只能看」+ 解锁；歌名 / 作者栏 / 许可 / 预设 / 选封面都灰着", JSON.stringify(grey));
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check((await song()).title === t0 && !(await p.$(".wbe-panel")), "锁着关面板：什么都没写", (await song()).title);
await p.click("#score .score-overlay .ov-song-chip"); await p.waitForSelector(".wbe-panel .lock-line");
await p.click(".wbe-panel [data-v='unlock']"); await p.waitForTimeout(300);
const after2 = await p.evaluate(() => ({ state: window.__moonsinger.editLock().state, line: !!document.querySelector(".wbe-panel .lock-line"), title: document.querySelector(".wbe-panel #songTitleIn")?.disabled }));
check(after2.state !== "locked" && !after2.line && after2.title === false, "点面板里的「解锁」= 解了、面板重画、能改", JSON.stringify(after2));
await p.fill("#songTitleIn", "别的名字"); await p.click('.wbe-panel [data-panel-btn="ok"]'); await p.waitForTimeout(250);
check((await song()).title === "别的名字", "解了锁：改的歌名写进去了", (await song()).title);
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
