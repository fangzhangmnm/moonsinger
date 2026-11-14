// 谱面「谁亮框、谁能拖」（src/ui/press-rules.ts；选中规则单行这一版，设计稿第一节 user 同意的表）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：表上那几格——亮着框的才拖得动；没亮框的和空白一样（鼠标 / 笔拉框、手指滚动）；手指直接拖永远是滚动、亮着的用把手；锁着能亮不能拖；点空白取消。
import { describe, it, eq } from "./runner.mjs";
import { isLit, onMove, onTap, wantsGrip, type Pointer, type Target } from "../src/ui/press-rules.ts";

const P: Pointer[] = ["mouse", "pen", "touch"];

describe("谁亮框、谁能拖（press-rules）", () => {
  it("亮框三种来源：点亮的、选区里的、鼠标悬浮的（笔和手指没有悬浮）", () => {
    for (const pointer of P) {
      eq(isLit({ pointer, sticky: true, inSel: false, hovered: false }), true, `${pointer} 点亮的`);
      eq(isLit({ pointer, sticky: false, inSel: true, hovered: false }), true, `${pointer} 选区里`);
      eq(isLit({ pointer, sticky: false, inSel: false, hovered: false }), false, `${pointer} 什么都没有`);
    }
    eq(isLit({ pointer: "mouse", sticky: false, inSel: false, hovered: true }), true);
    eq(isLit({ pointer: "pen", sticky: false, inSel: false, hovered: true }), false);
    eq(isLit({ pointer: "touch", sticky: false, inSel: false, hovered: true }), false);
  });

  it("亮着框的才拖得动：音 = 拖，记号 = 拿起来挪（鼠标、笔）", () => {
    for (const pointer of ["mouse", "pen"] as Pointer[]) {
      eq(onMove({ pointer, target: "note", lit: true, canDrag: true }), "drag");
      eq(onMove({ pointer, target: "mark", lit: true, canDrag: true }), "lift");
    }
  });

  it("没亮框的东西 = 和空白一样：鼠标、笔拉框", () => {
    for (const pointer of ["mouse", "pen"] as Pointer[]) for (const target of ["note", "mark", "art", "blank"] as Target[]) {
      eq(onMove({ pointer, target, lit: false, canDrag: true }), "box", `${pointer} ${target}`);
    }
    eq(onMove({ pointer: "pen", target: "art", lit: true, canDrag: true }), "box", "演奏法拖不动");
  });

  it("手指直接在谱上拖 = 滚动，亮着的也一样（拖把手才动）", () => {
    for (const target of ["note", "mark", "art", "blank"] as Target[]) for (const lit of [true, false]) {
      eq(onMove({ pointer: "touch", target, lit, canDrag: true }), "scroll", `${target} lit=${lit}`);
    }
    eq(wantsGrip({ pointer: "touch", target: "note", canDrag: true }), true);
    eq(wantsGrip({ pointer: "touch", target: "mark", canDrag: true }), true);
    eq(wantsGrip({ pointer: "touch", target: "art", canDrag: true }), false, "演奏法没有把手");
    eq(wantsGrip({ pointer: "mouse", target: "note", canDrag: true }), false, "鼠标直接拖，不要把手");
    eq(wantsGrip({ pointer: "pen", target: "note", canDrag: true }), false, "笔直接拖，不要把手");
  });

  it("锁着（或「词」「听」这类不拖音的模式）：能亮框，拖不动，也没有把手", () => {
    for (const pointer of P) {
      eq(onMove({ pointer, target: "note", lit: true, canDrag: false }), pointer === "touch" ? "scroll" : "box");
      eq(wantsGrip({ pointer, target: "note", canDrag: false }), false);
    }
    eq(onTap({ target: "note", lit: false }), "light", "锁着照样点亮");
  });

  it("轻点：音 / 演奏法 = 亮框；记号先亮框、亮着再点 = 小菜单；空白 = 取消、放光标", () => {
    eq(onTap({ target: "note", lit: false }), "light");
    eq(onTap({ target: "note", lit: true }), "light", "点亮着的音还是亮着、光标到它后面");
    eq(onTap({ target: "art", lit: false }), "light");
    eq(onTap({ target: "mark", lit: false }), "light");
    eq(onTap({ target: "mark", lit: true }), "menu");
    eq(onTap({ target: "blank", lit: false }), "caret");
  });
});
