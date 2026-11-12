// test/e2e/pad-key-auto.mjs —— 真浏览器 E2E：键盘「1=」跟谱 / 手动（v0.16.9）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「对谱头吧…谱上调号和键盘上的一等于对不上，这样的话键盘就有个自动模式。然后也有个手动覆盖模式…手动覆盖模式的时候，确实有个提示」
//   「medo的接口要窄，宿主给他提供各种信息」）。
// 守：新歌 = 跟谱（谱头改成 1=D，键盘跟过去、写的 1 = D）；拨一格 1= = 手动 + 角上「手动」；点开滚轮调式那一列最上面「跟谱」；拨调那一列 = 调式那一列从「跟谱」挪到大调；
//   选「跟谱」= 回去、小标收起。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pad-key-auto.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { pick } from "./dd.mjs";   // 下拉 = 界面零件库的标准件（7-T）：selectOption 用不了
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const knob = () => p.evaluate(() => { const k = document.querySelector(".pad-panel .k-key"), t = k?.querySelector(".k-tag"); return { label: k?.querySelector(".kl")?.textContent ?? "", tag: t && !t.hidden ? t.textContent : null, title: k?.getAttribute("title") ?? "" }; });
const auto = () => p.evaluate(() => window.__moonsinger.state().input.inputAuto);
const lastNote = () => p.evaluate(() => { const s = window.__moonsinger.state(), n = s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").pop(); return n ? `${n.pitch.step}${n.pitch.alter > 0 ? "#" : n.pitch.alter < 0 ? "b" : ""}${n.pitch.octave}` : null; });

// ① 新歌 = 跟谱；谱头改成 1=D（谱头面板），键盘跟过去
check((await auto()) === true, "新歌：键盘「1=」跟谱");
check((await knob()).tag === null && (await knob()).label.startsWith("1=C"), "C 大调：1=C、没有小标", JSON.stringify(await knob()));
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: 3 }); }); await p.waitForTimeout(100);
const keyBox = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), k = L.marks.find((x) => x.kind === "key" && x.system === 0); return { x: sc.left + L.pageX.left + k.x + k.w / 2, y: sc.top + k.y + k.h / 2 }; });
await p.mouse.click(keyBox.x, keyBox.y); await p.waitForTimeout(250);
await pick(p, '.header-panel [data-hp="key"]', "2"); await p.waitForTimeout(150);
await p.keyboard.press("Escape"); await p.waitForTimeout(100); await p.mouse.click(5, 300); await p.waitForTimeout(150);
const k1 = await knob();
check(k1.label.startsWith("1=D") && k1.tag === null, "谱头改成 D 大调 = 键盘跟成 1=D、没有小标", JSON.stringify(k1));
check(k1.title.includes("跟着谱"), "旋钮的提示说跟着谱", k1.title);
await p.click('.pad-key[data-k="0"]'); await p.waitForTimeout(150);
check((await lastNote())?.startsWith("D"), "写「1」= D", String(await lastNote()));

// ② 滚轮拨一格 = 手动 + 角上「手动」
const kb = await p.$(".pad-panel .k-key"), kr = await kb.boundingBox();
await p.mouse.move(kr.x + kr.width / 2, kr.y + kr.height / 2); await p.mouse.wheel(0, 100); await p.waitForTimeout(200);
const k2 = await knob();
check((await auto()) === false, "拨一格 = 手动");
check(!k2.label.startsWith("1=D") && k2.tag === "手动", "换了调、角上挂「手动」", JSON.stringify(k2));
check(k2.title.includes("跟谱"), "提示里说怎么回去（「跟谱」）", k2.title);

// ③ 点开滚轮：调式那一列最上面 = 跟谱，现在没选它；点它 = 回到跟谱
await p.mouse.move(5, 300); await p.click(".pad-panel .k-key"); await p.waitForTimeout(250);
const col = (n) => `.drum .drum-col:nth-of-type(${n})`;
const sc0 = await p.evaluate((c) => { const its = [...document.querySelectorAll(`${c} .drum-item`)]; return { first: its[0]?.textContent ?? "", on: document.querySelector(`${c} .drum-item.on`)?.textContent ?? "" }; }, col(2));
check(sc0.first.startsWith("跟谱"), "调式那一列最上面一档 = 跟谱", sc0.first);
check(!sc0.on.startsWith("跟谱"), "手动着 = 选中的不是「跟谱」", sc0.on);
await p.click(`${col(2)} .drum-item[data-i="0"]`); await p.waitForTimeout(250);
const k3 = await knob();
check((await auto()) === true && k3.label.startsWith("1=D") && k3.tag === null, "选「跟谱」= 回到 1=D、小标收起", JSON.stringify(k3));

// ④ 跟谱时在滚轮里拨调那一列：调式那一列跟着从「跟谱」挪到大调（键盘照宿主的现值挪另一列）
await p.click(".pad-panel .k-key"); await p.waitForTimeout(250);
check((await p.evaluate((c) => document.querySelector(`${c} .drum-item.on`)?.textContent ?? "", col(2))).startsWith("跟谱"), "跟谱着：调式那一列停在「跟谱」");
await p.evaluate((c) => { const el = document.querySelector(c), row = el.querySelector(".drum-item").getBoundingClientRect().height; el.scrollTop += row; el.dispatchEvent(new Event("scroll")); }, col(1)); await p.waitForTimeout(300);
const on2 = await p.evaluate((c) => document.querySelector(`${c} .drum-item.on`)?.textContent ?? "", col(2));
check((await auto()) === false && on2.startsWith("大调"), "拨调那一列 = 手动，调式那一列挪到大调", `${await auto()} / ${on2}`);
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npad-key-auto: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
