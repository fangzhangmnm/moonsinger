# 写歌的代码流程图（pipelines）

> created 20261109 by Claude Fable 5.1 · as-of v0.16.52 / 2026-11-09 · A8 文字那一层 as-of v0.16.70 / 2026-11-09（Claude Opus 5.5）
> 家规「代码流程图 ritual」（家族根 CLAUDE.md，2026-10-26 立；参考 CatsUp `ai-docs/20261026-pipelines.md`）：用户动作 → 各层 → 落盘 / 上屏；哪个操作走哪条共用流程；每步碰多少东西、实测数字；改流程同一个 commit 更新这份。
> **这一版只理了两条线**（11-09 保存排队 + 键盘总闸这两刀碰过的）：A 按一下 → 改谱 → 上屏 + 自动存；B 开一首歌 / 换歌。播放、唱、渲染、导出 PDF 只画了总图上的位置和入口文件，步骤和数字**没理**——谁改到那几条谁补（user 11-09「让fable看一下排版引擎是整个曲段重拍还是修一行」= 总表第 3 条，补 A 的排版那一步时一起量）。
> 数字来源都标了；没量的写「没量」，不编。

## 一、总图

```
  电脑键盘 ──┐                                   ┌→ 出声（先响后写：pad-host / run()；src/app/sound*、engine）
  触屏键盘 ──┼→ 键盘总闸 input-gate ─→ 命令 apply ─┤
  MIDI 琴键 ─┘   （归谁 / 能不能写）  （纯函数）   └→ D.commit（文档唯一写入口 src/app/document.ts）
  谱面手势 / 菜单 / 面板 ───────────────────────────┘        │
                                                             ├→ afterState：changed()（标脏 → 自动存节律）、放着就重算时间线、停下 700 ms 预热唱、queuePaint
                                                             │        └→ 下一帧 paintNow → view.renderAsync → 排版 worker（engrave + SVG 串化）→ 换 DOM
                                                             └→ 撤销栈（history.ts：每一步存改之前的快照 + locus）
  自动存（2 s）/ 按「存」/ 换歌 / 退出 ─→ editor-session（排队、记住存给谁）─→ encode worker（.mxl 字节）─→ store.zip.save（IDB）─→ consent 时推 OneDrive（Graph，带超时）
  歌库点一首 ─→ H.leave（先安家 / 先存旧的）─→ es.open（排在在飞的保存后面）─→ store.open（新鲜度 / 冲突面）─→ adopt → loadDoc → paint
  放 / 唱 / 渲染 / 导出：src/app/transport*、src/engine/（studio-worklet + singer-worker + mp3-worker）、src/core/（无头渲染）、src/export/score-pdf.ts —— 没理
```

## 二、哪个操作走哪条共用流程（亚种 = 参数）

| 用户动作 | 流程 | 亚种参数 |
|---|---|---|
| 电脑键盘按一个键 | A | `keyOwner` 定归谁（歌库 / 存开 / 输入法 / 打字的框 / 乐器目录 / 乐器页 / 参考窗 / 混音台 / 听 / 控件 / 谱）；谱 = 键表 `BINDINGS` 路由出 Action |
| 触屏键盘按一个键 | A | 音键 `noteDown`（能写 = 响 + 写；不能写 = 只响）；符号格 / 写音那一排 `padKey` → `runPadCommand` |
| MIDI 琴键 | A | 走 pad 的 `noteDown`（同一个翻译层）；听 / 词 / 面板开着 = 只响 |
| 谱上点 / 拖 / 框选、面板里改东西 | A 的后半 | 不经总闸（不是键盘），直接 `update` / `D.commit`；锁在 D.commit 拦 |
| 撤销 / 重做 | A 的后半 | 键盘上的先问 `mayStep`（拔着时谱上的那一步停）；顶栏钮直达 `D.undo` |
| 停笔 2 s / 失焦 / 页面隐藏 | C（只落本机） | `persist(false)` |
| 按「存」| C（落本机 + 推） | `forceSaveAndPush`：不脏也编码、也推（时间戳走字） |
| 换歌 / 新建 / 进歌库 / 退出登录 | B 的前半 + C | `H.leave`：等着安家的先安家；歌库里的 flushAndPush，推完还脏再落一次本机 |
| 歌库点一首 / 云端快进后重载 | B | `es.open(id)`：先存旧的（退出语义），再读、再装 |
| 保存途中选了「云端覆盖本地」 | B 的后半 | `persistNow` 里 `takeCloudReload` → `openInto(name)`（排队里，名字是取快照时钉住的） |

## 三、A：按一下 → 改谱 → 上屏 + 自动存

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| A1 归谁 | `keyOwner(facts)`（input-gate.ts）：十三种归属按先后判 | 常数 | 纯函数，忽略不计 |
| A2 路由 | `route(e, where)`：键表 45 个键 → Action；不能写时 where = "impro"（音键只响） | 常数 | — |
| A3 命令 | `apply(st, cmd)`（score/commands.ts → song.ts）：返回新状态（结构共享） | **随这条轨涨**（大多是 slice / splice 当前 track） | 没量 |
| A4 总闸 | `inputGate.may(prev, next)`：`next.song !== prev.song` 才问三个原因 | 常数 | — |
| A5 出声 | 音键先响后写：`sound.down` 走引擎（pad-host noteDown / run() degree） | 常数 | 先响后写省 30–80 ms（大歌；`ai-docs/20261017-input-latency-probe.md`） |
| A6 写入口 | `D.commit`：锁 → normalize（`withStartDyns`，纸头补力度）→ 记撤销快照（引用，不拷贝）→ hooks | normalize **随整首涨**（遍历每张纸的每条轨） | 没量（小歌忽略不计） |
| A7 之后 | `afterState`：`changed()` → `H.noteChanged` → `es.markDirty`；放着 = `schedulePlaybackRefresh`；停下 700 ms = 预热唱；`queuePaint` | 常数 | — |
| A8 画 | 下一帧 `paintNow` → `view.renderAsync`：song 结构化克隆发给排版 worker；worker 里 `engrave`（排版）+ `toSvgParts`（串化）；回来换 DOM + 装饰。谱没变 = 用缓存不重排；在途又改了 = 记最新的，回来再发一次 | **随整张纸 / 整首涨**（本段视图排整张纸，全部视图排整首；没有「只重排一行」——总表第 3 条） | 克隆 ≈ 0.5 ms（score-view.ts 注释）；主线程换 DOM 几 ms；排版本身没量；歌词让路：800 个十六分音符全带英文，让路比不让路多 14–16 ms（v0.16.68）→ 约 9 ms（v0.16.69），普通样张 16–18 ms（node，粗估量字，`scripts/bench-lyrics.mjs`） |
| A8½ 文字（在 engrave 里） | 谱上的字全走文字模块 `src/render/text/`（一个入口 `index.ts`）：① 样式表 `style.ts`（每种字的字体 / 粗细 / 字号 / 跟哪把尺子；屏幕 CSS、PDF 粗斜、覆盖层都查它）；② 量字 `measure.ts`：宿主只给原始尺子（屏幕 / worker = canvas，PDF = 字体字宽），每次排版 `createTextMeasure` 一把、同样的字只量一次，排版器只问「这种字写这串多宽（sp）」；③ 歌词让路 + 连字符 `lyric-fit.ts`（纯函数）；④ 基线 `baseline.ts`（字图元 y = 基线；只有覆盖层要换成盒顶） | 量字随不同的字数涨（缓存只活一次排版）；让路随每行歌词数涨，挤的那一串二分到百分位就停 | 见上一行 |
| A9 自动存 | 2 s（`LOCAL_SAVE_DEBOUNCE_MS`）→ 流程 C | — | — |

## 四、C：存（editor-session → encode worker → store → 推）

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| C1 排队 | `persist()` 进队（保存三个入口 / open / rename / delete / 定时器 / 监听同一条队）；轮到才判断要不要存 | 常数 | v0.16.51 |
| C2 等附件 | `editor.prepare()` = `refHost.settled()`（参考窗刚加的卡还在编字节） | 随刚加的卡涨 | 没量 |
| C3 钉身份 + 快照 | 同步：`canPersist` 护栏 → 记名字 / 代数 → `encode()` 同步前缀 = `D.savedMark()` + `encoder.encode(saveArgs())`（结构化克隆 歌 + 休息室 + 参考窗文件 → encode worker） | 克隆**随整首 + 附件字节涨** | 没量（`record("encode-post")` 有计时点，黑匣子里能看） |
| C4 编码 | worker 里 `saveMxl`（MusicXML + zip；音源子集按值嵌） | **随整首 + 嵌的音源涨** | 没量（`record("encode-worker")` 有计时点） |
| C5 落本机 | `store.zip(name).save(bytes, { tryPush })`（IDB） | 随字节涨 | 没量 |
| C6 推 | tryPush 时推 OneDrive（Graph；分块上传）；超时 问一句 30 s / 一块 2 min / 取一段 1 min / 整份 15 min（v0.16.51 起开） | 随字节 + 网 | 到点按没传成算，下次再推 |
| C7 收尾 | 对代数：还是同一首才清脏 / 清欠推；`onSaved(name)` 只记给还开着的那首；选了「云端覆盖本地」= 同队里重载 | 常数 | — |

## 五、B：开一首歌 / 换歌

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| B1 离开 | `H.leave`：等着安家的空谱有笔先安家；歌库里的 flushAndPush（流程 C，排队、说话算数），推完还脏再落一次本机；本机文件 / 无地改过没存先问 | 一次 C | — |
| B2 排队 | `es.open(id)` 进队：在飞的保存落地之后才换身份（同名重开也等） | — | v0.16.51 |
| B3 先存旧的 | 队里 `persistNow(push)`（退出语义；脏或欠推才动） | 一次 C | — |
| B4 读 | `store.zip(id).open()`：新鲜度 / 冲突面 / 崩溃恢复都在库里 | 随字节 + 网 | 没量 |
| B5 装 | `editor.adopt(blob, name)` → `adoptStoreBytes(name)` → `openBytes`（解 zip + MusicXML）→ `loadDoc`（`D.load`：栈清空、基线 = 现在；`refHost.apply`；视图态） | **随整首涨** | 没量 |
| B6 画 | A8 | — | — |

## 六、还随整个模型涨的点（优化时先看这里）

- A6 normalize（`withStartDyns`）每次 commit 遍历整首。
- A8 排版：每改一下整张纸（本段视图）/ 整首（全部视图）重排、重串化；没有「只重排一行」。歌词让路在挤的那一串上二分（v0.16.69 起二分到百分位就停）。→ 总表第 3 条；文字排版计划书 `ai-docs/20261109-plan-text-engine.md` §4 判断这一轮不做「只重排一行」，什么时候再谈也写在那里。
- C3 / C4 编码：整首 + 嵌的音源每次自动存都克隆、都编一遍（2 s 一次，脏才动）。
- B5 装歌：整首解析。

## 七、守卫

- 总闸：`test/input-gate-guard.test.mjs`（听 keydown 的地方白名单、监听不直接写、run() 每次写前有总闸、pad 两条出口带闸）；判断 `test/input-gate.test.ts`。
- 存：`test/editor-session-serialize.test.mjs`（排队、钉身份、prepare、adopt 带名字）；`test/store-wiring.test.mjs`（adapter 形状、传输层超时、取快照之前没有 await）。
- 文档只有一个写入口：`test/document.test.ts`；锁那一轮会再加「D.commit 之外不许改 extras / st.song」。
