// scripts/gen-preview-vowels.mjs —— 离线生成「试听元音表」：月读（中英增强模型，日语 = 原版）唱「哼」的四个字 ら ん う あ × 7 个音高。
// created 2026-10-07 by Claude Opus 5.5
// user：「选这个乐器就是意图，然后第一下就响。为什么要十来秒呢。或者下载的时候就顺便做掉然后缓存在一样的位置」「元音版只要日文的一份就行了，因为都差不多吧」
//   「带不起piper的就用我们的元音sampler来兜底」→ 我们这边离线算好（同一份唱法核心 src/singer/sing-core.mjs，noise 0 → 确定），
//   浏览器只下载这个小包：试听 / 即兴 / 轻量兜底都用它，不等大引擎。
//   只唱单一元音（跟「哼」走），不按歌词换元音：user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」。
// 做法：每份前后各垫一个「ら」一起唱（另一 session 提醒：孤立单音节 piper 会念轻），只切中间那个；记下稳态段供按住时循环。
// 输出（dev-assets/preview/，gitignored；出货时进家族模型仓 pwa-models）：
//   vowels.pcm16  所有样本首尾相接的 16 位单声道 PCM（22050 Hz）
//   vowels.json   索引 { sr, entries: [{ kana, midi, start, len, loopStart, loopEnd }] }（单位：样本）
// 用法：node scripts/gen-preview-vowels.mjs    （先跑过 scripts/link-dev-assets.sh）
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
import { singCore } from "../src/singer/sing-core.mjs";
import { wrapWorld } from "../src/singer/world-wrap.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), OUT = path.join(ROOT, "dev-assets", "preview");
const TP = path.join(os.homedir(), "jupyter/third-party");
const pn = await import(pathToFileURL(path.join(TP, "piper-plus/dur-override-exp/piper-node.mjs")).href);
const { default: createWorld } = await import(pathToFileURL(path.join(TP, "world/build/world.mjs")).href);
const world = wrapWorld(await createWorld());
const sess = await pn.session("zhen");
const piper = { SR: pn.SR, HOP: pn.HOP, phonemize: pn.phonemize, phonemizeZh: pn.phonemizeZh, encode: pn.encode, run: (ids, pros, o) => pn.run(sess, ids, pros, o) };

const KANA = ["ら", "ん", "う", "あ"];   // = song.ts 的 Hum：la n u a
const ANCHORS = [57, 60, 63, 66, 69, 72, 75];   // A3 … D♯5，每 3 个半音（她的音域 A3–E5）
const TEMPO = 80, HOLD = 4;                      // 目标音 4 个八分 = 1.5 s

const pcm = [], entries = [];
let offset = 0;
const t0 = Date.now();
for (const kana of KANA) {
  for (const midi of ANCHORS) {
    const score = [{ kana: "ら", notes: [[midi, 1]] }, { kana, notes: [[midi, HOLD]] }, { kana: "ら", notes: [[midi, 1]] }];
    const r = await singCore({ score, text: `ら${kana}ら。`, tempo: TEMPO, lang: "ja", preset: 0, piper, world, opt: { noiseScale: 0, noiseW: 0 } });
    const { notes, moras } = r.internals, SR = r.SR;
    const n1 = notes.filter((n) => n.k === 1), on = moras[1].preStart ?? n1[0].t0, end = n1[n1.length - 1].t1;
    const a = Math.max(0, Math.round((on - 0.01) * SR)), b = Math.round((end - 0.03) * SR);
    const seg = r.sung.subarray(a, b);
    let peak = 1e-9; for (const v of seg) peak = Math.max(peak, Math.abs(v));
    const i16 = new Int16Array(seg.length);
    for (let k = 0; k < seg.length; k++) i16[k] = Math.max(-32768, Math.min(32767, Math.round((seg[k] / peak) * 0.8 * 32767)));
    const loopStart = Math.round((n1[0].t0 + 0.3) * SR) - a, loopEnd = Math.round((end - 0.25) * SR) - a;
    entries.push({ kana, midi, start: offset, len: i16.length, loopStart, loopEnd });
    pcm.push(i16); offset += i16.length;
    process.stdout.write(`${kana}${midi} `);
  }
}
fs.mkdirSync(OUT, { recursive: true });
const all = new Int16Array(offset); let p = 0; for (const x of pcm) { all.set(x, p); p += x.length; }
fs.writeFileSync(path.join(OUT, "vowels.pcm16"), Buffer.from(all.buffer));
fs.writeFileSync(path.join(OUT, "vowels.json"), JSON.stringify({ sr: pn.SR, anchors: ANCHORS, entries, generated: new Date().toISOString(), model: "tsukuyomi-zhen-dur-override（日语 = 原版）", note: "MoonSinger scripts/gen-preview-vowels.mjs" }));

console.log(`\n${entries.length} 份，${(all.byteLength / 1e6).toFixed(2)} MB PCM16；${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}`);
