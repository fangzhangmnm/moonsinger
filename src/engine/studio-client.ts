// studio-client.ts —— 主线程这边的录音房：装 worklet（dist/studio-worklet-<hash>.mjs）、把 TinySoundFont 的 WASM 编好递进去、喂库 / 元音表 / 时间线 / 块、走带、按键试听、
// 收位置 / 结束 / 缺块。离线导出 = 同一个 Studio 类在这边的循环里跑（同一份数学；提案 §5）。created 2026-10-09 by Claude Fable 5.1
// 一个 app 一个实例；AudioContext 全 app 共用（src/singer/audio.ts）。装 worklet 第一次用才做（家规：重资源要等用户有意图才加载）。
import { instantiateTsf } from "../gm/tsf-standalone.ts";
import { Studio, BLOCK, type StudioIn, type StudioOut, type TimelineMsg, type ChannelParams, type MasterParams, type VowelEntry, type AuditionInst } from "./studio.ts";

export interface VowelTableMsg { sr: number; entries: VowelEntry[]; pcm: Int16Array }
export interface StudioEvents { pos: (sec: number, playing: boolean, waiting: string | null) => void; ended: () => void; missing: (keys: string[]) => void; meter: (peak: number, active: number) => void }

export class StudioClient {
  private node: AudioWorkletNode | null = null;
  private readyP: Promise<void> | null = null;
  private wasm: Promise<WebAssembly.Module> | null = null;
  private presets = new Map<string, Map<string, number>>();   // sha → "bank:program" → 预设下标
  private bankWait = new Map<string, { ok: () => void; fail: (e: Error) => void }[]>();
  private bankBytes = new Map<string, Uint8Array>();   // 离线导出时再装一遍要用
  private vowelTable: VowelTableMsg | null = null;
  private tl: TimelineMsg | null = null;
  private chunks = new Map<string, { sr: number; samples: Float32Array }>();
  private channels = new Map<string, Partial<ChannelParams>>();
  private masterP: Partial<MasterParams> = {};
  private listeners = new Map<keyof StudioEvents, Set<(...a: never[]) => void>>();
  private _playing = false; private _pos = 0; private _waiting: string | null = null;

  private ctx: () => AudioContext; private moduleUrl: URL; private wasmUrl: URL;
  constructor(ctx: () => AudioContext, moduleUrl: URL, wasmUrl: URL) { this.ctx = ctx; this.moduleUrl = moduleUrl; this.wasmUrl = wasmUrl; }

  on<K extends keyof StudioEvents>(ev: K, cb: StudioEvents[K]): () => void {
    let set = this.listeners.get(ev); if (!set) { set = new Set(); this.listeners.set(ev, set); }
    set.add(cb as (...a: never[]) => void); return () => { set.delete(cb as (...a: never[]) => void); };
  }
  private emit<K extends keyof StudioEvents>(ev: K, ...args: Parameters<StudioEvents[K]>): void { for (const cb of this.listeners.get(ev) ?? []) (cb as (...a: unknown[]) => void)(...args); }

  get playing(): boolean { return this._playing; }
  get position(): number { return this._pos; }
  get waiting(): string | null { return this._waiting; }
  get timeline(): TimelineMsg | null { return this.tl; }
  hasChunk(key: string): boolean { return this.chunks.has(key); }

  private wasmModule(): Promise<WebAssembly.Module> {
    return (this.wasm ??= fetch(this.wasmUrl).then(async (r) => { if (!r.ok) throw new Error(`TinySoundFont (standalone): HTTP ${r.status}`); return WebAssembly.compile(await r.arrayBuffer()); }));
  }
  /** 装好 worklet + WASM（第一次用才做；AudioContext 可以还没解锁）。 */
  ensure(): Promise<void> {
    if (this.readyP) return this.readyP;
    this.readyP = (async () => {
      const ctx = this.ctx();
      const [, module] = await Promise.all([ctx.audioWorklet.addModule(this.moduleUrl.href), this.wasmModule()]);
      const node = new AudioWorkletNode(ctx, "studio", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { module } });
      await new Promise<void>((ok, fail) => {
        node.port.onmessage = (e: MessageEvent<StudioOut>) => {
          const m = e.data;
          switch (m.type) {
            case "ready": ok(); return;
            case "banked": { this.presets.set(m.sha, new Map(m.presets.map(([b, p], i) => [`${b}:${p}`, i]))); for (const w of this.bankWait.get(m.sha) ?? []) w.ok(); this.bankWait.delete(m.sha); return; }
            case "error": { fail(new Error(m.message)); for (const ws of this.bankWait.values()) for (const w of ws) w.fail(new Error(m.message)); this.bankWait.clear(); return; }
            case "pos": this._pos = m.sec; this._playing = m.playing; this._waiting = m.waiting; this.emit("pos", m.sec, m.playing, m.waiting); return;
            case "ended": this._playing = false; this.emit("ended"); return;
            case "missing": this.emit("missing", m.keys); return;
            case "meter": this.emit("meter", m.peak, m.active); return;
          }
        };
      });
      node.connect(ctx.destination);
      this.node = node;
      // 装之前记下的状态照发（元音表 / 库 / 通道 / 总轨 / 时间线 / 块）
      if (this.vowelTable) this.post({ type: "vowels", ...this.vowelTable });
      for (const [sha, bytes] of this.bankBytes) this.post({ type: "bank", sha, bytes: bytes.slice() });
      for (const [id, p] of this.channels) this.post({ type: "channel", id, p });
      if (Object.keys(this.masterP).length) this.post({ type: "master", p: this.masterP });
      if (this.tl) this.post({ type: "timeline", tl: this.tl });
      for (const [key, c] of this.chunks) this.post({ type: "chunk", key, sr: c.sr, samples: c.samples });
    })().catch((e) => { this.readyP = null; throw e; });
    return this.readyP;
  }
  private post(m: StudioIn, transfer: Transferable[] = []): void { this.node?.port.postMessage(m, transfer); }

  /** 载一份 sf2（按 sha 留着，多份并存；同一份不重载）。resolve = worklet 里装好了（预设表可查）。 */
  async bank(sha: string, bytes: Uint8Array): Promise<void> {
    if (this.presets.has(sha)) return;
    const first = !this.bankBytes.has(sha); this.bankBytes.set(sha, bytes);
    await this.ensure();
    if (this.presets.has(sha)) return;
    const p = new Promise<void>((ok, fail) => { const ws = this.bankWait.get(sha) ?? []; ws.push({ ok, fail }); this.bankWait.set(sha, ws); });
    if (first || !this.bankWait.get(sha)?.length) { /* 装的时候已经在 ensure 里发过一次（bankBytes 先记）；这里补发是幂等的 */ }
    this.post({ type: "bank", sha, bytes: bytes.slice() });
    return p;
  }
  hasBank(sha: string): boolean { return this.presets.has(sha); }
  /** 预设下标（这份库里按 bank:program 找；没有 = −1）。 */
  presetIndex(sha: string, bank: number, program: number): number { return this.presets.get(sha)?.get(`${bank}:${program}`) ?? -1; }
  unbank(sha: string): void { this.presets.delete(sha); this.bankBytes.delete(sha); this.post({ type: "unbank", sha }); }
  vowels(t: VowelTableMsg): void { this.vowelTable = t; this.post({ type: "vowels", ...t }); }

  setTimeline(tl: TimelineMsg): void { this.tl = tl; this.post({ type: "timeline", tl }); }
  /** 喂一块（samples 拷一份转移过去；这边留原件给离线导出）。 */
  chunk(key: string, sr: number, samples: Float32Array): void {
    this.chunks.set(key, { sr, samples });
    const copy = samples.slice(); this.post({ type: "chunk", key, sr, samples: copy }, [copy.buffer]);
  }
  forget(keys: string[]): void { for (const k of keys) this.chunks.delete(k); this.post({ type: "forget", keys }); }
  channel(id: string, p: Partial<ChannelParams>): void { this.channels.set(id, { ...this.channels.get(id), ...p }); this.post({ type: "channel", id, p }); }
  master(p: Partial<MasterParams>): void { this.masterP = { ...this.masterP, ...p }; this.post({ type: "master", p }); }

  /** 从 at 秒放起（不给 = 从范围头 / 上次位置）。要先在用户手势里解锁过 AudioContext（iPad）。 */
  async play(at?: number): Promise<void> { await this.ensure(); this._playing = true; this._waiting = null; if (at !== undefined) this._pos = at; this.post({ type: "play", at }); }
  stop(): void { this._playing = false; this._waiting = null; this.post({ type: "stop" }); }
  seek(at: number): void { this._pos = at; this.post({ type: "seek", at }); }
  /** 按键试听（要先 ensure 过；没装好的这一下丢掉——试听要即时，迟到的音更烦）。 */
  audition(m: Omit<Extract<StudioIn, { type: "audition" }>, "type">): void { if (this.node) this.post({ type: "audition", ...m }); }
  auditionOn(src: string, inst: AuditionInst, key: number, vel: number, gainDb: number, pan: number): void { this.audition({ src, ev: "on", inst, key, vel, gainDb, pan }); }
  auditionOff(src: string): void { this.audition({ src, ev: "off" }); }
  auditionGlide(src: string, key: number): void { this.audition({ src, ev: "glide", key }); }
  auditionAllOff(): void { this.audition({ src: "", ev: "alloff" }); }
  /** 放一段现成的声音当试听（月读唱的一个字；samples 转移过去）。 */
  auditionClip(src: string, sr: number, samples: Float32Array, gainDb: number, pan: number): void { if (!this.node) return; const copy = samples.slice(); this.post({ type: "auditionClip", src, sr, samples: copy, gainDb, pan }, [copy.buffer]); }
  meter(on: boolean): void { this.post({ type: "meter", on }); }
  get now(): number { return this.ctx().currentTime; }

  /** 离线导出：同一个 Studio 类在主线程循环里跑同样的块网格（每 400 块让一次事件循环，界面不卡）。输出从 range.from 起、扣掉限幅器的延迟。
   *  tl 不给 = 现在的时间线；progress(0…1)。 */
  async renderOffline(tl: TimelineMsg | null = this.tl, o: { sr?: number; progress?: (f: number) => void } = {}): Promise<{ left: Float32Array; right: Float32Array; sr: number; start: number }> {
    if (!tl) throw new Error("studio: no timeline to render");
    const sr = o.sr ?? 44100, tsf = await instantiateTsf(await this.wasmModule());
    let ended = false;
    const s = new Studio(sr, tsf, (m) => { if (m.type === "ended") ended = true; });
    if (this.vowelTable) s.handle({ type: "vowels", ...this.vowelTable });
    for (const [sha, bytes] of this.bankBytes) s.handle({ type: "bank", sha, bytes });
    for (const [id, p] of this.channels) s.handle({ type: "channel", id, p });
    s.handle({ type: "master", p: this.masterP });
    s.handle({ type: "timeline", tl: { ...tl, loop: false } });
    for (const [key, c] of this.chunks) s.handle({ type: "chunk", key, sr: c.sr, samples: c.samples });
    const lat = s.latency, total = Math.ceil((tl.range.to - tl.range.from) * sr) + lat + Math.ceil(2.5 * sr);   // + 尾巴上限
    const L = new Float32Array(total), R = new Float32Array(total), bl = new Float32Array(BLOCK), br = new Float32Array(BLOCK);
    s.handle({ type: "play", at: tl.range.from });
    let n = 0, k = 0;
    while (!ended && n < total) {
      const cnt = Math.min(BLOCK, total - n);
      s.render(bl, br, cnt); L.set(bl.subarray(0, cnt), n); R.set(br.subarray(0, cnt), n); n += cnt;
      if (s.waitingFor) throw new Error(`studio: chunk ${s.waitingFor} missing for export`);
      if (++k % 400 === 0) { o.progress?.(Math.min(1, n / total)); await new Promise<void>((r) => setTimeout(r, 0)); }
    }
    o.progress?.(1);
    const len = Math.max(0, n - lat);
    return { left: L.slice(lat, lat + len), right: R.slice(lat, lat + len), sr, start: tl.range.from };
  }
}
