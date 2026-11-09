// duplicate-paper.test.ts —— 复制曲段（v0.16.61，user 11-09「需要加一个duplicate曲段的功能」）。created 2026-11-09 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, addPaper, duplicatePaper, tr, setFocus, type Token } from "../src/score/song.ts";
import { emptyHistory, record, undo } from "../src/score/history.ts";
import { emptyExtras } from "../src/format/project.ts";

const strip = (t: Token[]) => JSON.stringify(t.map(({ id: _id, ...rest }) => rest));
describe("复制曲段", () => {
  it("整张纸照抄一份接在后面：内容一样、编号全歌不重复、名字加副本、光标到新纸", () => {
    let st = initState(); for (const d of [1, 3, 5]) st = writeDegree(st, d, "near");
    st = addPaper(st); for (const d of [2, 4]) st = writeDegree(st, d, "near");
    st = setFocus(st, st.song.papers[0]!.id, st.at.part);
    const A = st.song.papers[0]!, n0 = st.song.papers.length;
    const d = duplicatePaper(st, A.id, `${A.name} 副本`);
    eq(d.song.papers.length, n0 + 1);
    const C = d.song.papers[1]!;
    eq(C.name, `${A.name} 副本`); assert(C.id !== A.id, "新纸有自己的 id");
    eq(d.song.papers[2]!.id, st.song.papers[1]!.id, "原来的第二张往后挪一位");
    for (const pid of Object.keys(A.tracks)) eq(strip(C.tracks[pid]!), strip(A.tracks[pid]!), `声部 ${pid} 内容一样`);
    const ids = d.song.papers.flatMap((p) => Object.values(p.tracks).flat().map((t) => t.id));
    eq(new Set(ids).size, ids.length, "全歌编号不重复");
    assert(d.nextId > Math.max(...ids), "nextId 在所有编号之后");
    eq(d.at.paper, C.id, "光标跳到新纸");
    eq(tr(d).filter((t) => t.kind === "note").length, 3);
  });
  it("撤销一步 = 回到复制之前", () => {
    let st = initState(); for (const d of [1, 2]) st = writeDegree(st, d, "near");
    const ex = emptyExtras(); let h = emptyHistory();
    const next = duplicatePaper(st, st.song.papers[0]!.id, "A 副本"); h = record(h, st, ex, null, 1000, { kind: "score", label: "x" });
    const back = undo(h, next, ex);
    assert(!!back && back.st.song.papers.length === 1, "撤回去只剩一张");
  });
  it("找不到这张纸 = 原样", () => { const st = initState(); eq(duplicatePaper(st, "nope", "x"), st); });
});
