# 施工单：五线谱显示 刀 1 ——「编辑器的东西搬出排版器」（覆盖层）

> created 20261108 by Claude Fable 5.1 · as-of v0.16.23 / 2026-11-08
> 设计稿 = `ai-docs/20261108-staff-display-design.md`（§2 四层、§3 决定表、§5 刀 1 那一行）。user 11-08 拍：「先切哪刀 按你的建议来」= 刀 1 先；「你写计划 opus 执行」= 本单给 Opus 施工，Fable 审。
> 本单只管刀 1。刀 2（字和谱分开缩 + 级数字体 / 位置）、刀 3（横向间距，含**密音压紧单独开关、默认开**——user 11-08 拍）、刀 4（纵向天际线）、刀 5（看法层）各自另开单，每刀审完再开下一刀。
> user 同日另拍的两条进刀 2 / 刀 3 的单：和弦级数放**右下角**（和弦轨基本没歌词；撞了由天际线托）；隐藏声部 PDF **不再留空位**（Fable 建议、user 没反对；见 §4 第 6 条）。

## 0. 先收尾（半天）

工作区里 Opus 11-08 的三处半成品（谈话日记 §19）：

1. `src/app/main.ts` 的 castPick 一次提交（换 GS 乐器一步撤销、声音没到不改名字）+ padHint 带 `key` + afterExtras / afterRestore 都重画 pad：**要**，照原样提交。
2. `src/keyboard/pad.ts` 的 hintKey 对账 / shiftFor / `data-midi`：**要**，照原样提交。
3. `src/render/engrave.ts` 的 TG_BTN 3.2 → 2.8 + 名字居中、钮上移：**不要**——刀 1 把两颗钮整个搬出排版器，这处改动作废。`git checkout -- src/render/engrave.ts`。
4. `src/i18n/strings.ts` 删的两条没用的键：要（跟 1 一起）。
5. `test/e2e/pad-follow.mjs`（5 条）登记进 `test/e2e/areas.mjs` 的 pad 区；`test/e2e/part-toggles.mjs` 不动（钮还是 3.2）。
6. 跑 `npm run check` + `node test/e2e/run.mjs @pad`，bump v0.16.24，CLAUDE.md 一条，推 dev。

## 1. 刀 1 的一句话

**印出来没有的东西，一样都不许留在排版器里。** 排版器只排可印的谱，吐图元 + 锚点；编辑器的钮、框、提示、括号、细线上的「点我」全部变成主线程上的 DOM 元素，按锚点摆在谱面上面那一层。PDF 不再「减掉名单」。

## 2. 不变量（守卫先写，再动码）

- **N1 版面不变**：同一首歌、同样的宽 / 密度 / 范围 / 分页，刀前刀后的**可印图元逐个相同**（线 / 字形 / 字 / 路径的坐标、字号、class 里可印的部分），锚点表相同。守卫 = 新单测 `test/engrave-printable.test.ts`：对三首样张（`test/fixtures/songs/once-upon-a-tale.mxl`（user 11-08 给的，可公开）+ 冻结样本里的两首）在**刀前**生成 `test/fixtures/layout/<歌>.<视图>.json`（可印图元 + 锚点，去掉所有编辑器的东西），刀后逐个比。生成脚本 `scripts/freeze-layout.mjs`（和 freeze-format-sample 一个路数）。
- **N2 PDF 一字节不变**：三首样张刀前刀后 `scorePdf()` 的字节相同（`test/pdf-wysiwyg.test.ts` 加一条「刀 1 前后字节相同」用冻住的 sha256；刀 1 之后 PDF 的 SKIP 名单清空，这条就是证明清空没漏）。
- **N3 手感不变**：现有 E2E 全绿——`part-toggles`（两颗钮：点 / 长按 / 右键 / 图标状态 / 大小 ≥ 3.1 sp）、`paper-adds`（虚线框）、`parts-manager`、`header-hit` / `header-panel`（谱头碰撞箱）、`top-sels`、`only1`、`shared-staff`（合租括号）、`arrange`、`caret-end`、`pad-ghost`、`listen-ghost`、`playhead`、`modes`、`pdf-wysiwyg`。E2E 里按 class 找排版器画的控件的（`.part-tg`、`.add-box`、`.paper-chip`、`.nav-text`、`.key-hint`、`.fam-bracket`…）改成找覆盖层的 DOM（下面 §3.3 定 class 名，一处列全）。
- **N4 排版器文件不许 import 编辑器的字**：`src/render/engrave.ts` 里的 `_t()` 调用在刀 1 之后只剩**印出来的字**（「风格：」「Style:」「1=」这类）；提示 / 钮上的字全部走了。守卫 = `test/i18n-guard` 加一条：engrave.ts 里出现「点」「长按」「右键」「菜单」「＋ 」这些词 = 红（用词表，列在测试里）。
- **N5 延迟纪律不退**：`scripts/probe-input-latency.mjs` 刀前刀后数字不变（大歌写音 → 交给音频线程 < 1 ms；主线程那一帧 view.render 不变）。覆盖层的摆放在 `paintNow` 的同一帧里做，不另起 rAF、不读布局再写布局（先读完所有锚点再写 DOM）。

## 3. 怎么切（顺序就是提交顺序，每步能单独跑绿）

### 3.1 排版器：加「几何参数」，去「控件图元」

`EngraveOpts` 里这几个走人：`editable`、`keyHint`、`titlePlaceholder`、`paperLabel`。换成一个几何参数块（只影响版面、不画东西）：

```ts
/** 编辑器要排版留的地方（只是尺寸；画什么归覆盖层）。印 = 都不给。 */
chrome?: {
  nameColMin?: number;      // 名字那一栏至少多宽（sp）：编辑器开着 = 两颗钮的宽（TG_W），印 = 不给
  underPaper?: number;      // 每张纸底下留多高（sp）：编辑器连续视图 = 虚线框那一截（2.6 + 间距），分页 / 印 = 不给
  tailPaper?: number;       // 整首最下面留多高（「＋ 新曲段」）；分页时在最后一页外面 = 只撑高画布
}
```

从 `prims` 里**删掉**（不是藏起来）：两颗钮（`part-tg*`）、虚线框（`add-box*`）、曲段控件（`‹ ›`、只看本段眼睛、`⋯`、单纸时歌名左边的 `⋯`）、纸角折角小钮（`paper-chip*`）、「1=C」淡提示（`key-hint`）、歌名 / 作者 / 曲段名 / 编排空着时的浅色提示（`empty` 那几种）、合租那家的括号（`families` 画的那条）、隐藏声部细线上的任何字。

**留在排版器里、照旧印**：隐藏声部的细行（它占位置，是版面的一部分——见 §4 第 6 条「不留空」的改法）、「1=F」（按 C 调看时它是看法层的输出，印不印由 PDF 传不传 `inC` 决定，照旧）、和弦级数、速度 / 风格 / 反复、补齐的空小节。

`Layout` 里**删掉**这些点击框表：`partToggles`、`paperAdds`、`paperChip`、`paperMenu`、`nav`、`papers[].menu / prev / next / scope`、`families`（改成锚点，见下）。**留下并正名为锚点**：`systems`（谱行框）、`notes` / `rests` / `chordHeads`、`slots` / `heads`（光标落点）、`lyrics`、`marks`（调号 / 拍号 / 速度 / 谱号记号）、`clefs`、`dyns`、`chordTags`、`bars` / `measures`、`title` / `arrangement` / `credits`（三个文本块的框：文字是印的，框是锚点）、`parts`（声部名的框 = 锚点，钮按它摆）、`papers[].title / top / bottom`（曲段名那一条的框 + 这张纸的上下）、`sharedRows` / `virtual`（看法层的事，刀 5 搬；刀 1 不动）、`pageX` / `pages` / `lyricYs`。新加两个锚点：`families: { paper, host, rowFrom, rowTo }`（这一家占哪几行，括号由覆盖层画）、`stubs: { paper, part, y }`（隐藏声部细行在哪）。

### 3.2 谱面（score-view）：图元照旧上屏，控件不再在 svg 里找

- `tap()` 里所有「0⁻ / 0 / 0⅛⁻ / 0½」那些控件分支**删掉**（两颗钮、虚线框、曲段控件、纸角钮、`⋯`、歌名左边 `⋯`、key-hint）。`tgDown` / `toggleAt` / `TG_LONG` 三处删掉。剩下的只认谱上的东西：音 / 休止 / 歌词位 / 记号 / 谱号 / 级数标签 / 三个文本块 / 空白。
- 新加 `ScoreView.anchors(): Anchors`（= 当前 Layout 里那几张锚点表 + 把排版坐标换成屏幕坐标的函数 `toClient(x, y)`，连续 / 分页 / 缩放都算进去；现有的 `clientBox()` 就是它的雏形）。
- `render()` 画完 svg 之后发一个 `onAnchors(anchors)`（宿主的回调），覆盖层在同一帧里摆。

### 3.3 覆盖层（新文件 `src/ui/score-overlay.ts`）

一个类 `ScoreOverlay(el, host)`：`el` = 谱面板里 ink 层旁边的一个 `<div class="score-overlay">`（绝对定位、`pointer-events: none`，只有里面的按钮接事件），`host` 给动作（和现在 main.ts 给 score-view 的那些回调一样：`onPartToggle / onPaperAdd / onPaperMenu / onNav / onScope / onPaperChip / onHeader / onPart / onFamilyLeave / onShowPart / onTitle…`）。

`overlay.layout(anchors, state)` 每帧一次：**先全部算位置，再一次性写 DOM**（按 key 复用元素，不重建：`data-key="tg:paper:part"`）。元素清单和 class（E2E 按这些找）：

| 元素 | class | 锚点 | 行为（都在这一个文件里一处写） |
|---|---|---|---|
| 眼睛 / 喇叭 | `.ov-tg` + `[data-kind=hidden\|muted]` + 状态 `tg-hidden / tg-only / tg-muted / tg-solo` | `parts[]` 的框：钮在名字上面、可以超出谱上沿、整排对「色点 + 名字」居中（user 11-08 拍的位置）；大小 = CSS（≥ 3.1 sp 的等价像素，part-toggles E2E 守） | 点 = 隐藏 / 静音；长按（420 ms）/ 右键 = 只看 / 独奏；用现成的 `touch-tip` 长按气泡 |
| 虚线框「＋ 声部」「＋ 新曲段」 | `.ov-add` + `[data-kind=part\|paper]` | `papers[].bottom` + `chrome.underPaper`；本段 = 两个并排；全部 = 每段一个 + 最下面一个；分页 = 最后一页外面 | 点 = 原回调 |
| 曲段控件 `‹ k/n ›` / 只看本段 / `⋯` | `.ov-nav-prev / .ov-nav-next / .ov-scope / .ov-menu` | `papers[].title` 那一条的右端（多张纸每张一组；单纸 = 歌名左边一个 `⋯`） | 原回调 |
| 纸角折角小钮 | `.ov-paper-chip` | 歌名那一条右端 | 原回调 |
| 「1=C」淡提示 | `.ov-key-hint` | `marks` 里 kind = key 且 fifths = 0 的那几处（排版吐出来的调号锚点） | 点 = 谱头面板 |
| 空着的提示（歌名 / 作者 / 曲段名 / 编排） | `.ov-placeholder` | 三个文本块的框 | 点 = 原来的就地改 |
| 合租括号 | `.ov-family` | `families` 的几行 | 点 = 光标挪出这一家 |
| 隐藏声部细行上的「点我放出来」 | `.ov-stub` | `stubs` | 点 = showPart |

CSS：`styles.css` 新一节 `.score-overlay …`；颜色 / 大小从现在的 `.part-tg` `.add-box` `.paper-chip` `.key-hint` 搬过来后**删掉旧的**（svg 里不会再有）。

### 3.4 PDF

`src/export/score-pdf.ts` 的 `SKIP` 名单清到**只剩** `hidden-note / hidden-paper`（如果 §4 第 6 条定「不留空」，这两个也走）和 `selbox / caret / in-span`（ink 层的，本来就不进 prims，留着是防御）。`printOpts` 不传 `chrome`。N2 守着一字节不变。

### 3.5 主程序

main.ts：`new ScoreOverlay(...)` 接到 `view` 的 `onAnchors`；原来给 score-view 的那十来个控件回调（`onPartToggle / onPaperAdd / onPaperMenu / onNav / onScope / onPaperChip / onHeader(只留谱上记号那条) …`）**挪给覆盖层**，score-view 的 host 接口瘦下来。`afterViewChange` 之后覆盖层按新状态重摆（钮的亮灭）。**不新加任何面板**（审计风险 2：面板进 `src/app/panels/` 是设置分页那一轮的事，不混在这一刀）。

### 3.6 顺序

1. 守卫先行：`scripts/freeze-layout.mjs` + `test/engrave-printable.test.ts` 在**改之前**冻三首歌的可印图元 + 锚点；`pdf-wysiwyg` 加字节 sha256。提交（「刀 1 前的版面快照」）。
2. 覆盖层文件 + 两颗钮先搬（最小一块、E2E 最多）→ part-toggles 改成找 `.ov-tg` → 绿 → 提交。
3. 虚线框 + 曲段控件 + 纸角钮 + `⋯` → paper-adds / parts-manager / top-sels / only1 / arrange 绿 → 提交。
4. 「1=C」提示 + 空着的提示 + 合租括号 + 细行「点我」→ header-hit / shared-staff / caret-end 绿 → 提交。
5. 删 `EngraveOpts` 的四个旗、加 `chrome`；删 Layout 的控件表；PDF 清名单；N1 / N2 / N4 全绿 → 提交。
6. score-view `tap()` 删分支、`tgDown` 删；全套 E2E（`npm run e2e`，**红的单跑，单跑红不许推**）→ bump、CLAUDE.md 一条、推 dev → 给 user 一张样张（`node scripts/snap-song.mjs test/fixtures/songs/once-upon-a-tale.mxl out.png`，刀前刀后两张并排）。

## 4. 边角（先定下来，施工时别现场发挥）

1. **分页视图**（= 打印预览）：覆盖层照旧有钮 / 控件（预览也要能操作），但 `chrome.underPaper = 0`（不留虚线框的空；「＋ 新曲段」只在最后一页外面）——和现在一样。
2. **听模式**：钮照旧有（播放控制），虚线框 / `⋯` 没有（现在 `editable=false` 的行为），由覆盖层按 `rules.edit` 决定画不画，排版器不知道模式。
3. **横卷**：覆盖层跟着横向滚动（`toClient` 算进 scrollLeft）；歌手名钉在左边那一条照旧在覆盖层（它现在就是 DOM）。
4. **缩放**：覆盖层整体跟 `.sheet` 的 transform / zoom；缩放手势中（只改 transform 那一段）覆盖层跟着 transform 走、不重摆；松手落成 zoom 再重摆一次。
5. **隐藏声部：不留空、也不再有「细行」**（user 11-08「不留空 可以，但是如果是页面模式的话 wysiwyg，排版要对齐，要不你换一个 UI？」）：排版器把隐藏的声部当不存在——不排行、不留高度，连续和分页都一样，**预览的版面 = PDF 的版面**。提醒换成覆盖层上一颗**不占位**的小标：挂在那张纸曲段名那一条的左边（单纸 = 歌名那一条），写「隐藏 N」，点它弹一小列隐藏着的声部（名字 + 色点），点哪个放出哪个（= 现在 showPart 的逻辑：有人在「只看」就加进只看，否则取消隐藏）；class `.ov-hidden`。「只看一位」时别人都算隐藏，同一颗小标。分页里它也只是浮着，不撑任何东西。Layout 不再有 `stubs`；`hidden-note / hidden-paper` 两个 class 从排版器里走（隐藏的纸照旧折叠成曲段名一条——那是纸级的「隐藏」，不在这一条里）。**N1 / N2 的快照在这一步改完再冻一次**作为之后的基线（§3.6 第 2–4 步用改前那份）。
6. **「1=F」按 C 调看**：不动（刀 5）。
7. **和弦级数位置 / 字体、字和谱分开缩**：不动（刀 2）。
8. **不碰**：`src/format/`、出声、键盘、同步、歌库。

## 5. 验收（Fable 审这些）

- N1–N5 全绿；`npm run e2e` 全套绿（红的单跑过了才算）。
- `grep -c "part-tg\|add-box\|paper-chip\|key-hint" src/render/engrave.ts` = 0；`SKIP` 名单 ≤ 5 项。
- `src/render/engrave.ts` 行数下降（预计 −150 行）；`src/ui/score-view.ts tap()` 的分支数下降。
- 样张两张（刀前 / 刀后）肉眼一样；iPad 竖屏 1024 宽那张给 user。
- CLAUDE.md 一条 + 设计稿 §5 刀 1 那一行标「做了（vX.Y.Z）」。

## 6. 量级

预计 3 个版本、一天以内的施工；改动集中在 `engrave.ts`（删）、`score-view.ts`（删）、新 `score-overlay.ts`（+300 行）、`main.ts`（接线）、`styles.css`、`score-pdf.ts`（删）、十来个 E2E 的选择器。

## 7. 施工记录（edited by Claude Opus 5.5 2026-11-08 · v0.16.24 / v0.16.25）

> 给 Fable 审：照单做了什么、哪几处我改了做法（每处写为什么）、还剩什么。§3.1 / §3.3 里提到的 `stubs` 锚点和 `.ov-stub`（细行上的「点我」）按 §4 第 5 条作废，没做。

**§0 收尾 = v0.16.24（24a782f）**：main.ts castPick 一次提交 + padHint 带 key、pad.ts hintKey / shiftFor / `data-midi`、strings 删两条——照原样提交；engrave.ts 的 TG_BTN 3.2 → 2.8 那处没进仓（不用 `git checkout`：先存成补丁再反向打回，补丁在 job tmp）；pad-follow 登记进 pad 区；@pad 33/33。

**§3.6 第 1 步 = 守卫（530441b、ea0fecb）**：`scripts/freeze-layout.mjs` + `test/fixtures/layout/cases.ts` + `test/engrave-printable.test.ts`。三首歌（Once upon a Tale + 冻结样本 v2-2-2-2 / v2-2-2-1）× 六种视图（印 / 本段 / 全部 / 分页 / 听 / 全部 + 隐藏一位）；快照存 `.json.gz`（不压一份 400 KB，一次冻 2.4 MB 进史）；PDF 字节指纹（N2）放同一个脚本、同一个测试文件（没加到 pdf-wysiwyg.test.ts：冻结逻辑只有一份）。顺手：单测里闸门的「每分钟再试」是真 setInterval、没人关，整套单测墙钟 60 s → 换成假的，7.7 s。

**第 2–5 步合成一笔**（不是一步一提交）：排版器的锚点形状要一次定下来，分三次提交就得把锚点改三遍、E2E 改三遍。守卫照样每样都过了一遍，差别清单见下。

做了：
- 排版器：`EngraveOpts` 去掉 `editable / keyHint / titlePlaceholder / paperLabel`，加 `chrome { underPaper, tail, famGap, navRoom }`（sp）；`PartView.toggles` 去掉（钮的状态不再进排版 = 点静音不重排）；`Layout` 去掉 `partToggles / paperAdds / nav / paperMenu / paperChip / papers[].menu|prev|next|scope`，加锚点 `names`（名字块：色点左边 / 名字右边 / 第一行上沿）、`keyHints`、`tail`、`creditsLine`、`content`、`papers[].under|hidden|stub|note|empty|hiddenParts`。行数 1656 → 1572。
- 覆盖层 `src/ui/score-overlay.ts`（196 行）：容器在 `.sheet` 里（score-view 的 `overlayRoot`，和 ink 一样挪到版心），**坐标直接用排版的 px**——缩放 / 分页 / 横卷都跟着 `.sheet` 走，所以没做 §3.2 说的 `anchors()` + `toClient()`，score-view 只多一个 `onAnchors(L)` 回调（render 末尾）。一帧一次：先把全部元素算成一张表，再按 key 写 DOM（变了才写），不读布局。手势一律 pointer 事件自己判（谱面有「单指 touchstart 一律拦」的守卫，click 在 iPad 上不可靠；同歌词框的「合」）。class 照 §3.3 的表；E2E 都按它们找。
- score-view：`tap()` 删了纸角钮 / 虚线框 / 全局 nav / `paperMenu` / 两颗钮 / 合租括号 / 每张纸 menu·prev·next·scope 那些支；`tgDown / toggleAt / TG_LONG` 三处删掉；`leaveFamilyAt` 改成公开的 `leaveFamily(paper, host)`（覆盖层的括号调它）。行数 1512 → 1486。host 接口少了 8 个回调。
- main.ts：建覆盖层、回调表 `overlayHost`（也挂在 `__moonsinger.overlayHost`，测试直达「这一段的菜单 / 纸的设置」）；「隐藏 N」点开用现成的 `ctxMenu` 壳，**没新加面板**（§3.5）。
- PDF：`SKIP` = `ann / selbox / caret / in-span` 四项（≤ 5）。
- 守卫：N1 / N2（见上）；N4 = `test/i18n-guard.test.mjs` 新一条（排版器的 `_t` 里不许有 点 / 长按 / 右键 / 菜单 / ＋ / 隐藏 · / 曲段名 / 作者 / 歌名；拿改之前的排版器套会抓出 9 句）。

**我改了做法的几处（请审）**：
1. **名字栏最小宽没做成「印的时候不给」**（§3.1 的 `nameColMin`）：印的时候不给 = PDF 的名字栏变窄 = 版面变 = 和 N2「PDF 一字节不变」、和「预览 = PDF」都冲突。改成排版器里一个写明的常数 `NAME_MIN`（= 两颗钮的宽），屏幕和 PDF 同宽。
2. **八种「只给写谱的人看的披露」这一刀没搬**：推定的灰字 `dyn-implied`、速度变化 ↑↓、句号、类别色条 / 色点、角标、编排写错的说明、拍数不对的红点、分页的页框。它们没有点击框、没有手势，位置是排版内部算的（推定灰字挂在发夹末端、句号挂在歌词行），搬到 DOM 要给每一种再造锚点。这一刀在源头给它们加一个类 `ann`，PDF 只认这一个类，不再记名单。要不要也搬 = Fable 定（§1 那句话字面上包括它们）。
3. **「隐藏 N」挂在右边的曲段控件组里**（多张纸：组的最前面；单纸：曲段名那一条右边 / 没有那一条 = 歌名那一条左边、「⋯」后面），不是 §4 第 5 条写的「曲段名那一条的左边」：左边是曲段名本身，挂那儿要量名字的宽，也会和名字挤；放在控件组里 = 和「只看本段」这些看法开关在一起。
4. **空着的歌名 / 曲段名 / 编排提示字不接点**（`pointer-events: none`），点下去落到谱面原来的文本框点击区（就地改照旧，E2E title-keys / arrange 不用动）；只有作者栏空着时没有点击区，那个提示字本身接点。
5. **隐藏的纸（纸级）照旧在 PDF 里留着折叠的那一条**：§4 第 5 条只改声部级，纸级没动（预览和 PDF 仍然一致，只是 PDF 里有一段空）。
6. **两颗钮还是 3.2 个间距**（照 §0 第 3 条）：user 11-08 说过「稍微适当的小一点」，现在只是 `score-overlay.ts` 的一个常数 `TG_BTN`，但 E2E part-toggles 守着 ≥ 3.1（user 同日「至少要比那些小扳手大」= 纸角控件 3.0）——两句话之间留的余地只有 0.2，改不改归 user。

**版面差别（重冻前逐份核过，全是该变的）**：印的三份（= PDF）一个图元都没变、PDF 字节没变；编辑器视图里变了三类——声部名竖着回到居中（原来被钮往下推了半截钮高，user 11-08「歌手还是纵向居中对齐」）、虚线框不再是图元、「1=C」不再占点击框；带隐藏声部的两份，后面的谱整体上移（细行不占位置了）。

**测试**：单测 1041（新增 N1 18 + N2 3 + N4 1；改 header-layout / shared-staff / svg-groups / pdf-wysiwyg / sheet-tempo 的断言）；E2E 改了 part-toggles（细行 → 「隐藏 N」）、paper-adds、only1、hscroll、transpose、shared-staff、view-in-c、arrange、landscape-widgets、singer-delete。整套第一轮 88/90：i18n-en 一条真红（手机宽度单纸那颗「⋯」字号没跟谱的大小走、被字撑爆）= 修了；pad-follow 单跑也红过——改后单跑 14 次红 1 次、改前 4 次全过，红的样子都是「点上场后 30 s 内没换成」，正常一次 4 s；第二轮整套里它并行也过了（89/90），之后单跑又连过 10 次；红的那一次没抓到现场，记着。第二轮剩的一条 = gate「硬超时 8 s 左右」实测 6.6 s：这一刀没碰闸门 / 网盘 / 存储；改之前的构建（v0.16.24）跑同一条也红过（4 次里 1 次）= 原来就有的时间赛跑（闸门自己的 8 s 和另一个更早到的超时，哪个是那「另一个」没查到），另记待查。

**N5 量了**（`scripts/probe-input-latency.mjs`，无头 Chromium，改前 v0.16.24 端在 8714 对照）：到出声中位数 空歌 0.1 → 0.2 ms、大歌写音 0.6 → 0.5 ms、大歌「弹」0.5 → 0.2 ms；四键快弹排队 0–6 ms 两边一样——噪声以内，没变。写音的路一行没动；重画多了覆盖层一次 `layout`（几十个元素、按 key 比较）。


## 8. 审查结论（edited by Claude Fable 5.1 2026-11-08 夜 · v0.16.26）

> 读法：先看「结论」和「查出并修了的」；六处偏离的裁决在后面；最后是没查到的和留给以后的。

**结论：刀 1 通过。** 版面守卫（N1）、PDF 字节（N2）、排版器里没有编辑器的字（N4）、写音延迟（N5）都成立；§5 的验收逐条核过（见本节末尾的表）。审出两处问题，已修，随 v0.16.26 一起推。测试：单测 1051 全过；全套浏览器测试（修完两处之后跑的）91 份过 89 份，红的 gate、follow 都是测试自己拿墙上钟量时间量错的（8.3），和这一刀无关；之后的小改动只跑了相关的 15 份，全过。

### 8.1 查出并修了的

1. **手指落在覆盖层的钮上，滚不动、捏不了（N3 手感退了，原有 E2E 没有一条量这个）。**
   - 现象：手指按在眼睛 / 喇叭钮、「＋ 声部」虚线框（全部视图里是整宽的一条）上再拖，谱不滚；捏合时一根手指落在钮上，缩放不了，抬手还会误触发那颗钮。
   - 原因：谱面的滚动和捏合是 `score-view.ts` 自己用 pointer 事件做的（平台守卫把原生滚动拦了）。v0.16.25 的覆盖层在 pointerdown 就 `stopPropagation` + 捕获指针，`score-view` 的 `down()` 又整个跳过 `.ov-i`，于是这根手指谁也不拿去滚。刀 1 之前这些钮画在谱里，按住拖 = 滚动、抬手没动才算点。
   - 修法（手指才这样，笔 / 鼠标照旧）：覆盖层对手指**不拦**；`score-view` 对落在 `.ov-i` 上的手指只做滚动 / 捏合那一半（`finger.ov`），不算它自己的轻点 / 长按；覆盖层在 window 上听这根手指的后半程——动过 10 px（和谱面「手指抖一点也算轻点」同一个数）或又落下一根手指 = 不算点；没动就松手 = 点；按住不动到 420 ms = 长按。
   - 守卫：新 E2E `test/e2e/overlay-touch.mjs`（iPad 竖屏、手指）。同一份测试拿改之前的构建（v0.16.24）跑 = 前 9 条全过；拿 v0.16.25 跑 = 红 4 条；修完全过。
2. **文件里读进来的编号原样拼进 HTML。**
   - 曲段的编号（`score.json` 的 `papers[].id`）和声部的编号（MusicXML `<score-part id>`）读进来不校验。覆盖层的曲段控件组是拼 HTML 字符串的，`data-paper="${pp.id}"`、`data-parts="…"` 没转义；`index.html` 没有 CSP。别人给的 `.mxl` 把编号写成带引号的串 = 能往按钮上塞属性（含事件处理器）。
   - 修法：覆盖层拼 HTML 的地方一律 `esc()`（编号、`_t()` 的字都过）；「隐藏 N」不再把声部编号串进 `data-parts`，改成覆盖层自己按纸记一张表，点的时候按纸查。
   - 守卫：`overlay-touch.mjs` 最后一条（把一张纸的编号换成带引号 / 尖括号的串，页面上拼不出多余的属性）。
   - **同类的老问题不是这一刀带来的，没在这里修**：混音台 `src/ui/studio.ts` 有 8 处把轨 / 插件格的编号不转义拼进 `data-c` / `data-p`。正解是读入边界一处校验所有编号 + CSP，不是逐处补 `esc`——另开一件（归 Fable，格式红线区）。
3. 顺手：安卓上长按到点之后系统还会补发一次 contextmenu，「只看 / 独奏」会开了又关——覆盖层在长按已经算过时不再接这一次。iPad 没有这个事件，没受影响；无头浏览器测不到，没有守卫。

### 8.2 六处偏离的裁决

| # | Opus 的做法 | 裁决 | 理由 |
|---|---|---|---|
| 1 | 名字栏最小宽是一个常数 `NAME_MIN`，屏幕和 PDF 同宽 | **同意** | 施工单 §3.1 的「印的时候不给」是我写错了：它和 N2「PDF 一字节不变」、和「预览 = PDF」直接冲突。设计稿 §3 那一行跟着改。 |
| 2 | 八种只给写谱人看的披露（推定的灰字、速度 ↑↓、句号、类别色、角标、编排写错的说明、拍数不对的红点、页框）留在排版器，源头打 `ann`，PDF 只认这一个类 | **同意，并定成规矩** | 它们不是控件（没有手势），位置是排版内部算的，而且**要参加刀 4 的避让**（推定灰字挂在发夹末端、角标在名字下面，天际线要知道它们占着哪）。排版器的输出从此是三样：可印图元 / 注解（`ann`，屏幕画、PDF 不印）/ 锚点。§1 那句话改成「编辑器的**控件**一样都不许留在排版器里」。新加注解 = 源头打 `ann`，不许再往 PDF 的名单里加名字。 |
| 3 | 「隐藏 N」放在右边的曲段控件组里 | **同意** | 左边是曲段名本身，放那儿要量名字的宽、会和长名字挤；和「只看本段」这些看法开关放一起也说得通。 |
| 4 | 空着的歌名 / 曲段名 / 编排提示字不接点，落到谱面原来的文本框点击区；只有作者栏的提示字自己接 | **同意** | 少一套重复的手势；E2E title-keys / arrange 原样过。 |
| 5 | 纸级的隐藏（整张纸「不放」）在 PDF 里照旧留着折叠的那一条空 | **这一刀同意；留一个问题给 user** | §4 第 5 条只管声部级。纸级现在预览和 PDF 仍然一致，只是印出来的纸上有一段空。要不要也「不留空」见 8.4。 |
| 6 | 两颗钮还是 3.2 个线间距 | **归 user**（见 8.4） | 现在只是 `score-overlay.ts` 的一个常数，不动版面。 |

### 8.3 三条「偶尔红」的测试：都定位了，都和覆盖层无关

- **gate「硬超时 8 s 左右」实测 6.2–6.6 s，和 follow（翻谱跟随）的「小屏」那条：同一个根因 = 这台机器的墙上钟会被往回拨。**
  - 量出来的：node 里每 100 ms 比一次 `Date.now()` 和 `performance.now()`，75 秒里墙上钟被往回拨了 3 次，每次 1.7–1.9 秒，大约 32 秒一次（WSL2 的系统对时）。
  - gate：给页面里所有 5–9 秒的定时器记了启动 / 触发时刻——那一次 reconnect 在页面里用了 8001 ms，一点不差；测试在 node 侧拿 `Date.now()` 量，撞上一次回拨就量成 6241 ms。**闸门的代码没有问题**（我先前按代码读，怀疑有另一个更早的超时，是错的方向）。
  - follow：测试给每次采样打 `Date.now()` 时间戳，再找「换行之后 450 ms 的那一次采样」；回拨之后找到的是别的采样（两秒后的，或者换行之前的）。新旧版本对照各跑三次：v0.16.24 红 2 次、v0.16.25 红 2 次——这条从 10-10 起一直被记成「时序 flake」。
  - 修法：E2E 里量时长一律用单调钟 `performance.now()`（8 个文件 20 处）；守卫 = `test/e2e-areas.test.ts`「E2E 里不用墙上钟量时长」。
  - 改完的结果：gate 两次都 172 / 172（等了 8002 ms）。**follow 换了钟之后还是会红（6 次 4 次），而且红法多了「播放没起来」**——另量了一次：无头浏览器里放 48 秒，音频时钟（`AudioContext.currentTime`）中间有十几秒几乎不走（每 5 秒一段的速率：1.0 / 1.0 / 0.65 / 0.04 / 0.01 / 0.01 / 0.74 / 1.0 / 1.0）。所以 follow 的红不只一个原因，墙上钟是其中一个；音频时钟为什么停没查完。它在改之前的两个构建上同样红（各三次红两次），不拦这一版。
- **pad-follow（换乐器后键盘跟随）：每次从外网下 32 MB。** 本地 serve 的 `pwa-sounds/` 是 404，这条测试（还有 cast-back）点「上场」= 每次从 GitHub Pages 下 GeneralUser GS，30 秒内没下完就红（正常 4 秒）。违反测试纪律「不引用仓外东西」，另开一件改成不靠外网（这次没修）。

### 8.4 留给 user 拍的（两件）

1. **两颗钮要不要小一点。** 现在边长 3.2 个线间距（iPad 上约 28 px）。你 11-08 说过「稍微适当的小一点」，同一天也说过「至少要比那些小扳手大」（小扳手是 3.0）。两句话之间只有 3.1 这一档。改 = 改一个数，不动版面。我的建议：先不动——28 px 已经比手指的舒服尺寸小，再小更难点；钮现在在名字上面、不挤名字了，当初嫌它大的理由少了一半。
2. **隐藏的整张曲段（「不放」的那种）印出来要不要留空。** 现在预览和 PDF 里它都折成一条：曲段名 + 一行说明，PDF 不印字、位置留着。要和隐藏声部一样「不排、不占地方」的话，预览里它就只剩一颗不占位的小标（点了进去）。我的建议：改成不留空，但放到刀 5（看法层）一起做——「哪些曲段 / 声部进版面」本来就是看法层的事，现在单改要在排版器里再绕一次。

### 8.5 §5 验收逐条

| 验收项 | 结果 |
|---|---|
| N1 版面快照 | 过（三首 × 六种视图；印的三份刀前刀后逐个相同） |
| N2 PDF 字节 | 过（三份 sha256 不变） |
| N3 手感 | v0.16.25 不过（8.1 第 1 条）→ v0.16.26 修了、加了守卫 |
| N4 排版器里没有编辑器的字 | 过（守卫拿改之前的排版器套会抓出 9 句） |
| N5 延迟 | 过；另量了覆盖层自己：样张歌（3 段 7 声部、35 个元素）每次重画中位 0.2 ms / 最大 0.5 ms（`span("overlay")`，探针里多一栏） |
| 排版器里 `part-tg / add-box / paper-chip / key-hint` = 0 | 0 |
| PDF 不印名单 ≤ 5 项 | 4 项（ann / selbox / caret / in-span） |
| 排版器行数下降 | 1656 → 1572（预计 −150，实际 −84：八种注解没搬） |
| 样张两张 | 发了（刀前刀后对照 + 隐藏一位） |
| CLAUDE.md 一条 + 设计稿标「做了」 | 有 |

