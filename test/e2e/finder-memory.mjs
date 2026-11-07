// test/e2e/finder-memory.mjs —— 真浏览器 E2E：乐器目录的三件小事（v0.15.7）。
// created 2026-11-07 by Claude Opus 5.5。
//   ① 默认按年代（家族周账 F-205，user 11-05「还是默认年代排序的那个order」）；
//   ② 点开的那件没有谁能演 = 试听键盘静音，不是还弹着上一个声音（F-210，user 11-07「如果选中的那个类别里面没有合适的音源的时候，我在即兴的时候应该是静音，而不是显示弹在上一个音源」）；
//      之后点能演的（这里用小月相，不下 GS 音源）= 又出声；
//   ③ 关掉再开 = 回到上次翻到的地方、点开的那件还开着、静音还在（F-197，user 11-05「选乐器应该能记住上次翻到哪里了」）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-memory.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const NOBODY = "Q207691", VOICE = "Q7390";   // 特雷门琴（目录里没有谁能演）/ 人声（点开有小月相）
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 不下 32 MB 的 GS：点人声那一行先试 GS 会失败（报一句），接着点小月相
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const openFinder = async () => { await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .inst-row"); await p.waitForTimeout(300); };
await openFinder();
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__aud = []; const on = e.auditionOn.bind(e); e.auditionOn = (...a) => { window.__aud.push(a[1]?.kind); return on(...a); }; });
const press = async (k) => { const n = await p.evaluate(() => window.__aud.length); await p.keyboard.press(k); await p.waitForTimeout(150); return (await p.evaluate(() => window.__aud.length)) - n; };

// ① 默认按年代、下拉第一项就是它
const sort = await p.$eval(".finder-sort", (s) => ({ v: s.value, first: s.options[0].value }));
check(sort.v === "year" && sort.first === "year", "默认按年代（下拉第一项也是）", JSON.stringify(sort));

// ② 什么都没点 = 默认的哼（出声）；点开没人能演的那件 = 静音
check((await press("Digit1")) === 1, "什么都没点：键盘出声（默认的哼）");
await p.click(`.inst-row[data-c="${NOBODY}"]`); await p.waitForTimeout(300);
check(await p.$(`.inst-row.is-open[data-c="${NOBODY}"] + .inst-prov .prov-none`) !== null, "点开特雷门琴：写着「目录里还没有谁能演它」");
check((await press("Digit2")) === 0, "点开没人能演的那件：键盘不出声（不是还弹着上一个）");
// 点能演的（人声 → 小月相）= 又出声
await p.click(`.inst-row[data-c="${VOICE}"]`); await p.waitForTimeout(300);
await p.click(`.prov[data-p="${VOICE}|voice"]`); await p.waitForTimeout(300);
check((await press("Digit3")) === 1, "点小月相：又出声");
// 再点开没人能演的、记下翻到哪
await p.click(`.inst-row[data-c="${NOBODY}"]`); await p.waitForTimeout(300);
check((await press("Digit4")) === 0, "再点开特雷门琴：又静音");
const y0 = await p.$eval(".finder-list", (l) => l.scrollTop);

// ③ 关掉再开：回到原地、那件还开着、静音还在
await p.click('.finder-bar [data-v="back"]'); await p.waitForTimeout(300);
check(!(await p.$eval(".finder", (e) => !e.hidden)), "「← 谱」关掉了目录");
await openFinder();
const y1 = await p.$eval(".finder-list", (l) => l.scrollTop);
check(y0 > 200 && Math.abs(y1 - y0) <= 2, "重开 = 回到上次翻到的地方", `${y0} → ${y1}`);
check(await p.$(`.inst-row.is-open[data-c="${NOBODY}"]`) !== null, "重开：上次点开的那件还开着");
check((await press("Digit5")) === 0, "重开：还是静音（和亮着的对得上）");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-memory: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
