// smufl.ts —— Bravura（SMuFL）码位与几个度量。created 2026-10-06 by Claude Opus 5.5
// 码位见 SMuFL 规范；度量（单位 = 五线谱间距 staff space，y 向上为正）抄自官方元数据 redist/Bravura.json（2026-10-06 下载核对），
// 元数据文件本身不进仓（vendor/fonts/bravura/README.md）。SMuFL 约定：字号 = 4 个 staff space（1 em = 4 sp）。

export const GLYPH = {
  metNoteQuarterUp: "\u{ECA5}",   // 速度记号里的四分音符（metronome mark）
  gClef: "",
  noteheadWhole: "", noteheadHalf: "", noteheadBlack: "",
  augmentationDot: "",
  flag8thUp: "", flag8thDown: "", flag16thUp: "", flag16thDown: "", flag32ndUp: "", flag32ndDown: "",
  accidentalFlat: "", accidentalNatural: "", accidentalSharp: "", accidentalDoubleSharp: "", accidentalDoubleFlat: "",
  restWhole: "", restHalf: "", restQuarter: "", rest8th: "", rest16th: "", rest32nd: "",
} as const;

export const timeSigDigits = (n: number): string => [...String(n)].map((d) => String.fromCodePoint(0xe080 + Number(d))).join("");

/** 宽度（sp）。 */
export const W = {
  noteheadBlack: 1.18, noteheadHalf: 1.18, noteheadWhole: 1.688,
  gClef: 2.684, sharp: 0.996, flat: 0.904, natural: 0.672, doubleSharp: 1.0, doubleFlat: 1.644,
  dot: 0.4, timeSigDigit: 1.8,
  restWhole: 1.128, restHalf: 1.128, restQuarter: 1.08, rest8th: 0.988, rest16th: 1.28, rest32nd: 1.452,
} as const;

/** engravingDefaults（sp）。 */
export const ENGRAVE = {
  staffLine: 0.13, stem: 0.12, ledger: 0.16, ledgerExt: 0.4, beam: 0.5, beamGap: 0.25, thinBar: 0.16, tieMid: 0.22,
} as const;

/** 符干接点（符头原点为 0,0）：上符干接右边 y=+0.168；下符干接左边 y=-0.168（黑 / 白符头相同）。 */
export const STEM_UP_SE: [number, number] = [1.18, 0.168];
export const STEM_DOWN_NW: [number, number] = [0, -0.168];
/** 符尾接点（符尾原点为 0,0）：上符尾 stemUpNW，下符尾 stemDownSW。 */
export const FLAG_ANCHOR_UP: Record<number, number> = { 1: -0.04, 2: -0.088, 3: 0.376 };
export const FLAG_ANCHOR_DOWN: Record<number, number> = { 1: 0.132, 2: 0.128, 3: -0.448 };
