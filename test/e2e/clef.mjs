// test/e2e/clef.mjs —— 真浏览器 E2E：谱号 / 八度线（v0.9.28）。点行首的谱号 = 换声部的谱号（自动 / 高音 / 低音…）；pad 符号层「谱号」「八度线」插在光标处；
//   空白处右键菜单里也有；只管画（音高数据不动）。created 2026-10-10 by Claude Opus 5.5
//   （user「谱号的显示模式跟着谱号而不是乐器」「默认自动同意」「加格式同意」「铃铛会很高。8va可以做了吗」；账本 wishlist「点谱号就能做…每一行的谱号应该都可以点」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/clef.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const track = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).map((t) => (t.kind === "clef" ? `clef:${t.clef}` : t.kind === "ottava" ? `o${t.shift}` : t.kind[0])).join(" "); });
const partClef = () => p.evaluate(() => window.__moonsinger.state().song.parts[0].clef ?? "auto");
const pitches = () => p.evaluate(() => { const s = window.__moonsinger.state(); return JSON.stringify(s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").map((t) => t.pitch)); });
const before = await pitches();
// 1. pad 符号层「记号」页有「谱号」「八度线」
await p.evaluate(() => window.__moonsinger.setMode("symbols")); await p.waitForTimeout(120);
await p.click('.pad-head [data-sympage="mark"]'); await p.waitForTimeout(100);
check(!!(await p.$('.pad-grid.symbols [data-sym="clef"]')) && !!(await p.$('.pad-grid.symbols [data-sym="ottava"]')), "符号层「记号」页有谱号、八度线");
// 2. 光标挪到第二个音前面，插 8va
await p.keyboard.press("ArrowLeft"); await p.keyboard.press("ArrowLeft"); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(80);
await p.click('.pad-grid.symbols [data-sym="ottava"]'); await p.waitForTimeout(150);
await p.click('.ctx-menu [data-v="o:1"]'); await p.waitForTimeout(200);
check((await track()).includes("o1"), "插了 8va（光标处）", await track());
check(await p.$$eval("#score svg .ottava", (es) => es.length) >= 1, "谱上画了 8va 的字和虚线");
// 3. 插谱号：低音
await p.click('.pad-head [data-sympage="mark"]').catch(() => {}); await p.waitForTimeout(80);
await p.click('.pad-grid.symbols [data-sym="clef"]'); await p.waitForTimeout(150);
await p.click('.ctx-menu [data-v="c:F"]'); await p.waitForTimeout(200);
check((await track()).includes("clef:F"), "插了低音谱号记号", await track());
check(await p.$$eval("#score svg .clef.cue", (es) => es.length) === 1 || (await track()).startsWith("clef:F"), "行中间画了小一号的谱号（正好在行首 = 行首那个就是它）");
check((await pitches()) === before, "音高一个没动（只管画）");
// 4. 点行首的谱号 = 声部的谱号（自动 → 低音 8vb → 自动）
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(100);
const clefAt = async () => p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), c = L.clefs.find((x) => x.kind === "start"), sc = document.querySelector("#score .sheet").getBoundingClientRect(); return c ? { x: sc.left + L.pageX.left + c.x + c.w / 2, y: sc.top + c.y + c.h / 2, index: c.index } : null; });
let c0 = await clefAt();
check(!!c0 && c0.index === -1, "行首谱号有点击区域，管它的是声部自己的谱号");
await p.mouse.click(c0.x, c0.y); await p.waitForTimeout(200);
check(!!(await p.$('.ctx-menu [data-v="p:auto"].is-on')), "点谱号 = 小菜单，「自动」亮着（默认自动）");
await p.click('.ctx-menu [data-v="p:F8vb"]'); await p.waitForTimeout(200);
check((await partClef()) === "F8vb", "选「低音 8vb」= 声部的谱号改了", await partClef());
check(await p.$$eval("#score svg .clef", (es) => es.some((e) => e.textContent === "\u{E064}")), "谱上画成低音 8vb 的字形");
c0 = await clefAt(); await p.mouse.click(c0.x, c0.y); await p.waitForTimeout(200);
await p.click('.ctx-menu [data-v="p:auto"]'); await p.waitForTimeout(200);
check((await partClef()) === "auto", "再点选「自动」= 回到自动");
// 5. 空白处右键菜单：谱号… / 八度线…
const sh = await p.$eval("#score .sheet", (e) => { const r = e.getBoundingClientRect(); return { x: r.right - 80, y: r.top + 150 }; });
await p.mouse.click(sh.x, sh.y, { button: "right" }); await p.waitForTimeout(200);
check(!!(await p.$('.ctx-menu [data-v="clef"]')) && !!(await p.$('.ctx-menu [data-v="ottava"]')), "空白处右键菜单里有「谱号…」「八度线…」");
await p.keyboard.press("Escape"); await p.mouse.click(5, 300); await p.waitForTimeout(100);
// 6. 撤销：一步一步回去
await p.keyboard.press("Control+z"); await p.waitForTimeout(120);
check((await partClef()) === "F8vb", "撤销 = 回到上一步（低音 8vb）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nclef: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
