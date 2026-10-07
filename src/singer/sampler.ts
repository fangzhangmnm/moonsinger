// sampler.ts —— 月读的元音采样器：试听（出一个音就响）、即兴（只唱不写）、轻量兜底（带不起完整引擎时整首用它唱）。created 2026-10-07 by Claude Opus 5.5
// 样本 = 离线算好的「试听元音表」（scripts/gen-preview-vowels.mjs：月读唱「哼」的四个字 ら ん う あ × 7 个音高，PCM16），
// 浏览器只下载这个小包（约 3 MB），不等 40 MB 的大引擎——user「选这个乐器就是意图，然后第一下就响」「带不起piper的就用我们的元音sampler来兜底」。
// 只唱一个字（跟这首歌的「哼」走），不看歌词：采样器说不出字，按歌词换元音只会像念错字
//   （user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」）。
// 按下：取最近音高的那份样本，变速到目标音高，按住循环稳态段；松开淡出。一次只响一个音（她只有一张嘴）。
//
// 实验开关「试听 新 / 旧」（2026-10-07 user「预览的一开始像喇叭」「四个元音听起来其实很像，都是啊」→ 做成开关在 app 里听；选定后删掉输的那套）：
//   旧 v1 = 连唱中间切出来的样本 + 8 ms 硬起音 + 抢占时旧音慢慢淡（新旧两个音高会叠一下）+ 拖音高每一级重新起音；
//   新 v2 = 句首起唱的样本（自然起音、ん 闭嘴哼、循环段整数个颤音周期）+ 抢占时旧音 20 ms 快速淡出 + 拖音高不重新起音（同一个声音滑过去）。

import { audioCtx } from "./audio.ts";
import type { Hum } from "../score/song.ts";

export type PreviewVariant = "v1" | "v2";
const FILES: Record<PreviewVariant, string> = { v1: "vowels", v2: "vowels-v2" };
/** 每套的包络（秒）：attack 线性起音；cut = 被新音抢占时旧音的淡出时间常数；rel = 松手淡出时间常数。 */
const ENV: Record<PreviewVariant, { attack: number; cut: number; cutStop: number; rel: number; relStop: number; glide: boolean }> = {
  v1: { attack: 0.008, cut: 0.03, cutStop: 0.2, rel: 0.03, relStop: 0.2, glide: false },
  v2: { attack: 0.01, cut: 0.006, cutStop: 0.06, rel: 0.04, relStop: 0.25, glide: true },
};
const GLIDE_TC = 0.012;      // 拖音高滑过去的时间常数（s）
const GLIDE_SPAN = 3;        // 离样本音高超过这么多半音就换一份样本（交叉淡入它的循环段，不带起音）
const XFADE = 0.03;

const KANA: Record<Hum, string> = { la: "ら", n: "ん", u: "う", a: "あ" };
interface Entry { kana: string; midi: number; start: number; len: number; loopStart: number; loopEnd: number; buf?: AudioBuffer }
interface Table { sr: number; entries: Entry[] }
interface Voice { src: AudioBufferSourceNode; gain: GainNode; entry: Entry }

const base = new URL("../dev-assets/preview/", import.meta.url);

async function fetchTable(v: PreviewVariant): Promise<Table> {
  const [idx, pcm] = await Promise.all([
    fetch(new URL(`${FILES[v]}.json`, base), { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`试听元音表（${v}）：HTTP ${r.status}（先跑 node scripts/gen-preview-vowels.mjs ${v}？）`); return r.json(); }),
    fetch(new URL(`${FILES[v]}.pcm16`, base), { cache: "no-cache" }).then((r) => r.arrayBuffer()),
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
  variant: PreviewVariant = "v2";
  private loading = new Map<PreviewVariant, Promise<Table>>();
  private tables = new Map<PreviewVariant, Table>();
  private voice: Voice | null = null;
  private song: Voice[] = [];
  private songTimer = 0;

  /** 开始加载当前这套（不挡任何东西）；重复调用只加载一次。 */
  load(v: PreviewVariant = this.variant): Promise<void> {
    let p = this.loading.get(v);
    if (!p) { p = fetchTable(v); this.loading.set(v, p); p.then((t) => this.tables.set(v, t), () => this.loading.delete(v)); }
    return p.then(() => undefined);
  }
  /** 实验开关：换一套（没下过就开始下）。 */
  setVariant(v: PreviewVariant): Promise<void> { this.up(); this.variant = v; return this.load(v); }
  get ready(): boolean { return this.tables.has(this.variant); }
  private get table(): Table | null { return this.tables.get(this.variant) ?? null; }
  private get env() { return ENV[this.variant]; }

  private pick(midi: number, hum: Hum): Entry | null {
    const es = this.table?.entries.filter((e) => e.kana === KANA[hum]) ?? [];
    if (!es.length) return null;
    return es.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
  }
  /** 起一个声音；offset > 0 = 从样本中间（循环段）开始，不带起音（滑音换样本时用）。 */
  private start(midi: number, hum: Hum, when: number, ctx: BaseAudioContext = audioCtx(), offset = 0, attack = this.env.attack): Voice | null {
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

  /** 按下：响（先停掉上一个）。还没加载好 = 不响（加载在后台）。 */
  down(midi: number, hum: Hum): void {
    if (!this.ready) { void this.load(); return; }
    const ctx = audioCtx(), now = ctx.currentTime;
    if (this.voice) this.fade(this.voice, now, this.env.cut, this.env.cutStop);
    this.voice = this.start(midi, hum, now);
  }
  /** 拖音高：新的顶掉旧的。新：同一个声音滑过去（离样本太远就交叉淡到另一份的循环段）；旧：重新起音。 */
  glide(midi: number, hum: Hum): void {
    const v = this.voice;
    if (!v || !this.env.glide || !this.ready) { this.down(midi, hum); return; }
    const ctx = audioCtx(), now = ctx.currentTime, sr = this.table!.sr;
    if (Math.abs(midi - v.entry.midi) <= GLIDE_SPAN) { v.src.playbackRate.setTargetAtTime(2 ** ((midi - v.entry.midi) / 12), now, GLIDE_TC); return; }
    const e = this.pick(midi, hum); if (!e) return;
    const nv = this.start(midi, hum, now, ctx, e.loopStart / sr, XFADE);
    this.fade(v, now, XFADE / 3, XFADE * 3);
    this.voice = nv;
  }
  /** 松开：淡出。 */
  up(): void { if (this.voice) { this.fade(this.voice, audioCtx().currentTime, this.env.rel, this.env.relStop); this.voice = null; } }

  /** 轻量版整首：notes = [{ midi, t0, t1 }]（秒），全唱 hum 那个字。返回总时长；播完调 onEnd。 */
  playSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum, onEnd: () => void): number {
    this.stopSong();
    const ctx = audioCtx(), t = ctx.currentTime + 0.1;
    for (const n of notes) { const v = this.start(n.midi, hum, t + n.t0); if (v) { this.fade(v, t + n.t1, this.env.rel, this.env.relStop); this.song.push(v); } }
    const total = notes.length ? notes[notes.length - 1].t1 : 0;
    this.songTimer = window.setTimeout(() => { this.song = []; onEnd(); }, (total + 0.4) * 1000);
    return total;
  }
  /** 轻量版整首离线渲染（导出用）：同 playSong 的排法，不出声，直接拿样本。 */
  async renderSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum): Promise<{ samples: Float32Array; sr: number }> {
    if (!this.ready) await this.load();
    const sr = this.table!.sr, lead = 0.1, total = (notes.length ? notes[notes.length - 1].t1 : 0) + lead + 0.4;
    const ctx = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
    for (const n of notes) { const v = this.start(n.midi, hum, lead + n.t0, ctx); if (v) this.fade(v, lead + n.t1, this.env.rel, this.env.relStop); }
    const buf = await ctx.startRendering();
    return { samples: buf.getChannelData(0), sr };
  }
  stopSong(): void {
    clearTimeout(this.songTimer);
    const now = audioCtx().currentTime;
    for (const v of this.song) { try { this.fade(v, now, this.env.cut, this.env.cutStop); } catch { /* 已停 */ } }
    this.song = [];
  }
  get songPlaying(): boolean { return this.song.length > 0; }
}
