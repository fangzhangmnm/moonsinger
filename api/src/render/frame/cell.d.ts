import type { Prim } from "../engrave.ts";
export type Side = "above" | "below" | "left" | "right";
/** 墨迹框（相对它自己的锚点；放进盒子之后相对这一列的原点）。 */
export interface Ink {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}
/** 一样东西：自己的墨迹框 + 图元（原点在它自己的锚点）。 */
export interface Part {
    ink: Ink;
    prims: Prim[];
}
/** 贴的时候：离这一边现在的边缘多远（gap）；另一个方向怎么对齐——
 *  align（默认 center）对的是核的框：贴上 / 下时 start = 左边齐、end = 右边齐；贴左 / 右时 start = 顶齐、end = 底齐。
 *  cross = 另一个方向直接给锚点的位置（字形表里本来就定了高度的，如附点在基线上多高；给了就不看 align）。
 *  （钉住的接口里没有 cross：实现时加的，施工单第 8 节已回写。）
 *  from = 不贴这一边现在的边缘，贴这个位置（它自己那一小块墨的边）：和弦里每个音的升降号贴它自己那个数字的墨，不贴整摞里最靠外的那个（8-7，墨和占位宽分开）。
 *  这一边照样往外长（后面再贴的东西在它外面）。 */
export interface AttachOpts {
    gap: number;
    align?: "center" | "start" | "end";
    cross?: number;
    from?: number;
}
export interface Cell {
    /** 放一个核（数字 / 字母 / 和弦里的一个音 / X / 0 / 横线）：at = 它的锚点放在哪（默认原点）。核要在贴东西之前放完。 */
    core(part: Part, at?: {
        x: number;
        y: number;
    }): void;
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
export declare function cell(): Cell;
