# 刀 1 交接：演奏者注册表 + 唱歌 / 播放胶水抽出（现状 .h + 下一刀）

> created 20261014 by Claude Fable 5.1 · as-of v0.12.2（dev）/ 2026-10-14 · 屎山维护纪元（0.12）第一刀的交接；宪法 = `adr/0004-plugins-at-five-seams-core-stays.md`，家族周账 F-13
> 读者 = 接下来动 main.ts / 出声 / 插件的任何 session。两份 .h 都是**现值**（从源码抽的，不是提案）；改了接口请回写这里（家族 API .h ritual）。

## 1. 做了什么（两个 patch）

- **v0.12.1 = 注册表** `src/performers/`：插件 = guid + 英文名 + 整数版本 + 能力字段 + 方法；三个 adapter（tsukuyomi / vowel-sampler / soundfont）；时间线 / perform / groove / lyric-check / pad / main 全改成问注册表，**src 里按引擎名的分支 29 → 0**（`test/performer-branch-guard.test.mjs` 机械守着；`test/performers.test.ts` 守注册规则 + 能力字段自洽；`honors.test.ts` 照旧核「表说认 = 出声真变」）。
- **v0.12.2 = 胶水搬家** `src/app/performance.ts`：474 行原文照搬（只换访问器），main.ts 3681 → 3223 行。界面（钮 / 菜单 / 面板）、文件、undo、音源解析仍在 main。

## 2. 现状 .h ①：演奏者插件（`src/performers/registry.ts`）

```ts
export interface PerformerPlugin {
  readonly guid: string;
  readonly kind: "performer";
  /** 英文名 = 歌里 `instrument.engine` 的值（第一版参数里的引擎名就是它）。 */
  readonly name: string;
  readonly version: number;
  /** 界面上的名字（中文）。 */
  readonly label: string;
  /** 候选 chip 的悬浮说明（一句话：是谁、代价是什么）。 */
  readonly description: string;
  /** 出声方式：chunks = 慢引擎按句出块（时间线出 ChunkPlan、worker 唱、录音房放块）；notes = 快引擎音符表（录音房里实时合成）。 */
  readonly sound: "chunks" | "notes";
  /** 能不能叠音（pad 叠键、两键同按、时间线的和弦）。 */
  readonly poly: boolean;
  readonly lyrics: LyricsAbility;
  readonly hintRange: FixedRange;
  /** 认哪些记号（不认的谱上画灰 + 明说；`test/honors.test.ts` 核「表说认 = 出声真变了」）。 */
  readonly honors: readonly Mark[];
  /** 本来就连着唱（连线 / 保持对它没意义，断句用呼吸）→ 这两个记号画灰的理由是 "sung" 而不是 "gap"。 */
  readonly connected: boolean;
  /** 力度怎么落：velocity = 按下那一下的 MIDI 力度（有力度表）；gain = 音量曲线（dB）乘在声音上。乐器页按这个摆哪一行。 */
  readonly dynamics: "velocity" | "gain";
  /** 拍子轻重预设的类别：voice = 人声一档；gm = 按 GM 音色家族 / 鼓件（要 gm 参数）。 */
  readonly grooveCategory: "voice" | "gm";
  /** 能不能从休息室删掉（第一公民的两位不删；带自己字节的乐器能删）。 */
  readonly removable: boolean;
  /** 出声参数里这位自己的那部分（gm / 分段唱 / 着力点）；通用部分（力度表 / 校准 / 修八度 / 链 / 拍子轻重）胶水填。 */
  info(ctx: InfoCtx): Pick<PerformerInfo, "gm" | "chunk" | "hitSec">;
  /** 出声前准备：库进录音房 / 元音表。抛错 = 这位出不了声（胶水报出来、这个声部不出声、其余照放）。 */
  prepare(ctx: PrepareCtx): Promise<void>;
  /** notes 模式：音符表 → 这位的轨（chunks 模式没有这一步，时间线自己出块）。 */
  track?(ctx: TrackCtx): TrackResult;
  /** 谱上怎么画（没有 = 普通符头、普通谱）。 */
  notation?(ctx: RoleCtx): Notation;
  /** 按键试听用谁出声（没有 = 这位不能试听）。 */
  audition?(ctx: AuditionCtx): AuditionTarget | null;
}
```

解析：`performerOf(engine)`（按英文名 = 歌里 `instrument.engine`）/ `performerByGuid` / `performers()` / `addressOf(p)` = `performer:<name>@<version>`。认不出 = null = 时间线报「还没有人上场」、不出声、不替补。

## 3. 现状 .h ②：胶水（`src/app/performance.ts`）

宿主给：

```ts
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
```

拿回（`createPerformance(host)` 的返回表；函数名 = 搬家前 main.ts 里的名字，语义一行不改）：

```ts
    humOpt, resetLatencyLog, playSong, curFlat, songIn, audibleParts, micOf, channelOf, pushChannels, lowestMidiOf, songBpm, performerInfo, prepare, renderMixForTest, playRange, tickOfCaret, barHeadTick, startPlayback, playPause, resumePlay, pausePlay, replay, playFromHere, playFromHead, playSeam, stopPlay, setLoop, schedulePlaybackRefresh, schedulePrewarm, prepareBank, exportRights, exportSong, resourceSnapshot, trimLanesForNewSong, onSongSwitch, jumpPlaybackToPaper, previewTrack,
    budget: BUDGET, TURN_LEADS,
    get loopOn() { return loopOn; }, get playTl() { return playTl; }, get preparing() { return preparing; }, get paused() { return paused; }, get startMark() { return startMark; }, get exporting() { return exporting; },
    get mixBypass() { return mixBypass; }, set mixBypass(v: boolean) { mixBypass = v; },
    get turnLead() { return turnLead; }, set turnLead(v: number) { turnLead = v; },
```

main.ts 里：`const perfApi = createPerformance({…})` + 只解构 main 还用着的函数；走带态一律 `perfApi.x`（getter / setter）。

## 4. 下一刀（按 ADR-0004 §4 + user 2026-10-14 拍的「一套机制、四个出口」）

1. ~~**刀 1½ = 四个出口**~~ **done v0.12.3**（ADR §2.2½，user「一套机制、四个出口 同意」；原计划照录）：胶水里加一张 `issues()` 表（每个声部：等升级 / 同名顶上要确认 / 认不出 / 找不到声音，由 `prepare` 的报错清单 + 注册表解析算）；出口 ① 谱上名字灰 + 角标（`PartView` 加一位）② 走带 |▶ 右上角常驻角标「N 不出声」（同「循环」角标位），点开一张清单（非模态 sheet，每行一个该按的钮）③ 开歌 / 换人 / 升级后清单**变了**才一条 toast ④ 导出面板一行 + 主按钮改字「照样导出」。`prepare()` 里每次按播放都 toast 的那句改成只在清单变了时说。版本比对本身要等格式那一刀套 guid 壳（§2.2 四种情况）。
2. **刀 3 = 盖层登记**（`20261013-edit-state-machine-survey.md` 第 1 期）：`closeOffer` 44 处赋值收成一个 overlay registry。
3. **歌手管理 = Cubase inspector 卡**（ADR §2.5）：乐器页并进去，插件槽旁的参数行由插件自报（现在 `openInstPage` 的几十行 `row(...)` 按能力字段 gate，是过渡）。
4. **音源来源接缝**：`resolveGmBytes` / `sessionSubsets` / `prepareBank` 的来源链（歌里 → 本次 → 设备缓存 → 音源库 → 找文件）= ADR 五处接缝的「音源来源」，建 `src/sources/` 注册表时从 main 搬。
5. **刀 2 = 键盘前端库**（`20261014-editing-mental-model.md` §6）；W-17 智能重画。

## 5. 坑（这一刀踩的）

- `npm run e2e` 起的 serve 只端出 `dist/`，不构建；deploy 也只发 committed dist → 改了 src 必须 build，bump 后 dist 随源 commit（已改成 `npm run e2e` 先 build；`20261013-test-tiers.md` 末段）。
- 并行 8 个浏览器时 follow / seg-jump / routing（频谱那两条）会红，单跑绿；mixer-fx / routing 的等待已改成轮询（12 s 上限）。
- `host` 里的 `modelBases` / `offerFile` / `creditsOf` 在 main 里声明得比 `createPerformance(...)` 晚：一律用 lambda 包着传（TDZ），别改成直接传值。
