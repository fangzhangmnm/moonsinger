// latch.test.ts —— 键盘的锁（src/keyboard/latch.ts）：一条规则的转移表。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { LATCH_OFF, latchDown, latchUp, latchTap, latchWrite, latchCancel, latchOn } from "../src/keyboard/latch.ts";

describe("键盘的锁（Shift 式）", () => {
  it("点一下 = once（管 uses 次）；350 ms 内再点 = lock；再点 = off；过了窗口再点 = off", () => {
    let l = latchTap(LATCH_OFF, 1000); eq(l.mode, "once"); eq(l.left, 1);
    l = latchTap(l, 1200); eq(l.mode, "lock");
    l = latchTap(l, 1300); eq(l.mode, "off");
    l = latchTap(LATCH_OFF, 1000); l = latchTap(l, 1400); eq(l.mode, "off", "350 ms 外再点 = 关");
    eq(latchTap(LATCH_OFF, 0, 2).left, 2, "/2 管两次");
  });
  it("once 写几次用完关；lock 写不完；off 写了还是 off", () => {
    let l = latchTap(LATCH_OFF, 0, 2); l = latchWrite(l); eq(l.mode, "once"); eq(l.left, 1); l = latchWrite(l); eq(l.mode, "off");
    l = latchTap(latchTap(LATCH_OFF, 0), 100); for (let i = 0; i < 5; i++) l = latchWrite(l); eq(l.mode, "lock");
    eq(latchWrite(LATCH_OFF).mode, "off");
  });
  it("按住写 = 松手回去；按住没写 = 松手等于点了一下；锁住时按住写 = 松手还锁着", () => {
    let l = latchDown(LATCH_OFF, 0); eq(l.held, true); eq(l.mode, "once");
    l = latchWrite(l); eq(l.mode, "once", "按着：写了不消耗"); eq(l.wrote, true); l = latchWrite(l); eq(l.left, 1, "按着多写也不消耗");
    l = latchUp(l); eq(l.mode, "off", "松手回去"); eq(l.held, false);
    l = latchUp(latchDown(LATCH_OFF, 0)); eq(l.mode, "once", "按住没写 = 点一下");
    l = latchDown(latchTap(LATCH_OFF, 0), 100); eq(l.mode, "lock"); l = latchWrite(l); l = latchUp(l); eq(l.mode, "lock", "锁住时按住写完松手还锁着");
  });
  it("挪光标 / 拨旋钮 = once 作废，lock 不动；latchOn", () => {
    eq(latchCancel(latchTap(LATCH_OFF, 0)).mode, "off"); eq(latchCancel(latchTap(latchTap(LATCH_OFF, 0), 10)).mode, "lock");
    eq(latchOn(LATCH_OFF), false); eq(latchOn(latchTap(LATCH_OFF, 0)), true);
    eq(latchUp(LATCH_OFF), LATCH_OFF, "没按着松手 = 原样");
  });
});
