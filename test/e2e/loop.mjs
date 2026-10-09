// test/e2e/loop.mjs —— 真浏览器 E2E：走带「循环」/「接缝」。月读本人在测试里不唱（singer.sing 换成一段静音），singer.play 换成记录参数——
// 守的是「放哪几张、循环区间落在这条声音的哪几秒」：编排 `1 [2]` = 第一张一遍、第二张一直循环；区间 = 渲染出来的第二遍（含月读的提前量）。
// created 2026-10-08 by Claude Opus 5.5（user「我确实希望能单曲循环，或者测试战斗循环切割」「可以，然后无穷循环和循环走带都做」）
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
// 两张纸的长度（tick）；月读换成静音、播放换成记参数
const [t1, t2] = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => Object.values(x.tracks)[0].reduce((a, t) => a + (t.dur ?? 0), 0)));
await p.evaluate(() => {
  const m = window.__moonsinger; window.__plays = [];
  m.singer.sing = async () => ({ samples: new Float32Array(48000 * 2), sr: 48000 });
  m.singer.play = (r, onEnd, o = {}) => { window.__plays.push({ secs: r.samples.length / r.sr, right: !!r.right, ...JSON.parse(JSON.stringify(o)) }); };
});
const lastPlay = () => p.evaluate(() => window.__plays.at(-1) ?? null);
check(await p.$eval("#seamBtn", (e) => e.hidden), "循环没开 = 没有「接缝」钮");
await p.click("#playBtn"); await p.waitForTimeout(400);
check((await lastPlay())?.loop === undefined, "循环没开 = 放一遍（不带循环区间）");
await p.evaluate(() => { const m = window.__moonsinger; m.setScope("all"); const st = m.state(); m.set({ ...st, song: { ...st.song, arrangement: "1 [2]" } }); }); await p.waitForTimeout(150);
await p.click("#loopBtn"); await p.waitForTimeout(100);
check(await p.$eval("#loopBtn", (e) => e.classList.contains("is-on")) && !(await p.$eval("#seamBtn", (e) => e.hidden)), "开循环：钮亮、出「接缝」钮");
await p.click("#playBtn"); await p.waitForTimeout(400);
const a = await lastPlay(), lead = 0.5;   // 月读的提前量（LEAD_IN）：声音的第 0 秒 = 谱上的 −0.5 秒
check(!!a?.loop, "全部视图 + 编排「1 [2]」：带循环区间", JSON.stringify(a));
const intro = a.loop.start - lead, len = a.loop.end - a.loop.start;
check(Math.abs(len / intro - t2 / (t1 + t2)) < 1e-6, "区间 = 第二遍第二张（第一张 + 第二张第一遍之后）", `intro ${intro.toFixed(3)} len ${len.toFixed(3)} 期望比 ${(t2 / (t1 + t2)).toFixed(3)}`);
check(a.secs >= a.loop.end - 1e-6, "声音至少放得到区间结尾（纸尾是休止也补静音）", `${a.secs} vs ${a.loop.end}`);
check(a.offset === 0 && a.stopAfter === undefined, "从头放、一直循环");
await p.click("#seamBtn"); await p.waitForTimeout(400);
const s = await lastPlay();
check(Math.abs(s.offset - Math.max(0, s.loop.end - 4)) < 1e-9 && s.stopAfter === 8, "接缝：从区间结尾前 4 秒放、8 秒就停", JSON.stringify(s));
// 本段视图 = 这一张自己循环（编排不管）
await p.evaluate(() => window.__moonsinger.setScope("segment")); await p.waitForTimeout(150);
await p.click("#playBtn"); await p.waitForTimeout(400);
const g = await lastPlay(), gIntro = g.loop.start - lead, gLen = g.loop.end - g.loop.start;
check(Math.abs(gIntro - gLen) < 1e-6, "本段：这一张放两遍、区间 = 第二遍", `${gIntro.toFixed(3)} / ${gLen.toFixed(3)}`);
await p.click("#loopBtn"); await p.waitForTimeout(100);
check(await p.$eval("#seamBtn", (e) => e.hidden), "关循环 = 「接缝」钮收起");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
