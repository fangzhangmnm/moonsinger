// test/e2e/modes.mjs —— 真浏览器 E2E：编辑模式（音 / 词 / 符 + 听）和底座（音键 / 符号格 / 录音室，互斥）。created 2026-10-10 by Claude Opus 5.5
// user「模式！音，歌词，强度和articulation！我早就想用退格删强度曲线了。还有一个就是播放模式，锁写谱，但是可以调录音室」「强度和演奏法能不能合并，就是符号编辑，和别的符号也合并」
//   「录音室的键盘位化，和键盘互相排斥…键盘的模式键是不是能摘下来」「键盘上面那些可以滚的东西的鼠标滚轮操作也做一下」。规则表 = src/app/workspace.ts。
// 跑：npm run build → npm run serve（8710）→ node test/e2e/modes.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const W = () => p.evaluate(() => window.__moonsinger.workspace());
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").map((t) => t.lyric ?? "·").join(" "); });
const mode = async (m) => { await p.click(`.mode-seg [data-mode="${m}"]`); await p.waitForTimeout(150); };
// 0. 默认
let w = await W();
check(w.mode === "notes" && w.dock === "keys" && !(await p.$eval(".pad-panel", (e) => e.hidden)), "默认 = 「音」、底座是音键", JSON.stringify(w));
check(!(await p.$(".pad-tools [data-symbols]")), "pad 上没有「符」键了（模式键摘到顶栏）");
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
check((await notes()) === "· · · ·", "写了四个音");
// 1. 「音」里点歌词行 = 不开歌词框
const lyPt = async (k) => p.evaluate((k) => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); const h = L.lyrics[k]; return { x: sh.left + L.pageX.left + h.x, y: sh.top + h.y - L.sp * 0.5 }; }, k);
let pt = await lyPt(1); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150);
check(await p.$eval(".lyric-input", (e) => e.hidden), "「音」里点歌词行 = 不开歌词框（光标）");
// 2. 「词」：键盘收起；点音 = 开那个音的歌词框；打字；退格（框关着）= 删光标前那个音的字；数字键不写音
await mode("lyrics");
w = await W();
check(w.mode === "lyrics" && w.dock === "none" && (await p.$eval(".pad-panel", (e) => e.hidden)) && (await p.$eval("#padTab", (e) => e.hidden)), "「词」= 底座空（系统键盘打字），也不露「键盘」tab", JSON.stringify(w));
check((await p.$eval("#score", (e) => e.dataset.mode)) === "lyrics", "谱面标着「词」（记号淡下去）");
const head = await p.locator(".staff-svg .note").nth(1).boundingBox();
await p.mouse.click(head.x + head.width / 2, head.y + head.height / 2); await p.waitForTimeout(200);
check(!(await p.$eval(".lyric-input", (e) => e.hidden)), "「词」里点音 = 开它的歌词框");
await p.keyboard.type("か"); await p.waitForTimeout(80); await p.keyboard.press("Escape"); await p.waitForTimeout(120);
check((await notes()).split(" ")[1] === "か", "打上了", await notes());
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: s.song.papers[0].tracks[s.at.part].findIndex((t) => t.kind === "note" && t.lyric === "か") + 1 }); });
await p.keyboard.press("Backspace"); await p.waitForTimeout(120);
check((await notes()).split(" ")[1] === "·", "「词」里退格 = 删光标前那个音的字（音还在）", await notes());
await p.keyboard.press("Digit5"); await p.waitForTimeout(120);
check((await notes()).split(" ").length === 4, "「词」里数字键不写音", await notes());
// 3. 「符」：底座 = 符号格；放一个 f；点它 = 小菜单；退格 = 删记号
await mode("symbols");
w = await W();
check(w.dock === "symbols" && !!(await p.$(".pad-grid.symbols")), "「符」= 底座是符号格", JSON.stringify(w));
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: s.song.papers[0].tracks[s.at.part].length }); });
await p.click('.pad-head [data-sympage="dyn"]'); await p.waitForTimeout(80);
await p.click('[data-sym="dyn:f"]'); await p.waitForTimeout(150);
const dynN = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "dyn").length; });
check((await dynN()) === 1, "放了一个 f");
const f = await p.$eval("#score text.dyn", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(f.x, f.y); await p.waitForTimeout(150);
check(!!(await p.$(".ctx-menu")), "「符」里点力度字 = 它的小菜单");
await p.keyboard.press("Escape"); await p.evaluate(() => document.querySelector(".ctx-menu")?.remove()); await p.waitForTimeout(80);
await p.keyboard.press("Backspace"); await p.waitForTimeout(120);
check((await dynN()) === 0 && (await notes()).split(" ").length === 4, "「符」里退格 = 删记号（不删音）", `${await dynN()} 个力度 / ${await notes()}`);
await mode("notes");
await p.mouse.click(f.x, f.y); await p.waitForTimeout(150);
// 4. 录音室进底座：键盘让位、谱还看得见；Esc 收起 = 键盘回来
await p.click("#studioBtn"); await p.waitForTimeout(200);
w = await W();
check(w.dock === "studio" && !(await p.$eval(".studio", (e) => e.hidden)) && (await p.$eval(".pad-panel", (e) => e.hidden)) && !(await p.$eval("#score", (e) => e.hidden)), "录音室 = 在底座里（键盘让位，谱还在）", JSON.stringify(w));
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
w = await W();
check(w.dock === "keys" && (await p.$eval(".studio", (e) => e.hidden)), "Esc = 收起录音室、键盘回来", JSON.stringify(w));
// 4½. 右键歌手名 = 歌手牌（同左键；user「右键歌手名应该也是弹歌手选项，和左键一样」）
await p.click("#score text.part-name", { button: "right" }); await p.waitForTimeout(200);
check(!!(await p.$(".track-card:not(.ctx-menu)")), "右键歌手名 = 开歌手牌");
await p.keyboard.press("Escape"); await p.mouse.click(1080, 880); await p.waitForTimeout(150);
// 5. 旋钮吃鼠标滚轮（长短）
const unit0 = await p.evaluate(() => window.__moonsinger.state().input.unit);
const knob = await p.locator('[data-knob="unit"]').boundingBox();
await p.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2); await p.mouse.wheel(0, 120); await p.waitForTimeout(150);
const unit1 = await p.evaluate(() => window.__moonsinger.state().input.unit);
check(unit1 !== unit0, "滚轮拨「长短」旋钮", `${unit0} → ${unit1}`);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\nmodes: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
