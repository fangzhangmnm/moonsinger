# Fable 名下其余几条的研究稿：智能重画（W-17）/ store 深缺口（F-19）/ 唱歌胶水那一刀（F-13）

> created 20261013 by Claude Fable 5.1 · as-of v0.11.4（dev）/ 2026-10-13
> user 2026-10-13：「这段做完之后再把moonsinger里面需要fable做的东西能做的做需要和我讨论的可以先研究」。做掉的在别处（W-21 / W-37 = v0.11.4；W-20 = `20261013-test-tiers.md`；F-16 = `20261013-dango-c10-pop-probe.md`；F-17 = `20261013-edit-state-machine-survey.md`；F-18 = 格式守卫 commit）。这里是**要和 user 讨论**的三条，只研究、没动码。月读「奶 / 拖粘」研究按 user「有心思了研究」照旧搁着。

## 1. W-17 谱面智能重画（user 10-10「系统的优化一下渲染逻辑，不全页总谱重画，而是智能重画」）

### 量过的（团子大家族，5 张纸 × 10 声部，1362 个 token）

| 在哪量 | 什么 | 数 |
|---|---|---|
| node（量字按字符数近似） | `engrave()` 一次 · 全部 · 连续 | 中位 25 ms（15–50） |
| node | `engrave()` · 本段 C · 连续 | 7.7 ms |
| node | `engrave()` · 全部 · 听（foldAll） | 13 ms |
| node | `engrave()` · 本段 C · 只看一位 | 2.1 ms |
| 无头 Chromium（真 app，`m.set` 挪一格光标，同步部分） | **全部视图** engrave + `toSvg` + `outerHTML` 换整张 | **中位 80 ms（72–117）**；SVG 5073 个节点 / 563 KB |
| 无头 Chromium | **本段视图** 同上 | 11.7 ms；665 个节点 / 68 KB |

每次状态变（挪光标、选区、写一个音、撤销、改模式…）都是这一条：`score-view.ts render()` → `engrave(整首)` → `toSvg(layout)` → `old.outerHTML = svg`。全部视图下 engrave 只占三成，**七成在生成 + 换整张 SVG**（浏览器解析 563 KB、建 5000 个节点、重排、重画）。PC 上 80 ms = 每个键盘动作卡一帧多；iPad 通常慢 3–4 倍 → 全部视图写一个音 ≈ 250–300 ms，就是 user 感到的「全页重画」。本段视图 12 ms 还好。

### 进度（2026-10-14，edited by Claude Fable 5.1；user「智能重画：你看着办呗」）

- **第 2 刀先做了 = v0.12.7**：`toSvgParts` 把图元按行谱分成 `<g>`（第 0 组杂项 = 歌名 / 作者栏 / 曲段控件 / 页框，组内先后不变），score-view 逐组比字符串、只换变了的组（框 / 组数变了才整张换）。団子（5 纸 × 10 声部，1362 token）全部视图挪一格光标：**65 → 26 ms**（中位，无头 Chromium；63 个顶层组，节点数不变）。剩下的 ≈ 全是 engrave（25 ms）。单元 `test/svg-groups.test.ts`。
- 第 1 刀（光标 / 选区不进 engrave）没动：光标是零宽的「head」单元，还牵着「光标在满了的小节后面 = 画在小节线后面」这类手感规则（engrave.ts 306），要和编辑心智模型（`20261014-editing-mental-model.md`）一起理，单独一轮。第 3 刀（虚拟化）照旧排最后。

### 建议（原稿；第 2 刀已做，第 1 / 3 刀没动）

分两刀，第一刀便宜、收益大，第二刀贵：

1. **光标 / 选区 / 高亮不进 engrave，画在上面那一层**（和播放头、小节底色、鬼音符现在一样——它们已经在 `ink` 层、不动排版）。engrave 现在吃 `caret / sel / hot / span / justWrote / lead / caretEnd` 七个「装饰」参数，所以挪一格光标也要整首重排 + 换整张 SVG。改成：`engrave` 只看歌 + 视图（宽 / 纸 / 范围 / 显示的声部 / 折叠），结果缓存（键 = 歌的引用 + 视图参数）；光标、写字头、选区带子、把手、染色都按缓存的 `Layout.notes / slots` 坐标画进 `ink`。效果：**挪光标 / 选区 / 开小菜单 = 0 次 engrave、0 次 SVG 换**（≈ 1 ms）；写一个音仍要一次。风险低：排版一个字节不变，只是谁来画光标；`test/e2e/select / finger / rest / caret-end / sel-tweak / top-sels` 守。
2. **写一个音时只换变了的行**：`toSvg` 按行（system）出片段、每行一个内容哈希，和上一次比，只换变了的 `<g>`；整首重排照旧（25 ms），省的是换 SVG 的七成。再往后才是「只重排从改动那一行起」（排版有回溯：折行、分页、自动谱号整首挑——那是 engrave 自己的增量化，难，先不碰）。
3. **全部视图只画屏幕附近的行**（虚拟化）：5000 个节点只有一屏在看。收益最大但要动滚动 / 跟随 / 翻谱 / 点击区那一串，排最后。

第 1 刀建议和 F-17 第 3 期（手势联合）**分开做**：一个是「画什么」，一个是「手势在哪一步」，都碰 score-view 但不是同一块。

## 2. F-19 store 深缺口（推到一半页面死掉 + 回来前又编辑 → 当分叉弹冲突面；改库要 user 批）

### 现在的路（`@internal/store` 0.16.2，读过代码）

- 推：`push.ts` 带 `If-Match: baseEtag` 上传；412 → 先 `safeResolve.tryHeal(name, bytes)`：**拉云端字节逐字节比对本地现在的字节**，相等 = 上次推其实落了、回执丢了 → `markSynced`；不等 = 真分叉 → 冲突面（两边都保住，不丢字节）。
- 缺口：上传落了云、回执没回、页面死了；回来之前用户**又改了**（本地字节变了）→ `tryHeal` 比对不等 → 当真分叉弹面。字节一个都不丢（面上两条路都保住），错的是**判断**：这不是分叉，是「自己上次推的 + 自己后来改的」，应该直接接着推。

### 修法（库里，三处；提案，没动）

1. `local-head.ts`：每个文件多记一个 **在途戳** `inflight: { sha256, baseEtag, at }`——上传**之前**写进本地 head（和 dirty / parent 同一处持久化；强退也在）；推成功 / 失败确认后清掉。
2. `safe-resolve.ts tryHeal`：拉云端字节后，先和现在的本地比（原逻辑，相等 = 自愈 synced）；不等再和 **在途戳的 sha256** 比：相等 = 云端那版就是自己上次推的 → `head.markSeen(name, cloudEtag)`（只换 base，不清 dirty）→ 返回「rebased」。
3. `push.ts`：拿到「rebased」= 用新 base 立刻再推一次（这次 If-Match 对得上）；再 412 才弹面。
- 代价：几十行 + 回归测试（MoonSinger `test/e2e/sync.mjs` 已经有「推到一半页面死掉」那条用 `cloud-bridge` 挂起上传模拟，加一条「回来之前再编辑」就是这个洞的反证）。接口零变化 = patch（0.16.3）；但**改库 = 红线区，要 user 先点头**（家规「云同步 store 库」+ memory「store 持久化改动需显式同意」——在途戳是持久化里的新字段）。
- 不动库的替代：没有干净的（app 层拿不到云端字节的哈希历史）。

## 3. F-13 重构刀 ③：唱歌 / 播放胶水从 main.ts 抽出（待拍板的那一刀，量一下有多大）

`src/app/main.ts` 3691 行里，和「这首歌 → 谁上场 → 拿乐器 / 模型字节 → 排段唱 → 混 → 放」有关的（grep 函数名 sing / chunk / pump / prepare / play / audition / prewarm / bank / channel / resource / export）**88 个顶层声明**，集中在三段：

| 段 | 行 | 里面有什么 |
|---|---|---|
| 出声准备 + 月读的泵 | 782–1000（≈ 220 行） | `playSong / songIn / channelOf / pushChannels / performerInfo / prepareBanks`；块的泵 `setChunkOrder / pump / singOne / waitChunksReady / awaitAllChunks / pruneChunks`；资源监控 `resourceTick / shrinkChunks / trimLanesForNewSong`；`prepare / renderMixForTest` |
| 走带 | 1007–1300（≈ 300 行） | `playRange / startPlayback / playPause / resume / pause / replay / playFromHere / playFromHead / playSeam / stopPlay / openTransportMenu / playheadFrame / schedulePlaybackRefresh / schedulePrewarm / wirePlayBtn / prepareBank` |
| 导出 + 试听台 | 1358–1460、1635–1760（≈ 230 行） | `openMp3Panel / exportSong / exportRights`；`audition / setAudition / auditionTarget / ensureVowels` |

≈ 750 行 = main.ts 的两成。它们对外只靠几样：`doc / st`（歌 + 休息室，读）、`engine`（录音房）、`singer`（工作道）、`view.setPlayhead / setStartMark`、`progress / showError / renderBar / diagNote`、`playBtns`。切成 `src/app/performance/`（或 `src/app/singing.ts` + `playback.ts`）一个模块、接口就是上面这几样——W-37 的三个口子都在这一段里（已修），F-14 音源数据模型那一刀碰的是 `performerInfo / prepareBanks`（也在这一段）。所以家族周账 F-13「先切这片」的判断成立：切出来之后 `areas.mjs` 里 main.ts 那一行「整套」能缩，`@play @studio` 改动不再牵全局。顺序归 user（user 给的是 ①→⑦，这是 ③）。

## 4. 这一轮之后 Fable 名下还挂着的

- F-13 / F-14（待拍板：先切哪刀、音源数据模型二选一）—— §3 给了尺寸。
- F-17 第 1–3 期（策划稿 §5 四个问题）。
- W-17 第 1–3 刀（§1）。
- F-19（§2，改库要批）。
- F-28 的另外三份：WXHW / JRB / WeebPaint 的 `service-worker.js` 同一处（`withNoStore` 重建 Response）没修——各仓自己的 session 做，JRB 搬 `read.` 之前必须先修好推正式版。MoonSinger 这份修在 v0.11.4，**还没推 prod**（硬规则 #5）。
- 月读「奶 / 拖粘」研究：按 user「有心思了研究」照旧搁着，没碰。
