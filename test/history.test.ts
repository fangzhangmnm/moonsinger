// 撤销 / 重做（纯函数）。created 2026-10-08 by Claude Fable 5.1；同日扩到 extras + locus
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, writeRest, tr, addPaper, setTitle } from "../src/score/song.ts";
import { emptyHistory, record, undo, redo, describeSongChange, LIMIT } from "../src/score/history.ts";
import { emptyExtras, withRoleName, withThumbnail } from "../src/format/project.ts";

const L = { kind: "score" as const, label: "x" };
describe("history（undo / redo）", () => {
  it("写三个音 → 撤两步 → 重做一步", () => {
    let h = emptyHistory(), st = initState(); const ex = emptyExtras();
    for (const d of [1, 2, 3]) { const next = writeDegree(st, d, "near"); h = record(h, st, ex, null, 1000 + d, L); st = next; }
    eq(tr(st).length, 6); eq(h.past.length, 3);
    let r = undo(h, st, ex)!; h = r.h; st = r.st; eq(tr(st).length, 5);
    r = undo(h, st, ex)!; h = r.h; st = r.st; eq(tr(st).length, 4); eq(h.future.length, 2);
    r = redo(h, st, ex)!; h = r.h; st = r.st; eq(tr(st).length, 5); eq(h.past.length, 2); eq(h.future.length, 1);
    eq(st.caret, 5, "光标跟着快照回来");
  });
  it("没有可撤的 = null；新的一步清掉 future", () => {
    let h = emptyHistory(), st = initState(); const ex = emptyExtras();
    eq(undo(h, st, ex), null); eq(redo(h, st, ex), null);
    const a = writeDegree(st, 1, "near"); h = record(h, st, ex, null, 1, L); st = a;
    const r = undo(h, st, ex)!; h = r.h; st = r.st; eq(h.future.length, 1);
    const b = writeRest(st); h = record(h, st, ex, null, 2, L); st = b; eq(h.future.length, 0, "分叉了：重做没了");
  });
  it("同一个 gesture 1.5 s 内连着来 = 一步（拖 / 连打歌词）；locus 用最新的那句", () => {
    let h = emptyHistory(), st = initState(); const ex = emptyExtras();
    st = writeDegree(st, 1, "near");   // 不记：当起点
    for (let k = 0; k < 5; k++) { const next = writeDegree(st, 2 + k, "near"); h = record(h, st, ex, "drag", 1000 + k * 100, { kind: "score", label: `第 ${k} 下` }); st = next; }
    eq(h.past.length, 1, "五次拖 = 一步"); eq(h.past[0].locus.label, "第 4 下", "locus 换成最新的");
    const far = writeDegree(st, 7, "near"); h = record(h, st, ex, "drag", 1000 + 5000, L); st = far;
    eq(h.past.length, 2, "隔久了 = 新的一步");
    const r = undo(h, st, ex)!; eq(tr(r.st).length, tr(st).length - 1, "撤回最后那一步");
    const r2 = undo(r.h, r.st, ex)!; eq(tr(r2.st).length, 4, "再撤 = 五次拖一起回去");
  });
  it("上限 LIMIT 步，超了丢最旧的", () => {
    let h = emptyHistory(), st = initState(); const ex = emptyExtras();
    for (let k = 0; k < LIMIT + 10; k++) { const next = writeRest(st); h = record(h, st, ex, null, k, L); st = next; }
    eq(h.past.length, LIMIT);
  });
  it("extras 也在同一条栈里：改角色名 → 撤 → 名字回来、谱没动；重做带回同一个 locus", () => {
    let h = emptyHistory(); const st = initState(); let ex = emptyExtras();
    const role = st.song.parts[0].role;
    const ex2 = withRoleName(ex, role, "二胡", st.song.hum);
    h = record(h, st, ex, null, 1, { kind: "lounge", label: "角色改名：二胡" }); ex = ex2;
    const r = undo(h, st, ex)!; eq(r.extras.lounge[role]?.name ?? undefined, undefined, "撤回去：名字字段没了（原来就没建角色）"); eq(r.st.song, st.song, "谱原样（同一个引用）"); eq(r.locus.label, "角色改名：二胡");
    const r2 = redo(r.h, r.st, r.extras)!; eq(r2.extras.lounge[role]?.name, "二胡", "重做回来"); eq(r2.locus.label, "角色改名：二胡", "重做的 toast 还是这句话");
  });
  it("封面换了也是一步（引用快照，不拷贝字节）", () => {
    let h = emptyHistory(); const st = initState(); const ex = emptyExtras();
    const png = new Uint8Array([1, 2, 3]);
    h = record(h, st, ex, null, 1, { kind: "cover", label: "换封面图" });
    const r = undo(h, st, withThumbnail(ex, png))!; eq(r.extras.thumbnail, null); eq(r.locus.kind, "cover");
    const r2 = redo(r.h, r.st, r.extras)!; assert(r2.extras.thumbnail === png, "重做：还是同一份字节（引用）");
  });
});
describe("describeSongChange（toast 的人话）", () => {
  it("写 / 删 / 加纸 / 改歌名", () => {
    const st = initState();
    eq(describeSongChange(st, writeDegree(st, 1, "near")).label, "写了 1 个");
    const two = writeDegree(writeDegree(st, 1, "near"), 2, "near");
    eq(describeSongChange(two, st).label, "删了 2 个");
    const more = addPaper(st); eq(describeSongChange(st, more).kind, "paper"); eq(describeSongChange(st, more).label, "加了一张纸");
    eq(describeSongChange(st, setTitle(st, "小星星")).label, "改歌名");
    eq(describeSongChange(st, st).label, "改");
  });
});
