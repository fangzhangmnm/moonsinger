# MoonSinger 挑乐器数据（2026-10-07）

**现行版本 = v2**：和 v1 只差图标——超过 20 KB 的两个换成候选里更轻的（扬琴 → Commons 齐特琴图，双簧管 → game-icons 巴松），sprite 从 262 KB 降到 103 KB（MoonSinger 会话：「换成候选里更轻的，没有轻的就留着」）。v1 的文件原样留着（版本只增不改）。下一版（sounds.xml 全量）= v3。

> 由 `scripts/build_export.py` 生成，别手改；改数据改 `data/` 再重跑。规格 = PWAProjects 的 webpaint editor v1 prototyping 会话转述的 user 拍板 + 本仓会话 user 原话（见脚本头注释）。

| 文件 | 是什么 |
|---|---|
| `instruments-v2.json` | 表 ① 乐器史：一条 = 一个概念（乐器 / 型号 / 编制 / 人声 / 音效），144 条 |
| `gm-map-v2.json` | 表 ② GM 映射：一行 = 一个 GM 号 → 一个概念；`relation` = `self`（本尊，175 个号各一条）/ `substitute`（平替，51 条） |
| `instrument-icons-20261007-v2.svg` | 只装挑中图标的 sprite（49 个，都 ≤ 20 KB），每个 `<symbol>` 自带 viewBox，没有 foreignObject / 外部引用 / `<use>` / class / `<style>`；图形照原样 |
| `icon-credits-v2.json` | 每个图标一条 `{id, set, author, license, url, bytes}` |
| `LICENSES-chosen-v2.md` | 挑中套件的许可证原文（从 `icons/upstream/` 原样拼接） |

## 结构要点

- **身份 = 一束编号**：`id` = Wikidata QID（没有的用 `x:` 本地 id，现在只有 `x:bei-bangzi`）；`ids = { wikidata, local, musicxml, gm[], hs }`。`ids.gm` 只放**本尊**（这个 GM 号就是这个概念）。
- **平替是数组，和本尊分开**：表 ① 的 `substitutes[]`、表 ② 的 `relation: "substitute"` 行。`basis` 从强到弱：`official`（GM 原文写了 or / 说明里点名的型号）> `lineage`（维基原文说原主是前身）> `family`（分类号相近；`hsCommon` = 同到哪一位）> `name-only`。同一个 GM 号可以是 A 的本尊、又是 B 的平替。
- **`note` 只放鼓件的 MIDI 键号**；平替的理由在 `reason`（规格里 gm 的 `note` 和 substitute 的 `note` 撞名，这里分开了）。
- `year` = 这个概念的声音第一次能被听见（音效按这个标准：直升机 1936、枪声 13 世纪手铳）；`lineageYear` = 算上原文点名的前身。`era` 用短 id（字典在 `defs.eras`），`communityEra` = user 的按共同体历史时代表。
- `styles[] = {tag, ear, as?}`：〇〇风（刻板印象时间：听起来像哪里），`as` = 被当成哪个概念（平替认领）。
- `icon = {id, candidates[], license, borrowedFrom?}`：先 game-icons，没有用最像的（user 以后会改）；自己没图标的借第一个平替的本尊图标（`borrowedFrom`）。
- `fundamentalRank` 一律 `null`：user「判断哪些是 fundamental 这个不是任务，是我的感受」。

## AI 判的部分（user 可改，改在 `data/`）

- `ids.musicxml` / `musicxmlSound`：`data/MusicXML音色_AI.tsv`、`data/MusicXML音色_GM_AI.tsv`（sounds.xml 没有的标了「借」）
- `styles`：`data/〇〇风_AI.tsv` + 脚本里的 `DIRECT_STYLE`
- 技法号挂母乐器（Pizzicato / Tremolo → 弦乐组，Distortion / Harmonics → 电吉他，Slap → 电贝斯，Muted → 小号）
- 平替：`family` 里「按分类号自动找」的和手动指定的；部分 `hs`（`data/HS补_AI.tsv`）；部分中 / 日名（`data/中文名_AI.tsv`、`日文名_AI.tsv`）

## 已知缺口

- 没年份：桑图尔琴、扬琴、箫、西库、木鼓（裂缝鼓）、北梆子——原文只说「很古老」
- 没图标：呼吸、海、鸟、电话铃、吹瓶（候选里没有）、乐弓
- 乐弓既没本尊也没平替（分类号找不到同到 3 位以上的 GM 号）
- toki pona 名全空
