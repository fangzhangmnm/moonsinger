// test/e2e/undo.mjs —— 真浏览器 E2E（先 npm run build，再 npm run serve（8710），再 node test/e2e/undo.mjs；借 WeebPaint 的 playwright，同 shell-smoke）。created 2026-10-08 by Claude Fable 5.1
// 撤销 / 重做 E2E：写三个音 → ⌘Z 两步 → ⌘⇧Z → 顶栏钮 → 连打歌词算一步 → 换歌清栈 → 歌库里 undo 之后自动存。
import { chromium } from "./pw.mjs";
import os from "node:os"; import path from "node:path";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(500);
  const n = () => p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.length - 3);
  const hist = () => p.evaluate(() => window.__moonsinger.history());
  const lyrics = () => p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.slice(3).map((t) => t.kind === "note" ? (t.lyric ?? "·") : t.kind).join(" "));
  check(await p.$eval("#undoBtn", (e) => e.disabled) && await p.$eval("#redoBtn", (e) => e.disabled), "开局：撤销 / 重做都灰");
  await p.click("#score", { position: { x: 300, y: 300 } });
  for (const k of ["Digit1", "Digit2", "Digit3"]) await p.keyboard.press(k);
  check((await n()) === 3 && (await hist()).past === 3, "写三个音 = 三步", JSON.stringify(await hist()));
  check(!(await p.$eval("#undoBtn", (e) => e.disabled)), "撤销钮亮了");
  await p.keyboard.press("Control+z"); await p.waitForTimeout(80);
  check((await n()) === 2, "⌘Z：剩两个");
  await p.keyboard.press("Control+z"); await p.waitForTimeout(80);
  check((await n()) === 1 && (await hist()).future === 2, "再 ⌘Z：剩一个，future 两步");
  await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(80);
  check((await n()) === 2, "⌘⇧Z：回到两个");
  await p.click("#redoBtn"); await p.waitForTimeout(80);
  check((await n()) === 3, "顶栏重做钮：回到三个");
  await p.click("#undoBtn"); await p.waitForTimeout(80);
  check((await n()) === 2, "顶栏撤销钮");
  await p.keyboard.press("Digit5"); await p.waitForTimeout(80);
  check((await n()) === 3 && (await hist()).future === 0, "撤销后再写 = 分叉，重做没了");
  // 连打歌词 = 一步
  await p.evaluate(() => window.__moonsinger.setMode("lyrics"));   // v0.9.19：歌词框只在「词」模式里点得开
  const ly = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); const h = L.lyrics[0]; return { x: sh.left + L.pageX.left + h.x, y: sh.top + h.y - L.sp * 0.5 }; });
  await p.mouse.click(ly.x, ly.y); await p.waitForTimeout(120);
  const before = (await hist()).past;
  for (const ch of ["さ", "く", "ら"]) { await p.keyboard.type(ch); await p.waitForTimeout(60); }
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  check((await lyrics()) === "さ く ら", "歌词打上了", await lyrics());
  check((await hist()).past === before + 1, "连打三个字 = 一步", JSON.stringify(await hist()));
  await p.evaluate(() => window.__moonsinger.setMode("notes"));
  await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("Control+z"); await p.waitForTimeout(80);
  check((await lyrics()) === "· · ·", "⌘Z 一下三个字全回去", await lyrics());
  // 歌库里：undo 之后 2 s 自动存
  await p.evaluate(() => window.__moonsinger.attach());
  const creating = p.evaluate(() => window.__moonsinger.newStoreSong());   // 手里是改过的无地稿：先问「丢掉，继续」
  await p.waitForSelector('.offer [data-v="go"]'); await p.click('.offer [data-v="go"]'); await creating; await p.waitForTimeout(500);
  check((await hist()).past === 0, "换歌 = 清栈");
  await p.click("#score", { position: { x: 300, y: 300 } });
  for (const k of ["Digit1", "Digit2"]) await p.keyboard.press(k);
  await p.waitForTimeout(2600);
  await p.keyboard.press("Control+z"); await p.waitForTimeout(2600);
  const id = await p.evaluate(() => window.__moonsinger.identifier());
  const saved = await p.evaluate(async (id) => { const bl = await window.__moonsinger.store().zip(id, { mode: "existing" }).open(); const u = new Uint8Array(await bl.arrayBuffer()); return window.__moonsinger.open("x.mxl", u).song.papers[0].tracks.P1.length - 3; }, id);
  check(saved === 1, "歌库里撤销也自动存进去了", String(saved));
  // ── extras 进同一条 undo（user 2026-10-08「undo 同意啊」「每一步快照带 locus 同意」）：录音室推子 → ⌘Z 回去 + toast 说是录音室的；重做再回来
  await p.selectOption("#modeSel", "listen"); await p.waitForTimeout(300);
  check(await p.isVisible(".studio"), "录音室开了");
  const slide = (v) => p.$eval(".studio .strip input[data-gain]", (el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, v);
  const gain = () => p.evaluate(() => { const m = (window.__moonsinger.extras().studio?.tracks ?? []).filter((t) => t.kind === "mic"); return m.length ? m[0].gainDb : null; });   // studio.json v2（2026-10-10）：mics → tracks（kind mic）
  await slide(-6); await p.waitForTimeout(100);
  check((await gain()) === -6, "推子 → 麦克风增益 −6 dB", String(await gain()));
  const before2 = (await hist()).past;
  await slide(-9); await p.waitForTimeout(100);
  check((await hist()).past === before2 && (await gain()) === -9, "连着推 = 同一步（1.5 s 内合并）", JSON.stringify(await hist()));
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
  check((await gain()) !== -9 && (await gain()) !== -6, "⌘Z：增益回去了", String(await gain()));
  const t1 = await p.evaluate(() => window.__moonsinger.undoText()); check(/^撤销 · 混音台 · .*增益/.test(t1), "toast 说明撤的是混音台的增益", t1);
  await p.keyboard.press("Control+Shift+z"); await p.waitForTimeout(150);
  check((await gain()) === -9, "重做：增益回到 −9", String(await gain()));
  check(/^重做 · 混音台/.test(await p.evaluate(() => window.__moonsinger.undoText())), "重做的 toast 还是那句话");
  // ── 视图跟着 locus 走：在第 2 段写的音，从第 1 段撤回去 → 视图跳到第 2 段（user 的顾虑：多按几次静默变了没在看的曲段）
  await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(150);
  const paperOf = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers.findIndex((pp) => pp.id === s.at.paper); });
  check((await paperOf()) === 1, "加纸 → 光标在第 2 段");
  await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("Digit3"); await p.waitForTimeout(100);
  const h3 = (await hist()).past;
  await p.evaluate(() => { const ms = window.__moonsinger, s = ms.state(); ms.set({ ...s, at: { paper: s.song.papers[0].id, part: s.at.part } }); }); await p.waitForTimeout(150);
  check((await paperOf()) === 0 && (await hist()).past === h3, "切回第 1 段看（换视图不记 undo）");
  await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
  check((await paperOf()) === 1, "⌘Z：视图跳到被撤的第 2 段");
  const t2 = await p.evaluate(() => window.__moonsinger.undoText()); check(/^撤销 · .+ · 写了 1 个$/.test(t2), "toast 带着纸的名字和改了什么", t2);
  // ── 视图态（desk）顺手捞进文件、改了不标脏、不进 undo
  await p.waitForTimeout(2600);   // 等上一步的自动存落完，再看「切排法不标脏」
  const h4 = (await hist()).past;
  await p.evaluate(() => window.__moonsinger.setPages(true)); await p.waitForTimeout(100);
  check(!(await p.evaluate(() => window.__moonsinger.dirty())) && (await hist()).past === h4, "切排法：不标脏、不记 undo");
  const v = await p.evaluate(() => window.__moonsinger.open("x.mxl", window.__moonsinger.bytes()).view);
  check(!!v && v.pageFlow === true && typeof v.paper === "string", "存出来的 .mxl 带着视图态（分页 + 在哪张纸）", JSON.stringify(v));
  check(errs.length === 0, "零页面错误", errs.join(" | ").slice(0, 200));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
