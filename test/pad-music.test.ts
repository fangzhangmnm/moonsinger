// pad-music.test.ts —— pad 的音乐知识（src/app/pad-music.ts）：每一格和 scales.ts 的梯子逐格一样、旋钮 / 滚轮的档位、「⋯」里的现值。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, setInputKey, setInputScale } from "../src/score/song.ts";
import { createPadMusic, homeTonic } from "../src/app/pad-music.ts";
import { ladderAt, scaleById, ladderFirstAtOrAbove, ladderHome, SCALES } from "../src/score/scales.ts";
import { midiOf } from "../src/score/pitch.ts";

const J = (x: unknown) => JSON.stringify(x);
const stateOf = (f: number, scale: string) => setInputScale(setInputKey(initState(), f), scale);

describe("pad 的音乐知识（PadMusic）", () => {
  it("1=C 大调：第 0 级 = C4（不带点），往上一格一个调式音；第 7 级 = C5 带一个上点；负的往下", () => {
    const st = stateOf(0, "major"), m = createPadMusic(() => st);
    eq(J(m.cell(0)), J({ deg: "1", oct: 0, abs: "C4", midi: 60 }));
    eq(J(m.cell(4)), J({ deg: "5", oct: 0, abs: "G4", midi: 67 }));
    eq(J(m.cell(7)), J({ deg: "1", oct: 1, abs: "C5", midi: 72 }));
    eq(J(m.cell(-1)), J({ deg: "7", oct: -1, abs: "B3", midi: 59 }));
    eq(m.altered(0, 1), "C♯4"); eq(m.altered(2, -1), "E♭4"); eq(m.altered(6, 2), "B♯♯4");
    eq(m.sig(), "0|major");
  });
  it("每一格和 scales.ts 的梯子逐格一样（几个调 × 几个调式，含带升降的级）；锚点同 ladderFirstAtOrAbove / ladderHome", () => {
    for (const f of [-3, 0, 2, 5]) for (const id of ["major", "minor", "blues", "yu", "chromatic"]) {
      const st = stateOf(f, id), m = createPadMusic(() => st), sc = scaleById(id), t = homeTonic(f);
      for (let k = -9; k <= 16; k++) {
        const r = ladderAt(sc, k, t, f), c = m.cell(k);
        eq(c.midi, midiOf(r.pitch), `${f}/${id}/${k}`); eq(midiOf(m.pitchAt(k)), midiOf(r.pitch)); eq(c.oct, r.oct);
      }
      eq(m.anchor("absolute"), ladderFirstAtOrAbove(sc, 60, t, f)); eq(m.anchor("movable"), ladderHome(sc, t, f));
      eq(m.sig(), `${f}|${id}`);
    }
  });
  it("「1=」旋钮：五度圈大的在上（1=F♯ … 1=C … 1=G♭），现在的调是第几档；第 i 档 = 哪个调 / 哪个调式", () => {
    const st = stateOf(1, "minor"), m = createPadMusic(() => st), kc = m.keyChoices();
    eq(kc.items.length, 13); eq(kc.index, 5); eq(m.fifthsAt(5), 1); eq(m.fifthsAt(6), 0); eq(m.fifthsAt(0), 6); eq(kc.name, "1=G 小调");
    assert(kc.items[5].includes("1=G") && kc.items[5].includes("小调"), kc.items[5]);
    const d = m.keyDrum();
    eq(d.keys.index, 5); eq(d.keys.items[6], "1=C"); eq(d.keys.items[0], "1=F♯"); eq(d.keys.items[12], "1=G♭");
    eq(d.scales.index, SCALES.findIndex((s) => s.id === "minor")); eq(m.scaleIdAt(0), "major"); eq(m.scaleIdAt(d.scales.index), "minor");
    assert(d.scales.items[d.scales.index].includes("6 7 1 2 3 4 5"), d.scales.items[d.scales.index]);   // 小调从主音 6 起数
  });
  it("「⋯」里插记号钮上的现值 = 光标处生效的调号 / 拍号 / 速度（调号写成人话的调名）", () => {
    const st = initState(), m = createPadMusic(() => st), r = m.marksHere();
    eq(r.key, "C"); eq(r.beats, 4); eq(r.beatType, 4); eq(typeof r.bpm, "number");
  });
});
