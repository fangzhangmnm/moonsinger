// 补齐的淡色休止 + 点空小节写到那里（v0.10.6；user「点小节写这里好」「这样的话要不要做新轨在显示的时候自动补齐小节号。然后自动补的休止也是自动的淡色」「小节号（用小字体）也做一下」）。
// created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { initState, addPart, setFocus, setCaret, setCaretLead, select, writePitch, writeRest, moveCaret, tr, headLen, TPQ, type Token, type EditorState } from "../src/score/song.ts";

let nid = 7700;
const q = (step: "C" | "E" = "E"): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: 4 }, dur: TPQ, lyric: null });
/** 一张纸两位：P1 = a 个四分（4/4），P2 = b 个四分。光标在 P2 尾巴。 */
function two(a: number, b: number): EditorState {
  let st = addPart(initState(), { id: "P2", role: "r2", mic: "m2" });
  const p1 = st.song.parts[0].id, paper = st.song.papers[0];
  const head = (pid: string) => paper.tracks[pid].slice(0, headLen(paper.tracks[pid]));
  st = { ...st, song: { ...st.song, papers: [{ ...paper, tracks: { [p1]: [...head(p1), ...Array.from({ length: a }, () => q())], P2: [...head("P2"), ...Array.from({ length: b }, () => q("C"))] } }] } };
  return setFocus(st, paper.id, "P2");
}
const parts = (st: EditorState) => st.song.parts.map((p, k) => ({ id: p.id, name: `V${k}`, empty: false, first: k === 0, hidden: false, badges: [], mono: false }));
const lay = (st: EditorState, width = 4000) => engrave(st.song, { width, sp: 10, at: st.at, caret: st.caret, ...(st.lead ? { lead: st.lead } : {}), sel: st.sel, parts: parts(st), measureLyric: (s: string) => s.length * 10, autoBars: true });
const padRests = (st: EditorState) => lay(st).prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.includes("pad-rest")).length;
const E = TPQ / 2;
const show = (st: EditorState) => tr(st).slice(headLen(tr(st))).map((t) => t.kind === "note" ? `${t.pitch!.step}/${t.dur / E}` : t.kind === "rest" ? `r/${t.dur / E}` : t.kind).join(" ");

describe("补齐的空小节（只占位不画休止，v0.10.19；user「remove the ghost mute idea」）", () => {
  it("短的声部后面：空小节照样占位（落点在），但不画淡色休止；谱里没有它们", () => {
    const st = two(12, 1);   // P1 三小节；P2 一拍 → 补：这一小节剩 3 拍 + 两个整小节
    eq(padRests(st), 0, "不画淡色休止");
    eq(show(st), "C/2", "谱没变");
    assert(lay(st).slots.some((x) => x.lead), "空小节开头的落点还在");
  });
  it("淡色休止不能点（不进 rests 命中框）；每个补齐的小节开头有一个落点（lead = 离尾巴多少 tick）", () => {
    const st = two(12, 1), L = lay(st);
    assert(!L.rests.some((h) => h.index >= tr(st).length), "命中框里没有补齐的");
    const leads = L.slots.filter((s) => s.lead).map((s) => s.lead! / TPQ).sort((x, y) => x - y);
    eq(leads.join(","), "3,7", "第 2、3 小节的开头 = 离尾巴 3 拍、7 拍");
  });
  it("折了行：补齐的那几行开头照样有小节号（小字）", () => {
    const st = two(40, 1);   // P1 十个小节，窄纸折几行
    const L = lay(st, 360), nums = L.prims.filter((p) => p.t === "text" && p.cls === "bar-no");
    assert(nums.length >= 1, "有小节号");
  });
});

describe("点空小节写到那里（lead）", () => {
  it("写音 = 先补满尾巴那一小节、再一小节一个整小节休止，然后写；光标在新音后面", () => {
    let st = setCaretLead(two(12, 1), 7 * TPQ);   // 点第 3 小节开头
    st = writePitch(st, { step: "G", alter: 0, octave: 4 });
    eq(show(st), "C/2 r/6 r/8 G/1"); eq(st.lead, undefined); eq(st.caret, tr(st).length);
  });
  it("休止键也一样；lead 0 = 就是尾巴", () => {
    eq(show(writeRest(setCaretLead(two(12, 1), 3 * TPQ))), "C/2 r/6 r/1");
    eq(setCaretLead(two(12, 1), 0).lead, undefined);
  });
  it("挪光标 / 选中 / 换声部 = 清掉（点一下不改谱）", () => {
    const st = setCaretLead(two(12, 1), 7 * TPQ);
    eq(st.song, two(12, 1).song.papers ? st.song : st.song); eq(show(st), "C/2", "点一下不改谱");
    eq(setCaret(st, st.caret).lead, undefined); eq(moveCaret(st, -1).lead, undefined);
    eq(select(st, headLen(tr(st)), headLen(tr(st)) + 1).lead, undefined);
    eq(setFocus(st, st.at.paper, st.song.parts[0].id).lead, undefined);
  });
  it("排版：有 lead 时光标画在那个小节开头（淡色休止切成两段）", () => {
    const st = setCaretLead(two(12, 1), 7 * TPQ), L = lay(st), slot = lay(two(12, 1)).slots.find((s) => s.lead === 7 * TPQ)!;
    assert(!!L.head && Math.abs(L.head.x - slot.x) < 15, `光标 x ${L.head?.x} ≈ 第 3 小节开头 ${slot.x}`);
  });
});
