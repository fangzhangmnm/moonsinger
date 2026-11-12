// cell.ts —— 一个音的盒子（第八刀 8-1，2026-11-12 Claude Opus 5.5 / MoonSinger小弟；施工单 ai-docs/20261111-score-surface-construction-plan.md 第 8 节）。
//   只管几何：不认字形、不认是哪种谱（框架的规矩照旧）。统筹对 user 的说法：「不再给每样东西发一个固定座位，而是让它们排队站位。
//   每样东西先报自己多大；贴着音的，贴着音实际的边；往外的，谁先占了地方，后来的往外让。」
//   坐标：x 相对这一列的原点、y = 行的局部坐标（往下为正：above = y 小的那一边）；单位由用的人定（数字行用的是它自己的单位，画的时候整块平移成 px）。
//   用法：先放核（core，可以放几次：和弦一个音一次），再按施工单那张表的先后一样一样贴（attach）；成组的东西先 reserve 把这一边对齐到组里最远的，再贴。
//   量宽度、进天际线、点击框都读 box()；画 = prims(dx, dy) 整个盒子平移到位（量和画用同一个盒子 = 对得上）。
import type { Prim } from "../engrave.ts";
import { movePrim } from "../skyline.ts";

export type Side = "above" | "below" | "left" | "right";
/** 墨迹框（相对它自己的锚点；放进盒子之后相对这一列的原点）。 */
export interface Ink { x0: number; x1: number; y0: number; y1: number }
/** 一样东西：自己的墨迹框 + 图元（原点在它自己的锚点）。 */
export interface Part { ink: Ink; prims: Prim[] }
/** 贴的时候：离这一边现在的边缘多远（gap）；另一个方向怎么对齐——
 *  align（默认 center）对的是核的框：贴上 / 下时 start = 左边齐、end = 右边齐；贴左 / 右时 start = 顶齐、end = 底齐。
 *  cross = 另一个方向直接给锚点的位置（字形表里本来就定了高度的，如附点在基线上多高；给了就不看 align）。
 *  （钉住的接口里没有 cross：实现时加的，施工单第 8 节已回写。） */
export interface AttachOpts { gap: number; align?: "center" | "start" | "end"; cross?: number }
export interface Cell {
  /** 放一个核（数字 / 字母 / 和弦里的一个音 / X / 0 / 横线）：at = 它的锚点放在哪（默认原点）。核要在贴东西之前放完。 */
  core(part: Part, at?: { x: number; y: number }): void;
  /** 贴在这一边现在的边缘外面；回它落在哪（墨迹框，相对这一列的原点）。贴完这一边往外长，别的边不动。 */
  attach(side: Side, part: Part, o: AttachOpts): Ink;
  /** 这一边至少长到 to（成组的东西用：先对齐再贴）。只挪边，不算墨。 */
  reserve(side: Side, to: number): void;
  /** 这一边现在到哪了（含 reserve）。 */
  edge(side: Side): number;
  /** 整个盒子 = 放进来的所有东西的墨迹框之并（不含 reserve 出来的空）。什么都没放 = 原点上的一个点。 */
  box(): Ink;
  /** 画：所有东西的图元，整个盒子平移 (dx, dy)。每次都是新的拷贝，盒子本身不动。 */
  prims(dx: number, dy: number): Prim[];
}

const ORIGIN: Ink = { x0: 0, x1: 0, y0: 0, y1: 0 };
const moved = (k: Ink, dx: number, dy: number): Ink => ({ x0: k.x0 + dx, x1: k.x1 + dx, y0: k.y0 + dy, y1: k.y1 + dy });
const union = (a: Ink | null, b: Ink): Ink => (a ? { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) } : { ...b });

export function cell(): Cell {
  const placed: { part: Part; dx: number; dy: number }[] = [];
  let coreBox: Ink | null = null, all: Ink | null = null, attached = false;
  const edges = { above: 0, below: 0, left: 0, right: 0 };
  const put = (part: Part, dx: number, dy: number): Ink => { placed.push({ part, dx, dy }); const k = moved(part.ink, dx, dy); all = union(all, k); return k; };
  /** 另一个方向上的位置：给了 cross 就是它；不然按核的框对齐（没有核 = 原点）。 */
  const crossOf = (lo: number, hi: number, kLo: number, kHi: number, o: AttachOpts): number => {
    if (o.cross !== undefined) return o.cross;
    const a = o.align ?? "center";
    return a === "start" ? lo - kLo : a === "end" ? hi - kHi : (lo + hi) / 2 - (kLo + kHi) / 2;
  };
  return {
    core(part, at = { x: 0, y: 0 }) {
      if (attached) throw new Error("cell: place every core before attaching");   // 核要在贴东西之前放完
      const k = put(part, at.x, at.y);
      coreBox = union(coreBox, k);
      edges.above = coreBox.y0; edges.below = coreBox.y1; edges.left = coreBox.x0; edges.right = coreBox.x1;
    },
    attach(side, part, o) {
      attached = true;
      const c = coreBox ?? ORIGIN, k = part.ink;
      let dx: number, dy: number;
      if (side === "above" || side === "below") {
        dx = crossOf(c.x0, c.x1, k.x0, k.x1, o);
        dy = side === "above" ? edges.above - o.gap - k.y1 : edges.below + o.gap - k.y0;
      } else {
        dy = crossOf(c.y0, c.y1, k.y0, k.y1, o);
        dx = side === "left" ? edges.left - o.gap - k.x1 : edges.right + o.gap - k.x0;
      }
      const got = put(part, dx, dy);
      if (side === "above") edges.above = Math.min(edges.above, got.y0);
      else if (side === "below") edges.below = Math.max(edges.below, got.y1);
      else if (side === "left") edges.left = Math.min(edges.left, got.x0);
      else edges.right = Math.max(edges.right, got.x1);
      return got;
    },
    reserve(side, to) {
      if (side === "above" || side === "left") edges[side] = Math.min(edges[side], to);
      else edges[side] = Math.max(edges[side], to);
    },
    edge: (side) => edges[side],
    box: () => ({ ...(all ?? ORIGIN) }),
    prims(dx, dy) {
      const out: Prim[] = [];
      for (const pl of placed) for (const p of pl.part.prims) { const q = { ...p }; movePrim(q, pl.dx + dx, pl.dy + dy); out.push(q); }
      return out;
    },
  };
}
