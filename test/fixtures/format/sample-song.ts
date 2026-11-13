// 冻结样本用的歌（把能存的东西都用上）+ 比较用的规范化。created 2026-10-07 by Claude Fable 5.1（test/format.test.ts bigSong 同款，独立一份免得测试改了样本跟着漂）。
// 2026-10-08（0.5.0 多声部多纸，存法 B）：两张纸 × 两个声部，第二张纸只有第一个声部（user「每个sheet的track数量当然不同」）。
// scripts/freeze-format-sample.mjs 用它生成 test/fixtures/format/v<版本>/sample.mxl + expected.json；test/format-guard.test.ts 用它算形状快照。
// 2026-10-13（Claude Fable 5.1；家族周账 F-18）：样本要把**每个可选字段都用上**，形状指纹 shapeOf 对数组取**所有元素的并集**（原来只照第一项）——
//   不然 parts[].host / 轨的 bypass / 效果 / 发送 / 嵌的音源这些只在第二项、或样本没写的键，快照看不见，加了删了都不红。sampleExtras() 同理把休息室 / 录音房的可选项都摆上。
import { templateFxParams } from "../../../src/format/template.ts";
import { grooveDataOf, grooveStyle } from "../../../src/score/groove.ts";
import { TPQ, type Song, type Token, firstTrack } from "../../../src/score/song.ts";
import { withRoleName, emptyExtras, withActive, withCastAs, activeId, withSwap, withSf2Candidate, withTrack, withMaster, newBusId, withTranspose, withSingChunk, withGapSec, withRoleConcept, withCalibration, type Extras } from "../../../src/format/project.ts";
import type { FxV2, CandidateV2 } from "../../../src/format/contract.ts";
// 仓里不装 @types/node（同 test/format-guard.test.ts）：node:fs / node:crypto 走动态 import。
const nodeFs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
const nodeCrypto = (await import("node:crypto" as string)) as { createHash(a: string): { update(b: Uint8Array): { digest(e: "hex"): string } } };
import { MELISMA_MARK } from "../../../src/score/lyrics.ts";
import { paperOf } from "../../../src/look/paper.ts";

const Q = TPQ, E = TPQ / 2, T3 = (TPQ / 2) * 2 / 3;
const p = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** id 按纸序 × 声部序 × 下标连着编（读回来时 project.ts 也这么重编 → 逐字节可比）。 */
/** 冻结样本里的视图态（score.json 可选字段 view；形状快照要盖到它）。 */
export const sampleView = () => ({ finder: { mode: "style", open: { year: "medieval", style: "jazz" }, scroll: 320, row: "jazz::Q8355", pick: "Q8355|0:40" }, scope: "all" as const, pageFlow: true as const, paper: "p2", parts: { P2: { muted: true as const }, P1: { hidden: true as const, only: true as const, solo: true as const } }, mp3: "small" as const, pad: { fifths: 2, scale: "minor", unit: "quarter" as const, tuplet: 3 as const, low: 55 }, ref: { open: true as const, left: 40, top: 90, width: 320, height: 240 }, mode: "listen" as const });   // pad：2026-10-08 Opus 5.5 加（可选字段，不升版本）；ref = 参考窗的窗（2026-10-08 深夜 v0.8，同上）；mode = 打开时的模式（2026-10-10 Opus 5.5，同上）；mp3 / parts.P1 的三面旗 2026-10-13 补进样本（只为了形状快照盖到）
export function sampleSong(): Song {
  let id = 1;
  const t = (x: Omit<Token, "id"> & Record<string, unknown>) => ({ ...x, id: id++ }) as Token;
  const p1P1: Token[] = [
    t({ kind: "key", fifths: 2 }), t({ kind: "time", beats: 3, beatType: 4 }), t({ kind: "tempo", bpm: 96 }),
    t({ kind: "pedal", which: "sustain", act: "down" }),   // 2026-11-12（score minor 9）：延音踏板，踩下 → 换 → 抬起
    t({ kind: "note", pitch: p("F", 4, 1), dur: Q, lyric: "う" }),
    t({ kind: "pedal", which: "sustain", act: "change" }),
    t({ kind: "note", pitch: p("A"), dur: E, lyric: "さ", art: ["swellUp", "staccato"], slur: true }),   // 2026-10-13：演奏法（含音内起伏 → score.json swells）+ 连线
    t({ kind: "note", pitch: p("A"), dur: E, lyric: null, tie: true }),
    t({ kind: "note", pitch: p("B"), dur: Q, lyric: MELISMA_MARK, art: ["breath"], inhale: "soft" }),   // 2026-10-13：出声的换气
    t({ kind: "pedal", which: "sustain", act: "up" }),
    t({ kind: "bar" }),
    t({ kind: "note", pitch: p("D", 5), dur: T3, lyric: "hap", hyph: true }),
    t({ kind: "note", pitch: p("C", 5, 1), dur: T3, lyric: "py," }),   // score minor 7（7-M）：歌词里的标点
    t({ kind: "note", pitch: null, dur: T3, lyric: "爱", lang: "zh" }),
    t({ kind: "note", pitch: p("B"), dur: Q * 1.5, lyric: "你。" }),   // score minor 7（7-M）
    t({ kind: "key", fifths: -1 }),
    t({ kind: "rest", dur: Q }),
    t({ kind: "note", pitch: p("F"), dur: Q * 3, lyric: "ね" }),
    t({ kind: "tempo", bpm: 72 }),
    t({ kind: "time", beats: 4, beatType: 4 }),
    t({ kind: "note", pitch: p("G"), dur: Q, lyric: "る" }),
    t({ kind: "rest", dur: Q * 3 }),
    t({ kind: "bar" }),
  ];
  // 第二个声部（贝斯线）：自己的调号 / 拍号（各声部自己的画法），比第一个短（纸界补休止）
  const p1P2: Token[] = [
    t({ kind: "key", fifths: 2 }), t({ kind: "time", beats: 3, beatType: 4 }), t({ kind: "tempo", bpm: 96 }),
    t({ kind: "note", pitch: p("D", 3), dur: Q * 2, lyric: null }),
    t({ kind: "note", pitch: p("A", 2), dur: Q, lyric: null }),
    t({ kind: "bar" }),
    t({ kind: "note", pitch: p("G", 2), dur: Q * 3, lyric: null }),
  ];
  // 第二张纸「副歌」：只有第一个声部
  const p2P1: Token[] = [
    t({ kind: "key", fifths: -1 }), t({ kind: "time", beats: 4, beatType: 4 }), t({ kind: "tempo", bpm: 72 }),
    t({ kind: "groove", style: "pop" }),   // 2026-11-13（score minor 12，16-4 D）：风格记号 → score.json grooves 里有它的拍子表
    t({ kind: "note", pitch: p("C", 5), dur: Q, lyric: "la" }),
    t({ kind: "note", pitch: p("B"), dur: Q, lyric: "la" }),
    t({ kind: "rest", dur: Q * 2 }),
  ];
  // 2026-10-13 加（都是可选字段，只为了形状快照盖到）：P2 合租挂在 P1 上 + 不要自动八度线；歌词按歌词排；不印小节号；第二张纸隐藏；这首歌的许可。
  // 2026-11-11 加（score minor 5，谱面分家第三刀）：这首歌怎么看的四样都用上（简谱、不标级数、按 C 调看、两条轨各一种和弦选项），形状快照盖到它们。
  return { title: "冻结样本", credits: "词曲：样本\n演唱：月读", arrangement: "1 (2)×2", textLang: "en", paper: { kind: "A5" }, density: "default", staffMm: "default", marginMm: "default",   // 第 17 条 17-1（score minor 13）：纸张存选择
    rights: "CC0", lyricFit: "lyrics", barNumbers: "off",
    notation: "letters", chordTags: false, chordTagStyle: "root", viewInC: true, middleC: 3,   // score minor 14 起样本标根音；score minor 6（7-B）起样本用字母谱、中央 C 叫 C3（minor 5 那份冻的是简谱）
    expressions: false,   // score minor 8（7-G）起：演奏法和表情不显示
    parts: [{ id: "P1", role: "r1", mic: "m1", chords: "stacked" }, { id: "P2", role: "r2", mic: "m2", host: "P1", chords: "fold" }],
    papers: [{ id: "p1", name: "", tracks: { P1: p1P1, P2: p1P2 }, looks: { P2: { autoOttava: false } } }, { id: "p2", name: "副歌", tracks: { P1: p2P1 }, hidden: true }],   // v0.16.88：不要自动八度线按段
    grooves: { pop: grooveDataOf(grooveStyle("pop")!) } };   // app 写风格记号那一刻抄进来的（16-4 D）
}
/** 冻结样本的休息室 + 录音房（2026-10-13）：把契约里每个可选字段都摆上一份——月读元音版上场（同 v1 样本的 quality light）+ 移调 / 分段唱 / 底色缝 / 校准；
 *  第二位 = 乐器概念 by value + 一位 SoundFont 演奏者（嵌进歌的子集 = test/fixtures/sf2 那份小 sf2 → manifest.sounds 有一条；音效固定原速 sfx）；
 *  录音房：一条混音轨（带混响、名字、增益）、m1 旁通 + 压缩（侧链 key）+ 发送 + 出到混音轨、总轨链 + 关限幅。freeze 和守卫都用这一份（不然两边形状对不上）。 */
export function sampleExtras(song: Song): Extras {
  const hum = "n";
  let ex = withActive(emptyExtras(), "r1", "c1", hum);
  ex = withSingChunk(ex, "r1", "sheet", hum);   // 分段唱只有月读完整版（c1）有这个字段
  ex = withActive(ex, "r1", "c2", hum);
  ex = withTranspose(ex, "r1", 12, hum); ex = withGapSec(ex, "r1", 0.05, hum); ex = withCalibration(ex, "r1", -3, hum);
  ex = withRoleConcept(ex, "r2", { name: "Castanets", sound: "wood.castanets", concept: { ids: { wikidata: "Q209337", local: "castanets", musicxml: "wood.castanets", gm: [{ program: 0, bank: 128 }], hs: "111.141" }, name: { zh: "响板", en: "Castanets", ja: "カスタネット" }, score: { zh: "响板", en: "Castanets" }, abbr: { en: "Cast." } } }, hum);   // 没起名字（12-4）；概念带谱上的叫法 + 简写
  ex = withRoleName(ex, "r1", "主唱", hum);   // 起了名字的（12-4：休息室 minor 1 的 name 只在起了名字时写）
  const subset = nodeFs.readFileSync(new URL("../sf2/gu-square-castanets.sf2", import.meta.url)), sha256 = nodeCrypto.createHash("sha256").update(subset).digest("hex");
  ex = withSf2Candidate(ex, "r2", { name: "Castanets", bank: 0, program: 0, note: 60, sfx: { key: 60, midi: 60, centsPerKey: 100, align: true }, subset, sha256, embed: true,
    origin: { name: "gu-square-castanets.sf2", fileSha256: sha256, bytes: subset.length, library: "test-fixture" },
    credit: { attribution: ["样本"], license: { name: "样本许可", url: "https://example.invalid/license", text: "样本", textSha256: "0".repeat(64) } }, calibrationDb: -6, gapSec: 0.02 }, hum);
  { const r2 = ex.lounge.r2 as unknown as { sound: string; concept: NonNullable<CandidateV2["castAs"]>["concept"] };   // 候选记着「作为哪件乐器上场」（castAs，2026-11-08；name = 上场时的叫法）
    ex = withCastAs(ex, "r2", activeId(ex, "r2"), { name: "Castanets", sound: r2.sound, concept: r2.concept }, hum);
    ex = withSwap(ex, "r2", activeId(ex, "r2"), hum, { fresh: true }); }   // 换上台那一刻的设置指纹（asCast，2026-11-09；施工单 §5 R3）
  // 每格写全（16-4 A2：新插的一格 = 模板那一份，再按样本改几个；出声那一层不替缺的补）。wet / predelayMs 是参数表里没有的键（原样带着、引擎不认）
  const reverb: FxV2 = { id: "f1", kind: "reverb", on: true, params: { ...templateFxParams("reverb", true)!, room: 0.8, damp: 0.4, wet: -12, dry: -120, predelayMs: 20 }, note: "样本" };
  const comp: FxV2 = { id: "f2", kind: "comp", on: false, params: { ...templateFxParams("comp")!, thresholdDb: -18, ratio: 3, attackMs: 10, releaseMs: 120, makeupDb: 0 }, key: "m2" };
  const gain: FxV2 = { id: "f3", kind: "gain", on: true, params: { dB: -3 } };
  const bus = newBusId(ex);
  ex = withTrack(ex, bus, { kind: "bus", name: "空间感", gainDb: -3, pan: 0.2, chain: [reverb], sends: [], to: "master" });
  ex = withTrack(ex, "m1", { bypass: true, chain: [comp], sends: [{ to: bus, gainDb: -12 }], to: bus });
  ex = withTrack(ex, "m2", { gainDb: -1.5, pan: -0.5 });
  ex = withMaster(ex, { gainDb: -1, limiter: false, chain: [gain] });
  return ex;
}
/** 比较用：键排序；小节线 / 记号的 id 是编辑器自己的（文件里不存），归零。 */
/** 规范化（比较用）：对象的键排序；音的演奏法（art）是一个集合、先后不算数——也排序（2026-11-12：音内起伏单独存在 score.json、读回来挂在最后，
 *  样本歌加了「音内渐强 + 跳音」之后写读的先后对不上；旧的冻结样本里没有带两个以上演奏法的音，排序不影响它们）。 */
export const canon = (v: unknown, key = ""): unknown => Array.isArray(v) ? (key === "art" && v.every((x) => typeof x === "string") ? [...v].sort() : v.map((x) => canon(x))) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k], k)])) : v;
const zeroMarks = (ts: Token[]) => ts.map((t) => (t.kind === "note" || t.kind === "rest" ? t : { ...t, id: 0 }));
/** 第一张纸第一个声部那串（第 1 版样本的 expected.tokens 比的就是它）。 */
export const canonTokens = (s: Song) => canon(zeroMarks(firstTrack(s)));
/** 所有纸 × 所有声部（「纸 id/声部 id」→ 那串）。 */
export const canonTracks = (s: Song) => canon(Object.fromEntries(s.papers.flatMap((p) => s.parts.flatMap((part) => (p.tracks[part.id] ? [[`${p.id}/${part.id}`, zeroMarks(p.tracks[part.id])]] : [])))));
/** 形状指纹：值换成类型名、键排序、**数组 = 所有元素形状的并集**（2026-10-13 起；原来只照第一项，第二项才有的键 / 不同引擎的候选看不见）——写出来的键集合变了就不一样。
 *  并集：两个对象 = 键并起来逐键再并；两个数组 = 元素再并；两个类型名不同 = "null|string" 这样排好序接起来；一边对象一边类型名（样本里没有）= { "|": [a, b] }。 */
export const shapeOf = (v: unknown): unknown => Array.isArray(v) ? (v.length ? [v.map(shapeOf).reduce(mergeShape)] : []) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shapeOf((v as Record<string, unknown>)[k])])) : v === null ? "null" : typeof v;
export function mergeShape(a: unknown, b: unknown): unknown {
  if (Array.isArray(a) && Array.isArray(b)) return a.length && b.length ? [mergeShape(a[0], b[0])] : a.length ? a : b;
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const A = a as Record<string, unknown>, B = b as Record<string, unknown>, keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
    return Object.fromEntries(keys.map((k) => [k, k in A && k in B ? mergeShape(A[k], B[k]) : k in A ? A[k] : B[k]]));
  }
  if (typeof a === "string" && typeof b === "string") return [...new Set([...a.split("|"), ...b.split("|")])].sort().join("|");
  return a === b ? a : { "|": [a, b] };
}
