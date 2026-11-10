// test/e2e/inst-split.mjs —— 真浏览器 E2E：选乐器和调乐器分开（v0.16.35；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §9）。
// created 2026-11-09 by Claude Opus 5.5。user 11-09「你必须得选一个乐器，如果不选的话。退出是不创建新声部」「你选乐器的时候不自动退出」
//   「如果在播放的时候调乐器的话，那个试听的按钮就隐藏掉」「标准名下拉框拿掉」；小月相两个键几乎同时按 = 第二个不写、说一次。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/inst-split.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const nParts = () => p.evaluate(() => window.__moonsinger.state().song.parts.length);
const finderOpen = () => p.$eval(".finder", (e) => !e.hidden);
const toasts = () => p.$$eval(".notice-stack .toast, .notice, [role=alert]", (es) => es.map((e) => e.textContent ?? ""));
const openNew = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(200);
  await p.click(".parts-mgr [data-v^=addbelow]"); await p.waitForTimeout(150); await p.click(".parts-mgr [data-v=addnew]"); await p.waitForTimeout(400); };

// ① 新声部 = 先开目录，不选退出 = 什么都不建
await openNew();
check(await finderOpen(), "＋ 新声部 = 开乐器目录（不是乐器设置页）");
check(!(await p.$eval(".inst-page", (e) => !e.hidden)), "乐器设置页没开");
check(await nParts() === 1, "还没选 = 还没建", String(await nParts()));
check(/新声部/.test(await p.$eval(".finder-title", (e) => e.textContent)), "顶条写「给新声部」", await p.$eval(".finder-title", (e) => e.textContent));
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
check(!(await finderOpen()) && await nParts() === 1, "不选直接退出 = 不建（没有冒出一个默认的小月相）", String(await nParts()));
// ② 再来一次，选了 = 建好、目录不关、一步撤销
await openNew();
await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(400);
check(await nParts() === 2, "选了乐器 = 建了声部", String(await nParts()));
check(await finderOpen(), "选完目录还开着（可以接着换）");
check(!/新声部/.test(await p.$eval(".finder-title", (e) => e.textContent)), "顶条换成这个声部的名字", await p.$eval(".finder-title", (e) => e.textContent));
await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(300);
check(await nParts() === 2, "再选 = 换这个声部的乐器，不再建", String(await nParts()));
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(200);
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(200);
check(await nParts() === 1, "撤销两步 = 回到加之前（加 + 选是一步）", String(await nParts()));
// ③ 放着歌的时候目录里不给「听开头」
await p.evaluate(() => document.querySelector(".finder")?.classList.add("is-playing"));
const hidden = await p.evaluate(() => { const b = document.createElement("button"); b.dataset.v = "play"; const w = document.createElement("div"); w.className = "prov-b"; w.append(b); document.querySelector(".finder").append(w); const d = getComputedStyle(b).display; w.remove(); return d; });
check(hidden === "none", "放着歌（.finder.is-playing）= 「听开头」藏起来", hidden);
await p.evaluate(() => document.querySelector(".finder")?.classList.remove("is-playing"));
// ④ 乐器设置页：没有名字框、没有标准名下拉；谱上叫什么 = 页尾一行只读
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
check(await p.$eval(".inst-page", (e) => !e.hidden), "乐器设置页开着");
check(!(await p.$("#roleIn")) && !(await p.$("#roleSel")), "没有名字框、没有标准名下拉（user「标准名下拉框拿掉」）");
check(/谱上写「/.test(await p.$eval(".inst-page .ip-what", (e) => e.textContent)), "页尾一行：谱上写「…」（只读，改名在声部管理）");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
// ⑤ 小月相（单音）两个键几乎同时按：第二个不写，说一次
const before = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.filter((t) => t.kind === "note").length);
await p.click("#score svg", { position: { x: 400, y: 260 } }).catch(() => {}); await p.waitForTimeout(100);
await p.evaluate(() => { const a = document.querySelectorAll(".pad-key[data-k]"); for (const k of [a[2], a[4]]) k.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: k === a[2] ? 11 : 12, pointerType: "touch", isPrimary: k === a[2] })); });
await p.waitForTimeout(80);
await p.evaluate(() => { const a = document.querySelectorAll(".pad-key[data-k]"); for (const [k, id] of [[a[2], 11], [a[4], 12]]) k.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: id, pointerType: "touch" })); });
await p.waitForTimeout(200);
const after = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.filter((t) => t.kind === "note").length);
check(after === before + 1, "几乎同时按两个键：只写了一个", `${before} → ${after}`);
check(!(await toasts()).some((t) => /第二个键没写/.test(t)), "后按的算数（v0.16.77 起，user 11-09 同意）= 第二个键顶掉第一个，不再说「没写」", (await toasts()).join(" | "));   // 2026-11-10 Opus 5.5：原来查的那句提示随「后按的算数」不再出现
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ninst-split: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
