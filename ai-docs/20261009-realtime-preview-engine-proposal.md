# 实时试听引擎：提案（等 user 拍，不是契约）

> as-of v0.9.0 / 2026-10-09 · created 2026-10-09 by Claude Fable 5.1
> 起因：user 2026-10-09「今天开始做实时试听，也需要想一下怎么听，比如选一段听，最practical的需求是从中间开始而不是每次编辑之后都得从头放。顺便还有不同曲段之间的连接不应该生硬。我们开始设计吧」。
> 构想的原话全集 = `20261009-sound-engine-user-vision.md`（下称 **VIS**）；现状 .h = VIS §17。本稿 = 提案 .h + 切几刀 + 要 user 拍的清单。讨论 ≠ 授权：每一刀开工前等点头。
> 「」= user 原话；【AI】= 我提的。

## 1. 要解决什么（原话 → 验收）

| user 要的 | 验收（做到了就是这样） |
|---|---|
| 「从中间开始而不是每次编辑之后都得从头放」 | 点谱 / 光标在哪，按播放就从那儿出声；改一个音之后再放，只有被改到的那一句要重算 |
| 「选一段听」 | 范围 = 全部 / 本段（这张纸）/ 选区（选中的音到选中的音）/ 循环段；循环开着就一直转 |
| 「边算边放」「实时级别的键盘…能争取尽量争取，弄清代价」VIS §8 | 慢引擎（月读）第一句好了就开播、后面边放边算；快引擎（SoundFont / 元音版）零预算、按下即响 |
| 「不同曲段之间的连接不应该生硬」 | 纸界不切句、不切尾音；循环点不切尾音；编排重复的纸不重算 |
| 「既然是实时我肯定是可以边放边调整混音的」VIS §8 | 推子 / 声像 / 静音 / 独奏 / 校准边放边动，立刻听见；换人不停走带 |
| 「播放时内存不要占用太大，除了cache系统之外都是边播边生成」VIS §3.3 | 音频线程里只留播放头前后一小窗；SoundFont / 元音版不缓存任何渲染结果 |
| 「智能cache要看计算的代价」「月读…不同组件的输出有不同的cache规则…歌词移位再复原」VIS §9 | 只缓存贵的；月读分「念」「唱」两级；键按内容不按位置 |
| 「所有歌手都想办法弄一个接口，我们应该比vst复杂」VIS §2 | 月读 / SoundFont / 元音版 / 以后的物理建模、合成器、琶音器走同一份提案 .h（§6） |
| 「不是显示自动上，而是就是不出声，报错，人类手动换」 | 跟不上 = 等或空着并标出，绝不拿元音版顶 |
| 「旧引擎不用留念念旧，只是placeholder」 | 播放 / 混音 / 导出整条换掉，不在 `renderMix` 上刮痧 |

## 2. 一句话架构

**时间线**（谱压平成秒）→ 每个声部一条**通道**，通道上挂一个**演奏者**：快的（SoundFont / 元音版 / 以后的合成器、物理建模）住在音频线程里按音符即时出声；慢的（月读）在 worker 里按句出「块」，由**调度器**按「离播放头多近」排队算好、喂进音频线程的**块播放器**。音频线程里的**录音房处理器**拥有走带（播放头 / seek / 循环 / 范围）、每条通道（增益 / 声像 / 表情曲线）、总轨（增益 / 限幅 / 表），实时放和离线导出跑同一个类。缓存只存慢引擎的产物，按代价和预算留。

```
主线程                                   worker（月读）                 音频线程（AudioWorklet「录音房」）
谱 ──压平──► 时间线 ──► 每声部 Plan ──┐                                ┌────────────────────────────┐
                                     ├─快引擎：音符表 ───────────────►│ 乐器实例 (tsf / 元音版 / …) │
                                     └─慢引擎：块清单 ─► 调度器 ──► 念 / 唱 ──块──► 块播放器 (窗内几块)│
UI 推子 / 静音 / 换人 ──参数消息────────────────────────────────────►│ 通道：增益·声像·表情曲线     │
UI 走带（播放 / 停 / seek / 循环 / 范围）──────────────────────────►│ 走带 + 总轨（增益·限幅·表） │
◄── 位置 / 电平 / 块缺口 ───────────────────────────────────────────┤ 同一个类离线跑 = 导出        │
                                                                    └────────────────────────────┘
```

## 3. 时间线（Timeline）

- 现成的零件：`songPlayOrder`（编排 + 循环段）、`flattenPart`（每声部按顺序压平 + 纸内反复展开）、`tempoMapOf` / `timeline()`（token → 秒）。提案 = 把它们收成一个纯函数 `buildTimeline(song, scope)`，出：每声部的秒级音符表、纸实例边界（`[{paper, t0, t1}]`，画播放跟随用）、循环窗（`loopWindow` 的现成算法，但**不再把循环段渲染两遍**）、总长。
- 播放头 = 时间线上的秒；双向映射 `secondsOf(paperInstance, tokenIndex)` / `locate(seconds)`——「从光标放」和「谱上跟着亮」各用一向。
- 范围 `{from, to}` 秒 + `loop: boolean`。「本段」= 这张纸那一段实例；「选区」= 选中的第一个音起点到最后一个音终点；没选 = 全部。
- 改谱 = 新的时间线版本号；块按内容键复用，不靠版本号失效。

## 4. 两类演奏者

| | 快（realtime） | 慢（chunked） |
|---|---|---|
| 住哪 | 音频线程，录音房处理器里的实例 | worker |
| 输入 | 音符事件（采样位置、键、力度、每音表情） | 一块唱谱（一句）+ 歌词 |
| 输出 | 每块 128 帧逐块出声 | 一块 Float32 + 它在时间线上的 t0 |
| 缓存 | 无（「很便宜的midi轨…不该占 pc 级内存」） | 有，按预算 |
| 现有 | SoundFont（`synth-processor.ts` 已是 worklet）、元音版（现在在主线程，搬进来 ≈100 行） | 月读 |
| 以后 | 合成器 / 琶音器 / 物理建模 | 别的歌声引擎 |
| 按键试听 | 直接 noteOn | 没有（即兴 = 这条通道临时用元音版的音；画灰明说） |
| seek 到长音中间 | 在 seek 点触发还在响的音（note chase；tsf 不能从中间起）| 块里按采样偏移起，10 ms 淡入 |

月读切块的规则改一条：**不在纸界切**，只在 ≥0.25 s 的休止 / 换气记号处切（`singChunks` 的 `bounds` 不再进 cuts）；一句跨纸也是一块。同一声部换人（这张纸换了别的歌手）当然是边界。

## 5. 录音房处理器（音频线程）

一个 AudioWorkletProcessor，里面一个**不依赖宿主**的 `Studio` 类（纯 `render(frames)`），worklet 只是壳；导出时同一个类在 worker 里跑循环（离线 = 实时同一份数学；不押 Safari 的 OfflineAudioContext + worklet）。

- **走带**：`play / pause / seek(sec) / setRange / setLoop`；每块推进播放头；到范围尾：循环 = 跳回（正在响的音、块的尾巴照响，不切）；不循环 = 停止排新音、尾巴响完（最多 2 s）再报 `ended`。每 ~50 ms 报位置。
- **通道**（每声部一条）：`gainDb`（麦克风 + 校准，5 ms 平滑）、`pan`（等功率）、`mute / solo`（只管走带来的声，不管按键）、**表情曲线**（`gainSegments` 的分段，播放时乘，不再烤进缓存——这是「边放边调」和「缓存键不含增益」的前提）、它的演奏者实例或块清单。
- **块播放器**：块 = `{t0, sr, samples}`，播放时线性重采样到设备采样率（现 `sumTracks` 的做法）；只留播放头 `[−1 s, +提前量]` 窗内的块，别的交回主线程缓存。
- **总轨**：增益、**前瞻限幅**（现 `limitBus` 的 3 ms / 150 ms，前瞻 = 3 ms 延迟；只管走带来的声）、峰值表。「智能判断混音路由」【AI 的理解，待 user 说】：通道全是默认值就直通不算；静音 / 没独奏的通道整条不渲染；没超天花板限幅器不动——路由由「有什么」推出来，没有固定插槽。
- **按键试听**：`audition(track, noteOn/Off)` 走该通道的增益 / 声像 / 校准 + 光标处力度（主线程算 `dynLevels` 后给力度），绕过 mute / solo 和总轨限幅（user「按键不管solomute同意」「限幅嗯」）。
- **实时演奏模式**（§9）：同一条路，只是键盘不写谱。

## 6. 提案 .h（窄接口）

```ts
// src/engine/contract.ts（提案）—— 演奏者引擎的窄接口。量纲写在参数表里（vault 自描述），不写在名字里。
export type Unit = "dB" | "cents" | "s" | "ratio" | "midi" | "bool" | "enum";
export interface ParamDef { id: string; unit: Unit; min?: number; max?: number; default: number | string; label: string; formula?: string /* latex / 伪码：这个参数在算法里是什么 */ }
export interface EngineDescriptor { engine: string; version: string; kind: "realtime" | "chunked"; params: readonly ParamDef[]; describe(): string /* 给 vault README：算法一句话 + 出处 */ }

/** 快的：住在音频线程。由录音房处理器实例化；load 的字节经消息递进来。 */
export interface RealtimeInstrument {
  readonly desc: EngineDescriptor;
  load(bytes: Uint8Array | null, cfg: Record<string, unknown>, sampleRate: number): void;
  noteOn(key: number, vel: number, expr?: NoteExpr): void;   // expr = 每音表情（力度之外：音内起伏、滑音…以后）
  noteOff(key: number): void;
  allOff(): void;
  setParam(id: string, value: number): void;
  render(out: Float32Array, from: number, frames: number): void;   // 单声道，叠加写
  active(): number;              // 还在响的声数（走带收尾、复音上限用）
  tailSeconds(): number;         // 松开后最多响多久（范围尾 / 导出尾用）
  dispose(): void;
}

/** 慢的：住在 worker。按块出声；块 = plan 切出来的、带内容键。 */
export interface ChunkPlan { key: string; t0: number; t1: number; depKeys: string[] /* 更早一级的缓存键（月读：念 = 歌词级） */ ; estimateMs: number; estimateBytes: number }
export interface ChunkedSinger {
  readonly desc: EngineDescriptor;
  prewarm(signal: AbortSignal, progress: (p: Progress) => void): Promise<void>;   // 装模型；可取消
  plan(track: FlatTrack, cfg: SingerCfg): ChunkPlan[];                             // 纯函数、便宜；键按内容不按位置
  render(chunk: ChunkPlan, signal: AbortSignal, progress: (p: Progress) => void): Promise<RenderedChunk>;   // 一块；depKeys 命中就跳过那一级
  unload(): void;                                                                 // 归还内存（wasm 堆只涨不缩 → 关 worker）
}
export interface RenderedChunk { key: string; sr: number; samples: Float32Array; t0: number }
export interface Progress { stage: string; frac: number | null; chunk?: number; of?: number }

/** 录音房（音频线程里的类；worklet 和离线导出共用）。 */
export interface StudioIn {
  setTimeline(tl: TimelineMsg): void;         // 各通道的音符表 / 块清单（只有键和位置）/ 表情曲线 / 范围 / 循环
  putChunk(track: string, c: RenderedChunk): void;   // 调度器喂块（Transferable）
  setChannel(track: string, p: Partial<ChannelParams>): void;   // 边放边调
  setMaster(p: Partial<MasterParams>): void;
  transport(cmd: "play" | "pause" | "seek", sec?: number): void;
  audition(track: string, ev: NoteEvent): void;
  loadInstrument(track: string, engine: string, bytes: Uint8Array | null, cfg: Record<string, unknown>): void;
}
export interface StudioOut { position: number; ended: boolean; missing: { track: string; key: string }[] /* 播放头将到、块还没来 */; peak: number }
```

现状 .h 见 VIS §17（`Singer.sing / gm / play`、`GmSynth`、`Sampler`、`mixTracks`、`gainSegments`）。这份提案落实时形状变了要回写这里。

## 7. 调度器与缓存

- **调度器**（主线程）：输入 = 时间线 + 播放头 + 方向；输出 = 「下一块算哪个」。顺序 = 播放头之后按距离、循环时绕到循环头；一次只给 worker 一块（借朗读库 `cancelPending` 的做法：seek / 改谱让队列里没开算的作废，正在算的算完仍可入缓存，键对就不浪费）。
- **预热**【AI，待拍】：歌里有月读上场 = 意图 → 打开歌后在空闲片预热引擎，再从光标附近预唱几句；都可取消、可关。
- **预卷 / 跟不上**（要 user 拍，§11 ①）：开播前至少第一块到位；播放中块没到：A = 走带等（那一句上转圈），B = 那一句空着并画灰、走带不停。两种都不替补。
- **播放中改谱**：正在响的块不换，响完换新的（标「旧」）；快引擎的音符表立刻换（已经响的音不动）。
- **缓存**（主线程，只存慢引擎）：
  - 预算 = `min(deviceMemory/8, 96 MB)`【AI 数字，刀 0 量完再定】；LRU；只缓存 `estimateMs ≥ 门槛` 的块（便宜的不留——「要看计算的代价」）。
  - 月读两级（代码核过：`sing-core.mjs:110-136` 两遍 piper 和 WORLD 分析只依赖歌词 / 哼的字 / 选项，**不依赖音符**；音符 / 速度 / 记号只进「按谱重建 + 合成」）：
    - **念**（depKey = 歌词文本 + 语言 + 哼的字 + preset + opt + 模型 sha）：piper 的取样 ≈88 KB/s；WORLD 分析（sp/ap Float64 ≈1.6 MB/s）**留不留要量**（留 = 改旋律只剩合成；不留 = 改旋律要重分析）。
    - **唱**（key = 念的 key + 音符 + 速度 + 字前记号 + 移调）：≈88 KB/s，四分钟一位 ≈21 MB。
    - 歌词移位再复原：键里没有位置 → 命中；编排重复的纸 → 命中；只改旋律 → 只重算唱。
  - 「即算即扔」：worker 里 WORLD 的 Float64 中间量合成完立刻 free；单精度（省一半，输出会变——冻结样本要重定基线，§11 ⑥）。

## 8. 怎么听（走带 UX）

- **从光标放**：播放钮 / 空格 = 从光标所在的音起；再按 = 暂停（停在那儿）；「从头」另一个小钮。点谱 = 移光标（现状），不自动放。
- **范围**：一个 toggle 组「全部 / 本段 / 选区」+「循环」开关（现有的 loopBtn）；循环段 = 编排里的 `[…]`（现状），没有编排 = 范围本身循环。「接缝」钮 = seek 到循环尾前 4 s（现有行为，变成一次 seek）。
- **播放跟随**：谱上当前音亮、换纸时跳到那张纸（横卷以后）。
- **慢的那位的状态在谱上**：每一句一条细线：算好 / 在算（转圈）/ 缺（画灰，点开说为什么）。
- **即兴模式**（刀 3）：pad 一个开关「只弹不写」，走通道、不写谱。

## 9. 「不生硬」逐条

| 生硬在哪 | 怎么不生硬 |
|---|---|
| 一句跨两张纸被纸界切成两块（现 `singChunks` 的 `bounds`） | 不在纸界切（§4） |
| 本段 / 范围结尾把尾音切断 | 范围尾停止排新音，尾巴响完再停 |
| 循环点 | 走带跳回，正在响的音和块的尾巴照响；不再渲染两遍 |
| 纸界速度变化 | 时间线本来就按速度表算秒 |
| 编排重复的纸 | 缓存命中，不重算；混音不同 = 复制那张纸（user 定的） |
| 块与块之间 | 切在休止处（本来没声）；块尾 30 ms 淡出照旧 |
| 换人 / 换乐器的那张纸 | 通道换实例；慢引擎的块在换人处断开 |

## 10. 实时演奏：代价（刀 0 要量的，先给量级）

- 出声延迟 = 设备输出延迟（iPad Safari 128 帧 @48k ≈ 2.7 ms 每块，实际 `outputLatency` 10–25 ms）+ 触摸到 JS（10–30 ms）+ 限幅前瞻 3 ms（试听绕过）→ **20–60 ms**，弹着玩够，不是舞台乐器（JN 08-18 AI 已说过，user 没反对）。
- 每块预算 2.7 ms：tsf 每声每 128 帧的开销要量（PC + iPad），定复音上限；元音版采样器几声可忽略。
- 月读：一个音 ≈0.7 s（GR:102）→ **不实时**；即兴时这条通道用元音版出声并画灰明说。
- 物理建模 / 合成器：只要设计成逐块 `render` 就天然实时。

## 11. 要 user 拍的

1. 跟不上：A 等（转圈）还是 B 空着画灰、走带不停？【AI 推荐 A：写歌时听到错位比等一下更误导】
2. 「选区」= 选中的音的范围，对吗？没选 = 全部。
3. 播放中改谱：正在响的那一句不换、响完换新——可以吗？
4. 预热：歌里有月读上场 = 打开歌后空闲片预热 + 预唱光标附近，可以吗？还是点播放才动？
5. 刀 0 的量代价：只在这台 PC 上量，iPad 的数字等你有空时跑一个诊断页（不催）。
6. 刀 2 要把 `sing-core.mjs` 拆成「念」「唱」两段并可能改单精度：冻结样本的逐样本相同要重定基线（拆段本身我会保证 noise 0 逐样本相同；单精度不保证）。
7. 本段视图下播放 = 本段范围（现状）保持？
8. 刀 1 先不动月读的内部（块仍由现在的 `renderSungChunks` 顺序算），先把走带 / 混音 / 从中间放落地——这样先用起来；可以吗？

## 12. 切几刀（每刀能单独上 dev）

- **刀 0 量代价**（半天）：node 里量 piper 每句 / Harvest 每秒 / 合成每秒 / tsf 每声每块；出一张表进本稿 §10；定缓存级和提前量。
- **刀 1 录音房 + 走带**：`Studio` 类 + worklet 壳 + 时间线 + 通道 / 总轨 / 块播放器 + 元音版搬进音频线程 + 范围 / 循环 / 从光标放 / 播放跟随（亮当前音）+ 边放边调 + 导出走同一个类。月读块暂由现有顺序渲染喂入（先全算完再放，和现在一样慢，但从中间放 / 不切尾音 / 改混音不重算已经成立）。删 `renderMix / mixTracks 的播放路 / loopPlan 渲染两遍 / sampler.renderSong`。
- **刀 2 边算边放**：调度器 + 预卷 + 跟不上策略 + 缓存预算 + 月读两级缓存（sing-core 拆念 / 唱）+ 不在纸界切 + 进度 / 取消 + 「即算即扔」。
- **刀 3 试听与即兴**：按键走通道 + 光标处力度；即兴模式；总轨 UI（增益 / 限幅开关 / 表）；换人不停走带。
- **刀 4（以后）**：效果器 / 混响发送、物理建模乐器、曲线、实时录曲线。

每刀的测试：`Studio` 纯类在 node 里逐块跑（确定性，离线 = 实时同一份）；走带 / seek / 循环 / 范围尾的 E2E；缓存命中 / 移位复原的单元测试；冻结样本照旧。
