// render.ts —— 无头渲染核心：「这首歌 → 谁上场 → 拿字节 / 准备 → 时间线 → 慢引擎的块 → 通道 / 总线 / 总轨 → 混」这一串，**不认宿主**。
//   created 2026-10-16 by Claude Fable 5.1（W-38 ⑤⑥；远景 `ai-docs/20261013-vision-epochs-and-refactor.md` §3 ③「无头渲染」）。
//   user 2026-10-13：「其实我蛮想要一个node能跑的无ui的渲染核心的这样agent或者人类拿到歌可以本地跑，还可以锁引擎的版本」。
//   两个调用方：浏览器（src/app/performance.ts：播放的准备 / mp3 导出 / 定稿）和 node 命令行（scripts/render-song.mjs）。
//   这里只 import 纯的东西（score / engine / performers / format）：没有 DOM、没有 worker、没有 fetch——录音房 / 唱 / 音源都从 RenderDeps 注入。
//   出声的数学一行不在这里（时间线 timeline.ts、录音房 studio.ts、唱法核心 sing-core.mjs）；这里是把它们接起来的那根线。
import { _t } from "../i18n/index.ts";
import type { VelCurve } from "../gm/sf2-subset.ts";
import type { BankLookup } from "../performers/registry.ts";
import { type Song, type PartDef, headLen, tempoAt } from "../score/song.ts";
import { songPlayOrder, parseArrangement } from "../score/arrange.ts";
import { grooveCategory, followOf } from "../score/groove.ts";
import { midiOf } from "../score/pitch.ts";
import type { Hum } from "../format/contract.ts";
import { activeGm, activeInstrument, activeHum, activeCalibrationDb, activeVelocity, perfSpecOf, activeTranspose, activeMaster, studioTrack, studioTracks, activeChain, activeId, type Extras, type GmCandidate } from "../format/project.ts";
import { performerOf } from "../performers/index.ts";
import { buildTimeline, LEAD_IN, type Timeline, type PerformerInfo } from "../engine/timeline.ts";
import { resolveChain, lowestMidiOf, songBpm, HOST_PARAMS } from "../engine/chain.ts";
import { FX_KINDS } from "../engine/fx.ts";
import type { TimelineMsg, ChannelParams, BusSpec, MasterParams } from "../engine/studio.ts";
import type { VowelTableMsg } from "../engine/studio-client.ts";   // 只要类型（元音表的形状）；运行时不碰 studio-client（它要 AudioWorklet）
import type { BuiltinLib } from "../sources/removed.ts";   // 只要类型

/** 录音房的离线面：浏览器的 StudioClient 和 node 的 OfflineStudio 都长这样（结构类型）。 */
export interface RenderEngine {
  hasBank(sha: string): boolean;
  bank(sha: string, bytes: Uint8Array): Promise<void>;
  presetIndex(sha: string, bank: number, program: number): number;
  /** 这一份库里一个预设的 L 曲线（7-N；库没载 = null）。 */
  velCurve(sha: string, bank: number, program: number): VelCurve | null;
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
  /** 出声的声部（已经按静音 / 独奏筛过；audibleParts 算）。 */
  parts: readonly PartDef[];
  /** 效果全关（A/B，播放用；导出 / 定稿一律 false）。 */
  mixBypass?: boolean;
  /** 静音的混音轨（视图态）。 */
  busMuted?: ReadonlySet<string>;
}
export interface PrepareError { part: string; cand: string; why: string; /** 用的自带库被人删了（错上带着的种类，v0.17.25）。 */ lib?: BuiltinLib }

/** 整首唱时给唱法核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）；leadIn 明说（块按它摆）。歌级；小月相自己的旋钮在候选里（performers/tsukuyomi.ts info → ChunkPlan.opt）。 */
export const humOpt = (): Record<string, unknown> => ({ humNasal: "N_m", humConsMin: 0.07, leadIn: LEAD_IN });
export const RENDER_SR = 44100;   // 导出 / 定稿的采样率

/** 出声的声部：有独奏的只出独奏的，否则出没静音的。 */
export function audibleParts(song: Song, pv: PartAudible): PartDef[] {
  const solo = song.parts.some((p) => pv(p.id).solo);
  return song.parts.filter((p) => (solo ? pv(p.id).solo : !pv(p.id).muted));
}
/** 上场那位的出声参数（时间线不碰 Extras）。SoundFont 的预设下标要库先进录音房（prepareParts）。 */
export function performerInfoOf(extras: Extras, part: PartDef, banks: BankLookup): PerformerInfo {
  const role = part.role, eng = (activeInstrument(extras, role)?.engine ?? "unknown") as PerformerInfo["engine"], plugin = performerOf(eng), cat = grooveCategory(plugin?.grooveCategory ?? null, activeGm(extras, role));
  const own = plugin ? plugin.info({ extras, role, presetIndex: (s, b, p) => banks.presetIndex(s, b, p), velCurve: (s, b, p) => banks.velCurve(s, b, p) }) : { gm: null, chunk: "phrase" as const };   // 这位自己的那部分（gm / 分段唱 / 着力点）归插件
  const chk = perfSpecOf(extras, role), spec = chk?.ok ? chk.spec : null, velocity = activeVelocity(extras, role);
  // 送进录音房之前查一遍（统筹 2026-11-12 夜第 5 条；v0.17.42 起走拿规格的唯一的口 perfSpecOf）：这位的数缺了 / 不是数 = 规格不交出来、这个声部明着不出声、写清缺哪几个
  //   （时间线报进「不出声」那张清单），不在音频线程里抛
  const missing = [...(!plugin ? [] : !chk ? ["articulation"] : chk.ok ? [] : chk.problems), ...((own as { missing?: string[] }).missing ?? [])];   // 插件自己那份缺的（着力点表…）一起报
  for (const [k, v] of Object.entries((own as { singOpt?: Record<string, unknown> }).singOpt ?? {})) if (!Number.isFinite(v as number)) missing.push(`defaults.${k}`);   // 唱法核心的旋钮也一样：缺了不交给核心自己的默认
  if (plugin?.sound === "chunks" && !Number.isFinite((own as { outputGainDb?: number }).outputGainDb)) missing.push("instrument.outputGainDb");   // 按块出声的：块乘多少（16-4 B）
  const { missing: _m, ...ownRest } = own as typeof own & { missing?: string[] }, mixMissing = mixProblemsFor(extras, part);
  return { engine: eng, hum: activeHum(extras, role), plugin, spec, velocity, transpose: activeTranspose(extras, role), follow: (s) => followOf(s, cat), chain: activeChain(extras, role), ...ownRest, ...(missing.length ? { missing } : {}), ...(mixMissing.length ? { mixMissing } : {}) };
}
/** 这些声部上场那位各自的出声准备（SoundFont 子集进录音房 / 元音表 / …，归插件；找不到 = 那个声部报错、不出声，其余照放 = 换人的窄接口）。返回报错清单。 */
export async function prepareParts(parts: readonly PartDef[], extras: Extras, deps: Pick<RenderDeps, "engine" | "sounds">): Promise<PrepareError[]> {
  const errs: PrepareError[] = [];
  for (const part of parts) {
    const plugin = performerOf(activeInstrument(extras, part.role)?.engine); if (!plugin) continue;   // 没人上场：时间线会报
    try { await plugin.prepare({ extras, role: part.role, engine: deps.engine, resolveGmBytes: (g) => deps.sounds.resolveGmBytes(g), ensureVowels: () => deps.sounds.ensureVowels() }); }
    catch (e) { const lib = (e as { removedLib?: BuiltinLib }).removedLib; errs.push({ part: part.id, cand: activeId(extras, part.role), why: (e as Error).message, ...(lib ? { lib } : {}) }); }
  }
  return errs;
}
/** 录音房里这个声部的麦克风（增益 dB、声像 −1…1）；照写着的读（没有这条轨 = NaN：新建 / 门口都会建，到这儿还没有 = 缺数，mixProblemsFor 报）。 */
export function micOf(extras: Extras, part: PartDef): { gainDb: number; pan: number } {
  const m = studioTrack(extras, part.mic);
  return { gainDb: m ? m.gainDb : NaN, pan: m ? m.pan : NaN };
}
type Raw = Record<string, unknown>;
const finite = (v: unknown): boolean => typeof v === "number" && Number.isFinite(v);
/** 一条链上认得的效果缺的数（开关 + 参数表里每个参数；不认识的种类不算缺：原样带着、不出声）。 */
function fxGaps(chain: unknown): string[] {
  const out: string[] = [];
  for (const f of (Array.isArray(chain) ? chain : []) as Raw[]) {
    const def = f && FX_KINDS[String(f.kind)]; if (!def) continue;
    const p = (f.params ?? {}) as Raw, bad = [...(HOST_PARAMS[String(f.kind)] ?? []), ...def.params].map((d) => d.id).filter((k) => !finite(p[k]));
    if (typeof f.on !== "boolean") bad.push("on");
    if (bad.length) out.push(`${def.name}（${bad.join(" ")}）`);
  }
  return out;
}
/** 一条轨（歌手的 / 混音轨）自己缺的数：推子、声像、出到、旁通、每条发送的量、链上的效果。 */
function trackGaps(t: Raw): string[] {
  const bad = (["gainDb", "pan"] as const).filter((k) => !finite(t[k])) as string[];
  if (typeof t.to !== "string") bad.push("to");
  if (typeof t.bypass !== "boolean") bad.push("bypass");
  if (!Array.isArray(t.chain)) bad.push("chain");
  if (!Array.isArray(t.sends)) bad.push("sends"); else (t.sends as Raw[]).forEach((sd, i) => { if (!finite(sd?.gainDb)) bad.push(`sends[${i}].gainDb`); });
  return [...bad, ...fxGaps(t.chain)];
}
/** 总轨缺的数：增益、限幅开关、限幅器四个数、链上的效果。 */
function masterGaps(m: Raw | undefined): string[] {
  if (!m || typeof m !== "object") return ["master"];
  const lp = (m.limiterParams ?? {}) as Raw, bad: string[] = [];
  if (!finite(m.gainDb)) bad.push("gainDb");
  if (typeof m.limiter !== "boolean") bad.push("limiter");
  for (const k of ["ceiling", "attackMs", "releaseMs", "lookaheadMs"]) if (!finite(lp[k])) bad.push(`limiterParams.${k}`);
  if (!Array.isArray(m.chain)) bad.push("chain");
  return [...bad, ...fxGaps(m.chain)];
}
const rawTracks = (extras: Extras): Raw[] => ((extras.studio as Raw | undefined)?.tracks as Raw[] | undefined)?.filter((t) => t && typeof t === "object") ?? [];
/** 这个声部的声音一路经过的录音房里缺的数（16-4 A2；和乐手身上的缺数同一处查——送进录音房之前，performerInfoOf）：
 *  它自己的轨、出到 / 发给的每一条混音轨（一路往下）、总轨。缺了 = 这个声部明着不出声，清单里写在哪、缺哪几个；音频线程不抛、不替它补。 */
export function mixProblemsFor(extras: Extras, part: PartDef): string[] {
  const tracks = rawTracks(extras), byId = new Map(tracks.map((t) => [String(t.id), t])), out: string[] = [];
  const own = byId.get(part.mic);
  if (!own) return [_t("这个声部的轨（没有）")];
  const say = (where: string, gaps: string[]) => { if (gaps.length) out.push(`${where}：${gaps.join("、")}`); };
  say(_t("这个声部的轨"), trackGaps(own));
  const seen = new Set<string>(), next = (t: Raw): string[] => [...(typeof t.to === "string" && t.to !== "master" ? [t.to] : []), ...((Array.isArray(t.sends) ? t.sends : []) as Raw[]).map((sd) => String(sd?.to))];
  const todo = next(own);
  while (todo.length) { const id = todo.shift()!; if (seen.has(id)) continue; seen.add(id); const b = byId.get(id); if (!b || b.kind !== "bus") continue; say(_t("混音轨「{name}」", { name: String(b.name ?? id) }), trackGaps(b)); todo.push(...next(b)); }
  say(_t("总轨"), masterGaps((extras.studio as Raw | undefined)?.master as Raw | undefined));
  return out;
}
/** 这条通道 = 麦克风增益 + 上场那位的响度校准（三层不连乘：音符力度 = 意图；校准 = 看得见能调的默认；推子 = dB）。 */
export const channelOf = (extras: Extras, part: PartDef): { gainDb: number; pan: number } => { const { gainDb, pan } = micOf(extras, part); return { gainDb: gainDb + activeCalibrationDb(extras, part.role), pan }; };
/** 这位歌手全曲最低的音、歌开头的速度：住在 engine/chain.ts（存档也要用，16-5）。 */
export { lowestMidiOf, songBpm };
/** 通道 / 总线 / 总轨的参数（录音房认的样子）：插件里「主线程换算」的参数（自动低切 = 这位最低的音、延迟跟速度）换成数；效果全关 = 插件格和发送都不响、推子 / 声像 / 出到 / 限幅留着。 */
export function mixParamsOf(plan: RenderPlan, pv: PartAudible): { channels: { id: string; p: Partial<ChannelParams> }[]; buses: BusSpec[]; master: MasterParams | null } {
  const { song, extras } = plan, raw = !!plan.mixBypass;
  const bpm = songBpm(song), ctx = (lowestMidi: number | null) => ({ lowestMidi, bpm }), fx = <T,>(x: T[]): T[] => (raw ? [] : x);
  // 缺数的不送（16-4 A2）：用到它的声部在 performerInfoOf 里已经报了缺数、不出声；这里只是不把 NaN 交给录音房
  const okTrack = new Set(rawTracks(extras).filter((t) => !trackGaps(t).length).map((t) => String(t.id)));
  const channels = song.parts.filter((p) => okTrack.has(p.mic)).map((p) => { const t = studioTrack(extras, p.mic)!; return { id: p.id, p: { ...channelOf(extras, p), mute: pv(p.id).muted, solo: pv(p.id).solo, chain: fx(resolveChain(t.chain, ctx(lowestMidiOf(song, p.id)))), sends: fx(t.sends), to: t.to } }; });
  const buses = studioTracks(extras).filter((t) => t.kind === "bus" && okTrack.has(t.id)).map((b): BusSpec => ({ id: b.id, gainDb: b.gainDb, pan: b.pan, chain: b.bypass ? [] : fx(resolveChain(b.chain, ctx(null))), to: b.to, sends: fx(b.sends), ...(plan.busMuted?.has(b.id) ? { mute: true } : {}) }));   // 混音轨旁通 = 插件全跳过，推子 / 发送照旧   // 总线也能出到 / 发给别的总线（v0.10.9）
  const m = activeMaster(extras), mOk = !masterGaps((extras.studio as Raw | undefined)?.master as Raw | undefined).length;
  return { channels, buses, master: mOk ? { ...m, chain: fx(resolveChain(m.chain, ctx(null))) } : null };
}
/** 通道参数推进录音房（播放时才乘 → 边放边调立刻听见；静音 / 独奏在 audibleParts 里筛，不在通道上）。 */
export function pushMix(engine: RenderEngine, plan: RenderPlan, pv: PartAudible): void {
  const m = mixParamsOf(plan, pv);
  for (const c of m.channels) engine.channel(c.id, c.p);
  engine.buses(m.buses);
  if (m.master) engine.master(m.master);
}
/** 这首歌（出声的声部）的时间线：谁上场 / 分段 / 音符表 / 块清单。纯函数（除了预设下标 / L 曲线要问录音房里的库）。 */
export function timelineOf(plan: RenderPlan, banks: BankLookup): Timeline {
  const { song } = plan;
  return buildTimeline({ song, order: songPlayOrder(song), parts: [...plan.parts], info: (part) => performerInfoOf(plan.extras, part, banks), singOpt: humOpt() });
}

/** 循环按谱绕的那一圈（谱上的秒）：从第一张纸头（编排写了 `[循环段]` 且 withArrangementLoop = 循环段第一张纸的头）到谱的结尾。
 *  余音（最后一个音之后的释放、混响尾巴）不在里面——下一圈开头接上去（编辑器的循环）或者切掉（歌库的 mp3 循环）。
 *  编辑器（performance.ts playRange）和渲出来的 mp3（renderSong 的 loop）共用这一份。2026-11-11 Claude Opus 5.5（user「歌库播放的loop的时间好像算错了…你不应该等小尾巴吧」）。 */
export function loopSpanOf(song: Song, tl: Timeline, withArrangementLoop = true): { from: number; to: number } {
  let from = tl.papers[0]?.t0 ?? 0;
  const a = parseArrangement(song.arrangement, song.papers);
  if (withArrangementLoop && a.loop && tl.papers[a.order.length]) from = tl.papers[a.order.length].t0;
  return { from, to: tl.total > from ? tl.total : tl.range.to };
}
/** loop = 渲出来的声音里循环那一圈的起止（**输出里的秒**，0 = 输出第一个样本）；太短 / 落在声音外面 = null（就按整个文件循环）。 */
export interface RenderResult { left: Float32Array; right: Float32Array; sr: number; secs: number; timeline: Timeline; errors: PrepareError[]; loop: { start: number; end: number } | null }
/** 整首（或一段）渲染成立体声样本：准备 → 时间线 → 块 → 混（和播放同一个类、同一份数学）。
 *  没法出声的声部报在 errors / timeline.unplayable 里、其余照混；一个都放不了 = 抛。pv = 静音 / 独奏（通道上的 mute / solo；筛声部用 plan.parts）。 */
export async function renderSong(plan: RenderPlan, deps: RenderDeps, o: { sr?: number; progress?: (msg: string, frac?: number) => void; pv?: PartAudible;
  /** 准备完、时间线算好那一刻（宿主记清单 §2.2½ 用）；一个都放不了也先叫它再抛。 */ onPrepared?: (errors: PrepareError[], tl: Timeline) => void } = {}): Promise<RenderResult> {
  const pv: PartAudible = o.pv ?? (() => ({ muted: false, solo: false })), say = o.progress ?? (() => {});
  const errors = await prepareParts(plan.parts, plan.extras, deps);
  const tl = timelineOf(plan, deps.engine);
  o.onPrepared?.(errors, tl);
  if (!tl.tracks.length) throw new Error(_t("没有出声：{e}", { e: [...errors.map((e) => e.why), ...tl.unplayable.map((u) => u.why)].join("；") || _t("没有会出声的声部") }));
  if (tl.chunks.length) await deps.sing(tl, (m) => say(m));
  pushMix(deps.engine, { ...plan, mixBypass: false }, pv);   // 导出照常带效果（A/B 的「效果全关」只管播放）
  say(_t("混音…"), 0);
  const m = await deps.engine.renderOffline({ tracks: tl.tracks, range: tl.range, loop: false }, { sr: o.sr ?? RENDER_SR, progress: (f) => say(_t("混音…"), f) });
  const secs = m.left.length / m.sr, span = loopSpanOf(plan.song, tl), start = Math.max(0, span.from - m.start), end = Math.min(secs, span.to - m.start);
  return { left: m.left, right: m.right, sr: m.sr, secs, timeline: tl, errors, loop: end - start >= 0.25 ? { start, end } : null };
}
/** 立体声 → 单声道（左右平均）。 */
export function toMono(left: Float32Array, right: Float32Array): Float32Array { const out = new Float32Array(left.length); for (let i = 0; i < out.length; i++) out[i] = (left[i] + right[i]) / 2; return out; }
