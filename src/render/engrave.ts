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

import { DYNS, type ClefName, type Song, type NoteTok, type Token, type GrooveTok, type BarTok, type NavTok, type Repeat, NAV_LABEL, endingLabel, type Art, type Dyn, type Focus, type Staff, TPQ, WHOLE, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, effectivePitch, isTimed, headLen, beatTicks, tempoWord, staffOfTokens, allPitches, tempoOwner, sheetEndBpm, rampSource } from "../score/song.ts";
import { grooveLabel, grooveStyle } from "../score/groove.ts";
import { dynOverridden } from "../score/perform.ts";
import { navWhy } from "../score/repeats.ts";
import { parseArrangement } from "../score/arrange.ts";
import { densityOf, type Density } from "../score/paper.ts";
import { type Pitch, diatonicIndex, keyAlter } from "../score/pitch.ts";
import { MELISMA_MARK, lyricShow } from "../score/lyrics.ts";
import { GLYPH, W, ENGRAVE, STEM_UP_SE, STEM_DOWN_NW, FLAG_ANCHOR_UP, FLAG_ANCHOR_DOWN, timeSigDigits } from "./smufl.ts";
import { KEY_LABEL } from "../score/pitch.ts";
import { resolveSongClefs, displayStates, autoOttava, CLEF_SHIFT, baseClef, isFClef, ottavaShift } from "../score/clef.ts";

export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string; size?: number /* px，默认 4 sp */ }
  | { t: "text"; x: number; y: number; s: string; cls?: string; size?: number /* px，默认歌词字号 */; anchor?: "start" | "middle" | "end" }
  | { t: "path"; d: string; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string }
  | { t: "icon"; id: string; x: number; y: number; size: number; cls?: string; title?: string };   // 家族图标库的一个图标（页面里内联的 sprite，<use href="#id">）

/** 要画的一个声部（顺序 = 总谱从上到下；隐藏的不在这里）。 */
export interface PartView { id: string; name: string; abbr?: string; colorIdx?: number; empty?: boolean; first?: boolean; clef?: ClefName; staves?: 2; hidden?: boolean; badges?: string[]; mono?: boolean; xHead?: boolean; ignores?: readonly string[]; lyricMute?: ReadonlySet<number>; noLyrics?: string }   // noLyrics = 台上这位不唱字（乐器 / 元音版）：值 = 说给人听的那句   // lyricMute = 台上这位唱不出来的歌词（音的 token id；画灰，src/score/lyric-check.ts）   // mono = 台上的是单声乐器（月读 / 元音…）：叠音里下面的音画灰（只唱最上面）   // staves 2 = 大谱表（两行一组、花括号；上高音下低音）
//   empty = 还没人上场（名字画淡色）；first = 歌里第一个声部（速度画在它上面）；clef = 谱号；hidden = 隐藏的：不画谱、缩成一条细行（点它开歌手牌）；badges = 名字下面的角标（静 / 独 / 只看它）
export interface EngraveOpts {
  width: number;                         // px，谱面板宽
  sp: number;                            // px，五线谱间距
  at: Focus;                             // 光标 / 选中在哪条 track
  caret: number;                         // 光标（插入点）
  sel?: { from: number; to: number; head?: number } | null;   // 有 = 改（没有光标）；head = 替换模式的写字头（有 = 选区里也画写字头）
  parts: PartView[];                     // 显示的声部
  measureLyric: (s: string) => number;   // px，歌词字号 = LYRIC_EM × sp
  titlePlaceholder?: boolean;            // 歌名 / 词曲 / 曲段名空着时画浅色提示 + 「＋ 新的纸」（编辑器里；导出 / 打印不画）
  autoBars?: boolean;                    // 按拍号自动画小节线（默认开）；关 = 只画人插的「|」
  /** 分页排法（user 2026-10-08「显示法还加一个分页？可以预览打印，要求和之后生成的pdf wysiwyg」）：按纸高分页、画页框 + 页码；h = 整页高、l r t b = 四边边距（sp）。没有 = 连续（一张长纸）。 */
  page?: { h: number; l: number; r: number; t: number; b: number };
  /** 歌词行再往下让多少（sp）：PDF 选了萌神拼音时，汉字头上那一截拼音要地方（src/export/score-pdf.ts 按字形墨迹算；屏幕上 = 0）。 */
  lyricRaise?: number;
  /** 只画这一张纸（曲段）：视图范围「本段」（user 2026-10-08「不同曲段应该是不同页，而不是一起显示」「视图里面应该也有个连续和分段」）。 */
  onlyPaper?: string;
  /** 正拿在手里拖的东西（token id：力度记号 / 渐强渐弱 / 字所在的音）：画成强调色（2026-10-08 user「然后拖动能不能给一点视觉反馈」）。 */
  hot?: ReadonlySet<number>;
  /** 光标所在那条 track 上这一段音（下标 [from, to)）染强调色：点开力度记号 / 渐强渐弱 / 渐到的小菜单时，看它管哪几个音、从哪里开始（2026-10-08 深夜 Opus 5.5，user「如何不混淆的搞清楚<到底是哪里开始的？」）。 */
  span?: { from: number; to: number } | null;
  /** 横卷（v0.9.35；user 2026-10-10「那个无限往右的总谱模式也做一下」）：不折行，每张纸一行、一直往右；width 只管歌名 / 作者栏 / 纸的控件那一屏，
   *  排出来的 Layout.width = 最长那张纸的右端（+ 尾巴，光标停在最后能接着点）。 */
  scroll?: boolean;
  /** 连续排法的纸边距（sp）：和分页同一张纸的几何，只是不断页（user 2026-10-08「连续和分页看到的行宽应该是一样的」「连续只是没有了断页，但是每一行还是一样的」）。 */
  margins?: { l: number; r: number; t: number; b: number };
  /** 刚写过（本次输入记录非空）：光标前那个音画成写字头（「−」/ 退格作用在它上）；挪过光标 / 轻点放的光标 = 不画（user 2026-10-08「如果是光标的话为什么前一个音是蓝的？」）。 */
  justWrote?: boolean;
  /** 光标画在上一行的末尾（光标正好在一行的最前面时）：点在上一行行末放的光标（2026-10-10 user「然后我希望光标能同时支持一行的末尾和下一行的开头两个位置取决于点在哪里」）。
   *  只挪画的位置，光标在串里的位置不变；不给 = 画在这一行的开头（v0.9.8 的默认）。 */
  caretEnd?: boolean;
  paperLabel?: string;                   // 纸右上角的小钮（扳手；这里的字只进悬停提示「纸：A5」）；点了 = 纸的设置（user「这种应该是纸的右上角有一个可以设置纸的属性吧。加图片的入口以后也可以放那里」；
                                         //   2026-10-07「然后那个A5改成扳手，是对纸的配置」——家族里扳手 = 配置这一样东西，同 WeebPaint 套索 / 导出图片的配置钮）
}
export const LYRIC_EM = 1.6;
/** 按节奏排时错开到第二行的歌词往下挪多少（sp）。 */
const LYRIC_ROW2 = LYRIC_EM * 1.2;
export interface LyricFit { dx: number; scale: number; row: 0 | 1; tight: boolean }
/** 歌词按节奏排的让路（v0.9.40；设计 = ai-docs/20261010-design-answers.md「歌词不想影响音符的位置」，user approved）：一行里的字（中心 cx、宽 w，单位 sp；hy = 后面有连字符 = 多留一点）。
 *  依次：① 左右借空（字往旁边挪，最多挪自己宽的 45% 或 0.8，不再死死居中）② 还挤 = 挤的那几个小一号（八成）③ 还挤 = 挤成一串的轮流放到第二行
 *  ④ 第二行也放不下 = 照写，标 tight（画灰、歌词框上说「挤了」）。纯函数。 */
export function fitLyrics(items: readonly { cx: number; w: number; hy?: boolean }[], gap = 0.5): LyricFit[] {
  const out: LyricFit[] = items.map(() => ({ dx: 0, scale: 1, row: 0, tight: false })), scale = items.map(() => 1);
  const g = (i: number) => gap + (items[i].hy ? 0.9 : 0);
  const place = (idx: number[]): { pos: number[]; bad: Set<number> } => {
    const pos = idx.map((i) => items[i].cx), half = idx.map((i) => (items[i].w * scale[i]) / 2), cap = idx.map((i) => Math.max(0.8, 0.45 * items[i].w));   // 能挪多远按原来的字宽（缩小了也照样能挪那么远，不然「小一号」几乎不起作用）
    for (let pass = 0; pass < 4; pass++) {
      for (let k = 1; k < idx.length; k++) { const need = pos[k - 1] + half[k - 1] + g(idx[k - 1]) + half[k]; if (pos[k] < need) pos[k] = Math.min(need, items[idx[k]].cx + cap[k]); }
      for (let k = idx.length - 2; k >= 0; k--) { const need = pos[k + 1] - half[k + 1] - g(idx[k]) - half[k]; if (pos[k] > need) pos[k] = Math.max(need, items[idx[k]].cx - cap[k]); }
    }
    const bad = new Set<number>();
    for (let k = 1; k < idx.length; k++) if (pos[k] - half[k] < pos[k - 1] + half[k - 1] + g(idx[k - 1]) - 1e-6) { bad.add(idx[k]); bad.add(idx[k - 1]); }
    return { pos, bad };
  };
  const all = items.map((_, i) => i);
  let r = place(all);
  if (r.bad.size) { for (const i of r.bad) scale[i] = 0.8; r = place(all); }
  if (!r.bad.size) { all.forEach((i, k) => { out[i] = { dx: r.pos[k] - items[i].cx, scale: scale[i], row: 0, tight: false }; }); return out; }
  const row = items.map(() => 0 as 0 | 1);
  let flip = 0; for (let i = 0; i < items.length; i++) { if (r.bad.has(i)) row[i] = (flip++ % 2) as 0 | 1; else flip = 0; }
  for (const rr of [0, 1] as const) {
    const idx = all.filter((i) => row[i] === rr), res = place(idx);
    idx.forEach((i, k) => { out[i] = { dx: res.pos[k] - items[i].cx, scale: scale[i], row: rr, tight: res.bad.has(i) }; });
  }
  return out;
}
const SCROLL_TAIL = 6;
/** 谱前简写那一列的宽度参照（7 个半角宽 = part-colors.ts ABBR_W）。 */
const ABBR_REF = "Vln.Vc.";   // sp：横卷每张纸内容后面留的尾巴
const NAME_MAX = 6.5;   // sp：谱前声部名一列最宽（再长折行；engrave() 里 nameLines）
const TEMPO_EM = 1.35;   // 速度记号的字号（sp）

/** 一条谱行（某张纸、某行、某个声部）：top/bottom = 这一条占的竖直范围（含歌词）。 */
export interface SystemBox { top: number; staffTop: number; bottom: number; paper: string; part: string; sys: number; staff: Staff }   // staff = 大谱表里是上（1）还是下（2）
export interface HitNote { index: number; system: number; x: number; y: number; w: number; d: number }
export interface Slot { caret: number; system: number; x: number; end?: true }   // end = 行末那个落点（光标在下一行开头的那个位置，点在这一行行末时画在这儿）
export interface LyricHit { index: number; system: number; x: number; y: number; tight?: true }   // x = 歌词中心，y = 基线；tight = 按节奏排时这个字挤（画灰，歌词框上说一声）
/** 记号（调号 / 拍号 / 速度）的点击区域（px）：点了就地改。谱头的调号 = 谱号 + 调号那一块（C 大调没有升降号也点得到）。 */
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
  systems: SystemBox[]; notes: HitNote[]; slots: Slot[]; lyrics: LyricHit[]; marks: MarkHit[]; dyns: DynHit[]; rests: RestHit[]; title: TitleHit; clefs: ClefHit[];
  arrangement: TitleHit | null;                 // 编排那一行（只在「全部」视图里有；点了就地改）
  credits: Box | null;                           // 作者栏那一块的点击区域（px；空着时是浅色提示）
  head: { system: number; x: number } | null;    // 光标在哪（画面跟随用；改的时候没有）
  parts: (Box & { paper: string; part: string })[];   // 歌手牌（每张纸第一行各条谱左边的声部名）的点击区域
  papers: { id: string; title: (TitleHit & { shown: boolean }); menu: Box | null; top: number; bottom: number; prev?: Box | null; next?: Box | null; scope?: Box }[];   // 多张纸：每张纸曲段名那一行右边一组「‹ k/n › 本段 ⋯」   // 每张纸：曲段名那一条（shown = 画了）、「⋯」、占的竖直范围
  addPaper: Box | null;                          // 扳手旁边的「＋」（新的纸；user「这个很低频的，可以小加号放在扳手旁边」）
  nav: { prev: Box | null; next: Box | null; scope: Box } | null;   // 歌名左边的「‹ 2/3 ›」+ 紧跟着「本段」开关（多于一张纸才画）
  paperMenu: Box | null;   // 曲段控件最后的「⋯」= 光标所在那张纸的菜单（编辑器里总画；只有一张纸时曲段控件就只有它）
  pageX: { left: number; right: number };        // 分页时版心左右的边距（px；svg 的 viewBox 往左扩这么多，页框画在负 x）；连续 = 0
  pages: { top: number; h: number }[];           // 分页时每页占的竖直范围（px）；连续 = []
  paperChip: Box | null;                         // 纸右上角小钮的点击区域（px）
  shortBars: number;   // 拍数和拍号对不上的小节有几个（状态行用；第一小节当弱起不算）
  lyricY: (system: number) => number;
  yOf: (system: number, d: number) => number;
  dOf: (system: number, y: number) => number;
}

// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
const SQUEEZE = 0.15;   // 一行最多压紧多少（音符总宽的比例）
const MARGIN = 1.2, BAR_W = 1.6, TITLE_H = 4.6;   // TITLE_H = 纸面最上面歌名那一条
const PAPER_H = 3.4, PAPER_GAP = 1.6, STUB_H = 2.4;
/** 纸上的小控件（不印）：在自己那一条里尽量大（2026-10-10 user「纸张上的小控件既然打印的时候不显示。在不影响点击和排版的时候为什么不做大一点，好点」）——
 *  高 = 曲段名那一条（3.4）减上下各 0.2；字放大；那一条本身不变高（排版 / 分页 / PDF 都不动）。 */
const CTL_H = 3.0, CTL_GLYPH = 2.0, CTL_TEXT = 1.4;   // 曲段名那一条；纸与纸之间多空的；隐藏声部的细行
/** 版式（sp）：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、行与行之间不留、没歌词的那条谱更矮。 */
const SPACING: Record<Density, { staffAbove: number; rowH: number; rowHNoLyric: number; graveUpper: number; lyricBelow: number; sysGap: number }> = {
  cozy: { staffAbove: 4.6, rowH: 13.4, rowHNoLyric: 11, graveUpper: 9.4, lyricBelow: 4.4, sysGap: 0.4 },   // graveUpper = 大谱表上面那条（没歌词、紧挨着下面那条）
  compact: { staffAbove: 4, rowH: 12.2, rowHNoLyric: 9.6, graveUpper: 8.6, lyricBelow: 4, sysGap: 0 },
};
const TOP_LINE = 38, MID_LINE = 34, BOTTOM_LINE = 30;
// 修的字形（SMuFL；宽 / 高 = staff space，浏览器里量的 Bravura：重音 1.36 × 0.99、跳音点 0.28、保持线 1.35 × 0.17）。Above 的从基线往上长，Below 的往下长
const ART_GLYPH: Record<Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper">, { above: string; below: string; w: number; h: number }> = {
  stress: { above: "\u{E4B6}", below: "\u{E4B7}", w: 1.0, h: 1.0 },     // 次重音（2026-10-08 深夜；宽高 = canvas 量的 Bravura 墨迹）
  unstress: { above: "\u{E4B8}", below: "\u{E4B9}", w: 1.6, h: 0.9 },   // 弱化
  accent: { above: "\u{E4A0}", below: "\u{E4A1}", w: 1.36, h: 0.99 },
  marcato: { above: "\u{E4AC}", below: "\u{E4AD}", w: 1.0, h: 1.08 },   // 强音（2026-10-08；宽按同字号和重音比着量的）
  staccato: { above: "\u{E4A2}", below: "\u{E4A3}", w: 0.28, h: 0.28 },
  tenuto: { above: "\u{E4A4}", below: "\u{E4A5}", w: 1.35, h: 0.17 },
};
const GLYPH_BREATH = "\u{E4CE}";   // breathMarkComma
/** 风格记号挤了往上错开一条道：一条道多高（谱上的级数，2 级 = 1 个间距）。 */
const GROOVE_LANE = 3.4;
const DYN_LANE = 4.8;   // 力度两道：外道（大的强弱线）比里道（音的修饰）高多少（谱上的级数 = 2.4 个线间距）
/** 强度那一组（重音 / 强音 / 次重音 / 弱化）：一律画在谱上方（user「强度记号统一放上面吧，不然容易misleading」）。 */
const isStrength = (a: string) => a === "accent" || a === "marcato" || a === "stress" || a === "unstress";
const DYN_GLYPH: Record<Dyn, string> = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" };     // F5 / B4 / E4 的五线谱位置
/** 力度字的墨迹（sp，相对字的原点：左、右、基线以上、基线以下）：浏览器里 canvas measureText 量的 Bravura（2026-10-08 Opus 5.5；此前估的宽度小了一截，渐强渐弱压到字上）。
 *  渐强渐弱和两头的字之间留 PIN_GAP；点击区域按它。 */
const DYN_INK: Record<string, [number, number, number, number]> = { ppp: [-0.4, 4.3, 1.1, 0.6], fff: [-0.6, 3.4, 1.8, 0.6], pp: [-0.4, 3, 1.1, 0.6], p: [-0.4, 1.5, 1.1, 0.6], mp: [-0.1, 3.3, 1.1, 0.6], mf: [-0.1, 3.3, 1.7, 0.7], f: [-0.6, 1.5, 1.8, 0.6], ff: [-0.6, 2.5, 1.8, 0.6] };
const PIN_GAP = 0.7;
/** 渐强渐弱比一整行还长 = 不画发夹，写「cresc. - - -」/「dim. - - -」（user 2026-10-08「如果一个超级长的<号不要让它太awkward」；
 *  记谱的老规矩：长的渐变用文字加虚线，发夹留给短的）。字号 / 大概字宽（sp）、虚线一节多长 / 隔多远。 */
const PIN_WORD = { size: 2.0, w: { cresc: 4.7, dim: 3.5 } } as const, DASH = { len: 0.6, gap: 1.0 } as const;
const SHARP_POS = [38, 35, 39, 36, 33, 37, 34], FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
const GLYPH_TUPLET = (n: number) => [...String(n)].map((d) => String.fromCodePoint(0xe880 + Number(d))).join("");

// ── 时值记法 ────────────────────────────────────────────────────────────
const MIN_PLAIN = TPQ / 8;
const NOTATABLE: { ticks: number; base: number; dotted: boolean }[] = [];
for (let b = WHOLE; b >= MIN_PLAIN; b /= 2) { NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false }); }
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
/** 把一个（写出来的）时值拆成能记的几段（贪心取最大的；段之间画连音线）。 */
export function splitDur(dur: number): { base: number; dotted: boolean; ticks: number }[] {
  const out: { base: number; dotted: boolean; ticks: number }[] = [];
  let left = dur;
  while (left > 0) {
    const n = NOTATABLE.find((v) => v.ticks <= left && (v.dotted ? v.base >= MIN_PLAIN * 2 : true));
    if (!n) { out.push({ base: MIN_PLAIN, dotted: false, ticks: left }); break; }
    out.push(n); left -= n.ticks;
  }
  return out;
}
/** 连音：n 个占 m 个（照 song.ts TUPLET）。时值不是三十二分的整数倍时，找一个比例让「写出来的时值」能记。 */
const RATIOS: [number, number][] = [[3, 2], [5, 4], [6, 4], [7, 4]];
export function notate(dur: number): { ratio: [number, number] | null; chunks: { base: number; dotted: boolean; ticks: number }[] } {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n, m] of RATIOS) {
    const written = (dur * n) / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: (c.ticks * m) / n })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}
const flagLevel = (base: number) => (base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base)));
const baseWidth = (base: number) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));   // 四分 3.6，每翻倍 +0.75（2026-10-07 收紧一点：原 4.0 / +0.8，SE2 一行放不下一小节八分）

// ── 排版单元 ────────────────────────────────────────────────────────────
interface Chunk {
  kind: "chunk"; index: number; j: number; last: boolean; base: number; dotted: boolean; note: boolean; ratio: [number, number] | null; ticks: number;
  pitch: Pitch | null; ghost: boolean; tie: boolean; lyric: string | null; hyph: boolean; inBar: number; beat: number; acc: number | null; w: number; accW: number;
  pitches: Pitch[]; accs: (number | null)[];   // 叠音：全部符头（从高到低，第一个 = pitch）+ 各自的临时记号
  art: Art[]; breath: boolean;                 // 修：第一段画跳音 / 重音 / 保持，最后一段后面画呼吸（2026-10-08）
  inhale?: "soft" | "big";                     // 呼吸出声：逗号后面写「吸」/「深吸」（2026-10-10）
  whisper?: boolean;                           // 气声：这个音（拆开的每一段）画 × 符头（2026-10-10）
  x: number; system: number; tick: number; staff: Staff;   // staff = 大谱表里在上还是下（单谱表 = 1）
}
interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; tick: number; staff: Staff; warn: boolean; auto: boolean; repeat?: Repeat; times?: number; style?: "double" | "final" }   // repeat = 反复小节线（Bravura 的反复记号字形，比细线宽）   // auto = 按拍号自动画的（index = -1，不是 token）
interface KeyU { kind: "key"; index: number; fifths: number; prev: number; w: number; x: number; system: number; tick: number; staff: Staff }
interface TimeU { kind: "time"; index: number; beats: number; beatType: number; w: number; x: number; system: number; tick: number; staff: Staff }
interface TempoU { kind: "tempo"; index: number; bpm: number; w: number; x: number; system: number; tick: number; staff: Staff }
interface HeadU { kind: "head"; index: -1; w: 0; x: number; system: number; tick: number; staff: Staff }   // 光标：零宽
interface PhraseU { kind: "phrase"; index: number; w: number; x: number; system: number; tick: number; staff: Staff }   // 句号：歌词行上一个小「。」（不换行、不换气）
interface DynU { kind: "dyn"; index: number; value: Dyn; w: number; x: number; system: number; tick: number; staff: Staff }   // 力度：谱上方一个字（不占地方，和后面那个音对齐）
interface HairpinU { kind: "hairpin"; index: number; dir: "cresc" | "dim"; w: number; x: number; system: number; tick: number; staff: Staff }   // 渐强渐弱：力度那一行，从这儿画到终点（不占地方）
interface GrooveU { kind: "groove"; index: number; w: number; x: number; system: number; tick: number; staff: Staff }   // 风格记号：谱上方一行斜体字（不占地方，和后面那个音对齐）
interface NavU { kind: "nav"; index: number; w: number; x: number; system: number; tick: number; staff: Staff; slot: number }   // slot：D.C. / D.S. / Fine / To Coda 在小节线前（这小节尾），房子 / Segno / Coda 在后（下一小节头）   // 房子 / 跳转记号（谱内反复）：画在谱上方的反复那一道，不占地方
interface ClefU { kind: "clef"; index: number; clef: ClefName; w: number; x: number; system: number; tick: number; staff: Staff }   // 行中间换谱号：画一个小一号的谱号（v0.9.28）
interface OttavaU { kind: "ottava"; index: number; w: number; x: number; system: number; tick: number; staff: Staff }   // 八度线：不占地方（线在谱上 / 下，按音的范围画）
type Unit = Chunk | BarU | KeyU | TimeU | TempoU | HeadU | PhraseU | DynU | HairpinU | GrooveU | NavU | ClefU | OttavaU;
const SLOT: Record<Unit["kind"], number> = { phrase: -1, bar: 0, nav: 0.5, clef: 0.8, key: 1, time: 2, tempo: 3, groove: 3.3, dyn: 3.5, ottava: 3.6, hairpin: 3.7, head: 4, chunk: 5 };
/** 行中间换谱号：小一号的谱号（谱号的 0.72）占多宽（sp）。 */
const CLEF_CUE = 0.72, CLEF_CUE_W = 2.74 * CLEF_CUE + 0.9;
const CLEF_GLYPH: Record<ClefName, string> = { G: GLYPH.gClef, G8vb: GLYPH.gClef8vb, G8va: GLYPH.gClef8va, G15ma: GLYPH.gClef15ma, F: GLYPH.fClef, F8vb: GLYPH.fClef8vb };   // 同一 tick 上的先后（句在小节线前：换气画在上一个音后面）
const keyWidth = (fifths: number, prev: number) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1.0;
const timeWidth = (beats: number, beatType: number) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;

interface Head { key: number; time: { beats: number; beatType: number }; bpm: number; idx: Partial<Record<"key" | "time" | "tempo", number>> }
/** 一条 track → 排版单元（第 1 步：切时值、临时记号、自动小节线；tick = 从这条的开头数）。caret 只在光标在这条上时给。 */
function unitsOf(tokens: Token[], o: { caret: number | null; autoBars: boolean; measureLyric: (s: string) => number; sp: number; rhythm?: boolean }): { units: Unit[]; head: Head; shortBars: number } {
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx: Head["idx"] = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") fifths = t.fifths; else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType }; else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const head: Head = { key: fifths, time, bpm, idx: headIdx };
  //   inBar = 这个小节里已经走了多少；满了（= len）不马上画小节线，等下一个音 / 记号 / 写字头 / 曲尾来了再画——
  //   紧跟着的是人插的「|」就用它那一条（不画两条）。拍号中途变了：没写完的这个小节就此结束（同存 MusicXML）。
  const units: Unit[] = [], measureLen = (b: number, bt: number) => (b * WHOLE) / bt;
  let accState = new Map<string, number>(), inBar = 0, measureNo = 0, shortBars = 0, tick = 0;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen(time.beats, time.beatType);
  const pushHead = () => { units.push({ kind: "head", index: -1, w: 0, x: 0, system: 0, tick, staff: 1 }); };
  const pushBar = (index: number, auto: boolean) => {
    const rb = index >= 0 ? (tokens[index] as BarTok) : null, repeat = rb?.repeat;
    const warn = inBar !== len && measureNo > 0 && !(repeat === "start" && inBar === 0);   // 第一小节 = 弱起，不标；开头的 |: 不算一个小节
    if (warn) shortBars++;
    // 反复小节线：字形宽 1.47（:|: 2.43）+ 两边留一点（Bravura repeatLeft / repeatRight / repeatRightLeft）
    const style = !repeat ? rb?.style : undefined;   // 段落线 / 终止线（v0.9.32）：比一根小节线宽一点
    units.push({ kind: "bar", index, w: repeat ? (repeat === "both" ? 2.43 : 1.47) + 0.8 : style ? BAR_W + 0.7 : BAR_W, x: 0, system: 0, tick, staff: 1, warn, auto, ...(repeat ? { repeat, ...(rb?.times ? { times: rb.times } : {}) } : {}), ...(style ? { style } : {}) });
    const empty = inBar === 0;
    accState = new Map(); inBar = 0; if (!(repeat === "start" && empty)) measureNo++;   // 小节开头的 |:（前面那条小节线之后紧跟着 / 纸头）不多数一个小节
  };
  const flushFull = () => { if (o.autoBars && inBar >= len && inBar > 0) pushBar(-1, true); };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (o.caret === i) { if (t.kind !== "bar") flushFull(); pushHead(); }   // 光标在满了的小节后面 = 画在小节线后面（下一个音写在那）
    if (t.kind === "bar") { pushBar(i, false); return; }
    if (t.kind === "key") {
      flushFull();
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: keyWidth(t.fifths, fifths), x: 0, system: 0, tick, staff: 1 });
      fifths = t.fifths; accState = new Map(); return;
    }
    if (t.kind === "time") {
      if (o.autoBars && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0, tick, staff: 1 });
      beat = beatTicks(t.beats, t.beatType); len = measureLen(t.beats, t.beatType); return;
    }
    if (t.kind === "tempo") { flushFull(); units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "phrase") { flushFull(); units.push({ kind: "phrase", index: i, w: 1.0, x: 0, system: 0, tick, staff: 1 }); return; }
    // 力度记号 / 渐强渐弱不占横向的地方（画在谱上下，不在音和音之间）：插 / 挪 / 删它们，音的位置、间距、折行一点都不变
    //   （2026-10-08 Opus 5.5，user「移动力度标识的时候最好音符的渲染布局一点也不改…尤其是间隔之类的，不要被力度标识的插入影响」；以前各占 0.3 个间距）
    if (t.kind === "dyn") { flushFull(); units.push({ kind: "dyn", index: i, value: t.value, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "hairpin") { flushFull(); units.push({ kind: "hairpin", index: i, dir: t.dir, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "groove") { flushFull(); units.push({ kind: "groove", index: i, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "clef") { flushFull(); units.push({ kind: "clef", index: i, clef: t.clef, w: CLEF_CUE_W, x: 0, system: 0, tick, staff: 1 }); return; }   // 谱号记号（v0.9.28）
    if (t.kind === "ottava") { flushFull(); units.push({ kind: "ottava", index: i, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }   // 八度线（v0.9.28）：不占横向地方   // 风格记号（拍子轻重）：同力度字，不占横向地方
    if (t.kind === "nav") { const head = t.what === "ending" || t.what === "segno" || t.what === "coda"; if (head) flushFull(); units.push({ kind: "nav", index: i, w: 0, x: 0, system: 0, tick, staff: 1, slot: head ? 0.5 : -0.5 }); return; }   // 房子 / 跳转：谱上方，不占地方（房子从下一小节开头起：满了的小节先画小节线）
    const isNote = t.kind === "note", nt = t as NoteTok;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const pitches = isNote ? (nt.pitch ? allPitches(nt) : [pitch!]) : [];
    // 一个音按自动小节线切成几段（不切 = 整个一段，和以前一样记）；每段再拆成能记的时值
    let left = t.dur, j = 0, lastChunk: Chunk | null = null;
    while (left > 1e-6) {
      flushFull();
      const piece = o.autoBars ? Math.min(left, len - inBar) : left;
      const { ratio, chunks } = notate(piece);
      let off = 0;
      for (const c of chunks) {
        const accs: (number | null)[] = pitches.map((pp) => {
          if (j !== 0 || (isNote && nt.tie)) return null;
          const key = `${pp.step}${pp.octave}`, cur = accState.has(key) ? accState.get(key)! : keyAlter(pp.step, fifths);
          if (pp.alter !== cur) { accState.set(key, pp.alter); return pp.alter; }
          return null;
        });
        const acc = accs[0] ?? null;
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = accs.some((a) => a !== null) ? 1.3 : 0;
        let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
        if (lyric && lyric !== MELISMA_MARK && !o.rhythm) w = Math.max(w, accW + o.measureLyric(lyricShow(lyric)) / o.sp + (nt.hyph ? 1.4 : 0.7));   // 按歌词排：字把音推开；按节奏排（v0.9.40）= 音只看时值
        const u: Chunk = { kind: "chunk", index: i, j, last: false, base: c.base, dotted: c.dotted, note: isNote, ratio, ticks: c.ticks, pitch,
          ghost: isNote && nt.pitch === null, tie: isNote && !!nt.tie && j === 0, lyric, hyph: !!(isNote && nt.hyph && j === 0), inBar: inBar + off, beat, acc, w, accW, x: 0, system: 0, tick: tick + off, staff: 1, pitches, accs,
          art: isNote && j === 0 ? (nt.art ?? []).filter((a) => a !== "breath") : [], breath: false, ...(isNote && nt.art?.includes("whisper") ? { whisper: true } : {}) };
        units.push(u); lastChunk = u;
        off += c.ticks; j++;
      }
      inBar += piece; left -= piece; tick += piece;
    }
    if (lastChunk) { lastChunk.last = true; if (isNote && nt.art?.includes("breath")) { lastChunk.breath = true; lastChunk.w += 0.8; if (nt.inhale) { lastChunk.inhale = nt.inhale; lastChunk.w += nt.inhale === "big" ? 2.1 : 1.2; } } }   // 出声的换气：逗号后面的字也留地方   // 呼吸逗号画在这个音后面：留一点地方
  });
  flushFull();   // 曲尾正好写满：画上这一条小节线
  if (o.caret !== null && o.caret >= tokens.length) pushHead();
  return { units, head, shortBars };
}

/** 一列：同一 tick、同一种东西（小节线 / 记号 / 音）各声部对齐在一起；宽 = 最宽的那个。 */
interface Col { tick: number; slot: number; n: number; w: number; x: number; system: number; units: Unit[]; bar: boolean; chunk: boolean; phrase: boolean }

export function engrave(song: Song, o: EngraveOpts): Layout {
  const clefStarts = resolveSongClefs(song);   // 每张纸每个声部开头的谱号（自动的按整首一路挑，和视图无关）
  const sp = o.sp, P = (v: number) => v * sp;
  const SPC = SPACING[densityOf(song.paper ?? { kind: "A5", widthMm: 0, heightMm: 0, marginMm: { l: 0, r: 0, t: 0, b: 0 } })];
  // 分页：第 k 页从 pageTopY(k) 起、高 PG.h；内容只放在上下边距之间；放不下的整块（一行谱 / 曲段名 + 第一行 / 细行）挪到下一页
  const PG = o.page ?? null, PAGE_GAP = 3, MX = o.page ?? o.margins ?? { l: 0, r: 0, t: 0, b: 1.5 };   // MX = 纸的边距（连续 / 分页同一套）
  const pageTopY = (k: number) => P(k * ((PG?.h ?? 0) + PAGE_GAP));
  const contentTop = (k: number) => pageTopY(k) + P(PG?.t ?? 0), contentBottom = (k: number) => pageTopY(k) + P((PG?.h ?? 0) - (PG?.b ?? 0));
  let pageNo = 0;
  const TOP = P(MX.t);
  const STAFF_ABOVE = SPC.staffAbove, LYRIC_BELOW = SPC.lyricBelow, SYS_GAP = SPC.sysGap;
  const prims: Prim[] = [];
  const sel = o.sel ?? null, writing = !sel, autoBars = o.autoBars !== false;
  const baseRight = o.width / sp - MARGIN;
  let right = baseRight, sheetRight = baseRight;   // 横卷：每张纸排完 right = 这张纸内容的右端 + SCROLL_TAIL；sheetRight = 最长那张
  const PART_EM = LYRIC_EM * 0.85;
  const nameW = (s: string) => (o.measureLyric(s) * PART_EM) / LYRIC_EM / sp;
  /** 声部名一列最宽 NAME_MAX（sp），再长就折行，不占五线谱的地方（user 2026-10-08「谱子前面的乐器名字如果很长的话应该换行而不是占用五线谱的空间」）。
   *  英文按词折、汉字按字折、一个词本身太长再按字母折；单谱表最多 3 行、大谱表 5 行，再多末尾「…」（全名在歌手牌里）。 */
  const nameLines = (name: string, staves: number): string[] => {
    if (nameW(name) <= NAME_MAX) return [name];
    const toks = name.match(/[A-Za-z0-9'’.\-()&]+\s*|\s+|./gu) ?? [name], lines: string[] = [];
    let cur = "";
    for (const t of toks) { if (!cur.trim() || nameW((cur + t).trimEnd()) <= NAME_MAX) cur += t; else { lines.push(cur.trimEnd()); cur = t.trimStart(); } }
    if (cur.trim()) lines.push(cur.trimEnd());
    const out = lines.flatMap((l) => {
      if (nameW(l) <= NAME_MAX) return [l];
      const ps: string[] = []; let c = "";
      for (const ch of [...l]) { if (c && nameW(c + ch) > NAME_MAX) { ps.push(c); c = ch; } else c += ch; }
      if (c) ps.push(c);
      return ps;
    });
    const max = staves === 2 ? 5 : 3;
    if (out.length > max) { out.length = max; let last = out[max - 1]; while (last && nameW(`${last}…`) > NAME_MAX) last = [...last].slice(0, -1).join(""); out[max - 1] = `${last}…`; }
    return out;
  };

  // 纸面最上面：歌名 + 作者栏 + 纸的小钮
  const titleSize = P(1.9), titleBase = TOP + P(TITLE_H * 0.62);
  if (song.title) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: song.title, cls: "song-title", size: titleSize, anchor: "middle" });
  else if (o.titlePlaceholder) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: "歌名", cls: "song-title empty", size: titleSize * 0.8, anchor: "middle" });   // user「虚框更不舒服，换回字提示（不过简短一点）」
  let paperChip: Box | null = null, addPaper: Box | null = null, nav: Layout["nav"] = null, paperMenu: Box | null = null;
  if (o.paperLabel) {   // 纸右上角：一个扳手小钮（纸的设置）+ 左边一个「＋」（新的纸，低频，收在角上）
    const ch = P(CTL_H), cw = ch, cx = o.width - P(MARGIN) - cw, cy = TOP + P(0.8), is = P(CTL_GLYPH);
    prims.push({ t: "rect", x: cx, y: cy, w: cw, h: ch, cls: "paper-chip" });
    prims.push({ t: "icon", id: "wrench", x: cx + (cw - is) / 2, y: cy + (ch - is) / 2, size: is, cls: "paper-chip-icon", title: `纸：${o.paperLabel}` });
    paperChip = { x: cx - P(0.5), y: cy - P(0.5), w: cw + P(1), h: ch + P(1) };
    if (o.titlePlaceholder) {
      const ax = cx - cw - P(0.6);
      prims.push({ t: "rect", x: ax, y: cy, w: cw, h: ch, cls: "paper-chip" });
      prims.push({ t: "text", x: ax + cw / 2, y: cy + ch * 0.74, s: "＋", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
      addPaper = { x: ax - P(0.5), y: cy - P(0.5), w: cw + P(1), h: ch + P(1) };
    }
  }
  if (o.titlePlaceholder && song.papers.length === 1) {   // 只有一张纸（没有曲段名那一行）：纸的「⋯」在歌名左边；多张纸 = 每张纸自己那一行上一组曲段控件（下面 drawPaperTitle）
    const ch = P(CTL_H), cw = P(CTL_H + 0.6), cy = TOP + P(0.8), mx = P(MARGIN);
    prims.push({ t: "rect", x: mx, y: cy, w: cw, h: ch, cls: "paper-chip" });
    prims.push({ t: "text", x: mx + cw / 2, y: cy + ch * 0.72, s: "⋯", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
    paperMenu = { x: mx - P(0.3), y: cy - P(0.4), w: cw + P(0.6), h: ch + P(0.8) };
  }
  const title: TitleHit = { x: P(MARGIN), y: TOP + P(0.3), w: o.width - P(2 * MARGIN), h: P(TITLE_H), baseline: titleBase, size: titleSize };
  // 作者栏：标题下面靠右，照写的一行一行显示（纯文本，不认格式；user「嗯所见即所得」）；空着时编辑器里画浅色短提示「作者」
  const lines = song.credits ? song.credits.split("\n") : [];
  let credits: Box | null = null;
  const cs = P(1.25), rx = o.width - P(MARGIN), y0 = TOP + P(TITLE_H + 1.0);
  if (lines.length) {
    lines.forEach((s, k) => prims.push({ t: "text", x: rx, y: y0 + k * cs * 1.35, s, cls: "credits", size: cs, anchor: "end" }));
    const w = Math.max(...lines.map((s) => (o.measureLyric(s) * 1.25) / LYRIC_EM)) + P(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + P(0.3), h: cs * 1.35 * lines.length + cs * 0.4 };
  } else if (o.titlePlaceholder) {
    prims.push({ t: "text", x: rx, y: y0, s: "作者", cls: "credits empty", size: cs, anchor: "end" });
    const w = (o.measureLyric("作者") * 1.25) / LYRIC_EM + P(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + P(0.3), h: cs * 1.75 };
  }
  // 编排（2026-10-08 深夜 Opus 5.5；user「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」）：
  //   作者栏下面单独一行、靠左；写错的（找不到的纸、循环段不在最后…）灰字说为什么（放不下 = 下一行），放的时候跳过（纪律）
  let arrangement: TitleHit | null = null, arrLast = 0;   // arrLast = 编排那一块最后一行的基线（px；五线谱从它下面开始）
  if (!o.onlyPaper) {
    const as = P(1.25), wOf = (t: string, size: number) => (o.measureLyric(t) * size) / LYRIC_EM, row = Math.max(lines.length, 1), base = y0 + row * cs * 1.35;
    const arr = parseArrangement(song.arrangement, song.papers), txt = song.arrangement?.trim() ?? "";
    const label = "编排　", lw = wOf(label, 1.25), x0 = P(MARGIN) + lw, avail = o.width - P(2 * MARGIN) - lw;
    prims.push({ t: "text", x: P(MARGIN), y: base, s: label, cls: txt ? "arr-label" : "arr-label empty", size: as, anchor: "start" });   // 没写编排 = 这个标签只是入口（提示），PDF 不印
    arrLast = base;
    if (txt) {
      prims.push({ t: "text", x: x0, y: base, s: txt, cls: "arr", size: as, anchor: "start" });
      if (arr.issues.length) {
        const why = `· ${arr.issues[0].why}${arr.issues.length > 1 ? ` 等 ${arr.issues.length} 处` : ""}`, tw = wOf(txt, 1.25) + P(0.8), fits = tw + wOf(why, 1.1) <= avail;
        prims.push({ t: "text", x: fits ? x0 + tw : x0, y: fits ? base : base + cs * 1.35, s: why, cls: "arr-issue", size: P(1.1), anchor: "start" });
        if (!fits) arrLast = base + cs * 1.35;
      }
    } else if (o.titlePlaceholder) {
      const full = "不写 = 每张纸按顺序各放一遍（例：前奏 (A A1)×3 A A2 [副歌]）", short = "不写 = 每张纸按顺序各放一遍";
      prims.push({ t: "text", x: x0, y: base, s: wOf(full, 1.25) <= avail ? full : short, cls: "arr-empty", size: as, anchor: "start" });
    }
    arrangement = { x: x0 - P(0.3), y: base - as * 1.15, w: avail + P(0.3), h: as * 1.6, baseline: base, size: as };
  }
  // 作者栏超过两行：第一张纸往下让（每多一行让一行字高），不和五线谱撞；编排那一行靠左，会和速度记号撞 = 五线谱从它下面开始
  const headExtra = Math.max(0, lines.length - 2) * 1.25 * 1.35;
  let yCur = Math.max(TOP + P(TITLE_H + headExtra + 0.5), arrangement ? arrLast + P(0.8) : 0);   // px，往下排的游标
  /** 分页：这一块（高 h px）在这页放不下 = 翻页（页顶上什么都还没放时不翻）。 */
  const ensure = (h: number) => { if (PG && yCur + h > contentBottom(pageNo) && yCur > contentTop(pageNo) + 1) { pageNo++; yCur = contentTop(pageNo); } };

  const rows: SystemBox[] = [], notes: HitNote[] = [], slots: Slot[] = [], lyrics: LyricHit[] = [], marks: MarkHit[] = [], dyns: DynHit[] = [], rests: RestHit[] = [], clefs: ClefHit[] = [];
  const partsHit: Layout["parts"] = [], papersHit: Layout["papers"] = [];
  let head: Layout["head"] = null, shortBars = 0;
  const rowTop = new Map<number, number>();   // 行号 → top（px）
  const rowAbove = new Map<number, number>(), lyricOff = new Map<number, number>(), dynYAt = new Map<number, number>(), noteDynYAt = new Map<number, number>(), navYAt = new Map<number, number>(), ottYAt = new Map<number, number>(), ottDownYAt = new Map<number, number>(), tempoYAt = new Map<number, number>(), grooveYAt = new Map<number, number>();   // + 速度记号的基线（px；第一个声部）   // 行号 → 谱上面留多少（sp）/ 歌词基线在第一线下多少（sp）；声部第一条谱行号 → 力度字基线（px）
  const staffTop = (r: number) => rowTop.get(r)! + P(rowAbove.get(r) ?? STAFF_ABOVE);
  const yOf = (r: number, d: number) => staffTop(r) + (TOP_LINE - d) * P(0.5);
  const dOf = (r: number, y: number) => Math.round(TOP_LINE - (y - staffTop(r)) / P(0.5));
  const lyricY = (r: number) => yOf(r, BOTTOM_LINE) + P(lyricOff.get(r) ?? LYRIC_BELOW);
  const staffHit = (r: number) => ({ y: yOf(r, TOP_LINE) - P(1.2), h: yOf(r, BOTTOM_LINE) - yOf(r, TOP_LINE) + P(2.4) });
  const drawTime = (r: number, x0: number, beats: number, beatType: number, cls: string) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    prims.push({ t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(r, 36), ch: num, cls });
    prims.push({ t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(r, 32), ch: den, cls });
    return cw;
  };
  /** 「Andante ♩ = 88」：词 + 四分音符 + 数（user「速度记号可以用语义+数字吗」）。 */
  const drawTempo = (r: number, x0: number, v: number, cls: string, index: number, change?: "up" | "down") => {
    const fs = TEMPO_EM * sp, word = tempoWord(v).it, y = tempoYAt.get(r) ?? staffTop(r) - P(2.4);   // 速度记号在最上面：高音、力度字（写上面的时候）都在它下面
    // 这一段开头的速度和上一段不一样 = 前面标一个强调色的 ↑（快了）/ ↓（慢了）提示（user 2026-10-08「不要grey out，而是有变化的时候会标一个东西提示用户」；一样 = 照常画，不标）
    if (change) prims.push({ t: "text", x: P(x0 - 0.3), y, s: change === "up" ? "↑" : "↓", cls: "tempo-change", size: fs, anchor: "end" });
    const ww = (o.measureLyric(word) * TEMPO_EM) / LYRIC_EM / sp, num = `= ${v}`, nw = (o.measureLyric(num) * TEMPO_EM) / LYRIC_EM / sp;
    prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
    const gx = x0 + ww + 0.7;
    prims.push({ t: "glyph", x: P(gx), y: y - P(0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
    prims.push({ t: "text", x: P(gx + 1.3), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
    marks.push({ index, kind: "tempo", system: r, x: P(x0 - 0.3), y: y - P(TEMPO_EM * 1.1), w: P(gx + 1.3 + nw + 0.6 - x0), h: P(TEMPO_EM * 1.5) });
  };
  const drawKeySig = (r: number, x0: number, f: number, cls: string, clef: "G" | "F" = "G") => {   // 低音谱号的升降号比高音低两级
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat, off = clef === "F" ? -2 : 0;
    for (let k = 0; k < Math.abs(f); k++) prims.push({ t: "glyph", x: P(x0 + k * 1.05), y: yOf(r, pos[k] + off), ch, cls });
  };

  const showPaperLine = song.papers.length > 1 || song.papers.some((p) => p.name);
  let drawn = 0;
  song.papers.forEach((paper, paperK) => {
    right = baseRight;
    if (o.onlyPaper && paper.id !== o.onlyPaper) return;   // 一次只看一张纸（曲段）
    if (drawn++ > 0) yCur += P(PAPER_GAP);
    // 速度记号画在这张纸最上面那位在场的歌手那一行（它的速度才算数；2026-10-08 user「第四章sheet只有第二个声部的时候速度记号失踪了」——原来只画全曲第一个声部的）。
    //   开头的速度和上一段（前面最近一张不隐藏的纸）结尾不一样 = 前面标 ↑ / ↓（user「然后如果速度和上一段一样和不一样的话应该也有ui上的差别」→「不要grey out，而是有变化的时候会标一个东西提示用户」）
    const owner = tempoOwner(song, paper), prevPaper = song.papers.slice(0, paperK).reverse().find((x) => !x.hidden), prevBpm = prevPaper ? sheetEndBpm(song, prevPaper) : null;
    const paperTop = yCur;
    // 曲段名那一条（多于一张纸或填了名字才画；空着画浅色提示；右边「⋯」= 纸的菜单）。分页时和第一行谱一起挪，所以等算完行高再画
    const pSize = P(1.6);
    let menu: Box | null = null;
    const paperNav: { prev?: Box | null; next?: Box | null; scope?: Box } = {};
    const pTitle: TitleHit & { shown: boolean } = { x: P(MARGIN), y: yCur, w: o.width - P(2 * MARGIN) - P(o.titlePlaceholder && song.papers.length > 1 ? 16 : 4), h: P(PAPER_H), baseline: 0, size: pSize, shown: showPaperLine };   // 右边让出曲段控件组
    const drawPaperTitle = (firstBlock: number) => {
      if (!showPaperLine) return;
      ensure(P(PAPER_H) + firstBlock);
      const pBase = yCur + P(PAPER_H * 0.68);
      pTitle.y = yCur; pTitle.baseline = pBase;
      if (paper.name) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: paper.name, cls: paper.hidden && !o.onlyPaper ? "paper-name hidden-paper" : "paper-name", size: pSize, anchor: "start" });   // 折叠的隐藏纸 = 控件（点了进去），PDF 不印
      else if (o.titlePlaceholder) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: "曲段名", cls: "paper-name empty", size: pSize, anchor: "start" });
      // 曲段控件组（2026-10-08 user「…能不能放在和曲段导航在一起」「就一个按钮toggle」「类似solo toggle」「然后曲段的...也放在曲段控件那里」
      //   「多曲段模式下面应该每个曲段都有对应的小控件组」）：每张纸自己那一行右边「‹ k/n › 本段 ⋯」——‹ › 从这张跳；本段 = 只看这张（亮）/ 回到全部；⋯ = 这张纸的菜单
      if (o.titlePlaceholder && song.papers.length > 1) {
        const k = song.papers.findIndex((p) => p.id === paper.id), n = song.papers.length, ch = P(CTL_H), cw = P(CTL_H), cy = yCur + P((PAPER_H - CTL_H) / 2);
        const lab = `${k + 1}/${n}`, lw = (o.measureLyric(lab) * CTL_TEXT) / LYRIC_EM + P(1.0), sw = (o.measureLyric("本段") * CTL_TEXT) / LYRIC_EM + P(1.6), mw = P(CTL_H + 0.6);
        const segOn = o.onlyPaper === paper.id, total = cw + lw + cw + P(1.0) + sw + P(0.6) + mw;
        let x = o.width - P(MARGIN) - total;
        const hit = (bx: number, w: number): Box => ({ x: bx - P(0.3), y: cy - P(0.2), w: w + P(0.6), h: ch + P(0.4) });   // 上下只多 0.2：不出曲段名那一条，不抢下面谱的点
        prims.push({ t: "rect", x, y: cy, w: cw, h: ch, cls: k > 0 ? "paper-chip" : "paper-chip off" });
        prims.push({ t: "text", x: x + cw / 2, y: cy + ch * 0.72, s: "‹", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        const prev = k > 0 ? hit(x, cw) : null; x += cw;
        prims.push({ t: "text", x: x + lw / 2, y: cy + ch * 0.7, s: lab, cls: "nav-text", size: P(CTL_TEXT), anchor: "middle" }); x += lw;
        prims.push({ t: "rect", x, y: cy, w: cw, h: ch, cls: k < n - 1 ? "paper-chip" : "paper-chip off" });
        prims.push({ t: "text", x: x + cw / 2, y: cy + ch * 0.72, s: "›", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        const next = k < n - 1 ? hit(x, cw) : null; x += cw + P(1.0);
        prims.push({ t: "rect", x, y: cy, w: sw, h: ch, cls: segOn ? "paper-chip on" : "paper-chip" });
        prims.push({ t: "text", x: x + sw / 2, y: cy + ch * 0.7, s: "本段", cls: segOn ? "nav-text on" : "nav-text", size: P(CTL_TEXT), anchor: "middle" });
        const scope = hit(x, sw); x += sw + P(0.6);
        prims.push({ t: "rect", x, y: cy, w: mw, h: ch, cls: "paper-chip" });
        prims.push({ t: "text", x: x + mw / 2, y: cy + ch * 0.72, s: "⋯", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        menu = hit(x, mw);
        Object.assign(paperNav, { prev, next, scope });
      }
      yCur += P(PAPER_H);
    };
    // 隐藏的纸（不放）：全部视图里折叠成曲段名 + 一条细行（点曲段名进去）；本段视图里照常画、顶上一行说明（user 2026-10-08「要明白的明白这是隐藏的」）
    if (paper.hidden && !o.onlyPaper) {
      drawPaperTitle(P(STUB_H));
      ensure(P(STUB_H));
      prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: "隐藏 · 不放（点曲段名进去）", cls: "part-stub", size: P(1.1), anchor: "start" });
      prims.push({ t: "line", x1: P(MARGIN + 0.2) + (o.measureLyric("隐藏 · 不放（点曲段名进去）") * 1.1) / LYRIC_EM + P(0.8), y1: yCur + P(STUB_H * 0.5), x2: P(right), y2: yCur + P(STUB_H * 0.5), w: P(0.08), cls: "part-stub-line" });
      yCur += P(STUB_H);
      papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
      return;
    }
    const present = o.parts.filter((p) => paper.tracks[p.id]), parts = present.filter((p) => !p.hidden), hiddenParts = present.filter((p) => p.hidden);
    // 隐藏的声部不消失：缩成一条细行（灰名字 + 「隐藏」），点它开歌手牌（user「hide的track怎么看见」）
    const stubs = () => {
      for (const p of hiddenParts) {
        ensure(P(STUB_H));
        prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: `${p.name} · 隐藏`, cls: "part-stub", size: P(1.1), anchor: "start" });
        prims.push({ t: "line", x1: P(MARGIN + 0.2) + (o.measureLyric(`${p.name} · 隐藏`) * 1.1) / LYRIC_EM + P(0.8), y1: yCur + P(STUB_H * 0.5), x2: P(right), y2: yCur + P(STUB_H * 0.5), w: P(0.08), cls: "part-stub-line" });
        partsHit.push({ paper: paper.id, part: p.id, x: P(MARGIN - 0.4), y: yCur, w: P(right - MARGIN + 0.4), h: P(STUB_H) });
        yCur += P(STUB_H);
      }
    };
    if (!parts.length) {   // 这张纸上没有显示的声部：只有细行（都隐藏了）或一行字（压根没声部）
      drawPaperTitle(P(hiddenParts.length ? STUB_H : 3.2));
      if (!hiddenParts.length) { prims.push({ t: "text", x: P(MARGIN), y: yCur + P(2.2), s: "（这张纸上没有声部）", cls: "paper-name empty", size: P(1.3), anchor: "start" }); yCur += P(3.2); }
      stubs();
      papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
      return;
    }
    // 1. 每个声部的排版单元
    const per = parts.map((p) => {
      const tokens = paper.tracks[p.id], focused = o.at.paper === paper.id && o.at.part === p.id, staves: 1 | 2 = p.staves === 2 ? 2 : 1;
      const u = unitsOf(tokens, { caret: focused && (writing || sel?.head != null) ? o.caret : null, autoBars, measureLyric: o.measureLyric, sp, rhythm: song.lyricFit !== "lyrics" });   // 替换模式：选区里也画写字头
      shortBars += u.shortBars;
      if (staves === 2) {   // 大谱表：每个音在上还是下（按音高自动 / 手动指定）；光标跟着前一个音
        const stf = staffOfTokens(tokens, 2); let last: Staff = 1;
        for (const x of u.units) { if (x.kind === "chunk") { x.staff = stf[x.index]; last = x.staff; } else if (x.kind === "head") x.staff = last; }
      }
      // 谱号（v0.9.28）：这张纸开头的（声部写了 = 它，没写 = 自动）+ 每个下标处生效的谱号 / 八度线；大谱表照旧上高音下低音
      const start: ClefName = staves === 2 ? "G" : clefStarts.get(paper.id)?.get(p.id) ?? "G";
      // 自动八度线（v0.9.37；user「自动加」）：在挑好的谱号下，一串很高 / 很低的音画 8va / 15ma / 8vb；手写的说了算；这位关了 / 大谱表 = 不自动。只管画，不存进谱
      const ds0 = displayStates(tokens, start), ao = staves === 2 || song.parts.find((x) => x.id === p.id)?.autoOttava === false ? null : autoOttava(tokens, ds0);
      const ds = ao ? { clef: ds0.clef, ott: ao.ott, auto: ao.auto as boolean[] | null, runs: ao.runs } : { ...ds0, auto: null as boolean[] | null, runs: [] as { from: number; to: number; shift: 1 | 2 | -1 }[] };
      const fFam = staves === 2 || isFClef(start) || tokens.some((t) => t.kind === "clef" && isFClef(t.clef));
      return { p, tokens, focused, staves, start, ds, fFam, ...u };
    });
    /** 同一个实际音高在谱上要挪几级：谱号 + 八度线（index < 0 = 这张纸开头的谱号）。大谱表 = 上高音下低音。 */
    const shAt = (q: (typeof per)[number], staff: Staff, index: number): number => q.staves === 2 ? (staff === 2 ? 12 : 0)
      : CLEF_SHIFT[(index >= 0 ? q.ds.clef[index] : undefined) ?? q.start] + ottavaShift(index >= 0 ? q.ds.ott[index] ?? 0 : 0);
    /** 第 s 行开头的谱号（这一行第一个东西那里生效的）。 */
    const clefAtSys = (q: (typeof per)[number], s: number): ClefName => {
      const u = q.units.find((x) => x.system === s && x.index >= 0); if (u) return q.ds.clef[u.index] ?? q.start;
      let c = q.start; for (const x of q.units) if (x.system < s && x.index >= 0) c = q.ds.clef[x.index] ?? c; return c;
    };
    /** 第 s 行开头的谱号是谁管的：最近的一个谱号记号的下标（−1 = 声部自己的谱号 / 自动）。 */
    const clefSrcAtSys = (q: (typeof per)[number], s: number): number => {
      const u = q.units.find((x) => x.system === s && x.index >= 0), upto = u ? u.index : q.tokens.length - 1;
      for (let i = upto; i >= 0; i--) if (q.tokens[i]?.kind === "clef") return i; return -1;
    };
    // 2. 合成列：同 tick 同种东西对齐（一条 track 里同一 tick 同一种的第 n 个 = 第 n 列）
    const colMap = new Map<string, Col>();
    for (const q of per) {
      const seen = new Map<string, number>();
      for (const u of q.units) {
        const sl = u.kind === "nav" ? u.slot : SLOT[u.kind], base = `${u.tick}:${sl}`, n = seen.get(base) ?? 0; seen.set(base, n + 1);
        const key = `${base}:${n}`;
        let c = colMap.get(key);
        if (!c) { c = { tick: u.tick, slot: sl, n, w: 0, x: 0, system: 0, units: [], bar: false, chunk: false, phrase: false }; colMap.set(key, c); }
        c.units.push(u); c.w = Math.max(c.w, u.w); if (u.kind === "bar") c.bar = true; if (u.kind === "chunk") c.chunk = true; if (u.kind === "phrase") c.phrase = true;
      }
    }
    const cols = [...colMap.values()].sort((a, b) => a.tick - b.tick || a.slot - b.slot || a.n - b.n);
    // 哪些小节线列后面能折行：没有哪个声部的音跨过这一拍
    const spans = per.flatMap((q) => q.units.filter((u): u is Chunk => u.kind === "chunk").map((u) => [u.tick, u.tick + u.ticks] as const));
    const breakableAt = (tick: number) => !spans.some(([a, b]) => a < tick - 1e-6 && b > tick + 1e-6);
    // 3. 折行（像文字：优先在小节线后折；一个小节都放不下就逐列折）。每行开头的调号 = 各声部那里生效的调号；行首宽 = 最宽的那个声部
    const ind0 = Math.max(...parts.map((p) => Math.max(...nameLines(p.name, p.staves ?? 1).map(nameW)))) + 1.4;   // 第一行让给声部名的缩进（sp；名字折行后最宽的那一行）
    // 第二行起每行写简写（v0.9.31；user「todo 总谱的每一行都放乐器名的省空间简写」→「乐手名和颜色同意」）：缩进 = 最宽的那个简写；没给简写（测试 / 老调用）= 0，照旧
    //   v0.9.41：定宽（user 经仓鼠转达「没简写的能不能想办法也按定宽裁一下，不然有一个没查到简写就beat the propose了」）——简写已按 ABBR_W 裁好（part-colors.ts fitAbbr），
    //   列宽 = 一个 ABBR_W 宽的参照（Vln.Vc.），不随谁最长变；字形特别宽、量出来超了参照的那个才撑一点（不叠到谱上）
    const indN = parts.some((p) => p.abbr) ? Math.max(nameW(ABBR_REF), ...parts.map((p) => nameW(p.abbr ?? ""))) + 1.4 : 0;
    const keyNow = new Map<string, number>(per.map((q) => [q.p.id, q.head.key]));
    const clefW = (q: { fFam: boolean }) => (q.fFam ? W.fClef : W.gClef);
    const headerOf = (first: boolean) => Math.max(...per.map((q) => {
      const f = keyNow.get(q.p.id)!;
      return (first ? ind0 : indN) + MARGIN + 0.6 + clefW(q) + 1.0 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(q.head.time.beats, q.head.time.beatType) + 1.2 : 0.4);
    }));
    let system = 0, x = headerOf(true);
    const sysStarts: number[] = [x], sysKeys: Map<string, number>[] = [new Map(keyNow)];
    const newline = () => { system++; x = headerOf(false); sysStarts.push(x); sysKeys.push(new Map(keyNow)); };
    const placedCols: Col[] = [];
    const place = (c: Col) => { c.x = x; c.system = system; x += c.w; placedCols.push(c); for (const u of c.units) { u.x = c.x; u.system = system; if (u.kind === "key") keyNow.set(per.find((q) => q.units.includes(u))!.p.id, u.fifths); } };
    const chunkW = (cs: Col[]) => cs.reduce((a, c) => a + (c.chunk ? c.w : 0), 0);
    let seg: Col[] = [];
    // 挤一挤（user「「稍微超出一点的小节」压进当前行 这个就是我想要的」）：下一个小节只超出这一行音符总宽的 SQUEEZE 以内 = 留在这一行、整行压紧一点（下面右端对齐那一步压）。
    const brk = o.scroll ? Infinity : right;   // 横卷 = 不折行
    const flush = () => {
      const segW = seg.reduce((s, c) => s + c.w, 0), closed = seg.length > 0 && seg[seg.length - 1].bar;
      const over = x + segW + (closed ? 0 : BAR_W) - brk;
      if (over > 0 && x > sysStarts[system] + 0.01) {
        const lineChunks = chunkW(placedCols.filter((c) => c.system === system)) + chunkW(seg);
        if (over <= lineChunks * SQUEEZE) { for (const c of seg) place(c); seg = []; return; }
        newline();
      }
      for (const c of seg) { if (x + c.w > brk && x > sysStarts[system] + 0.01) newline(); place(c); }
      seg = [];
    };
    // 句不换行（user 2026-10-08「不应该按照句换行，打谱软件没这么干的」）：只是换气记号 + 「合」的边界；折行照旧只在小节线后
    for (const c of cols) { seg.push(c); if (c.bar && breakableAt(c.tick)) flush(); }
    flush();
    const nSys = system + 1;
    // 右端对齐：多出来的地方按宽度分给这一行的音 / 休止（小节线、记号不拉宽）；挤进来超出的行（最后一行也算）同样按宽度压回来
    for (let s = 0; s < nSys; s++) {
      const row = cols.filter((c) => c.system === s);
      const end = row.reduce((m, c) => Math.max(m, c.x + c.w), sysStarts[s]), avail = brk - sysStarts[s], used = end - sysStarts[s];
      if (used <= avail + 1e-6 && (s === nSys - 1 || used < avail * 0.6)) continue;
      const gw = chunkW(row);
      if (!gw) continue;
      const k = (avail - used) / gw;
      let xx = sysStarts[s];
      for (const c of row) { c.x = xx; if (c.chunk) c.w *= 1 + k; xx += c.w; for (const u of c.units) { u.x = c.x; if (u.kind === "chunk") u.w = c.w; } }
    }
    // 横卷：这张纸的右端 = 内容的右端 + 尾巴（光标停在最后那儿照旧画到右边、能点着接着写）
    if (o.scroll) { right = Math.max(baseRight, ...cols.map((c) => c.x + c.w)) + SCROLL_TAIL; sheetRight = Math.max(sheetRight, right); }
    // 3½. 光标在一行的最前面 = 就画在这一行的开头（2026-10-10 user「记账：光标应该在每行的开头而不是上一行的末尾」「能不能顺便把光标在行开头给修一下，很影响工作」）。
    //   2026-10-08 曾按 user 当时的问法「到行末的时候光标应该在行末而不是下一行开头？」把它挪到上一行末尾画（同文本编辑器）；10-10 user 改了主意，不挪了。
    //   同一天 user「然后我希望光标能同时支持一行的末尾和下一行的开头两个位置取决于点在哪里」→ 默认照旧在开头；点在上一行行末放的光标（caretEnd）= 画在上一行末尾。
    if (o.caretEnd) for (const q of per) for (const u of q.units) {
      if (u.kind !== "head" || u.system === 0) continue;
      if (cols.some((c) => c.system === u.system && c.chunk && c.x < u.x - 1e-6)) continue;   // 这一行里它前面已经有音 / 休止 = 不在行首
      const prevRow = cols.filter((c) => c.system === u.system - 1);
      if (!prevRow.length) continue;
      u.system -= 1; u.x = Math.max(...prevRow.map((c) => c.x + c.w));
    }
    // 4. 行号与坐标：这张纸第 s 行第 r 个声部的第 k 张谱表 = 一条谱行（大谱表两条；紧凑版式里这张纸上没写歌词的声部那条更矮）
    const rowBase = rows.length, nR = parts.length;
    const rowStart = per.map((_, i) => per.slice(0, i).reduce((a, q) => a + q.staves, 0)), nRowsSys = per.reduce((a, q) => a + q.staves, 0);
    const rowOf = (s: number, r: number, k = 0) => rowBase + s * nRowsSys + rowStart[r] + k;
    // 4½. 行距按内容（2026-10-08 Opus 5.5；user「和歌词一样能不能根据有没有来自动调整行距」「行距计算应该考虑到有没有歌词，最高最低符号的位置之类的」）：
    //   每一行（这张纸第 s 行 × 声部 × 谱表）估最高 / 最低（符头、符干的大概、加线、演奏法）；谱上下的空从版式的最小值起，内容要更多才加。
    //   力度那一行一律写在谱上面（大谱表 = 上面那条谱的上面）：user 2026-10-09「有没有歌词的时候强度符号都统一放谱子上面」
    //   （v0.7.8 起是有歌词上面、大谱表中间、其余下面——按 user 那时问的「感觉一般强弱是写下面而不是上面的吧？然后同时有两个谱号就是写中间？」做的，这次统一了）；
    //   这一行这个声部真有力度记号 / 渐强渐弱 / sfz fp 才留地方。
    const lyricsOf = per.map((q) => q.tokens.some((t) => t.kind === "note" && t.lyric));
    // 歌词按节奏排（v0.9.40；user「先试下你说的两个歌词开关吧，approved」）：音的位置只看时值，歌词让路（fitLyrics）。在算行高之前排好：错开到第二行的那一行要多留一行字
    const lyrPlan = new Map<string, LyricFit>(), lyr2 = new Set<string>();   // 键 = 声部序号:下标 / 声部序号:行
    if (song.lyricFit !== "lyrics") per.forEach((q, r) => {
      if (!lyricsOf[r]) return;
      const bySys = new Map<number, { index: number; cx: number; w: number; hy?: boolean }[]>();
      for (const u of q.units) if (u.kind === "chunk" && u.lyric && u.lyric !== MELISMA_MARK) {
        const arr = bySys.get(u.system) ?? []; bySys.set(u.system, arr);
        arr.push({ index: u.index, cx: u.x + u.accW + 0.6, w: o.measureLyric(lyricShow(u.lyric)) / sp, hy: u.hyph });
      }
      for (const [sy, items] of bySys) {
        items.sort((a, b) => a.cx - b.cx);
        fitLyrics(items).forEach((f, k) => { lyrPlan.set(`${r}:${items[k].index}`, f); if (f.row) lyr2.add(`${r}:${sy}`); });
      }
    });
    const extentOf = (q: (typeof per)[number], s: number, k: number) => {
      let top = TOP_LINE, bot = BOTTOM_LINE;
      for (const u of q.units) {
        if (u.kind !== "chunk" || u.system !== s || !u.note || (u.staff ?? 1) !== k + 1) continue;
        const ds = (u.pitches.length ? u.pitches : u.pitch ? [u.pitch] : []).map((pp) => diatonicIndex(pp) + shAt(q, (k + 1) as Staff, u.index)); if (!ds.length) continue;
        const hi = Math.max(...ds), lo = Math.min(...ds), stem = u.base < WHOLE, up = (hi + lo) / 2 < MID_LINE;
        top = Math.max(top, hi + (stem && up ? 7 : 1)); bot = Math.min(bot, lo - (stem && !up ? 7 : 1));
        if (u.art.some((a) => a === "staccato" || a === "tenuto")) { if (up) bot = Math.min(bot, lo - 3); else top = Math.max(top, hi + 3); }   // 跳音 / 保持在符干另一侧
        if (u.art.some(isStrength)) top = Math.max(top, (stem && up ? hi + 7 : hi + 3) + 4, TOP_LINE + 5);   // 强度那一组一律在上面（越过朝上的符干）
      }
      return { top, bot };
    };
    // 力度两道（2026-10-09，user「音内渐强和mf叠一块，有空想一下音的强弱修饰和大的强弱线怎么处理」→ AI 提 A 一条线横着排 / B 两道，user「两道 可以」）：
    //   里道 = 音的修饰（sfz / fp / 音内起伏：只属于这一个音，在这个音的宽度里），靠谱；外道 = 大的强弱线（pp…ff、渐强渐弱、渐到：状态，管到下一个），在里道上面。
    //   两层不在同一道里抢地方；这一行真有音的修饰才多占一道。
    const bigDynIn = (q: (typeof per)[number], s: number) => q.units.some((u) => u.system === s && (u.kind === "dyn" || u.kind === "hairpin"));
    const noteDynIn = (q: (typeof per)[number], s: number) => q.units.some((u) => u.system === s && u.kind === "chunk" && u.note && (u.art.includes("sfz") || u.art.includes("fp") || !!(q.tokens[u.index] as NoteTok).swell));
    /** 第 s 行：每个声部每张谱表的「上面留多少 / 下面留多少 / 歌词基线」（sp）+ 力度字基线的位置（谱上的级数；中间那种放好了再算）。 */
    const ottIn = (q: (typeof per)[number], s: number, up: boolean) => q.staves === 1 && q.units.some((u) => u.system === s && u.kind === "chunk" && (up ? (q.ds.ott[u.index] ?? 0) > 0 : (q.ds.ott[u.index] ?? 0) < 0));
    const geoOf = (s: number) => per.map((q, r) => {
      const ex = Array.from({ length: q.staves }, (_, k) => extentOf(q, s, k)), big = bigDynIn(q, s), own = noteDynIn(q, s), dyn = big || own;
      const ottUp = ottIn(q, s, true), ottDown = ottIn(q, s, false);   // 八度线（v0.9.28）：8va / 15ma 在谱上面一道，8vb 在谱下面（歌词往下让）
      const g = ex.map((e, k) => {
        const minBelow = q.staves === 2 && k === 0 ? SPC.graveUpper - STAFF_ABOVE - 4 : (lyricsOf[r] ? SPC.rowH : SPC.rowHNoLyric) - STAFF_ABOVE - 4;
        let above = Math.max(STAFF_ABOVE, (e.top - TOP_LINE) / 2 + 0.8), below = Math.max(minBelow, (BOTTOM_LINE - e.bot) / 2 + 0.8), lyric: number | null = null;
        if (ottDown) below = Math.max(below, (BOTTOM_LINE - e.bot) / 2 + 3.0);
        if (lyricsOf[r] && k === q.staves - 1) { lyric = Math.max(LYRIC_BELOW, (BOTTOM_LINE - e.bot) / 2 + 2.0 + (ottDown ? 2.4 : 0)) + (o.lyricRaise ?? 0); below = Math.max(below, lyric + (SPC.rowH - STAFF_ABOVE - 4 - LYRIC_BELOW)) + (lyr2.has(`${r}:${s}`) ? LYRIC_ROW2 : 0); }
        return { above, below, lyric, dynD: null as number | null, noteDynD: null as number | null, navD: null as number | null, tempoD: null as number | null, grooveD: null as number | null, ottD: null as number | null, ottDownD: null as number | null };
      });
      const lane0 = Math.max(TOP_LINE + 2.4, ex[0].top + 3);   // 最靠谱的那一道（f 这种字有下伸：离音远一点）
      if (own) g[0].noteDynD = lane0;
      if (big) g[0].dynD = own ? lane0 + DYN_LANE : lane0;
      if (ottUp) g[0].ottD = Math.max(TOP_LINE + 4.4, ex[0].top + 3, (g[0].dynD ?? g[0].noteDynD ?? -99) + 4.4);   // 8va / 15ma：力度外道上面
      if (ottDown) g[0].ottDownD = Math.min(BOTTOM_LINE - 3.2, ex[0].bot - 3.2);
      // 谱内反复那一道（房子 / Segno / Coda / D.C.… / ×3）：力度外道上面；这一行真有才留地方
      if (q.units.some((u) => u.system === s && (u.kind === "nav" || (u.kind === "bar" && !!u.times && u.times > 2)))) g[0].navD = Math.max(TOP_LINE + 5.4, ex[0].top + 4, (g[0].ottD ?? g[0].dynD ?? g[0].noteDynD ?? -99) + 5.2);
      const topDyn = g[0].navD ?? g[0].ottD ?? g[0].dynD ?? g[0].noteDynD;   // 最上面那一道（速度 / 风格记号在它上面）
      if (topDyn !== null) g[0].above = Math.max(g[0].above, (topDyn - TOP_LINE) / 2 + 2.2);
      if (q.p.id === owner) {   // 速度记号（这张纸最上面那位在场的歌手上面）：在最高的音和写在上面的力度字之上
        const t = Math.max(TOP_LINE + 4.8, ex[0].top + 3, topDyn !== null ? topDyn + 4.6 : 0); g[0].tempoD = t; g[0].above = Math.max(g[0].above, (t - TOP_LINE) / 2 + 1.6);
      }
      const nGroove = q.units.filter((u) => u.system === s && u.kind === "groove").length;
      if (nGroove) {   // 风格记号：速度记号那一行再上面一行；没有速度记号 = 和速度记号一样的高度；一行谱里两个以上 = 多留一行（挤了错开，见下面画的地方）
        const t = g[0].tempoD !== null ? g[0].tempoD + 4.6 : Math.max(TOP_LINE + 4.8, ex[0].top + 3, topDyn !== null ? topDyn + 4.6 : 0); g[0].grooveD = t; g[0].above = Math.max(g[0].above, (t + (nGroove > 1 ? GROOVE_LANE : 0) - TOP_LINE) / 2 + 1.6);
      }
      return { g, ex, dyn };
    });
    const sysHOf = (G: ReturnType<typeof geoOf>) => P(G.reduce((n, x) => n + x.g.reduce((m, y) => m + y.above + 4 + y.below, 0), 0) + SYS_GAP);
    const geos = Array.from({ length: nSys }, (_, s) => geoOf(s));
    drawPaperTitle(geos.length ? sysHOf(geos[0]) : P(SPC.rowH));
    if (paper.hidden) { ensure(P(STUB_H)); prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: "这张纸隐藏着：不放、不进压平件（「⋯」里显示）", cls: "part-stub hidden-note", size: P(1.1), anchor: "start" }); yCur += P(STUB_H); }
    for (let s = 0; s < nSys; s++) {
      const G = geos[s];
      ensure(sysHOf(G));   // 分页：一行谱整块放不下就翻页
      for (let r = 0; r < nR; r++) for (let k = 0; k < per[r].staves; k++) {
        const top = yCur, row = rowOf(s, r, k), g = G[r].g[k], h = g.above + 4 + g.below;
        rowTop.set(row, top); rowAbove.set(row, g.above); if (g.lyric !== null) lyricOff.set(row, g.lyric);
        rows.push({ top, staffTop: top + P(g.above), bottom: top + P(h), paper: paper.id, part: parts[r].id, sys: s, staff: (k + 1) as Staff }); yCur += P(h);
      }
      for (let r = 0; r < nR; r++) {   // 力度字的基线（px）：按算好的级数（谱上面）
        const x = G[r], r0 = rowOf(s, r, 0);
        if (x.g[0].tempoD !== null) tempoYAt.set(r0, yOf(r0, x.g[0].tempoD));
        if (x.g[0].grooveD !== null) grooveYAt.set(r0, yOf(r0, x.g[0].grooveD));
        dynYAt.set(r0, yOf(r0, x.g[0].dynD ?? TOP_LINE + 2.4));
        noteDynYAt.set(r0, yOf(r0, x.g[0].noteDynD ?? TOP_LINE + 2.4));
        if (x.g[0].navD !== null) navYAt.set(r0, yOf(r0, x.g[0].navD));
        if (x.g[0].ottD !== null) ottYAt.set(r0, yOf(r0, x.g[0].ottD));
        if (x.g[0].ottDownD !== null) ottDownYAt.set(r0, yOf(r0, x.g[0].ottDownD));
      }
      yCur += P(SYS_GAP);
    }
    // 每行五线画到哪：这一行最后一列是小节线 = 到那根小节线为止（不出头；user 2026-10-08「每行五线谱最好过了最后一个小节线能不能不出头」）；
    //   后面还有音 / 写字头（光标停在最后一根小节线后面）= 照旧画到右边（写的地方）。小节线画在列的 x + 0.7（见下面第 6 步）
    const staffEnd = Array.from({ length: nSys }, (_, s) => {
      const row = placedCols.filter((c) => c.system === s); if (!row.length) return right;
      const last = row.reduce((a, c) => (c.x > a.x || (c.x === a.x && (c.slot > a.slot || (c.slot === a.slot && c.n > a.n))) ? c : a));
      return last.bar ? Math.min(right, last.x + 0.7) : right;
    });
    // 5. 每条谱：五线、谱号、调号、拍号（第一行）、速度（第一个声部）、歌手牌（第一行）；几条谱左边一根竖线连着
    for (let s = 0; s < nSys; s++) {
      const ind = s === 0 ? ind0 : indN;
      per.forEach((q, r) => {
        const f = sysKeys[s].get(q.p.id) ?? q.head.key;
        for (let k = 0; k < q.staves; k++) {
          const row = rowOf(s, r, k), clef: ClefName = q.staves === 2 ? (k ? "F" : "G") : clefAtSys(q, s), base = baseClef(clef);
          for (let L = 0; L < 5; L++) { const y = yOf(row, BOTTOM_LINE + 2 * L); prims.push({ t: "line", x1: P(MARGIN + ind), y1: y, x2: P(staffEnd[s]), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
          let hx = MARGIN + ind + 0.6;
          prims.push({ t: "glyph", x: P(hx), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[clef], cls: "clef" });   // 高音谱号挂 G 线（第 2 线）、低音谱号挂 F 线（第 4 线）；八度谱号的小 8 / 15 在字形里
          if (q.staves === 1) clefs.push({ kind: "start", paper: paper.id, part: q.p.id, index: clefSrcAtSys(q, s), system: row, x: P(hx - 0.3), ...staffHit(row), w: P(clefW(q) + 0.6) });   // 点谱号 = 换谱号（v0.9.28）
          hx += clefW(q) + 1.0;
          const keyX0 = hx;
          drawKeySig(row, hx, f, "keysig", base); hx += Math.abs(f) * 1.05;
          if (s === 0) {
            // 谱头记号的点击区域：谱号 + 调号一块（改调号）、拍号（改拍号）、上方速度（改速度）
            if (q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row, x: P(keyX0 - 0.3), ...staffHit(row), w: P(Math.max(1.2, hx - keyX0 + 0.3)) });   // 调号（谱号那一块归谱号，v0.9.28）
            if (f) hx += 0.8;
            const cw = drawTime(row, hx, q.head.time.beats, q.head.time.beatType, "timesig");
            if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row, x: P(hx - 0.3), ...staffHit(row), w: P(cw + 0.6) });
            if (k === 0 && q.p.id === owner && q.head.idx.tempo !== undefined) drawTempo(row, MARGIN + ind + 0.6, q.head.bpm, "tempo", q.head.idx.tempo, prevBpm === null || prevBpm === q.head.bpm ? undefined : q.head.bpm > prevBpm ? "up" : "down");
          }
        }
        if (s === 0) {
          // 歌手牌：声部名在第一行谱号左边、竖着居中（大谱表 = 两条谱表之间）（user「歌手牌同意，和打谱软件对齐」「乐器名可以选择一大堆乐器，然后下面可以in place改」）
          const r0 = rowOf(s, r, 0), r1 = rowOf(s, r, q.staves - 1), lines = nameLines(q.p.name, q.staves), LH = PART_EM * 1.15;
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + P(0.55 * PART_EM) - P((LH * (lines.length - 1)) / 2);   // 几行一起竖着居中
          const ncls = q.p.empty ? "part-name empty" : q.focused ? "part-name focus" : "part-name";
          lines.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: ln, cls: ncls, size: PART_EM * sp, anchor: "start" }));
          if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (lines.length - 1)) + P(1.5), s: q.p.badges.join(" "), cls: "part-badge", size: P(1.0), anchor: "start" });   // 出声 / 显示状态的角标（user「hide, mute solo这些视图层的东西应该是在谱子上能看到」）
          partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: yOf(r0, TOP_LINE) - P(1.2), w: P(ind0 + 0.2), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE) + P(2.4) });
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - P(PART_EM * 0.62), w: P(0.6), h: P(0.6), cls: `cat-dot cat-${q.p.colorIdx}` });   // 名字前一个小色点（不印）
        } else if (q.p.abbr) {   // 第二行起：简写（一行，竖着居中），点它同样开歌手牌
          const r0 = rowOf(s, r, 0), r1 = rowOf(s, r, q.staves - 1);
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + P(0.55 * PART_EM);
          prims.push({ t: "text", x: P(MARGIN), y: ny, s: q.p.abbr, cls: q.p.empty ? "part-name abbr empty" : q.focused ? "part-name abbr focus" : "part-name abbr", size: PART_EM * sp, anchor: "start" });
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - P(PART_EM * 0.62), w: P(0.6), h: P(0.6), cls: `cat-dot cat-${q.p.colorIdx}` });
          partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: yOf(r0, TOP_LINE) - P(1.2), w: P(indN + 0.2), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE) + P(2.4) });
        }
        if (q.p.colorIdx !== undefined) {   // 每行左边一条细色条（类别色；不印）：谱号左边、从第一线到最后一线
          const r0 = rowOf(s, r, 0), r1 = rowOf(s, r, q.staves - 1);
          prims.push({ t: "rect", x: P(MARGIN + ind - 0.8), y: yOf(r0, TOP_LINE), w: P(0.3), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE), cls: `cat-bar cat-${q.p.colorIdx}` });
        }
        if (q.staves === 2) {   // 大谱表的花括号：两条谱表左边一根粗线 + 两头小钩
          const bx = P(MARGIN + ind - 0.7), y0 = yOf(rowOf(s, r, 0), TOP_LINE), y1 = yOf(rowOf(s, r, 1), BOTTOM_LINE);
          prims.push({ t: "path", d: `M${bx + P(0.5)},${y0}Q${bx - P(0.3)},${y0 + P(0.6)} ${bx},${(y0 + y1) / 2}Q${bx - P(0.3)},${y1 - P(0.6)} ${bx + P(0.5)},${y1}`, cls: "brace" });
        }
      });
      if (nRowsSys > 1) prims.push({ t: "line", x1: P(MARGIN + ind), y1: yOf(rowOf(s, 0, 0), TOP_LINE), x2: P(MARGIN + ind), y2: yOf(rowOf(s, nR - 1, per[nR - 1].staves - 1), BOTTOM_LINE), w: P(ENGRAVE.thinBar * 1.4), cls: "bar" });
    }
    // 6. 各声部的内容
    per.forEach((q, r) => {
      const tokens = q.tokens, units = q.units, focused = q.focused;
      const dynOff = dynOverridden(tokens);   // 被紧跟着的强后即弱（fp）盖掉的力度记号：画灰（纪律：画灰 + 明说；点开小菜单说为什么）
      const clefOf = (staff: Staff, index = -1): "G" | "F" => (q.staves === 2 ? (staff === 2 ? "F" : "G") : baseClef((index >= 0 ? q.ds.clef[index] : undefined) ?? q.start));
      // 谱号 + 八度线（v0.9.28）：同一个实际音高在谱上挪几级（低音谱号 +12、下加 8 +7、8va 线 −7…；高音谱号顶线 F5 = 38）
      const dIdx = (p: Pitch, staff: Staff, index = -1) => diatonicIndex(p) + shAt(q, staff, index);
      const inSel = (i: number) => focused && !!sel && i >= sel.from && i < sel.to;
      const dynRight = new Map<number, number>();   // 每一行上一个力度字的右边（px）：防叠
      const grooveRight = new Map<number, number[]>();   // 每一行风格记号两条道各自写到哪（px）：防叠
      const RW = (u: Unit) => rowOf(u.system, r, u.staff - 1);
      const lyricRow = (s: number) => rowOf(s, r, q.staves - 1);   // 歌词在最下面那条谱表下面
      // 谱内反复 / 跳转（2026-10-09）：画在反复那一道（力度外道上面）；不起作用的（不是最上面那位的行 / D.S. 没 Segno…）画灰，点开说为什么（repeats.ts navWhy）
      const navY = (s: number) => navYAt.get(rowOf(s, r, 0)) ?? yOf(rowOf(s, r, 0), TOP_LINE + 6);
      const navMute = (i: number) => (navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : "");
      const drawNav = (u: NavU) => {
        const t = tokens[u.index] as NavTok, y = navY(u.system), cls = (o.hot?.has(t.id) ? "nav-mark hot" : inSel(u.index) ? "nav-mark sel" : "nav-mark") + navMute(u.index);
        const fs = P(TEMPO_EM * 1.05), x = P(u.x + 0.4);
        if (t.what === "ending") {   // 房子：左边一道竖钩 + 横线 + 「1.」；到它的尽头——下一条 :|（右边也钩下来）/ 下一个房子 / 最后一个房子到下一条小节线（右边开口）
          const ui = units.indexOf(u);
          let end: Unit | null = null, closed = false, fallback: Unit | null = null, sawNote = false;
          for (let k = ui + 1; k < units.length; k++) {
            const v = units[k];
            if (v.kind === "chunk") sawNote = true;
            if (v.kind === "bar" && (v.repeat === "end" || v.repeat === "both")) { end = v; closed = true; break; }
            if (v.kind === "nav" && (tokens[v.index] as NavTok).what === "ending") { end = v; closed = true; break; }
            if (v.kind === "bar" && v.repeat === "start") { if (!fallback) fallback = v; break; }   // 新的 |: = 这个房子到此为止（开口）
            if (v.kind === "bar" && sawNote && !fallback) fallback = v;   // 最后一个房子：到它后面第一条小节线
          }
          if (!end) end = fallback;
          const top = y - P(1.5), h = P(1.6);
          const endX = (v: Unit | null, sys: number) => (v && v.system === sys ? (v.kind === "bar" ? P(v.x + (v.repeat ? 0.4 + (v.repeat === "both" ? 1.2 : 1.47) : 0.7)) : P(v.x) - P(0.3)) : P(right));
          const seg = (sys: number, xa: number, openL: boolean, xb: number, hookR: boolean) => {
            const yy = sys === u.system ? top : navY(sys) - P(1.5);
            prims.push({ t: "path", d: `${openL ? `M${xa},${yy}` : `M${xa},${yy + h}L${xa},${yy}`}L${xb},${yy}${hookR ? `L${xb},${yy + h}` : ""}`, cls: "volta" + navMute(u.index) });
          };
          const endSys = end ? end.system : u.system;
          seg(u.system, x - P(0.2), false, endX(endSys === u.system ? end : null, u.system), closed && endSys === u.system);
          for (let s2 = u.system + 1; s2 <= endSys; s2++) { const first = units.find((w) => w.system === s2); seg(s2, P((first?.x ?? MARGIN) - 0.3), true, endX(s2 === endSys ? end : null, s2), closed && s2 === endSys); }
          prims.push({ t: "text", x: x + P(0.3), y: top + P(1.25), s: endingLabel(t.nums), cls, size: fs, anchor: "start" });
          dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: x - P(0.4), y: top - P(0.4), w: P(3), h: h + P(0.8) });
          return;
        }
        if (t.what === "segno" || t.what === "coda") {   // Segno / Coda：Bravura 字形（缩到 0.7）
          const gs = 4 * sp * 0.7;
          prims.push({ t: "glyph", x, y, ch: t.what === "segno" ? "\u{E047}" : "\u{E048}", cls: cls.replace("nav-mark", "nav-sign"), size: gs });
          dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: x - P(0.3), y: y - gs * 0.8, w: gs * (t.what === "segno" ? 0.6 : 1.0), h: gs * 0.95 });
          return;
        }
        const label = NAV_LABEL[t.what], tw = (o.measureLyric(label) * TEMPO_EM * 1.05) / LYRIC_EM, atEnd = x - tw > P(MARGIN + 6);   // 它排在小节线前面：x ≈ 小节线   // D.C. / Fine / To Coda…：斜体字，靠右对齐在它的位置（小节尾）；前面放不下就靠左
        prims.push({ t: "text", x: atEnd ? x : x - P(0.2), y, s: label, cls: cls + " nav-word", size: fs, anchor: atEnd ? "end" : "start" });
        dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: atEnd ? x - tw - P(0.3) : x - P(0.5), y: y - P(TEMPO_EM * 1.1), w: tw + P(0.8), h: P(TEMPO_EM * 1.5) });
      };
      // 选中的底色（先画，压在最下面）
      if (focused && sel) {
        const byS = new Map<number, [number, number]>();
        for (const u of units) {
          if (u.kind === "head" || !inSel(u.index)) continue;
          const rr = byS.get(u.system); const a = u.x, b = u.x + u.w;
          byS.set(u.system, rr ? [Math.min(rr[0], a), Math.max(rr[1], b)] : [a, b]);
        }
        for (const [s, [a, b]] of byS) prims.push({ t: "rect", x: P(a), y: yOf(rowOf(s, r, 0), 44), w: P(b - a), h: lyricY(lyricRow(s)) + P(0.8) - yOf(rowOf(s, r, 0), 44), cls: "selbox" });
      }
      const curIndex = (() => { if (!focused || !writing || !o.justWrote) return -1; for (let i = o.caret - 1; i >= 0; i--) if (isTimed(tokens[i])) return i; return -1; })();
      const nhX = (c: Chunk) => P(c.x + c.accW + 0.35);
      // × 符头：这个声部台上那位固定敲一个键（鼓件 / 音效固定原速）——谱上写的音高照留、只是不拿来出声，画成 × 让人一眼看出来（user 2026-10-08「披露就用x」）
      const xHead = !!q.p.xHead;
      // 气声（2026-10-10，user「x同意，做支持」）：这个音画 × 符头（念白 / 说唱的标准写法）——和上面的 × 同一个意思：谱上的音高不拿来出声
      const xOf = (c: Chunk) => xHead || !!c.whisper;
      const nhW = (c: Chunk) => P(xOf(c) ? (c.base >= WHOLE ? W.noteheadXWhole : c.base >= TPQ * 2 ? W.noteheadXHalf : W.noteheadXBlack) : c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
      const whisperMute = (q.p.ignores ?? []).includes("whisper");   // 台上这位做不到气声：× 照画、画灰
      const clsOf = (c: Chunk) => [c.ghost ? "ghost" : "", c.index >= 0 && c.index === curIndex ? "cur" : "", c.index >= 0 && inSel(c.index) ? "sel" : ""].filter(Boolean).join(" ") || undefined;
      const partLyrics: LyricHit[] = [];
      const drawChunk = (c: Chunk) => {
        const cls = clsOf(c), row = RW(c);
        if (!c.note) {
          const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter
            : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
          const ry = c.base >= WHOLE ? yOf(row, 36) : yOf(row, MID_LINE);
          prims.push({ t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
          if (c.j === 0 && c.index >= 0) rests.push({ index: c.index, system: row, x: P(c.x + 0.35), y: yOf(row, MID_LINE), w: P(1.2) });
          if (c.dotted) prims.push({ t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(row, 35), ch: GLYPH.augmentationDot, cls });
          return;
        }
        const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index));   // 叠音的符头从高到低；第一个 = 旋律线
        const d = ds[0], y = yOf(row, d), x0 = nhX(c);
        c.accs.forEach((a, k) => {
          if (a === null) return;
          const ag = a === 1 ? GLYPH.accidentalSharp : a === -1 ? GLYPH.accidentalFlat : a === 2 ? GLYPH.accidentalDoubleSharp : a === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
          const near = c.accs.slice(0, k).some((b, kk) => b !== null && Math.abs(ds[kk] - ds[k]) < 3);   // 挨得近的两个临时记号错开一列
          prims.push({ t: "glyph", x: P(c.x + 0.2) - (near ? P(1.1) : 0) - (c.art.includes("ghost") ? P(0.6) : 0), y: yOf(row, ds[k]), ch: ag, cls });   // 幽灵音：给左括号让位
        });
        const ledgers = new Set<number>();
        for (const dd of ds) { for (let L = 28; L >= dd; L -= 2) ledgers.add(L); for (let L = 40; L <= dd; L += 2) ledgers.add(L); }
        for (const L of ledgers) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(row, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(row, L), w: P(ENGRAVE.ledger), cls: "ledger" });
        const ng = xOf(c) ? (c.base >= WHOLE ? GLYPH.noteheadXWhole : c.base >= TPQ * 2 ? GLYPH.noteheadXHalf : GLYPH.noteheadXBlack) : c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
        let shifted = false;
        ds.forEach((dd, k) => {
          const second = k > 0 && Math.abs(ds[k - 1] - dd) === 1 && !shifted; shifted = second;   // 二度：下面那个符头往右错开（连着的二度交错）
          const mute = k > 0 && !!q.p.mono;   // 单声乐器的声部：下面的音灰掉、只唱最上面（user「叠音声部换单声乐器时下方音数据结构上保留，但是变灰」）
          prims.push({ t: "glyph", x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), ch: ng, cls: ["note", cls ?? "", mute ? "chord-mute" : "", c.whisper && whisperMute ? "art-mute" : "", focused && o.span && c.index >= o.span.from && c.index < o.span.to ? "in-span" : ""].filter(Boolean).join(" ") });
          if (c.art.includes("ghost")) {   // 幽灵音 = 符头两边一对括号（SMuFL noteheadParenthesisLeft / Right；墨迹按 canvas 量的）
            const hx = second ? x0 + nhW(c) * 0.95 : x0, pc = ["note-paren", cls ?? ""].filter(Boolean).join(" ");
            prims.push({ t: "glyph", x: hx - P(0.6), y: yOf(row, dd), ch: "\u{E0F5}", cls: pc });
            prims.push({ t: "glyph", x: hx + nhW(c) + P(0.25), y: yOf(row, dd), ch: "\u{E0F6}", cls: pc });
          }
        });
        if (c.dotted) prims.push({ t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(row, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
        if (c.j === 0) notes.push({ index: c.index, system: row, x: x0, y, w: nhW(c), d: diatonicIndex(c.pitch!) });   // d = 真的音级（拖音高用），不带谱号位移
        if (c.j === 0 && !c.tie) {
          const fit = lyrPlan.get(`${r}:${c.index}`), ly0 = lyricY(lyricRow(c.system)), cx0 = x0 + nhW(c) / 2;   // 按节奏排：让过路的位置
          const ly = ly0 + (fit?.row ? P(LYRIC_ROW2) : 0), cx = cx0 + (fit ? P(fit.dx) : 0);
          partLyrics.push({ index: c.index, system: row, x: cx, y: ly, ...(fit?.tight ? { tight: true as const } : {}) });
          if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly0, x2: x0 + nhW(c) + P(0.4), y2: ly0, w: P(0.12), cls: "melisma" });
          else if (c.lyric) prims.push({ t: "text", x: cx, y: ly, s: lyricShow(c.lyric), ...(fit && fit.scale < 1 ? { size: P(LYRIC_EM * fit.scale) } : {}), cls: [o.hot?.has(tokens[c.index]?.id ?? -1) ? "lyric hot" : "lyric", q.p.lyricMute?.has(tokens[c.index]?.id ?? -1) || fit?.tight ? "lyric-mute" : "", fit?.tight ? "lyric-tight" : "", cls ?? ""].filter(Boolean).join(" ") });
        }
      };
      for (const u of units) {
        const row = RW(u);
        if (u.kind === "phrase") {   // 句号（没有语义，只给「合」当边界）：歌词行上一个小灰「。」，跟在上一个音后面
          prims.push({ t: "text", x: P(u.x + 0.1), y: lyricY(lyricRow(u.system)), s: "。", cls: "phrase-mark", size: P(1.3), anchor: "start" });
          continue;
        }
        if (u.kind === "dyn") {   // 力度：谱上方（声乐谱的下面是歌词），和后面那个音左对齐；基线在第五线上方 1.2 个间距——再高就撞开头的速度记号（它的基线约 2.9）
          const dr = rowOf(u.system, r, 0), [cl0, cr0] = DYN_INK[u.value];
          let dy = dynYAt.get(dr) ?? yOf(row, TOP_LINE + 2.4);
          // 力度记号不占横向的地方（音的间距不因它变）→ 挨得太近的两个（相邻的短音上）会叠在一起：后一个往离谱远的那边挪一行，还和自己的音对齐
          const lx = P(u.x + 0.3 + cl0), prev = dynRight.get(dr);
          if (prev !== undefined && lx < prev + P(0.3)) dy += dy < yOf(dr, MID_LINE) ? -P(1.9) : P(1.9);
          else dynRight.set(dr, P(u.x + 0.3 + cr0));
          prims.push({ t: "glyph", x: P(u.x + 0.3), y: dy, ch: DYN_GLYPH[u.value], cls: (o.hot?.has(tokens[u.index].id) ? "dyn hot" : inSel(u.index) ? "dyn sel" : "dyn") + (dynOff.has(u.index) ? " art-mute" : "") });
          const [il, ir, iu, id] = DYN_INK[u.value];
          dyns.push({ index: u.index, kind: "dyn", system: dr, x: P(u.x + 0.3 + il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
          continue;
        }
        if (u.kind === "groove") {   // 风格记号（拍子轻重）：斜体字、和后面那个音左对齐；不认识的预设（以后的版本写的）= 灰字 + 说明（纪律）
          const gt = tokens[u.index] as GrooveTok, gr = rowOf(u.system, r, 0), label = grooveLabel(gt), known = !!grooveStyle(gt.style);
          const fs = TEMPO_EM * sp, gw = (o.measureLyric(label) * TEMPO_EM) / LYRIC_EM, gx = P(u.x + 0.3);
          // 不占横向地方 → 挨得近的两个会叠：先放下面那条道，挤了放上面那条道（还和自己的音对齐；同力度字的错开）
          const lanes = grooveRight.get(gr) ?? [-Infinity, -Infinity], lane = gx >= lanes[0] + P(0.8) ? 0 : 1;
          lanes[lane] = gx + gw; grooveRight.set(gr, lanes);
          const gy = (grooveYAt.get(gr) ?? staffTop(gr) - P(2.4)) - lane * P(GROOVE_LANE / 2);
          prims.push({ t: "text", x: gx, y: gy, s: label, cls: ["groove-mark", known ? "" : "groove-unknown", o.hot?.has(gt.id) ? "hot" : inSel(u.index) ? "sel" : ""].filter(Boolean).join(" "), size: fs, anchor: "start" });
          dyns.push({ index: u.index, kind: "groove", system: gr, x: P(u.x), y: gy - P(TEMPO_EM * 1.1), w: gw + P(0.6), h: P(TEMPO_EM * 1.5) });
          continue;
        }
        if (u.kind === "head") {
          head = { system: row, x: P(u.x) };
          prims.push({ t: "line", x1: P(u.x + 0.1), y1: yOf(row, 42), x2: P(u.x + 0.1), y2: yOf(row, 26), w: P(0.16), cls: "caret" });
          continue;
        }
        if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {   // 小节线 / 调号 / 拍号：每张谱表各画一份
          for (let k = 0; k < q.staves; k++) {
            const rr = rowOf(u.system, r, k), clef = clefOf((k + 1) as Staff, u.index), sh = clef === "F" ? 12 : 0;
            if (u.kind === "bar" && u.repeat) {   // 反复小节线：Bravura 字形（|: = E040、:| = E041、:|: = E042；一条谱高）；:| 一共放几遍 > 2 = 上面写「×3」
              prims.push({ t: "glyph", x: P(u.x + 0.4), y: yOf(rr, BOTTOM_LINE), ch: u.repeat === "start" ? "\u{E040}" : u.repeat === "end" ? "\u{E041}" : "\u{E042}", cls: (inSel(u.index) ? "repeat-bar sel" : "repeat-bar") + navMute(u.index) });
              if (u.times && u.times > 2 && k === 0) prims.push({ t: "text", x: P(u.x + 0.4 + (u.repeat === "both" ? 1.2 : 1.47)), y: navY(u.system), s: `×${u.times}`, cls: "nav-mark" + navMute(u.index), size: P(TEMPO_EM * 1.05), anchor: "end" });
            } else if (u.kind === "bar") {
              const bx = P(u.x + 0.7), bcls = u.auto ? "bar auto" : inSel(u.index) ? "bar sel" : "bar";
              prims.push({ t: "line", x1: bx, y1: yOf(rr, TOP_LINE), x2: bx, y2: yOf(rr, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: bcls });
              if (u.style === "double") prims.push({ t: "line", x1: bx + P(0.45), y1: yOf(rr, TOP_LINE), x2: bx + P(0.45), y2: yOf(rr, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: bcls });   // 段落线 ‖
              if (u.style === "final") prims.push({ t: "line", x1: bx + P(0.6), y1: yOf(rr, TOP_LINE), x2: bx + P(0.6), y2: yOf(rr, BOTTOM_LINE), w: P(0.5), cls: bcls });   // 终止线：细 + 粗
              if (u.warn && k === 0) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(rr, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn" });
            } else if (u.kind === "key") {
              const cls = inSel(u.index) ? "keysig sel" : "keysig";
              if (u.fifths === 0) { const pos = u.prev > 0 ? SHARP_POS : FLAT_POS; for (let j = 0; j < Math.abs(u.prev); j++) prims.push({ t: "glyph", x: P(u.x + 0.4 + j * 0.8), y: yOf(rr, pos[j] - (sh ? 2 : 0)), ch: GLYPH.accidentalNatural, cls }); }
              else drawKeySig(rr, u.x + 0.4, u.fifths, cls, clef);
              // 换到同一个调、又没有升降号（C → C）：什么都画不出来 → 写个小字，免得成了看不见的记号
              if (u.fifths === 0 && u.prev === 0 && k === 0) prims.push({ t: "text", x: P(u.x + 0.2), y: staffTop(rr) - P(0.8), s: `1=${KEY_LABEL[0]}`, cls: `${cls} key-label`, size: TEMPO_EM * sp * 0.85, anchor: "start" });
              marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
            } else {
              const cls = inSel(u.index) ? "timesig sel" : "timesig";
              drawTime(rr, u.x + 0.6, u.beats, u.beatType, cls);
              marks.push({ index: u.index, kind: "time", system: rr, x: P(u.x), ...staffHit(rr), w: P(u.w) });
            }
          }
          continue;
        }
        if (u.kind === "tempo") { if (q.p.id === owner) drawTempo(row, u.x + 0.3, u.bpm, inSel(u.index) ? "tempo sel" : "tempo", u.index); continue; }
        if (u.kind === "hairpin") continue;   // 渐强渐弱在 8¾ 画（要知道终点）
        if (u.kind === "nav") { drawNav(u); continue; }
        if (u.kind === "ottava") continue;   // 八度线在下面按音的范围画
        if (u.kind === "clef") {   // 行中间换谱号（v0.9.28）：小一号的谱号；正好在一行开头 = 行首的谱号已经是它，不重画
          if (q.staves === 2) continue;
          const first = !units.some((x) => x.system === u.system && x.index >= 0 && x.index < u.index && x.kind !== "ottava");
          const base = baseClef(u.clef), cls = inSel(u.index) ? "clef cue sel" : "clef cue";
          if (!first) prims.push({ t: "glyph", x: P(u.x + 0.35), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[u.clef], cls, size: P(4 * CLEF_CUE) });
          clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: u.index, system: row, x: P(u.x), ...staffHit(row), w: P(Math.max(u.w, 1.6)) });
          continue;
        }
        drawChunk(u);
      }
      // 7¼. 八度线（v0.9.28）：8va / 15ma 在谱上面、8vb 在谱下面；一行里连着的同一种画成一段（开头的字 + 虚线 + 收尾的钩）；接着上一行的字加括号
      if (q.staves === 1) {
        const SIG: Record<number, string> = { 1: GLYPH.ottavaAlta, 2: GLYPH.quindicesimaAlta, [-1]: GLYPH.ottavaBassa };
        const SIG_W: Record<number, number> = { 1: 3.54, 2: 5.26, [-1]: 3.36 };
        for (let sy = 0; sy < nSys; sy++) {
          const row0 = rowOf(sy, r, 0);
          const us = units.filter((x) => x.system === sy && x.kind === "chunk").sort((a, b) => a.x - b.x) as Chunk[];
          let k = 0;
          while (k < us.length) {
            const v = q.ds.ott[us[k].index] ?? 0; if (!v) { k++; continue; }
            const isAuto = !!q.ds.auto?.[us[k].index];   // 自动的和挨着的手写的分开画
            let e = k; while (e + 1 < us.length && (q.ds.ott[us[e + 1].index] ?? 0) === v && !!q.ds.auto?.[us[e + 1].index] === isAuto) e++;
            const up = v > 0, y = up ? ottYAt.get(row0) : ottDownYAt.get(row0);
            if (y !== undefined) {
              const prevIdx = us[k].index - 1, cont = k === 0 && prevIdx >= 0 && (q.ds.ott[prevIdx] ?? 0) === v && units.some((x) => x.index >= 0 && x.index <= prevIdx && x.system < sy);
              const nextU = us[e + 1], lastIdx = us[e].index, endsHere = !!nextU || (q.ds.ott[lastIdx + 1] ?? 0) !== v || lastIdx + 1 >= q.tokens.length || !units.some((x) => x.system > sy && x.index > lastIdx);
              const x0 = P(us[k].x - 0.2), x1 = P(us[e].x + us[e].w - 0.3), sz = P(4 * 0.85), gw = P(SIG_W[v] * 0.85);
              const src = units.find((x) => x.kind === "ottava" && x.index <= us[k].index && (q.ds.ott[x.index] ?? 0) === v && x.system === sy) ?? null;
              if (cont) prims.push({ t: "text", x: x0, y: y + P(0.5), s: `(${v === 2 ? "15ma" : v > 0 ? "8va" : "8vb"})`, cls: "ottava cont", size: P(1.3), anchor: "start" });
              else prims.push({ t: "glyph", x: x0, y: y + P(up ? 0.4 : 0.4), ch: SIG[v], cls: isAuto ? "ottava auto" : "ottava", size: sz });
              const lx = x0 + (cont ? P(4.2) : gw) + P(0.4), ly = y - P(up ? 0.55 : 0.55);
              for (let x = lx; x + P(0.6) <= x1; x += P(1.0)) prims.push({ t: "line", x1: x, y1: ly, x2: x + P(0.6), y2: ly, w: P(0.1), cls: "ottava-line" });
              if (endsHere) prims.push({ t: "line", x1: x1, y1: ly, x2: x1, y2: ly + P(up ? 1.1 : -1.1), w: P(0.1), cls: "ottava-line" });
              const hitIdx = src ? src.index : (() => { for (let i = us[k].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i; return -1; })();
              const run = isAuto ? q.ds.runs.find((rr) => us[k].index >= rr.from && us[k].index <= rr.to) : undefined;
              if (run) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: -1, run, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
              else if (hitIdx >= 0) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: hitIdx, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
            }
            k = e + 1;
          }
        }
      }
      // 7. 符干、符杠、符尾（按拍分组：同一拍里连着的八分及更短的音符共用符杠）
      type Stemmed = { c: Chunk; x0: number; y: number; d: number; yLow: number; dLow: number };   // y / d = 最高的符头；yLow / dLow = 最低的（叠音的符干连着两头）
      const stemmed: Stemmed[][] = [];
      let group: Stemmed[] = [], groupBeat = -1, groupSys = -1;
      const endGroup = () => { if (group.length) stemmed.push(group); group = []; groupBeat = -1; };
      const chunksInOrder: (Chunk | null)[] = [];
      // 打断符杠的只有小节线和中途的调号 / 拍号；光标、力度记号、渐强渐弱、句号、速度都不打断（2026-10-08 Opus 5.5，user「为什么…力度标识会破坏八分音符尾巴的连音？」）
      for (const u of units) { if (u.kind === "chunk") chunksInOrder.push(u); else if (u.kind === "bar" || u.kind === "key" || u.kind === "time") chunksInOrder.push(null); }
      for (const u of chunksInOrder) {
        if (!u || !u.note || u.base >= WHOLE) { endGroup(); continue; }
        const dsU = (u.pitches.length ? u.pitches : [u.pitch!]).map((pp) => dIdx(pp, u.staff, u.index));
        const s: Stemmed = { c: u, x0: nhX(u), y: yOf(RW(u), dsU[0]), d: dsU[0], yLow: yOf(RW(u), dsU[dsU.length - 1]), dLow: dsU[dsU.length - 1] };
        if (u.base > TPQ / 2) { endGroup(); stemmed.push([s]); continue; }
        const beat = Math.floor(u.inBar / u.beat);
        if (group.length && (beat !== groupBeat || u.system !== groupSys || u.staff !== group[0].c.staff)) endGroup();   // 换谱表 = 符杠断开（跨谱表符杠下一轮）
        group.push(s); groupBeat = beat; groupSys = u.system;
      }
      endGroup();
      const stemCls = (s: Stemmed) => clsOf(s.c);
      const upOf = new Map<Chunk, boolean>();   // 符干朝上？（演奏法画在另一侧）
      const tipOf = new Map<Chunk, number>();
      for (const g of stemmed) {
        const row = RW(g[0].c), mid = yOf(row, MID_LINE);
        const up = g.reduce((a, s) => a + (s.d + s.dLow) / 2, 0) / g.length < MID_LINE;
        for (const s of g) upOf.set(s.c, up);
        const sx = (s: Stemmed) => (up ? s.x0 + P(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x0 + P(STEM_DOWN_NW[0] + ENGRAVE.stem / 2));
        const sy0 = (s: Stemmed) => (up ? s.yLow - P(STEM_UP_SE[1]) : s.y - P(STEM_DOWN_NW[1]));   // 符干从远端的那个符头起
        if (g.length === 1) {
          const s = g[0];
          let tip = up ? s.y - P(3.5) : s.yLow + P(3.5);
          if (up && s.d < 27) tip = Math.min(tip, mid); if (!up && s.dLow > 41) tip = Math.max(tip, mid);
          tipOf.set(s.c, tip);
          prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: tip, w: P(ENGRAVE.stem), cls: stemCls(s) });
          const lv = flagLevel(s.c.base);
          if (lv > 0) {
            const fx = sx(s) - P(ENGRAVE.stem / 2);
            const fg = up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp][lv - 1] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown][lv - 1];
            prims.push({ t: "glyph", x: fx, y: up ? tip + P(FLAG_ANCHOR_UP[lv]) : tip + P(FLAG_ANCHOR_DOWN[lv]), ch: fg, cls: stemCls(s) });
          }
          continue;
        }
        const xa = sx(g[0]), xb = sx(g[g.length - 1]);
        const k = Math.max(-0.2, Math.min(0.2, ((g[g.length - 1].y - g[0].y) / (xb - xa)) * 0.5));
        const at = (xx: number, yy0: number) => yy0 + k * (xx - xa);
        const yb0 = up ? Math.min(...g.map((s) => s.y - P(3.5) - k * (sx(s) - xa))) : Math.max(...g.map((s) => s.yLow + P(3.5) - k * (sx(s) - xa)));
        for (const s of g) { tipOf.set(s.c, at(sx(s), yb0)); prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: at(sx(s), yb0), w: P(ENGRAVE.stem), cls: stemCls(s) }); }
        const step = P(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = P(ENGRAVE.beam) * (up ? 1 : -1);
        const beamPath = (xL: number, xR: number, lvl: number) => {
          const of = step * lvl; const a = at(xL, yb0) + of, b = at(xR, yb0) + of;
          return `M${xL - P(ENGRAVE.stem / 2)},${a}L${xR + P(ENGRAVE.stem / 2)},${b}L${xR + P(ENGRAVE.stem / 2)},${b + th}L${xL - P(ENGRAVE.stem / 2)},${a + th}Z`;
        };
        const gcls = ["beam", g.every((s) => s.c.ghost) ? "ghost" : "", g.every((s) => s.c.index >= 0 && inSel(s.c.index)) ? "sel" : ""].filter(Boolean).join(" ");
        prims.push({ t: "path", d: beamPath(xa, xb, 0), cls: gcls });
        const maxLv = Math.max(...g.map((s) => flagLevel(s.c.base)));
        for (let lvl = 2; lvl <= maxLv; lvl++) {
          let runStart = -1;
          for (let n = 0; n <= g.length; n++) {
            const has = n < g.length && flagLevel(g[n].c.base) >= lvl;
            if (has && runStart < 0) runStart = n;
            if (!has && runStart >= 0) {
              const L = runStart, R = n - 1;
              if (L === R) { const stub = P(1.1), toRight = L < g.length - 1;   // 单独一个更短的音：半截杠，组里最后一个朝左，其余朝右
                prims.push({ t: "path", d: beamPath(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1), cls: gcls }); }
              else prims.push({ t: "path", d: beamPath(sx(g[L]), sx(g[R]), lvl - 1), cls: gcls });
              runStart = -1;
            }
          }
        }
      }
      // 7½. 修（2026-10-08）：跳音 / 保持在符头外一格（谱内落在间里）；符干朝上 = 画在下面，朝下 / 没有符干 = 上面。呼吸 = 音后面、谱线上方一个逗号。
      //   强度那一组（重音 / 强音 / 次重音 / 弱化）**一律画在谱上方**（2026-10-08 深夜 Opus 5.5，user「强度记号统一放上面吧，不然容易misleading」）：
      //   符干朝上 = 越过符干尖再往上；都出了谱（第五线上面）
      const ign = new Set(q.p.ignores ?? []);   // 台上那位不认的记号：照画、画灰（user「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）
      for (const c of units) {
        if (c.kind !== "chunk" || !c.note || (!c.art.length && !c.breath && !(c.j === 0 && (tokens[c.index] as NoteTok).swell))) continue;
        const row = RW(c), cls = clsOf(c), cx = nhX(c) + nhW(c) / 2;
        const dsC = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)), dHi = dsC[0], dLo = dsC[dsC.length - 1];
        const below = upOf.get(c) ?? false, sgn = below ? -1 : 1;
        const inStaff = (d: number) => d >= BOTTOM_LINE && d <= TOP_LINE;
        let d = below ? dLo - 2 : dHi + 2;
        const artCls = (a: string) => ["art", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ");
        for (const a of (["staccato", "tenuto"] as const).filter((x) => c.art.includes(x))) {   // 跳音 / 保持：符头外一格，跟着符干的另一侧
          if (inStaff(d) && d % 2 === 0) d += sgn;                                                   // 谱内落在间里
          const m = ART_GLYPH[a], g = below ? m.below : m.above;
          prims.push({ t: "glyph", x: cx - P(m.w / 2), y: yOf(row, d) + (below ? -P(m.h / 2) : P(m.h / 2)), ch: g, cls: artCls(a) });
          d += sgn * 2;
        }
        // 强度那一组：一律上面。起点（字形中心，px）= 第五线上一格，和「上面已经占了的」（朝上的符干尖 / 朝下时跳音保持之上）取更高的
        let yS = Math.min(yOf(row, TOP_LINE + 2), below ? (tipOf.get(c) ?? yOf(row, dHi + 7)) - P(1.1) : yOf(row, d));
        for (const a of (["accent", "marcato", "stress", "unstress"] as const).filter((x) => c.art.includes(x))) {
          const m = ART_GLYPH[a];
          prims.push({ t: "glyph", x: cx - P(m.w / 2), y: yS + P(m.h / 2), ch: m.above, cls: artCls(a) });
          yS -= P(1.5);
        }
        // 音内的起伏（< / > / <>）：里道，这个音自己的宽度里一个小发夹（sfz / fp 在同一道的前面）；做不到的（canSwell = false 的 < / <>）画灰
        const swl = c.j === 0 ? (tokens[c.index] as NoteTok).swell : undefined;
        if (swl) {
          const y = (noteDynYAt.get(rowOf(c.system, r, 0)) ?? yOf(RW(c), TOP_LINE + 2.4)) - P(0.5), xa = nhX(c) + (c.art.some((a) => a === "sfz" || a === "fp") ? P(2.4) : 0), xb = Math.max(xa + P(1.6), nhX(c) + P(c.w) - P(0.8)), H = P(0.35);
          const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;
          const d = swl === "<" ? `M${xb},${y - H}L${xa},${y}L${xb},${y + H}` : swl === ">" ? `M${xa},${y - H}L${xb},${y}L${xa},${y + H}` : `M${xa},${y}L${mx},${y - H}L${xb},${y}M${xa},${y}L${mx},${y + H}L${xb},${y}`;
          prims.push({ t: "path", d, cls: cl });
        }
        // 突强 / 强后即弱：音头的力度形状，画在里道（音的修饰那一道）、和这个音左对齐
        for (const a of (["sfz", "fp"] as const).filter((x) => c.art.includes(x)))
          prims.push({ t: "glyph", x: nhX(c) - P(0.2), y: noteDynYAt.get(rowOf(c.system, r, 0)) ?? yOf(RW(c), TOP_LINE + 2.4), ch: a === "sfz" ? "\u{E539}" : "\u{E534}", cls: ["dyn", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        if (c.breath) prims.push({ t: "glyph", x: nhX(c) + nhW(c) + P(0.55), y: yOf(row, TOP_LINE + 1), ch: GLYPH_BREATH, cls: ["breath", ign.has("breath") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        // 出声的换气：逗号后面一个小字「吸」/「深吸」（出版谱的做法 = 逗号 + 文字；没有通用的单个记号）；做不到的人画灰
        if (c.breath && c.inhale) prims.push({ t: "text", x: nhX(c) + nhW(c) + P(1.35), y: yOf(row, TOP_LINE + 1) + P(0.45), s: c.inhale === "big" ? "深吸" : "吸", cls: ["breath-label", ign.has("inhale") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: P(1.15), anchor: "start" });
      }
      // 8. 连音线：同一个 token 拆开的几段之间 + 数据里的 tie（连着前一个音）。跨行 = 两半：这一行从音到行尾、下一行从行头到音
      //   （2026-10-08 Opus 5.5，user「跨行的连音符显示不正常」——以前跨行的整条不画）
      const tieArc = (row: number, d: number, x1: number, x2: number, ghost: boolean) => {
        const sgn = d < MID_LINE ? 1 : -1, y = yOf(row, d) + sgn * P(0.8), h = Math.min(P(1.0), Math.abs(x2 - x1) * 0.25);   // 短的（行头那半截）压扁一点，别像个「^」
        prims.push({ t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y + sgn * h} ${x2},${y}`, cls: ghost ? "tie ghost" : "tie" });
      };
      const tieBetween = (a: Chunk, b: Chunk) => {
        if (a.staff !== b.staff || !a.pitch || !b.pitch) return;
        const da = dIdx(a.pitch, a.staff, a.index), db = dIdx(b.pitch, b.staff, b.index);
        if (a.system === b.system) { tieArc(RW(b), db, nhX(a) + nhW(a) * 0.8, nhX(b) + nhW(b) * 0.2, b.ghost); return; }
        tieArc(RW(a), da, nhX(a) + nhW(a) * 0.8, Math.max(nhX(a) + nhW(a) * 0.8 + P(2), P(right) - P(0.3)), b.ghost);   // 行尾开口
        tieArc(RW(b), db, Math.max(P((sysStarts[b.system] ?? 0) - 1.6), nhX(b) - P(3)), nhX(b) + nhW(b) * 0.2, b.ghost);      // 行头开口（从调号那儿起）
      };
      const realChunks = units.filter((u): u is Chunk => u.kind === "chunk");
      for (let n = 1; n < realChunks.length; n++) {
        const a = realChunks[n - 1], b = realChunks[n];
        if (!a.note || !b.note) continue;
        if ((b.j > 0 && a.index === b.index) || (b.tie && a.last)) tieBetween(a, b);
      }
      // 8½. 连线（2026-10-08 连断）：一串「连到下一个」的音 = 一条弧，从第一个音的符头到被连到的那个音的符头；画在符干的另一侧、越过中间的音；
      //   跨行 = 每行一段（行尾 / 行头开口）。台上那位不认（月读还没接 / 本来就不留缝）= 画灰（user「演奏者不认的记号也变灰」）
      const headOf = new Map<number, Chunk>();
      for (const c of realChunks) if (c.note && c.j === 0 && !headOf.has(c.index)) headOf.set(c.index, c);
      const noteIdx = [...headOf.keys()].sort((x, y) => x - y), slurOf = (k: number) => !!(tokens[noteIdx[k]] as NoteTok).slur;
      const ext = (c: Chunk, below: boolean) => { const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)); return yOf(RW(c), below ? Math.min(...ds) : Math.max(...ds)); };
      for (let k = 0; k < noteIdx.length; k++) {
        if (!slurOf(k) || (k > 0 && slurOf(k - 1))) continue;   // 一串的头
        let e = k; while (e < noteIdx.length - 1 && slurOf(e)) e++;
        if (e === k) continue;                                  // 后面没有音可连
        const run = noteIdx.slice(k, e + 1).map((x) => headOf.get(x)!).filter((c) => c.pitch), below = upOf.get(run[0]) ?? false, sgn = below ? 1 : -1;
        const groups: Chunk[][] = [];
        for (const c of run) { const g = groups[groups.length - 1]; if (g && g[0].system === c.system) g.push(c); else groups.push([c]); }
        groups.forEach((g, gi) => {
          const f = g[0], l = g[g.length - 1], openL = gi > 0, openR = gi < groups.length - 1;
          const xa = openL ? nhX(f) - P(2) : nhX(f) + nhW(f) / 2, xb = openR ? nhX(l) + nhW(l) + P(2) : nhX(l) + nhW(l) / 2;
          if (xb - xa < P(1)) return;
          const ya = ext(f, below) + sgn * P(1.2), yb = ext(l, below) + sgn * P(1.2);
          const peak = g.map((c) => ext(c, below) + sgn * P(2.2)), cy = below ? Math.max(ya, yb, ...peak) + P(0.6) : Math.min(ya, yb, ...peak) - P(0.6);
          prims.push({ t: "path", d: `M${xa},${ya}C${xa + (xb - xa) * 0.2},${cy} ${xb - (xb - xa) * 0.2},${cy} ${xb},${yb}`, cls: ["slur", ign.has("slur") ? "art-mute" : ""].filter(Boolean).join(" ") });
        });
      }
      // 8¾. 渐强渐弱（记号，2026-10-08）：从这个记号画到终点——下一个力度记号（让开它的字）/ 下一个渐强渐弱；都没有 = 画到这张纸最后一个音，
      //   后面灰字「(f)」= 走一档推定的终点（user「走一档也行，更合理，需要向用户披露」）。跨行 = 每行画它那一份开口（按横向长度分）。
      //   和两头的力度字之间留空（user 2026-10-08「< 号不用靠着一点空隙都没有」：按量过的墨迹让开 PIN_GAP）；比一整行还长 = 写成「cresc. - - -」（PIN_WORD）。
      const LEVELS = DYNS;   // ppp…fff（v0.9.23）：走一档推定的灰字也能推到 ppp / fff
      const lastChunk = [...units].reverse().find((u): u is Chunk => u.kind === "chunk");
      // 发夹（或太长时的「cresc. - - -」）从 (s0, startX) 画到 (s1, endX)：跨行每行一段（按横向长度分开口）；index = 点它开哪个记号的小菜单；
      //   ramp = 渐到画的（虚线；2026-10-08 深夜 Opus 5.5，user「渐到…和手动加的可以分开来」「如何不混淆的搞清楚<到底是哪里开始的」——手写的实线、渐到虚线，都从看得见的记号起）
      const drawWedge = (index: number, dir: "cresc" | "dim", s0: number, startX: number, s1: number, endX: number, ramp: boolean) => {
        const leftOf = (sy: number) => Math.min(...units.filter((u): u is Chunk => u.kind === "chunk" && u.system === sy).map((c) => nhX(c)), P(right)) - P(1);
        const segs: [number, number, number][] = [];
        for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf(sy), sy === s1 ? endX : P(right) - P(0.3)]);
        const total = segs.reduce((n, [, a, b]) => n + Math.max(0, b - a), 0) || 1, H = P(0.5);
        const midY = (sy: number) => (dynYAt.get(rowOf(sy, r, 0)) ?? yOf(rowOf(sy, r, 0), TOP_LINE + 2.4)) - P(0.5);   // 发夹 / 虚线的中线：力度字的半腰
        if (total > P(right - MARGIN)) {   // 太长：「cresc.」+ 虚线，跨行接着画虚线
          const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
          let said = false;
          for (const [sy, a0, b] of segs) {
            if (b - a0 < P(0.3)) continue;
            let a = a0;
            if (!said && b - a >= ww + P(1)) {   // 第一段放得下字才写（行尾剩一点点 = 字挪到下一行开头）
              prims.push({ t: "text", x: a, y: midY(sy) + P(0.5), s: word, cls: ["dyn-word", ramp ? "ramp" : "", o.hot?.has(tokens[index].id) ? "hot" : ""].filter(Boolean).join(" "), size: P(PIN_WORD.size), anchor: "start" });
              a += ww + P(0.6); said = true;
            }
            for (let x = a; x + P(DASH.len) <= b; x += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x, y1: midY(sy), x2: x + P(DASH.len), y2: midY(sy), w: P(0.12), cls: "dyn-dash" });
            dyns.push({ index, kind: "hairpin", system: rowOf(sy, r, 0), x: a0, y: midY(sy) - P(1.4), w: b - a0, h: P(2.8) });
          }
        } else {
          let acc = 0;
          for (const [sy, a, b] of segs) {
            if (b - a < P(0.3)) continue;
            const f0 = acc / total, f1 = (acc + b - a) / total; acc += b - a;
            const [h0, h1] = dir === "cresc" ? [H * f0, H * f1] : [H * (1 - f0), H * (1 - f1)], y = midY(sy);
            prims.push({ t: "path", d: `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`, cls: ["hairpin", ramp ? "ramp" : "", o.hot?.has(tokens[index].id) ? "hot" : ""].filter(Boolean).join(" ") });
            dyns.push({ index, kind: "hairpin", system: rowOf(sy, r, 0), x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
          }
        }
      };
      units.forEach((h, hi) => {
        if (h.kind !== "hairpin" || !lastChunk) return;
        // 紧挨在前面的力度记号（mp < 这种）：从它的字后面起画，别压在字上
        const prevU = units[hi - 1];
        const dynBefore = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
        const startX = Math.max(P(h.x + 0.3), dynBefore ? P(dynBefore.x + 0.3 + DYN_INK[dynBefore.value][1] + PIN_GAP) : 0), s0 = h.system;
        const endU = units.slice(hi + 1).find((u) => u.kind === "dyn" || u.kind === "hairpin");
        // 终点的力度和方向反着（渐弱后面更强 / 一样）= 方向说了算：走一档、到那儿突变（perform.ts dynLevels）→ 发夹末端照样画灰字推定的那一档，让开它（2026-10-08 user「同意」）
        let curDyn: string = "mf"; for (let j = h.index - 1; j >= 0; j--) { const u = tokens[j]; if (u.kind === "dyn") { curDyn = u.value; break; } }
        const ci = LEVELS.indexOf(curDyn as (typeof LEVELS)[number]), against = !!endU && endU.kind === "dyn" && (h.dir === "cresc" ? LEVELS.indexOf(endU.value) <= ci : LEVELS.indexOf(endU.value) >= ci);
        const IMPLIED_W = 3;   // 灰字「(mp)」大概多宽（sp，1.3 号斜体）
        const endX = endU ? P(endU.x + 0.3 + (endU.kind === "dyn" ? DYN_INK[endU.value][0] : 0) - PIN_GAP - (against ? IMPLIED_W + 0.4 : 0)) : nhX(lastChunk) + nhW(lastChunk) + P(0.8), s1 = endU ? endU.system : lastChunk.system;   // 终点的字画在 x + 0.3
        if (s1 < s0) return;
        // 太短也照样画（以前不到 1 个间距就整条不画 = 静默没了）：至少 MIN_PIN；灰字放不下就挪到发夹末端上面
        let endXd = endX, labelAbove = false;
        const MIN_PIN = P(1.4);
        if (s1 === s0 && endXd - startX < MIN_PIN) {
          const roomy = against ? endXd + P(IMPLIED_W + 0.4) : endXd;   // 不让灰字占地方时能有多长
          if (against) labelAbove = true;
          endXd = Math.max(startX + MIN_PIN, Math.min(roomy, startX + MIN_PIN * 2));
        }
        drawWedge(h.index, h.dir, s0, startX, s1, endXd, false);
        if (!endU || against) {   // 推定的终点：现在的力度往上 / 往下一档（没有终点 / 终点和方向反着）
          const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
          prims.push({ t: "text", x: labelAbove ? endXd - P(1.2) : endXd + P(0.4), y: (dynYAt.get(rowOf(s1, r, 0)) ?? yOf(rowOf(s1, r, 0), TOP_LINE + 2.4)) + P(labelAbove ? -1.9 : 0.1), s: `(${LEVELS[k]})`, cls: "dyn-implied", size: P(1.3), anchor: "start" });
        }
      });
      // 8⅞. 渐到：写着「从上一个渐变过来」的力度记号 = 从上一个力度字后面画一条虚线发夹到它前面（方向按两个力度的高低；一样高 = 不画，渐到不起作用）。
      //   前面没有力度记号 / 中间隔着手写的渐强渐弱 = 不画（手写的说了算；小菜单里那个开关画灰、说为什么——perform.ts 也不渐）
      for (const u of units) {
        if (u.kind !== "dyn" || !(tokens[u.index] as { ramp?: true }).ramp) continue;
        const src = rampSource(tokens, u.index); if (typeof src !== "number") continue;
        const pu = units.find((x): x is DynU => x.kind === "dyn" && x.index === src); if (!pu) continue;
        const a = LEVELS.indexOf(pu.value as (typeof LEVELS)[number]), b = LEVELS.indexOf(u.value as (typeof LEVELS)[number]); if (a === b) continue;
        const sx = P(pu.x + 0.3 + DYN_INK[pu.value][1] + PIN_GAP);
        let ex = P(u.x + 0.3 + DYN_INK[u.value][0] - PIN_GAP);
        if (u.system === pu.system && ex - sx < P(1.4)) ex = sx + P(1.4);
        if (u.system < pu.system) continue;
        drawWedge(u.index, b > a ? "cresc" : "dim", pu.system, sx, u.system, ex, true);
      }
      // 9. 歌词连字符（英文断开的音节）：画在两个歌词中间
      for (let n = 0; n < partLyrics.length; n++) {
        const L = partLyrics[n], tok = tokens[L.index] as NoteTok;
        if (!tok.hyph) continue;
        const R = partLyrics[n + 1];
        const xx = R && R.system === L.system ? (L.x + R.x) / 2 : L.x + P(1.6);
        prims.push({ t: "text", x: xx, y: L.y, s: "-", cls: "lyric hyphen" });
      }
      lyrics.push(...partLyrics);
      // 10. 连音括号：同一比例连着的一串，凑满「m 个最小写出单位」就收一组。一组跨行（2026-10-08 Opus 5.5，user「跨行的连音符显示不正常」）=
      //   照样接着数（以前到行尾就收组、下一行从头数，后面的组全错位），每行画一段括号：这一行右边开口、带数字，下一行左边开口
      const bracket = (cs: Chunk[], openL: boolean, openR: boolean, num: boolean) => {
        const row = RW(cs[0]), n = cs[0].ratio![0];
        const xa = openL ? Math.min(nhX(cs[0]) - P(1.2), nhX(cs[0])) : nhX(cs[0]), last = cs[cs.length - 1], xb = openR ? nhX(last) + nhW(last) + P(1.2) : nhX(last) + nhW(last);
        const top = Math.min(...cs.map((c) => Math.min(c.pitch ? yOf(row, dIdx(c.pitch, c.staff, c.index)) : yOf(row, MID_LINE), tipOf.get(c) ?? Infinity)), yOf(row, TOP_LINE)) - P(1.6);
        const mid = (xa + xb) / 2, gap = num ? P(1.0) : 0;
        const left = openL ? `M${xa},${top}` : `M${xa},${top + P(0.6)}L${xa},${top}`, right = openR ? `L${xb},${top}` : `L${xb},${top}L${xb},${top + P(0.6)}`;
        prims.push({ t: "path", d: num ? `${left}L${mid - gap},${top}M${mid + gap},${top}${right}` : `${left}${right}`, cls: "tuplet-bracket" });
        if (num) prims.push({ t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n), cls: "tuplet" });
      };
      let run: Chunk[] = [], runRatio: string | null = null, acc = 0, minBase = Infinity, segStart = 0;
      const flushSeg = (openR: boolean) => { const cs = run.slice(segStart); if (cs.length && cs[0].ratio) bracket(cs, segStart > 0, openR, segStart === 0); segStart = run.length; };
      const closeRun = () => { if (run.length) flushSeg(false); run = []; runRatio = null; acc = 0; minBase = Infinity; segStart = 0; };
      for (const c of realChunks) {
        const rr = c.ratio ? c.ratio.join(":") : null;
        if (rr !== runRatio || (run.length && c.staff !== run[0].staff)) closeRun();
        else if (run.length && c.system !== run[run.length - 1].system) flushSeg(true);   // 跨行：这一行先画到行尾（右边开口），组接着数
        if (!rr) continue;
        run.push(c); runRatio = rr; acc += c.ticks; minBase = Math.min(minBase, c.base);
        if (acc >= c.ratio![1] * minBase - 1e-6) closeRun();
      }
      closeRun();
      // 11. 光标落点（点在哪个空隙）——每条 track 都有（点到别的声部 = 换到那条）
      const H = headLen(tokens);
      const firstUnitOf = new Map<number, Unit>();
      for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
      for (let c = H; c <= tokens.length; c++) {   // 大谱表：两条谱表上都放落点（点哪条都是这个声部）
        const u = c < tokens.length ? firstUnitOf.get(c) : undefined;
        const last = u ? null : [...units].reverse().find((v) => v.kind !== "head");
        const sys = u ? u.system : last ? last.system : 0, x = u ? P(u.x) : last ? P(last.x + last.w) : P(sysStarts[0]);
        for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(sys, r, k), x });
      }
      // 行末落点：这一行最后一个东西后面 = 下一行第一个光标位置，点在这里 = 光标画在这一行末尾（caretEnd）。原来这里没有落点，点行末空白会落到最后一个音前面。
      let lastSys = -1;
      for (let c = H; c < tokens.length; c++) {
        const u = firstUnitOf.get(c); if (!u) continue;
        const crossed = lastSys >= 0 && u.system > lastSys; lastSys = u.system;
        if (!crossed) continue;
        const prevRow = cols.filter((cc) => cc.system === u.system - 1);
        if (!prevRow.length) continue;
        const x = P(Math.max(...prevRow.map((cc) => cc.x + cc.w)));
        for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(u.system - 1, r, k), x, end: true });
      }
    });
    stubs();
    papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
  });
  // 分页：页框（压在最底下）+ 页码；高 = 最后一页的底
  const pages: Layout["pages"] = [];
  if (PG) {
    const frames: Prim[] = [];
    for (let k = 0; k <= pageNo; k++) {
      const top = pageTopY(k);
      frames.push({ t: "rect", x: -P(PG.l), y: top, w: o.width + P(PG.l + PG.r), h: P(PG.h), cls: "page" });
      prims.push({ t: "text", x: o.width / 2, y: top + P(PG.h - PG.b / 2), s: String(k + 1), cls: "page-no", size: P(1.2), anchor: "middle" });
      pages.push({ top, h: P(PG.h) });
    }
    prims.unshift(...frames);
  }
  const height = PG ? pageTopY(pageNo) + P(PG.h) : yCur + P(MX.b);
  return { prims, width: o.scroll ? P(sheetRight + MARGIN) : o.width, height, sp, systems: rows, notes, slots, lyrics, marks, dyns, rests, title, clefs, arrangement, credits, head, parts: partsHit, papers: papersHit, addPaper, nav, paperMenu, pageX: { left: P(MX.l), right: P(MX.r) }, pages, paperChip, shortBars, lyricY, yOf, dOf };
}

export type { Token };
