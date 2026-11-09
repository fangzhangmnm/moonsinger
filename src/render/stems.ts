// stems.ts —— 符干、符杠、符尾的几何（纯函数）。created 2026-11-09 by Claude Opus 5.5
// 刀 4a（施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §2.2）：原来在 engrave.ts 第 7 步里边算边画，用的是整页的像素坐标——
//   要等每一行摆到纸上（行距定了）才算得出来。刀 4b 的天际线要在定行距**之前**知道符干尖、符杠、符尾在哪，所以抽出来，坐标系由调用方给（`Frame`）：
//   · 局部（默认 `LOCAL`）：x = 行里的横坐标（sp，同 Chunk.x）、y = 从五线谱最上面那条线往下量（sp；第五线 = 0、第一线 = 4，往上为负）——天际线用；
//   · 像素（排版器画的时候）：u = sp、y = 那一条谱行的 yOf——算式和抽出来之前逐字一样，版面逐位相同（刀 4a 的守卫 = 快照不重冻）。
// 规矩（照搬 v0.16.35 的第 7 步，一样都没改）：
//   · 连杠：同一拍里连着的八分及更短的音共用符杠；小节线 / 中途的调号拍号 / 休止 / 全音符打断；换行、换谱表（大谱表上下）打断。
//   · 朝向：声部 2 一律朝下；有声部 2 的声部 1 一律朝上；一线鼓谱一律朝上；五线鼓谱一组里有手打的 = 朝上（脚踩的朝下）；别的 = 一组符头（每个音最高最低的中点）平均在中线下面 = 朝上。
//   · 单个音：符干 3.5 个线间距；朝上的音在谱下面（低过第三间）= 符干尖至少到中线，朝下同理。
//   · 一组：符杠斜率 = 首尾两个最高符头的落差 / 距离 × 0.5，夹在 ±0.2；整根符杠平移到离每个符头都至少 3.5。
//   · 更短的那几层：连着的一串画整段；单独一个 = 半截杠（1.1 长），组里最后一个朝左，其余朝右。

import { TPQ, WHOLE } from "../score/song.ts";
import { ENGRAVE, STEM_UP_SE, STEM_DOWN_NW, FLAG_ANCHOR_UP, FLAG_ANCHOR_DOWN } from "./smufl.ts";

const TOP_LINE = 38, MID_LINE = 34;
/** 谱上的级数 → 局部 y（sp，第五线 = 0，往下为正）。 */
export const yLocal = (d: number): number => (TOP_LINE - d) * 0.5;
/** 符尾有几层：八分 1、十六分 2、三十二分 3；四分及更长 0。 */
export const flagLevel = (base: number): number => (base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base)));

export interface StemNote<K> {
  key: K;
  x: number;        // 符头左缘（Frame 的单位）
  dHi: number; dLo: number;   // 最高 / 最低的符头在谱上的级数（单音两个一样）
  base: number;     // 写出来的时值（不含附点）
  beat: number;     // 小节里第几拍（同一拍才连杠）
  system: number; staff: number;   // 第几行 / 大谱表里上还是下（换了 = 符杠断开）
  ghost: boolean;   // 幽灵音（整组都是 = 符杠画淡）
  handUp?: boolean; // 五线鼓谱：这一件要符干朝上（手打）；没给 = 朝下（脚踩）
}
/** 坐标系：u = 一个线间距多长；y(d, 音) = 谱上第 d 级在哪（同一条谱上 d 大 = y 小）。 */
export interface Frame<K> { u: number; y: (d: number, n: StemNote<K>) => number }
/** 局部坐标：单位 = 线间距，y 从第五线往下量。 */
export const LOCAL: Frame<unknown> = { u: 1, y: (d) => yLocal(d) };
/** 朝向的规矩：auto = 按音高；up / down = 一律；kit = 五线鼓谱（一组里有手打的 = 朝上）。 */
export type StemDir = "auto" | "up" | "down" | "kit";
export interface StemOut {
  up: boolean;
  x: number;        // 符干中线（下面的坐标都按 Frame）
  y0: number;       // 符干起点（远端那个符头上的接点）
  tip: number;      // 符干尖
  top: number;      // 这个音往上画到哪（朝上 = 符干尖（连杠的再加一根杠厚），朝下 = 最高的符头）
  beamed: boolean;
  flag: { x: number; y: number; level: number } | null;   // 符尾字形的原点（没连杠才有）
}
/** 一根符杠（或一截）：平行四边形，左上 (xL, yL)、右上 (xR, yR)，往下 th（朝下的组 th < 0 = 往上长）。 */
export interface BeamOut { xL: number; yL: number; xR: number; yR: number; th: number; ghost: boolean }

/** 一条谱上的音（按先后；null = 打断符杠的东西：小节线、中途的调号 / 拍号、休止、全音符）→ 每个音的符干 + 每一组的符杠（groups 按先后，画的时候一组一组画：先符干再符杠）。 */
export function layoutStems<K>(seq: readonly (StemNote<K> | null)[], dir: StemDir, f: Frame<K> = LOCAL as Frame<K>): { notes: Map<K, StemOut>; groups: { keys: K[]; beams: BeamOut[] }[] } {
  const groups: StemNote<K>[][] = [];
  let group: StemNote<K>[] = [], groupBeat = -1, groupSys = -1;
  const endGroup = () => { if (group.length) groups.push(group); group = []; groupBeat = -1; };
  for (const u of seq) {
    if (!u || u.base >= WHOLE) { endGroup(); continue; }
    if (u.base > TPQ / 2) { endGroup(); groups.push([u]); continue; }
    if (group.length && (u.beat !== groupBeat || u.system !== groupSys || u.staff !== group[0].staff)) endGroup();   // 换谱表 = 符杠断开（跨谱表符杠下一轮）
    group.push(u); groupBeat = u.beat; groupSys = u.system;
  }
  endGroup();

  const U = (v: number) => v * f.u;
  const notes = new Map<K, StemOut>(), out: { keys: K[]; beams: BeamOut[] }[] = [];
  for (const g of groups) {
    const up = dir === "down" ? false : dir === "up" ? true : dir === "kit" ? g.some((s) => !!s.handUp) : g.reduce((a, s) => a + (s.dHi + s.dLo) / 2, 0) / g.length < MID_LINE;
    const sx = (s: StemNote<K>) => (up ? s.x + U(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x + U(STEM_DOWN_NW[0] + ENGRAVE.stem / 2));
    const y = (s: StemNote<K>) => f.y(s.dHi, s), yLow = (s: StemNote<K>) => f.y(s.dLo, s);
    const sy0 = (s: StemNote<K>) => (up ? yLow(s) - U(STEM_UP_SE[1]) : y(s) - U(STEM_DOWN_NW[1]));   // 符干从远端的那个符头起
    const beams: BeamOut[] = [];
    out.push({ keys: g.map((s) => s.key), beams });
    if (g.length === 1) {
      const s = g[0], mid = f.y(MID_LINE, s);
      let tip = up ? y(s) - U(3.5) : yLow(s) + U(3.5);
      if (up && s.dHi < 27) tip = Math.min(tip, mid); if (!up && s.dLo > 41) tip = Math.max(tip, mid);
      const lv = flagLevel(s.base);
      notes.set(s.key, { up, x: sx(s), y0: sy0(s), tip, top: up ? tip : y(s), beamed: false, flag: lv > 0 ? { x: sx(s) - U(ENGRAVE.stem / 2), y: up ? tip + U(FLAG_ANCHOR_UP[lv]) : tip + U(FLAG_ANCHOR_DOWN[lv]), level: lv } : null });
      continue;
    }
    const xa = sx(g[0]), xb = sx(g[g.length - 1]);
    const k = Math.max(-0.2, Math.min(0.2, ((y(g[g.length - 1]) - y(g[0])) / (xb - xa)) * 0.5));
    const at = (xx: number, yy0: number) => yy0 + k * (xx - xa);
    const yb0 = up ? Math.min(...g.map((s) => y(s) - U(3.5) - k * (sx(s) - xa))) : Math.max(...g.map((s) => yLow(s) + U(3.5) - k * (sx(s) - xa)));
    for (const s of g) notes.set(s.key, { up, x: sx(s), y0: sy0(s), tip: at(sx(s), yb0), top: up ? Math.min(at(sx(s), yb0) - U(ENGRAVE.beam), y(s)) : y(s), beamed: true, flag: null });
    const step = U(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = U(ENGRAVE.beam) * (up ? 1 : -1), ghost = g.every((s) => s.ghost);
    const beam = (xL: number, xR: number, lvl: number) => { const of = step * lvl; beams.push({ xL: xL - U(ENGRAVE.stem / 2), yL: at(xL, yb0) + of, xR: xR + U(ENGRAVE.stem / 2), yR: at(xR, yb0) + of, th, ghost }); };
    beam(xa, xb, 0);
    const maxLv = Math.max(...g.map((s) => flagLevel(s.base)));
    for (let lvl = 2; lvl <= maxLv; lvl++) {
      let runStart = -1;
      for (let n = 0; n <= g.length; n++) {
        const has = n < g.length && flagLevel(g[n].base) >= lvl;
        if (has && runStart < 0) runStart = n;
        if (!has && runStart >= 0) {
          const L = runStart, R = n - 1;
          if (L === R) { const stub = U(1.1), toRight = L < g.length - 1; beam(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1); }   // 单独一个更短的音：半截杠，组里最后一个朝左，其余朝右
          else beam(sx(g[L]), sx(g[R]), lvl - 1);
          runStart = -1;
        }
      }
    }
  }
  return { notes, groups: out };
}
