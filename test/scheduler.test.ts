// 慢引擎块的调度（src/engine/scheduler.ts）：播放头所在的先、往后按距离、循环绕回、已有的不算；预卷几块。created 2026-10-09 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { chunkOrder, readyToStart, prerollCount } from "../src/engine/scheduler.ts";

const C = [{ key: "a", t0: 0, dur: 3 }, { key: "b", t0: 3, dur: 3 }, { key: "c", t0: 6, dur: 3 }, { key: "d", t0: 9, dur: 3 }];
const none = () => false;
describe("调度器", () => {
  it("从中间起：站在上面的先、再往后、最后前面的", () => { eq(chunkOrder(C, 4, null, none).join(""), "bcda"); });
  it("循环：到尾绕回循环头", () => { eq(chunkOrder(C, 7, { from: 3, to: 12 }, none).join(""), "cdba"); });
  it("已经有的不排；重复键只排一次", () => { eq(chunkOrder([...C, { key: "b", t0: 20, dur: 1 }], 0, null, (k) => k === "a").join(""), "bcd"); });
  it("预卷：前 n 块到齐才算好", () => {
    eq(readyToStart(C, 4, 2, (k) => k === "b"), false); eq(readyToStart(C, 4, 2, (k) => k === "b" || k === "c"), true);
    eq(readyToStart(C, 11, 2, (k) => k === "d"), true, "尾上只剩一块 = 齐了");
    eq(readyToStart([], 0, 2, none), true, "没有块 = 齐了");
  });
  it("预卷几块按速度：快 2、中 3、慢 4、没量过 2", () => { eq(prerollCount(null), 2); eq(prerollCount(150), 2); eq(prerollCount(600), 3); eq(prerollCount(1500), 4); });
});
