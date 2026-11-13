// src/look/text.ts —— 谱上的字：字号、字重和歌词让路的规则（第 17 条 17-2：从 src/render/text/style.ts 和 lyric-fit.ts 原样搬来，数一个没改）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   这里只有规则的数和每种字的样式表；字体名（TEXT_FACES）、样式类怎么认（textStyleOf）、量字、让路的算法留在 src/render/text/（那边从这里 re-export，外面照旧从 render/text/index.ts 拿）。
//   小字补粗的公式（smallWeight）和它用的竖笔数跟着样式表一起搬：表是它算出来的（STEM_REGULAR 是量 Noto Sans SC 的数，test/text-style.test.ts 照旧核着）。
import type { LyricGaps } from "../render/text/index.ts";   // 只要类型（文字模块只从入口进）

/** 字体：sans = 正文的无衬线（和界面同一套）；serif = 衬线（cresc. 这类）；lyric = 歌词（日文汉字优先日本字形）；
 *  chord = 和弦标（随 app 发的那款衬线半粗子集，v0.17.36：屏幕、字宽表、PDF 轮廓同一款字；只给和弦标用）。 */
export type TextFace = "sans" | "serif" | "lyric" | "chord";
/** 尺子：staff = 跟谱（紧凑档跟着谱缩）；text = 跟字（紧凑档照舒适档那么大，刀 2）。 */
export type TextRuler = "staff" | "text";
export interface TextStyle { face: TextFace; weight: 400 | 600 | 700; italic: boolean; /** 字号（线间距的倍数）。 */ em: number; ruler: TextRuler }

const s = (face: TextFace, em: number, ruler: TextRuler, weight: 400 | 600 | 700 = 400, italic = false): TextStyle => ({ face, weight, italic, em, ruler });
/** 小字补粗（7-P，user 11-12「记得latex的上下标的处理方法」；统筹的读法：缩小画的字，笔画要和旁边的主字看起来是一家的，缩得越小补得越多）。
 *  主字的竖笔 = Noto Sans SC Regular 的「I」量出来 0.092 字号（test/text-style.test.ts 拿 vendor 里那款字核着）；目标 = 主字竖笔 × 0.9；
 *  缩成主字的 k 倍之后，在常规 / 半粗里挑竖笔最接近目标的。半粗在 PDF 里 = 描边 BOLD_STROKE 字号（src/export/pdf.ts 同一个数，测试核着），屏幕 = CSS 600。 */
export const STEM_REGULAR = 0.092, BOLD_STROKE = 0.035, SMALL_STEM_K = 0.9;
export function smallWeight(k: number): 400 | 600 {
  const target = SMALL_STEM_K * STEM_REGULAR, reg = k * STEM_REGULAR, bold = k * (STEM_REGULAR + BOLD_STROKE);
  return Math.abs(bold - target) < Math.abs(reg - target) ? 600 : 400;
}
/** 数字行的主字字号（jp-digit）：小字的 k = 它的字号 ÷ 这个。 */
const JP_MAIN_EM = 2.5;
/** 和弦标里的升降号和旁边的字之间看得见的缝（墨到墨，字号的倍数；v0.17.34，统筹 134f74e4「升降号贴着它所属的字」）：
 *  tight = 贴着它所属的那个字（B♭ 的 B、♭VII 的 V）——比这款衬线半粗字和字之间看得见的缝的中位 0.06 小一点；loose = 另一边（B♭ 和后面的 7），比字距大，读成「B♭ 7」不是「B ♭7」。
 *  数是 AI 照量出来的字距起的（施工 Claude Opus 5.5），好不好看归 user 看图。 */
export const CHORD_ACC_GAP = { tight: 0.05, loose: 0.1 } as const;
/** 和弦标里的升降号比谱头「1=♭B」那一套的升降号大多少（v0.17.36；user 看了两档的放大图「可以用大一点的」= 1.2 倍）。只管和弦标，谱头那一套不动。 */
export const CHORD_ACC_SCALE = 1.2;
/** 速度那一串的字号（线间距）；「1=X」、和弦级数、风格记号和它一样大。 */
export const TEMPO_EM = 1.35;
/** 歌词的字号（线间距；跟谱）。 */
export const LYRIC_EM = 1.6;

/** 歌词在两档里长什么样（v0.16.44；user 11-09「字号可以稍微大一点，窄窄的字好看」→ 紧凑档挑了 B；「舒适版和紧凑版都有一个固定的字高，然后这个字高就永远不要动了。如果挤不下的话，是收宽度，不是收字高」）：
 *  k = 字号是歌词基准字号（LYRIC_EM，跟谱）的几倍——字高就这么定、永远不动；sx = 平常的宽度（1 = 不压）。挤了只往下收宽度，最窄 LYRIC_MIN_SX。
 *  gapFloor = 挤到底时词和词之间至少留多宽（线间距；v0.16.48 起 0.2，AI 定的数——v0.16.70 起按档各给一个；user 11-09 看了 0.2 / 0.35 / 0.5 的样张：「0.2看着舒服」，两档都 0.2；计划书 ai-docs/20261109-plan-text-engine.md 第 5 步）。*/
export const LYRIC_LOOK = { cozy: { k: 1, sx: 1, gapFloor: 0.2 }, compact: { k: 1.15, sx: 0.85, gapFloor: 0.2 } } as const;
/** 挤的时候歌词最窄压到原宽的几成（乘在 LYRIC_LOOK.sx 上）；再挤 = 照写、画灰。 */
export const LYRIC_MIN_SX = 0.5;

/** 谱上每一种字（键 = 样式类）。改字的样子只改这里。 */
export const TEXT_STYLES = {
  "song-title": s("sans", 2.8, "text", 600),
  credits: s("sans", 1.25, "text"),
  arr: s("sans", 1.25, "text"), "arr-label": s("sans", 1.25, "text"), "arr-issue": s("sans", 1.1, "text", 400, true),
  "paper-name": s("sans", 1.6, "text", 600),
  "part-name": s("sans", LYRIC_EM * 0.85, "text", 600), "part-badge": s("sans", 1.0, "text", 600),
  // 谱上的记号字（速度、1=X、风格、和弦级数、反复的字、小节号）跟谱（v0.16.48；user 11-09「M F 它跟着走没问题，关键是它这个速度的那一串字号，是不是也应该跟着走？…速度啊，音高啊，那一串」）；歌名 / 曲段名 / 歌手名这些标签照旧跟字
  "tempo-word": s("sans", TEMPO_EM, "staff", 600), "tempo-num": s("sans", TEMPO_EM, "staff"), "tempo-change": s("sans", TEMPO_EM, "staff", 700),
  "key-label": s("sans", TEMPO_EM, "staff"),
  /** 专业模式 C 调的淡「1=C」（覆盖层写、不印）：和「1=F」一样跟谱。 */
  "key-hint": s("sans", TEMPO_EM, "staff"),
  "groove-mark": s("sans", TEMPO_EM, "staff", 600, true),
  "chord-tag": s("chord", TEMPO_EM, "staff", 600),
  "nav-word": s("sans", TEMPO_EM * 1.05, "staff", 600, true), "nav-mark": s("sans", TEMPO_EM * 1.05, "staff", 600),   // 反复的字（房子「1.」、×3、D.C.…）：屏幕一直是粗的，PDF 原来印细的——统一成粗的
  "bar-no": s("sans", 1.05, "staff"), "page-no": s("sans", 1.2, "text"),
  lyric: s("lyric", LYRIC_EM, "staff"),
  ottava: s("sans", 1.3, "staff"), "breath-label": s("sans", 1.15, "staff"),
  "dyn-word": s("serif", 2.0, "staff", 400, true), "dyn-implied": s("sans", 1.3, "staff", 600, true),
  // 简谱数字行（谱面分家第四刀；字号在图元上、宽高查 render/jianpu/glyphs.ts，不现场量）：数字一律不分粗细（UX 稿第 5 节）；谱头「1=C 4/4」和中途换调的字
  "jp-digit": s("sans", 2.5, "staff"), "jp-acc": s("sans", 1.3, "staff"), "jp-letter-sup": s("sans", 1.75, "staff", smallWeight(1.75 / JP_MAIN_EM)), "jp-letter-sub": s("sans", 1.75, "staff", smallWeight(1.75 / JP_MAIN_EM)),   // 字母谱的角标（7-L）：半粗，学小字号专用字形的思路——缩小了笔画不跟着变细；字号在图元上（字母的 SCRIPT_K 倍） "jp-head": s("sans", TEMPO_EM, "staff"),   // 谱头「1=C 3/4」：常规粗细（第五刀起照样张；字号在图元上 = 0.773 个数字字号）
  // 叠着的和弦折成的和弦名（第五刀 5-4）：窄字 = 正文字体横向压（图元的 sx），宽查 render/jianpu/glyphs.ts
  // 数字行连音的小数字（8-3；7-P 小字补粗：字号 1.1 = 主字的 0.44 倍 → 算出来的粗细）
  "jp-tuplet": s("sans", 1.1, "staff", smallWeight(1.1 / JP_MAIN_EM)),
  // 简谱数字行上的力度（pp…ff、sfz、fp）：和数字同一款字、常规粗细、斜体，约数字的 0.8（user 11-11「主要是我们简谱字比较细，你用粗体就怎么都会抢吧」）
  "jp-dyn": s("sans", 2.0, "staff", 400, true),
  // 简谱整套鼓的图例（5-6，统筹裁定）：行首名字下面「● 大鼓 / 小鼓」，正文字体小一号、跟字的尺子（同名字）
  "jp-legend": s("sans", 1.05, "text"),
} satisfies Record<string, TextStyle>;
export type TextRole = keyof typeof TEXT_STYLES;
/** 幽灵音（演奏法）的数字画小一号：几成（同 render/jianpu/glyphs.ts GHOST_K，测试核着）。 */
export const GHOST_DIGIT_K = 0.62;

/** 没量的时候的默认（测试 / 没有量字的宿主）：歌词字号 1.6 sp 的系统无衬线体，空格约 0.27 字宽、连字符约 0.33 字宽。 */
export const LYRIC_SPACE = 0.6, HYPHEN_SX = 0.8, GAP_MIN = 0.5;
/** 缝再挤也至少留这么宽（sp）：能看出是两个词（user「只要能勉强看出节奏就行了」；v0.16.48 第一版没有底线 = 英文连成一片「bovetheworld」）。排版器按档传（LyricGaps.floor ← LYRIC_LOOK.gapFloor）；这个是没给时的默认。 */
export const GAP_FLOOR = 0.2;
export const DEFAULT_GAPS: LyricGaps = { space: 0.27 * 1.6 * LYRIC_SPACE, hyphen: 0.33 * 1.6 * HYPHEN_SX + 0.27 * 1.6 * LYRIC_SPACE };
