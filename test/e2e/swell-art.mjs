// test/e2e/swell-art.mjs —— 真浏览器 E2E：音内渐强 / 渐弱 / 鼓起归演奏法（v0.9.44；user「音内渐强渐弱和鼓起应该属于演奏法，数据结构和逻辑上也应该，因为是跟着音符的」）。
//   pad 符号层「演奏法」页有这三格、「力度」页没有了；点了 = 光标前那个音的演奏法里多一个（再点 = 去掉）；谱上画小发夹。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/swell-art.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => window.__moonsinger.setMode("symbols")); await p.waitForTimeout(150);
await p.click('.pad-head [data-sympage="dyn"]'); await p.waitForTimeout(100);
check(!(await p.$('.pad-grid.symbols [data-sym="swell:<"]')), "「力度」页里没有音内起伏了");
await p.click('.pad-head [data-sympage="art"]'); await p.waitForTimeout(100);
check(!!(await p.$('.pad-grid.symbols [data-sym="swell:<"]')) && !!(await p.$('.pad-grid.symbols [data-sym="swell:>"]')) && !!(await p.$('.pad-grid.symbols [data-sym="swell:<>"]')), "「演奏法」页里有音内渐强 / 渐弱 / 鼓起");
const lastArt = () => p.evaluate(() => { const s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part].filter((x) => x.kind === "note").pop(); return (t.art ?? []).join(","); });
await p.click('.pad-grid.symbols [data-sym="swell:<>"]'); await p.waitForTimeout(150);
check((await lastArt()) === "swellBoth", "点「音内鼓起」= 光标前那个音的演奏法里多了它", await lastArt());
check(await p.$$eval("#score svg path.hairpin", (e) => e.length) >= 1, "谱上画了小发夹");
await p.click('.pad-grid.symbols [data-sym="swell:<"]'); await p.waitForTimeout(150);
check((await lastArt()) === "swellUp", "换成「音内渐强」= 换掉（一个音一种起伏）", await lastArt());
await p.click('.pad-grid.symbols [data-sym="swell:<"]'); await p.waitForTimeout(150);
check((await lastArt()) === "", "再点 = 去掉", await lastArt());
// 琶音（v0.9.45）：同一页里；只挂在和弦上（v0.9.46）——光标前是单音 = 不挂
check(!!(await p.$('.pad-grid.symbols [data-sym="art:arpeggio"]')), "「演奏法」页里有琶音");
await p.click('.pad-grid.symbols [data-sym="art:arpeggio"]'); await p.waitForTimeout(150);
check((await lastArt()) === "" && (await p.$$eval("#score svg path.arpeggio", (e) => e.length)) === 0, "单音上点琶音 = 不挂（琶音只挂在和弦上）", await lastArt());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nswell-art: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
