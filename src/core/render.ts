// render.ts —— 无头渲染核心：「这首歌 → 谁上场 → 拿字节 / 准备 → 时间线 → 慢引擎的块 → 通道 / 总线 / 总轨 → 混」这一串，**不认宿主**。
//   created 2026-10-16 by Claude Fable 5.1（W-38 ⑤⑥；远景 `ai-docs/20261013-vision-epochs-and-refactor.md` §3 ③「无头渲染」）。
//   user 2026-10-13：「其实我蛮想要一个node能跑的无ui的渲染核心的这样agent或者人类拿到歌可以本地跑，还可以锁引擎的版本」。
//   两个调用方：浏览器（src/app/performance.ts：播放的准备 / mp3 导出 / 定稿）和 node 命令行（scripts/render-song.mjs）。
//   这里只 import 纯的东西（score / engine / performers / format）：没有 DOM、没有 worker、没有 fetch——录音房 / 唱 / 音源都从 RenderDeps 注入。
//   出声的数学一行不在这里（时间线 timeline.ts、录音房 studio.ts、唱法核心 sing-core.mjs）；这里是把它们接起来的那根线。
import { type Song, type PartDef, headLen, tempoAt } from "../score/song.ts";
import { songPlayOrder } from "../score/arrange.ts";
import { grooveCategory, followOf } from "../score/groove.ts";
import { midiOf } from "../score/pitch.ts";
import type { Hum } from "../format/contract.ts";
import { activeGm, activeInstrument, activeCalibrationDb, activeVelocity, activePerfSpec, activeTranspose, activeMaster, studioTrack, studioTracks, activeChain, activeId, type Extras, type GmCandidate } from "../format/project.ts";
import { performerOf } from "../performers/index.ts";
import { buildTimeline, LEAD_IN, type Timeline, type PerformerInfo } from "../engine/timeline.ts";
import { resolveChain } from "../engine/chain.ts";
import type { TimelineMsg, ChannelParams, BusSpec, MasterParams } from "../engine/studio.ts";
import type { VowelTableMsg } from "../engine/studio-client.ts";   // 只要类型（元音表的形状）；运行时不碰 studio-client（它要 AudioWorklet）

/** 录音房的离线面：浏览器的 StudioClient 和 node 的 OfflineStudio 都长这样（结构类型）。 */
export interface RenderEngine {
  hasBank(sha: string): boolean;
  bank(sha: string, bytes: Uint8Array): Promise<void>;
  presetIndex(sha: string, bank: number, program: number): number;
  vowels(t: VowelTableMsg): void;
  hasChunk(key: string): boolean;
  chunk(key: string, sr: number, samples: Float32Array | Int16Array): void;
  channel(id: string, p: Partial<ChannelParams>): void;
  buses(b: BusSpec[]): void;
  master(p: Partial<MasterParams>): void;
  renderOffline(tl: TimelineMsg, o?: { sr?: number; progress?: (f: number) => void }): Promise<{ left: Float32Array; right: Float32Array; sr: number; start: number }>;
}
/** 音源 / 元音表从哪来（浏览器 = src/sources/sounds.ts + vowel-table.ts；node = 文件 / fetch）。 */
export interface RenderSounds {
  resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
  /** 元音表装进录音房（装过就不装）。 */
  ensureVowels(): Promise<void>;
}
export interface RenderDeps {
  engine: RenderEngine;
  sounds: RenderSounds;
  /** 慢引擎的块：把时间线里录音房还没有的块唱出来、`engine.chunk()` 喂进去（浏览器 = performance.ts 的泵；node = 顺序 singCore）。唱不了的一句 = 抛（整次渲染失败）或喂一块空的（那句空着）——由实现定。 */
  sing(tl: Timeline, progress: (msg: string) => void): Promise<void>;
}
/** 每个声部的视图态（静音 / 独奏）：出声的声部 = 有独奏的只出独奏的，否则出没静音的（user「不同的声部视图和出声应该分别可以solo和hide」）。 */
export type PartAudible = (partId: string) => { muted: boolean; solo: boolean };
export interface RenderPlan {
  song: Song;
  extras: Extras;
  hum: Hum;
  /** 出声的声部（已经按静音 / 独奏筛过；audibleParts 算）。 */
  parts: readonly PartDef[];
  /** 效果全关（A/B，播放用；导出 / 定稿一律 false）。 */
  mixBypass?: boolean;
  /** 静音的混音轨（视图态）。 */
  busMuted?: ReadonlySet<string>;
}
export interface PrepareError { part: string; cand: string; why: string }

/** 整首唱时给唱法核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）；leadIn 明说（块按它摆）。歌级；小月相自己的旋钮在候选里（performers/tsukuyomi.ts info → ChunkPlan.opt）。 */
export const humOpt = (): Record<string, unknown> => ({ humNasal: "N_m", humConsMin: 0.07, leadIn: LEAD_IN });
export const RENDER_SR = 44100;   // 导出 / 定稿的采样率

/** 出声的声部：有独奏的只出独奏的，否则出没静音的。 */
export function audibleParts(song: Song, pv: PartAudible): PartDef[] {
  const solo = song.parts.some((p) => pv(p.id).solo);
  return song.parts.filter((p) => (solo ? pv(p.id).solo : !pv(p.id).muted));
}
/** 上场那位的出声参数（时间线不碰 Extras）。SoundFont 的预设下标要库先进录音房（prepareParts）。 */
export function performerInfoOf(extras: Extras, part: PartDef, presetIndex: (sha: string, bank: number, program: number) => number): PerformerInfo {
  const role = part.role, eng = (activeInstrument(extras, role)?.engine ?? "unknown") as PerformerInfo["engine"], plugin = performerOf(eng), cat = grooveCategory(plugin?.grooveCategory ?? null, activeGm(extras, role));
  const own = plugin ? plugin.info({ extras, role, presetIndex }) : { gm: null, chunk: "phrase" as const };   // 这位自己的那部分（gm / 分段唱 / 着力点）归插件
  return { engine: eng, plugin, spec: activePerfSpec(extras, role), velocity: activeVelocity(extras, role), transpose: activeTranspose(extras, role), follow: (s) => followOf(s, cat), chain: activeChain(extras, role), ...own };
}
/** 这些声部上场那位各自的出声准备（SoundFont 子集进录音房 / 元音表 / …，归插件；找不到 = 那个声部报错、不出声，其余照放 = 换人的窄接口）。返回报错清单。 */
export async function prepareParts(parts: readonly PartDef[], extras: Extras, deps: Pick<RenderDeps, "engine" | "sounds">): Promise<PrepareError[]> {
  const errs: PrepareError[] = [];
  for (const part of parts) {
    const plugin = performerOf(activeInstrument(extras, part.role)?.engine); if (!plugin) continue;   // 没人上场：时间线会报
    try { await plugin.prepare({ extras, role: part.role, engine: deps.engine, resolveGmBytes: (g) => deps.sounds.resolveGmBytes(g), ensureVowels: () => deps.sounds.ensureVowels() }); }
    catch (e) { errs.push({ part: part.id, cand: activeId(extras, part.role), why: (e as Error).message }); }
  }
  return errs;
}
/** 录音房里这个声部的麦克风（增益 dB、声像 −1…1）；没有 = 0 / 0。 */
export function micOf(extras: Extras, part: PartDef): { gainDb: number; pan: number } {
  const m = studioTrack(extras, part.mic);
  return { gainDb: m?.gainDb ?? 0, pan: m?.pan ?? 0 };
}
/** 这条通道 = 麦克风增益 + 上场那位的响度校准（三层不连乘：音符力度 = 意图；校准 = 看得见能调的默认；推子 = dB）。 */
export const channelOf = (extras: Extras, part: PartDef): { gainDb: number; pan: number } => { const { gainDb, pan } = micOf(extras, part); return { gainDb: gainDb + activeCalibrationDb(extras, part.role), pan }; };
/** 这位歌手全曲最低的音（自动低切用；没有音 = null）。 */
export function lowestMidiOf(song: Song, partId: string): number | null {
  let lo: number | null = null;
  for (const pp of song.papers) for (const t of pp.tracks[partId] ?? []) if (t.kind === "note" && t.pitch) for (const q of [t.pitch, ...(t.chord ?? [])]) { const m = midiOf(q); if (lo === null || m < lo) lo = m; }
  return lo;
}
/** 歌开头的速度（延迟「跟速度」用）。 */
export function songBpm(song: Song): number { const p = song.papers[0], t = p ? p.tracks[song.parts.find((x) => p.tracks[x.id])?.id ?? ""] : undefined; return t ? tempoAt(t, headLen(t)) : 90; }
/** 通道 / 总线 / 总轨的参数（录音房认的样子）：插件里「主线程换算」的参数（自动低切 = 这位最低的音、延迟跟速度）换成数；效果全关 = 插件格和发送都不响、推子 / 声像 / 出到 / 限幅留着。 */
export function mixParamsOf(plan: RenderPlan, pv: PartAudible): { channels: { id: string; p: Partial<ChannelParams> }[]; buses: BusSpec[]; master: MasterParams } {
  const { song, extras } = plan, raw = !!plan.mixBypass;
  const bpm = songBpm(song), ctx = (lowestMidi: number | null) => ({ lowestMidi, bpm }), fx = <T,>(x: T[]): T[] => (raw ? [] : x);
  const channels = song.parts.map((p) => { const t = studioTrack(extras, p.mic); return { id: p.id, p: { ...channelOf(extras, p), mute: pv(p.id).muted, solo: pv(p.id).solo, chain: fx(resolveChain(t?.chain ?? [], ctx(lowestMidiOf(song, p.id)))), sends: fx(t?.sends ?? []), to: t?.to ?? "master" } }; });
  const buses = studioTracks(extras).filter((t) => t.kind === "bus").map((b): BusSpec => ({ id: b.id, gainDb: b.gainDb, pan: b.pan, chain: b.bypass ? [] : fx(resolveChain(b.chain, ctx(null))), to: b.to, sends: fx(b.sends), ...(plan.busMuted?.has(b.id) ? { mute: true } : {}) }));   // 混音轨旁通 = 插件全跳过，推子 / 发送照旧   // 总线也能出到 / 发给别的总线（v0.10.9）
  const m = activeMaster(extras);
  return { channels, buses, master: { ...m, chain: fx(resolveChain(m.chain, ctx(null))) } };
}
/** 通道参数推进录音房（播放时才乘 → 边放边调立刻听见；静音 / 独奏在 audibleParts 里筛，不在通道上）。 */
export function pushMix(engine: RenderEngine, plan: RenderPlan, pv: PartAudible): void {
  const m = mixParamsOf(plan, pv);
  for (const c of m.channels) engine.channel(c.id, c.p);
  engine.buses(m.buses);
  engine.master(m.master);
}
/** 这首歌（出声的声部）的时间线：谁上场 / 分段 / 音符表 / 块清单。纯函数（除了 presetIndex 要问录音房）。 */
export function timelineOf(plan: RenderPlan, presetIndex: RenderEngine["presetIndex"]): Timeline {
  const { song } = plan;
  return buildTimeline({ song, order: songPlayOrder(song), parts: [...plan.parts], info: (part) => performerInfoOf(plan.extras, part, presetIndex), hum: plan.hum, singOpt: humOpt() });
}

export interface RenderResult { left: Float32Array; right: Float32Array; sr: number; secs: number; timeline: Timeline; errors: PrepareError[] }
/** 整首（或一段）渲染成立体声样本：准备 → 时间线 → 块 → 混（和播放同一个类、同一份数学）。
 *  没法出声的声部报在 errors / timeline.unplayable 里、其余照混；一个都放不了 = 抛。pv = 静音 / 独奏（通道上的 mute / solo；筛声部用 plan.parts）。 */
export async function renderSong(plan: RenderPlan, deps: RenderDeps, o: { sr?: number; progress?: (msg: string, frac?: number) => void; pv?: PartAudible;
  /** 准备完、时间线算好那一刻（宿主记清单 §2.2½ 用）；一个都放不了也先叫它再抛。 */ onPrepared?: (errors: PrepareError[], tl: Timeline) => void } = {}): Promise<RenderResult> {
  const pv: PartAudible = o.pv ?? (() => ({ muted: false, solo: false })), say = o.progress ?? (() => {});
  const errors = await prepareParts(plan.parts, plan.extras, deps);
  const tl = timelineOf(plan, (sha, bank, program) => deps.engine.presetIndex(sha, bank, program));
  o.onPrepared?.(errors, tl);
  if (!tl.tracks.length) throw new Error(`没有出声：${[...errors.map((e) => e.why), ...tl.unplayable.map((u) => u.why)].join("；") || "没有会出声的声部"}`);
  if (tl.chunks.length) await deps.sing(tl, (m) => say(m));
  pushMix(deps.engine, { ...plan, mixBypass: false }, pv);   // 导出照常带效果（A/B 的「效果全关」只管播放）
  say("混音…", 0);
  const m = await deps.engine.renderOffline({ tracks: tl.tracks, range: tl.range, loop: false }, { sr: o.sr ?? RENDER_SR, progress: (f) => say("混音…", f) });
  return { left: m.left, right: m.right, sr: m.sr, secs: m.left.length / m.sr, timeline: tl, errors };
}
/** 立体声 → 单声道（左右平均）。 */
export function toMono(left: Float32Array, right: Float32Array): Float32Array { const out = new Float32Array(left.length); for (let i = 0; i < out.length; i++) out[i] = (left[i] + right[i]) / 2; return out; }
