// chord-name.test.ts —— 认和弦 + 写成级数（src/score/chord-name.ts）。created 2026-11-07 by Claude Opus 5.5
// 钉住 user 11-07 问的那几种歧义：换根音（转位）、挂二 / 挂四、六和弦 vs 七和弦转位、十三；调号只管第几级。
import { describe, it, eq, assert } from "./runner.mjs";
import { readChord, chordLabel, degreeOf } from "../src/score/chord-name.ts";
import type { Pitch } from "../src/score/pitch.ts";

const P = (s: string): Pitch => { const m = /^([A-G])(#*|b*)(-?\d)$/.exec(s)!; return { step: m[1] as Pitch["step"], alter: m[2].startsWith("#") ? m[2].length : -m[2].length, octave: Number(m[3]) }; };
const L = (notes: string, fifths = 0): string => { const r = readChord(notes.split(" ").map(P), fifths); return r ? chordLabel(r) : "-"; };
const N = (notes: string, fifths = 0): string => readChord(notes.split(" ").map(P), fifths)?.best.name ?? "-";

describe("认和弦 + 级数", () => {
  it("三和弦：大写 = 大三度、小写 = 小三度、° = 减", () => {
    eq(L("C4 E4 G4"), "I"); eq(L("D4 F4 A4"), "ii"); eq(L("G3 B3 D4"), "V"); eq(L("B3 D4 F4"), "vii°"); eq(L("C4 E4 G#4"), "I+");
    eq(N("D4 F4 A4"), "Dm");
  });
  it("转位（换根音）= 最低音不是根音：写斜杠 + 最低音在调里第几级", () => {
    eq(L("E3 G3 C4"), "I/3"); eq(N("E3 G3 C4"), "C/E");
    eq(L("G3 C4 E4"), "I/5"); eq(L("F3 G3 B3 D4"), "V7/4");
  });
  it("挂二 / 挂四：同一组音（C D G = Csus2 = Gsus4/C）按最低音定", () => {
    eq(L("C4 D4 G4"), "Isus2"); eq(L("G3 C4 D4"), "Vsus4"); eq(L("C4 F4 G4"), "Isus4");
  });
  it("六和弦 vs 七和弦转位（C E G A = C6 = Am7/C）：最低音是 C = I6，最低音是 A = vi7", () => {
    eq(L("C4 E4 G4 A4"), "I6"); eq(L("A3 C4 E4 G4"), "vi7");
    eq(L("C4 E4 A4"), "vi/1");   // 三个音凑得成完整的 Am（转位）= 不说是省了五音的 C6
  });
  it("七 / 九 / 十三；五音可以省（G B F = 省掉五音的 G7）", () => {
    eq(L("G3 B3 D4 F4"), "V7"); eq(L("C4 E4 G4 B4"), "Imaj7"); eq(L("D4 F4 A4 C5"), "ii7"); eq(L("B3 D4 F4 A4"), "viiø7");
    eq(L("G3 B3 F4"), "V7"); eq(readChord(["G3", "B3", "F4"].map(P), 0)!.best.omitted, 1);
    eq(L("C4 E4 G4 B4 D5"), "Imaj9"); eq(L("G3 B3 F4 E5"), "V13");
  });
  it("调外的根音带 ♭ / ♯（B♭ 在 C 调 = ♭VII）；调号只管第几级（1=F 里的 C7 = V7、1=G 里的 D = V）", () => {
    eq(L("Bb3 D4 F4"), "♭VII"); eq(L("C4 E4 G4 Bb4", -1), "V7"); eq(L("D4 F#4 A4", 1), "V"); eq(L("E4 G#4 B4"), "III");
    eq(JSON.stringify(degreeOf(P("Bb3"), 0)), JSON.stringify({ deg: 7, acc: -1 }));
  });
  it("三个不同的音以下 / 表里没有的 = 认不出来（不硬猜）", () => {
    eq(L("C4 G4"), "-"); eq(L("C4 C5 G4"), "-"); eq(L("C4 C#4 D4"), "-");
  });
  it("候选全给：C E G A 的候选里也有 Am7/C（点开能看）", () => {
    const r = readChord(["C4", "E4", "G4", "A4"].map(P), 0)!;
    assert(r.all.some((g) => g.name === "Am7/C"), r.all.map((g) => g.name).join(","));
    eq(r.ties.length, 1);
  });
});
