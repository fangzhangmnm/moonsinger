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

import { LYRIC_EM, TEMPO_EM, TEXT_STYLES, LYRIC_LOOK, LYRIC_MIN_SX, isBlockScript, textPx, type TextRole } from "./text-style.ts";
import { _t } from "../i18n/index.ts";
import { DYNS, swellOf, type ClefName, type Song, type PaperSeg, type NoteTok, type Token, type GrooveTok, type BarTok, type NavTok, type Repeat, NAV_LABEL, endingLabel, type Art, type Dyn, type Focus, type Staff, TPQ, WHOLE, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, effectivePitch, isTimed, headLen, beatTicks, tempoWord, staffOfTokens, allPitches, tempoOwner, sheetEndBpm, rampSource } from "../score/song.ts";
import { grooveLabel, grooveStyle } from "../score/groove.ts";
import { dynOverridden } from "../score/perform.ts";
import { navWhy } from "../score/repeats.ts";
import { parseArrangement } from "../score/arrange.ts";
import { densityOf, type Density } from "../score/paper.ts";
import { curveOf, SP_DEFAULTS, idealGaps, rodsOf, indexRods, placeLine, fitLine, type SpCol, type SpItem } from "./spacing.ts";
import { type Pitch, diatonicIndex, keyAlter, midiOf, spellMidi } from "../score/pitch.ts";
import { percOf, type PercInfo } from "../gm/percussion.ts";
import { MELISMA_MARK, lyricShow } from "../score/lyrics.ts";
import { GLYPH, W, ENGRAVE, FLAG_W, timeSigDigits, PERC_CLEF, PERC_HEAD, PERC_SMUFL } from "./smufl.ts";
import { layoutStems, type StemNote, type StemDir } from "./stems.ts";
import { Skyline, primInk, shiftPrim, primY } from "./skyline.ts";
import { GLYPH_BOX } from "./glyph-box.gen.ts";
import { KEY_LABEL } from "../score/pitch.ts";
import { songInC, realFifthsOf } from "../score/view-in-c.ts";
import { readChord, chordLabel, brokenChords, type ChordRead } from "../score/chord-name.ts";
import { keyAt as keyAtTok } from "../score/song.ts";
import { resolveSongClefs, displayStates, autoOttava, CLEF_SHIFT, baseClef, isFClef, ottavaShift, startClef, wantsGrand } from "../score/clef.ts";
import { mergeTracks, planHands, type MergeOpts } from "../score/merge.ts";

/** tok = 这个图元属于哪个 token（id）：写字头 / 选区 / 强调色不进排版，score-view 按 data-tok 在 DOM 上开关 class（W-17 第 1 刀，2026-10-15）。 */
export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string; tok?: number }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string; size?: number /* px，默认 4 sp */; tok?: number }
  | { t: "text"; x: number; y: number; s: string; cls?: string; size?: number /* px，默认歌词字号 */; anchor?: "start" | "middle" | "end"; tok?: number; /** 横向压窄（以 x 为中心；1 = 不压）：紧凑档的歌词 0.85（刀 2，user 11-09「可以」）。 */ sx?: number }
  | { t: "path"; d: string; cls?: string; tok?: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string; tok?: number };
// 图元里原来还有一种「icon」（界面图标库的图标）：只有两颗钮和纸角钮用，刀 1 搬去覆盖层之后没人画了，2026-11-08 Fable 审刀 1 时删掉——排版器在类型上就画不出界面图标。

/** 要画的一个声部（顺序 = 总谱从上到下；隐藏的不在这里）。 */
export interface PartView { id: string; name: string; abbr?: string; colorIdx?: number; empty?: boolean; first?: boolean; clef?: ClefName; staves?: 2; hidden?: boolean; badges?: string[];
  
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
  measureLyric: (s: string) => number;   // px，歌词字号 = LYRIC_EM × sp
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
  /** 按 C 调看（辅助模式，v0.16.10；src/score/view-in-c.ts）：每个音从它所在的调转到 C 再排，每个调号位置上方写「1=原来的调」（中途换调那一处给字多留一点宽）。
   *  只是看法：PDF / 导出不传（按实际的调印）。 */
  inC?: boolean;
  /** 和弦标级数（v0.16.13；src/score/chord-name.ts）：叠音的和弦写它在这个调里是几级——刀 4b 起在和弦右下角、贴着下天际线（挂件，会让歌词往下让）；跟着设置印进 PDF（user 11-07「和弦级数和accessibility也进打印和最好导出，wysiwyg」）。 */
  chordTags?: boolean;
  /** 字的尺子比谱的尺子大多少（刀 2；src/score/paper.ts textScaleOf：舒适 = 1、紧凑 = 1.4）：歌名 / 作者栏 / 编排 / 曲段名、声部名 / 简写、歌词、速度 / 风格 / 反复的字、
   *  「1=F」、小节号、和弦级数、页码，连同它们周围留的地方，都按 sp × textScale 量；字形、线、cresc. / 8va / 「吸」/ 推定的灰字照旧跟谱。measureLyric 要按 LYRIC_EM × sp × textScale 的字号量。没给 = 1。 */
  textScale?: number;
  /** 只给测试用（刀 4b 守卫「注解不改版面」）：注解（ann）一个都不画。开关两边可印的图元必须逐个相同——注解只看天际线、不写。 */
  __noAnn?: boolean;
}
export { LYRIC_EM } from "./text-style.ts";
/** 这一档的歌词：字号倍数 k（字高，永远不动）+ 平常的宽度 sx（v0.16.44；表在 text-style.ts LYRIC_LOOK）。ts > 1 = 紧凑档。 */
const lyricLook = (ts: number) => (ts > 1 ? LYRIC_LOOK.compact : LYRIC_LOOK.cozy);
export interface LyricFit { dx: number; /** 宽度倍数（乘在这一档平常的宽度上；1 = 不收）。 */ sx: number; tight: boolean }
export interface LyricItem { cx: number; w: number; hy?: boolean; /** 方块字：宽度跟整段统一（不各收各的）。 */ block?: boolean }
/** 歌词之间的缝怎么算（v0.16.48；user 11-09「空格要不要用就是零点七五个字距。就是空格本来默认就挤一点」「先把这个空格的定义是什么搞清楚，每个字每个字形把它给理清楚」）：
 *  · 字宽 w = 这个音节按字形量出来的前进宽度（含字形自带的左右留白；宿主按这一档的字号 / 平常宽度量好传进来）；
 *  · 空格 space = 这款字里空格字符「 」的前进宽度 × 0.6（默认就比正常空格紧；user「连字符和空格都可以默认省一点…只要能勉强看出节奏就行了」），中英文同一个定义；
 *  · 连字符 hyphen = 连字符「-」画出来的宽度（压到 HYPHEN_SX）+ 一个上面那种空格（两边各半个）；方块字挨着的连字符不占地方（挂在两个方块字中间本来就有的那道小缝里，user「方块字的排版最好能忽视连字符」）；
 *  · 缝跟着左右两个字里**更窄的那个**一起收（× min(f)，user「空格和最窄的邻居宽度对齐」），挤的时候**先压缝、再压字**（缝最多压到 GAP_MIN）。单位都是 sp。 */
export interface LyricGaps { space: number; hyphen: number }
/** 没量的时候的默认（测试 / 没有量字的宿主）：歌词字号 1.6 sp 的系统无衬线体，空格约 0.27 字宽、连字符约 0.33 字宽。 */
export const LYRIC_SPACE = 0.6, HYPHEN_SX = 0.8, GAP_MIN = 0.5;
/** 缝再挤也至少留这么宽（sp）：能看出是两个词（user「只要能勉强看出节奏就行了」；v0.16.48 第一版没有底线 = 英文连成一片「bovetheworld」）。 */
export const GAP_FLOOR = 0.2;
export const DEFAULT_GAPS: LyricGaps = { space: 0.27 * 1.6 * LYRIC_SPACE, hyphen: 0.33 * 1.6 * HYPHEN_SX + 0.27 * 1.6 * LYRIC_SPACE };
/** 歌词让路 = 一个小优化问题（v0.16.47；user 11-09「你能不能把他formalize成一个数学问题…不用完美最优」「规则很简单。1.位置固定，不能反过来推音符。2. 空格和最窄的邻居宽度对齐 3. 帮我想一下怎么样算跑到外面没对齐」）：
 *  变量：每个字的中心 x_i、宽度倍数 f_i ∈ [minSx, 1]（方块字 = 整段统一的 blockSx，不单收）。已知：音的位置 c_i（不动）、原宽 w_i。
 *  ① 对齐（「跑到外面」的定义）：音还在字底下（|x_i − c_i| ≤ 半宽 − 0.15）且没越过和邻居音的中点（≤ 到邻居音的一半）；短字至少能挪 0.2。
 *  ② 不叠：x_{i+1} − x_i ≥ (w_i f_i + w_{i+1} f_{i+1}) / 2 + (空格 + 有连字符时连字符的地方) × min(f_i, f_{i+1})（定义见 LyricGaps）。
 *  ③ 目标：字尽量宽（少收），一样宽时离自己的音最近。
 *  解法（够用、不求完美）：从左往右推（一条链 = 能不能放得下推一遍就知道）；推到放不下的那一串，只把这一串里能收的字一起二分到刚好放得下；
 *  收到 minSx 还放不下 = 标 tight（照写，歌词框说「挤了」）。宽度定了以后，位置 = 在「不叠、不跑出去」的范围里离自己的音最近（保序回归）。纯函数。 */
function solveLyrics(items: readonly LyricItem[], blockSx: number, minSx: number, gaps: LyricGaps, widen = true): { pos: number[]; f: number[]; tight: Set<number> } {
  const n = items.length, f = items.map((it) => (it.block ? blockSx : 1)), tight = new Set<number>();
  if (!n) return { pos: [], f, tight };
  const c = items.map((it) => it.cx);
  const reach = (i: number, side: -1 | 1) => { const nb = items[i + side]; const half = nb ? Math.abs(nb.cx - c[i]) / 2 : Infinity; return Math.max(0.2, Math.min((items[i].w * f[i]) / 2 - 0.15, half)); };
  const lo = (i: number) => c[i] - reach(i, -1), hi = (i: number) => c[i] + reach(i, 1);
  const G = new Array<number>(Math.max(0, n - 1)).fill(1);   // 每道缝压到几成（挤了先压它）
  const d = (i: number) => (items[i].w * f[i] + items[i + 1].w * f[i + 1]) / 2 + Math.max(GAP_FLOOR, (gaps.space + (items[i].hy && !(items[i].block || items[i + 1].block) ? gaps.hyphen : 0)) * Math.min(f[i], f[i + 1]) * G[i]);
  const L = new Array<number>(n), start = new Array<number>(n);   // L = 从左推过来最靠左能放哪；start = 这一串被推着走的从哪个字开始
  const step = (i: number) => { const a = i > 0 ? L[i - 1] + d(i - 1) : -Infinity, b = lo(i); if (a > b) { L[i] = a; start[i] = start[i - 1]; } else { L[i] = b; start[i] = i; } };
  const pushFrom = (s: number, to: number) => { L[s] = lo(s); start[s] = s; for (let i = s + 1; i <= to; i++) step(i); };   // 串头 s 不被前面推（收窄只会让它更不被推）
  step(0);
  for (let i = 1; i < n; i++) {
    step(i);
    if (L[i] <= hi(i) + 1e-9) continue;
    // 放不下：这一串 [s..i] 里能收的字一起收到刚好放得下（二分 t：f_j = min(原来, t)）
    const s = start[i], keep = f.slice(s, i + 1), can = (j: number) => !items[j].block;
    { // 先压缝（缝最没意义，可读性最先牺牲）：这一串里的缝一起压到刚好放得下，最多压到 GAP_MIN
      const keepG = G.slice(s, i), fitsG = (t: number) => { for (let j = s; j < i; j++) G[j] = Math.min(keepG[j - s], t); pushFrom(s, i); for (let j = s; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false; return true; };
      if (fitsG(GAP_MIN)) { let a = GAP_MIN, b = 1; for (let k = 0; k < 16; k++) { const m = (a + b) / 2; if (fitsG(m)) a = m; else b = m; } fitsG(Math.max(GAP_MIN, Math.floor(a * 100) / 100)); continue; }
    }
    const fits = (t: number) => { for (let j = s; j <= i; j++) if (can(j)) f[j] = Math.min(keep[j - s], t); pushFrom(s, i); for (let j = s; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false; return true; };
    const top = Math.max(...keep);
    if (!items.slice(s, i + 1).some((_, k) => can(s + k)) || !fits(minSx)) {   // 收到最窄也放不下：照写，最后那一对标挤
      fits(minSx); tight.add(i - 1); tight.add(i);
      L[i] = Math.min(L[i], hi(i)); continue;
    }
    let a = minSx, b = top; for (let k = 0; k < 20; k++) { const m = (a + b) / 2; if (fits(m)) a = m; else b = m; }
    fits(Math.max(minSx, Math.floor(a * 100) / 100));   // 取到百分位（字宽数稳定，快照不随浮点抖）
  }
  // 放宽（v0.16.48；user「这里明显有空间没有用上」）：上面是整串一起收的，瓶颈外面本来有空的字也被压窄了——每一轮每个压着的字试着放宽 0.05，不多出新的叠就留着，直到谁都放不宽
  const clashes = (mark?: Set<number>) => { let k = 0; for (let i = 0; i < n; i++) { step(i); if (L[i] > hi(i) + 1e-9) { k += L[i] - hi(i); mark?.add(i - 1); mark?.add(i); L[i] = hi(i); } } return k; };   // 叠了多少（不是几处：已经叠着的放宽了会叠得更多）
  if (widen) {   // 先放字（字比缝要紧），字都放不宽了再放缝
    const over = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) { step(i); over[i] = Math.max(0, L[i] - hi(i)); if (over[i] > 0) L[i] = hi(i); }
    // 试改一处：只从受影响的地方往后推，推到 L 和原来一样就停（后面不会变）；叠得更多 = 撤回（性能：每次试 = 这一串的长度，不是整行）
    const tryAt = (from: number, set: () => void, undo: () => void): boolean => {
      const sL: number[] = [], sO: number[] = [], sS: number[] = [];
      set();
      let delta = 0, j = Math.max(0, from);
      for (; j < n; j++) {
        const oldL = L[j]; sL.push(oldL); sO.push(over[j]); sS.push(start[j]);
        step(j); let o = 0; if (L[j] > hi(j) + 1e-9) { o = L[j] - hi(j); L[j] = hi(j); }
        delta += o - over[j]; over[j] = o;
        if (j > from + 1 && Math.abs(L[j] - oldL) < 1e-12) { j++; break; }
      }
      if (delta <= 1e-6) return true;
      undo(); for (let k = 0; k < sL.length; k++) { L[from + k] = sL[k]; over[from + k] = sO[k]; start[from + k] = sS[k]; }
      return false;
    };
    const relax = (arr: number[], skip: (i: number) => boolean, fromOf: (i: number) => number) => {
      for (let round = 0; round < 14; round++) {
        let moved = false;
        for (let i = 0; i < arr.length; i++) {
          if (skip(i) || arr[i] >= 1) continue;
          const was = arr[i], next = Math.min(1, Math.round((was + 0.05) * 100) / 100);
          if (tryAt(fromOf(i), () => { arr[i] = next; }, () => { arr[i] = was; })) moved = true;
        }
        if (!moved) break;
      }
    };
    if (f.some((v, i) => v < 1 && !items[i].block)) relax(f, (i) => !!items[i].block, (i) => Math.max(0, i - 1));   // 字 i 变宽：影响 d(i−1)、lo / hi(i) 起
    if (G.some((v) => v < 1)) relax(G, () => false, (i) => i + 1);   // 缝 i 变宽：影响 L(i+1) 起
  }
  tight.clear(); clashes(tight); tight.delete(-1);   // 定下来的宽度再推一遍：哪几对还叠着
  // 位置：x ∈ [L, R]（R = 从右推过来最靠右能放哪），在这个范围里离自己的音最近——换成 y = x − D（D = 前面所有最小间距之和）就是保序回归
  const R = new Array<number>(n); R[n - 1] = hi(n - 1);
  for (let i = n - 2; i >= 0; i--) R[i] = Math.min(hi(i), R[i + 1] - d(i));
  const D = new Array<number>(n); D[0] = 0; for (let i = 1; i < n; i++) D[i] = D[i - 1] + d(i - 1);
  const blocks: { sum: number; cnt: number }[] = [];   // pool adjacent violators
  for (let i = 0; i < n; i++) { blocks.push({ sum: c[i] - D[i], cnt: 1 }); while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].cnt > blocks[blocks.length - 1].sum / blocks[blocks.length - 1].cnt) { const t = blocks.pop()!; blocks[blocks.length - 1].sum += t.sum; blocks[blocks.length - 1].cnt += t.cnt; } }
  const y: number[] = []; for (const b of blocks) for (let k = 0; k < b.cnt; k++) y.push(b.sum / b.cnt);
  const pos = y.map((v, i) => { const l = L[i] - D[i], r = Math.max(L[i], R[i]) - D[i]; return Math.min(Math.max(v, l), r) + D[i]; });
  for (let i = 1; i < n; i++) if (!tight.has(i) && pos[i] < pos[i - 1] + d(i - 1) - 1e-6) pos[i] = pos[i - 1] + d(i - 1);   // 保险：夹完之后还叠的（挤的那几对除外）往右让
  return { pos, f, tight };
}
/** 这一行的方块字至少要压到多宽才不挤（1、0.95…minSx 里取最宽的那个；压到底也救不了 = 救得最多的那个）。整段取各行里最窄的 = 整段统一的宽度。 */
export function lyricBlockSx(items: readonly LyricItem[], minSx = LYRIC_MIN_SX, gaps: LyricGaps = DEFAULT_GAPS): number {
  if (!items.some((it) => it.block)) return 1;
  const badBlocks = (t: number) => { const r = solveLyrics(items, t, minSx, gaps, false); let k = 0; for (const i of r.tight) if (items[i].block) k++; return k; };
  let best = 1, bestN = badBlocks(1);
  for (let t = 0.95; bestN && t >= minSx - 1e-9; t = Math.round((t - 0.05) * 100) / 100) { const k = badBlocks(t); if (k < bestN) { best = t; bestN = k; } }
  return best;
}
/** 歌词按节奏排的让路（v0.9.40 立；v0.16.43 整行一起缩；v0.16.44 字高不动、只收宽度；v0.16.47 改成上面那个小优化问题——见 solveLyrics）。
 *  items 按 cx 排好；blockSx = 方块字整段统一的宽度（宿主按 lyricBlockSx 对整段取最窄）；gaps = 空格 / 连字符按字形量的宽度（LyricGaps）。纯函数。 */
export function fitLyrics(items: readonly LyricItem[], blockSx = 1, minSx = LYRIC_MIN_SX, gaps: LyricGaps = DEFAULT_GAPS): LyricFit[] {
  const r = solveLyrics(items, blockSx, minSx, gaps);
  return items.map((it, i) => ({ dx: r.pos[i] - it.cx, sx: r.f[i], tight: r.tight.has(i) }));
}
const SCROLL_TAIL = 6;
/** 谱前简写那一列的宽度参照（7 个半角宽 = part-colors.ts ABBR_W）。 */
const ABBR_REF = "Vln.Vc.";   // sp：横卷每张纸内容后面留的尾巴
const NAME_MAX = 6.5;   // sp：谱前声部名一列最宽（再长折行；engrave() 里 nameLines）

/** 一条谱行（某张纸、某行、某个声部）：top/bottom = 这一条占的竖直范围（含歌词）。 */
export interface SystemBox { top: number; staffTop: number; bottom: number; paper: string; part: string; sys: number; staff: Staff; /** 五线谱右端（px；播放时的小节底色右边界用，v0.10.12）。 */ x1?: number;
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
const NAME_MIN = 3.0 * 2 + 0.4;   // 两颗钮 3.0（v0.16.33 起；改钮的大小要两处一起改）
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
  /** 和弦级数的点击框 + 认出来的候选（o.chordTags 开着才有；点了 = 候选小菜单）。 */
  chordTags: { x: number; y: number; w: number; h: number; read: ChordRead }[];
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
  keyHints: { system: number; index: number; x: number; y: number; size: number }[];
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
  /** 每行歌词的基线 y（px；= lyricY(system) 的平数据，排版进 worker 后主线程靠它重建 lyricY；2026-10-21）。 */
  lyricYs: number[];
  lyricY: (system: number) => number;
  yOf: (system: number, d: number) => number;
  dOf: (system: number, y: number) => number;
}
/** 排版过线用的平数据（worker → 主线程 structuredClone）：Layout 去掉三个闭包。2026-10-21 by Claude Fable 5.1（排版进 worker；user 10-21「这个活也加进去」）。 */
export type LayoutData = Omit<Layout, "lyricY" | "yOf" | "dOf">;
export function stripLayoutFns(l: Layout): LayoutData { const { lyricY: _a, yOf: _b, dOf: _c, ...d } = l; return d; }
/** 把三个闭包装回去：yOf / dOf 只看那一行的 staffTop 和 sp（和 engrave 里的定义逐字相同），lyricY 读 lyricYs。test/layout-worker.test.ts 对着 engrave 原装的闭包逐行核。 */
export function attachLayoutFns(d: LayoutData): Layout {
  const half = d.sp * 0.5;
  const yOf = (r: number, dd: number): number => d.systems[r].staffTop + (TOP_LINE - dd) * half;
  return { ...d, yOf, dOf: (r, y) => Math.round(TOP_LINE - (y - d.systems[r].staffTop) / half), lyricY: (r) => d.lyricYs[r] };
}

// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
const SQUEEZE = 0.15;
/** 防抖：行的上下留白、歌词基线往下让，超出版式最小值的那一截按这么多线间距一格往上取（刀 4b 之后，user 11-09）。 */
const ROW_STEP = 1;   // 一行最多压紧多少（音符总宽的比例）
const MARGIN = 1.2, BAR_W = 1.6, TITLE_H = 5.4;   // TITLE_H = 纸面最上面歌名那一条（v0.10.23：歌名放大了，这一条跟着高）
const PAPER_H = 3.4, PAPER_GAP = 1.6;
/** 纸上的小控件（不印）：在自己那一条里尽量大（2026-10-10 user「纸张上的小控件既然打印的时候不显示。在不影响点击和排版的时候为什么不做大一点，好点」）——
 *  高 = 曲段名那一条（3.4）减上下各 0.2；字放大；那一条本身不变高（排版 / 分页 / PDF 都不动）。 */
const CTL_H = 3.0, CTL_GLYPH = 2.0, CTL_TEXT = 1.4;   // 曲段名那一条；纸与纸之间多空的；隐藏声部的细行
/** 版式（sp）：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、行与行之间不留、没歌词的那条谱更矮。 */
const SPACING: Record<Density, { staffAbove: number; rowH: number; rowHNoLyric: number; graveUpper: number; lyricBelow: number; sysGap: number }> = {
  cozy: { staffAbove: 4.6, rowH: 13.4, rowHNoLyric: 11, graveUpper: 9.4, lyricBelow: 4.4, sysGap: 0.4 },   // graveUpper = 大谱表上面那条（没歌词、紧挨着下面那条）
  compact: { staffAbove: 4, rowH: 12.2, rowHNoLyric: 9.6, graveUpper: 8.6, lyricBelow: 4, sysGap: 0 },
};
export const TOP_LINE = 38;   // 五线谱最上面那条线的 d（attachLayoutFns 重建 yOf / dOf 要它；2026-10-21 排版进 worker）
const MID_LINE = 34, BOTTOM_LINE = 30;
// 修的字形（SMuFL；宽 / 高 = staff space，浏览器里量的 Bravura：重音 1.36 × 0.99、跳音点 0.28、保持线 1.35 × 0.17）。Above 的从基线往上长，Below 的往下长
const ART_GLYPH: Record<Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll">, { above: string; below: string; w: number; h: number }> = {
  stress: { above: "\u{E4B6}", below: "\u{E4B7}", w: 1.0, h: 1.0 },     // 次重音（2026-10-08 深夜；宽高 = canvas 量的 Bravura 墨迹）
  unstress: { above: "\u{E4B8}", below: "\u{E4B9}", w: 1.6, h: 0.9 },   // 弱化
  accent: { above: "\u{E4A0}", below: "\u{E4A1}", w: 1.36, h: 0.99 },
  marcato: { above: "\u{E4AC}", below: "\u{E4AD}", w: 1.0, h: 1.08 },   // 强音（2026-10-08；宽按同字号和重音比着量的）
  staccato: { above: "\u{E4A2}", below: "\u{E4A3}", w: 0.28, h: 0.28 },
  tenuto: { above: "\u{E4A4}", below: "\u{E4A5}", w: 1.35, h: 0.17 },
};
const GLYPH_BREATH = "\u{E4CE}";   // breathMarkComma
/** 强度那一组（重音 / 强音 / 次重音 / 弱化）：一律画在谱上方（user「强度记号统一放上面吧，不然容易misleading」）。 */
const isStrength = (a: string) => a === "accent" || a === "marcato" || a === "stress" || a === "unstress";
const DYN_GLYPH: Record<Dyn, string> = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" };     // F5 / B4 / E4 的五线谱位置
/** 力度字的墨迹（sp，相对字的原点：左、右、基线以上、基线以下）：浏览器里 canvas measureText 量的 Bravura（2026-10-08 Opus 5.5；此前估的宽度小了一截，渐强渐弱压到字上）。
 *  渐强渐弱和两头的字之间留 PIN_GAP；点击区域按它。 */
const DYN_INK: Record<string, [number, number, number, number]> = { ppp: [-0.4, 4.3, 1.1, 0.6], fff: [-0.6, 3.4, 1.8, 0.6], pp: [-0.4, 3, 1.1, 0.6], p: [-0.4, 1.5, 1.1, 0.6], mp: [-0.1, 3.3, 1.1, 0.6], mf: [-0.1, 3.3, 1.7, 0.7], f: [-0.6, 1.5, 1.8, 0.6], ff: [-0.6, 2.5, 1.8, 0.6] };
const PIN_GAP = 0.7;
/** 渐强渐弱比一整行还长 = 不画发夹，写「cresc. - - -」/「dim. - - -」（user 2026-10-08「如果一个超级长的<号不要让它太awkward」；
 *  记谱的老规矩：长的渐变用文字加虚线，发夹留给短的）。字号 / 大概字宽（sp）、虚线一节多长 / 隔多远。 */
const PIN_WORD = { size: TEXT_STYLES["dyn-word"].em, w: { cresc: 4.7, dim: 3.5 } } as const, DASH = { len: 0.6, gap: 1.0 } as const;
const RAMP_DASH = { len: 0.5, gap: 0.4 } as const;   // 渐到发夹的虚线（sp；原 CSS 4px / 3px 在默认缩放下差不多）
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
const baseWidth = (base: number) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));   // 四分 3.6，每翻倍 +0.75（2026-10-07 收紧一点：原 4.0 / +0.8，SE2 一行放不下一小节八分）

// ── 排版单元 ────────────────────────────────────────────────────────────
interface Chunk {
  kind: "chunk"; index: number; j: number; last: boolean; base: number; dotted: boolean; note: boolean; ratio: [number, number] | null; ticks: number;
  pitch: Pitch | null; ghost: boolean; tie: boolean; lyric: string | null; hyph: boolean; inBar: number; beat: number; acc: number | null; w: number; accW: number;
  m?: number;   // 第几小节（0 起；纸头弱起 = 第 0 小节）——每行开头的小节号用（v0.9.42）
  pad?: true;   // 补齐的淡色休止（不在谱里：这张纸别的声部更长，这位后面空着的那几个小节；只画、不能点）
  pitches: Pitch[]; accs: (number | null)[];   // 叠音：全部符头（从高到低，第一个 = pitch）+ 各自的临时记号
  art: Art[]; breath: boolean;                 // 修：第一段画跳音 / 重音 / 保持，最后一段后面画呼吸（2026-10-08）
  inhale?: "soft" | "big";                     // 呼吸出声：逗号后面写「吸」/「深吸」（2026-10-10）
  whisper?: boolean;                           // 气声：这个音（拆开的每一段）画 × 符头（2026-10-10）
  lyW?: number;                                // 按歌词排时这个字多宽（sp）：横向间距里当这一位歌词那一行的一样东西（刀 3）
  mrest?: "draw" | "skip";                     // 整小节休止（真写的休止正好占满一个小节、从小节头起）：不参加横向间距，画一个全休止在这个小节正中（只画 draw 那一段；刀 3）
  inkL?: number;                               // 这个音的墨往对齐线左边伸多远（sp；临时记号 / 括号 / 琶音线）：光标画在它左边（刀 3）
  x: number; system: number; tick: number; staff: Staff;   // staff = 大谱表里在上还是下（单谱表 = 1）
}
interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; tick: number; staff: Staff; warn: boolean; auto: boolean; repeat?: Repeat; times?: number; style?: "double" | "final" }   // repeat = 反复小节线（Bravura 的反复记号字形，比细线宽）   // auto = 按拍号自动画的（index = -1，不是 token）
interface KeyU { kind: "key"; index: number; fifths: number; prev: number; w: number; x: number; system: number; tick: number; staff: Staff; /** 按 C 调看时原来的调（写「1=」）。 */ real: number }
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
/** 「1=F♯」这几个字大约多宽（sp，TEMPO_EM × 0.85 的字号）：按 C 调看时中途换调那一处至少留这么宽。 */
const KEY_LABEL_W = 3.5;   // v0.16.34：「1=」和速度字一样大（原来 0.85 倍、宽 3.0）
const keyWidth = (fifths: number, prev: number) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1.0;
const timeWidth = (beats: number, beatType: number) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;

interface Head { key: number; /** 按 C 调看时原来的调。 */ real: number; time: { beats: number; beatType: number }; bpm: number; idx: Partial<Record<"key" | "time" | "tempo", number>> }
/** 一条 track → 排版单元（第 1 步：切时值、临时记号、自动小节线；tick = 从这条的开头数）。tail = 写字头在这条的尾巴后面（排一个零宽的 head 单元：五线画到右边）。 */
function unitsOf(tokens: Token[], o: { tail: boolean; autoBars: boolean; measureLyric: (s: string) => number; sp: number; ts?: number; rhythm?: boolean; /** 从这个下标起是补齐的淡色休止（不在谱里）。 */ padFrom?: number }): { units: Unit[]; head: Head; shortBars: number; pickup: boolean } {
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, real = DEFAULT_KEY, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx: Head["idx"] = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") { fifths = t.fifths; real = realFifthsOf(t); } else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType }; else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const head: Head = { key: fifths, real, time, bpm, idx: headIdx };
  //   inBar = 这个小节里已经走了多少；满了（= len）不马上画小节线，等下一个音 / 记号 / 写字头 / 曲尾来了再画——
  //   紧跟着的是人插的「|」就用它那一条（不画两条）。拍号中途变了：没写完的这个小节就此结束（同存 MusicXML）。
  const units: Unit[] = [], measureLen = (b: number, bt: number) => (b * WHOLE) / bt;
  let accState = new Map<string, number>(), inBar = 0, measureNo = 0, shortBars = 0, tick = 0, pickup = false;
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
    if (measureNo === 0 && inBar > 0 && inBar < len) pickup = true;   // 纸头还没写满就碰到「|」= 弱起（小节号：弱起算第 0 小节）
    accState = new Map(); inBar = 0; if (!(repeat === "start" && empty)) measureNo++;   // 小节开头的 |:（前面那条小节线之后紧跟着 / 纸头）不多数一个小节
  };
  const flushFull = () => { if (o.autoBars && inBar >= len && inBar > 0) pushBar(-1, true); };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (t.kind === "bar") { pushBar(i, false); return; }
    if (t.kind === "key") {
      flushFull();
      const rf = realFifthsOf(t), inC = rf !== t.fifths || "realFifths" in t;   // 按 C 调看：这一处要写「1=X」，给字留宽（KEY_LABEL_W）
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: inC ? Math.max(KEY_LABEL_W * (TEXT_STYLES["key-label"].ruler === "text" ? o.ts ?? 1 : 1), keyWidth(t.fifths, fifths)) : keyWidth(t.fifths, fifths), x: 0, system: 0, tick, staff: 1, real: rf });
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
      const mrest = !isNote && inBar < 1e-6 && Math.abs(piece - len) < 1e-6;   // 整小节休止（刀 3）：这一段正好一个小节、从小节头起
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
        const lyW = lyric && lyric !== MELISMA_MARK && !o.rhythm ? (o.measureLyric(lyricShow(lyric)) / o.sp / (o.ts ?? 1)) * lyricLook(o.ts ?? 1).k * lyricLook(o.ts ?? 1).sx : undefined;   // 歌词跟谱的尺子（量字的尺子是字的字号：除回去）
        if (lyW !== undefined) w = Math.max(w, accW + lyW + (nt.hyph ? 1.4 : 0.7));   // 按歌词排：字把音推开；按节奏排（v0.9.40）= 音只看时值
        const u: Chunk = { kind: "chunk", index: i, j, last: false, m: measureNo, base: c.base, dotted: c.dotted, note: isNote, ratio, ticks: c.ticks, pitch,
          ghost: isNote && nt.pitch === null, tie: isNote && !!nt.tie && j === 0, lyric, hyph: !!(isNote && nt.hyph && j === 0), inBar: inBar + off, beat, acc, w, accW, x: 0, system: 0, tick: tick + off, staff: 1, pitches, accs,
          art: isNote && j === 0 ? (nt.art ?? []).filter((a) => a !== "breath") : [], breath: false, ...(isNote && nt.art?.includes("whisper") ? { whisper: true } : {}), ...(lyW !== undefined ? { lyW } : {}), ...(mrest ? { mrest: off < 1e-6 ? "draw" as const : "skip" as const } : {}), ...(o.padFrom !== undefined && i >= o.padFrom ? { pad: true as const } : {}) };
        units.push(u); lastChunk = u;
        off += c.ticks; j++;
      }
      inBar += piece; left -= piece; tick += piece;
    }
    if (lastChunk) { lastChunk.last = true; if (isNote && nt.art?.includes("breath")) { lastChunk.breath = true; lastChunk.w += 0.8; if (nt.inhale) { lastChunk.inhale = nt.inhale; lastChunk.w += nt.inhale === "big" ? 2.1 : 1.2; } } }   // 出声的换气：逗号后面的字也留地方   // 呼吸逗号画在这个音后面：留一点地方
  });
  flushFull();   // 曲尾正好写满：画上这一条小节线
  if (o.tail) pushHead();   // 写字头在尾巴后面：零宽的 head 单元让这一行五线画到右边（staffEnd）；光标本身在 score-view 的 ink 层画
  return { units, head, shortBars, pickup };
}

/** 一列：同一 tick、同一种东西（小节线 / 记号 / 音）各声部对齐在一起；宽 = 最宽的那个。 */
interface Col { tick: number; slot: number; n: number; w: number; x: number; system: number; units: Unit[]; bar: boolean; chunk: boolean; phrase: boolean }

/** 歌名折行（v0.16.58，user 11-09「曲名应该能换行」）：放得下 = 一行；放不下 = 先在空格处断（「陽だまり道とれんちょん 简单笛子版」= 两行），
 *  一个词本身比一行还宽（中文 / 日文整串没有空格）= 按字断；行首不放标点和小写假名（把上一行最后一个字带下来）。w = 量宽（px），max = 一行最宽（px）。 */
const NO_LINE_START = new Set([..."、。，．・：；？！）」』】〕〉》ー～ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ,.;:!?)]}"]);
export function wrapTitle(s: string, w: (t: string) => number, max: number): string[] {
  if (w(s) <= max) return [s];
  const lines: string[] = []; let cur = "";
  const push = () => { if (cur.trim()) lines.push(cur.trim()); cur = ""; };
  for (const word of s.match(/\S+\s*/g) ?? [s]) {
    if (w((cur + word).trimEnd()) <= max) { cur += word; continue; }
    if (cur.trim()) push();
    if (w(word.trimEnd()) <= max) { cur = word; continue; }
    for (const ch of word) {
      if (cur && w((cur + ch).trimEnd()) > max) {
        if (NO_LINE_START.has(ch) && [...cur].length > 1) { const cs = [...cur], last = cs.pop()!; cur = cs.join(""); push(); cur = last; }
        else push();
      }
      cur += ch;
    }
  }
  push();
  return lines.length ? lines : [s];
}
export function engrave(song: Song, o: EngraveOpts): Layout {
  const clefStarts = resolveSongClefs(song);   // 每张纸每个声部开头的谱号（自动的按整首一路挑，和视图无关）——按 C 调看也按实际的音挑：换个看法谱号不跳
  if (o.inC) { const perc = new Set(o.parts.filter((p) => p.perc).map((p) => p.id)); song = songInC(song, (id) => perc.has(id)); }   // 按 C 调看：先换算再排（鼓不换）
  const sp = o.sp, P = (v: number) => v * sp, ts = o.textScale ?? 1, T = (v: number) => v * sp * ts;   // P = 谱的尺子；T = 字的尺子（刀 2：紧凑档 ts = 1.4，字和它周围留的地方照舒适档）
  const SPC = SPACING[densityOf(song.paper ?? { kind: "A5", widthMm: 0, heightMm: 0, marginMm: { l: 0, r: 0, t: 0, b: 0 } })];
  // 分页：第 k 页从 pageTopY(k) 起、高 PG.h；内容只放在上下边距之间；放不下的整块（一行谱 / 曲段名 + 第一行 / 细行）挪到下一页
  const PG = o.page ?? null, PAGE_GAP = 3, MX = o.page ?? o.margins ?? { l: 0, r: 0, t: 0, b: 1.5 };   // MX = 纸的边距（连续 / 分页同一套）
  const pageTopY = (k: number) => P(k * ((PG?.h ?? 0) + PAGE_GAP));
  const contentTop = (k: number) => pageTopY(k) + P(PG?.t ?? 0), contentBottom = (k: number) => pageTopY(k) + P((PG?.h ?? 0) - (PG?.b ?? 0));
  let pageNo = 0;
  const TOP = P(MX.t);
  const STAFF_ABOVE = SPC.staffAbove, LYRIC_BELOW = SPC.lyricBelow, SYS_GAP = SPC.sysGap;   // 歌词跟谱的尺子（v0.16.43：紧凑 = 配器，歌词用小字就够；user 11-09「紧凑的话其实那个小字就够了」）
  const prims: Prim[] = [];
  if (o.__noAnn) { const push = prims.push.bind(prims); prims.push = (...ps: Prim[]) => push(...ps.filter((p) => !/(^|\s)ann(\s|$)/.test(p.cls ?? ""))); }
  const autoBars = o.autoBars !== false;
  const baseRight = o.width / sp - MARGIN;
  let right = baseRight, sheetRight = baseRight;   // 横卷：每张纸排完 right = 这张纸内容的右端 + SCROLL_TAIL；sheetRight = 最长那张
  const PART_EM = TEXT_STYLES["part-name"].em, tx = (role: TextRole) => textPx(role, sp, ts);
  /** 这种字跟哪把尺子（字的尺子 = ts、谱的尺子 = 1）；TR = 按这种字的尺子量的长度（字周围留的空隙跟着字走）；mw = 这种字写这串多宽（sp，P 的单位）。 */
  const RS = (role: TextRole) => (TEXT_STYLES[role].ruler === "text" ? ts : 1), TR = (role: TextRole, v: number) => v * sp * RS(role);
  const mw = (role: TextRole, str: string) => ((o.measureLyric(str) * TEXT_STYLES[role].em) / LYRIC_EM / sp / ts) * RS(role);   // 量字的尺子按歌词字号 × ts 量的：除回去再乘这种字的尺子   // 字号一律查样式表（src/render/text-style.ts；user 11-09「深模块窄接口统一一下风格」）
  const nameW = (s: string) => (o.measureLyric(s) * PART_EM) / LYRIC_EM / sp;   // sp（量字的尺子已经按字的字号：紧凑档同一个名字占的 sp 多 1.4 倍）
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
  //   量字的尺子量的是歌词字（LYRIC_EM × sp × ts 那么大）；歌名是加粗的无衬线 = 多算 8%
  const titleLines = song.title ? wrapTitle(song.title, (t) => (o.measureLyric(t) * titleSize * 1.08) / (LYRIC_EM * sp * ts), o.width - P(2 * (MARGIN + CTL_H + 1))) : [];
  const titleLH = titleSize * 1.2, titleExtra = Math.max(0, titleLines.length - 1) * titleLH;
  titleLines.forEach((t, k) => prims.push({ t: "text", x: o.width / 2, y: titleBase + k * titleLH, s: t, cls: "song-title", size: titleSize, anchor: "middle" }));
  const title: TitleHit = { x: P(MARGIN), y: TOP + T(0.3), w: o.width - P(2 * MARGIN), h: T(TITLE_H) + titleExtra, baseline: titleBase, size: titleSize };
  // 作者栏：标题下面靠右，照写的一行一行显示（纯文本，不认格式；user「嗯所见即所得」）；空着 = 什么都不画（覆盖层写浅色提示）
  const lines = song.credits ? song.credits.split("\n") : [];
  let credits: Box | null = null;
  const cs = tx("credits"), rx = o.width - P(MARGIN), y0 = TOP + T(TITLE_H + 1.0) + titleExtra;
  if (lines.length) {
    lines.forEach((s, k) => prims.push({ t: "text", x: rx, y: y0 + k * cs * 1.35, s, cls: "credits", size: cs, anchor: "end" }));
    const w = Math.max(...lines.map((s) => (o.measureLyric(s) * 1.25) / LYRIC_EM)) + T(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + T(0.3), h: cs * 1.35 * lines.length + cs * 0.4 };
  }
  // 编排（2026-10-08 深夜 Opus 5.5；user「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」）：
  //   作者栏下面单独一行、靠左；写错的（找不到的纸、循环段不在最后…）灰字说为什么（放不下 = 下一行），放的时候跳过（纪律）
  let arrangement: TitleHit | null = null, arrLast = 0;   // arrLast = 编排那一块最后一行的基线（px；五线谱从它下面开始）
  if (!o.onlyPaper) {
    const as = tx("arr"), wOf = (t: string, size: number) => (o.measureLyric(t) * size) / LYRIC_EM, row = Math.max(lines.length, 1), base = y0 + row * cs * 1.35;
    const arr = parseArrangement(song.arrangement, song.papers), txt = song.arrangement?.trim() ?? "";
    const label = _t("编排　"), lw = wOf(label, 1.25), x0 = P(MARGIN) + lw, avail = o.width - P(2 * MARGIN) - lw;
    if (txt) prims.push({ t: "text", x: P(MARGIN), y: base, s: label, cls: "arr-label", size: as, anchor: "start" });   // 没写编排 = 标签只是入口（提示）= 覆盖层写
    arrLast = base;
    if (txt) {
      prims.push({ t: "text", x: x0, y: base, s: txt, cls: "arr", size: as, anchor: "start" });
      if (arr.issues.length) {
        const why = `· ${arr.issues[0].why}${arr.issues.length > 1 ? _t(" 等 {n} 处", { n: arr.issues.length }) : ""}`, tw = wOf(txt, 1.25) + T(0.8), fits = tw + wOf(why, 1.1) <= avail;
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
  /** 速度记号画在基线 y（刀 4b：y 由宿主按天际线定——挂件第 7 样，这一段天际线往上 0.5）。 */
  const drawTempoAt = (r: number, x0: number, v: number, cls: string, index: number, change: "up" | "down" | undefined, y: number) => {
    const fs = tx("tempo-word"), word = tempoWord(v).it, k = RS("tempo-word");   // 尺子查样式表（v0.16.48 起跟谱，user「速度那一串字号…也应该跟着走」）
    // 这一段开头的速度和上一段不一样 = 前面标一个强调色的 ↑（快了）/ ↓（慢了）提示（user 2026-10-08「不要grey out，而是有变化的时候会标一个东西提示用户」；一样 = 照常画，不标）
    if (change) prims.push({ t: "text", x: P(x0 - 0.3), y, s: change === "up" ? "↑" : "↓", cls: "tempo-change ann", size: fs, anchor: "end" });
    const ww = mw("tempo-word", word), num = `= ${v}`, nw = mw("tempo-num", num);
    prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
    const gx = x0 + ww + 0.7 * k;
    prims.push({ t: "glyph", x: P(gx), y: y - TR("tempo-word", 0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
    prims.push({ t: "text", x: P(gx + 1.3 * k), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
    marks.push({ index, kind: "tempo", system: r, x: P(x0 - 0.3), y: y - TR("tempo-word", TEMPO_EM * 1.1), w: P(gx + 1.3 * k + nw + 0.6 * k - x0), h: TR("tempo-word", TEMPO_EM * 1.5) });
  };
  /** 调号位置上方的「1=X」（v0.16.10）：hint = 专业模式没有升降号的地方（刀 1 起不画，只记锚点 keyHints，覆盖层写淡的「1=C」）。字也算这个调号的点击区（谱头面板）。 */
  const keyLabel = (r: number, x0: number, f: number, hint: boolean, index: number) => {
    const y = staffTop(r) - P(0.8);
    if (hint) { keyHints.push({ system: r, index, x: P(x0), y, size: tx("key-hint") }); return; }   // 淡的「1=C」只在编辑器里、不印：跟谱（紧凑档不放大，不然挨上第一个音的力度字；刀 2）
    prims.push({ t: "text", x: P(x0), y, s: `1=${KEY_LABEL[f] ?? "?"}`, cls: "keysig key-label", size: tx("key-label"), anchor: "start" });   // 和速度字一样大（v0.16.34；user 11-08「1=F 这些符号也不要字体刻意的小」）
    marks.push({ index, kind: "key", system: r, x: P(x0 - 0.2), y: y - TR("key-label", TEMPO_EM * 0.95), w: TR("key-label", KEY_LABEL_W), h: TR("key-label", TEMPO_EM * 1.2) });
  };
  const drawKeySig = (r: number, x0: number, f: number, cls: string, clef: "G" | "F" = "G") => {   // 低音谱号的升降号比高音低两级
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat, off = clef === "F" ? -2 : 0;
    for (let k = 0; k < Math.abs(f); k++) prims.push({ t: "glyph", x: P(x0 + k * 1.05), y: yOf(r, pos[k] + off), ch, cls });
  };

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
    const absorbed = new Map<string, PartView[]>(), virt = new Map<string, Token[]>(), lowOf = new Map<string, string>();   // 主人 id → 叠进来的房客 / 并好的虚拟 track / 双手谱下面那张的假 id
    const voice2Of = new Map<string, string>(), shareWith = new Map<string, string>(), startFor = new Map<string, ClefName>();
    const drumNames = new Map<string, PartView[]>();   // 一家全是鼓：谱前名字的顺序 = 各位的音在鼓谱上的高低（v0.16.4，user 11-07「鼓合租的时候应该是按照代理音符的高低排序前面的名字」）   // 一张谱表 → 它的声部 2 / 声部 2 → 画在哪一位那行 / 虚拟那几条的谱号
    // 按一家收（主人 id）：这张纸上这一家在场的有两位以上就叠——主人不在这张纸上也照样叠，打头的那位在场的当这一行（v0.10.31；user「piano1不在的时候piano2和3没有成功合并」）
    const famOf = (id: string) => hostOf(id) ?? (song.parts.some((x) => x.host === id) ? id : null);
    const famIds = [...new Set(visible.map((p) => famOf(p.id)).filter((x): x is string => !!x))];
    const famHere = (fid: string) => visible.filter((p) => famOf(p.id) === fid);   // 按歌里的顺序（主人在前）
    for (const fid of famIds) {
      const ms = famHere(fid); if (ms.length < 2) continue;
      if (editingHere !== null && famOf(editingHere) === fid) continue;
      const hp = ms[0], ten = ms.slice(1), drums = ms.every((m) => !!m.perc);
      // 一家全是鼓：固定敲一件的换成那一件的鼓键（五线鼓谱上它那一线）；音效（不是鼓键）= 一个表里没有的键（画在中间那条线）
      //   单件乐器（木鱼 / 太鼓…）= 它在一套鼓里的那个键（概念的 mainKey → kitKey）；鼓件 = 它自己的键；都没有（音效）= 一个表里没有的键（画在中间那条线）
      const kitKeyOf = (m: number): number | null => { const pk = ms[m].perc!; return pk.kind === "one" ? pk.info.kitKey ?? (pk.info.staff === 5 && !pk.info.from ? pk.key : 0) : null; };
      const keyOf = drums ? (m: number, p: Pitch): Pitch => { const k = kitKeyOf(m); return k !== null ? spellMidi(k, 0) : p; } : undefined;
      const tracksM = ms.map((m) => paper.tracks[m.id]);
      if (drums) {   // 每位的「代表线」：固定敲一件 = 那一键在五线鼓谱上的线；整套鼓 = 这张纸上它的音的中位线；表里没有 = 中间那条线（4）。线小 = 画得高 = 名字在上；一样高按歌里的顺序
        const lineOfKey = (key: number) => percOf(128, 0, key)?.line ?? 4;
        const rep = ms.map((_, m) => {
          const k = kitKeyOf(m); if (k !== null) return lineOfKey(k);
          const ls = (tracksM[m] ?? []).flatMap((t) => (t.kind === "note" ? allPitches(t as NoteTok) : [])).map((p) => lineOfKey(midiOf(p))).sort((a, b) => a - b);
          return ls.length ? ls[ls.length >> 1] : 4;
        });
        drumNames.set(hp.id, ms.map((_, m) => m).sort((a, b) => rep[a] - rep[b] || a - b).map((m) => ms[m]));
      }
      absorbed.set(hp.id, ten);
      // 一张谱表的一条：谱号按这张谱上所有的音挑；声部 1 = 这一位（符干朝上）、声部 2 = 假的一位 `…~v2`，画在声部 1 那一行上（符干朝下、不画休止 / 小节线 / 名字）
      const staffOf = (sid: string, mo: (v: 1 | 2) => MergeOpts, all: MergeOpts) => {
        startFor.set(sid, startClef(mergeTracks(tracksM, all), undefined, null, true));
        const v1 = mergeTracks(tracksM, mo(1)), v2 = mergeTracks(tracksM, mo(2));
        virt.set(sid, v1); virtualOut[`${paper.id}:${sid}`] = v1;
        if (v2.some((t) => t.kind === "note")) { const vid = `${sid}~v2`; virt.set(vid, v2); virtualOut[`${paper.id}:${vid}`] = v2; voice2Of.set(sid, vid); shareWith.set(vid, sid); startFor.set(vid, startFor.get(sid)!); }
      };
      if (drums) {   // 一家全是鼓 = 并成一套鼓（五线鼓谱、每件在自己那一线；不分声部，符干按鼓谱表）
        const whole = mergeTracks(tracksM, { keyOf, hits: true }); virt.set(hp.id, whole); virtualOut[`${paper.id}:${hp.id}`] = whole; startFor.set(hp.id, "G");
      } else {
        // 分手 / 分声部按人（merge.ts planHands；user「我现在觉得合租的时候还是智能分左右手和声部的对应关系比较好」「以及你也可以选择合租的时候不用双手谱」）：
        //   每位一张家谱、按小节换、几个出格的音不乱认领；一张谱读得下 = 不用双手谱；同一张谱上两组人 = 两个声部（上面朝上、下面朝下）
        // 各位的家谱 = 它拆开来时的谱号（低音谱号 = 下谱；自己是大谱表 = 按音高）
        // 主人（fid，不管在不在这张纸上）设成大谱表 = 这一行一定双手谱（v0.10.42；user「就是我希望让合租是grand staff调piano1没用需要调2，很奇怪」）
        const homes = ms.map((m): 0 | 1 | null => { if (m.staves === 2) return null; const c = m.clef ?? clefStarts.get(paper.id)?.get(m.id); return c ? (isFClef(c) ? 1 : 0) : null; });
        const plan = planHands(tracksM, wantsGrand, homes, song.parts.find((x) => x.id === fid)?.staves === 2), staffOpts = (S: 0 | 1, top: boolean) => (v: 1 | 2): MergeOpts => ({ pick: plan.pick(S, v), marks: top && v === 1 ? "all" : "bars" });
        const both = (S: 0 | 1): MergeOpts => ({ pick: (m, t) => plan.pick(S, 1)(m, t) || plan.pick(S, 2)(m, t), marks: "bars" });
        staffOf(hp.id, staffOpts(0, true), both(0));
        if (plan.grand) { const lid = `${hp.id}~lo`; lowOf.set(hp.id, lid); staffOf(lid, staffOpts(1, false), both(1)); }   // 下面那张 + 左边一个花括号
      }
    }
    // 展开着的那几家（一家里有人在写）：括号画在哪几行（主人 → 这张纸上看得见的最后一位房客）
    const openFams = famIds.filter((fid) => famHere(fid).length >= 2 && !absorbed.has(famHere(fid)[0].id)).map((fid) => ({ host: fid, ids: famHere(fid).map((p) => p.id) }));
    const gone = new Set([...absorbed.values()].flat().map((p) => p.id));   // 叠进别人那一行的
    const parts: PartView[] = visible.filter((p) => !gone.has(p.id)).flatMap((p): PartView[] => {
      if (!virt.has(p.id)) return [p];
      const drums = [p, ...absorbed.get(p.id)!].every((m) => !!m.perc), lid = lowOf.get(p.id);   // 虚拟的那一位：谱号自动、不灰任何东西（叠着只是看）
      const v: PartView = { ...p, clef: undefined, staves: undefined, perc: drums ? { kind: "kit" } : undefined, mono: false, xHead: false, ignores: [], lyricMute: undefined };
      const fake = (id: string): PartView => ({ id, name: "", empty: false, first: false, hidden: false, badges: [] }), v2 = (sid: string) => (voice2Of.has(sid) ? [fake(voice2Of.get(sid)!)] : []);
      return [v, ...v2(p.id), ...(lid ? [fake(lid), ...v2(lid)] : [])];
    });
    const loIds = new Set(lowOf.values());
    const trackOf = (id: string): Token[] => virt.get(id) ?? paper.tracks[id];
    // 隐藏的声部（刀 1，施工单 §4 第 5 条；user 11-08「我建议不留空 可以，但是如果是页面模式的话wysiwyg，排版要对齐，要不你换一个UI？」）：
    //   当它不存在——不排行、不留高度，连续和分页一样，预览的版面 = PDF 的版面。提醒归覆盖层：曲段名那一条上一颗不占位的「隐藏 N」（hiddenParts 锚点）。
    if (!parts.length) {   // 这张纸上没有显示的声部：都隐藏了 = 只有曲段名那一条（「隐藏 N」在上面）；压根没声部 = 空一行（覆盖层写「这张纸上没有声部」）
      drawPaperTitle(T(hiddenParts.length ? 0 : 3.2));
      let emptyBox: Box | undefined; if (!hiddenParts.length) { emptyBox = { x: P(MARGIN), y: yCur, w: P(right - MARGIN), h: T(3.2) }; yCur += T(3.2); }
      papersHit.push({ id: paper.id, title: pTitle, top: paperTop, bottom: yCur, hiddenParts: hiddenParts.map((p) => p.id), ...(emptyBox ? { empty: emptyBox } : {}) });
      return;
    }
    // 1. 每个声部的排版单元
    //   补齐（v0.10.6；user「点小节写这里好」「这样的话要不要做新轨在显示的时候自动补齐小节号。然后自动补的休止也是自动的淡色」「小节号（用小字体）也做一下」）：这张纸上短的声部，后面空着的时值画成淡色休止（按小节切，小节线 / 折行 / 每行开头的小节号都跟着），只画不存；
    //   点那几个小节 = 光标在尾巴 + lead（写的那一刻才落成休止，song.ts materializeLead）。
    const lenOf = (t: Token[]) => t.reduce((n, x) => n + (isTimed(x) ? x.dur : 0), 0);
    const lens = parts.map((p) => lenOf(trackOf(p.id) ?? [])), paperLen = Math.max(0, ...lens);
    const per = parts.map((p, pi) => {
      const real = trackOf(p.id), vrt = virt.has(p.id), focused = !vrt && o.at.paper === paper.id && o.at.part === p.id, staves: 1 | 2 = p.staves === 2 ? 2 : 1;
      const gap = paperLen - lens[pi];
      const padT = (dur: number, id: number): Token => ({ kind: "rest", id, dur }) as Token;
      const tokens = gap > 1e-6 ? [...real, padT(gap, -2)] : real;   // 补齐的一段 = 一个长休止（按小节切开画；光标在里面的位置 = 落点 Slot.lead，不进排版）
      const u = unitsOf(tokens, { tail: focused && !!o.tailOpen, autoBars, measureLyric: o.measureLyric, sp, ts, rhythm: song.lyricFit !== "lyrics", padFrom: real.length });
      shortBars += u.shortBars;
      if (staves === 2) {   // 大谱表：每个音在上还是下（按音高自动 / 手动指定）；光标跟着前一个音
        const stf = staffOfTokens(tokens, 2); let last: Staff = 1;
        for (const x of u.units) { if (x.kind === "chunk") { x.staff = stf[x.index]; last = x.staff; } else if (x.kind === "head") x.staff = last; }
      }
      // 谱号（v0.9.28）：这张纸开头的（声部写了 = 它，没写 = 自动）+ 每个下标处生效的谱号 / 八度线；大谱表照旧上高音下低音
      const start: ClefName = staves === 2 ? "G" : vrt ? startFor.get(p.id) ?? startClef(tokens, undefined, null, true) : clefStarts.get(paper.id)?.get(p.id) ?? "G";
      // 自动八度线（v0.9.37；user「自动加」）：在挑好的谱号下，一串很高 / 很低的音画 8va / 15ma / 8vb；手写的说了算；这位关了 / 大谱表 = 不自动。只管画，不存进谱
      const ds0 = displayStates(tokens, start), ao = staves === 2 || p.perc || shareWith.has(p.id) || (!vrt && song.parts.find((x) => x.id === p.id)?.autoOttava === false) ? null : autoOttava(tokens, ds0);   // 声部 2 不另画八度线（和声部 1 同一张谱）
      const ds = ao ? { clef: ds0.clef, ott: ao.ott, auto: ao.auto as boolean[] | null, runs: ao.runs } : { ...ds0, auto: null as boolean[] | null, runs: [] as { from: number; to: number; shift: 1 | 2 | -1 }[] };
      const fFam = staves === 2 || isFClef(start) || tokens.some((t) => t.kind === "clef" && isFClef(t.clef));
      return { p, tokens, realLen: real.length, realTicks: lens[pi], focused, staves, start, ds, fFam, vrt, ...u };
    });
    /** 同一个实际音高在谱上要挪几级：谱号 + 八度线（index < 0 = 这张纸开头的谱号）。大谱表 = 上高音下低音。 */
    const shAt = (q: (typeof per)[number], staff: Staff, index: number): number => {
      return q.staves === 2 ? (staff === 2 ? 12 : 0) : CLEF_SHIFT[(index >= 0 ? q.ds.clef[index] : undefined) ?? q.start] + ottavaShift(index >= 0 ? q.ds.ott[index] ?? 0 : 0);
    };
    // 鼓谱（v0.10.27；user「这个做好之后鼓谱做一下。团子只剩下鼓和音效了」「单乐器一线谱同意」；设计账 §2）：这一行画成几线的鼓谱。
    //   一位固定敲一件的（鼓件 / 音效）= 一线谱；整套鼓 = 五线鼓谱；一家合租全是鼓 = 并成一套鼓（上面的 keyOf）= 五线鼓谱、每件在自己那一线。
    const pmode = per.map((q) => (!q.p.perc ? null : q.p.perc.kind === "kit" ? "five" : "one"));
    /** 声部 2 画在哪一位那行（per 里的下标）；-1 = 自己一行。 */
    const rowHost = per.map((q) => { const h = shareWith.get(q.p.id); return h ? per.findIndex((x) => x.p.id === h) : -1; });
    const hasV2 = per.map((q) => voice2Of.has(q.p.id));
    /** 这个音在鼓谱上的写法（哪一线 / 符头 / 符干）：整套鼓按写的音高（= GM 鼓键）查；固定敲一件的就是那一件。 */
    const percAt = (q: (typeof per)[number], p: Pitch): PercInfo | null => { const pk = q.p.perc; return !pk ? null : pk.kind === "kit" ? percOf(128, 0, midiOf(p)) : pk.info; };
    /** 谱上的位置（级数）：鼓谱 = 一线谱那条线（一线谱的高 / 低音 ±1）/ 五线鼓谱按 MuseScore 的 line（0 = 第五线，往下 +1 走半格）；有音高 = 实际音高 + 谱号 / 八度线。 */
    const posD = (q: (typeof per)[number], p: Pitch, staff: Staff, index: number): number => {
      const m = pmode[per.indexOf(q)];
      if (m && q.p.perc) { const pi = percAt(q, p); return m === "one" ? MID_LINE - (pi && pi.staff === 1 ? pi.line : 0) : TOP_LINE - (pi ? pi.line : 4); }
      return diatonicIndex(p) + shAt(q, staff, index);
    };
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
    /** 刀 4a：一条 track 交给 stems.ts 的那一串（null = 打断符杠）+ 朝向的规矩。x = 符头左缘，单位由调用方定（横向间距那一步还不知道 x，给 0.35 = 相对对齐线）。 */
    const stemInput = (pi: number, xOf: (u: Chunk) => number): { seq: (StemNote<Chunk> | null)[]; dir: StemDir } => {
      const q = per[pi], pm = pmode[pi], percHere = !!pm && !!q.p.perc, seq: (StemNote<Chunk> | null)[] = [];
      for (const u of q.units) {
        if (u.kind === "bar" || u.kind === "key" || u.kind === "time") { seq.push(null); continue; }
        if (u.kind !== "chunk") continue;
        if (!u.note || u.base >= WHOLE) { seq.push(null); continue; }
        const ps = u.pitches.length ? u.pitches : [u.pitch!], ds = ps.map((pp) => posD(q, pp, u.staff, u.index));
        seq.push({ key: u, x: xOf(u), dHi: ds[0], dLo: ds[ds.length - 1], base: u.base, beat: Math.floor(u.inBar / u.beat), system: u.system, staff: u.staff, ghost: u.ghost,
          ...(percHere && pm !== "one" && ps.some((p) => percAt(q, p)?.stem !== "down") ? { handUp: true } : {}) });   // 鼓谱：手打朝上、脚踩朝下（一组里有手打的 = 朝上）
      }
      return { seq, dir: rowHost[pi] >= 0 ? "down" : hasV2[pi] ? "up" : percHere ? (pm === "one" ? "up" : "kit") : "auto" };   // 声部 2 朝下、有声部 2 的朝上、一线谱一律朝上
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
    const FAM_W = openFams.length ? (o.chrome?.famGap ?? 0) * ts : 0;   // 有展开着的一家：名字和谱之间多让一点给括号
    const ind0 = Math.max(NAME_MIN, ...parts.map((p) => Math.max(...nameLines(p.name, p.staves ?? 1).map(nameW)))) + 1.4 * ts + FAM_W;   // 名字一栏 = 两颗大钮的宽和名字（最长 NAME_MAX，再长折行）里大的那个；屏幕和 PDF 同一条规矩（预览 = PDF）   // 至少放得下名字下面那四颗小钮（v0.16.17；屏幕和 PDF 同一条规矩）   // 第一行让给声部名的缩进（sp；名字折行后最宽的那一行）
    // 第二行起每行写简写（v0.9.31；user「todo 总谱的每一行都放乐器名的省空间简写」→「乐手名和颜色同意」）：缩进 = 最宽的那个简写；没给简写（测试 / 老调用）= 0，照旧
    //   v0.9.41：定宽（user 经仓鼠转达「没简写的能不能想办法也按定宽裁一下，不然有一个没查到简写就beat the propose了」）——简写已按 ABBR_W 裁好（part-colors.ts fitAbbr），
    //   列宽 = 一个 ABBR_W 宽的参照（Vln.Vc.），不随谁最长变；字形特别宽、量出来超了参照的那个才撑一点（不叠到谱上）
    const indN = parts.some((p) => p.abbr) ? Math.max(nameW(ABBR_REF), ...parts.map((p) => nameW(p.abbr ?? ""))) + 1.4 * ts + FAM_W : 0;
    const keyNow = new Map<string, number>(per.map((q) => [q.p.id, q.head.key]));
    const clefW = (q: { fFam: boolean }) => (q.fFam ? W.fClef : W.gClef);
    const headerOf = (first: boolean) => Math.max(...per.map((q) => {
      const f = keyNow.get(q.p.id)!;
      return (first ? ind0 : indN) + MARGIN + 0.6 + clefW(q) + 1.0 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(q.head.time.beats, q.head.time.beatType) + 1.2 : 0.4);
    }));
    // 3. 横向间距（刀 3，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §1；算法 = src/render/spacing.ts）：
    //   一列到下一列多远 = 这一刻正在响的音里最短的那个该占的宽（别的声部的长音只是跨过好几列，不再把这一列撑大）；同一行前后两样东西真会撞才顶开；
    //   一行排满只拉 / 压弹簧（小节线、调号这些固定宽的不拉）。原来一列的宽 = 这一刻各声部刚开始的音里最长的那个（十六分对全音符：第一个 5.1、其余 2.2）。
    //   对齐线 = 列的 x；符头画在 x + 0.35（同原来），临时记号挂在左边、进前一列的空。
    const unitPart = new Map<Unit, number>(); per.forEach((q, pi) => { for (const u of q.units) unitPart.set(u, pi); });
    const spRow = (pi: number, staff: Staff) => (rowHost[pi] >= 0 ? rowHost[pi] : pi) * 4 + (staff - 1) * 2;   // 同一条谱表上的才会撞；声部 2 画在主人那一行
    const restW = (base: number) => (base >= WHOLE ? W.restWhole : base >= TPQ * 2 ? W.restHalf : base >= TPQ ? W.restQuarter : base >= TPQ / 2 ? W.rest8th : base >= TPQ / 4 ? W.rest16th : W.rest32nd);
    // 没连杠的符尾往右伸（刀 3 留的、刀 4a 补）：符干朝上的八分 / 十六分，墨从对齐线往右到约 2.5（符头才到 1.53）。行还没折，连杠按「不换行」算（一拍里折行只在一个小节一行都放不下时才有）
    const flagRight = new Map<Chunk, number>();
    per.forEach((_q, pi) => { const si = stemInput(pi, () => 0.35); for (const [c, st] of layoutStems(si.seq, si.dir).notes) if (st.flag) flagRight.set(c, st.flag.x + FLAG_W[st.up ? "up" : "down"][st.flag.level - 1]); });
    const spItems = (u: Chunk, pi: number): SpItem[] => {
      const q = per[pi], v2 = rowHost[pi] >= 0, row = spRow(pi, u.staff), out: SpItem[] = [];
      if (!u.note) {
        if (u.pad || v2 || u.mrest) return out;   // 补齐的 / 声部 2 的空不画；整小节休止画在小节正中，都不参加间距
        out.push({ row, left: -0.35, right: 0.35 + (u.dotted ? 1.5 + 0.45 : restW(u.base)), dur: u.ticks });
        return out;
      }
      const nhw = u.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack, perc = !!pmode[pi] && !!q.p.perc;
      const ds = (u.pitches.length ? u.pitches : u.pitch ? [u.pitch] : []).map((pp) => posD(q, pp, u.staff, u.index));
      const second = ds.some((d, k) => k > 0 && Math.abs(ds[k - 1] - d) === 1);
      let right = 0.35 + nhw * (second ? 1.95 : 1), left = -0.35;
      if (u.dotted) right = Math.max(right, 0.35 + nhw + 0.3 + 0.45);
      const fr = flagRight.get(u); if (fr !== undefined) right = Math.max(right, fr);
      const nAcc = perc ? [] : u.accs.map((a, k) => (a === null ? -1 : k)).filter((k) => k >= 0);
      if (nAcc.length) left = 1.1 + (nAcc.some((k, i) => i > 0 && Math.abs(ds[nAcc[i - 1]] - ds[k]) < 3) ? 1.1 : 0);
      const ghost = u.art.includes("ghost");
      if (ghost) { left = nAcc.length ? left + 0.6 : Math.max(left, 0.15); right += 0.45; }   // 括号（符头左 0.6 / 右 0.25 起，各约 0.3 宽）很细：两个音的括号允许几乎贴上（密的幽灵音滚奏不至于一个小节一行）
      if (u.art.includes("arpeggio")) left = Math.max(left, (nAcc.length ? 1.3 : 0) + 0.83);
      if (u.breath) right = Math.max(right, 0.35 + nhw + 0.55 + 0.85);
      if (u.breath && u.inhale) right = Math.max(right, 0.35 + nhw + 1.35 + (u.inhale === "big" ? 2.3 : 1.15));
      u.inkL = Math.max(0, left);
      out.push({ row, left, right, dur: u.ticks });
      if (u.lyW !== undefined && !v2) out.push({ row: spRow(pi, q.staves as Staff) + 1, left: u.lyW / 2 - 0.94, right: 0.94 + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });   // 按歌词排：字和字之间不撞（同一套顶杆）
      return out;
    };
    const spCols: SpCol[] = cols.map((c) => (c.chunk ? { tick: c.tick, items: c.units.flatMap((u) => (u.kind === "chunk" ? spItems(u, unitPart.get(u)!) : [])) } : { tick: c.tick, fixed: c.w, items: [] }));
    const spO = { curve: curveOf(densityOf(song.paper ?? { kind: "A5", widthMm: 0, heightMm: 0, marginMm: { l: 0, r: 0, t: 0, b: 0 } }) === "compact" ? "tight" : "normal"), ...SP_DEFAULTS };   // 音距跟版式（v0.16.43；user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」）：舒适 = 摸主旋律和歌词，紧凑 = 配器
    const gaps = idealGaps(spCols, paperLen, spO), rodIx = indexRods(rodsOf(spCols, spO), spCols.length);
    // 折行：只在没有音跨过的小节线后折（一个小节自己一行都放不下 = 那个小节里逐列切开）；整张纸一起挑折点（像排书的 Knuth–Plass）：
    //   每行的代价 = 拉松多少（比例的平方）/ 挤紧多少（同上，挤比拉贵 4 倍；挤一挤 = 弹簧最多压 SQUEEZE，user「「稍微超出一点的小节」压进当前行 这个就是我想要的」）+ 每行 2；
    //   最后一行不算拉松。原来是从前往后一行行塞满：小节窄了以后会出现「前面挤满、最后一行孤零零一个小节」（刀 3 样张歌第二、三段就是这样）。
    const brk = o.scroll ? Infinity : right;   // 横卷 = 不折行
    const n = cols.length, lineFrom: number[] = [], sysStarts: number[] = [], sysKeys: Map<string, number>[] = [];
    const keyAtCol: Map<string, number>[] = [];   // 第 k 列之前生效的调号（每行开头画哪个调号、行首多宽）
    for (let k = 0; k <= n; k++) { keyAtCol.push(new Map(keyNow)); if (k < n) for (const u of cols[k].units) if (u.kind === "key") keyNow.set(per[unitPart.get(u)!].p.id, u.fifths); }
    const headAt = (k: number, first: boolean) => { const keep = new Map(keyNow); keyNow.clear(); for (const [a, b] of keyAtCol[k]) keyNow.set(a, b); const h = headerOf(first); keyNow.clear(); for (const [a, b] of keep) keyNow.set(a, b); return h; };
    const tail = (to: number) => (cols[to - 1].bar ? 0 : BAR_W);
    const lineW = (from: number, to: number, s: number) => placeLine(spCols, gaps, rodIx, from, to, s).end + tail(to);
    // 段 = 能折的地方之间的一串列
    const segs: number[] = [];   // 每一段的结尾（不含）
    for (let k = 0; k < n; k++) if (k === n - 1 || (cols[k].bar && breakableAt(cols[k].tick))) segs.push(k + 1);
    if (brk !== Infinity) {   // 一段自己一行都放不下（按非首行的宽量）：逐列切开（原来的规矩）
      const fine: number[] = []; let from = 0;
      for (const end of segs) {
        let a = from;
        while (a < end && lineW(a, end, -SQUEEZE) > brk - headAt(a, a === 0)) { let k = a; while (k + 1 < end && lineW(a, k + 2, -SQUEEZE) <= brk - headAt(a, a === 0)) k++; fine.push(k + 1); a = k + 1; }
        if (a < end) fine.push(end);
        from = end;
      }
      segs.splice(0, segs.length, ...fine);
    }
    const segStart = (i: number) => (i === 0 ? 0 : segs[i - 1]);
    if (brk === Infinity || segs.length <= 1) lineFrom.push(0);
    else {
      const S = segs.length, best = new Array<number>(S + 1).fill(Infinity), prev = new Array<number>(S + 1).fill(-1);
      best[0] = 0;
      for (let i = 0; i < S; i++) {
        if (best[i] === Infinity) continue;
        const from = segStart(i), avail = brk - headAt(from, i === 0);
        for (let j = i + 1; j <= S; j++) {
          const to = segs[j - 1], tight = lineW(from, to, -SQUEEZE);
          if (tight > avail + 1e-6 && j > i + 1) break;   // 放不下了（只有一段时照放：上面已经切到放得下）
          const nat = lineW(from, to, 0), last = j === S;
          const cost = nat > avail ? 400 * ((nat - avail) / avail) ** 2 : last ? 0 : 100 * ((avail - nat) / avail) ** 2;
          if (best[i] + cost + 2 < best[j]) { best[j] = best[i] + cost + 2; prev[j] = i; }
        }
      }
      const starts: number[] = []; for (let j = S; j > 0; j = prev[j]) starts.push(segStart(prev[j]));
      lineFrom.push(...starts.reverse());
    }
    for (const k of lineFrom) { sysStarts.push(headAt(k, k === 0)); sysKeys.push(new Map(keyAtCol[k])); }
    for (const [a, b] of keyAtCol[n]) keyNow.set(a, b);
    const nSys = lineFrom.length;
    // 摆：不是最后一行、用了六成以上 = 拉满；超了（挤一挤进来的）= 压回来；别的照自然宽
    //   最后一行（v0.16.44 紧凑档试，v0.16.45 舒适档也用——user「舒适档应该也会挤」）：音距跟上一行一样松（不再挤在左边、右边空一大片——user 11-09「为什么第二行抽风了」= 最后一行十六分音符挤成一团、歌词被压）；
    //   铺过了整行宽 = 拉满。只看上一行的松紧、不看歌词，打字时前面的音照样不动（上一行折行变了才会变）。两档一样。
    let prevStretch = 0;
    for (let s = 0; s < nSys; s++) {
      const from = lineFrom[s], to = s + 1 < nSys ? lineFrom[s + 1] : n; if (from >= to) continue;
      const avail = brk - sysStarts[s], nat = placeLine(spCols, gaps, rodIx, from, to, 0);
      let f: { xs: number[]; end: number; stretch?: number } = brk !== Infinity && (nat.end > avail + 1e-6 || (s !== nSys - 1 && nat.end >= avail * 0.6)) ? fitLine(spCols, gaps, rodIx, from, to, avail, { squeeze: SQUEEZE, justify: true }) : nat;
      if (s === nSys - 1 && s > 0 && f === nat && prevStretch > 0 && brk !== Infinity) {
        const g = placeLine(spCols, gaps, rodIx, from, to, prevStretch);
        f = g.end <= avail + 1e-6 ? { ...g, stretch: prevStretch } : fitLine(spCols, gaps, rodIx, from, to, avail, { squeeze: SQUEEZE, justify: true });
      }
      prevStretch = f.stretch ?? 0;
      for (let k = from; k < to; k++) {
        const c = cols[k], x0 = sysStarts[s] + f.xs[k - from], x1 = sysStarts[s] + (k + 1 < to ? f.xs[k + 1 - from] : f.end);
        c.x = x0; c.system = s; c.w = Math.max(0, x1 - x0);
        for (const u of c.units) { u.x = c.x; u.system = s; if (u.kind === "chunk") u.w = c.w; }
      }
    }
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
    const lyrUnit = (str: string) => (o.measureLyric(str) / sp / ts) * look.k * look.sx;   // 这一档歌词字号 / 平常宽度下这串字的前进宽度（sp）
    const lyrSpace = lyrUnit(" ") * LYRIC_SPACE, lyrHyphen = lyrUnit("-") * HYPHEN_SX;
    const lyrGaps: LyricGaps = { space: lyrSpace, hyphen: lyrHyphen + lyrSpace };   // 定义见 LyricGaps
    if (song.lyricFit !== "lyrics") per.forEach((q, r) => {
      if (!lyricsOf[r]) return;
      const bySys = new Map<number, (LyricItem & { index: number })[]>();
      for (const u of q.units) if (u.kind === "chunk" && u.lyric && u.lyric !== MELISMA_MARK) {
        const arr = bySys.get(u.system) ?? []; bySys.set(u.system, arr);
        arr.push({ index: u.index, cx: u.x + 0.6, w: (o.measureLyric(lyricShow(u.lyric)) / sp / ts) * look.k * look.sx, hy: u.hyph, block: isBlockScript(u.lyric) && [...lyricShow(u.lyric)].length <= 1 });   // 一个音上两个以上方块字（日文「だん」这类合租）= 自己收，不带着整段一起变窄（user 11-09「日文有时候有双字合租的…这种时候也变窄到能放下？」）
      }
      // 方块字整段统一一个宽度（user 11-09「甚至是整篇曲段统一宽度，算一个最大的允许宽度」）：先每行算要压到多宽，整段（这张纸 × 这位歌手）取最窄的，再按它摆
      for (const items of bySys.values()) items.sort((a, b) => a.cx - b.cx);
      const blockSx = Math.min(1, ...[...bySys.values()].map((items) => lyricBlockSx(items, LYRIC_MIN_SX, lyrGaps)));
      for (const items of bySys.values()) fitLyrics(items, blockSx, LYRIC_MIN_SX, lyrGaps).forEach((f, k) => lyrPlan.set(`${r}:${items[k].index}`, { ...f, hw: (items[k].w * f.sx) / 2 }));
    });
    const BIG = 8192;   // 临时高度：第 row 行的第五线在 row × BIG px（一行的墨上下伸不出 BIG / 2）；画完认行 = round(y / BIG)
    const skies: Skyline[] = [];
    for (let s = 0; s < nSys; s++) for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
      const row = rowOf(s, r, k);
      rowTop.set(row, row * BIG); rowAbove.set(row, 0);
      rows[row] = { top: 0, staffTop: 0, bottom: 0, paper: paper.id, part: parts[r].id, sys: s, staff: (k + 1) as Staff, inkTop: 0, inkBottom: 0 };
      skies[row - rowBase] = new Skyline(right + MARGIN + 8);
      if (per[r].vrt) sharedRows.push(row);   // 叠起来的那一行只读
    }
    const sky = (row: number) => skies[row - rowBase]!;
    const loc = (row: number, y: number) => (y - staffTop(row)) / sp;   // px → 这一行的局部（线间距，第五线 = 0）
    const textW = (s: string, size: number) => (o.measureLyric(s) * size) / (LYRIC_EM * sp * ts);   // measureLyric 量的是 LYRIC_EM × sp × ts 那么大的字（刀 2）
    const isAnn = (p: Prim) => /(^|\s)ann(\s|$)/.test(p.cls ?? "");
    /** 记一段时间里新加的图元和点击区（贴挂件时整块挪、最后整行挪）。 */
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
    const placeAbove = (row: number, gap: number, draw: (y: number) => void): number => {
      const m = mark(); draw(staffTop(row)); collect(m, row);
      let need = Infinity; const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) { const t = sk.top(pieces[i]!, pieces[i + 1]!); if (t < Infinity) need = Math.min(need, t - gap - pieces[i + 3]!); }
      const dy = need === Infinity ? -2.4 : need; shiftSince(m, P(dy));   // 什么墨都没有（只有注解）= 照旧在第五线上方 2.4
      commit(sk, dy, true);
      return dy;
    };
    /** 谱下方贴一样东西（同上，往下挪到离上面的天际线 gap）；min = 最少挪到哪（局部 y 往下挪的下限，歌词的版式最小值用）；count = 算不算进行高。 */
    const placeBelow = (row: number, gap: number, draw: (y: number) => void, o2: { min?: number; count?: boolean; step?: number } = {}): number => {
      const m = mark(); draw(staffTop(row)); collect(m, row);
      let need = -Infinity; const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) { const b = sk.bottom(pieces[i]!, pieces[i + 1]!); if (b > -Infinity) need = Math.max(need, b + gap - pieces[i + 2]!); }
      let dy = Math.max(need === -Infinity ? 0 : need, o2.min ?? -Infinity);
      if (o2.step && o2.min !== undefined && dy > o2.min + 1e-9) dy = o2.min + Math.ceil((dy - o2.min) / o2.step - 1e-9) * o2.step;   // 防抖：往下让按整格
      shiftSince(m, P(dy));
      commit(sk, dy, o2.count !== false);
      return dy;
    };
    /** 挂件按固定的先后摆（施工单 §2.2 第 2 条那张表）：later[k] = 第 k 样（1 跳音保持在音符层里，这里从 2 起）。 */
    const later: (() => void)[][] = Array.from({ length: 13 }, () => []);
    const p0 = mark();   // 这张纸音符层的头：从这里起的图元 / 点击区最后都按行挪到位
    const drawTempo = (r: number, x0: number, v: number, cls: string, index: number, change?: "up" | "down") => { placeAbove(r, 0.5, (y) => drawTempoAt(r, x0, v, cls, index, change, y)); };
    // 每行五线画到哪：这一行最后一列是小节线 = 到那根小节线为止（不出头；user 2026-10-08「每行五线谱最好过了最后一个小节线能不能不出头」）；
    //   后面还有音 / 写字头（光标停在最后一根小节线后面）= 照旧画到右边（写的地方）。小节线画在列的 x + 0.7（见下面第 6 步）
    const staffEnd = Array.from({ length: nSys }, (_, s) => {
      const row = placedCols.filter((c) => c.system === s); if (!row.length) return right;
      const last = row.reduce((a, c) => (c.x > a.x || (c.x === a.x && (c.slot > a.slot || (c.slot === a.slot && c.n > a.n))) ? c : a));
      return last.bar ? Math.min(right, last.x + 0.7) : right;
    });
    // 5. 每条谱：五线、谱号、调号、拍号（第一行）；这一行自己的东西先画在临时高度上（5a）。跨行的（歌手牌、花括号、左边连着的竖线、色条）等行距定了再画（5b，在第 12 步之后）
    //   速度（第一个声部）和小节号是挂件（第 7 / 9 样）
    for (let s = 0; s < nSys; s++) {
      const ind = s === 0 ? ind0 : indN;
      // 小节号（v0.9.42；user 2026-10-10「小节号要，可以页面设置toggle，默认是每行开头有。字小一点」）：每行最上面那条谱的左上角，印这一行第一个小节的号；
      //   每张纸从 1 数（纸 = 曲段），弱起算第 0 小节；第一行是 1 / 0 就不印（出版谱的老规矩）。刀 4b：挂件第 9 样 = 行首那一段天际线往上 0.3
      if (song.barNumbers !== "off" && per[0]) {   // 取这一行第一位有东西的歌手（补齐之后人人都有；v0.10.6）
        const q0 = per.find((q) => q.units.some((u) => u.kind === "chunk" && u.system === s)) ?? per[0];
        const c0 = q0.units.find((u): u is Chunk => u.kind === "chunk" && u.system === s);
        const num = c0 ? (c0.m ?? 0) + (q0.pickup ? 0 : 1) : null;
        if (num !== null && !(s === 0 && num <= 1)) later[9].push(() => placeAbove(rowOf(s, 0, 0), 0.3, (y) => prims.push({ t: "text", x: P(MARGIN + ind), y, s: String(num), cls: "bar-no", size: tx("bar-no"), anchor: "start" })));
      }
      per.forEach((q, r) => {
        if (rowHost[r] >= 0) return;   // 声部 2：谱表 / 谱号 / 名字都是声部 1 那一行的
        const f = sysKeys[s].get(q.p.id) ?? q.head.key;
        for (let k = 0; k < q.staves; k++) {
          const row = rowOf(s, r, k), clef: ClefName = q.staves === 2 ? (k ? "F" : "G") : clefAtSys(q, s), base = baseClef(clef);
          if (rows[row]) rows[row].x1 = P(staffEnd[s]);
          const pm = pmode[r];   // 鼓谱：一线谱 = 中间那一条；打击乐谱号；没有调号、不能点谱号换
          for (let L = 0; L < 5; L++) { if (pm === "one" && L !== 2) continue; const y = yOf(row, BOTTOM_LINE + 2 * L); prims.push({ t: "line", x1: P(MARGIN + ind), y1: y, x2: P(staffEnd[s]), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
          let hx = MARGIN + ind + 0.6;
          if (pm) prims.push({ t: "glyph", x: P(hx), y: yOf(row, MID_LINE), ch: PERC_CLEF, cls: "clef perc-clef" });
          else prims.push({ t: "glyph", x: P(hx), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[clef], cls: "clef" });   // 高音谱号挂 G 线（第 2 线）、低音谱号挂 F 线（第 4 线）；八度谱号的小 8 / 15 在字形里
          if (!pm && !q.vrt) clefs.push({ kind: "start", paper: paper.id, part: q.p.id, index: clefSrcAtSys(q, s), system: row, x: P(hx - 0.3), ...staffHit(row), w: P(clefW(q) + 0.6) });   // 点谱号 = 谱头面板（v0.9.28；v0.16.50 大谱表上下两个谱号也能点——user「高音谱号为什么点不中」，原来只给单谱表建了点击区）
          hx += clefW(q) + 1.0;
          const keyX0 = hx;
          const fk = pm ? 0 : f;
          drawKeySig(row, hx, fk, "keysig", base); hx += Math.abs(fk) * 1.05;
          if (s === 0) {
            // 谱头记号的点击区域：谱号 + 调号一块（改调号）、拍号（改拍号）、上方速度（改速度）
            if (q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row, x: P(keyX0 - 0.3), ...staffHit(row), w: P(Math.max(1.2, hx - keyX0 + 0.3)) });   // 调号（谱号那一块归谱号，v0.9.28）
            // 「1=X」（v0.16.10）：按 C 调看 = 写原来的调；专业模式没有升降号 = 淡的「1=C」提示（不占宽）。字也能点（同调号）
            const lab = k === 0 && !pm && q.head.idx.key !== undefined ? (o.inC ? q.head.real : fk === 0 ? 0 : null) : null;
            if (lab !== null) keyLabel(row, keyX0 - 0.1, lab, !o.inC, q.head.idx.key!);
            if (fk) hx += 0.8;
            const cw = drawTime(row, hx, q.head.time.beats, q.head.time.beatType, "timesig");
            if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row, x: P(hx - 0.3), ...staffHit(row), w: P(cw + 0.6) });
            if (k === 0 && q.p.id === owner && q.head.idx.tempo !== undefined) { const ti = q.head.idx.tempo; later[7].push(() => drawTempo(row, MARGIN + ind + 0.6, q.head.bpm, "tempo", ti, prevBpm === null || prevBpm === q.head.bpm ? undefined : q.head.bpm > prevBpm ? "up" : "down")); }   // 速度 = 挂件第 7 样
          }
        }
      });
    }
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
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + T(0.55 * PART_EM) - P((LH * (nAll - 1)) / 2);   // 几行一起竖着居中（屏幕和 PDF 一样；两颗钮在覆盖层、放名字上面，可以超出谱上沿——user 11-08「歌手还是纵向居中对齐…这两个按钮是放它上面」）
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
          { const y0 = yOf(r0, TOP_LINE) - P(1.2), yEnd = ten.length ? ny + P(LH * lines.length) - T(PART_EM * 0.95) : yOf(r1, BOTTOM_LINE) + P(1.2);   // 有房客 = 主人的点击区只到它自己的名字
            partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: y0, w: P(ind0 + 0.2), h: yEnd - y0 }); }
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });   // 名字前一个小色点（不印）
          }
        } else if (q.p.abbr) {   // 第二行起：简写（一行，竖着居中），点它同样开歌手牌
          const r0 = rowOf(s, r, 0), r1 = rEnd(s), LH = PART_EM * 1.15 * ts;
          const order = drumNames.get(q.p.id) ?? [q.p, ...ten], hk = Math.max(0, order.findIndex((m) => m.id === q.p.id));   // 鼓：简写也按音的高低排（同第一行的名字）；别的合租 = 主人在上、房客跟在下面
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + T(0.55 * PART_EM) - P((LH * (order.length - 1)) / 2);
          order.forEach((m, k) => {
            if (m.id === q.p.id) { prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: q.p.abbr!, cls: q.p.empty ? "part-name abbr empty" : q.focused ? "part-name abbr focus" : "part-name abbr", size: tx("part-name"), anchor: "start" }); return; }
            prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: m.abbr ?? "", cls: "part-name abbr tenant", size: tx("part-name"), anchor: "start" }); partsHit.push({ paper: paper.id, part: m.id, x: P(MARGIN - 0.4), y: ny + P(LH * k) - T(PART_EM * 0.95), w: P(indN + 0.2), h: P(LH) });
          });
          if (q.p.colorIdx !== undefined) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny + P(LH * hk) - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
          partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: yOf(r0, TOP_LINE) - P(1.2), w: P(indN + 0.2), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE) + P(2.4) });
        }
        if (q.p.colorIdx !== undefined) {   // 每行左边一条细色条（类别色；不印）：谱号左边、从第一线到最后一线
          const r0 = rowOf(s, r, 0), r1 = rEnd(s);
          prims.push({ t: "rect", x: P(MARGIN + ind - 0.8), y: yOf(r0, TOP_LINE), w: P(0.3), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE), cls: `cat-bar ann cat-${q.p.colorIdx}` });
        }
        if (q.staves === 2 || pr !== r) {   // 大谱表（或合租的双手谱）的花括号：两条谱表左边一根粗线 + 两头小钩
          const bx = P(MARGIN + ind - 0.7), y0 = yOf(rowOf(s, r, 0), TOP_LINE), y1 = yOf(rEnd(s), BOTTOM_LINE);
          prims.push({ t: "path", d: `M${bx + P(0.5)},${y0}Q${bx - P(0.3)},${y0 + P(0.6)} ${bx},${(y0 + y1) / 2}Q${bx - P(0.3)},${y1 - P(0.6)} ${bx + P(0.5)},${y1}`, cls: "brace" });
        }
      });
      // 展开着的一家：一条括号（粗竖线 + 两头往右的小钩），在名字和谱之间；点它 = 光标挪出这一家（score-view）
      if (ind > 0 && o.chrome?.famGap) for (const fam of openFams) {   // 编辑器才要（锚点；括号归覆盖层）
        const rs = fam.ids.map((id) => per.findIndex((q) => q.p.id === id)).filter((i) => i >= 0); if (rs.length < 2) continue;
        const r0 = Math.min(...rs), r1 = Math.max(...rs), x = P(MARGIN + ind - 1.55), y0 = yOf(rowOf(s, r0, 0), TOP_LINE) - P(0.6), y1 = yOf(rowOf(s, r1, per[r1].staves - 1), BOTTOM_LINE) + P(0.6);
        families.push({ paper: paper.id, host: fam.host, x: x - P(0.6), y: y0, w: P(1.3), h: y1 - y0 });
      }
      if (nRowsSys > 1) prims.push({ t: "line", x1: P(MARGIN + ind), y1: yOf(rowOf(s, 0, 0), TOP_LINE), x2: P(MARGIN + ind), y2: yOf(rowOf(s, nR - 1, per[nR - 1].staves - 1), BOTTOM_LINE), w: P(ENGRAVE.thinBar * 1.4), cls: "bar" });
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
    // 6. 各声部的内容
    per.forEach((q, r) => {
      const tokens = q.tokens, focused = q.focused, v2 = rowHost[r] >= 0;   // 声部 2：只画音（小节线 / 调号 / 拍号 / 休止归声部 1）
      const units = q.units, tag = v2 ? { part: q.p.id } : {};
      const dynOff = dynOverridden(tokens);   // 被紧跟着的强后即弱（fp）盖掉的力度记号：画灰（纪律：画灰 + 明说；点开小菜单说为什么）
      const clefOf = (staff: Staff, index = -1): "G" | "F" => (q.staves === 2 ? (staff === 2 ? "F" : "G") : baseClef((index >= 0 ? q.ds.clef[index] : undefined) ?? q.start));
      // 谱号 + 八度线（v0.9.28）：同一个实际音高在谱上挪几级（低音谱号 +12、下加 8 +7、8va 线 −7…；高音谱号顶线 F5 = 38）
      const dIdx = (p: Pitch, staff: Staff, index = -1) => posD(q, p, staff, index);
      const RW = (u: Unit) => rowOf(u.system, r, u.staff - 1);
      const lyricRow = (s: number) => rowOf(s, r, q.staves - 1);   // 歌词在最下面那条谱表下面
      // 谱内反复 / 跳转（2026-10-09）：挂件第 6 样（刀 4b：它那一段天际线往上 0.6；原来是力度外道上面的固定一道）；不起作用的（不是最上面那位的行 / D.S. 没 Segno…）画灰，点开说为什么（repeats.ts navWhy）
      const navMute = (i: number) => (navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : "");
      const drawNav = (u: NavU) => {
        const t = tokens[u.index] as NavTok, cls = "nav-mark" + navMute(u.index), tok = t.id, row0 = rowOf(u.system, r, 0);
        const fs = tx("nav-mark"), x = P(u.x + 0.4);
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
          const h = TR("nav-mark", 1.6);   // 房子的钩跟着字高（里面写「1.」）
          const endX = (v: Unit | null, sys: number) => (v && v.system === sys ? (v.kind === "bar" ? P(v.x + (v.repeat ? 0.4 + (v.repeat === "both" ? 1.2 : 1.47) : 0.7)) : P(v.x) - P(0.3)) : P(right));
          // 每一行一段，各自贴着自己那一段天际线（跨行的房子每行高度可以不一样）
          const seg = (sys: number, xa: number, openL: boolean, xb: number, hookR: boolean, first: boolean) => placeAbove(rowOf(sys, r, 0), 0.6, (yy) => {
            prims.push({ t: "path", d: `${openL ? `M${xa},${yy}` : `M${xa},${yy + h}L${xa},${yy}`}L${xb},${yy}${hookR ? `L${xb},${yy + h}` : ""}`, cls: "volta" + navMute(u.index) });
            if (!first) return;
            prims.push({ tok, t: "text", x: x + TR("nav-mark", 0.3), y: yy + TR("nav-mark", 1.25), s: endingLabel(t.nums), cls, size: fs, anchor: "start" });
            dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.4), y: yy - TR("nav-mark", 0.4), w: TR("nav-mark", 3), h: h + TR("nav-mark", 0.8) });
          });
          const endSys = end ? end.system : u.system;
          seg(u.system, x - P(0.2), false, endX(endSys === u.system ? end : null, u.system), closed && endSys === u.system, true);
          for (let s2 = u.system + 1; s2 <= endSys; s2++) { const first = units.find((w) => w.system === s2); seg(s2, P((first?.x ?? MARGIN) - 0.3), true, endX(s2 === endSys ? end : null, s2), closed && s2 === endSys, false); }
          return;
        }
        if (t.what === "segno" || t.what === "coda") {   // Segno / Coda：Bravura 字形（缩到 0.7）
          const gs = 4 * sp * 0.7;
          placeAbove(row0, 0.6, (y) => {
            prims.push({ tok, t: "glyph", x, y, ch: t.what === "segno" ? "\u{E047}" : "\u{E048}", cls: cls.replace("nav-mark", "nav-sign"), size: gs });
            dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.3), y: y - gs * 0.8, w: gs * (t.what === "segno" ? 0.6 : 1.0), h: gs * 0.95 });
          });
          return;
        }
        const label = NAV_LABEL[t.what], tw = P(mw("nav-word", label)), atEnd = x - tw > P(MARGIN + 6);   // 它排在小节线前面：x ≈ 小节线   // D.C. / Fine / To Coda…：斜体字，靠右对齐在它的位置（小节尾）；前面放不下就靠左
        placeAbove(row0, 0.6, (y) => {
          prims.push({ tok, t: "text", x: atEnd ? x : x - P(0.2), y, s: label, cls: cls + " nav-word", size: fs, anchor: atEnd ? "end" : "start" });
          dyns.push({ index: u.index, kind: "nav", system: row0, x: atEnd ? x - tw - P(0.3) : x - P(0.5), y: y - TR("nav-word", TEMPO_EM * 1.1), w: tw + TR("nav-word", 0.8), h: TR("nav-word", TEMPO_EM * 1.5) });
        });
      };
      const nhX = (c: Chunk) => P(c.x + 0.35);   // 刀 3：对齐线 = 列的 x，临时记号挂在左边（原来 + accW）
      // × 符头：这个声部台上那位固定敲一个键（鼓件 / 音效固定原速）——谱上写的音高照留、只是不拿来出声，画成 × 让人一眼看出来（user 2026-10-08「披露就用x」）
      const pm = pmode[r], percHere = !!pm && !!q.p.perc;   // 鼓谱：符头按仓鼠的表（每个音各自的）、不画升降号
      const xHead = !!q.p.xHead && !percHere;
      /** 鼓谱上这个音的符头字形 + 宽（按时值挑黑 / 二分 / 全）。 */
      const percHead = (c: Chunk, p: Pitch) => { const pi = percAt(q, p), hd = (pi?.head === "custom" && pi.smufl ? PERC_SMUFL[pi.smufl] : undefined) ?? PERC_HEAD[pi?.head ?? "normal"] ?? PERC_HEAD.normal, k = c.base >= WHOLE ? 2 : c.base >= TPQ * 2 ? 1 : 0; return { ch: hd.ch[k], w: hd.w[k] }; };
      // 气声（2026-10-10，user「x同意，做支持」）：这个音画 × 符头（念白 / 说唱的标准写法）——和上面的 × 同一个意思：谱上的音高不拿来出声
      const xOf = (c: Chunk) => xHead || !!c.whisper;
      const nhW = (c: Chunk) => P(xOf(c) ? (c.base >= WHOLE ? W.noteheadXWhole : c.base >= TPQ * 2 ? W.noteheadXHalf : W.noteheadXBlack) : percHere && c.pitch ? percHead(c, c.pitch).w : c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
      const whisperMute = (q.p.ignores ?? []).includes("whisper");   // 台上这位做不到气声：× 照画、画灰
      const clsOf = (c: Chunk) => [c.ghost ? "ghost" : "", c.pad ? "pad-rest" : ""].filter(Boolean).join(" ") || undefined;
      /** 这个音属于哪个 token（补齐的淡色休止不算）：写字头 / 选区 / 强调色由 score-view 按 data-tok 开关 class。 */
      const tokOf = (c: Chunk): number | undefined => (c.index >= 0 && !c.pad ? tokens[c.index]?.id : undefined);
      const partLyrics: LyricHit[] = [];
      /** 刀 4b：歌词（挂件第 11 样）等这一行的天际线都量完再画：先记下来，按行画。 */
      const lyricJobs: { sys: number; run: () => void }[] = [];
      /** 力度那一层（挂件第 4 样）：力度字 / 发夹 / cresc. 字 / 渐到，各一块；keys 相同的 = 连成一串、共用一条基线。draw(基线 px)。 */
      const dynItems: { row: number; x0: number; keys: string[]; draw: (base: number) => void }[] = [];
      const drawChunk = (c: Chunk) => {
        const cls = clsOf(c), row = RW(c);
        if (!c.note) {
          if (c.pad || v2 || c.mrest === "skip") return;   // 整小节休止只画第一段（刀 3）；补齐的空小节不画休止；声部 2 的空也不画（隔得远的音才在这儿）（v0.10.19；user「remove the ghost mute idea」「dont display them. once you insert a note later in a new section, all the previous mute materialized」）：位置和落点照留，在那儿写 = 前面的空落成真休止
          if (c.mrest === "draw") {   // 整小节休止（刀 3）：不管什么拍号一律全休止、画在这个小节两条小节线的正中、不画附点（user 截图：6/8 画成附点二分且靠左）
            const k = units.indexOf(c);
            let L = sysStarts[c.system] ?? c.x, R = staffEnd[c.system] ?? right;
            for (let i = k - 1; i >= 0; i--) { const v = units[i]; if (v.system !== c.system) break; if (v.kind === "chunk" || v.w <= 1e-6) continue; L = v.kind === "bar" ? v.x + (v.repeat ? v.w - 0.4 : 0.7) : v.x + v.w; break; }
            for (let i = k + 1; i < units.length; i++) { const v = units[i]; if (v.system !== c.system) break; if (v.kind === "bar") { R = v.x + 0.7; break; } }
            const rx = P((L + R) / 2 - W.restWhole / 2), ry = pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE);
            prims.push({ tok: tokOf(c), t: "glyph", x: rx, y: ry, ch: GLYPH.restWhole, cls: cls ? `rest ${cls}` : "rest" });
            if (c.j === 0 && c.index >= 0) rests.push({ index: c.index, system: row, x: rx, y: yOf(row, MID_LINE), w: P(1.2) });
            return;
          }
          const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter
            : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
          const ry = c.base >= WHOLE && pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE);   // 全休止挂在第四线下；一线谱 = 挂在那条线下
          prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
          if (c.j === 0 && c.index >= 0 && !c.pad) rests.push({ index: c.index, system: row, x: P(c.x + 0.35), y: yOf(row, MID_LINE), w: P(1.2) });   // 补齐的淡色休止不能点（点它 = 点空白：落到那个小节开头的落点）
          if (c.dotted) prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(row, 35), ch: GLYPH.augmentationDot, cls });
          return;
        }
        const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index));   // 叠音的符头从高到低；第一个 = 旋律线
        const d = ds[0], y = yOf(row, d), x0 = nhX(c);
        c.accs.forEach((a, k) => {
          if (a === null || percHere) return;
          const ag = a === 1 ? GLYPH.accidentalSharp : a === -1 ? GLYPH.accidentalFlat : a === 2 ? GLYPH.accidentalDoubleSharp : a === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
          const near = c.accs.slice(0, k).some((b, kk) => b !== null && Math.abs(ds[kk] - ds[k]) < 3);   // 挨得近的两个临时记号错开一列
          prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x - 1.1) - (near ? P(1.1) : 0) - (c.art.includes("ghost") ? P(0.6) : 0), y: yOf(row, ds[k]), ch: ag, cls });   // 幽灵音：给左括号让位
        });
        const ledgers = new Set<number>();
        for (const dd of ds) { for (let L = 28; L >= dd; L -= 2) ledgers.add(L); for (let L = 40; L <= dd; L += 2) ledgers.add(L); }
        for (const L of ledgers) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(row, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(row, L), w: P(ENGRAVE.ledger), cls: "ledger" });
        const ng = xOf(c) ? (c.base >= WHOLE ? GLYPH.noteheadXWhole : c.base >= TPQ * 2 ? GLYPH.noteheadXHalf : GLYPH.noteheadXBlack) : c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
        let shifted = false;
        ds.forEach((dd, k) => {
          const second = k > 0 && Math.abs(ds[k - 1] - dd) === 1 && !shifted; shifted = second;   // 二度：下面那个符头往右错开（连着的二度交错）
          const mute = k > 0 && !!q.p.mono;   // 单声乐器的声部：下面的音灰掉、只唱最上面（user「叠音声部换单声乐器时下方音数据结构上保留，但是变灰」）
          if (c.j === 0 && k > 0) chordHeads.push({ ...tag, index: c.index, system: row, x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), w: nhW(c) });
          const hch = percHere && !xOf(c) ? percHead(c, (c.pitches.length ? c.pitches : [c.pitch!])[k]).ch : ng;
          prims.push({ tok: tokOf(c), t: "glyph", x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), ch: hch, cls: ["note", cls ?? "", mute ? "chord-mute" : "", c.whisper && whisperMute ? "art-mute" : ""].filter(Boolean).join(" ") });
          if (c.art.includes("ghost")) {   // 幽灵音 = 符头两边一对括号（SMuFL noteheadParenthesisLeft / Right；墨迹按 canvas 量的）
            const hx = second ? x0 + nhW(c) * 0.95 : x0, pc = ["note-paren", cls ?? ""].filter(Boolean).join(" ");
            prims.push({ tok: tokOf(c), t: "glyph", x: hx - P(0.6), y: yOf(row, dd), ch: "\u{E0F5}", cls: pc });
            prims.push({ tok: tokOf(c), t: "glyph", x: hx + nhW(c) + P(0.25), y: yOf(row, dd), ch: "\u{E0F6}", cls: pc });
          }
        });
        if (c.dotted) prims.push({ tok: tokOf(c), t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(row, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
        if (c.j === 0) notes.push({ ...tag, index: c.index, system: row, x: x0, y, w: nhW(c), d: diatonicIndex(c.pitch!) });   // d = 真的音级（拖音高用），不带谱号位移
        if (c.j === 0 && !c.tie) lyricJobs.push({ sys: c.system, run: () => {   // 歌词 = 挂件第 11 样（这一行的天际线量完、歌词的基线定了再画）
          const fit = lyrPlan.get(`${r}:${c.index}`), ly0 = lyricY(lyricRow(c.system)), cx0 = x0 + nhW(c) / 2;   // 按节奏排：让过路的位置
          const ly = ly0, cx = cx0 + (fit ? P(fit.dx) : 0);
          partLyrics.push({ index: c.index, system: row, x: cx, y: ly, ...(fit?.tight ? { tight: true as const } : {}) });
          if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly0, x2: x0 + nhW(c) + P(0.4), y2: ly0, w: P(0.12), cls: "melisma" });
          else if (c.lyric) prims.push({ tok: tokOf(c), t: "text", x: cx, y: ly, s: lyricShow(c.lyric), ...(look.k !== 1 || ts !== 1 ? { size: P(LYRIC_EM * look.k) } : {}), ...(look.sx * (fit?.sx ?? 1) !== 1 ? { sx: look.sx * (fit?.sx ?? 1) } : {}), cls: ["lyric", q.p.lyricMute?.has(tokens[c.index]?.id ?? -1) ? "lyric-mute" : "", fit?.tight ? "lyric-tight" : "", cls ?? ""]   /* 挤了不画灰（v0.16.45；user「挤了能不能不画灰」「灰是有别的语义的」= 唱不出来 / 不认）：只留 lyric-tight 给歌词框说「挤了」 */.filter(Boolean).join(" ") });
        } });
      };
      for (const u of units) {
        const row = RW(u);
        if (u.kind === "phrase") {   // 句号（没有语义，只给「合」当边界）：歌词行上一个小灰「。」，跟在上一个音后面（注解：歌词那一样里画，只看不占）
          lyricJobs.push({ sys: u.system, run: () => { prims.push({ t: "text", x: P(u.x + 0.1), y: lyricY(lyricRow(u.system)), s: "。", cls: "phrase-mark ann", size: tx("phrase-mark"), anchor: "start" }); } });
          continue;
        }
        if (u.kind === "dyn") {   // 力度：谱上方、和后面那个音左对齐；挂件第 4 样（刀 4b：和用发夹连着的一串共用一条基线，贴它们自己那几段天际线往上 0.4；挨得近的两个 = 后摆的那个自然叠上去）
          const dr = rowOf(u.system, r, 0), ui = units.indexOf(u), [il, ir, iu, id] = DYN_INK[u.value];
          dynItems.push({ row: dr, x0: P(u.x + 0.3 + il), keys: [`${dr}|d${ui}`], draw: (dy) => {
            prims.push({ t: "glyph", x: P(u.x + 0.3), y: dy, ch: DYN_GLYPH[u.value], tok: tokens[u.index].id, cls: "dyn" + (dynOff.has(u.index) ? " art-mute" : "") });
            dyns.push({ index: u.index, kind: "dyn", system: dr, x: P(u.x + 0.3 + il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
          } });
          continue;
        }
        if (u.kind === "groove") {   // 风格记号（拍子轻重）：斜体字、和后面那个音左对齐；不认识的预设（以后的版本写的）= 灰字 + 说明（纪律）。挂件第 8 样：速度之后、贴天际线往上 0.5（挤了自然叠上去）
          const gt = tokens[u.index] as GrooveTok, gr = rowOf(u.system, r, 0), label = grooveLabel(gt), known = !!grooveStyle(gt.style);
          const fs = tx("groove-mark"), gw = P(mw("groove-mark", label)), gx = P(u.x + 0.3);
          later[8].push(() => placeAbove(gr, 0.5, (gy) => {
            prims.push({ t: "text", x: gx, y: gy, s: label, tok: gt.id, cls: ["groove-mark", known ? "" : "groove-unknown"].filter(Boolean).join(" "), size: fs, anchor: "start" });
            dyns.push({ index: u.index, kind: "groove", system: gr, x: P(u.x), y: gy - TR("groove-mark", TEMPO_EM * 1.1), w: gw + TR("groove-mark", 0.6), h: TR("groove-mark", TEMPO_EM * 1.5) });
          }));
          continue;
        }
        if (u.kind === "head") continue;   // 写字头（零宽，只在尾巴）：只为五线画到右边；光标本身 score-view 在 ink 层按落点（slots）画
        if (v2 && (u.kind === "bar" || u.kind === "key" || u.kind === "time")) continue;   // 声部 2：小节线 / 调号 / 拍号是声部 1 画的（单位留着：符杠照样在小节线处断）
        if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {   // 小节线 / 调号 / 拍号：每张谱表各画一份
          for (let k = 0; k < q.staves; k++) {
            const rr = rowOf(u.system, r, k), clef = clefOf((k + 1) as Staff, u.index), sh = clef === "F" ? 12 : 0;
            if (u.kind === "bar") bars.push({ system: rr, x: P(u.x + 0.7) });
            if (u.kind === "bar" && u.repeat) {   // 反复小节线：Bravura 字形（|: = E040、:| = E041、:|: = E042；一条谱高）；:| 一共放几遍 > 2 = 上面写「×3」
              prims.push({ t: "glyph", x: P(u.x + 0.4), y: yOf(rr, BOTTOM_LINE), ch: u.repeat === "start" ? "\u{E040}" : u.repeat === "end" ? "\u{E041}" : "\u{E042}", cls: "repeat-bar" + navMute(u.index), tok: tokens[u.index].id });
              if (u.times && u.times > 2 && k === 0) { const times = u.times, bx = P(u.x + 0.4 + (u.repeat === "both" ? 1.2 : 1.47)), cl = "nav-mark" + navMute(u.index); later[6].push(() => placeAbove(rr, 0.6, (y) => prims.push({ t: "text", x: bx, y, s: `×${times}`, cls: cl, size: tx("nav-mark"), anchor: "end" }))); }   // ×3 = 反复那一样（挂件第 6 样）
            } else if (u.kind === "bar") {
              const bx = P(u.x + 0.7), bcls = u.auto ? "bar auto" : "bar";
              const [bt, bb] = pmode[r] === "one" ? [MID_LINE + 2, MID_LINE - 2] : [TOP_LINE, BOTTOM_LINE];   // 一线谱：小节线上下各出一格
              prims.push({ t: "line", x1: bx, y1: yOf(rr, bt), x2: bx, y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
              if (u.style === "double") prims.push({ t: "line", x1: bx + P(0.45), y1: yOf(rr, bt), x2: bx + P(0.45), y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });   // 段落线 ‖
              if (u.style === "final") prims.push({ t: "line", x1: bx + P(0.6), y1: yOf(rr, bt), x2: bx + P(0.6), y2: yOf(rr, bb), w: P(0.5), cls: bcls });   // 终止线：细 + 粗
              if (u.warn && k === 0) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(rr, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn ann" });
            } else if (u.kind === "key") {
              if (pmode[r]) { marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) }); continue; }   // 鼓谱没有调号（记号照留、能点）
              const cls = "keysig";
              if (u.fifths === 0) { const pos = u.prev > 0 ? SHARP_POS : FLAT_POS; for (let j = 0; j < Math.abs(u.prev); j++) prims.push({ t: "glyph", x: P(u.x + 0.4 + j * 0.8), y: yOf(rr, pos[j] - (sh ? 2 : 0)), ch: GLYPH.accidentalNatural, cls }); }
              else drawKeySig(rr, u.x + 0.4, u.fifths, cls, clef);
              // 换到同一个调、又没有升降号（C → C）：什么都画不出来 → 写个小字，免得成了看不见的记号（印）。按 C 调看 = 每一处写原来的调；
              //   专业模式换成 C（画了还原号）= 淡的「1=C」提示（v0.16.10，不印）
              if (k === 0) {
                if (o.inC) keyLabel(rr, u.x + 0.2, u.real, false, u.index);
                else if (u.fifths === 0 && u.prev === 0) keyLabel(rr, u.x + 0.2, 0, false, u.index);
                else if (u.fifths === 0) keyLabel(rr, u.x + 0.2, 0, true, u.index);
              }
              marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
            } else {
              const cls = "timesig";
              drawTime(rr, u.x + 0.6, u.beats, u.beatType, cls);
              marks.push({ index: u.index, kind: "time", system: rr, x: P(u.x), ...staffHit(rr), w: P(u.w) });
            }
          }
          continue;
        }
        if (u.kind === "tempo") { if (q.p.id === owner) later[7].push(() => drawTempo(row, u.x + 0.3, u.bpm, "tempo", u.index)); continue; }   // 挂件第 7 样
        if (u.kind === "hairpin") continue;   // 渐强渐弱在 8¾ 画（要知道终点）
        if (u.kind === "nav") { later[6].push(() => drawNav(u)); continue; }   // 挂件第 6 样
        if (u.kind === "ottava") continue;   // 八度线在下面按音的范围画
        if (u.kind === "clef") {   // 行中间换谱号（v0.9.28）：小一号的谱号；正好在一行开头 = 行首的谱号已经是它，不重画
          if (q.staves === 2) continue;
          const first = !units.some((x) => x.system === u.system && x.index >= 0 && x.index < u.index && x.kind !== "ottava");
          const base = baseClef(u.clef), cls = "clef cue";
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
            const up = v > 0;
            {   // 刀 4b：8va / 15ma = 挂件第 5 样（这一段天际线往上 0.6）；8vb = 第 12 样（歌词 / 下天际线之下 0.6）。一段一条水平线
              const sk = k, se = e;
              (up ? later[5] : later[12]).push(() => { const pl = up ? placeAbove : placeBelow; pl(row0, 0.6, (y) => { const k = sk, e = se;
              const prevIdx = us[k].index - 1, cont = k === 0 && prevIdx >= 0 && (q.ds.ott[prevIdx] ?? 0) === v && units.some((x) => x.index >= 0 && x.index <= prevIdx && x.system < sy);
              const nextU = us[e + 1], lastIdx = us[e].index, endsHere = !!nextU || (q.ds.ott[lastIdx + 1] ?? 0) !== v || lastIdx + 1 >= q.tokens.length || !units.some((x) => x.system > sy && x.index > lastIdx);
              const x0 = P(us[k].x - 0.2), x1 = P(us[e].x + us[e].w - 0.3), sz = P(4 * 0.85), gw = P(SIG_W[v] * 0.85);
              const src = units.find((x) => x.kind === "ottava" && x.index <= us[k].index && (q.ds.ott[x.index] ?? 0) === v && x.system === sy) ?? null;
              if (cont) prims.push({ t: "text", x: x0, y: y + P(0.5), s: `(${v === 2 ? "15ma" : v > 0 ? "8va" : "8vb"})`, cls: "ottava cont", size: tx("ottava"), anchor: "start" });
              else prims.push({ t: "glyph", x: x0, y: y + P(up ? 0.4 : 0.4), ch: SIG[v], cls: isAuto ? "ottava auto" : "ottava", size: sz });
              const lx = x0 + (cont ? P(4.2) : gw) + P(0.4), ly = y - P(up ? 0.55 : 0.55);
              for (let x = lx; x + P(0.6) <= x1; x += P(1.0)) prims.push({ t: "line", x1: x, y1: ly, x2: x + P(0.6), y2: ly, w: P(0.1), cls: "ottava-line" });
              if (endsHere) prims.push({ t: "line", x1: x1, y1: ly, x2: x1, y2: ly + P(up ? 1.1 : -1.1), w: P(0.1), cls: "ottava-line" });
              const hitIdx = src ? src.index : (() => { for (let i = us[k].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i; return -1; })();
              const run = isAuto ? q.ds.runs.find((rr) => us[k].index >= rr.from && us[k].index <= rr.to) : undefined;
              if (q.vrt) { /* 叠起来的那一行：自动八度线只看，不能点（只读） */ } else if (run) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: -1, run, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
              else if (hitIdx >= 0) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: hitIdx, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
              }); });
            }
            k = e + 1;
          }
        }
      }
      // 7. 符干、符杠、符尾（按拍分组：同一拍里连着的八分及更短的音符共用符杠）：几何 = src/render/stems.ts（刀 4a 抽出来的纯函数），这里只画
      //   打断符杠的只有小节线和中途的调号 / 拍号；光标、力度记号、渐强渐弱、句号、速度都不打断（2026-10-08 Opus 5.5，user「为什么…力度标识会破坏八分音符尾巴的连音？」）
      const stemIn = stemInput(r, nhX);
      const stems = layoutStems(stemIn.seq, stemIn.dir, { u: sp, y: (d, n) => yOf(RW(n.key), d) });
      const upOf = new Map<Chunk, boolean>();   // 符干朝上？（演奏法画在另一侧）
      const tipOf = new Map<Chunk, number>();
      const stemXOf = new Map<Chunk, number>();   // 符干那条线的 x（px）：和弦级数跟着它摆（v0.16.62）
      for (const g of stems.groups) {
        for (const c of g.keys) {
          const st = stems.notes.get(c)!;
          upOf.set(c, st.up); tipOf.set(c, st.tip); stemXOf.set(c, st.x);
          prims.push({ tok: tokOf(c), t: "line", x1: st.x, y1: st.y0, x2: st.x, y2: st.tip, w: P(ENGRAVE.stem), cls: clsOf(c) });
          if (st.flag) prims.push({ tok: tokOf(c), t: "glyph", x: st.flag.x, y: st.flag.y, ch: (st.up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown])[st.flag.level - 1], cls: clsOf(c) });
        }
        for (const bm of g.beams) prims.push({ t: "path", d: `M${bm.xL},${bm.yL}L${bm.xR},${bm.yR}L${bm.xR},${bm.yR + bm.th}L${bm.xL},${bm.yL + bm.th}Z`, cls: ["beam", bm.ghost ? "ghost" : ""].filter(Boolean).join(" ") });
      }
      // 7¼. 滚奏（v0.16.64；user 11-07「标准滚奏记号 可以，但是要可以调整密度」）：符干中段三道斜杠（不定拍的颤音）；全音符没有符干 = 符头上方。
      //   跨小节切开、连音线连着的每一段都画（每段都在滚，标准写法）。用路径画、不用字形：PDF 的 Bravura 子集里没有颤音字形，路径两边一样、天际线也量得到
      const rollMute = (q.p.ignores ?? []).includes("roll");
      for (const c of units) {
        if (c.kind !== "chunk" || !c.note || c.index < 0) continue;
        const t = tokens[c.index]; if (t?.kind !== "note" || !(t.art ?? []).includes("roll")) continue;
        const st = stems.notes.get(c), sx = stemXOf.get(c);
        let cx: number, cy: number;
        if (st && sx !== undefined) { cx = sx; cy = st.y0 + (st.tip - st.y0) * 0.55; }
        else { const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)); cx = nhX(c) + nhW(c) / 2; cy = yOf(RW(c), Math.max(...ds)) - P(1.7); }
        const W = P(1.2), T = P(0.24), R = P(0.36), G = P(0.5), cls = ["roll", rollMute ? "art-mute" : "", clsOf(c) ?? ""].filter(Boolean).join(" ");
        for (const k of [-1, 0, 1]) { const y = cy + k * G; prims.push({ tok: tokOf(c), t: "path", d: `M${cx - W / 2},${y + R / 2}L${cx + W / 2},${y - R / 2}L${cx + W / 2},${y - R / 2 + T}L${cx - W / 2},${y + R / 2 + T}Z`, cls }); }
      }
      // 7½. 修（2026-10-08）：跳音 / 保持在符头外一格（谱内落在间里）；符干朝上 = 画在下面，朝下 / 没有符干 = 上面。呼吸 = 音后面、谱线上方一个逗号。
      //   强度那一组（重音 / 强音 / 次重音 / 弱化）**一律画在谱上方**（2026-10-08 深夜 Opus 5.5，user「强度记号统一放上面吧，不然容易misleading」）：
      //   刀 4b 起是挂件（第 2 样，贴天际线），音内起伏和突强 / 强后即弱是第 3 样；跳音 / 保持、琶音、换气照旧画在音符层（天际线从它们量起）
      const ign = new Set(q.p.ignores ?? []);   // 台上那位不认的记号：照画、画灰（user「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）
      const artEdge = new Map<Chunk, { below: boolean; y: number }>();   // 跳音 / 保持画到哪了（最外那个字的外沿，px）：连线从它们外面过（8½，v0.16.54）
      for (const c of units) {
        if (c.kind !== "chunk" || !c.note || (!c.art.length && !c.breath)) continue;
        const row = RW(c), cls = clsOf(c), cx = nhX(c) + nhW(c) / 2;
        const dsC = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)), dHi = dsC[0], dLo = dsC[dsC.length - 1];
        const below = upOf.get(c) ?? false, sgn = below ? -1 : 1;
        const inStaff = (d: number) => d >= BOTTOM_LINE && d <= TOP_LINE;
        let d = below ? dLo - 2 : dHi + 2;
        const artCls = (a: string) => ["art", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ");
        for (const a of (["staccato", "tenuto"] as const).filter((x) => c.art.includes(x))) {   // 跳音 / 保持：符头外一格，跟着符干的另一侧
          if (inStaff(d) && d % 2 === 0) d += sgn;                                                   // 谱内落在间里
          const m = ART_GLYPH[a], g = below ? m.below : m.above;
          const gy = yOf(row, d) + (below ? -P(m.h / 2) : P(m.h / 2));
          prims.push({ tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y: gy, ch: g, cls: artCls(a) });
          artEdge.set(c, { below, y: below ? gy + P(m.h) : gy - P(m.h) });   // Above 的从基线往上长、Below 的往下长
          d += sgn * 2;
        }
        // 强度那一组：一律上面（user「强度记号统一放上面吧，不然容易misleading」）。挂件第 2 样（刀 4b）：对着符头中心，这个音自己那一段天际线往上 0.4，几个就一个叠一个
        const strong = (["accent", "marcato", "stress", "unstress"] as const).filter((x) => c.art.includes(x));
        if (strong.length) later[2].push(() => { for (const a of strong) { const m = ART_GLYPH[a]; placeAbove(row, 0.4, (y) => prims.push({ tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y, ch: m.above, cls: artCls(a) })); } });
        // 音内的起伏（< / > / <>）+ 突强 / 强后即弱：音自己的修饰，挂件第 3 样（刀 4b：这个音自己那一段天际线往上 0.5，原来是整行一条「里道」）。
        //   突强 / 强后即弱的字对着符头中心（施工单 §2.2 第 5 条，user「还是居中对齐」）；小发夹从符头左缘（有字 = 字后面）到这个音的宽，中线在字的半腰。做不到的画灰
        const swl = c.j === 0 ? swellOf(tokens[c.index]) : undefined;   // 音内起伏 = 演奏法里的那一组（v0.9.44）
        const atk = (["sfz", "fp"] as const).filter((x) => c.art.includes(x));
        if (swl || atk.length) later[3].push(() => placeAbove(row, 0.5, (y) => {
          let xa = nhX(c);
          for (const a of atk) {
            const ch = a === "sfz" ? "\u{E539}" : "\u{E534}", w = P(GLYPH_BOX[ch]?.[1] ?? 2.6), gx = cx - w / 2;
            prims.push({ tok: tokOf(c), t: "glyph", x: gx, y, ch, cls: ["dyn", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
            xa = Math.max(xa, gx + w + P(0.3));
          }
          if (!swl) return;
          const ym = y - P(0.5), xb = Math.max(xa + P(1.6), nhX(c) + P(c.w) - P(0.8)), H = P(0.35);
          const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;
          const d = swl === "<" ? `M${xb},${ym - H}L${xa},${ym}L${xb},${ym + H}` : swl === ">" ? `M${xa},${ym - H}L${xb},${ym}L${xa},${ym + H}` : `M${xa},${ym}L${mx},${ym - H}L${xb},${ym}M${xa},${ym}L${mx},${ym + H}L${xb},${ym}`;
          prims.push({ t: "path", d, cls: cl });
        }));
        // 琶音（v0.9.45）：和弦左边（临时记号再左边）一条竖的波浪线，从最低的符头到最高的；做不到的（单声的歌手）画灰
        if (c.art.includes("arpeggio")) {
          const yTop = yOf(row, dHi) - P(0.7), yBot = yOf(row, dLo) + P(0.7), x0 = nhX(c) - P(c.accW + 0.9), amp = P(0.28), step = P(0.5);
          let dd = `M${x0},${yBot}`; for (let y = yBot, k = 0; y > yTop; y -= step, k++) dd += `Q${x0 + (k % 2 ? -amp : amp) * 2},${y - step / 2} ${x0},${Math.max(yTop, y - step)}`;
          prims.push({ tok: tokOf(c), t: "path", d: dd, cls: ["arpeggio", ign.has("arpeggio") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        }
        if (c.breath) prims.push({ tok: tokOf(c), t: "glyph", x: nhX(c) + nhW(c) + P(0.55), y: yOf(row, TOP_LINE + 1), ch: GLYPH_BREATH, cls: ["breath", ign.has("breath") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        // 出声的换气：逗号后面一个小字「吸」/「深吸」（出版谱的做法 = 逗号 + 文字；没有通用的单个记号）；做不到的人画灰
        if (c.breath && c.inhale) prims.push({ tok: tokOf(c), t: "text", x: nhX(c) + nhW(c) + P(1.35), y: yOf(row, TOP_LINE + 1) + P(0.45), s: c.inhale === "big" ? _t("深吸##记号") : _t("吸##记号"), cls: ["breath-label", ign.has("inhale") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: tx("breath-label"), anchor: "start" });
      }
      // 8. 连音线：同一个 token 拆开的几段之间 + 数据里的 tie（连着前一个音）。跨行 = 两半：这一行从音到行尾、下一行从行头到音
      //   （2026-10-08 Opus 5.5，user「跨行的连音符显示不正常」——以前跨行的整条不画）
      const tieArc = (row: number, d: number, x1: number, x2: number, ghost: boolean) => {
        // 弧高跟长度走（刀 4b，施工单 §2.2 第 5 条：很长的延音线不贴着符头走直线）：0.12 × 长，夹在 0.5–1.6 个线间距；短的（行头那半截）照旧压扁到长的四分之一，别像个「^」
        const len = Math.abs(x2 - x1), sgn = d < MID_LINE ? 1 : -1, y = yOf(row, d) + sgn * P(0.8), h = Math.min(len * 0.25, Math.max(P(0.5), Math.min(P(1.6), len * 0.12)));
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
      // 跳音 / 保持在连线这一侧 = 连线从它们外面过（v0.16.54；user 11-09「跳音和slur撞一起了」）：符头外 head 个线间距，或者这些记号的外沿再出去 ART_CLR，取更远的
      const ART_CLR = 0.5;
      const reach = (c: Chunk, below: boolean, head: number) => { const sgn = below ? 1 : -1, h = ext(c, below) + sgn * P(head), a = artEdge.get(c); return a && a.below === below ? (below ? Math.max(h, a.y + P(ART_CLR)) : Math.min(h, a.y - P(ART_CLR))) : h; };
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
          const ya = reach(f, below, 1.2), yb = reach(l, below, 1.2);
          const peak = g.map((c) => ext(c, below) + sgn * P(2.2));
          let cy = below ? Math.max(ya, yb, ...peak) + P(0.6) : Math.min(ya, yb, ...peak) - P(0.6);
          // 中间的音带跳音 / 保持：按真的弧线在这个音的横坐标处算——弧线 y(t) = A(t) + B(t)·cy（两个控制点同高），要越过这个音的记号外沿 + ART_CLR
          const k1 = xa + (xb - xa) * 0.2, k2 = xb - (xb - xa) * 0.2;
          const bez = (t: number, p0: number, p1: number, p2: number, p3: number) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
          for (const c of g.slice(1, -1)) {
            const a = artEdge.get(c); if (!a || a.below !== below) continue;
            const x = nhX(c) + nhW(c) / 2; let lo = 0, hi = 1;
            for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (bez(m, xa, k1, k2, xb) < x) lo = m; else hi = m; }
            const t = (lo + hi) / 2, B = 3 * t * (1 - t), A = (1 - t) ** 3 * ya + t ** 3 * yb, need = reach(c, below, 0);
            if (B > 1e-6) cy = below ? Math.max(cy, (need - A) / B) : Math.min(cy, (need - A) / B);
          }
          prims.push({ t: "path", d: `M${xa},${ya}C${xa + (xb - xa) * 0.2},${cy} ${xb - (xb - xa) * 0.2},${cy} ${xb},${yb}`, cls: ["slur", ign.has("slur") ? "art-mute" : ""].filter(Boolean).join(" ") });
        });
      }
      // 8¾. 渐强渐弱（记号，2026-10-08）：从这个记号画到终点——下一个力度记号（让开它的字）/ 下一个渐强渐弱；都没有 = 画到这张纸最后一个音，
      //   后面灰字「(f)」= 走一档推定的终点（user「走一档也行，更合理，需要向用户披露」）。跨行 = 每行画它那一份开口（按横向长度分）。
      //   和两头的力度字之间留空（user 2026-10-08「< 号不用靠着一点空隙都没有」：按量过的墨迹让开 PIN_GAP）；比一整行还长 = 写成「cresc. - - -」（PIN_WORD）。
      //   刀 4b：力度字 / 发夹 / cresc. 字 / 渐到 = 力度那一层（挂件第 4 样），各是一块（dynItems）；用发夹连着的一串（字—发夹—字）共用一条基线 = 这一串里最高的那个，
      //   贴它们自己那几段天际线往上 0.4。原来整行一条「外道」（只要这一行有个高音，整行的力度都被抬上去）。
      const LEVELS = DYNS;   // ppp…fff（v0.9.23）：走一档推定的灰字也能推到 ppp / fff
      const lastChunk = [...units].reverse().find((u): u is Chunk => u.kind === "chunk");
      const dynKey = (u: Unit) => `${rowOf(u.system, r, 0)}|d${units.indexOf(u)}`;
      const wedgeKey = (index: number, sy: number) => `${rowOf(sy, r, 0)}|w${index}:${sy}`;
      // 发夹（或太长时的「cresc. - - -」）从 (s0, startX) 到 (s1, endX)：跨行每行一段，每段是力度那一层的一块；index = 点它开哪个记号的小菜单；
      //   k0 = 第一段连着谁（前面紧挨着的力度字），k1 = 最后一段连着谁（终点的字 / 下一个发夹）；tail = 最后一段画完再画的（推定的灰字，注解）。
      //   ramp = 渐到画的（虚线；2026-10-08 深夜 Opus 5.5，user「渐到…和手动加的可以分开来」「如何不混淆的搞清楚<到底是哪里开始的」——手写的实线、渐到虚线，都从看得见的记号起）
      const wedgeItems = (index: number, dir: "cresc" | "dim", s0: number, startX: number, s1: number, endX: number, ramp: boolean, k0?: string, k1?: string, tail?: (base: number) => void) => {
        const leftOf = (sy: number) => Math.min(...units.filter((u): u is Chunk => u.kind === "chunk" && u.system === sy).map((c) => nhX(c)), P(right)) - P(1);
        const segs: [number, number, number][] = [];
        for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf(sy), sy === s1 ? endX : P(right) - P(0.3)]);
        const total = segs.reduce((n, [, a, b]) => n + Math.max(0, b - a), 0) || 1, H = P(0.5), long = total > P(right - MARGIN);
        const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
        let said = false, acc = 0, tailDone = false;
        segs.forEach(([sy, a0, b], i) => {
          if (b - a0 < P(0.3)) return;
          const row = rowOf(sy, r, 0), keys = [wedgeKey(index, sy)], last = i === segs.length - 1;
          if (i === 0 && k0) keys.push(k0);
          if (last && k1) keys.push(k1);
          if (last) tailDone = true;
          if (long) {   // 太长：「cresc.」+ 虚线，跨行接着画虚线；第一段放得下字才写（行尾剩一点点 = 字挪到下一行开头）
            const writeWord = !said && b - a0 >= ww + P(1); if (writeWord) said = true;
            dynItems.push({ row, x0: a0, keys, draw: (base) => {
              const midY = base - P(0.5); let a = a0;
              if (writeWord) { prims.push({ t: "text", x: a, y: midY + P(0.5), s: word, tok: tokens[index].id, cls: ["dyn-word", ramp ? "ramp" : ""].filter(Boolean).join(" "), size: tx("dyn-word"), anchor: "start" }); a += ww + P(0.6); }
              for (let x = a; x + P(DASH.len) <= b; x += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x, y1: midY, x2: x + P(DASH.len), y2: midY, w: P(0.12), cls: "dyn-dash" });
              dyns.push({ index, kind: "hairpin", system: row, x: a0, y: midY - P(1.4), w: b - a0, h: P(2.8) });
              if (last && tail) tail(base);
            } });
            return;
          }
          const f0 = acc / total, f1 = (acc + b - a0) / total; acc += b - a0;
          const [h0, h1] = dir === "cresc" ? [H * f0, H * f1] : [H * (1 - f0), H * (1 - f1)];
          dynItems.push({ row, x0: a0, keys, draw: (base) => {
            const y = base - P(0.5), a = a0;   // 发夹的中线 = 力度字的半腰
            // 渐到 = 虚线：两条边的每一小段在同一个 x 上（以前靠 CSS stroke-dasharray——iPad Safari 上第二条边的虚线接着第一条的相位走，
            //   尖头那边两条快重合时一段段错开打架，user「蝌蚪的尾巴在打架」，v0.10.26）。PDF / SVG 导出也就一样是虚线了
            let d = `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`;
            if (ramp) {
              const hAt = (x: number) => h0 + (h1 - h0) * ((x - a) / (b - a)), on = P(RAMP_DASH.len), per = P(RAMP_DASH.len + RAMP_DASH.gap);
              d = "";
              for (let x = a; x < b - P(0.05); x += per) { const x2 = Math.min(b, x + on); d += `M${x},${y - hAt(x)}L${x2},${y - hAt(x2)}M${x},${y + hAt(x)}L${x2},${y + hAt(x2)}`; }
            }
            prims.push({ tok: tokens[index].id, t: "path", d, cls: ["hairpin", ramp ? "ramp" : ""].filter(Boolean).join(" ") });
            dyns.push({ index, kind: "hairpin", system: row, x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
            if (last && tail) tail(base);
          } });
        });
        if (!tailDone && tail) dynItems.push({ row: rowOf(s1, r, 0), x0: endX, keys: [wedgeKey(index, s1), ...(k1 ? [k1] : [])], draw: tail });   // 最后一段太短没画：推定的灰字照样写
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
        const k1 = !endU ? undefined : endU.kind === "dyn" ? dynKey(endU) : wedgeKey(endU.index, endU.system);
        const tail = !endU || against ? (base: number) => {   // 推定的终点：现在的力度往上 / 往下一档（没有终点 / 终点和方向反着）
          const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
          prims.push({ t: "text", x: labelAbove ? endXd - P(1.2) : endXd + P(0.4), y: base + P(labelAbove ? -1.9 : 0.1), s: `(${LEVELS[k]})`, cls: "dyn-implied ann", size: tx("dyn-implied"), anchor: "start" });
        } : undefined;
        wedgeItems(h.index, h.dir, s0, startX, s1, endXd, false, dynBefore ? dynKey(dynBefore) : undefined, k1, tail);
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
        wedgeItems(u.index, b > a ? "cresc" : "dim", pu.system, sx, u.system, ex, true, dynKey(pu), dynKey(u));
      }
      // 力度那一层摆出来：同一行里 keys 有交集的连成一串（并查集），一串一起贴（共用一条基线）；从左往右摆，后摆的挨着前面的就叠上去
      later[4].push(() => {
        if (!dynItems.length) return;
        const parent = dynItems.map((_, i) => i), find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        const byKey = new Map<string, number>();
        dynItems.forEach((it, i) => { for (const k of it.keys) { const j = byKey.get(k); if (j === undefined) byKey.set(k, i); else parent[find(i)] = find(j); } });
        const chains = new Map<number, number[]>();
        dynItems.forEach((_, i) => { const root = find(i), l = chains.get(root); if (l) l.push(i); else chains.set(root, [i]); });
        const minX = (ch: number[]) => Math.min(...ch.map((i) => dynItems[i].x0));
        for (const ch of [...chains.values()].sort((a, b) => minX(a) - minX(b))) placeAbove(dynItems[ch[0]].row, 0.4, (y) => { for (const i of ch) dynItems[i].draw(y); });
      });
      // 和弦级数（v0.16.13；src/score/chord-name.ts）= 挂件第 10 样（刀 4b，user 11-08 拍：放到和弦的右下角）：x = 符头右缘 + 0.3、靠左对齐；y = 这一段下天际线再往下 0.3。
      //   按 C 调看时认的是换到 C 的谱 + C 调——级数一样。合租叠起来的虚拟行、声部 2 不标（只看个大概的）。印（跟着设置进 PDF）
      if (o.chordTags && !v2 && !q.vrt) later[10].push(() => {
        const fs = tx("chord-tag");   // 和速度字一样大（v0.16.34）；字的尺子（刀 2）
        // 分解和弦（v0.16.62，src/score/chord-name.ts brokenChords）：一拍一拍拆开弹的，标在那一组第一个音下面
        const broken = new Map(brokenChords(tokens, (i) => keyAtTok(tokens, i)).map((x) => [x.index, x.read] as const));
        for (const c of units) {
          if (c.kind !== "chunk" || !c.note || c.j !== 0 || c.index < 0 || c.pad) continue;
          const t = tokens[c.index]; if (t?.kind !== "note" || !t.pitch) continue;
          const rd = t.chord?.length ? readChord([t.pitch, ...t.chord], keyAtTok(tokens, c.index)) : broken.get(c.index) ?? null; if (!rd) continue;
          const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)), second = ds.some((dd, k) => k > 0 && Math.abs(ds[k - 1] - dd) === 1);
          // 跟着符干（v0.16.62，user 11-09「其实可以试着跟着符柄定位，只有和符头位置撞了才退避」）：字的左边对齐符干那条线；
          //   这样会压到这个和弦挂在谱下面的符头（符干朝下 = 符头在符干右边、二度挤开的那个也在右边）= 退回符头右边 + 0.3（原来的位置）。没有符干（全音符）= 符头右边
          const headR = nhX(c) + nhW(c) * (second ? 1.95 : 1), sx = stemXOf.get(c), low = ds.some((dd) => dd < BOTTOM_LINE - 1);
          const atStem = sx !== undefined && !(low && headR > sx + P(0.1));
          const label = chordLabel(rd), tx = atStem ? sx! - P(ENGRAVE.stem / 2) : headR + P(0.3), w = [...label].length * fs * 0.6 + TR("chord-tag", 0.6);
          placeBelow(RW(c), 0.3, (y) => {
            prims.push({ t: "text", x: tx, y, s: label, cls: "chord-tag", size: fs, anchor: "start" });
            chordTagsOut.push({ x: tx - TR("chord-tag", 0.3), y: y - fs * 1.05, w, h: fs * 1.4, read: rd });
          });
        }
      });
      // 歌词 = 挂件第 11 样（刀 4b）：一行歌词一条基线 = max(版式的最小值, 这一行歌词占的那些段里下天际线最低处 + 字高 + 0.5)；第二行（按节奏排挤下去的）跟着往下。
      //   歌词连字符（英文断开的音节）画在两个歌词中间；拖腔线、句号（注解）一起。歌词的墨进天际线（后面的 8vb 贴在它下面），行高另按歌词的规矩算（第 12 步之后）
      later[11].push(() => {
        if (!lyricsOf[r]) { for (const j of lyricJobs) j.run(); lyrics.push(...partLyrics); return; }   // 没写歌词的声部：空着的歌词位（点了开歌词框）+ 句号（注解），都在默认的歌词位
        const base = LYRIC_BELOW + (o.lyricRaise ?? 0), bySys = new Map<number, typeof lyricJobs>();
        for (const j of lyricJobs) { const l = bySys.get(j.sys); if (l) l.push(j); else bySys.set(j.sys, [j]); }
        for (let sy = 0; sy < nSys; sy++) lyricOff.set(lyricRow(sy), base);   // 这一行没有字也留歌词位（空着的歌词位能点）
        for (const [sy, jobs] of bySys) {
          const row = lyricRow(sy);
          const dy = placeBelow(row, 0.5, () => {
            const from = partLyrics.length;
            for (const j of jobs) j.run();
            for (let n = from; n < partLyrics.length; n++) {
              const L = partLyrics[n], tok = tokens[L.index] as NoteTok;
              if (!tok.hyph) continue;
              const R = partLyrics[n + 1], same = !!R && R.system === L.system;
              // 连字符摆在两个音节之间那道缝的正中（原来是两个中心的正中 = 贴着长的那个，user 11-09 看着像虚线）；缝放不下一个连字符 = 不画（常见打谱软件的做法）
              const pl = lyrPlan.get(`${r}:${L.index}`), pr = same ? lyrPlan.get(`${r}:${R!.index}`) : undefined;
              let xx = same ? (L.x + R!.x) / 2 : L.x + P(1.6), hf = 1;   // hf = 连字符跟着左右更窄的那个字一起压
              if (same && pl && pr) {
                hf = Math.min(pl.sx, pr.sx); const a = L.x + P(pl.hw), b = R!.x - P(pr.hw), cjk = isBlockScript(lyricShow((tokens[L.index] as NoteTok).lyric ?? "")) || isBlockScript(lyricShow((tokens[R!.index] as NoteTok).lyric ?? ""));
                if (!cjk && b - a < P(lyrHyphen * hf) - 1e-6) continue;   // 放不下一个连字符 = 不画（挤了才会）；方块字旁边的连字符挂在缝里、不占地方，照画
                xx = (a + b) / 2;
              }
              prims.push({ t: "text", x: xx, y: L.y, s: "-", cls: "lyric hyphen", ...(look.k !== 1 || ts !== 1 ? { size: P(LYRIC_EM * look.k) } : {}), sx: look.sx * hf * HYPHEN_SX });
            }
            lyrics.push(...partLyrics.slice(from));
          }, { min: 0, count: false, step: ROW_STEP });   // 歌词基线往下让也按整格（防抖）
          lyricOff.set(row, base + dy);
        }
      });
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
      const cx = (u: Unit) => P(u.x - (u.kind === "chunk" && u.inkL ? u.inkL + 0.2 : 0));   // 刀 3：临时记号挂在对齐线左边，光标画在它左边
      const firstUnitOf = new Map<number, Unit>();
      for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
      const realLen = q.realLen;
      for (let c = H; c <= realLen; c++) {   // 大谱表：两条谱表上都放落点（点哪条都是这个声部）；补齐的那段另放（下面）
        const u = c < tokens.length ? firstUnitOf.get(c) : undefined;
        const last = u ? null : [...units].reverse().find((v) => v.kind !== "head");
        const sys = u ? u.system : last ? last.system : 0, x = u ? cx(u) : last ? P(last.x + last.w) : P(sysStarts[0]);
        for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(sys, r, k), x });
      }
      // 11½. 写字头画在哪（W-17 第 1 刀，2026-10-15）：排版不认光标，只给每个 caret 位置该画的地方。老规矩（原来零宽 head 单元的 SLOT = 4）：
      //   同一 tick 上排在小节线 / 记号（句号 / 调号 / 拍号 / 速度 / 力度…）后面、音前面——光标停在行末的小节线前 = 画在下一行开头（2026-10-10 user「光标应该在每行的开头」）；
      //   那一 tick 上没有音 = 排在这一 tick 最后一个单元后面；尾巴 = 最后一个单元后面。shift = 前一个音处的谱号 / 八度线位移（同原来的 head.shift）
      const shiftAt = (c: number): number[] => { const kk = Math.min(c, realLen) - 1, si = kk >= H ? kk : -1; return Array.from({ length: q.staves }, (_, k) => shAt(q, (k + 1) as Staff, si)); };
      for (let c = H; c <= realLen; c++) {
        const u0 = c < tokens.length ? firstUnitOf.get(c) : undefined;
        let sys: number, x: number;
        if (!u0) { const last = [...units].reverse().find((v) => v.kind !== "head"); sys = last ? last.system : 0; x = last ? P(last.x + last.w) : P(sysStarts[0]); }
        else if (u0.kind === "chunk") { sys = u0.system; x = cx(u0); }
        else {
          const T = u0.tick, ch = units.find((v) => v.kind === "chunk" && v.index >= c && Math.abs(v.tick - T) < 1e-6);
          if (ch) { sys = ch.system; x = cx(ch); }
          else { const same = units.filter((v) => v.kind !== "head" && v.index >= c && Math.abs(v.tick - T) < 1e-6), lastT = same[same.length - 1] ?? u0; sys = lastT.system; x = P(lastT.x + lastT.w); }
        }
        const sh = shiftAt(c);
        for (let k = 0; k < q.staves; k++) heads.push({ caret: c, system: rowOf(sys, r, k), x, shift: sh[k] });
      }
      // 补齐的淡色小节：每个小节开头一个落点（caret = 尾巴、lead = 离尾巴多少 tick）
      for (const u of units) if (u.kind === "chunk" && u.pad && u.inBar < 1e-6 && u.tick - q.realTicks > 1e-6) { const sh = shiftAt(realLen); for (let k = 0; k < q.staves; k++) { slots.push({ caret: realLen, system: rowOf(u.system, r, k), x: P(u.x), lead: u.tick - q.realTicks }); heads.push({ caret: realLen, system: rowOf(u.system, r, k), x: P(u.x), shift: sh[k], lead: u.tick - q.realTicks }); } }
      // 行末落点：这一行最后一个东西后面 = 下一行第一个光标位置，点在这里 = 光标画在这一行末尾（caretEnd）。原来这里没有落点，点行末空白会落到最后一个音前面。
      let lastSys = -1;
      for (let c = H; c < Math.min(tokens.length, realLen + 1); c++) {
        const u = firstUnitOf.get(c); if (!u) continue;
        const crossed = lastSys >= 0 && u.system > lastSys; lastSys = u.system;
        if (!crossed) continue;
        const prevRow = cols.filter((cc) => cc.system === u.system - 1);
        if (!prevRow.length) continue;
        const x = P(Math.max(...prevRow.map((cc) => cc.x + cc.w)));
        const sh = shiftAt(c);
        for (let k = 0; k < q.staves; k++) { slots.push({ caret: c, system: rowOf(u.system - 1, r, k), x, end: true }); heads.push({ caret: c, system: rowOf(u.system - 1, r, k), x, shift: sh[k], end: true }); }
      }
    });
    // 12. 量 → 贴 → 定行距 → 挪到位（刀 4b）
    //   ① 音符层的墨进天际线（注解不算）
    for (let i = p0.p; i < prims.length; i++) {
      const p = prims[i]; if (isAnn(p)) continue;
      const row = Math.round(primY(p) / BIG); if (row < rowBase || row - rowBase >= skies.length || !skies[row - rowBase]) continue;
      const t = row * BIG; primInk(p, sp, textW, (x0, x1, y0, y1) => sky(row).ink(x0 / sp, x1 / sp, (y0 - t) / sp, (y1 - t) / sp));
    }
    //   ② 挂件按表的先后摆（第 6 样之后记一下往上到哪：播放的小节底色只盖到反复记号，不含速度 / 风格）
    const upToNav: number[] = [];
    for (let k = 0; k < later.length; k++) { for (const f of later[k]) f(); if (k === 6) skies.forEach((sk, i) => { upToNav[i] = sk.hUp; }); }
    const pEnd = mark();
    //   ③ 每一行的上下留白 = 版式的最小值和天际线（+ 0.8）取大；有歌词的那一条另按歌词的规矩（歌词基线 + 版式里歌词下面那一截，挤到第二行的再加一行）。上下两行不咬合
    const PAD = 0.8, lyricTail = SPC.rowH - STAFF_ABOVE - 4 - SPC.lyricBelow, fin = (v: number, d: number) => (Number.isFinite(v) ? v : d);
    // 防抖（user 11-09「行的上下留白按整格往上取 同意，quantize防抖」）：超出版式最小值的那一截按整格（ROW_STEP 个线间距）往上取——
    //   写音 / 加记号时墨长了一点点，这一行的高不动；跨过一格才长一格。纯排版规则（打印一样），不看编辑状态
    const stepUp = (min: number, need: number) => (need <= min + 1e-9 ? min : min + Math.ceil((need - min) / ROW_STEP - 1e-9) * ROW_STEP);
    const geo = (s: number, r: number, k: number) => {
      const q = per[r], row = rowOf(s, r, k), sk = sky(row), hUp = fin(sk.hUp, 0), hDn = fin(sk.hDn, 4);
      const minBelow = q.staves === 2 && k === 0 ? SPC.graveUpper - STAFF_ABOVE - 4 : (lyricsOf[r] ? SPC.rowH : SPC.rowHNoLyric) - STAFF_ABOVE - 4;
      const lyr = lyricsOf[r] && k === q.staves - 1 ? lyricOff.get(row) : undefined, row2 = 0;
      let need = hDn - 4 + PAD;
      if (lyr !== undefined) need = Math.max(need, lyr + lyricTail + row2);
      const below = stepUp(minBelow, need);
      return { above: stepUp(STAFF_ABOVE, -hUp + PAD), below, inkAbove: Math.max(0, -fin(upToNav[row - rowBase] ?? Infinity, 0)), inkBelow: Math.max(0, hDn - 4, lyr !== undefined ? lyr + 0.5 + row2 : 0) };
    };
    const G = Array.from({ length: nSys }, (_, s) => per.map((_q, r) => Array.from({ length: effStaves(r) }, (_, k) => geo(s, r, k))));
    const sysH = (s: number) => P(G[s].reduce((n, gs) => n + gs.reduce((m, g) => m + g.above + 4 + g.below, 0), 0) + SYS_GAP);
    drawPaperTitle(nSys ? sysH(0) : P(SPC.rowH));
    let note: Box | undefined; if (paper.hidden) { const nx = P(MARGIN) + (paper.name ? (o.measureLyric(paper.name) * 1.6) / LYRIC_EM : 0) + T(1.0); note = { x: nx, y: pTitle.y, w: Math.max(T(4), pTitle.x + pTitle.w - nx), h: T(PAPER_H) }; }   // 本段视图里的隐藏纸：说明挂在曲段名后面（字归覆盖层），不占地方——和印出来一样（v0.16.34）
    //   ④ 翻页（一行谱整块放不下就翻页）+ 每一行定位
    const delta = new Map<number, number>();   // 行号 → 从临时高度挪到位要挪多少（px）
    for (let s = 0; s < nSys; s++) {
      ensure(sysH(s));
      for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
        const top = yCur, row = rowOf(s, r, k), g = G[s][r][k], h = g.above + 4 + g.below, st = top + P(g.above);
        delta.set(row, st - row * BIG); rowTop.set(row, top); rowAbove.set(row, g.above);
        Object.assign(rows[row]!, { top, staffTop: st, bottom: top + P(h), inkTop: st - P(g.inkAbove), inkBottom: st + P(4 + g.inkBelow) });
        yCur += P(h);
      }
      yCur += P(SYS_GAP);
    }
    //   ⑤ 整行挪到位：这张纸画的图元和点击区按「在哪一行」（round(y / BIG)）挪
    const moveOf = (y: number) => delta.get(Math.round(y / BIG)) ?? 0;
    for (let i = p0.p; i < pEnd.p; i++) shiftPrim(prims[i], moveOf(primY(prims[i])));
    hitLists().forEach((l, j) => { for (let i = p0.h[j]; i < pEnd.h[j]; i++) l[i].y += moveOf(l[i].y); });
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
  return { prims, width: o.scroll ? P(sheetRight + MARGIN) : o.width, height, sp, tp: sp * ts, systems: rows, bars, notes, chordHeads, chordTags: chordTagsOut, names, sharedRows, virtual: virtualOut, measures, families, slots, heads, lyrics, marks, dyns, rests, title, clefs, arrangement, credits, parts: partsHit, papers: papersHit, keyHints, tail, creditsLine: { x: rx, y: y0, size: cs }, content: { left: P(MARGIN), right: o.width - P(MARGIN) }, pageX: { left: P(MX.l), right: P(MX.r) }, pages, shortBars, lyricYs: rows.map((_, r) => lyricY(r)), lyricY, yOf, dOf };
}

export type { Token };
