// spacing.ts —— 横向间距：一行里每一列排在哪（纯函数，不认谱、不画东西）。created 2026-11-09 by Claude Fable 5.1
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md「刀 3」。user 11-08「一列多宽。这个算法可以从头想一下」。
//
// 为什么要它：原来一列的宽 = 这一刻各声部刚开始的音里最长的那个的宽。别的声部正好是长音 / 整小节休止时，这边一串十六分的第一个就被拉到全音符那么宽
//   （量过：十六分每个 2.2 个线间距，对面是全音符时第一个 5.1；八分三连音对八分 = 2.85 / 5.7 / 2.85）。挂在音上的记号（重音 / 力度 / 渐强 / 风格 / 速度）不占宽，量过都是 0。
//
// 规矩（出版谱的老办法：弹簧 + 顶杆）：
//   ① 一列 = 同一时刻各行（声部 × 谱表）的东西，符头左缘对齐在一条线上（临时记号挂在线的左边，进前一列的空）。
//   ② 弹簧：一列到下一列的理想距离 = 这一刻**正在响的音里最短的那个**该占的宽 × 这一段占它时值的几分之几。
//      只有十六分在响 = 每列一个十六分的宽；对面是全音符也一样（全音符只是跨过好几列）。三连音对八分 = 按时间比例分，三个三连音自然等距。
//   ③ 顶杆：同一行里前后两样东西真会撞（前一样的右伸 + 后一样的左伸 + 一点缝）才把距离顶开。不在同一行、不撞 = 不顶。
//   ④ 一行排满：只拉 / 压弹簧（按理想距离的比例），顶杆是下限；固定宽的列（小节线 / 调号 / 拍号 / 行中谱号）不拉不压。
import { TPQ } from "../score/song.ts";

/** 一列里某一行的一样东西。left / right = 从对齐线往左 / 往右占多宽（sp）。dur = 时值（tick）；没有 = 不算「正在响的音」（整小节休止：画在小节正中，不参加间距）。 */
export interface SpItem { row: number; left: number; right: number; dur?: number }
/** fixed = 固定宽的列（小节线 / 调号 / 拍号 / 行中谱号 / 句号）：到下一列正好这么宽，所有行都被它隔开。没有 fixed = 音列。
 *  fixed = 0（力度 / 渐强 / 风格 / 八度线 / 反复跳转 / 写字头这些不占宽的）= 透明：不顶任何东西、不隔开任何行，位置 = 后面那一列（和后面那个音对齐）。 */
export interface SpCol { tick: number; fixed?: number; items: SpItem[] }
export interface SpOpts {
  /** 时值（tick）→ 这么长的一个音独占一列时该多宽（sp）。 */
  curve: (ticks: number) => number;
  /** 同一行前后两样东西之间至少留的缝（sp）。 */
  pad: number;
  /** 谁都没在响的一段（各行都是整小节休止）最宽给多少（sp）。 */
  emptyBar: number;
}
export interface Rod { from: number; to: number; min: number }
/** 顶杆按「顶到哪一列」分好（摆一行要反复用；rodsOf 的结果整串算一次、分一次）。 */
export interface RodIndex { into: Rod[][] }
export function indexRods(rods: readonly Rod[], n: number): RodIndex {
  const into: Rod[][] = Array.from({ length: n }, () => []);
  for (const r of rods) into[r.to]?.push(r);
  return { into };
}
const isZero = (c: SpCol) => c.fixed !== undefined && c.fixed <= EPS;
const EPS = 1e-6;

// ── 时值 → 宽 ────────────────────────────────────────────────────────────────
// 折线（横轴 = 时值的 log2）：四分 3.6，每翻一倍 +0.75（2026-10-07 定的）。松 = 十六分及更短一律 2.2（原来的下限）；
// 密（默认；user 11-08「很密的十六分和三十二分音符，它们的间距能不能人工压密一点」「正常人都会画密」）= 十六分 1.9、三十二分及更短 1.6（符头宽 1.18，留 0.4 的缝）。
// 这几个数是起点：出了样张 user 看着再调，只改这两张表。
type Pt = readonly [ticks: number, width: number];
const LOOSE: readonly Pt[] = [[TPQ / 8, 2.2], [TPQ / 4, 2.2], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
const DENSE: readonly Pt[] = [[TPQ / 8, 1.6], [TPQ / 4, 1.9], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
const lerpLog = (pts: readonly Pt[], ticks: number): number => {
  if (ticks <= pts[0]![0]) return pts[0]![1];
  const last = pts[pts.length - 1]!;
  if (ticks >= last[0]) return last[1] + 0.75 * Math.log2(ticks / last[0]);   // 比全音符还长：照原来的斜率接着长
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1]!, b = pts[k]!;
    if (ticks <= b[0]) return a[1] + ((b[1] - a[1]) * Math.log2(ticks / a[0])) / Math.log2(b[0] / a[0]);
  }
  return last[1];
};
/** dense = 短音符压紧（默认开）。连音 / 附点按实际时值落在折线上（八分三连音在八分和十六分之间）。 */
export const curveOf = (dense: boolean) => (ticks: number): number => lerpLog(dense ? DENSE : LOOSE, ticks);
export const SP_DEFAULTS = { pad: 0.3, emptyBar: 4.5 } as const;

// ── 弹簧：每一列到下一列的理想距离 ──────────────────────────────────────────────
/** cols 按时间排好（同一时刻的先后 = 画的先后）。endTick = 这一串最后到哪（这张纸的长度）。返回每一列到下一列的理想距离（最后一列 = 到结尾）。 */
export function idealGaps(cols: readonly SpCol[], endTick: number, o: SpOpts): number[] {
  const out = new Array<number>(cols.length).fill(0), sounding = new Map<number, { dur: number; end: number }>();
  cols.forEach((c, k) => {
    if (c.fixed !== undefined) { out[k] = c.fixed; return; }
    for (const it of c.items) { if (it.dur !== undefined && it.dur > EPS) sounding.set(it.row, { dur: it.dur, end: c.tick + it.dur }); else sounding.delete(it.row); }
    let next = endTick; for (let j = k + 1; j < cols.length; j++) if (cols[j]!.tick > c.tick + EPS) { next = cols[j]!.tick; break; }
    const dt = next - c.tick; if (dt <= EPS) return;   // 同一时刻后面还有一列（不该有两列音在同一时刻；有 = 不另占宽，顶杆兜着）
    let d = Infinity; for (const a of sounding.values()) if (a.end > c.tick + EPS) d = Math.min(d, a.dur);
    out[k] = d === Infinity ? Math.min(o.curve(dt), o.emptyBar) : o.curve(d) * Math.min(1, dt / d);
  });
  return out;
}

// ── 顶杆：同一行前后两样东西不许撞 ──────────────────────────────────────────────
export function rodsOf(cols: readonly SpCol[], o: SpOpts): Rod[] {
  const rods: Rod[] = [], last = new Map<number, { col: number; right: number }>();
  let wall: { col: number; right: number } | null = null;   // 最近一个固定列：它隔开所有行
  cols.forEach((c, k) => {
    if (isZero(c)) return;   // 不占宽的记号列：透明
    if (c.fixed !== undefined) {
      for (const l of last.values()) rods.push({ from: l.col, to: k, min: l.right + o.pad });
      if (wall && !last.size) rods.push({ from: wall.col, to: k, min: wall.right });
      last.clear(); wall = { col: k, right: c.fixed }; return;
    }
    for (const it of c.items) {
      const l = last.get(it.row);
      if (l) rods.push({ from: l.col, to: k, min: l.right + it.left + o.pad });
      else if (wall) rods.push({ from: wall.col, to: k, min: wall.right + it.left });
      last.set(it.row, { col: k, right: it.right });
    }
  });
  return rods;
}

// ── 摆一行 ────────────────────────────────────────────────────────────────────
const leftOf = (c: SpCol): number => (c.fixed !== undefined ? 0 : c.items.reduce((m, it) => Math.max(m, it.left), 0));
const rightOf = (c: SpCol): number => (c.fixed !== undefined ? c.fixed : c.items.reduce((m, it) => Math.max(m, it.right), 0));
/** 这一行的列（cols[from..to)）按拉伸量 s 摆：弹簧 ×(1 + s)，顶杆是下限。xs[i] = 第 from + i 列的对齐线离行首多远；end = 这一行内容的右端。
 *  gaps / rods 是整串算好的（idealGaps / rodsOf），这里只用落在这一行里的那几条。 */
export function placeLine(cols: readonly SpCol[], gaps: readonly number[], rods: readonly Rod[] | RodIndex, from: number, to: number, s: number): { xs: number[]; end: number } {
  const n = to - from, xs = new Array<number>(n).fill(0); if (n <= 0) return { xs, end: 0 };
  const ix = "into" in rods ? rods : indexRods(rods, cols.length);
  const gap = (k: number) => (cols[k]!.fixed !== undefined ? gaps[k]! : gaps[k]! * (1 + s));
  for (let k = from; k < to; k++) {
    let x = k === from ? 0 : xs[k - 1 - from]! + gap(k - 1);
    x = Math.max(x, leftOf(cols[k]!));   // 行首：前面的临时记号往右让出来（前面只有不占宽的列时也算）
    for (const r of ix.into[k] ?? []) if (r.from >= from) x = Math.max(x, xs[r.from - from]! + r.min);
    xs[k - from] = x;
  }
  for (let k = to - 2; k >= from; k--) if (isZero(cols[k]!)) xs[k - from] = xs[k + 1 - from]!;   // 不占宽的列 = 后面那一列的位置
  const lastK = to - 1;
  return { xs, end: xs[n - 1]! + Math.max(gap(lastK), rightOf(cols[lastK]!)) };
}
/** 把这一行排进 width 宽：放得下 = 原样（justify 时拉到正好满）；超了 = 压，最多压 squeeze（弹簧的比例），还超 = over（调用方换行）。 */
export function fitLine(cols: readonly SpCol[], gaps: readonly number[], rods: readonly Rod[] | RodIndex, from: number, to: number, width: number, opt: { squeeze: number; justify: boolean }): { xs: number[]; end: number; stretch: number; over: boolean } {
  const ix = "into" in rods ? rods : indexRods(rods, cols.length), at = (s: number) => placeLine(cols, gaps, ix, from, to, s), nat = at(0);
  const solve = (lo: number, hi: number) => { for (let i = 0; i < 48; i++) { const mid = (lo + hi) / 2; if (at(mid).end > width) hi = mid; else lo = mid; } return lo; };
  if (nat.end > width + EPS) {
    const tight = at(-opt.squeeze);
    if (tight.end > width + EPS) return { ...tight, stretch: -opt.squeeze, over: true };
    const s = solve(-opt.squeeze, 0); return { ...at(s), stretch: s, over: false };
  }
  if (!opt.justify) return { ...nat, stretch: 0, over: false };
  let hi = 1; while (at(hi).end < width && hi < 4096) hi *= 2;
  if (at(hi).end < width) return { ...nat, stretch: 0, over: false };   // 这一行没有能拉的弹簧（全是固定列）
  const s = solve(0, hi); return { ...at(s), stretch: s, over: false };
}
