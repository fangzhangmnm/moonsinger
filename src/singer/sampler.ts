// sampler.ts —— 月读的元音采样器：试听（出一个音就响）、即兴（只唱不写）、轻量兜底（带不起完整引擎时整首用它唱）。created 2026-10-07 by Claude Opus 5.5
// 样本 = 离线算好的「试听元音表」（scripts/gen-preview-vowels.mjs：月读唱「哼」的四个字 ら ん う あ × 7 个音高，PCM16），
// 浏览器只下载这个小包（约 3 MB），不等 40 MB 的大引擎——user「选这个乐器就是意图，然后第一下就响」「带不起piper的就用我们的元音sampler来兜底」。
// 只唱一个字（跟这首歌的「哼」走），不看歌词：采样器说不出字，按歌词换元音只会像念错字
//   （user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」）。
// 按下：取最近音高的那份样本，变速到目标音高，按住循环稳态段；松开淡出。
// 复音（2026-10-07 user「快速弹奏的时候也许multitouch逻辑要写对…要不月读preview也可以polyphonic吧，这样好作为打底」）：
//   每个声音有个来源 id（一根手指 / 一个键 / 谱面拖动）——同一个来源再按 = 新的顶掉自己的旧音，不同来源同时响；谁松开停谁的。
//   最多同时 MAX_VOICES 个，超了停最早的。
// 样本句首起唱（自然起音；ん 闭嘴哼；呜 / 啦 用中文唱）；被新音抢占时旧音 20 ms 快速淡出；拖音高不重新起音（同一个声音滑过去）。
// 2026-10-07 实验开关新旧对比后 user「旧的可以不要了」——旧做法（连唱中间切 + 硬起音 + 慢淡叠音 + 每级重起）见 git 历史 4998b89 之前。

import { audioCtx } from "./audio.ts";
import type { Hum } from "../score/song.ts";

/** 包络（秒）：attack 线性起音（样本自己带自然起音，这里只防爆音）；cut = 被新音抢占时旧音的淡出时间常数；rel = 松手淡出时间常数。 */
const ENV = { attack: 0.01, cut: 0.006, cutStop: 0.06, rel: 0.04, relStop: 0.25 };
const GLIDE_TC = 0.012;      // 拖音高滑过去的时间常数（s）
const GLIDE_SPAN = 3;        // 离样本音高超过这么多半音就换一份样本（交叉淡入它的循环段，不带起音）
const XFADE = 0.03;

const KANA: Record<Hum, string> = { la: "ら", n: "ん", u: "う", o: "お", a: "あ" };
interface Entry { kana: string; midi: number; start: number; len: number; loopStart: number; loopEnd: number; buf?: AudioBuffer }
interface Table { sr: number; entries: Entry[] }
interface Voice { src: AudioBufferSourceNode; gain: GainNode; entry: Entry }
const MAX_VOICES = 8;

const base = new URL("../assets/preview/", import.meta.url);   // 进仓（3.3 MB，随 app 出货；离线、自建都在）

async function fetchTable(): Promise<Table> {
  const [idx, pcm] = await Promise.all([   // no-cache = 每次跟服务器核对（重新生成过的表不吃浏览器缓存）
    fetch(new URL("vowels.json", base), { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`试听元音表：HTTP ${r.status}（先跑 node scripts/gen-preview-vowels.mjs？）`); return r.json(); }),
    fetch(new URL("vowels.pcm16", base), { cache: "no-cache" }).then((r) => r.arrayBuffer()),
  ]);
  const all = new Int16Array(pcm), entries = idx.entries as Entry[];
  for (const e of entries) {
    const f = new Float32Array(e.len);
    for (let k = 0; k < e.len; k++) f[k] = all[e.start + k] / 32768;
    const b = new AudioBuffer({ length: e.len, numberOfChannels: 1, sampleRate: idx.sr });
    b.copyToChannel(f, 0); e.buf = b;
  }
  return { sr: idx.sr, entries };
}

export class Sampler {
  private loading: Promise<Table> | null = null;
  private table: Table | null = null;
  private voices = new Map<string, Voice>();   // 来源 id → 正在响的声音（Map 保持按下的先后）
  private song: Voice[] = [];
  private songTimer = 0;

  /** 开始加载（不挡任何东西）；重复调用只加载一次，失败了下次重试。 */
  load(): Promise<void> {
    if (!this.loading) { const p = fetchTable(); this.loading = p; p.then((t) => { this.table = t; }, () => { this.loading = null; }); }
    return this.loading.then(() => undefined);
  }
  get ready(): boolean { return this.table !== null; }

  private pick(midi: number, hum: Hum): Entry | null {
    const es = this.table?.entries.filter((e) => e.kana === KANA[hum]) ?? [];
    if (!es.length) return null;
    return es.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
  }
  /** 起一个声音；offset > 0 = 从样本中间（循环段）开始，不带起音（滑音换样本时用）。 */
  private start(midi: number, hum: Hum, when: number, ctx: BaseAudioContext = audioCtx(), offset = 0, attack = ENV.attack): Voice | null {
    const e = this.pick(midi, hum), sr = this.table?.sr ?? 22050; if (!e?.buf) return null;
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = e.buf; src.loop = true;
    src.loopStart = e.loopStart / sr; src.loopEnd = e.loopEnd / sr;
    src.playbackRate.value = 2 ** ((midi - e.midi) / 12);
    gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(1, when + attack);
    src.connect(gain).connect(ctx.destination); src.start(when, offset);
    return { src, gain, entry: e };
  }
  private fade(v: Voice, when: number, tc: number, stopAfter: number): void {
    v.gain.gain.cancelScheduledValues(when); v.gain.gain.setTargetAtTime(0, when, tc); v.src.stop(when + stopAfter);
  }

  /** 按下：响（同一来源的旧音先停掉）。还没加载好 = 不响（加载在后台）。 */
  down(midi: number, hum: Hum, id = "main"): void {
    if (!this.ready) { void this.load(); return; }
    const ctx = audioCtx(), now = ctx.currentTime, old = this.voices.get(id);
    if (old) { this.fade(old, now, ENV.cut, ENV.cutStop); this.voices.delete(id); }
    while (this.voices.size >= MAX_VOICES) { const [k, v] = this.voices.entries().next().value!; this.fade(v, now, ENV.cut, ENV.cutStop); this.voices.delete(k); }
    const v = this.start(midi, hum, now);
    if (v) this.voices.set(id, v);
  }
  /** 拖音高：新的顶掉旧的——同一个声音滑过去（离样本太远就交叉淡到另一份的循环段，不带起音）。 */
  glide(midi: number, hum: Hum, id = "main"): void {
    const v = this.voices.get(id);
    if (!v || !this.ready) { this.down(midi, hum, id); return; }
    const ctx = audioCtx(), now = ctx.currentTime, sr = this.table!.sr;
    if (Math.abs(midi - v.entry.midi) <= GLIDE_SPAN) { v.src.playbackRate.setTargetAtTime(2 ** ((midi - v.entry.midi) / 12), now, GLIDE_TC); return; }
    const e = this.pick(midi, hum); if (!e) return;
    const nv = this.start(midi, hum, now, ctx, e.loopStart / sr, XFADE);
    this.fade(v, now, XFADE / 3, XFADE * 3);
    if (nv) this.voices.set(id, nv); else this.voices.delete(id);
  }
  /** 松开：这个来源的声音淡出。 */
  up(id = "main"): void { const v = this.voices.get(id); if (v) { this.fade(v, audioCtx().currentTime, ENV.rel, ENV.relStop); this.voices.delete(id); } }
  /** 全部松开（切走 app / 失焦：抬手的事件可能收不到，别让音卡着响）。 */
  upAll(): void { for (const id of [...this.voices.keys()]) this.up(id); }

  /** 轻量版整首：notes = [{ midi, t0, t1 }]（秒），全唱 hum 那个字。返回总时长；播完调 onEnd。 */
  playSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum, onEnd: () => void): number {
    this.stopSong();
    const ctx = audioCtx(), t = ctx.currentTime + 0.1;
    for (const n of notes) { const v = this.start(n.midi, hum, t + n.t0); if (v) { this.fade(v, t + n.t1, ENV.rel, ENV.relStop); this.song.push(v); } }
    const total = notes.length ? notes[notes.length - 1].t1 : 0;
    this.songTimer = window.setTimeout(() => { this.song = []; onEnd(); }, (total + 0.4) * 1000);
    return total;
  }
  /** 轻量版整首离线渲染（导出用）：同 playSong 的排法，不出声，直接拿样本。 */
  async renderSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum): Promise<{ samples: Float32Array; sr: number }> {
    if (!this.ready) await this.load();
    const sr = this.table!.sr, lead = 0.1, total = (notes.length ? notes[notes.length - 1].t1 : 0) + lead + 0.4;
    const ctx = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
    for (const n of notes) { const v = this.start(n.midi, hum, lead + n.t0, ctx); if (v) this.fade(v, lead + n.t1, ENV.rel, ENV.relStop); }
    const buf = await ctx.startRendering();
    return { samples: buf.getChannelData(0), sr };
  }
  stopSong(): void {
    clearTimeout(this.songTimer);
    const now = audioCtx().currentTime;
    for (const v of this.song) { try { this.fade(v, now, ENV.cut, ENV.cutStop); } catch { /* 已停 */ } }
    this.song = [];
  }
  get songPlaying(): boolean { return this.song.length > 0; }
}
