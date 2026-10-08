// test/e2e/select.mjs —— 真浏览器 E2E（先 npm run build，再 npm run serve（8710），再 node test/e2e/select.mjs；借 WeebPaint 的 playwright，同 shell-smoke）。created 2026-10-08 by Claude Fable 5.1
// 改的手感 E2E：轻点 = 光标（不选中）；长按 = 选中 + 把手 + 选区条；拖把手扩选；复制 / 粘贴 / 剪切 / 全选 / 删；系统剪贴板简谱文字；一次只看一张纸。
import { chromium } from "./pw.mjs";
import os from "node:os"; import path from "node:path";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 }, permissions: ["clipboard-read", "clipboard-write"] });
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(500);
  const S = () => p.evaluate(() => { const s = window.__moonsinger.state(); return { sel: s.sel, caret: s.caret, n: s.song.papers[0].tracks.P1.length }; });
  const notes = () => p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  await p.click("#score", { position: { x: 600, y: 400 } });
  for (const k of ["Digit1", "Digit2", "Digit3", "Digit5", "Digit6", "Digit5"]) await p.keyboard.press(k);
  await p.waitForTimeout(200);
  const ns = await notes(); check(ns.length === 6, "写了 6 个音", String(ns.length));
  // 轻点第二个音 = 光标到它后面，不选中
  await p.mouse.click(ns[1].x, ns[1].y); await p.waitForTimeout(100);
  let s = await S(); check(s.sel === null && s.caret === 3 + 2, "轻点音符：光标到它后面、不选中", JSON.stringify(s));
  check(await p.evaluate(() => document.getElementById("stage").querySelector(".sel-bar").hidden), "没选区：选区条藏着");
  // 长按第二个音 = 选中它
  await p.mouse.move(ns[1].x, ns[1].y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(150);
  s = await S(); check(!!s.sel && s.sel.from === 4 && s.sel.to === 5, "长按音符：选中它", JSON.stringify(s.sel));
  check(!(await p.evaluate(() => document.getElementById("stage").querySelector(".sel-bar").hidden)), "有选区：选区条露出来");
  check(await p.evaluate(() => !document.querySelector(".sel-handle.start").hidden && !document.querySelector(".sel-handle.end").hidden), "两个把手露出来");
  check(await p.$("svg .note.sel") == null || (await p.$eval("svg .note.sel", (e) => getComputedStyle(e).fill)) !== "rgb(29, 95, 168)", "音不涂蓝（只有带子）");
  // 长按不抬手接着拖到第四个音 = 扩选
  await p.mouse.move(ns[1].x, ns[1].y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.move(ns[3].x, ns[3].y, { steps: 5 }); await p.waitForTimeout(100); await p.mouse.up(); await p.waitForTimeout(150);
  s = await S(); check(!!s.sel && s.sel.from === 4 && s.sel.to === 7, "长按后拖：扩选到第四个音", JSON.stringify(s.sel));
  // 拖右把手到第五个音
  const hb = await p.$eval(".sel-handle.end", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.7 }; });
  await p.mouse.move(hb.x, hb.y); await p.mouse.down(); await p.mouse.move(ns[4].x, hb.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  s = await S(); check(!!s.sel && s.sel.from === 4 && s.sel.to === 8, "拖右把手：扩到第五个音", JSON.stringify(s.sel));
  // 复制 → 系统剪贴板是简谱文字；选区条「复制」
  await p.click('.sel-bar [data-v="copy"]'); await p.waitForTimeout(200);
  const clipText = await p.evaluate(() => navigator.clipboard.readText());
  check(clipText === "2_ 3_ 5_ 6_", "系统剪贴板 = 简谱文字", clipText);
  // 点别处 = 光标，选区消失；选区条只剩「粘贴到光标处」
  await p.mouse.click(ns[5].x + 80, ns[5].y); await p.waitForTimeout(150);
  s = await S(); check(s.sel === null, "点空白：选区消失");
  check(/粘贴到光标处/.test(await p.textContent(".sel-bar")), "剪贴板有东西：露「粘贴到光标处」");
  // 末尾粘贴
  await p.keyboard.press("End"); await p.click('.sel-bar [data-v="paste"]'); await p.waitForTimeout(200);
  s = await S(); check(s.n === 3 + 6 + 4, "贴了 4 个在末尾", String(s.n));
  // 系统剪贴板放别的简谱文字 → 贴进来认它
  await p.evaluate(() => navigator.clipboard.writeText("1 - 0 | 5'/la"));
  await p.keyboard.press("Control+v"); await p.waitForTimeout(300);
  const last = await p.evaluate(() => { const t = window.__moonsinger.state().song.papers[0].tracks.P1; return t.slice(-4).map((x) => x.kind === "note" ? `${x.pitch.step}${x.pitch.octave}:${x.dur}:${x.lyric ?? ""}` : x.kind); });
  check(JSON.stringify(last) === JSON.stringify(["C4:3360:", "rest", "bar", "G5:1680:la"]), "外来简谱文字贴进来：1 - 0 | 5'/la", JSON.stringify(last));
  // 全选 + 删
  await p.keyboard.press("Control+a"); await p.waitForTimeout(100);
  s = await S(); check(!!s.sel && s.sel.from === 3 && s.sel.to === s.n, "⌘A 全选 = 谱头之后到末尾", JSON.stringify(s.sel));
  await p.click('.sel-bar [data-v="delete"]'); await p.waitForTimeout(150);
  s = await S(); check(s.n === 3 && s.sel === null, "删：只剩谱头", String(s.n));
  // 一次只看一张纸：加第二张纸 → 画的只有当前那张；‹ › 翻
  await p.evaluate(() => window.__moonsinger.addPaper());
  await p.waitForTimeout(200);
  const names = await p.$$eval("#score text.paper-name", (ts) => ts.length);
  check(names === 1, "两张纸只画当前这张（曲段名一条）", String(names));
  check((await p.textContent("#score")).includes("2/2"), "‹ 2/2 › 翻页在", "");
  check(errs.length === 0, "零页面错误", errs.join(" | ").slice(0, 200));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
