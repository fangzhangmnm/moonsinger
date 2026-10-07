// pitch.ts —— 带拼写的绝对音高（同 MusicXML：step + alter + octave）与调号换算。created 2026-10-06 by Claude Opus 5.5
// grill 账本 §7–§8：数据存「不需要解释的东西」= 带拼写的绝对音高 + 调号；「第几级」是解读，归输入 / 显示层从调号推。
// 输入规则（账本 Q5 / 方向语义）：不按修饰键 = 就近（离上一个音最近、不超过四度，按五线谱的级数算）；
// 往上 = 从上一个音出发往上第一个这个音；往下 = 往下第一个。第一个音以她的「家」为参照。

export const STEPS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Step = (typeof STEPS)[number];
const STEP_SEMI = [0, 2, 4, 5, 7, 9, 11];

/** 带拼写的绝对音高。alter：-2..2（重降..重升）；octave：科学音高记号（中央 C = C4）。 */
export interface Pitch { step: Step; alter: number; octave: number }

export type Dir = "near" | "up" | "down";

/** 月读说话音高中位 ≈ 295 Hz ≈ D4（Lab 实测，README「月读说话的音高」）——没有上一个音时的参照。 */
export const HOME: Pitch = { step: "D", alter: 0, octave: 4 };

export const stepIndex = (s: Step): number => STEPS.indexOf(s);

/** MIDI 号（中央 C = 60）。 */
export function midiOf(p: Pitch): number { return (p.octave + 1) * 12 + STEP_SEMI[stepIndex(p.step)] + p.alter; }

/** 五线谱上的位置（每级 +1，C4 = 28）：比较「就近」和画谱都用它。 */
export function diatonicIndex(p: Pitch): number { return p.octave * 7 + stepIndex(p.step); }

const SHARP_ORDER: Step[] = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER: Step[] = ["B", "E", "A", "D", "G", "C", "F"];

/** 调号（fifths：-7..7，同 MusicXML <key><fifths>）给这个音级的默认升降。 */
export function keyAlter(step: Step, fifths: number): number {
  if (fifths > 0) return SHARP_ORDER.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
}

/** 调号里「1」的音级（大调主音；小调主音是 6，账本 §7「6 当主音」）。每升一个五度往上走 4 级。 */
export function tonicStepIndex(fifths: number): number { return (((4 * fifths) % 7) + 7) % 7; }

/** 从五线谱位置 + 调号造一个音（升降照调号）。 */
export function fromDiatonic(d: number, fifths: number): Pitch {
  const octave = Math.floor(d / 7), step = STEPS[((d % 7) + 7) % 7];
  return { step, alter: keyAlter(step, fifths), octave };
}

/** 调里第几级（1–7）→ 五线谱上的音级下标。 */
export function degreeStepIndex(degree: number, fifths: number): number { return (tonicStepIndex(fifths) + degree - 1) % 7; }

/** 把「第几级」放到具体的八度：就近 / 往上 / 往下（参照 = 上一个有音高的音，没有就是 HOME）。 */
export function placeDegree(degree: number, fifths: number, prev: Pitch | null, dir: Dir): Pitch {
  const s = degreeStepIndex(degree, fifths);
  const ref = diatonicIndex(prev ?? HOME);
  const base = Math.floor(ref / 7) * 7 + s;          // ref 同一个八度里的这个音级
  const cands = [base - 7, base, base + 7];
  let d: number;
  if (dir === "near") d = cands.reduce((a, b) => (Math.abs(b - ref) < Math.abs(a - ref) ? b : a));
  else if (dir === "up") d = cands.find((c) => c > ref)!;
  else d = [...cands].reverse().find((c) => c < ref)!;
  return fromDiatonic(d, fifths);
}

/** 上下挪一级（↑↓）：升降回到调号默认。 */
export function stepBy(p: Pitch, steps: number, fifths: number): Pitch { return fromDiatonic(diatonicIndex(p) + steps, fifths); }

/** 挪半音（Shift+↑↓）：音级不动，只改升降，夹在 -2..2。 */
export function alterBy(p: Pitch, d: number): Pitch { return { ...p, alter: Math.max(-2, Math.min(2, p.alter + d)) }; }

/** 挪八度（Alt+↑↓）。 */
export function octaveBy(p: Pitch, d: number): Pitch { return { ...p, octave: p.octave + d }; }

export function pitchName(p: Pitch): string { return `${p.step}${p.alter > 0 ? "#".repeat(p.alter) : "b".repeat(-p.alter)}${p.octave}`; }

export const samePitch = (a: Pitch | null, b: Pitch | null): boolean =>
  !!a && !!b && a.step === b.step && a.alter === b.alter && a.octave === b.octave;
