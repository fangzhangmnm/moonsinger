# MoonSinger 挑乐器数据（2026-10-07）

**现行版本 = v3**。v1、v2 的文件原样留着（发出去的版本只增不改；`scripts/build_export.py` 发现这一版已存在就停）。v2 和 v1 只差图标（超过 20 KB 的两个换成候选里更轻的）。下一版（sounds.xml 全量）= v4。

> 由 `scripts/build_export.py` 生成，别手改；改数据改 `data/` 再重跑。规格 = PWAProjects 的 webpaint editor v1 prototyping 会话转述的 user 拍板 + 本仓会话 user 原话（见脚本头注释）。

| 文件 | 是什么 |
|---|---|
| `instruments-v3.json` | 表 ① 乐器史：一条 = 一个概念（乐器 / 型号 / 编制 / 人声 / 音效），154 条 |
| `gm-map-v3.json` | 表 ② GM 映射：一行 = 一个 GM 号 → 一个概念；`relation` = `self`（本尊）/ `substitute`（平替，51 条） |
| `instrument-icons-20261007-v3.svg` | 只装挑中图标的 sprite（49 个，都 ≤ 20 KB），每个 `<symbol>` 自带 viewBox，没有 foreignObject / 外部引用 / `<use>` / class / `<style>`；图形照原样 |
| `icon-credits-v3.json` | 每个图标一条 `{id, set, author, license, url, bytes}` |
| `LICENSES-chosen-v3.md` | 挑中套件的许可证原文（从 `icons/upstream/` 原样拼接） |

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

- 没年份：桑图尔琴、扬琴、箫、西库、木鼓（裂缝鼓）、北梆子——原文只说「很古老」
- 没图标：呼吸、海、鸟、电话铃、吹瓶、乐弓，以及新加的狗叫、猫叫和 8 个自然声
- 既没本尊也没平替（app 里没东西出声）：乐弓、狗叫、猫叫、风、雨、雷、溪流、火、蟋蟀、蝉、蛙
- GM 里没有、管乐团 / 军乐里却承重的：上低音号（euphonium）、大炮、手持对镲（暂时拿吊镲顶）。**上低音号 v3 之后已收成概念**（Q495529，1843 魏玛，平替大号 / 圆号 / 长号），下一版带上；同样等下一版的：烟火发射声（新音效概念）、军乐风里枪声的 weight 2 → 1
- toki pona 名全空
