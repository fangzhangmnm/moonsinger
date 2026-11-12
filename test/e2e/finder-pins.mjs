// test/e2e/finder-pins.mjs —— 真浏览器 E2E：乐器目录顶上的常用一行（v0.16.36；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §4.1 / §9）。
// created 2026-11-09 by Claude Opus 5.5。user 11-09「那几个钦定的乐器，实际上就是摸某个东西最有用的」「置顶…跟着用户设置走，就不跟着歌走」
//   「用哪个你别护栏，用户想用哪个就用哪个」「合成器就是弦乐…还是用最经典的」；人声里小月相排第一（「小月相的优先级肯定是高于那两个 O 和 A」）。
// 守：七格 + 每格管哪一层；点小月相那格 = 换上、目录不关；长按（右键）一格 = 换成… / 拿掉；列表里右键一件 = 置顶；重开页面还在（记在设备上）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-pins.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
async function reveal(p, cid) {
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
  return !!(await p.$(`.inst-row[data-c="${cid}"]`));
}
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 不下 GS 音源
const base = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const openFinder = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300); };
const tiles = () => p.$$eval(".finder-pins .fp-tile", (ts) => ts.map((t) => `${t.querySelector(".fp-name")?.textContent}${t.querySelector(".fp-job") ? "/" + t.querySelector(".fp-job").textContent : ""}`));
await p.goto(base); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await openFinder();
const t0 = await tiles();
check(t0.length === 7, "常用一行七格", t0.join(" | "));
check(t0.join("|") === "小月相/旋律|钢琴/和弦|长笛/第二旋律|民谣吉他/伴奏|弦乐组/铺底|小鼓/节奏|低音吉他/低音", "七件 + 每格写管哪一层（节奏那格先放小鼓：鼓组还没设计）", t0.join(" | "));
check(await p.$$eval(".finder-pins .fp-tile .fp-ico", (s) => s.length) === 7, "每格有图标");
const rowH = await p.$eval(".finder-pins .fp-row", (r) => { const ts = [...r.querySelectorAll(".fp-tile")].map((t) => t.getBoundingClientRect().top); return Math.max(...ts) - Math.min(...ts); });
check(rowH < 2, "一样大的格子排一行（不按字长折行）", String(rowH));
check(!!(await p.$('.finder-bar .finder-file:not([hidden])')) && !(await p.$('.finder-used [data-v="ownsf2"]')), "「打开 .sf2…」在顶条，不在预设那一排（user「自己的 SF2 的入口感觉不应该放在这儿」）");
// 点小月相那格 = 换上、目录不关
await p.click(".finder-pins .fp-tile >> nth=0"); await p.waitForTimeout(400);
check(await p.$eval(".finder", (e) => !e.hidden), "点一格 = 换上，目录还开着");
check(/Voice|Vocals|人声/.test(await p.$eval(".finder-title", (e) => e.textContent)), "换上了人声（顶条名字跟着变；12-4 起写乐器在谱上的字那种语言里的叫法）", await p.$eval(".finder-title", (e) => e.textContent));
// 右键最后一格 → 拿掉
await p.click(".finder-pins .fp-tile >> nth=6", { button: "right" }); await p.waitForTimeout(150);
check(!!(await p.$('.finder-pinmenu [data-act="replace"]')) && !!(await p.$('.finder-pinmenu [data-act="unpin"]')), "右键一格 = 小菜单：换成… / 拿掉");
await p.click('.finder-pinmenu [data-act="unpin"]'); await p.waitForTimeout(150);
check((await tiles()).length === 6, "拿掉 = 剩六格", (await tiles()).join(" | "));
// 列表里右键一件 → 置顶
await reveal(p, "Q78987");
await p.click('.inst-row[data-c="Q78987"]', { button: "right" }); await p.waitForTimeout(150);
check(!!(await p.$('.finder-pinmenu [data-act="pinc"]')), "列表里右键一件 = 「置顶到常用」");
await p.click('.finder-pinmenu [data-act="pinc"]'); await p.waitForTimeout(150);
check((await tiles()).at(-1) === "电吉他", "置顶 = 加在最后一格（没有管哪一层的小字）", (await tiles()).join(" | "));
// 右键第一格 → 换成… → 点列表里一件 = 换进去（不按种类拦）
await p.click(".finder-pins .fp-tile >> nth=0", { button: "right" }); await p.waitForTimeout(150);
await p.click('.finder-pinmenu [data-act="replace"]'); await p.waitForTimeout(150);
check(!!(await p.$(".finder-pins .fp-replacing")), "「换成…」= 顶上提示点下面一件");
await p.click('.inst-row[data-c="Q78987"]'); await p.waitForTimeout(150);
check((await tiles())[0] === "电吉他/旋律", "点的那件换进第一格（管哪一层的字留着；人声那格也能换）", (await tiles()).join(" | "));
// 重开页面：还在（记在设备上，不跟歌走）
await p.reload(); await p.waitForTimeout(900);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await openFinder();
check((await tiles()).join("|") === "电吉他/旋律|钢琴/和弦|长笛/第二旋律|民谣吉他/伴奏|弦乐组/铺底|小鼓/节奏|电吉他", "重开页面：常用一行还是改过的样子", (await tiles()).join(" | "));
// 人声里小月相排第一
await reveal(p, "Q7390"); await p.click('.inst-row[data-c="Q7390"]'); await p.waitForTimeout(250);
const firstProv = await p.$eval('.inst-row[data-c="Q7390"] + .inst-prov .prov', (e) => e.dataset.p);
check(firstProv === "Q7390|voice", "人声那一件：「谁能演」第一位是小月相", firstProv);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-pins: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
