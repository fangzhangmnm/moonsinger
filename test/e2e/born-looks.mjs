// test/e2e/born-looks.mjs —— 真浏览器 E2E：新建的歌把「跟着」写成这一刻的值 + 一笔没动的空白歌跟着习惯重建（施工单第 21 条 + 补两件，v0.17.38；统筹 74ea9a53 / 28858491）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：设备上习惯简谱 → 开 app 那首存出来这几项没有 "default"（边距、谱高除外）、写 jianpu / C3 / zh；
//   一笔没动、没有家的空白歌：改习惯 = 照新习惯重建（不标脏、撤销栈空、文件名不换）；写一个音 / 页面设置换一项 / 改歌名之后再改习惯 = 不变；有家的歌（打开的文件）不变；
//   写着 "default" 的歌照旧跟着；三条杠「新建」照新的习惯写；页面设置「跟着我的习惯（现在是：X）」在最后一格；「套用我的习惯」在新歌上灰着；
//   第一次打开：卡上选简谱点「好」→ 后面那首空白歌是简谱；写一个音、设置里把习惯改回五线谱 → 还是简谱（统筹给的那一条）。
//   字母谱和简谱是同一种画法（行的 kind 都是 jianpu），所以比画出来的行用五线谱 / 简谱。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/born-looks.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick, pickOnPage, ddOptions } from "./dd.mjs";
import { unzipSync, strFromU8 } from "../../vendor/fflate/fflate.esm.js";
import { fileURLToPath } from "node:url";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", PREFIX = "moonsinger-5b1e7c0a92d34f6e:";
const LOOK = ["notation", "viewInC", "middleC", "chordTags", "chordTagStyle", "expressions", "barNumbers", "lyricFit", "paper", "density", "staffMm", "marginMm"];
const b = await chromium.launch(), errs = [];
const page = async (o = {}) => { const p = await (await b.newContext({ viewport: { width: 1000, height: 900 }, ...o })).newPage(); p.on("pageerror", (e) => errs.push(e.message)); return p; };
const scoreJson = async (p) => { const bytes = new Uint8Array(await p.evaluate(() => Array.from(window.__moonsinger.bytes()))); return JSON.parse(strFromU8(unzipSync(bytes)[".moonsinger/score.json"])); };
const kind = (p) => p.evaluate(() => window.__moonsinger.layout().systems[0]?.kind ?? null);
const nota = (p) => p.evaluate(() => String(window.__moonsinger.state().song.notation));
const habit = async (p, v) => { await p.click("#setBtn"); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".set-panel"); await pickOnPage(p, '[data-set="habit:notation"]', v); await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(300); };
const writeNote = async (p) => { await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(150); };
const openSheet = async (p) => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForSelector(".set-panel"); };

// ── 一、新建写下来；一笔没动的空白歌跟着习惯重建；动过一笔就不跟 ──
{ const p = await page();
  await p.goto(BASE); await p.waitForTimeout(500);
  await p.evaluate((pre) => { localStorage.setItem(pre + "habit-notation", "jianpu"); localStorage.setItem(pre + "habit-middle-c", "3"); }, PREFIX);
  await p.reload(); await p.waitForTimeout(800);
  { const j = await scoreJson(p), bad = LOOK.filter((k) => !["staffMm", "marginMm"].includes(k) && j[k] === "default");
    check(bad.length === 0, "开 app 的那首新歌存出来：这几项没有一个是 default（边距、谱高除外）", bad.join(","));
    check(j.notation === "jianpu" && j.middleC === 3 && j.staffMm === "default" && j.marginMm === "default" && j.textLang === "zh", "谱种 = 习惯的简谱、中央 C = 3、谱上的字 = zh；边距 / 谱高照旧 default", JSON.stringify({ n: j.notation, m: j.middleC, s: j.staffMm, mm: j.marginMm, t: j.textLang })); }
  const stem0 = await p.evaluate(() => document.querySelector("#fileBtn")?.textContent ?? "");
  await habit(p, "staff");
  const s1 = await p.evaluate(() => ({ n: window.__moonsinger.state().song.notation, dirty: window.__moonsinger.editLock().dirty, past: window.__moonsinger.history?.()?.past?.length ?? null }));
  check(s1.n === "staff" && (await kind(p)) === "staff" && !s1.dirty, "一笔没动、没有家的空白歌：改习惯 = 照新习惯重建（五线谱），不标脏", JSON.stringify(s1));
  check((await p.evaluate(() => document.querySelector("#fileBtn")?.textContent ?? "")) === stem0, "重建：文件名不换", stem0);
  // 写一个音 → 动过了 → 改习惯不跟
  await writeNote(p); await habit(p, "jianpu");
  check((await nota(p)) === "staff" && (await kind(p)) === "staff", "写了一个音之后改习惯：歌不变（还是五线谱）");
  // 写着 default 的歌照旧跟着
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, notation: "default" } }); }); await p.waitForTimeout(250);
  check((await kind(p)) === "jianpu", "写着 default 的歌照旧跟着习惯（简谱）");
  // 三条杠「新建」：照现在的习惯写（改过没存会先问丢不丢：点「丢掉」）
  await p.click("#setBtn"); await p.click('.main-menu [data-v="new"]'); await p.waitForTimeout(400);
  await p.waitForSelector('.offer [data-v="go"]', { timeout: 3000 }); await p.click('.offer [data-v="go"]'); await p.waitForTimeout(400);   // 改过没存 = 先问：「丢掉，继续」
  check((await nota(p)) === "jianpu", "三条杠「新建」：照现在的习惯写下来（jianpu，不是 default）", await nota(p));
  // 页面设置：「跟着我的习惯」在最后一格；「套用我的习惯」在新歌上灰着
  await openSheet(p);
  const items = (await ddOptions(p, '.set-panel [data-pg="nota"]')).map((o) => o.label);
  check(items.length > 1 && /^跟着我的习惯（现在是：/.test(items.at(-1)), "谱种下拉：「跟着我的习惯（现在是：X）」在最后一格", items.join(" | "));
  const btn = await p.$eval('.set-panel [data-panel-btn="alldef"]', (e) => ({ t: e.textContent?.trim(), d: e.disabled }));
  check(btn.t === "套用我的习惯" && btn.d === true, "底下那颗叫「套用我的习惯」、新建的歌上灰着（没得改）", JSON.stringify(btn));
  // 页面设置换一项 → 动过了 → 改习惯不跟
  await pickOnPage(p, '.set-panel [data-pg="bn"]', "off"); await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200);
  await habit(p, "staff");
  check((await nota(p)) === "jianpu", "页面设置换了一项之后改习惯：歌不变（还是简谱）");
  await p.context().close(); }

// ── 二、改歌名算动过；有家的歌（打开的文件）不跟 ──
{ const p = await page();
  await p.goto(BASE); await p.waitForTimeout(700);
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, title: "春の歌" } }); }); await p.waitForTimeout(150);
  await habit(p, "jianpu");
  check((await nota(p)) === "staff", "改了歌名之后改习惯：歌不变（还是五线谱）");
  await p.evaluate(async () => { const fh = await (await navigator.storage.getDirectory()).getFileHandle("born.mxl", { create: true }); const w = await fh.createWritable(); await w.write(window.__moonsinger.bytes()); await w.close(); });
  // 手里这首改过歌名、没有家 = 换歌先问「丢掉，继续」（home.ts leave → ask.discard）：要答，不然 openFileHandle 一直等着
  const opening = p.evaluate(async () => window.__moonsinger.openFileHandle(await (await navigator.storage.getDirectory()).getFileHandle("born.mxl")));
  await p.waitForSelector('.offer [data-v="go"]', { timeout: 6000 }); await p.click('.offer [data-v="go"]'); await opening; await p.waitForTimeout(500);
  check((await nota(p)) === "staff", "（前提）打开的文件是五线谱");
  await habit(p, "staff"); await habit(p, "jianpu");
  check((await nota(p)) === "staff", "有家的歌（打开的文件）：改习惯不跟");
  await p.context().close(); }

// ── 二½、打开的、没有家、还没动的歌：改习惯 = 不碰（v0.17.39；统筹审 v0.17.38：没有家的不只是新歌）──
//   走 iPad 那条路：没有系统的选文件框 = <input type=file>，拿不到句柄；别家的谱（twinkle.musicxml）就算有句柄也没有家
{ const p = await page();
  await p.goto(BASE); await p.waitForTimeout(700);
  await p.evaluate(() => { window.showOpenFilePicker = undefined; });
  const notes = () => p.evaluate(() => window.__moonsinger.state().song.papers.reduce((n, pp) => n + Object.values(pp.tracks).flat().filter((t) => t.kind === "note").length, 0));
  const stem = () => p.evaluate(() => document.querySelector("#fileBtn")?.textContent ?? "");
  const openLocal = async (file) => {
    const [fc] = await Promise.all([p.waitForEvent("filechooser"), (async () => { await p.click("#setBtn"); await p.click('.main-menu [data-v="open"]'); })()]);
    await fc.setFiles(file); await p.waitForTimeout(700);
  };
  await openLocal(fileURLToPath(new URL("../fixtures/twinkle.musicxml", import.meta.url)));
  const n0 = await notes(), s0 = await stem();
  check(n0 > 0, "（前提）别家的谱打开了", `${n0} 个音 · ${s0}`);
  await habit(p, "jianpu");
  check((await notes()) === n0 && (await stem()) === s0, "别家的谱（没有家）打开不动、改习惯：歌还在（音数、文件名不变）", `${await notes()} 个音 · ${await stem()}`);
  const own = Buffer.from(await p.evaluate(() => Array.from(window.__moonsinger.bytes())));
  await openLocal({ name: "own-copy.mxl", mimeType: "application/vnd.recordare.musicxml", buffer: own });
  const n1 = await notes(), s1 = await stem();
  check(n1 === n0 && s1 === "own-copy", "（前提）没有句柄的自家文件打开了", `${n1} 个音 · ${s1}`);
  await habit(p, "staff");
  check((await notes()) === n1 && (await stem()) === s1, "没有句柄的自家文件打开不动、改习惯：歌还在（音数、文件名不变）", `${await notes()} 个音 · ${await stem()}`);
  await p.context().close(); }

// ── 三、第一次打开：卡上选简谱点「好」→ 后面那首空白歌是简谱；写一个音、设置里把习惯改回五线谱 → 还是简谱 ──
{ const p = await page({ firstOpen: true });
  await p.goto(BASE); await p.waitForSelector(".habits-card", { timeout: 6000 });
  await p.click('.habits-card [data-h="notation"][data-v="jianpu"]'); await p.click('.wbe-panel [data-panel-btn="ok"]'); await p.waitForTimeout(400);
  check((await nota(p)) === "jianpu" && (await kind(p)) === "jianpu", "第一次打开：卡上选简谱点「好」→ 后面那首空白歌是简谱");
  await writeNote(p); await habit(p, "staff");
  check((await nota(p)) === "jianpu" && (await kind(p)) === "jianpu", "写一个音、设置里把习惯改回五线谱 → 还是简谱");
  await p.context().close(); }

// ── 四、重建只换歌本身（杂事版 v0.17.42，统筹「一处跟进」）：新歌不动，改文件名 + 键盘换一个「1=」+ 视图换成横卷 → 改习惯 → 三样都还在 ──
{ const p = await page(), stem = () => p.evaluate(() => document.querySelector("#fileBtn")?.textContent ?? "");
  await p.goto(BASE); await p.waitForTimeout(800);
  await p.click("#fileBtn"); await p.waitForSelector("#fnIn"); await p.fill("#fnIn", "my-own-name"); await p.press("#fnIn", "Enter"); await p.waitForTimeout(200);
  const kr = await p.evaluate(() => { const r = document.querySelector(".pad-panel .k-key").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(kr.x, kr.y); await p.mouse.wheel(0, 100); await p.waitForTimeout(200);
  const in0 = await p.evaluate(() => { const i = window.__moonsinger.state().input; return { auto: i.inputAuto, fifths: i.inputFifths }; });
  const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(c.x, c.y); await p.waitForSelector(".set-panel"); await pickOnPage(p, '.set-panel [data-pg="flow"]', "scroll"); await p.waitForTimeout(200);
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  check((await stem()) === "my-own-name" && in0.auto === false && (await p.evaluate(() => window.__moonsinger.desk().scroll)) === true && !(await p.evaluate(() => window.__moonsinger.history().past)), "（前提）新歌一笔没动：文件名改成自己起的、键盘「1=」拨了一格（手动）、视图横卷", `${await stem()} · ${JSON.stringify(in0)}`);
  await habit(p, "jianpu");
  check((await nota(p)) === "jianpu", "（前提）改习惯 = 重建了（谱种照新习惯）");
  check((await stem()) === "my-own-name", "重建之后：文件名还是自己起的", await stem());
  const in1 = await p.evaluate(() => { const i = window.__moonsinger.state().input; return { auto: i.inputAuto, fifths: i.inputFifths }; });
  check(in1.auto === false && in1.fifths === in0.fifths, "重建之后：键盘的「1=」还是拨过的那一格", JSON.stringify(in1));
  check((await p.evaluate(() => window.__moonsinger.desk().scroll)) === true, "重建之后：视图还是横卷");
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, title: "Hello" } }); }); await p.waitForTimeout(200);
  check((await stem()).replace(/\s*•$/, "") === "my-own-name", "重建之后再起歌名：文件名不跟着歌名走（还记得是人起的；「•」= 没存）", await stem());
  await p.context().close(); }

check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
