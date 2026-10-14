// overlay.test.ts —— 盖层登记（src/app/overlay.ts）：一次一层；晚到的 close 不误清。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { createOverlayRegistry, padLocked } from "../src/app/overlay.ts";

describe("盖层登记（I2 一次一层）", () => {
  it("开新的 = 旧的先关一次；is / overlay 跟着", () => {
    const ui = createOverlayRegistry(); let a = 0, b = 0;
    const A = { k: "menu" as const, close: () => { a++; ui.closed(A.close); } }, B = { k: "sheet" as const, close: () => { b++; ui.closed(B.close); } };
    ui.open(A); assert(ui.is("menu") && ui.overlay === A, "A 开着");
    ui.open(B); eq(a, 1); eq(b, 0); assert(ui.is("sheet") && ui.overlay === B, "B 开着、A 关过一次");
    ui.close(); eq(b, 1); eq(ui.overlay, null);
    ui.close(); eq(b, 1, "没开着 = 什么都不做");
  });
  it("晚到的 close（已经被顶掉的那层）不会清掉后来开的", () => {
    const ui = createOverlayRegistry();
    const A = { k: "menu" as const, close: () => ui.closed(A.close) }, B = { k: "card" as const, close: () => ui.closed(B.close) };
    ui.open(A); ui.open(B);
    A.close();   // 比如 A 的「点外面」监听晚了一拍才跑
    assert(ui.overlay === B, "B 还开着");
    B.close(); eq(ui.overlay, null);
  });
  it("旧层的 close 里再开一层（关了菜单接着开面板）= 新的留下", () => {
    const ui = createOverlayRegistry();
    const S = { k: "sheet" as const, close: () => ui.closed(S.close) };
    const M = { k: "menu" as const, close: () => { ui.closed(M.close); ui.open(S); } };
    ui.open(M); ui.close();
    assert(ui.overlay === S, "面板开着");
  });
  it("page：默认在谱上；乐器页 / 目录 = pad 锁住（只弹不写）；目录带 playOnly / backToInst", () => {
    const ui = createOverlayRegistry();
    eq(ui.page.k, "score"); eq(padLocked(ui.page), false);
    ui.setPage({ k: "inst" }); assert(padLocked(ui.page), "乐器页 = 锁");
    ui.setPage({ k: "finder", playOnly: true, backToInst: false }); assert(padLocked(ui.page) && ui.page.k === "finder" && ui.page.playOnly, "目录 = 锁 + 只弹着玩");
    ui.setPage({ k: "score" }); eq(padLocked(ui.page), false);
  });
  it("redraw：开着的那层有 redraw 就调它；没有 / 关了 = 什么都不做", () => {
    const ui = createOverlayRegistry(); let n = 0;
    ui.redraw();
    const C = { k: "card" as const, close: () => ui.closed(C.close), redraw: () => { n++; } };
    ui.open(C); ui.redraw(); eq(n, 1);
    ui.close(); ui.redraw(); eq(n, 1);
  });
});

