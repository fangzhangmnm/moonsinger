# 17-0 侦察：视图的默认收成一个模块（只读，交统筹审）

> created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）· as-of v0.17.20 · 施工单 `20261111-score-surface-construction-plan.md` 第 17 条。
> 只读：这一份没有改任何代码。每一条都是查代码查出来的（文件:位置写在格子里），不凭印象。

分界线（user 2026-11-13「改声音的要按照严格的方式」）：改了它，放出来 / 导出来的声音会不会变。会 = 照第 16 条，不进第 17 条的模块；不会 = 进模块。

---

## 表一：歌的文件里归在「视图 / 显示设置 / 视图态」那一堆的每个键

「改声音」那一列：查的是出声的那几条路——核心（`src/core/render.ts`：`audibleParts` / `timelineOf` / `mixParamsOf` / `renderSong`）、编辑器的播放胶水（`src/app/performance.ts`）、时间线和演奏（`src/engine/timeline.ts`、`src/score/perform.ts` / `arrange.ts` / `groove.ts` / `repeats.ts`）、唱（`src/singer/`）、导出（`src/export/`）、演奏者插件（`src/performers/`）。在这些文件里搜这个键，再顺着读到的那一处看它管不管出声。

### 歌级（`.moonsinger/score.json` 顶层；内存 = `Song` 上的同名字段）

这十样是 16-4 A3 收的「歌级显示设置」（`SongLookKey`）。存：每次都明写（`project.ts` 存 score.json 那一段）；新建：按 `song.ts NEW_SONG_LOOK` 写；读：门口 `project.ts songLookOf` 没写 / 类型不对 = 补成 `NEW_SONG_LOOK` 那一份、不说话，比这一版新的那一份里认不出的值原样留。下表只写各自不一样的地方。

| 键 | 改不改声音 | 新建写的值 = 没写时补的值 | 备注 |
|---|---|---|---|
| `arrangement` | **改**：播放和导出放哪几张纸、什么顺序、哪一段循环（`core/render.ts timelineOf` → `arrange.ts songPlayOrder`；`loopSpanOf` 的循环段；导出的压平件也照它展开） | `""`（= 每张没藏的纸各一遍） | 它被收在「显示设置」那十样里，但它是出声的结构，照第 16 条 |
| `lyricFit` | 不改（只排版：`engrave` / `text/lyric-fit.ts`） | `"rhythm"` | |
| `barNumbers` | 不改 | `"line"` | |
| `spacing` | 不改（v0.16.43 起排版都不读它，只原样带） | `"normal"` | 已经没人读，可以考虑退役 |
| `notation` | 不改（谱种；`src/performers` 里搜到的 `notation` 是插件的画法，不是这个键） | `"staff"` | |
| `chordTags` | 不改 | `true` | |
| `viewInC` | 不改 | `false` | |
| `middleC` | 不改 | `4` | |
| `expressions` | 不改（只管画，`render/expressions.ts`；播放照写的来） | `true` | |
| `textLang` | 不改声音；改存出去的 MusicXML `<part-name>` 用哪种语言（`project.ts partNames`，「语言只看歌自己」） | `"ui"` | 统筹说了：`"ui"` 是一个选择（跟界面），和以后的 `"default"` 不合并 |

### 每张纸（score.json `papers[]` + 这张纸的 MusicXML）

| 键 | 改不改声音 | 存的时候 | 没写时在哪当成什么 |
|---|---|---|---|
| `papers[].hidden`（隐藏的纸） | **改**：整首放和导出都跳过它（`arrange.ts songPlayOrder`；`groove.ts` 也按它跳）；本段视图点名放这一张时照放（`songOnlyPaper` 去掉隐藏） | 16-3 起每张都明写 true / false（`project.ts` 存 papers 那一段 `hidden: !!p.hidden`）；新建的纸内存里没有这一项（`PaperSeg.hidden` 可选），存的时候写 false | 运行时 `p.hidden` 为假 = 放、不折叠（`arrange.ts`、`groove.ts`、`engrave`） |
| `papers[].autoOttava`（这一段每个声部的自动八度线） | 不改 | 每个在场的声部明写 true / false | 内存 `looks[声部].autoOttava` 只存 false；没有 = 开（`project.ts` `!== false`；画的一侧同） |
| 大谱表（内存 `looks[声部].grand`） | 不改 | 在这张纸的 MusicXML 里（`<staves>2</staves>`） | 内存只存 true；没有 = 一行谱 |
| 这一段开头的谱号 | 不改（只画） | 这张纸的 MusicXML `<clef>`；score.json `parts[].clef` 一律写 `"auto"`（老写法） | 自动挑（`score/clef.ts`） |
| `papers[].manualBars`（人插的小节线） | **改**，但它不是视图：小节怎么数决定风格记号的轻重和摇摆的网格（`groove.ts meterPositions`）。是谱的结构，列在这里免得被误归进视图 | 明写 | — |
| `papers[].swells` / `unwritten` | 谱的内容（音内起伏、没写音高的音），不是视图 | 明写 | — |

### 每个声部（score.json `parts[]`）

| 键 | 改不改声音 | 存的时候 | 没写时 |
|---|---|---|---|
| `host`（合租：画在谁那一行） | 不改（只画；`score/merge.ts` 在排版那一侧；轨 / 乐手 / 混音台各是各的） | 16-3 起写主人的 id 或 null；不成立的照原样写回（`hostBroken`） | 自己一行 |
| `chords`（和弦选项：auto / stacked / fold） | 不改（和弦标级数、折叠成和弦名，只画） | 写，auto 也写 | `"auto"`（`song-view.ts`） |
| `clef` / `autoOttava`（声部级，老写法） | 不改 | `clef` 一律 `"auto"`，`autoOttava` 不写 | 按段的那一份 |
| `kind` | 不改 | 一律 `"pitched"` | — |

### 视图态（score.json `view`，内存 = `src/score/desk.ts Desk`；存时顺手捞、不标脏、不进撤销）

存：16-3 起每一项都明写（`desk.ts serializeDesk`）；没给（无头存 / 副本）= `freshDesk()` 那一份。读：`unserializeDesk` 各项各自宽容，不认识 / 越界 = 那一项按 `freshDesk()`。开歌时 `main.ts applyDesk` 把它们装回编辑器。

| 键 | 改不改声音 | 没写时 |
|---|---|---|
| `parts[声部].muted` / `solo`（静音 / 独奏） | **改，而且导出也改**：编辑器播放、mp3 导出、渲染缓存都只放 `audibleParts`（`core/render.ts audibleParts`：有独奏只出独奏的，否则出没静音的；`performance.ts renderMp3` / `prepare` / main 的渲染缓存键都用它）。开歌时从文件装回来——存的时候静了一个声部，下次打开导出的 mp3 里就没有它 | 都不静、都不独奏（`freshPartView`） |
| `parts[声部].hidden` / `only`（隐藏 / 只看它） | 不改（只管看） | 都看 |
| `mp3`（导出音质） | **改导出**：标准 = 立体声 192k、小文件 = 单声道 64k（`export/mp3.ts MP3_QUALITY`）；渲染缓存按它分 | `"standard"` |
| `scope`（本段 / 全部）+ `paper`（在哪张纸） | **改编辑器里 ▶ 放哪一段**（`performance.ts playSong`：本段 = 只放光标那张纸；`loopSpanOf`），**不改导出**（mp3 面板的范围是它自己的，只在这次打开里记着、默认整首，`main.ts mp3Scope`） | `"segment"`、第一张纸 |
| `pageFlow` / `scroll`（排法） | 不改 | 连续 |
| `mode`（打开进哪个模式） | 不改 | 写音 |
| `pad`（键盘的 1= / 时值 / 音域…） | 不改（输入态） | `freshPad` |
| `ref`（参考窗） | 不改 | 关 |
| `finder`（乐器目录翻到哪） | 不改 | `freshFinderMemo` |
| `pdf` | 退役（2026-11-12 起读到不理、不写） | — |

### MusicXML 里的纸张那一块（每张纸的 MusicXML 和压平件的 `<defaults>`；内存 = `Song.paper`）

| 项 | 改不改声音 | 存的时候 | 没写时 |
|---|---|---|---|
| 纸（A3 横 / A4 / A5 / A6 / 别的大小）、边距、谱的大小（staffMm）、舒适 / 紧凑（density） | 不改（排版、PDF） | **A5 + 舒适 + 没改谱的大小 = 不写 `<defaults>`**（`musicxml.ts` 73–74 行）；改纸的两个函数把「A5 舒适」存成内存里没有 `song.paper`（`song.ts` 1641–1651 行） | 运行时十来处 `song.paper ?? paperOf(DEFAULT_PAPER)` = A5 舒适：`ui/score-view.ts` 3 处、`score/song-view.ts`、`export/score-pdf.ts` 2 处、`app/main.ts` 2 处、`app/edit-lock-table.ts`、`score/song.ts` 2 处、`format/musicxml.ts` 写的一侧 |
| 别家的谱带来的大小 | — | 读：`paper.ts detectPaper`——宽高离 A3 横 / A4 / A5 / A6 差 2 mm 以内 = 当成那一种（只留边距 / 谱的大小 / 舒适紧凑）；都不像 = `kind: "other"` 带着 `widthMm` / `heightMm`（按值） | — |

### 这一张表的结论（会改声音的）

- **你先想到的三样都对**：`arrangement`、`papers[].hidden`、`view.mp3`。
- **另外查出来的**：
  - `view.parts[].muted` / `solo` —— 不只是播放：导出也只放 `audibleParts`，而且开歌时从文件装回来。存的时候静着的声部，下次打开导出的 mp3 里没有它。这是「视图态」里唯一一样会跟着文件走、又改导出的东西。
  - `view.scope` + `view.paper` —— 只改编辑器里 ▶ 放哪一段，不改导出。
  - `papers[].manualBars` 改声音（小节怎么数 → 轻重 / 摇摆），但它是谱的结构，不是视图。
- 要你定（不是我能定的）：静音 / 独奏跟着文件、又管导出——照第 16 条严格做（明写、导出面板上照实写「这几个声部静着，不进 mp3」），还是不让它管导出、导出永远是整首在场的声部？还有 `scope` 记在文件里、开歌时 ▶ 只放一张纸，算不算「改声音」？

---

## 表二：`src/render` 和 `src/score/paper.ts` 顶层的数，分三类

按 `grep '^(export )?const [A-Z_]'` 数出来 142 个顶层常数（不含生成的 `.gen.ts`）。很多是一张表或一串字形码，按「人会不会想调它」分三类：

### ① 规则的数（排版规则：人会想调、改了老歌跟着动；这一类收进模块）

| 文件 | 常数 | 管什么 |
|---|---|---|
| `score/paper.ts` | `SIZES`（四种纸的宽高和边距 mm）、`STAFF_MM` / `STAFF_MM_COMPACT`（舒适 7 mm / 紧凑 5 mm 的谱高）、`DEFAULT_PAPER`（A5）、`PAPER_KINDS` | 纸和谱的大小 |
| `render/layout-params.ts` | `PAPER_PARAMS`（每种谱种 × 舒适 / 紧凑：行距、弹簧曲线、挤压、最多拉伸…）、`ROW_PARAMS`（每种行 × 舒适 / 紧凑：上下留白、行高…）、`JIANPU_PAPER` / `JIANPU_ROW_PARAMS`、`JP_COZY` / `JP_COMPACT`、`LAST_MERGE`（最后一行并不并） | 版式的大表（这一个文件就是规则表） |
| `render/spacing.ts` | `LOOSE` / `DENSE` / `TIGHT`（音距曲线：时值 → 几个间距）、`SP_DEFAULTS`（音前后留白、空小节宽） | 音距 |
| `render/frame/params.ts` | `MARGIN`、`BAR_W`、`TITLE_H`（歌名那一条高）、`PAPER_H` / `PAPER_GAP`（曲段名那一条和纸之间）、`NAME_MAX`（谱前声部名最宽）、`SCROLL_TAIL`（横卷的尾巴）、`SYSTEM_LINE_W`、`LYRIC_EDGE`、`ROW_STEP` | 纸面的骨架 |
| `render/text/style.ts` | `LYRIC_EM`、`TEMPO_EM`、`JP_MAIN_EM`、`LYRIC_LOOK`（舒适 / 紧凑的歌词字号和压扁）、`LYRIC_MIN_SX`、`TEXT_STYLES`（每种字的字号 / 字重表）、`GHOST_DIGIT_K` | 字号 |
| `render/text/lyric-fit.ts` | `LYRIC_SPACE`、`HYPHEN_SX`、`GAP_MIN`、`GAP_FLOOR`、`DEFAULT_GAPS` | 歌词让路的规则（按节奏排） |
| `render/ornaments/index.ts` | `PIN_GAP`、`PIN_MIN`（发夹离字多远、最短多长）、`PIN_WORD`（长发夹改写 cresc. 的宽）、`DASH`、`RAMP_DASH`（渐到的虚线）、`PEDAL`（踏板线的几何） | 记号的摆法 |
| `render/staff/units.ts` | `KEY_LABEL_W`（「1=」那一格宽）、`CLEF_CUE`（行中谱号缩多少）、`STAFF_WIDTHS`（各种单元的宽） | 五线谱单元宽 |
| `render/frame/columns.ts` | `SLOT`（同一刻几种东西从左到右的先后） | 先后的规矩 |
| `render/staff/draw.ts` / `render/jianpu/draw.ts` | `STAFF_LANES` / `JIANPU_LANES`（谱上上下那几道的先后：强度、力度、八度线、跳转、速度、风格、小节号、和弦…） | 先后的规矩 |
| `render/jianpu/measure.ts` | `LEFT_CLEAR` | 简谱行首留白 |
| `render/frame/hints.ts` | `MAX_CLIMB`（提示字最多往上让几层） | 让路 |

大概 45 个名字（其中几张是表）。这一类就是「排版规则的数」：要进模块的就是它们，以后 user 想调的也是它们。

### ② 字形的数据（量出来的 / 字体给的；不是规则，改它 = 换字体或者重新量）

- `render/smufl.ts`：`GLYPH`、`DYN_GLYPH`、`PERC_CLEF`、`PERC_HEAD`、`PERC_SMUFL`、`W`（字形宽）、`ENGRAVE`（Bravura 的刻谱默认值）、`STEM_UP_SE` / `STEM_DOWN_NW` / `FLAG_ANCHOR_*` / `FLAG_W`（符干和符尾的锚点）。
- `render/staff/glyphs.ts`：`ART_GLYPH`、`GLYPH_BREATH`、`DYN_GLYPH`、`GLYPH_TUPLET`；`SHARP_POS` / `FLAT_POS`（调号里升降号的位置 = 记谱的定规）；`TOP_LINE` / `MID_LINE` / `BOTTOM_LINE`（五线谱几条线的位置）。
- `render/jianpu/glyphs.ts`：约 60 个（`FS`、`DIGIT_*`、`UL_*`、`ACC_*`、`DASH_*`、`BAR_*`、`CHORD_*`、`HEAD_*`、`GLYPH_INK`、`LETTER_EM`…）——简谱字形照样张量的，`FS` 是基准，别的大多是 `FS` 的倍数。
- `render/signs.ts`：`DYN_G`、`ART_SIGNS`、`DYN_SIGNS`、`SIGNS`（记号 → 画成哪个字形）。
- `render/text/style.ts`：`TEXT_FACES`、`STEM_REGULAR` / `BOLD_STROKE` / `SMALL_STEM_K`；`render/text/baseline.ts INK_EST`（字面量的估计）。
- `render/ornaments/index.ts`：`PEDAL_GLYPH`、`PEDAL_UP_GLYPH`；`render/staff/units.ts CLEF_GLYPH`；`render/jianpu/glyphs.ts KIT_CHAR`。

大概 85 个（大头是简谱那一个文件）。不进模块，留在原处。

### ③ 算法内部的（没人想调；改了是改算法）

`spacing.ts EPS`、`skyline.ts STEP`、`frame/units.ts MIN_PLAIN` / `NOTATABLE` / `RATIOS`（连音的比例）、`frame/cell.ts ORIGIN`、`stems.ts LOCAL`、`frame/lanes.ts INK_UP_TO`、`frame/furniture.ts NO_LINE_START`（行首禁则——排版的通行规矩）、各种 `COLUMN_KIND` / `DRAWERS` / `GEOMETRY` / `NOTATIONS` / `FOLDED_TOKEN_KINDS`（登记表）、`svg.ts STANDALONE_CSS`、`text/style.ts VARIANTS` / `DEFAULT`、`jianpu/note-cell.ts T0` / `UL_DROP`、`jianpu/place.ts PLACE` / `NOTE_SIGN_PLACE`、`render/staff/glyphs.ts` 和 `stems.ts` 里重复的 `TOP_LINE` / `MID_LINE`。大概 15 个。不进模块。

拿不准、要你看一眼的：`SLOT` / `STAFF_LANES` 这类「先后顺序」我算进①（人会想换上下的先后），也可以说是③；`SHARP_POS` / `FLAT_POS` 是记谱的定规，我算进②。

---

## 提案 .h

```ts
// src/render/look/index.ts（提案；第 17 条）——「现在怎么画」只在这里定。
// 夹在「歌」和「排版」之间：给它歌和当时的情况，交回一整份「现在怎么画」。"default" 现在等于什么、排版规则的数（表二①）都在这里面；
// 模块之外不许判断 "default"、不许有「没写就当成某个值」（守卫：src 里除了这个目录，没有人比较 === "default"、没有人 import 表二①那几个文件）。

/** 文件里一项显示设置的写法：没选 = "default"（界面上叫「跟着软件」）；选了 = 具体的值。 */
export type Pick<T> = "default" | T;

/** score.json 歌级（替掉现在的 SongLookKey 那十样里不改声音的九样；arrangement 改声音，不进来）。门口：没写 = "default"（就是这个字，不补当时的默认值）。 */
export interface LookChoices {
  lyricFit: Pick<"rhythm" | "lyrics">;
  barNumbers: Pick<"line" | "off">;
  notation: Pick<string>;            // 谱种 id；不认识的值原样留
  chordTags: Pick<boolean>;
  viewInC: Pick<boolean>;
  middleC: Pick<number>;
  expressions: Pick<boolean>;
  textLang: Pick<string>;            // "ui" 是一个选择（跟界面），和 "default" 不合并
  paper: Pick<PaperChoice>;          // 纸张（见下）
  density: Pick<"cozy" | "compact">; // 舒适 / 紧凑
  staffMm: Pick<number>;             // 谱的大小（mm）；别家的谱带来的、或人改过的
}
/** 纸张存选择：四种之一，或者按值带着的一张（别家的谱带来的大小 / 以后人自己填的）。MusicXML <defaults> 的数是写给别的软件看的，从「现在怎么画」那一份算出来。 */
export type PaperChoice = { kind: "A3L" | "A4" | "A5" | "A6" } | { kind: "other"; widthMm: number; heightMm: number };
/** 边距：跟着纸（四种纸各有自己的）；别家的谱带来的边距按值带着。 */
export interface PaperMargins { marginMm?: { l: number; r: number; t: number; b: number } }

/** 当时的情况（不在文件里）。 */
export interface LookContext {
  locale: Lang;                      // 界面语言（textLang = "ui" 时用）
  target: "screen" | "print";        // 屏幕 / PDF（现在两边用同一份，留着口子）
}

/** 交回的那一份「现在怎么画」：每一项都是具体的值，排版只读它。 */
export interface Look {
  lyricFit: "rhythm" | "lyrics"; barNumbers: "line" | "off"; notation: NotationId; chordTags: boolean; viewInC: boolean; middleC: number; expressions: boolean; textLang: Lang;
  paper: { kind: PaperKind | "other"; widthMm: number; heightMm: number; marginMm: { l: number; r: number; t: number; b: number }; density: "cozy" | "compact"; staffMm: number };
  /** 排版规则的数（表二①）：版式表、行参数、音距曲线、字号表、纸面骨架、记号摆法、先后顺序。按谱种和舒适 / 紧凑已经挑好。 */
  rules: LayoutRules;
  /** 每一项是人选的还是跟着软件（页面设置「跟着软件（现在是：X）」用）。 */
  from: { readonly [K in keyof LookChoices]: "chosen" | "default" };
}
export function lookOf(song: Song, ctx: LookContext): Look;

/** 页面设置：改一项（选具体的值，或者改回 "default"）；「全部跟着软件」= 每一项都写 "default"。 */
export function withLook<K extends keyof LookChoices>(song: Song, key: K, v: LookChoices[K]): Song;
export function allDefault(song: Song): Song;
/** 页面设置第一格的字：「跟着软件（现在是：X）」的 X。 */
export function defaultText<K extends keyof LookChoices>(key: K, ctx: LookContext): string;
```

score.json 里纸张那一项的形状（提案；格式要升一个小版本，归你和 user 定）：

```json
"look": {
  "lyricFit": "default", "barNumbers": "default", "notation": "default", "chordTags": "default", "viewInC": "default",
  "middleC": "default", "expressions": "default", "textLang": "ui",
  "paper": "default",                       // 或 { "kind": "A4" } / { "kind": "other", "widthMm": 215.9, "heightMm": 279.4 }
  "marginMm": "default",                    // 或 { "l": 12, "r": 12, "t": 15, "b": 15 }（别家的谱带来的，按值）
  "density": "default", "staffMm": "default"
}
```

- 已经写着具体值的歌（16-3 起每一项都明写了）：照写着的读、算选过的，不猜、不转换。所以 16-3 之后存过的歌，打开后每一项都是「选过的」；页面设置里那一项显示具体值，旁边「跟着软件」一点就改回。
- 纸张：现在 A5 舒适存成「不写 `<defaults>`」，读的时候没写 = A5。新的做法下 score.json 里明写 `"paper": "default"`；MusicXML 的 `<defaults>` 每次都按「现在怎么画」那一份写出去（给别的软件看），读的时候 MusicXML 里的 `<defaults>` 只在 score.json 没有这一项（别家的谱）时才用，按 `detectPaper` 认成四种之一或者按值的 `other`。

### 要你定的

1. 放的位置：score.json 里新开一个 `look` 对象把这些收在一起，还是照现在散在顶层？（散在顶层就是现在的样子，只是值多一个 `"default"`。）
2. 每张纸 / 每个声部的几样（自动八度线、大谱表、和弦选项、合租）要不要也有「跟着软件」？我的看法：自动八度线、和弦选项有软件的默认（开 / auto），可以有；大谱表、合租是人对这一首做的决定，没有「软件的默认」可跟，不给。
3. 表一结论里那两件：静音 / 独奏管不管导出；`scope` 算不算改声音。
4. `spacing` 已经没人读（v0.16.43 起），这一轮顺手退役吗？
</content>
