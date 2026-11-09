// test/e2e/header-panel.mjs —— 真浏览器 E2E：谱头面板（v0.16.8）——谱号 / 调号 / 拍号 / 速度同一个面板。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「调号就开头的调号、拍号和谱号，他们是同一个碰撞箱子你点进去之后，三个都可以设」「速度也要放进谱头面板」
//   「先按照你说的归类整理一下」）。
// 守：开头那一处改调号 / 拍号（面板不收、每改一下一步撤销）；速度那一行 = 一颗钮，点了 = 原来的速度框（v0.16.12，user「speed没叫你丢之前的窗口啊」），确定才写；拍号「其他…」自己写；中途空地插调号、「删掉这里的变化」；「⋯」里没有插记号的钮了。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/header-panel.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const head = () => p.evaluate(() => { const s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part]; return t.slice(0, 3).map((x) => x.kind === "key" ? `k${x.fifths}` : x.kind === "time" ? `t${x.beats}/${x.beatType}` : `q${x.bpm}`).join(" "); });
const kinds = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].map((x) => x.kind === "key" ? `k${x.fifths}` : x.kind[0]).join(" "); });
const panel = () => p.evaluate(() => { const m = document.querySelector(".ctx-menu.header-panel"); return m && m.getBoundingClientRect().width > 0 ? [...m.querySelectorAll("[data-hp]")].map((e) => e.dataset.hp).join(",") : null; });
const closeAll = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(120); await p.mouse.click(5, 300); await p.waitForTimeout(120); };

// ① 点行首的调号 → 面板，四样都在
const keyBox = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), k = L.marks.find((x) => x.kind === "key" && x.system === 0); return { x: sc.left + L.pageX.left + k.x + k.w / 2, y: sc.top + k.y + k.h / 2 }; });
await p.mouse.click(keyBox.x, keyBox.y); await p.waitForTimeout(250);
check((await panel()) === "clef,key,time,staves,pclef,ao" && !!(await p.$('.header-panel [data-v="tempo"]')), "点行首的调号 = 谱头面板：谱号 / 调号 / 拍号 + 速度那一颗钮 + 「这位的谱」（谱表 / 默认谱号 / 自动八度线；v0.16.16 搬家 A）", String(await panel()));
const h0 = await head();
await p.selectOption('.header-panel [data-hp="key"]', "2"); await p.waitForTimeout(150);
check((await head()).startsWith("k2 "), "调号改成 1=D（2 个升号）", await head());
check(!!(await panel()), "改完面板不收（接着改别的）");
await p.selectOption('.header-panel [data-hp="time"]', "6/8"); await p.waitForTimeout(150);
check((await head()).includes("t6/8"), "拍号改成 6/8", await head());
await p.selectOption('.header-panel [data-hp="time"]', "other"); await p.waitForTimeout(150);
await p.fill('.header-panel [data-hp="timeText"]', "5/8"); await p.press('.header-panel [data-hp="timeText"]', "Enter"); await p.dispatchEvent('.header-panel [data-hp="timeText"]', "change").catch(() => {}); await p.waitForTimeout(150);
check((await head()).includes("t5/8"), "拍号「其他…」自己写 5/8", await head());
check((await p.textContent('.header-panel [data-v="tempo"]'))?.startsWith("♩="), "速度那一颗钮写着现在的速度", String(await p.textContent('.header-panel [data-v="tempo"]')));
await p.click('.header-panel [data-v="tempo"]'); await p.waitForTimeout(250);
check(!(await panel()) && await p.isVisible(".mark-ed .metro") && await p.isVisible(".mark-ed .tempo-wheel"), "点了 = 面板收起、原来的速度框（滚轮 + 小节拍器）");
await p.fill(".mark-ed input", "132"); await p.waitForTimeout(80);
check(!(await head()).endsWith("q132"), "框里改了还没写进谱（要按确定）", await head());
await p.click(".mark-ed .mark-ok"); await p.waitForTimeout(150);
check((await head()).endsWith("q132"), "按确定 = 速度改成 132", await head());
await closeAll();
// 每改一下 = 一步撤销
for (let i = 0; i < 4; i++) { await p.keyboard.press("Control+z"); await p.waitForTimeout(100); }
check((await head()) === h0, "撤销四步 = 回到原来", `${await head()} / ${h0}`);

// ② 中途空地：空白处右键 → 谱号 · 调号 · 拍号 · 速度… → 插调号 → 删掉这里的变化
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part]; const i = t.findIndex((x) => x.kind === "note"); m.set({ ...s, sel: null, caret: i + 2 }); }); await p.waitForTimeout(100);
const k0 = await kinds();
if (!(await panel())) { await p.click('.pad-head [data-kbswitch]').catch(() => {}); await p.waitForTimeout(100); await p.click('.pad-head [data-sympage="mark"]').catch(() => {}); await p.waitForTimeout(80); await p.click('.pad-grid.symbols [data-sym="key"]'); await p.waitForTimeout(200); }
const midFirst = await p.$eval('.header-panel [data-hp="key"]', (s) => s.options[0].textContent).catch(() => null);
check(!!midFirst && midFirst.startsWith("不变"), "光标在两个音中间 = 中途的一处：每样第一档「不变」", String(midFirst));
await p.selectOption('.header-panel [data-hp="key"]', "-1"); await p.waitForTimeout(150);
const k1 = await kinds();
check(k1.split(" ").length === k0.split(" ").length + 1 && k1.includes("k-1"), "中途插了一个调号（1=F）", `${k0} → ${k1}`);
await p.click('.header-panel [data-v="del"]'); await p.waitForTimeout(150);
check((await kinds()) === k0 && !(await panel()), "「删掉这里的变化」= 这一处没了、面板收起", await kinds());
await closeAll();

// ③ 「⋯」里没有插调号 / 拍号 / 速度的钮了（入口收成符号层 + 空白处菜单）
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(100);
await p.click('.pad-head [data-open="more"], .pad-tools [data-open="more"]').catch(() => {}); await p.waitForTimeout(150);
check(!(await p.$('.pad-panel [data-mark]')), "「⋯」里没有插记号的钮了");
// 大谱表的谱号也点得中（v0.16.50，user 11-09「高音谱号为什么点不中」：原来只给单谱表建了点击区）
await closeAll();
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, parts: s.song.parts.map((x) => (x.id === s.at.part ? { ...x, staves: 2 } : x)) } }); }); await p.waitForTimeout(400);
for (const k of [0, 1]) {
  const cb = await p.evaluate((k) => { const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), ox = L.pageX?.left ?? 0, cs = L.clefs.filter((c) => c.kind === "start"); const c = cs[k]; return c ? { x: sc.left + ox + c.x + c.w / 2, y: sc.top + c.y + c.h / 2, n: cs.length } : null; }, k);
  if (cb) { await p.mouse.click(cb.x, cb.y); await p.waitForTimeout(250); }
  check(!!cb && cb.n >= 2 && (await panel())?.startsWith("clef"), `大谱表${k ? "下面（低音）" : "上面（高音）"}的谱号点得中 = 谱头面板`, JSON.stringify(cb));
  await closeAll();
}
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nheader-panel: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
