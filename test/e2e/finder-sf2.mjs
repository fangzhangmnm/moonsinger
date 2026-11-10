// test/e2e/finder-sf2.mjs —— 真浏览器 E2E：自己的 .sf2 在乐器目录里挑、能试听（v0.16.37；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §4.3）。
// created 2026-11-09 by Claude Opus 5.5。原来在乐器设置页里盲选（下拉 + 「叫」框 + 「加进来、选它」，不能试听）；user 11-09「自己的 SF2 的入口感觉不应该放在这儿」。
// 守：顶条「打开 .sf2…」→ 列表最上面一组「文件名（N 件）」、按 乐器 / 变体 分小节；点一行 = 试听（台上不变）；「选这个」= 换上、目录不关、一步撤销；
//   搜索框过滤这一组；× 收起；关目录 = 这组没了；乐器设置页里没有旧挑选器；新声部选 .sf2 里的一件 = 选了才建。
// 用仓里 24 KB 的 test/fixtures/sf2/gu-square-castanets.sf2（0:80 Square Lead + 8:115 Castanets），不靠外网。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-sf2.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { fileURLToPath } from "node:url";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const SF2 = fileURLToPath(new URL("../fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 不下 GS 音源（这里只用本地文件）
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
const active = () => p.evaluate(() => { const m = window.__moonsinger, st = m.state(), part = st.song.parts.find((x) => x.id === st.at.part), r = m.extras().lounge[part.role]; const c = r?.candidates.find((x) => x.id === r.active); return c ? { name: c.name, engine: c.instrument.engine, origin: c.instrument.source?.origin?.name ?? null, embedded: c.instrument.source?.embedded ?? null } : null; });
const nParts = () => p.evaluate(() => window.__moonsinger.state().song.parts.length);
const finderOpen = () => p.$eval(".finder", (e) => !e.hidden);
const openFinder = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300); };
const openFile = async () => { const [fc] = await Promise.all([p.waitForEvent("filechooser"), p.click(".finder-bar .finder-file")]); await fc.setFiles(SF2); await p.waitForSelector(".finder-own"); await p.waitForTimeout(150); };
const ownRows = () => p.$$eval(".finder-own .prov .prov-l b", (bs) => bs.map((x) => x.textContent));

await openFinder();
const before = await active();
await openFile();
check(/gu-square-castanets\.sf2（2 件）/.test(await p.$eval(".finder-own .fg-label", (e) => e.textContent)), "列表最上面一组「文件名（N 件）」", await p.$eval(".finder-own .fg-label", (e) => e.textContent));
check(await p.$eval(".finder-list", (l) => l.firstElementChild?.classList.contains("finder-own")), "这一组在列表最上面");
check((await p.$$eval(".finder-own .fo-sub", (s) => s.map((x) => x.textContent))).join("|") === "乐器|变体（bank 8）", "按 乐器 / 变体 分小节", (await p.$$eval(".finder-own .fo-sub", (s) => s.map((x) => x.textContent))).join("|"));
check((await ownRows()).join("|") === "080 Square Lead|115 Castanets", "一件一行（号 + 预设名）", (await ownRows()).join("|"));
check(!!(await p.$(".finder-own .fo-note")), "带着「歌里只记来源」的小字（从乐器设置页搬过来）");
// 点一行 = 试听，台上不变
await p.click('.finder-own .prov[data-p="sf2|0:80"] .prov-l'); await p.waitForTimeout(400);
check(!!(await p.evaluate(() => window.__moonsinger.auditionSha())), "点一行 = 载进试听台（右边键盘弹它）");
check(await p.$eval('.finder-own .prov[data-p="sf2|0:80"]', (e) => e.classList.contains("is-on")), "这一行亮着");
check(JSON.stringify(await active()) === JSON.stringify(before), "试听不换人", JSON.stringify(await active()));
// 选这个 = 换上、目录不关
await p.click('.finder-own .prov[data-p="sf2|8:115"] [data-v="cast"]'); await p.waitForTimeout(500);
const a1 = await active();
check(a1?.name === "Castanets" && a1.engine === "soundfont", "「选这个」= 换上这一件、名字 = 预设名", JSON.stringify(a1));
check(a1?.origin === "gu-square-castanets.sf2" && a1.embedded === null, "歌里只记来源（弱引用）", JSON.stringify(a1));
check(await finderOpen() && !!(await p.$(".finder-own")), "目录不关、这一组还在（可以接着换）");
await p.click('.finder-own .prov[data-p="sf2|0:80"] [data-v="cast"]'); await p.waitForTimeout(500);
check((await active())?.name === "Square Lead", "接着换另一件", JSON.stringify(await active()));
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(200);
check((await active())?.name === "Castanets", "撤销一步 = 回到上一件", JSON.stringify(await active()));
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(200);
check(JSON.stringify(await active()) === JSON.stringify(before), "再撤销一步 = 回到打开文件之前的那位");
// 搜索过滤这一组
await p.fill(".finder-q", "cast"); await p.waitForTimeout(200);
check((await ownRows()).join("|") === "115 Castanets", "搜索框里有字 = 这一组只列名字里有它的", (await ownRows()).join("|"));
await p.fill(".finder-q", ""); await p.waitForTimeout(200);
// × 收起
await p.click(".finder-own [data-v=owndrop]"); await p.waitForTimeout(200);
check(!(await p.$(".finder-own")), "× = 收起这一组");
// 关目录 = 这组没了
await openFile();
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
await openFinder();
check(!(await p.$(".finder-own")), "关了目录再开 = 这一组没了（字节放掉）");
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
// 乐器设置页里没有旧挑选器
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
check(!(await p.$('.inst-page [data-v="sf2:pick"]')) && !(await p.$(".inst-page #sfSel")) && !(await p.$(".inst-page #sfName")), "乐器设置页里没有「从 .sf2 文件选…」和下拉 / 「叫」框");
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
// 新声部：选 .sf2 里的一件 = 选了才建
const n0 = await nParts();
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(200);
await p.click(".parts-mgr [data-v^=addbelow]"); await p.waitForTimeout(150); await p.click(".parts-mgr [data-v=addnew]"); await p.waitForTimeout(400);
await openFile();
check(await nParts() === n0, "新声部：打开文件不算选了乐器（还没建）", String(await nParts()));
await p.click('.finder-own .prov[data-p="sf2|0:80"] [data-v="cast"]'); await p.waitForTimeout(500);
check(await nParts() === n0 + 1 && (await active())?.name === "Square Lead", "选了 = 建了新声部、台上是这一件", `${await nParts()} ${JSON.stringify(await active())}`);
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(200);
check(await nParts() === n0, "撤销一步 = 新声部连同乐器一起没了", String(await nParts()));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
