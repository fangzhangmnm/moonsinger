// test/e2e/undo.mjs —— 真浏览器 E2E（先 npm run build，再 npm run serve（8710），再 node test/e2e/undo.mjs；借 WeebPaint 的 playwright，同 shell-smoke）。created 2026-10-08 by Claude Fable 5.1
// 撤销 / 重做 E2E：写三个音 → ⌘Z 两步 → ⌘⇧Z → 顶栏钮 → 连打歌词算一步 → 换歌清栈 → 歌库里 undo 之后自动存。
import { chromium } from "../../../20260524 WeebPaint/node_modules/playwright/index.mjs";
import os from "node:os"; import path from "node:path";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://127.0.0.1:8710/"); await p.waitForTimeout(500);
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
  const ly = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); const h = L.lyrics[0]; return { x: sh.left + L.pageX.left + h.x, y: sh.top + h.y - L.sp * 0.5 }; });
  await p.mouse.click(ly.x, ly.y); await p.waitForTimeout(120);
  const before = (await hist()).past;
  for (const ch of ["さ", "く", "ら"]) { await p.keyboard.type(ch); await p.waitForTimeout(60); }
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  check((await lyrics()) === "さ く ら", "歌词打上了", await lyrics());
  check((await hist()).past === before + 1, "连打三个字 = 一步", JSON.stringify(await hist()));
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
  check(errs.length === 0, "零页面错误", errs.join(" | ").slice(0, 200));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
