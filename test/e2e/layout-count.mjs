// test/e2e/layout-count.mjs —— 谱面分家的守卫 6 前一半（设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.9 节；施工单第五节裁定 2）：
//   挪光标、选区、播放高亮 = 排版 0 次；写一个音 = 排版 1 次（不比分家前多）。数的是 __moonsinger.perf() 里排版的次数：同步那条路 engrave、worker 那条路 post（发出去）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，施工单 1b-9）。只数次数、不比墙上钟。用默认那首歌（小月相上场才放得起来；月读不唱 = 静音块，只看走带）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/layout-count.mjs（或 node test/e2e/run.mjs layout-count）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
// 默认那首歌（小月相上场，能放）写 48 个音 = 折好几行
await p.evaluate(() => { const m = window.__moonsinger; m.setMode("notes"); for (let i = 0; i < 48; i++) m.run({ k: "degree", degree: (i % 7) + 1, dir: "near" }); });
await p.waitForTimeout(900);
// 光标先放到中间（光标停在尾巴后面时「最后一行五线画到右边」是排版的选项，从尾巴挪开那一下本来就要重排一次：W-17 的规矩），等它排完再开始数
await p.evaluate(() => { const m = window.__moonsinger; m.set({ ...m.state(), caret: 10, sel: null }); });
await p.waitForTimeout(700);
const layouts = () => p.evaluate(() => { const r = window.__moonsinger.perf(); return (r.engrave?.n ?? 0) + (r.post?.n ?? 0); });
const settle = () => p.waitForTimeout(400);
await p.evaluate(() => window.__moonsinger.perfReset());
// 挪光标、选区：只改编辑状态，谱没变
await p.evaluate(async () => { const m = window.__moonsinger; for (let k = 11; k < 23; k++) { m.set({ ...m.state(), caret: k, sel: null }); await new Promise((r) => requestAnimationFrame(r)); } });
await settle();
check((await layouts()) === 0, "挪光标 12 次：排版 0 次", `排版 ${await layouts()} 次`);
await p.evaluate(async () => { const m = window.__moonsinger; for (let k = 13; k < 21; k++) { m.set({ ...m.state(), sel: { from: 12, to: k } }); await new Promise((r) => requestAnimationFrame(r)); } m.set({ ...m.state(), sel: null }); });
await settle();
check((await layouts()) === 0, "选区扩 8 次再清掉：排版 0 次", `排版 ${await layouts()} 次`);
// 播放高亮：放一会儿（月读不唱，只看走带）
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 6), sr: 22050 }); });
await p.click("#playBtn");
let playing = false; for (let i = 0; i < 60; i++) { if (await p.evaluate(() => window.__moonsinger.engine.playing)) { playing = true; break; } await p.waitForTimeout(100); }
await p.waitForTimeout(1200);
const hl = await p.evaluate(() => !!document.querySelector(".play-hl"));
await p.waitForTimeout(600); await p.click("#playBtn"); await settle();
check(playing && hl, "放起来了、有播放高亮");
check((await layouts()) === 0, "放着（播放高亮一直在走）：排版 0 次", `排版 ${await layouts()} 次`);
// 写一个音：排版一次（分家前后一样；不许多排）
await p.evaluate(() => window.__moonsinger.perfReset());
await p.evaluate(() => { const m = window.__moonsinger; m.set({ ...m.state(), caret: 16, sel: null }); });
await settle(); await p.evaluate(() => window.__moonsinger.perfReset());
await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 3, dir: "near" }));
await settle();
const one = await layouts();
check(one === 1, "写一个音：排版 1 次", `排版 ${one} 次`);
check(!errs.length, "页面没有报错", errs.join(" | "));
console.log(`\nlayout-count: ${pass} passed, ${fail} failed`);
await b.close();
process.exitCode = fail ? 1 : 0;
