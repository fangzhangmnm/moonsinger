// 每张纸的速度（2026-10-08 Opus 5.5）：速度看这张纸最上面那位在场的歌手那一行；新纸 / 去掉一行 / 换绑 / 挪顺序都不让这张纸开头的速度跳成别的行谱头里的旧数；
//   改开头的速度 = 这张纸每一行的谱头都写齐。user「第四章sheet只有第二个声部的时候速度记号失踪了而且好像速度不对」。
import { describe, it, eq } from "./runner.mjs";
import { initState, addPart, addPaper, removeTrack, rebindTrack, movePart, setMark, tempoMapOf, withTrack, tempoOwner, sheetStartBpm, TPQ, type EditorState, type Token } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";

const note = (id: number): Token => ({ kind: "note", id, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null });
/** P1（最上面）谱头速度改成 120，P2 还是 90（没人看见的旧数）；第一张纸 P1 一个音。 */
function base(): EditorState {
  let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" });
  const p1 = st.song.papers[0], t1 = p1.tracks.P1.map((t) => (t.kind === "tempo" ? { ...t, bpm: 120 } : t)) as Token[];
  return { ...st, song: withTrack(st.song, p1.id, "P1", [...t1, note(9001)]) };
}
const startBpms = (st: EditorState) => st.song.papers.map((p) => sheetStartBpm(st.song, p));

describe("每张纸的速度", () => {
  it("新纸：每一行谱头 = 上一张纸结尾真正生效的速度（不是 P2 自己的旧数）", () => {
    const st = addPaper(base()), p2 = st.song.papers[1];
    eq((p2.tracks.P2.find((t) => t.kind === "tempo") as { bpm: number }).bpm, 120);
  });
  it("新纸上去掉最上面那位：速度照旧 120（以前跳成 90）", () => {
    let st = addPaper(base()); const p2 = st.song.papers[1].id;
    st = removeTrack(st, p2, "P1");
    eq(tempoOwner(st.song, st.song.papers[1]), "P2"); eq(JSON.stringify(startBpms(st)), "[120,120]");
    eq(JSON.stringify(tempoMapOf(st.song).map((x) => x.bpm)), "[120,120]");
  });
  it("挪顺序（P2 挪到最上面）：每张纸开头的速度不变", () => {
    const st = movePart(base(), "P2", -1);
    eq(st.song.parts[0].id, "P2"); eq(JSON.stringify(startBpms(st)), "[120]");
  });
  it("换绑对调：速度跟着纸、不跟着那一行", () => {
    const st0 = base(), st = rebindTrack(st0, st0.song.papers[0].id, "P1", "P2");
    eq(JSON.stringify(startBpms(st)), "[120]");
  });
  it("改这张纸开头的速度 = 每一行谱头都写齐", () => {
    const st0 = base(), i = st0.song.papers[0].tracks.P1.findIndex((t) => t.kind === "tempo");
    const st = setMark(st0, i, { kind: "tempo", bpm: 72 });
    eq(JSON.stringify(Object.values(st.song.papers[0].tracks).map((t) => (t.find((x) => x.kind === "tempo") as { bpm: number }).bpm)), "[72,72]");
  });
});

describe("速度记号画在哪、画淡不画淡", () => {
  const prims = (st: EditorState, paper: string) => engrave(st.song, { width: 600, sp: 10, at: st.at, caret: 0, sel: null, parts: st.song.parts.map((p, k) => ({ id: p.id, name: p.id, empty: false, first: k === 0, clef: "G" as const, hidden: false, badges: [], mono: true })), measureLyric: (s: string) => s.length * 10, onlyPaper: paper } as never).prims;
  it("只有第二个声部的纸：速度记号照样画（画在它那一行）", () => {
    let st = addPaper(base()); const p2 = st.song.papers[1].id;
    st = removeTrack(st, p2, "P1");
    eq(prims(st, p2).filter((x) => x.t === "text" && (x as { cls?: string }).cls?.includes("tempo-num")).length, 1);
  });
  it("和上一段一样 = 画淡（tempo same）；不一样 = 照常", () => {
    let st = addPaper(base()); const p2 = st.song.papers[1];
    const cls = () => prims(st, p2.id).find((x) => x.t === "text" && (x as { cls?: string }).cls?.includes("tempo-num")) as { cls: string };
    eq(cls().cls.includes("same"), true, "120 → 120 = 重申");
    const i = st.song.papers[1].tracks.P1.findIndex((t) => t.kind === "tempo");
    st = setMark({ ...st, at: { paper: p2.id, part: "P1" } }, i, { kind: "tempo", bpm: 96 });
    eq(cls().cls.includes("same"), false, "120 → 96 = 真变了");
  });
});
