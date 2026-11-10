# 文字排版引擎：收成一个深模块、窄接口（计划书，给 Opus 施工）+ 排版性能怎么改

> created 20261109 by Claude Fable 5.1 · as-of v0.16.53 / 2026-11-09
> user 11-09：「到时候让fable把文字排版引擎审核的时候写个计划书让opus做收成一个深模块窄接口」「到时候记得让 Fable 看一下这个性能，不要太难看」「让fable看一下排版引擎是整个曲段重拍还是修一行，可以优化一下。算法的优化也给fable」。
> **进度（Claude Opus 5.5）**：第 1 步 v0.16.66 做了（2026-11-10；快照 N1 + PDF 指纹 N2 原样绿、没重冻；`hyphens()` 的输入是一串音节、按行判断「同一行」）。第 2 步 v0.16.67 做了：宿主只给原始尺子 `RawMeasure = (s, px) => px 宽`（屏幕 / worker = `canvasMeasure(ctx)`，PDF = 字体字宽），每次排版 `createTextMeasure(raw)` 一把（带缓存，只活这一次）；`TextMeasure` 两问：`width(role, s, sp, ts)`（sp）+ `widthPx(s, px, sp, ts)`（有字号的图元，天际线算墨迹用）；`lyric-font.ts` 并进 `text/measure.ts`，`text-style.ts` 转发删了；worker 的任务里不再带字体串。和 §2 草图的出入：原始尺子不带 face 参数（现在每种字都按歌词那款字量、再按字号比例缩放——这是现状，换成各量各的会动版面，不在这一轮）。守卫：`test/text-style.test.ts` 两条（engrave 里没有 `measureLyric` / 拿 `LYRIC_EM` 乘除；模块外只从 `text/index.ts` 进，反向验过）。第 3 步 v0.16.68 做了：`text/baseline.ts` = 约定（字图元 y = 基线；SVG 和 PDF 本来就按基线画、不换算）+ `faceMetrics`（覆盖层用的真上下沿，从 score-overlay 搬来）+ `boxTopFor`（HTML 盒子的顶）+ `INK_EST`（排版器估的墨迹上下沿 0.8 / 0.22，天际线用，从 skyline 的字面量收来）。和 §2 草图的出入：没有 `baselineOf(role, px, metrics)` 这个名字——真正要换算的只有覆盖层一处（基线 → 盒顶），PDF 不用换；拼音字体的歌词下让（`lyricRaiseOf`）按 PDF 字体的墨迹量，留在 score-pdf。验收：快照 / PDF 指纹原样；新旧两版各截两张谱（全部曲段 + 本段）逐像素相同；E2E header-panel 17/17、overlay-touch 17/17。第 4 步 v0.16.69 做了：尺子 = `scripts/bench-lyrics.mjs`（计划书原写加进 bench-engine，那个脚本开头要装检疫桶里的唱歌模型、和排版无关，另起一个）；800 个十六分音符全带英文，让路 vs 不让路的差 **14–16 ms → 8.8–9.1 ms**（node、粗估量字、15 次中位数），普通样张 16–18 ms 没变慢。做的两样都逐位不改结果：① 二分在上下界落到同一个百分位就停（最后取的就是 a 的百分位往下取整，结果已定）；② 字宽 / 到邻居音的半距 / 缝的底宽先算好。验收另加：新旧算法在 2 万组随机歌词行上输出逐位相同（压窄放得下 9147、挤到底 3151、不用压 7702 组）。没做：(a) 量字缓存第 2 步已有；(b)「先看没叠就直接摆」原算法本来就只在叠了才二分；(d) 方块字整段宽度改二分——坏字个数随宽度不一定单调，改了会换结果，英文样张也不走这条路，留着。
> 总表 `ai-docs/20261109-plan-016-all-in-one.md` 第 3 条 / 第 7 条。读法：§1 现状 → §2 目标形状（接口）→ §3 施工步骤（每步能单独发版、怎么算做完）→ §4 性能的判断 → §5 不在这一轮的。

## 1. 现状（as-of v0.16.53）

谱上的字现在分在四处：
- `src/render/text-style.ts`（79 行，v0.16.44 起）：**样式表**——角色（歌名 / 歌词 / 速度 / 小节号…）→ 字体 / 粗细 / 斜体 / 字号 / 跟哪把尺子（谱 sp 还是字 sp × textScale）；屏幕 CSS、PDF 粗斜、覆盖层都查它。这一块已经是深模块。
- `src/render/engrave.ts`（1788 行）里散着：**量字**（`measureLyric` 注入 13 处 + 按角色换尺子的 `RS` / `TR` / `mw` 共 28 处）、**歌词让路**（`solveLyrics` / `fitLyrics` / `lyricBlockSx` / `LyricGaps` / `DEFAULT_GAPS`，约 90 行纯函数）、**连字符**（摆在缝正中、按真实宽度留地方、方块字旁不占地方）、歌词基线 / 第二行 / 行下那一截的几何。
- `src/ui/score-overlay.ts`：**基线**（`faceMetrics()` 用 canvas 的 fontBoundingBox 算字的真实上下沿，`text()` 按它放）、`textStyleOf("key-hint")`。
- `src/export/score-pdf.ts`：粗 / 斜查样式表；量字另有一套（PDF 字体的度量）。
- `src/render/lyric-font.ts`（9 行）：歌词的 CSS 字体串。

三把量字的尺子（屏幕 canvas / node 粗估 / PDF 字体）各自换算，换算系数写在调用处（`LYRIC_EM × sp × ts`）；守卫 `test/text-style.test.ts`、`test/lyric-fit.test.ts`、`test/engrave-textscale.test.ts` 分三处。

## 2. 目标形状：`src/render/text/`（一个目录、一个入口）

```ts
// src/render/text/index.ts —— 对外只有这几样
export { TEXT_STYLES, textStyleOf, textPx, textStyleCss, type TextRole } from "./style.ts";   // 现在的 text-style.ts 原样搬进来
/** 量字：一把尺子，宿主注入（屏幕 = canvas measureText；node / worker 粗估；PDF = 字体度量）。只量「这个角色、这个字、这个字号 = 多宽（sp）」，换算系数在模块里，调用方不碰。 */
export interface TextMeasure { width(role: TextRole, s: string, sp: number, ts: number): number }
export function createTextMeasure(raw: (s: string, px: number, face: string) => number): TextMeasure;   // 带缓存（同一次排版里同样的字只量一次）
/** 歌词让路：一行的音节（音的 x、字宽、连字符、方块字）→ 每个字的位置 / 宽度比例 / 挤不挤 + 连字符摆哪。纯函数。 */
export interface LyricRow { items: LyricItem[]; blockSx: number; minSx: number; gaps: LyricGaps }
export function fitLyricRow(row: LyricRow): { fits: LyricFit[]; hyphens: HyphenPlace[] };
export function lyricBlockSx(rows: LyricItem[][], minSx: number, gaps: LyricGaps): number;   // 一张纸 × 一位歌手统一的方块字宽度
/** 基线：某个角色在某个字号下，「贴在 y 上」的字该把 baseline 放哪（engrave / 覆盖层 / PDF 三处同一个定义）。 */
export function baselineOf(role: TextRole, px: number, metrics: FaceMetrics): number;
```

- **engrave.ts 只调**：`measure.width(...)`、`fitLyricRow(...)`、`lyricBlockSx(...)`、`baselineOf(...)`、`textPx(...)`。`RS` / `TR` / `mw` 这些私有换算删掉（换算进模块）。
- **覆盖层和 PDF** 用同一个 `baselineOf` 和同一个 `TextMeasure` 契约（PDF 注入字体度量那一把尺子）。
- **不改行为**：这是搬家 + 收口，版面快照 18 份、PDF 指纹 3 份逐位不变是第一步的验收。

## 3. 施工步骤（每步一版，能单独推）

1. **搬家不改行为**：建 `src/render/text/`；`text-style.ts` → `text/style.ts`（旧路径留一个转发，一版之后删）；歌词让路那 90 行 + `LyricGaps` → `text/lyric-fit.ts`；连字符摆位从 engrave 里抽成 `hyphens()` 一并放进去。验收：快照 / PDF 指纹逐位不变；`test/lyric-fit.test.ts` 改 import 就过。
2. **量字一把尺子**：`createTextMeasure`；engrave 的 `measureLyric` 注入换成 `TextMeasure`（`EngraveOpts.measure`），`RS` / `TR` / `mw` 删掉；score-view / layout-worker / PDF / 测试四处注入点各给一把。验收：快照不变；守卫——`engrave.ts` 里不再出现 `measureLyric(` 和 `LYRIC_EM * sp` 这类手写换算（`test/text-style.test.ts` 加一条）。
3. **基线一处定义**：`baselineOf` 进模块，覆盖层 `faceMetrics` 的用法换成它，PDF 的基线也查它。验收：E2E `header-panel` / `overlay-touch` 绿；屏幕上「1=C」和 mf 的位置不变（截图比对一次）。
4. **性能**（见 §4）：量字缓存 + 挤的那一串早退 + 量一次复用。验收：`scripts/bench-engine.mjs` 加一个歌词密集样张（800 个十六分音符全带英文）：让路 vs 不让路的差 ≤ 10 ms（现在 20 ms）；普通样张不变慢。
5. **缝的底线按档**（总表第 2 条顺带的）：`GAP_FLOOR` 0.2 是 AI 定的；改成样式表里按密度给（舒适 / 紧凑各一个数），出两张样张给 user 看着定。不定就照旧 0.2。
6. 文档：`ai-docs/20261109-pipelines.md` A8 那一步补上「文字」这一层；`CLAUDE.md` 一条；`api/` 没有就不补。

施工纪律照交接清单 §4。不碰：`src/singer/audio.ts`、`src/app/document.ts` 锁语义、`src/editor-session/`。

## 4. 性能的判断（Fable，2026-11-09）

**数字（都是 node 里量的，iPad 没量）**：样张歌排一次 10.5–15.6 ms（刀 4 之后）；worker 里排大歌 36 ms；歌词密集极端样张（800 个十六分音符全带英文）让路 40 ms / 不让路 20 ms；song 结构化克隆进 worker ≈ 0.5 ms；主线程换 DOM 几 ms。

**「整个曲段重排还是修一行」**：现在每改一下整张纸（本段视图）/ 整首（全部视图）在 worker 里重排、重串化，谱没变不重排、在途再改只记最新的。
- **我的判断：这一轮不做「只重排一行」。** 原因三条：① 折行是整张纸一起挑的（刀 3 偏离 1），改一个音可能换折点，一行的改动本来就会波及整张纸；② 挂件按天际线一行一条摆、行高随之变，下面每一行都要挪——「只重排一行」要改成「重排一行 + 平移后面所有行」，收益有限、代码多一条路；③ 现在的数字（普通歌 10–16 ms、大歌 36 ms，在 worker 里、不挡出声）还没到用户感觉得到的档。user 说的「可以优化一下」先用便宜的办法吃掉大头。
- **便宜的办法（§3 第 4 步）**：a) 量字缓存：同一次排版里同样的字 / 角色 / 字号只量一次（歌词里重复的音节多）；b) 歌词让路早退：一行先算一遍「全按默认宽度放下去有没有叠」，没叠 = 直接摆、不进二分（大多数行都是这样）；c) 挤的那一串二分里 `pushFrom` 重复算整串，改成只算从变化点起（或把二分的 16 / 20 次减到 10 / 12——精度 1/1024 没必要）；d) `lyricBlockSx` 从 0.95 往下每 0.05 试一次、每次整段重解——改成先试 1 再试 minSx 定有没有必要收，再二分。预期：极端样张的差从 20 ms 压到 10 ms 以内；普通歌几乎没变化。
- **什么时候再谈「只重排一行」**：大歌 worker 里 > 50 ms、或 user 在 iPad 上感觉到写字跟不上手。到时先量 iPad（`scripts/probe-input-latency.mjs`），别凭 node 的数。

## 5. 不在这一轮的

- 对齐的定义（音还在字底下、没越过和邻居音的中点）和 0.6 / 0.8 / 0.5 / 0.2 这些数：归 user 眼睛，看着不对再说。
- 英文各收各的宽度看着晕（W-52）：user 后来说舒服，留着观察。
- PDF 嵌第二款字（和弦级数衬线）：交接清单 §5 第 5 问，默认不做。
