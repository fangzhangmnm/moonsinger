// note-values.ts —— 长短旋钮的档（乐理住 app 这一侧；键盘本体不懂这些）+ 一个长度的图 / 名字 / 文件里的时值名（这三样换算只住这一处）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。设计 = ai-docs/20261113-keyboard-round-design.md 第三节「带附点的档」/ 8.1
//   （user 2026-11-13 夜「3/4、6/8 下带附点的 没问题，不过记得medo不懂乐理哦，深模块窄接口分工做好」「键盘应该不知道乐理，乐理用app提供，它不知道附点 是什么。顶多知道时值」）。
//   规矩（一条）：长短旋钮上摆的，是这个拍号里一小节以内、用得上的时值——
//     从六档（三十二分…全音符）出发；比一小节长的不摆；一拍是三个小的那种拍子（6/8、9/8、12/8、6/4）里，长过一拍、又不是整拍数的不摆；
//     加上带附点的：这种拍子的一拍；一小节正好是一个带附点的音符时加上它；12/8 再加半小节。
//   这个文件只看数（tick），顶层不拿 song.ts 的常数算东西（song.ts 也 import 这里：两边只在函数里用对方，不怕先后）。
import { _t } from "../i18n/index.ts";
import { TPQ, WHOLE } from "./song.ts";

/** 六种不带附点的音符，短 → 长：文件里的时值名（MusicXML 音符类型名）、占全音符的几分之一（分母）、SMuFL 符干朝上的字形、人话名。 */
const PLAIN = [
  { name: "32nd", den: 32, glyph: "", label: () => _t("三十二分") },
  { name: "16th", den: 16, glyph: "", label: () => _t("十六分") },
  { name: "eighth", den: 8, glyph: "", label: () => _t("八分") },
  { name: "quarter", den: 4, glyph: "", label: () => _t("四分") },
  { name: "half", den: 2, glyph: "", label: () => _t("二分") },
  { name: "whole", den: 1, glyph: "", label: () => _t("全音符") },
] as const;
/** 附点（SMuFL augmentationDot）。 */
const DOT_GLYPH = "";
const DOTTED = "dotted-";
const plainLen = (k: number): number => WHOLE / PLAIN[k].den;

/** 一个长度是哪种音符：base = 六种里的第几种（短 → 长）、dotted = 带不带附点。不是这十二种之一 = null（连音、拼起来的长度）。 */
export function lenShape(len: number): { base: number; dotted: boolean } | null {
  for (let k = 0; k < PLAIN.length; k++) {
    if (plainLen(k) === len) return { base: k, dotted: false };
    if (plainLen(k) * 1.5 === len) return { base: k, dotted: true };
  }
  return null;
}
/** 文件里的时值名（view.pad.unit）：六个音符名，或者前面带 dotted-。没有名字 = null（存的时候这一项不写，不猜一个近的）。 */
export function lenName(len: number): string | null {
  const s = lenShape(len); return s ? (s.dotted ? DOTTED : "") + PLAIN[s.base].name : null;
}
/** 反过来：时值名 → 长度；不认识 = null（读的时候那一项用默认）。 */
export function lenOfName(name: unknown): number | null {
  if (typeof name !== "string") return null;
  const dotted = name.startsWith(DOTTED), k = PLAIN.findIndex((p) => p.name === (dotted ? name.slice(DOTTED.length) : name));
  return k < 0 ? null : plainLen(k) * (dotted ? 1.5 : 1);
}
/** 文件里能写的所有时值名（六个 + 六个带附点的）。 */
export const LEN_NAMES: readonly string[] = [...PLAIN.map((p) => p.name), ...PLAIN.map((p) => DOTTED + p.name)];
/** 键面上的图：SMuFL 音符（符干朝上），带附点 = 后面一个附点。不是这十二种之一 = 空串。 */
export function lenGlyph(len: number): string {
  const s = lenShape(len); return s ? PLAIN[s.base].glyph + (s.dotted ? DOT_GLYPH : "") : "";
}
/** 人话名：「四分」「附点四分」。不是这十二种之一 = 按四分音符的几分之几说。 */
export function lenLabel(len: number): string {
  const s = lenShape(len);
  if (!s) return _t("{n} 个四分", { n: +(len / TPQ).toFixed(3) });
  return s.dotted ? _t("附点{name}", { name: PLAIN[s.base].label() }) : PLAIN[s.base].label();
}

/** 这个拍号里长短旋钮上的档（短 → 长，长度 tick）。算法 = 文件头那条规矩。 */
export function lenSteps(beats: number, beatType: number): number[] {
  const bar = (beats * WHOLE) / beatType, compound = beats % 3 === 0 && beats >= 6, beat = compound ? (3 * WHOLE) / beatType : WHOLE / beatType;
  const out = new Set<number>();
  for (let k = 0; k < PLAIN.length; k++) {
    const L = plainLen(k);
    if (L > bar) continue;                                   // 比一小节长的不摆
    if (compound && L > beat && L % beat !== 0) continue;     // 复合拍子：长过一拍、又不是整拍数的不摆
    out.add(L);
  }
  if (compound && lenShape(beat)) out.add(beat);              // 这种拍子的一拍（附点；6/1 这种一拍没有名字的不摆）
  const barShape = lenShape(bar); if (barShape?.dotted) out.add(bar);   // 一小节正好是一个带附点的音符
  if (compound && beats === 12 && lenShape(bar / 2)) out.add(bar / 2);   // 12/8 再加半小节
  if (!out.size) out.add(plainLen(0));                        // 一小节比三十二分还短（拍号写得怪）：至少留最短的一档
  return [...out].sort((a, b) => a - b);
}
/** 旋钮上实际摆的：这个拍号的档；正选着的长度不在表上 = 按长短插进去（软件不替人换档，旋钮照实显示它）。 */
export function lenChoices(steps: readonly number[], cur: number): number[] {
  return steps.includes(cur) ? steps.slice() : [...steps, cur].sort((a, b) => a - b);
}
/** 沿这个拍号的表走一档（dir = −1 短 / +1 长）：不在表上的长度 = 往那个方向找最近的一档；到头 = null。 */
export function stepLen(steps: readonly number[], cur: number, dir: -1 | 1): number | null {
  if (dir < 0) { for (let i = steps.length - 1; i >= 0; i--) if (steps[i] < cur) return steps[i]; return null; }
  for (const s of steps) if (s > cur) return s;
  return null;
}
/** 「/2」减半之后多长：长度的一半；不到三十二分（或不是整数 tick）= null（减不了，和原来一样）。 */
export function halfLen(len: number): number | null {
  const h = len / 2; return Number.isInteger(h) && h >= plainLen(0) ? h : null;
}
