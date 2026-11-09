// skyline.ts —— 一条谱行的上下天际线 + 图元的墨迹（刀 4b）。created 2026-11-09 by Claude Opus 5.5
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §2：先把音符本身排好、量出这一行「现在最高 / 最低到哪」，再把挂的东西按离音的远近一样一样贴上去；
//   行距只在真放不下时加，加的是这一行自己的。原来是反过来的：先按「有没有力度 / 有没有反复」留固定的道，高度按整行最高的音估。
// 坐标：x = 行里的横坐标（线间距）；y = 从五线谱最上面那条线往下量（线间距；往上为负）。按 x 分桶（STEP 一格），每格记往上 / 往下最远到哪。
// 量墨迹：字形查 glyph-box.gen.ts（Bravura 轮廓量的）；字按字宽 × 字号估（上 0.8 em、下 0.22 em）；线 / 方块照几何；路径把直线和曲线切成不宽于一格的小段，每段各记各的（斜的符杠不会把整段都抬高）。

import { GLYPH_BOX } from "./glyph-box.gen.ts";
import type { Prim } from "./engrave.ts";

export const STEP = 0.25;

export class Skyline {
  readonly up: Float64Array; readonly dn: Float64Array;
  /** 行高要算进去的那部分（歌词另算——它有自己的行距规矩）：最高 / 最低。 */
  hUp = Infinity; hDn = -Infinity;
  constructor(widthSp: number) { const n = Math.max(1, Math.ceil(widthSp / STEP) + 1); this.up = new Float64Array(n).fill(Infinity); this.dn = new Float64Array(n).fill(-Infinity); }
  private span(x0: number, x1: number): [number, number] { const n = this.up.length; return [Math.max(0, Math.min(n - 1, Math.floor(x0 / STEP))), Math.max(0, Math.min(n - 1, Math.floor(x1 / STEP)))]; }
  /** 记一块墨（count = 算不算进行高）。 */
  ink(x0: number, x1: number, y0: number, y1: number, count = true): void {
    if (!(x1 >= x0) || !(y1 >= y0)) return;
    const [a, b] = this.span(x0, x1);
    for (let i = a; i <= b; i++) { if (y0 < this.up[i]) this.up[i] = y0; if (y1 > this.dn[i]) this.dn[i] = y1; }
    if (count) { if (y0 < this.hUp) this.hUp = y0; if (y1 > this.hDn) this.hDn = y1; }
  }
  /** x0–x1 这一段往上最远到哪（没有墨 = Infinity）。 */
  top(x0: number, x1: number): number { const [a, b] = this.span(x0, x1); let v = Infinity; for (let i = a; i <= b; i++) if (this.up[i] < v) v = this.up[i]; return v; }
  /** x0–x1 这一段往下最远到哪（没有墨 = −Infinity）。 */
  bottom(x0: number, x1: number): number { const [a, b] = this.span(x0, x1); let v = -Infinity; for (let i = a; i <= b; i++) if (this.dn[i] > v) v = this.dn[i]; return v; }
}

/** 一个图元的墨迹，切成小块交给 emit（px，和图元同一个坐标系）。measure(s, size) = 这串字在 size px 字号下多宽（px）。 */
export function primInk(p: Prim, sp: number, measure: (s: string, size: number) => number, emit: (x0: number, x1: number, y0: number, y1: number) => void): void {
  switch (p.t) {
    case "glyph": {
      const size = p.size ?? 4 * sp, k = size / 4;
      let x = p.x;
      for (const ch of p.ch) {   // 几个码位拼的（两位数的拍号 / 连音数字）：一个挨一个
        const b = GLYPH_BOX[ch];
        if (b) { emit(x + b[0] * k, x + b[1] * k, p.y + b[2] * k, p.y + b[3] * k); x += b[1] * k; }
        else { emit(x, x + k, p.y - k / 2, p.y + k / 2); x += k; }   // 表里没有：一格见方
      }
      return;
    }
    case "text": {
      const size = p.size ?? 1.6 * sp, w = measure(p.s, size) * (p.sx ?? 1), x0 = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "end" ? p.x - w : p.x;
      emit(x0, x0 + w, p.y - size * 0.8, p.y + size * 0.22); return;
    }
    case "line": { const h = p.w / 2; flatten([[p.x1, p.y1], [p.x2, p.y2]], sp, h, emit); return; }
    case "rect": emit(p.x, p.x + p.w, p.y, p.y + p.h); return;
    case "path": for (const poly of pathPolys(p.d)) flatten(poly, sp, 0, emit); return;
  }
}
/** 折线 → 一格宽的小段（每段一个框；pad = 线宽的一半）。 */
function flatten(pts: [number, number][], sp: number, pad: number, emit: (x0: number, x1: number, y0: number, y1: number) => void): void {
  if (pts.length === 1) { const [x, y] = pts[0]; emit(x - pad, x + pad, y - pad, y + pad); return; }
  const cell = STEP * sp;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if (ay === by || ax === bx) { emit(Math.min(ax, bx) - pad, Math.max(ax, bx) + pad, Math.min(ay, by) - pad, Math.max(ay, by) + pad); continue; }   // 横线 / 竖线（五线、加线、符干、小节线）：一整块
    const n = Math.max(1, Math.ceil(Math.abs(bx - ax) / cell));
    for (let k = 0; k < n; k++) {
      const x0 = ax + ((bx - ax) * k) / n, x1 = ax + ((bx - ax) * (k + 1)) / n, y0 = ay + ((by - ay) * k) / n, y1 = ay + ((by - ay) * (k + 1)) / n;
      emit(Math.min(x0, x1) - pad, Math.max(x0, x1) + pad, Math.min(y0, y1) - pad, Math.max(y0, y1) + pad);
    }
  }
}
/** 路径字符串里从 i 起的一个数（跳过逗号空格）：[值, 结束下标]；不是数 = null。手写扫描（比正则快，排版器每张纸要扫几千条）。 */
function numAt(d: string, i: number): [number, number] | null {
  while (i < d.length && (d[i] === "," || d[i] === " ")) i++;
  const s = i; if (d[i] === "-" || d[i] === "+") i++;
  while (i < d.length) { const ch = d.charCodeAt(i); if ((ch >= 48 && ch <= 57) || ch === 46) i++; else if ((ch === 101 || ch === 69) && (d[i + 1] === "-" || d[i + 1] === "+")) i += 2; else if (ch === 101 || ch === 69) i++; else break; }
  return i > s ? [Number(d.slice(s, i)), i] : null;
}
/** 排版器自己写的路径（只有绝对坐标的 M L Q C Z）→ 几条折线（曲线 8 段采样）。 */
export function pathPolys(d: string): [number, number][][] {
  const out: [number, number][][] = [];
  let cur: [number, number][] = [], x = 0, y = 0, i = 0;
  const v: number[] = [];
  while (i < d.length) {
    const c = d[i]!.toUpperCase(); i++;
    v.length = 0; for (let r = numAt(d, i); r; r = numAt(d, i)) { v.push(r[0]); i = r[1]; }
    if (c === "M") { if (cur.length) out.push(cur); x = v[0]!; y = v[1]!; cur = [[x, y]]; for (let k = 2; k + 1 < v.length; k += 2) { x = v[k]!; y = v[k + 1]!; cur.push([x, y]); } }
    else if (c === "L") for (let k = 0; k + 1 < v.length; k += 2) { x = v[k]!; y = v[k + 1]!; cur.push([x, y]); }
    else if (c === "Q") for (let k = 0; k + 3 < v.length; k += 4) { const cx = v[k]!, cy = v[k + 1]!, ex = v[k + 2]!, ey = v[k + 3]!; for (let n = 1; n <= 8; n++) { const t = n / 8, u = 1 - t; cur.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey]); } x = ex; y = ey; }
    else if (c === "C") for (let k = 0; k + 5 < v.length; k += 6) { const ax = v[k]!, ay = v[k + 1]!, bx = v[k + 2]!, by = v[k + 3]!, ex = v[k + 4]!, ey = v[k + 5]!; for (let n = 1; n <= 8; n++) { const t = n / 8, u = 1 - t; cur.push([u * u * u * x + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * ex, u * u * u * y + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ey]); } x = ex; y = ey; }
    else if (c === "Z" && cur.length) { cur.push(cur[0]!); x = cur[0]![0]; y = cur[0]![1]; }
  }
  if (cur.length) out.push(cur);
  return out;
}
/** 把图元上下挪 dy（px）。路径里每一对「x,y」的 y 都挪（排版器的路径只有绝对坐标：逗号后面那个数就是 y）。 */
export function shiftPrim(p: Prim, dy: number): void {
  if (!dy) return;
  switch (p.t) {
    case "glyph": case "text": case "rect": p.y += dy; return;
    case "line": p.y1 += dy; p.y2 += dy; return;
    case "path": {
      const d = p.d; let out = "", i = 0;
      for (let c = d.indexOf(","); c >= 0; c = d.indexOf(",", i)) {   // 逗号后面那个数 = y
        let e = c + 1;
        if (d[e] === "-") e++;
        while (e < d.length) { const ch = d.charCodeAt(e); if ((ch >= 48 && ch <= 57) || ch === 46) e++; else if ((ch === 101 || ch === 69) && (d[e + 1] === "-" || d[e + 1] === "+")) e += 2; else if (ch === 101 || ch === 69) e++; else break; }   // 数字、小数点、e±
        out += d.slice(i, c + 1) + String(Number(d.slice(c + 1, e)) + dy); i = e;
      }
      p.d = out + d.slice(i); return;
    }
    default: { const never: never = p; throw new Error(`shiftPrim: unknown prim ${JSON.stringify(never)}`); }   // 穷举守卫（Fable 11-09 审三刀留的小尾巴）：加了新图元没在这里挪 = 类型检查红
  }
}
/** 图元的一个代表 y（px）：认它是哪一行的。 */
export function primY(p: Prim): number {
  switch (p.t) {
    case "glyph": case "text": return p.y;
    case "rect": return p.y + p.h / 2;
    case "line": return (p.y1 + p.y2) / 2;
    case "path": { const c = p.d.indexOf(","), r = c >= 0 ? numAt(p.d, c + 1) : null; return r ? r[0] : 0; }
  }
}
