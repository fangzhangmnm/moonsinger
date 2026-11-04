// scales.ts —— pad 的调式（音阶）：pad 上排哪些音。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「1=F能不能也做成两个的滚轮，右边可以换调性。多放几种。五声民族之类的全一点」。
// · 一个调式 = 一组简谱音级（相对「1=」，可带升降）+ 主音是哪一级。「1=」照旧是调号（do 在哪）：
//   小调 / 羽调式这些以 6 为主音（la 为主音的小调，和简谱习惯一样：1=C 的小调 = a 小调），调号不变。
// · 只管 pad 的音键；电脑键盘的 1–7 照旧能打任何音级。写进谱的音按 pad 的调拼写（带升降的音级 = 临时记号）。
// · 不是十二平均律的音阶（印尼 pelog / slendro 等）这一版放不进来：谱和月读都只认十二个半音。

import { _t } from "../i18n/index.ts";
import { type Pitch, fromDiatonic, alterBy, midiOf } from "./pitch.ts";

export interface ScaleDeg { deg: number; alt: number }   // 简谱音级 1–7 + 升降（♯ = +1）
export interface Scale { id: string; name: string; group: string; degs: ScaleDeg[]; home: number }   // home = 主音在 degs 里的下标

const d = (s: string): ScaleDeg[] => s.split(" ").map((t) => ({ deg: Number(t.replace(/[#b]/g, "")), alt: t.startsWith("#") ? 1 : t.startsWith("b") ? -1 : 0 }));
const mk = (id: string, name: string, group: string, degs: string, homeDeg: string): Scale => {
  const ds = d(degs), h = d(homeDeg)[0];
  return { id, name, group, degs: ds, home: ds.findIndex((x) => x.deg === h.deg && x.alt === h.alt) };
};

/** 滚轮里的顺序 = 这个数组的顺序（常用的在前）。 */
export const SCALES: Scale[] = [
  mk("major", _t("大调"), _t("大小调"), "1 2 3 4 5 6 7", "1"),
  mk("minor", _t("小调"), _t("大小调"), "1 2 3 4 5 6 7", "6"),
  mk("harmonic-minor", _t("和声小调"), _t("大小调"), "1 2 3 4 #5 6 7", "6"),
  mk("melodic-minor", _t("旋律小调"), _t("大小调"), "1 2 3 #4 #5 6 7", "6"),
  mk("gong", _t("宫调式"), _t("五声"), "1 2 3 5 6", "1"),
  mk("shang", _t("商调式"), _t("五声"), "1 2 3 5 6", "2"),
  mk("jue", _t("角调式"), _t("五声"), "1 2 3 5 6", "3"),
  mk("zhi", _t("徵调式"), _t("五声"), "1 2 3 5 6", "5"),
  mk("yu", _t("羽调式"), _t("五声"), "1 2 3 5 6", "6"),
  mk("qingjue", _t("六声加清角"), _t("民族"), "1 2 3 4 5 6", "1"),
  mk("biangong", _t("六声加变宫"), _t("民族"), "1 2 3 5 6 7", "1"),
  mk("yayue", _t("雅乐"), _t("民族"), "1 2 3 #4 5 6 7", "1"),
  mk("yanyue", _t("燕乐"), _t("民族"), "1 2 3 4 5 6 b7", "1"),
  mk("miyakobushi", _t("都节"), _t("日本"), "1 3 4 6 7", "3"),
  mk("ryukyu", _t("琉球"), _t("日本"), "1 3 4 5 7", "1"),
  mk("blues", _t("布鲁斯"), _t("其他"), "1 b3 4 b5 5 b7", "1"),
  mk("dorian", _t("多利亚"), _t("教会调式"), "1 2 3 4 5 6 7", "2"),
  mk("phrygian", _t("弗里几亚"), _t("教会调式"), "1 2 3 4 5 6 7", "3"),
  mk("lydian", _t("利底亚"), _t("教会调式"), "1 2 3 4 5 6 7", "4"),
  mk("mixolydian", _t("混合利底亚"), _t("教会调式"), "1 2 3 4 5 6 7", "5"),
  mk("locrian", _t("洛克利亚"), _t("教会调式"), "1 2 3 4 5 6 7", "7"),
  mk("spanish", _t("西班牙"), _t("其他"), "1 2 3 4 #5 6 7", "3"),
  mk("double-harmonic", _t("阿拉伯"), _t("其他"), "1 b2 3 4 5 b6 7", "1"),
  mk("hungarian-minor", _t("匈牙利小调"), _t("其他"), "1 #2 3 4 #5 6 7", "6"),
  mk("whole-tone", _t("全音阶"), _t("其他"), "1 2 3 #4 #5 #6", "1"),
  mk("chromatic", _t("半音阶"), _t("其他"), "1 #1 2 #2 3 4 #4 5 #5 6 #6 7", "1"),
];
export const DEFAULT_SCALE = "major";
export const scaleById = (id: string): Scale => SCALES.find((s) => s.id === id) ?? SCALES[0];

/** pad 上第 k 个音（k 可以是负数）：k = 0 是 do（「1=」那个音，do 所在的八度由 tonicD 定）那一级，往上一个调式音一格。
 *  tonicD = do 的五线谱位置（diatonicIndex），fifths = 「1=」的调号。 */
export function ladderAt(sc: Scale, k: number, tonicD: number, fifths: number): { pitch: Pitch; deg: ScaleDeg; oct: number } {
  const n = sc.degs.length, oct = Math.floor(k / n), deg = sc.degs[k - oct * n];
  const pitch = alterBy(fromDiatonic(tonicD + deg.deg - 1 + 7 * oct, fifths), deg.alt);
  return { pitch, deg, oct };
}
/** 第一个音高 ≥ midi 的那一级（绝对排法：每行从 C 起）。 */
export function ladderFirstAtOrAbove(sc: Scale, midi: number, tonicD: number, fifths: number): number {
  let k = Math.floor(((midi - midiOf(ladderAt(sc, 0, tonicD, fifths).pitch)) / 12) * sc.degs.length) - sc.degs.length;
  while (midiOf(ladderAt(sc, k, tonicD, fifths).pitch) < midi) k++;
  return k;
}
/** 主音离 do 最近的那一级（首调排法：从主音起）。 */
export function ladderHome(sc: Scale, tonicD: number, fifths: number): number {
  const n = sc.degs.length, m0 = midiOf(ladderAt(sc, 0, tonicD, fifths).pitch);
  const up = sc.home, down = sc.home - n;
  return Math.abs(midiOf(ladderAt(sc, down, tonicD, fifths).pitch) - m0) < Math.abs(midiOf(ladderAt(sc, up, tonicD, fifths).pitch) - m0) ? down : up;
}
/** 简谱写法：带升降的音级（♯4 / ♭7）。 */
export const degLabel = (g: ScaleDeg): string => `${g.alt > 0 ? "♯" : g.alt < 0 ? "♭" : ""}${g.deg}`;
