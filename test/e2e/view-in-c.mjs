// test/e2e/view-in-c.mjs —— 真浏览器 E2E：看谱方式（v0.16.10）——专业模式 C 调的淡「1=C」+ 辅助模式「按 C 调看」。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「我需要一个残疾人模式…显示的时候…帮我转到 C 大调上面，然后…写一个一等于 F」「专业模式是大写是绝对，小写是相对，
//   然后这个助残模式是大写是相对，小写是绝对」「专业模式下面C调的时候，最好也能有一个显示调号的方案，这个样子我就不会像这次一样忘了点了」）。
// 守：专业 = C 调画淡「1=C」（点它 = 谱头面板）、换成 F 调就没了、键上大字音名；设置里切「按 C 调看」= 写「1=F」、音画在 C 调的位置、键上大字级数、
//   谱的数据不变；按 C 调看时拖音高一格 = 实际也挪一格；切回专业 = 照实际画。
//   谱面分家第三刀（2026-11-11）：「按 C 调看」是这首歌的设置，在纸的设置「看谱」里（原来在设置「乐理助手」、存在设备上）——写进歌里（viewInC: true）、能撤销，设备上不再记。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/view-in-c.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick, pickOnPage } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
await p.goto(BASE); await p.waitForTimeout(800);
// 「1=X」：印的在 svg（text.key-label）；专业模式 C 调的淡「1=C」在谱面上面那一层（.ov-key-hint，刀 1）——两样合起来比，提示带「~」
const labels = () => p.evaluate(() => [...[...document.querySelectorAll("#score text.key-label")].map((t) => t.textContent), ...[...document.querySelectorAll("#score .score-overlay .ov-key-hint")].map((t) => `${t.textContent}~`)].join(" "));
const firstNote = () => p.evaluate(() => { const m = window.__moonsinger, s = m.state(), n = s.song.papers[0].tracks[s.at.part].find((t) => t.kind === "note"), h = m.layout().notes[0]; return { real: n ? `${n.pitch.step}${n.pitch.alter < 0 ? "b" : n.pitch.alter > 0 ? "#" : ""}${n.pitch.octave}` : null, d: h?.d }; });
// 键上两行（第 19 条：宿主算好、键盘只画）：「1」那颗键（data-k 0）的大字 / 小字；音域旋钮 = 最低、最高两个键的大字；「1=」角上的小标
const faces = () => p.evaluate(() => { const k = document.querySelector('.pad-key[data-k="0"]'); return { big: k?.querySelector(".kf-big")?.textContent?.trim() ?? "", small: k?.querySelector(".kf-small")?.textContent?.trim() ?? "" }; });
const rangeOk = () => p.evaluate(() => { const ks = [...document.querySelectorAll(".pad-key[data-k]")].sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k)), big = (k) => k.querySelector(".kf-big")?.textContent?.trim();
  const r = (document.querySelector('[data-knob="range"] .kl')?.textContent ?? "").replace(/\s+/g, ""); return { r, ok: r.includes(big(ks[0])) && r.includes(big(ks[ks.length - 1])) }; });
const keyTags = () => p.$$eval('[data-knob="key"] .k-tag', (ts) => ts.map((t) => t.textContent).join(","));
const closeAll = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(120); await p.mouse.click(5, 300); await p.waitForTimeout(120); };
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForSelector(".set-panel"); };
const setView = async (v) => { await openSheet(); await pickOnPage(p, '.set-panel [data-pg="inc"]', v === "inc" ? "on" : "off"); await p.waitForTimeout(250); await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(200); };

// ① 专业（默认）：C 调 = 淡「1=C」；键上大字音名
check((await labels()) === "1=C~", "专业 + C 调：调号上方淡「1=C」", await labels());
check(JSON.stringify(await faces()) === JSON.stringify({ big: "C4", small: "1" }), "专业：键上大字写音名、小字写级数", JSON.stringify(await faces()));
const hint = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-key-hint")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
await p.mouse.click(hint.x, hint.y); await p.waitForTimeout(250);
check(await p.evaluate(() => !!document.querySelector(".ctx-menu.header-panel")), "点「1=C」= 谱头面板");
await pick(p, '.header-panel [data-hp="key"]', "-1"); await p.waitForTimeout(150); await closeAll();
check((await labels()) === "", "改成 1=F（有降号了）= 提示没了", await labels());
await p.click('.pad-key[data-k="0"]'); await p.waitForTimeout(150);   // 键盘跟谱：1 = F
const n0 = await firstNote();
check(n0.real === "F3", "写「1」= F3（不带点的那一组 = 离说话的音高 D4 最近的 1）", JSON.stringify(n0));

const clefPro = await p.$$eval("#score text.clef", (t) => t.map((x) => x.textContent).join(""));
// ② 纸的设置「看谱」里切「按 C 调看」
await setView("inc");
const n1 = await firstNote();
check((await labels()) === "1=F", "按 C 调看：调号上方写「1=F」（不是淡的）", await labels());
check(n1.real === "F3" && n1.d === 21, "音画在 C3 的位置（d = 21，往下四度），谱里还是 F3", JSON.stringify(n1));
check(JSON.stringify(await faces()) === JSON.stringify({ big: "C3", small: "F3" }), "按 C 调看：「1」那颗键大字 = 谱上画成的 C3、小字 = 实际的 F3（第 19 条）", JSON.stringify(await faces()));
const rg = await rangeOk(); check(rg.ok, "音域旋钮 = 最低、最高两个键的大字（换到 C 调的名字）", rg.r);
check((await keyTags()) === "键上按 C 调写", "「1=」角上挂「键上按 C 调写」", await keyTags());
check((await p.$$eval("#score text.clef", (t) => t.map((x) => x.textContent).join(""))) === clefPro, "谱号照实际的调挑（换个看法谱号不跳）");
check((await p.evaluate(() => document.querySelector('.pad-key[data-k="0"]')?.classList.contains("tonic"))) === true, "「1」那颗键顶上有短横");

// ③ 按 C 调看时拖音高一格（鼠标长按再拖）= 实际也挪一格（F4 → G4）
const nb = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), n = L.notes[0]; return { x: sc.left + L.pageX.left + n.x + n.w / 2, y: sc.top + n.y, step: L.sp / 2 }; });
await p.mouse.move(nb.x, nb.y); await p.mouse.down(); await p.waitForTimeout(550); const dy = Math.max(6.3, nb.step * 1.2);   // 拖动先要挪过 6 px 才算开始；又不到一格半（= 只挪一格）
await p.mouse.move(nb.x, nb.y - dy, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
const n2 = await firstNote();
check(n2.real === "G3" && n2.d === 22, "往上拖一格：谱里 F3 → G3，画在 D3（d = 22）", JSON.stringify(n2));
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);

// ④ 跟着歌走：写进歌里、能撤销（撤销 = 回到专业，键上大字跟着换）；设备上不再记
check((await p.evaluate(() => window.__moonsinger.state().song.viewInC)) === true, "写进歌里（viewInC: true）");
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await faces()).big === "F3" && !(await labels()).includes("1=F") && (await keyTags()) === "", "撤销 = 回到专业（键上大字实际音名 F3、没有「1=F」、没有那个小标）", await labels());
await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(250);
check((await faces()).big === "C3" && (await labels()) === "1=F", "重做 = 又按 C 调看（键上大字 C3）", await labels());
check(!(await p.evaluate(() => { try { return Object.keys(localStorage).some((k) => k.endsWith(":view-in-c")); } catch { return false; } })), "设备上不再记（没有写 view-in-c 这个键）");

// ⑤ 切回专业 = 照实际画
await setView("pro");
check(JSON.stringify(await faces()) === JSON.stringify({ big: "F3", small: "1" }), "切回专业：键上大字实际音名、小字级数", JSON.stringify(await faces()));
check(!(await labels()).includes("1=F"), "切回专业：没有「1=F」（调号照画）", await labels());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nview-in-c: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
