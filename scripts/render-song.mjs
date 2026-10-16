#!/usr/bin/env node
// scripts/render-song.mjs —— 无头渲染：一首 .mxl → wav / mp3，不开浏览器（W-38 ⑤；user 2026-10-13「其实我蛮想要一个node能跑的无ui的渲染核心的这样agent或者人类拿到歌可以本地跑，还可以锁引擎的版本」）。
//   created 2026-10-16 by Claude Fable 5.1。走的是和 app 同一个核心 src/core/render.ts（准备 → 时间线 → 块 → 混）+ 同一个录音房类（src/core/offline-studio.ts）；
//   浏览器里换掉的只有三样注入：录音房（这里 = OfflineStudio）、音源（这里 = 歌里嵌的 / 音源库下载到临时目录）、小月相（这里 = 检疫桶里的 piper 壳，可选）。
// 用法：
//   node scripts/render-song.mjs 歌.mxl                       → 歌-render.mp3（立体声 128k）
//   node scripts/render-song.mjs 歌.mxl --out=x.wav           → 16 位 wav
//   node scripts/render-song.mjs 歌.mxl --mono --kbps=64 --sr=44100
//   --piper=<piper-node.mjs 的路径>   歌里有小月相（完整版）上场才要；没给 = 试 $MOONSINGER_PIPER，再试 ~/jupyter/third-party/piper-plus/dur-override-exp/piper-node.mjs；都没有 = 那些声部不出声、报出来
//   --sounds=<地址>                   弱引用的 SoundFont 从哪下（默认 = app 出厂的家族音源库；下到临时目录按 sha256 留着）；歌里嵌的不用下
//   --check                           只开文件、报核心版本 / 哈希 / 定稿记录，不渲
// 核心哈希：这首歌上次保存 / 定稿时记的核心（manifest.core / final.core）和现在源码的（scripts/core-hash.mjs）对一下，不一样就说一声（想复现定稿那份 = 换到那一版代码）。
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url"; import { createHash } from "node:crypto";
import { openBytes } from "../src/format/project.ts";
import { renderSong, audibleParts, toMono } from "../src/core/render.ts";
import { OfflineStudio } from "../src/core/offline-studio.ts";
import { CORE_VERSION } from "../src/core/version.ts";
import { subsetSf2 } from "../src/gm/sf2-subset.ts";
import { SOUNDS, SOUNDS_SOURCE_DEFAULT } from "../src/gm/sounds.gen.ts";
import { singCore } from "../src/singer/sing-core.mjs";
import { wrapWorld } from "../src/singer/world-wrap.mjs";
import { coreHash } from "./core-hash.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2), opt = (k, d = null) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; }, flag = (k) => argv.includes(`--${k}`);
const file = argv.find((a) => !a.startsWith("--"));
if (!file) { console.error("用法：node scripts/render-song.mjs 歌.mxl [--out=x.mp3|x.wav] [--mono] [--kbps=128] [--sr=44100] [--piper=…] [--sounds=…] [--check]"); process.exit(2); }
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const say = (m) => process.stderr.write(`[render] ${m}\n`);

// ── 开文件 ──
const bytes = new Uint8Array(fs.readFileSync(file));
const o = openBytes(path.basename(file), bytes);
for (const n of o.notices) say(`提示：${n}`);
const hashNow = coreHash(ROOT), m = o.extras.manifest ?? {};
say(`核心 ${CORE_VERSION}@${hashNow}（这台机器的源码）`);
if (m.core && typeof m.core === "object") { const c = m.core; say(`这首歌上次保存时的核心 = ${c.version}@${c.hash}${c.hash === hashNow ? "（一样）" : "（不一样：出声可能和上次存的时候不同）"}`); }
if (o.extras.final) { const f = o.extras.final; say(`定稿记录：第 ${f.rev} 版 · ${f.at} · 核心 ${f.core.version}@${f.core.hash}${f.core.hash === hashNow ? "（和现在一样）" : "（和现在不一样：想逐字节复现那份 mp3 = 换到那一版代码）"} · mp3 ${f.mp3.bytes} 字节 ${f.mp3.secs.toFixed(1)} s`); }
else say("没定稿。");
if (flag("check")) process.exit(0);

// ── 录音房 ──
const engine = new OfflineStudio(fs.readFileSync(path.join(ROOT, "vendor/tsf/tsf-standalone.wasm")));
// ── 音源：歌里嵌的 → 临时目录（按 sha256）→ 音源库下载整包 → 切子集核 sha256 ──
const CACHE = path.join(os.tmpdir(), "moonsinger-sounds"); fs.mkdirSync(CACHE, { recursive: true });
const soundsBase = (opt("sounds") ?? SOUNDS_SOURCE_DEFAULT).replace(/\/+$/, "");
async function resolveGmBytes(g) {
  if (g.bytes) return g.bytes;
  if (g.path) throw new Error(`「${g.name}」的声音（${g.path}）没随这首歌带来`);
  const sub = path.join(CACHE, `${g.subsetSha256}.sf2`);
  if (fs.existsSync(sub)) { const b = new Uint8Array(fs.readFileSync(sub)); if (sha256(b) === g.subsetSha256) return b; }
  let bank = null; const bankFile = path.join(CACHE, `${g.origin.fileSha256}.sf2`);
  if (fs.existsSync(bankFile)) { const b = new Uint8Array(fs.readFileSync(bankFile)); if (sha256(b) === g.origin.fileSha256) bank = b; }
  if (!bank) {
    const e = Object.values(SOUNDS).find((x) => x.sha256 === g.origin.fileSha256);
    if (!e) throw new Error(`「${g.name}」的声音没随歌带（弱引用），音源库目录里也没有它来自的「${g.origin.name}」（sha256 ${g.origin.fileSha256.slice(0, 12)}…）`);
    say(`下载「${e.name}」（${(e.bytes / 1e6).toFixed(1)} MB）← ${soundsBase}/${e.file}`);
    const res = await fetch(`${soundsBase}/${e.file}`); if (!res.ok) throw new Error(`${soundsBase}/${e.file}：HTTP ${res.status}`);
    bank = new Uint8Array(await res.arrayBuffer());
    if (sha256(bank) !== e.sha256) throw new Error(`「${e.name}」下载到的内容和目录里钉的 sha256 不一样，没有用它`);
    fs.writeFileSync(bankFile, bank);
  }
  const subset = subsetSf2(bank, [{ bank: g.bank, program: g.program }]), sha = sha256(subset);
  if (sha !== g.subsetSha256) throw new Error(`从「${g.origin.name}」切出来的「${g.name}」和歌里记的不一样（${sha.slice(0, 12)}… ≠ ${g.subsetSha256.slice(0, 12)}…）`);
  fs.writeFileSync(sub, subset);
  return subset;
}
let vowelsIn = false;
async function ensureVowels() {
  if (vowelsIn) return; vowelsIn = true;
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/preview/vowels.json"), "utf8")), pcm = fs.readFileSync(path.join(ROOT, "assets/preview/vowels.pcm16"));
  engine.vowels({ sr: idx.sr, entries: idx.entries, pcm: new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 1) });
}
// ── 小月相（完整版）：检疫桶里的 piper 壳（同 scripts/bench-engine.mjs 的接法）；没有 = 那些声部不唱、报出来 ──
const piperPath = opt("piper") ?? process.env.MOONSINGER_PIPER ?? path.join(os.homedir(), "jupyter/third-party/piper-plus/dur-override-exp/piper-node.mjs");
let singerP = null;
function singer() {
  return (singerP ??= (async () => {
    if (!fs.existsSync(piperPath)) throw new Error(`歌里有小月相（完整版）上场，但这台机器上没有 piper 壳（${piperPath}）：给 --piper=<piper-node.mjs> 或设 MOONSINGER_PIPER；或者把那些声部换成「小月相（元音）」`);
    say(`加载小月相：${piperPath}`);
    const pn = await import(pathToFileURL(piperPath).href);
    const sess = await pn.session("zhen");
    const { default: createWorld } = await import(pathToFileURL(path.join(ROOT, "vendor/world/world.mjs")).href);
    const world = wrapWorld(await createWorld());
    const piper = { SR: pn.SR, HOP: pn.HOP, phonemize: pn.phonemize, phonemizeZh: pn.phonemizeZh, encode: pn.encode, run: (ids, pros, x) => pn.run(sess, ids, pros, x) };
    const presetDefault = pn.PRESET_DEFAULT?.zhen ?? {};
    return { piper, world, presetDefault };
  })());
}
async function sing(tl, progress) {
  const { piper, world, presetDefault } = await singer();
  let k = 0;
  for (const c of tl.chunks) {
    if (engine.hasChunk(c.key)) continue;
    if (c.lang === "en") throw new Error("命令行渲染还不会唱英文（浏览器里走朗读库的英文前端）");
    progress(`小月相：第 ${++k} / ${tl.chunks.length} 句（${c.score.SCORE.map((e) => e.kana).join("")}）`);
    const r = await singCore({ score: c.score.SCORE, text: c.score.TEXT, tempo: c.score.TEMPO_QUARTER, lang: c.lang, atlas: "off", breath: false, preset: presetDefault[c.lang] ?? 0, piper, world, loadAtlas: null, opt: c.opt ?? {} });
    engine.chunk(c.key, r.SR, Float32Array.from(r.y));   // raw：和浏览器 worker 的 raw: true 同一份（整首最后不归一化，块乘固定 SUNG_GAIN）
  }
}

// ── 渲 ──
const song = o.song, parts = audibleParts(song, () => ({ muted: false, solo: false }));
const sr = Number(opt("sr", "44100")), kbps = Number(opt("kbps", "128")), mono = flag("mono");
const out = opt("out") ?? `${file.replace(/\.(mxl|musicxml|xml)$/i, "")}-render.mp3`;
const t0 = performance.now();
let lastMsg = "";
const r = await renderSong({ song, extras: o.extras, hum: o.hum, parts }, { engine, sounds: { resolveGmBytes, ensureVowels }, sing },
  { sr, progress: (msg, f) => { const s = f === undefined ? msg : `${msg} ${Math.round(f * 100)}%`; if (s !== lastMsg) { lastMsg = s; say(s); } } });
for (const e of r.errors) say(`「${e.part}」不出声：${e.why}`);
for (const u of r.timeline.unplayable) say(`「${u.part}」不出声：${u.why}`);
say(`混好了：${r.secs.toFixed(1)} s · ${r.timeline.tracks.length} 条轨 · ${((performance.now() - t0) / 1000).toFixed(1)} s`);
// ── 写文件 ──
const left = mono ? toMono(r.left, r.right) : r.left, right = mono ? null : r.right;
if (/\.wav$/i.test(out)) {
  const ch = right ? 2 : 1, n = left.length, data = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (off, s) => { for (let i = 0; i < s.length; i++) data.setUint8(off + i, s.charCodeAt(i)); };
  w(0, "RIFF"); data.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
  data.setUint32(24, r.sr, true); data.setUint32(28, r.sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, "data"); data.setUint32(40, n * ch * 2, true);
  const q = (x) => Math.max(-32768, Math.min(32767, Math.round(Math.max(-1, Math.min(1, x)) * 32767)));
  for (let i = 0, p = 44; i < n; i++) { data.setInt16(p, q(left[i]), true); p += 2; if (right) { data.setInt16(p, q(right[i]), true); p += 2; } }
  fs.writeFileSync(out, Buffer.from(data.buffer));
} else {
  const { Mp3Encoder } = await import(pathToFileURL(path.join(ROOT, "vendor/lamejs/lamejs.js")).href);   // 和 app 的 mp3 worker 同一份编码器（LGPL，只在编码这一步用）
  const enc = new Mp3Encoder(right ? 2 : 1, r.sr, kbps), parts = [], BLOCK = 1152 * 16, pl = new Int16Array(BLOCK), pr = new Int16Array(BLOCK);
  const toPcm = (src, i, n, pcm) => { for (let k = 0; k < n; k++) { const x = Math.max(-1, Math.min(1, src[i + k])); pcm[k] = Math.round(x < 0 ? x * 32768 : x * 32767); } return n === pcm.length ? pcm : pcm.subarray(0, n); };
  for (let i = 0; i < left.length; i += BLOCK) { const n = Math.min(BLOCK, left.length - i); const b = right ? enc.encodeBuffer(toPcm(left, i, n, pl), toPcm(right, i, n, pr)) : enc.encodeBuffer(toPcm(left, i, n, pl)); if (b.length) parts.push(Buffer.from(b)); }
  const tail = enc.flush(); if (tail.length) parts.push(Buffer.from(tail));
  fs.writeFileSync(out, Buffer.concat(parts));
}
say(`写好了：${out}（${(fs.statSync(out).size / 1e3).toFixed(0)} KB）`);
