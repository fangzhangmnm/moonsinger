// offline-studio.ts —— 录音房的纯离线面（node / 测试用；不要 AudioWorklet、不要 AudioContext）：同一个 Studio 类在循环里跑，和浏览器的 StudioClient.renderOffline 同一个块网格、同一份数学。
//   created 2026-10-16 by Claude Fable 5.1（W-38 ⑤ 无头渲染核心的 node 后端；RenderEngine 的第二个实现，第一个 = src/engine/studio-client.ts）。
//   做法和 StudioClient.renderOffline 一样：平时只记状态（库字节 / 元音表 / 块 / 通道 / 总线 / 总轨），renderOffline 那一刻新开一个 Studio 把状态灌进去、从头跑到尾。
import { instantiateTsf, type Tsf } from "../gm/tsf-standalone.ts";
import { Studio, BLOCK, packInt16, type TimelineMsg, type ChannelParams, type MasterParams, type BusSpec } from "../engine/studio.ts";
import type { VowelTableMsg } from "../engine/studio-client.ts";
import type { RenderEngine } from "./render.ts";

export class OfflineStudio implements RenderEngine {
  private tsfP: Promise<Tsf>;
  private presets = new Map<string, Map<string, number>>();   // sha → "bank:program" → 预设下标
  private bankBytes = new Map<string, Uint8Array>();
  private vowelTable: VowelTableMsg | null = null;
  private chunks = new Map<string, { sr: number; samples: Int16Array; k?: number }>();
  private channels = new Map<string, Partial<ChannelParams>>();
  private masterP: Partial<MasterParams> = {};
  private busesP: BusSpec[] = [];
  /** wasm = TinySoundFont 独立 WASM 的字节或编好的模块（vendor/tsf/tsf-standalone.wasm）。 */
  constructor(wasm: WebAssembly.Module | BufferSource) { this.tsfP = instantiateTsf(wasm); }

  hasBank(sha: string): boolean { return this.presets.has(sha); }
  /** 载一份 sf2：先在一个临时 Studio 里装一次拿预设表（和录音房同一个 tsf.load），字节留着 renderOffline 再装。 */
  async bank(sha: string, bytes: Uint8Array): Promise<void> {
    if (this.presets.has(sha)) return;
    const tsf = await this.tsfP, b = tsf.load(bytes, 44100);
    if (!b) throw new Error(`studio: not a SoundFont 2 file (${sha.slice(0, 12)})`);
    this.presets.set(sha, new Map(b.presets.map((p) => [`${p.bank}:${p.program}`, p.index])));
    tsf.close(b);
    this.bankBytes.set(sha, bytes);
  }
  presetIndex(sha: string, bank: number, program: number): number { return this.presets.get(sha)?.get(`${bank}:${program}`) ?? -1; }
  vowels(t: VowelTableMsg): void { this.vowelTable = t; }
  hasChunk(key: string): boolean { return this.chunks.has(key); }
  chunk(key: string, sr: number, samples: Float32Array | Int16Array): void {
    const p = samples instanceof Int16Array ? { s: samples, k: 1 } : packInt16(samples);
    this.chunks.set(key, { sr, samples: p.s, ...(p.k !== 1 ? { k: p.k } : {}) });
  }
  forget(keys: string[]): void { for (const k of keys) this.chunks.delete(k); }
  channel(id: string, p: Partial<ChannelParams>): void { this.channels.set(id, { ...this.channels.get(id), ...p }); }
  master(p: Partial<MasterParams>): void { this.masterP = { ...this.masterP, ...p }; }
  buses(b: BusSpec[]): void { this.busesP = b; }

  /** 同 StudioClient.renderOffline：输出从 range.from 起、扣掉限幅器的延迟；每 400 块让一次事件循环。 */
  async renderOffline(tl: TimelineMsg, o: { sr?: number; progress?: (f: number) => void } = {}): Promise<{ left: Float32Array; right: Float32Array; sr: number; start: number }> {
    const sr = o.sr ?? 44100, tsf = await this.tsfP;
    let ended = false;
    const s = new Studio(sr, tsf, (m) => { if (m.type === "ended") ended = true; if (m.type === "error") throw new Error(m.message); });
    if (this.vowelTable) s.handle({ type: "vowels", ...this.vowelTable });
    for (const [sha, bytes] of this.bankBytes) s.handle({ type: "bank", sha, bytes });
    for (const [id, p] of this.channels) s.handle({ type: "channel", id, p });
    s.handle({ type: "buses", buses: this.busesP });
    s.handle({ type: "master", p: this.masterP });
    s.handle({ type: "timeline", tl: { ...tl, loop: false } });
    for (const t of tl.tracks) if (t.kind === "clips") for (const c of t.clips) { const ch = this.chunks.get(c.key); if (ch) s.handle({ type: "chunk", key: c.key, sr: ch.sr, samples: ch.samples, ...(ch.k ? { k: ch.k } : {}) }); }
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
