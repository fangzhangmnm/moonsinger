// scripts/gen-preview-vowels.mjs —— 离线生成「试听元音表」：月读（中英增强模型，日语 = 原版）唱「哼」的四个字 ら ん う あ × 7 个音高。
// created 2026-10-07 by Claude Opus 5.5
// user：「选这个乐器就是意图，然后第一下就响。为什么要十来秒呢。或者下载的时候就顺便做掉然后缓存在一样的位置」「元音版只要日文的一份就行了，因为都差不多吧」
//   「带不起piper的就用我们的元音sampler来兜底」→ 我们这边离线算好（同一份唱法核心 src/singer/sing-core.mjs，noise 0 → 确定），
//   浏览器只下载这个小包：试听 / 即兴 / 轻量兜底都用它，不等大引擎。
//   只唱单一元音（跟「哼」走），不按歌词换元音：user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」。
// 两套（实验开关「试听 旧 / 新」对比，user 选定后删掉输的那套；2026-10-07 user「预览的一开始像喇叭」「四个元音听起来其实很像，都是啊…也没有呜」）：
//   v1（旧）：「ら + 目标字 + ら」只切中间那个（另一 session 提醒：孤立单音节 piper 会念轻）。问题：切口在连唱中间——开头就是满音量、
//     还带着前一个 a 滑过来的那段；短按只听到这段，四个字都像 a；「らんら」的 ん 被注成舌根鼻音 N_uvular，跟在 a 后面 = 鼻化的 a；ら 的弹舌夹在两个 a 中间。
//   v2（新）：目标字放句首（前面是安静，她自己唱出起音），后面垫一个字防念轻；ん 用「んま」（注成双唇 N_m = 闭嘴哼）；
//     切口从起音前的安静开始；循环段在颤音完全进来以后、长度取整数个颤音周期（接缝处音高连续）；整张表一个增益（保留 ん 比 あ 轻）。
// 输出（dev-assets/preview/，gitignored；出货时进家族模型仓 pwa-models）：v1 = vowels.*，v2 = vowels-v2.*
//   vowels.pcm16  所有样本首尾相接的 16 位单声道 PCM（22050 Hz）
//   vowels.json   索引 { sr, entries: [{ kana, midi, start, len, loopStart, loopEnd }] }（单位：样本）
// 用法：node scripts/gen-preview-vowels.mjs [v1|v2]   （默认 v2；先跑过 scripts/link-dev-assets.sh）
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
import { singCore, DEFAULT_OPT } from "../src/singer/sing-core.mjs";
import { wrapWorld } from "../src/singer/world-wrap.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), OUT = path.join(ROOT, "dev-assets", "preview");
const TP = path.join(os.homedir(), "jupyter/third-party");
const pn = await import(pathToFileURL(path.join(TP, "piper-plus/dur-override-exp/piper-node.mjs")).href);
const { default: createWorld } = await import(pathToFileURL(path.join(TP, "world/build/world.mjs")).href);
const world = wrapWorld(await createWorld());
const sess = await pn.session("zhen");
const piper = { SR: pn.SR, HOP: pn.HOP, phonemize: pn.phonemize, phonemizeZh: pn.phonemizeZh, encode: pn.encode, run: (ids, pros, o) => pn.run(sess, ids, pros, o) };

const VARIANT = process.argv[2] ?? "v2";
if (!["v1", "v2"].includes(VARIANT)) throw new Error(`variant ${VARIANT}: v1 | v2`);
const KANA = ["ら", "ん", "う", "あ"];   // = song.ts 的 Hum：la n u a
const ANCHORS = [57, 60, 63, 66, 69, 72, 75];   // A3 … D♯5，每 3 个半音（她的音域 A3–E5）
const TEMPO = 80;
const V2_FOLLOW = { ら: "ら", ん: "ま", う: "ら", あ: "ら" };   // v2 垫在后面的字（ん 后面接 ま → 双唇，闭嘴哼）
const VIB = DEFAULT_OPT.vibrato;

const segs = [], entries = [];
const t0 = Date.now();
for (const kana of KANA) {
  for (const midi of ANCHORS) {
    let score, text, target;
    if (VARIANT === "v1") { score = [{ kana: "ら", notes: [[midi, 1]] }, { kana, notes: [[midi, 4]] }, { kana: "ら", notes: [[midi, 1]] }]; text = `ら${kana}ら。`; target = 1; }
    else { score = [{ kana, notes: [[midi, 6]] }, { kana: V2_FOLLOW[kana], notes: [[midi, 1]] }]; text = `${kana}${V2_FOLLOW[kana]}。`; target = 0; }
    const r = await singCore({ score, text, tempo: TEMPO, lang: "ja", preset: 0, piper, world, opt: { noiseScale: 0, noiseW: 0 } });
    const { notes, moras } = r.internals, SR = r.SR;
    const nt = notes.filter((n) => n.k === target), m = moras[target], nt0 = nt[0].t0, end = nt[nt.length - 1].t1;
    let a, b, ls, le;
    if (VARIANT === "v1") {
      a = Math.max(0, Math.round(((m.preStart ?? nt0) - 0.01) * SR)); b = Math.round((end - 0.03) * SR);
      ls = Math.round((nt0 + 0.3) * SR) - a; le = Math.round((end - 0.25) * SR) - a;
    } else {
      const cutEnd = Math.min(end, moras[target + 1].preStart) - 0.01;            // 后面那个字的辅音开始之前
      a = Math.max(0, Math.round(((m.preStart ?? nt0) - 0.03) * SR)); b = Math.round(cutEnd * SR);
      const u0 = Math.ceil(VIB.fadeIn * VIB.hz) / VIB.hz;                        // 颤音完全进来以后的第一个整周期
      const loopStart = nt0 + VIB.delay + u0, cycles = Math.floor((cutEnd - 0.12 - loopStart) * VIB.hz);
      if (cycles < 2) throw new Error(`${kana}${midi}: 循环段不够长`);
      ls = Math.round(loopStart * SR) - a; le = Math.round((loopStart + cycles / VIB.hz) * SR) - a;
    }
    segs.push(r.sung.subarray(a, b));
    entries.push({ kana, midi, len: b - a, loopStart: ls, loopEnd: le, ctx: text });
    process.stdout.write(`${kana}${midi} `);
  }
}
// 增益：v1 每份各自拉到峰值 0.8（旧做法）；v2 整张表一个增益（ん 本来比 あ 轻，保留）
let globalPeak = 1e-9; for (const g of segs) for (const v of g) globalPeak = Math.max(globalPeak, Math.abs(v));
const all = new Int16Array(segs.reduce((n, g) => n + g.length, 0));
let off = 0;
segs.forEach((g, k) => {
  let peak = globalPeak; if (VARIANT === "v1") { peak = 1e-9; for (const v of g) peak = Math.max(peak, Math.abs(v)); }
  for (let i = 0; i < g.length; i++) all[off + i] = Math.max(-32768, Math.min(32767, Math.round((g[i] / peak) * 0.8 * 32767)));
  entries[k].start = off; off += g.length;
});
const stem = VARIANT === "v1" ? "vowels" : "vowels-v2";
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `${stem}.pcm16`), Buffer.from(all.buffer));
fs.writeFileSync(path.join(OUT, `${stem}.json`), JSON.stringify({ variant: VARIANT, sr: pn.SR, anchors: ANCHORS, entries, generated: new Date().toISOString(), model: "tsukuyomi-zhen-dur-override（日语 = 原版）", note: "MoonSinger scripts/gen-preview-vowels.mjs" }));
console.log(`\n${VARIANT}：${entries.length} 份，${(all.byteLength / 1e6).toFixed(2)} MB PCM16；${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}/${stem}.*`);
