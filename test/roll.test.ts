// roll.test.ts —— 滚奏（v0.16.64，总表第 26 条）。created 2026-11-09 by Claude Opus 5.5
// user 11-07「标准滚奏记号 可以，但是要可以调整密度」、11-09「滚奏也许可以顺手做一下，然后设计可以下一个纪元」。
// 守：放的时候按密度敲满（连音线连过去的也算）、不认滚奏的照一个长音放；MusicXML 往返（单音颤音三道 = 滚奏，一两道不当滚奏）；谱上三道斜杠（全音符也有）；
//   默认密度：鼓类一律 12、有音高的 14（7-N 第二批；原来军鼓 20、镲 14、底鼓 12、别的鼓 16）；乐器页调过的存得住、能回默认。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, toggleArtSel, tr, TPQ, withTrack, type Token, type NoteTok } from "../src/score/song.ts";
import { lightNotes } from "../src/engine/timeline.ts";
import { lightMarks, rollDefaultHz } from "../src/score/perform.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { engrave } from "../src/render/engrave.ts";
import { spellMidi } from "../src/score/pitch.ts";
import { emptyExtras, withNewRole, withRollHz, activePerfSpec } from "../src/format/project.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const meta = { software: "test", date: "2026-11-09" };
const info = { id: "P1", name: "Snare", instrumentName: "军鼓", sound: "drum.snare-drum", program: 0 };
let id = 9700;
const n = (m: number, dur = TPQ, extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), dur, lyric: null, ...extra }) as Token;
const head = () => { const t = tr(initState()); return t.slice(0, 3); };
const marks = (hz?: number) => ({ staccatoGate: 0.5, breath: true, gapSec: 0, ...(hz ? { rollHz: () => hz } : {}) });

describe("滚奏：放", () => {
  it("一个二分音符（120 拍 = 1 秒）每秒 16 下 = 16 下、等长、头尾接上；不认滚奏（没给 rollHz）= 照一个长音", () => {
    const toks = [...head(), n(38, 2 * TPQ, { art: ["roll"] })], map = [{ tick: 0, bpm: 120 }] as never;
    const hits = lightNotes(toks, map, true, marks(16));
    eq(hits.length, 16);
    assert(Math.abs(hits[0]!.t0) < 1e-9 && Math.abs(hits[15]!.t1 - 1) < 1e-9, `0 → 1 秒（${hits[0]!.t0} → ${hits[15]!.t1}）`);
    assert(hits.every((h, k) => k === 0 || Math.abs(h.t0 - hits[k - 1]!.t1) < 1e-9), "一下接一下");
    eq(lightNotes(toks, map, true, marks()).length, 1, "不认滚奏 = 一个音");
  });
  it("连音线连过去的也算（两个四分连着 = 1 秒，敲满整段）；没标滚奏的音不受影响", () => {
    const toks = [...head(), n(38, TPQ, { art: ["roll"] }), n(38, TPQ, { tie: true, art: ["roll"] }), n(36, TPQ)], map = [{ tick: 0, bpm: 120 }] as never;
    const hits = lightNotes(toks, map, true, marks(10));
    eq(hits.filter((h) => h.midi === 38).length, 10); eq(hits.filter((h) => h.midi === 36).length, 1);
  });
  it("默认密度：鼓类一律 12（军鼓 / 镲 / 底鼓 / 别的鼓都是），有音高的 14（7-N 第二批，user「默认是均匀，12」）", () => {
    eq([38, 40, 49, 51, 36, 45, 76].map((k) => rollDefaultHz(k)).join(","), "12,12,12,12,12,12,12"); eq(rollDefaultHz(null), 14);
  });
  it("乐器页调过的存进演奏者（可选字段）、能回默认", () => {
    let ex = withNewRole(emptyExtras(), "r1", "n");
    eq(activePerfSpec(ex, "r1").rollHz, null, "没调过 = null（按乐器默认）");
    ex = withRollHz(ex, "r1", 24, "n"); eq(activePerfSpec(ex, "r1").rollHz, 24);
    ex = withRollHz(ex, "r1", 99, "n"); eq(activePerfSpec(ex, "r1").rollHz, 40, "封顶");
    ex = withRollHz(ex, "r1", null, "n"); eq(activePerfSpec(ex, "r1").rollHz, null, "回默认 = 字段拿掉");
  });
});

describe("滚奏：写谱 / MusicXML / 画", () => {
  it("符号键盘那一下 = 光标前那个音带上滚奏；再点 = 去掉", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); const i = tr(st).findIndex((t) => t.kind === "note");
    st = toggleArtSel(select(st, i, i + 1), "roll"); assert((tr(st)[i] as NoteTok).art?.includes("roll") ?? false, "带上了");
    st = toggleArtSel(select(st, i, i + 1), "roll"); assert(!((tr(st)[i] as NoteTok).art ?? []).includes("roll"), "去掉了");
  });
  it("MusicXML 往返：写成 <tremolo type=\"single\">3</tremolo>、读回来是滚奏；一两道斜线（按拍子重复）不当滚奏、说出来", () => {
    const toks = [...head(), n(60, 4 * TPQ, { art: ["roll"] })], w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(/<ornaments><tremolo type="single">3<\/tremolo><\/ornaments>/.test(w.xml), "写了颤音");
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    assert(r.parts[0]!.tokens.some((t) => t.kind === "note" && (t.art ?? []).includes("roll")), "读回来是滚奏");
    const two = readMusicXml(w.xml.replace('<tremolo type="single">3</tremolo>', '<tremolo type="single">2</tremolo>'));
    assert(!two.parts[0]!.tokens.some((t) => t.kind === "note" && (t.art ?? []).includes("roll")), "两道不当滚奏");
    assert(Object.keys(two.dropped).length > 0, "不认的说出来");
  });
  it("谱上：带滚奏的音画三道斜杠（有符干 = 在符干上；全音符 = 符头上方）；不带的不画", () => {
    const st = initState(), lay = (items: Token[]) => engrave(withTrack(st.song, st.at.paper, st.at.part, [...head(), ...items]), { width: 600, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false }], locale: "zh", measure: createTextMeasure((s: string) => s.length * 8) } as never);
    const rolls = (L: ReturnType<typeof lay>) => L.prims.filter((p) => p.t === "path" && /(^|\s)roll(\s|$)/.test(p.cls ?? ""));
    eq(rolls(lay([n(72, 2 * TPQ, { art: ["roll"] }), n(72, 2 * TPQ)])).length, 3, "二分音符：三道");
    eq(rolls(lay([n(72, 4 * TPQ, { art: ["roll"] })])).length, 3, "全音符：三道");
    eq(rolls(lay([n(72, 2 * TPQ), n(72, 2 * TPQ)])).length, 0, "不带的不画");
  });
});

// ── 7-N 第一批（2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「这个滚奏完全没法用啊，比如如何实现我之前手动滚奏的效果？」「没法上音内渐强」）──
//   每一下按它敲下去那一刻的力度水平（出声同一份 dynLevels）；滚奏的音上音内起伏谁都能演（鼓也行）；音头那一组只算第一下、弱化 / 幽灵音每一下都算；
//   dB ↔ 力度只经过 L（perform.ts VelDb：乐器 = 引擎在那个键上实际的；这里用深度曲线代替，真库的那一份在 test/sf-velcurve.test.ts 拿引擎核）。
import { gainSegments, rollHitVelocity, noteVelocities, depthCurve, velocityForDb, swellByVelocity, velocityDb, type PerfSpec, type VelDb } from "../src/score/perform.ts";
import type { Art } from "../src/score/song.ts";
import { openBytes } from "../src/format/project.ts";
import { MARK_DEFAULTS, DYNAMICS_VEL } from "../src/format/performance.ts";
const nodeMod7n = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
/** 一位按力度敲的鼓（新的 SoundFont 候选的样子：标准力度表、音内起伏做不到）。 */
const DRUM: PerfSpec = { ...MARK_DEFAULTS, staccatoGate: 0.5, accentDb: 3, dynamicsVel: { ...DYNAMICS_VEL }, accentVel: 16, marcatoVel: 28, canSwell: false } as PerfSpec;
const C800 = depthCurve(800);
/** 照 timeline.ts 的接法排一条（力度那一路）：每个音的力度 + 滚奏每一下的力度。 */
const play = (toks: Token[], map: never, hz: number, curve: VelDb = C800, spec = DRUM) => lightNotes(toks, map, true, { ...lightMarks(spec as never), rollHz: () => hz }, (i) => noteVelocities(toks, map, spec, 80 / 127).get(i) ?? 80 / 127, rollHitVelocity(toks, map, spec, 80 / 127, undefined, undefined, curve));
describe("滚奏 7-N 第一批：每一下按当时的力度", () => {
  it("验收：Once 夹具 A 段军鼓手写的那一串（ppp、47 下、渐到 fff、1 下）= 一个滚奏长音 + 同样的 ppp、渐到、连着的 1 下，密度 28/3：每一下起点差 < 1e-6 秒、力度差 ≤ 1/127", () => {
    const fs = nodeMod7n("node:fs"), o = openBytes("once.mxl", new Uint8Array(fs.readFileSync(new URL("fixtures/songs/once-upon-a-tale.mxl", import.meta.url))));
    const hand = o.song.papers[0]!.tracks.P7!, tempo = hand.find((t) => t.kind === "tempo") as { bpm: number }, map = [{ tick: 0, bpm: tempo.bpm }] as never;
    const i0 = hand.findIndex((t) => t.kind === "dyn" && t.value === "ppp"), iF = hand.findIndex((t) => t.kind === "dyn" && t.value === "fff");
    const mid = hand.slice(i0 + 1, iF), last = hand[iF + 1] as NoteTok;
    eq([mid.length, mid.every((t) => t.kind === "note" && (t as NoteTok).dur === (mid[0] as NoteTok).dur), (hand[iF] as { ramp?: boolean }).ramp, hand.length === iF + 2].join(","), "47,true,true,true", "夹具就是这一串（ppp、47 个一样长的、渐到 fff、最后 1 个）");
    const d0 = mid[0]! as NoteTok, roll: Token[] = [...hand.slice(0, i0 + 1), { ...d0, dur: d0.dur * 47, art: [...(d0.art ?? []), "roll"] } as Token, hand[iF]!, { ...last, tie: true, art: [...(last.art ?? []), "roll"] } as Token];
    const hz = 1 / ((60 / tempo.bpm) * (d0.dur / TPQ));   // = 28/3（♩=70 的三十二分 = 每秒 9.33 下）
    assert(Math.abs(hz - 28 / 3) < 1e-9, `密度 ${hz}`);
    const a = play(hand, map, hz), b = play(roll, map, hz);
    eq(b.length, a.length, "一样多下");
    a.forEach((h, k) => { const g = b[k]!; assert(Math.abs(h.t0 - g.t0) < 1e-6, `第 ${k + 1} 下起点 ${h.t0} vs ${g.t0}`); assert(Math.abs((h.vel ?? 0) - (g.vel ?? 0)) <= 1 / 127 + 1e-9, `第 ${k + 1} 下力度 ${Math.round((h.vel ?? 0) * 127)} vs ${Math.round((g.vel ?? 0) * 127)}`); });
    assert(Math.round(b[0]!.vel! * 127) < 20 && Math.round(b[b.length - 1]!.vel! * 127) > 90, "真的从 ppp 涨到 fff");
  });
  const map1 = [{ tick: 0, bpm: 120 }] as never, dyn = (value: string, more = {}): Token => ({ kind: "dyn", id: id++, value, ...more }) as Token, hp = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: id++, dir }) as Token;
  it("鼓上的滚奏 + 渐强：每一下的力度一路往上（表说认 = 出声真变）；没写渐强渐弱 / 起伏 / 音头记号 = 每一下一样（和改之前逐项相同）", () => {
    const up = play([...head(), dyn("p"), hp("cresc"), n(38, 4 * TPQ, { art: ["roll"] }), dyn("f"), n(38, TPQ)], map1, 8).filter((h) => h.t0 < 2 - 1e-9);
    assert(up.length === 16 && up.every((h, k) => k === 0 || h.vel! >= up[k - 1]!.vel!) && up[15]!.vel! > up[0]!.vel!, `渐强：${up.map((h) => Math.round(h.vel! * 127)).join(" ")}`);
    const flat = [...head(), dyn("mf"), n(38, 4 * TPQ, { art: ["roll", "ghost"] })];
    const now = play(flat, map1, 8), before = lightNotes(flat, map1, true, { ...lightMarks(DRUM as never), rollHz: () => 8 }, (i) => noteVelocities(flat, map1, DRUM, 80 / 127).get(i) ?? 80 / 127);
    eq(JSON.stringify(now), JSON.stringify(before), "没写渐强渐弱、没写音内起伏 = 逐项相同（不给每一下的函数 = 改之前的做法）");
  });
  it("滚奏的音上音内渐强 / 鼓起：鼓也演——低 D dB 按 L 反查力度（深度 800：mf 低 6 dB = 力度 53）、写的力度是最高点；音量曲线里不再算一遍", () => {
    const sw = (a: Art) => play([...head(), dyn("mf"), n(38, 4 * TPQ, { art: ["roll", a] })], map1, 8).map((h) => Math.round(h.vel! * 127));
    const g = sw("swellUp"), b = sw("swellBoth");
    eq(velocityForDb(C800, 38, 80, 6), 53, "反查：33.3·log10(53/80) = −5.96 最接近 −6");
    assert(g[0] === 53 && g.every((v, k) => k === 0 || v >= g[k - 1]!) && g[g.length - 1]! <= 80 && g[g.length - 1]! > g[0]!, `< 从 53 长到 mf：${g.join(" ")}`);
    assert(b[0] === 53 && Math.max(...b) === 80, `<> 两头低、中间回到 mf：${b.join(" ")}`);
    const gs = gainSegments([...head(), dyn("mf"), n(38, 4 * TPQ, { art: ["roll", "swellUp"] })], map1, DRUM, undefined, undefined, true, C800, true);
    assert(!gs || gs.every((s) => s.dB === 0), "力度那一路：音量曲线里不再压音内起伏（每一下的力度里已经有了）");
    const plain = gainSegments([...head(), dyn("mf"), n(38, 4 * TPQ, { art: ["swellUp"] })], map1, DRUM, undefined, undefined, true, C800, true);
    assert(!plain, "不是滚奏的音：鼓照旧做不到音内渐强（不画灰的例外只给滚奏）");
  });
  it("力度做不出起伏的（深度 0：力度不改响度）：滚奏的音内起伏走音量曲线、每一下力度不动（不静默丢掉）", () => {
    const C0 = depthCurve(0);
    assert(!swellByVelocity(C0, 38, 6) && swellByVelocity(C800, 38, 6), "深度 0 做不出、800 做得出");
    const toks = [...head(), dyn("mf"), n(38, 4 * TPQ, { art: ["roll", "swellUp"] })];
    assert(play(toks, map1, 8, C0).every((h) => Math.round(h.vel! * 127) === 80), "每一下 mf");
    const gs = gainSegments(toks, map1, DRUM, undefined, undefined, true, C0, true)!;
    assert(!!gs && Math.abs(gs[0]!.dB + 6) < 0.3 && Math.abs(gs[gs.length - 1]!.dB) < 0.3, `音量曲线从 −6 dB 长到 0：${gs[0]!.dB.toFixed(2)} … ${gs[gs.length - 1]!.dB.toFixed(2)}`);
  });
  it("音头那一组只算第一下（重音 / 强音 / 突强 / 次重音、拍子轻重）；强后即弱 = 第一下 f、后面 p；幽灵音 / 弱化每一下都算", () => {
    const v = (art: Art[]) => play([...head(), dyn("mf"), n(38, 2 * TPQ, { art: ["roll", ...art] })], map1, 8).map((h) => Math.round(h.vel! * 127));
    const ac = v(["accent"]); eq([ac[0], ac[1], ac[7]].join(","), "96,80,80", "重音 = 第一下 +16");
    const fp = v(["fp"]); eq([fp[0], fp[1], fp[7]].join(","), "96,49,49", "强后即弱 = f 然后 p");
    const gh = v(["ghost"]); assert(gh.every((x) => x === 52), `幽灵音每一下 −28：${gh.join(" ")}`);
    const gs = gainSegments([...head(), dyn("mf"), n(38, 2 * TPQ, { art: ["roll", "fp"] })], map1, DRUM, undefined, undefined, true, C800, true);
    assert(!gs || gs.every((s) => s.dB === 0), "滚奏的强后即弱不在音量曲线里再压一遍");
  });
  it("强后即弱在不是滚奏的乐器音上：压多少 = 这件乐器的 L(p) − L(f)（深度 800：−9.74 dB；原来写死 960 = −11.68）", () => {
    const gs = gainSegments([...head(), dyn("mf"), n(60, 4 * TPQ, { art: ["fp"] })], map1, DRUM, undefined, undefined, true, C800)!;
    const end = gs[gs.length - 1]!.dB, want = velocityDb(DYNAMICS_VEL.p, 800) - velocityDb(DYNAMICS_VEL.f, 800);
    assert(Math.abs(end - want) < 0.01 && Math.abs(want + 9.74) < 0.01, `${end.toFixed(2)} vs ${want.toFixed(2)}`);
  });
  it("反查的规矩（统筹定的，写死）：只在不高于当前力度的整数里找、取 L 最接近目标的、一样近取力度高的；L 不单调也照这个规矩；不出声 = 原样", () => {
    const tie: VelDb = (_m, v) => (v === 70 || v === 60 ? -3 : v === 80 ? 0 : -50);   // 70 和 60 一样近：取 70
    eq(velocityForDb(tie, 60, 80, 3), 70);
    const bumpy: VelDb = (_m, v) => (v > 100 ? 0 : v > 90 ? -10 : -2);   // 换层：91–100 比 1–90 还轻
    eq(velocityForDb(bumpy, 60, 127, 10), 100, "不单调：照规矩取最接近的（91–100 = −10 正好），一样近取高的");
    eq(velocityForDb(() => null, 60, 77, 6), 77, "不出声 = 原样");
    eq(velocityForDb(C800, 60, 80, 0), 80, "低 0 dB = 不动");
  });
  it("结构：perform.ts 里 dB 和力度互相换只经过 velocityDb / L（VelDb）——别处没有 log10、没有写死的 960", () => {
    const src = (nodeMod7n("node:fs").readFileSync(new URL("../src/score/perform.ts", import.meta.url), "utf8") as string).replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/\/\/.*$/, ""));
    const log = src.filter((l) => /Math\.log10|\*\*|Math\.pow/.test(l)), n960 = src.filter((l) => /\b960\b/.test(l));
    assert(log.length === 1 && /export const velocityDb/.test(log[0]!), `log10 / 幂只在 velocityDb 里：${log.join(" | ")}`);
    assert(n960.length === 1 && /SF2_VEL_DEPTH = 960/.test(n960[0]!), `960 只在 SF2_VEL_DEPTH：${n960.join(" | ")}`);
  });
});
describe("滚奏 7-N 第一批：谱上", () => {
  it("滚奏的音上的音内渐强 / 鼓起：认滚奏、做不到音内变强的演奏者（鼓）不画灰；不是滚奏的音照旧画灰；不认滚奏的照旧画灰（两种谱一样）", () => {
    for (const notation of ["staff", "jianpu"] as const) {
      const st0 = initState(), lay = (items: Token[], ignores: string[]) => engrave({ ...withTrack(st0.song, st0.at.paper, st0.at.part, [...head(), ...items]), notation } as never, { width: 600, sp: 10, at: st0.at, parts: [{ id: st0.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false, ignores }], locale: "zh", measure: createTextMeasure((s: string) => s.length * 8) } as never);
      const pins = (L: ReturnType<typeof lay>) => L.prims.filter((p) => p.t === "path" && /(^|\s)hairpin(\s|$)/.test(p.cls ?? "")).map((p) => /art-mute/.test(p.cls ?? ""));
      eq(JSON.stringify(pins(lay([n(38, 2 * TPQ, { art: ["roll", "swellUp"] })], ["swellGrow"]))), "[false]", `${notation}：滚奏 + < 在鼓上不灰`);
      eq(JSON.stringify(pins(lay([n(38, 2 * TPQ, { art: ["swellUp"] })], ["swellGrow"]))), "[true]", `${notation}：不是滚奏的照旧灰`);
      eq(JSON.stringify(pins(lay([n(38, 2 * TPQ, { art: ["roll", "swellUp"] })], ["swellGrow", "roll"]))), "[true]", `${notation}：这位不认滚奏 = 照旧灰`);
    }
  });
});
// 力度记号放在一张纸最后一个音的后面（7-N 第一批第 1 条；user 新版 Once upon a Tale：军鼓 mp + 两个连着的滚奏一直滚到这张纸结束、后面没有音可以挂 fff）
import { moveMarkToEnd, markAtEnd } from "../src/score/song.ts";
import { dynLevels } from "../src/score/perform.ts";
describe("力度记号放纸尾（7-N）", () => {
  const dyn = (value: string): Token => ({ kind: "dyn", id: id++, value }) as Token, hp = (): Token => ({ kind: "hairpin", id: id++, dir: "cresc" }) as Token;
  const stOf = (toks: Token[]) => { const st0 = initState(); return { ...st0, song: withTrack(st0.song, st0.at.paper, st0.at.part, toks), caret: toks.length }; };
  it("挪到这一段结尾：放到最后一个音后面（后面的小节线照旧在后面）；那里原来的力度记号被湮灭、挪过去的算数；已经在结尾 = 原样", () => {
    const fDyn = dyn("f"), toks = [...head(), dyn("mp"), hp(), n(38, 3 * TPQ, { art: ["roll"] }), fDyn, n(38, 3 * TPQ, { art: ["roll"], tie: true }), { kind: "bar", id: id++ } as Token];
    const i = toks.indexOf(fDyn), r = moveMarkToEnd(stOf(toks), i), out = tr(r.st);
    eq(out.slice(3).map((t) => (t.kind === "dyn" ? (t as { value: string }).value : t.kind)).join(" "), "mp hairpin note note f bar", "f 在最后一个音后面、小节线前面");
    assert(markAtEnd(out, out.findIndex((t) => t === fDyn)) && !markAtEnd(out, 3), "markAtEnd");
    const again = moveMarkToEnd(r.st, out.indexOf(fDyn)); assert(again.st === r.st || tr(again.st).every((t, k) => t === out[k]), "已经在结尾 = 原样");
    const withOld = [...head(), dyn("mp"), n(38, TPQ), dyn("p"), n(38, TPQ), dyn("ff")], m = moveMarkToEnd(stOf(withOld), 5);
    eq(tr(m.st).slice(3).map((t) => (t.kind === "dyn" ? (t as { value: string }).value : t.kind)).join(" "), "mp note note p", "原来结尾的 ff 被湮灭，挪过去的 p 算数"); eq(m.removed, 1);
  });
  it("出声：mp 渐强到纸尾的 fff = 最后一个音的音尾就是 fff（终点后面没有音 = 取前一个音的结尾）", () => {
    const toks = [...head(), dyn("mp"), hp(), n(38, 3 * TPQ, { art: ["roll"] }), n(38, 3 * TPQ, { art: ["roll"], tie: true }), dyn("fff")];
    const lv = dynLevels(toks, [{ tick: 0, bpm: 60 }] as never, DYNAMICS_VEL, 80, 16), last = lv.get(toks.length - 2)!;
    eq(Math.round(lv.get(5)!.at0), DYNAMICS_VEL.mp, "从 mp 起"); eq(Math.round(last.at1), DYNAMICS_VEL.fff, "到最后一个音的音尾 = fff");
  });
  it("排版两种谱都画、能点（在 Layout.dyns 里）；MusicXML 写出去读回来还在最后", () => {
    const fff = dyn("fff"), toks = [...head(), dyn("mp"), hp(), n(38, 3 * TPQ), n(38, 3 * TPQ), fff];
    for (const notation of ["staff", "jianpu"] as const) {
      const st0 = initState(), L = engrave({ ...withTrack(st0.song, st0.at.paper, st0.at.part, toks), notation } as never, { width: 700, sp: 10, at: st0.at, parts: [{ id: st0.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false }], locale: "zh", measure: createTextMeasure((s: string) => s.length * 8) } as never);
      assert(L.prims.some((p) => p.tok === fff.id), `${notation}：画了`); assert(L.dyns.some((d) => d.index === toks.length - 1), `${notation}：能点`);
    }
    const w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta), back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0]!.tokens;
    const last = back[back.length - 1]!; assert(last.kind === "dyn" && (last as { value: string }).value === "fff", `读回来：${last.kind}`);
  });
});

// ── 7-N 第三批：滚奏的「变化」（乐器页里的试验选项，默认没有；2026-11-12 Claude Opus 5.5（MoonSinger小弟））──
//   user「默认没有变化，我试了之后告诉你该sunset变化还是默认变化」：没选 = 和以前逐项相同；选了「左右手交替 + 小随机」= 数照 src/engine/roll-variation.ts 那一处、按音的 id 定种子
import { varyRoll, rollRand, ROLL_HANDS } from "../src/engine/roll-variation.ts";
import { performerInfoOf, trialKey } from "../src/core/render.ts";
import { activeId } from "../src/format/project.ts";
describe("滚奏 7-N 第三批：变化（左右手交替 + 小随机，试验）", () => {
  const even = (k: number, vel = 80 / 127) => Array.from({ length: k }, (_, i) => ({ midi: 38, t0: i * 0.1, t1: (i + 1) * 0.1, vel }));
  it("在数之内：第一下不挪、最后一下的结尾不挪、每一下的结尾 = 下一下真正的起点（同一个键先松再按）、起点只挪间隔的 ±3%、力度在手和随机的范围里", () => {
    const base = even(60), v = varyRoll(base, 4242, "hands"), R = ROLL_HANDS, d = 0.1;
    eq(v.length, 60);
    assert(v[0]!.t0 === 0 && Math.abs(v[59]!.t1 - 6) < 1e-12, "头尾不挪");
    assert(v.every((h, i) => i === 59 || h.t1 === v[i + 1]!.t0), "接得上");
    assert(v.every((h, i) => Math.abs(h.t0 - base[i]!.t0) <= R.time * d + 1e-12 && (i === 0 || h.t0 > v[i - 1]!.t0)), "起点只挪一点、先后不乱");
    assert(v.some((h, i) => Math.abs(h.t0 - base[i]!.t0) > 1e-6), "真的挪了");
    const lo = Math.floor(80 * (1 - R.hand) * (1 - R.vel)), hi = Math.ceil(80 * (1 + R.vel));
    assert(v.every((h) => { const m = Math.round(h.vel! * 127); return m >= lo && m <= hi && Math.abs(h.vel! * 127 - m) < 1e-9; }), `力度在 ${lo}–${hi}：${v.map((h) => Math.round(h.vel! * 127)).join(" ")}`);
  });
  it("左右手：双数下平均比单数下轻（约 3%）；随机按种子定——同一个种子每次一样、换种子就不一样", () => {
    const v = varyRoll(even(400), 7, "hands"), mean = (r: number) => { const xs = v.filter((_, i) => i % 2 === r).map((h) => h.vel!); return xs.reduce((a, b) => a + b, 0) / xs.length; };
    const ratio = mean(1) / mean(0);
    assert(ratio < 0.99 && ratio > 0.95, `双数下 / 单数下 = ${ratio.toFixed(3)}`);
    eq(JSON.stringify(varyRoll(even(30), 7, "hands")), JSON.stringify(varyRoll(even(30), 7, "hands")), "同一个种子 = 同一串");
    assert(JSON.stringify(varyRoll(even(30), 7, "hands")) !== JSON.stringify(varyRoll(even(30), 8, "hands")), "换种子 = 不一样");
    assert(rollRand(1, 2, 0) !== rollRand(1, 2, 1), "力度和时间两路随机互不牵连");
  });
  it("时间线：没选 = 和以前逐项相同；选了 = 同样多下、种子 = 这个滚奏的音的 id；按音量曲线的（没有力度）只挪时间", () => {
    const toks = [...head(), n(38, 4 * TPQ, { art: ["roll"] })], map = [{ tick: 0, bpm: 120 }] as never, roll = toks[toks.length - 1]!;
    const plain = lightNotes(toks, map, true, marks(8), () => 80 / 127), on = lightNotes(toks, map, true, { ...marks(8), rollVar: "hands" }, () => 80 / 127);
    eq(on.length, plain.length, "一样多下");
    eq(JSON.stringify(on), JSON.stringify(varyRoll(plain, roll.id, "hands")), "= 均匀的那一串按这个音的 id 变一下");
    const noVel = lightNotes(toks, map, true, { ...marks(8), rollVar: "hands" });
    assert(noVel.every((h) => h.vel === undefined) && noVel.some((h, i) => Math.abs(h.t0 - plain[i]!.t0) > 1e-6), "没有力度的只挪时间");
  });
  it("试验选项只跟这位：键 = 角色 + 上场那位；渲染计划不带 = 没有变化（不进歌）", () => {
    const ex = withNewRole(emptyExtras(), "r1", "n"), part = { id: "P1", role: "r1", mic: "m1" } as never, banks = { presetIndex: () => 0, velCurve: () => null } as never;
    const key = trialKey("r1", activeId(ex, "r1"));
    eq(performerInfoOf(ex, part, banks, { rollVar: new Map([[key, "hands"]]) }).rollVar, "hands", "选了的那位");
    eq(performerInfoOf(ex, part, banks, { rollVar: new Map([[trialKey("r1", "别人"), "hands"]]) }).rollVar, undefined, "换了上场的人 = 不跟过去");
    eq(performerInfoOf(ex, part, banks).rollVar, undefined, "不带试验 = 没有");
  });
});
