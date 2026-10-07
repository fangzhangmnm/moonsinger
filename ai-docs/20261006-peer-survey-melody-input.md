# 同行调研：平板上怎么输入旋律（只列事实）

> created 20261006 · by Claude Opus 5.5（本 session 派出的后台调研助手写，主 session 原样存档）· as-of 2026-10-06
> 起因：编辑器第一版 grill（`20261006-editor-v0-grill.md`）里 user「晕 晕 晕」「也许多看一下同行？」。
> 「推断」= 调研助手自己推的；「未核到」= 没找到出处。评测有年份的，写的是当时的状态。链接是 10-06 WebSearch / WebFetch 所见，部分是二手转述。

## 1. 总表

| 产品 | 平台 | 怎么选音高 | 时刻 | 时值 | 休止 | 音阶滤网 | 布局 | 歌词 |
|---|---|---|---|---|---|---|---|---|
| StaffPad | iPad、Windows | Pencil 手写 | 顺序写，整小节一起识别 | 手写符号 | 手写 | 未核到 | 只有横向卷动（2019） | — |
| Dorico iPad | iPad | 屏上钢琴、A–G 字母键、MIDI | 光标顺序 | 默认先选时值 | 空隙自动补休止；逗号键进休止模式 | 未核到 | 未核到 | 未核到 |
| Sibelius iPad | iPad | 按住小键盘上的音符再上下拖；或 Pencil 按下后倾斜 | 顺序 | 左右拖或左右倾斜 | 按住休止键左右拖改时值 | 未核到 | 首版没有横向卷动视图（Panorama） | — |
| Notion iOS | iPad、iPhone | 点谱面、指板、MIDI、手写（手指或笔都行） | 顺序 | 未核到 | 未核到 | 未核到 | 未核到 | — |
| Symphony Pro | iOS、Mac | 先选时值再点谱面；屏上琴；手写（内购） | 顺序 | 先选时值 | 未核到 | — | 未核到 | — |
| Flat | 网页、iOS | 底部小键盘；A–G 键 | 顺序 | 1–7 键 | 小节始终填满，插入音符就替掉等长的休止 | — | 未核到 | 有快捷键 |
| MuseScore 移动端 | iOS、Android | **不能编辑** | — | — | — | — | — | — |
| Hookpad | 网页（2020 起改善了触屏） | 数字 1–7 = 音阶级 | 顺序 | 先选时值，或用快捷键 | 0 键把音符变休止；缩短音符留下的空自动变休止 | 默认只显示调内音，可以展开 | 未核到 | 粘贴整段，自动分音节贴到音符上 |
| GarageBand iOS | iPad、iPhone | 键盘的 Scale 模式改成「音条」；卷帘里点 | 卷帘里自由摆放 | 拖音符末端的把手 | 空着就是休止 | 有（Scale 模式） | 横带 | — |
| Song Maker | 网页，手指可拖 | 点格子 | 自由摆放 | 一格 = 一拍的细分 | 空格子 | 大调 / 五声 / 半音；1–3 个八度；可设起始音 | 横带，最多 16 小节 | 没有；可以对着麦克风唱进去 |
| Nokia Composer | 功能机 | 1–7 = C–B（固定调） | 顺序 | 8 缩短 / 9 加长当前音 | 0 键 | 只有 # 升半音 | 未核到 | — |
| Synthesizer V | Windows、Mac、Linux | 卷帘里点或拖 | 自由摆放 | 拖 | 空着 | — | 横带 | 双击打字，Tab 跳下一个；选中多个音符批量输入 |
| Mobile VOCALOID Editor | iPhone、iPad | 点空白处建音；步进模式（STEP IN）按屏上琴键 | 摆放，也有步进 | 拖右端圆柄 | — | — | 横带 | 选中音符点 LYRIC 钮，可多选批量 |
| OpenUtau | Windows、Mac、Linux | 笔工具点击 | 自由摆放 | 拖尾端 | 空着 | — | 横带 | 双击 + Tab；有批量编辑歌词对话框 |
| NEUTRINO | Windows、Mac、Linux、Colab | 自己没有编辑器，吃 MusicXML | 由记谱软件决定 | — | — | — | — | 一个音符一个假名 |
| VoiSona | Windows、Mac、iOS、iPadOS | 在卷帘上拖出音符 | 自由摆放 | 拖边缘 | 空着 | — | 横带 | 双击（触屏是双触） + Tab；批量对话框 |
| ACE Studio | Windows、Mac | 卷帘 | 自由摆放 | 未核到 | — | — | 横带 | 整段粘到第一个音符，自动断开分配 |
| Blob Opera | 网页 | 上下拖 | 实时演唱 | — | — | 自动吸附到音阶 | — | 前后拖 = 换元音 |
| Mario Paint | SNES 游戏机 | 在五线谱上点 | 摆放到拍位 | 只有四分音符 | 没有休止符，空拍就是 | 只有 C 大调，无升降 | B3–G5 | — |
| Lovely Composer | Windows、Linux（Steam） | 左键点卷帘 | 自由摆放 | 推断：一格一个音 | 空着 | 9 种音阶锁 | 分页，每页最多 32 个音 | — |

## 2. 各产品要点

**StaffPad**
- 2019 年 iPad 版评测原话："stylus input is the only way to enter notes"（只能用笔写音符）。
- 识别是 "whole measures at a time"（一整小节一起识别）；当时只有横向卷动。
- 评测抱怨："very difficult to hand-write very high or low notes…without the input jumping to the instrument below"（太高太低的音很难写，会跳到下一个乐器的谱上）。[scoringnotes](https://www.scoringnotes.com/reviews/staffpad-for-ipad/)
- 有论坛反馈说识别率很差，但原帖返回 403，没能直接读到。

**Dorico iPad**
- 用屏上钢琴面板、左侧的时值按钮，或外接键盘；评测说 "no Apple Pencil features"（没有任何 Pencil 功能）。[scoringnotes](https://www.scoringnotes.com/reviews/dorico-arrives-on-ipad/)
- 音符之间的空隙自动显示休止；要手动打休止，就按逗号键进入休止模式，再开「强制时值」。[Steinberg](https://steinberg.help/dorico_ipad/v1/en/dorico/topics/write_mode/write_mode_note_input/write_mode_rests_inputting_t.html)

**Sibelius iPad**
- 手指：按住小键盘上的音符，出现一个「影子音符」，上下拖按音级变音高，左右拖做半音变化；休止也是按住后左右拖改时值。
- Pencil：倾斜改音高和时值。评测说："too hard to reliably get the results I wanted"（很难稳定得到想要的结果），总体 "fun, if a little tedious"（好玩，但有点繁琐）。[scoringnotes](https://www.scoringnotes.com/reviews/sibelius-arrives-on-ipad/)

**Notion**
- 2015 年加了手写识别（引擎是 MyScript），"Using a finger or stylus"（手指或笔都行）。[synthtopia](https://www.synthtopia.com/content/2015/11/17/presonus-notion-for-ios-adds-ipad-pro-support-handwriting-recognition/)

**Symphony Pro**
- 先选时值再点谱面；手写要内购；有步进输入。
- App Store 评论："the note input method is an incredible nuisance"（输音符的方式非常烦人）。[App Store](https://apps.apple.com/app/id412380315)

**Flat**
- 触屏用底部的小键盘；小节永远是满的，插入一个音符就吃掉等长的休止。[help](https://help.flat.io/en/music-notation-software/inputting-your-first-notes/)

**MuseScore 移动端**
- "does not create or edit scores"（不能新建也不能编辑乐谱）。[Wikipedia](https://en.wikipedia.org/wiki/MuseScore)

**Hookpad**
- "type the numbers 1-7"（打数字 1–7 输入音阶级）；"By default, the note staff shows only the in-scale melody notes"（默认只显示调内音）；调外音用 . 和 , 升降半音。[指南](https://hooktheory.com/support/hookpad)
- 0 键把音符变成同长的休止。[论坛](https://forum.hooktheory.com/t/rests-should-behave-as-notes/6600)
- 开发者原话："We designed and built Hookpad for keyboard and mouse"（本来是为键盘和鼠标做的）。[论坛](https://forum.hooktheory.com/t/please-support-tablet-touchscreen-devices/3766)

**GarageBand iOS**
- Scale 模式下："the keyboard changes to show note bars rather than keys"（键盘变成音条，不再是琴键）。[Apple](https://support.apple.com/guide/garageband-ipad/chs39282dbe/ipados)
- 卷帘加音符：按住 Add Notes 钮再点；改长度拖把手。[Apple](https://support.apple.com/en-gw/guide/garageband-iphone/chsf2f99dfe/ios)

**Song Maker**
- 音阶三选一，音域 1–3 个八度，可设起始音；拍细分 1–4；麦克风唱歌可以自动输入音高。[gigazine](https://gigazine.net/gsc_news/en/20180302-chrome-music-lab-song-maker)
- 能不能把一个音拉长：未核到。

**Nokia Composer**
- 官方手册原话："press 4 for note f… Press 8 to shorten (-) and 9 to lengthen (+)… Press 0 to insert a rest, * to set the octave, and # to make the note sharp"（按 4 是 f；8 缩短、9 加长；0 插入休止，* 换八度，# 升半音）。[Nokia 2310 手册](https://manualslib.mx/manual/75261/Nokia-2310.html?page=40)

**简谱编辑器（中文圈）**
- [简谱大师](https://apps.apple.com/us/app/id6451075613)：描述写「独创的简谱输入键盘」。
- [来音制谱](https://apps.apple.com/cn/app/id6450210894)（iPhone / iPad / Mac）：描述写「键盘输入法，敲击所需音符即可生成乐谱」，还有拍照识谱、MIDI 转谱。
- [简而谱](https://apps.apple.com/cn/app/id1272559770)：描述写「手势切换音符音高和节奏…更适合在手机上快速打谱」。
- 这三个的具体按键规则都未核到。
- 开源命令行工具 [jianpu-ly](https://ssb22.user.srcf.net/mwrhome/jianpu-ly.html)（纯文本写简谱，转成 LilyPond 排版）：数字写音高，`'` / `,` 标八度；加长用 `1 -`，缩短用前缀 `q1` / `s1`（八分 / 十六分）；源码里 `'0'` 映射为休止；中文歌词用 `H:` 一行写完，自动按字分。

**Synthesizer V**
- 双击音符打字，Tab 跳到下一个；选中一组音符批量输入，空格分隔；默认歌词是 "la"。
- 评测抱怨吸附网格："grid lines don't match the snap values"（网格线和吸附值对不上）。[Mix](https://www.mixonline.com/technology/reviews/others/dreamtonics-synthesizer-v-studio-2-pro-review)
- 只有桌面版。[Wikipedia](https://en.wikipedia.org/wiki/Synthesizer_V)

**VOCALOID**
- Mobile VOCALOID Editor（2015）：点空白处建音，拖右端圆柄改长度；选音符点 LYRIC 钮，可多选批量；两指滑动卷时间轴，单指改音符。[ITmedia](https://www.itmedia.co.jp/news/article/1504/03/1150403121/2)
- 还有步进模式：按屏上琴键，一下加一个固定长度的音。[ITmedia p3](https://www.itmedia.co.jp/news/article/1504/03/1150403121/3)
- 2025 年出了订阅版。[App Store](https://apps.apple.com/app/mobile-vocaloid-editor/id947797108)
- 2010 年的 iVOCALOID：iPad 版是卷帘 + 假名歌词、触摸指定音高；**iPhone 版是用手指画音高曲线**。[AV Watch](https://av.watch.impress.co.jp/docs/news/400020.html)

**OpenUtau**
- "Double click to start inputting lyric, tab to finish and switch to next note"（双击开始输歌词，Tab 结束并跳到下一个音）。[wiki](https://github.com/stakira/OpenUtau/wiki/Getting-Started)
- 源码里有 "Edit Lyrics" 对话框，带分隔符设置和实时预览。

**NEUTRINO**
- 输入是 MusicXML；歌词只能是平假名 / 片假名；本体走命令行。[FAQ](https://studio-neutrino.com/faq/)

**VoiSona**
- iOS / iPadOS 版：在卷帘上拖出音符，双触音符输歌词。[iOS 手册](https://manual.voisona.com/en/song/ios/29ae9bc7efb180c3a28af9b74a3e3113)
- PC 版的批量歌词对话框有两种分配方式：按空格分组，或一字一音。[PC 手册](https://manual.voisona.com/en/song/pc/2b6e9bc7efb18077b49cce445844cd95)

**ACE Studio**
- 整段歌词粘到第一个音符，"ACE will hyphenate and distribute your lyric"（自动断音节并分配到后面的音符）；分错了用右键「歌词前移 / 后移」修。[文章](https://arrangerforhire.com/using-ace-studio-ai-to-create-vocal-tracks-or-choral-music-from-midi/)

**Blob Opera**
- "Pitches stick to a scale, so there are no wrong notes"（音高吸附到音阶，不会有错音）。[routenote](https://routenote.com/blog/google-arts-culture-blob-opera-create-a-pitch-perfect-opera-quartet-with-your-mouse/)

**Mario Paint**
- 只有四分音符，只有 C 大调；每拍最多 3 个音；小节数各处说法不一（24 或 32）。[MarioWiki](https://www.mariowiki.com/MPaint)、[BotB](https://battleofthebits.com/lyceum/View/Mariopants)

**Lovely Composer**
- 「五線譜風表示はあくまでも背景画像を変更するだけ」（五线谱风格显示只是换了背景图），线不是等间距的（与 grill 账本 §4 的截图实测一致）。
- 音阶锁有：白键 / 黑键 / 大调 / 小调 / 琉球 / 雅乐 / 全音 / 和弦内音 / 避开不协和音；按住 Ctrl 临时解锁。
- 每页最多 32 个音 × 256 页；音域 C1–B7。[手册](https://doc1oo.github.io/LovelyComposerDocs/jp/manual.html)
- 平台：[booth](https://booth.pm/en/items/3006558) 页写 Mac 不支持，itch 上有 Mac beta，两处说法冲突。

## 3. 对 MoonSinger 有用的事实

- 歌声合成编辑器**全部**是卷帘 + 自由摆放；**没找到任何一家**用顺序（光标接着往后写）的方式摆音符。顺序输入只出现在记谱软件、Hookpad、Nokia 和简谱工具里。
- 有平板版的歌声合成只找到两个：Mobile VOCALOID Editor 和 VoiSona（2024-12 上 iOS）。两家都是手指在卷帘上点或拖建音，双击（触）打歌词，两指滚动。
- 歌词对齐三种：每个音符单独打 + Tab（SynthV / OpenUtau / VoiSona / ACE）；选中一批按空格分配（SynthV / VoiSona / OpenUtau）；整段粘到第一个音符自动分配（ACE、Hookpad）。
- 休止三种：自由摆放类空着就是；顺序类专门一个键（Nokia、Hookpad、jianpu-ly 都是 0；Dorico 是逗号）；「小节永远填满」（Flat、Dorico 自动补，Hookpad 缩短后留下的空自动变休止）。
- 只显示调内音：Hookpad 默认只显示调内音可展开；GarageBand 把琴键换成音条；Song Maker 只画所选音阶的行；Blob Opera 吸附到音阶；Lovely Composer 不藏行，只标出输不了的音。
- 数字键 = 音阶级：Hookpad（首调）；Nokia 固定调（1 = C）。
- 屏幕上的音域：Song Maker 1–3 个八度；Mario Paint 不到两个八度；Lovely Composer 分页代替无限长横带。
- 手写：StaffPad 只认笔、识别有抱怨；Notion 手写允许手指；Dorico iPad 完全不支持 Pencil。
- 触屏「拖一下定音高和时值」：Sibelius 上下拖改音高、左右拖改时值；评测认为 Pencil 倾斜那套不稳定，手指拖的那套 "a little tedious"。
- 2010 年 iVOCALOID iPhone 版用「手指画音高曲线」输入。
- MuseScore 移动端不能编辑；Hookpad 本来为键盘鼠标而做，2020 年才补上触屏。
