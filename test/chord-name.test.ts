// chord-name.test.ts —— 认和弦 + 写成级数（src/score/chord-name.ts）。created 2026-11-07 by Claude Opus 5.5
// 钉住 user 11-07 问的那几种歧义：换根音（转位）、挂二 / 挂四、六和弦 vs 七和弦转位、十三；调号只管第几级。
import { describe, it, eq, assert } from "./runner.mjs";
import { readChord, chordLabel, degreeOf, brokenChords } from "../src/score/chord-name.ts";
import { initState, tr, headLen, TPQ, type Token } from "../src/score/song.ts";
import { spellMidi } from "../src/score/pitch.ts";
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
  it("缺三度（user 11-07 截图：A E G 没标）：认成七和弦缺三度，大小写按调里（C 调里 A 上面是 C = 小 = vi7(no3)；G 上面是 B = 大 = V7(no3)）", () => {
    eq(L("A3 E4 G4"), "vi7(no3)"); eq(L("G3 D4 F4"), "V7(no3)"); eq(L("C4 G4 B4"), "Imaj7(no3)");
    const r = readChord(["A3", "E4", "G4"].map(P), 0)!; eq(r.best.no3, true); eq(r.best.name, "Am7(no3)");
    eq(L("C4 E4 G4 Bb4"), "I7");   // 有三度的照旧
  });
  it("两个音：隔五度 = 空五度（v0.16.62，user「和弦级数认「空五度」」），一律大写、五度在下 = 转位；别的两个音 / 表里没有的 = 认不出来（不硬猜）", () => {
    eq(L("C4 G4"), "I5"); eq(L("C4 C5 G4"), "I5"); eq(N("C4 C5 G4"), "C5"); eq(L("A3 E4"), "VI5"); eq(L("D4 A4", 2), "I5");
    eq(L("G3 C4"), "I5/5", "五度在下面 = 转位"); eq(L("B♭3 F4".replace("♭", "b")), "♭VII5");
    eq(L("C4 D4"), "-", "二度不认"); eq(L("F4 B4"), "-", "三全音不认"); eq(L("C4 F4 C5"), "IV5/1", "四度 = 倒过来的五度（转位写最低音在调里的级数，同 C/E = I/3）"); eq(L("C4 C#4 D4"), "-");
  });
  it("三度 / 六度双音（v0.16.65，user 11-10「好，按你的提议来」）= 省了五音的三和弦：三度下面那个音当根音、五音按调里补；六度 = 转位", () => {
    eq(L("C4 E4"), "I"); eq(L("D4 F4"), "ii"); eq(L("A3 C4"), "vi"); eq(L("B3 D4"), "vii°"); eq(L("G3 B3"), "V");
    eq(L("E3 C4"), "I/3", "mi 在下 do 在上 = 六度 = 转位"); eq(N("E3 C4"), "C/E"); eq(L("C4 E4 C5"), "I", "带八度重复也算");
    eq(L("F#4 A4", 1), "vii°", "G 调的 fa♯-la"); eq(L("Bb3 D4"), "♭VII", "调外的根音：五音照样按调里的补");
    const r = readChord(["C4", "E4"].map(P), 0)!; eq(r.best.omitted, 1, "记成省了一个音");
  });
  it("候选全给：C E G A 的候选里也有 Am7/C（点开能看）", () => {
    const r = readChord(["C4", "E4", "G4", "A4"].map(P), 0)!;
    assert(r.all.some((g) => g.name === "Am7/C"), r.all.map((g) => g.name).join(","));
    eq(r.ties.length, 1);
  });
});

describe("分解和弦（v0.16.62，user 11-09「和弦级数认「空五度」和分解和弦。 本次纪元做」）", () => {
  let id = 9900;
  const head = () => { const t = tr(initState()); return t.slice(0, headLen(t)); };
  const nn = (m: number, d = TPQ / 2): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), dur: d, lyric: null }) as Token;
  const chord = (ms: number[], d = TPQ): Token => ({ kind: "note", id: id++, pitch: spellMidi(ms[0], 0), chord: ms.slice(1).map((m) => spellMidi(m, 0)), dur: d, lyric: null }) as Token;
  const tags = (body: Token[]) => { const t = [...head(), ...body]; return brokenChords(t, () => 0).map((x) => `${t.indexOf(t[x.index])}:${chordLabel(x.read)}`).map((s) => s.split(":")[1]).join(" "); };
  it("一拍里拆开弹的三和弦 = 标在这一组第一个音；下一拍同一个和弦不再标；换和弦再标", () => {
    const S = TPQ / 4;
    eq(tags([nn(60, S), nn(64, S), nn(67, S), nn(72, S), nn(60, S), nn(64, S), nn(67, S), nn(72, S), nn(65, S), nn(69, S), nn(72, S), nn(77, S), nn(67, S), nn(71, S), nn(74, S), nn(77, S)]), "I IV V7");
  });
  it("一拍里不到三个音 = 并上下一拍（Alberti：C G E G）", () => {
    eq(tags([nn(48), nn(55), nn(52), nn(55), nn(53), nn(60), nn(57), nn(60)]), "I IV");
  });
  it("一步一步走的音阶不算；有叠音的那一拍不认（叠音照旧按叠音标）；只有两个音不认", () => {
    eq(tags([nn(60), nn(62), nn(64), nn(65), nn(67), nn(69), nn(71), nn(72)]), "");
    eq(tags([chord([60, 64, 67]), nn(60), nn(64), nn(67), nn(72)]), "I");
    eq(tags([nn(60), nn(67), nn(60), nn(67), nn(60), nn(67), nn(60), nn(67)]), "");
  });
  it("v0.16.65 按拍子轻重一层层看（user 11-10「得看节拍重音」）：整小节 → 对半 → 一拍；1 3 5 3 | 1 4 6 4 = I IV（共同音不被吞）；15351535 = 一个 I", () => {
    eq(tags([nn(60), nn(64), nn(67), nn(64), nn(60), nn(65), nn(69), nn(65)]), "I IV/1");
    eq(tags([nn(60), nn(67), nn(64), nn(67), nn(60), nn(67), nn(64), nn(67)]), "I");
  });
  it("切口只在拍上、认不出不硬凑（user 11-10「有时候不应该牵强」）：3+3+2（C E G | F A C | G B）切在拍中间 = 不标", () => {
    eq(tags([nn(60), nn(64), nn(67), nn(65), nn(69), nn(72), nn(67), nn(71)]), "");
  });
  it("三拍子没有中间的次强拍：整小节不是 = 一拍一拍看", () => {
    const t = tr(initState()), h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats: 3, beatType: 4 } : x)) as Token[];
    const S = TPQ / 4, body = [60, 64, 67, 72, 65, 69, 72, 77, 67, 71, 74, 77].map((m) => nn(m, S));
    eq(brokenChords([...h, ...body], () => 0).map((x) => chordLabel(x.read)).join(" "), "I IV V7");
    eq(brokenChords([...h, ...[60, 64, 67].map((m) => nn(m, TPQ))], () => 0).map((x) => chordLabel(x.read)).join(" "), "I", "三个四分 = 整小节一个");
  });
  it("不跨小节（user 11-10「然后不跨小节」）：二分音符 do mi | sol do 不标；同一个音重复不算级进", () => {
    eq(tags([nn(60, 2 * TPQ), nn(64, 2 * TPQ), nn(67, 2 * TPQ), nn(72, 2 * TPQ)]), "");
    eq(tags([nn(60), nn(60), nn(64), nn(64), nn(67), nn(67), nn(72), nn(72)]), "I");
  });
  it("6/8：附点四分一拍（三个八分 C E G = 一组）", () => {
    const t = tr(initState()), h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats: 6, beatType: 8 } : x)) as Token[];
    const body = [nn(60), nn(64), nn(67), nn(65), nn(69), nn(72)];
    const all = [...h, ...body], out = brokenChords(all, () => 0);
    eq(out.map((x) => chordLabel(x.read)).join(" "), "I IV"); eq(out[0]!.index, h.length); eq(out[1]!.index, h.length + 3);
  });
});
