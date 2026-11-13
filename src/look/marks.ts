// src/look/marks.ts —— 记号摆在哪、单元两边留多少白（第 17 条 17-2：从 src/render/ornaments/index.ts 和 src/render/staff/units.ts 原样搬来，数一个没改）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   字形本身的宽（Bravura 量的 / 定规）留在 render（smufl.ts、staff/glyphs.ts）；这里只有「离多远、最短多长、留多少」。

/** 渐强渐弱和两头的字之间留多少（sp）；比一整行还长 = 写「cresc. - - -」（字的大概宽 / 虚线一节多长、隔多远）；渐到的虚线。原样从 staff/glyphs.ts 搬来。 */
export const PIN_GAP = 0.7;
/** 一个楔形（发夹 / 渐到）最短多长（sp）：整条短于它就拉到它；折到下一行的那一段短于它就不画。 */
export const PIN_MIN = 1.4;
export const PIN_WORD = { w: { cresc: 4.7, dim: 3.5 } } as const, DASH = { len: 0.6, gap: 1.0 } as const;
/** 渐到的虚线（统筹看样张 ⑩：原来固定 0.5 / 0.4 的小段，A5 上短的发夹碎成一串点）：段数跟着这一段发夹的长度定——每段大约 len（sp）、空隙 = 段长 × gapK，
 *  至少两段；短的发夹 = 更少、更长的段，两头都落在发夹的两端。空隙是段长的一半 = 一眼看得出是虚线（渐到），不是实线（手写的渐强渐弱）。 */
export const RAMP_DASH = { len: 1.2, gapK: 0.5, min: 2 } as const;

/** 踏板线的几何（sp；原 src/render/ornaments/index.ts，画法和规矩写在那边 layPedals 上面）：字缩多少、离上面的东西多远、字和线之间、钩多高、换踏板的尖多深、钩往里收多少。 */
export const PEDAL = { scale: 0.8, gap: 1.0, textGap: 0.3, hook: 1.1, notch: 0.45, hookIn: 0.3 } as const;

/** 行中间换谱号：小一号的谱号（谱号的 0.72）占多宽（sp）。（原 src/render/staff/units.ts） */
export const CLEF_CUE = 0.72, CLEF_CUE_W = 2.74 * CLEF_CUE + 0.9;
/** 「1=F♯」这几个字大约多宽（sp，TEMPO_EM × 0.85 的字号）：按 C 调看时中途换调那一处至少留这么宽。（原 src/render/staff/units.ts） */
export const KEY_LABEL_W = 3.5;   // v0.16.34：「1=」和速度字一样大（原来 0.85 倍、宽 3.0）

/** 五线谱各种单元在字形宽之外留的白（sp；原来写在 src/render/staff/units.ts STAFF_WIDTHS 的式子里，17-2 拆出来，数一个没改）。
 *  repeat = 反复小节线字形两边、barStyle = 段落线 / 终止线比一根小节线多宽、time = 拍号字之外、tempo = 速度那一格、acc = 有临时记号的音前面、dot = 附点、
 *  lyricHyph / lyricPlain = 按歌词排时字后面（有连字符 / 没有）、breath = 呼吸逗号、inhale = 出声的换气（逗号后面的字）。 */
export const STAFF_UNIT = { repeat: 0.8, barStyle: 0.7, time: 1.2, tempo: 0.3, acc: 1.3, dot: 0.6, lyricHyph: 1.4, lyricPlain: 0.7, breath: 0.8, inhale: { soft: 1.2, big: 2.1 } } as const;

/** 调号多宽（sp；原来写在 src/render/staff/units.ts keyWidth 和 staff/measure.ts lineStartWidth 的式子里，统筹「v0.17.22 收」第 2 条起名字，数不改）。
 *  acc = 调号里每个升降号占多宽（行首和行中换调同一个数，只定义这一次）；natural = 行中换成 C 调时每个还原号占多宽；after = 行中换调之后留多少。 */
export const KEY_SIG = { acc: 1.05, natural: 0.8, after: 1.0 } as const;
/** 五线谱行首（sp；原 src/render/staff/measure.ts lineStartWidth 式子里的数）：谱号前、谱号后、有调号时调号后、第一行拍号后、没有拍号的行首尾巴。 */
export const LINE_START = { beforeClef: 0.6, afterClef: 1.0, afterKey: 0.8, afterTime: 1.2, noTime: 0.4 } as const;
