# 编辑状态机的屎山：盘点 + 不变量 + 提案 .h + 分期（家族周账 F-17）

> created 20261013 by Claude Fable 5.1 · as-of v0.11.3（dev，main `3078eee` 之后）/ 2026-10-13
> 账：user 2026-10-10「记账以后需要fable专门做一轮编辑状态机的屎山整理」；收工账 §2「⑩ 快捷键 / 编辑状态机深模块：谱面手势分支、pad 的几种锁、main.ts 里散着的「哪个面板开着」判断收成一台状态机」。
> 这是**重构策划**（家规 API .h ritual：现状 .h + 提案 .h），不是改动：代码一行没动。提案的形状是推荐稿（user 10-07「fable的任何数据结构契约都只是推荐稿」）。本仓还没有 `api/` 头文件树（家族 ritual 2026-08-03 立，MoonSinger 10-07 出生后没打过），现状的签名直接从源码抄在 §1。

## 0. 一句话

不是一台状态机，是三台，各自散在不同地方：**谱面手势**（score-view.ts，14 个可空字段互相排他、靠 if 链维持）、**pad 的锁**（同一条 Shift 规则写了三遍：/2 在 main.ts 六个旗子、升降在 main.ts、渐到在 pad.ts）、**什么盖在上面**（main.ts 五个布尔 + `closeOffer` 闭包赋值 44 处，每个 open… 手动把别人全关一遍）。模式（音 / 词 / 符 / 听）10-10 已经收成一张表（`workspace.ts`），是对的方向——剩下三台照那个样子做：**每台一个判别联合 + 一个纯函数推转移 + DOM 只照着画**。建议顺序：盖层登记 → 锁的纯函数 → 手势联合（最后一期动手感，要 user 的 iPad 验）。

## 1. 现状盘点（现状 .h，从源码抄）

### 1a. 谱面手势（`src/ui/score-view.ts`，1160 行）

同时存在的「正在进行」字段（都是 `private … | null`，理论上同一时刻只有一个非空，没有任何东西保证）：

```ts
press:      null | { pid; type; x; y; cx; cy; hit; timer }            // 长按计时中（音 / 休止 / 字 / 记号 / 空白）
drag:       null | { index; d0; dur0; x0; y0; axis: "" | "x" | "y" … } // 笔 / 鼠标拖音：改音高 / 时值
finger:     null | { pid; y0; top0; x; y; moved; … }                  // 手指滚谱
box:        null | { pid; x0; y0; moved; st0; row; … }                 // 框选
lift:       null | { pid; grab; st0; targets; … }                      // 长按拿起字 / 记号挪
selDrag:    null | { pid; anchor; menu? }                              // 长按选中后不抬手扩选
handleDrag: null | { pid; which: "start" | "end"; other }              // 拖选区把手
pinch:      null | { d0; z0; sx; sy; left; top; k; … }                 // 两指捏合
touches:    Map<pid, …>                                                // 捏合用的触点表
lockTap:    null | { pid; x; y; moved }                                // 听模式的轻点（只认看谱的）
holdPid:    number | null                                              // 按住一个音在听它（试听）
roAt:       null | { x; y }                                            // 右键 / 长按菜单的锚点
hot:        Set<number> | null;  span: { from; to } | null             // 拖的时候染色的对象 / 范围
```

入口：`down()`（647–716，70 行 if 链）、`longPress()`（718–）、`move()`（1057–1114）、`up()`（1114–）；`pointercancel`（215 行那一句）手工把十来个字段逐个清零 + 两处 `host.release?.()`。规则表 `this.rules: ModeRules`（workspace.ts）只管「这个模式认不认这种手势」，不管「现在在哪个手势里」。

症状（账本里都有名字）：W-36 歌名框里 Ctrl / ⌘+V 被谱面抢（键盘路由看的是焦点在谁身上，不看「现在开着什么」）；v0.9.39「拖动超级容易误触」（鼠标按下一动就拖 → 改成先长按，分支又多一层）；v0.10.42「开合键盘谱跳到奇怪的地方」（`caretSeen` 又加一个旗）；每加一种手势 = 四个入口各加一段 if。

### 1b. pad 的锁（`src/ui/pad.ts` 722 行 + `src/app/main.ts`）

user 定过一条规则（10-07「因为accessibility的issue可能按住不方便…和键盘shift的逻辑一样」；10-09「符号键盘应该只有caps模式没有shift模式」）：**Shift 式 = 点一下管下一个、连点两下锁住、按住 = 按住期间；caps 式 = 点一下进去一直留着**。现在：

| 锁 | 住在 | 状态 | 实现 |
|---|---|---|---|
| /2 减半 | main.ts 433 | `half: "off" \| "once" \| "lock"` + `halfShifted / halfAt / halfHeld / halfWrote / halfLeft` 六个旗 | 自己一套（含按住判定、连点窗口） |
| 升降 | main.ts 466 | `accPrior` + `accWrote / accSlid`（临时记号本身在 `st.input.acc / accMode / accAt`） | 自己一套（含在键上上下滑换 𝄪 ♯ ♭ 𝄫） |
| 渐到 | pad.ts 170 | `ramp: "off" \| "once" \| "lock"` + `rampAt`（连点窗口 350 ms） | 自己一套 |
| 符 / 音 | pad.ts 162 | `symWanted`（caps；派生 `symbols: "off" \| "lock"`，即兴时强制 off） | 一行 |
| 叠 | （派生）| `singleSel(st) >= 0` | **已经是状态的派生，不另存**——对的样子 |
| 弹 | main.ts 426 | `impro` | 布尔 |
| 多键 = 叠音判定 | main.ts 530 | `chordWaits / chordRoots / monoHeld / monoAt` | 时间判定，另一台小机器（不在这一轮） |

同一条「点一下 / 连点 / 按住」规则三份实现，连点窗口各写各的（350 ms 在 pad.ts，/2 的在 main.ts），测试只覆盖到行为（E2E stack-caps / ramp / phrase），没有一个地方能一眼看出「这三把锁规则一样」。

### 1c. 什么盖在上面（`src/app/main.ts`，3691 行，73 个模块级 `let`）

| 旗 | 赋值 / 读 | 意思 |
|---|---|---|
| `closeOffer` | **44 / 89** | 「现在开着的那张面板怎么关」= 一个闭包；开新面板前 `closeOffer?.()`；是事实上的「同时只开一张」协议，靠每个调用点记得调 |
| `instShown` | 4 / 14 | 乐器页开着（pad 只弹不写） |
| `finderShown` | 3 / 8 | 乐器目录开着 |
| `finderPlayOnly` | 3 / 7 | 从歌库进的目录 = 只弹着玩 |
| `finderBackToInst` | 5 / 7 | 目录是从乐器页开的，关了回乐器页 |
| `trackRedraw` | 2 / 5 | 轨的小卡开着（它的重画回调） |
| `audition` | 4 / 23 | 试听台上是谁 |
| `exporting` / `pdfBusy` | 3 / 5、3 / 4 | 导出中 |
| `dockedSide` | 2 / 4 | 底座在右边（横屏） |
| `modeHintShown` / `lastEditMode` | | 模式提示 / 上次写的模式 |
| 模式 | `ws.mode`（workspace.ts） | **已经是表** |

`openStudio()`（1818 行）是典型：`closeOffer?.(); finderBackToInst = false; closeFinder(); closeInstPage(); ws.collapsed = …`——每个 open… 都把别人逐个关一遍，漏一个 = 两张叠着（v0.9.43 滚轮点不出来那类 bug 就是层级 / 开闭没收口）。键盘路由（Ctrl+S 挂最外层、乐器页只认 Esc、找人视图音键 = 弹）各处用这些旗拼条件。

## 2. 不变量（问题陈述：改动要保住什么）

- **I1 一次一个手势**：谱面上同一时刻只有一个「正在进行」；任何 pointercancel / 失焦 / 模式切换 = 回到 idle，不留残局（不留 hot / span / 捕获 / `release` 没调）。
- **I2 一次一层盖层**：舞台上「盖在上面、抢输入」的东西同一时刻最多一个（面板 sheet / 小菜单 / 乐器目录 / 乐器页 / 歌库 / 导出 / 设置）；开新的 = 旧的先关；Esc 关最上面的；**pad 锁不锁、键盘归谁、底座放什么都从它推出**，不另存旗。不算盖层的：参考窗（浮窗，常驻）、轨的小卡（非模态、点外面收）、歌词框 / 歌名框（谱内就地编辑）、混音台（底座的一种，归 workspace.ts）。
- **I3 一把锁一条规则**：Shift 式三态（off / once / lock / held）由同一个纯函数推；caps 式两态同理；三把锁只是三个实例。
- **I4 规则表不变**：`workspace.ts` 的 `RULES`（模式 × 手势归谁）继续是唯一的「认不认」表，手势机只管「在哪一步」。
- **I5 手感不变**：长按 0.42 s、手指碰撞箱、鼠标先长按再拖、框选不卡（每帧一次）这些数和顺序原样搬，E2E 逐条守；第 3 期要 user 的 iPad 过手。

## 3. 提案 .h（目标契约，推荐稿）

```ts
// ── src/ui/gesture.ts（新，纯数据 + 纯函数；DOM 归 score-view）──────────────────────────
export type Gesture =
  | { k: "idle" }
  | { k: "press";  pid: number; type: string; at: XY; hit: Hit | null; timer: number }     // 长按计时中
  | { k: "dragNote"; pid: number; index: number; d0: number; dur0: number; from: XY; axis: "" | "x" | "y" }
  | { k: "box";    pid: number; from: XY; moved: boolean; st0: EditorState; row: number }
  | { k: "lift";   pid: number; grab: Grab; st0: EditorState; targets: Target[] }
  | { k: "selExtend"; pid: number; anchor: number; menu?: boolean }
  | { k: "handle"; pid: number; which: "start" | "end"; other: number }
  | { k: "scroll"; pid: number; y0: number; top0: number; moved: boolean }
  | { k: "pinch";  d0: number; z0: number; center: XY; left: number; top: number }
  | { k: "listenTap"; pid: number; at: XY; moved: boolean }
  | { k: "hold";   pid: number; index: number };                                               // 按住在听
export const IDLE: Gesture;
/** 一次事件 → 下一步 + 要做的副作用（纯函数；副作用是数据，score-view 照单执行）。 */
export function step(g: Gesture, ev: PointerEv, ctx: { rules: ModeRules; hit: (at: XY) => Hit | null; now: number }): { next: Gesture; fx: Effect[] };
export type Effect = { k: "caret"; index } | { k: "select"; from; to } | { k: "drag"; … } | { k: "menu"; at } | { k: "release" } | { k: "audition"; index | null } | { k: "render" };
// score-view：private g: Gesture = IDLE；down / move / up / cancel 四个入口都是 `apply(step(this.g, ev, ctx))`；cancel = step(g, {k:"cancel"}) 永远回 idle 并发 release。

// ── src/ui/latch.ts（新，纯函数）─────────────────────────────────────────────────────────
export type Latch = "off" | "once" | "lock" | "held";
export const DOUBLE_TAP_MS = 350;
/** 点一下：off→once、once（连点窗口内）→lock、lock→off、held→off。 */
export function tapLatch(l: Latch, now: number, lastTapAt: number): { latch: Latch; at: number };
/** 按下 / 松开：按下去 = held（记下按下前是什么），松开时按住期间写过 = 回到按下前，没写过 = 当作点了一下。 */
export function holdLatch(l: Latch, phase: "down" | "up", wroteWhileHeld: boolean, now: number, lastTapAt: number): { latch: Latch; at: number };
/** 用掉一次：once→off，lock / held 不变。 */
export function consume(l: Latch): Latch;
export type Caps = "off" | "lock";  export function tapCaps(c: Caps): Caps;
// /2、升降、渐到 = 三个 Latch 实例（升降另带它自己的「滑换 𝄪 ♯ ♭ 𝄫」，那是值不是锁）；符 / 音 = Caps。

// ── src/app/overlay.ts（新；数据 + 纯函数，DOM 归 main.ts applyOverlay）──────────────────
export type Overlay =
  | { k: "none" }
  | { k: "sheet";   close: () => void }                 // offer 面板（存 / 导出 / 问一句…）
  | { k: "menu";    close: () => void }                 // 小菜单
  | { k: "finder";  playOnly: boolean; backTo: "inst" | null }
  | { k: "inst" } | { k: "gallery" } | { k: "settings" } | { k: "export" } | { k: "pdf" };
export interface Ui { overlay: Overlay; open(next: Overlay): void /* 先关现在的（调它的 close / 收它的 DOM），再记 next */; close(): void; is(k: Overlay["k"]): boolean }
/** 从盖层推出来的（不另存旗）：pad 锁不锁、键盘归谁、底座放什么。 */
export function padLocked(o: Overlay): boolean;                       // finder / inst / gallery / settings…
export function keyOwner(o: Overlay): "score" | "overlay" | "none";   // Ctrl+S 永远最外层另算
export function dockOf(mode: Mode, o: Overlay, collapsed: boolean): Dock;   // 现有 workspace.ts dockOf 多吃一个参数
```

形状变了要回写这份（家规）。

## 4. 分期（每期：改哪里 / 守什么 / 反证 / 风险）

| 期 | 改 | 守 | 反证 | 风险 |
|---|---|---|---|---|
| **1 盖层登记** | main.ts 五个旗 + `closeOffer` 44 处 → `ui.open / close / is`；`openStudio / openFinder / openInstPage / openGallery / openSettings / openExportHub / openPdfPanel / openMainMenu / 各 ctx 菜单` 改成 `ui.open(…)`；键盘路由 / pad 锁从 `ui.overlay` 推 | 单元：overlay.ts 纯函数；E2E @modes @pad @store（modes / pad-toggle / finder-keys / save-keys / store / top-sels）+ file-smoke | 去掉 `open()` 里「先关旧的」= modes / finder-keys 红 | 低：不碰手感；改动面大但机械 |
| **2 锁的纯函数** | latch.ts + 单元（三态表 + 连点窗口 + 按住写没写）；/2 的六个旗、升降的三个旗、渐到的两个字段换成三个 `Latch` 实例 | 单元 latch；E2E stack-caps / ramp / phrase / dyn-levels / sel-tweak | 改掉 `consume` = ramp「点一下只管下一个」红 | 低-中：手感只在 350 ms 这类数，原样搬 |
| **3 手势联合** | gesture.ts + score-view 四个入口改成 `step()`；pointercancel = 一行 | 单元 step（每种手势的转移表 + cancel 回 idle）；E2E @score 全部（select / finger / rest / lift / sel-tweak / top-sels / scroll / zoom / ctrl-zoom / hscroll / caret-end / stack-caps / pad-ghost / listen-ghost） | 去掉 cancel 里的 release = finger 红 | **中-高：手感**。笔 / 手指 / 鼠标三套阈值，E2E 是无头 Chromium，iPad Pencil 的 coalesced 事件只有真机——这一期交付后要 user 画一首再推正式版 |

每期都是独立一刀，前一期不做后一期照样能做；第 3 期可以无限期不做（账上挂着）。体重：预计 main.ts −300 行、score-view.ts 手势部分 −150 行、新增三个纯模块 +250 行 + 测试；W-36（歌名框被谱面抢键）在第 1 期顺手修（键盘归谁从盖层推，歌名框 / 歌词框开着 = 谱面不接）。

## 5. 要和 user 讨论的（动手之前）

1. **要不要做第 3 期**（手势联合）：收益 = 以后加手势一处改、cancel 不漏；代价 = 动手感最重的 500 行，真机只有 user 的 iPad 能验。可以只做 1 + 2。
2. **「一次一层盖层」的边界**：我把参考窗 / 轨的小卡 / 歌词框 / 混音台划在盖层**外**（§2 I2）。混音台 = 底座的一种（照 workspace.ts）。要不要把「轨的小卡」也算盖层（现在点外面收，和小菜单一样）？
3. **顺序**：和 F-13（唱歌胶水从 main.ts 抽出）谁先。两刀都切 main.ts，先切哪刀另一刀的 diff 就小；盖层登记碰的是 UI 入口，唱歌胶水碰的是播放 / 预唱，重叠不多，可以各做各的。
4. **叠音判定那台小机器**（`chordWaits / monoHeld`）这一轮不碰——它是时间判定（头 / 尾 / 比例），和锁不是一类。要不要也放进第 2 期顺手给个纯函数 + 单元？

## 6. 进度（2026-10-14，edited by Claude Fable 5.1）

- §5 Q3（顺序）已不成问题：F-13 先切完了（v0.12.1 / 0.12.2，`20261014-performer-registry-and-glue-extraction.md`）。
- **第 1 期前一半 done = v0.12.5**：`src/app/overlay.ts` 盖层登记，`closeOffer` 协议 44 / 89 处归零，`test/overlay.test.ts`；E2E modes / pad-toggle / finder-keys / save-keys / top-sels / transport / loop / lift / store / singer-delete / issues 绿。§5 Q2 先按「轨的小卡也算盖层（kind card）」做（它本来就在 closeOffer 协议里）。
- 第 1 期后一半（整页的旗 instShown / finderShown / finderPlayOnly / finderBackToInst 收进登记、`padLocked / keyOwner / dockOf` 从盖层推）和第 2 期（锁的纯函数）待做；第 3 期（手势联合）照 §5 Q1 等 user。

