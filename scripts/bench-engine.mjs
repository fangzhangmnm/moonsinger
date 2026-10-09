// scripts/bench-engine.mjs —— 刀 0：量代价（实时试听提案 ai-docs/20261009-realtime-preview-engine-proposal.md §10 / §13 要的数字）。created 2026-10-09 by Claude Fable 5.1
// 量什么：
//   · 月读每句：piper 第一遍（预测时长）/ 第二遍（念）/ WORLD 分析（Harvest + CheapTrick + D4C）/ WORLD 合成 各多少 ms；每秒歌多少 ms；分析的中间量多大；
//     「念已预热、只跑合成」一个字（0.3 s）/ 一秒要多久（按键实时的候选）。
//   · TinySoundFont：装整包 GS 多久；N 声同时响时每 128 帧一块多少 µs（音频线程的复音上限用）。
// 只在 PC 上跑（node 24 + 检疫桶里的 piper 壳 / GS 整包；WORLD 用仓里 vendor 的那份），不出货、不进测试。
//   跑：node scripts/bench-engine.mjs [--rounds=2]
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { pathToFileURL } from "node:url";
import { singCore } from "../src/singer/sing-core.mjs";
import { wrapWorld } from "../src/singer/world-wrap.mjs";

const ROUNDS = Number((process.argv.find((a) => a.startsWith("--rounds=")) || "--rounds=2").slice(9));
const HOME = os.homedir(), TP = path.join(HOME, "jupyter/third-party");
const LAB = path.resolve(import.meta.dirname, "../../20260810 写歌实验室/Lab/20261005 月读第一首");
const now = () => performance.now();
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : "-");
console.log(`# bench-engine ${new Date().toISOString().slice(0, 10)} · ${os.cpus()[0]?.model ?? "?"} · node ${process.version}\n`);

// ── 月读 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const pn = await import(pathToFileURL(path.join(TP, "piper-plus/dur-override-exp/piper-node.mjs")).href);
const sess = await pn.session("override");
const { default: createWorld } = await import(pathToFileURL(path.resolve(import.meta.dirname, "../vendor/world/world.mjs")).href);
const W0 = wrapWorld(await createWorld());
const timed = { piper1: [], piper2: [], analyze: [], synth: [] };
let lastAn = null;
const piper = { SR: pn.SR, HOP: pn.HOP, phonemize: pn.phonemize, phonemizeZh: pn.phonemizeZh, encode: pn.encode,
  run: async (ids, pros, o) => { const t = now(); const r = await pn.run(sess, ids, pros, o); (o.override ? timed.piper2 : timed.piper1).push(now() - t); return r; } };
const W = {
  analyze: (x, fs_, o) => { const t = now(); const r = W0.analyze(x, fs_, o); timed.analyze.push({ ms: now() - t, frames: r.frames, bins: r.bins, secs: x.length / fs_ }); lastAn = r; return r; },
  synth: (a) => { const t = now(); const y = W0.synth(a); timed.synth.push({ ms: now() - t, frames: a.f0.length }); return y; },
};
const songs = {};
for (const [name, file] of [["うさぎ", "score.mjs"], ["団子", "score-dango.mjs"]]) {
  const m = await import(pathToFileURL(path.join(LAB, file)).href);
  songs[name] = { SCORE: m.SCORE, TEMPO: m.TEMPO_QUARTER };
}
/** Lab 乐谱按休止切成句（和编辑器 singChunks 的「≥0.25 s 休止」同一个意思；这里按条目上的 rest 切）。TEXT = 假名直接拼。 */
function phrasesOf(SCORE) {
  const out = []; let cur = [];
  for (const e of SCORE) { cur.push(e); if ((e.rest ?? 0) > 0) { out.push(cur); cur = []; } }
  if (cur.length) out.push(cur);
  return out.map((es) => ({ SCORE: es.map((e) => ({ ...e, rest: 0 })), TEXT: es.map((e) => e.kana).join("") + "。" }));
}
const songSecs = (SCORE, tempo) => SCORE.reduce((s, e) => s + e.notes.reduce((a, [, l]) => a + l, 0) + (e.rest ?? 0), 0) * (60 / tempo / 2);
async function singTimed(score, text, tempo) {
  for (const k in timed) timed[k].length = 0;
  const t = now();
  const r = await singCore({ score, text, tempo, lang: "ja", piper, world: W, opt: { noiseScale: 0, noiseW: 0 } });
  const total = now() - t, an = timed.analyze[0];
  return { total, piper1: timed.piper1.reduce((a, b) => a + b, 0), piper2: timed.piper2.reduce((a, b) => a + b, 0), analyze: an?.ms ?? NaN, synth: timed.synth.reduce((a, b) => a + b.ms, 0),
    frames: an?.frames ?? 0, bins: an?.bins ?? 0, speechSecs: an?.secs ?? 0, sungSecs: r.sung.length / r.SR, piperSamples: r.x.length };
}
console.log("## 月读（piper dur-override 模型 + WORLD，node wasm 单线程；noise 0）\n");
console.log("| 歌 / 句 | 歌长 s | 念出来 s | piper① ms | piper② ms | 分析 ms | 合成 ms | 合计 ms | 合计 ms / 歌秒 | 分析中间量 MB (f64 sp+ap) |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
await singTimed(songs["うさぎ"].SCORE.slice(0, 3), "うさぎ。", 72);   // 暖机（ort 第一次跑慢）
const phraseRows = [];
for (const [name, s] of Object.entries(songs)) {
  const rows = [];
  for (let r = 0; r < ROUNDS; r++) rows.push(await singTimed(s.SCORE, s.SCORE.map((e) => e.kana + (e.rest ? "、" : "")).join("").replace(/、$/, "") + "。", s.TEMPO));
  const pick = (k) => med(rows.map((x) => x[k])), secs = songSecs(s.SCORE, s.TEMPO), mb = (rows[0].frames * rows[0].bins * 8 * 2) / 1e6;
  console.log(`| ${name}（整首） | ${f(secs, 1)} | ${f(rows[0].speechSecs, 1)} | ${f(pick("piper1"))} | ${f(pick("piper2"))} | ${f(pick("analyze"))} | ${f(pick("synth"))} | ${f(pick("total"))} | ${f(pick("total") / secs)} | ${f(mb, 1)} |`);
  let i = 0;
  for (const p of phrasesOf(s.SCORE)) {   // 顺序跑：计时器是共享的，不能并发
    const rows = []; for (let r = 0; r < ROUNDS; r++) rows.push(await singTimed(p.SCORE, p.TEXT, s.TEMPO));
    phraseRows.push({ name: `${name} 第 ${++i} 句「${p.TEXT}」`, secs: songSecs(p.SCORE, s.TEMPO), rows });
  }
}
for (const pr of phraseRows) {
  const rows = pr.rows;
  const pick = (k) => med(rows.map((x) => x[k])), mb = (rows[0].frames * rows[0].bins * 8 * 2) / 1e6;
  console.log(`| ${pr.name} | ${f(pr.secs, 1)} | ${f(rows[0].speechSecs, 1)} | ${f(pick("piper1"))} | ${f(pick("piper2"))} | ${f(pick("analyze"))} | ${f(pick("synth"))} | ${f(pick("total"))} | ${f(pick("total") / pr.secs)} | ${f(mb, 1)} |`);
}
// 「念已预热、只跑合成」：拿最后一次分析的帧，合成 0.3 s / 1 s / 整段
console.log("\n## 只跑 WORLD 合成（念 + 分析已缓存时的下限；按键 = 一个字 ≈ 0.3 s）\n");
console.log("| 合成长度 | ms（中位） |\n|---|---|");
for (const secs of [0.3, 1, 3]) {
  const fr = Math.min(lastAn.frames, Math.round(secs / (lastAn.framePeriod / 1000))), b = lastAn.bins, ms = [];
  for (let r = 0; r < 5; r++) { const t = now(); W0.synth({ f0: lastAn.f0.subarray(0, fr), sp: lastAn.sp.subarray(0, fr * b), ap: lastAn.ap.subarray(0, fr * b), fft: lastAn.fft, fs: lastAn.fs, framePeriod: lastAn.framePeriod }); ms.push(now() - t); }
  console.log(`| ${f(fr * lastAn.framePeriod / 1000, 2)} s（${fr} 帧） | ${f(med(ms), 1)} |`);
}
// 只跑分析：同一段取样再分析一次（看分析 vs 合成的比例）
{ const x = new Float32Array(Math.round(3 * pn.SR)).map((_, i) => Math.sin(i / 30) * Math.sin(i / 7000)); const ms = []; for (let r = 0; r < 3; r++) { const t = now(); W0.analyze(x, pn.SR, { framePeriod: 5, f0Floor: 80, f0Ceil: 1000 }); ms.push(now() - t); } console.log(`| （对照）只分析 3 s 合成信号 | ${f(med(ms))} |`); }

// ── TinySoundFont ────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n## TinySoundFont（vendor/tsf，整包 GeneralUser GS 2.0.3；128 帧一块 @48000）\n");
const { default: createTsf } = await import(pathToFileURL(path.resolve(import.meta.dirname, "../vendor/tsf/tsf.mjs")).href);
const M = await createTsf();
const sf2 = fs.readFileSync(path.join(TP, "GeneralUser-GS-2.0.3/GeneralUser-GS.sf2"));
let t = now(); const p = M._malloc(sf2.length); M.HEAPU8.set(sf2, p); const bank = M._sf_load(p, sf2.length, 48000); M._free(p); const loadMs = now() - t;
console.log(`装整包（${(sf2.length / 1e6).toFixed(1)} MB）：${f(loadMs)} ms；wasm 堆 ${(M.HEAPU8.length / 1e6).toFixed(0)} MB\n`);
console.log("| 预设 | 同时按下 | tsf 活跃声数 | 每块 µs（中位） | 每声每块 µs | 占 2.67 ms 预算 |\n|---|---|---|---|---|---|");
const BLOCK = 128, buf = M._malloc(BLOCK * 4);
for (const [label, pb, pp] of [["钢琴 0:0", 0, 0], ["弦乐 0:48", 0, 48], ["鼓组 128:0", 128, 0]]) {
  const pi = M._sf_preset_index(bank, pb, pp); if (pi < 0) { console.log(`| ${label} | （没有这个预设） |`); continue; }
  for (const n of [1, 4, 8, 16, 32, 64]) {
    const fcopy = M._sf_copy(bank); M._sf_set_max_voices(fcopy, 512);
    for (let i = 0; i < n; i++) M._sf_note_on(fcopy, pi, pb === 128 ? 35 + (i % 25) : 36 + ((i * 7) % 60), 0.8);
    const ms = [];
    for (let k = 0; k < 400; k++) { const t0 = now(); M._sf_render(fcopy, buf, BLOCK); ms.push((now() - t0) * 1000); }
    const active = M._sf_active(fcopy), perBlock = med(ms.slice(50));   // 前 50 块 = 起音，不算
    console.log(`| ${label} | ${n} | ${active} | ${f(perBlock)} | ${f(active ? perBlock / active : NaN, 1)} | ${f((perBlock / 2667) * 100)}% |`);
    M._sf_close(fcopy);
  }
}
M._free(buf); M._sf_close(bank);
