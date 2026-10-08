# MoonSinger 挑乐器数据（2026-10-07）

**现行版本 = v6**（2026-10-08）。v1–v5 的文件原样留着（发出去的版本只增不改；`scripts/build_export.py` 发现这一版已存在就停）。v2 和 v1 只差图标（超过 20 KB 的两个换成候选里更轻的）。下一版（sounds.xml 全量）= v7。

> 由 `scripts/build_export.py` 生成，别手改；改数据改 `data/` 再重跑。规格 = PWAProjects 的 webpaint editor v1 prototyping 会话转述的 user 拍板 + 本仓会话 user 原话（见脚本头注释）。

| 文件 | 是什么 |
|---|---|
| `instruments-v6.json` | 表 ① 乐器史：一条 = 一个概念（乐器 / 型号 / 编制 / 人声 / 音效），161 条 |
| `gm-map-v6.json` | 表 ② GM 映射：一行 = 一个 GM 号 → 一个概念；`relation` = `self`（本尊）/ `substitute`（平替，51 条） |
| `instrument-icons-20261008-v6.svg` | 只装挑中图标的 sprite（69 个，都 ≤ 20 KB），每个 `<symbol>` 自带 viewBox，没有 foreignObject / 外部引用 / `<use>` / class / `<style>`；图形照原样 |
| `icon-credits-v6.json` | 每个图标一条 `{id, set, author, license, url, bytes}` |
| `LICENSES-chosen-v6.md` | 挑中套件的许可证原文（从 `icons/upstream/` 原样拼接） |

## v5 → v6 改了什么（只改两个值、加一个字段）

- **电话铃按老式话机**（user：电话铃应该是老式的机械铃，不是合成音；「你挑个合理的」）：GM 125 的 `sampleKey.recommended` 90 → **86**（每秒颤约 25 下 = 中国 / 欧洲老式话机的 25 Hz 振铃；北美 20 Hz 约 79 键），电话的 `naturalKey` 102 → **100**（约 2629 Hz）。理由和对照表见源仓 `ai-docs/20261008-电话该用哪个音高.md` §5。
- **`sampleKey.recommendedBasis`**（新字段，字符串）：推荐键是怎么定的——默认「原速键（某层不拉伸不压缩）」，电话写的是老式话机那条。

## v4 → v5 改了什么（只加字段，没删、没改名；概念和 v4 完全一样）

MoonSinger 要的（起因：user「试弹的时候键盘上的音域没有跟进」；user「嗯让仓鼠调查。我特别好奇电话应该用哪个音高」）。
- **`range: {low, high, basis} | null`**（表 ①）：实际发声的常用音域，MIDI 号（中央 C = 60）；移调 / 移八度乐器已换算成实际响的音；专业演奏者的极限不算。94 个概念有，其余（打击乐、鼓件、音效、编制、变体太多的）为 null。`basis` = 依据类型（原文 / 原文换算 / AI 常识）+ 出处条目；**34 个是 AI 常识**。
- **`naturalKey: {note, hz, basis}`**（表 ①，只在有的概念上出现）：音效在现实里最像的音高——电话 102（GeneralUser GS 采样实测 2951 Hz）、鸟 97、哔声 83（BBC 报时 1 kHz）、猫 74、狗 71、汽车 40、蟋蟀 109（后四个是 AI 常识）。雨、风、海等宽带噪声没有。
- **`sampleKey: {soundfont, recommended, layers[]}`**（表 ②，音效类 GM 号 116–128）：在 GeneralUser GS 2.0.3 里按哪个键采样不拉伸不压缩（user「没有音高的pad也应该有一个推荐的key吧，不然也会拉伸压缩」）。`recommended` = 第一个原速键落在自己键位范围里的那层，四舍五入到整数；`layers[]` 每层 `{sample, originalSpeedKey, centsPerKey, keyRange}`（`centsPerKey` 50 = 两个键才升一个半音）。**注意**：GU 作者给很多音效设了负的粗调，按 60 键时采样被放慢，所以「原速键」不一定是 GU 作者想让人按的键（作者那套约定是 60）；user 定的是「老实的，以你听到的为准」。电话的完整答案见源仓 `ai-docs/20261008-电话该用哪个音高.md`。

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
