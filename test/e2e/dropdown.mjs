// test/e2e/dropdown.mjs —— 真浏览器 E2E：下拉框 = 界面零件库的下拉标准件（7-T）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   原生下拉框打开时浏览器自己吃键、列表盖在最上面；换成「一颗按钮 + 挂在 body 上的弹层」之后这几样要宿主明着做到，这里守：
//   ① 在面板（谱头面板）里点开下拉：列表盖在面板上面（点得到）、面板不因为「点了外面」收掉；选一项 = 面板还开着、值改了
//   ② 列表开着按上下键：在列表里走，谱上的光标不动；按 Esc：只收列表、面板还在（焦点停在下拉上时 Esc 不收面板，同原来的原生下拉框）；点面板外面照旧收
//   ③ 焦点停在下拉那颗按钮上按空格 = 打开它，不是播放
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dropdown.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const panelOpen = () => p.evaluate(() => { const m = document.querySelector(".ctx-menu.header-panel"); return !!m && m.getBoundingClientRect().width > 0; });
const listOpen = () => p.evaluate(() => [...document.querySelectorAll(".popup-menu")].some((m) => !m.classList.contains("hidden") && m.getBoundingClientRect().width > 0));
const caret = () => p.evaluate(() => window.__moonsinger.state().caret);
const openPanel = async () => {
  const k = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), k = L.marks.find((x) => x.kind === "key" && x.system === 0); return { x: sc.left + L.pageX.left + k.x + k.w / 2, y: sc.top + k.y + k.h / 2 }; });
  await p.mouse.click(k.x, k.y); await p.waitForTimeout(250);
};
await openPanel();
check(await panelOpen(), "点行首的调号 = 谱头面板开着");
const sel = '.header-panel [data-hp="time"]';
check((await p.$eval(sel, (b) => b.tagName)) === "BUTTON", "谱头面板里的下拉是一颗按钮（界面零件库的标准件），不是原生下拉框");

// ① 点开：列表在面板上面、点得到；面板没收
await p.click(sel); await p.waitForTimeout(150);
check(await listOpen(), "点下拉 = 列表开了");
check(await panelOpen(), "点开下拉的那一下没让面板以为「点了外面」");
const onTop = await p.evaluate(() => { const it = document.querySelector('.popup-menu:not(.hidden) [data-id="3/4"]'); if (!it) return "没有 3/4 这一项"; const r = it.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return hit && (hit === it || it.contains(hit)) ? "ok" : `点在 ${hit?.className}`; });
check(onTop === "ok", "列表盖在面板上面（列表里的项点得到）", onTop);

// ② 上下键在列表里走、谱上的光标不动；Esc 只收列表
const c0 = await caret();
await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowUp"); await p.waitForTimeout(100);
check((await caret()) === c0, "列表开着按上下键：谱上的光标不动", `${c0} → ${await caret()}`);
check(await listOpen(), "上下键之后列表还开着");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(!(await listOpen()), "Esc = 收列表");
check(await panelOpen(), "Esc 只收列表：谱头面板还开着");

// ① 选一项：面板还开着、值改了（拍号改成 3/4）
await p.click(sel); await p.waitForTimeout(150);
await p.click('.popup-menu:not(.hidden) [data-id="3/4"]'); await p.waitForTimeout(200);
const head = await p.evaluate(() => { const s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part]; const x = t.find((y) => y.kind === "time"); return x ? `${x.beats}/${x.beatType}` : null; });
check(head === "3/4", "选「3/4」= 开头的拍号改成 3/4", String(head));
check(await panelOpen(), "选完面板还开着（同原生下拉框：在面板里连着改几样）");
check((await p.$eval(sel, (b) => b.value)) === "3/4", "钮上的值跟着变");

// ③ 焦点停在下拉上按空格 = 打开它，不播放
await p.focus(sel); await p.keyboard.press(" "); await p.waitForTimeout(200);
check(!(await p.evaluate(() => window.__moonsinger.engine.playing)), "焦点在下拉上按空格：不播放");
check(await listOpen(), "焦点在下拉上按空格：列表开了");
await p.keyboard.press("Escape"); await p.waitForTimeout(120);
check(!(await listOpen()) && (await panelOpen()), "Esc 收列表，面板还在");
await p.mouse.click(5, 300); await p.waitForTimeout(150);
check(!(await panelOpen()), "列表收了之后点面板外面 = 面板照旧收（「按在列表上不算外面」没把真的外面也算成里面）");

check(errs.length === 0, "没有页面报错", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
