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
