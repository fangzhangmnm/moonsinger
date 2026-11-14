// 鼠标、笔、手指同一件事各怎么做（src/ui/pointer.ts 能力表 + src/ui/press-rules.ts 的结论 + src/ui/menu-place.ts 菜单躲开选区）。created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟）。
// 设计 = ai-docs/20261114-pointer-rules-design.md：第三节四件物理上的事、第四节「同一件事各怎么做」、第二节这一版的规矩（选中不弹菜单、手指和笔用选区旁的小钮、鼠标右键、菜单不盖选区）。
// 写成表：每一行 = 一格，「想做的事 · 指针 · 期望」。改规矩 = 改表里那一行。
import { describe, it, eq } from "./runner.mjs";
import { caps, pointerOf, lastPointer, notePointer, type Pointer } from "../src/ui/pointer.ts";
import { isLit, onMove, onTap, onHold, onSecondary, wantsGrip, wantsSelButton, type Target } from "../src/ui/press-rules.ts";
import { placeMenu } from "../src/ui/menu-place.ts";

const P: Pointer[] = ["mouse", "pen", "touch"];
const same = (a: unknown, b: unknown) => eq(JSON.stringify(a), JSON.stringify(b));   // 按值比（runner 的 eq 是 ===）

describe("三种指针的四件物理上的事（pointer.ts caps，设计稿第三节）", () => {
  const rows: [string, keyof ReturnType<typeof caps>, [boolean, boolean, boolean]][] = [
    //                                    鼠标   笔     手指
    ["悬停", "hover", [true, false, false]],
    ["第二个键", "secondary", [true, false, false]],
    ["滚轮", "wheel", [true, false, false]],
    ["在谱上拖 = 滚动屏幕", "dragScrolls", [false, false, true]],
    ["粗", "coarse", [false, false, true]],
    ["会带出系统键盘", "softKeyboard", [false, true, true]],
  ];
  for (const [what, k, want] of rows) it(what, () => { P.forEach((p, i) => eq(caps(p)[k], want[i], `${what} · ${p}`)); });
  it("认指针：只看 pointerType；报不出来的当鼠标", () => {
    eq(pointerOf({ pointerType: "touch" }), "touch"); eq(pointerOf({ pointerType: "pen" }), "pen");
    eq(pointerOf({ pointerType: "mouse" }), "mouse"); eq(pointerOf({ pointerType: "" }), "mouse");
  });
  it("最近一下是哪种：记下来的那一下", () => {
    notePointer({ pointerType: "pen" }); eq(lastPointer(), "pen");
    notePointer({ pointerType: "mouse" }); eq(lastPointer(), "mouse");
  });
});

describe("同一件事各怎么做（press-rules，设计稿第四节 + 第二节）", () => {
  type Row = [string, Pointer, () => unknown, unknown];
  const rows: Row[] = [
    // 看一样东西是什么：鼠标悬停就亮框；笔和手指没有悬停（点一下才亮）
    ["悬停亮框", "mouse", () => isLit({ pointer: "mouse", sticky: false, inSel: false, hovered: true }), true],
    ["悬停亮框", "pen", () => isLit({ pointer: "pen", sticky: false, inSel: false, hovered: true }), false],
    ["悬停亮框", "touch", () => isLit({ pointer: "touch", sticky: false, inSel: false, hovered: true }), false],
    // 选中一个音 / 休止：三种都是点一下（亮框；落到哪由 song.ts tapTimed 定）
    ["点一下音", "mouse", () => onTap({ target: "note", lit: false }), "light"],
    // 长按音 / 休止 = 选中它，和点一下一样，不开菜单（三种指针一样；onHold 不看指针）
    ["长按没选中的音", "touch", () => onHold({ target: "note", inSel: false }), "select"],
    ["长按已经选中的音 = 不变", "touch", () => onHold({ target: "note", inSel: true }), "keep"],
    ["长按演奏法 = 和点一下一样", "pen", () => onHold({ target: "art", inSel: false }), "light"],
    ["长按记号 = 它的小菜单", "touch", () => onHold({ target: "mark", inSel: false }), "menu"],
    ["长按空白 = 空白菜单", "touch", () => onHold({ target: "blank", inSel: false }), "blankMenu"],
    // 改音高、挪记号：鼠标、笔亮着框的直接拖；手指拖 = 滚动，拖框边的把手
    ["拖亮着的音", "mouse", () => onMove({ pointer: "mouse", target: "note", lit: true, canDrag: true }), "drag"],
    ["拖亮着的音", "pen", () => onMove({ pointer: "pen", target: "note", lit: true, canDrag: true }), "drag"],
    ["拖亮着的音", "touch", () => onMove({ pointer: "touch", target: "note", lit: true, canDrag: true }), "scroll"],
    ["拖亮着的记号", "pen", () => onMove({ pointer: "pen", target: "mark", lit: true, canDrag: true }), "lift"],
    ["亮着的音旁出把手", "touch", () => wantsGrip({ pointer: "touch", target: "note", canDrag: true }), true],
    ["亮着的音旁出把手", "pen", () => wantsGrip({ pointer: "pen", target: "note", canDrag: true }), false],
    // 拉框选一段：鼠标、笔从空白按下拖；手指没有（拖 = 滚动）
    ["空白处按下拖", "mouse", () => onMove({ pointer: "mouse", target: "blank", lit: false, canDrag: true }), "box"],
    ["空白处按下拖", "pen", () => onMove({ pointer: "pen", target: "blank", lit: false, canDrag: true }), "box"],
    ["空白处按下拖", "touch", () => onMove({ pointer: "touch", target: "blank", lit: false, canDrag: true }), "scroll"],
    // 菜单：音 / 选区——鼠标右键（不在选区里先选中它）；笔和手指点选区旁的小钮
    ["右键没选中的音", "mouse", () => onSecondary({ target: "note", inSel: false }), "selectMenu"],
    ["右键选区里的音", "mouse", () => onSecondary({ target: "note", inSel: true }), "menu"],
    ["右键记号", "mouse", () => onSecondary({ target: "mark", inSel: false }), "markMenu"],
    ["右键空白", "mouse", () => onSecondary({ target: "blank", inSel: false }), "blankMenu"],
    ["有选区：画小钮", "mouse", () => wantsSelButton({ pointer: "mouse", hasSel: true, edit: true }), false],
    ["有选区：画小钮", "pen", () => wantsSelButton({ pointer: "pen", hasSel: true, edit: true }), true],
    ["有选区：画小钮", "touch", () => wantsSelButton({ pointer: "touch", hasSel: true, edit: true }), true],
    ["没选区：不画小钮", "touch", () => wantsSelButton({ pointer: "touch", hasSel: false, edit: true }), false],
    ["「听」里：不画小钮", "touch", () => wantsSelButton({ pointer: "touch", hasSel: true, edit: false }), false],
    // 菜单：记号——点亮再点（鼠标悬浮着就算亮着 = 一下就开）
    ["点亮着的记号", "touch", () => onTap({ target: "mark", lit: true }), "menu"],
    ["点没亮的记号", "touch", () => onTap({ target: "mark", lit: false }), "light"],
    // 回到光标接着写：点空白
    ["点空白", "touch", () => onTap({ target: "blank", lit: false }), "caret"],
  ];
  for (const [what, p, f, want] of rows) it(`${what} · ${p}`, () => eq(f(), want));
  it("哪一种长按都不开选区菜单：onHold 对音 / 休止只会给 select / keep", () => {
    for (const inSel of [true, false]) eq(["select", "keep"].includes(onHold({ target: "note" as Target, inSel })), true);
  });
});

describe("菜单不盖选区的带子（menu-place，设计稿第二节第 5 条）：下面 → 上面 → 左右 → 都放不下才盖", () => {
  const view = { w: 1000, h: 800 }, size = { w: 200, h: 150 };
  const band = { left: 300, top: 300, right: 500, bottom: 360 };
  const over = (q: { x: number; y: number }, r: typeof band) => q.x < r.right && q.x + size.w > r.left && q.y < r.bottom && q.y + size.h > r.top;
  it("放得下 = 在带子下面、不盖", () => { const q = placeMenu(size, { x: 480, y: 330 }, [band], view); same([q.y, q.covers, over(q, band)], [368, false, false]); });
  it("下面放不下 = 上面", () => { const b = { ...band, top: 600, bottom: 700 }; const q = placeMenu(size, { x: 480, y: 650 }, [b], view); same([q.y, q.covers, over(q, b)], [442, false, false]); });
  it("上下都放不下 = 右边", () => { const b = { left: 100, top: 100, right: 400, bottom: 700 }; const q = placeMenu(size, { x: 380, y: 300 }, [b], view); same([q.x, q.covers, over(q, b)], [408, false, false]); });
  it("右边也放不下 = 左边", () => { const b = { left: 400, top: 100, right: 900, bottom: 700 }; const q = placeMenu(size, { x: 880, y: 300 }, [b], view); same([q.x, q.covers, over(q, b)], [192, false, false]); });
  it("四面都放不下 = 只好盖着（covers 说出来）", () => { const b = { left: 50, top: 50, right: 950, bottom: 750 }; eq(placeMenu(size, { x: 500, y: 400 }, [b], view).covers, true); });
  it("几行的带子 = 躲开它们合起来的那一块", () => {
    const a = { left: 300, top: 100, right: 600, bottom: 160 }, b = { left: 100, top: 200, right: 400, bottom: 260 };
    const q = placeMenu(size, { x: 580, y: 130 }, [a, b], view); same([q.y, over(q, a), over(q, b)], [268, false, false]);
  });
  it("没有要躲的 / 带子都在窗口外 = 原来的摆法（叫出它的那一点下面）", () => {
    same(placeMenu(size, { x: 100, y: 100 }, [], view), { x: 100, y: 108, covers: false });
    same(placeMenu(size, { x: 100, y: 100 }, [{ left: 0, top: -300, right: 500, bottom: -100 }], view), { x: 100, y: 108, covers: false });
  });
});
