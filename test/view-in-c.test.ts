// view-in-c.test.ts —— 按 C 调看（辅助模式，src/score/view-in-c.ts）：每个音从它所在的调转到 C；调号 → 0 + 记着原来的；token 一个不增不减、id 不变。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「F 大调的话。你显示的时候，帮我转到 C 大调上面，然后…写一个一等于 F」）
import { describe, it, eq } from "./runner.mjs";
import { songInC, trackInC, toC, stepsToC, realFifthsOf } from "../src/score/view-in-c.ts";
import { pitchName, type Pitch } from "../src/score/pitch.ts";
import type { Token, KeyTok, Song } from "../src/score/song.ts";

const P = (s: string): Pitch => { const m = /^([A-G])(#*|b*)(-?\d)$/.exec(s)!; return { step: m[1] as Pitch["step"], alter: m[2].startsWith("#") ? m[2].length : -m[2].length, octave: Number(m[3]) }; };
const note = (id: number, p: string, chord?: string[]): Token => ({ kind: "note", id, pitch: P(p), dur: 480, lyric: null, ...(chord ? { chord: chord.map(P) } : {}) });
const names = (ts: Token[]) => ts.map((t) => (t.kind === "note" ? pitchName(t.pitch!) + (t.chord ? `+${t.chord.map(pitchName).join("+")}` : "") : t.kind === "key" ? `K${t.fifths}/${realFifthsOf(t as KeyTok)}` : t.kind)).join(" ");

describe("按 C 调看", () => {
  it("1=F：往下四度（F4 → C4），调里的音还在调里（B♭ → F），调外的带自己的升降号（B♮ → F♯）", () => {
    eq(pitchName(toC(P("F4"), -1)), "C4"); eq(pitchName(toC(P("Bb4"), -1)), "F4"); eq(pitchName(toC(P("B4"), -1)), "F#4");
    eq(stepsToC(-1), -3);
  });
  it("1=G：往上四度（G4 → C5）；G 大调的 F♯ = B，F♮ = B♭；1=C 不动", () => {
    eq(pitchName(toC(P("G4"), 1)), "C5"); eq(pitchName(toC(P("F#4"), 1)), "B4"); eq(pitchName(toC(P("F4"), 1)), "Bb4");
    eq(stepsToC(1), 3); eq(pitchName(toC(P("E4"), 0)), "E4"); eq(stepsToC(0), 0);
  });
  it("一条 track：每个音按它前面最近的调号换；中途换调从那儿起换法跟着变；叠音一起换；调号 → 0、记着原来的；id 不变", () => {
    const ts: Token[] = [{ kind: "key", id: 1, fifths: -1 }, note(2, "F4", ["A4", "C5"]), note(3, "Bb4"), { kind: "key", id: 4, fifths: 2 }, note(5, "D4"), note(6, "C#5")];
    const c = trackInC(ts);
    eq(names(c), "K0/-1 C4+E4+G4 F4 K0/2 C4 B4");
    eq(c.map((t) => t.id).join(","), "1,2,3,4,5,6");
  });
  it("整首：鼓不换（写的音高 = 敲哪个鼓）；原来的谱不被改", () => {
    const song = { hum: "n", parts: [{ id: "p1", role: "r1", mic: "m1" }, { id: "dr", role: "r2", mic: "m2" }],
      papers: [{ id: "s1", name: "", tracks: { p1: [{ kind: "key", id: 1, fifths: 1 }, note(2, "G4")], dr: [{ kind: "key", id: 3, fifths: 1 }, note(4, "C2")] } }] } as unknown as Song;
    const c = songInC(song, (id) => id === "dr");
    eq(names(c.papers[0].tracks.p1), "K0/1 C5"); eq(c.papers[0].tracks.dr, song.papers[0].tracks.dr);
    eq(names(song.papers[0].tracks.p1), "K1/1 G4");
  });
});
