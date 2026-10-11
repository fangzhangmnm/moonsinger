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
/** 某位歌手这张纸上换成这几个四分音符（[音名, 八度]）。 */
function withNotes(st: EditorState, part: string, ps: [string, number][]): EditorState {
  const pp = st.song.papers[0], t = pp.tracks[part];
  return { ...st, song: { ...st.song, papers: [{ ...pp, tracks: { ...pp.tracks, [part]: [...t.slice(0, headLen(t)), ...ps.map(([step, octave]) => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave }, dur: TPQ, lyric: null } as Token))] } }] } };
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
  it("叠起来 = 一条虚拟的多声部 track（v0.10.28）：房客没有自己的谱行；同一时刻的音 = 一个和弦、一根符干（不再各画各的打架）；名字都在、各自能点；那一行只读、点击区指虚拟 track", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = withNotes(st, c, [["G", 4], ["B", 4], ["C", 5], ["E", 4]]);   // 房客和主人（E4 G4 A4 C4）不一样的音、每个和弦都在八度以内（跨八度的会劈成两个声部，下一条测）
    st = setFocus(st, st.song.papers[0].id, "P2");   // 光标在别人那儿（一家里有谁在写 = 整家拆开）
    const L = lay(st), pid = st.song.papers[0].id;
    assert(!L.systems.some((r) => r.part === c), "房客没有自己的谱行");
    const hi = L.systems.findIndex((r) => r.part === a), row = L.systems[hi], inRow = (y: number) => y > row.top && y < row.bottom;
    const heads = L.prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note") && inRow((p as { y: number }).y));
    eq(heads.length, 8, "四个和弦、每个两个符头");
    const stems = L.prims.filter((p) => p.t === "line" && Math.abs(p.x1 - p.x2) < 0.01 && Math.abs(p.y2 - p.y1) > 2.5 * L.sp && !["staff", "bar", "ledger", "caret"].some((k) => (p.cls ?? "").includes(k)) && inRow((p.y1 + p.y2) / 2));
    eq(stems.length, 4, "一个和弦一根符干");
    const vt = L.virtual[`${pid}:${a}`]; assert(!!vt, "这一行画的是虚拟 track");
    assert(L.notes.filter((h) => h.system === hi).every((h) => vt[h.index]?.kind === "note"), "点击区的下标指虚拟 track");
    assert(L.parts.some((h) => h.part === c), "房客的名字能点");
    assert(L.sharedRows.length > 0 && L.sharedRows.every((i) => L.systems[i].part === a), "叠起来的那几行（主人的）标成只读");
  });
  it("隔得太远 = 同一张谱上两个声部：上面的符干朝上、下面的朝下（user「隔得太远的音符可以分开来的而不是强行用一根超长的棒子连。以前钢琴家也是这么写的」）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = withNotes(st, a, [["C", 6], ["D", 6], ["E", 6], ["C", 6]]); st = withNotes(st, c, [["C", 4], ["D", 4], ["E", 4], ["C", 4]]);   // 两个八度
    st = setFocus(st, st.song.papers[0].id, "P2");
    const L = lay(st), pid = st.song.papers[0].id, hi = L.systems.findIndex((r) => r.part === a), row = L.systems[hi];
    eq(L.systems.filter((r) => r.part.startsWith(a)).length, 1, "一张谱（两个八度还用不着双手谱）");
    const v2 = `${a}~v2`; assert(!!L.virtual[`${pid}:${v2}`], "劈出了声部 2");
    const up = L.notes.filter((h) => h.system === hi && !h.part), down = L.notes.filter((h) => h.system === hi && h.part === v2);
    eq(up.length, 4); eq(down.length, 4);
    const stemOf = (h: { x: number; y: number }) => L.prims.find((p) => p.t === "line" && Math.abs(p.x1 - p.x2) < 0.01 && p.x1 >= h.x - 1 && p.x1 <= h.x + 2 * L.sp && Math.abs(Math.max(p.y1, p.y2) - Math.min(p.y1, p.y2)) > 2.5 * L.sp && Math.min(Math.abs(p.y1 - h.y), Math.abs(p.y2 - h.y)) < L.sp) as { y1: number; y2: number } | undefined;
    assert(up.every((h) => { const s = stemOf(h); return !!s && Math.min(s.y1, s.y2) < h.y - 2 * L.sp; }), "上面那个声部符干朝上");
    assert(down.every((h) => { const s = stemOf(h); return !!s && Math.max(s.y1, s.y2) > h.y + 2 * L.sp; }), "下面那个声部符干朝下");
    assert(!L.prims.some((p) => p.t === "line" && Math.abs(p.x1 - p.x2) < 0.01 && Math.abs(p.y2 - p.y1) > 7 * L.sp && p.y1 > row.top && p.y2 < row.bottom), "没有一根跨两个八度的长符干");
  });
  it("音域太宽 = 自动双手谱（不存东西）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = withNotes(st, a, [["C", 6], ["D", 6], ["E", 6], ["C", 6]]); st = withNotes(st, c, [["C", 2], ["G", 2], ["E", 2], ["C", 2]]);
    st = setFocus(st, st.song.papers[0].id, "P2");
    const L = lay(st);
    eq(L.systems.filter((r) => (r.part === a || r.part === `${a}~lo`) && r.sys === 0).length, 2, "主人那一位两张谱表（中央 C 以上 / 以下各并一条）");
    assert(L.prims.some((p) => p.t === "path" && p.cls === "brace"), "左边一个花括号");
    eq(st.song.parts.find((p) => p.id === a)!.staves, undefined, "歌里没改");
  });
  it("光标在主人上 = 整家拆开（v0.10.25，user「host也应该只读，只有展开时才能编辑」）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const L = lay(setFocus(st, st.song.papers[0].id, a));
    assert(L.systems.some((r) => r.part === c) && L.sharedRows.length === 0, "主人在写 = 房客也拆开、没有只读行");
  });
  it("叠起来的那几行：每个符头都在它那一行墨的上下沿里（v0.10.26 的灰块；v0.10.28 起低音并到自己那张谱上）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const pp = st.song.papers[0], low: Token = { kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 2 }, dur: TPQ, lyric: null } as Token;
    st = { ...st, song: { ...st.song, papers: [{ ...pp, tracks: { ...pp.tracks, [c]: [...pp.tracks[c].slice(0, headLen(pp.tracks[c])), low] } }] } };
    st = setFocus(st, pp.id, "P2");
    const L = lay(st), rows = L.systems.filter((r) => r.part === a || r.part === `${a}~lo`);
    const heads = L.prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note")) as { y: number }[];
    let n = 0;
    for (const r of rows) for (const h of heads) if (h.y > r.top && h.y < r.bottom) { n++; assert(h.y >= r.inkTop! && h.y <= r.inkBottom! && r.bottom >= h.y + L.sp * 0.4, `符头 ${h.y} 在 [${r.inkTop}, ${r.inkBottom}] 里`); }
    assert(n >= 4, `叠起来的行里有符头（${n}）`);
  });
  it("展开着的一家左边有一条括号（编辑器里才画、点它的区域在 Layout.families）；叠起来 / 导出 = 没有（v0.10.29）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    const ed = (x: EditorState) => engrave(x.song, { width: 900, sp: 10, at: x.at, caret: x.caret, sel: x.sel, parts: parts(x), measureLyric: (s: string) => s.length * 10, autoBars: true, titlePlaceholder: true });
    const open = ed(setFocus(st, st.song.papers[0].id, c));
    eq(open.families.length, 1); eq(open.families[0].host, a);
    assert(open.prims.some((p) => p.t === "path" && p.cls === "family-bracket"), "画了括号");
    eq(ed(setFocus(st, st.song.papers[0].id, "P2")).families.length, 0, "叠起来 = 没有括号");
    eq(lay(setFocus(st, st.song.papers[0].id, c)).families.length, 0, "导出（没有编辑器提示）= 不画");
    eq(engrave(st.song, { width: 900, sp: 10, at: { ...st.at, part: c }, caret: 0, sel: null, parts: parts(st), measureLyric: (s: string) => s.length * 10, autoBars: true, titlePlaceholder: true, foldAll: true }).families.length, 0, "听模式（foldAll）= 都叠起来");
  });
  it("现在在写的是房客 = 它拆开（有自己的谱行、能点）", () => {
    let st = trio(); const [a, , c] = st.song.parts.map((p) => p.id); st = setPartHost(st, c, a);
    st = setFocus(st, st.song.papers[0].id, c);
    const L = lay(st);
    assert(L.systems.some((r) => r.part === c) && L.notes.some((h) => L.systems[h.system].part === c), "拆开：有谱行、音能点");
  });
});
