// 纸面顶上：歌名大小 + 作者栏不压曲段控件（v0.10.23）。created 2026-10-10 by Claude Opus 5.5
// user「歌曲标题字体大小不合理」「待会：词曲的输入和本段显示的控件撞车了」
import { describe, it, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { initState, addPaper, setCredits, tr, headLen, TPQ, type Token, type EditorState } from "../src/score/song.ts";

let nid = 9100;
const q = (): Token => ({ kind: "note", id: nid++, pitch: { step: "E", alter: 0, octave: 4 }, dur: TPQ, lyric: null });
function song(credits: string): EditorState {
  let st = initState(); st = addPaper(st);
  const pid = st.at.part, papers = st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [pid]: [...p.tracks[pid].slice(0, headLen(p.tracks[pid])), q(), q()] } }));
  st = { ...st, song: { ...st.song, title: "団子大家族", papers } };
  return setCredits(st, credits);
}
const parts = (st: EditorState) => st.song.parts.map((p, k) => ({ id: p.id, name: `V${k}`, empty: false, first: k === 0, hidden: false, badges: [], mono: false }));
const lay = (st: EditorState, onlyPaper?: string) => engrave(st.song, { width: 700, sp: 10, at: st.at, caret: st.caret, sel: st.sel, parts: parts(st), measureLyric: (s: string) => s.length * 10, autoBars: true, titlePlaceholder: true, paperLabel: "A4", ...(onlyPaper ? { onlyPaper } : {}) });

describe("纸面顶上", () => {
  it("歌名明显比曲段名大", () => {
    const st = song(""), L = lay(st);
    assert(L.title.size >= 2.5 * 10, `歌名 ${L.title.size}px`);
    assert(L.title.size >= (L.papers[0]?.title.size ?? 0) * 1.5, `歌名 ${L.title.size} vs 曲段名 ${L.papers[0]?.title.size}`);
  });
  for (const n of [1, 2, 4]) it(`本段视图：作者栏 ${n} 行 = 曲段那一行（和右边的控件）在它下面，不撞`, () => {
    const st = song(Array.from({ length: n }, (_, k) => `作词作曲 ${k + 1}`).join("\n")), L = lay(st, st.song.papers[0].id);
    const c = L.credits!, pp = L.papers.find((x) => x.id === st.song.papers[0].id)!;
    const ctl = [pp.prev, pp.next, pp.scope, pp.menu].filter((b): b is NonNullable<typeof b> => !!b);
    assert(ctl.length > 0, "有曲段控件");
    for (const b of ctl) assert(b.y >= c.y + c.h - 0.5, `控件 y ${b.y.toFixed(1)} 在作者栏底 ${(c.y + c.h).toFixed(1)} 下面`);
  });
});

describe("和弦的每个符头都能亮（v0.10.23；user「音符高亮忘了做和弦的其他音的高亮」）", () => {
  it("三个音的和弦 = 主音在 notes（点 / 拖）、另外两个在 chordHeads（只给播放高亮）", () => {
    let st = initState(); const pid = st.at.part, pp = st.song.papers[0], head = pp.tracks[pid].slice(0, headLen(pp.tracks[pid]));
    const chord = { kind: "note", id: nid++, pitch: { step: "G", alter: 0, octave: 4 }, chord: [{ step: "E", alter: 0, octave: 4 }, { step: "C", alter: 0, octave: 4 }], dur: TPQ, lyric: null } as Token;
    st = { ...st, song: { ...st.song, papers: [{ ...pp, tracks: { ...pp.tracks, [pid]: [...head, chord, q()] } }] } };
    const L = lay(st), idx = head.length;
    assert(L.notes.filter((h) => h.index === idx).length === 1, "notes 里这个和弦只有一个（主音）");
    const ch = L.chordHeads.filter((h) => h.index === idx);
    assert(ch.length === 2 && new Set(ch.map((h) => Math.round(h.y))).size === 2, `另外两个符头各有位置：${JSON.stringify(ch)}`);
    assert(L.chordHeads.every((h) => h.index === idx), "单音没有 chordHeads");
  });
});
