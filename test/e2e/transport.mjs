// test/e2e/transport.mjs —— 真浏览器 E2E：走带（v0.9.18）。created 2026-10-10 by Claude Opus 5.5
// user「走带控制有续播/暂停 和从上一次开播的地方重新开始两个，loop和之后别的设置比如从头开始放在...里面」「但是我想编辑的时候光标动但是播放头不动」
//   「核心场景就是一遍一遍听同一个小节」「以及大部分时候可以小节级别的开始精度」「那么续播不reset起点」「长按加播放同意」「播放模式，锁写谱，但是可以调录音室」。
// 月读在测试里不唱（静音块）；看的是走带位置、起点、听模式。跑：npm run build → npm run serve（8710）→ node test/e2e/transport.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 24; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(25); }
// 写了多长按谱里实际的时值算（pad 默认的长短 = 八分）：一小节几个音、第二 / 第三小节从第几个音起
const dur = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[window.__moonsinger.state().at.part].find((x) => x.kind === "note").dur);
const PER = Math.round(6720 / dur), BAR2 = 6720, BAR3 = 13440;   // 4/4：一小节 = 6720 tick
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
const T = () => p.evaluate(() => window.__moonsinger.transport());
const pos = () => p.evaluate(() => window.__moonsinger.engine.position);
const playing = () => p.evaluate(() => window.__moonsinger.engine.playing);
const waitPlaying = async (want = true) => { for (let i = 0; i < 80; i++) { if ((await playing()) === want) return true; await p.waitForTimeout(80); } return false; };
const BAR = 4 * (60 / 90);   // ♩ = 90，一小节 4 拍（秒）
// 1. 空白处右键（= 长按）菜单「从这儿放」：第二小节第二、三个音之间的空白
const ba = await p.locator(".staff-svg .note").nth(PER + 1).boundingBox(), bb = await p.locator(".staff-svg .note").nth(PER + 2).boundingBox();
await p.mouse.click((ba.x + ba.width + bb.x) / 2, ba.y + ba.height / 2, { button: "right" }); await p.waitForTimeout(150);
check(!!(await p.$('.ctx-menu [data-v="play"]')), "空白处长按 / 右键菜单里有「从这儿放」");
await p.click('.ctx-menu [data-v="play"]');
check(await waitPlaying(), "从这儿放 = 放起来");
let t = await T();
check(!!t.startMark && t.startMark.tick === BAR2, "起点吸到第二小节的头（小节级精度）", JSON.stringify(t.startMark));
check(!!(await p.$(".start-mark")), "谱上画了起点的小旗");
await p.waitForTimeout(400);
const p1 = await pos();
check(p1 > BAR - 0.3 && p1 < BAR + 1.2, "从第二小节放起", `${p1.toFixed(2)} s（小节 ${BAR.toFixed(2)} s）`);
// 2. 主键 = 停（停的地方记下来）→ ⋯「接着放」：从那儿接着放、不回起点；起点不变（v0.9.19：只有一个主键 |▶，续播在 ⋯ 里）
await p.click("#playBtn"); await p.waitForTimeout(150);
t = await T();
check(!(await playing()) && !!t.paused && !!(await p.$(".play-hl")), "主键再按 = 停（记住位置、高亮留着）", JSON.stringify(t.paused));
check((await p.$eval("#playBtn use", (e) => e.getAttribute("href"))) === "#play-from-start", "停了 = 主键是 |▶");
const pausedAt = t.paused.sec;
await p.click("#transportMore"); await p.waitForTimeout(80);
check(!!(await p.$('.ctx-menu [data-v="resume"]')), "停过 = ⋯ 里有「接着放」");
check(!!(await p.$('.ctx-menu [data-v="follow"]')) && (await p.$eval('.ctx-menu [data-v="follow"]', (e) => e.textContent.startsWith("✓"))), "⋯ 里有「自动翻」，默认开");
await p.click('.ctx-menu [data-v="resume"]'); check(await waitPlaying(), "接着放 = 放起来");
await p.waitForTimeout(120);
const p2 = await pos();
check(p2 >= pausedAt - 0.15, "接着放 = 从停下的地方（不回起点）", `${p2.toFixed(2)} vs 停在 ${pausedAt.toFixed(2)}`);
check((await T()).startMark?.tick === BAR2, "接着放不动起点");
// 3. 主键（停着）= 从起点放
await p.waitForTimeout(400);
await p.click("#playBtn"); await p.waitForTimeout(150);
await p.click("#playBtn"); check(await waitPlaying(), "主键 = 从起点放"); await p.waitForTimeout(200);
const p3 = await pos();
check(p3 < BAR + 0.6 && p3 > BAR - 0.4, "从起点（第二小节）放", `${p3.toFixed(2)} s`);
await p.click("#playBtn"); await p.waitForTimeout(150);
// 4. 编辑（挪光标）不动起点
await p.keyboard.press("ArrowLeft"); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(80);
check((await T()).startMark?.tick === BAR2, "挪光标不动起点");
// 5. 听模式：锁写谱；轻点不跳播（防误触）；长按 / 右键 = 小菜单「从这儿放」；Esc 回到写
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(150);
check((await T()).listen && (await p.evaluate(() => document.body.classList.contains("listen-mode"))), "听模式开了");
const n0 = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[window.__moonsinger.state().at.part].filter((x) => x.kind === "note").length);
await p.keyboard.press("Digit3"); await p.waitForTimeout(80);
const n1 = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[window.__moonsinger.state().at.part].filter((x) => x.kind === "note").length);
check(n1 === n0, "听模式里键盘写不了音", `${n0} → ${n1}`);
const third = await p.locator(".staff-svg .note").nth(2 * PER + 1).boundingBox();
await p.mouse.click(third.x + third.width / 2, third.y + third.height / 2); await p.waitForTimeout(300);
check(!(await playing()) && (await T()).startMark?.tick === BAR2, "听模式里轻点音 = 不跳播、起点不动（防误触）");
await p.mouse.click(third.x + third.width / 2, third.y + third.height / 2, { button: "right" }); await p.waitForTimeout(150);
check(!!(await p.$('.ctx-menu [data-v="here"]')), "右键 = 小菜单「从这儿放」");
await p.click('.ctx-menu [data-v="here"]');
check(await waitPlaying(), "从这儿放 = 放起来");
t = await T();
check(t.startMark?.tick === BAR3, "点的是第三小节的音 = 起点挪到第三小节的头", JSON.stringify(t.startMark));
check(n1 === (await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[window.__moonsinger.state().at.part].filter((x) => x.kind === "note").length)), "没改谱");
await p.keyboard.press(" "); await p.waitForTimeout(150);
check(!(await playing()), "听模式里空格 = 停");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(!(await T()).listen, "Esc = 回到写");
// 6. ⋯ 里「从头放」= 从开头放一遍、起点不动（2026-10-10 user「从头放会把start reset回头」）；之后主键照旧回到起点
await p.click("#transportMore"); await p.waitForTimeout(80); await p.click('.ctx-menu [data-v="head"]');
check(await waitPlaying(), "从头放 = 放起来"); await p.waitForTimeout(150);
check((await pos()) < 1, "从头放 = 从开头放", `${(await pos()).toFixed(2)} s`);
check((await T()).startMark?.tick === BAR3 && !!(await p.$(".start-mark")), "从头放不动起点（小旗还在第三小节）", JSON.stringify((await T()).startMark));
await p.click("#playBtn"); await p.waitForTimeout(150);
await p.click("#playBtn"); check(await waitPlaying(), "停了再按主键 = 放起来"); await p.waitForTimeout(200);
const p6 = await pos();
check(p6 > 2 * BAR - 0.4 && p6 < 2 * BAR + 0.6, "主键 = 回到起点（第三小节）", `${p6.toFixed(2)} s（第三小节 ${(2 * BAR).toFixed(2)} s）`);
await p.click("#playBtn"); await p.waitForTimeout(100);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\ntransport: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
