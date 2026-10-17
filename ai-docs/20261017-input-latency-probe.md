# 按键到出声要等多久：MIDI 键盘做完后的防卡调查

> created 20261017 by Claude Opus 5.5 · as-of v0.12.26 / 2026-10-17
> 只量、只提方案，**没动刀**。动刀前等 user 点头分道方案，并且按规矩切 Fable（性能线归 Fable）。

## 0. 起因（user 原话）

- 做 MIDI 之前我说「Web MIDI 的消息只到主线程，排版或预唱占着主线程的时候，按键会晚到」，user 2026-10-16：「所以以后重活应该换到副线程？还是这个换到副线程？如果能键盘线程处理midi，最好把midi收到键盘的深模块里就好了」→「先实现midi，然后看一下怎么防卡」。
- 回答第一问：**MIDI 换不了线程**。`navigator.requestMIDIAccess` 只挂在 window 的 navigator 上，worker 里没有，MIDI 端口也不能转交给 worker。所以 MIDI 只能在主线程收；它已经收进键盘模块（`src/keyboard/midi.ts`），但模块只是代码上的模块，不是另一条线程。能做的是**别让声音等 app**（下面 §3）。
- 家族规矩（10-04 WXHW 键盘轮）：「键盘不被 app 卡」= 结构隔离（谁等谁、分道），不是去优化 app、也不是给 app 立「不许有长任务」的规矩。

## 1. 量了什么、怎么量

`scripts/probe-input-latency.mjs`（无头 Chromium，PC；假的 Web MIDI 装进页面）：在发琴键消息之前打点，量到 `engine.auditionOn` 被调用（声音交给音频线程那一下）为止。音频线程之后那段（输出缓冲，设置页写着浏览器报的输出延迟）不算，那段跟这次的改动无关。

大歌是现造的：一条 track 1204 个 token（団子全曲 5 张纸 × 10 声部约 1362 个 token，量级相当，但形状不同：这是一条长 track）。

## 2. 结果

| 情况 | 琴键 → 交给音频线程 |
|---|---|
| 空歌，写音 | 中位 3.0–3.4 ms |
| 大歌，写音 | 中位 34–36 ms，最大 70–85 ms |
| 大歌，四个键隔 20 ms 快弹 | 第 1–4 个键：约 28 / 43 / 53 / 60 ms，坏的一轮 30 / 96 / 117 / 140 ms（后面的键大部分时间在排队等主线程） |
| 大歌，「弹」开着（只响不写） | 0.3 ms |
| 手指按 pad 音键（模拟 touch 的 pointerdown）：空歌 / 大歌 | 中位 3.4 ms / 中位 43 ms、最大 71 ms（同一个宿主，和 MIDI 一样慢） |

这是 PC。iPad 上的主线程慢好几倍，同样的结构只会更糟（没在真机上量）。

user 10-17 问「为什么之前触屏写不会延迟？还是也延迟？」：**也延迟**，pad 音键、电脑键盘写音、MIDI 都是先写后响（这个顺序 MIDI 之前就是这样）。之前没觉出来，可能的原因（推测，没核）：平时在小歌 / 「本段」视图里写，要重排的东西少；大歌（団子）多在电脑上混音，写音少；触屏本身就有一截系统延迟，盖住了小歌里多出来的那几毫秒。

## 3. 为什么慢：声音排在重画后面

音键按下的路（pad 手指、电脑键盘、MIDI 都走 `src/app/pad-host.ts` 同一个宿主）：

```
noteDown → padWrite → writeAndLocate → update → D.commit → afterState:
              view.render()（谱变了 = 整张重排 engrave）、pad.render()、renderTitle()、changed()、
              updateChrome()、refreshIssues()、renderUndo()、两个定时器
         → padSound → sound.down → engine.auditionOn（这时才交给音频线程）
```

**先写、整张重画、再响**。歌越大，重画越久，声音越晚；快弹时下一个键的消息要等上一个键的重画跑完才轮得到（主线程一次只做一件事）。「弹」开着不写谱 = 不重画 = 0.3 ms，证明 MIDI 本身和音频那一侧都不慢。

## 4. 方案：分两条道（提案，等 user 点头）

- **声音道（永远不等 app）**：音键按下 → 单声护栏（纯函数，几微秒）→ **马上** `sound.down` 交给音频线程 → 然后才进 app 道。MIDI 给的是绝对音高，先响的就是要写的那个音（按调号换写法不改音高）；pad 的升降锁也是按下那一刻就定了。手指 / 电脑键盘 / MIDI 一起受益（同一个宿主）。
  - 要想清楚的边角：只选了一个音时按键 = 改这个音（现在是改完 `previewEdited` 再响）；叠音合进根音时现在响整个和弦（`soundTok`），先响只响新按的那个——根音还按着就还在响，大概听不出差别。
- **app 道（写照写、画挪到下一帧）**：状态变更照旧同步（便宜，撤销、光标都照旧）；重画（`view.render` / `pad.render` / 标题 / 清单 / 撤销栏）合并到下一帧画一次。快弹四个键落在同一帧 = 只重排一次。
- **天花板（照实说）**：网页里 MIDI 消息和 app 共用一条主线程是物理上限。一次大歌重排（34–85 ms）**正在跑**的时候来的键，照样要等它跑完；分道只保证声音不再排在**自己这一下的**重画后面、快弹时不再一个等一个地累积。再往下压 = 让重排本身变便宜（只重排改了的那一行 / 只排看得见的 = W-17 第 3 刀虚拟化）——那属于「优化 app」，按 10-04 的规矩先问 user 要不要做。

## 5. 改完怎么验

同一把尺子：`node scripts/probe-input-latency.mjs`，前后对比「大歌写音」和「快弹」两行（目标：写音和「弹」一样在 1 ms 内交给音频线程；快弹不累积）。手感守卫照旧 = E2E `@pad`（含 `midi.mjs`）。iPad 真机的数字要 user 在真机上看（无头量不到 iPad 的主线程）。

## 6. 改完的数（v0.13.0，2026-10-17，Claude Fable 5.1；user「bump minor，然后开始动大性能刀…先发声再显示可以吗」）

落了两刀（代码量很小）：
- **先响后写**：`pad-host.ts noteDown`（pad 手指 + MIDI）和 `main.ts` 电脑键盘的音键——按下那一刻先 `sound.down`，再写谱；写完成了和弦只补多出来的音、主音变了才重响（`soundAfterWrite`）。
- **画合并到下一帧**：`main.ts afterState` 不再同步重画，`queuePaint()` 排一帧，rAF 里 `paintNow()` 做一次（谱 / pad / 标题 / 挂签 / 清单 / 撤销钮）；`changed()`（脏 / 自动存）和两个定时器照旧同步。谁在帧之前要最新排版 = `ScoreView.layoutNow()`（歌词框 / 记号框 / head / E2E 钩子；同一份状态问第二次直接回）。中途有人显式 `view.render()` 过（`paintedFor`）这一帧不再画谱。
- 分账秒表 `src/ui/perf-trace.ts`（`__moonsinger.perf()`），常驻。

同一把尺子（`scripts/probe-input-latency.mjs`，无头 Chromium，PC），改前 → 改后：

| 情况 | 改前 | 改后 |
|---|---|---|
| 空歌写音 → 交给音频线程 | 中位 3.0–3.4 ms | **0.2 ms** |
| 大歌（1204 token）写音 → 交给音频线程 | 中位 34–37、最大 85 ms | **0.4 ms、最大 2 ms** |
| 大歌四键隔 20 ms 快弹（每键该响→真响） | 28 / 43 / 53 / 60；坏的一轮 30 / 96 / 117 / 140 | 2 / 16 / 29 / 9；坏的一轮 1 / 17 / 83 / 64（重排 3 次而不是 4） |
| 「弹」只响不写 | 0.3 ms | 0.3 ms（不变） |

分账（大歌写一个音，主线程上那一帧）：view.render 37 ms = **engrave 28** + svg-parts 4.7 + svg-dom 0.7 + decor 1.8；pad.render 0.5；标题 / 挂签 / 清单 / changed 都 ≤ 0.2。

**还剩什么**：快弹时第 2 个键起的等待（16–80 ms）全是「上一次 engrave 正在跑、主线程腾不出来」——这是 §4 说的天花板。再往下只有两条路：① engrave 挪进 worker（主线程每键只剩 svg-parts + DOM ≈ 7 ms）；② engrave 本身变便宜（按纸 / 按行增量）。两条都归「优化 app」那一侧，见 §7。

## 7. 排版进 worker：理不理性（给 user 的回答，2026-10-17 Fable）

user：「也许需要移动渲染到副线程。全量渲染，包括月读。然后显示是不是也能移到另外一个独立的线程。这样理性吗」。

- **月读 / 出声引擎早就不在主线程**：唱在 `src/singer/worker.ts`（1–2 条道）、出声在 AudioWorklet（`src/engine/studio-processor.ts`）、mp3 在 worker。这一半没有东西可搬。
- **显示这一侧**，主线程上每键的大头只有 engrave（28 ms / 1204 token，PC；iPad 估 2–3 倍）。它从 v0.12.14 起是纯函数（谱 + 选项 → Layout），**原则上能进 worker**。要解决的三件事：
  1. **量字宽**：engrave 靠 `measureLyric`（canvas `measureText`，字体栈 `system-ui, Hiragino Sans, PingFang SC, Noto Sans CJK JP`，全是系统字体，不含 Bravura——力度字的墨迹是常数表）。worker 里 OffscreenCanvas 也能 measureText（Chrome 早有；Safari 16.4 起有 OffscreenCanvas 2D）。**要核**：同一串字 worker 量出来和主线程一模一样吗（PDF 的所见即所得靠这把尺子；差一点 = 断行不同）。
  2. **Layout 要能过线**：现在 `Layout` 带三个闭包（`lyricY / yOf / dOf`），structured clone 过不去 → 改成平数据 + 主线程重建那三个函数。
  3. **异步**：排版晚一帧回来。点击 / 拖 / 歌词框定位读「最近一份」排版（本来画也是下一帧了）；要「立刻要」的地方（E2E 钩子、PDF）给一个同步退路（主线程也留一份 engrave 能跑）。
- 收益与代价：主线程每键从 37 ms 降到约 7 ms（svg-parts + DOM + 装饰），快弹不再等 engrave；代价 = 每键一次 song 的 structured clone（1200 token 约 100 KB，≈1 ms）+ Layout 回传 + 上面三件事的改动量。**另一条路（增量排版，按纸记忆）**对多纸的歌（団子 5 张纸）同样能把 28 ms 砍到几 ms，不动线程、不碰字宽；但对一张纸 1200 个音的极端谱没用。
- **我的判断**：先核 1（半小时的探针：worker vs 主线程各量同一组中 / 日 / 英字串）；核得过 → worker engrave 值得做（是结构解耦，不是「欺负 app」）；核不过 → 走按纸增量。两条都没动，等 user 点头。

### 7½. 两项前提核过了（2026-10-17 当晚，Fable；探针在 job tmp，没进仓）

1. **worker 里量字宽 = 主线程**：同一个字体栈、7 种字号 × 18 串（假名 / 汉字 / 英文 / 数字 / 标点 / 「‿」）共 126 个宽度，OffscreenCanvas 和主线程 canvas **逐位相同（最大差 0）**。无头 Chromium；Safari 没核（iPad 上 OffscreenCanvas 2D 从 16.4 起有，字体解析是否一致要真机看——核法：同一个探针在 iPad 上跑一遍）。
2. **Layout 过线的代价**：去掉三个闭包后 Layout 平数据 **735 KB（JSON）、structuredClone 6.8 ms**；song 106 KB、0.5 ms。→ 把整个 Layout 传回主线程每键要花 7 ms，吃掉小半收益。**所以 SVG 串化（toSvgParts，4.7 ms）也应该在 worker 里做**，回主线程的只有：SVG 分组字符串（字符串拷贝是 memcpy 级）+ 命中 / 定位要的几何（notes / rests / heads / systems / lyrics / marks / dyns / bars / measures / 纸边…，Layout 里的小头）。这样主线程每键 ≈ DOM 补丁 0.7 + 装饰 1.8 + 消息 ≈ **3–4 ms**（现在 37）。
3. 形状：`src/render/` 里 engrave + toSvgParts 本来就是纯函数（`src/core` 的无头渲染也在用），worker 壳 = 一个文件；主线程 `ScoreView` 读「最近一份」几何、`layoutNow()` 留同步退路（主线程也能跑 engrave，E2E / PDF 用）；`yOf / dOf / lyricY` 从 systems 数据重建。预计改动：`src/render/layout-data.ts`（几何子集的类型 + 从 Layout 切出）、`src/render/engrave-worker.ts`、`score-view.ts` 的读法、`build.sh` 多一个 bundle。**没动，等 user 点头。**
