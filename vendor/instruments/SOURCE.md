# MoonSinger 挑乐器数据（2026-10-07）

**现行版本 = v12**（2026-10-10）。v1–v11 的文件原样留着（发出去的版本只增不改；`scripts/build_export.py` 发现这一版已存在就停）。v2 和 v1 只差图标（超过 20 KB 的两个换成候选里更轻的）。下一版（sounds.xml 全量）= v13。

> 由 `scripts/build_export.py` 生成，别手改；改数据改 `data/` 再重跑。规格 = PWAProjects 的 webpaint editor v1 prototyping 会话转述的 user 拍板 + 本仓会话 user 原话（见脚本头注释）。

| 文件 | 是什么 |
|---|---|
| `instruments-v12.json` | 表 ① 乐器史：一条 = 一个概念（乐器 / 型号 / 编制 / 人声 / 音效），161 条 |
| `gm-map-v12.json` | 表 ② GM 映射：一行 = 一个 GM 号 → 一个概念；`relation` = `self`（本尊）/ `substitute`（平替，51 条） |
| `instrument-icons-20261010-v12.svg` | 只装挑中图标的 sprite（69 个，都 ≤ 20 KB），每个 `<symbol>` 自带 viewBox，没有 foreignObject / 外部引用 / `<use>` / class / `<style>`；图形照原样 |
| `icon-credits-v12.json` | 每个图标一条 `{id, set, author, license, url, bytes}` |
| `LICENSES-chosen-v12.md` | 挑中套件的许可证原文（从 `icons/upstream/` 原样拼接） |

## v11 → v12 改了什么（只加字段）

MoonSinger 工单「乐器简写 + 记谱八度 / 铃的八度」（user「小件做，仓鼠给简写」「几个铃的到底哪个八度算数还是没有弄清楚」「铃铛会很高。8va可以做了吗」）。依据和统计见源仓 `ai-docs/20261010-简写记谱铃八度.md`。
- **`abbr {en, basis}`**（表 ①，123 个概念）：MuseScore instruments.xml 的 shortName（出版惯例：Vln. / Vla. / Cb. / Picc. / Glock. / Tpt. / Vo. …）。zh / ja 这一版不给（没找到中文总谱通行简称的出处；MuseScore 的中日文翻译大多照搬拉丁写法、还有错），显示时退回 en。
- **`notation {clef, clefs?, concertClef, concertClefs?, sounds, octave, basis, wikipedia?}`**（表 ①，91 个有音高的概念）：
  - `clef`：按谱惯例写谱时的谱号。
  - `concertClef`：按实际音高显示时 MuseScore 用的谱号（钟琴 G15ma、木琴 G8va……）。
  - `sounds`：实际音高 − 按基础谱号（G / F / C，不看 8va / 8vb 记号）读的谱面音高，单位半音。吉他 −12（谱号 G8vb）、低音提琴 −12、短笛 / 钢片琴 / 木琴 +12、钟琴 +24、B♭ 单簧管 −2、F 调圆号 −7。
  - `octave`：`sounds` 里整八度的部分（向 0 取整）。
  - 16 件附 `wikipedia` 原文佐证（CC BY-SA）。
  - 打击乐、指板谱不给。约定写在 `defs.notationMethod`，谱号中文名在 `defs.clefs`。
- **`octaveCheck {keys, measured, measuredOctave, lowest, perceived, perceivedNote, basis, sources?}`**（表 ②，GM 9–16、99、113、115 这 11 个号，共 15 行）：TinySoundFont + GU 实测按 48–96 五个键。
  - `measured`：最强谱峰离键名几个半音（中位数）。
  - `perceived`：耳朵听到的音离键名几个半音（AI 按规则判）。0 = 按这个键听到的就是这个音，null = 判不准（只有 113 Tinkle Bell）。
  - 管钟 `measured` +24、`perceived` 0：最强的分音高两个八度，耳朵听的是打击音。附维基原文。
  - 测法写在 `defs.octaveCheckMethod`。

## grooves-v2.json（拍子轻重预设第二批，现行；v1 原样留着）

在 v1 基础上只加不改（v1 的 7 个风格、22 条引文在 v2 里一字没动）：加 `bossa-nova`（波萨）、`latin`（拉丁 / son clave，别名 Salsa、Mambo、Son……），共 9 个；引文 35 条。
- **`meters[*].bars`**（新，可选）：一组 weights 管几小节，没写 = 1；> 1 时 `weights` 长 = `grid × bars`，按小节顺序接着写，app 从风格记号那一小节起数（第 1 小节用第一段）。波萨 / 拉丁的 2/4（grid 8）、2/2 和 4/4（grid 16）都是 `bars: 2`。
- **`phase`**（新，克拉维风格才有）：`{default: "3-2", zh, sources}`。2-3 = 两小节对调（原文：写成两小节时换方向就是对调两小节），由 app 的「错开一小节」开关做，不另出一份。
- `conventions.bars` 写了约定；`deferred` 只剩慢歌。依据见源仓 `ai-docs/20261008-拍子轻重预设.md` §2½。

## grooves-v1.json（拍子轻重预设，单独的文件、单独的版本号）

MoonSinger 工单：「风格」= 谱上写在曲段开头的文字记号（古典、流行、Swing……），只管当前这张纸；按拍号给一小节里每个格子一个相对轻重，演奏者自己设跟多少。由 `scripts/build_grooves.py` 从源仓 `data/拍子轻重_AI.json` 生成；同版本已存在就停。说明和依据表见源仓 `ai-docs/20261008-拍子轻重预设.md`。
- 顶层：`version`、`conventions`（约定说明）、`sources`（引文：条目、修订号或抓取日期、URL、CC BY-SA 4.0、整句原文）、`styles[]`、`deferred[]`（还没做的风格和原因：波萨、拉丁、慢歌）。
- `styles[]`：`{id, name {zh, en, ja}, aliases, meters {"4/4": {grid, weights, basis {order, values, sources, zh}}…}, meterFallback {rule: classical|none, zh}, follow {<family id>|voice: 0–1}, followBasis, swing {unit, ratio, range, basis}|null, sources, notes}`。
- 7 个：`none`、`classical`、`pop`（别名摇滚 / Rock / R&B）、`waltz`、`march`、`swing`、`four-on-the-floor`（别名电子 / 迪斯科 / EDM / 4つ打ち）。
- `grid` = 一小节有几个十六分音符；`weights` −1…1，相对数（app 再乘演奏者的幅度），谱上写的重音盖掉拍子轻重。`basis.order`：sourced = 强弱先后照原文，derived = 从原文规律推到这个拍号；`values` 一律 ai-scaled（数值是 AI 按层级取的）。
- `follow` 的键 = gm-map `defs.families` 的 id，另加 `voice`（人声类概念：kind = voice，月读、合唱、人声），人声优先于 family。
- 和工单推荐稿的差别：文件名 styles → grooves（gm-map 的 `styles[]` 已经是〇〇风）；`meterFallback` 从字符串改成 `{rule, zh}`；每个拍号加 `basis`；加 `followBasis`、顶层 `conventions` / `sources` / `deferred`；`swing` 多一个 `range`。

## v10 → v11 改了什么（只加字段；风的数据和 v10 一样）

MoonSinger 要的演奏元数据：gm-map **每一行**（本尊 / 多重认领 / 平替，同一个 GM 号挂同一份）加六个字段，都带 `basis`；通用测法在 `defs.perfMethod`，枚举的中文名在 `defs.excitations / sustains / joints / breaths`。详细说明和统计见源仓 `ai-docs/20261008-演奏元数据.md`。
- **`excitation {id, basis}`**：bowed / plucked / struck / blown / voice / electronic / sfx（AI 判）。
- **`sustain {id, attackMs, noteOffCuts, basis}`**：sustained / decaying / oneshot。在 TinySoundFont + GU 2.0.3 里实测（力度 80，按住 5 秒 vs 0.25 秒松手）。`attackMs` = 到峰值 −3 dB；`noteOffCuts` = 松手会不会截断。
- **`technique {id, zh, basis}`**：这个音色本身的奏法（ordinario / arco / arco-slow / tremolo / pizzicato / palm-mute / harmonics / slap / muted / open / closed / cross-stick…）；音效 `id: null`。Strings 1 = arco（实测起音约 120 ms），Strings 2 = arco-slow（约 260 ms，只适合连奏铺底）。
- **`joint {id, gapMs, basis}`**：legato 0 / detache 20 / tongued 40 / lift 0；不适用（实测 oneshot、音效）`id: null`。毫秒数对齐 MoonSinger 现行连断预设；和 `gapClassOf` 不同的只有风笛（legato 0）、口琴（tongued 40）。
- **`breath {id, basis}`**：breathe 真换气 / lift 抬一下 / none 无意义（AI 判）。
- **`velLayers {soundfont, engine, key, count, ranges, mpMfSwitchesLayer, staticFilter, filterEnvelope, centroidShiftPct {mpToMf, ppToFf}, basis}`**：参考键上的力度层（力度 0→127 扫一遍，响的 zone 组合变几次）；`mpMfSwitchesLayer` = 力度 64 和 80 用的 zone 不同（54 个号会换）；`centroidShiftPct` = pp 33 / mp 64 / mf 80 / ff 112 渲染的频谱重心变化。TSF 不执行 sf2 调制器（GU 写的力度 → 滤波只在 FluidSynth 之类里生效），所以 `staticFilter` 是固定滤波、不随力度变。MoonSinger 现在 velocity 固定 0.8，这组数据是给「要不要把力度记号接到 velocity」用的。

## v9 → v10 改了什么（只改风的认领数据，结构不变）

起因：user「鼓啊吉他啊不同音色和演奏方法也都分开了评分可以吗，会不会和G编号冲突？」。不冲突：认领表的键 = 类（音色 / 鼓件）+ 号，导出里是 (bank, program, note)；GM 给了单独号的音色 / 演奏法（29 闷音、32 泛音、45 震音、46 拨弦、37 / 38 击勾贝斯、42 / 46 闭开踩镲、37 鼓边、80 / 81 闷开三角铁……）本来就各是一个单位。GM 没单独号的演奏法（扫弦 / 指弹、鼓刷、808 鼓组）没有单位，要评得走 GS 的别的 bank / 鼓组。
- 吉他 / 贝斯逐个重判（AI 判）：26 钢弦木吉他进 🎸 摇滚流行、🧸 童话治愈 ★；28 清音电吉他进 ⚡ 电音动漫、🤠 西部 ★；33 原声贝斯进 🤠 西部 ★；34 指弹电贝斯进 🧸 童话治愈、⚡ 电音动漫 ★；35 拨片贝斯进 🤘 交响金属 ★★；36 无品贝斯进 🎷 爵士 ★。
- 鼓件逐个重判：🎷 爵士风补鼓（51 Ride ★★★、44 Pedal Hi-Hat ★★、38 Acoustic Snare ★★，35 / 37 / 53 / 59 ★）；💃 拉丁风 37 Side Stick ★★（波萨诺瓦）；💾 合成器风 36 / 39 / 42 ★★、56 Cowbell ★（鼓机）；⚡ 电音动漫 40 / 46 ★★、49 ★；🎮 8-bit 40 ★；🤘 交响金属 52 ★；🎻 贝多风（交响乐）35 / 49 ★；🎸 摇滚流行的筒鼓拉开档次：48 / 47 / 43 留 ★★，50 / 45 / 41 降 ★。

## v8 → v9 改了什么（只改风的认领数据，结构不变）

起因：user「评级和是否入选能不能精确到合成器里面的子音色」「每个不同的音色都单列单评级」「音色为单位而不是家族一把捞」。**风认领的单位是 GM 音色**：gm-map 本尊行的 `styles[]` 就是这个音色自己的入选和承重；instruments 里概念的 `styles` 是聚合出来的（同一概念几个号取最大），只说明「这个乐器属于哪些风」，**列风的成员要用 gm-map 行**，不要按概念展开全部提供者。
- 合成器类音色逐个重判（AI 判，理由写在源仓 `data/〇〇风_AI.tsv`）：
  - 💾 合成器风：6 EP2、63 SynthBrass 1 → ★★★；90 Pad 2 (warm) ★★★ → ★★；99 FX 3 (crystal) ★ → ★★；移出 97 FX 1 (rain)、102 FX 6 (goblins)。
  - 🌿 新世纪风：新增 95 Pad 7 (halo)、99 FX 3 (crystal)、100 FX 4 (atmosphere) ★★；84 Lead 4 (chiff)、51 SynthStrings 1、64 SynthBrass 2、93 Pad 5 (bowed)、97 FX 1 (rain)、98 FX 2 (soundtrack)、101 FX 5 (brightness) ★。89 Pad 1 (new age)、90 Pad 2 (warm) 不变（★★★）。
  - 🌌 太空风：新增 64 SynthBrass 2 ★★；51 SynthStrings 1、86 Lead 6 (voice)、93 Pad 5 (bowed) ★。
  - 🧸 童话治愈风：新增 99 FX 3 (crystal) ★★；89 Pad 1 (new age)、93 Pad 5 (bowed) ★。
  - ⚡ 电音动漫歌风：新增 63 SynthBrass 1、85 Lead 5 (charang)、96 Pad 8 (sweep)、104 FX 8 (sci-fi)、120 Reverse Cymbal ★。
- 风里排序（建议）：承重降序 → 这个音色的 `year` → GM 号（user「每个风里面按照承重排」）。

## v7 → v8 改了什么（修 sampleKey 的值、加两个字段；概念、图标和 v7 一样）

起因：user「键和主音不对齐这件事怎么办，有哪些有这个问题」。查下去发现 **v5–v7 的 `sampleKey` 是按另一种读法算的，在 MoonSinger 里不对**。
- **原速键改按 TinySoundFont（MoonSinger 的引擎，`vendor/tsf` 的 tsf.h v0.9）的读法**：TSF 把粗调 / 微调当成键偏移、跟着每键音分（scaleTuning）一起缩放——音高 = 根音 +（键 + coarse + fine/100 − 根音）× scaleTuning/100；v5–v7 按「粗调不缩放」算，scaleTuning 50 的音效差出 2–14 个键。直升机另算上 GU 用调制包络加的 +94 音分（稳态）。用 TSF 渲染逐个核过：按新键弹，谱和采样原速重合（差 ≤ 0.5 半音）。
  | GM | 音色 | v7 推荐键 | **v8 推荐键** |
  |---|---|---|---|
  | 116 | Woodblock | 64 | **62** |
  | 118 | Melodic Tom | 72 | **58** |
  | 123 | Seashore | 64 | **62** |
  | 124 | Bird Tweet | 58 | **60** |
  | 125 | Telephone Ring | 79 | **64**（还是北美 20 Hz 振铃；v7 的 79 在 TSF 里是每秒 31 下） |
  | 126 | Helicopter | 86 | **71** |
  | 127 | Applause | 80 | **62** |
  | 128 | Gunshot | 88 | **74** |
  | 117 / 119 / 120 / 121 / 122 | Taiko / Synth Drum / Reverse Cymbal / Fret Noise / Breath | 不变 | 60 / 60 / 60 / 69 / 61 |
  `layers[].originalSpeedKey` 全部按 TSF 重算。几层叠着响（木鱼两层同时响）时 `recommended` 取原速键落在自己键位范围里、离 60 键（GU 作者的约定键）最近的那层。电话备选：中国 / 欧洲 25 Hz ≈ 71，日本约 16 Hz ≈ 56。**换引擎要重算**（规范没写死这一点，各播放器读法不同）。
- **`sampleKey.engine`**（新字段，字符串）：这些键号是按哪个引擎的读法算的，现在是 `TinySoundFont（tsf.h v0.9，MoonSinger 内置）`。
- **`layers[].peakAtRecommended: {hz, midi, pitched} | null`**（新字段）：按 `recommended` 键弹时，这层采样 100 Hz–8 kHz 的**最强谱峰**（不一定是人耳听到的主音）；`pitched: false` = 宽带噪声，峰不算音高；这层在推荐键上不响 = null。用途：音效的键名和听到的对不上（电话 64 键名 E4，听到的峰约 2148 Hz ≈ C7），界面上别拿键名当音高。各音色明细和「哪些有这个问题」见源仓 `ai-docs/20261008-键和主音对不齐.md`。

## v6 → v7 改了什么（只改两个值）

- **电话铃改按 GS 作者可能拆样的那台电话推**（user「我觉得应该按照gs的作者可能拆样的那台电话来推理」）：GU 的电话采样整段就是一个 35.9 ms 的循环（一个振铃周期）；作者是美国人、采样来自自录或网上免费音色库，最可能是北美老式话机 20 Hz → GM 125 `sampleKey.recommended` 86 → **79**，电话 `naturalKey` 100 → **96**（约 2148 Hz）。备选：中国 / 欧洲 25 Hz ≈ 86，日本约 16 Hz ≈ 72。推理见源仓 `ai-docs/20261008-电话该用哪个音高.md` §6。

## v5 → v6 改了什么（只改两个值、加一个字段）

- **电话铃按老式话机**（user：电话铃应该是老式的机械铃，不是合成音；「你挑个合理的」）：GM 125 的 `sampleKey.recommended` 90 → **86**（每秒颤约 25 下 = 中国 / 欧洲老式话机的 25 Hz 振铃；北美 20 Hz 约 79 键），电话的 `naturalKey` 102 → **100**（约 2629 Hz）。理由和对照表见源仓 `ai-docs/20261008-电话该用哪个音高.md` §5。
- **`sampleKey.recommendedBasis`**（新字段，字符串）：推荐键是怎么定的——默认「原速键（某层不拉伸不压缩）」，电话写的是老式话机那条。

## v4 → v5 改了什么（只加字段，没删、没改名；概念和 v4 完全一样）

MoonSinger 要的（起因：user「试弹的时候键盘上的音域没有跟进」；user「嗯让仓鼠调查。我特别好奇电话应该用哪个音高」）。
- **`range: {low, high, basis} | null`**（表 ①）：实际发声的常用音域，MIDI 号（中央 C = 60）；移调 / 移八度乐器已换算成实际响的音；专业演奏者的极限不算。94 个概念有，其余（打击乐、鼓件、音效、编制、变体太多的）为 null。`basis` = 依据类型（原文 / 原文换算 / AI 常识）+ 出处条目；**34 个是 AI 常识**。
- **`naturalKey: {note, hz, basis}`**（表 ①，只在有的概念上出现）：音效在现实里最像的音高——电话 102（GeneralUser GS 采样实测 2951 Hz）、鸟 97、哔声 83（BBC 报时 1 kHz）、猫 74、狗 71、汽车 40、蟋蟀 109（后四个是 AI 常识）。雨、风、海等宽带噪声没有。
- **`sampleKey: {soundfont, recommended, layers[]}`**（表 ②，音效类 GM 号 116–128）：在 GeneralUser GS 2.0.3 里按哪个键采样不拉伸不压缩（user「没有音高的pad也应该有一个推荐的key吧，不然也会拉伸压缩」）。`recommended` = 第一个原速键落在自己键位范围里的那层，四舍五入到整数；`layers[]` 每层 `{sample, originalSpeedKey, centsPerKey, keyRange}`（`centsPerKey` 50 = 两个键才升一个半音）。**注意**：GU 作者给很多音效设了负的粗调，按 60 键时采样被放慢，所以「原速键」不一定是 GU 作者想让人按的键（作者那套约定是 60）；user 定的是「老实的，以你听到的为准」。电话的完整答案见源仓 `ai-docs/20261008-电话该用哪个音高.md`。**（v8 勘误：v5–v7 的原速键按「粗调不缩放」算，MoonSinger 的 TSF 不是这么读的，见上面 v7 → v8。）**

## v3 → v4 改了什么（都向后兼容：只加字段、加取值，没删、没改名的字段；v3 的概念 id 一个没少）

- **新可选字段**：概念的 `yearSource`（只在原文没给年份、AI 估的那几条上出现，值 `"ai-estimate"`，同时 `yearApprox: true`）；图标的 `icon.derivedFrom`（派生图标才有，见下）。署名表 `icon-credits-v4.json` 里派生图标多 `derivedFrom` / `modified`。
- **图标**：非 game-icons 的单色图换成黑底白图派生（id 后缀 `--tile`，和 game-icons 的黑底白图对齐；原件不动，派生版注明修改，许可证都允许演绎）；彩色 emoji 不派生，候选里有单色图就换单色的，没有才用原版（现在只有 Commons 齐特琴图的 5 个概念）。新音效 / 自然声概念也有图了（还没图的：牛吼器、特雷门琴）。
- **年份**：电子 / 电声乐器统一按「第一次公开能听到」（演出、公开演示、唱片 / 广播、上市；user「统一按「第一次公开能听到（演出 / 上市）」」）——合成人声一系 1779 → 1939（Voder，1779 留作前身）、合成器 1955、音轮风琴 1935、电三角钢琴 1931、电贝斯 1935、Clavinet 1964、电子鼓 1971，以及 GM 81 / 82 / 96 / 103 / 119 / 30 / 31 / 56 等号；6 个原文没给年份的补了 AI 估算。
- **新概念 7 个**：上低音号（平替大号 / 圆号 / 长号）、特雷门琴、烟火（发射 / 哨音 / 炸开）、大炮、汽车、电子哔声、机器声（蒸汽机）；音效类大多 GM 里没有能顶的。
- **风**：新 tag `new-age` 新世纪、`space` 太空、`fairytale` 童话治愈、`anime-electro` 电音动漫歌、`symphonic-metal` 交响金属、`folk` 民谣；8-bit 芯片原样和现代致敬版并成一个（id 仍是 `eight-bit`）；各风都补了料和声景认领，承重重新排过。配方卡（画面 / 节奏 / 人声……）还没进 JSON，结构等 W-13 / W-14 商量。
- **其他**：牛吼器去掉了按分类号自动找的三个平替（耳朵上不像）。

## v2 → v3 改了什么（都向后兼容：只加字段、加取值，没删、没改名的字段）

- **`styles[].weight`（新）**：承重，`3` 承重 / `2` 常用 / `1` 点缀（字典 `defs.weights`）。表 ① 概念上的 = 它的号里最大的那个；表 ② 每行的 styles 也有。user：「每个风里面按照承重排可以吗，可以加一个重要性」——UI 里每种风按它排、显示出来。**AI 判，不是 fundamental**（`fundamentalRank` 仍一律 null，归 user）。
- **风**：`beethoven` 的中文名改成「贝多风（交响乐）」；新加 `beethoven-band`（🪈 贝多风（管乐团）：同一个风换编制，没有弦乐，单簧管顶小提琴、萨克斯顶中提琴大提琴、大号顶低音提琴）和 `military`（🎺 军乐风：露天、阅兵、国歌、军营——军号、军笛、军鼓、对镲、礼炮、兵的口琴）。
- **表 ② 本尊行加 `primary`**：一个号可以多重认领（user「人声可以多重认领吧」）。主本尊 `true`（175 个号每个恰好一条），另加的 `false`；现在只有 GM 53 Choir Aahs 同时是合唱、人声。多重认领的那一行不带 styles。
- **`defs.bases` 加 `imitation`（仿声）**：排在 lineage 后面。55 Synth Voice 是人声的平替（user「合成算平替」）。
- **型号 / 牌子名的显示名换成通用名，产品名在括号里**（user 选 A）：`FM 合成器（雅马哈 DX7）`、`音轮风琴（哈蒙德）`……（`data/通用名_AI.tsv`）。年份仍是那台机器的。**型号不再带 GM 号的风**（user「型号为什么会继承。应该是音色啊」）。
- **86 / 92 / 95 的本尊从合成器改到语音合成**（GM 说明写着从 synth voice 来）。
- **新概念 10 个（音效，GM 里都没有）**：狗叫、猫叫，风、雨、雷、溪流、火、蟋蟀、蝉、蛙（年份 = 声源最早存在）。
- **修错**：迪吉里杜管的 `communityEra` 从 🛶 波利尼西亚航海改成 🪃 澳洲原住民；GM 24 不再既是班多钮琴的本尊又是它的平替。

## 结构要点

- **身份 = 一束编号**：`id` = Wikidata QID（没有的用 `x:` 本地 id，现在只有 `x:bei-bangzi`）；`ids = { wikidata, local, musicxml, gm[], hs }`。`ids.gm` 只放本尊（含多重认领的）。
- **平替是数组，和本尊分开**：表 ① 的 `substitutes[]`、表 ② 的 `relation: "substitute"` 行。`basis` 从强到弱：`official`（GM 原文写了 or / 说明里点名的型号）> `lineage`（维基原文说原主是前身）> `imitation`（这个号模仿它的声音）> `family`（分类号相近；`hsCommon` = 同到哪一位）> `name-only`。同一个 GM 号可以是 A 的本尊、又是 B 的平替。
- **`note` 只放鼓件的 MIDI 键号**；平替的理由在 `reason`。
- `year` = 这个概念的声音第一次能被听见；`lineageYear` = 算上原文点名的前身。`era` 用短 id（字典在 `defs.eras`），`communityEra` = user 的按共同体历史时代表。
- `styles[] = {tag, ear, weight, as?}`：〇〇风（刻板印象时间：听起来像哪里），`as` = 被当成哪个概念（平替认领）。
- `icon = {id, candidates[], license, borrowedFrom?}`：先 game-icons，没有用最像的（user 以后会改）；自己没图标的借第一个平替的本尊图标（`borrowedFrom`）。
- `fundamentalRank` 一律 `null`：user「判断哪些是 fundamental 这个不是任务，是我的感受」。

## AI 判的部分（user 可改，改在 `data/`）

- `ids.musicxml` / `musicxmlSound`：`data/MusicXML音色_AI.tsv`、`data/MusicXML音色_GM_AI.tsv`（sounds.xml 没有的标了「借」；火什么都不借，`musicxml` 为 null）
- `styles`（含 `weight`）：`data/〇〇风_AI.tsv`（「承重」列）+ 脚本里的 `DIRECT_STYLE`
- 型号 / 牌子名的通用名：`data/通用名_AI.tsv`
- 技法号挂母乐器（Pizzicato / Tremolo → 弦乐组，Distortion / Harmonics → 电吉他，Slap → 电贝斯，Muted → 小号）
- 平替：`family` 里「按分类号自动找」的和手动指定的；部分 `hs`（`data/HS补_AI.tsv`）；部分中 / 日名（`data/中文名_AI.tsv`、`日文名_AI.tsv`）

## 已知缺口

- 没年份：桑图尔琴、扬琴、箫、西库、木鼓（裂缝鼓）、北梆子——原文只说「很古老」。v4 已补 AI 估算（`yearSource`）
- 没图标：牛吼器、特雷门琴（任何图标库都没画）；上低音号借大号的图
- 既没本尊也没平替（app 里没东西出声）：牛吼器、乐弓、特雷门琴，以及狗叫、猫叫、风雨雷、溪流、火、虫蛙蝉、烟火、大炮、汽车、哔声、机器声这些音效（等音效 soundfont，记账仓 W-204）
- GM 里没有、管乐团 / 军乐里却承重的：上低音号（euphonium）、大炮、手持对镲（暂时拿吊镲顶）。上低音号 v4 已收成概念
- toki pona 名全空
