// degree.ts —— 音级读法（设计稿第 3.8 节）：音 + 调 → 第几级、升降、几个八度点；反过来也行。简谱的画法和剪贴板的简谱文字共用这一份。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀：从 src/score/clipboard.ts 原样搬出 toDegree / fromDegree，加八度基准）。
//   调 = 调号的升降数（fifths）；1 = 这个调号的大调主音（小调写「6=」那一套：首调、按调号读，和键盘自己的调式梯子不是一回事——键盘上的大字见 src/app/pad-music.ts）。
//   八度：shift = 相对「主音在第 4 个八度」那一组（中央 C 附近）往上 / 往下几组；简谱画几个点 = shift − 八度基准。
import { type Pitch, STEPS, type Step, diatonicIndex, tonicStepIndex, keyAlter, spellMidi } from "./pitch.ts";

/** 音 → 相对 fifths 这个调的简谱：音级 1–7、八度偏移（主音在第 4 个八度那一组 = 0）、相对调内音的升降。 */
export function toDegree(p: Pitch, fifths: number): { degree: number; shift: number; acc: number } {
  const tonicD = 4 * 7 + tonicStepIndex(fifths), d = diatonicIndex(p) - tonicD;
  return { degree: ((d % 7) + 7) % 7 + 1, shift: Math.floor(d / 7), acc: p.alter - keyAlter(p.step, fifths) };
}
/** 简谱 → 音（相对 fifths）。 */
export function fromDegree(degree: number, shift: number, acc: number, fifths: number): Pitch {
  const n = tonicStepIndex(fifths) + degree - 1, s = n % 7, step = STEPS[s] as Step;
  return { step, alter: keyAlter(step, fifths) + acc, octave: 4 + Math.floor(n / 7) + shift };
}
/** 八度基准按乐器音域（UX 稿第 3 节「按乐器音域自动定」；第五刀 5-4）：音域两头（MIDI，宿主从乐器目录 / 演奏者查好）在这个调里的八度偏移取中间（一样近取离 0 近的）。
 *  音域里的音上下最多一个点、宽的乐器偶尔两个。 */
export function rangeBase(lo: number, hi: number, fifths: number): number {
  const a = toDegree(spellMidi(lo, fifths), fifths).shift, b = toDegree(spellMidi(hi, fifths), fifths).shift, m = (a + b) / 2;
  return Number.isInteger(m) ? m : Math.abs(Math.floor(m)) <= Math.abs(Math.ceil(m)) ? Math.floor(m) : Math.ceil(m);
}
/** 八度基准「点最少」（UX 稿第 3 节的退路；按乐器音域定 = 第五刀）：一串音的八度偏移 → 让点的总数最少的那个基准（中位数；一样少取离 0 近的）。没有音 = 0。 */
export function fewestDotsBase(shifts: readonly number[]): number {
  if (!shifts.length) return 0;
  const s = [...shifts].sort((a, b) => a - b), lo = s[(s.length - 1) >> 1]!, hi = s[s.length >> 1]!;   // 中位数那一段里任何一个整数点的总数都一样少
  return lo <= 0 && hi >= 0 ? 0 : Math.abs(lo) <= Math.abs(hi) ? lo : hi;
}
