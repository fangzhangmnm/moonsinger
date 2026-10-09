// test/e2e/ramp.mjs —— 真浏览器 E2E：渐到（符号层「渐到」+ 力度 = 从上一个力度渐变过来，虚线发夹）；小菜单开关；点开时管的音染色、收起就清。
// 也守着 2026-10-08 抓到的真 bug：小菜单里点「渐到」点中了上面一排 mp 的字形（Bravura 字形 span 点击区域伸出去）。created 2026-10-08 by Claude Opus 5.5（user「渐到 做」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/ramp.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const key = async (i) => { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); };
// 写一个音，符号层力度页按 p；再写三个音，「渐到」+ f
await key(0);
await p.click("[data-symbols]"); await p.waitForTimeout(100); await p.click('.pad-head [data-sympage="dyn"]'); await p.waitForTimeout(100);
await p.click('[data-sym="dyn:p"]'); await p.waitForTimeout(120);
for (const i of [1, 2, 3]) await key(i);
await p.click("[data-symbols]"); await p.waitForTimeout(100);
await p.click('[data-sym="dyn:ramp"]'); await p.waitForTimeout(100);
check(await p.$eval('[data-sym="dyn:ramp"]', (e) => e.classList.contains("once")), "渐到键亮着（点一下 = 等下一个力度）");
check(await p.$$eval(".pad-grid.symbols", (g) => g.length) === 1, "点渐到不算用掉一次性");
await p.click('[data-sym="dyn:f"]'); await p.waitForTimeout(150);
const seq = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).map((t) => (t.kind === "note" ? "n" : t.kind === "dyn" ? t.value + (t.ramp ? "~" : "") : t.kind)).join(" "); });
check(seq === "p n n n f~ n", "谱：p 在第一个音、渐到 f 在最后一个音", seq);
check(await p.$$eval("#score path.hairpin.ramp", (e) => e.length) === 1, "画了一条虚线发夹");
// 点 f = 小菜单（渐到开关亮着）+ 管的音染色
const f = await p.$$eval("#score text.dyn", (es) => { const e = es[1]; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(f.x, f.y); await p.waitForTimeout(200);
check(await p.$eval('.ctx-menu [data-v="ramp"]', (e) => e.classList.contains("is-on")), "小菜单里渐到开着");
const span = await p.$$eval("#score text.note.in-span", (e) => e.length);
check(span === 3, "管的音染色（p 后面到 f 前面 = 3 个）", String(span));
await p.click('.ctx-menu [data-v="ramp"]'); await p.waitForTimeout(150);
check(await p.$$eval("#score path.hairpin.ramp", (e) => e.length) === 0, "关掉渐到 = 虚线没了");
check(await p.$$eval("#score text.note.in-span", (e) => e.length) === 0, "菜单收起 = 不再染色");
// 渐到锁住（2026-10-09，user「然后软键盘到时候加一个toggle渐进到的标签，这样可以快速键盘输入」）：连点两下 = 锁，之后写的力度都是渐到；再点 = 关
const dyns = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "dyn").map((t) => t.value + (t.ramp ? "~" : "")).join(" "); });
await key(4);
await p.click("[data-symbols]"); await p.waitForTimeout(100);
await p.click('[data-sym="dyn:ramp"]'); await p.waitForTimeout(40); await p.click('[data-sym="dyn:ramp"]'); await p.waitForTimeout(100);
check(await p.$eval('[data-sym="dyn:ramp"]', (e) => e.classList.contains("lock")), "连点两下 = 锁住");
check(await p.$$eval('.pad-head [data-sympage="dyn"] .ramp-tag.lock', (e) => e.length) === 1, "「力度」标签上挂着「渐到」");
await p.click('[data-sym="dyn:mf"]'); await p.waitForTimeout(150);
await key(5);
await p.click("[data-symbols]"); await p.waitForTimeout(100);
check(await p.$eval('[data-sym="dyn:ramp"]', (e) => e.classList.contains("lock")), "写过一个力度、回音键再翻回来 = 还锁着");
await p.click('[data-sym="dyn:ff"]'); await p.waitForTimeout(150);
check(await dyns() === "p f mf~ ff~", "锁着写的两个力度都是渐到", await dyns());
await p.click("[data-symbols]"); await p.waitForTimeout(100);
await p.click('[data-sym="dyn:ramp"]'); await p.waitForTimeout(100);
check(await p.$eval('[data-sym="dyn:ramp"]', (e) => !e.classList.contains("lock") && !e.classList.contains("once")), "锁着再点 = 关");
check(await p.$$eval('.pad-head [data-sympage="dyn"] .ramp-tag', (e) => e.length) === 0, "标签上的「渐到」没了");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
