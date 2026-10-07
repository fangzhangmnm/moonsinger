# MoonSinger 数据契约草稿（一首歌 = 一个 .mxl）

> created 20261007 · by Claude Opus 5.5 · as-of v0.1.3 / 2026-10-07（第 2 版：按同日下午的讨论重写——不用 pattern、导演层取消、谱 / 休息室 / 录音房三样、`score.musicxml` 是正本）
> **状态：user「好…先这样？之后遇到问题累在吃书吧？」= 先按这版做，遇到问题再吃书（每个模块带版本号、迁移是纯函数，本来就是为吃书准备的）。** 标「未定」的是还在想的；其余的来龙去脉与原话 = `20261006-editor-v0-grill.md`「持久化第 N 题」及之后各条。
> 先例：CatsUp 持久化立宪（CatsUp `ai-docs/20260919-persistence-data-contract.md` §7）、WeebPaint 的 .ora（外面标准 `.ora`、里面 `.weebpaint/`）。MusicXML 的事实核过 W3C 4.0 文档。

## 0. 一句话

一首歌 = 一个 `.mxl`（MusicXML 官方的 zip 形）。`score.musicxml` 就是这首歌的**正本**（别的软件打开看到的就是真东西）；我们自己的东西放在 zip 里的 `.moonsinger/`，每份自带版本号、各自迁移。

## 1. 三样东西（user：「谱子集合 / 乐队成员 / 录音房」，导演层后来取消）

| | 是什么 | 存在哪 |
|---|---|---|
| **谱** | 这首歌的总谱：声部、音符、歌词、和弦、力度、曲线、反复记号。**一首歌可以由几个曲段按顺序接成**（user「还是可以有多个曲段方便写长曲子」；分界 = 段落记号，MusicXML `<rehearsal>`；不是 pattern 那种引用，每段只出现在一处）；谱架上另存没用上的曲段（草稿、复制出来的片段，sunset 着、随时复出、不导出） | 歌里 |
| **休息室** | 乐队成员 = **角色**（女高音、贝斯手…；「贝斯手不是贝斯」）。每个角色若干**候选**（音源 + 它自己的链），手动选上场的那一个；下线的候选留着不删 | 跟人走（以后接 store = 一个 collection）；歌里带一份用到的角色的快照 |
| **录音房** | 一堆电线：麦克风（输入）→ 通道 → 总线 / 侧链 / 效果 → 总输出。电线随便接，但每个设备都有主人。录音房不记谁进哪个麦克风 | 歌里 |

**绑定跟着谱走**（user 要 WYSIWYG）：**每个声部自己选角色、选麦克风**（user「你是说谱子负责绑定而不是角色记得哪个麦克风对吧，这样ui也方便了，就是选角色，选麦克风」「就是每个谱号的前面选，是这样吧？」→ 界面 = 每行谱号前面的声部名，点它选角色和麦克风，像 MuseScore 左边的乐器名）。角色 → 上场的候选在休息室里手动选；角色不记麦克风（同一个角色的两条线可以进不同的麦克风）。写谱时听和最后导出永远是同一套绑定。

**乐器链 vs 录音房**（AI 的答法，待认）：数学一样也是两个东西，按「跟谁走」分——跟着演奏者走的（效果器、音箱、琴箱共鸣、琶音器、repeater）属于候选的链；留在屋里的（共用混响 / delay 总线、侧链、母带）属于录音房。

**监听方式不进文件**（user：「监听单声道，以及dry的需求我也同意，就想看碰撞体，wireframe。或者用不同的光照」）：完整（WYSIWYG，默认）/ 干声 / 单声道 / 独奏 / 草稿听（元音采样，按下就响）= 视图状态，像 3D 的线框、换光照。

**复用靠记谱的老办法，不用 pattern**（user「我宁愿谱子复制一遍」「贝多芬时代也会写loop keyword的对吧」）：反复线（带「反复几遍」）、几次房、D.C. / D.S. / Fine / Coda、多段歌词；几乎一样又不完全一样的就复制再改。

## 2. 已经定的

| 结论 | 出处（账本） |
|---|---|
| 存档是 zip，扩展名 `.mxl`；外面标准、里面 `.moonsinger/`（照 WeebPaint；不用自家扩展名 = 别的软件能开 + app 改过两次名） | 持久化第 2 题；草稿第 1 版之后 |
| 多声部按小节线对齐（第 k 小节长度取各声部里最长的，短的补静音）；拍号 / 速度 / 段落记号整首共享，调号先共享（**2026-10-07 吃书**：调号 / 拍号只是各声部自己的画法，不共享、不影响渲染；速度与段落记号仍整首一份——§7 第 8 条） | 第 3 题 |
| 和弦两种都留位：和弦轨（一串带时值的和弦记号）+ 音符可叠音 | 第 4 题 |
| 乐器身份 = GM 音色号 + 变体；乐器配置和谱分开；引擎参数按引擎分开存 | 第 5 题 |
| 歌词每个音节写明语言（`xml:lang`） | 第 6 题 |
| 曲线挂在音符上、时间 = 音里 0–1；数值三类（音高 = 音分 / 音量 = dB / 音色旋钮 = −1…+1，0 = 本色）+ SI 兜底 | 第 7 题 |
| 上不了场 = 不出声、报错、人手动换（不自动替补）；下线的候选留着不删；不认识的引擎配置原样写回 | 第 5 题之后 |
| 响度三层不连乘：音符力度 = 意图；候选的校准 = 看得见、能调的默认（不偷偷自动）；推子 = dB | 同上 |
| 版本与迁移照 CatsUp：每个模块自己的版本号、迁移是纯函数、读时链式升级、写只写当前版、冻结旧样本、老文件永远能开、只拒开比 app 新的 | 10-05 handoff §1 |
| pattern 改名「曲段」，现在指谱架上存着的片段 | user「曲段」 |

## 3. .mxl 完整目录表（提案）

照 WeebPaint 动 .ora 布局的规矩：每次改这张表都要报 user。

| zip 里的路径 | 归哪样 | 内容 | 版本号 |
|---|---|---|---|
| `mimetype` | 标准 | `application/vnd.recordare.musicxml`；必须是第一个文件、不压缩 | — |
| `META-INF/container.xml` | 标准 | 第一个 `<rootfile>` = `score.musicxml` | — |
| `score.musicxml` | 谱（正本） | MusicXML 4.0：声部（part-name = 角色名）、音符（带 `id`）、休止、歌词（每音节 `xml:lang`，多段 `number`）、调号 / 拍号 / 速度、反复记号、和弦记号（`<harmony>`）、叠音（`<chord/>`）、力度（`<note dynamics>`）。每个声部的乐器（GM 号、`instrument-sound`）和音量 / pan 是写给别的软件的提示，我们自己读时以休息室 / 录音房为准 | MusicXML 4.0 |
| `.moonsinger/manifest.json` | 总目录 | 下面每份文件在不在、各自的版本号、写它的 app 版本 | 1 |
| `.moonsinger/score.json` | 谱（扩展） | MusicXML 装不下的谱上的东西：每个声部的角色 id 和麦克风 id、哪些小节线是人插的（自动的不进数据）、还没写音高的音（先写歌词那种）；按音符 id / 声部 id 对号 | 1 |
| `.moonsinger/curves.json` | 谱（扩展） | 曲线：按音符 id；名字 = 月读的旋钮名；时间 = 音里 0–1；数值三类 | 1 |
| `.moonsinger/shelf/<曲段 id>.musicxml` | 谱架 | 存着的曲段，每个都是一份能单独打开的小 MusicXML；不导出、不播放（除非拿回来）；清单在 manifest | MusicXML 4.0 |
| `.moonsinger/lounge/<角色 id>.json` | 休息室快照 | 这首歌用到的每个角色一份：名字、候选们（每个：名字、GM 号 + 变体、哼的字、响度校准（dB，可调默认）、自己的链、引擎参数按引擎名分组——**不认识的原样写回**）、上场的是哪个候选 | 每份各自 1 |
| `.moonsinger/studio.json` | 录音房 | 麦克风、通道（推子 dB、pan）；总线 / 侧链 / 效果以后加；每个设备记主人 | 1 |
| `attachments/…` | 挂件 | 图片的字节（贴纸用的、封面用的、参考图）；在 manifest 里列出。一份字节可以同时当贴纸和封面（引用，不复制） | — |

不认识的文件（以后的版本加的、别的工具加的）：读时留在内存里，存档时原样写回。

**每个字段只有一处真相**（2026-10-07 user 问「score.json和score.musicxml那个是ssot哪个是derived？还是这里卫生很差？」；edited by Claude Fable 5.1）：谱的内容（声部、音符、歌词、记号、纸、歌名、作者栏）以 `score.musicxml` 为准；声部的绑定（角色 / 麦克风）、候选、录音房以 `.moonsinger/` 为准——`score.musicxml` 里每个声部的乐器名 / GM 号 / `<instrument-sound>` / 音量 / pan 是**写给别的软件看的派生物**，读自家文件时不看它们（代码现状如此：`project.ts` 读时以 lounge / studio 为准）。`score.json` 不复制谱的内容，只按音符 id / 小节序号**挂注**（哪些小节线是人插的、哪些音还没写音高）；对不上的条目忽略（别的软件改过谱）。「正本」是按字段说的，不是按文件说的。

## 4. 谱：我们的 token ↔ MusicXML

| 我们的 | MusicXML | 备注 |
|---|---|---|
| 时值（TPQ = 1680） | `<divisions>1680</divisions>` + `<duration>` | 1680 = 2⁴·3·5·7，三 / 五 / 六 / 七连音都是整数；显示用 `<type>` `<dot>` `<time-modification>` |
| 带拼写的音高 | `<pitch><step><alter><octave>` | |
| 休止 0 | `<rest/>` | |
| 连音线 | `<tie>` + `<notations><tied>` | |
| 小节线（人插的 / 按拍号自动的） | `<measure>` | MusicXML 必须分小节：两种都写成小节，哪些是人插的记在 `score.json` |
| 调号 / 拍号 | `<attributes><key><fifths>` / `<time><beats><beat-type>` | 中途的写在发生的那个小节里 |
| 速度 | `<direction>` 里的 `<metronome>` + `<sound tempo>` | 速度的文字（Andante…）由数字推出来，不存 |
| 歌词 + 「这个词没完」 | `<lyric number><syllabic>` + `<text xml:lang>` | begin / middle / end / single 由 hyph 推；多段词 = 多个 `number` |
| 反复（留位） | `<barline><repeat direction times>`、几次房、`<sound dacapo dalsegno segno coda tocoda fine>` | 编辑器还没有这些 token |
| 某一段换人演（留位） | `<sound><instrument-change>` | 以后要时用 |
| 叠音（留位） | 后面几个 `<note>` 带 `<chord/>` | 月读只唱最上面那个 |
| 和弦轨（留位） | 第一个声部里的 `<harmony>`，`<offset>` 落在拍上 | |
| 力度（留位） | `<note dynamics>` / `<dynamics>` 记号 | |
| 音符 id | `<note id="n17">` | 编辑时不变、复制粘贴时换新；曲线、score.json 都按它对号 |

现在挂在整首歌上的「哼的字」（`Song.hum`）→ 搬到月读这个候选的配置里。音质（完整 / 轻量）→ 变成「女高音这个角色上场的是完整版月读还是元音版月读」（休息室里手动选）。模型来源、pad 布局、监听方式 = 设备上的，不进文件。

## 5. 打开别的软件存的 MusicXML / .mxl

- 只有谱：声部、音符、歌词、反复照读；没有 `xml:lang` 的歌词按自动认填（有假名 → 日、拉丁 → 英、只有汉字 → 跟前一个字）。
- 角色：每个声部按 part-name 建一个角色；候选按 `<midi-program>`（GM 号）在休息室里找；找不到 = 这个角色没有上场的人、不出声、提示人选（不自动塞一个）。
- 录音房：取各声部的 volume / pan 当初值。

## 6. 无地逃生口（store 之前先做的导入导出）

user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」。照 WeebPaint 的无地：

- 文件菜单：「打开…」「存」「另存为…」。桌面 Chromium 能存回原文件；iPad / Safari 存 = 下载或分享一个 `.mxl`，打开 = 选文件。改过没存要有标记。
- 不需要 store、不长 gallery（家族「无库不长 gallery」）。
- 休息室在 store 之前 = 当前这首歌里的角色（快照）；跨歌的休息室要持久化，等 store（或者能单独导出一个休息室文件——未定）。

## 6⅓. 角色名 = 官方乐器语义（2026-10-07；edited by Claude Opus 5.5）

user：「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西…这个就是我那个窄接口要拦的」「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」。
- MusicXML 三层正好对上：`<part-name>` = 角色名（谱上写的）；`<instrument-sound>` = 角色是什么声部（W3C sounds.xml 的官方 id，预设表 `src/score/roles.ts`）；`<virtual-instrument>` = 谁来演（候选：月读、以后的插件），**名字不上谱**。
- 休息室的角色快照多一个 `sound` 字段（官方 id）；别的软件的谱：读它的 `<instrument-sound>` 记进角色。
- 同名：user「然后default name如果重名的话会变成vocals vocals2这样？」→ AI 答 → user「这个应该可以现在做」→ v0.2.25 做了（`src/score/roles.ts` numberParts；名字和官方 id 都一样才一起编，合唱 Bass 和贝斯不一起编；现在只有一个声部，看不出来）：照打谱软件（MuseScore 4 的自动编号），同名的都带号「Vocals 1 / Vocals 2」（第一个也补 1，单独一个不带号）；编号不存进角色名、按声部先后现算，写 MusicXML 时 `<part-name>` 带号；弦乐罗马数字（Violin I / II）要不要归 user。
- 角色下拉按功能（v0.2.24，user「不应跟是乐器name salad，而是功能选」）：人声 Vocals / Backing Vocals / SATB，乐队 Piano / Guitar / Bass / Drums / Strings / Synth Pad / Synth Lead，`src/score/roles.ts`。

## 6⅖. 作者栏 = 纯文本（2026-10-07；edited by Claude Opus 5.5）

user：「作曲人那个框是比较自由就是可以写 role1: name / role2: name / disclaimer 这样对吧？」→「恩主要是月读的eula可能得把谁唱的写上去。嗯所见即所得。不过你权衡一个plain multiline text vs自动识别（但是这样有hidden convention），你看一下怎么办」→ AI 选纯文本 →「只是举例子，然后这个你也不应该强迫或者提醒用户写这个，因为谱子也不绑定乐器的」「…一键插入按钮 不要」。
- `Song.credits` = 一块纯文本（几行都行），纸上照写的显示、标题下面靠右；**不解析**「作词：」这类写法（不留隐藏约定）。不提醒、不帮用户写任何署名。
- MusicXML = `<credit page="1"><credit-words justify="right">`（印在页面上的字，几行用换行），不写 `<creator>` 元数据。读：第一页上不是标题 / 副标题 / 页码 / 声部名的 credit 字；没有就从 `<creator>` 拼（作词作曲同一人「X 词曲」、不同两行、编曲「Z 编曲」）。

## 6½. 图片：贴纸 + 封面（2026-10-07 user 定了方向；edited by Claude Opus 5.5）

user：「贴纸同意，虽然ui麻烦些但是可能是必要的。然后可以类似webxiaoheiwu一样可以设置成封面的引用。但是我们也可以单独设置封面，不一定要上乐谱纸」
（之前 AI 答「插图片放标题上面还是下面」：没有固定规矩——标题上面整块插画 / 标题旁边小图 / 随便贴都常见；建议做成贴纸，不进 token 串、不影响折行。）

- **贴纸**：图片贴在纸面上、位置自由；不是 token，不影响排版和折行。字节在 `attachments/`。
- **封面**：照 WXHW ADR-0012（及 2026-09-30 修订）：封面可以引用某张贴纸的图（记出处，不复制），也可以单独设一张不上纸的图。
- 还没定（等实现那一轮问）：
  1. 贴纸钉在哪：纸的绝对位置，还是跟着某个音 / 小节走？这和「纸宽是不是固定物理页框」那一问连着（纸宽固定时绝对位置才稳；手机上重新折行时跟着音走才不错位）。
  2. 写进 MusicXML：别的软件能认的是页上的 `<credit-image>`（页坐标）；我们自己的钉法放 `.moonsinger/score.json`，存的时候按严格纸宽算出页坐标写进 `<credit-image>`。
  3. 封面的出处字段放 `manifest.json` 还是 `score.json`；要不要像 WXHW 一样另存一张缩略图给文件列表用（接 gallery 时再定）。

## 6¾. 纸（2026-10-07 user 确认；edited by Claude Opus 5.5）

user：「嗯A4 A5 A6三种，可以定」「默认A5同意」「非打印的时候不用断页」；AI 归纳、user 确认：「纸只属于「谱」层，主纸承载整首歌的各曲段（靠段落记号分界），谱架上每个曲段是单独的小纸（草稿），文件名/歌名/曲段名各自对应文件、主纸标题、谱架小纸标题，互不冲突；纸张大小随整首歌统一设置。」→「哈哈可以」。

- **纸只属于谱这一层**（休息室、录音房不是纸）。**主纸** = 这首歌本身（各曲段按顺序在同一张纸上，段落记号 `<rehearsal>` 分界；MusicXML 不引用别的文件，曲段是写在里面的）；**谱架上每个曲段 = 一张单独的小纸**（`.moonsinger/shelf/<曲段>.musicxml`，由 manifest 列出；不唱、不导出、别的软件看不到）。
- **名字**：文件名 = 文件（管理把手，默认「年月日-歌名」，存过之后和歌名各管各的，文件菜单能改）；歌名 = 主纸标题（`<work-title>`）；曲段名 = 主纸上的段落记号 / 谱架小纸的标题，挪来挪去跟着走。
- **纸张**：A4 / A5 / A6，默认 A5，整首歌一个设置。写进 MusicXML 标准的 `<defaults>`（`<scaling>` = 五线谱的实际大小、`<page-layout>` = 页宽高 + 边距），按尺寸认档（差 2 mm 内算同一档）；别的软件存的别的纸（Letter 等）原样保留写回、显示「其他」。不加扩展字段。
- **五线谱实际大小三档一样**（照 WXHW「字号绝对」），纸越大一行放的越多；屏上五线谱大小按设备定，放得下严格按纸排、放不下（手机）按屏重新折行；编辑时不分页（页高只给打印 / PDF）。
- 以后多首歌（歌本）= 文件夹，不是一个文件里放几首（MusicXML 的 opus 集合文档很少有软件支持）。

## 7. 未定 / 还要想的

1. 「乐器链 vs 录音房按跟谁走分」user 还没表态。
2. 歌里的角色快照和休息室里后来改过的角色，以哪份为准（第 5b 题，还没问成）。
3. SI 兜底的物理定义表（气息、张力、实声、嘴张多大、男女声感、辅音长短各自的物理量）。
4. 还没写音高的音（先写歌词）在 MusicXML 里怎么写（现在的打算：写成继承来的音高，`score.json` 标「未写」）。
5. 跨歌的休息室在 store 之前放哪。
6. 谱架上的曲段要不要也能带自己的角色绑定（拿回来时怎么接上）。
7. **记号 vs 曲线：曲线是真相，记号是曲线的低保真可视化 + 备份**（2026-10-07 user 定；edited by Claude Fable 5.1）。user：「记号是真相，曲线只存偏差，默认演绎不存。不同意，风险你也说了，abandonware… i am wondering if the articulation symbols, just like how you use latin for tempo, is a low fidelity visualization and backup? making round trip with fewer loss」「默认演绎 无法接受」。AI 原提案（记号为真相、曲线存偏差、默认演绎由 app 里的函数算）**作废**：默认演绎 = 藏在 app 里的约定 = 反弃坑红线。
   - 曲线存**绝对值、SI**（第 7 题：音量 dB、音高音分；音色旋钮 −1…+1 的物理定义表 = 本节第 3 条，要写进候选快照、不藏在 app）。渲染 = 纯函数(文件)。一个音没画曲线 = 用这个音所在候选快照里**写明的**默认数（by value，§8），不是 app 里的表。
   - 谱上的 mp / mf / < > / 跳音 / 重音 = 从曲线**算出来**写进 MusicXML（同 §4「速度的文字由数字推出来，不存」）：给人看、给别的软件看、丢了 curves.json 时当备份。读自家文件：有 curves.json 就不看记号；读别家文件 / 丢了曲线：记号 → 曲线一次性生成（按候选快照里的力度表 mp = 多少 dB），从此曲线是真相。往返损失 = 只剩记号那一档分辨率，user 接受。
   - 在谱上「打一个 mf」= 输入手势：写成一段常量曲线（值查候选快照的力度表）。力度表（pp…ff → dB）、跳音吃掉多长、重音怎么起 = 候选快照里的显式数字，by value 进文件。
   - 曲线 → 记号的量化只管显示和备份，改版不影响声音（声音只看曲线）。
   - **FL Studio 比 .mxl 多的东西**，按「挂在谁身上」归位：① 每个音的演奏属性（力度 / 释放力度 / 微调音高 / pan / 滑音）→ 我们的曲线（挂音符、音里 0–1，比 FL 还细）；② 时间线自动化（任何设备的参数按小节拍走、不挂音符：8 小节淡出、pad 的滤波扫频、速度曲线）→ 录音房那层的自动化轨，时间 = 小节:拍，主人 = 设备，以后做；③ 音频片段 / 采样 → 人录的音频以后要接住（§8），采样库不做；④ pattern / playlist → user 已否决（「我宁愿谱子复制一遍」）；⑤ 混音器 / 发送 / 侧链 / 插件状态 → 录音房 + 候选的 engines（已留位）。
8. **调号 / 拍号 = 各声部自己的画法，不是语义**（2026-10-07 user 定；edited by Claude Fable 5.1）。user：「调号拍号应该只影响 single track, even not the sibling track in the same sheet. they are just representation. the ssot are the notes and the align markers (小节线), the rendering engine dont care about 拍号 unless auto curve/articulation generation」；此前「拍号调号不知道。但是多张纸的incentive就是写一段之后有一个新的开始，之前如果不小心没对齐不会无限往后propogate」。AI 的「共享轨 / 状态机」提案**作废**。
   - 真相 = 音符（带拼写的绝对音高 + 时值）+ 小节线（对齐标记）。调号 / 拍号是每个声部各自的记号 token，只影响这个声部怎么画；不共享、不影响兄弟声部、渲染不看。
   - **速度不在这条里**（AI 补，等 user 确认）：速度决定秒数，是物理量，各声部必须同一条时间线 → 速度仍整首一份；段落记号（曲段分界）同样整首一份。
   - 多声部对齐 = 第 k 条小节线对第 k 条（曲段内；曲段 = 重新对齐点，各声部从自己的第 1 小节起算，没对齐不往后传）。各声部拍号不同 → 小节长短不同 → 短的补静音（第 3 题）。
   - **一个要定的后果**（AI 提，等 user）：按拍号自动画的小节线现在不存。既然小节线是对齐标记，要么存起来，要么每次从拍号算（那拍号就不只是画法——它决定对齐）。AI 倾向：对齐只认存着的小节线；自动小节线在写的时候实时物化成存着的（像输入法上屏），之后改拍号不动已有的小节线。
   - 迁移：多轨 = Song.parts[]，每个声部自己的 token 串原样（含它自己的调号 / 拍号 token）；不再需要「抽共享轨」那一步。
9. **鼓最优先**（2026-10-07 user「gm当然要鼓，甚至鼓是最优先的」「所以你知道为什么鼓比钢琴重要了吧」）：鼓是另一种记谱——无音高、每个鼓件一条线（MusicXML `<unpitched>` + `<score-instrument>` + `<midi-unpitched>`，GM 第 10 通道）。数据上：声部多一个「有音高 / 打击乐」的种类；打击乐声部的音符不记音高、记鼓件 id（kick / snare / hat…）+ 谱上画在哪条线。输入设备（pad 是按音高排的）要另想——正是「先做多轨把结构逼出来」要逼的东西。

## 8. 谁的字节 + by value（2026-10-07 user 定；edited by Claude Fable 5.1）

user 原话：「笔刷架，这里是送命题。很简单。哲学问题：weebpaint里面几乎每个像素都是用户自己的。这里的mp3几乎全部的数据都不是用户自己的。而是音源和版权音源。所以weebpaint可以不带任何素材的无地。我们这里是我最洁癖的」「啊对人录的mp3，audacity那些活，以后我们也得接住」「brush rack: my idea is we can copy a preset from brush rack to the file. that is a by val copy, not a by refernce. so later edits of the brush rack in another file dont nuke us. make it as pure function as possible. even record the hash of the sound fonts. you should have all the data you need for the pure function. if the sound font is too fat, at least a hash」。

- **休息室 → 歌 = by value**：从笔架（休息室）拿一个预设进歌 = 整份拷进 `lounge/<角色>.json`；之后休息室里再改，不影响这首歌；「从休息室更新」是显式动作。§7 第 2 条（歌里快照 vs 休息室改过以哪份为准）就此定：**歌里的为准**。
- **渲染 = 纯函数(文件)**：候选快照里写全纯函数要的一切——所有旋钮的显式数值、力度表、SI 定义、引擎名 + 引擎参数；不依赖 app 里的默认表（§7 第 7 条）。
- **音源按哈希钉**：每个候选记它用的音源（soundfont / 模型包）的 `sha256` + 包名。装了且哈希对 = 出声；没装或哈希不对 = 这个角色没人上场、不出声、报错、人来换（已定）。字节要不要进文件：体积和许可证允许就 by value 拷进 `attachments/`；太胖至少哈希。（AI 补注：拷进文件 = 再分发，许可证归 user 逐案核；月读 UTAU 条款 ③ 允许内置。）
- **`.mxl` 里的用户字节**：谱、歌词、曲线、贴纸 / 封面、以后用户自己录的音频（留位 `attachments/audio/<id>.<wav|flac|opus>` + 录音房一条录音轨：片段 = 音频 id + 起点 + 入点 / 出点 + 增益，非破坏性；Audacity 那类活 = 以后的编辑器功能，本版只留位）。导出的 mp3 = 用户的谱 × 音源，署名义务跟音源走（作者栏是写的地方，app 不强迫、不提醒）。
- 无地的含义：MoonSinger 的无地 = 谱的文件家 + 设备上装好、哈希对得上的音源包；文件自身带着复现所需的全部数据（纯函数 + 哈希），这是反弃坑的落点。WeebPaint 能零素材是因为像素都是用户的。
