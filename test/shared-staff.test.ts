// 合租（v0.10.24）：房客挂在主人的谱线上画（ai-docs/20261010-shared-staff-percussion-design.md §1）。created 2026-10-10 by Claude Opus 5.5
// user「合租还是有主人吧」「排序同意」「我的想法就是先做一个看上去大概的…主要就是总览监视用。所以撞一起就撞」「…宁缺误骗」
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { initState, addPart, setPartHost, movePart, removePart, setFocus, headLen, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";

let nid = 9700;
const q = (step = "E", lyric: string | null = null): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: 4 }, dur: TPQ, lyric } as Token);
/** 三位：P1（主人候选）、P2、P3；每位四个四分音符。 */
function trio(): EditorState {
  let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" }); st = addPart(st, { id: "P3", role: "r3", mic: "m3" });
  const pp = st.song.papers[0], tracks = Object.fromEntries(Object.entries(pp.tracks).map(([id, t]) => [id, [...t.slice(0, headLen(t)), q("E", "あ"), q("G"), q("A"), q("C")]]));
  return setFocus({ ...st, song: { ...st.song, papers: [{ ...pp, tracks }] } }, pp.id, st.song.parts[0].id);
}
const ids = (st: EditorState) => st.song.parts.map((p) => `${p.id}${p.host ? `<${p.host}` : ""}`).join(",");
const parts = (st: EditorState) => st.song.parts.map((p, k) => ({ id: p.id, name: `V${k}`, empty: false, first: k === 0, hidden: false, badges: [], mono: false }));
const lay = (st: EditorState) => engrave(st.song, { width: 900, sp: 10, at: st.at, caret: st.caret, sel: st.sel, parts: parts(st), measureLyric: (s: string) => s.length * 10, autoBars: true });

describe("合租：数据", () => {
  it("挂上 = 排到主人那一家最后；挂自己 / 挂房客 / 主人去当房客 = 不动", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id);
    st = setPartHost(st, c, a); eq(ids(st), `${a},${c}<${a},P2`);
    eq(ids(setPartHost(st, "P2", c)), ids(st), "房客不能当主人");
    eq(ids(setPartHost(st, a, "P2")), ids(st), "有房客的不能去当房客");
    eq(ids(setPartHost(st, "P2", "P2")), ids(st), "不能挂自己");
    eq(ids(setPartHost(st, c, null)), `${a},${c},P2`, "搬出来 = 自己一行（位置不动）");
  });
  it("挪主人 = 一家一起挪；房客只在自家里挪；删了主人 = 房客搬出来", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id);
    st = setPartHost(st, c, a);
    eq(ids(movePart(st, a, 1)), `P2,${a},${c}<${a}`, "主人往下 = 一家挪过 P2");
    eq(ids(movePart(st, c, 1)), ids(st), "房客挪出自家 = 不动");
    eq(ids(removePart(st, a)), `${c},P2`, "删了主人：房客没有 host 了");
  });
  it("存进文件再读回来：host 留着；不合规矩的（主人不在）读的时候丢掉", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const o = openBytes("t.mxl", saveMxl({ song: st.song, hum: st.song.hum, extras: emptyExtras(), app: "test", date: "2026-10-10T00:00:00Z" }));
    eq(o.song.parts.find((p) => p.id === c)?.host, a);
    const bad = { ...st.song, parts: st.song.parts.map((p) => (p.id === c ? { ...p, host: "nobody" } : p)) };
    const o2 = openBytes("t.mxl", saveMxl({ song: bad, hum: bad.hum, extras: emptyExtras(), app: "test", date: "2026-10-10T00:00:00Z" }));
    eq(o2.song.parts.find((p) => p.id === c)?.host, undefined, "主人不在 = 读的时候丢掉 host");
  });
});

describe("合租：排版（看个大概）", () => {
  it("房客不占自己的谱行；它的音画在主人那一行上；不进点击区、不画歌词；主人名字下面写房客的名字、各自能点；叠起来的那一行只读", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = setFocus(st, st.song.papers[0].id, "P2");   // 光标在别人那儿（一家里有谁在写 = 整家拆开）
    const L0 = lay(trio()), L = lay(st);
    assert(!L.systems.some((r) => r.part === c), "房客没有自己的谱行");
    assert(L.systems.length < L0.systems.length, `谱行少了：${L0.systems.length} → ${L.systems.length}`);
    const hostRows = new Set(L.systems.map((r, i) => (r.part === a ? i : -1)).filter((i) => i >= 0));
    assert(L.notes.every((h) => L.systems[h.system].part !== c), "点击区里没有房客的音");
    const heads = L.prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note"));
    const heads0 = L0.prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note"));
    eq(heads.length, heads0.length, "符头一个不少（房客的画到主人那行上了）");
    assert(L.parts.some((h) => h.part === c) && hostRows.size > 0, "房客的名字能点");
    assert(L.sharedRows.length > 0 && L.sharedRows.every((i) => L.systems[i].part === a), "叠起来的那几行（主人的）标成只读");
  });
  it("光标在主人上 = 整家拆开（v0.10.25，user「host也应该只读，只有展开时才能编辑」）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const L = lay(setFocus(st, st.song.papers[0].id, a));
    assert(L.systems.some((r) => r.part === c) && L.sharedRows.length === 0, "主人在写 = 房客也拆开、没有只读行");
  });
  it("房客的低音也算进这一行的高度和墨的上下沿（v0.10.26：播放的灰块不再切掉它们、不压到下一行）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const pp = st.song.papers[0], low: Token = { kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 2 }, dur: TPQ, lyric: null } as Token;
    st = { ...st, song: { ...st.song, papers: [{ ...pp, tracks: { ...pp.tracks, [c]: [...pp.tracks[c].slice(0, headLen(pp.tracks[c])), low] } }] } };
    st = setFocus(st, pp.id, "P2");
    const L = lay(st), hi = L.systems.findIndex((r) => r.part === a), row = L.systems[hi];
    // 高音谱号：E4 = 第一线（staffTop + 4sp）；C2 再低 16 级 = 8sp
    const want = row.staffTop + 12 * L.sp, head = L.prims.find((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note") && Math.abs((p as { y: number }).y - want) < L.sp * 0.3) as { y: number } | undefined;
    assert(!!head, "房客的 C2 画在主人那一行的谱下面 8sp");
    const lowest = head!.y;
    assert(row.inkBottom! >= lowest + L.sp * 0.4, `墨的下沿（${row.inkBottom}）盖住最低的符头（${lowest}）`);
    assert(row.bottom >= lowest + L.sp * 0.4, `行高也让开了（不压到下一行）：bottom ${row.bottom} 最低符头 ${lowest}`);
  });
  it("现在在写的是房客 = 它拆开（有自己的谱行、能点）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = setFocus(st, st.song.papers[0].id, c);
    const L = lay(st);
    assert(L.systems.some((r) => r.part === c) && L.notes.some((h) => L.systems[h.system].part === c), "拆开：有谱行、音能点");
  });
});
