// sampler.ts —— 月读的元音采样器：试听（出一个音就响）、即兴（只唱不写）、轻量兜底（带不起完整引擎时整首用它唱）。created 2026-10-07 by Claude Opus 5.5
// 样本 = 离线算好的「试听元音表」（scripts/gen-preview-vowels.mjs：月读唱「哼」的四个字 ら ん う あ × 7 个音高，PCM16），
// 浏览器只下载这个小包（约 3 MB），不等 40 MB 的大引擎——user「选这个乐器就是意图，然后第一下就响」「带不起piper的就用我们的元音sampler来兜底」。
// 只唱一个字（跟这首歌的「哼」走），不看歌词：采样器说不出字，按歌词换元音只会像念错字
//   （user「我觉得如果不支持tts的话元音映射会弄巧成拙吧，还是单一元音更适合当blueprint」）。
// 按下：取最近音高的那份样本，变速到目标音高（差最多一个半音半，音色轻微变尖 / 变闷，只是试听），按住循环稳态段；松开淡出。一次只响一个音（她只有一张嘴）。

import { audioCtx } from "./audio.ts";
import type { Hum } from "../score/song.ts";

const KANA: Record<Hum, string> = { la: "ら", n: "ん", u: "う", a: "あ" };
interface Entry { kana: string; midi: number; start: number; len: number; loopStart: number; loopEnd: number; buf?: AudioBuffer }
interface Voice { src: AudioBufferSourceNode; gain: GainNode }

const base = new URL("../dev-assets/preview/", import.meta.url);

export class Sampler {
  private entries: Entry[] = [];
  private sr = 22050;
  private loading: Promise<void> | null = null;
  private voice: Voice | null = null;
  private song: Voice[] = [];
  private songTimer = 0;

  /** 开始加载（不挡任何东西）；重复调用只加载一次。 */
  load(): Promise<void> {
    if (!this.loading) this.loading = (async () => {
      const [idx, pcm] = await Promise.all([
        fetch(new URL("vowels.json", base)).then((r) => { if (!r.ok) throw new Error(`试听元音表：HTTP ${r.status}（先跑 scripts/gen-preview-vowels.mjs？）`); return r.json(); }),
        fetch(new URL("vowels.pcm16", base)).then((r) => r.arrayBuffer()),
      ]);
      this.sr = idx.sr; this.entries = idx.entries;
      const all = new Int16Array(pcm);
      for (const e of this.entries) {
        const f = new Float32Array(e.len);
        for (let k = 0; k < e.len; k++) f[k] = all[e.start + k] / 32768;
        const b = new AudioBuffer({ length: e.len, numberOfChannels: 1, sampleRate: this.sr });
        b.copyToChannel(f, 0); e.buf = b;
      }
    })();
    return this.loading;
  }
  get ready(): boolean { return this.entries.length > 0 && !!this.entries[0].buf; }

  private pick(midi: number, hum: Hum): Entry | null {
    const es = this.entries.filter((e) => e.kana === KANA[hum]);
    if (!es.length) return null;
    return es.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
  }
  private start(midi: number, hum: Hum, when: number, ctx: BaseAudioContext = audioCtx()): Voice | null {
    const e = this.pick(midi, hum); if (!e?.buf) return null;
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = e.buf; src.loop = true;
    src.loopStart = e.loopStart / this.sr; src.loopEnd = e.loopEnd / this.sr;
    src.playbackRate.value = 2 ** ((midi - e.midi) / 12);
    gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(1, when + 0.008);
    src.connect(gain).connect(ctx.destination); src.start(when);
    return { src, gain };
  }
  private release(v: Voice, when: number): void {
    v.gain.gain.cancelScheduledValues(when); v.gain.gain.setTargetAtTime(0, when, 0.03); v.src.stop(when + 0.2);
  }

  /** 按下：响（先停掉上一个）。还没加载好 = 不响（加载在后台）。 */
  down(midi: number, hum: Hum): void {
    if (!this.ready) { void this.load(); return; }
    const ctx = audioCtx();
    if (this.voice) this.release(this.voice, ctx.currentTime);
    this.voice = this.start(midi, hum, ctx.currentTime);
  }
  /** 松开：淡出。 */
  up(): void { if (this.voice) { this.release(this.voice, audioCtx().currentTime); this.voice = null; } }

  /** 轻量版整首：notes = [{ midi, t0, t1 }]（秒），全唱 hum 那个字。返回总时长；播完调 onEnd。 */
  playSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum, onEnd: () => void): number {
    this.stopSong();
    const ctx = audioCtx(), t = ctx.currentTime + 0.1;
    for (const n of notes) { const v = this.start(n.midi, hum, t + n.t0); if (v) { this.release(v, t + n.t1); this.song.push(v); } }
    const total = notes.length ? notes[notes.length - 1].t1 : 0;
    this.songTimer = window.setTimeout(() => { this.song = []; onEnd(); }, (total + 0.4) * 1000);
    return total;
  }
  /** 轻量版整首离线渲染（导出用）：同 playSong 的排法，不出声，直接拿样本。 */
  async renderSong(notes: { midi: number; t0: number; t1: number }[], hum: Hum): Promise<{ samples: Float32Array; sr: number }> {
    if (!this.ready) await this.load();
    const lead = 0.1, total = (notes.length ? notes[notes.length - 1].t1 : 0) + lead + 0.4;
    const ctx = new OfflineAudioContext(1, Math.ceil(total * this.sr), this.sr);
    for (const n of notes) { const v = this.start(n.midi, hum, lead + n.t0, ctx); if (v) this.release(v, lead + n.t1); }
    const buf = await ctx.startRendering();
    return { samples: buf.getChannelData(0), sr: this.sr };
  }
  stopSong(): void {
    clearTimeout(this.songTimer);
    const now = audioCtx().currentTime;
    for (const v of this.song) { try { this.release(v, now); } catch { /* 已停 */ } }
    this.song = [];
  }
  get songPlaying(): boolean { return this.song.length > 0; }
}
