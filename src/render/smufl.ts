// smufl.ts —— Bravura（SMuFL）码位与几个度量。created 2026-10-06 by Claude Opus 5.5
// 码位见 SMuFL 规范；度量（单位 = 五线谱间距 staff space，y 向上为正）抄自官方元数据 redist/Bravura.json（2026-10-06 下载核对），
// 元数据文件本身不进仓（vendor/fonts/bravura/README.md）。SMuFL 约定：字号 = 4 个 staff space（1 em = 4 sp）。

export const GLYPH = {
  metNoteQuarterUp: "\u{ECA5}",   // 速度记号里的四分音符（metronome mark）
  gClef: "", fClef: "\u{E062}",   // 低音谱号（2026-10-08）
  gClef8vb: "\u{E052}", gClef8va: "\u{E053}", gClef15ma: "\u{E054}", fClef8vb: "\u{E064}",   // 八度谱号（2026-10-10 v0.9.28：吉他 / 男高音 8vb、短笛 8va、钟琴 15ma、贝斯 8vb）
  ottavaAlta: "\u{E511}", ottavaBassa: "\u{E512}", quindicesimaAlta: "\u{E515}",   // 八度线开头的字：8va / 8vb / 15ma
  noteheadWhole: "", noteheadHalf: "", noteheadBlack: "",
  noteheadXWhole: "\u{E0A7}", noteheadXHalf: "\u{E0A8}", noteheadXBlack: "\u{E0A9}",   // × 符头（2026-10-08：演奏者固定敲一个键的声部；user「披露就用x」）
  augmentationDot: "",
  flag8thUp: "", flag8thDown: "", flag16thUp: "", flag16thDown: "", flag32ndUp: "", flag32ndDown: "",
  accidentalFlat: "", accidentalNatural: "", accidentalSharp: "", accidentalDoubleSharp: "", accidentalDoubleFlat: "",
  restWhole: "", restHalf: "", restQuarter: "", rest8th: "", rest16th: "", rest32nd: "",
} as const;

export const timeSigDigits = (n: number): string => [...String(n)].map((d) => String.fromCodePoint(0xe080 + Number(d))).join("");

/** 鼓谱（2026-10-10 v0.10.27，Claude Opus 5.5）：打击乐谱号 + 音乐仓鼠 v13 的符头名 → SMuFL 码位 [黑, 二分, 全] 和宽（sp = Bravura advance / 250）。
 *  码位在浏览器里渲了一遍对过形状（不盲画）：la = 方块、ti = 圆底倒三角（MuseScore 的形状音符）；custom 按 smufl 名查 PERC_SMUFL。 */
export const PERC_CLEF = "\u{E069}";   // unpitchedPercussionClef1（两竖杠）
export const PERC_HEAD: Record<string, { ch: [string, string, string]; w: [number, number, number] }> = {
  normal: { ch: ["\u{E0A4}", "\u{E0A3}", "\u{E0A2}"], w: [1.18, 1.18, 1.688] },
  x: { ch: ["\u{E0A9}", "\u{E0A8}", "\u{E0A7}"], w: [1.16, 1.34, 1.51] },
  "circle-x": { ch: ["\u{E0B3}", "\u{E0B2}", "\u{E0B1}"], w: [0.996, 1.0, 0.996] },
  slash: { ch: ["\u{E101}", "\u{E103}", "\u{E102}"], w: [2.124, 3.12, 3.92] },
  slashed1: { ch: ["\u{E0CF}", "\u{E0D1}", "\u{E0D3}"], w: [1.18, 1.168, 1.672] },
  slashed2: { ch: ["\u{E0D0}", "\u{E0D2}", "\u{E0D4}"], w: [1.18, 1.172, 1.672] },
  diamond: { ch: ["\u{E0DB}", "\u{E0D9}", "\u{E0D8}"], w: [0.98, 0.98, 1.664] },
  "triangle-up": { ch: ["\u{E0BE}", "\u{E0BC}", "\u{E0BB}"], w: [1.172, 1.14, 1.276] },
  "triangle-down": { ch: ["\u{E0C7}", "\u{E0C5}", "\u{E0C4}"], w: [1.168, 1.14, 1.276] },
  plus: { ch: ["\u{E0AF}", "\u{E0AE}", "\u{E0AD}"], w: [0.996, 1.044, 1.14] },
  la: { ch: ["\u{E0B9}", "\u{E0B8}", "\u{E0B8}"], w: [1.252, 1.252, 1.252] },
  ti: { ch: ["\u{E0CD}", "\u{E0CC}", "\u{E0CC}"], w: [1.112, 1.112, 1.112] },
};
export const PERC_SMUFL: Record<string, { ch: [string, string, string]; w: [number, number, number] }> = {
  noteheadXOrnate: { ch: ["\u{E0AA}", "\u{E0AA}", "\u{E0AA}"], w: [0.992, 0.992, 0.992] },
  noteheadSlashX: { ch: ["\u{E106}", "\u{E106}", "\u{E106}"], w: [2.124, 2.124, 2.124] },
};

/** 宽度（sp）。 */
export const W = {
  noteheadBlack: 1.18, noteheadHalf: 1.18, noteheadWhole: 1.688,
  noteheadXBlack: 1.16, noteheadXHalf: 1.34, noteheadXWhole: 1.51,   // 2026-10-08 在浏览器里用 measureText 量的 advance（400px Bravura；黑符头同法量得 1.18 = 上面那行，方法对得上）
  gClef: 2.684, fClef: 2.736, sharp: 0.996, flat: 0.904, natural: 0.672, doubleSharp: 1.0, doubleFlat: 1.644,
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
