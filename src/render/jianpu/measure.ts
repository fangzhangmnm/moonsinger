// measure.ts —— 简谱数字行的「量」：一条轨 → 列条目（每个排版单元往左 / 往右占多宽、管多长）+ 行首多宽 + 歌词锚点。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。和五线谱同一个形状（staff/measure.ts），纯函数、只看这一条轨。
//   时间那一半（切小节、拆成能记的时值、第几拍、连音比例）= 框架的排版单元（src/render/frame/units.ts；第五刀 5-1 从五线谱那边搬过去，这里不再借五线谱的东西）。
import { TPQ } from "../../score/song.ts";
import type { Token } from "../../score/song.ts";
import { MELISMA_MARK } from "../../score/lyrics.ts";
import type { SpItem } from "../spacing.ts";
import { SLOT, type ColumnKind } from "../frame/columns.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { PartView } from "../engrave.ts";
import type { Unit, Chunk, Head } from "../frame/units.ts";
import { DIGIT_W, ACC_W, DASH_PITCH, AUG_DX, AUG_R, BAR_W_J, MID_TEXT_EM, MID_TEXT_CH, BREATH_W, INHALE_W } from "./glyphs.ts";

/** 一条要排的简谱轨（一个声部在这张纸上；框架交来的单元已经切好了时值）。 */
export interface JianpuTrack {
  p: PartView; tokens: Token[]; units: Unit[]; head: Head; realLen: number; realTicks: number; staves: number; focused: boolean; pickup: boolean;
}

/** 这一段除了第一个字形（数字 / 0 / 横线）后面还有几个：长音的横线、几拍的休止一拍一个 0。 */
export function extraGlyphs(u: Chunk): number {
  if (u.note) {
    if (u.j > 0 && u.base >= TPQ) return Math.max(0, Math.round(u.ticks / TPQ) - 1);   // 接着上一段的长音：一拍一条横线（第一个字形就是横线）
    if (u.base >= TPQ * 2) return Math.round(u.base / TPQ) - 1 + (u.dotted ? Math.round(u.base / (TPQ * 2)) : 0);   // 二分 = 5 –、附点二分 = 5 – –、全音 = 5 – – –
    return 0;
  }
  if (u.base >= TPQ) return Math.max(0, Math.floor(u.ticks / TPQ + 1e-6) - 1);   // 一拍一个 0（整小节休止也是：UX 稿第 4 节，帮唱的人倒数）
  return 0;
}
/** 这一段有没有附点（画在数字右边）：附点的四分 / 八分…；附点二分以上写成横线，不画点；几拍的休止剩下的半拍也画点。 */
export function hasAugDot(u: Chunk): boolean {
  if (u.note) return u.dotted && u.base < TPQ * 2 && !(u.j > 0 && u.base >= TPQ);
  return u.base >= TPQ ? Math.floor(u.ticks / TPQ + 1e-6) * TPQ < u.ticks - 1e-6 : u.dotted;
}
/** 第几层下划线（八分 = 1、十六分 = 2…；四分以上 = 0）。 */
export const underlines = (u: Chunk): number => (u.base < TPQ ? Math.max(1, Math.round(Math.log2(TPQ / u.base))) : 0);

const COLUMN_KIND: Record<Unit["kind"], ColumnKind> = { bar: "bar", nav: "nav", clef: "clef", key: "key", time: "time", tempo: "tempo", groove: "groove", dyn: "dyn", ottava: "ottava", hairpin: "hairpin", head: "tail", chunk: "note" };
/** 中途换调 / 换拍号写的那几个字（「1=♭B」「3/4」）大约多宽（sp）。 */
export const midTextW = (s: string): number => [...s].length * MID_TEXT_CH * MID_TEXT_EM + 0.6;
/** 不是音的单元在数字行上占多宽（sp）：小节线一根的宽；换调 / 换拍号 = 写字的宽；谱号 / 八度线（五线谱才有的）= 小灰标的宽；别的（力度、发夹、速度、风格、跳转、写字头）不占地方。 */
function unitW(u: Unit): number {
  switch (u.kind) {
    case "bar": return u.repeat ? BAR_W_J + 1.0 : u.style ? BAR_W_J + 0.5 : BAR_W_J;
    case "key": return midTextW("1=♭B");
    case "time": return midTextW(`${u.beats}/${u.beatType}`);
    case "clef": case "ottava": return 2.6;   // 小灰标「谱号」/「8va」写得下（字号 1 sp，两个汉字 / 四个字母）
    default: return 0;
  }
}

/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号：数字那一道 = 0、歌词那一道 = 1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；升降号）：光标画在它左边。 */
export function measureJianpu(q: JianpuTrack): { entries: ColEntry<Unit>[]; inkL: Map<Chunk, number> } {
  const inkL = new Map<Chunk, number>();
  const spItems = (u: Chunk): SpItem[] => {
    if (u.pad) return [];   // 补齐的淡色小节不画、不参加间距（同五线谱）
    const n = extraGlyphs(u), acc = u.note && u.j === 0 && u.acc !== null;
    const breathW = u.note && u.breath ? BREATH_W + (u.inhale ? INHALE_W : 0) : 0;   // 换气的 V（+「吸 / 深吸」）画在音后面：留出来，不压下一个音
    const left = acc ? ACC_W : -0.1, right = 0.1 + DIGIT_W + 0.15 + n * DASH_PITCH + (hasAugDot(u) ? AUG_DX + 2 * AUG_R + 0.1 : 0) + breathW;
    inkL.set(u, Math.max(0, left));
    const out: SpItem[] = [{ row: 0, left, right, dur: u.ticks }];
    const cx = 0.1 + DIGIT_W / 2;
    if (u.lyW !== undefined) out.push({ row: 1, left: u.lyW / 2 - cx, right: cx + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });   // 按歌词排：字和字之间不撞（同一套顶杆）
    return out;
  };
  const entries = q.units.map((u): ColEntry<Unit> => ({ tick: u.tick, slot: u.kind === "nav" ? u.slot : SLOT[COLUMN_KIND[u.kind]], w: u.kind === "chunk" ? u.w : unitW(u), ...(u.kind === "bar" ? { bar: true } : {}), ...(u.kind === "chunk" ? { chunk: { items: spItems(u), span: u.ticks } } : {}), ref: u }));
  return { entries, inkL };
}
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距）；数字行行首不画谱号 / 调号（谱头「1=C 4/4」写在第一行上方），只留一点空。 */
export const jianpuLineStart = (_q: JianpuTrack, _key: number, _first: boolean, base: number): number => base + 0.6;
/** 歌词锚点：每个带字的音在第几行、字的中心在哪（sp：数字的中心）。拖腔线不算。 */
export const jianpuLyricAnchors = (q: JianpuTrack): { index: number; system: number; cx: number; lyric: string; hyph: boolean }[] =>
  q.units.filter((u): u is Chunk => u.kind === "chunk" && !!u.lyric && u.lyric !== MELISMA_MARK).map((u) => ({ index: u.index, system: u.system, cx: u.x + 0.1 + DIGIT_W / 2, lyric: u.lyric!, hyph: u.hyph }));
