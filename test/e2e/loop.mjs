// test/e2e/loop.mjs —— 真浏览器 E2E：走带「循环」/「接缝」/「从头」。月读本人在测试里不唱（singer.sing 换成一段静音）——
// 守的是「放哪几张、循环从哪儿跳回」：编排 `1 [2]` = 第一张一遍、第二张一直循环；录音房拿到的时间线 loop + loopFrom = 第二张的起点。
// created 2026-10-08 by Claude Opus 5.5（user「我确实希望能单曲循环，或者测试战斗循环切割」「可以，然后无穷循环和循环走带都做」）
// 2026-10-09 Claude Fable 5.1（实时试听刀 1）：不再「渲染两遍 + AudioBufferSource」；改看录音房的时间线和走带位置（user「循环不再渲染两遍 同意」）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/loop.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(200);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i + 4}`); await p.waitForTimeout(40); }
// 两张纸的长度（tick）；月读换成静音
const [t1, t2] = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => Object.values(x.tracks)[0].reduce((a, t) => a + (t.dur ?? 0), 0)));
const secOf = (ticks) => (ticks / 1680) * (60 / 90), LEAD = 0.5;   // ♩ = 90；月读的提前量
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 2), sr: 22050 }); });
const tl = () => p.evaluate(() => { const t = window.__moonsinger.engine.timeline; return t && { from: t.range.from, to: t.range.to, loop: t.loop, loopFrom: t.loopFrom ?? null }; });
const playing = () => p.evaluate(() => window.__moonsinger.engine.playing);
const pos = () => p.evaluate(() => window.__moonsinger.engine.position);
// v0.9.18：循环 / 从头放 / 接缝收进走带的「⋯」菜单；▶ = 续播 / 暂停、⟲ = 回起点重放
const menuHas = async (v) => { await p.click("#transportMore"); await p.waitForTimeout(80); const has = !!(await p.$(`.ctx-menu [data-v="${v}"]`)); await p.keyboard.press("Escape").catch(() => {}); await p.mouse.click(5, 300); await p.waitForTimeout(60); return has; };
const menuClick = async (v) => { await p.click("#transportMore"); await p.waitForTimeout(80); await p.click(`.ctx-menu [data-v="${v}"]`); await p.waitForTimeout(100); };
const waitPlaying = async (want = true) => { for (let i = 0; i < 60; i++) { if ((await playing()) === want) return true; await p.waitForTimeout(100); } return false; };
check(!(await menuHas("seam")), "循环没开 = 菜单里没有「听接缝」");
await p.click("#playBtn");
check(await waitPlaying(), "点播放 = 走带放起来（录音房）");
let a = await tl();
check(!!a && a.loop === false, "循环没开 = 时间线不循环", JSON.stringify(a));
check(Math.abs(a.from + LEAD) < 1e-6, "范围从月读的提前量起（−0.5 s）", String(a.from));
await p.waitForTimeout(300);
check((await pos()) > a.from + 0.1, "位置在走（光标在纸尾 = 从范围头放起，v0.9.2）", String(await pos()));
await p.click("#playBtn"); await p.waitForTimeout(150);
check(!(await playing()), "再点 = 停");
await p.evaluate(() => { const m = window.__moonsinger; m.setScope("all"); const st = m.state(); m.set({ ...st, song: { ...st.song, arrangement: "1 [2]" } }); }); await p.waitForTimeout(150);
await menuClick("loop");
check(await p.$eval("#transportMore", (e) => e.classList.contains("is-on")) && (await menuHas("seam")), "开循环：⋯ 钮亮（写着循环）、菜单里出「听接缝」");
await p.click("#playBtn"); check(await waitPlaying(), "放起来");
a = await tl();
check(!!a && a.loop === true, "全部视图 + 编排「1 [2]」：时间线循环", JSON.stringify(a));
check(!!a && Math.abs(a.loopFrom - secOf(t1)) < 1e-6, "循环从第二张的起点跳回（第一张放一遍）", `loopFrom ${a?.loopFrom} 期望 ${secOf(t1)}`);
check(!!a && a.to >= secOf(t1 + t2) - 1e-6, "范围到整首的尾（含月读的尾巴）", `${a?.to} vs ${secOf(t1 + t2)}`);
// 接缝：放着的时候点 = 跳到循环尾前 4 秒（范围不到 4 秒 = 跳到范围头）
await menuClick("seam"); await p.waitForTimeout(150);
const sp = await pos();
check(sp >= Math.max(a.from, a.to - 4) - 0.05, "接缝：位置跳到循环尾前 4 秒附近", `${sp} vs ${Math.max(a.from, a.to - 4)}`);
await p.click("#playBtn"); await p.waitForTimeout(150);
// 从头：没在放 = 从范围头放
await p.click("#playBtn"); check(await waitPlaying(), "主键 |▶ = 从起点放起来（没设起点 = 开头）");
await p.waitForTimeout(120);
check((await pos()) < secOf(t1) + 0.3, "从范围头放（不是从光标）", String(await pos()));
await p.click("#playBtn"); await p.waitForTimeout(150);
// 本段视图 = 这一张自己循环（编排不管）
await p.evaluate(() => window.__moonsinger.setScope("segment")); await p.waitForTimeout(150);
await p.click("#playBtn"); check(await waitPlaying(), "本段：放起来");
const g = await tl();
check(!!g && g.loop === true && Math.abs(g.loopFrom - g.from) < 1e-6, "本段：这一张自己循环（从范围头跳回）", JSON.stringify(g));
check(!!g && g.to < a.to - 1e-6, "本段：范围只有这一张（比全部短）", JSON.stringify(g));
await p.click("#playBtn"); await p.waitForTimeout(150);
await menuClick("loop");
check(!(await menuHas("seam")) && !(await p.$eval("#transportMore", (e) => e.classList.contains("is-on"))), "关循环 = 菜单里没有「听接缝」、⋯ 钮不亮");
// 中途切循环 = 这一轮就生效（2026-10-10 user「中途toggle循环对本轮播放应该生效」）：本段视图、循环关着
const track = async (ms) => { const out = []; for (let i = 0; i < ms / 100; i++) { out.push({ on: await playing(), p: await pos() }); await p.waitForTimeout(100); } return out; };
await p.click("#playBtn"); check(await waitPlaying(), "中途切：放起来（循环关）");
await p.waitForTimeout(200); await menuClick("loop");
check((await tl())?.loop === true, "放着开循环 = 时间线马上循环", JSON.stringify(await tl()));
let tr = await track(4000);
check(tr.every((x) => x.on) && tr.some((x, i) => i && x.p < tr[i - 1].p - 0.3), "放着开循环 = 到尾跳回去、一直在放", tr.map((x) => x.p.toFixed(1)).join(" "));
await menuClick("loop");
tr = await track(4000);
check(!tr[tr.length - 1].on, "放着关循环 = 这一遍放完就停", tr.map((x) => (x.on ? "" : "■") + x.p.toFixed(1)).join(" "));
// 准备中（月读还在唱前几句）切循环 = 这一轮按新的
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => { await new Promise((r) => setTimeout(r, 1200)); return { samples: new Float32Array(22050 * 2), sr: 22050 }; }; });
await p.click(".pad-key[data-k] >> nth=2"); await p.waitForTimeout(80);   // 多写一个音 = 唱谱变了、这一句要重唱（走慢的那个）
await p.click("#playBtn"); await p.waitForTimeout(150);
const prep = !(await playing());
await menuClick("loop");
check(await waitPlaying(), "准备中开了循环：放起来");
check((await tl())?.loop === true, "准备中开的循环 = 这一轮的时间线循环", `${prep ? "（开的时候还在准备）" : "（开的时候已经在放了）"} ${JSON.stringify(await tl())}`);
await p.click("#playBtn"); await p.waitForTimeout(150);
await menuClick("loop");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
