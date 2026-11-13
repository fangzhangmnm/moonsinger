# 写歌的代码流程图（pipelines）

> created 20261109 by Claude Fable 5.1 · as-of v0.16.52 / 2026-11-09 · A8 文字那一层 as-of v0.16.70 / 2026-11-09（Claude Opus 5.5） · A8¾ 和弦级数 as-of v0.16.76 / 2026-11-09（Claude Fable 5.2） · A8⅞ 谱号按段 as-of v0.16.88 / 2026-11-10（Claude Opus 5.5） · 八 修改锁 / 九 渲好的声音 as-of v0.16.97 / 2026-11-10（Claude Fable 5.2）
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
  导出整首歌声 / 歌库封面上的 ▶ ─→ 这台设备上记着的渲好的声音（src/app/render-cache.ts；第九节）
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
| 导出整首歌声 | R（第九节） | 设备上记着同一份 = 直接拿；没有 = 现渲、记下、挂名 |
| 歌库封面上点 ▶ | R 的后半 | 卡片的戳 = 挂名时的戳 → 从设备上取；老文件 = 取文件里带着的那份 |
| 从链接打开（`?file=<链接>`，v0.16.106）| B（无地那一支） | 开机恢复完 → 地址栏拿掉 file= → 问一句（点「打开」才发请求）→ `H.leave` → `src/sources/link.ts` 换直链 + 下载（只读 GET、不带登录信息、100 MB 上限）→ 认字节 → `openPicked` → `openBytes` → `loadDoc`（家 = 没有，一份拷贝）；added by Claude Opus 5.5 2026-11-11 |

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
| A8⅓ 排版里面（谱面分家 1b，v0.16.108，2026-11-11 Claude Opus 5.5；**第四刀起 = 框架 + 谱种表 + 两种行；第五刀起三种行（五线谱 / 数字行 / 鼓的 X 行）；第六刀：五线谱也开拉宽上限和整小节放宽**，edited by Claude Opus 5.5（MoonSinger小弟）2026-11-11） | `engrave`（`src/render/engrave.ts`，框架；交出去的是平数据，worker 原样回；开头读一次「这首歌怎么看」`songViewOf(song)`：谱种 / 和弦级数 / 按 C 调看（起不起作用 = `inCActive`，首调的谱上不起作用）/ 每轨和弦选项 / 版式 / 歌词排法 / 小节号；按 C 调看起作用时先换算）。框架只经过**谱种表** `src/render/notations.ts` 拿画法（`NOTATIONS[谱种].build` 建轨、`NOTATIONS[谱种].rowKindOf` 定每条轨用哪种行、`DRAWERS[行的种类]` 量 / 行首 / 歌词锚点 / 画 / 道的先后 / 竖向锚点），一张纸一张纸排：① 建轨（谱种表里的 `build`：五线谱 = 叠成虚拟轨、分手、鼓并成一套；简谱 = 合租不叠、一家左边一条竖线；排版单元的时间那一半在框架 `frame/units.ts`、各种单元多宽由画法交进来；简谱下叠音 = 数字竖叠、鼓 = X 行、台上固定敲一个键的 = 数字 + ×，简谱的歌里没有五线谱的行；简谱建轨时排版单元多一个 `restBeats`：复合拍子（6/8、9/8、12/8）里的休止按拍切 = 一拍一个「0·」）；①½ 预处理（和谱种无关）：这条轨的和弦选项是「折叠」= 每个叠音问乐理模块 `fold` 折不折得了（能还原才折）→ `TrackAux.folds`，交给量 / 歌词锚点 / 画；② 量：`DRAWERS[k].measure`（一条轨的纯函数 → 列条目；五线谱 `staff/measure.ts`、数字行 `jianpu/measure.ts`）；③ 排：`mergeColumns → arrangeColumns`（`frame/arrange.ts`：合成列、`spacing.ts` 弹簧顶杆、整张纸挑折点、每行摆；**一行最多拉宽** = 排版参数表纸一级，两种谱都是 1.3（放不满右边空着）；**一小节里等距**（`evenBars`：一段里有顶杆比跨过的弹簧长 = 这一段弹簧一起放大，按这一行拉 / 压过的弹簧算；简谱第五刀 5-4 ⑦，五线谱第六刀起也开）；折行可以留孤行（最后一行不算代价；user 不要「不留孤行」））；④⁻ 和弦级数的预处理（`theory/families.ts paperHarmony`，见 A8¾）；④ 画：`DRAWERS[k].draw` 只画分给它的那几条轨的行（越界报错）：音符层 `put(行, …)` + 往道上登记挂件 `attach(行, 道, …)`；共用挂件（力度那一串、风格、跳转房子、速度、音的修饰、踏板——踏板 = 这一位最下面那条谱下面最外一道，延音 → 持音 → 弱音从里往外各一道，2026-11-12 11-1 edited by Claude Opus 5.5（MoonSinger小弟））在 `src/render/ornaments/`，画成什么查记号表 `src/render/signs.ts`（按**这一行的种类**查那一栏）；⑤ 框架：音符层的墨进天际线 → 一行一行按**它那种画法的道的先后**贴挂件、歌词（框架写字）→ 定行距（**行身 = 画法的竖向锚点 `anchors(0, 0.5)`**，不假设 0–4；最小值 = 排版参数表 `src/render/layout-params.ts` 行一级，按行的种类 × 版式）→ 翻页（分页的版面：一组放得下 = 整组翻；**比一页能用的高度还高 = 在声部和声部之间断开、接到下一页顶上**，大谱表 / 合租左右手两张不拆，一块自己比一页高 = 页顶照实伸出、后面的从它下面接着；行首连着的竖线按页分段画；状态那一串加「有一组比一页高，接到了下一页」——那一串改成所有纸排完再摆。7-V，2026-11-12 edited by Claude Opus 5.5（MoonSinger小弟））→ 按行整行挪 → 家具（只读竖向锚点给的上沿 / 中线 / 下沿）。量的东西都随整张纸涨（还没有按轨缓存：设计稿第 3.10 节，第五刀后看要不要做）。主线程的几何（光标 / 选区带 / 鬼音符 / 纵向 = 音高）= `notations.ts GEOMETRY[行的种类]`，谱面只查它。大歌（Once upon a Tale，895 token）全部视图一次 node 里约 14–19 ms（分家前 12–15 ms；第四刀 `bench-layout-vs` 和 ef5ad79 比 1.02–1.04）。 |
| A8½ 文字（在 engrave 里） | 谱上的字全走文字模块 `src/render/text/`（一个入口 `index.ts`）：① 样式表 `style.ts`（每种字的字体 / 粗细 / 字号 / 跟哪把尺子；屏幕 CSS、PDF 粗斜、覆盖层都查它）；② 量字 `measure.ts`：宿主只给原始尺子（屏幕 / worker = canvas，PDF = 字体字宽），每次排版 `createTextMeasure` 一把、同样的字只量一次，排版器只问「这种字写这串多宽（sp）」；③ 歌词让路 + 连字符 `lyric-fit.ts`（纯函数）；④ 基线 `baseline.ts`（字图元 y = 基线；只有覆盖层要换成盒顶） | 量字随不同的字数涨（缓存只活一次排版）；让路随每行歌词数涨，挤的那一串二分到百分位就停 | 见上一行 |
| A8¾ 和弦级数（在 engrave 里） | 每张纸一次 `paperHarmony`（`src/theory/families.ts`，第五刀 5-4：合租的一家按 tick 合起来认一遍、只标一次、画在这一家最下面那一行；不在一家的照下面这样各认各的；两种谱读同一份）。每个声部（或一家合起来那一条）：`harmonyTags`（`src/theory/index.ts`）把这条 track 切成小节（`barsOf`，和画谱同一套 `meterPositions`），**从左到右一小节一小节喂**给乐理模块的 `readBar`——理论只拿得到这一小节 + 它自己上一小节交出来的一小包（前提「只看前面」，v0.16.76；CLAUDE.md 有 user 原话）；出来的标签挂回音上，排版器照符干的位置写字 | **随这张纸的音数涨**（每次排版整张纸重读一遍）。因为每一小节只依赖前一小节交出来的那一小包，以后可以按小节记住结果、只重读改到的那一小节往后——没做，总表第 32 条 | 800 个叠音（四分）≈ 14 ms；800 个十六分的分解和弦 ≈ 2 ms（node，v0.16.76；改门前后一样）。贵的是认叠音（一个和弦约 18 µs） |
| A8⅞ 谱号 / 大谱表（在 engrave 里，v0.16.88） | `resolveSongLooks`（`src/score/clef.ts`）：每张纸每个声部一次——这一段手选的（纸头谱号记号 / `PaperSeg.looks.grand`）直接用；自动的照前一张纸滞后挑谱号、按 `autoGrand` 四条判要不要变两行（数加线照 `staffOfTokens` 的实际分法）。鼓 / 固定敲一件的、合租的一家不自动变大谱表 | **随整首涨**（每次排版整首每段每声部都算一遍；和原来的 `resolveSongClefs` 同一个量级，多一遍数加线）；main 里另有 `lookNow` 按歌对象缓存给键盘 / 谱头面板用 | 没量 |
| A9 自动存 | 2 s（`LOCAL_SAVE_DEBOUNCE_MS`）→ 流程 C | — | — |

## 四、C：存（editor-session → encode worker → store → 推）

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| C1 排队 | `persist()` 进队（保存三个入口 / open / rename / delete / 定时器 / 监听同一条队）；轮到才判断要不要存 | 常数 | v0.16.51 |
| C2 等附件 | `editor.prepare()` = `refHost.settled()`（参考窗刚加的卡还在编字节） | 随刚加的卡涨 | 没量 |
| C3 钉身份 + 快照 | 同步：`editLocked` 护栏（修改锁第 ④ 道；通用的 `canPersist` 口还在，现在没人用）→ 记名字 / 代数 → `encode()` 同步前缀 = `D.savedMark()` + `encoder.encode(saveArgs())`（结构化克隆 歌 + 休息室 + 参考窗文件 → encode worker） | 克隆**随整首 + 附件字节涨** | 没量（`record("encode-post")` 有计时点，黑匣子里能看） |
| C4 编码 | worker 里 `saveMxlWithFingerprint`（先 `canonicalIds` 把音的编号重编成只看内容的那一套 → MusicXML + zip；音源子集按值嵌；顺手带回这份字节里出声内容的指纹） | **随整首 + 嵌的音源涨**（重编 = 每个 token 一次浅拷贝） | 没量（`record("encode-worker")` 有计时点） |
| C5 落本机 | `store.zip(name).save(bytes, { tryPush })`（IDB） | 随字节涨 | 没量 |
| C6 推 | tryPush 时推 OneDrive（Graph；分块上传）；超时 问一句 30 s / 一块 2 min / 取一段 1 min / 整份 15 min（v0.16.51 起开） | 随字节 + 网 | 到点按没传成算，下次再推 |
| C7 收尾 | 对代数：还是同一首才清脏 / 清欠推；`onSaved(name)` 只记给还开着的那首；选了「云端覆盖本地」= 同队里重载；`relinkAfterSave(name, 指纹)`：设备上记着这份内容的声音 = 按新的文件戳重新挂名，没有 = 摘名（一次尾读本机那份的总目录） | 常数 | — |

**C4 里 `saveMxl` 写的规矩（第 16 条 16-3，as-of v0.17.12 / 2026-11-12，Claude Opus 5.5）**：
- 每个键都明写，等于默认也写（原来 19 处「等于默认就不写」取消）：score.json 的歌级键（arrangement / lyricFit / barNumbers / spacing / notation / chordTags / viewInC / middleC / expressions / textLang）、每张纸的 hidden / autoOttava / swells、每个声部的 clef / host / chords、视图态（desk 每一项、pad 的 auto、乐器目录翻到哪）；休息室每位乐手按 `completeCandidate` 把缺的数按现行默认写全（只补缺的：演奏法每个键、力度表八档、响度、链、移调、小月相的唱法旋钮和分段、SoundFont 的力度旋钮）；混音台每条轨、每个效果的开关和参数表里的每一个参数、总轨。
- 只写现行格式里有定义的键（`ROLE_KEYS / CAND_KEYS / ART_KEYS / STUDIO_KEYS / TRACK_KEYS / FX_KEYS / MASTER_KEYS / MANIFEST_KEYS`、`KNOWN_SCORE_KEYS / KNOWN_PAPER_KEYS / KNOWN_PART_KEYS`）；那一份比这一版新（同一个大版本、小版本更大）= 不认识的原样带回（包里不认识的文件同理，看总目录）。版本记号照「写永远只写当前拍」写这一版的。退役的不写：老文件里的 mp3、phrases、声部上的 autoOttava / brokenChords。效果参数这一层不按参数表筛（主线程参数 hpAuto / syncBeats 不在引擎的参数表里）。
- 哼的字只在乐手身上（`instrument.hum`）；歌上不再有一份、存的时候不再互相抄。
- 歌词每个音节的 `xml:lang` = 唱的那一段的语言（`engine/timeline.ts sungLangsOf`，和唱同一个 `sungPlan`）。
- 加了新键 / 新值的那几份小版本 +1（`contract.ts FORMAT_MINOR`：manifest 1、score 11、lounge 2、studio 2；16-4 起 lounge 3）。
- 效果链里的两个开关（16-5，as-of v0.17.14）：EQ 的自动低切 `hpAuto`、延迟的跟速度 `syncBeats` 登记在 `engine/chain.ts HOST_PARAMS`，存的时候和别的参数一样明写；开着的那一格把这一刻算出来的数写进 `hpHz` / `timeMs`（`writeResolved`，和放的时候 `core/render.ts mixParamsOf` 里的 `resolveChain` 同一份换算：歌手轨 = 这位全曲最低的音往下大三度，混音轨 / 总轨 = 0；延迟 = 几拍 × 60000 ÷ 歌开头的速度）。乐手自己的链放的时候不换算，存的时候也不碰。

## 五、B：开一首歌 / 换歌

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| B1 离开 | `H.leave`：等着安家的空谱有笔先安家；歌库里的 flushAndPush（流程 C，排队、说话算数），推完还脏再落一次本机；本机文件 / 无地改过没存先问 | 一次 C | — |
| B2 排队 | `es.open(id)` 进队：在飞的保存落地之后才换身份（同名重开也等） | — | v0.16.51 |
| B3 先存旧的 | 队里 `persistNow(push)`（退出语义；脏或欠推才动） | 一次 C | — |
| B4 读 | `store.zip(id).open()`：新鲜度 / 冲突面 / 崩溃恢复都在库里 | 随字节 + 网 | 没量 |
| B5 装 | `editor.adopt(blob, name)` → `adoptStoreBytes(name)` → `openBytes`（解 zip + MusicXML）→ `loadDoc`（`D.load`：栈清空、基线 = 现在；`refHost.apply`；视图态） | **随整首涨** | 没量 |
| B6 画 | A8 | — | — |

**B5 里 `openBytes` 读的规矩（第 16 条 16-2，as-of v0.17.11 / 2026-11-12，Claude Opus 5.5）**：文件上怎么写就怎么读——
- 没有升级链（`src/format/migrate/` 删了）：各份 JSON 原样当现行格式读，只认现行有定义的键；缺的数由各处现行默认补（16-4 收进模板）；退役的键不理（不认识的：那一份比这一版新才原样带回，见 C4）。只拒开大版本比 app 新的、小版本更新说一次。
- 不搬、不猜、不重排：声部上的老谱号 / 自动八度线键不理；纸头谱号 = 声部明写 `clef: "auto"` 才自动，否则每张纸第一个 `<clef>` 写什么就是什么；老写法 `brokenChords` 不理；合租一家不重排；老歌的声部名照文件（user 定的甲）；视图态 pad 的「1=」跟谱 / 手动只看 `auto`（老写法只写了 `fifths` 不再猜成手动，16-3）；效果的「原声」没写 = 参数表默认（`dryOf` 的「1 − 湿」删了，16-3）。
- 断了的照实标：合租不成立 → `PartDef.hostBroken`（照没合租来画，歌手牌「合租」那一行写清，存的时候照原样写回）；声部没有乐手 / 读不懂 → 没人上场（不再当小月相；四个「不出声」的出口说原因）；混音台出到 / 发送 / 被谁压断了 → 那一页那一格写「断了」、卡片上「有 N 处断了」（判法 = `engine/studio.ts busLinkStates`，和录音房接线同一个）。
- 别家的谱没写速度 / 调号 / 拍号 → 打开时那一串话里各一句（`headNotice`）。
- `loadDoc` 开歌不补力度、不理顺先后（人改谱时 A6 的 normalize 照旧补）。新歌 = `templateExtras(song)`：创建那一刻每个声部的乐手按模板写进休息室。

## 六、还随整个模型涨的点（优化时先看这里）

- A6 normalize（`withStartDyns`）每次 commit 遍历整首。
- A8 排版：每改一下整张纸（本段视图）/ 整首（全部视图）重排、重串化；没有「只重排一行」。歌词让路在挤的那一串上二分（v0.16.69 起二分到百分位就停）。→ 总表第 3 条；文字排版计划书 `ai-docs/20261109-plan-text-engine.md` §4 判断这一轮不做「只重排一行」，什么时候再谈也写在那里。
- A8¾ 和弦级数：每次排版每个声部整张纸重读一遍（叠音多的谱最贵：800 个 ≈ 14 ms）。每小节只依赖前一小节交出来的一小包，可以按小节记住——没做。→ 总表第 32 条。
- A8⅞ 谱号 / 大谱表：每次排版整首每段每声部重算（`resolveSongLooks`），没按段记住。存盘（`saveMxl`）也算一遍。
- C3 / C4 编码：整首 + 嵌的音源每次自动存都克隆、都编一遍（2 s 一次，脏才动）。
- B5 装歌：整首解析。

## 七、守卫

- 总闸：`test/input-gate-guard.test.mjs`（听 keydown 的地方白名单、监听不直接写、run() 每次写前有总闸、pad 两条出口带闸）；判断 `test/input-gate.test.ts`。
- 存：`test/editor-session-serialize.test.mjs`（排队、钉身份、prepare、adopt 带名字）；`test/store-wiring.test.mjs`（adapter 形状、传输层超时、取快照之前没有 await）。
- 文档只有一个写入口：`test/document.test.ts`（`st` / `extras` 在 `Document` 上是只读的，文档外赋值 tsc 就红）。
- 修改锁：`test/edit-lock.test.ts`（分类表 / 锁着吗 / 写入口 / 撤销 / 脏分两种 / 家 / 编辑会话）、`test/edit-lock-guard.test.mjs`（解锁的调用点名单、表和写入口对得上、各道接着线）、E2E `test/e2e/edit-lock.mjs`（硬盘文件）+ `test/e2e/edit-lock-gallery.mjs`（歌库里的歌）。
- 渲好的声音：`test/render-cache.test.ts`（两层钥匙 / 上限 / 挂名 / 字节没了就作废）、`test/final.test.ts`（指纹只看内容、不看内存里音的编号；老文件里的 mp3）、E2E `test/e2e/render-cache.mjs`。

## 八、修改锁：每一步在哪道被拦（as-of v0.16.97 / 2026-11-10，Claude Fable 5.2）

> 家族标准 = 家族根 `ai-docs/20261108-edit-lock-standard.md`；写歌的设计稿 = 家族根 `ai-docs/20261109-moonsinger-edit-lock-design.md`（第八节 + 第十四节）。
> v0.16.97 起库的开关（`lockByDefault: true`）开着：歌库里的歌和硬盘上的单个文件走同一张图（v0.16.96 时开关还关着，只有硬盘文件生效）。定稿的锁同一版退役，文档里只剩这一把。

两个问题各一处回答：「这首锁着吗」= `src/app/edit-lock.ts`（现算，不记状态）；「这个操作锁着能做吗」= `src/app/edit-lock-table.ts`（键 = `locus.kind`，现在只有 `paperHidden`）。

```
  按键 / 触屏键 / MIDI ─→ ① 键盘总闸 input-gate（locked = D.locked()）─ 锁着 → 只弹不写（同「弹」）；想接回插头 → 门闪
  谱上的手势 ───────────→ ① 谱面规则 lockedRules（能放光标、能选；拖音 / 歌词框 / 记号不接）
  面板上的控件 ─────────→ ① body.doc-locked 的样式（乐器页的卡、混音台的推子不接；「静 / 独」、页签留着）
          │（漏过来的、和没有界面那一层的：声部管理 / 谱头面板 / 小卡 / 菜单里的动词）
          ▼
  D.commit(next, { locus }) ─→ ② 类别 = locus.kind（没带 = score）→ 自称看法的先核（只动了那类看法吗）→ lock.writeGate(kind)
          │                         拒 → onRefused → 界面摆回真相 + 门闪（不弹字）；放行 → 照常记撤销（看法不并格）
  D.undo / redo ───────────→ ③ 按要翻的那一格的类别问同一个口（翻的是看法就翻，翻到内容那一格就停）
          ▼
  「要不要存」owesSave() = D.dirty() ∧ ¬(锁着 ∧ dirtyKind = looks)      ← 锁着时只动了看法：不叫编辑会话、离开不问
          ├─ 歌库：H.noteChanged → es.markDirty → persistNow ─→ ④ editLocked(name)：锁着 ∧ 脏 / 人按存 → 不编码不存、说一次；只欠一推 → 不走保存
          ├─ 硬盘文件：H.save() ─→ ④ ports.locked() → { k: "locked" }（一个字节都不写；宿主：门闪，有内容改动才报）
          └─ 离开：H.leave() 只看 owesSave
          ▼
  ⑤ 库 createStore({ lockByDefault: true })：file.save 改已有的 → LockedError（v0.16.97 开；这台设备上新建的生来解着，解锁记在设备上、一天不动自己锁）
```

- **解锁**只有两处：门的钮（`src/app/edit-lock-door.ts` → 歌库 = 图库库的 `unlockEdit` / `saveVersionThenUnlock`，硬盘文件 = `lock.unlockLocalFile()`）、歌库卡片的菜单（图库库自己的）。
- **锁上** = 三条杠「锁上（先不改了）」→ `lockEditNow`：先存（歌库 = 落盘 + 推；硬盘文件 = 写回）→ 存成了才锁。
- **锁态变了**（`lock.onChange`）→ `applyWorkspace`（规则 / 样式 / 插头的样子）+ 重画 + `changed()`（解锁那一刻锁着时动过的看法开始算「要存」）。装入期间（`loadingDoc`）不动界面，`loadDoc` 收尾一次摆好。
- **代价**：每次 commit 多一次 `effectiveKind`（只有自称看法的才逐张纸比引用）+ 一次 `lock.state()`（歌库 = 库的 `unlockOf` 查一次内存表）；`dirtyKind()` 只在「脏着 ∧ 锁着」时才算（逐张纸比引用）。没量（比 A6 的整首规整小得多）。

## 九、R：渲好的声音只记在这台设备上（as-of v0.16.97 / 2026-11-10，Claude Fable 5.2）

> 定稿退役之后，「内容没变再导出不用等」「歌库封面上直接听」都靠这一条。模块 = `src/app/render-cache.ts`（纯逻辑）+ `render-cache-idb.ts`（IDB）；宿主的几个口在 `main.ts`（`takeRender / keepRender / linkRenderNow / relinkAfterSave / adoptLegacyMp3`）。歌文件里不再有 mp3。

```
  导出整首歌声 ─→ performance.exportSong ─→ renders.take(钥匙 = 内容指纹 + 音质 + 声部 + 歌名；还要是这一版渲染核心渲的)
        ├─ 有 → 直接给那一份（不唱、不渲）─→「好了」面板：用的是这台设备上记着的
        └─ 没有 → 现渲（核心）→ 贴标签 → renders.keep（最近 20 首，超了丢最久没用的）─→「好了」面板：记在这台设备上了
                    └→ 歌库里的歌、手里没有没存的改动 → 挂名（身份 → 这条记录 + 文件此刻的戳）→ 歌库那张卡片重算
  存了一次（流程 C7）─→ 这次存下去的内容的指纹有记着的声音吗 ─ 有 → 按新的戳重新挂名；没有 → 摘名（记录留着）
  歌库列卡片 ─→ 尾读总目录 = { 戳, 老文件里带没带 mp3 }（图库库按身份 + 字节版本缓存）─→ 戳 = 挂名时的戳 → ▶
  点 ▶ ─→ 从设备上取那一份 ─→ song-player（播放条 / 循环 / 从头放 / 锁屏控件）     老文件没挂名的 → 抓文件里带着的那份 mp3
  打开老文件（里面带着 mp3）─→ 读的时候按文件原文核过是这份内容的 ─→ 搬进设备缓存 + 挂名；下一次存下去文件里就没有它了、说一句
```

| 步 | 干什么 | 碰多少 | 数字 |
|---|---|---|---|
| R1 钥匙 | `contentFingerprintOf(saveArgs())`：和存盘同一条管线把整首写成文本再哈希（不压 zip） | **随整首涨**（一次整首的 MusicXML 串化） | 没量；只在点导出 / 开导出面板时算，不在按键那条路上 |
| R2 取 / 记 | IDB 读一条 / 写一条（mp3 字节 + 记录） | 随 mp3 大小 | 没量 |
| R3 挂名 | 尾读本机那份的总目录（128 KB 尾窗）算戳 + 写一条挂名 | 常数 | 没量 |
| R4 歌库列卡片 | 每张卡片一次尾读（图库库缓存着，文件没变不重读）；挂名表在内存里 | 随卡片数（有缓存） | 没量 |

- 指纹只看内容：写出去之前音的编号一律重编（`project.ts canonicalIds`）；不然同样的内容存两次、中间重开过就是两个指纹（2026-11-10 查出来的）。
- 不进这条的：只导出一段（每次现渲）、PDF、放着听（实时引擎）。


**v0.16.101 加的三条路（Claude Opus 5.5）**：
- **渲染到缓存**（三条杠，歌库里的歌）：`main.ts renderHere` → `performance.ts renderKeep`（命中记着的 = 直接算有；否则 renderMp3 → 贴标签 → `renders.keep` → `linkRenderNow`，手里有没存的改动 = 存完 `relinkAfterSave` 再挂）。不出文件。
- **歌库里渲**：卡片钮（没挂名 = state unknown）→ `gallery-host.ts renderThenPlay` → 宿主 `renderInLibrary`：`openStoreDoc`（照常 H.leave）→ 进度框（`renderBusy`，进度字 = `progress` 转进来；取消 = `cancelRender` → `awaitAllChunks` 按旗抛 cancelled）→ `renderKeep` → 挂名 → 回到歌库这边重读这张卡的戳 → `playTile`。
- **改过之后**：`relinkAfterSave` 找不到这份新内容渲过的 = 不摘名；歌库 `soundOf` 看挂名的戳 ≠ 文件现在的戳 = stale → 封面「旧」、播放条「之后改过」+「重新渲染」（= 歌库里渲那条路）。
- 设置的列表 = `renders.list()`（按最近用过排）；删 = `renders.remove(key)`（字节 + 挂名一起）。导出带 `keep` 开关（`mp3-keep`）。

## 十、电平全表：从采样到喇叭，每一处乘的数（as-of v0.17.9 / 2026-11-12，Claude Opus 5.5；施工单第 14 条）

> 一条轨的声音从哪来、一路乘了什么、谁定的、界面上哪里看得见。代码在 `src/engine/studio.ts`（录音房）、`src/score/perform.ts`（表情曲线）、`src/engine/timeline.ts`（块 / 音符表）、`src/performers/*.ts`（每位乐手报的数）。
> 「谁定的」四种：**标准**（SoundFont 2.01 规范等）、**库**（音色库文件里写的）、**人**（人在界面上调的，进文件）、**我们**（程序里放的数）。「我们」这一类而且界面上看不见的，是要清到零的那一类。

### 1. 声源（每种乐手各一条）

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| **SoundFont**：采样本身 + 库里写的衰减 / 包络 | 库里写的 | 库 | 看不见（库的事） |
| SoundFont：力度 → 响度 | 深度 ÷ 960 × 40·log10(力度 ÷ 127) dB；深度 = 库给这件乐器写的（没写 = 规范默认 960） | 标准 + 库 | 乐器页「力度记号」那张表（每档几 dB） |
| SoundFont：每个音的力度 | 力度记号查力度表（pp 33 … ff 112）；重音 +16、强音 +28、次重音 / 弱化 / 幽灵音、拍子轻重 | 人（乐手配置按值存，新建时抄默认表） | 乐器页「力度记号」「记号怎么演」 |
| TinySoundFont 总增益 | 0 dB（`vendor/tsf/tsf-glue.c` `tsf_set_output(…, 0)`）= 不加不减 | 我们 | 不用看（是 0） |
| **小月相**：唱法核心出来的原始声音 | 核心里「齐平」把每个字拉到一个水平（齐平 0.8、上限 6 dB、连续过渡） | 人（乐手配置按值存） | 乐器页「高级：唱法核心的旋钮」 |
| 小月相：块乘多少 | × 0.89 ÷ 0.42 ≈ ×2.12（+6.5 dB）：原始峰值约 0.42 放大到 0.89 | 我们（`performers/tsukuyomi.ts` `chunkGain`） | **这一版起**乐器页「力度记号」那一行写出来 |
| 小月相：存成 16 位时缩的倍数 k、放的时候乘回 | 一缩一乘，净 ×1（只为了不削顶） | 我们 | 不用看（净 1） |
| **元音版**：元音表 | 表生成时整张按最大峰值缩到 0.8（`scripts/gen-preview-vowels.mjs`） | 我们 | **看不见**（报统筹，见本节末） |
| 元音版：每个音的包络 | 起 / 放 / 被顶掉的淡入淡出，峰值 1 | 我们 | 不改水平 |

### 2. 表情曲线（每条轨一条 dB 曲线，乘在声源后面）

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| 小月相 / 元音版的力度水平 | 她身上的 dB 表 `dynamicsDb`（八档 → dB；渐强渐弱 / 渐到在 dB 上线性，没终点走到表里的下一档，强后即弱压到表里的 p；16-4 起，as-of v0.17.13 / 2026-11-12） | 新建 = 模板 `DYNAMICS_DB`（= 原来那条公式算的八个数、两位小数）；之后是人的、按值带在歌里 | 乐器页「力度记号」那一行（八个数照实显示） |
| 重音 / 强音 / 突强 / 强后即弱 / 弱化 / 幽灵音 / 次重音 / 音内起伏 / 气声 / 拍子轻重 | 每样一个 dB 数 | 人（乐手配置按值存） | 乐器页「记号怎么演」 |
| SoundFont 这一路 | 只剩强后即弱的压和音内起伏（别的在每个音的力度里） | 同上 | 同上 |
| 曲线的平滑 | 一阶平滑 τ 4 ms | 我们 | 不改水平 |
| 小月相块的起放 / 停 | 淡入 10 ms / 淡出 30 ms | 我们 | 不改水平 |

### 3. 乐手自己的链

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| 乐手的效果链（候选 `chain`，跟人走） | 链里的效果 | 人 | **现在没有编辑入口**；新建的都是空链，只有手改过的文件会有 |

### 4. 通道（混音台上一位歌手的卡片）

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| 通道效果链（EQ / 压缩…） | 链里的效果 | 人 | 混音台 EQ / 压缩 / 链页 |
| 推子 | 轨的增益 dB | 人 | 混音台「增益」 |
| **乐手的响度**（`calibrationDb`，和推子相加） | 新建 = 0（这一版起；以前 −6）；老歌里写着什么就是什么 | 人（乐手配置按值存） | 乐器页「响度」；**这一版起**不是 0 时混音台推子旁边写「乐手 −6.0 dB」，点了去乐器页那一行 |
| 静音 / 独奏 | × 0 或 × 1 | 人（视图态） | 混音台、谱上歌手名下面 |
| 声像 | 等功率：左 × cos、右 × sin；正中两边各 × 0.707（−3 dB） | 我们（算法；统筹定为理想那一层） | 混音台声像的问号里写着 |

### 5. 发送和混音轨

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| 发送（推子之后取） | × 发送 dB | 人 | 混音台发送页 |
| 混音轨的链 | 链里的效果 | 人 | 混音台 |
| 混音轨增益 + 声像 | dB + 同一个等功率 | 人 | 混音台 |

### 6. 总轨和出口

| 在哪 | 乘多少 | 谁定的 | 界面上哪里看得见 |
|---|---|---|---|
| 总轨链 → 总轨增益 | 链里的效果、dB | 人 | 混音台总轨卡 |
| 限幅器 | 天花板 0.98（−0.18 dBFS）；起 3 ms、放 150 ms、前瞻 9 ms；不超的地方不动 | 开关：人；四个数：我们 | 天花板写在限幅的问号里；起、放、前瞻**看不见** |
| 实时出口 | 不乘 | — | — |
| 导出 | mp3（LAME）/ 16 位 wav：不改电平 | — | — |

### 7. 按键试听（另一条路）

绕过静音 / 独奏、总轨链和限幅；力度 = 光标那一刻生效的力度（乐器 = MIDI 力度、小月相 / 元音版 = 走 dB）；声像 / 推子照这位的通道。小月相按键时走元音表（同 1 里的 0.8）。

### 这一版查到、还没清的（交统筹，不自己定）

- **元音表生成时缩到峰值 0.8**：我们放的、界面上看不见。元音版的音量曲线、按键试听（包括小月相按键）都从这张表出来。
- **限幅器的起、放、前瞻三个数**：我们放的，只有天花板写在问号里。
- **乐手自己的链**：会出声、没有编辑入口（新建的都是空的）。
