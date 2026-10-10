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
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(200);
// 打开有音的歌 = 键盘先收着、小条上「键盘」点一下才开（v0.10.21；user「或者默认键盘是关的，点一下才会开。」「小工具条也有键盘展开的功能」）
check(await p.$eval(".pad-panel", (e) => e.hidden) && await p.$eval("#padTab", (e) => !e.hidden && !!e.closest(".dock-tab")), "打开有音的歌：键盘收着，小条上有「键盘」");
await p.click("#padTab"); await p.waitForTimeout(150);
check(!(await p.$eval(".pad-panel", (e) => e.hidden)) && await p.$eval("#padTab", (e) => !e.hidden && e.classList.contains("is-on")), "点「键盘」= 打开；开着时它亮着（再点 = 收起）");
// 记住模式：存在「听」= 打开还是「听」（user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」）
{ const mode = await p.evaluate(() => { const m = window.__moonsinger; m.setMode("listen"); const bytes = m.bytes(); m.load(m.open("again.mxl", bytes)); const w = m.workspace().mode; m.setMode("notes"); return w; });
  check(mode === "listen", "存的时候在「听」= 再打开就是「听」", mode); }
// 「听」：小条上照样有那个开关（叫「混音台」），点 = 开 / 收（v0.10.26；user「左下角小工具条还是忘了做键盘弹出的按钮」——v0.9.18 留下的一条 CSS 在「听」里把它藏了）
{ await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(200);
  const vis = await p.$eval("#padTab", (e) => !e.hidden && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0 && !!e.closest(".dock-tab") && e.textContent.includes("混音台"));
  check(vis, "「听」：小条上有「混音台」开关（看得见）");
  const d0 = await p.evaluate(() => window.__moonsinger.workspace().dock); await p.click("#padTab"); await p.waitForTimeout(200);
  const d1 = await p.evaluate(() => window.__moonsinger.workspace().dock); await p.click("#padTab"); await p.waitForTimeout(200);
  const d2 = await p.evaluate(() => window.__moonsinger.workspace().dock);
  check(d0 !== d1 && d2 === d0 && [d0, d1].includes("studio") && [d0, d1].includes("none"), "点一下 = 混音台开 / 收，再点回来", `${d0} → ${d1} → ${d2}`);
  await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(150); }
if (await p.$eval(".pad-panel", (e) => e.hidden)) { await p.click("#padTab"); await p.waitForTimeout(150); }
check(!(await p.$eval("#partSel", (e) => e.hidden)), "载入一首两位歌手的歌 = 歌手下拉马上就在（不用切模式；v0.10.10 修 user「ctrl shift r的时候…看不到下拉框，得切换模式之后下拉框才会出现」）");
await p.evaluate(() => window.__moonsinger.addPaper());
await p.waitForTimeout(300);
check(!(await p.$("#studioBtn")) && !(await p.$(".bar .mode-seg")) && !(await p.$(".bar select")), "顶栏里没有录音室钮、模式钮、下拉");
check((await p.$$(".dock-tab .mode-seg [data-mode]")).length === 4 && !(await p.$(".view-tab .mode-seg")) && !!(await p.$(".view-tab #paperSel")) && !!(await p.$(".view-tab #partSel")) && !(await p.$eval("#paperSel", (e) => e.hidden)) && !(await p.$eval("#partSel", (e) => e.hidden)), "模式四个钮在底座边上的小条里（v0.10.20）；挂签里 = 看哪一段 + 看哪位歌手");
{ const g = await p.evaluate(() => { const t = document.querySelector(".view-tab").getBoundingClientRect(), b = document.getElementById("bar").getBoundingClientRect(), s = document.getElementById("score").getBoundingClientRect(); return { gap: Math.round(t.top - b.bottom), overScore: t.top >= s.top && t.left < s.right && t.bottom > s.top, pos: getComputedStyle(document.querySelector(".view-tab")).position }; });
  check(g.gap === 0 && g.overScore && g.pos === "absolute", "挂签贴着顶栏底边往下挂、浮在谱上（不占谱的位置）", JSON.stringify(g)); }
// 底座边上的小条（v0.10.20；user「音符词听那个小面版变成靠着键盘…」「尤其是模式条的位置（这个其实蛮重要的，不然鼠标上下跑）」）：横屏 = 贴着键盘左边；顶栏只剩一个 |▶
{ const d = await p.evaluate(() => { const t = document.querySelector(".dock-tab").getBoundingClientRect(), k = document.querySelector(".pad-panel").getBoundingClientRect(); return { gap: Math.round(k.left - t.right), top: Math.round(t.top - k.top), tops: document.querySelectorAll("#bar .btn").length }; });
  check(Math.abs(d.gap) <= 1 && d.top >= 0 && d.top < 40, "横屏：模式 + 走带的小条贴着键盘左边、在键盘顶上那一截", JSON.stringify(d));
  check(!!(await p.$("#bar #playBtn")) && !(await p.$("#bar #undoBtn")) && !!(await p.$(".dock-tab #undoBtn")) && !!(await p.$(".dock-tab #dockPlay")), "顶栏只剩一个 |▶；撤销 / 重做 / 另一个 |▶ 在小条上"); }
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
// 提示（toast）不压控件（v0.10.23；user「info error的弹窗和控制条也撞车」）：在谱那一块的底边，不碰左上的挂签和底座边上的小条
await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(100); await p.click('.ctx-menu [data-v="follow"]'); await p.waitForTimeout(250);
{ const g = await p.evaluate(() => { const r = (el) => el && !el.hidden ? el.getBoundingClientRect() : null, t = r(document.querySelector(".notice-stack .toast")), v = r(document.querySelector(".view-tab")), d = r(document.querySelector(".dock-tab")), s = r(document.querySelector("#score"));
    const hit = (a, b) => !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { toast: !!t, view: hit(t, v), dock: hit(t, d), inScore: !!t && !!s && t.bottom <= s.bottom + 1 && t.top >= s.top }; });
  check(g.toast && !g.view && !g.dock && g.inScore, "提示在谱那一块的底边：不压挂签、不压小条", JSON.stringify(g)); }
await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(100); await p.click('.ctx-menu [data-v="follow"]'); await p.waitForTimeout(100);   // 自动翻开回去
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntop-sels: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
