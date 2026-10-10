// test/e2e/top-sels.mjs —— 真浏览器 E2E：挂签（v0.10.3：模式四个钮 + 看哪一段 + 看哪位歌手，从顶栏底下往下挂、浮在谱上；user「模式切换不是下拉，回到之前的四个排一起的按钮…顶栏下面创建一个类似tab的往下的东西，可以遮挡屏幕」）。v0.10.2 起（user「我希望有一个快速选择看全部或者哪个曲段，以及快速看全部或者哪个声部的下拉框…和选功能放一起挂左上角」
//   「模式收到下拉框里面」）+ 混音台 = 听的键盘（「能不能混音台就是听的键盘，不用单独一个键，就是不同功能有不同键盘。歌词的时候是ipad键盘」）。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/top-sels.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const part = (id, o) => `<part id="${id}"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("C", o)}${N("D", o)}${N("E", o)}${N("F", o)}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>${part("P1", 5)}${part("P2", 4)}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.addPaper(); }, XML);
await p.waitForTimeout(300);
check(!(await p.$("#studioBtn")) && !(await p.$(".bar .mode-seg")) && !(await p.$(".bar select")), "顶栏里没有录音室钮、模式钮、下拉");
check((await p.$$(".view-tab .mode-seg [data-mode]")).length === 4 && !!(await p.$(".view-tab #paperSel")) && !!(await p.$(".view-tab #partSel")) && !(await p.$eval("#paperSel", (e) => e.hidden)) && !(await p.$eval("#partSel", (e) => e.hidden)), "挂签里：模式四个钮 + 看哪一段 + 看哪位歌手");
{ const g = await p.evaluate(() => { const t = document.querySelector(".view-tab").getBoundingClientRect(), b = document.getElementById("bar").getBoundingClientRect(), s = document.getElementById("score").getBoundingClientRect(); return { gap: Math.round(t.top - b.bottom), overScore: t.top >= s.top && t.left < s.right && t.bottom > s.top, pos: getComputedStyle(document.querySelector(".view-tab")).position }; });
  check(g.gap === 0 && g.overScore && g.pos === "absolute", "挂签贴着顶栏底边往下挂、浮在谱上（不占谱的位置）", JSON.stringify(g)); }
const shown = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((s) => `${s.paper}:${s.part}`))].join(","));
const papers = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => x.id));
await p.selectOption("#paperSel", "all"); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.desk().scope)) === "all", "选「全部曲段」= 全部视图");
await p.selectOption("#paperSel", papers[0]); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.desk().scope)) === "segment" && (await p.evaluate(() => window.__moonsinger.state().at.paper)) === papers[0], "选一段 = 本段视图、光标跳过去");
await p.selectOption("#partSel", "P2"); await p.waitForTimeout(200);
check(!(await shown()).includes(":P1") && (await shown()).includes(":P2"), "选一位歌手 = 只看它（别的缩成细行）", await shown());
await p.selectOption("#partSel", "all"); await p.waitForTimeout(200);
check((await shown()).includes(":P1") && (await shown()).includes(":P2"), "选「全部歌手」= 都看", await shown());
// 每个模式自己的键盘：音 = 音键、符 = 符号格、词 = 空（系统键盘）、听 = 混音台
const dock = () => p.evaluate(() => document.getElementById("stage").dataset.dock);
await p.click('.mode-seg [data-mode="symbols"]'); await p.waitForTimeout(150); check((await dock()) === "symbols", "符 = 符号格");
await p.click('.mode-seg [data-mode="lyrics"]'); await p.waitForTimeout(150); check((await dock()) === "none", "词 = 不占（用系统键盘）");
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(250); check((await dock()) === "studio" && (await p.$eval(".studio", (e) => !e.hidden)), "听 = 混音台在底下");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
const on = () => p.evaluate(() => [...document.querySelectorAll(".mode-seg .is-on")].map((b) => b.dataset.mode).join());
check((await on()) === "lyrics", "Esc = 回到写（上一个写的模式）", await on());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntop-sels: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
