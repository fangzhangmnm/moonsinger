// scripts/probe-input-latency.mjs —— 量「琴键（MIDI）按下 → engine.auditionOn（声音交给音频线程）」在主线程上要等多久。created 2026-10-17 by Claude Opus 5.5
//   三种：空歌写音 / 现造的大歌（1204 个 token）写音 + 四个键隔 20 ms 的快弹（含排队等主线程）/ 大歌开着「弹」只响不写。假的 Web MIDI 装进页面。
//   跑：npm run build → npm run serve（8710）→ node scripts/probe-input-latency.mjs（MS_E2E_BASE 可改地址）。结果与分道方案：ai-docs/20261017-input-latency-probe.md
import { chromium } from "../test/e2e/pw.mjs";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
await ctx.addInitScript(() => {
  const port = { id: "f", name: "Fake", state: "connected", type: "input", onmidimessage: null };
  const access = { inputs: new Map([[port.id, port]]), onstatechange: null };
  Object.defineProperty(navigator, "requestMIDIAccess", { value: () => Promise.resolve(access), configurable: true });
  const q = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (d) => (d && d.name === "midi" ? Promise.resolve({ state: "granted" }) : q(d));
  window.__run = (notes, gap) => new Promise((res) => { const out = []; const t0 = performance.now() + 30; notes.forEach((n, i) => { const at = t0 + i * gap; setTimeout(() => { const ready = performance.now(); window.__t1 = null; port.onmidimessage?.({ data: new Uint8Array([0x90, n, 100]) }); out.push({ wait: ready - at, toSound: window.__t1 === null ? null : window.__t1 - at }); port.onmidimessage?.({ data: new Uint8Array([0x80, n, 0]) }); if (out.length === notes.length) res(out); }, at - performance.now()); }); });
  window.__press = (n) => { const t0 = performance.now(); window.__t1 = null; port.onmidimessage?.({ data: new Uint8Array([0x90, n, 100]) }); const t2 = performance.now(); port.onmidimessage?.({ data: new Uint8Array([0x80, n, 0]) }); return { toSound: window.__t1 === null ? null : window.__t1 - t0, handler: t2 - t0 }; };
});
const p = await ctx.newPage();
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(1200);
await p.evaluate(() => { const e = window.__moonsinger.engine, on = e.auditionOn.bind(e); e.auditionOn = (...a) => { if (window.__t1 === null) window.__t1 = performance.now(); return on(...a); }; });
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
async function series(label, n = 15) {
  const r = [];
  for (let i = 0; i < n; i++) { r.push(await p.evaluate((k) => window.__press(60 + (k % 12)), i)); await p.waitForTimeout(120); }
  const ts = r.map((x) => x.toSound).filter((x) => x !== null), hs = r.map((x) => x.handler);
  console.log(`${label}: 到出声 中位 ${med(ts).toFixed(1)} ms / 最大 ${Math.max(...ts).toFixed(1)} ms；整个处理 中位 ${med(hs).toFixed(1)} ms（${ts.length}/${n} 次有声）`);
}
await series("空歌 · 写音");
const tokCount = await p.evaluate(() => {
  const m = window.__moonsinger; for (let i = 0; i < 7; i++) m.run({ k: "degree", degree: i + 1, dir: "near" });
  const s = m.state(), part = s.at.part, paper = s.song.papers[0], src = paper.tracks[part].filter((t) => t.kind === "note");
  let id = s.nextId; const big = [...paper.tracks[part].filter((t) => t.kind !== "note")];
  for (let i = 0; i < 1200; i++) big.push({ ...src[i % src.length], id: id++ });
  const papers = s.song.papers.map((pp, k) => (k === 0 ? { ...pp, tracks: { ...pp.tracks, [part]: big } } : pp));
  m.set({ ...s, song: { ...s.song, papers }, nextId: id, caret: big.length, sel: null });
  return big.length;
});
await p.waitForTimeout(1500);
console.log(`(现造的大歌：这条 track ${tokCount} 个 token)`);
await series("大歌 · 写音");
for (let r = 0; r < 3; r++) { const out = await p.evaluate(() => window.__run([60, 62, 64, 65], 20)); console.log(`大歌 · 写音 · 四个键隔 20 ms：每个键 该响→真响 ${out.map((o) => (o.toSound ?? NaN).toFixed(0)).join(" / ")} ms（其中排队等主线程 ${out.map((o) => o.wait.toFixed(0)).join(" / ")} ms）`); await p.waitForTimeout(400); }
await p.keyboard.press("Backquote"); await p.waitForTimeout(200);
await series("大歌 · 弹（只响不写）");
await b.close();
