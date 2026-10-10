# 给音乐仓鼠的工单：鼓谱怎么写（哪一线、什么符头）+ 着力点（MoonSinger）

> created 20261010 by Claude Opus 5.5 · as-of MoonSinger v0.10.21 / 2026-10-10
> 起因：user 2026-10-10「还记得我们的数据驱动的乐器roster吗，给音乐仓鼠发一个工单让他把应该写成鼓谱的乐器具体写哪个头给元数据补齐一点」「定音鼓走五线谱对吧」。
> 设计背景 = MoonSinger `ai-docs/20261010-shared-staff-percussion-design.md` §2–3（user「合租 大炮 reverse cymbal continuous seg view 同意」）：鼓 / 大炮 = 不分音高的「一下」——谱上的位置挑哪个声音、时值没意义、录音房当一下放。
> 交付照以前：进 `export/moonsinger/` 的乐器数据（新版本号，只增不改），MoonSinger 用 `scripts/gen-instruments.mjs` 取货。下面的字段只是推荐稿，你觉得不对直接改、告诉我。

## 1. 哪些概念写成鼓谱（不分音高）

- 表 ① 每个概念加可选 `pitched: false`（只给不分音高的；有音高的不写 = 照旧）。
- **定音鼓、钟琴、木琴、管钟这些有音高的打击乐不算**：照旧五线谱 + `notation`（定音鼓 = 低音谱号，user 问「定音鼓走五线谱对吧」= 对）。

## 2. 鼓谱的每一件：在哪一线、什么符头、符干朝哪

- 给不分音高的概念（军鼓、大鼓、踩镲、吊镲、通鼓、三角铁、铃鼓、木鱼、响板、锣、大锣、风铃…）和 **GM 打击乐通道（第 10 通道，键 35–81，GS 的扩展键也算）每一个键**：
  `percussion: { staff: 5 | 1, line: <MuseScore drumset 的 line 值>, head: "normal" | "x" | "circle-x" | "triangle" | "diamond" | "slash" | …, stem: "up" | "down", voice?: 1 | 2, basis, source }`
  - `staff`：五线鼓谱（架子鼓那一套）还是一线谱（三角铁、木鱼这类单件常用一线）。
  - `line`：和 MuseScore `instruments.xml` 里 drumset `<Drum><line>` 同一个约定（0 = 第一线、往下数正、往上数负），省得自己发明；写清约定在 `defs`。
  - `head`：符头（踩镲 / 镲 = x，开镲 = circle-x，边击 / 鼓边 = x 或 slash…）。
  - `stem`：手打的朝上、脚踩的（大鼓、踩镲踏）朝下（两声部写法）。
- 出处：MuseScore 默认 drumset 定义；PAS / Norman Weinberg《Guide to Standardized Drumset Notation》；Gould《Behind Bars》打击乐章节。**有出处才写，不要现编**；几种写法打架的，挑 MuseScore 默认那种并在 `basis` 里说。

## 3. 着力点（采样要「右对齐」的那种）

- 表 ② 的音效 / 打击乐行加可选 `hitSec`：采样开头到「砸下去那一下」（包络最响处）多少秒。
- 例：GM 119 Reverse Cymbal（反向镲：着力点 = 快结尾的地方）、GM 128 Gunshot、各种 Impact 类。照「音效原速键」那套 TinySoundFont 实测，测法写进 `defs`。
- MoonSinger 的用法：谱上写在砸下去的那一拍，录音房提前 `hitSec` 开始放（和月读辅音提前同一个机制）。

## 4. 顺带（不急）

- **大炮**：团子大家族就差它了（user「团子就差大炮了」）。GM 里没有大炮；有没有许可证干净的大炮单发采样，能进家族音源库 `pwa-sounds`（音源跟人不跟 app，进库前逐条核许可证）？只调研、列候选，不用你搬。
