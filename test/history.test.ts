// 撤销 / 重做（纯函数）。created 2026-10-08 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { initState, writeDegree, writeRest, tr } from "../src/score/song.ts";
import { emptyHistory, record, undo, redo, LIMIT } from "../src/score/history.ts";

describe("history（undo / redo）", () => {
  it("写三个音 → 撤两步 → 重做一步", () => {
    let h = emptyHistory(), st = initState();
    for (const d of [1, 2, 3]) { const next = writeDegree(st, d, "near"); h = record(h, st, null, 1000 + d); st = next; }
    eq(tr(st).length, 6); eq(h.past.length, 3);
    let r = undo(h, st)!; h = r.h; st = r.st; eq(tr(st).length, 5);
    r = undo(h, st)!; h = r.h; st = r.st; eq(tr(st).length, 4); eq(h.future.length, 2);
    r = redo(h, st)!; h = r.h; st = r.st; eq(tr(st).length, 5); eq(h.past.length, 2); eq(h.future.length, 1);
    eq(st.caret, 5, "光标跟着快照回来");
  });
  it("没有可撤的 = null；新的一步清掉 future", () => {
    let h = emptyHistory(), st = initState();
    eq(undo(h, st), null); eq(redo(h, st), null);
    const a = writeDegree(st, 1, "near"); h = record(h, st, null, 1); st = a;
    const r = undo(h, st)!; h = r.h; st = r.st; eq(h.future.length, 1);
    const b = writeRest(st); h = record(h, st, null, 2); st = b; eq(h.future.length, 0, "分叉了：重做没了");
  });
  it("同一个 gesture 1.5 s 内连着来 = 一步（拖 / 连打歌词）", () => {
    let h = emptyHistory(), st = initState();
    st = writeDegree(st, 1, "near");   // 不记：当起点
    for (let k = 0; k < 5; k++) { const next = writeDegree(st, 2 + k, "near"); h = record(h, st, "drag", 1000 + k * 100); st = next; }
    eq(h.past.length, 1, "五次拖 = 一步");
    const far = writeDegree(st, 7, "near"); h = record(h, st, "drag", 1000 + 5000); st = far;
    eq(h.past.length, 2, "隔久了 = 新的一步");
    const r = undo(h, st)!; eq(tr(r.st).length, tr(st).length - 1, "撤回最后那一步");
    const r2 = undo(r.h, r.st)!; eq(tr(r2.st).length, 4, "再撤 = 五次拖一起回去");
  });
  it("上限 LIMIT 步，超了丢最旧的", () => {
    let h = emptyHistory(), st = initState();
    for (let k = 0; k < LIMIT + 10; k++) { const next = writeRest(st); h = record(h, st, null, k); st = next; }
    eq(h.past.length, LIMIT);
  });
});
