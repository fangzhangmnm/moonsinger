// scripts/probe-audio-clock.mjs —— 量「声音线程有没有被卡住」：页面里每帧记一次 performance.now() 和 AudioContext.currentTime，
//   音频时钟超过 120 ms 没走 = 记一次停顿（从哪一刻、停多久、离上一次按键多远）。created 2026-11-08 by Claude Fable 5.1
//   起因：user 11-08 iPad 黑匣子「按键时 ctx running、时钟停 ~1 秒，之后一下跳 344 / 243 ms 追上」+「网页版也不行」「今天突然不行了」——
//   设备刚起不会「追」，声音线程被重活卡住才会。这个脚本在无头浏览器里复现同一种停顿，新旧构建都能跑（MS_E2E_BASE 指过去），用来二分是哪一版改出来的。
//   两幕：keys = 新歌（小月相，按键预听走元音表）在 pad 上每 250 ms 按一个键、按 20 秒；play = 写 120 个音、假的唱（静音块）、放 20 秒。
//   跑：npm run serve（8710）→ node scripts/probe-audio-clock.mjs [keys|play]（MS_E2E_BASE 可改地址）
import { chromium } from "../test/e2e/pw.mjs";
const scene = process.argv[2] ?? "keys", SECS = Number(process.argv[3] ?? 20), MIN = Number(process.argv[4] ?? 60);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 700 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(1000);
const ver = await p.evaluate(() => document.querySelector(".set-ver")?.textContent ?? window.__moonsinger?.version?.() ?? "?").catch(() => "?");
await p.evaluate(() => {
  window.__ac = { samples: [], keys: [] };
  const ctx = window.__moonsinger.engine.ctx();   // 全 app 共用的那一个（没有就建；按键那一下 app 自己会叫醒）
  const tick = () => { window.__ac.samples.push([performance.now(), ctx.currentTime, ctx.state]); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
});
if (scene === "play") {
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, input: { ...s.input, unit: 4 } }); });
  for (let i = 0; i < 120; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(10); }
  await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
  await p.evaluate(() => { window.__ac.samples.length = 0; window.__ac.keys.push(performance.now()); });
  await p.click("#playBtn"); await p.waitForTimeout(SECS * 1000);
} else {
  await p.evaluate(() => { window.__ac.samples.length = 0; });
  const n = Math.round(SECS * 4);
  for (let i = 0; i < n; i++) { await p.evaluate(() => window.__ac.keys.push(performance.now())); await p.click(`.pad-key[data-k] >> nth=${i % 7}`); await p.waitForTimeout(230); }
}
const { samples: s, keys } = await p.evaluate(() => ({ samples: window.__ac.samples, keys: window.__ac.keys }));
await b.close();
// 停顿：时钟不变（且上下文在跑）连续超过 MIN ms（第四个参数，默认 60：电脑比 iPad 快一个量级，iPad 上的一秒在这里可能只有几十毫秒）
const stalls = []; let k0 = -1;
for (let k = 1; k < s.length; k++) {
  const same = s[k][1] !== null && s[k][1] === s[k - 1][1] && s[k][2] === "running";
  if (same && k0 < 0) k0 = k - 1;
  if (!same && k0 >= 0) { const d = s[k][0] - s[k0][0]; if (d > MIN) { const lastKey = keys.filter((t) => t <= s[k0][0]).at(-1); stalls.push({ at: Math.round(s[k0][0]), ms: Math.round(d), jump: Math.round((s[k][1] - s[k0][1]) * 1000), sinceKey: lastKey === undefined ? null : Math.round(s[k0][0] - lastKey) }); } k0 = -1; }
}
const run = s.filter((x) => x[1] !== null && x[2] === "running"), span = run.length > 1 ? (run.at(-1)[0] - run[0][0]) / 1000 : 0, adv = run.length > 1 ? run.at(-1)[1] - run[0][1] : 0;
console.log(`[${scene}] ${process.env.MS_E2E_BASE ?? "8710"} · 采样 ${s.length} 帧 · 上下文在跑的 ${span.toFixed(1)} s 里音频时钟走了 ${adv.toFixed(1)} s（${span ? (adv / span * 100).toFixed(0) : "?"}%）· 停顿（>${MIN} ms）${stalls.length} 次，共 ${stalls.reduce((a, x) => a + x.ms, 0)} ms，最长 ${stalls.reduce((a, x) => Math.max(a, x.ms), 0)} ms · 页面报错 ${errs.length}`);
for (const x of stalls.slice(0, 12)) console.log(`    t=${(x.at / 1000).toFixed(2)}s 停 ${x.ms} ms，之后一下跳 ${x.jump} ms${x.sinceKey === null ? "" : `，离上一次按键 ${x.sinceKey} ms`}`);
if (errs.length) console.log("    页面报错：" + errs.slice(0, 3).join(" | "));
