// test/e2e/seg-jump.mjs —— 真浏览器 E2E：放着的时候换曲段 = 从那一段的开头放（v0.10.17）；没在放 = 只换视图、不放。
// created 2026-10-10 by Claude Opus 5.5（user「播放的时候强切不同的曲段应该能跳到那个曲段去播放」「播放中跳曲段的时候播放头应该从开始播放」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/seg-jump.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 16; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(25); }
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(200);
for (let i = 0; i < 16; i++) { await p.click(`.pad-key[data-k] >> nth=${(i + 2) % 5}`); await p.waitForTimeout(25); }
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
const [p1, p2] = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => x.id));
const pos = () => p.evaluate(() => window.__moonsinger.engine.position);
const playing = () => p.evaluate(() => window.__moonsinger.engine.playing);
const waitPos = async (min) => { for (let i = 0; i < 80; i++) { if ((await playing()) && (await pos()) > min) return true; await p.waitForTimeout(80); } return false; };
// 本段视图：放第一段 → 放着换到第二段 = 范围换成第二段、从它的头放
await p.selectOption("#paperSel", p1); await p.waitForTimeout(200);
await p.click("#playBtn");
check(await waitPos(1.5), "本段视图：第一段放起来");
await p.selectOption("#paperSel", p2); await p.waitForTimeout(150);
let ok = false, at = 99; for (let i = 0; i < 40 && !ok; i++) { await p.waitForTimeout(80); const sp = await p.evaluate(() => window.__moonsinger.paperSpans()); at = await pos(); ok = (await playing()) && sp?.length === 1 && sp[0].id === p2 && at < 1.2; }
check(ok, "放着换到第二段 = 放的是第二段、从它的头放", `pos ${at.toFixed(2)} spans ${JSON.stringify(await p.evaluate(() => window.__moonsinger.paperSpans()))}`);
await p.click("#playBtn"); await p.waitForTimeout(300);
// 没在放：换段 = 只换视图，不放
await p.selectOption("#paperSel", p1); await p.waitForTimeout(500);
check(!(await playing()), "没在放的时候换段 = 不放");
// 全部视图：从头放，放着换到第二段 = 跳到第二段的头（全曲的时间里）
await p.selectOption("#paperSel", "all"); await p.waitForTimeout(200);
await p.click("#playBtn");
check(await waitPos(0.8), "全部视图：放起来");
await p.evaluate(() => window.__moonsinger.navPaper(1));   // 歌名左边的「›」（画在纸上，点它 = 宿主的 navPaper）
await p.waitForTimeout(300);
const at2 = await pos(), span = await p.evaluate(() => window.__moonsinger.paperSpans());
check(!!span && Math.abs(at2 - span[1].t0) < 1.2 && (await playing()), "全部视图：放着换到第二段 = 跳到第二段的头接着放", `pos ${at2.toFixed(2)} / 第二段从 ${span?.[1]?.t0?.toFixed?.(2)} 起`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nseg-jump: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
