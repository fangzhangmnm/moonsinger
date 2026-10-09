# 交接给 Opus：MoonSinger v0.6.7 的现状与 immediate tasks

> created 20261008 by Claude Fable 5.1 · as-of v0.6.7 / 2026-10-08 深夜
> user 2026-10-08「两个选择 1. 做 undo，接下来的交给 opus」→ 选了 1。本文 = Fable 这两天（10-08）落下的东西 + user 当天口头派给 Opus 的活（原话都在）。读之前先读本仓 `CLAUDE.md`（每一节都带 user 原话）和 `ai-docs/20261008-store-gallery-wiring-handoff.md`（歌库接线 + 两家比对 + 追记）。

## 0. 怎么跑 / 怎么验

- `npm run build`（tsc 门 + 接缝 lint + content-hash）→ `PORT=8710 BIND=127.0.0.1 npm run serve` → `npm test`（单元 164）→ `npm run smoke`（壳 6 + 无地 20）→ `npm run e2e`（真浏览器：歌库 41 / 选区 19 / 句号·隐藏纸·符号层 19 / 撤销 ~15；要 8710 在跑、借 WeebPaint 的 playwright）。
- 真机：**零**。user 用 iPad（竖屏）+ iPhone；dev 站 https://fangzhangmnm.github.io/moonsinger/dev/ 。user 清缓存撞过一次部署窗口（白屏，现在会糊红条）。
- worktree 里跑 E2E（2026-10-08 起两个 session 各自 worktree）：另起一口 `PORT=8713 BIND=127.0.0.1 npm run serve` + `MS_E2E_BASE=http://127.0.0.1:8713/ node test/e2e/<x>.mjs`；playwright 借 WeebPaint 的那份，`test/e2e/pw.mjs` 从 git common dir 定位（主目录 / worktree 都行）；smoke 自己起服务不用管。
- 推 dev = push main 两端（origin OneDrive + github）；**push prod 必问 user**（prod = v0.5.1，33592aa）。版本：**只 bump patch**，minor 由 user 说（10-01 规矩）。
- 测试钩子 `window.__moonsinger`（main.ts 末尾）：state / set / layout / bytes / open / store / es / gallery / attach / newStoreSong / openStoreDoc / setScope / setPages / setPaperHidden / toggleChord / playSong / undo / redo / history / flatten …

## 0½. Opus 接手后的进度（as-of 2026-10-08 早上，edited by Claude Opus 5.5；提交 84eaa22 + 694fdf2，还没升版本、没推 dev——等 Fable 的歌库同步修复一起构建）

| § 2 | 状态 |
|---|---|
| 1 弱引用 + 打包 / 解包 + 导出打包副本 | 已做（细节在仓 CLAUDE.md「交接活」节） |
| 2 license + credit 推演 | 已做；user 澄清口径后改成三块（这首歌自己 + 演出署名 + 打包分发的许可）、reference = 未来的参考窗；另加这首歌的许可（默认未声明）和 mp3 ID3 标签——见仓 CLAUDE.md「交接活」节 |
| 3 混音 | 已做：母线限幅 + 用上候选 `calibrationDb`（乐器默认 −6 dB，歌手牌上能调）；听感待 user |
| 4 试弹音域 | 管线已做（提示条跟谁在弹、试听换人窗口跟进）；乐器音域数据等仓鼠 v5 `range`（user「让仓鼠调查」） |
| 5 滚键盘 | 代码在（v0.6.6）；问 user：写的时候滑过的每个键都写一个音，会不会误写 |
| 6 目录类级跳转 | 已做；顺带修了 user 当场报的「选乐器跳去第一次出现的组」、组头缝、目录里键盘开关、默认按曲风 |
| 7 修的记号 + 笔工具盘 | 记号已做（user 拍「挂在音上 + 选区条」「月读在那儿换气」；跳音 / 重音 / 保持 / 呼吸 + 力度，MusicXML 原生）；笔工具盘没做 |
| 8 仓鼠收货 | 已收到 v10（2026-10-08 晚；v8 起 GS 音效原速键、逐个音色的曲风） |

另：user 当场加的——月读条款中 / 英译文（已做）；歌库里不开歌进乐器目录玩（已做：歌库顶条「乐器」= 只弹着玩的目录）。之后的活（声部设置分两处、音效固定原速、按曲风按音色、pad 第一排补列…）记在仓 CLAUDE.md「交接活」节。

**分工（2026-10-08 晚起，edited by Claude Opus 5.5）**：主目录归 Opus——合并（自己的分支进 main）、构建 dist、推 origin + github 两端、bump patch 都由 Opus 自己做；碰红线（store / 同步引擎 / 加密 / 格式红线区 / OneDrive scope 等家规硬规则）直接 escalate user，由 user 决定要不要叫 Fable。出处：user 在 Fable 会话里说「如果没事让他默认做 merge 吧，这样不会老是用我 fable 的流量，他是主提交，你是碰到红线在管。应该之后我不说大概率用不到你。那边如果有红线我应该会判断的」（Fable 转述）；本会话 user「然后可以推了，我可以看一下」。push prod 照旧必问 user（家规 #5）。

**歌库对账 12 条的裁决（2026-10-08 晚，user 逐条回复；edited by Claude Fable 5.1）**：1 推云 = WeebPaint consent 制（「用weebpaint方案，对付大歌，这不是txt」）；2 「•」= 内存脏 + 云朵另算 + 挽留框（对齐 WeebPaint）；3 撞名后缀 = 本仓保持 -hex4，**WeebPaint 改**（便条 = WeebPaint ai-docs/inbox/20261008-collision-suffix-hex4-handoff.md）；4 退出登录 = 脏门 + 备份 + 拆库 + 退出；5 / 6 / 11 本来就同 WeebPaint；7 进歌库 = 放下手里的歌（gallery-first，没有「回到谱」）；8 首笔安家（早已落）；9 三家登录都没问题、不改；10 拿新版本时锁输入（WXHW 式）；12 只是说明。全部落在 v0.6.21（仓 CLAUDE.md「歌库」节）。同夜另落：有选区时 pad 别的键 = 整组（C）、空白处小菜单；**替换模式（选区 + 音键）和「按住 = 叠」的和弦输入还在讨论，没动**。

**v0.6.22（2026-10-08 深夜，edited by Claude Opus 5.5）**：有选区 = 替换模式（键盘只管打谱、吃掉不写出选区、写字头画在选区里）+ 整组操作挪进选区菜单（选区条「操作…」/ 长按选区里的音原地抬手 / 右键）+ 两键叠音判定改「观望」（头 80 ms；尾 = 谁先松 + 一起按着 vs A 单独按的比例）+ pad 符号层（跳音 / 重音 / 保持、♩= 一行、高度钉在行数里能滚、「符」= Shift 逻辑）+ 布局加减号。细节在仓 CLAUDE.md「交接活」节。**这一版把 v0.6.21 的「有选区 pad 整组（C）」改掉了一半**：长短旋钮 / 0 / 电脑 8 · 9 不再整组改，整组时值走选区菜单（user 后来那句「键盘只做纯粹的打谱」）。月读强制单声的疑问记成 wishlist W-25。真机零验证。

**v0.6.23（2026-10-08 深夜，edited by Claude Opus 5.5）**：顶栏菜单按 WeebPaint / WXHW 重理——点文件名 = 改名（WXHW ADR-0007；本机文件的只提示去文件管理器改）；三条杠 = 这首歌的低频事务小菜单（新建 / 打开本机文件 / 导出 / 存进歌库 | 改文件名 / 封面图 / 声音与署名 | 设置）；设置面板去掉了乐器目录 / 歌库 / 云端 / 录音室四个钮（入口各在别处）。原「文件菜单」拆成封面图、声音与署名两张小面板。图标从家族库取 rename / volume / settings（无新图标需求）。调研结论：两家都没有「文件名菜单」；登录从不进三条杠（歌库的云朵 + smart save 的提示）。

**v0.6.24（2026-10-08 深夜，edited by Claude Opus 5.5）**：pad「⋯ → 布局…」从占 pad 头一排改成对话框（不再挤变形键盘；user 提议）。保持音（tenuto）现在不影响出声——普通音本来就满长、月读只读呼吸；契约里 `tenutoGate` 留着，等以后普通音默认不满长时才有区别（已回答 user，没改）。

**v0.6.25（2026-10-08 深夜，edited by Claude Opus 5.5）**：演奏者不认的记号画灰 + 明说（user 拍）；表 = `perform.ts` `ignoredArts`，`test/honors.test.ts` 守着和出声一致。同一轮 user 还在讨论（没拍）：连 / 断怎么做、确定性偏移、预设按乐器分类还是默认 0、mp / mf 和曲线之争、和 FL / MuseScore 的区别、大音源 vs 物理模拟——讨论内容只在对话里，没写成规矩。

**v0.6.26（2026-10-08 深夜，edited by Claude Opus 5.5）**：呼吸对 SoundFont 乐器也生效（前一个音收短一口气 = 稍微断开；user「毕竟不断气一直拖着也不对」）；元音版 / 乐器共用 `perform.ts` `lightMarks`，honors 测试调同一个函数。

**v0.6.27（2026-10-08 深夜，edited by Claude Opus 5.5）**：连断第 1、2 步（演奏者底色 gapSec 按 GM 家族默认 + 乐器页能调；连线 slur 数据 / 画 / MusicXML / 修 / 符号层）；月读的连线 / 保持 = 「本来就连着唱」画灰明说；第 3 步（月读唱法核心的断）没做。user 同轮定的方向（讨论，没写成规矩的不算）：下一个大活 = 实时播放；曲线 = 未来的核心输入设计（像 pad 一样要摸出来）；记号和曲线是第二遍、第一遍只管旋律节奏流；空间混音全量要、物理量摆位置；音轨 / 录音 / Audacity 那些活要接（慢慢来）。

**v0.6.28（2026-10-08 深夜，edited by Claude Opus 5.5）**：收了仓鼠 v11（gm-map 每行六项演奏元数据，附依据，纯增量）；连断底色改成从目录的 `joint.gapMs` 来（`gapClassOf` 写死表删了），和旧表的差别只有风笛 = 连 0、口琴 = 吐音 40。velLayers 的实测结论（TSF 只用力度挑层、不执行 sf2 调制器；接 velocity 的话 54 个号在 mp→mf 换层）记在仓鼠仓 `ai-docs/20261008-演奏元数据.md`，等 user 定要不要把 mp/mf 接到力度。

**v0.7.0（2026-10-08 深夜，edited by Claude Opus 5.5）= 表情纪元起手**：prod = v0.6.28（user「push prod bump minor」；推法见仓 CLAUDE.md git 节）。力度就是 velocity（力度表 / 重音 / 强音 / 旋钮，旧演奏者照旧）+ 强音记号；细节在仓 CLAUDE.md「0.7.0 = 表情」。**user 同轮排的后续（方向，不是规矩）**：先把「改与演」做好（user「我们先把改与演做好」）——下一刀 = 渐强渐弱 < >；之后的卫生需求 = 参考窗（`@internal/reference-window`）；实时播放 / 从中间播放之前，「让fable好好的重构一下发声和混音引擎契约。最好能设计一个插件式的窄接口，让每一个音源可以热插拔」（user 原话）。

**v0.7.1（2026-10-08 深夜，edited by Claude Opus 5.5）**：渐强渐弱 < >；月读跳音改走唱谱的休止（不切音频）。user 问「参考窗你能做吗还是要 fable」：参考窗的数据契约归 `@internal/reference-window` 库（`.<app>/references/manifest.json` + 每张卡的字节，版本 / 迁移在库里；WeebPaint / WXHW 已接，WXHW `src/reference-host.ts` + `src/project/format.ts` 是样板），本仓只是容器里多一个目录 → Opus 回答「能做，动手前先交一页对齐稿」，等 user 定；要 bump minor（user「2需要bump minor」）。发声 / 混音引擎契约重构 + 算法优化 = Fable（user「3需要fable想一下算法优化这些东西」）。

**v0.7.2（2026-10-08 深夜，edited by Claude Opus 5.5）**：范围开关搬到「‹ 2/3 ›」旁边、一个「本段」开关（亮 = 本段，同独奏；扳手里去掉；user「就一个按钮toggle」「类似solo toggle」）；月读的跳音 = 下一个字前「^」顿一下（user「跳音就是顿一下」「跳音先试试只顿」，不够再加「唱一半 + 休止」）、重音 / 强音 = 这个字前「^」（user「嗯重音也顿」）；力度记号搬进符号层、「修」里去掉（user「p应该是符号里而不是修里面，它应该是状态机吧」），符号层亮着光标处生效的那个。

**v0.7.4（2026-10-08 深夜，edited by Claude Opus 5.5）**：曲段控件组（每张纸自己那一行「‹ k/n › 本段 ⋯」）；长按空白的小菜单加力度那一排（user「长按的小菜单也能输入力度符号」）；三条杠里「设置…」上面显示版本号（v0.7.3）。**等 user 拍的**（Opus 交的数据结构 / 心智模型分析，见对话）：渐强渐弱改成 token（读最近的 pf）、力度记号长按选中 / 拖动 / 删、「修」入口去掉（符号键盘承重）、符号模式下 ← → 步进 + 退格只删符号。

**v0.7.5（2026-10-08 深夜，edited by Claude Opus 5.5）**：记号解读 = 演奏者配置（user 拍）。**user 拍了的整套（按阶段做）**：B 渐强渐弱改成记号、读最近的 pf（本张纸里；没终点走一档并灰字披露）；C 音上的力度形状——音头（重音 / 强音 / sfz / fp，互斥）+ 音内（< / > / <>），两层能叠（user「要要我都要」）；D 光标只停在音和手动「|」上（「|」属于写音层，user「同意」），写音模式 ⌫ 只删音 / 休止 / 「|」、符号模式 ⌫ 只删记号否则退一步，删音时同类状态记号湮灭（留最后一个）并提示，去掉「修」；E 力度 / 渐强渐弱长按拖动、歌词长按拖 = 合 / 分。

**v0.7.6（2026-10-08 深夜，edited by Claude Opus 5.5）**：阶段 B——渐强渐弱改成记号（读同一张纸里最近的力度记号；没终点走一档 + 灰字披露）。已知小毛病（以前就有）：第一个音上同时有速度记号和力度记号时字会撞。愿望单 W-26（乐器目录两层下拉）park。

**v0.7.7 / v0.7.8（2026-10-08 深夜，edited by Claude Opus 5.5）**：音头 sfz / fp；力度那一行的位置（上 / 中间 / 下）+ 行距按内容（顺手修了速度记号和力度字撞）。阶段还剩：C 第二半（音内 < > <>）、D（光标 / 退格 / 湮灭 / 去掉「修」）、E（长按拖动记号和歌词）。

**v0.7.9 / v0.7.10 / v0.7.11（2026-10-08 深夜，edited by Claude Opus 5.5）**：音内起伏 < > <>（v0.7.9）；写音一层、符号一层——光标只按音走、两种退格、删音湮灭、去掉「修」（v0.7.10）；阶段 E 长按拖（v0.7.11）：歌词长按拖 = 合 / 早一个音起 / 晚一个音起（空出来的变拖腔），力度记号 / 渐强渐弱点 = 小菜单、长按拖 = 挪；同一轮按 user「< 号不用靠着一点空隙都没有…超级长的<号不要让它太akward」把发夹和力度字之间留出空（按量过的墨迹），比一整行长的写成「cresc. - - -」。user 拍的整套阶段 A–F 到这里做完。细节见 CLAUDE.md「长按拖」「写音一层、符号一层」。

**v0.7.12（2026-10-08 深夜，edited by Claude Opus 5.5）**：符号层开着时写音层的键 / 旋钮灰掉，符号层只放表情记号（去掉小节线 / 休止 / 拉长）；弹的时候「符」灰掉；连线 + 呼吸同一道缝 = 呼吸算数（user 给两个选项，AI 选「两个都留、出声呼吸算数」）。待 user 定：符号层怎么让人知道下面还有（AI 提「pad 头那一排在符号层里换成分页标签」）、「弹」的时候用符号层设力度。

**v0.7.13（2026-10-08 深夜，edited by Claude Opus 5.5）**：连续排法不画纸的边距、只留一圈窄边；行宽和分页严格一样（间距数、每一行的音；行宽不再取整）。user「非分页显示…能不能把页边距省了…但是行宽必须严格一样」。

**v0.7.14（2026-10-08 深夜，edited by Claude Opus 5.5）**：符号层分三页（演奏法 / 力度 / 记号），pad 头那一排在符号层里换成标签（user「可以」）；记住在哪一页（修「切换符号键盘的时候翻页会乱」）。

**v0.7.15（2026-10-08 深夜，edited by Claude Opus 5.5）**：pad 的状态（1= / 调式 / 时值 / 连音 / 音域）跟着歌走（score.json `view.pad`，同 WeebPaint editor-state）；写音那一排加呼吸键。下一件：user 报「一个大bug，每一个sheet有独立的歌手组合，而不是一个track在不同sheet对应同一个歌手」「然后跨sheet的连接按歌手认领」。

**v0.7.16（2026-10-08 深夜，edited by Claude Opus 5.5）**：声部就是歌手——新歌手只在当前纸、歌手牌小卡「交给…」换绑（对方在这张纸上 = 对调）/「＋ 加歌手…」；速度在最上面那位不在的纸上不再丢；读到共用角色拆开。详见 CLAUDE.md「声部就是歌手」。没做：同一张纸中间换人（AI 建议在那里切纸；user 没回）。

**v0.7.17（2026-10-08 深夜，edited by Claude Opus 5.5）**：打歌词时手指滚谱不再收框 / 收键盘 / 被拽回（手指按下不抢焦点）；谱下面留一整屏；跟随光标下面留大约一行。

**v0.7.18（2026-10-08 深夜，edited by Claude Opus 5.5）**：小字（っ / ゃ…）自己占一个音时月读照样唱（っ = 前一个音节后停顿 + 下一个字前 ^）；打字照原样。待 user：渐弱写了但下一个力度更强怎么办（现在是照终点往上走 = 和记号相反）；次重音（四拍子强弱次强弱）。

**v0.7.19（2026-10-08 深夜，edited by Claude Opus 5.5）**：渐强渐弱方向和终点反着 = 方向说了算（走一档、到终点突变、灰字披露）。接着做：力度记号拖到休止上 + 拖动的视觉反馈；次重音 / 弱化 / 幽灵音（user「对，音的强度只能有一种，但是可能有很多级」「各种弱化也做」）；自动拍子轻重（默认关）。

**v0.7.20（2026-10-08 深夜，edited by Claude Opus 5.5）**：力度记号 / 渐强渐弱能拖到休止上；拖的时候被拖的东西是强调色。待 user：力度落在光标前那个音（同音头记号）、「渐到」自动搭发夹（linear vs clamp）、结束发夹的力度字要不要低调 / 记号整体要不要淡。

**v0.7.21（2026-10-08 深夜，edited by Claude Opus 5.5）**：光标在行末的音后面画在行末。user 立纪律「不能成功发音识别的歌词也标灰…这个项目的纪律」→ CLAUDE.md「纪律」节；下一件 = 歌词画灰。

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

## 2½. 架构不变量（Fable 留给上面几件事的护栏；改之前想清楚）

- **音源弱引用（§2.1）**：候选的 `source` 永远带 `{ subsetSha256, origin }`，字节（`embedded`）可来可去——「打包」= 填字节、「解包」= 去字节，**两边都不碰 sha256 / origin**，解析链（歌里 → 本次 → 设备缓存 → 音源库 → 找文件）按 sha256 认，解不到 = 不出声、报错、人换（家规「不许自动替补」）。「导出打包版」= 临时打包进那一份副本，**不改正本**（和导出 = 寄明信片一致）。月读 / 模型永不进歌（它们是 pwa-models 的包，钉哈希）。格式只加可选字段，走 `test/format-guard` 的冻结样本规矩。
- **license + credit 推演（§2.2）**：只看**会出声的**候选（休息室里台上 + 候补都算；参考窗里的素材不算），按（许可证, 署名）去重后推一段最小文字；来源 = 音源库条目快照 / sf2 INFO / 月读 CREDIT 块，**不联网查**。推演是提示，不拦存 / 不拦导出（家规「不许规训用户」）。
- **混音（§2.3）**：母线上别做「整条按峰值缩」这种会改相对音量的事；要么每声部的增益是人定的（录音室）+ 母线只限峰，要么明说「自动响度」是一个开关。
- **撤销（0.6.7 → v0.6.11 已扩到 extras，见本条末尾）**：~~只盖谱（song）~~；~~**休息室（选角 / 候选）、麦克风、封面、纸隐藏不进 undo**~~（它们改 `doc.extras` 或 `song.papers[].hidden`…hidden 在 song 里所以进了）——要盖的话把那些改动也走 `update()` 或另开一条 extras 的历史。任何新代码直接调 `applyState()` = 绕过 undo（只有 undo / redo 自己能调）。
  **user 2026-10-08 上午的方向**：「undo 可以参考 weebpaint 的视图 vs 文件。视图会顺手捞进文件」= WeebPaint 的 `desk`（workbench-state.ts：视口 / 工具旋钮 / 调色板等视图态，**存时顺手捞进文件、改了不标脏、不进 undo**；editor-session 注释里还叫它 editor-state.ts，那个文件已经没了）。落到 MoonSinger：判据只有「进不进文件」——进文件的内容（谱、选角 / 候选、麦克风增益声像、封面）走同一条 undo（快照从 `song` 扩成 `{song, extras}`，引用快照不费地方）；视图态（静音 / 独奏 / 只看、当前纸、缩放、排法）像 desk：存时顺手写进 score.json、不标脏、不进 undo。推子拖动当手势合并（同拖音高）。
  **→ 2026-10-08 上午 user 拍：「每一步快照带 locus 同意」「undo 同意啊」「undo 我们需要 workbench 机制吗」（答：要一个薄的，不要 WeebPaint 那套反应式大机器——一个对象 ↔ score.json 的 view 字段，变量不搬家）。v0.6.11 落地：`history.ts` 快照 `{song, extras, at, caret, sel, locus}`、`updateExtras / updateBoth`、`restore()` 视图跟着走 + toast、`src/score/desk.ts` + 契约 ViewV1 + `openBytes().view`；「先露再撤」那一档没做。E2E undo.mjs 28 条。以后加任何改 extras 的操作：走 `updateExtras`，给一句人话 locus；连续动作给 gesture。**
  **user 的顾虑（当时未拍，现已按下面的建议落地）**：「不同模块用同一个 undo，多按几次会不会静默变你没有监视的页面、曲段和文件」。Fable 建议：每步快照带 **locus**（纸 id / 声部 / 模块：谱 · 休息室 · 录音室），undo 时**视图跟着走**（切到那张纸 / 那条声部，光标已经随快照回去了；休息室 / 录音室的改动就把那块面板带出来或闪一下）+ 每次 undo 出一条短 toast 写明撤了什么（「撤销 · 第 2 段 · 删 3 个音」「撤销 · 录音室 · 二胡 −6 dB」）；更严的可选项 = 「先露再撤」：locus 不在眼前时第一下 ⌘Z 只把它带到眼前、第二下才真撤（IDE 式）。**绝不**跨文件：换歌清栈（已是）。归 user 选一档。
- **测试钩子 `window.__moonsinger`**：生产页也露着（同源 JS 才摸得到，和 WXHW 的探针一个级别）；别往里放会越过 store 护栏的东西。
- **诊断日志**：只落设备，只在用户点「复制 / 分享」时离开；里面有文件身份、登录态，没有账号名、没有 token。

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

## 5. 歌库同步：「一直弹云端冲突」的查案（2026-10-08 早上，Claude Fable 5.1；user「跑一下，其实我刚才就一直会遇到云端冲突的提示」「我是写着写着过一会就跳一次，这时候 onedrive 凭证还没过期」）

**结论：是库（@internal/store 0.16.1）的一个缺口，不是两台设备真打架。** 每次 reload / 冷启动之后、第一次推（= 写着写着 15 s 空闲推）必弹一次「本地覆盖云端 / 云端覆盖本地 / 取消」，之后这次打开里不再弹——和 user 的描述逐字对上。真机 iPad 的诊断日志（04:23 那份）里一小时五次 reload（升版本），每次之后都会撞一次。

**机制**（`node_modules/@internal/store/dist/local-head.js` + `freshness.js`）：
1. 谱系是 per-tab 的：`_base`（本 tab 见过的云端 tip）只在内存；reload 后空。durable 轨（localStorage `files.etag:<name>`）只给 `seenBase` 回退用。
2. 本 tab 第一次编辑 `recordEdit` 捕 `_parent = _base.get(name) ?? null`——**只看内存 `_base`**（这是对的：W2 红线，别的 tab 推过的 etag 不能当我的 parent）。
3. `_base` 在 reload 后靠 `freshness.open()` 的 in-sync 分支 `markSeen` 重捕——但只在 **open 时云端可达（登录着）** 才跑。MoonSinger 的 boot 顺序 = 建 store → 本地恢复（开歌）→ initAuth（CatsUp 2026-09-22 顺序），开歌那一刻还没登录 → 不查云 → 不重捕。登录后 `afterSignIn` → `refreshOpenDoc` = `pullIfClean` = `freshness.refresh()`：in-sync 分支**直接 return，不 markSeen**（和 open 的分支不对称）。
4. 于是第一次编辑 parent = null → push 不带 If-Match → `conflictBehavior:"fail"` → 云端有同名 → 409 → `CloudNameCollisionError` → `surfaceCollision`（mode existing）→ **冲突面**。人选「本地覆盖云端」= weakOverride → `markSynced` 写 `_base` → 之后正常，直到下一次 reload。
5. WXHW 为什么没撞：它登录后 `pushNowAny()` 把开着的稿**无条件推一次**（推成功 `onPushed` 顺带设 `_base`）；MoonSinger 的 `es.flushAndPush()` 不脏不推。

**复现 + 验证**：`test/e2e/sync.mjs`（mock 云住 node 侧、两个浏览器 context = 两台设备；`test/e2e/cloud-bridge.mjs` 是桥）。mock 的登录态照真机：开局未登录、`signIn()` 之后才算。未修库：3 条「reload 之后推」打成「已知库缺口」（打印 ✗ 但不计失败，exit 0）；把 `freshness.js` 的 `refresh()` in-sync 分支加一行 `head.markSeen(name, meta.etag)`（只在 node_modules 里做实验、已还原）→ 37/37 全绿、零冲突面。

**→ 2026-10-08 上午 user「修」：库 0.16.2 已发（internal-store 20f828a，tag v0.16.2，回归测试在 test/freshness.test.ts），MoonSinger v0.6.9 已收货；sync E2E 37/37 硬检查全绿。下面是当时的提案原文。**

**要 user 拍板的库改动（硬规则：改库先 escalate）**：`20260813 internal-store` `src/freshness.ts` `refresh()`：
```ts
if (base != null && meta.etag === base) { head.markSeen(name, meta.etag); return { status: "in-sync" }; }
```
安全性论证和 `open()` 同一分支一样（库里那段注释写的就是这个窗口）；`refresh` 比 `open` 更严——进这一分支之前已经 `isDirtyAnywhere` 过（只对干净 tab 重捕）。patch 版本（0.16.2），`pull-package.sh` 收货。**不动库的替代（都不推荐）**：app 登录后把开着的歌无条件再推一次（WXHW 式，白推一份字节、云端时间戳乱走）；或登录后对干净的歌 `es.open` 同名重开（为了触发 open 的 gate 绕一圈 = 家规「不在 app 端绕」）。

**顺手修掉的（app 层）**：① `store-ui.ts` 冲突面每次弹出 / 人选了什么进黑匣子（`[sync] conflict occasion=… → …`），`main.ts` 每次推的结果进黑匣子（`[sync] push <id>: pushed | not pushed <reason> → <resolution>`）——下一份诊断日志就能直接看到场合和选择；② `openStoreDoc`（登录着从歌库再开一首）先 `pushDirtyAll` 再开：上一次「上传落了云、回执没回来、页面被杀」留下的脏标，推路径会逐字节比对自愈（`tryHeal`），而 open 的新鲜度检查不比字节、会白问一次「打开本地 / 云端覆盖本地」（E2E ③b）；③ `app-store.ts` 的 mock 云注入只认本机地址（`127.0.0.1` / `localhost`），线上没有这条路；`isSignedIn()` 收成一个出口。

**库侧另一条更深的缺口（这次没碰，记着）**：推到一半页面死掉 + 回来之前又编辑了 → 本地字节 ≠ 云端（自己上次推的）→ `tryHeal` 比对不等 → 真当分叉弹面。根治 = 推路径记住「在途字节的哈希」，412 时云端 == 上次在途 → 采纳 etag 当 base 再推。属 store 的活，等 user 要不要。
