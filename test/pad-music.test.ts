// pad-music.test.ts —— pad 的音乐知识（src/app/pad-music.ts）：每一格和 scales.ts 的梯子逐格一样、旋钮 / 滚轮的档位、「⋯」里的现值。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, setInputKey, setInputScale, setMark, inputKey, inputScaleOf } from "../src/score/song.ts";
import { createPadMusic, homeTonic, outsideKey } from "../src/app/pad-music.ts";
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
    eq(kc.items.length, 13); eq(kc.index, 5); eq(m.fifthsAt(5), 1); eq(m.fifthsAt(6), 0); eq(m.fifthsAt(0), 6); eq(kc.name, "1=G 小调（手动）");
    assert(kc.items[5].includes("1=G") && kc.items[5].includes("小调"), kc.items[5]);
    const d = m.keyDrum();
    eq(d.keys.index, 5); eq(d.keys.items[6], "1=C"); eq(d.keys.items[0], "1=F♯"); eq(d.keys.items[12], "1=G♭");
    eq(d.scales.index, 1 + SCALES.findIndex((s) => s.id === "minor")); eq(m.scaleIdAt(0), "auto"); eq(m.scaleIdAt(1), "major"); eq(m.scaleIdAt(d.scales.index), "minor");
    eq(d.scales.items.length, SCALES.length + 1); assert(d.scales.items[0].includes("跟谱"), d.scales.items[0]);   // 调式那一列最上面 = 跟谱
    assert(d.scales.items[d.scales.index].includes("6 7 1 2 3 4 5"), d.scales.items[d.scales.index]);   // 小调从主音 6 起数
  });
  it("「1=」跟谱 / 手动（v0.16.9）：新歌跟谱 = 光标处的调号 + 大调；拨 1= 或调式 = 手动；调式第 0 档「跟谱」= 回去", () => {
    let st = initState(); const m = createPadMusic(() => st);
    eq(st.input.inputAuto, true); eq(inputKey(st), 0); eq(m.keyDrum().scales.index, 0); assert(m.keyChoices().name.includes("跟着谱"), m.keyChoices().name);
    st = setMark(st, 0, { kind: "key", fifths: 2 });   // 谱头改成 D 大调 → 跟过去
    eq(inputKey(st), 2); eq(m.sig(), "2|major"); eq(m.keyDrum().keys.index, 4); eq(m.cell(0).abs, "D4");
    eq(m.keyChoices().tag, undefined);
    const dor = setInputScale(st, "dorian");   // 跟谱时选调式 = 手动，调先定在跟着的那个
    eq(dor.input.inputAuto, false); eq(dor.input.inputFifths, 2); eq(inputScaleOf(dor), "dorian");
    const g = setInputKey(st, 1);   // 跟谱时拨 1= = 手动，调式接着用大调
    eq(g.input.inputAuto, false); eq(inputKey(g), 1); eq(inputScaleOf(g), "major");
    st = g; assert(!!m.keyChoices().tag, "1=G 在 D 大调里（没有 C♯）= 挂「手动」"); eq(m.keyChoices().tag!.text, "手动"); assert(m.keyChoices().name.includes("手动"));
    st = setMark(st, 0, { kind: "key", fifths: 1 }); eq(m.keyChoices().tag, undefined, "谱改成 G 大调 = 手动的 1=G 和它一样 = 不挂"); eq(inputKey(st), 1, "手动 = 谱怎么改都不跟");
    st = setInputScale(st, "auto"); eq(st.input.inputAuto, true); eq(m.keyDrum().scales.index, 0); eq(inputKey(st), 1);
  });
  it("挂不挂「手动」= pad 上有没有谱上调号以外的音（同一套音换个主音不算；五声在里面不算）", () => {
    const sc = (id: string) => scaleById(id);
    eq(outsideKey(sc("major"), 0, 0), false); eq(outsideKey(sc("major"), 1, 0), true);   // 1=G 在 C 大调里：F♯
    eq(outsideKey(sc("dorian"), 0, 0), false);   // 1=C 多利亚（从 2 起）= C 大调那一套音
    eq(outsideKey(sc("dorian"), 2, 0), true);   // 1=D 多利亚 = D 大调那一套：F♯ C♯
    eq(outsideKey(sc("yu"), 0, 0), false);   // 羽调式五声（A C D E G）都在 C 大调里
    eq(outsideKey(sc("minor"), 0, 0), false);   // 1=C 小调 = 从 6 起（A 小调），同一套音
    eq(outsideKey(sc("major"), -3, 0), true);   // 1=E♭ 在 C 大调里：E♭ A♭ B♭
  });
  it("「⋯」里插记号钮上的现值 = 光标处生效的调号 / 拍号 / 速度（调号写成人话的调名）", () => {
    const st = initState(), m = createPadMusic(() => st), r = m.marksHere();
    eq(r.key, "C"); eq(r.beats, 4); eq(r.beatType, 4); eq(typeof r.bpm, "number");
  });
});
