// scripts/gen-preview-vowels.mjs —— 离线生成「试听元音表」：月读（中英增强模型，日语 = 原版）唱「哼」的四个字 ら ん う あ × 7 个音高。
// created 2026-10-07 by Claude Opus 5.5
// user：「选这个乐器就是意图，然后第一下就响。为什么要十来秒呢。或者下载的时候就顺便做掉然后缓存在一样的位置」「元音版只要日文的一份就行了，因为都差不多吧」
//   「带不起piper的就用我们的元音sampler来兜底」→ 我们这边离线算好（同一份唱法核心 src/singer/sing-core.mjs，noise 0 → 确定），
//   浏览器只下载这个小包：试听 / 即兴 / 轻量兜底都用它，不等大引擎。
//   只唱单一元音（跟「哼」走），不按歌词换元音：user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」。
// 做法（2026-10-07 几轮 user 听后定下来的；旧做法见 git 历史 4998b89 之前，user「旧的可以不要了」）：
//   目标字放句首（前面是安静，她自己唱出起音），后面垫一个字防念轻（另一 session 提醒：孤立单音节 piper 会念轻）；
//   ん 用「んま」（注成双唇 N_m = 闭嘴哼；「らんら」里是舌根 N_uvular ≈ 鼻化的 a）；呜 / 啦 用中文前端唱（日语 う 不圆唇、ら 是轻弹舌）；
//   切口从真正出声前 5 ms 起；循环段在颤音完全进来以后、长度取整数个颤音周期（接缝处音高连续）；整张表一个增益（保留 ん 比 あ 轻）。
//   user：「preview的嗯对了，呜还是啊，拉也不行而且attack太慢」→ 改中文 + 去空白后「嗯现在呜啊嗯啦好多了」；「对，哦 / お」→ 加 お。
// 输出（assets/preview/，进仓随 app 出货，约 3.3 MB；2026-10-07 起，原来在 gitignored 的 dev-assets/preview/）：
//   vowels.pcm16  所有样本首尾相接的 16 位单声道 PCM（22050 Hz）
//   vowels.json   索引 { sr, entries: [{ kana, midi, start, len, loopStart, loopEnd }] }（单位：样本）
// 用法：node scripts/gen-preview-vowels.mjs   （先跑过 scripts/link-dev-assets.sh）
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
import { singCore, DEFAULT_OPT } from "../src/singer/sing-core.mjs";
import { wrapWorld } from "../src/singer/world-wrap.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), OUT = path.join(ROOT, "assets", "preview");
const TP = path.join(os.homedir(), "jupyter/third-party");
const pn = await import(pathToFileURL(path.join(TP, "piper-plus/dur-override-exp/piper-node.mjs")).href);
const { default: createWorld } = await import(pathToFileURL(path.join(TP, "world/build/world.mjs")).href);
const world = wrapWorld(await createWorld());
const sess = await pn.session("zhen");
const piper = { SR: pn.SR, HOP: pn.HOP, phonemize: pn.phonemize, phonemizeZh: pn.phonemizeZh, encode: pn.encode, run: (ids, pros, o) => pn.run(sess, ids, pros, o) };

const KANA = ["ら", "ん", "う", "お", "あ"];   // = song.ts 的 Hum：la n u o a
const ANCHORS = [57, 60, 63, 66, 69, 72, 75];   // A3 … D♯5，每 3 个半音（她的音域 A3–E5）
const TEMPO = 80;
// 每个字的生成语境：[目标字, 垫在后面的字, 语言]（ん 后面接 ま → 双唇，闭嘴哼；呜 / 拉 用中文：圆唇 u、边音 l）
const CTX = { ら: ["拉", "拉", "zh"], ん: ["ん", "ま", "ja"], う: ["呜", "拉", "zh"], お: ["お", "ら", "ja"], あ: ["あ", "ら", "ja"] };   // お = 干净的圆唇 o（GM Voice Oohs 那种「哦」）
const ZH_PRESET = JSON.parse(fs.readFileSync(path.join(TP, "piper-plus/work/model-singing/tsukuyomi-zhen-dur-override.config.json"), "utf8")).preset_default?.zh ?? 0;
const VIB = DEFAULT_OPT.vibrato;

const segs = [], entries = [];
const t0 = Date.now();
for (const kana of KANA) {
  for (const midi of ANCHORS) {
    const [t, f, lang] = CTX[kana], score = [{ kana: t, notes: [[midi, 6]] }, { kana: f, notes: [[midi, 1]] }], text = `${t}${f}。`, target = 0;
    const r = await singCore({ score, text, tempo: TEMPO, lang, preset: lang === "zh" ? ZH_PRESET : 0, piper, world, opt: { noiseScale: 0, noiseW: 0 } });
    const { notes, moras } = r.internals, SR = r.SR;
    const nt = notes.filter((n) => n.k === target), m = moras[target], nt0 = nt[0].t0, end = nt[nt.length - 1].t1;
    const cutEnd = Math.min(end, moras[target + 1].preStart) - 0.01;            // 后面那个字的辅音开始之前
    let a = Math.max(0, Math.round(((m.preStart ?? nt0) - 0.03) * SR)); const b = Math.round(cutEnd * SR);
    // 切口挪到真正出声前 5 ms：5 ms 一窗，第一个比目标音稳定段（音符中间 0.3 s）低不到 30 dB 的窗
    const rms = (i0, n) => { let e = 0; for (let i = i0; i < i0 + n; i++) e += r.sung[i] ** 2; return Math.sqrt(e / n); };
    const ref = rms(Math.round((nt0 + 0.5) * SR), Math.round(0.3 * SR)), W5 = Math.round(0.005 * SR);
    let on = a; while (on + W5 < b && rms(on, W5) < ref * 10 ** (-30 / 20)) on += W5;
    a = Math.max(a, on - W5);
    const u0 = Math.ceil(VIB.fadeIn * VIB.hz) / VIB.hz;                        // 颤音完全进来以后的第一个整周期
    const loopStart = nt0 + VIB.delay + u0, cycles = Math.floor((cutEnd - 0.12 - loopStart) * VIB.hz);
    if (cycles < 2) throw new Error(`${kana}${midi}: 循环段不够长`);
    const ls = Math.round(loopStart * SR) - a, le = Math.round((loopStart + cycles / VIB.hz) * SR) - a;
    segs.push(r.sung.subarray(a, b));
    entries.push({ kana, midi, len: b - a, loopStart: ls, loopEnd: le, ctx: `${text}（${lang}）` });
    process.stdout.write(`${kana}${midi} `);
  }
}
// 增益：整张表一个增益（ん 本来比 あ 轻，保留）
let globalPeak = 1e-9; for (const g of segs) for (const v of g) globalPeak = Math.max(globalPeak, Math.abs(v));
const all = new Int16Array(segs.reduce((n, g) => n + g.length, 0));
let off = 0;
segs.forEach((g, k) => {
  for (let i = 0; i < g.length; i++) all[off + i] = Math.max(-32768, Math.min(32767, Math.round((g[i] / globalPeak) * 0.8 * 32767)));
  entries[k].start = off; off += g.length;
});
const stem = "vowels";
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `${stem}.pcm16`), Buffer.from(all.buffer));
fs.writeFileSync(path.join(OUT, `${stem}.json`), JSON.stringify({ sr: pn.SR, anchors: ANCHORS, entries, generated: new Date().toISOString(), model: "tsukuyomi-zhen-dur-override（日语 = 原版）", note: "MoonSinger scripts/gen-preview-vowels.mjs" }));
console.log(`\n${entries.length} 份，${(all.byteLength / 1e6).toFixed(2)} MB PCM16；${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}/${stem}.*`);
