// test/e2e/follow.mjs —— 真浏览器 E2E：放着的时候提前翻（下一行在换行之前就露出来）+「跳到正在放的地方」（v0.10.21）。
// created 2026-10-10 by Claude Opus 5.5（user「视图跳转能早一点吗，就是滚到的时候对齐而不是开始滚的时候，甚至更早一点，方便对着谱子唱歌？」「播放的...可以支持跳转到当前播放的地方」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/follow.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 520 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, input: { ...s.input, unit: 1 } }); });   // 十六分：音多、行多、放得快
for (let i = 0; i < 80; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(10); }
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), pp = s.song.papers[0], pid = s.at.part; m.set({ ...s, song: { ...s.song, papers: [{ ...pp, tracks: { ...pp.tracks, [pid]: pp.tracks[pid].map((t) => (t.kind === "tempo" ? { ...t, bpm: 100 } : t)) } }] } }); });   // ♩ = 100：一行放 ~2.5 s（比翻谱提前量 1.5 s 长，像真的歌）
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
await p.evaluate(() => { document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(4200);   // 写谱时自己动过（4 秒内不跟）：等过去
const rows = await p.evaluate(() => new Set(window.__moonsinger.layout().systems.map((s) => s.sys)).size);
check(rows >= 4, "谱有好几行（屏幕放不下）", String(rows));
await p.click("#playBtn");
// 每次播放头换到新的一行：页面那时已经翻好了——换行之后不用再滚（原来 = 换了行才开始滚，眼睛得追）
const tl = [];
for (let i = 0; i < 300; i++) {
  await p.waitForTimeout(50);
  const g = await p.evaluate(() => { const h = document.querySelector(".play-hl"), el = document.querySelector("#score"), sc = el.getBoundingClientRect(); if (!h) return null; const r = h.getBoundingClientRect(); return { y: r.top - sc.top + el.scrollTop, st: el.scrollTop, top: r.top - sc.top, bottom: r.bottom - sc.top, vh: sc.height }; });
  if (!g) { if (tl.length > 20 && !(await p.evaluate(() => window.__moonsinger.engine.playing))) break; continue; }
  tl.push({ t: Date.now(), ...g });
}
const changes = []; for (let k = 1; k < tl.length; k++) if (Math.abs(tl[k].y - tl[k - 1].y) > 40) changes.push(k);
if (process.env.DBG) console.log("    DBG", JSON.stringify(changes.map((k) => ({ k, from: Math.round(tl[k - 1].y), to: Math.round(tl[k].y), st0: Math.round(tl[k].st), st1: Math.round((tl.find((x) => x.t >= tl[k].t + 450) ?? tl[k]).st), top: Math.round(tl[k].top) }))));
const late = changes.filter((k) => { const after = tl.find((x) => x.t >= tl[k].t + 450); return after && Math.abs(after.st - tl[k].st) > 20; });
check(changes.length >= 3 && late.length === 0 && changes.every((k) => tl[k].top >= 0 && tl[k].bottom <= tl[k].vh), "换到新的一行的那一刻它已经在屏幕里、之后不用再滚（提前翻好了）", `换行 ${changes.length} 次，换行后还滚的 ${late.length} 次`);
await p.waitForTimeout(200);
if (!(await p.evaluate(() => window.__moonsinger.engine.playing))) await p.click("#playBtn");
await p.waitForTimeout(1500);
// 跳到正在放的地方：自己滚走了（4 秒内不跟），长按 / 右键 |▶ →「跳到正在放的地方」= 滚回去
await p.mouse.move(400, 300); await p.mouse.wheel(0, 3000); await p.waitForTimeout(300);
await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(100);
check(!!(await p.$('.ctx-menu [data-v="reveal"]')), "放着的时候 |▶ 的菜单里有「跳到正在放的地方」");
await p.click('.ctx-menu [data-v="reveal"]'); await p.waitForTimeout(900);
{ const g = await p.evaluate(() => { const h = document.querySelector(".play-hl"), sc = document.querySelector("#score").getBoundingClientRect(); if (!h) return null; const r = h.getBoundingClientRect(); return { top: r.top - sc.top, bottom: r.bottom - sc.top, vh: sc.height }; });
  check(!!g && g.top >= 0 && g.bottom <= g.vh, "点了 = 正在放的音回到屏幕里", JSON.stringify(g)); }
if (await p.evaluate(() => window.__moonsinger.engine.playing)) await p.click("#playBtn");
// 小屏（一屏只放得下一行多一点；user「小设备大总谱上面一次只能看一行」）：像翻谱——换行之前就翻过去了，换行那一刻新的一行已经在屏幕里、之后不用再滚
await p.setViewportSize({ width: 1100, height: 300 }); await p.waitForTimeout(300);
await p.evaluate(() => { document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(4200);
await p.click("#playBtn");
{ const tl2 = [];
  for (let i = 0; i < 300; i++) {
    await p.waitForTimeout(50);
    const g = await p.evaluate(() => { const h = document.querySelector(".play-hl"), el = document.querySelector("#score"), sc = el.getBoundingClientRect(); if (!h) return null; const r = h.getBoundingClientRect(); return { y: r.top - sc.top + el.scrollTop, st: el.scrollTop, top: r.top - sc.top, bottom: r.bottom - sc.top, vh: sc.height }; });
    if (!g) { if (tl2.length > 20 && !(await p.evaluate(() => window.__moonsinger.engine.playing))) break; continue; }
    tl2.push({ t: Date.now(), ...g });
  }
  const ch = []; for (let k = 1; k < tl2.length; k++) if (Math.abs(tl2[k].y - tl2[k - 1].y) > 40) ch.push(k);
  const late2 = ch.filter((k) => { const after = tl2.find((x) => x.t >= tl2[k].t + 450); return after && Math.abs(after.st - tl2[k].st) > 20; });
  const vis = ch.filter((k) => tl2[k].top >= 0 && tl2[k].bottom <= tl2[k].vh);
  check(ch.length >= 3 && late2.length === 0 && vis.length === ch.length, "小屏：换行之前就翻好了（换行那一刻新的一行在屏幕里、之后不用再滚）", `换行 ${ch.length} 次，在屏幕里 ${vis.length}，换行后还滚 ${late2.length}，屏高 ${Math.round(tl2[0]?.vh ?? 0)}`); }
if (await p.evaluate(() => window.__moonsinger.engine.playing)) await p.click("#playBtn");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfollow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
