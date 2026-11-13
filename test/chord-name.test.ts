// chord-name.test.ts —— 认和弦 + 写成级数（乐理模块里的西方功能和声：src/theory/western.ts；2026-11-09 前叫 src/score/chord-name.ts）。created 2026-11-07 by Claude Opus 5.5
//   v0.16.76（2026-11-09 Claude Fable 5.2）：门改成一小节一小节喂（只看前面），测试跟着从门进。
// 钉住 user 11-07 问的那几种歧义：换根音（转位）、挂二 / 挂四、六和弦 vs 七和弦转位、十三；调号只管第几级。
import { describe, it, eq, assert } from "./runner.mjs";
import { readChord, chordLabel, degreeOf, western } from "../src/theory/western.ts";
import { harmonyTags, barsOf, THEORIES, type HarmonyTag } from "../src/theory/index.ts";
import { initState, tr, headLen, TPQ, type Token, type Song } from "../src/score/song.ts";
import { setPartChords, songViewOf } from "../src/score/song-view.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
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
  it("三度 / 六度双音（v0.16.65，user 11-09「好，按你的提议来」）= 省了五音的三和弦：三度下面那个音当根音、五音按调里补；六度 = 转位", () => {
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
  /** 走门（一小节一小节喂给理论，v0.16.76）；只留拆开弹的那些——叠音自己的标签另算。 */
  const brokenOf = (t: Token[]): HarmonyTag[] => harmonyTags(western, { tokens: t }).filter((x) => { const k = t[x.index]!; return !(k.kind === "note" && k.chord?.length); });
  const tags = (body: Token[]) => brokenOf([...head(), ...body]).map((x) => chordLabel(x.read)).join(" ");
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
  it("v0.16.65 按拍子轻重一层层看（user 11-09「得看节拍重音」）：整小节 → 对半 → 一拍；1 3 5 3 | 1 4 6 4 = I IV（共同音不被吞）；15351535 = 一个 I", () => {
    eq(tags([nn(60), nn(64), nn(67), nn(64), nn(60), nn(65), nn(69), nn(65)]), "I IV/1");
    eq(tags([nn(60), nn(67), nn(64), nn(67), nn(60), nn(67), nn(64), nn(67)]), "I");
  });
  it("切口只在拍上、认不出不硬凑（user 11-09「有时候不应该牵强」）：3+3+2（C E G | F A C | G B）切在拍中间 = 不标", () => {
    eq(tags([nn(60), nn(64), nn(67), nn(65), nn(69), nn(72), nn(67), nn(71)]), "");
  });
  it("三拍子没有中间的次强拍：整小节不是 = 一拍一拍看", () => {
    const t = tr(initState()), h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats: 3, beatType: 4 } : x)) as Token[];
    const S = TPQ / 4, body = [60, 64, 67, 72, 65, 69, 72, 77, 67, 71, 74, 77].map((m) => nn(m, S));
    eq(brokenOf([...h, ...body]).map((x) => chordLabel(x.read)).join(" "), "I IV V7");
    eq(brokenOf([...h, ...[60, 64, 67].map((m) => nn(m, TPQ))]).map((x) => chordLabel(x.read)).join(" "), "I", "三个四分 = 整小节一个");
  });
  it("不跨小节（user 11-09「然后不跨小节」）：二分音符 do mi | sol do 不标；同一个音重复不算级进", () => {
    eq(tags([nn(60, 2 * TPQ), nn(64, 2 * TPQ), nn(67, 2 * TPQ), nn(72, 2 * TPQ)]), "");
    eq(tags([nn(60), nn(60), nn(64), nn(64), nn(67), nn(67), nn(72), nn(72)]), "I");
  });
  it("正在写的这一小节，读法跟着往里填的音变（整小节 → 对半 → 一拍，要有这一小节才看得出来）；认不出就不标，不留着刚才的", () => {
    const a = [nn(60), nn(64), nn(67)];
    eq(tags(a), "I", "只写了三个音：这一小节现在是一个 I");
    eq(tags([...a, nn(62)]), "", "第四个音不在这个和弦里：现在认不出，不硬凑");
    eq(tags([...a, nn(64), nn(60), nn(65), nn(69), nn(65)]), "I IV/1", "写满了：对半切，前半 I 后半 IV");
  });
  it("6/8：附点四分一拍（三个八分 C E G = 一组）", () => {
    const t = tr(initState()), h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats: 6, beatType: 8 } : x)) as Token[];
    const body = [nn(60), nn(64), nn(67), nn(65), nn(69), nn(72)];
    const all = [...h, ...body], out = brokenOf(all);
    eq(out.map((x) => chordLabel(x.read)).join(" "), "I IV"); eq(out[0]!.index, h.length); eq(out[1]!.index, h.length + 3);
  });
});

// 乐理模块（src/theory/，2026-11-09，user「乐理引擎可以拆出一个单独的可热插拔的模块」）：外面只认门面
describe("乐理模块：能整块换", () => {
  it("src 里模块外只从 theory/index.ts 进；门面认得出这一种理论、不认识的 id 回默认", async () => {
    const fs = (await import("node:fs" as string)) as { readdirSync(p: URL, o: { recursive: true }): string[]; readFileSync(p: URL, e: string): string };
    const bad: string[] = [];
    for (const f of fs.readdirSync(new URL("../src/", import.meta.url), { recursive: true })) {
      if (!f.endsWith(".ts") || f.replace(/\\/g, "/").startsWith("theory/")) continue;
      const s = fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
      for (const m of s.matchAll(/from "([^"]*\/theory\/[^"]+)"/g)) if (!m[1].endsWith("/theory/index.ts")) bad.push(`${f} → ${m[1]}`);
      if (/score\/chord-name/.test(s)) bad.push(`${f} 还引旧路径`);
    }
    assert(!bad.length, bad.join("；"));
    const { harmonyTheory, DEFAULT_THEORY } = await import("../src/theory/index.ts");
    eq(harmonyTheory().id, DEFAULT_THEORY); eq(harmonyTheory("没有这种").id, DEFAULT_THEORY);
  });
});

// 从 la 数级数的算法（v0.16.72；user 11-09「按曲段认乐理同意」）。v0.16.76 起它**没有入口**：「这一段是大调还是小调」要看完一段才知道，分析不猜（src/theory/index.ts 文件头 ③）；
//   等 user 定「由谁写明」再接进来。这里钉住的是算法本身 + 「停在 la 上的 track 照样从 do 数」。
describe("以 la 为主（小调）：从 la 数级数", () => {
  const M = (notes: string, fifths = 0): string => { const r = readChord(notes.split(" ").map(P), fifths, "la"); return r ? chordLabel(r) : "-"; };
  it("A 小调（不带升降号）：i、iv、V（升 sol 算调内）、III、VI、VII、ii°、vii°", () => {
    eq(M("A3 C4 E4"), "i"); eq(M("D4 F4 A4"), "iv"); eq(M("E3 G#3 B3"), "V"); eq(M("E3 G#3 B3 D4"), "V7");
    eq(M("C4 E4 G4"), "III"); eq(M("F3 A3 C4"), "VI"); eq(M("G3 B3 D4"), "VII"); eq(M("B3 D4 F4"), "ii°"); eq(M("G#3 B3 D4"), "vii°");
    eq(M("E3 C4 G4"), "III/5", "转位的最低音也从 la 数"); eq(M("A3 E4"), "I5"); eq(M("A3 C4"), "i", "三度双音");
  });
  it("别的调也一样：G 大调的关系小调 e（一个升号）——e 的和弦 = i、升 re 的减三和弦 = vii°", () => {
    eq(M("E3 G3 B3", 1), "i"); eq(M("B3 D#4 F#4", 1), "V"); eq(M("D#4 F#4 A4", 1), "vii°");
  });
  it("大调照旧（没给 = do）", () => { eq(L("A3 C4 E4"), "vi"); eq(L("E3 G#3 B3"), "III"); });
  it("v0.16.76 撤掉「最后一个音是 la 就从 la 数」（user 11-09「我直觉觉得不妥」「我们是LLAMA不是BERT，只能看到前面的」）：停在 la 上的一条 track 照样从 do 数", () => {
    let id = 7700;
    const nn = (m: number, chord: number[] = []): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: TPQ, lyric: null }) as Token;
    const st = initState(), head = tr(st).slice(0, headLen(tr(st)));
    const out = harmonyTags(western, { tokens: [...head, nn(57, [60, 64]), nn(62, [65, 69]), nn(52, [56, 59]), nn(57, [60, 64])] });
    eq(out.map((x) => western.label(x.read)).join(" "), "vi ii III vi");
    assert(!/\bla\b/.test(western.howTo(out[0]!.read)), "点开候选时不再说「按 la 数」");
  });
});

// 只看前面（v0.16.76）。这是乐理分析的前提，不是事后的检查（src/theory/index.ts 文件头有 user 11-09 原话）：
//   门只给理论一小节 + 它自己上一小节交出来的东西，后面的小节没人给它——靠的是门的形状。
//   下面是旁证：门外面那一层（把 track 切成小节）也只往前看；以后谁把门开大了（比如把整条 track 塞进去），这里会红。
describe("乐理模块：只看前面", () => {
  let id = 6600;
  const head = () => { const t = tr(initState()); return t.slice(0, headLen(t)); };
  const note = (m: number, d: number, fifths = 0, more: Record<string, unknown> = {}): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, fifths), dur: d, lyric: null, ...more }) as Token;
  it("切小节（barsOf）：调 = 走到这儿之前最近的调号；连过来的音带 tie；弱起的音靠右；没有音的小节不出", () => {
    const h = head(), bar = (): Token => ({ kind: "bar", id: id++ }) as Token;
    const t: Token[] = [...h, note(67, TPQ), bar(), { kind: "key", id: id++, fifths: 1 } as Token, note(67, 4 * TPQ), note(67, 2 * TPQ, 1, { tie: true }), { kind: "rest", id: id++, dur: 2 * TPQ } as Token, bar(), bar(), note(62, TPQ, 1)];
    const bars = barsOf(t), at = (i: number) => i - h.length;
    eq(bars.map((b) => b.notes.map((n) => at(n.index)).join(",")).join(" | "), "0 | 3 | 4 | 8");
    eq(bars[0]!.notes[0]!.pos / TPQ, 3, "弱起的一拍 = 第四拍"); eq(bars[0]!.notes[0]!.fifths, 0); eq(bars[1]!.notes[0]!.fifths, 1, "调号在它前面");
    eq(bars[2]!.notes[0]!.tie, true); eq(bars[1]!.notes[0]!.tie, undefined); eq(bars[3]!.notes[0]!.pos, 0);
    eq(`${bars[0]!.beats}/${bars[0]!.beatType}`, "4/4");
  });
  it("连过来的叠音（跨小节的长和弦）照样标；连过来的音不进分解和弦", () => {
    const stack = (more: Record<string, unknown> = {}) => note(60, 4 * TPQ, 0, { chord: [spellMidi(64, 0), spellMidi(67, 0)], ...more });
    eq(harmonyTags(western, { tokens: [...head(), stack(), stack({ tie: true })] }).map((x) => western.label(x.read)).join(" "), "I I");
    const S = TPQ / 2, t = [...head(), note(60, S), note(64, S), note(67, S), note(65, S, 0, { tie: true })];   // 第四个是连过来的（数据上不会这么写，只为钉住「不算」）
    eq(harmonyTags(western, { tokens: t }).map((x) => western.label(x.read)).join(" "), "I");
  });
  it("每一种理论：后面再写什么，前面写过去的小节标的东西一个字都不变（随机谱 × 每个截断点）", () => {
    const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const DURS = [TPQ / 4, TPQ / 2, TPQ / 2, TPQ, 2 * TPQ], ROOTS = [48, 53, 55, 57, 60, 62, 64, 65, 67, 69, 71];
    const gen = (seed: number): Token[] => {
      const r = rng(seed), pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)]!, out: Token[] = [...head()];
      let fifths = 0;
      for (let k = 0; k < 40; k++) {
        const x = r();
        if (x < 0.07) out.push({ kind: "bar", id: id++ } as Token);
        else if (x < 0.11) { fifths = pick([-2, -1, 0, 1, 2]); out.push({ kind: "key", id: id++, fifths } as Token); }
        else if (x < 0.15) { const [beats, beatType] = pick([[3, 4], [4, 4], [6, 8], [2, 4]] as const); out.push({ kind: "time", id: id++, beats, beatType } as Token); }
        else if (x < 0.22) out.push({ kind: "rest", id: id++, dur: pick(DURS) } as Token);
        else if (x < 0.55) { const root = pick(ROOTS), third = pick([3, 4]), d = pick([TPQ / 4, TPQ / 2]); for (const iv of pick([[0, third, 7, 12], [0, 7, third + 12, 7], [0, third, 7], [0, third, 7, 10]] as const)) out.push(note(root + iv, d, fifths)); }   // 拆开弹的和弦
        else if (x < 0.7) { const root = pick(ROOTS); out.push(note(root, pick(DURS), fifths, { chord: [spellMidi(root + pick([3, 4]), fifths), spellMidi(root + 7, fifths)], ...(r() < 0.2 ? { tie: true } : {}) })); }   // 叠音
        else out.push(note(pick(ROOTS) + pick([0, 1, 2, 5]), pick(DURS), fifths, r() < 0.1 ? { tie: true } : {}));
      }
      return out;
    };
    let checks = 0, seen = 0;
    for (const th of Object.values(THEORIES)) for (let seed = 1; seed <= 30; seed++) {
      const full = gen(seed), key = (xs: HarmonyTag[], edge: number) => xs.filter((x) => x.index < edge).map((x) => `${x.index}:${th.label(x.read)}:${x.read.all.map((g) => g.label).join(",")}`).join(" ");
      const want = harmonyTags(th, { tokens: full }); seen += want.length;
      for (let k = 0; k <= full.length; k++) {
        const part = full.slice(0, k), bars = barsOf(part); if (bars.length < 2) continue;
        const edge = bars[bars.length - 1]!.notes[0]!.index;   // 正在写的那一小节从这儿起；它前面的都是写过去的
        const got = key(harmonyTags(th, { tokens: part }), edge), exp = key(want, edge);
        if (got !== exp) assert(false, `理论 ${th.id}、种子 ${seed}、写到第 ${k} 个记号：前面的小节标的是「${got}」，整条写完后变成了「${exp}」`);
        checks++;
      }
    }
    assert(checks > 500 && seen > 200, `这条测试得真的比到东西（比了 ${checks} 次、一共 ${seen} 处标签）`);
  });
});

// 声部开关「不认分解和弦」（v0.16.73，user 11-09「给声部加一个开关，默认开同意」）
describe("声部开关：不认分解和弦", () => {
  let id = 7800;
  const nn = (m: number, chord: number[] = [], d = TPQ / 4): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: d, lyric: null }) as Token;
  it("关掉 = 拆开弹的不标，叠音照旧标；没给 = 认", () => {
    const st = initState(), t = [...tr(st).slice(0, headLen(tr(st))), nn(60), nn(64), nn(67), nn(72), nn(60, [64, 67], TPQ * 3)];
    eq(harmonyTags(western, { tokens: t }).map((x) => western.label(x.read)).join(" "), "I I");
    eq(harmonyTags(western, { tokens: t, broken: false }).map((x) => western.label(x.read)).join(" "), "I");
  });
  it("开 = 不写；关 = score.json parts[].chords \"stacked\"（谱面分家第三刀；原来是 brokenChords false），存了读回来还是关", () => {
    const st = initState(), off = setPartChords(st, st.at.part, "stacked");
    eq(setPartChords(st, st.at.part, "auto"), st, "本来就开 = 不变");
    eq(off.song.parts[0].chords, "stacked"); eq(setPartChords(off, st.at.part, "auto").song.parts[0].chords, undefined, "再开 = 不写");
    const save = (s: Song) => saveMxl({ song: s, extras: emptyExtras(), app: "t", date: "2026-11-09T00:00:00.000Z" });
    eq(songViewOf(openBytes("x.mxl", save(off.song)).song).chordsOf(st.at.part), "stacked");
    eq(openBytes("x.mxl", save(st.song)).song.parts[0].chords, undefined);
  });
});
