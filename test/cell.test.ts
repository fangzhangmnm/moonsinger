// 一个音的盒子（frame/cell.ts，第八刀 8-1）：纯几何。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
import { describe, it, eq, assert } from "./runner.mjs";
import { cell, type Part, type Ink } from "../src/render/frame/cell.ts";
import { movePrim } from "../src/render/skyline.ts";
import type { Prim } from "../src/render/engrave.ts";

/** 一个方块东西：墨迹框 = 自己的锚点往右 w、往上 h（锚点 = 左下角，像字的基线起点），图元一个 rect 正好盖住墨迹。 */
const box = (w: number, h: number): Part => ({ ink: { x0: 0, x1: w, y0: -h, y1: 0 }, prims: [{ t: "rect", x: 0, y: -h, w, h }] });
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const eqn = (a: number, b: number, what = "") => assert(near(a, b), `${what}：期望 ${b}，实得 ${a}`);
const same = (a: Ink, b: Ink, what: string) => assert(near(a.x0, b.x0) && near(a.x1, b.x1) && near(a.y0, b.y0) && near(a.y1, b.y1), `${what}：${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

describe("一个音的盒子（frame/cell.ts）", () => {
  it("核放在原点；往上贴的第一个离核的顶 gap、第二个离第一个的顶 gap（排队往外让）", () => {
    const c = cell();
    c.core(box(2, 3));                                   // 核：x 0–2，y −3–0
    const a = c.attach("above", box(1, 0.5), { gap: 0.2 });   // 居中、底边在 −3.2
    same(a, { x0: 0.5, x1: 1.5, y0: -3.7, y1: -3.2 }, "第一个");
    const b = c.attach("above", box(1, 0.5), { gap: 0.1 });
    same(b, { x0: 0.5, x1: 1.5, y0: -4.3, y1: -3.8 }, "第二个贴在第一个上面");
    eqn(c.edge("above"), -4.3, "上边长到第二个的顶");
    eq(c.edge("below"), 0, "下边没动"); eq(c.edge("left"), 0, "左边没动"); eq(c.edge("right"), 2, "右边没动");
  });
  it("四个边各长各的：往左贴的不挪上边（左上角的升降号不把上面的跳音顶高）", () => {
    const c = cell();
    c.core(box(2, 3));
    const acc = c.attach("left", { ink: { x0: 0, x1: 0.8, y0: -4, y1: -2 }, prims: [] }, { gap: 0.1, align: "start" });   // 顶齐：比核高出 1
    same(acc, { x0: -0.9, x1: -0.1, y0: -3, y1: -1 }, "左边：右边离核 0.1、顶和核的顶齐");
    eq(c.edge("above"), -3, "上边还是核的顶");
    const arp = c.attach("left", box(0.5, 3), { gap: 0.2 });
    eqn(arp.x1, -1.1, "第二个往左让到第一个外面"); eqn(c.edge("left"), -1.6);
    same(c.box(), { x0: -1.6, x1: 2, y0: -3, y1: 0 }, "整个盒子");
  });
  it("对齐：start / end / center，cross 直接给另一个方向的位置", () => {
    const c = cell(); c.core(box(4, 2));
    eq(c.attach("below", box(1, 1), { gap: 0, align: "start" }).x0, 0, "下面左齐");
    eq(c.attach("below", box(1, 1), { gap: 0, align: "end" }).x1, 4, "下面右齐");
    const r = c.attach("right", box(0.3, 0.3), { gap: 0.1, cross: -0.75 });   // 附点：在基线上多高由字形表定
    same(r, { x0: 4.1, x1: 4.4, y0: -1.05, y1: -0.75 }, "cross = 锚点的 y");
    const r2 = c.attach("right", box(0.5, 1), { gap: 0, align: "end" });
    eqn(r2.x0, 4.4, "右边接着往外"); eq(r2.y1, 0, "底齐");
  });
  it("成组的：先 reserve 把这一边对齐到组里最远的，再贴；reserve 不算墨", () => {
    const c = cell(); c.core(box(1, 2));
    c.reserve("below", 0.8);
    eq(c.edge("below"), 0.8);
    same(c.box(), { x0: 0, x1: 1, y0: -2, y1: 0 }, "reserve 的空不进 box");
    const ul = c.attach("below", { ink: { x0: 0, x1: 1, y0: -0.05, y1: 0.05 }, prims: [] }, { gap: 0.3 });
    eqn(ul.y0, 1.1, "贴在对齐后的边外面");
    c.reserve("below", 0.2); eqn(c.edge("below"), 1.2, "reserve 只往外，不往回收");
  });
  it("和弦：核放几次，盒子是它们的并；往上贴的贴在最高那个外面", () => {
    const c = cell();
    c.core(box(1, 2)); c.core(box(1, 2), { x: 0, y: -2.5 });
    same(c.box(), { x0: 0, x1: 1, y0: -4.5, y1: 0 }, "两个核");
    eqn(c.attach("above", box(0.4, 0.4), { gap: 0.2 }).y1, -4.7);
  });
  it("核要先放完：贴过东西再放核 = 报错", () => {
    const c = cell(); c.core(box(1, 1)); c.attach("right", box(1, 1), { gap: 0 });
    let threw = false; try { c.core(box(1, 1)); } catch { threw = true; }
    assert(threw, "该报错");
  });
  it("画：图元整块平移到位，每次是新的拷贝（盒子本身和原来的 Part 都不动）", () => {
    const part: Part = { ink: { x0: 0, x1: 1, y0: -1, y1: 0 }, prims: [{ t: "text", x: 0, y: 0, s: "5" }, { t: "line", x1: 0, y1: 0, x2: 1, y2: 0, w: 0.1 }, { t: "path", d: "M0,0L1,-1Q2,-2 3,-3" }] };
    const c = cell(); c.core(part, { x: 1, y: 2 });
    const a = c.prims(10, 20), b = c.prims(10, 20);
    eq(a.length, 3); assert(a[0] !== b[0], "两次是两份");
    const t = a[0] as Extract<Prim, { t: "text" }>; eq(t.x, 11); eq(t.y, 22);
    const l = a[1] as Extract<Prim, { t: "line" }>; eq([l.x1, l.y1, l.x2, l.y2].join(" "), "11 22 12 22");
    eq((a[2] as Extract<Prim, { t: "path" }>).d, "M11,22L12,21Q13,20 14,19");
    eq((part.prims[0] as Extract<Prim, { t: "text" }>).x, 0, "原来的 Part 没被改");
  });
  it("movePrim：路径里负数、小数、科学计数法的 x 和 y 都挪", () => {
    const p: Prim = { t: "path", d: "M-1.5,2e-3L.5,-0.25C1,1 2,2 3,3Z" };
    movePrim(p, 1, 1);
    eq((p as Extract<Prim, { t: "path" }>).d, "M-0.5,1.002L1.5,0.75C2,2 3,3 4,4Z");
  });
});
