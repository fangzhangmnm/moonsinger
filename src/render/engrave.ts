// engrave.ts —— 一首歌（几张纸 × 几个声部）→ 五线谱的绘图指令 + 命中数据（纯函数，Node 里可测）。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写；
//   2026-10-08 多声部多纸（0.5.0，Claude Fable 5.1；user「总谱式上下叠」「toggle visibility, mute, solo」「我以为纸就是曲段」「每个sheet的track数量当然不同」）。
// 范围：高音谱表；谱头（每条 track 开头三个记号 token：调号 / 拍号 / 速度）+ 中途的记号 token；符头 / 符干 / 符尾 / 符杠 / 附点 / 临时记号（小节内记忆）/ 加线 / 休止；
// 拆开的时值用连音线连；数据里的 tie（「−」跨小节线开的音）也画连音线；三 / 五 / 六 / 七连音画括号和数字；
// 小节线：按拍号自动数（autoBars，默认开；只画、不进数据，和存 MusicXML 时切小节同一个规则）+ 人插的「|」= 从这里重新数
//   （弱起 = 写完弱起的音按一下「|」；user「按拍号自动画小节线，手插「|」= 从这里重新数 可以啊，试试，然后自动加小节也是可以toggle的，默认开」
//   「嗯弱起就是你写两个音然后加一个小节线，电脑就自动适应了」）。跨过自动小节线的音画成连起来的两段（数据里还是一个音）。
//   拍数和拍号对不上的小节只轻标（第一小节当弱起不标）；歌词在音符下，英文断开处画连字符，拖腔画延长线；空音高的音画淡色。
// 写（光标）：光标 = 一条零宽的竖线，不占排版宽度、不画预览、不打断符杠——挪光标、写 / 改切换时谱面一动不动
//   （user「插入不要在谱上显示音符预览，也不要让谱的排版抖动」；下一个音的时值 / 升降在 pad 工具条和状态行）；
//   点谱面写音 2026-10-07 拿掉（user「先去掉触碰加音符的功能，以后用专门的toolstate做」）。改（选中）：选中的一段高亮。
// 放不下就像文字一样折行，优先在小节线处折；只超出一点的小节压进这一行（整行压紧 ≤ 15%）。右端对齐只给「不是最后一行、而且已经排到六成以上」的行（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）：
//   正在写的最后一行不对齐 = 打字时前面的音不晃；一行写满折到下一行时，上一行会拉开一次。
// 多声部（总谱式）：一张纸 = 一块；纸内各声部按 **tick**（从纸的开头数）对齐成列——同一列里各声部的东西左边对齐、列宽 = 最宽的那个；
//   一行 = 几条谱（每个显示的声部一条）上下叠，左边一根竖线连着；折行只在「有小节线、且没有哪个声部的音跨过这一拍」的列后面。
//   小节线、调号、拍号是各声部自己的画法（契约 §7.8）；速度只画在第一个声部上面；歌手牌（声部名）在每张纸第一行各条谱的左边。
//   纸顶一条曲段名（多于一张纸或填了名字才画）+ 右边「⋯」（纸的菜单）；最底下「＋ 新的纸」（只在编辑器里画）。

import { TEXT_STYLES, lyricSizePx, hyphens, LYRIC_MIN_SX, isBlockScript, textPx, type TextRole, fitLyrics, lyricBlockSx, LYRIC_SPACE, HYPHEN_SX, type LyricFit, type LyricItem, type LyricGaps, type TextMeasure, lyricLook, lyricWidth } from "./text/index.ts";
import { _tIn, type Lang } from "../i18n/index.ts";
import { type Song, type PaperSeg, type Token, type Focus, type Staff, isTimed, tempoOwner, sheetEndBpm } from "../score/song.ts";
import { parseArrangement } from "../score/arrange.ts";
import { curveOf, SP_DEFAULTS } from "./spacing.ts";
import { type PercInfo } from "../gm/percussion.ts";
import { MELISMA_MARK, lyricShow } from "../score/lyrics.ts";
import { Skyline, primInk, shiftPrim } from "./skyline.ts";
import { songInC } from "../score/view-in-c.ts";
import { songViewOf } from "../score/song-view.ts";
import { type HarmonyRead } from "../theory/index.ts";
import { SCROLL_TAIL, ABBR_REF, NAME_MAX, NAME_MIN, ROW_STEP, MARGIN, BAR_W, TITLE_H, PAPER_H, PAPER_GAP, CTL_H, SYSTEM_LINE_W } from "./frame/params.ts";
import { PAPER_PARAMS, ROW_PARAMS } from "./layout-params.ts";   // 排版参数表（纸一级按谱种、行一级按行的种类）
import { wrapTitle } from "./frame/furniture.ts";
// 五线谱这一种：只从它的入口拿（施工单 1b-9 守卫 1：框架不直接 import 字形表、符干、谱号模块）
import { BUILD, DRAWERS, NOTATIONS, type RowKind, type FoldFamily, type StaffTrack, type Unit, type Chunk } from "./notations.ts";   // 谱种的表（第四刀）：框架只经过它拿画法，不直接 import staff/ / jianpu/
import type { LyricPart, LyricSpot } from "./frame/lyric-spots.ts";
import { INK_UP_TO, type LaneKind } from "./frame/lanes.ts";
import { mergeColumns, arrangeColumns, type ArrangeTrack } from "./frame/arrange.ts";

/** tok = 这个图元属于哪个 token（id）：写字头 / 选区 / 强调色不进排版，score-view 按 data-tok 在 DOM 上开关 class（W-17 第 1 刀，2026-10-15）。 */
export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string; tok?: number }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string; size?: number /* px，默认 4 sp */; tok?: number }
  | { t: "text"; x: number; y: number; s: string; cls?: string; size?: number /* px，默认歌词字号 */; anchor?: "start" | "middle" | "end"; tok?: number; /** 横向压窄（以 x 为中心；1 = 不压）：紧凑档的歌词 0.85（刀 2，user 11-09「可以」）。 */ sx?: number }
  | { t: "path"; d: string; cls?: string; tok?: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string; tok?: number };
// 图元里原来还有一种「icon」（界面图标库的图标）：只有两颗钮和纸角钮用，刀 1 搬去覆盖层之后没人画了，2026-11-08 Fable 审刀 1 时删掉——排版器在类型上就画不出界面图标。

/** 要画的一个声部（顺序 = 总谱从上到下；隐藏的不在这里）。 */
export interface PartView { id: string; name: string; abbr?: string; colorIdx?: number; empty?: boolean; first?: boolean; /** 只有合租叠出来的虚拟行用（v0.16.88 起真声部的谱号 / 大谱表按段算，见 resolveSongLooks）。 */ staves?: 2; hidden?: boolean; badges?: string[];
  
  mono?: boolean; xHead?: boolean; perc?: PartPerc; ignores?: readonly string[]; lyricMute?: ReadonlySet<number>; noLyrics?: string }   // noLyrics = 台上这位不唱字（乐器 / 元音版）：值 = 说给人听的那句   // lyricMute = 台上这位唱不出来的歌词（音的 token id；画灰，src/score/lyric-check.ts）   // mono = 台上的是单声乐器（月读 / 元音…）：叠音里下面的音画灰（只唱最上面）   // staves 2 = 大谱表（两行一组、花括号；上高音下低音）
//   empty = 还没人上场（名字画淡色）；first = 歌里第一个声部（速度画在它上面）；clef = 谱号；hidden = 隐藏的：不画谱、缩成一条细行（点它开歌手牌）；badges = 名字下面的角标（静 / 独 / 只看它）
/** 台上那位是鼓 / 音效（v0.10.27；src/gm/percussion.ts percKindOf）：kit = 整套鼓（写的音高 = 敲哪个鼓，五线鼓谱）；one = 固定敲一件（一线谱）。 */
export type PartPerc = { kind: "kit" } | { kind: "one"; info: PercInfo; key: number };   // key = 固定敲的那个键（合租全是鼓时并成一套鼓用）
export interface EngraveOpts {
  width: number;                         // px，谱面板宽
  sp: number;                            // px，五线谱间距
  at: Focus;                             // 光标 / 选中在哪条 track
  /** 写字头在光标所在声部的尾巴后面（写着写着往后长）：最后一行照旧画到右边（写的地方）。光标 / 选区 / 写字头的蓝 / 强调色都不进排版——
   *  排版只看谱，score-view 在 ink 层画光标和选区带、按 data-tok 开关 class（W-17 第 1 刀，2026-10-15 Claude Fable 5.1）。 */
  tailOpen?: boolean;
  parts: PartView[];                     // 显示的声部
  /** 量字的尺子（文字模块 src/render/text/：宿主 createTextMeasure(原始尺子)，一次排版一把）。 */
  measure: TextMeasure;
  /** 编辑器要排版留的地方（刀 1，2026-11-08 Opus 5.5；施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §3.1）：只是尺寸，画什么归覆盖层（src/ui/score-overlay.ts）。
   *  印 / PDF = 不给。underPaper = 每张纸底下留一条多高（sp；虚线框「＋ 声部」那一截，分页时不留）；tail = 整首最下面留一条多高（「＋ 新曲段」；分页 = 最后一页纸外面、只撑高画布）；
   *  famGap = 合租展开着的一家，名字和谱之间多让多少（括号）；navRoom = 多张纸时曲段名那一条右边给曲段控件让多宽（只缩曲段名的点击框）。 */
  chrome?: { underPaper?: number; tail?: number; famGap?: number; navRoom?: number };
  /** 合租的每一家都叠起来、不看光标在哪（v0.10.29：听模式；user「每一家点开收拢的ux怎么算」→ AI 提「听模式里所有家一律叠起来 / 写的模式光标在哪家哪家展开」→「12 同意」）。 */
  foldAll?: boolean;
  autoBars?: boolean;                    // 按拍号自动画小节线（默认开）；关 = 只画人插的「|」
  /** 分页排法（user 2026-10-08「显示法还加一个分页？可以预览打印，要求和之后生成的pdf wysiwyg」）：按纸高分页、画页框 + 页码；h = 整页高、l r t b = 四边边距（sp）。没有 = 连续（一张长纸）。 */
  page?: { h: number; l: number; r: number; t: number; b: number };
  /** 歌词行再往下让多少（sp）：PDF 选了萌神拼音时，汉字头上那一截拼音要地方（src/export/score-pdf.ts 按字形墨迹算；屏幕上 = 0）。 */
  lyricRaise?: number;
  /** 只画这一张纸（曲段）：视图范围「本段」（user 2026-10-08「不同曲段应该是不同页，而不是一起显示」「视图里面应该也有个连续和分段」）。 */
  onlyPaper?: string;
  /** 横卷（v0.9.35；user 2026-10-10「那个无限往右的总谱模式也做一下」）：不折行，每张纸一行、一直往右；width 只管歌名 / 作者栏 / 纸的控件那一屏，
   *  排出来的 Layout.width = 最长那张纸的右端（+ 尾巴，光标停在最后能接着点）。 */
  scroll?: boolean;
  /** 连续排法的纸边距（sp）：和分页同一张纸的几何，只是不断页（user 2026-10-08「连续和分页看到的行宽应该是一样的」「连续只是没有了断页，但是每一行还是一样的」）。 */
  margins?: { l: number; r: number; t: number; b: number };
  // 按 C 调看、和弦标级数（v0.16.10 / v0.16.13 起是这里的两个选项）：谱面分家第三刀起是歌里的设置，排版自己读（src/score/song-view.ts songViewOf），不再从选项进来。
  /** 字的尺子比谱的尺子大多少（刀 2；src/score/paper.ts textScaleOf：舒适 = 1、紧凑 = 1.4）：歌名 / 作者栏 / 编排 / 曲段名、声部名 / 简写、歌词、速度 / 风格 / 反复的字、
   *  「1=F」、小节号、和弦级数、页码，连同它们周围留的地方，都按 sp × textScale 量；字形、线、cresc. / 8va / 「吸」/ 推定的灰字照旧跟谱。量字的换算在文字模块里（measure.width）。没给 = 1。 */
  textScale?: number;
  /** 界面语言（谱面分家施工单 1b-3）：排版里要写的几个字（「编排」、编排写错的说明、换气后面的「吸 / 深吸」）按它翻。明着传，排版不读这一页的当前语言（设计稿第 3.9 节守卫 8：同样的输入出同样的版面）。 */
  locale: Lang;
  /** 只给测试用（刀 4b 守卫「注解不改版面」）：注解（ann）一个都不画。开关两边可印的图元必须逐个相同——注解只看天际线、不写。 */
  __noAnn?: boolean;
}

/** 一条谱行（某张纸、某行、某个声部）：top/bottom = 这一条占的竖直范围（含歌词）。staffTop / staff = 五线谱这一行自己的数据（staff/geometry.ts StaffRowData；挪成行的 data 归第二刀）。 */
export interface SystemBox { top: number; staffTop: number; bottom: number; paper: string; part: string; sys: number; staff: Staff; /** 这一行用哪种画法（谱面分家第四刀；每一行都写）：staffTop = 这一行的原点（五线谱 = 第五线）。 */ kind: RowKind; /** 五线谱右端（px；播放时的小节底色右边界用，v0.10.12）。 */ x1?: number;
  /** 这一行谱上真有墨的上下沿（px）：音（含叠着的房客）、符干、跳音 / 重音、力度那几道、八度线、歌词；不含速度 / 风格记号（那是整张谱的）。播放的灰块按这个（v0.10.26）。 */
  inkTop?: number; inkBottom?: number }   // staff = 大谱表里是上（1）还是下（2）
export interface HitNote { index: number; system: number; x: number; y: number; w: number; d: number; /** 合租的声部 2（v0.10.28）：下标指这条虚拟 track（`…~v2`），不是这一行那一位的。 */ part?: string }
export interface Slot { caret: number; system: number; x: number; end?: true; /** 补齐的淡色小节的开头：点这里 = 光标在尾巴 + 先补这么长（tick）的休止再写（v0.10.6）。 */ lead?: number }   // end = 行末那个落点（光标在下一行开头的那个位置，点在这一行行末时画在这儿）
/** 光标画在哪（W-17 第 1 刀：排版不认光标，只给出每个 caret 位置该画的地方，score-view 按 EditorState 挑）：老规矩 = 同一 tick 上排在小节线 / 记号后面、音前面；
 *  end = 点在行末放的（画在上一行末尾）；lead = 补齐的小节里；shift = 那里的谱号 / 八度线位移（鬼音符用）。 */
export interface CaretHead { caret: number; system: number; x: number; shift: number; end?: true; lead?: number }
export interface LyricHit { index: number; system: number; x: number; y: number; tight?: true }   // x = 歌词中心，y = 基线；tight = 按节奏排时这个字挤（画灰，歌词框上说一声）
/** 记号（调号 / 拍号 / 速度）的点击区域（px）：点了就地改。谱头的调号 = 谱号 + 调号那一块（C 大调没有升降号也点得到）。 */
export type PartToggle = "muted" | "solo" | "hidden" | "only";
export type PartToggles = Record<PartToggle, boolean>;
/** 名字那一栏至少多宽（sp）：屏幕上覆盖层在名字上面放两颗 3.0 的大钮（src/ui/score-overlay.ts TG_BTN）；PDF 照样这么宽 = 预览的版面 = PDF（屏幕和 PDF 同一条规矩；刀 1 起这只是一个几何常数，排版器不画钮）。 */
export interface MarkHit { index: number; kind: "key" | "time" | "tempo"; system: number; x: number; y: number; w: number; h: number }
/** 谱号 / 八度线的点击区域（v0.9.28）：start = 每行开头的谱号（index = 管着它的谱号记号，−1 = 声部自己的谱号）；mid = 行中间的谱号记号；ottava = 八度线开头的字。 */
export interface ClefHit { kind: "start" | "mid" | "ottava"; paper: string; part: string; index: number; system: number; x: number; y: number; w: number; h: number; /** 自动画的八度线（v0.9.37）：index = −1，这一段的起止下标和几度。 */ run?: { from: number; to: number; shift: 1 | 2 | -1 } }
/** 力度记号 / 渐强渐弱的点击区域（px）：点 = 小菜单（改 / 删），长按拖 = 挪到别的音上（2026-10-08 Opus 5.5）。渐强渐弱跨行 = 每行一块。 */
export interface DynHit { index: number; kind: "dyn" | "hairpin" | "groove" | "nav"; system: number; x: number; y: number; w: number; h: number }   // groove = 风格记号（拍子轻重；点了同一个小菜单、长按拖）
/** 休止的位置（px）：力度记号 / 渐强渐弱能拖到休止上（2026-10-08 user「力度符号应该能拖动到休止符上」）。 */
export interface RestHit { index: number; system: number; x: number; y: number; w: number }   // y = 谱的中线（点 / 框选用）
/** 纸面最上面的歌名那一条（点了就地改）。 */
export interface TitleHit { x: number; y: number; w: number; h: number; baseline: number; size: number }
export interface Box { x: number; y: number; w: number; h: number }
export interface Layout {
  prims: Prim[]; width: number; height: number; sp: number;
  /** 字的尺子（px）= sp × textScale（刀 2）：覆盖层的钮、提示字、虚线框的字按它，紧凑档不跟着谱缩。 */
  tp: number;
  /** 和弦里主音以外的那几个符头（播放时一起亮；不进 notes——点 / 拖还是按整个音；v0.10.23，user「音符高亮忘了做和弦的其他音的高亮」）。 */
  chordHeads: { index: number; system: number; x: number; y: number; w: number; part?: string }[];
  /** 和弦级数的点击框 + 认出来的候选（这首歌开着和弦标级数才有；点了 = 候选小菜单）。 */
  chordTags: { x: number; y: number; w: number; h: number; read: HarmonyRead; /** 哪一行（systems[system] 的 paper / part）、那条 track 第几个 token（挑读法写回去用，v0.16.87）。 */ system: number; index: number }[];
  /** 每张纸第一行各位的名字块（刀 1 锚点）：x0 = 色点左边、x1 = 最长那行名字的右边、top = 第一行名字的上沿（px）。覆盖层把两颗大钮摆在它上面、整排对它居中。 */
  names: { paper: string; part: string; x0: number; x1: number; top: number }[];
  /** 合租叠起来的谱行（下标 = systems 里的）：只读——点了不写、不放光标，点名字拆开（v0.10.25，user「host也应该只读，只有展开时才能编辑」）。 */
  sharedRows: number[];
  /** 合租叠起来的那一行画的是哪条虚拟 track（键 = "纸 id:主人 id"；v0.10.28，src/score/merge.ts）：这一行点击区的下标指的是它，不是主人自己的 track。 */
  virtual: Record<string, Token[]>;
  /** 每个小节在哪（v0.10.28）：这张纸上的 tick 区间 + 画在哪一行（systems 下标）、小节里第一个东西的 x（px）。播放的小节底色按播放的 tick 查这个——
   *  不再按「最晚开始的那个音」找（跨小节的长音 / 连音线后半截没有自己的点击区，小节底色就停在上一小节；user「小节高亮也算错了…碰到跨小节的音小节高亮没有update」）。 */
  measures: { paper: string; t0: number; t1: number; row: number; x: number }[];
  /** 合租展开着的那一家（v0.10.29；刀 1 起只是锚点 = chrome.famGap 给了才有）：这一家的几行在哪（括号由覆盖层画，点它 = 光标挪出这一家）。user「把这一家的几行括在一起…点这条括号等于「光标挪到这一家后面紧挨着的那位」…可以」。 */
  families: { paper: string; host: string; x: number; y: number; w: number; h: number }[];
  systems: SystemBox[]; notes: HitNote[]; slots: Slot[]; heads: CaretHead[]; lyrics: LyricHit[]; marks: MarkHit[]; dyns: DynHit[]; rests: RestHit[]; title: TitleHit; clefs: ClefHit[];
  arrangement: TitleHit | null;                 // 编排那一行（只在「全部」视图里有；点了就地改）
  credits: Box | null;                           // 作者栏那一块的点击区域（px；空着 = null）
  /** 作者栏第一行在哪（刀 1 锚点）：x = 右端（靠右写）、y = 基线、size = 字号（px）。空着时覆盖层在这里写浅色提示「作者」、点它 = 改作者栏。 */
  creditsLine: { x: number; y: number; size: number };
  /** 版心的左右（px；刀 1 锚点）：纸角的小钮、曲段控件靠它右端摆。 */
  content: { left: number; right: number };
  /** 调号位置上没有升降号的那几处（刀 1 锚点；专业模式，按 C 调看时没有）：覆盖层在这里写淡的「1=C」，点它 = 谱头面板。x / y = 字的起点和基线（px）。 */
  /** s = 写什么（「1=C」/ 小调「6=A」；v0.16.83）。 */
  keyHints: { system: number; index: number; x: number; y: number; size: number; s: string }[];
  /** 整首最下面留的那一条（chrome.tail 给了才有）：覆盖层在里面画「＋ 新曲段」。 */
  tail: (Box & { paper: string }) | null;
  /** 每行每根小节线的 x（px；播放时的小节底色用，v0.10.12；只是多带的数据，不改任何位置）。 */
  bars: { system: number; x: number }[];
  parts: (Box & { paper: string; part: string })[];   // 歌手牌（每张纸第一行各条谱左边的声部名）的点击区域
  /** 每张纸：曲段名那一条（shown = 画了）、占的竖直范围。刀 1 起曲段控件（‹ k/n › 只看本段 ⋯）归覆盖层，这里只给锚点：
   *  under = 纸底下留的那一条（chrome.underPaper，虚线框）；hidden = 这张纸隐藏着（全部视图里不排、不占地方：top = bottom，v0.16.34 起；原来折叠成一条）；note = 本段视图里隐藏纸顶上那一条说明；
   *  empty = 这张纸上没有声部时空着的那一条；hiddenParts = 这张纸上有、但隐藏着（不排、不占地方）的声部（覆盖层的「隐藏 N」）。 */
  papers: { id: string; title: (TitleHit & { shown: boolean }); top: number; bottom: number; under?: Box; hidden?: boolean; note?: Box; empty?: Box; hiddenParts: string[] }[];
  pageX: { left: number; right: number };        // 分页时版心左右的边距（px；svg 的 viewBox 往左扩这么多，页框画在负 x）；连续 = 0
  pages: { top: number; h: number }[];           // 分页时每页占的竖直范围（px）；连续 = []
  shortBars: number;   // 拍数和拍号对不上的小节有几个（状态行用；第一小节当弱起不算）
  /** 每行歌词的基线 y（px；2026-10-21）。 */
  lyricYs: number[];
}
// Layout 是平数据（worker → 主线程 structuredClone 原样过线；谱面分家第二刀起没有现算的函数：纵向 ↔ 第几级、光标 / 鬼音符 / 选区带的几何 = staff/geometry.ts 的纯函数，吃 systems[r]）。




/** 排版：只出平数据（屏幕上同步那条路、worker、PDF、测试都是这一份）。 */
export function engrave(song: Song, o: EngraveOpts): Layout {
  if (!o.locale) throw new Error("engrave: opts.locale is required (the layout never reads the page language itself)");
  // 每张纸每个声部怎么画（谱号 / 大谱表 / 自动八度线，v0.16.88 按段；自动的按整首一路挑，和视图无关）——按 C 调看也按实际的音挑：换个看法谱号不跳。鼓 / 固定敲一个键的不自动变大谱表
  const lookAt = BUILD.looks(song, new Set(o.parts.filter((p) => p.perc || p.xHead).map((p) => p.id)));
  const songLook = songViewOf(song);   // 这首歌怎么看（谱面分家第三刀：歌里的设置，只此一处读；按 C 调看的换算之前读）
  if (songLook.viewInC && songLook.notation !== "jianpu") { const perc = new Set(o.parts.filter((p) => p.perc).map((p) => p.id)); song = songInC(song, (id) => perc.has(id)); }   // 按 C 调看：先换算再排（鼓不换）
  const sp = o.sp, P = (v: number) => v * sp, ts = o.textScale ?? 1, T = (v: number) => v * sp * ts;   // P = 谱的尺子；T = 字的尺子（刀 2：紧凑档 ts = 1.4，字和它周围留的地方照舒适档）
  const density = songLook.density;
  const PPAR = PAPER_PARAMS[songLook.notation][density];   // 排版参数表（layout-params.ts）：纸一级按这首歌的谱种；行一级（rowPar）按这一行的种类
  // 分页：第 k 页从 pageTopY(k) 起、高 PG.h；内容只放在上下边距之间；放不下的整块（一行谱 / 曲段名 + 第一行 / 细行）挪到下一页
  const PG = o.page ?? null, PAGE_GAP = 3, MX = o.page ?? o.margins ?? { l: 0, r: 0, t: 0, b: 1.5 };   // MX = 纸的边距（连续 / 分页同一套）
  const pageTopY = (k: number) => P(k * ((PG?.h ?? 0) + PAGE_GAP));
  const contentTop = (k: number) => pageTopY(k) + P(PG?.t ?? 0), contentBottom = (k: number) => pageTopY(k) + P((PG?.h ?? 0) - (PG?.b ?? 0));
  let pageNo = 0;
  const TOP = P(MX.t);
  const SYS_GAP = PPAR.sysGap;
  const prims: Prim[] = [];
  if (o.__noAnn) { const push = prims.push.bind(prims); prims.push = (...ps: Prim[]) => push(...ps.filter((p) => !/(^|\s)ann(\s|$)/.test(p.cls ?? ""))); }
  const autoBars = o.autoBars !== false;
  const baseRight = o.width / sp - MARGIN;
  let right = baseRight, sheetRight = baseRight;   // 横卷：每张纸排完 right = 这张纸内容的右端 + SCROLL_TAIL；sheetRight = 最长那张
  const PART_EM = TEXT_STYLES["part-name"].em, tx = (role: TextRole) => textPx(role, sp, ts);
  /** 这种字跟哪把尺子（字的尺子 = ts、谱的尺子 = 1）；TR = 按这种字的尺子量的长度（字周围留的空隙跟着字走）；mw = 这种字写这串多宽（sp，P 的单位）。 */
  const RS = (role: TextRole) => (TEXT_STYLES[role].ruler === "text" ? ts : 1), TR = (role: TextRole, v: number) => v * sp * RS(role);
  const mw = (role: TextRole, str: string) => o.measure.width(role, str, sp, ts);   // 换算在文字模块里（src/render/text/measure.ts；user 11-09「深模块窄接口统一一下风格」）
  const nameW = (s: string) => mw("part-name", s);   // sp（名字跟字的尺子：紧凑档同一个名字占的 sp 多 1.4 倍）
  const NMAX = NAME_MAX * ts;   // 名字一栏最宽（字的尺子）
  /** 声部名一列最宽 NAME_MAX（sp），再长就折行，不占五线谱的地方（user 2026-10-08「谱子前面的乐器名字如果很长的话应该换行而不是占用五线谱的空间」）。
   *  英文按词折、汉字按字折、一个词本身太长再按字母折；单谱表最多 3 行、大谱表 5 行，再多末尾「…」（全名在歌手牌里）。 */
  const nameLines = (name: string, staves: number): string[] => {
    if (nameW(name) <= NMAX) return [name];
    const toks = name.match(/[A-Za-z0-9'’.\-()&]+\s*|\s+|./gu) ?? [name], lines: string[] = [];
    let cur = "";
    for (const t of toks) { if (!cur.trim() || nameW((cur + t).trimEnd()) <= NMAX) cur += t; else { lines.push(cur.trimEnd()); cur = t.trimStart(); } }
    if (cur.trim()) lines.push(cur.trimEnd());
    const out = lines.flatMap((l) => {
      if (nameW(l) <= NMAX) return [l];
      // 一个词自己就放不下：拉丁字母断开处加连字符、最后一截至少三个字母（F-207，user 11-06：iPad 上 Synthesizer 被折成「Synthesiz / er」断在词中间）；汉字照旧按字折
      const latin = /^[A-Za-z0-9'’.\-()&]+$/.test(l), hy = latin ? "-" : "";
      const ps: string[] = []; let c = "";
      for (const ch of [...l]) { if (c && nameW(c + ch + hy) > NMAX) { ps.push(c); c = ch; } else c += ch; }
      if (c) ps.push(c);
      if (latin && ps.length > 1) {
        const last = ps.length - 1, need = 3 - [...ps[last]].length, prev = [...ps[last - 1]];
        if (need > 0 && prev.length > need + 2) { ps[last] = prev.slice(-need).join("") + ps[last]; ps[last - 1] = prev.slice(0, -need).join(""); }
        for (let k = 0; k < last; k++) ps[k] += hy;
      }
      return ps;
    });
    const max = staves === 2 ? 5 : 3;
    if (out.length > max) { out.length = max; let last = out[max - 1]; while (last && nameW(`${last}…`) > NMAX) last = [...last].slice(0, -1).join(""); out[max - 1] = `${last}…`; }
    return out;
  };

  // 纸面最上面：歌名 + 作者栏 + 纸的小钮
  // 歌名 2.8 个谱线间距（原来 1.9 ≈ 曲段名 1.6，看不出谁大；出版总谱的歌名比谱上别的字大一大截；user「歌曲标题字体大小不合理」）
  const titleSize = tx("song-title"), titleBase = TOP + T(TITLE_H * 0.62);
  // 歌名太长 = 折行（v0.16.58，user 11-09「曲名应该能换行」）：两边让出覆盖层的「⋯」/ 纸钮（各 ≈ CTL_H + 0.6），按量过的宽折、每行居中；下面的作者栏 / 编排 / 谱跟着往下让
  //   尺子按歌词那款字量；歌名是加粗的无衬线 = 多算 8%
  const titleLines = song.title ? wrapTitle(song.title, (t) => P(mw("song-title", t)) * 1.08, o.width - P(2 * (MARGIN + CTL_H + 1))) : [];
  const titleLH = titleSize * 1.2, titleExtra = Math.max(0, titleLines.length - 1) * titleLH;
  titleLines.forEach((t, k) => prims.push({ t: "text", x: o.width / 2, y: titleBase + k * titleLH, s: t, cls: "song-title", size: titleSize, anchor: "middle" }));
  const title: TitleHit = { x: P(MARGIN), y: TOP + T(0.3), w: o.width - P(2 * MARGIN), h: T(TITLE_H) + titleExtra, baseline: titleBase, size: titleSize };
  // 作者栏：标题下面靠右，照写的一行一行显示（纯文本，不认格式；user「嗯所见即所得」）；空着 = 什么都不画（覆盖层写浅色提示）
  const lines = song.credits ? song.credits.split("\n") : [];
  let credits: Box | null = null;
  const cs = tx("credits"), rx = o.width - P(MARGIN), y0 = TOP + T(TITLE_H + 1.0) + titleExtra;
  if (lines.length) {
    lines.forEach((s, k) => prims.push({ t: "text", x: rx, y: y0 + k * cs * 1.35, s, cls: "credits", size: cs, anchor: "end" }));
    const w = Math.max(...lines.map((s) => P(mw("credits", s)))) + T(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + T(0.3), h: cs * 1.35 * lines.length + cs * 0.4 };
  }
  // 编排（2026-10-08 深夜 Opus 5.5；user「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」）：
  //   作者栏下面单独一行、靠左；写错的（找不到的纸、循环段不在最后…）灰字说为什么（放不下 = 下一行），放的时候跳过（纪律）
  let arrangement: TitleHit | null = null, arrLast = 0;   // arrLast = 编排那一块最后一行的基线（px；五线谱从它下面开始）
  if (!o.onlyPaper) {
    const as = tx("arr"), wOf = (role: TextRole, t: string) => P(mw(role, t)), row = Math.max(lines.length, 1), base = y0 + row * cs * 1.35;
    const arr = parseArrangement(song.arrangement, song.papers, o.locale), txt = song.arrangement?.trim() ?? "";
    const label = _tIn(o.locale, "编排　"), lw = wOf("arr-label", label), x0 = P(MARGIN) + lw, avail = o.width - P(2 * MARGIN) - lw;
    if (txt) prims.push({ t: "text", x: P(MARGIN), y: base, s: label, cls: "arr-label", size: as, anchor: "start" });   // 没写编排 = 标签只是入口（提示）= 覆盖层写
    arrLast = base;
    if (txt) {
      prims.push({ t: "text", x: x0, y: base, s: txt, cls: "arr", size: as, anchor: "start" });
      if (arr.issues.length) {
        const why = `· ${arr.issues[0].why}${arr.issues.length > 1 ? _tIn(o.locale, " 等 {n} 处", { n: arr.issues.length }) : ""}`, tw = wOf("arr", txt) + T(0.8), fits = tw + wOf("arr-issue", why) <= avail;
        prims.push({ t: "text", x: fits ? x0 + tw : x0, y: fits ? base : base + cs * 1.35, s: why, cls: "arr-issue ann", size: tx("arr-issue"), anchor: "start" });
        if (!fits) arrLast = base + cs * 1.35;
      }
    }
    arrangement = { x: x0 - T(0.3), y: base - as * 1.15, w: avail + T(0.3), h: as * 1.6, baseline: base, size: as };
  }
  // 作者栏有几行：第一张纸从它下面开始（v0.10.23：原来只给第三行起让位，本段视图没有编排那一行垫着 = 两行作者就压在曲段控件上；user「词曲的输入和本段显示的控件撞车了」）；
  //   编排那一行靠左，会和速度记号撞 = 五线谱从它下面开始
  let yCur = Math.max(TOP + T(TITLE_H + 0.5) + titleExtra, credits && lines.length ? credits.y + credits.h + T(0.3) : 0, arrangement ? arrLast + T(0.8) : 0);   // px，往下排的游标
  /** 分页：这一块（高 h px）在这页放不下 = 翻页（页顶上什么都还没放时不翻）。 */
  const ensure = (h: number) => { if (PG && yCur + h > contentBottom(pageNo) && yCur > contentTop(pageNo) + 1) { pageNo++; yCur = contentTop(pageNo); } };

  const bars: Layout["bars"] = [];
  const chordHeads: Layout["chordHeads"] = [];
  /** 每个音（行 | 下标）往上画到哪（px）：符干朝上 = 符干尖，朝下 = 最高的符头。和弦级数放在它上面（v0.16.13：原来一律抬 4 格，符干朝下的标飘到上一行谱底下、像在标别人）。 */
  const chordTagsOut: Layout["chordTags"] = [];   // 和弦级数（刀 4b 起是挂件：和弦右下角、贴着下天际线；点了 = 候选小菜单）
  const sharedRows: number[] = [], virtualOut: Record<string, Token[]> = {}, measures: Layout["measures"] = [], families: Layout["families"] = [];   // 合租叠起来的那几行（只读：点了不写、不放光标；v0.10.25）
  const rows: SystemBox[] = [], notes: HitNote[] = [], slots: Slot[] = [], heads: CaretHead[] = [], lyrics: LyricHit[] = [], marks: MarkHit[] = [], dyns: DynHit[] = [], rests: RestHit[] = [], clefs: ClefHit[] = [];
const partsHit: Layout["parts"] = [], papersHit: Layout["papers"] = [], names: Layout["names"] = [], keyHints: Layout["keyHints"] = [];
  let shortBars = 0;
  const rowTop = new Map<number, number>();   // 行号 → top（px）
  const rowAbove = new Map<number, number>(), lyricOff = new Map<number, number>();   // 行号 → 谱上面留多少（sp）/ 歌词基线在第一线下多少（sp）。刀 4b 起力度 / 反复 / 速度 / 风格 / 八度线不再有「行 → y」的表：每一样各自贴天际线
  const staffTop = (r: number) => rowTop.get(r)! + P(rowAbove.get(r) ?? 0);   // 这一行的原点（画的时候 = 0，第 12 步定了行距再整行挪）
  /** 这一行的竖向锚点（上沿 / 中线 / 下沿）：家具只认这三个；按这一行的画法问（谱种的表）。 */
  const anc = (r: number) => DRAWERS[rows[r]!.kind].anchors(staffTop(r), P(0.5));
  /** 行身在局部坐标里的上下沿（sp）：问这一行的画法（不假设 0–4；统筹审第四刀接口第 4 条）。 */
  const body = (r: number) => DRAWERS[rows[r]!.kind].anchors(0, 0.5);
  /** 这一行的行一级参数（排版参数表，按行的种类 × 版式）。 */
  const rowPar = (r: number) => ROW_PARAMS[rows[r]!.kind][density];
  const lyricY = (r: number) => anc(r).bottom + P(lyricOff.get(r) ?? rowPar(r).lyricBelow);   // 歌词基线 = 这一行下沿往下让多少

  const showPaperLine = song.papers.length > 1 || song.papers.some((p) => p.name);
  let drawn = 0;
  // 每张纸底下留一条（v0.16.19 搬家 D 的虚线框「＋ 声部」「＋ 新曲段」；刀 1 起框本身归覆盖层，这里只留地方 = chrome.underPaper / tail）。
  //   只在编辑器能写、不分页时留（分页 = 打印预览，和 PDF 一样）；折叠着的隐藏纸不留。占的高度只在这种视图里有，分页 / PDF 的版面一点不动。
  //   本段：这一条里两个框并排；全部：每段一个整宽「＋ 声部」、整首最下面一个「＋ 新曲段」；分页：每段不留，「＋ 新曲段」在最后一页纸外面（只撑高画布，不动页）。
  const underOf = (paper: PaperSeg): Box | undefined => {
    const h = o.chrome?.underPaper; if (!h || PG || (paper.hidden && !o.onlyPaper)) return undefined;
    // 歌词那一行画在行的底边下面（行高不含空着的歌词位）：框放在这张纸最低那一行歌词位的下面，不然盖住「词」模式里点歌词位
    let low = yCur; rows.forEach((r, k) => { if (r.paper === paper.id) low = Math.max(low, lyricY(k) + T(1.2)); });
    const box = { x: P(MARGIN), y: low + T(1.0), w: P(right) - P(MARGIN), h: T(h) };   // 框和里面的字跟字的尺子（刀 2）
    yCur = box.y + box.h + T(0.4);
    return box;
  };
  song.papers.forEach((paper, paperK) => { const before = drawn; drawPaper(paper, paperK); if (drawn > before) { const u = underOf(paper); if (u) papersHit[papersHit.length - 1]!.under = u; } });
  let tailBottom = 0, tail: Layout["tail"] = null;   // 分页时「＋ 新曲段」在最后一页外面：只撑高画布，不动页
  const lastPaper = song.papers.at(-1);
  if (o.chrome?.tail && lastPaper && !(o.onlyPaper && !PG)) {
    const h = T(o.chrome.tail), paperId = o.onlyPaper ?? lastPaper.id;
    if (PG) { tail = { paper: paperId, x: P(MARGIN), y: pageTopY(pageNo) + P(PG.h) + P(1.2), w: P(baseRight - MARGIN), h }; tailBottom = tail.y + h + P(1.0); }
    else { tail = { paper: lastPaper.id, x: P(MARGIN), y: yCur + P(0.6), w: P(baseRight - MARGIN), h }; yCur = tail.y + h + P(0.4); }
  }
  function drawPaper(paper: PaperSeg, paperK: number): void {
    right = baseRight;
    if (o.onlyPaper && paper.id !== o.onlyPaper) return;   // 一次只看一张纸（曲段）
    // 隐藏的纸（不放）：全部视图里不排、不占地方，屏幕和印出来一样（v0.16.34；user 11-09「隐藏整张曲段，打印的时候不留。但是你显示的时候要和打印时的排版一样，
    //   就相当于它这个按钮可能要占用上面的空间」）——提醒归覆盖层：歌名那一条上一颗不占位的「隐藏 N 段」。原来折叠成曲段名 + 一条细行（预览和 PDF 都留着那一截）。
    if (paper.hidden && !o.onlyPaper) { papersHit.push({ id: paper.id, title: { x: 0, y: yCur, w: 0, h: 0, baseline: yCur, size: 0, shown: false }, top: yCur, bottom: yCur, hidden: true, hiddenParts: [] }); return; }
    if (drawn++ > 0) yCur += P(PAPER_GAP);
    // 速度记号画在这张纸最上面那位在场的歌手那一行（它的速度才算数；2026-10-08 user「第四章sheet只有第二个声部的时候速度记号失踪了」——原来只画全曲第一个声部的）。
    //   开头的速度和上一段（前面最近一张不隐藏的纸）结尾不一样 = 前面标 ↑ / ↓（user「然后如果速度和上一段一样和不一样的话应该也有ui上的差别」→「不要grey out，而是有变化的时候会标一个东西提示用户」）
    const owner = tempoOwner(song, paper), prevPaper = song.papers.slice(0, paperK).reverse().find((x) => !x.hidden), prevBpm = prevPaper ? sheetEndBpm(song, prevPaper) : null;
    const paperTop = yCur;
    // 曲段名那一条（多于一张纸或填了名字才画；空着画浅色提示；右边「⋯」= 纸的菜单）。分页时和第一行谱一起挪，所以等算完行高再画
    const pSize = tx("paper-name");
    const pTitle: TitleHit & { shown: boolean } = { x: P(MARGIN), y: yCur, w: o.width - P(2 * MARGIN) - T(o.chrome?.navRoom && song.papers.length > 1 ? o.chrome.navRoom : 4), h: T(PAPER_H), baseline: 0, size: pSize, shown: showPaperLine };   // 右边让出曲段控件组
    const drawPaperTitle = (firstBlock: number) => {
      if (!showPaperLine) return;
      ensure(T(PAPER_H) + firstBlock);
      const pBase = yCur + T(PAPER_H * 0.68);
      pTitle.y = yCur; pTitle.baseline = pBase;
      if (paper.name) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: paper.name, cls: "paper-name", size: pSize, anchor: "start" });   // 折叠的隐藏纸的名字 = 不印（覆盖层写，刀 1）
      // 曲段控件组「‹ k/n › 只看本段 ⋯」（2026-10-08 user「…能不能放在和曲段导航在一起」「多曲段模式下面应该每个曲段都有对应的小控件组」）：刀 1 起归覆盖层，按 pTitle 右端摆
      yCur += T(PAPER_H);
    };
    const present = o.parts.filter((p) => paper.tracks[p.id]), visible = present.filter((p) => !p.hidden), hiddenParts = present.filter((p) => p.hidden);
    // 合租（v0.10.28 改；设计账 ai-docs/20261010-shared-staff-percussion-design.md §1）：一家（主人 + 这张纸上看得见的房客）叠起来 = 一条虚拟的多声部 track
    //   （src/score/merge.ts：各人的音按时间并成和弦），当成主人那一位交给下面普通的排谱流程——自己挑谱号、太宽 = 双手谱、自动八度线、全是鼓 = 五线鼓谱；房客不再自己画。
    //   user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」「…use the already-have rendering procedure for that virtual track」
    //   「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」（不存东西）。以前（v0.10.24–27）各画各的 = 符干打架（「蝌蚪的尾巴在打架」）。
    //   一家里有谁是现在在写的 = 整家拆开（各自一行、能写）；都不是 = 叠起来、整行只读（v0.10.25，user「host也应该只读，只有展开时才能编辑」）。
    const hostOf = (id: string) => song.parts.find((x) => x.id === id)?.host;
    const editingHere = !o.foldAll && o.at.paper === paper.id ? o.at.part : null;   // 听模式 = 一律叠起来
    // 按一家收（主人 id）：这张纸上这一家在场的有两位以上就叠——主人不在这张纸上也照样叠，打头的那位在场的当这一行（v0.10.31；user「piano1不在的时候piano2和3没有成功合并」）
    const famOf = (id: string) => hostOf(id) ?? (song.parts.some((x) => x.host === id) ? id : null);
    const famIds = [...new Set(visible.map((p) => famOf(p.id)).filter((x): x is string => !!x))];
    const famHere = (fid: string) => visible.filter((p) => famOf(p.id) === fid);   // 按歌里的顺序（主人在前）
    // 这次能叠的那几家（这张纸上看得见的两位以上、没人在写）交给五线谱这一种的「谱种的表」：怎么叠（并成虚拟轨、分手、分声部、鼓并成一套）是五线谱的事（staff/rows.ts）
    const fold: FoldFamily[] = famIds.filter((fid) => famHere(fid).length >= 2 && !(editingHere !== null && famOf(editingHere) === fid)).map((fid) => ({ host: fid, members: famHere(fid) }));
    const rowsS = BUILD.rows(paper, visible, fold, lookAt);
    Object.assign(virtualOut, rowsS.virtualOut);
    const { absorbed, lowOf, drumNames, loIds, parts } = rowsS;
    // 展开着的那几家（一家里有人在写）：括号画在哪几行（主人 → 这张纸上看得见的最后一位房客）
    const openFams = famIds.filter((fid) => famHere(fid).length >= 2 && !absorbed.has(famHere(fid)[0].id)).map((fid) => ({ host: fid, ids: famHere(fid).map((p) => p.id) }));
    const trackOf = (id: string): Token[] => rowsS.virt.get(id) ?? paper.tracks[id];
    // 隐藏的声部（刀 1，施工单 §4 第 5 条；user 11-08「我建议不留空 可以，但是如果是页面模式的话wysiwyg，排版要对齐，要不你换一个UI？」）：
    //   当它不存在——不排行、不留高度，连续和分页一样，预览的版面 = PDF 的版面。提醒归覆盖层：曲段名那一条上一颗不占位的「隐藏 N」（hiddenParts 锚点）。
    if (!parts.length) {   // 这张纸上没有显示的声部：都隐藏了 = 只有曲段名那一条（「隐藏 N」在上面）；压根没声部 = 空一行（覆盖层写「这张纸上没有声部」）
      drawPaperTitle(T(hiddenParts.length ? 0 : 3.2));
      let emptyBox: Box | undefined; if (!hiddenParts.length) { emptyBox = { x: P(MARGIN), y: yCur, w: P(right - MARGIN), h: T(3.2) }; yCur += T(3.2); }
      papersHit.push({ id: paper.id, title: pTitle, top: paperTop, bottom: yCur, hiddenParts: hiddenParts.map((p) => p.id), ...(emptyBox ? { empty: emptyBox } : {}) });
      return;
    }
    // 1. 每个声部的排版单元（五线谱：staff/rows.ts staffTracks）。补齐的空小节按这张纸最长那条（框架算长度）
    const lenOf = (t: Token[]) => t.reduce((n, x) => n + (isTimed(x) ? x.dur : 0), 0);
    const lens = parts.map((p) => lenOf(trackOf(p.id) ?? [])), paperLen = Math.max(0, ...lens);
    const built = BUILD.tracks(rowsS, { song, look: songLook, paper, lookAt, at: o.at, tailOpen: !!o.tailOpen, autoBars, measure: o.measure, sp, ts, lens, paperLen });
    const per0 = built.per, rowHost = built.rowHost; shortBars += built.shortBars;
    // 谱种的表（第四刀）：每条轨用哪种行（简谱下画不成数字行的——叠音、鼓、叠起来的一家——照旧五线谱的行，同一张纸上并排；notations.ts）。数字行一条轨一行
    const kinds: RowKind[] = per0.map((q) => NOTATIONS[songLook.notation].rowKindOf(q));
    per0.forEach((q, i) => { if (kinds[i] === "jianpu") q.staves = 1; });   // per0 = 量 / 排用的（排版单元不改）；摆完复制成 per 给后面
    // 鼓谱（v0.10.27；user「这个做好之后鼓谱做一下。团子只剩下鼓和音效了」「单乐器一线谱同意」；设计账 §2）：这一行画成几线的鼓谱（StaffTrack.pmode）。
    //   一位固定敲一件的（鼓件 / 音效）= 一线谱；整套鼓 = 五线鼓谱；一家合租全是鼓 = 并成一套鼓 = 五线鼓谱、每件在自己那一线。
    const pmode = per0.map((q) => q.pmode);
    const hasV2 = per0.map((q) => q.hasV2);
    // 2. 量（五线谱这一种行，一条轨的纯函数：staff/measure.ts）→ 3. 排（框架：合成列 → 折行 → 摆，frame/arrange.ts）。设计稿第 3.3 节第 3、4 步；施工单 1b-4
    //   横向间距（刀 3，2026-11-09 Claude Opus 5.5；算法 = src/render/spacing.ts）：一列到下一列多远 = 这一刻正在响的音里最短的那个该占的宽；同一行前后两样东西真会撞才顶开；
    //   一行排满只拉 / 压弹簧（小节线、调号这些固定宽的不拉）。对齐线 = 列的 x；符头画在 x + 0.35，临时记号挂在左边、进前一列的空。
    const measured = per0.map((q, i) => DRAWERS[kinds[i]!].measure(q));
    const atracks: ArrangeTrack<Unit>[] = per0.map((_q, pi) => ({ entries: measured[pi]!.entries, laneBase: (rowHost[pi] >= 0 ? rowHost[pi] : pi) * 4 }));   // 声部 2 画在主人那一行 = 和主人一个道基数
    const merged = mergeColumns(atracks), n = merged.length;
    // 行首 = 名字一栏的缩进（框架）+ 各条轨行首要画的（五线谱：谱号 + 那里生效的调号 + 第一行的拍号），取大
    const FAM_W = openFams.length ? (o.chrome?.famGap ?? 0) * ts : 0;   // 有展开着的一家：名字和谱之间多让一点给括号
    const ind0 = Math.max(NAME_MIN, ...parts.map((p) => Math.max(...nameLines(p.name, p.staves === 2 || song.papers.some((pp) => lookAt(pp.id, p.id)?.staves === 2) ? 2 : 1).map(nameW)))) + 1.4 * ts + FAM_W;   // 名字一栏 = 两颗大钮的宽和名字（最长 NAME_MAX，再长折行）里大的那个；屏幕和 PDF 同一条规矩（预览 = PDF）   // 至少放得下名字下面那四颗小钮（v0.16.17；屏幕和 PDF 同一条规矩）   // 第一行让给声部名的缩进（sp；名字折行后最宽的那一行）
    // 第二行起每行写简写（v0.9.31；user「todo 总谱的每一行都放乐器名的省空间简写」→「乐手名和颜色同意」）：缩进 = 最宽的那个简写；没给简写（测试 / 老调用）= 0，照旧
    //   v0.9.41：定宽（user 经仓鼠转达「没简写的能不能想办法也按定宽裁一下，不然有一个没查到简写就beat the propose了」）——简写已按 ABBR_W 裁好（part-colors.ts fitAbbr），
    //   列宽 = 一个 ABBR_W 宽的参照（Vln.Vc.），不随谁最长变；字形特别宽、量出来超了参照的那个才撑一点（不叠到谱上）
    const indN = parts.some((p) => p.abbr) ? Math.max(nameW(ABBR_REF), ...parts.map((p) => nameW(p.abbr ?? ""))) + 1.4 * ts + FAM_W : 0;
    const keyAtCol: Map<string, number>[] = [];   // 第 k 列之前生效的调号（每行开头画哪个调号、行首多宽）
    { const now = new Map<string, number>(per0.map((q) => [q.p.id, q.head.key]));
      for (let k = 0; k <= n; k++) { keyAtCol.push(new Map(now)); if (k < n) for (const { track, entry } of merged[k]!.members) if (entry.ref.kind === "key") now.set(per0[track]!.p.id, entry.ref.fifths); } }
    const headAt = (k: number, first: boolean) => { const keys = keyAtCol[k]!, base = (first ? ind0 : indN) + MARGIN; return Math.max(...per0.map((q, i) => DRAWERS[kinds[i]!].lineStart(q, keys.get(q.p.id)!, first, base))); };
    const spO = { curve: curveOf(PPAR.curve), ...SP_DEFAULTS };   // 音距跟版式（参数表纸一级；v0.16.43 user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」）：舒适 = 摸主旋律和歌词，紧凑 = 配器
    const ar = arrangeColumns(merged, atracks, { paperLen, spacing: spO, width: o.scroll ? Infinity : right, squeeze: PPAR.squeeze, maxStretch: PPAR.maxStretch, endPad: BAR_W, lineStart: headAt });   // 横卷 = 不折行
    const { lineFrom, sysStarts } = ar, nSys = lineFrom.length, sysKeys = lineFrom.map((k) => new Map(keyAtCol[k]!));
    // 摆的结果（单独一张表：每一列的横坐标 / 宽 / 第几行）
    const cols = merged.map((c, k) => ({ tick: c.tick, slot: c.slot, n: c.n, x: ar.xs[k]!, w: ar.ws[k]!, system: ar.system[k]!, bar: c.bar, units: c.members.map((m) => m.entry.ref) }));
    // 摆的结果交给后面（歌词让路、小节区间、画）：每条轨的排版单元按摆的结果复制一份——音那一种的宽 = 整列的宽，别的留自己的宽。量的单元不改（施工单 1b-6d；1b-4 时是抄回单元）
    const at = new Map<Unit, { x: number; system: number; w: number }>();
    for (const c of cols) for (const u of c.units) at.set(u, { x: c.x, system: c.system, w: u.kind === "chunk" ? c.w : u.w });
    const copyOf = new Map<Unit, Unit>();
    const per: StaffTrack[] = per0.map((q) => ({ ...q, units: q.units.map((u) => { const v = { ...u, ...at.get(u)! } as Unit; copyOf.set(u, v); return v; }) }));
    const inkLs = measured.map((m) => new Map([...m.inkL].map(([u, v]) => [copyOf.get(u) as Chunk, v] as const)));   // 墨往左伸多远：键换成副本
    const placedCols = cols;
    if (o.scroll) { right = Math.max(baseRight, ...cols.map((c) => c.x + c.w)) + SCROLL_TAIL; sheetRight = Math.max(sheetRight, right); }
    // 4. 行号与坐标：这张纸第 s 行第 r 个声部的第 k 张谱表 = 一条谱行（大谱表两条；紧凑版式里这张纸上没写歌词的声部那条更矮）
    const rowBase = rows.length, nR = parts.length;
    const effStaves = (i: number) => (rowHost[i] >= 0 ? 0 : per[i].staves);   // 声部 2 不占谱行
    const rowStart = per.map((_, i) => per.slice(0, i).reduce((a, _q, j) => a + effStaves(j), 0)), nRowsSys = per.reduce((a, _q, j) => a + effStaves(j), 0);
    const rowOf = (s: number, r: number, k = 0) => rowBase + s * nRowsSys + rowStart[rowHost[r] >= 0 ? rowHost[r] : r] + k;
    // 4½. 行距按天际线（刀 4b，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §2；src/render/skyline.ts）：
    //   先把这张纸的每一行挂在临时的高度上（第 row 行的第五线 = row × BIG px）画音符那一层（五线 / 谱头 / 符头 / 符干 / 符杠 / 符尾 / 休止 / 临时记号 / 附点 /
    //   连音线 / 连线 / 连音括号 / 换气），从画出来的墨量出每一行的上下天际线；再按离音的远近把挂件一样一样贴上去（每贴一样天际线跟着长）；
    //   最后才定每一行的上下留白（版式的最小值和天际线取大）、翻页，把整行平移到位。原来是先按「有没有力度 / 反复 / 速度」留固定的道、高度按估的符干长算，
    //   所以 <> 飘得高、p 被远处一个高音抬上去、力度字压在符杠上。
    //   注解（ann：推定的灰字、速度 ↑↓、句号、角标…）只看不写：不进天际线、不加行高（屏幕画、PDF 不印，不能让预览和 PDF 不一样）。
    const lyricsOf = per.map((q) => q.tokens.some((t) => t.kind === "note" && t.lyric));
    // 歌词按节奏排（v0.9.40；user「先试下你说的两个歌词开关吧，approved」）：音的位置只看时值，歌词让路（fitLyrics）。在算行高之前排好：错开到第二行的那一行要多留一行字
    const lyrPlan = new Map<string, LyricFit & { hw: number }>();   // 键 = 声部序号:下标；hw = 收过之后的半宽（sp，连字符摆在缝正中要用）
    const look = lyricLook(ts);   // 这一档歌词的字高 / 平常宽度（字高永远不动）
    const lyrUnit = (str: string) => lyricWidth(o.measure, str, sp, ts);   // 这一档歌词字号 / 平常宽度下这串字的前进宽度（sp）
    const lyrSpace = lyrUnit(" ") * LYRIC_SPACE, lyrHyphen = lyrUnit("-") * HYPHEN_SX;
    const lyrGaps: LyricGaps = { space: lyrSpace, hyphen: lyrHyphen + lyrSpace, floor: look.gapFloor };   // 定义见 LyricGaps；底线按档（样式表）
    if (songLook.lyricFit === "rhythm") per.forEach((q, r) => {
      if (!lyricsOf[r]) return;
      const bySys = new Map<number, (LyricItem & { index: number })[]>();
      for (const u of DRAWERS[kinds[r]!].lyricAnchors(q)) {   // 每个带字的音在哪（这种行的画法给的锚点）
        const arr = bySys.get(u.system) ?? []; bySys.set(u.system, arr);
        arr.push({ index: u.index, cx: u.cx, w: lyrUnit(lyricShow(u.lyric)), hy: u.hyph, block: isBlockScript(u.lyric) && [...lyricShow(u.lyric)].length <= 1 });   // 一个音上两个以上方块字（日文「だん」这类合租）= 自己收，不带着整段一起变窄（user 11-09「日文有时候有双字合租的…这种时候也变窄到能放下？」）
      }
      // 方块字整段统一一个宽度（user 11-09「甚至是整篇曲段统一宽度，算一个最大的允许宽度」）：先每行算要压到多宽，整段（这张纸 × 这位歌手）取最窄的，再按它摆
      for (const items of bySys.values()) items.sort((a, b) => a.cx - b.cx);
      const blockSx = Math.min(1, ...[...bySys.values()].map((items) => lyricBlockSx(items, LYRIC_MIN_SX, lyrGaps)));
      for (const items of bySys.values()) fitLyrics(items, blockSx, LYRIC_MIN_SX, lyrGaps).forEach((f, k) => lyrPlan.set(`${r}:${items[k].index}`, { ...f, hw: (items[k].w * f.sx) / 2 }));
    });
    // 画的时候每一行都在自己的局部坐标里（第五线 = 0）；每个图元记着自己在哪一行（primRow，put / 贴挂件时记），定了行距按行整行挪（施工单 1b-6c，原来垫 row × 8192 的临时高度、最后按 round(y / 8192) 认行）。
    //   点击框按自己的 system 挪；画的行和 system 不同的（歌词：点击框归音那一行、画在歌词那一行）另记 hitRowOf。
    const put = (row: number, p: Prim) => { const n0 = prims.length; prims.push(p); if (prims.length > n0) primRow[n0] = row; };   // 先 push 再记：__noAnn 滤掉的不留行号。一次一个（不用剩余参数：每画一个图元就新建一个数组，第二刀开工前分段量出来的）
    const hitRowOf = new WeakMap<object, number>(), hitRow = (hit: object, row: number) => { hitRowOf.set(hit, row); };
    const skies: Skyline[] = [];
    for (let s = 0; s < nSys; s++) for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
      const row = rowOf(s, r, k);
      rowTop.set(row, 0); rowAbove.set(row, 0);
      rows[row] = { top: 0, staffTop: 0, bottom: 0, paper: paper.id, part: parts[r].id, sys: s, staff: (k + 1) as Staff, inkTop: 0, inkBottom: 0, kind: kinds[r]! };   // 每一行都写这一行用哪种画法（统筹审第四刀接口第 1 条）
      skies[row - rowBase] = new Skyline(right + MARGIN + 8);
      if (per[r].vrt) sharedRows.push(row);   // 叠起来的那一行只读
    }
    const sky = (row: number) => skies[row - rowBase]!;
    const loc = (row: number, y: number) => (y - staffTop(row)) / sp;   // px → 这一行的局部（线间距，第五线 = 0）
    const textW = (str: string, size: number) => o.measure.widthPx(str, size, sp, ts);   // 有字号的字图元多宽（px；天际线算墨迹）
    const isAnn = (p: Prim) => /(^|\s)ann(\s|$)/.test(p.cls ?? "");
    /** 记一段时间里新加的图元和点击区（贴挂件时整块挪、最后整行挪）。 */
    const primRow: number[] = [];   // 第 i 个图元在哪一行（只记这张纸音符层和挂件那一段）
    const hitLists = (): { y: number }[][] => [notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut];
    const mark = () => ({ p: prims.length, h: hitLists().map((l) => l.length) });
    const shiftSince = (m: ReturnType<typeof mark>, dy: number) => {
      if (!dy) return;
      for (let i = m.p; i < prims.length; i++) shiftPrim(prims[i], dy);
      hitLists().forEach((l, j) => { for (let i = m.h[j]; i < l.length; i++) l[i].y += dy; });
    };
    /** 新加的图元的墨（不算注解），换成这一行的局部坐标。 */
    const inkSince = (m: ReturnType<typeof mark>, row: number, f: (x0: number, x1: number, y0: number, y1: number) => void) => {
      const t = staffTop(row);
      for (let i = m.p; i < prims.length; i++) { const p = prims[i]; if (isAnn(p)) continue; primInk(p, sp, textW, (x0, x1, y0, y1) => f(x0 / sp, x1 / sp, (y0 - t) / sp, (y1 - t) / sp)); }
    };
    /** 在第 row 行谱上方贴一样东西：draw(y) 在随便哪个 y 上画（y = 这一行的第五线），画完整块往上挪到每一段都离下面的天际线 gap（线间距）；天际线跟着长。返回挪了多少（线间距）。 */
    const pieces: number[] = [];   // 一次贴的墨（局部；x0 x1 y0 y1 四个一组）：量一遍，挪完直接记进天际线
    const collect = (m: ReturnType<typeof mark>, row: number) => { pieces.length = 0; inkSince(m, row, (x0, x1, y0, y1) => { pieces.push(x0, x1, y0, y1); }); };
    const commit = (sk: Skyline, dy: number, count: boolean) => { for (let i = 0; i < pieces.length; i += 4) sk.ink(pieces[i]!, pieces[i + 1]!, pieces[i + 2]! + dy, pieces[i + 3]! + dy, count); };
    const tagSince = (m: ReturnType<typeof mark>, row: number) => { for (let i = m.p; i < prims.length; i++) if (primRow[i] === undefined) primRow[i] = row; };   // 贴挂件回调里画的 = 贴的那一行
    const placeAbove = (row: number, gap: number, draw: (y: number) => void): number => {
      const m = mark(); draw(staffTop(row)); tagSince(m, row); collect(m, row);
      let need = Infinity; const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) { const t = sk.top(pieces[i]!, pieces[i + 1]!); if (t < Infinity) need = Math.min(need, t - gap - pieces[i + 3]!); }
      const dy = need === Infinity ? body(row).top - rowPar(row).clear : need; shiftSince(m, P(dy));   // 什么墨都没有（只有注解）= 贴在行身上沿上方 clear（参数表行一级；五线谱 2.4 照旧）
      commit(sk, dy, true);
      return dy;
    };
    /** 谱下方贴一样东西（同上，往下挪到离上面的天际线 gap）；min = 最少挪到哪（局部 y 往下挪的下限，歌词的版式最小值用）；count = 算不算进行高。 */
    const placeBelow = (row: number, gap: number, draw: (y: number) => void, o2: { min?: number; count?: boolean; step?: number } = {}): number => {
      const m = mark(); draw(staffTop(row)); tagSince(m, row); collect(m, row);
      let need = -Infinity; const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) { const b = sk.bottom(pieces[i]!, pieces[i + 1]!); if (b > -Infinity) need = Math.max(need, b + gap - pieces[i + 2]!); }
      let dy = Math.max(need === -Infinity ? 0 : need, o2.min ?? -Infinity);
      if (o2.step && o2.min !== undefined && dy > o2.min + 1e-9) dy = o2.min + Math.ceil((dy - o2.min) / o2.step - 1e-9) * o2.step;   // 防抖：往下让按整格
      shiftSince(m, P(dy));
      commit(sk, dy, o2.count !== false);
      return dy;
    };
    /** 挂件的道（frame/lanes.ts）：画法往道上登记（attach），第 12 步按这种谱给的先后（STAFF_LANES）一道一道贴。 */
    const attached = new Map<number, Map<LaneKind, (() => void)[]>>();   // 行 → 道 → 登记的（第四刀：按行登记，每一行按自己那种画法的道的先后贴；统筹审第四刀接口第 3 条）
    const attach = (row: number, lane: LaneKind, run: () => void) => {
      if (!(row >= rowBase && row - rowBase < skies.length && skies[row - rowBase])) throw new Error(`engrave: attach on row ${row} outside this paper`);
      let m = attached.get(row); if (!m) attached.set(row, (m = new Map())); const l = m.get(lane); if (l) l.push(run); else m.set(lane, [run]);
    };
    const p0 = mark();   // 这张纸音符层的头：从这里起的图元 / 点击区最后都按行挪到位
    // 每行五线画到哪：这一行最后一列是小节线 = 到那根小节线为止（不出头；user 2026-10-08「每行五线谱最好过了最后一个小节线能不能不出头」）；
    //   后面还有音 / 写字头（光标停在最后一根小节线后面）= 照旧画到右边（写的地方）。小节线画在列的 x + 0.7（见下面第 6 步）
    const staffEnd = Array.from({ length: nSys }, (_, s) => {
      const row = placedCols.filter((c) => c.system === s); if (!row.length) return right;
      const last = row.reduce((a, c) => (c.x > a.x || (c.x === a.x && (c.slot > a.slot || (c.slot === a.slot && c.n > a.n))) ? c : a));
      return last.bar ? Math.min(right, last.x + 0.7) : right;
    });
    // 5b. 跨行的（行距定了才画）：歌手牌（第一行）/ 简写、色条、花括号、展开着的一家的括号锚点、几条谱左边一根竖线
    const drawSystemsChrome = () => { for (let s = 0; s < nSys; s++) {
      const ind = s === 0 ? ind0 : indN;
      per.forEach((q, r) => {
        if (rowHost[r] >= 0) return;
        const ten = absorbed.get(q.p.id) ?? [];   // 叠在这一行上的房客（名字写在主人下面）
        const pr = lowOf.has(q.p.id) ? per.findIndex((x) => x.p.id === lowOf.get(q.p.id)) : r, rEnd = (sy: number) => rowOf(sy, pr, per[pr].staves - 1);   // 双手谱：名字 / 色条 / 花括号跨到下面那张
        if (loIds.has(q.p.id)) return;   // 双手谱下面那张：只有谱表本身（名字 / 色条 / 花括号归上面那张）
        if (s === 0) {
          // 歌手牌：声部名在第一行谱号左边、竖着居中（大谱表 = 两条谱表之间）（user「歌手牌同意，和打谱软件对齐」「乐器名可以选择一大堆乐器，然后下面可以in place改」）
          const r0 = rowOf(s, r, 0), r1 = rEnd(s), lines = nameLines(q.p.name, pr !== r ? 2 : q.staves), LH = PART_EM * 1.15 * ts;
          // 合租：主人的名字下面接着写房客的名字（user「谱号左边放歌手名的时候在folded的模式下会同时显示所有歌手的名字」）；每个名字各自能点（点房客 = 去写它，它就拆开）
          const tl = ten.map((t) => nameLines(t.name, 1)[0] ?? ""), nAll = lines.length + tl.length;
          const ny = (anc(r0).mid + anc(r1).mid) / 2 + T(0.55 * PART_EM) - P((LH * (nAll - 1)) / 2);   // 几行一起竖着居中（屏幕和 PDF 一样；两颗钮在覆盖层、放名字上面，可以超出谱上沿——user 11-08「歌手还是纵向居中对齐…这两个按钮是放它上面」）
          const nameBlock = (wid: number) => names.push({ paper: paper.id, part: q.p.id, x0: P(MARGIN - 0.95), x1: P(MARGIN) + P(wid), top: ny - T(PART_EM * 0.95) });   // 名字块锚点（覆盖层的两颗钮对它居中）
          const ncls = q.p.empty ? "part-name empty" : q.focused ? "part-name focus" : "part-name";
          const dn = drumNames.get(q.p.id);
          if (dn) {   // 一家全是鼓：名字按各位的音在鼓谱上的高低排（主人不一定在最上面），每个名字一行、各自能点
            const at = (k: number) => ny + P(LH * k), hk = Math.max(0, dn.findIndex((m) => m.id === q.p.id));
            dn.forEach((m, k) => {
              prims.push({ t: "text", x: P(MARGIN), y: at(k), s: nameLines(m.name, 1)[0] ?? "", cls: m.id === q.p.id ? ncls : "part-name tenant", size: tx("part-name"), anchor: "start" });
              partsHit.push({ paper: paper.id, part: m.id, x: P(MARGIN - 0.4), y: at(k) - T(PART_EM * 0.95), w: P(ind0 + 0.2), h: P(LH) });
            });
            nameBlock(Math.max(...dn.map((m) => nameW(nameLines(m.name, 1)[0] ?? ""))));   // 钮在这一家名字的上面
            if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: at(dn.length - 1) + P(LH), s: q.p.badges.join(" "), cls: "part-badge ann", size: tx("part-badge"), anchor: "start" });
            if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: at(hk) - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
          } else {
          lines.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: ln, cls: ncls, size: tx("part-name"), anchor: "start" }));
          tl.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (lines.length + k)), s: ln, cls: "part-name tenant", size: tx("part-name"), anchor: "start" }));
          if (ten.length) {
            const lineTop = (i: number) => ny + P(LH * i) - T(PART_EM * 0.95);
            ten.forEach((t, k) => partsHit.push({ paper: paper.id, part: t.id, x: P(MARGIN - 0.4), y: lineTop(lines.length + k), w: P(ind0 + 0.2), h: P(LH) }));
          }
          nameBlock(Math.max(...[...lines, ...tl].map(nameW)));   // 名字上面两颗大钮（覆盖层），对「色点 + 名字」居中（v0.16.22；user 11-08「放到歌手名的上面」）
          { if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (nAll - 1)) + T(1.4), s: q.p.badges.join(" "), cls: "part-badge ann", size: tx("part-badge"), anchor: "start" }); }   // 出声 / 显示状态的角标（user「hide, mute solo这些视图层的东西应该是在谱子上能看到」）
          { const y0 = anc(r0).top - P(1.2), yEnd = ten.length ? ny + P(LH * lines.length) - T(PART_EM * 0.95) : anc(r1).bottom + P(1.2);   // 有房客 = 主人的点击区只到它自己的名字
            partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: y0, w: P(ind0 + 0.2), h: yEnd - y0 }); }
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });   // 名字前一个小色点（不印）
          }
        } else if (q.p.abbr) {   // 第二行起：简写（一行，竖着居中），点它同样开歌手牌
          const r0 = rowOf(s, r, 0), r1 = rEnd(s), LH = PART_EM * 1.15 * ts;
          const order = drumNames.get(q.p.id) ?? [q.p, ...ten], hk = Math.max(0, order.findIndex((m) => m.id === q.p.id));   // 鼓：简写也按音的高低排（同第一行的名字）；别的合租 = 主人在上、房客跟在下面
          const ny = (anc(r0).mid + anc(r1).mid) / 2 + T(0.55 * PART_EM) - P((LH * (order.length - 1)) / 2);
          order.forEach((m, k) => {
            if (m.id === q.p.id) { prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: q.p.abbr!, cls: q.p.empty ? "part-name abbr empty" : q.focused ? "part-name abbr focus" : "part-name abbr", size: tx("part-name"), anchor: "start" }); return; }
            prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: m.abbr ?? "", cls: "part-name abbr tenant", size: tx("part-name"), anchor: "start" }); partsHit.push({ paper: paper.id, part: m.id, x: P(MARGIN - 0.4), y: ny + P(LH * k) - T(PART_EM * 0.95), w: P(indN + 0.2), h: P(LH) });
          });
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny + P(LH * hk) - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
          partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: anc(r0).top - P(1.2), w: P(indN + 0.2), h: anc(r1).bottom - anc(r0).top + P(2.4) });
        }
        if (q.p.colorIdx !== undefined) {   // 每行左边一条细色条（类别色；不印）：谱号左边、从第一线到最后一线
          const r0 = rowOf(s, r, 0), r1 = rEnd(s);
          prims.push({ t: "rect", x: P(MARGIN + ind - 0.8), y: anc(r0).top, w: P(0.3), h: anc(r1).bottom - anc(r0).top, cls: `cat-bar ann cat-${q.p.colorIdx}` });
        }
        if (q.staves === 2 || pr !== r) {   // 大谱表（或合租的双手谱）的花括号：两条谱表左边一根粗线 + 两头小钩
          const bx = P(MARGIN + ind - 0.7), y0 = anc(rowOf(s, r, 0)).top, y1 = anc(rEnd(s)).bottom;
          prims.push({ t: "path", d: `M${bx + P(0.5)},${y0}Q${bx - P(0.3)},${y0 + P(0.6)} ${bx},${(y0 + y1) / 2}Q${bx - P(0.3)},${y1 - P(0.6)} ${bx + P(0.5)},${y1}`, cls: "brace" });
        }
      });
      // 展开着的一家：一条括号（粗竖线 + 两头往右的小钩），在名字和谱之间；点它 = 光标挪出这一家（score-view）
      if (ind > 0 && o.chrome?.famGap) for (const fam of openFams) {   // 编辑器才要（锚点；括号归覆盖层）
        const rs = fam.ids.map((id) => per.findIndex((q) => q.p.id === id)).filter((i) => i >= 0); if (rs.length < 2) continue;
        const r0 = Math.min(...rs), r1 = Math.max(...rs), x = P(MARGIN + ind - 1.55), y0 = anc(rowOf(s, r0, 0)).top - P(0.6), y1 = anc(rowOf(s, r1, per[r1].staves - 1)).bottom + P(0.6);
        families.push({ paper: paper.id, host: fam.host, x: x - P(0.6), y: y0, w: P(1.3), h: y1 - y0 });
      }
      if (nRowsSys > 1) prims.push({ t: "line", x1: P(MARGIN + ind), y1: anc(rowOf(s, 0, 0)).top, x2: P(MARGIN + ind), y2: anc(rowOf(s, nR - 1, per[nR - 1].staves - 1)).bottom, w: P(SYSTEM_LINE_W), cls: "bar" });
    } };
    // 5¾. 每个小节的 tick 区间和位置：拿第一位（补齐过，人人一样长）的排版单元数（每一段 chunk 自己的 ticks、第几小节 m）
    { const q0 = per.find((q) => rowHost[per.indexOf(q)] < 0) ?? per[0]; let t = 0, cur: Layout["measures"][number] | null = null;
      for (const u of q0.units) {
        if (u.kind !== "chunk") continue;
        const m = u.m ?? 0;
        if (!cur || (cur as { m?: number }).m !== m) { cur = { paper: paper.id, t0: t, t1: t, row: rowOf(u.system, per.indexOf(q0), 0), x: P(u.x) }; (cur as { m?: number }).m = m; measures.push(cur); }
        t += u.ticks; cur.t1 = t;
      }
      for (const x of measures) delete (x as { m?: number }).m; }
    // 5、6–11：五线谱这一种行的画（staff/draw.ts；施工单 1b-6a）。框架交过去的东西都在这个对象里
    const drawCtx = { song, look: songLook, paper, o, P, tx, TR, RS, mw, sp, ts, put, hitRow, prims, notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut, slots, heads, bars, rows, staffTop, lyricY, rowOf, placeAbove, placeBelow, attach, per, rowHost, pmode, measured: inkLs.map((inkL) => ({ inkL })), nSys, sysStarts, sysKeys, staffEnd, cols, right, ind0, indN, owner, prevBpm };
    // 小节号（v0.9.42；user 2026-10-10「小节号要，可以页面设置toggle，默认是每行开头有。字小一点」）：每行最上面那条的左上角，印这一行第一个小节的号；
    //   每张纸从 1 数（纸 = 曲段），弱起算第 0 小节；第一行是 1 / 0 就不印（出版谱的老规矩）。刀 4b：挂件第 9 样 = 行首那一段天际线往上 0.3。
    //   第四刀起归框架（原来在五线谱的画法里）：它贴在这一行最上面那条上，不归哪一种画法
    if (songLook.barNumbers && per[0]) for (let s = 0; s < nSys; s++) {   // 取这一行第一位有东西的歌手（补齐之后人人都有；v0.10.6）
      const ind = s === 0 ? ind0 : indN, q0 = per.find((q) => q.units.some((u) => u.kind === "chunk" && u.system === s)) ?? per[0];
      const c0 = q0.units.find((u): u is Chunk => u.kind === "chunk" && u.system === s);
      const num = c0 ? (c0.m ?? 0) + (q0.pickup ? 0 : 1) : null, row0 = rowOf(s, 0, 0);
      if (num !== null && !(s === 0 && num <= 1)) attach(row0, "barNumber", () => placeAbove(row0, 0.3, (y) => prims.push({ t: "text", x: P(MARGIN + ind), y, s: String(num), cls: "bar-no", size: tx("bar-no"), anchor: "start" })));
    }
    // 按行的种类分给各自的画法（谱种的表）：五线谱先画、数字行后画。每种画法只能往分给它的那几条轨的行上画（统筹审第四刀接口第 5 条：put / hitRow / attach / 贴天际线越界 = 报错）
    const kIdx = (k: RowKind) => per.map((_q, i) => i).filter((i) => kinds[i] === k);
    const ctxFor = (idx: readonly number[], who: RowKind) => {
      const own = new Set<number>(); for (const r of idx) for (let s = 0; s < nSys; s++) for (let k = 0; k < effStaves(r) || (rowHost[r]! >= 0 && k < 1); k++) own.add(rowOf(s, r, k));
      const chk = (row: number) => { if (!own.has(row)) throw new Error(`engrave: the ${who} drawer drew on row ${row}, which is not one of its rows`); };
      return { ...drawCtx, put: (row: number, p: Prim) => { chk(row); put(row, p); }, hitRow: (h: object, row: number) => { chk(row); hitRow(h, row); },
        attach: (row: number, lane: LaneKind, run: () => void) => { chk(row); attach(row, lane, run); },
        placeAbove: (row: number, gap: number, d: (y: number) => void) => { chk(row); return placeAbove(row, gap, d); },
        placeBelow: (row: number, gap: number, d: (y: number) => void, o2?: { min?: number; count?: boolean; step?: number }) => { chk(row); return placeBelow(row, gap, d, o2); } };
    };
    const sIdx = kIdx("staff"), jIdx = kIdx("jianpu");
    const staffOut = DRAWERS.staff.draw(ctxFor(sIdx, "staff"), sIdx), jpOut = jIdx.length ? DRAWERS.jianpu.draw(ctxFor(jIdx, "jianpu"), jIdx) : { lyricParts: [] as LyricPart[] };
    // 歌词（第 11 样「歌词」，框架的；施工单 1b-7）：五线谱给每个音的锚点（字的中心、拖腔线、点击框归哪一行、挂在哪一行），这里写字、贴天际线、摆连字符。
    //   一行歌词一条基线 = max(版式的最小值, 这一行歌词占的那些段里下天际线最低处 + 字高 + 0.5)；第二行（按节奏排挤下去的）跟着往下。
    //   歌词连字符（英文断开的音节）画在两个歌词中间；拖腔线一起。歌词的墨进天际线（后面的 8vb 贴在它下面），行高另按歌词的规矩算（第 12 步之后）
    //   第四刀：按行登记（一位歌手的歌词一行一块，每一行按自己那种画法的道的先后贴）
    const layLyrics = ({ r, lrow, spots }: LyricPart) => {
      const run = (c: LyricSpot, partLyrics: LyricHit[]) => {
        const fit = lyrPlan.get(`${r}:${c.index}`), ly0 = lyricY(lrow(c.sys)), cx0 = c.cx0;   // 按节奏排：让过路的位置
        const ly = ly0, cx = cx0 + (fit ? P(fit.dx) : 0);
        { const lh: LyricHit = { index: c.index, system: c.row, x: cx, y: ly, ...(fit?.tight ? { tight: true as const } : {}) }; partLyrics.push(lh); hitRow(lh, lrow(c.sys)); }   // 点击框归这个音那一行（system），画在歌词那一行（大谱表 = 下面那条）
        if (c.lyric === MELISMA_MARK) put(lrow(c.sys), { t: "line", x1: c.mx0, y1: ly0, x2: c.mx1, y2: ly0, w: P(0.12), cls: "melisma" });
        else if (c.lyric) put(lrow(c.sys), { tok: c.tok, t: "text", x: cx, y: ly, s: lyricShow(c.lyric), ...(look.k !== 1 || ts !== 1 ? { size: lyricSizePx(sp, ts) } : {}), ...(look.sx * (fit?.sx ?? 1) !== 1 ? { sx: look.sx * (fit?.sx ?? 1) } : {}), cls: ["lyric", c.mute ? "lyric-mute" : "", fit?.tight ? "lyric-tight" : "", c.cls ?? ""]   /* 挤了不画灰（v0.16.45；user「挤了能不能不画灰」「灰是有别的语义的」= 唱不出来 / 不认）：只留 lyric-tight 给歌词框说「挤了」 */.filter(Boolean).join(" ") });
      };
      const bySys = new Map<number, LyricSpot[]>();
      for (const c of spots) { const l = bySys.get(c.sys); if (l) l.push(c); else bySys.set(c.sys, [c]); }
      if (!lyricsOf[r]) { for (const [sy, cs] of bySys) attach(lrow(sy), "lyrics", () => { const part: LyricHit[] = []; for (const c of cs) run(c, part); lyrics.push(...part); }); return; }   // 没写歌词的声部：空着的歌词位（点了开歌词框），都在默认的歌词位
      for (let sy = 0; sy < nSys; sy++) { const row = lrow(sy), cs = bySys.get(sy), base = rowPar(row).lyricBelow + (o.lyricRaise ?? 0); attach(row, "lyrics", () => {
        lyricOff.set(row, base);   // 这一行没有字也留歌词位（空着的歌词位能点）
        if (!cs) return;
        const partLyrics: LyricHit[] = [];
        const dy = placeBelow(row, 0.5, () => {
          const from = partLyrics.length;
          for (const c of cs) run(c, partLyrics);
          // 连字符摆哪 = 文字模块的 hyphens()（缝的正中、放不下不画、方块字旁边不占地方；见 src/render/text/lyric-fit.ts）
          const mine = partLyrics.slice(from), byIdx = new Map(cs.map((c) => [c.index, c] as const));
          const syls = mine.map((L) => { const pl = lyrPlan.get(`${r}:${L.index}`), c = byIdx.get(L.index)!, lyr = c.lyric ?? ""; return { x: L.x, hy: c.hyph, hw: pl ? P(pl.hw) : undefined, sx: pl?.sx, ...(pl ? {} : { nw: P(lyrUnit(lyricShow(lyr))) / 2 }), cjk: isBlockScript(lyricShow(lyr)), row: L.system }; });
          hyphens(syls, P(lyrHyphen), P(1.6)).forEach((h, n) => {
            if (h) prims.push({ t: "text", x: h.x, y: mine[n]!.y, s: "-", cls: "lyric hyphen", ...(look.k !== 1 || ts !== 1 ? { size: lyricSizePx(sp, ts) } : {}), sx: look.sx * h.hf * HYPHEN_SX });
          });
          lyrics.push(...partLyrics.slice(from));
        }, { min: 0, count: false, step: ROW_STEP });   // 歌词基线往下让也按整格（防抖）
        lyricOff.set(row, base + dy);
      }); }
    };
    for (const lp of [...staffOut.lyricParts, ...jpOut.lyricParts]) layLyrics(lp);
    // 12. 量 → 贴 → 定行距 → 挪到位（刀 4b）
    //   ① 音符层的墨进天际线（注解不算）
    for (let i = p0.p; i < prims.length; i++) {
      const p = prims[i]; if (isAnn(p)) continue;
      const row = primRow[i]; if (row === undefined) throw new Error(`engrave: prim ${i} has no row (draw with put(row, …) or inside placeAbove / placeBelow)`);
      if (row < rowBase || row - rowBase >= skies.length || !skies[row - rowBase]) continue;
      const t = staffTop(row); primInk(p, sp, textW, (x0, x1, y0, y1) => sky(row).ink(x0 / sp, x1 / sp, (y0 - t) / sp, (y1 - t) / sp));
    }
    //   ② 挂件按表的先后摆（第 6 样之后记一下往上到哪：播放的小节底色只盖到反复记号，不含速度 / 风格）
    const upToNav: number[] = [];
    for (let row = rowBase; row - rowBase < skies.length; row++) {   // 一行一行贴，每一行按它那种画法的道的先后（第四刀；统筹审接口第 3 条：两种先后不一样时并不成全纸一张）
      if (!skies[row - rowBase]) continue;
      const m = attached.get(row), lanes = DRAWERS[rows[row]!.kind].lanes;
      for (const lane of lanes) { for (const f of m?.get(lane) ?? []) f(); if (lane === INK_UP_TO) upToNav[row - rowBase] = sky(row).hUp; }
      if (m) for (const lane of m.keys()) if (!lanes.includes(lane)) throw new Error(`engrave: row ${row} (${rows[row]!.kind}) has no lane "${lane}"`);
    }
    const pEnd = mark();
    //   ③ 每一行的上下留白 = 版式的最小值和天际线（+ 0.8）取大；有歌词的那一条另按歌词的规矩（歌词基线 + 版式里歌词下面那一截，挤到第二行的再加一行）。上下两行不咬合
    //   行身 = 这一行画法的竖向锚点（b.top–b.bottom，局部 sp）；版式的最小值 = 参数表的行一级（按行的种类）
    const PAD = 0.8, fin = (v: number, d: number) => (Number.isFinite(v) ? v : d);
    // 防抖（user 11-09「行的上下留白按整格往上取 同意，quantize防抖」）：超出版式最小值的那一截按整格（ROW_STEP 个线间距）往上取——
    //   写音 / 加记号时墨长了一点点，这一行的高不动；跨过一格才长一格。纯排版规则（打印一样），不看编辑状态
    const stepUp = (min: number, need: number) => (need <= min + 1e-9 ? min : min + Math.ceil((need - min) / ROW_STEP - 1e-9) * ROW_STEP);
    const geo = (s: number, r: number, k: number) => {
      const q = per[r], row = rowOf(s, r, k), R = rowPar(row), b = body(row), bodyH = b.bottom - b.top, sk = sky(row), hUp = fin(sk.hUp, b.top), hDn = fin(sk.hDn, b.bottom);
      const minBelow = q.staves === 2 && k === 0 ? R.graveUpper - R.above - bodyH : (lyricsOf[r] ? R.rowH : R.rowHNoLyric) - R.above - bodyH;
      const lyr = lyricsOf[r] && k === q.staves - 1 ? lyricOff.get(row) : undefined, row2 = 0, lyricTail = R.rowH - R.above - bodyH - R.lyricBelow;
      let need = hDn - b.bottom + PAD;
      if (lyr !== undefined) need = Math.max(need, lyr + lyricTail + row2);
      const below = stepUp(minBelow, need), above = stepUp(R.above, b.top - hUp + PAD);
      // origin = 行顶到原点（局部 0）多远；ink = 墨的上下沿（局部；上沿只算到反复那一道，播放的小节底色用）
      return { above, below, h: above + bodyH + below, origin: above - b.top, inkTop: Math.min(b.top, fin(upToNav[row - rowBase] ?? Infinity, b.top)), inkBottom: Math.max(b.bottom, hDn, lyr !== undefined ? b.bottom + lyr + 0.5 + row2 : b.bottom) };
    };
    const G = Array.from({ length: nSys }, (_, s) => per.map((_q, r) => Array.from({ length: effStaves(r) }, (_, k) => geo(s, r, k))));
    const sysH = (s: number) => P(G[s].reduce((n, gs) => n + gs.reduce((m, g) => m + g.h, 0), 0) + SYS_GAP);
    drawPaperTitle(nSys ? sysH(0) : P(ROW_PARAMS[NOTATIONS[songLook.notation].home][density].rowH));
    let note: Box | undefined; if (paper.hidden) { const nx = P(MARGIN) + (paper.name ? P(mw("paper-name", paper.name)) : 0) + T(1.0); note = { x: nx, y: pTitle.y, w: Math.max(T(4), pTitle.x + pTitle.w - nx), h: T(PAPER_H) }; }   // 本段视图里的隐藏纸：说明挂在曲段名后面（字归覆盖层），不占地方——和印出来一样（v0.16.34）
    //   ④ 翻页（一行谱整块放不下就翻页）+ 每一行定位
    const delta = new Map<number, number>();   // 行号 → 从局部坐标（第五线 = 0）挪到位要挪多少（px）
    for (let s = 0; s < nSys; s++) {
      ensure(sysH(s));
      for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
        const top = yCur, row = rowOf(s, r, k), g = G[s][r][k], st = top + P(g.origin);
        delta.set(row, st); rowTop.set(row, top); rowAbove.set(row, g.origin);
        Object.assign(rows[row]!, { top, staffTop: st, bottom: top + P(g.h), inkTop: st + P(g.inkTop), inkBottom: st + P(g.inkBottom) });
        yCur += P(g.h);
      }
      yCur += P(SYS_GAP);
    }
    //   ⑤ 整行挪到位：图元按记着的行、点击框按自己的 system（或另记的画在哪一行）
    for (let i = p0.p; i < pEnd.p; i++) shiftPrim(prims[i], delta.get(primRow[i]!) ?? 0);
    hitLists().forEach((l, j) => { for (let i = p0.h[j]; i < pEnd.h[j]; i++) { const h = l[i] as { y: number; system: number }; h.y += delta.get(hitRowOf.get(h) ?? h.system) ?? 0; } });
    //   ⑥ 跨行的（歌手牌、花括号、左边连着的竖线、色条）
    drawSystemsChrome();
    papersHit.push({ id: paper.id, title: pTitle, top: paperTop, bottom: yCur, hiddenParts: hiddenParts.map((p) => p.id), ...(note ? { note } : {}) });
  }
  // 分页：页框（压在最底下）+ 页码；高 = 最后一页的底
  const pages: Layout["pages"] = [];
  if (PG) {
    const frames: Prim[] = [];
    for (let k = 0; k <= pageNo; k++) {
      const top = pageTopY(k);
      frames.push({ t: "rect", x: -P(PG.l), y: top, w: o.width + P(PG.l + PG.r), h: P(PG.h), cls: "page ann" });
      prims.push({ t: "text", x: o.width / 2, y: top + P(PG.h - PG.b / 2), s: String(k + 1), cls: "page-no", size: tx("page-no"), anchor: "middle" });
      pages.push({ top, h: P(PG.h) });
    }
    prims.unshift(...frames);
  }
  const height = PG ? Math.max(pageTopY(pageNo) + P(PG.h), tailBottom) : yCur + P(MX.b);
  return { prims, width: o.scroll ? P(sheetRight + MARGIN) : o.width, height, sp, tp: sp * ts, systems: rows, bars, notes, chordHeads, chordTags: chordTagsOut, names, sharedRows, virtual: virtualOut, measures, families, slots, heads, lyrics, marks, dyns, rests, title, clefs, arrangement, credits, parts: partsHit, papers: papersHit, keyHints, tail, creditsLine: { x: rx, y: y0, size: cs }, content: { left: P(MARGIN), right: o.width - P(MARGIN) }, pageX: { left: P(MX.l), right: P(MX.r) }, pages, shortBars, lyricYs: rows.map((_, r) => lyricY(r)) };
}

export type { Token };
