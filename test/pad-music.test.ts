// pad-music.test.ts —— pad 的音乐知识（src/app/pad-music.ts）：每一格和 scales.ts 的梯子逐格一样、旋钮 / 滚轮的档位、「⋯」里的现值。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, setInputKey, setInputScale, setMark, inputKey, inputScaleOf } from "../src/score/song.ts";
import { createPadMusic, homeTonic, outsideKey } from "../src/app/pad-music.ts";
import { ladderAt, scaleById, ladderFirstAtOrAbove, ladderHome, SCALES } from "../src/score/scales.ts";
import { midiOf, noteName, keySpell, type Pitch } from "../src/score/pitch.ts";
import { keyFaces } from "../src/app/pad-music.ts";
import { trackInC } from "../src/score/view-in-c.ts";
import type { KeyFace } from "../src/keyboard/pad.ts";

const J = (x: unknown) => JSON.stringify(x);
/** 一行键上的字的纯文本（名字 = 那串字；级数 = 升降号 + 数字）。 */
const T = (f: KeyFace): string => ("name" in f ? f.name : `${f.acc ?? ""}${f.deg}`);
const stateOf = (f: number, scale: string) => setInputScale(setInputKey(initState(), f), scale);

describe("pad 的音乐知识（PadMusic）", () => {
  it("1=C 大调：第 0 级 = C4（不带点），往上一格一个调式音；第 7 级 = C5 带一个上点；负的往下", () => {
    const st = stateOf(0, "major"), m = createPadMusic(() => st, () => 4);
    eq(J(m.cell(0)), J({ big: { name: "C4" }, small: { deg: "1", oct: 0 }, midi: 60, tonic: true }));   // 大字 = 实际音名、小字 = 级数；「1」带 tonic（键顶上一道短横，v0.16.10）
    eq(J(m.cell(4)), J({ big: { name: "G4" }, small: { deg: "5", oct: 0 }, midi: 67 }));
    eq(J(m.cell(7)), J({ big: { name: "C5" }, small: { deg: "1", oct: 1 }, midi: 72, tonic: true }));
    eq(J(m.cell(-1)), J({ big: { name: "B3" }, small: { deg: "7", oct: -1 }, midi: 59 }));
    eq(T(m.altered(0, 1).big), "C♯4"); eq(T(m.altered(2, -1).big), "E♭4"); eq(T(m.altered(6, 2).big), "B♯♯4"); eq(T(m.altered(0, 1).small), "♯1");
    eq(m.sig(), "0|major|4|");
  });
  it("每一格和 scales.ts 的梯子逐格一样（几个调 × 几个调式，含带升降的级）；锚点同 ladderFirstAtOrAbove / ladderHome", () => {
    for (const f of [-3, 0, 2, 5]) for (const id of ["major", "minor", "blues", "yu", "chromatic"]) {
      const st = stateOf(f, id), m = createPadMusic(() => st, () => 4), sc = scaleById(id), t = homeTonic(f);
      for (let k = -9; k <= 16; k++) {
        const r = ladderAt(sc, k, t, f), c = m.cell(k);
        eq(c.midi, midiOf(r.pitch), `${f}/${id}/${k}`); eq(midiOf(m.pitchAt(k)), midiOf(r.pitch)); eq((c.small as { oct: number }).oct, r.oct);
      }
      eq(m.anchor("absolute"), ladderFirstAtOrAbove(sc, 60, t, f)); eq(m.anchor("movable"), ladderHome(sc, t, f));
      eq(m.sig(), `${f}|${id}|4|`);
    }
  });
  it("「1=」旋钮：五度圈大的在上（1=F♯ … 1=C … 1=G♭），现在的调是第几档；第 i 档 = 哪个调 / 哪个调式", () => {
    const st = stateOf(1, "minor"), m = createPadMusic(() => st, () => 4), kc = m.keyChoices();
    eq(kc.items.length, 13); eq(kc.index, 5); eq(m.fifthsAt(5), 1); eq(m.fifthsAt(6), 0); eq(m.fifthsAt(0), 6); eq(kc.name, "1=G 小调（手动）");
    assert(kc.items[5].includes("1=G") && kc.items[5].includes("小调"), kc.items[5]);
    const d = m.keyDrum();
    eq(d.keys.index, 5); eq(d.keys.items[6], "1=C"); eq(d.keys.items[0], "1=F♯"); eq(d.keys.items[12], "1=G♭");
    eq(d.scales.index, 1 + SCALES.findIndex((s) => s.id === "minor")); eq(m.scaleIdAt(0), "auto"); eq(m.scaleIdAt(1), "major"); eq(m.scaleIdAt(d.scales.index), "minor");
    eq(d.scales.items.length, SCALES.length + 1); assert(d.scales.items[0].includes("跟谱"), d.scales.items[0]);   // 调式那一列最上面 = 跟谱
    assert(d.scales.items[d.scales.index].includes("6 7 1 2 3 4 5"), d.scales.items[d.scales.index]);   // 小调从主音 6 起数
  });
  it("「1=」跟谱 / 手动（v0.16.9）：新歌跟谱 = 光标处的调号 + 大调；拨 1= 或调式 = 手动；调式第 0 档「跟谱」= 回去", () => {
    let st = initState(); const m = createPadMusic(() => st, () => 4);
    eq(st.input.inputAuto, true); eq(inputKey(st), 0); eq(m.keyDrum().scales.index, 0); assert(m.keyChoices().name.includes("跟着谱"), m.keyChoices().name);
    st = setMark(st, 0, { kind: "key", fifths: 2 });   // 谱头改成 D 大调 → 跟过去
    eq(inputKey(st), 2); eq(m.sig(), "2|major|4|"); eq(m.keyDrum().keys.index, 4); eq(T(m.cell(0).big), "D4");
    eq((m.keyChoices().tags ?? []).length, 0);
    const dor = setInputScale(st, "dorian");   // 跟谱时选调式 = 手动，调先定在跟着的那个
    eq(dor.input.inputAuto, false); eq(dor.input.inputFifths, 2); eq(inputScaleOf(dor), "dorian");
    const g = setInputKey(st, 1);   // 跟谱时拨 1= = 手动，调式接着用大调
    eq(g.input.inputAuto, false); eq(inputKey(g), 1); eq(inputScaleOf(g), "major");
    st = g; eq((m.keyChoices().tags ?? []).map((x) => x.text).join(","), "手动", "1=G 在 D 大调里（没有 C♯）= 挂「手动」"); assert(m.keyChoices().name.includes("手动"));
    st = setMark(st, 0, { kind: "key", fifths: 1 }); eq((m.keyChoices().tags ?? []).length, 0, "谱改成 G 大调 = 手动的 1=G 和它一样 = 不挂"); eq(inputKey(st), 1, "手动 = 谱怎么改都不跟");
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
  it("中央 C 叫 C 几（第 18 条，统筹 b149a4d9）：键上的字和升降滑时的字照它写；音高 / MIDI 不变；叫法变了 = sig 变（键重写）", () => {
    const st = stateOf(0, "major");
    for (const [mc, c0, b3] of [[3, "C3", "B2"], [4, "C4", "B3"], [5, "C5", "B4"]] as const) {
      const m = createPadMusic(() => st, () => mc);
      eq(T(m.cell(0).big), c0); eq(T(m.cell(-1).big), b3); eq(m.cell(0).midi, 60); eq(T(m.altered(0, 1).big), `C♯${c0.slice(1)}`);
    }
    assert(createPadMusic(() => st, () => 3).sig() !== createPadMusic(() => st, () => 4).sig());
  });
  it("移调辅助起作用（第 19 条）：键上大字 = 谱上换到 C 调画成的名字、小字 = 实际的；升降滑两行一起变；「1=」照写实际的 + 小标「键上按 C 调写」", () => {
    const st = setMark(initState(), 0, { kind: "key", fifths: -3 });   // 谱降 E 大调，键盘跟谱 = 1=E♭
    const m = createPadMusic(() => st, () => 4, () => true), ke = [...Array(24).keys()].map((i) => i - 8).find((i) => T(m.cell(i).small) === "E♭4")!, k0 = m.cell(ke);
    eq(T(k0.big), "C4", "E♭4 那个键：大字 C4"); eq(T(k0.small), "E♭4", "小字 E♭4（实际的）");
    const up = m.altered(ke, 1); eq(T(up.big), "C♯4", "E♭4 往上滑 = 实际 E4 = 谱上画成 C♯4"); eq(T(up.small), "E4");
    eq((m.keyChoices().tags ?? []).map((x) => x.text).join(","), "键上按 C 调写"); assert(m.keyChoices().name.includes("1=E♭"), "「1=」写实际的调");
    assert(m.sig() !== createPadMusic(() => st, () => 4).sig(), "开关移调辅助 = 键重写");
    const off = createPadMusic(() => st, () => 4, () => false); eq(T(off.cell(ke).big), "E♭4"); eq(T(off.cell(ke).small), "1", "没起作用 = 照旧");
  });
  it("和键盘自己的「1=」无关：谱降 E、键盘手动 1=G，G4 那个键大字 E4、小字 G4（统筹 a6be57e4 的用例）", () => {
    const st = setInputKey(setMark(initState(), 0, { kind: "key", fifths: -3 }), 1), m = createPadMusic(() => st, () => 4, () => true);
    eq(inputKey(st), 1); eq(st.input.inputAuto, false);
    const k = [...Array(20).keys()].map((i) => i - 6).find((i) => T(m.cell(i).small) === "G4")!;
    eq(T(m.cell(k).big), "E4");
  });
  it("随机的音 × 调号：键上大字 = 排版给同一个音写出来的名字（同一个换法 trackInC，走音名出口）", () => {
    let seed = 7; const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    for (let i = 0; i < 400; i++) {
      const f = rnd(13) - 6, p: Pitch = { step: "CDEFGAB"[rnd(7)] as Pitch["step"], alter: rnd(3) - 1, octave: 2 + rnd(5) }, mc = 3 + rnd(3);
      const written = keySpell(p, f), drawn = trackInC([{ kind: "key", id: 1, fifths: f }, { kind: "note", id: 2, pitch: written, dur: 1, lyric: null }] as never)[1] as { pitch: Pitch };
      eq(T(keyFaces(p, { deg: "1", oct: 0 }, { inC: true, fifths: f, middleC: mc }).big), noteName(drawn.pitch, mc), `${noteName(p, 4)} 在 ${f}`);
      eq(T(keyFaces(p, { deg: "1", oct: 0 }, { inC: true, fifths: f, middleC: mc }).small), noteName(p, mc));
    }
  });
  it("光标走过转调的地方：键上的字跟着重写（开着移调辅助时 sig 带光标这里的调号）", () => {
    let st = setMark(initState(), 0, { kind: "key", fifths: -3 });
    const m = createPadMusic(() => st, () => 4, () => true), a = m.sig(), b0 = T(m.cell(0).big);
    st = setMark(st, 0, { kind: "key", fifths: 2 });
    assert(m.sig() !== a, "调号变了 = sig 变"); assert(/^C\d$/.test(T(m.cell(0).big)) && /^C\d$/.test(b0), `主音那个键在两个调里都写 C（${b0} → ${T(m.cell(0).big)}）`);
  });
  it("「⋯」里插记号钮上的现值 = 光标处生效的调号 / 拍号 / 速度（调号写成人话的调名）", () => {
    const st = initState(), m = createPadMusic(() => st, () => 4), r = m.marksHere();
    eq(r.key, "C"); eq(r.beats, 4); eq(r.beatType, 4); eq(typeof r.bpm, "number");
  });
});
