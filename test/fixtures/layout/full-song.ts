// full-song.ts —— 排版分家（施工单 1b）守卫 3 用的「用全」测试歌：把排版器认得的写法各用一遍，三首真歌没盖到的都在这里。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟；施工单 ai-docs/20261111-score-surface-construction-plan.md 1b、切线表 ai-docs/20261111-engrave-cut-map.md 第五节）。
//   和 test/fixtures/format/sample-song.ts 一个路数：id 连着编、不进 .mxl。以后守卫 4（全量：每个 token 都有图元）接着用它。
//   改这首歌 = 底本全变：只加不改，加了就 node scripts/freeze-layout-surface.mjs 重冻（排版器没动的时候）。
import { TPQ, type Song, type Token } from "../../../src/score/song.ts";
import { MELISMA_MARK } from "../../../src/score/lyrics.ts";
import { paperOf } from "../../../src/score/paper.ts";
import { percKindOf } from "../../../src/gm/percussion.ts";
import type { PartView } from "../../../src/render/engrave.ts";

const Q = TPQ, E = Q / 2, S = Q / 4, H = Q * 2, W = Q * 4, T3 = (E * 2) / 3;
type Step = "C" | "D" | "E" | "F" | "G" | "A" | "B";
const p = (step: Step, octave = 4, alter = 0) => ({ step, alter, octave });

export function fullSong(): Song {
  let id = 1;
  const t = (x: Record<string, unknown>) => ({ ...x, id: id++ }) as unknown as Token;
  const head = (fifths: number, beats: number, beatType: number, bpm: number) => [t({ kind: "key", fifths }), t({ kind: "time", beats, beatType }), t({ kind: "tempo", bpm })];
  const n = (pitch: ReturnType<typeof p> | null, dur: number, more: Record<string, unknown> = {}) => t({ kind: "note", pitch, dur, lyric: null, ...more });
  const r = (dur: number) => t({ kind: "rest", dur });

  // 第一张纸「A」 ── 人声：歌词（连字符、拖腔、空音高）、各种演奏法、连线、连音线、三连音、力度 / 发夹（顺着、反着、没终点）/ 渐到、风格、
  //   反复（|: :|×3 房子 1. 2.）、Segno / To Coda / Coda / D.S. al Coda、段落线 / 终止线、中途换调换拍号
  const aV: Token[] = [
    ...head(2, 4, 4, 96),
    t({ kind: "groove", style: "pop" }), t({ kind: "dyn", value: "mp" }), t({ kind: "hairpin", dir: "cresc" }),
    n(p("D", 5), Q, { lyric: "ka", art: ["accent"] }),
    n(p("E", 5), E, { lyric: "ki", art: ["staccato"], slur: true }), n(p("F", 5, 1), E, { lyric: "ku", slur: true }),
    n(p("G", 5), Q, { lyric: "ke", slur: true }), n(p("A", 5), Q, { lyric: MELISMA_MARK }),
    t({ kind: "dyn", value: "f" }),
    t({ kind: "bar", repeat: "start" }),
    n(p("B", 4), T3, { lyric: "hap", hyph: true }), n(p("A", 4), T3, { lyric: "py" }), n(null, T3, { lyric: "空" }),
    n(p("G", 4), Q, { lyric: "a", art: ["tenuto", "breath"], inhale: "soft" }), r(H),
    t({ kind: "nav", what: "ending", nums: [1] }), n(p("F", 4, 1), W, { lyric: "i", art: ["marcato"] }), t({ kind: "bar", repeat: "end", times: 3 }),
    t({ kind: "nav", what: "ending", nums: [2] }), n(p("E", 4), H, { lyric: "u" }), n(p("E", 4), H, { tie: true }),
    n(p("D", 4), Q * 6, { lyric: "ee" }), n(p("C", 4, 1), H),   // 跨自动小节线的长音（切开、连音线）
    t({ kind: "key", fifths: -1 }), t({ kind: "time", beats: 3, beatType: 4 }),
    t({ kind: "nav", what: "segno" }),
    n(p("F", 4), Q, { lyric: "e", art: ["stress"] }), n(p("G", 4), Q, { lyric: "o", art: ["unstress"] }), n(p("A", 4), Q, { lyric: "n", art: ["ghost"] }),
    t({ kind: "bar", style: "double" }),
    t({ kind: "dyn", value: "p" }), t({ kind: "hairpin", dir: "dim" }),
    n(p("B", 4, -1), Q, { lyric: "sa", art: ["whisper"] }), n(p("C", 5), Q, { art: ["sfz"] }),
    t({ kind: "dyn", value: "f" }),   // 渐弱的终点比起点强 = 方向说了算（推定的灰字）
    n(p("D", 5), Q, { art: ["fp"] }),
    t({ kind: "nav", what: "toCoda" }),
    n(p("C", 5), Q, { art: ["swellUp"] }), n(p("B", 4, -1), Q, { art: ["swellDown"] }), n(p("A", 4), Q, { art: ["swellBoth", "breath"], inhale: "big" }),
    t({ kind: "dyn", value: "mf", ramp: true }),
    t({ kind: "nav", what: "coda" }), n(p("G", 4), Q * 3, { lyric: "la" }),
    t({ kind: "hairpin", dir: "cresc" }),   // 没有终点：画到纸尾 + 推定的灰字
    n(p("F", 4), Q), n(p("E", 4), Q), n(p("D", 4), Q),
    t({ kind: "nav", what: "dsCoda" }), t({ kind: "bar", style: "final" }),
  ];
  // 钢琴（这一段手选大谱表）：叠音 + 琶音、滚奏、整小节休止、手写八度线；比人声短 = 后面补齐的空小节
  const aP: Token[] = [
    ...head(2, 4, 4, 96),
    n(p("D", 5), H, { chord: [p("A", 4), p("F", 4, 1), p("D", 4)], art: ["arpeggio"] }), n(p("G", 2), H, { art: ["roll"] }),
    r(W),
    t({ kind: "ottava", shift: 1 }), n(p("A", 5), Q), n(p("B", 5), Q), n(p("C", 6, 1), Q), n(p("D", 6), Q), t({ kind: "ottava", shift: 0 }),
    n(p("D", 3), S), n(p("F", 3, 1), S), n(p("A", 3), S), n(p("D", 4), S), n(p("E", 4), E), n(p("C", 4, 1), E), n(p("D", 4), H),
  ];
  // 低音：纸头手选低音谱号、中途换高音谱号、按拍的符杠、临时记号（小节内记忆）
  const aB: Token[] = [
    ...head(2, 4, 4, 96), t({ kind: "clef", clef: "F" }),
    n(p("D", 3), Q), n(p("A", 2), Q), n(p("F", 2, 1), E), n(p("G", 2, 1), E), n(p("G", 2), E), n(p("G", 2, 1), E),
    t({ kind: "clef", clef: "G" }), t({ kind: "ottava", shift: 1 }), n(p("A", 5), Q), n(p("B", 5), Q), n(p("C", 6, 1), H), t({ kind: "ottava", shift: 0 }),   // 手写八度线（单谱表才画）
  ];
  // 铃：两小串很高的音夹在普通的音里 = 自动八度线（高音不到三分之一，不然自动谱号整段换掉）；从头到尾一条长发夹 = 比一行还长写「cresc. - - -」
  const mid = () => [n(p("G", 4), Q), n(p("A", 4), Q), n(p("B", 4), Q), n(p("C", 5, 1), Q), n(p("D", 5), Q), n(p("E", 5), Q), n(p("F", 5, 1), Q), n(p("G", 5), Q)];
  const aK: Token[] = [...head(2, 4, 4, 96), t({ kind: "hairpin", dir: "cresc" }), n(p("A", 4), Q), n(p("C", 7), E), n(p("D", 7), E), n(p("E", 7), E), n(p("B", 4), E), ...mid(), n(p("F", 7, 1), E), n(p("G", 7), E), n(p("A", 7), E), n(p("B", 4), E), ...mid(), ...mid(), t({ kind: "dyn", value: "ff" }), n(p("A", 4), W)];
  // 合租一家（X 主人 + Y 房客）：光标不在这家 = 叠成一行
  const aX: Token[] = [...head(2, 4, 4, 96), n(p("F", 5, 1), Q), n(p("G", 5), Q), n(p("A", 5), H)];
  const aY: Token[] = [...head(2, 4, 4, 96), n(p("D", 3), H), n(p("A", 2), H)];
  // 鼓一家（D 整套鼓主人 + W 木鱼房客）= 并成一套五线鼓谱；C 牛铃自己一行 = 一线谱
  const aD: Token[] = [...head(2, 4, 4, 96), n(p("C", 2), E), n(p("F", 2, 1), E), n(p("D", 2), E), n(p("F", 2, 1), E), n(p("C", 2), E), n(p("C", 2), E), n(p("D", 2), Q)];
  const aW: Token[] = [...head(2, 4, 4, 96), r(Q), n(p("E", 5), Q), r(Q), n(p("E", 5), Q)];
  const aC: Token[] = [...head(2, 4, 4, 96), n(p("C", 5), Q), n(p("C", 5), Q, { art: ["ghost"] }), n(p("C", 5), H)];
  // 单声 + × 符头 + 不认的记号：叠音下面画灰、× 符头、跳音 / 连线画灰
  const aM: Token[] = [...head(2, 4, 4, 96), n(p("E", 5), Q, { chord: [p("C", 5, 1)], art: ["staccato"], slur: true }), n(p("D", 5), Q), n(p("A", 4), H)];

  // 第二张纸「B」：6/8、弱起、拍数不对的小节、风格（两小节一轮 + 错开）、Fine / D.C. al Fine
  const bV: Token[] = [
    ...head(-1, 6, 8, 120), t({ kind: "groove", style: "latin", shift: true }),
    n(p("C", 5), E, { lyric: "to" }), t({ kind: "bar" }),
    n(p("F", 5), Q, { lyric: "ri" }), n(p("E", 5), E, { lyric: "na" }), n(p("D", 5), E, { lyric: "mi" }), n(p("C", 5), E), n(p("B", 4, -1), E),
    n(p("A", 4), Q, { lyric: "da" }), t({ kind: "bar" }),   // 拍数不对的小节
    t({ kind: "nav", what: "fine" }), n(p("G", 4), Q * 3, { lyric: "yo" }), t({ kind: "nav", what: "dcFine" }),
  ];
  const bM: Token[] = [t({ kind: "key", fifths: -1, mode: "minor" }), t({ kind: "time", beats: 6, beatType: 8 }), t({ kind: "tempo", bpm: 120 }), r(E), n(p("F", 4), Q * 3, { chord: [p("C", 4)] }), n(p("E", 4), Q * 3)];   // 小调 = 淡的「6=」
  const bK: Token[] = [...head(0, 6, 8, 120), n(p("C", 6), Q * 3), n(p("F", 6), Q * 3)];   // C 调 = 淡的「1=C」
  // 第三张纸「C」：隐藏
  const cV: Token[] = [...head(0, 4, 4, 80), n(p("C", 4), W, { lyric: "end" })];

  return {
    title: "排版分家守卫歌", hum: "u", credits: "词曲：守卫\n编：小弟", arrangement: "A B (A)×2 Z", paper: paperOf("A5"),
    parts: [
      { id: "V", role: "r1", mic: "m1" }, { id: "P", role: "r2", mic: "m2" }, { id: "B", role: "r3", mic: "m3" }, { id: "K", role: "r4", mic: "m4" },
      { id: "X", role: "r5", mic: "m5" }, { id: "Y", role: "r6", mic: "m6", host: "X" },
      { id: "D", role: "r7", mic: "m7" }, { id: "W", role: "r8", mic: "m8", host: "D" }, { id: "C", role: "r9", mic: "m9" },
      { id: "M", role: "r10", mic: "m10" },
    ],
    papers: [
      { id: "pa", name: "A", tracks: { V: aV, P: aP, B: aB, K: aK, X: aX, Y: aY, D: aD, W: aW, C: aC, M: aM }, looks: { P: { grand: true } } },
      { id: "pb", name: "B", tracks: { V: bV, M: bM, K: bK } },
      { id: "pc", name: "C", tracks: { V: cV }, hidden: true },
    ],
  } as Song;
}

/** 声部视图里的旗（宿主按台上那位算的，排版器只读）：三首真歌一样都没给过。 */
export function fullFlags(song: Song): Record<string, Partial<PartView>> {
  const bLyric = song.papers[1]!.tracks.V!.find((x) => x.kind === "note" && (x as { lyric?: string }).lyric === "na")!.id;
  return {
    V: { abbr: "Vo.", ignores: ["roll"], lyricMute: new Set([bLyric]) },
    P: { abbr: "Pno.", noLyrics: "这位不唱字" },
    B: { abbr: "B." },
    K: { abbr: "Glk.", empty: true, badges: ["静"] },
    X: { abbr: "X" }, Y: { abbr: "Y" },
    D: { abbr: "Dr.", perc: percKindOf({ bank: 128, program: 0 })! },
    W: { abbr: "Wb.", perc: percKindOf({ bank: 128, program: 0, note: 76 })! },
    C: { abbr: "Cb.", perc: percKindOf({ bank: 128, program: 0, note: 56 })! },
    M: { abbr: "M.", xHead: true, mono: true, ignores: ["staccato", "slur"] },
  };
}

/** 边界情形（长期的对抗性测试用；2026-11-11 谱面分家 1b 收尾时加）：每一首只为逼一种角落。 */
export function edgeSongs(): { name: string; song: Song; hide?: string[]; width?: number }[] {
  let id = 1;
  const t = (x: Record<string, unknown>) => ({ ...x, id: id++ }) as unknown as Token;
  const head = (fifths = 0, beats = 4, beatType = 4) => [t({ kind: "key", fifths }), t({ kind: "time", beats, beatType }), t({ kind: "tempo", bpm: 100 })];
  const n = (pitch: ReturnType<typeof p> | null, dur: number, more: Record<string, unknown> = {}) => t({ kind: "note", pitch, dur, lyric: null, ...more });
  const base = (parts: string[], papers: Song["papers"]): Song => ({ hum: "u", paper: paperOf("A5"), parts: parts.map((id, k) => ({ id, role: `r${k}`, mic: `m${k}` })), papers } as Song);
  return [
    // 一张纸上一个声部都没有；一张纸上唯一的声部隐藏着；一张正常的
    { name: "empty-papers", hide: ["H"], song: base(["A", "H"], [
      { id: "e1", name: "空", tracks: {} },
      { id: "e2", name: "全隐藏", tracks: { H: [...head(), n(p("C", 5), W)] } },
      { id: "e3", name: "正常", tracks: { A: [...head(), n(p("E", 4), Q), n(p("G", 4), Q, { lyric: "a" }), n(p("C", 5), H)] } },
    ]) },
    // 一个声部只有谱头（后面全是补齐的空小节）+ 一个正常的
    { name: "empty-track", song: base(["A", "B"], [{ id: "p1", name: "", tracks: { A: [...head(2), n(p("D", 5), W), n(p("A", 4), W)], B: head(2) } }]) },
    // 跨好几行的长音（9 个小节，自动小节线切开、连音线跨行）、弱起、拍数不对的小节、整小节休止
    { name: "long-note", song: base(["A"], [{ id: "p1", name: "", tracks: { A: [...head(), n(p("G", 4), Q), t({ kind: "bar" }), n(p("C", 5), W * 9), t({ kind: "rest", dur: W }), n(p("D", 5), H), t({ kind: "bar" }), n(p("E", 5), W)] } }]) },
    // 窄到一个小节自己一行都放不下（小节里逐列切开）
    { name: "narrow", width: 160, song: base(["A"], [{ id: "p1", name: "", tracks: { A: [...head(), ...Array.from({ length: 32 }, (_, k) => n(p((["C", "D", "E", "F", "G", "A", "B"] as const)[k % 7], 5), S))] } }]) },
  ];
}
