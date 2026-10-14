// performance.ts —— 唱歌 / 播放 / 导出的胶水（屎山维护纪元刀 1 之二，2026-10-14 从 main.ts 抽出；created by Claude Fable 5.1；家族周账 F-13）。
//   谱 → 时间线（src/engine/timeline.ts）→ 录音房（src/engine/studio*.ts）这条路上「谁、什么时候、放哪一段」的决定都在这里：
//   出声参数（performerInfo）/ 各位的准备（prepareBanks → 插件）/ 月读的块：调度 + 泵（刀 2）/ 负载与内存监控（刀 6 ④）/ 走带（起点 · 续播 · 回起点 · 接缝 · 循环）/
//   播放头与翻谱 / 放着时改谱的重算 / 预唱 / mp3 导出 / 按键试听要的库。界面（钮、菜单、面板）和文件都不在这里——main.ts 通过 PerfHost 给访问器，这里只回调。
//   原文一字不改地搬过来（注释里的 user 原话与日期是搬家前的），只把 st / doc.extras / viewScope / busMuted 换成 host 的访问器；行为与 v0.12.1 相同。
//   形状 = createPerformance(host) → 一组函数 + 几个 getter / setter（走带态是这次打开里有效的东西，不进歌）。
import { APP_VERSION } from "../version.ts";
import { headLen, DEFAULT_TIME, WHOLE, isTimed, type EditorState, type Song, type PartDef, timeline, tempoAt, songOnlyPaper, flattenPart } from "../score/song.ts";
import { songPlayOrder, parseArrangement } from "../score/arrange.ts";
import { grooveCategory, followOf, timeMapOf } from "../score/groove.ts";
import { midiOf } from "../score/pitch.ts";
import { ScoreView } from "../ui/score-view.ts";
import { Singer } from "../singer/client.ts";
import { budgetFor, advise, trimOnSongSwitch, totalBytes, AUDIO_HOT, type DeviceInfo, type Snapshot } from "./resource-watch.ts";
import type { LoadInfo } from "../engine/studio-client.ts";
import { holdAudio, releaseAudio } from "../singer/audio.ts";
import { encodeMp3, MP3_QUALITY, type Mp3Quality } from "../export/mp3.ts";
import { id3v2, firstUrl } from "../export/id3.ts";
import { roleName, activeGm, activeInstrument, activeCalibrationDb, activeVelocity, activePerfSpec, activeTranspose, activeMaster, studioTrack, studioTracks, activeChain, type Extras, type GmCandidate } from "../format/project.ts";
import { performerCredits, licenseHints, creditsText, type CreditLine } from "../format/credits.ts";
import { StudioClient } from "../engine/studio-client.ts";
import { performerOf } from "../performers/index.ts";
import type { TrackSpec } from "../engine/studio.ts";
import { buildTimeline, LEAD_IN, PRE_ROLL, type Timeline, type PerformerInfo, type ChunkPlan } from "../engine/timeline.ts";
import { chunkOrder, readyToStart, prerollCount } from "../engine/scheduler.ts";
import { resolveChain } from "../ui/plugins.ts";
import { fileSafe, stampedCopy } from "./names.ts";
import { RenderProgress } from "../ui/render-progress.ts";
import { reportError, diagNote } from "./report-error.ts";
import { undo } from "../score/history.ts";

/** 胶水向宿主要的东西（main.ts 给）：状态只读访问器 + 几个界面 / 音源 / 署名的口；胶水不碰 DOM、不碰文件、不碰 undo。 */
export interface PerfHost {
  state(): EditorState;
  extras(): Extras;
  viewScope(): "all" | "segment";
  pv(id: string): { muted: boolean; solo: boolean };
  busMuted(): ReadonlySet<string>;
  curRole(): string;
  docName(): string;
  engine: StudioClient;
  singer: Singer;
  view: Pick<ScoreView, "setPlayhead" | "setStartMark">;
  ui: { progress(s: string): void; info(s: string): void; showError(s: string): void; renderBar: RenderProgress; playBtns(): HTMLElement[]; playIcon(playing: boolean): void; offerFile(file: File, title: string, msg: string): void };
  sounds: { resolveGmBytes(g: GmCandidate): Promise<Uint8Array>; ensureVowels(): Promise<void>; soundMemoryBytes(): number; modelBases(): string[] };
  credits: { creditsOf(roles: readonly string[], rights: string | undefined): { lines: CreditLine[] }; creditsBlock(lines: CreditLine[], title: string): string };
}

/** 渲染哪一段：view = 跟视图（本段 / 全部，播放用）；all = 整首；segment = 光标所在的这一张纸（导出面板里选）。 */
export type RenderScope = "view" | "all" | "segment";

export type Performance = ReturnType<typeof createPerformance>;

export function createPerformance(host: PerfHost) {
  const { engine, singer, view } = host;
  const { progress, info, showError, renderBar, playBtns, playIcon, offerFile } = host.ui;
  const { resolveGmBytes, ensureVowels, soundMemoryBytes, modelBases } = host.sounds;
  const { creditsOf, creditsBlock } = host.credits;
  const st = () => host.state(), extras = () => host.extras(), pv = (id: string) => host.pv(id), curRole = () => host.curRole(), docName = () => host.docName();
  void info;

  /** 整首唱时给核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）；leadIn 明说（块按它摆）。 */
  const humOpt = (): Record<string, unknown> => ({ humNasal: "N_m", humConsMin: 0.07, leadIn: LEAD_IN });
  /** 播放 / 试听的范围跟着视图走：本段 = 只有光标所在的纸；全部 = 整首（导出面板另选）。user 2026-10-08「为什么在本段视图下播放还是播放全部了？」 */
  const playSong = (): Song => (host.viewScope() === "segment" ? songOnlyPaper(st().song, st().at.paper) : st().song);
  /** 光标所在声部压平后的一串 + 速度表（找人视图「听开头」、测试钩子用）。 */
  const curFlat = () => { const s = playSong(), order = songPlayOrder(s); return { tokens: flattenPart(s, st().at.part, { order }).tokens, map: timeMapOf(s, order) }; };
  /** 渲染哪一段：view = 跟视图（本段 / 全部，播放用）；all = 整首；segment = 光标所在的这一张纸（导出面板里选）。 */
  const songIn = (s: RenderScope): Song => (s === "all" ? st().song : s === "segment" ? songOnlyPaper(st().song, st().at.paper) : playSong());
  const GM_SR = 44100;   // 导出的采样率
  /** 出声的声部：有独奏的只出独奏的，否则出没静音的（user「不同的声部视图和出声应该分别可以solo和hide」）。 */
  const audibleParts = (): PartDef[] => { const solo = st().song.parts.some((p) => pv(p.id).solo); return st().song.parts.filter((p) => (solo ? pv(p.id).solo : !pv(p.id).muted)); };
  /** 录音房里这个声部的麦克风（增益 dB、声像 −1…1）；没有 = 0 / 0。 */
  function micOf(part: PartDef): { gainDb: number; pan: number } {
    const m = studioTrack(extras(), part.mic);
    return { gainDb: m?.gainDb ?? 0, pan: m?.pan ?? 0 };
  }
  /** 这条通道 = 麦克风增益 + 上场那位的响度校准（三层不连乘：音符力度 = 意图；校准 = 看得见能调的默认；推子 = dB）。 */
  const channelOf = (part: PartDef): { gainDb: number; pan: number } => { const { gainDb, pan } = micOf(part); return { gainDb: gainDb + activeCalibrationDb(extras(), part.role), pan }; };
  /** 通道参数推进录音房（播放时才乘 → 边放边调立刻听见；静音 / 独奏在 audibleParts 里筛，不在通道上）。 */
  /** 效果全关（A/B，这次打开里有效、换歌复位；v0.10.18，user「混音台加一个暂时禁用所有魔法的toggle，不过fade和pan要不要留？（就是给你回到musescore/谱子本身用的，以及听差别）」）：
   *  所有插件格（歌手 / 混音轨 / 总轨）+ 所有发送不响；推子、声像、出到、总轨限幅留着（A/B 两边音量摆得一样，听的才是效果的差别）。导出照常带效果。 */
  let mixBypass = false;
  function pushChannels(raw = mixBypass): void {
    // 插件里「主线程换算」的参数（自动低切 = 这位最低的音、延迟跟速度）在这里换成录音房认的数（src/ui/plugins.ts resolveChain；v0.10.8）
    const bpm = songBpm(), ctx = (lowestMidi: number | null) => ({ lowestMidi, bpm }), fx = <T,>(x: T[]): T[] => (raw ? [] : x);
    for (const p of st().song.parts) { const t = studioTrack(extras(), p.mic); engine.channel(p.id, { ...channelOf(p), mute: pv(p.id).muted, solo: pv(p.id).solo, chain: fx(resolveChain(t?.chain ?? [], ctx(lowestMidiOf(p.id)))), sends: fx(t?.sends ?? []), to: t?.to ?? "master" }); }
    engine.buses(studioTracks(extras()).filter((t) => t.kind === "bus").map((b) => ({ id: b.id, gainDb: b.gainDb, pan: b.pan, chain: b.bypass ? [] : fx(resolveChain(b.chain, ctx(null))), to: b.to, sends: fx(b.sends), ...(host.busMuted().has(b.id) ? { mute: true } : {}) })));   // 混音轨旁通 = 插件全跳过，推子 / 发送照旧   // 总线也能出到 / 发给别的总线（v0.10.9）
    const m = activeMaster(extras()); engine.master({ ...m, chain: fx(resolveChain(m.chain, ctx(null))) });
  }
  /** 这位歌手全曲最低的音（自动低切用；没有音 = null）。 */
  function lowestMidiOf(partId: string): number | null {
    let lo: number | null = null;
    for (const pp of st().song.papers) for (const t of pp.tracks[partId] ?? []) if (t.kind === "note" && t.pitch) for (const q of [t.pitch, ...(t.chord ?? [])]) { const m = midiOf(q); if (lo === null || m < lo) lo = m; }
    return lo;
  }
  /** 歌开头的速度（延迟「跟速度」用）。 */
  function songBpm(): number { const p = st().song.papers[0], t = p ? p.tracks[st().song.parts.find((x) => p.tracks[x.id])?.id ?? ""] : undefined; return t ? tempoAt(t, headLen(t)) : 90; }
  /** 上场那位的出声参数（时间线不碰 Extras；src/engine/timeline.ts）。SoundFont 的预设下标要库先进录音房（prepareBanks）。 */
  function performerInfo(part: PartDef): PerformerInfo {
    const role = part.role, eng = (activeInstrument(extras(), role)?.engine ?? "unknown") as PerformerInfo["engine"], plugin = performerOf(eng), cat = grooveCategory(plugin?.grooveCategory ?? null, activeGm(extras(), role));
    const own = plugin ? plugin.info({ extras: extras(), role, presetIndex: (sha, bank, program) => engine.presetIndex(sha, bank, program) }) : { gm: null, chunk: "phrase" as const };   // 这位自己的那部分（gm / 分段唱 / 着力点）归插件
    return { engine: eng, plugin, spec: activePerfSpec(extras(), role), velocity: activeVelocity(extras(), role), transpose: activeTranspose(extras(), role), follow: (s) => followOf(s, cat), chain: activeChain(extras(), role), ...own };
  }
  /** 这些声部上场那位各自的出声准备（SoundFont 子集进录音房 / 元音表 / …，归插件；找不到 = 那个声部报错、不出声，其余照放 = 换人的窄接口）。返回报错清单。 */
  async function prepareBanks(parts: readonly PartDef[]): Promise<string[]> {
    const errs: string[] = [];
    for (const part of parts) {
      const plugin = performerOf(activeInstrument(extras(), part.role)?.engine); if (!plugin) continue;   // 没人上场：时间线会报
      try { await plugin.prepare({ extras: extras(), role: part.role, engine, resolveGmBytes, ensureVowels }); } catch (e) { errs.push(`「${roleName(extras(), part.role)}」：${(e as Error).message}`); }
    }
    return errs;
  }
  /** 月读的块 = 调度器（src/engine/scheduler.ts）+ 一次一块的泵（刀 2，边算边放；user「第一句好了就开播 嗯」「实时播放的时候…预提前算然后用cache invalid」）：
   *  顺序 = 播放头所在的那块先、往后按距离、循环绕回；seek / 改谱 = 换顺序（正在算的那块算完照样进缓存）。唱不了的一句 = 报错 + 空着（不替补）；
   *  预唱（quiet）时不报错、不空着，等真按播放再说。 */
  let chunkKeysWanted: string[] = [];                      // 现在该算的顺序（键）
  let chunkPlans = new Map<string, ChunkPlan>();           // 键 → 计划（含唱谱）
  const chunkFailed = new Map<string, string>();           // 键 → 为什么唱不了（预唱时攒着，播放时报）
  let pumping = false, pumpQuiet = false, singSpeed: number | null = null;   // singSpeed = 算一秒歌几毫秒（预卷几块按它）
  const inflightKeys = new Set<string>();   // 正在算的那几句（几条道并行，刀 6 ③：PC 两条、iPad 一条；user「两个 worker 并行唱（PC）」）
  const pendingChunks = () => chunkKeysWanted.filter((k) => !engine.hasChunk(k)).length;
  /** 这一遍放的起点（从某一段放时 = 那一段开头；起放提前 PRE_ROLL 给辅音）：在它之前就唱完的块这次不放，排队也别排在前面（v0.10.3）。走过起点一秒后清掉。 */
  let playMute: number | undefined;
  function setChunkOrder(tl: Timeline, pos: number, loop: { from: number; to: number } | null, o: { quiet?: boolean; limit?: number; mute?: number } = {}): void {
    chunkPlans = new Map(tl.chunks.map((c) => [c.key, c]));
    let keys = chunkOrder(tl.chunks, pos, loop, (k) => engine.hasChunk(k), o.mute ?? playMute);
    if (o.limit !== undefined) keys = keys.slice(0, o.limit);
    chunkKeysWanted = keys; pumpQuiet = !!o.quiet;
    for (const k of inflightKeys) if (!keys.includes(k) && !chunkPlans.has(k)) singer.cancelInflight(k);   // 正在算的那句已经不在歌里（改了 / 换歌）= 中途取消
    void pump();
  }
  const STAGE_FRAC: Record<string, number> = { "念（1/2）": 0.05, "念（2/2）": 0.25, "分析（1/3 音高）": 0.45, "分析（2/3 谱包络）": 0.6, "分析（3/3 气声）": 0.7, "分析（缓存）": 0.75, "合成": 0.85 };   // 刀 0 量的比例：念 40%、分析 40%、合成 20%
  /** 泵：按 chunkKeysWanted 的顺序，同时最多 singer.parallelism 句在算（每条道一句）；哪句算完就补下一句。 */
  async function pump(): Promise<void> {
    if (pumping) return;
    pumping = true;
    let shown = 0;
    const running = new Set<Promise<void>>();
    try {
      for (;;) {
        while (running.size < singer.parallelism) {
          const key = chunkKeysWanted.find((k) => !engine.hasChunk(k) && !inflightKeys.has(k)); if (!key) break;
          const c = chunkPlans.get(key); if (!c) { chunkKeysWanted = chunkKeysWanted.filter((k) => k !== key); continue; }
          const who = roleName(extras(), st().song.parts.find((p) => p.id === c.part)?.role ?? ""), left = pendingChunks();
          if (left > shown) { renderBar.start(left); shown = left; }   // 进度条：还有几句（顺序换了、多了就重开一条）
          const failed = chunkFailed.get(key);
          if (failed !== undefined) {   // 预唱时就唱不了的：不再试；真播放 = 报出来、这一句空着（不出声、不替补）
            if (pumpQuiet) { chunkKeysWanted = chunkKeysWanted.filter((k) => k !== key); continue; }
            showError(`「${who}」唱不了这一句：${failed}`); engine.chunk(key, 22050, new Float32Array(0)); renderBar.next(); continue;
          }
          progress(`${who}：${pumpQuiet ? "先唱着" : "还有"} ${left} 句…`);
          inflightKeys.add(key);
          const p: Promise<void> = singOne(key, c, who).finally(() => { inflightKeys.delete(key); running.delete(p); });
          running.add(p);
        }
        if (!running.size) break;
        await Promise.race(running);
      }
    } finally { pumping = false; renderBar.end(); if (!engine.playing) progress(""); }
  }
  async function singOne(key: string, c: ChunkPlan, who: string): Promise<void> {
    const t = performance.now();
    try {
      const r = await singer.sing(c.score, (stage) => { progress(`${who}：${stage}…`); const pc = /(\d+)%$/.exec(stage); if (pc) renderBar.frac(Number(pc[1]) / 100); else if (stage in STAGE_FRAC) renderBar.frac(STAGE_FRAC[stage]); }, { opt: humOpt(), models: modelBases(), raw: true, tag: key, diskBytes: BUDGET.speechDisk });
      if (engine.hasChunk(key) || !chunkPlans.has(key)) { renderBar.next(); return; }   // 期间换了歌 / 顺序：照样留着（键对就不浪费），但别再算进度
      engine.chunk(key, r.sr, r.samples);
      if (r.ms?.boot) diagNote("singer", `engine boot ms: ${JSON.stringify(r.ms.boot)}`);   // 冷启动各段（刀 5）：诊断页看（测试里的假唱没有 ms）
      const secs = Math.max(0.5, c.dur - LEAD_IN); singSpeed = singSpeed === null ? (performance.now() - t) / secs : singSpeed * 0.7 + ((performance.now() - t) / secs) * 0.3;
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (msg === "cancelled") return;
      if (!chunkPlans.has(key)) return;   // W-37（2026-10-13）：这句已经不在这首歌里（换歌 / 改了）= 静默丢掉——不报、不记、不塞空块（成功分支早就这么核了，失败分支漏了：换歌后红框报的是上一首的那一句）
      chunkFailed.set(key, msg);
      if (!pumpQuiet) { showError(`「${who}」唱不了这一句：${msg}`); engine.chunk(key, 22050, new Float32Array(0)); }
      else chunkKeysWanted = chunkKeysWanted.filter((k) => k !== key);
    }
    renderBar.next();
  }
  /** 等从 pos 起的前几块到齐（预卷；几块按这台设备的速度）；stop = 外面取消了。 */
  async function waitChunksReady(tl: Timeline, pos: number, stop: () => boolean, mute?: number): Promise<void> {
    while (!stop() && !readyToStart(tl.chunks, pos, prerollCount(singSpeed), (k) => engine.hasChunk(k), mute)) {
      if (!pumping && pendingChunks() === 0) break;   // 泵停了、也没有要算的 = 该来的都来了（或唱不了的已经空着）
      await new Promise<void>((r) => setTimeout(r, 80));
    }
  }
  /** 全部块到齐（导出 / 测试钩子用）：盯着**这条时间线自己的全部键**，不盯 chunkKeysWanted——那个会被预唱定时器 / 改谱刷新换成别的子集，原来一被插队就提前返回、导出报「chunk … missing for export」（2026-10-10 真引擎 probe 抓到）。 */
  async function awaitAllChunks(tl: Timeline): Promise<void> {
    const want = [...new Set(tl.chunks.map((c) => c.key))];
    setChunkOrder(tl, tl.range.from, null);
    for (;;) {
      const missing = want.filter((k) => !engine.hasChunk(k));
      if (!missing.length) return;
      if (!missing.some((k) => chunkKeysWanted.includes(k) || inflightKeys.has(k))) setChunkOrder(tl, tl.range.from, null);   // 被别人换了顺序 = 把我们的重新排上
      else if (!pumping) void pump();
      await new Promise<void>((r) => setTimeout(r, 80));
    }
  }
  /** 录音房里只留最近用到的块（内容键；按代价 / 预算留归刀 2）。 */
  const MAX_CHUNKS = 64, chunkKeys: string[] = [];   // 最近用过的在后面
  function pruneChunks(tl: Timeline): void {
    const keep = new Set(tl.chunks.map((c) => c.key));
    for (const k of keep) { const i = chunkKeys.indexOf(k); if (i >= 0) chunkKeys.splice(i, 1); chunkKeys.push(k); }
    const drop: string[] = [];
    while (chunkKeys.length > MAX_CHUNKS) { const i = chunkKeys.findIndex((k) => !keep.has(k)); if (i < 0) break; drop.push(chunkKeys.splice(i, 1)[0]); }
    if (drop.length) engine.forget(drop);
  }
  // ── 刀 6 ④：负载和内存监控防闪退（user 2026-10-10「负载和内存监控防闪退 做」「超预算先放块 / 减并行 / 明说」）。纯逻辑在 src/app/resource-watch.ts，这里只动手 + 说话。
  //   能算到的 = 每条月读 worker 的 WASM 堆 + 念缓存（worker 每次回话带着）、录音房里的块（音频线程每秒报）、音源在内存里的整包；音频线程每秒报忙闲。
  const DEVICE: DeviceInfo = { ios: /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1), cores: navigator.hardwareConcurrency ?? 2, deviceMemoryGB: (navigator as { deviceMemory?: number }).deviceMemory ?? null };
  const BUDGET = budgetFor(DEVICE);
  if (new URLSearchParams(location.search).has("nodisk")) BUDGET.speechDisk = 0;   // 查案开关：?nodisk=1 = 念缓存不落盘（只用内存）
  singer.setLanes(BUDGET.lanes);
  diagNote("resource", `device ios=${DEVICE.ios} cores=${DEVICE.cores} mem=${DEVICE.deviceMemoryGB ?? "?"}GB → lanes ${BUDGET.lanes}, budget ${Math.round(BUDGET.total / 1e6)} MB (chunks ${Math.round(BUDGET.chunkBytes / 1e6)})`);
  const watch = { load: null as LoadInfo | null, hot: 0, lanesCut: false, said: new Map<string, number>() };
  const resourceSnapshot = (): Snapshot => ({ lanes: singer.memory(), chunkBytes: watch.load?.chunkBytes ?? 0, chunks: watch.load?.chunks ?? 0, soundMem: soundMemoryBytes(), audioBusy: watch.load?.busy ?? null });
  /** 明说，但同一件事 30 s 内只说一次（状态条 + 黑匣子）。 */
  function resourceSay(kind: string, text: string): void {
    const t = performance.now(); if ((watch.said.get(kind) ?? -1e9) > t - 30_000) return; watch.said.set(kind, t);
    reportError(text, "warning");
  }
  /** 放远处的块到 toBytes 以下：最久没用的先走（正在要的那几句不放）。 */
  function shrinkChunks(snap: Snapshot, toBytes: number): void {
    if (!snap.chunks) return;
    const avg = Math.max(1, snap.chunkBytes / snap.chunks), n = Math.ceil((snap.chunkBytes - toBytes) / avg), wanted = new Set(chunkKeysWanted), drop: string[] = [];
    for (const k of chunkKeys) { if (drop.length >= n) break; if (!wanted.has(k) && engine.hasChunk(k)) drop.push(k); }
    for (const k of drop) chunkKeys.splice(chunkKeys.indexOf(k), 1);
    if (drop.length) { engine.forget(drop); diagNote("resource", `pruned ${drop.length} chunks (${Math.round(snap.chunkBytes / 1e6)} MB → target ${Math.round(toBytes / 1e6)} MB)`); }
  }
  function resourceTick(): void {
    const snap = resourceSnapshot();
    for (const a of advise(snap, BUDGET)) {
      if (a.kind === "pruneChunks") shrinkChunks(snap, a.toBytes);
      else if (a.kind === "fewerLanes") { if (singer.parallelism > a.lanes) { singer.setLanes(a.lanes); watch.lanesCut = true; diagNote("resource", `lanes → ${a.lanes}`); resourceSay("lanes", "内存 / 负载吃紧：小月相改成一条道唱（慢一点，声音不变）"); } }
      else if (a.kind === "audioHot") { if (++watch.hot >= 3) resourceSay("audio", `音频线程最近 1 s 忙 ${Math.round(a.busy * 100)}%：可能爆音。效果链 / 声部是你的混音，不替你动；可以先把没在听的声部静音`); }
    }
    if (snap.audioBusy !== null && snap.audioBusy <= AUDIO_HOT) watch.hot = 0;
    if (watch.lanesCut && totalBytes(snap) < BUDGET.total * 0.6 && (snap.audioBusy ?? 0) < AUDIO_HOT * 0.7) { singer.setLanes(BUDGET.lanes); watch.lanesCut = false; diagNote("resource", `lanes → ${BUDGET.lanes} (recovered)`); }   // 吃紧过去了 = 道数回到设备预算
  }
  singer.onMem = () => resourceTick();
  /** 换歌：上一首的长句把哪条道的堆撑大了（比引擎刚起来多涨一大截）= 趁空静默重开，还给这一首（念缓存盘上那份还在；同一首歌里不重开，见 resource-watch.ts 文件头）。 */
  function trimLanesForNewSong(): void {
    const mems = singer.laneMems();
    for (const i of trimOnSongSwitch(mems)) if (!singer.laneBusy(i)) { diagNote("resource", `song switch: restart lane ${i} (wasm ${Math.round((mems[i]?.wasm ?? 0) / 1e6)} MB, base ${Math.round((mems[i]?.base ?? 0) / 1e6)} MB)`); singer.restartLane(i); }
  }
  engine.on("load", (info) => { watch.load = info; resourceTick(); });
  /** 准备一次播放 / 导出：库进录音房 → 时间线 → 月读的块。没法出声的声部报出来、其余照放（user「不是显示自动上，而是就是不出声，报错，人类手动换」）。 */
  async function prepare(scope: RenderScope, o: { chunks?: boolean; raw?: boolean } = {}): Promise<Timeline | null> {
    const parts = audibleParts(), song = songIn(scope);
    const errs = await prepareBanks(parts);   // 各位的准备（库 / 元音表）都在插件里
    const tl = buildTimeline({ song, order: songPlayOrder(song), parts, info: performerInfo, hum: st().song.hum, singOpt: humOpt() });
    for (const u of tl.unplayable) errs.push(`「${roleName(extras(), st().song.parts.find((p) => p.id === u.part)?.role ?? "")}」：${u.why}`);
    if (errs.length) showError(`${errs.join("；")}。${tl.tracks.length ? "这些声部没有出声，其余照放。" : "没有出声。"}点谱前面的声部名换一个「谁来演」。`);
    if (!tl.tracks.length) return null;
    pruneChunks(tl);
    if (o.chunks !== false) await awaitAllChunks(tl);
    pushChannels(o.raw);
    return tl;
  }
  /** 测试钩子：现在视图范围的混音（离线，和播放同一份数学）；samples[0] = 谱上第 start 秒。 */
  async function renderMixForTest(): Promise<{ samples: Float32Array; right: Float32Array; sr: number; start: number } | null> {
    const tl = await prepare("view"); if (!tl) return null;
    const r = playRange(tl), m = await engine.renderOffline({ tracks: tl.tracks, range: { from: r.from, to: r.to }, loop: false }, { sr: GM_SR });
    return { samples: m.left, right: m.right, sr: m.sr, start: m.start };
  }
  // ── 走带（这次打开里有效；不进歌）──────────────────────────────────────────────────────────────────────────────────
  let loopOn = false;                   // user「我确实希望能单曲循环…无穷循环和循环走带都做」
  let playTl: Timeline | null = null;   // 现在放的时间线（播放头 / 改谱刷新用）
  let preparing = false, cancelPrepare = false;
  const SEAM_LEAD = 4;                  // 接缝：从循环尾前几秒放起
  /** 这张纸（第一次出现）的秒区间。 */
  /** 范围 + 循环起点：本段 / 全部（视图）；循环 = 编排的 [循环段]（前面放一遍、再从循环段头跳回；只在全部视图）或整个范围。
   *  选区**不再**当播放区间（v0.9.13 sunset；user 2026-10-10「播放过程中的选区操作不应该改变播放区间，这样，先不用选区当播放区间了，sunset这个设定，以后慢慢想办法。其实这个功能没啥实用性」——
   *  放着的时候选 / 扩 / 清选区曾把范围一起换掉）。从光标放照旧（有选区 = 选区头）。 */
  function playRange(tl: Timeline): { from: number; to: number; loopFrom: number } {
    const from = tl.range.from, to = tl.range.to; let loopFrom = from;
    const song = playSong(), a = parseArrangement(song.arrangement, song.papers);
    if (host.viewScope() === "all" && a.loop && tl.papers[a.order.length]) loopFrom = tl.papers[a.order.length].t0;
    return { from, to, loopFrom };
  }
  /** 从光标放：光标（选区 = 选区头）那个音的时刻，提前一点（辅音在元音前）。
   *  光标在纸尾 / 不在放的范围里 = null = 从头放（v0.9.2；user「没有光标的时候点开始就不放了哈哈哈」——写完谱光标停在最后，原来从纸尾放 = 什么都听不到）。 */
  // ── 走带（2026-10-10 Opus 5.5）：起点 / 续播·暂停 / 回起点重放 / ⋯（循环、从头放、接缝）/ 听模式 ──────────────────────────
  //   user「走带控制有续播/暂停 和从上一次开播的地方重新开始两个，loop和之后别的设置比如从头开始放在...里面」「但是我想编辑的时候光标动但是播放头不动」
  //   「核心场景就是一遍一遍听同一个小节」「以及大部分时候可以小节级别的开始精度」「那么续播不reset起点」「长按加播放同意」。
  //   起点 = 一个小节头：只有「从这儿放」（空白长按 / 右键菜单；听模式里长按 / 右键谱面）和「从头放」（⋯ 菜单 / 连按两下主键）挪它；编辑、挪光标、续播都不动它（取代 v0.9.1 的「▶ = 从光标放」）。
  let startMark: { paperId: string; tick: number } | null = null;
  let paused: { sec: number; at: { paperId: string; tick: number } | null } | null = null;   // 暂停在哪：秒 + 谱位置（暂停时改了谱 = 按谱位置接着放）
  const clampTo = (r: { from: number; to: number }, s: number) => Math.min(Math.max(s, r.from), r.to);
  /** 起点本身（不提前）：从某一段放时，在它之前就结束的音 / 唱完的块这次不出声（v0.10.3，user「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」——
   *  是起点提前 PRE_ROLL 那一小截落在前一段最后一个音里：录音房起放时追音把它补按下去、前一句的块带着收尾余音也放了；不是停的时候没收干净，起放前每条轨都先 killAll）。 */
  function startMute(tl: Timeline, r: { from: number; to: number }): number | undefined {
    if (!startMark) return undefined;
    const s = tl.secondsAt(startMark.paperId, startMark.tick, 0);
    return s === null ? undefined : clampTo(r, s);
  }
  function startSeconds(tl: Timeline, r: { from: number; to: number }): number {
    if (!startMark) return r.from;
    const s = tl.secondsAt(startMark.paperId, startMark.tick, 0);
    return s === null ? r.from : clampTo(r, s - PRE_ROLL);   // 提前一点（月读的辅音在拍子前）
  }
  function resumeSeconds(tl: Timeline, r: { from: number; to: number }): number {
    if (!paused) return startSeconds(tl, r);
    const s = paused.at ? tl.secondsAt(paused.at.paperId, paused.at.tick, paused.sec) : null;
    return clampTo(r, s ?? paused.sec);
  }
  /** 这张纸里 part 那一行 tick 所在小节的头（同画谱的规矩：人插的「|」、拍号变 = 新小节；写满自动换；弱起 = 纸头）。 */
  function barHeadTick(paperId: string, part: string, tick: number): number {
    const paper = st().song.papers.find((p) => p.id === paperId); if (!paper) return 0;
    const toks = paper.tracks[part] ?? Object.values(paper.tracks)[0] ?? [];
    let len = (DEFAULT_TIME.beats * WHOLE) / DEFAULT_TIME.beatType, inBar = 0, t = 0, head = 0;
    for (const k of toks) {
      if (k.kind === "bar") { if (t <= tick) head = t; inBar = 0; continue; }
      if (k.kind === "time") { if (inBar > 0 && t <= tick) head = t; inBar = 0; len = (k.beats * WHOLE) / k.beatType; continue; }
      if (!isTimed(k)) continue;
      while (inBar >= len && inBar > 0) { const b = t - (inBar - len); if (b <= tick) head = b; inBar -= len; }
      if (t > tick) break;
      inBar += k.dur; t += k.dur;
    }
    // 过了这位写的尾巴（后面补齐的淡色小节 / 空纸）：照最后的拍号接着往后数整小节（v0.10.32；user「在空的sheet（比如ghost 休止符）上右键从这里放小节号错了，系统的整理一下」）
    if (t <= tick) { while (inBar >= len && inBar > 0) { const b = t - (inBar - len); if (b <= tick) head = b; inBar -= len; } const b0 = t - inBar; if (tick >= b0) head = b0 + Math.floor((tick - b0) / len + 1e-9) * len; }
    return head;
  }
  /** 一条 track 上第 caret 个 token 之前有多少 tick。 */
  const tickOfCaret = (paperId: string, part: string, caret: number): number => { const toks = st().song.papers.find((p) => p.id === paperId)?.tracks[part] ?? []; let t = 0; for (let i = 0; i < Math.min(caret, toks.length); i++) if (isTimed(toks[i])) t += (toks[i] as { dur: number }).dur; return t; };
  /** 开播（准备时间线 + 唱前几块）：start = 从起点；head = 从开头（起点不动）；resume = 从暂停的地方；seam = 循环尾前几秒（听接缝）。 */
  async function startPlayback(how: "start" | "head" | "resume" | "seam"): Promise<void> {
    if (preparing) { cancelPrepare = true; return; }   // 准备中再按 = 不放了
    singer.unlock(); holdAudio();   // 在用户手势里先把声音打开（iPad）；准备期间让声音一直醒着
    preparing = true; cancelPrepare = false; for (const b of playBtns()) b.classList.add("is-on");
    try {
      const tl = await prepare("view", { chunks: false }); if (!tl) { progress(""); return; }
      const r = playRange(tl); playTl = tl;
      const loop = loopOn || how === "seam";
      engine.setTimeline({ tracks: tl.tracks, range: { from: r.from, to: r.to }, loop, loopFrom: r.loopFrom });
      const at = how === "seam" ? Math.max(r.from, r.to - SEAM_LEAD) : how === "resume" ? resumeSeconds(tl, r) : how === "head" ? r.from : startSeconds(tl, r);
      playMute = how === "start" ? startMute(tl, r) : undefined;
      // 边算边放：从 at 起按距离排队唱，前几块到齐就开播，后面的边放边唱（到了没唱好的那句走带会等）
      setChunkOrder(tl, at, loop ? { from: r.loopFrom, to: r.to } : null);
      await waitChunksReady(tl, at, () => cancelPrepare, playMute);
      if (cancelPrepare) { progress(""); return; }
      const loopNow = loopOn || how === "seam";   // 准备的这几秒里切了循环 = 这一轮就按新的（user 2026-10-10「中途toggle循环对本轮播放应该生效」）
      const atNow = how === "start" ? startSeconds(tl, r) : at;   // 准备的这几秒里起点挪了（连按两下 = 从头放 / 从这儿放）= 从新的起点放
      playMute = how === "start" ? startMute(tl, r) : undefined;
      if (loopNow !== loop) engine.setTimeline({ tracks: tl.tracks, range: { from: r.from, to: r.to }, loop: loopNow, loopFrom: r.loopFrom });
      if (loopNow !== loop || atNow !== at) setChunkOrder(tl, atNow, loopNow ? { from: r.loopFrom, to: r.to } : null);
      await engine.play(atNow, playMute);
      paused = null;
      playIcon(true);
      progress(loopOn ? `循环 ${(r.to - r.loopFrom).toFixed(1)} 秒` : `${(r.to - atNow).toFixed(1)} 秒`);
    } catch (e) { showError(`放不了：${(e as Error).message}`); progress(""); playIcon(false); }
    finally { releaseAudio(); preparing = false; if (!engine.playing) for (const b of playBtns()) b.classList.remove("is-on"); }
  }
  /** 主键（空格）= |▶ 从起点放 / 放着 = 停（停的地方记下来，⋯ 里「接着放」从那儿接）。
   *  user 2026-10-10「ui上先暂时不要续播，开始用杠三角的那个符号，就是从设定的开始播放。这样先只有一个键」「续播可以放在...里面」。 */
  //   连按两下（主键 / 空格）= 从头放（2026-10-10 user「从头开始播放的关键是指针也放在开头了。然后double tap 从新开始 会激活从头开始」）：
  //   第一下照常（放 / 停），第二下在 DOUBLE_TAP_MS 内到 = 起点回开头、从头放（第一下正在准备 = 不打断，准备完从开头起）。
  const DOUBLE_TAP_MS = 350;
  let lastPlayTap = 0;
  function playPause(at: number = performance.now()): void {   // at = 这一下按下的时刻（事件的 timeStamp）：页面忙的时候处理晚了，也按真的间隔算连按
    const now = at;
    if (now - lastPlayTap < DOUBLE_TAP_MS) { lastPlayTap = 0; playFromHead(); return; }
    lastPlayTap = now;
    if (engine.playing) { pausePlay(); return; }
    void startPlayback("start");
  }
  /** ⋯「接着放」：从上次停下的地方接着放（不动起点）。 */
  function resumePlay(): void { if (!engine.playing && paused) void startPlayback("resume"); }
  function pausePlay(): void {
    const sec = engine.audibleSec() ?? engine.position, at = playTl?.locate(sec) ?? null;
    stopPlay(); paused = { sec, at }; view.setPlayhead(at);
  }
  /** 回到起点重放（一遍一遍听同一个小节；|▶ 和「从这儿放」走这里）。放着 = 直接跳回去。 */
  function replay(): void {
    paused = null;
    if (engine.playing && playTl) { const r = playRange(playTl); playMute = startMute(playTl, r); engine.seek(startSeconds(playTl, r), playMute); return; }
    view.setPlayhead(null);
    if (preparing) return;   // 正在准备开播（月读在唱前几句）：不打断，开播那一刻按新的起点算（startPlayback 里再看一次）
    void startPlayback("start");
  }
  /** 从这儿放：起点挪到 paperId 这张纸 part 那一行 tick 所在小节的头，并从那儿放。 */
  function playFromHere(paperId: string, part: string, tick: number): void {
    startMark = { paperId, tick: barHeadTick(paperId, part, tick) }; view.setStartMark(startMark); replay();
  }
  /** 从头放：起点回到开头，从头放（2026-10-10 user「从头开始播放的关键是指针也放在开头了」——v0.9.20 曾改成「起点不动」，是误读了「从头放会把start reset回头」，v0.9.25 改回）。放着 = 直接跳回开头。 */
  function playFromHead(): void { startMark = null; view.setStartMark(null); replay(); }
  /** 听接缝：放着 = 跳到循环尾前几秒；没放 = 从那儿放。 */
  function playSeam(): void { if (engine.playing && playTl) { const r = playRange(playTl); engine.seek(Math.max(r.from, r.to - SEAM_LEAD)); } else void startPlayback("seam"); }
  function stopPlay(): void {
    engine.stop(); playIcon(false); view.setPlayhead(null); phKey = ""; cancelPrepare = true; paused = null; playMute = undefined;
    // 停 = 月读也停：正在念的那句中途取消、后面排着的不念了（user 2026-10-10「按停之后月读不应该把长句念完」）；只留安静的预唱（光标附近几句，改谱那套）
    chunkKeysWanted = []; singer.cancelPending(); singer.cancelInflight(); schedulePrewarm();
  }
  engine.on("ended", () => { playIcon(false); view.setPlayhead(null); phKey = ""; paused = null; });
  // 录音房渲染里抛了（v0.10.15）：报出来 + 进黑匣子（带栈），走带停；节点照活，再按播放能放（原来 worklet 死掉、之后永远没声，日志里也没有）
  engine.on("crash", (msg) => { diagNote("engine", `render crash: ${msg}`); playIcon(false); view.setPlayhead(null); phKey = ""; paused = null; showError(`播放出错了，已经停下（错误记进了诊断日志）：${msg.split("\n")[0]}`); });
  function setLoop(on: boolean): void {
    loopOn = on; for (const b of playBtns()) b.classList.toggle("looping", on);   // |▶ 上一个小「循环」角标（原来写在 ⋯ 钮上）
    // 放着的时候切 = 这一轮就按新的来：到尾（尾巴还在响也算）跳回去 / 不跳；开了循环 = 循环头那几句也排进去先唱（不然跳回去要冻着等月读）
    if (engine.playing && playTl) { const r = playRange(playTl); engine.setTimeline({ tracks: playTl.tracks, range: { from: r.from, to: r.to }, loop: loopOn, loopFrom: r.loopFrom }); setChunkOrder(playTl, engine.position, loopOn ? { from: r.loopFrom, to: r.to } : null); }
  }
  let lastReorder = 0;
  // 播放头 = 现在**听到的**地方（2026-10-10 Opus 5.5；user「ipad后台唤起后音频和动画错位。以及你有没有办法实际测音频播到哪里了来好好对齐？」）：
  //   原来画的是录音房「正在算」的位置（每 43 ms 一报），声音还要过系统的输出缓冲才到扬声器 → 画面一直早一个输出延迟；iPad 切后台回来系统可能换了更大的缓冲 = 早得更多。
  //   现在每一帧问浏览器扬声器此刻放到音频时钟的哪一刻（getOutputTimestamp），去录音房报的「音频时钟 → 走带位置」对照表里查（StudioClient.audibleSec）。
  let phRaf = 0, phKey = "", latLogged: number | null = null, latAt = 0, srcLogged: string | null = null;
  /** 翻谱的提前量（秒）：像钢琴家翻谱——这一行最后一小截还没放完就先翻到「接下来要放的地方」（下一行 / 编排、反复跳回去的地方），最后那一点靠记着
   *  （v0.10.21；user「早跳转：我说的不是看下一行，因为小设备大总谱上面一次只能看一行。以及编排longjump。想一想钢琴家是怎么翻页的」）。 */
  //   提前多少在 |▶ 长按 / 右键的菜单里挑（这次打开里有效，同「自动翻」）；默认 0.6 s（user「1.5s 应该太长了，让这个...里面可以配置，然后推理一下默认是多久，我猜0.5？」）：
  //   视唱时眼睛大约领先 1 s（不熟的谱）、自己的歌看得更少；平滑滚动本身 ~0.3 s——0.6 = 滚完正好赶上换行。0 = 不提前（换了行才翻）。
  const TURN_LEADS = [0, 0.3, 0.6, 1, 1.5] as const;
  let turnLead = 0.6;
  let phAheadKey = "";
  /** 切后台回来：延迟的记录归零，下一帧重记（系统可能换了输出缓冲）。 */
  function resetLatencyLog(): void { latLogged = null; latAt = 0; }
  function playheadFrame(): void {
    phRaf = 0;
    if (!engine.playing || !playTl) return;
    const sec = engine.audibleSec() ?? engine.position, loc = playTl.locate(sec), k = loc ? `${loc.paperId}:${loc.tick}` : "";
    // 接下来 TURN_LEAD 秒放到哪（按播放的顺序：编排 / 反复照算；开着循环、快到尾了 = 循环头）
    const r = playRange(playTl); let aSec = sec + turnLead; if (aSec >= r.to) aSec = loopOn ? r.loopFrom + (aSec - r.to) : r.to - 1e-3;
    const ahead = turnLead > 0 ? playTl.locate(aSec) : null, ak = ahead ? `${ahead.paperId}:${ahead.tick}` : "";
    if (k !== phKey || ak !== phAheadKey) { phKey = k; phAheadKey = ak; view.setPlayhead(loc, ahead); }
    const now = performance.now();
    if (now - latAt > 2000) {   // 输出延迟变了（换耳机 / 切后台回来）记进黑匣子：错位再报时有数可查
      latAt = now; const lat = engine.latencyMs();
      if (lat !== null && (latLogged === null || Math.abs(lat - latLogged) > 25 || engine.clockSrc !== srcLogged)) { latLogged = lat; srcLogged = engine.clockSrc; diagNote("audio", `output latency ${Math.round(lat)} ms (ctx ${singer.unlock().state}, clock ${engine.clockSrc})`); }   // clock ≠ ts = 时间戳的两个时钟对不上了（长锁屏回来），退了一档
    }
    phRaf = requestAnimationFrame(playheadFrame);
  }
  engine.on("pos", (sec, playing, waiting) => {
    if (!playing) return;
    if (playTl && !phRaf) phRaf = requestAnimationFrame(playheadFrame);
    if (waiting) progress("等小月相唱好这一句…");
    if (playMute !== undefined && sec > playMute + 1) playMute = undefined;   // 走过起点了：之后排队照常（循环绕回来前一段照样响）
    if (playTl && performance.now() - lastReorder > 1000) { lastReorder = performance.now(); const r = playRange(playTl); setChunkOrder(playTl, sec, loopOn ? { from: r.loopFrom, to: r.to } : null); }   // 顺序跟着播放头走
  });
  engine.on("missing", () => { if (playTl) { const r = playRange(playTl); setChunkOrder(playTl, engine.position, loopOn ? { from: r.loopFrom, to: r.to } : null); } });   // 走带前面缺块（放着的时候改了谱）：现唱（走带到那儿会等，A）
  /** 放着的时候改谱 / 换人 / 静音独奏：时间线重算、换进去（正在响的不动，响完换新；user「正在响的那句不换、响完换新」）。攒 300 ms。 */
  let refreshTimer = 0;
  function schedulePlaybackRefresh(): void {
    if (!engine.playing) return;
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => { void (async () => {
      if (!engine.playing) return;
      const at = engine.position, loc = playTl?.locate(at) ?? null;   // 播放头现在在谱的哪儿：换了时间线按谱位置留在原地（改了前面的音 / 反复结构，秒数不变会跳）
      const tl = await prepare("view", { chunks: false }); if (!tl) { stopPlay(); return; }
      const r = playRange(tl); playTl = tl;
      const sec = loc ? tl.secondsAt(loc.paperId, loc.tick, at) : null, shift = sec !== null && Math.abs(sec - at) > 0.005 ? sec - at : 0;
      engine.setTimeline({ tracks: tl.tracks, range: { from: r.from, to: r.to }, loop: loopOn, loopFrom: r.loopFrom, ...(shift ? { shift } : {}) });
      setChunkOrder(tl, engine.position, loopOn ? { from: r.loopFrom, to: r.to } : null);
    })(); }, 300);
  }
  /** 预唱（刀 2；user「打开歌后空闲片预热 + 预唱光标附近 建议这样…然后最好有ui提示」）：改谱停下 700 ms 后、没在放 → 从光标起往后先唱几句（quiet：不报错、不空着）。
   *  歌里有月读上场 = 意图（第一次会下模型；user「不会太浪费电吧因为就几句」）。 */
  //   2026-10-10（v0.9.18）：从「下一次开播会从的地方」唱起（暂停处 / 起点），不再按光标——开播已经和光标分开了。
  const PREWARM_PHRASES = 3;
  let prewarmTimer = 0;
  function schedulePrewarm(): void {
    clearTimeout(prewarmTimer);
    prewarmTimer = window.setTimeout(() => {
      if (engine.playing || preparing || exporting) return;
      const parts = audibleParts(); if (!parts.some((p) => performerOf(activeInstrument(extras(), p.role)?.engine)?.sound === "chunks")) return;   // 只有慢引擎（按句出块）要预唱
      const song = songIn("view");
      const tl = buildTimeline({ song, order: songPlayOrder(song), parts, info: performerInfo, hum: st().song.hum, singOpt: humOpt() });
      if (!tl.chunks.length) return;
      pruneChunks(tl);
      // 从下一次开播会从的地方唱起：暂停着 = 暂停处，否则 = 起点（v0.9.18 起开播不再看光标；原来按光标附近唱，起点在别处时开头那句排不上）
      const r = playRange(tl);
      setChunkOrder(tl, paused ? resumeSeconds(tl, r) : startSeconds(tl, r), null, { quiet: true, limit: PREWARM_PHRASES, mute: paused ? undefined : startMute(tl, r) });
    }, 700);
  }
  /** 光标所在那位是 SoundFont = 把它的子集载进录音房（几 MB，瞬时），按键试听才响。没载好之前的按键丢掉（不排队——试听要的是即时，迟到的音更烦）。 */
  let bankPreparing: Promise<void> | null = null;
  function prepareBank(): Promise<void> {
    const g = activeGm(extras(), curRole()); if (!g || engine.hasBank(g.subsetSha256)) return Promise.resolve();
    if (bankPreparing) return bankPreparing;
    bankPreparing = (async () => { await engine.bank(g.subsetSha256, await resolveGmBytes(g)); })()
      .catch((e) => { showError(`「${g.name}」响不了：${(e as Error).message}`); })
      .finally(() => { bankPreparing = null; });
    return bankPreparing;
  }
  let exporting = false;
  /** 这份导出写什么许可：用户选的；和月读条款可能冲突 = 这一份按「未声明」写（user 2026-10-08「即使版权冲突…也不block导出mp3和工程文件。而只是回到未声明。不警察用户」）。
   *  只动导出的那一份；歌里存的选择不动（那是用户的数据）。 */
  function exportRights(roles: readonly string[]): { rights: string | undefined; fellBack: boolean } {
    const r = st().song.rights; if (!r) return { rights: undefined, fellBack: false };
    return licenseHints(r, performerCredits(extras(), roles)).length ? { rights: undefined, fellBack: true } : { rights: r, fellBack: false };
  }
  async function exportSong(o: { quality: Mp3Quality; scope: "all" | "segment" } = { quality: "standard", scope: "all" }): Promise<void> {
    if (exporting || preparing) return;
    exporting = true;
    try {
      if (engine.playing) stopPlay();
      const tl = await prepare(o.scope, { raw: false }); if (!tl) { progress(""); return; }   // 导出 = 面板里选的范围（默认整首；播放才跟视图范围）；效果全关（A/B）不影响导出
      progress("混音…"); renderBar.start(1);
      const m = await engine.renderOffline({ tracks: tl.tracks, range: tl.range, loop: false }, { sr: GM_SR, progress: (f) => renderBar.frac(f) }).finally(() => { renderBar.end(); if (mixBypass) pushChannels(); });   // 和播放同一个类、同一份数学
      const roles = st().song.parts.filter((p) => tl.tracks.some((t) => t.id === p.id)).map((p) => p.role);   // 真出了声的声部（署名推演）
      progress("编 mp3…");
      const Q = MP3_QUALITY[o.quality];
      let left = m.left, right: Float32Array | null = m.right;
      if (!Q.stereo) { left = new Float32Array(m.left.length); for (let i = 0; i < left.length; i++) left[i] = (m.left[i] + m.right[i]) / 2; right = null; }   // 小文件：左右平均成单声道
      const secs = left.length / m.sr, bytes = await encodeMp3(left, right, m.sr, Q.kbps);
      // mp3 标签（user 2026-10-08「mp3能自动生成license吗」）：歌名 / 作者（作者栏第一行，用户自己写的）/ 这首歌的许可（用户选的；未声明或冲突 = 不写）/ 整段署名。
      const { rights, fellBack } = exportRights(roles), { lines } = creditsOf(roles, rights);
      const tag = id3v2({ title: st().song.title || docName(), artist: (st().song.credits ?? "").split("\n").map((s) => s.trim()).find(Boolean), copyright: rights, copyrightUrl: firstUrl(rights), comment: creditsText(lines) || undefined, software: `MoonSinger ${APP_VERSION}` });
      // 文件名 = 名[-曲段]-YYYYMMDD-HHMM（v0.9.47；user「看一下wxhw还是weebpaint，导出的时候文件名应该还有导出的时间，也许还有防撞」= WeebPaint naming.ts「下载版本 = 名-YYYYMMDD-HHMM」；
      //   同一分钟再导 = 浏览器 / 系统自己补 (1)——WeebPaint 的规矩：撞名后缀只在能查占用的去处（云端）做，本地下载 / 分享查不了，交给系统）
      const file = new File([tag as unknown as BlobPart, bytes], `${stampedCopy(`${docName()}${o.scope === "segment" ? `-${fileSafe(st().song.papers.find((p) => p.id === st().at.paper)?.name || "这一张")}` : ""}`)}.mp3`, { type: "audio/mpeg" });
      progress("");
      offerFile(file, "歌声导出好了", `${secs.toFixed(1)} 秒 · mp3 ${Q.label} ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}` +
        (fellBack ? `<div class="offer-msg">许可这一份按「未声明」写了（你选的许可和小月相的条款可能冲突；作者栏里的选择没动）。</div>` : "") +
        creditsBlock(lines, "署名 · 已写进 mp3 的标签"));
    } catch (e) {
      progress(""); showError(`导出失败：${(e as Error).message}`);
    } finally { exporting = false; }
  }
  /** 放着的时候换曲段（‹ › / 挂签下拉 / 每张纸自己的曲段控件；只认这几处明说的「换段」，点谱上别的纸里的音不算）= 从那一段的开头放
   *  （v0.10.17；user「播放的时候强切不同的曲段应该能跳到那个曲段去播放」「播放中跳曲段的时候播放头应该从开始播放」）。
   *  本段视图 = 范围换成那一段、从它的头放；全部视图 = 跳到那一段（第一次出现）的头，前一段没响完的音不带过来（同「从这儿放」）。起点（从这儿放的那个小节）不动。 */
  function jumpPlaybackToPaper(id: string): void {
    if (!engine.playing && !preparing) return;
    const span = host.viewScope() === "all" && engine.playing ? playTl?.papers.find((x) => x.paper.id === id) : undefined;
    if (span && playTl) { const r = playRange(playTl); playMute = span.t0; engine.seek(clampTo(r, span.t0 - PRE_ROLL), playMute); return; }
    stopPlay();
    const go = (): void => { if (preparing) setTimeout(go, 30); else void startPlayback("head"); };   // 正在准备的那次先退干净
    go();
  }
  /** 找人视图「听开头」：一条临时轨（audition 通道）从 0 放到 to 秒；不是歌的时间线（播放头不画、不排块）。 */
  async function previewTrack(track: TrackSpec, to: number, label: string): Promise<void> {
    engine.channel("audition", { gainDb: 0, pan: 0, mute: false, solo: false });
    playTl = null; engine.setTimeline({ tracks: [track], range: { from: 0, to }, loop: false });
    try { await engine.play(0); playIcon(true); progress(`${label} · 开头 ${to.toFixed(1)} 秒`); }
    catch (e) { showError(`放不了：${(e as Error).message}`); }
  }
  /** 换歌 = 录音房里的块全放掉、排着的不唱了、正在唱的也取消、上一首的计划清空（W-37：旧请求回来才不会被当成这首的报出来）、上一首撑大的堆还回。 */
  function onSongSwitch(): void { engine.forget(chunkKeys.splice(0)); chunkFailed.clear(); chunkKeysWanted = []; chunkPlans = new Map(); singer.cancelPending(); singer.cancelInflight(); trimLanesForNewSong(); }

  return {
    humOpt, resetLatencyLog, playSong, curFlat, songIn, audibleParts, micOf, channelOf, pushChannels, lowestMidiOf, songBpm, performerInfo, prepare, renderMixForTest, playRange, tickOfCaret, barHeadTick, startPlayback, playPause, resumePlay, pausePlay, replay, playFromHere, playFromHead, playSeam, stopPlay, setLoop, schedulePlaybackRefresh, schedulePrewarm, prepareBank, exportRights, exportSong, resourceSnapshot, trimLanesForNewSong, onSongSwitch, jumpPlaybackToPaper, previewTrack,
    budget: BUDGET, TURN_LEADS,
    get loopOn() { return loopOn; }, get playTl() { return playTl; }, get preparing() { return preparing; }, get paused() { return paused; }, get startMark() { return startMark; }, get exporting() { return exporting; },
    get mixBypass() { return mixBypass; }, set mixBypass(v: boolean) { mixBypass = v; },
    get turnLead() { return turnLead; }, set turnLead(v: number) { turnLead = v; },
  };
}
