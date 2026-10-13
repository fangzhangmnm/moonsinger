// test/e2e/sung-preview.mjs —— 真浏览器 E2E：月读（完全版）的按键预听 = 元音表（每种哼法一套，离线预渲），按键不去 worker 现唱（v0.10.43）。
// created 2026-10-10 by Claude Opus 5.5（v0.10.30 原版：预听唱刚写下的那个字）；rewritten 2026-10-11 by Claude Opus 5.5——user「月读的即兴keyboard还是卡…我发现它还是每次按键的时候算一下」
//   「月读预览应该是每种哼法只有一个cache」「而不是一个音高一个长度cache一下」「预览时这样，不过播放的时候还是完全版的」。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/sung-preview.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(1200);
await p.evaluate(() => { const m = window.__moonsinger, e = m.engine; window.__sung = 0; window.__au = [];
  m.singer.singOnly = async () => { window.__sung++; return { sr: 22050, samples: new Float32Array(2205) }; };
  const a = e.audition.bind(e); e.audition = (msg) => { window.__au.push({ ev: msg.ev, src: msg.src, kind: msg.inst?.kind, kana: msg.inst?.kana }); return a(msg); }; });
await p.evaluate(() => window.__moonsinger.setMode("notes"));
await p.click("#score", { position: { x: 300, y: 300 } });
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); for (let w = 0; w < 30 && (await p.evaluate(() => window.__au.filter((x) => x.ev === "on").length)) < i + 1; w++) await p.waitForTimeout(100); await p.waitForTimeout(120); }   // 每一下等到它的预听「on」记进来再按下一下（机器忙时固定 200 ms 会把两下按成「同时按」只响一下；2026-10-13 并行跑 E2E 时红过）
let ons = await p.evaluate(() => window.__au.filter((x) => x.ev === "on"));
check(ons.length >= 3 && ons.every((x) => x.kind === "vowel" && x.kana === "ん"), "「音」里写三个音 = 三下预听，走元音表的哼的字（ん）", JSON.stringify(ons.slice(-3)));
check((await p.evaluate(() => window.__sung)) === 0, "写音预听不去 worker 现唱");
// 「弹」：按住 = 一直响（元音表循环），松开才停
await p.evaluate(() => { window.__au.length = 0; document.activeElement?.blur?.(); }); await p.keyboard.press("Backquote"); await p.waitForTimeout(300);
const kb = await (await p.$(".pad-key[data-k] >> nth=4")).boundingBox();
await p.mouse.move(kb.x + 5, kb.y + 5); await p.mouse.down(); await p.waitForTimeout(400);
const held = await p.evaluate(() => window.__au.slice());
await p.mouse.up(); await p.waitForTimeout(150);
const after = await p.evaluate(() => window.__au.slice());
check(held.some((x) => x.ev === "on" && x.kind === "vowel") && !held.some((x) => x.ev === "off" && x.src === held.find((y) => y.ev === "on")?.src), "「弹」按住 = 元音表的音一直响", JSON.stringify(held));
check(after.some((x) => x.ev === "off"), "松开 = 停", JSON.stringify(after.slice(-2)));
check((await p.evaluate(() => window.__sung)) === 0, "「弹」也不去 worker 现唱");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsung-preview: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
