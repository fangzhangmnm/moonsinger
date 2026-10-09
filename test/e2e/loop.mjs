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
const waitPlaying = async (want = true) => { for (let i = 0; i < 60; i++) { if ((await playing()) === want) return true; await p.waitForTimeout(100); } return false; };
check(await p.$eval("#seamBtn", (e) => e.hidden), "循环没开 = 没有「接缝」钮");
await p.click("#playBtn");
check(await waitPlaying(), "点播放 = 走带放起来（录音房）");
let a = await tl();
check(!!a && a.loop === false, "循环没开 = 时间线不循环", JSON.stringify(a));
check(Math.abs(a.from + LEAD) < 1e-6, "范围从月读的提前量起（−0.5 s）", String(a.from));
await p.waitForTimeout(300);
check((await pos()) > 0, "位置在走", String(await pos()));
await p.click("#playBtn"); await p.waitForTimeout(150);
check(!(await playing()), "再点 = 停");
await p.evaluate(() => { const m = window.__moonsinger; m.setScope("all"); const st = m.state(); m.set({ ...st, song: { ...st.song, arrangement: "1 [2]" } }); }); await p.waitForTimeout(150);
await p.click("#loopBtn"); await p.waitForTimeout(100);
check(await p.$eval("#loopBtn", (e) => e.classList.contains("is-on")) && !(await p.$eval("#seamBtn", (e) => e.hidden)), "开循环：钮亮、出「接缝」钮");
await p.click("#playBtn"); check(await waitPlaying(), "放起来");
a = await tl();
check(!!a && a.loop === true, "全部视图 + 编排「1 [2]」：时间线循环", JSON.stringify(a));
check(!!a && Math.abs(a.loopFrom - secOf(t1)) < 1e-6, "循环从第二张的起点跳回（第一张放一遍）", `loopFrom ${a?.loopFrom} 期望 ${secOf(t1)}`);
check(!!a && a.to >= secOf(t1 + t2) - 1e-6, "范围到整首的尾（含月读的尾巴）", `${a?.to} vs ${secOf(t1 + t2)}`);
// 接缝：放着的时候点 = 跳到循环尾前 4 秒（范围不到 4 秒 = 跳到范围头）
await p.click("#seamBtn"); await p.waitForTimeout(250);
const sp = await pos();
check(sp >= Math.max(a.from, a.to - 4) - 0.05, "接缝：位置跳到循环尾前 4 秒附近", `${sp} vs ${Math.max(a.from, a.to - 4)}`);
await p.click("#playBtn"); await p.waitForTimeout(150);
// 从头：没在放 = 从范围头放
await p.click("#rewindBtn"); check(await waitPlaying(), "「从头」= 放起来");
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
await p.click("#loopBtn"); await p.waitForTimeout(100);
check(await p.$eval("#seamBtn", (e) => e.hidden), "关循环 = 「接缝」钮收起");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
