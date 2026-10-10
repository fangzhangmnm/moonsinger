// studio.ts —— 录音房核心：走带 + 每声部一条通道 + 快引擎实例（TinySoundFont / 元音采样器）+ 慢引擎的块回放 + 总轨（增益 / 前瞻限幅）。
// created 2026-10-09 by Claude Fable 5.1（提案 ai-docs/20261009-realtime-preview-engine-proposal.md §5 / §13；user「旧引擎不用留念念旧，只是placeholder，可以大刀阔斧改」）。
// 这是一个**不依赖宿主**的类：音频线程里 AudioWorklet 壳每块（128 帧）调一次 render；导出时同一个类在循环里调 render——
//   同样的块网格、同样的数学 → 不掉块时逐样本相同（user「DAW 里面你实时的和渲染的会不一样…」= 知道；立场见提案 §13.5）。
// 规矩：
//   · 这里只做便宜的事（tsf 每声每块 <1 µs，刀 0 量过；块回放；增益 / 声像；限幅）；贵的（月读）在 worker 里算成块、按时间线摆进来（chunk）。
//   · render 里零分配：缓冲预分配、块用 Transferable 递进来——别让音频线程那一侧的 GC 卡（user「掉块…我就是比较concern这个」）。
//   · 通道参数（推子 / 声像 / 静音 / 独奏 / 总轨）和表情曲线都在播放时才乘，不烤进任何缓存 → 边放边调立刻听见（user「既然是实时我肯定是可以边放边调整混音的」）。
//   · 范围尾 / 循环点不切尾音（user「同意」）：到了尾只停止排新音，正在响的音收尾、块淡出；循环 = 跳回去接着排，不再渲染两遍。
//   · 慢引擎的块没到 = 走带冻住等（A，user「倾向于这个」）：全体同一个采样停，续放时该响的音重新按下（note chase）。绝不自动替补。
//   · 按键试听（audition）走通道的增益 / 声像，绕过静音 / 独奏和总轨限幅（user「按键不管solomute同意」「限幅嗯」）。
import type { Tsf, TsfBank } from "../gm/tsf-standalone.ts";
import type { FxV2 } from "../format/contract.ts";
import { buildChain, type FxInstance } from "./fx.ts";

export const BLOCK = 128;
/** 母线天花板（−0.18 dBFS；原 src/audio/mix.ts 的 0.98）。 */
export const CEILING = 0.98;
/** 限幅器：attack 3 ms（提前收）、release 150 ms（慢慢放开）；前瞻 = 3 × attack（原离线版的指数在 3τ 处只剩 5%，截到这儿听不出）。 */
const LIM_ATTACK = 0.003, LIM_RELEASE = 0.15, LIM_LOOK_TAUS = 3;
/** 范围尾最多等尾巴响多久（秒）；块淡出 / 起放淡入（秒）；表情曲线的一阶平滑 τ（同原 applyGain）。 */
const TAIL_MAX = 2, CLIP_FADE_OUT = 0.03, CLIP_FADE_IN = 0.01, GAIN_TAU = 0.004;
/** 位置报告的间隔（采样）：8 块 ≈ 21 ms @48k（主线程按扬声器的时钟在报告之间往前推，跳 / 循环 / 起放时另外立刻报）。 */
const POS_EVERY = 8 * BLOCK;
/** 元音采样器：一池最多几声；包络（秒）同原 src/singer/sampler.ts。 */
const MAX_VOWEL_VOICES = 24, V_ATTACK = 0.01, V_RELEASE = 0.04, V_CUT = 0.006, V_GLIDE = 0.012;
/** 块到齐检查看多远（秒）。 */
const LOOKAHEAD = 30;

// ── 契约（主线程 ↔ 录音房）────────────────────────────────────────────────────────────────────────────────────────────
/** 一个要出声的音（时间线上的秒）。preset = 这份库里的预设下标（主线程按 bank:program 查过）；vel 0–1。 */
export interface NoteEv { t0: number; t1: number; key: number; vel: number; preset: number }
/** 慢引擎的一块：key = 内容键（主线程按 key 喂 samples）；t0 = 这块第 0 个采样对应时间线的第几秒（含提前量）；dur = 预计几秒（没到时判断「站在它上面」）；gain = 乘多少。 */
export interface ClipRef { key: string; t0: number; dur: number; gain: number }
export interface GainSeg { t0: number; t1: number; dB: number }
/** chain = 跟着演奏者走的效果（琴箱 / 音箱…；CandidateV2.chain），在表情曲线之后、通道条之前。 */
export type TrackSpec =
  | { id: string; kind: "sf"; sha: string; notes: NoteEv[]; gain: GainSeg[] | null; chain?: FxV2[] }
  | { id: string; kind: "vowel"; kana: string; notes: NoteEv[]; gain: GainSeg[] | null; chain?: FxV2[] }
  | { id: string; kind: "clips"; clips: ClipRef[]; gain: GainSeg[] | null; chain?: FxV2[] };
export interface TimelineMsg { tracks: TrackSpec[]; range: { from: number; to: number }; loop: boolean; /** 循环从哪儿跳回（不给 = 范围头）：编排「前面放一遍、括住的一直循环」。 */ loopFrom?: number;
  /** 放着的时候换时间线：播放头挪这么多秒（主线程按谱位置算的：改了播放头前面的东西 / 反复结构，秒数不变会跳到别的音上）。 */ shift?: number }
/** 一条通道（轨 ≠ 乐手：乐手的通道、总线、以后的素材轨都是这个形状；user 2026-10-10「轨还是和乐手是两个概念」）：
 *  chain = 通道条上的效果（EQ / 压缩（可侧链 key = 别的轨 id）…）；sends = 推子之后发到总线多少；to = 去哪（"master" / 总线 id）。 */
export interface ChannelParams { gainDb: number; pan: number; mute: boolean; solo: boolean; chain?: FxV2[]; sends?: { to: string; gainDb: number }[]; to?: string }
export interface BusSpec { id: string; gainDb: number; pan: number; chain: FxV2[] }
export interface MasterParams { gainDb: number; limiter: boolean; chain?: FxV2[] }
/** 元音表（assets/preview/vowels.json + .pcm16 的形状）。 */
export interface VowelEntry { kana: string; midi: number; start: number; len: number; loopStart: number; loopEnd: number }
export type AuditionInst = { kind: "sf"; sha: string; preset: number } | { kind: "vowel"; kana: string } | { kind: "clip" };
export type StudioIn =
  | { type: "bank"; sha: string; bytes: Uint8Array }
  | { type: "unbank"; sha: string }
  | { type: "vowels"; sr: number; entries: VowelEntry[]; pcm: Int16Array }
  | { type: "timeline"; tl: TimelineMsg }
  | { type: "chunk"; key: string; sr: number; samples: Float32Array | Int16Array }
  | { type: "forget"; keys: string[] }
  /** 离线导出要块（主线程不再留拷贝）：录音房把这几块拷一份发回来。 */
  | { type: "getChunks"; keys: string[] }
  | { type: "channel"; id: string; p: Partial<ChannelParams> }
  | { type: "buses"; buses: BusSpec[] }
  | { type: "master"; p: Partial<MasterParams> }
  | { type: "play"; at?: number; gen?: number }   // gen = 主线程的走带代号：位置报告带着它，停了之后迟到的报告主线程能认出来扔掉
  | { type: "stop" }
  | { type: "seek"; at: number }
  /** 按键试听：src = 来源（手指 / 键），同一来源新的顶掉旧的；gainDb / pan = 这条通道（麦克风 + 校准）+ 光标处的力度。 */
  | { type: "audition"; src: string; ev: "on" | "off" | "glide" | "alloff"; inst?: AuditionInst; key?: number; vel?: number; gainDb?: number; pan?: number }
  /** 按键试听：放一段现成的声音（月读唱的一个字；刀 3）。同一来源新的顶掉旧的；off 走 audition off。 */
  | { type: "auditionClip"; src: string; sr: number; samples: Float32Array; gainDb?: number; pan?: number }
  | { type: "meter"; on: boolean };
export type StudioOut =
  | { type: "ready" }
  | { type: "banked"; sha: string; presets: [number, number][] }
  | { type: "error"; message: string }
  /** at = 这个位置对应的音频时钟（AudioContext 的秒；宿主给了 clock 才有）：主线程拿扬声器此刻的时钟（getOutputTimestamp）来查「现在听到的是走带的哪儿」。 */
  | { type: "pos"; sec: number; playing: boolean; waiting: string | null; gen: number; at?: number }
  | { type: "ended"; gen: number }
  | { type: "missing"; keys: string[] }
  | { type: "chunks"; items: { key: string; sr: number; samples: Int16Array }[] }
  | { type: "meter"; peak: number; active: number }
  /** 每秒一条（一直开着，便宜）：音频线程这 1 s 的忙闲（渲染耗时 / 这 1 s）、录音房里留着的块（Int16 字节数 / 块数）、正在响的声音数。刀 6 负载 / 内存监控。 */
  | { type: "load"; busy: number; chunkBytes: number; chunks: number; voices: number };

// ── 内部状态 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Chunk { sr: number; samples: Int16Array }   // 块存 Int16（刀 5 精度分级：一半内存；放的时候乘回来）
interface VowelVoice { src: string | null; data: Float32Array; pos: number; rate: number; target: number; loopStart: number; loopEnd: number; env: number; state: "attack" | "hold" | "release" | "cut"; gl: number; gr: number; key: number; baseMidi: number }
interface VowelTable { sr: number; entries: (VowelEntry & { data: Float32Array })[] }
interface SfPlayer { bank: TsfBank; player: TsfBank }
interface TrackState {
  spec: TrackSpec;
  ch: ChannelParams;
  gl: number; gr: number;                 // 现在的线性增益（去拉链用）
  y: number; gk: number;                  // 表情曲线：当前平滑值、段下标
  nextNote: number;                       // 下一个还没按下的音
  offs: { t: number; key: number; preset: number }[];   // 已按下、等着松开的音（按 t 排）
  sf: SfPlayer | null;
  vowels: VowelVoice[];
  env: number; envTarget: number;         // 块轨的淡入淡出（起放 / seek / 范围尾）
  /** 放着的时候这一句的唱谱改了：旧的那块留到响完（until）再换新的（user「正在响的那句不换、响完换新」）；新块没到也不冻。 */
  hold: { key: string; t0: number; dur: number; gain: number; until: number } | null;
  src: Float32Array; out: Float32Array;   // 第一趟（出声 + 曲线 + 演奏者链）/ 第二趟（通道链）的这一段；src 给别的轨当侧链 key
  perfFx: FxInstance[]; chFx: FxInstance[];
}
interface Bus { id: string; gainDb: number; pan: number; gl: number; gr: number; fx: FxInstance[]; L: Float32Array; R: Float32Array }
interface Audition { inst: AuditionInst; key: number; gl: number; gr: number }
interface ClipVoice { src: string; data: Float32Array; ratio: number; pos: number; env: number; state: "attack" | "hold" | "release" | "cut"; gl: number; gr: number }

const dbToLin = (dB: number) => (dB === -Infinity ? 0 : 10 ** (dB / 20));
const now: () => number = typeof performance !== "undefined" && typeof performance.now === "function" ? () => performance.now() : () => Date.now();
const I16 = 1 / 32768;
/** Float32 → Int16（夹到 ±1）。 */
export function toInt16(x: Float32Array): Int16Array { const out = new Int16Array(x.length); for (let i = 0; i < x.length; i++) { const v = x[i]; out[i] = v >= 1 ? 32767 : v <= -1 ? -32768 : Math.round(v * 32767); } return out; }
const panGains = (gainDb: number, pan: number): [number, number] => { const g = dbToLin(gainDb), p = Math.max(-1, Math.min(1, pan)); return [g * Math.cos(((p + 1) * Math.PI) / 4), g * Math.sin(((p + 1) * Math.PI) / 4)]; };
const DEFAULT_CH: ChannelParams = { gainDb: 0, pan: 0, mute: false, solo: false };

export class Studio {
  readonly sr: number;
  private tsf: Tsf;
  private post: (m: StudioOut, transfer?: Transferable[]) => void;
  private banks = new Map<string, TsfBank>();
  private vowels: VowelTable | null = null;
  private chunks = new Map<string, Chunk>();
  private tracks = new Map<string, TrackState>();
  private order: string[] = [];
  private channels = new Map<string, ChannelParams>();   // 时间线换了也留着（边放边调不丢）
  private buses = new Map<string, Bus>();
  private master: MasterParams = { gainDb: 0, limiter: true };
  private masterLin = 1;
  private masterFx: FxInstance[] = [];
  // 走带
  private playing = false;
  private pos = 0;                         // 秒（时间线）
  private range = { from: 0, to: 0 };
  private loop = false;
  private loopFrom: number | null = null;
  private tail = -1;                       // ≥0 = 范围尾：已经等了几秒
  private draining = false; private drainPos = 0; private drainSecs = 0;   // 停了之后：释放中的尾巴照响到静（不渲染 = 冻住，下次放才漏出来；user「每次点play的时候会漏上次的最后一个音」）
  private forgetLater = new Set<string>();   // 主线程要放掉、但正被 hold 着的块：响完再删
  private waiting: string | null = null;   // 块没到：等它（走带冻住）
  private gen = 0;                         // 走带代号（主线程给；报告带着它）
  // 试听
  private auditionSf = new Map<string, SfPlayer>();   // sha → 试听用的 player（和时间线的分开：绕过静音 / 独奏）
  private auditions = new Map<string, Audition>();     // src → 正在按着的
  private auditionVowels: VowelVoice[] = [];
  private auditionClips: ClipVoice[] = [];
  private lastAud = new Map<string, [number, number]>();   // sha → 最后一次试听的增益 / 声像（松开后尾巴照这个）
  // 缓冲（零分配）
  private mono = new Float32Array(BLOCK);
  private busL = new Float32Array(BLOCK); private busR = new Float32Array(BLOCK);
  private audL = new Float32Array(BLOCK); private audR = new Float32Array(BLOCK);
  // 限幅器
  private look: number; private delayL: Float32Array; private delayR: Float32Array; private need: Float32Array; private attPow: Float32Array;
  private wr = 0; private gPrev = 1; private aRel: number;
  // 表 / 报告
  private meterOn = false; private meterPeak = 0; private meterFrames = 0;
  private loadBusy = 0; private loadFrames = 0; private chunkBytes = 0;   // 负载 / 内存监控（刀 6）
  private posFrames = 0;
  /** 宿主的音频时钟：这一块开头的 AudioContext 时间（worklet 每块前设 = currentTime；离线 / 测试不设）。位置报告带上「块尾的时钟」。 */
  clock: number | null = null;
  private missingSent = new Set<string>();

  constructor(sampleRate: number, tsf: Tsf, post: (m: StudioOut, transfer?: Transferable[]) => void) {
    this.sr = sampleRate; this.tsf = tsf; this.post = post;
    this.look = Math.max(1, Math.round(LIM_ATTACK * LIM_LOOK_TAUS * sampleRate));
    this.delayL = new Float32Array(this.look); this.delayR = new Float32Array(this.look); this.need = new Float32Array(this.look).fill(1);
    const aAtt = Math.exp(-1 / (LIM_ATTACK * sampleRate)); this.attPow = Float32Array.from({ length: this.look + 1 }, (_, k) => aAtt ** k);
    this.aRel = Math.exp(-1 / (LIM_RELEASE * sampleRate));
  }
  /** 限幅器带来的固定延迟（采样）：导出时从输出里扣掉。 */
  get latency(): number { return this.master.limiter ? this.look : 0; }
  get isPlaying(): boolean { return this.playing; }
  get position(): number { return this.pos; }
  get waitingFor(): string | null { return this.waiting; }
  hasChunk(key: string): boolean { return this.chunks.has(key); }

  // ── 消息 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  handle(m: StudioIn): void {
    switch (m.type) {
      case "bank": {
        let b = this.banks.get(m.sha);
        if (!b) {
          const loaded = this.tsf.load(m.bytes, this.sr, 256);
          if (!loaded) { this.post({ type: "error", message: `studio: not a SoundFont 2 file (${m.sha.slice(0, 12)})` }); return; }
          b = loaded; this.banks.set(m.sha, b);
          for (const t of this.tracks.values()) if (t.spec.kind === "sf" && t.spec.sha === m.sha && !t.sf) t.sf = this.playerFor(b);
        }
        this.post({ type: "banked", sha: m.sha, presets: b.presets.map((p) => [p.bank, p.program]) });
        return;
      }
      case "unbank": {
        const b = this.banks.get(m.sha); if (!b) return;
        for (const t of this.tracks.values()) if (t.sf && t.sf.bank === b) { this.tsf.close(t.sf.player); t.sf = null; }
        const a = this.auditionSf.get(m.sha); if (a) { this.tsf.close(a.player); this.auditionSf.delete(m.sha); }
        for (const [src, au] of this.auditions) if (au.inst.kind === "sf" && au.inst.sha === m.sha) this.auditions.delete(src);
        this.tsf.close(b); this.banks.delete(m.sha);
        return;
      }
      case "vowels": {
        const entries = m.entries.map((e) => { const data = new Float32Array(e.len); for (let k = 0; k < e.len; k++) data[k] = m.pcm[e.start + k] / 32768; return { ...e, data }; });
        this.vowels = { sr: m.sr, entries };
        return;
      }
      case "timeline": this.setTimeline(m.tl); return;
      case "chunk": { this.dropChunk(m.key); const samples = m.samples instanceof Int16Array ? m.samples : toInt16(m.samples); this.chunks.set(m.key, { sr: m.sr, samples }); this.chunkBytes += samples.byteLength; this.missingSent.delete(m.key); return; }
      case "getChunks": { const items = m.keys.flatMap((k) => { const c = this.chunks.get(k); return c ? [{ key: k, sr: c.sr, samples: c.samples.slice() }] : []; }); this.post({ type: "chunks", items }, items.map((x) => x.samples.buffer)); return; }
      case "forget": for (const k of m.keys) { if (this.held(k) || this.sounding(k)) this.forgetLater.add(k); else this.dropChunk(k); } return;   // 正在响 / hold 着的块：响完再删（主线程换时间线之前就会先来清块）
      case "channel": {
        const cur = this.channels.get(m.id) ?? { ...DEFAULT_CH }, next = { ...cur, ...m.p };
        this.channels.set(m.id, next);
        const t = this.tracks.get(m.id); if (t) { t.ch = next; if (m.p.chain !== undefined) t.chFx = buildChain(m.p.chain, t.chFx, this.sr); }
        return;
      }
      case "buses": {
        const old = this.buses; this.buses = new Map();
        for (const b of m.buses) { const had = old.get(b.id); this.buses.set(b.id, { id: b.id, gainDb: b.gainDb, pan: b.pan, gl: had?.gl ?? 0, gr: had?.gr ?? 0, fx: buildChain(b.chain, had?.fx ?? [], this.sr), L: had?.L ?? new Float32Array(BLOCK), R: had?.R ?? new Float32Array(BLOCK) }); }
        return;
      }
      case "master": this.master = { ...this.master, ...m.p }; this.masterLin = dbToLin(this.master.gainDb); if (m.p.chain !== undefined) this.masterFx = buildChain(m.p.chain, this.masterFx, this.sr); return;
      case "play": if (m.gen !== undefined) this.gen = m.gen; this.play(m.at); return;
      case "stop": this.stop(); return;
      case "seek": this.seek(m.at); return;
      case "audition": this.audition(m); return;
      case "auditionClip": {
        for (const v of this.auditionClips) if (v.src === m.src) v.state = "cut";
        const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0);
        while (this.auditionClips.length >= 8) this.auditionClips.shift();
        this.auditionClips.push({ src: m.src, data: m.samples, ratio: m.sr / this.sr, pos: 0, env: 0, state: "attack", gl, gr });
        this.auditions.set(m.src, { inst: { kind: "clip" }, key: 0, gl, gr });
        return;
      }
      case "meter": this.meterOn = m.on; this.meterPeak = 0; this.meterFrames = 0; return;
    }
  }

  private playerFor(bank: TsfBank): SfPlayer {
    const handle = this.tsf.ex.sf_copy(bank.handle); this.tsf.ex.sf_set_max_voices(handle, 256);
    return { bank, player: { handle, presets: bank.presets } };
  }
  private setTimeline(tl: TimelineMsg): void {
    const old = this.tracks; this.tracks = new Map(); this.order = [];
    const pos0 = this.pos, shift = this.playing && tl.shift ? tl.shift : 0;
    const prevClips = new Map<string, { key: string; t0: number; dur: number; gain: number }[]>();   // 换之前每条块轨的块（算 hold 用）
    for (const spec of tl.tracks) {
      const prev = old.get(spec.id);
      if (prev && prev.spec.kind === "clips") prevClips.set(spec.id, prev.spec.clips);
      const t: TrackState = prev ?? { spec, ch: this.channels.get(spec.id) ?? { ...DEFAULT_CH }, gl: 0, gr: 0, y: 1, gk: 0, nextNote: 0, offs: [], sf: null, vowels: [], env: 1, envTarget: 1, hold: null, src: new Float32Array(BLOCK), out: new Float32Array(BLOCK), perfFx: [], chFx: [] };
      t.spec = spec; t.ch = this.channels.get(spec.id) ?? t.ch;
      t.perfFx = buildChain(spec.chain ?? [], t.perfFx, this.sr);
      if (!prev) t.chFx = buildChain(t.ch.chain ?? [], [], this.sr);
      if (spec.kind === "sf") {
        const bank = this.banks.get(spec.sha) ?? null;
        if (t.sf && t.sf.bank !== bank) { this.tsf.close(t.sf.player); t.sf = null; }
        if (!t.sf && bank) t.sf = this.playerFor(bank);
      } else if (t.sf) { this.tsf.close(t.sf.player); t.sf = null; }
      this.tracks.set(spec.id, t); this.order.push(spec.id);
      old.delete(spec.id);
    }
    for (const t of old.values()) { if (t.sf) this.tsf.close(t.sf.player); this.endHold(t); }   // 没了的声部
    this.range = { ...tl.range }; this.loop = tl.loop; this.loopFrom = tl.loopFrom ?? null;
    // 正在放：时间线换了（改谱 / 换范围）= 游标按现在的位置重算，已经在响的音不动（user「正在响的那句不换、响完换新」）
    if (this.playing) {
      if (shift) {   // 改了播放头前面的东西：按谱位置挪（主线程算好的秒差），等着松开的音和 hold 一起挪
        this.pos = Math.max(this.range.from, Math.min(this.range.to, pos0 + shift));
        for (const t of this.tracks.values()) { for (const o of t.offs) o.t += shift; if (t.hold) { t.hold.t0 += shift; t.hold.until += shift; } }
      }
      for (const t of this.tracks.values()) {   // 正在唱的那句换了唱谱：旧块留到响完（新块到了也不中途换——换就是一跳）
        if (t.spec.kind !== "clips") { this.endHold(t); continue; }
        const cur = t.spec.clips.find((c) => c.t0 <= this.pos && c.t0 + c.dur > this.pos);
        if (!cur) { this.endHold(t); continue; }
        if (t.hold && t.hold.until > this.pos) continue;
        this.endHold(t);
        if (this.chunks.has(cur.key)) continue;
        const o = prevClips.get(t.spec.id)?.find((c) => c.t0 <= pos0 && c.t0 + c.dur > pos0 && c.key !== cur.key && this.chunks.has(c.key));
        if (o) t.hold = { key: o.key, t0: o.t0 + shift, dur: o.dur, gain: o.gain, until: Math.min(o.t0 + o.dur, cur.t0 + cur.dur - shift) + shift };
      }
      this.resetCursors(false); this.checkMissing();
    }
    else { for (const t of this.tracks.values()) this.endHold(t); if (this.pos < this.range.from || this.pos > this.range.to) this.pos = this.range.from; }
    this.sweepForget();
  }

  // ── 走带 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  private play(at?: number): void {
    if (at !== undefined) this.pos = at;
    if (this.pos < this.range.from || this.pos >= this.range.to) this.pos = this.range.from;
    this.playing = true; this.draining = false; this.tail = -1; this.waiting = null; this.posFrames = POS_EVERY;   // 起放那一块就报（主线程的对照表从这儿开始）
    for (const t of this.tracks.values()) { this.killAll(t); this.endHold(t); }   // 上次停下来还没响完的尾巴快速收掉，别漏进这一次
    this.resetCursors(true);
    this.checkMissing();
  }
  /** 停：不排新音、块 30 ms 淡出、释放中的尾巴接着响到静（不是冻住）。播放头留在原地。 */
  private stop(): void {
    this.playing = false; this.tail = -1; this.waiting = null;
    this.draining = true; this.drainPos = this.pos; this.drainSecs = 0;
    for (const t of this.tracks.values()) { this.releaseAll(t); t.envTarget = 0; this.endHold(t); }
    this.sweepForget();
  }
  private seek(at: number): void {
    this.pos = at; this.posFrames = POS_EVERY;   // 跳了 = 这一块就报（对照表别拿跳之前的位置往后推）
    if (this.playing) { this.tail = -1; this.waiting = null; for (const t of this.tracks.values()) this.endHold(t); this.resetCursors(true); this.checkMissing(); }
  }
  /** 旧块响完 / 不要了：撤 hold；主线程早就说要放掉的这时才真删。 */
  private endHold(t: TrackState): void {
    if (!t.hold) return; t.hold = null;
    this.sweepForget();
  }
  private dropChunk(key: string): void { const c = this.chunks.get(key); if (c) { this.chunkBytes -= c.samples.byteLength; this.chunks.delete(key); } }
  private held(key: string): boolean { for (const t of this.tracks.values()) if (t.hold?.key === key) return true; return false; }
  /** 放着的时候这个块正在响（时间线里它盖着播放头）。 */
  private sounding(key: string): boolean {
    if (!this.playing) return false;
    for (const t of this.tracks.values()) if (t.spec.kind === "clips") for (const c of t.spec.clips) if (c.key === key && c.t0 <= this.pos && c.t0 + c.dur > this.pos) return true;
    return false;
  }
  /** 主线程早说要放掉的块：既没 hold 着、时间线里也不再用 = 这时才真删。 */
  private sweepForget(): void {
    for (const k of this.forgetLater) {
      if (this.held(k)) continue;
      let used = false; for (const t of this.tracks.values()) if (t.spec.kind === "clips" && t.spec.clips.some((c) => c.key === k)) { used = true; break; }
      if (!used) { this.forgetLater.delete(k); this.dropChunk(k); }
    }
  }
  /** 所有正在响的声音快速收掉（几毫秒的淡出，不是硬切）：起放时清上一次的尾巴。 */
  private killAll(t: TrackState): void {
    if (t.sf) this.tsf.reset(t.sf.player);
    t.offs.length = 0;
    for (const v of t.vowels) v.state = "cut";
  }
  /** 游标对齐到 pos；chase = 把 pos 这一刻该响着的音按下（起放 / seek / 续放），正在响的先松开。 */
  private resetCursors(chase: boolean): void {
    for (const t of this.tracks.values()) {
      if (chase) { this.releaseAll(t); t.env = 0; }
      t.envTarget = 1;
      const segs = t.spec.gain;
      if (segs && segs.length) { let k = 0; while (k < segs.length - 1 && this.pos >= segs[k].t1) k++; t.gk = k; if (chase) t.y = dbToLin(segs[k].dB); }
      if (t.spec.kind === "clips") continue;
      const notes = t.spec.notes; let i = 0;
      while (i < notes.length && notes[i].t0 < this.pos) { if (chase && notes[i].t1 > this.pos) this.noteOn(t, notes[i]); i++; }
      t.nextNote = i;
    }
  }
  private releaseAll(t: TrackState): void {
    if (t.sf) this.tsf.allOff(t.sf.player);
    t.offs.length = 0;
    for (const v of t.vowels) if (v.state !== "release" && v.state !== "cut") v.state = "release";
  }
  private noteOn(t: TrackState, n: NoteEv): void {
    if (t.spec.kind === "sf") { if (!t.sf) return; this.tsf.noteOn(t.sf.player, n.preset, n.key, n.vel); }
    else if (t.spec.kind === "vowel") this.vowelOn(t.vowels, null, t.spec.kana, n.key, 1, 1);
    else return;
    const off = { t: Math.max(n.t0, n.t1), key: n.key, preset: n.preset }; let k = t.offs.length;
    while (k > 0 && t.offs[k - 1].t > off.t) k--;
    t.offs.splice(k, 0, off);
  }
  private noteOff(t: TrackState, key: number, preset: number): void {
    if (t.spec.kind === "sf") { if (t.sf) this.tsf.noteOff(t.sf.player, preset, key); }
    else if (t.spec.kind === "vowel") { for (const v of t.vowels) if (v.src === null && v.key === key && v.state !== "release" && v.state !== "cut") v.state = "release"; }
  }
  /** 播放头前面（提前量内）的块到齐了没有；没到的报上去（主线程去算）。 */
  private checkMissing(): void {
    const miss: string[] = [];
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) if (c.t0 + c.dur > this.pos && c.t0 < this.pos + LOOKAHEAD && !this.chunks.has(c.key) && !this.missingSent.has(c.key)) { miss.push(c.key); this.missingSent.add(c.key); }
    }
    if (miss.length) this.post({ type: "missing", keys: miss });
  }
  /** 走带从 pos 往前最多能走到哪（≤ end）：没到的块的头挡住；正站在没到的块上 = 返回 null（要等它）。 */
  private clipBarrier(end: number): { stop: number; wait: string | null } {
    let stop = end;
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) {
        if (this.chunks.has(c.key) || (t.hold && c.t0 < t.hold.until)) continue;   // hold 着的那段：旧块顶着，新块没到也不挡
        if (c.t0 <= this.pos && c.t0 + c.dur > this.pos) return { stop: this.pos, wait: c.key };
        if (c.t0 > this.pos && c.t0 < stop) stop = c.t0;
      }
    }
    return { stop, wait: null };
  }
  private keyStartingAt(t0: number): string | null {
    for (const t of this.tracks.values()) if (t.spec.kind === "clips") for (const c of t.spec.clips) if (!this.chunks.has(c.key) && !(t.hold && c.t0 < t.hold.until) && Math.abs(c.t0 - t0) < 1e-6) return c.key;
    return null;
  }
  private freeze(key: string | null): void { this.waiting = key; for (const t of this.tracks.values()) this.releaseAll(t); this.checkMissing(); }

  // ── 渲染 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  /** 出一块：outL / outR 长 n（≤ BLOCK）。 */
  render(outL: Float32Array, outR: Float32Array, n: number): void {
    const tStart = now();
    this.busL.fill(0, 0, n); this.busR.fill(0, 0, n); this.audL.fill(0, 0, n); this.audR.fill(0, 0, n);
    for (const b of this.buses.values()) { b.L.fill(0, 0, n); b.R.fill(0, 0, n); }
    if (this.playing) this.renderTransport(n); else if (this.draining) this.renderDrain(n);
    // 总线：各轨送来的 → 这条总线的链（混响 / 延迟…）→ 增益 / 平衡 → 总轨
    for (const b of this.buses.values()) {
      for (const fx of b.fx) fx.process(b.L, b.R, n, null);
      const [gl, gr] = panGains(b.gainDb, b.pan), dl = (gl - b.gl) / n, dr = (gr - b.gr) / n; let cl = b.gl, cr = b.gr;
      for (let i = 0; i < n; i++) { cl += dl; cr += dr; this.busL[i] += b.L[i] * cl * Math.SQRT2; this.busR[i] += b.R[i] * cr * Math.SQRT2; }   // 立体声的平衡：正中 = 原样
      b.gl = gl; b.gr = gr;
    }
    for (const fx of this.masterFx) fx.process(this.busL, this.busR, n, null);   // 总轨链（母带 EQ / 压缩…），限幅在最后
    this.renderAuditions(n);
    // 总轨：增益 → 限幅（只管走带来的声）→ 加上试听（绕过限幅）
    const g = this.masterLin;
    if (this.master.limiter) this.limit(n, g);
    else for (let i = 0; i < n; i++) { this.busL[i] *= g; this.busR[i] *= g; }
    for (let i = 0; i < n; i++) { outL[i] = this.busL[i] + this.audL[i] * g; outR[i] = this.busR[i] + this.audR[i] * g; }
    if (this.meterOn) {
      for (let i = 0; i < n; i++) { const a = Math.abs(outL[i]), b = Math.abs(outR[i]); if (a > this.meterPeak) this.meterPeak = a; if (b > this.meterPeak) this.meterPeak = b; }
      this.meterFrames += n;
      if (this.meterFrames >= 1024) { this.post({ type: "meter", peak: this.meterPeak, active: this.activeVoices() }); this.meterPeak = 0; this.meterFrames = 0; }
    }
    // 负载：这一块渲染花了多久 / 这一块值多久（AudioWorklet 里没有 performance，退回 Date.now：毫秒粗，攒满 1 s 再报就够准）
    this.loadBusy += now() - tStart; this.loadFrames += n;
    if (this.loadFrames >= this.sr) { this.post({ type: "load", busy: Math.min(1, this.loadBusy / ((this.loadFrames / this.sr) * 1000)), chunkBytes: this.chunkBytes, chunks: this.chunks.size, voices: this.activeVoices() }); this.loadBusy = 0; this.loadFrames = 0; }
  }
  activeVoices(): number {
    let a = this.auditionVowels.length;
    for (const t of this.tracks.values()) { if (t.sf) a += this.tsf.active(t.sf.player); a += t.vowels.length; }
    for (const p of this.auditionSf.values()) a += this.tsf.active(p.player);
    return a;
  }
  private renderTransport(n: number): void {
    const sr = this.sr;
    let done = 0;
    while (done < n) {
      const left = n - done;
      for (const t of this.tracks.values()) if (t.hold && this.pos >= t.hold.until) this.endHold(t);   // 旧块响完 = 换新的（没到就在下面等）
      if (this.waiting) {   // 等块：冻住，只让尾巴响
        if (!this.chunks.has(this.waiting)) { this.renderTracks(done, left, false, false); done = n; break; }
        this.waiting = null; this.resetCursors(true);
      }
      if (this.tail >= 0 && this.loop) { this.loopBack(); continue; }   // 尾巴还在响的时候开了循环 = 这一轮照样跳回去（2026-10-10 user「中途toggle循环对本轮播放应该生效」）
      if (this.tail >= 0) {   // 范围尾：不排新音，块淡出，响完就停
        this.renderTracks(done, left, false, true); this.pos += left / sr; this.tail += left / sr; done = n;
        if (this.tail >= TAIL_MAX || this.silent()) { this.stop(); this.post({ type: "ended", gen: this.gen }); }
        break;
      }
      const blockEnd = this.pos + left / sr;
      const { stop, wait } = this.clipBarrier(Math.min(blockEnd, this.range.to));
      if (wait) { this.freeze(wait); continue; }
      const cnt = Math.min(left, Math.max(0, Math.round((stop - this.pos) * sr)));
      if (cnt > 0) { this.renderTracks(done, cnt, true, true); this.pos += cnt / sr; done += cnt; }
      if (this.pos >= this.range.to - 0.5 / sr) {   // 到范围尾
        if (this.loop) this.loopBack();   // 跳回去：正在响的照响，不松
        else { this.tail = 0; for (const t of this.tracks.values()) { this.releaseAll(t); t.envTarget = 0; } }
        continue;
      }
      if (cnt === 0) {   // 站在一个没到的块的头前面：冻
        const key = this.keyStartingAt(stop);
        if (!key) { this.renderTracks(done, left, false, false); done = n; break; }   // 不该发生；别死循环
        this.freeze(key);
      }
    }
    this.posFrames += n;
    if (this.posFrames >= POS_EVERY) { this.posFrames = 0; this.post({ type: "pos", sec: this.pos, playing: this.playing, waiting: this.waiting, gen: this.gen, ...(this.clock !== null ? { at: this.clock + n / sr } : {}) }); }
  }
  /** 停了之后：尾巴（释放中的音、淡出中的块）照响到静或 TAIL_MAX；播放头不动，块按自己的钟走。 */
  private renderDrain(n: number): void {
    this.renderTracks(0, n, false, true, this.drainPos);
    this.drainPos += n / this.sr; this.drainSecs += n / this.sr;
    if (this.drainSecs >= TAIL_MAX || this.silent()) this.draining = false;
  }
  /** 循环跳回循环头（到范围尾时；或尾巴还在响时开了循环）。 */
  private loopBack(): void {
    this.tail = -1; this.posFrames = POS_EVERY; this.pos = Math.max(this.range.from, Math.min(this.loopFrom ?? this.range.from, this.range.to));
    for (const t of this.tracks.values()) this.endHold(t);
    this.resetCursors(false); this.chaseAtLoop(); this.checkMissing();
  }
  private chaseAtLoop(): void { for (const t of this.tracks.values()) { if (t.spec.kind === "clips") continue; for (const nte of t.spec.notes) if (nte.t0 < this.pos && nte.t1 > this.pos) this.noteOn(t, nte); } }
  private silent(): boolean {
    for (const t of this.tracks.values()) { if (t.sf && this.tsf.active(t.sf.player) > 0) return false; if (t.vowels.length) return false; if (t.spec.kind === "clips" && t.env > 1e-4) return false; }
    return true;
  }
  /** 各声部出 cnt 个采样进母线 / 总线（从 off 起）。notesOn = 排新音；clipsOn = 块前进（false = 冻着，块不出声）。
   *  两趟（侧链要先看到别的轨的声）：① 每轨 出声 → 表情曲线 → 块淡入淡出 → 演奏者的链 → src；② 每轨 src → 通道链（压缩器的 key 读别的轨的 src）→ 静音 / 独奏 → 推子 / 声像 → 去总轨或总线，再按发送量发到总线。 */
  private renderTracks(off: number, cnt: number, notesOn: boolean, clipsOn: boolean, t0 = this.pos): void {
    const solo = this.order.some((id) => this.tracks.get(id)!.ch.solo);
    const sr = this.sr;
    for (const id of this.order) {   // ── 第一趟
      const t = this.tracks.get(id)!, mono = t.src; mono.fill(0, 0, cnt);
      if (t.spec.kind === "clips") { if (clipsOn && !(t.env === 0 && t.envTarget === 0)) this.renderClips(t, mono, cnt, t0); }   // 淡完了（停 / 范围尾）= 不出声（原来 env 到 0 之后不再乘、块又全音量放出来：user「按停之后月读不应该把长句念完」）
      else this.renderNotes(t, mono, cnt, t0, notesOn);
      const segs = t.spec.gain;
      if (segs && segs.length) {   // 表情曲线（dB 段，一阶平滑；同原 applyGain）
        const a = 1 - Math.exp(-1 / (GAIN_TAU * sr));
        for (let i = 0; i < cnt; i++) {
          const tt = t0 + i / sr; while (t.gk < segs.length - 1 && tt >= segs[t.gk].t1) t.gk++;
          t.y += (dbToLin(segs[t.gk].dB) - t.y) * a; mono[i] *= t.y;
        }
      }
      if (t.spec.kind === "clips" && t.env !== t.envTarget) {   // 块轨的淡入 / 淡出（起放 / seek / 范围尾）
        const step = t.envTarget > t.env ? 1 / (CLIP_FADE_IN * sr) : -1 / (CLIP_FADE_OUT * sr);
        for (let i = 0; i < cnt; i++) { if (t.env !== t.envTarget) { t.env += step; if ((step > 0 && t.env >= t.envTarget) || (step < 0 && t.env <= t.envTarget)) t.env = t.envTarget; } mono[i] *= t.env; }
      }
      for (const fx of t.perfFx) fx.process(mono, null, cnt, null);   // 跟着演奏者走的链
    }
    for (const id of this.order) {   // ── 第二趟
      const t = this.tracks.get(id)!, out = t.out; out.set(t.src.subarray(0, cnt));
      for (const fx of t.chFx) fx.process(out, null, cnt, fx.kind === "comp" ? this.keyOf(t, fx.id) : null);
      const audible = solo ? t.ch.solo : !t.ch.mute;
      const [gl, gr] = audible ? panGains(t.ch.gainDb, t.ch.pan) : [0, 0];
      const dl = (gl - t.gl) / cnt, dr = (gr - t.gr) / cnt;
      const bus = t.ch.to && t.ch.to !== "master" ? this.buses.get(t.ch.to) : undefined, L = bus ? bus.L : this.busL, R = bus ? bus.R : this.busR;
      let cl = t.gl, cr = t.gr;
      for (let i = 0; i < cnt; i++) { cl += dl; cr += dr; L[off + i] += out[i] * cl; R[off + i] += out[i] * cr; }
      if (t.ch.sends) for (const sd of t.ch.sends) {   // 发送（推子之后）
        const b = this.buses.get(sd.to); if (!b) continue;
        const g = dbToLin(sd.gainDb), sl = gl * g, sr2 = gr * g;
        for (let i = 0; i < cnt; i++) { b.L[off + i] += out[i] * sl; b.R[off + i] += out[i] * sr2; }
      }
      t.gl = gl; t.gr = gr;
    }
  }
  /** 压缩器的侧链：通道条上 id 是 fxId 的那台写了 key = 别的轨 id → 那条轨这一段的第一趟输出；没写 / 找不到 = null（听自己）。 */
  private keyOf(t: TrackState, fxId: string): Float32Array | null {
    const spec = t.ch.chain?.find((f) => f.id === fxId); if (!spec?.key || spec.key === t.spec.id) return null;
    return this.tracks.get(spec.key)?.src ?? null;
  }
  private renderClips(t: TrackState, mono: Float32Array, cnt: number, t0: number): void {
    if (t.spec.kind !== "clips") return;
    if (t.hold) this.renderClip(t.hold, mono, cnt, t0);
    for (const c of t.spec.clips) { if (t.hold && c.t0 < t.hold.until) continue; this.renderClip(c, mono, cnt, t0); }
  }
  private renderClip(c: { key: string; t0: number; gain: number }, mono: Float32Array, cnt: number, t0: number): void {
    const sr = this.sr, tEnd = t0 + cnt / sr;
    const ch = this.chunks.get(c.key); if (!ch) return;
    const len = ch.samples.length, cEnd = c.t0 + len / ch.sr;
    if (c.t0 >= tEnd || cEnd <= t0) return;
    const s = ch.samples, g = c.gain * I16;
    for (let i = 0; i < cnt; i++) {
      const p = (t0 + i / sr - c.t0) * ch.sr; if (p < 0) continue;
      const k = p | 0; if (k >= len - 1) break;
      const f = p - k; mono[i] += (s[k] * (1 - f) + s[k + 1] * f) * g;
    }
  }
  /** 快引擎的轨：事件按采样位置施加（同原 synth-processor），中间逐段渲染。 */
  private renderNotes(t: TrackState, mono: Float32Array, cnt: number, t0: number, notesOn: boolean): void {
    if (t.spec.kind === "clips") return;
    const sr = this.sr, notes = t.spec.notes, tEnd = t0 + cnt / sr;
    let pos = 0;
    const renderTo = (at: number) => {
      if (at <= pos) return;
      if (t.spec.kind === "sf") { if (t.sf) this.tsf.render(t.sf.player, mono, pos, at - pos); }
      else this.renderVowels(t.vowels, mono, null, null, pos, at - pos);
      pos = at;
    };
    if (notesOn) {
      for (;;) {
        const nextOn = t.nextNote < notes.length ? notes[t.nextNote].t0 : Infinity, nextOff = t.offs.length ? t.offs[0].t : Infinity;
        if (nextOn >= tEnd && nextOff >= tEnd) break;
        if (nextOff <= nextOn) { renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOff - t0) * sr)))); const o = t.offs.shift()!; this.noteOff(t, o.key, o.preset); }
        else { renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOn - t0) * sr)))); this.noteOn(t, notes[t.nextNote++]); }
      }
    }
    renderTo(cnt);
  }
  // ── 元音采样器（原 src/singer/sampler.ts 的做法搬进音频线程：最近音高的样本变速、按住循环稳态段、松开淡出）────────
  private vowelOn(pool: VowelVoice[], src: string | null, kana: string, key: number, gl: number, gr: number): VowelVoice | null {
    if (!this.vowels) return null;
    const es = this.vowels.entries.filter((e) => e.kana === kana); if (!es.length) return null;
    const e = es.reduce((a, b) => (Math.abs(b.midi - key) < Math.abs(a.midi - key) ? b : a));
    while (pool.length >= MAX_VOWEL_VOICES) pool.shift();
    const rate = (2 ** ((key - e.midi) / 12)) * (this.vowels.sr / this.sr);
    const v: VowelVoice = { src, data: e.data, pos: 0, rate, target: rate, loopStart: e.loopStart, loopEnd: e.loopEnd, env: 0, state: "attack", gl, gr, key, baseMidi: e.midi };
    pool.push(v); return v;
  }
  /** 一池声音出 cnt 个采样：单声道 mono（时间线轨）或立体声 L / R（试听，自带增益声像）。 */
  private renderVowels(pool: VowelVoice[], mono: Float32Array | null, L: Float32Array | null, R: Float32Array | null, off: number, cnt: number): void {
    const sr = this.sr, attack = 1 / (V_ATTACK * sr), relK = Math.exp(-1 / (V_RELEASE * sr)), cutK = Math.exp(-1 / (V_CUT * sr)), glideK = 1 - Math.exp(-1 / (V_GLIDE * sr));
    for (let vi = pool.length - 1; vi >= 0; vi--) {
      const v = pool[vi], d = v.data, span = v.loopEnd - v.loopStart;
      for (let i = 0; i < cnt; i++) {
        if (v.state === "attack") { v.env += attack; if (v.env >= 1) { v.env = 1; v.state = "hold"; } }
        else if (v.state === "release") v.env *= relK; else if (v.state === "cut") v.env *= cutK;
        v.rate += (v.target - v.rate) * glideK;
        const k = v.pos | 0, f = v.pos - k, s = d[k] * (1 - f) + (d[k + 1] ?? d[k]) * f, y = s * v.env;
        if (mono) mono[off + i] += y; else { L![off + i] += y * v.gl; R![off + i] += y * v.gr; }
        v.pos += v.rate;
        if (span > 0) { while (v.pos >= v.loopEnd) v.pos -= span; }   // 按住循环稳态段（循环尾可以就是样本末尾）
        else if (v.pos >= d.length - 1) { v.env = 0; v.state = "cut"; break; }
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) pool.splice(vi, 1);
    }
  }
  // ── 按键试听 ──────────────────────────────────────────────────────────────────────────────────────────────────────
  private audition(m: Extract<StudioIn, { type: "audition" }>): void {
    if (m.ev === "alloff") { for (const src of [...this.auditions.keys()]) this.auditionOff(src); for (const v of this.auditionVowels) v.state = "cut"; for (const v of this.auditionClips) v.state = "cut"; return; }
    if (m.ev === "off") { this.auditionOff(m.src); return; }
    if (m.ev === "glide") {
      const au = this.auditions.get(m.src); if (!au || m.key === undefined) return;
      if (au.inst.kind === "vowel" && this.vowels) {
        const near = Math.abs(m.key - au.key) <= 3;   // 离样本太远就换一份样本（原 GLIDE_SPAN）
        if (near) { for (const v of this.auditionVowels) if (v.src === m.src) { v.target = (2 ** ((m.key - v.baseMidi) / 12)) * (this.vowels.sr / this.sr); v.key = m.key; } au.key = m.key; return; }
      }
      this.auditionOff(m.src); this.audition({ ...m, ev: "on", inst: au.inst, gainDb: m.gainDb, pan: m.pan }); return;
    }
    if (!m.inst || m.key === undefined) return;
    this.auditionOff(m.src);
    const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0), vel = m.vel ?? 0.8;
    if (m.inst.kind === "sf") {
      const bank = this.banks.get(m.inst.sha); if (!bank) return;
      let p = this.auditionSf.get(m.inst.sha); if (!p) { p = this.playerFor(bank); this.auditionSf.set(m.inst.sha, p); }
      this.tsf.noteOn(p.player, m.inst.preset, m.key, vel);
      this.lastAud.set(m.inst.sha, [gl, gr]);
    } else if (m.inst.kind === "vowel") {
      for (const v of this.auditionVowels) if (v.src === m.src) v.state = "cut";
      this.vowelOn(this.auditionVowels, m.src, m.inst.kana, m.key, gl, gr);
    } else return;   // clip 走 auditionClip
    this.auditions.set(m.src, { inst: m.inst, key: m.key, gl, gr });
  }
  private auditionOff(src: string): void {
    const au = this.auditions.get(src); if (!au) return; this.auditions.delete(src);
    if (au.inst.kind === "sf") { const p = this.auditionSf.get(au.inst.sha); if (p) this.tsf.noteOff(p.player, au.inst.preset, au.key); }
    else if (au.inst.kind === "clip") { for (const v of this.auditionClips) if (v.src === src && v.state !== "cut") v.state = "release"; }
    else for (const v of this.auditionVowels) if (v.src === src && v.state !== "cut") v.state = "release";
  }
  private renderAuditions(n: number): void {
    if (this.auditionVowels.length) this.renderVowels(this.auditionVowels, null, this.audL, this.audR, 0, n);
    if (this.auditionClips.length) this.renderClipVoices(n);
    for (const [sha, p] of this.auditionSf) {
      if (this.tsf.active(p.player) === 0) continue;
      this.tsf.render(p.player, this.mono, 0, n);
      const [gl, gr] = this.lastAud.get(sha) ?? [1, 1];
      for (let i = 0; i < n; i++) { this.audL[i] += this.mono[i] * gl; this.audR[i] += this.mono[i] * gr; }
    }
  }
  /** 试听的一段声音：线性重采样放一遍（不循环），起 5 ms、松开 40 ms 淡出、被顶掉 6 ms。 */
  private renderClipVoices(n: number): void {
    const sr = this.sr, attack = 1 / (0.005 * sr), relK = Math.exp(-1 / (0.04 * sr)), cutK = Math.exp(-1 / (0.006 * sr));
    for (let vi = this.auditionClips.length - 1; vi >= 0; vi--) {
      const v = this.auditionClips[vi], d = v.data, len = d.length;
      for (let i = 0; i < n; i++) {
        if (v.state === "attack") { v.env += attack; if (v.env >= 1) { v.env = 1; v.state = "hold"; } }
        else if (v.state === "release") v.env *= relK; else if (v.state === "cut") v.env *= cutK;
        const k = v.pos | 0; if (k >= len - 1) { v.env = 0; v.state = "cut"; break; }
        const f = v.pos - k, y = (d[k] * (1 - f) + d[k + 1] * f) * v.env;
        this.audL[i] += y * v.gl; this.audR[i] += y * v.gr;
        v.pos += v.ratio;
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) { this.auditionClips.splice(vi, 1); if (this.auditions.get(v.src)?.inst.kind === "clip") this.auditions.delete(v.src); }
    }
  }
  // ── 母线前瞻限幅（原 src/audio/mix.ts limitBus 的实时版：输出晚 look 个采样；每个未来的峰按 attack 曲线提前收、过了峰按 release 慢慢放开；左右同一条增益）───
  private limit(n: number, g: number): void {
    const look = this.look, c = CEILING, L = this.busL, R = this.busR, dL = this.delayL, dR = this.delayR, need = this.need, att = this.attPow;
    for (let i = 0; i < n; i++) {
      const l = L[i] * g, r = R[i] * g, p = Math.max(Math.abs(l), Math.abs(r));
      const slot = this.wr, outL = dL[slot], outR = dR[slot];   // 最旧的 = 这一采样的输出
      let gq = need[slot];                                        // 它自己最多能放多大
      dL[slot] = l; dR[slot] = r; need[slot] = p > c ? c / p : 1; // 写进最新的
      for (let d = 1; d <= look; d++) { const v = 1 - (1 - need[(slot + d) % look]) * att[d]; if (v < gq) gq = v; }   // 往后看整个窗：d = 离输出几个采样（d = look 就是刚写进的）
      this.wr = (slot + 1) % look;
      gq = Math.min(gq, 1 - (1 - this.gPrev) * this.aRel); this.gPrev = gq;
      let a = outL * gq, b = outR * gq;
      if (a > c) a = c; else if (a < -c) a = -c;
      if (b > c) b = c; else if (b < -c) b = -c;
      L[i] = a; R[i] = b;
    }
  }
}
