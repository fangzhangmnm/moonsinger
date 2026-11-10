// scripts/bench-lyrics.mjs —— 歌词让路的代价（文字排版计划书 ai-docs/20261109-plan-text-engine.md 第 4 步的尺子）。created 2026-11-09 by Claude Opus 5.5
//   计划书原写「加进 bench-engine.mjs」；那个脚本一开头要装唱歌模型（检疫桶里的 piper），和排版无关——另起这一个，node 直跑、不靠仓外的东西。
//   样张：800 个十六分音符全带英文（有长有短、一部分带连字符）= 计划书 §4 的极端样张；另排一遍「按歌词排」（字推开音，不走让路）当对照，再排一首普通样张看有没有变慢。
//   量字 = 粗估（每个字 0.55 字号宽、空格 0.27）——和真字体的绝对数不同，只比前后。
//   跑：node scripts/bench-lyrics.mjs [--rounds=15]
import { engrave } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { initState, tr, TPQ } from "../src/score/song.ts";
import { VIEWS, loadSong, measure } from "../test/fixtures/layout/cases.ts";

const ROUNDS = Number((process.argv.find((a) => a.startsWith("--rounds=")) || "--rounds=15").slice(9));
const WORDS = ["love", "the", "world", "a", "beau-ti-ful", "morn-ing", "I", "will", "sing", "for", "you", "un-der-stand-ing", "star", "light", "and", "ev-er-y-thing"];
const syl = []; for (let i = 0; syl.length < 800; i++) { const p = WORDS[i % WORDS.length].split("-"); p.forEach((s, k) => syl.push({ s, hy: k < p.length - 1 })); }
const st0 = initState();
let id = 9000;
const toks = [...tr(st0).slice(0, 3), ...syl.slice(0, 800).map(({ s, hy }, k) => ({ kind: "note", id: id++, pitch: { step: "CDEFGAB"[k % 7], alter: 0, octave: 5 }, dur: TPQ / 4, lyric: s, ...(hy ? { hyph: true } : {}) }))];
const songOf = (fit) => ({ ...st0.song, ...(fit ? { lyricFit: fit } : {}), papers: st0.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st0.at.part]: toks } })) });
const raw = (s, px) => [...s].reduce((a, c) => a + (c === " " ? 0.27 : c.charCodeAt(0) > 255 ? 1 : 0.55), 0) * px;
const opts = { width: 900, sp: 10, at: st0.at, parts: [{ id: st0.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], chrome: { tail: 2.6, famGap: 0.8, navRoom: 16 }, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } };
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const time = (f) => { for (let i = 0; i < 3; i++) f(); const t = []; for (let i = 0; i < ROUNDS; i++) { const t0 = performance.now(); f(); t.push(performance.now() - t0); } return med(t); };

const yieldSong = songOf(null), pushSong = songOf("lyrics");
const a = time(() => engrave(yieldSong, { ...opts, measure: createTextMeasure(raw) }));
const b = time(() => engrave(pushSong, { ...opts, measure: createTextMeasure(raw) }));
const big = loadSong("once"), v = VIEWS.find((x) => x.name === "edit-all"), bigOpts = v.opts(big.song, big.labels);
const c = time(() => engrave(big.song, { ...bigOpts, measure: createTextMeasure(measure) }));
console.log(`# bench-lyrics ${new Date().toISOString().slice(0, 10)} · node ${process.version} · 中位数 / ${ROUNDS} 次`);
console.log(`800 个十六分音符全带英文 · 按节奏排（歌词让路）：${a.toFixed(1)} ms`);
console.log(`800 个十六分音符全带英文 · 按歌词排（不让路，对照）：${b.toFixed(1)} ms   差 = ${(a - b).toFixed(1)} ms`);
console.log(`普通样张（Once upon a Tale · 全部曲段 · 编辑）：${c.toFixed(1)} ms`);
