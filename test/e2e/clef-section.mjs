// test/e2e/clef-section.mjs —— 真浏览器 E2E：谱头面板里这一段选大谱表 / 谱号 / 自动（v0.16.88）。
// created 2026-11-10 by Claude Opus 5.5。user 11-09「可以高音低音grand用户每个sheet选」「一开始是auto」；设计稿 ai-docs/20261110-wave2-four-designs.md 第一节。
// 守：下拉框里有「自动（现在：…）」/ 六个谱号 / 大谱表；选大谱表 = 这一段两行、别的段不动；大谱表时没有自动八度线那一行；改回自动 = 一行；撤销一步一步回去。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/clef-section.mjs
import { chromium } from "./pw.mjs";
import { pick, ddOptions } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(250);
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, paper: s.song.papers[0].id } }); }); await p.waitForTimeout(200);
const rows = (k) => p.evaluate((k) => { const s = window.__moonsinger.state(), L = window.__moonsinger.layout(), pid = s.song.papers[k].id, part = s.at.part; return L.systems.filter((r) => r.paper === pid && (r.part === part || r.part.startsWith(part + "~")) && r.sys === L.systems.find((x) => x.paper === pid)?.sys).length; }, k);
const choice = () => p.evaluate(() => { const s = window.__moonsinger.state(), pp = s.song.papers[0]; return pp.looks?.[s.at.part]?.grand ? "grand" : "auto"; });
const open = async () => { await p.evaluate(() => window.__moonsinger.openHeader(window.__moonsinger.state().at.part)); await p.waitForTimeout(250); };
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(150);
await open();
const opts = (await ddOptions(p, '.header-panel [data-hp="clef"]')).map((o) => o.value).join(",");
check(opts === "auto,G,G8vb,G8va,G15ma,F,F8vb,grand", "谱号：自动 / 六个谱号 / 大谱表", opts);
check(!!(await p.$('.header-panel [data-hp="ao"]')), "一行时有「自动八度线」");
await pick(p, '.header-panel [data-hp="clef"]', "grand"); await p.waitForTimeout(300);
check((await choice()) === "grand", "选大谱表 = 记在这一段上", await choice());
check((await p.evaluate(() => window.__moonsinger.layout().systems.filter((r) => r.paper === window.__moonsinger.state().song.papers[0].id && r.sys === 0).length)) === 2, "这一段画成两行");
check(!(await p.$('.header-panel [data-hp="ao"]')), "大谱表时没有自动八度线那一行");
const p2 = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[1].looks?.[s.at.part]?.grand ?? null; });
check(p2 === null, "别的段不动", String(p2));
await pick(p, '.header-panel [data-hp="clef"]', "auto"); await p.waitForTimeout(300);
check((await choice()) === "auto", "改回自动", await choice());
await p.keyboard.press("Escape"); await p.mouse.click(5, 300); await p.waitForTimeout(150);
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await choice()) === "grand", "撤销一步 = 回到大谱表", await choice());
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await choice()) === "auto", "再撤销 = 原来的自动", await choice());
void rows;
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nclef-section: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
