// keytext.ts —— 数字行写的调「1=C₄」「1=♭B₃」「6=A₃」（7-Q，user 2026-11-12 凌晨「这里也许不应该用点而是C4之类的？」；并进第八刀的行首那一步）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。取代第五刀「八度基准画成『1=』那个字母上下的点」：基准怎么算不变（draw.ts），只改怎么写——
//   字母后面右下角一个八度数字，意思是不带点的 1（小调写「6=」= 不带点的 6）是哪个音；字形同字母谱（大字母 + 右下角小数字，粗细照 7-P），升降号在字母前面（简谱老写法）、用 Bravura（同 7-P）。
//   数字跟着这首歌「中央 C 叫 C 几」（middleC）走，和字母谱一致。谱头那一行、中途换调写的字都用这一份；宽从字形表算（不现场量；量的时候也用得上）。
import type { Prim } from "../engrave.ts";
import { keyText } from "../../score/pitch.ts";
import { fromDegree } from "../../score/degree.ts";
import { DIGIT_EM, DIGIT_H, SCRIPT_K, SCRIPT_GAP, SUB_DY, ACC_GLYPH_EM, ACC_RISE, accGlyphsOfText, accRunW, headTextW } from "./glyphs.ts";

/** 写一个调要的几样：「1=」/「6=」、字母前面的升降号（♭ / ♯ 的字）、字母、右下角的八度数字（没有基准 = 空）。 */
export interface KeyParts { pre: string; acc: string; letter: string; oct: string }
/** fifths / minor = 调号；base = 这条轨的八度基准（toDegree 的 shift）；middleC = 中央 C 叫 C 几。base = null = 不写八度（字母谱、鼓：调号本来就不印）。 */
export function keyParts(fifths: number, minor: boolean, base: number | null, middleC: number): KeyParts {
  const m = /^([16]=)([A-G])([♭♯]?)$/.exec(keyText(fifths, minor));
  const pre = m?.[1] ?? (minor ? "6=" : "1="), letter = m?.[2] ?? "?", acc = m?.[3] ?? "";
  const oct = base === null ? "" : String(fromDegree(minor ? 6 : 1, base, 0, fifths).octave - 4 + middleC);
  return { pre, acc, letter, oct };
}
/** 一个字的大小（数字行的单位，或 px）下：「1=」、升降号、字母、角标各占多宽、从哪起（相对写的起点）；一共多宽。 */
export function keyLayout(k: KeyParts, size: number): { xAcc: number; xLetter: number; xOct: number; w: number; accEm: number } {
  const f = size / DIGIT_EM, accEm = ACC_GLYPH_EM * f, gs = accGlyphsOfText(k.acc), gap = 0.05 * size;
  const xAcc = headTextW(k.pre, size) + (k.acc ? gap : 0), xLetter = xAcc + (k.acc ? accRunW(gs, accEm) + gap : 0);
  const xOct = xLetter + headTextW(k.letter, size) + (k.oct ? SCRIPT_GAP * f : 0);
  return { xAcc, xLetter, xOct, w: xOct + (k.oct ? headTextW(k.oct, size * SCRIPT_K) : 0), accEm };
}
/** 画：写在 (x, y)（y = 基线）、字号 size（px）；cls = 正文那几个字的字样（谱头 jp-head / 中途 jp-head jp-mid）。回图元和一共多宽。 */
export function keyPrims(k: KeyParts, x: number, y: number, size: number, cls: string, T: { tok?: number }): { prims: Prim[]; w: number } {
  const L = keyLayout(k, size), f = size / DIGIT_EM, prims: Prim[] = [];
  prims.push({ ...T, t: "text", x, y, s: k.pre, cls, size, anchor: "start" });
  if (k.acc) {   // 升降号（Bravura，同 7-P）：顶比字母顶高一点
    const gs = accGlyphsOfText(k.acc); let gx = x + L.xAcc; const top = y - DIGIT_H * f - ACC_RISE * f;
    for (const g of gs) { prims.push({ ...T, t: "glyph", x: gx - (g.box[0] * L.accEm) / 4, y: top - (g.box[2] * L.accEm) / 4, ch: g.ch, cls: "jp-acc jp-key-acc", size: L.accEm }); gx += ((g.box[1] - g.box[0]) * L.accEm) / 4 + 0.08 * f; }
  }
  prims.push({ ...T, t: "text", x: x + L.xLetter, y, s: k.letter, cls, size, anchor: "start" });
  if (k.oct) prims.push({ ...T, t: "text", x: x + L.xOct, y: y + SUB_DY * f, s: k.oct, cls: `${cls} jp-letter-sub jp-key-oct`, size: size * SCRIPT_K, anchor: "start" });
  return { prims, w: L.w };
}
