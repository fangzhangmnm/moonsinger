# MoonSinger 数据契约草稿（一首歌 = 一个 .mxl）

> created 20261007 · by Claude Opus 5.5 · as-of v0.1.3 / 2026-10-07（第 2 版：按同日下午的讨论重写——不用 pattern、导演层取消、谱 / 休息室 / 录音房三样、`score.musicxml` 是正本）
> **状态（2026-10-07 晚 user 定，编辑器 session 转述）：本草稿和 `src/format/contract.ts` 是推荐稿、不是定稿——「fable的任何数据结构契约都只是推荐稿，不对立刻说」；编辑器 session 对着 0.2.x 的手感用，哪里不对立刻报 user 并通知格式 session。守卫测试（版本号 / 迁移 / 冻结样本）照旧，那是防丢数据的，不是定设计的。** 此前：user「好…先这样？之后遇到问题累在吃书吧？」= 先按这版做，遇到问题再吃书（每个模块带版本号、迁移是纯函数，本来就是为吃书准备的）。** 标「未定」的是还在想的；其余的来龙去脉与原话 = `20261006-editor-v0-grill.md`「持久化第 N 题」及之后各条。
> 先例：CatsUp 持久化立宪（CatsUp `ai-docs/20260919-persistence-data-contract.md` §7）、WeebPaint 的 .ora（外面标准 `.ora`、里面 `.weebpaint/`）。MusicXML 的事实核过 W3C 4.0 文档。

## 0. 一句话

一首歌 = 一个 `.mxl`（MusicXML 官方的 zip 形）。`score.musicxml` 就是这首歌的**正本**（别的软件打开看到的就是真东西）；我们自己的东西放在 zip 里的 `.moonsinger/`，每份自带版本号、各自迁移。

## 1. 三样东西（user：「谱子集合 / 乐队成员 / 录音房」，导演层后来取消）

| | 是什么 | 存在哪 |
|---|---|---|
| **谱** | 这首歌的总谱：声部、音符、歌词、和弦、力度、曲线、反复记号。**一首歌 = 按顺序排的几张纸，纸 = 曲段**（user「还是可以有多个曲段方便写长曲子」「我以为纸就是曲段」；纸界 = `<print new-page>` + `<rehearsal>` 曲段名；不是 pattern 那种引用，每张纸只出现在一处；§6¾）；谱架上另存没用上的纸（草稿、复制出来的片段，sunset 着、随时复出、不导出） | 歌里 |
| **休息室** | 乐队成员 = **角色**（女高音、贝斯手…；「贝斯手不是贝斯」）。每个角色若干**候选**（音源 + 它自己的链），手动选上场的那一个；下线的候选留着不删 | 歌里（**2026-10-07 user 吃书**：「休息室是歌的一部分啊，不是笔架（preset set）而且我其实不太像做笔架」——不做跨歌的笔架 / collection；新建角色时从 app 内置预设 by value 拷进歌，§8） |
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
| pattern 改名「曲段」；**2026-10-07 晚：曲段 = 纸**（顺序里的和谱架上的是同一种东西，§6¾） | user「曲段」「我以为纸就是曲段」 |

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
| `.moonsinger/shelf/<纸 id>.musicxml` | 谱架 | 谱架上的纸（草稿），每张都是一份能单独打开的小 MusicXML，结构同顺序里的纸；**能单独唱（排练；user「一张纸要能单独拿出来唱」）**，不进导出；清单在 manifest | MusicXML 4.0 |
| `.moonsinger/lounge/<角色 id>.json` | 休息室快照 | 这首歌用到的每个角色一份：名字、候选们（每个：名字、GM 号 + 变体、哼的字、响度校准（dB，可调默认）、自己的链、引擎参数按引擎名分组——**不认识的原样写回**）、上场的是哪个候选 | 每份各自 1 |
| `.moonsinger/studio.json` | 录音房 | 麦克风、通道（推子 dB、pan）；总线 / 侧链 / 效果以后加；每个设备记主人 | 1 |
| `attachments/…` | 挂件 | 图片的字节（贴纸用的、封面用的、参考图）；在 manifest 里列出。一份字节可以同时当贴纸和封面（引用，不复制） | — |

不认识的文件（以后的版本加的、别的工具加的）：读时留在内存里，存档时原样写回。

**代码里的契约 = `src/format/contract.ts`**（v1 现役形状 + v2 提案形状）；守卫 = `test/format-guard.test.ts`（形状快照 / 迁移链 / 冻结样本，2026-10-07 起）。

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
- 休息室 = 当前这首歌里的角色（2026-10-07 user 定：休息室是歌的一部分，没有跨歌的笔架；接 store 也不变）。

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
  1. 贴纸钉在哪：先定钉在**哪张纸**上（纸 = 曲段，§6¾），再定纸内是绝对位置还是跟着某个音 / 小节走？这和「纸宽是不是固定物理页框」那一问连着（纸宽固定时绝对位置才稳；手机上重新折行时跟着音走才不错位）。
  2. 写进 MusicXML：别的软件能认的是页上的 `<credit-image>`（页坐标）；我们自己的钉法放 `.moonsinger/score.json`，存的时候按严格纸宽算出页坐标写进 `<credit-image>`。
  3. 封面的出处字段放 `manifest.json` 还是 `score.json`；要不要像 WXHW 一样另存一张缩略图给文件列表用（接 gallery 时再定）。

## 6¾. 纸 = 曲段（2026-10-07 晚 user 纠正；edited by Claude Fable 5.1——此前这一节是编辑器 session 把 user 的纠结压平成「主纸 = 整首歌」，user 当时回「哈哈可以」，今晚 user「我们有没有弄混误会，我以为纸就是曲段」）

user 原话链：「但是纸的歌名是章节名啊，我还是在纠结」（起名那轮）→「多张纸的incentive就是写一段之后有一个新的开始，之前如果不小心没对齐不会无限往后propogate」→「我们有没有弄混误会，我以为纸就是曲段」；速度：「理由：一张纸要能单独拿出来唱 合理，批」。

**user 批的**
- **纸 = 曲段**。一首歌 = 按顺序排的几张纸；纸顶那一条 = 曲段名（章节名）；**歌名不在纸上**，归文件 / 封面。
- 谱架上的草稿也是纸，只是不在顺序里，同一种东西。
- 不按引用复用：一张纸在歌里只出现一次，要重复就复制（user 否决 pattern：「我宁愿谱子复制一遍」）。
- **每张纸 = 一个新的开始**：各声部在这里重新对齐，没对齐不往后传。
- 纸张大小 A4 / A5 / A6 仍是整首歌一个设置（MusicXML `<defaults>`）。
- **速度每张纸开头明确写一个**（by value 存进这张纸）；新建纸时初始值照抄上一张纸结尾的速度；纸里面按状态机继承、曲中可以变速（§7.8）；不靠 app 默认值。代价 = 改第一张纸的速度后面的纸不跟着变，user 接受（「一张纸要能单独拿出来唱」）。

**推断（编辑器 session 提、Fable 同意，user 没单独拍）**
- 调号 / 拍号同理：每张纸、每个声部开头有自己的，新建纸时照抄上一张纸该声部结尾的——和 0.2.x「谱头三个记号删不掉」一致，和 §7.8「调号 / 拍号 = 各声部自己的画法」不冲突。

**存法 B = 一张纸一份 MusicXML + 一份派生压平件（user 2026-10-07 深夜拍，编辑器 session；Fable 独立同意；edited by Claude Fable 5.1 编辑器 session）**
user 问：「所以所有的纸放在同一个musicxml里面？为什么？然后这样title和各种元数据会不会只有第一张纸有？」「因为如果每个纸都standalone的话。你懂」→ 两案利弊（A 整首一份 MusicXML：实现简单，但声部必须贯穿全曲、谱架纸和歌里的纸两种写法、元数据只在第一页；B：每张纸是完整文件、元数据每纸自带、鼓只出现在有鼓的纸上、谱架纸和顺序里的纸同一种文件、别的软件靠派生压平件照样看整首）→ user 选 B。
- **每张纸 = 一份完整的 MusicXML**：`.moonsinger/papers/<纸 id>.musicxml`（放 `.moonsinger/` 下，别的软件只看压平件、不会以为是多份谱；Fable 倾向，编辑器同意）。每份 by value 写全：`<work-title>` 歌名、`<movement-title>` 曲段名、`<defaults>` 纸张、`<credit>` 作者栏、每个声部第一小节的 `<attributes>`（调号 / 拍号）、第一声部第一小节的 `<direction><metronome>` + `<sound tempo>`——**单独拿出一张纸什么都不缺**（user 的担心在 B 里自然消失）。
- **压平件 `score.musicxml` = 派生物**（ORA `mergedimage.png` 先例）：各纸声部取并集、某纸没有的声部补整小节休止、每纸起 `<print new-page="yes"/>` + `<rehearsal>`（= 曲段名）、小节号连续；**确定性**（同输入同字节，`<encoding-date>` 除外）。给别的软件和 PDF 用；`container.xml` 的 rootfile 仍指它。**自家读时无视它**：manifest 列 `derived: ["score.musicxml"]` + 它的 sha256；读时哈希不符 = 别的软件改过 → 当别家文件处理（按 `<print new-page>` / `<rehearsal>` 切纸、报出来），不静默。按字段 SSoT：纸是真相。代价 = 谱文本在文件里两份（谱文本很小，可忽略）。
- **谱架的纸 = 同一目录、同一种文件**（`.moonsinger/papers/<id>.musicxml`），只是不在顺序表里；manifest 另列 `shelf: [id]`。能单独唱（排练），不进压平件、不进导出（§3）。
- **`score.json` 第 2 版**：`papers: [{ id, file, manualBars: { <声部 id>: 纸内小节序号[] }, unwritten: string[] }]` 是**顺序表**（顺序 = 歌的顺序；`start` 不需要了）；`parts` = 歌级并集（id / role / mic / kind），某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part；`unwritten` 按纸（音符 id 每张纸自己编，跨纸会撞）。
- **迁移 v1 → v2**：老文件 = 一张纸——`score.musicxml` 整个变成 `papers/p1.musicxml`（**文件级迁移在 `openBytes` 里做**，`migrate()` 只管 JSON），再派生一份压平件；纸顶那行文字当时是歌名 → 仍归 `Song.title`，这张纸的曲段名 = 空；`papers = [{ id: "p1", file, manualBars: { P1: 旧 manualBars.P1 }, unwritten: 旧 unwritten }]`；manifest v2 加 `derived: []`（旧文件没有派生件）。

**推荐（Fable；歌名放哪、其余 MusicXML 写法）**
- **歌名 = 歌一级（user 2026-10-07 深夜拍：「歌名当然存歌一级」）**（`Song.title`，可不填），写 MusicXML `<work-title>`；文件名默认仍 = 年月日-歌名（没歌名 = 年月日-四位随机）。歌名在我们的纸上**不画**；封面 / 文件列表 / PDF 封面页用它（别的软件会把 `<work-title>` 印在第 1 页顶上——低保真，接受）。歌名的输入口从纸顶挪走（文件菜单 / 封面），归编辑器。
- **曲段名 = 这张纸 MusicXML 的 `<movement-title>`**（谱的内容，不另存；压平件里变成这张纸第一小节的 `<rehearsal>`），可为空。
- 作者栏仍歌一级（`<credit page="1">`，每张纸 by value 带一份），打印时印在第 1 页；编辑器每张纸不画。
- ~~纸的边界 = `<print new-page>`、score.json papers 带 start、谱架 `shelf/`、迁移 papers = [{ id, start }]~~ → 被上面的存法 B 取代（2026-10-07 深夜）。
- 内存模型（归编辑器）：`Song.papers[]` → 每张纸 `parts[]` → 每个声部自己的 token 串（开头三个记号）；§7.8 的「各声部按对齐标记对齐」在纸内算，纸界 = 硬对齐点。

## 7. 未定 / 还要想的

1. 「乐器链 vs 录音房按跟谁走分」user 还没表态。
2. ~~歌里的角色快照和休息室里后来改过的角色，以哪份为准（第 5b 题）~~ → 2026-10-07 作废：休息室就在歌里，没有「别处的休息室」。
3. SI 兜底的物理定义表（气息、张力、实声、嘴张多大、男女声感、辅音长短各自的物理量）。
4. 还没写音高的音（先写歌词）在 MusicXML 里怎么写（现在的打算：写成继承来的音高，`score.json` 标「未写」）。
5. ~~跨歌的休息室在 store 之前放哪~~ → 2026-10-07 作废：不做跨歌的休息室（user「我其实不太像做笔架. weebpaint里面我也没怎么改过笔」）。
6. ~~谱架上的曲段要不要也能带自己的角色绑定（拿回来时怎么接上）~~ → 2026-10-07 晚收掉（编辑器 session 提、Fable 同意）：休息室在歌里、谱架的纸是同一种纸 → 谱架纸的声部按 id 绑歌里的角色 / 麦克风，拿回来不用接。
7. **记号 vs 曲线：曲线是真相，记号是曲线的低保真可视化 + 备份**（2026-10-07 user 定；edited by Claude Fable 5.1）。user：「记号是真相，曲线只存偏差，默认演绎不存。不同意，风险你也说了，abandonware… i am wondering if the articulation symbols, just like how you use latin for tempo, is a low fidelity visualization and backup? making round trip with fewer loss」「默认演绎 无法接受」。AI 原提案（记号为真相、曲线存偏差、默认演绎由 app 里的函数算）**作废**：默认演绎 = 藏在 app 里的约定 = 反弃坑红线。
   - 曲线存**绝对值、SI**（第 7 题：音量 dB、音高音分；音色旋钮 −1…+1 的物理定义表 = 本节第 3 条，要写进候选快照、不藏在 app）。渲染 = 纯函数(文件)。一个音没画曲线 = 用这个音所在候选快照里**写明的**默认数（by value，§8），不是 app 里的表。
   - 谱上的 mp / mf / < > / 跳音 / 重音 = 从曲线**算出来**写进 MusicXML（同 §4「速度的文字由数字推出来，不存」）：给人看、给别的软件看、丢了 curves.json 时当备份。读自家文件：有 curves.json 就不看记号；读别家文件 / 丢了曲线：记号 → 曲线一次性生成（按候选快照里的力度表 mp = 多少 dB），从此曲线是真相。往返损失 = 只剩记号那一档分辨率，user 接受。
   - 在谱上「打一个 mf」= 输入手势：写成一段常量曲线（值查候选快照的力度表）。力度表（pp…ff → dB）、跳音吃掉多长、重音怎么起 = 候选快照里的显式数字，by value 进文件。
   - 曲线 → 记号的量化只管显示和备份，改版不影响声音（声音只看曲线）。
   - **FL Studio 比 .mxl 多的东西**，按「挂在谁身上」归位：① 每个音的演奏属性（力度 / 释放力度 / 微调音高 / pan / 滑音）→ 我们的曲线（挂音符、音里 0–1，比 FL 还细）；② 时间线自动化（任何设备的参数按小节拍走、不挂音符：8 小节淡出、pad 的滤波扫频、速度曲线）→ 录音房那层的自动化轨，时间 = 小节:拍，主人 = 设备，以后做；③ 音频片段 / 采样 → 人录的音频以后要接住（§8），采样库不做；④ pattern / playlist → user 已否决（「我宁愿谱子复制一遍」）；⑤ 混音器 / 发送 / 侧链 / 插件状态 → 录音房 + 候选的 engines（已留位）。
8. **调号 / 拍号 = 各声部自己的画法，不是语义**（2026-10-07 user 定；edited by Claude Fable 5.1）。user：「调号拍号应该只影响 single track, even not the sibling track in the same sheet. they are just representation. the ssot are the notes and the align markers (小节线), the rendering engine dont care about 拍号 unless auto curve/articulation generation」；此前「拍号调号不知道。但是多张纸的incentive就是写一段之后有一个新的开始，之前如果不小心没对齐不会无限往后propogate」。AI 的「共享轨 / 状态机」提案**作废**。
   - 真相 = 音符（带拼写的绝对音高 + 时值）+ 小节线（对齐标记）。调号 / 拍号是每个声部各自的记号 token，只影响这个声部怎么画；不共享、不影响兄弟声部、渲染不看。
   - **速度不在这条里**（AI 补，等 user 确认）：速度决定秒数，是物理量，各声部必须同一条时间线 → 速度仍整首一份；段落记号（曲段分界）同样整首一份。
   - 多声部对齐 = 纸内按对齐标记（人插「|」）；**纸 = 硬的重新对齐点**（§6¾：各声部从自己的第 1 小节起算，没对齐不往后传）。纸有了之后，纸内不再需要段落记号当对齐标记（`<rehearsal>` 只在纸头当曲段名）。各声部拍号不同 → 小节长短不同 → 短的补静音（第 3 题）。
   - **小节线 = 0.2.x 现状，不动**（2026-10-07 user 对编辑器 session 原话，编辑器 session 转述：「小节线按照我们0.2.x做好的，fable可能不知道我们之前调的手感」）：按拍号自动画、只画不存；人插的「|」存进 score.json manualBars、从那里重新数（弱起 = 写完弱起的音按一下「|」）；前面插 / 删音，后面的自动小节线像文本一样重排到下一个人插的「|」为止；跨小节线的音画成连着的两段；「⋯」里可关。Fable 的「写的时候物化」方案**划掉**。各声部之间怎么按对齐标记（人插「|」+ 段落记号）对齐 = 多轨的新东西，编辑器 session 做多轨时照这个方向摸，摸出来不对再报。
   - **速度住哪（2026-10-07 user 定，编辑器 session 转述：「1 可以，不过还是状态机，以后可以调速度。这样可以吗」）**：速度写在 MusicXML 第一个声部的 `<direction>`（印刷谱惯例：最上面一行、对全体生效），读时从任一声部的 direction 取，编辑器里速度 token 只在最上面的声部可编辑；**但语义仍是状态机**：每个速度 token 从它的位置生效到下一个，曲中可以变速，所有声部读同一条速度时间线。渐变（rit. / accel.）以后算速度曲线（§7.7 ② 时间线自动化）。段落记号同样处理。
   - 迁移：多轨 = Song.parts[]，每个声部自己的 token 串原样（含它自己的调号 / 拍号 token）；不再需要「抽共享轨」那一步。
9. **鼓最优先**（2026-10-07 user「gm当然要鼓，甚至鼓是最优先的」「所以你知道为什么鼓比钢琴重要了吧」）：鼓是另一种记谱——无音高、每个鼓件一条线（MusicXML `<unpitched>` + `<score-instrument>` + `<midi-unpitched>`，GM 第 10 通道）。数据上：声部多一个「有音高 / 打击乐」的种类；打击乐声部的音符不记音高、记鼓件 id（kick / snare / hat…）+ 谱上画在哪条线。输入设备（pad 是按音高排的）要另想——正是「先做多轨把结构逼出来」要逼的东西。

## 8. 谁的字节 + by value（2026-10-07 user 定；edited by Claude Fable 5.1）

user 原话：「笔刷架，这里是送命题。很简单。哲学问题：weebpaint里面几乎每个像素都是用户自己的。这里的mp3几乎全部的数据都不是用户自己的。而是音源和版权音源。所以weebpaint可以不带任何素材的无地。我们这里是我最洁癖的」「啊对人录的mp3，audacity那些活，以后我们也得接住」「brush rack: my idea is we can copy a preset from brush rack to the file. that is a by val copy, not a by refernce. so later edits of the brush rack in another file dont nuke us. make it as pure function as possible. even record the hash of the sound fonts. you should have all the data you need for the pure function. if the sound font is too fat, at least a hash」。

- **休息室是歌的一部分，不是笔架**（user 2026-10-07「休息室是歌的一部分啊，不是笔架（preset set）而且我其实不太像做笔架. weebpaint里面我也没怎么改过笔」）：没有跨歌的预设集。新建一个角色 / 候选 = 从 app 内置的预设表（`src/score/roles.ts` + 候选定义）**by value** 整份拷进 `lounge/<角色>.json`，之后 app 升级改了预设也不影响这首歌（「later edits … dont nuke us」）。
- **渲染 = 纯函数(文件)**：候选快照里写全纯函数要的一切——所有旋钮的显式数值、力度表、SI 定义、引擎名 + 引擎参数；不依赖 app 里的默认表（§7 第 7 条）。
- **音源按哈希钉**：每个候选记它用的音源（soundfont / 模型包）的 `sha256` + 包名。装了且哈希对 = 出声；没装或哈希不对 = 这个角色没人上场、不出声、报错、人来换（已定）。字节要不要进文件：体积和许可证允许就 by value 拷进 `attachments/`；太胖至少哈希。（AI 补注：拷进文件 = 再分发，许可证归 user 逐案核；月读 UTAU 条款 ③ 允许内置。）
- **`.mxl` 里的用户字节**：谱、歌词、曲线、贴纸 / 封面、以后用户自己录的音频（留位 `attachments/audio/<id>.<wav|flac|opus>` + 录音房一条录音轨：片段 = 音频 id + 起点 + 入点 / 出点 + 增益，非破坏性；Audacity 那类活 = 以后的编辑器功能，本版只留位）。导出的 mp3 = 用户的谱 × 音源，署名义务跟音源走（作者栏是写的地方，app 不强迫、不提醒）。
- 无地的含义：MoonSinger 的无地 = 谱的文件家 + 设备上装好、哈希对得上的音源包；文件自身带着复现所需的全部数据（纯函数 + 哈希），这是反弃坑的落点。WeebPaint 能零素材是因为像素都是用户的。

## 9. 音源字节住哪 + 歌里怎么认（设备侧；2026-10-07 推荐稿，Claude Fable 5.1；编辑器 session 提问、user「顺便头疼一下月读和模型仓idb共享的问题」）

user 2026-10-07（看完推荐稿）：「对，因为一般的daw对于音源是开的，而不是只有第一方的有指纹的」= **用户自己的音源是一等公民**，不是只给官方包开门；「留」（本地包进 `pwa-models`）是正路，「试」只是不落盘的过渡。

**事实（核过）**
- 家族只有一个共享缓存：Cache Storage `pwa-models`（键 `/__pwa-models__/<包名>/<分片>`），`@internal/model-packs` 管下载 / 逐片 sha256 / 导入 / 删除；同域名 `fangzhangmnm.github.io` 下的兄弟 app 自动共享。没有任何 app 调 `navigator.storage.persist()`：整个缓存是 best-effort，被浏览器清掉 = 重下（哈希校验），不是丢数据；Safari 7 天 ITP 已知。
- 库现在只认**app 内嵌了 manifest 的包**（packId = manifest 的 sha256 = 信任根）；`importFiles` 按内容哈希认分片，认不了任意文件。JRB 的两个先例：拖进来的本地模型 = 只在内存、这次打开有效；小雅 = 「只准本机导入」的包（内嵌 manifest、无下载源、用户选文件、按哈希入 `pwa-models`）。
- **月读的音色本体现在是两份字节**：JRB 钉 `voice-tsukuyomi-chan-zhen-6lang-fp16-20261002`（37.8 MB），MoonSinger 钉 `voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007`（37.8 MB，多一个 dur_override 输入，唱歌用）——同一域名下重复 37.8 MB（编辑器 session 核的数；「65 MB」是整套 = 音色 37.8 + lang-ja 23.3 + runtime 3.5）。runtime / lang-ja / zh / en 两家同名，已共享。

**推荐**
1. **用户拖进来的音源（sf2、本地月读 onnx+json）两档**：
   - **试：只在内存**（JRB 本地模型同款）——拖进来就换上试听，这次打开有效，不存。零存储决策。
   - **留：做成「本地包」进 `pwa-models`**（库加一个 `importLocal(files, { kind })`）：浏览器里算每个文件的 sha256，**按固定规则合成 manifest**（文件按名排序、24 MiB 分片、逐片哈希、不带时间戳 → 同一份字节在任何设备算出同一个 manifest = 同一个 packId），包名 `<种类>-local-<packId 前 12 位>`（种类 = `sf2` / `voice`），manifest 本身也存进缓存（`/__pwa-models__/<包名>/manifest.json`），重开能认。它就是 JRB 小雅那种「只准本机导入」包，只是 manifest 现算不内嵌。**不另开 app 私有 IDB / Cache**：家规「音源不按用途另开」；0.4.x 接 store 之后也不冲突（`pwa-models` 归模型包库管，不在 store 辖区）。
2. **歌里怎么认**：统一走包身份——`CandidateV2.source.soundfont = { pack, sha256 }`，`sha256` = packId；官方包 = 内嵌 manifest 的哈希，本地包 = 合成 manifest 的哈希。另加 `files: [{ name, sha256, bytes }]`（本地包必填、官方包可省）给界面显示和换设备时的提示（「要 MuseScore_General.sf2，哈希 …」）。换到没这个包的设备 = 没人上场、不出声、报错、人来换（已定）。`contract.ts` 待改这一行。
3. **署名 / 许可证**：官方包从 manifest 的许可证快照抄；本地包 `credit = { attribution: [], license: { name: "unknown" } }`，角色卡里可填。**音源字节默认不拷进 .mxl**（32 MB 进每首歌没道理，再分发归 user 逐案）；§8「体积和许可证允许就拷进 attachments/」收窄为一个显式动作「带音源导出」，不是存档路径。
4. **月读共享的头疼**：
   - **去重**（省 37.8 MB）：唱歌用的 dur 变体若 dur_override 不喂时输出和 20261002 逐字节相同，JRB 可改钉 dur 包 → 一份字节。要朗读库 session 核（逐样本比对），不是本仓的活。
   - **孤儿包**：app 只认自己钉的包；换钉之后旧包留在用户缓存里、任何 app 都看不见 → 配额慢慢漏（月读以后还会出 speaker 变体，每个都是新包）。提案（库层，等 user）：`model-packs` 加 `listAll()` 枚举整个 `pwa-models`（家规允许枚举 `pwa-` 共享前缀，禁的是别的 app 的私有前缀）→ 每个 app 的设置里多一栏「其他包（别的 app 或旧版本的）」可删；再加一个钉表 `/__pwa-models__/_pins/<appId>.json`（每个 app 写自己钉的包名）→ 哪个包没人钉一眼可见。
   - **配额可见**：设置里加 `navigator.storage.estimate()` 一行（patch）。要不要 `persist()` = user 定（家规 WeebPaint 的 persist 只在挂库时申请）。
5. **分工**：1 的「试」+ 2 + 3 = 编辑器 session 现在就能做（不碰库）；1 的「留」+ 4 的 listAll / 钉表 = `@internal/model-packs` 的活，要 user 点头后另开 session；4 的去重 = 朗读库 session。

## 10. 音源不是 ML 模型：歌要自带声音，硬盘上什么都不承重（2026-10-07 推荐稿，Claude Fable 5.1；user「音源不是ml model，这是一个严重的屎山风险。各种盗版正版自制魔改音源是最容易屎山一块硬盘的，我受不了daw就是因为这个外链依赖。这个帮我好好想一下怎么办」）

**DAW 为什么烂在音源上**（每条对一个解法）：① 身份 = 文件名 / 路径，搬家改名就断；② 文件可原地改，同一个名字内容变了、老歌静悄悄变味；③ 工程只引用不拷贝，不自带；④ 没有出处，正版盗版自制魔改混一堆、不知道能不能删；⑤ 只增不减、没人告诉你哪个没在用；⑥ 一首歌只用了 2 GB 库里的 3 个 preset，却得留整个库；⑦ 插件状态是绑死版本的二进制。

**§9 的「本地包进共享缓存」只解决了 ①②④，没解决 ③⑤⑥——歌仍然依赖设备上的一堆东西，硬盘仍是承重墙。** 改成：

### 10.1 两类音源，规矩不同

| | 样本类（soundfont / 采样 / 用户拖进来的 sf2） | 引擎类（月读模型、onnxruntime、词典） |
|---|---|---|
| 数量 | 多、杂、会魔改、来路不明 | 少、第一方、不可变（模型仓「包只增不改不删」+ 用户可镜像） |
| 歌里怎么带 | **by value，子集化嵌入**：只嵌这首歌用到的 preset 及其样本（像 PDF 嵌字体子集、Renoise .xrns 嵌样本） | 不嵌（65 MB），**按包 manifest 哈希钉**（§9） |
| 设备上的库 | **货架**，不承重：选乐器时抄一份子集进歌，之后库删光歌照唱 | 缓存 `pwa-models`，缺了重下，哈希校验 |
| 缺了怎么办 | 不会缺——声音在歌里 | 没人上场、不出声、报错、人来换 |

### 10.2 样本类的落点
- 歌里：`.moonsinger/sounds/<子集 sha256>.sf2`（标准 SF2，别的工具能开；manifest 列出）。候选的 `source = { kind: "sf2", embedded: "<路径>", presets: [{ bank, program }], origin: { name, fileSha256, pack?, bytes }, subsetBytes }` + `credit`（许可证快照 / unknown）。
- **子集化 = 纯函数**（SF2 是 RIFF：preset → instrument → sample 三层表，只留引用到的，重写表；node 可测、冻结样本）。GeneralUser GS 整包 32 MB，一个鼓组 / 一架钢琴的子集估几 MB（未核，要量）。
- **选乐器的那一刻就抄进歌**（不是存档时）：之后编辑、试听、导出全部从歌里的子集出声——听到的 = 文件里的。换音源 = 换嵌入块，旧块从歌里丢掉（设备上不管）。
- **体积阀（user 2026-10-07 深夜拍）**：「不胖的嵌入歌里面可以…也应该控制在10M左右的体积（不严格要求）」；超过时 = **提示后仍可嵌**（嵌入前报体积，超 10 MB 提醒「存档会变大、变慢」，可继续也可改钉哈希；不硬拦，家规上限类规则只能警告可取消）。user 另嘱：「小心那个store太大之后每次保存慢还没做后台的问题」——接 store 后存档没有后台写之前，大歌每次保存都是前台等，体积阀的意义主要在这。不静默。
- 同一首歌几个角色用同一个 sf2 的不同 preset：一个子集文件合并嵌一份（按原文件哈希分组）。
- 体积杠杆（以后）：样本压缩（sf3 式 ogg / opus），引擎要配合（TinySoundFont 不认压缩样本，未核）。

### 10.3 这样硬盘就不会屎山
- **歌是自包含的**：拷到任何设备、任何年份、用户镜像的 app 都原样出声；OneDrive 里每首歌多几 MB，比 .ora 小。
- **设备上的库可以随手删**：没有任何歌依赖它。app 的「音源」页只是货架 + 出处 + 许可证 + 大小，每一项都标「删了不影响任何歌」。用户拖进来的 sf2 **默认不留**在设备上（抄完子集就丢），只记一条「最近用过：名字 + 哈希」方便再拖；要留的才留（本地包，§9）。
- **出处永远可见**：嵌入块带原文件哈希、来源包、许可证快照；盗版 / 自制 / 魔改 app 不拦（归 user），但「来路不明」四个字写在角色卡上，分享前看得见。
- **魔改 = 新哈希 = 新东西**，老歌嵌的是老子集，不会静悄悄变味。
- 对 §8「体积和许可证允许就拷进 attachments/」的落实：样本类就是这条；引擎类不拷。对 §9：「留 = 本地包」降级为可选便利，不再是正路。

### 10.4 代价（明说）
- 要写 SF2 子集化器（读写 RIFF 表）+ 冻结样本测试；是一块独立的纯函数模块。
- 歌文件变大（每首几 MB），gallery 缩略 / 同步成本随之上升；体积阀兜着。
- 许可证不许再分发的音源（JRB 小雅那类数据集许可证）嵌进可分享的 .mxl = 再分发：**user 2026-10-07 深夜拍 = 提示可取消，归 user**——嵌入时显示许可证快照并提醒「分享这首歌 = 再分发」，user 决定；角色卡上来路可见；app 不替 user 拦。
- 月读那类模型仍是「外链」——但是第一方、不可变、可镜像的外链，和 DAW 的区别在这三个词；用户自己拖进来的模型（本地月读）没有这三个保证，只能钉哈希 + 明写「依赖本机文件」。

**四问 user 2026-10-07 深夜全拍（编辑器 session 正式问的）**：① 两类划分 = 同意（附加：「引擎类留latex，样本类取决于是否是标准格式，不是的话也要留latex」→ §10.6）；② 超 10 MB = 提示后仍可嵌；③ 不许再分发的 = 提示可取消、归 user；④ 拖进来的默认不留设备 = 「好主意，也许这样就解构了插件库的问题。然后以后可以用户自己在onedrive屯插件可以onedrive导入。但是没有链接，永远by val。不过可以松一点，可以链接，但是只在找音，打开的文件夹这种asset explorer视图层」→ **歌对音源永远 by value、不链接任何库**；「链接」只准出现在找音源的视图层（asset explorer：浏览设备 / OneDrive 文件夹里有什么、从哪拖），不进歌。以后 user 自己在 OneDrive 屯的插件 = 从 OneDrive 导入进歌（仍 by value）。

**落地（v0.4.0，2026-10-07 深夜，Claude Fable 5.1 编辑器 session）**：10.1 / 10.2 的样本类已做——`src/gm/sf2-subset.ts`（子集化纯函数；INFO 原样留；守卫 = 子集 ≡ 整包 ≤ 1e-5）、`vendor/tsf/`（TinySoundFont WASM，tsf_copy = 一次渲染一份发声状态 → 纯函数）、`src/gm/soundfont.ts`、候选 `source / credit / spec` + manifest `sounds`（v1 只加可选字段，shape.json 已更新）、`project.ts` 只写还引用着的音源、声音缺了 = quality none + 报出来、`main.ts` 歌手牌选乐器 / 播放 / 导出 / 试听。**v0.4.1**：官方货架 = 模型仓包 `sf2-generaluser-gs-2.0.3-20260222`（一个包，user「好，不拆」；本地已打包提交，推公开仓前问 user），歌手牌「从官方音色库选乐器…」点了才下、之后留缓存；候选 `source.origin.pack` 记包名、`credit` 从包清单抄。还没做：鼓谱与鼓 pad、多声部、10.3「最近用过」、10.6 vault README。

**官方 GS 包不拆、一个包（user 2026-10-07 深夜「好，不拆」）**：此前「鼓组一包、旋律一包」（cb7a1b9）作废。实测 GeneralUser GS 2.0.3：整包 30.8 MB；鼓组单独切出 5.9 MB，旋律包仍 30.8 MB（鼓组的采样几乎全和旋律乐器共用），两包合计多 19%；「浏览时省内存」靠只解析预设表不载采样、试听时子集化那一件解决，和包大小无关。包名 `sf2-generaluser-gs-2.0.3-<定稿日期>`，24 MiB 两片。

### 10.5 引擎随 app 发 + 「把音源存一份到本机」（user 2026-10-07 深夜拍：「引擎随 app 发；「把音源存一份到本机」。 同意」）
- **引擎二进制是代码不是声音，随 app 一起发**（vendored，像 `vendor/world/`）：SoundFont 播放器（TinySoundFont，MIT）、onnxruntime-web（现在是包 `runtime-onnxruntime-web-1.30.0-20261001`，要搬进 app，3.5 MB）。只拿着 app = 谱永远能开、编辑、存、导出 MusicXML，能用元音采样器粗听。**这条修订家族 CLAUDE.md「共享模型库」第 6 条「引擎二进制也可以进包」（2026-10-01）在 MoonSinger 的适用**；JRB 等兄弟不受此条影响，要不要跟归 user 另说。
- **「把音源存一份到本机」**：引擎类（月读 37.8 MB + 日语词典 23.3 MB）能从 app 导出成文件（夹）留在用户自己手里——补 WeebPaint 单 html / 反弃坑那条线：主机死了、浏览器缓存被清了，用户自己那份照样导回来（按哈希认，同 §9 importFiles）。样本类不需要（已在歌里）。
- 便携版（以后要的话）：单 html + 一个装音源的文件夹，一起拷走就能用。

### 10.6 自描述：歌要能在「末日 vault」里被重新渲染（user 2026-10-07 深夜；推荐稿，Claude Fable 5.1 编辑器 session）
user 原话：「还记得GameDesignTransmissionLanguage这个sunset的老idea吗？比如合成器之类的，如果我们写的，必须存latex公式，或者github链接，在歌里面。所以一个拿到歌的fable可以复现出所有东西把歌给重新渲染出来（不一定要byte identical）反正就是存私有数据的时候顺便存一份si单位的metadata解释每个term是什么意思」「引擎类留latex，样本类取决于是否是标准格式，不是的话也要留latex」「latex是比喻，你可以用任何你觉得舒服的数理 末日vault存档 语音」。
GDTF（`~/jupyter/20260716 GDTF/`，GameDescriptionTransmissionFormat，2026-08 茶话结晶）搬过来的核心：**AI 是编译器，文件是「信纸上的源语言」，PC 被 nuke 后拿着信纸能恢复六成**；表区 + 散文区并存；SI 单位的表既是 spec 也是判分表。
推荐：
1. **每个 .mxl 里带一份 `.moonsinger/README.md`（vault 文档）**。读者 = 几十年后只有这个文件、一个文本编辑器、一般音频常识、也许一个 AI 的人；没有 app、没有网。内容：① zip 里每个文件是什么、每个字段什么意思、单位；② **我们自己写的每个引擎的数理**，散文 + 公式（任何清楚的数理记法，不限 LaTeX）：月读管线（piper 文本 → 音素 → 时长接管 → WORLD 分析出 F0 / 频谱包络 / 非周期 → 按谱改 F0 与时长 → WORLD 合成）、元音采样器（按元音挑样本、重采样变速到目标音高）、以后的合成器（振荡器 / 包络 / 滤波的公式）；③ 出处：源码仓 + commit 哈希 + 路径 + 许可证；④ **标准格式只写名字和版本**（SoundFont 2.04、MusicXML 4.0、WAV / Opus），不复述标准（user：样本类是标准格式就不用留）。
2. **由代码生成、测试守着不过期**（同 `docs/keys.md` / `packs.gen.ts` 的做法）：`scripts/gen-vault-readme.mjs` 从引擎源码头注释 + `contract.ts` 抽出来；手写会烂。每次存档写入（纯文本，很小）。
3. 候选快照每个 `engine` 带 `spec`：标准格式 `{ kind: "standard", name, version }`；我们写的 `{ kind: "ours", doc: "<README 章节锚>", source: { repo, commit, path } }`；用户拖进来的非标准东西 `{ kind: "unknown" }` + 角色卡上明写「来路不明、无法复现」。
4. 「每个 term 什么意思」的另一半已经定了：数值全 SI / 写明单位（§7.7）、旋钮的物理定义表 by value（§7.3）、by value 的默认数（§8）。10.6 补的是散文 + 公式 + 出处。
5. 保真目标：不求逐字节；判分 = 拿着文件和 README、不开 app，能把谱和每个角色的声音大致重建。先不做自动判分。
