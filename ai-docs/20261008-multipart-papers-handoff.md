# 多声部多纸（0.5.0）交接：模型、规则、哪里还没做

> created 20261008 by Claude Fable 5.1 · as-of v0.5.0 / 2026-10-08
> user 原话：「这个做好之后, bump minor，然后开始做多声部多纸」「首先就是不同的声部视图和出声应该分别可以solo和hide」「然后根据视图里面的进行对齐」「总谱式上下叠」「我回答你了啊 就是你可以toggle visibility, mute, solo」「先做多track多sheet，然后每个sheet的track数量当然不同。实时播放这个之后再grill」「不过你觉得值得顺手做方便也行，我可以之后和opus摸ux」。

## 1. 内存模型（`src/score/song.ts`）

- `Song.parts: PartDef[]` = 歌级声部并集（总谱从上到下）：`{ id: "P1", role: "r1", mic: "m1" }`；角色在休息室（`extras.lounge[role]`），麦克风在录音房（`extras.studio.mics`）。
- `Song.papers: PaperSeg[]` = 纸（曲段）的顺序表：`{ id: "p1", name: 曲段名, tracks: { 声部 id → Token[] } }`。某张纸没某个声部 = 没那串。每条 track 开头仍是三个谱头记号（调号 / 拍号 / 速度；0.2.x 不变）。
- `EditorState.at: { paper, part }` = 光标 / 选中在哪条 track；**所有写 / 改命令只碰 `tr(st)`**，写回用 `withTrack`。`setFocus(st, paper, part, caret?)` 换 track（清选中、清本次输入记录）。
- 纸 / 声部操作：`addPart`（每张纸给它一条只有谱头的 track，谱头抄那张纸第一个在场声部的）/ `removePart` / `addTrack` / `removeTrack`（这张纸上加 / 去掉某声部；纸上最后一条不能去）/ `addPaper`（谱头抄上一张纸结尾的调号 / 拍号 / 速度，契约 §6¾）/ `removePaper` / `movePaper` / `setPaperName`。
- token id 全歌唯一（`maxId`）；读文件时统一重编（纸序 × 声部序 × 下标）。
- **对齐规则**：纸内按 tick（从纸的开头数）对齐；小节线只是各声部自己的记谱（不按它对齐——按它对齐会把漏写的半拍悄悄修掉）；**纸界 = 硬对齐点**（`flattenPart` 把短的补休止到 `paperTicks`）。速度 = 第一个声部的状态机：`tempoMapOf(song)`，别的声部 `timeline(tokens, tempoMap)` 按它算秒数，自己串里的速度记号不出声不画。

## 2. 画（`src/render/engrave.ts`、`src/ui/score-view.ts`）

- 一张纸一块；纸内每个显示的声部各自 `unitsOf()`（0.2.x 的切时值 / 临时记号 / 自动小节线原样，多了 `tick`），再合成**列**（同 tick 同种东西对齐，列宽 = 最宽的）；折行只在「有小节线、且没有哪个声部的音跨过这一拍」的列后面；右端对齐 / 挤一挤照旧，作用在列上。
- 一行 = 几条谱（`Layout.systems` 每条一项，带 `paper / part / sys`）；`yOf(row, d)` 按行号；左边一根竖线连着；歌手牌（声部名）在每张纸第一行各条谱左边，光标所在的声部名高亮（`.part-name.focus`）；速度只画在歌里第一个声部上面；纸顶曲段名（多于一张纸或填了名字才画）+ 「⋯」；底下「＋ 新的纸」。
- score-view：`rowAt(y)` → 哪条谱 → 点空白 = 光标到那条（`setFocus` + caret）；点音 / 歌词 / 记号先换 track 再开框（歌词框 / 记号框只认光标所在 track 的命中：`L.systems[h.system].paper/part`）；框选只算起点那条谱。
- 版式 `Paper.density`（舒适 / 紧凑）决定 `SPACING`：谱上面留多少、行高（紧凑里没歌词的声部更矮）、歌词距、行距；紧凑的谱 5 mm（`staffMmOf`），纸宽不变、一行放得多。
- 触屏捏合缩放（`setZoom`，CSS zoom on `.sheet`，1–5 倍）+ 双指平移 + 放大后单指横滚 + 固定定位的「1:1」钮；`local()` 把指针坐标除回去。

## 3. 存（`src/format/`）

- 存法 B：`.moonsinger/papers/<id>.musicxml` 每纸一份完整 MusicXML（这张纸上在场的声部；`<movement-title>` = 曲段名；速度只写第一个声部；人插小节线 / 未写音高按纸记进 score.json）+ `score.musicxml` 派生压平件（`flattenPart` 各声部整首；每纸起 `<print new-page="yes"/>`，第一个声部写 `<rehearsal>`；`padMeasures` 各声部补整小节休止给别的软件看）。
- `FORMAT = { manifest: 2, score: 2, lounge: 2, studio: 1 }`；迁移 `manifestV1toV2`（derived: []）/ `scoreV1toV2`（papers = [p1 → papers/p1.musicxml]）；**文件级迁移在 `openBytes`**：包里没有 papers/p1.musicxml 就读 score.musicxml 当 p1。
- 休息室 API 全部带角色 id（`roleName(extras, role)` …）；`partLabels(song, extras)` 给所有声部的谱上名字（同名同种带号）；`newRoleId / newMicId / withNewRole / withoutRole`。
- 别家谱：每个声部都读（以前只读第一个），各建一个「原来的乐器」unknown 候选、没人上场；没有 `<work-title>` 时 `<movement-title>` 当歌名。
- 冻结样本 `test/fixtures/format/v2-2-2-1/`（两纸两声部，第二张只 P1）；守卫比 `tracks`（所有纸 × 声部）；老样本 v1-1-1-1 / v1-1-2-1 照旧能开（一张纸一声部）。

## 4. 播放（`src/app/main.ts`）

- `renderPart(part)`：按它角色上场的引擎各自离线渲染（月读 worker / 元音采样器 / TinySoundFont），按声部缓存；`renderMix()`：有独奏只出独奏的、否则出没静音的；线性重采样到 44.1 k、麦克风增益 / 等功率声像、峰值超 0.98 整体压回；月读前面的 leadIn（0.5 s，`humOpt().leadIn` 明传）和采样器前面的 0.1 s 扣掉对齐到第一个音。**哪个声部响不了 = 它不出声、报错，其余照放**（user「不是显示自动上，而是就是不出声，报错，人类手动换」）。
- `Singer.play` 收 `right` 就放立体声；mp3 导出这一版左右平均成单声道。
- 隐藏 / 静音 / 独奏 = `partView`（main.ts 内存），换歌清空；不进文件（要不要存待 user）。

## 4½. 0.5.1 追加（同日第二批）

- 显示 / 出声两轴（`partView`：hidden / only / muted / solo；`isShown`）；隐藏 = 细行（`partsHit` 同一条路开歌手牌）；角标 `PartView.badges`。
- 谱号 `PartDef.clef`（engrave 里低音谱号 = 音位 +12、升降号位 −2）；大谱表 `PartDef.staves = 2` + `NoteTok.staff`（`autoStaffs` / `staffOfTokens` / `toggleStaff`；MusicXML 读回来和自动一样的不记）；engrave 一个声部两行（`rowOf(s, r, k)`、`SPACING.graveUpper`）、符杠在换谱表处断（跨谱表符杠下一轮）。
- 排法 分页：`EngraveOpts.page`（sp：页高 + 四边）→ `ensure()` 整块翻页、页框 + 页码、`Layout.pageX / pages`；svg viewBox 往左扩边距；score-view 的 `.sheet-ink` 容器装歌词框 / 记号框 / 框选并右移边距，`local()` 减掉。
- 录音室 `src/ui/studio.ts`（StudioHost 接 main：增益 / 声像写 `withMic`，静音 / 独奏写 partView）；顶栏推子钮；`loungeKey()` 把 mics 也算进「改过没存」。
- 「＋」在扳手旁 + 扳手面板纸列表；「‹ 2/3 ›」= `navPaper`。

## 5. 没做 / 等 user

- **实时播放**（user「之后再grill」）；鼓谱；草稿听；建议 chip；vault README。
- 纸的几种排法提案（契约草稿 §7.11：版面纸 / 竖卷 / 横卷 = 一行无限向右，播放跟着走）——user「可以想一下到底有几种纸」，未动工。
- 麦克风增益 / 声像没有界面（studio.json 里的数照用）；低音谱号（低的声部现在也是高音谱号，加线一串）；键盘上换声部的快捷键；多声部 undo（本来就没有 undo）。
- 紧凑版式的数值（`SPACING.compact`）是我定的第一版，user 说「紧凑你可以多帮我优化一些」——可以继续收（比如行高按这条谱实际的最高 / 最低音算）。
- UX 细节 user 说和 Opus 摸：歌手牌里三个 toggle 的样子、纸菜单、捏合手感、「＋ 新的纸」的位置。
- 真机零（iPad / iPhone 都没试）。
- 配器 / 挑乐器 UI 开工前先看愿望单 W-13（策展数据 = 可替换预设包，不写死）、W-14（〇〇风 = 配方卡，数据结构和仓鼠商量；UI 名字 user 定）。

## 6. 怎么验

- `npm test`（135）、`npm run smoke`（6 + 20）、E2E 脚本在这次 session 的 `$CLAUDE_JOB_DIR/tmp/filee2e/`（multi.mjs 加声部 / 写两条 / 加纸 / 纸菜单 / 存开往返 / 混音播放；multi-play.mjs；pinch.mjs；compact.mjs 开冻结样本 + 紧凑）——脚本不进仓，照着重写很快：`window.__moonsinger` 有 `state / layout / bytes / open / load / zipList`。
