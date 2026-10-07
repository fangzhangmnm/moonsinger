// created 2026-10-06 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { type Pitch, placeDegree, keyAlter, midiOf, pitchName, tonicStepIndex, stepBy, alterBy } from "../src/score/pitch.ts";

const P = (s: string): Pitch => { const m = /^([A-G])(#*|b*)(-?\d)$/.exec(s)!; return { step: m[1] as Pitch["step"], alter: m[2].startsWith("#") ? m[2].length : -m[2].length, octave: Number(m[3]) }; };
const place = (deg: number, fifths: number, prev: string | null, dir: "near" | "up" | "down") => pitchName(placeDegree(deg, fifths, prev ? P(prev) : null, dir));

describe("pitch", () => {
  it("中央 C = MIDI 60，A4 = 69", () => { eq(midiOf(P("C4")), 60); eq(midiOf(P("A4")), 69); eq(midiOf(P("F#4")), 66); eq(midiOf(P("Bb3")), 58); });
  it("调号：G 大调 F 升，F 大调 B 降，D 大调 F C 升", () => {
    eq(keyAlter("F", 1), 1); eq(keyAlter("C", 1), 0); eq(keyAlter("B", -1), -1); eq(keyAlter("C", 2), 1); eq(keyAlter("E", -1), 0);
  });
  it("1 的位置：C=0 G=1 F=-1 B♭=-2", () => { eq(tonicStepIndex(0), 0); eq(tonicStepIndex(1), 4); eq(tonicStepIndex(-1), 3); eq(tonicStepIndex(-2), 6); });
  it("第一个音以 D4（她说话的家）为参照，就近", () => { eq(place(1, 0, null, "near"), "C4"); eq(place(5, 0, null, "near"), "G4"); eq(place(6, 0, null, "near"), "A3"); });
  it("就近 = 不超过四度（按五线谱级数）", () => { eq(place(4, 0, "B4", "near"), "F4"); eq(place(1, 0, "B4", "near"), "C5"); eq(place(6, 0, "E4", "near"), "A4"); });
  it("Shift = 往上第一个；下一排 = 往下第一个；同级就跳八度", () => {
    eq(place(5, 0, "C4", "up"), "G4"); eq(place(5, 0, "C4", "near"), "G3"); eq(place(4, 0, "C4", "up"), "F4");
    eq(place(5, 0, "C4", "down"), "G3"); eq(place(1, 0, "C4", "up"), "C5"); eq(place(1, 0, "C4", "down"), "C3");
  });
  it("G 大调里 7 = F#（升降照调号）", () => { eq(place(7, 1, "G4", "up"), "F#5"); eq(place(7, 1, "G4", "near"), "F#4"); });
  it("↑↓ 挪一级回到调号默认；Shift 挪半音", () => { eq(pitchName(stepBy(P("E4"), 1, 1)), "F#4"); eq(pitchName(alterBy(P("E4"), -1)), "Eb4"); });
});
