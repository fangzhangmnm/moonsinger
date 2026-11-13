// test/e2e/loop-memory.mjs —— 真浏览器 E2E：两个「循环」记在这台设备上（user 2026-11-13「你图库里的循环和编辑器里的循环能记忆一下吗？每次我点了它都不循环就很烦」）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。统筹「两个循环记在这台设备上」：设备键值、两个分开记；点的那一下就写、启动时读回来；「听接缝」不记。
// 守：编辑器——点开循环 → 重新载入 → 还开着、|▶ 上的角标亮着；再点关 → 重新载入 → 关着；全新的设备 = 关着。
//   歌库播放条——设备上记着开 → 打开歌库，播放器就是开着循环；全新的设备 = 关着（点那一下写不写在 render-cache.mjs 里核）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/loop-memory.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { FAKE_FSA, pickFolderFromEntry } from "./fake-fsa.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/", PREFIX = "moonsinger-5b1e7c0a92d34f6e:";
const b = await chromium.launch(), errs = [];
const looping = (p) => p.$eval("#playBtn", (e) => e.classList.contains("looping"));
const toggleEditorLoop = async (p) => { await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(80); await p.click('.ctx-menu [data-v="loop"]'); await p.waitForTimeout(100); };

// ── 编辑器 ──
{ const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }), p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(800);
  check(!(await looping(p)), "全新的设备：编辑器不循环");
  await toggleEditorLoop(p); check(await looping(p), "点开循环：|▶ 上的角标亮了");
  await p.reload(); await p.waitForTimeout(900);
  check(await looping(p), "重新载入：还开着（角标亮着）");
  await toggleEditorLoop(p); check(!(await looping(p)), "再点 = 关");
  await p.reload(); await p.waitForTimeout(900);
  check(!(await looping(p)), "重新载入：关着");
  await ctx.close(); }

// ── 歌库播放条 ──
const galleryLoop = async (preset) => {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); await ctx.addInitScript(FAKE_FSA);
  if (preset) await ctx.addInitScript((k) => localStorage.setItem(k, "1"), `${PREFIX}loop-gallery`);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(600); await pickFolderFromEntry(p); await p.waitForTimeout(400);
  const on = await p.evaluate(() => window.__moonsinger.gallery()?.playerState().loop ?? null);
  await ctx.close(); return on;
};
check((await galleryLoop(true)) === true, "歌库：这台设备上记着开 = 播放器一建好就开着循环");
check((await galleryLoop(false)) === false, "歌库：全新的设备 = 关着");
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
