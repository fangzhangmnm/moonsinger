# 交接给 Opus：MoonSinger v0.6.7 的现状与 immediate tasks

> created 20261008 by Claude Fable 5.1 · as-of v0.6.7 / 2026-10-08 深夜
> user 2026-10-08「两个选择 1. 做 undo，接下来的交给 opus」→ 选了 1。本文 = Fable 这两天（10-08）落下的东西 + user 当天口头派给 Opus 的活（原话都在）。读之前先读本仓 `CLAUDE.md`（每一节都带 user 原话）和 `ai-docs/20261008-store-gallery-wiring-handoff.md`（歌库接线 + 两家比对 + 追记）。

## 0. 怎么跑 / 怎么验

- `npm run build`（tsc 门 + 接缝 lint + content-hash）→ `PORT=8710 BIND=127.0.0.1 npm run serve` → `npm test`（单元 164）→ `npm run smoke`（壳 6 + 无地 20）→ `npm run e2e`（真浏览器：歌库 41 / 选区 19 / 句号·隐藏纸·符号层 19 / 撤销 ~15；要 8710 在跑、借 WeebPaint 的 playwright）。
- 真机：**零**。user 用 iPad（竖屏）+ iPhone；dev 站 https://fangzhangmnm.github.io/moonsinger/dev/ 。user 清缓存撞过一次部署窗口（白屏，现在会糊红条）。
- 推 dev = push main 两端（origin OneDrive + github）；**push prod 必问 user**（prod = v0.5.1，33592aa）。版本：**只 bump patch**，minor 由 user 说（10-01 规矩）。
- 测试钩子 `window.__moonsinger`（main.ts 末尾）：state / set / layout / bytes / open / store / es / gallery / attach / newStoreSong / openStoreDoc / setScope / setPages / setPaperHidden / toggleChord / playSong / undo / redo / history / flatten …

## 1. 10-08 落下的（按版本）

| 版本 | 内容 |
|---|---|
| 0.6.0 | 歌库 = @internal/store 0.16.1 + gallery 0.7.0 + OneDrive（接缝 src/app-store.ts；懒建；封面尾读；moonsinger-thumbs）；editor-session 拷自 WeebPaint + `release()` |
| 0.6.1 | 顶栏重理（歌库图标 + 文件名字；锁 / smart save 九态 / 三条杠）；退出必落盘；黑匣子（report-error.ts + diag-ui.ts）；版式重调 |
| 0.6.2 | 改的手感：长按选区 + 把手 + 选区条 + 两层剪贴板（简谱文字）；软键盘让位 |
| 0.6.3 | 句号 token；合跨休止符；纸隐藏 = 不放；连续 = 分页同几何；范围 本段 / 全部；走带回顶栏；写字头只在刚写过时亮 |
| 0.6.4–0.6.5 | 句号不换行；加载失败红条 |
| 0.6.6 | 叠音全套；pad 符号层「符」；滚键盘 = 滑到下一键；句号无语义、存 score.json；播放跟视图范围；轻点不响 |
| 0.6.7 | 撤销 / 重做（src/score/history.ts：song 每变记一份引用快照，拖 / 连打歌词并成一步，换歌清栈；顶栏 ↶ ↷ + ⌘Z / ⌘⇧Z）；E2E 进仓 `test/e2e/` |

## 2. user 派给 Opus 的 immediate tasks（2026-10-08 深夜原话）

1. **音源改弱引用 + 打包 / 解包**：「我后悔自动 embed 音源了，改成弱引用吧，app 可以自己找吗，然后类似 blender，可以 pack all packable resources 或者 unpack all。然后导出的时候可以选导出 packed 版本的。不过月读不能 pack 吧，pack 了也很难跑起来」。现状：弱引用的查找链已有（CLAUDE.md v0.4.3：歌里 → 本次 → 设备缓存 → 家族音源库 → 「找文件…」，`resolveGmBytes`）；`castPick(p, "auto")` 小于软上限时嵌。要改：默认弱引用；文件菜单「打包全部 / 解包全部」；导出 hub「存一份 .mxl 副本（打包音源）」；月读 / 模型永不打包。格式：`source.embedded` 已是可空字段，契约草稿 §10。
2. **wishlist：license + credit 推演工具**：「导出和保存（包括 pack, unpack）的时候加一个 license 和 credit 推演工具，只用最 minimal 的。reference 里面的东西不算」。音源条目自带 license / credit（音源库 index.json 快照、sf2 INFO）；月读有 CREDIT 块；导出时把用到的（不含 reference）推成一段最小的署名文字。
3. **混音：三轨音量不稳**：「三个音轨感觉音量很不稳定，会不会有相互遮盖…难道你是用三个 audio label 放的而不是混音的？还是月读自己抽？就是感觉乐器进来之后好像月读变轻了…是不是因为没有挂压缩器？」代码事实（main.ts `renderMix`）：各声部离线渲染后**线性相加**成立体声（麦克风增益 / 声像），**没有压缩器**；相加后若峰值 > 0.98 就把**整条混音**按峰值缩到 0.98——所以响的乐器一进来，月读跟着一起被缩小。要改：别按峰值缩整条（改成只在峰值处限幅 / 软限幅），乐器给默认增益（如 −6 dB），月读当基准。听感归 user 耳朵，AI 只改数学。
4. **试弹时键盘上的音域没有跟进**：找人视图的试听台（pad 只弹不写）里，音域旋钮 / 音域提示条没跟着试听的乐器走。
5. **滚键盘**：「滚键盘的意思是手指在键盘上滑动到下一个音，不说拖动键盘的意思」——v0.6.6 已改成滑到下一键就响（`pad.ts glideStart`），真机没验；user 又说了一遍，先真机确认。
6. **乐器目录类级跳转**：「分类能不能有一个类级别的跳转功能，不然一个一个下拉很累」（`src/ui/finder.ts`：按年代 / 族 / 发声方式 / 〇〇风分组，加一条分组索引条或字母表式跳转）。
7. **修的记号一口气做**：「呼吸记号 跳音 / 力度这类修的记号进选区条、笔工具盘 一口气做」（此前 user「笔刷可以暂缓」、「还没想好要不要用呼吸」——先问清楚再动；Fable 对笔工具盘的保留意见在 10-08 聊天里：只给「写 / 画」二态开关，不开整盘）。选区条在 `src/ui/sel-bar.ts`。
8. **仓鼠收货**：「game icon 和新的表找仓鼠收货」——仓鼠会话（MyLlamaReborn `20261007 音乐史`，export v4、乐器图标 / 新表）；取货脚本 `scripts/gen-instruments.mjs`，图标进 `vendor/instruments/`（第三方图标 + 署名）。

## 3. 还开着的（不急）

- 真机验：叠音手感（两键同时按、叠键）、长按选区 + 把手、软键盘让位、歌库 + 云（Azure SPA 重定向 URI 要有 gh pages 根 + /dev/ + localhost:8710）。
- 两家接线比对里 12 条 user 还没拍（wiring-handoff §4）。
- pad 多选时的语义（现状 = 打音改选中第一个音再往后跳）。
- 空白处长按（以后放「粘贴」）。
- 「〇〇风」UI 名字 / 策展预设包（wishlist W-13 / W-14）。

## 4. 坑（别再踩）

- `score-view.down()` 先算纸面坐标再 `focus()`（focus 会滚）。
- editor-session：`es.start()` 不调就没有自动存；活动稿被歌库挪 / 删后先 `es.release()` 再处置（不然旧名字复活）。
- 多行谱里没歌词的行比歌词基线矮：歌词行命中按每行自己的基线找（v0.6.3 修）。
- 连续排法的纸有上下左右边距（和分页同几何）：E2E 里点歌名要用 `layout().title` 的框。
- 发版那一分钟清缓存 = 模块 404 白屏（index.html 已有 onerror 红条）。
- 守卫：`test/redline-guard` / `storage-whitelist` / `store-wiring` 结构性测试——碰持久层 / 接缝先看它们的白名单。
