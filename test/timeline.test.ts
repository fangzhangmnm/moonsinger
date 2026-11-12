// 时间线（src/engine/timeline.ts）：谱 → 秒。created 2026-10-09 by Claude Fable 5.1
// 守的是：月读的句不在纸界切（只看休止）；块的键里没有位置（移位再复原照样命中）；SoundFont 的音符秒数；光标 ↔ 秒；没人上场 = unplayable。
import { performerOf } from "../src/performers/index.ts";
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, addPaper, addPart, TPQ, DEFAULT_BPM, type EditorState, type Token, type Song, type PaperSeg, type PartDef } from "../src/score/song.ts";
import { emptyExtras, activePerfSpec } from "../src/format/project.ts";
import { buildTimeline, LEAD_IN, type PerformerInfo } from "../src/engine/timeline.ts";
import { lightMarks } from "../src/score/perform.ts";

let nid = 7000;
const n = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", ly: string | null = null, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave: 4 }, dur, lyric: ly });
const r = (dur = TPQ): Token => ({ kind: "rest", id: nid++, dur });
const head = (t: Token[]) => t.slice(0, 3);   // 调号 / 拍号 / 速度
const Q = 60 / DEFAULT_BPM;   // 一个四分音符几秒
const spec = activePerfSpec(emptyExtras(), "r");
const info = (engine: PerformerInfo["engine"]): PerformerInfo => ({ engine, plugin: performerOf(engine), spec, velocity: 0.8, transpose: 0, gm: engine === "soundfont" ? { sha: "S", presetIndex: 3 } : null, chunk: "phrase", follow: () => 0 });
const two = (a: Token[], b: Token[]): { song: Song; parts: PartDef[] } => {
  let st: EditorState = initState(); st = addPaper(st);
  const [p1, p2] = st.song.papers, pid = st.song.parts[0].id;
  const papers: PaperSeg[] = [{ ...p1, tracks: { [pid]: [...head(p1.tracks[pid]), ...a] } }, { ...p2, tracks: { [pid]: [...head(p2.tracks[pid]), ...b] } }];
  return { song: { ...st.song, papers }, parts: st.song.parts };
};
const build = (s: { song: Song; parts: PartDef[] }, engine: PerformerInfo["engine"]) => buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => info(engine), hum: "n", singOpt: { leadIn: LEAD_IN } });

describe("时间线：月读的块", () => {
  it("一句跨两张纸不切（纸界没有休止）；中间有 ≥0.25 s 的休止才切", () => {
    const joined = build(two([n("C", "か"), n("D", "な")], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    eq(joined.chunks.length, 1, "跨纸一句"); eq(joined.chunks[0].score.SCORE.map((e) => e.kana).join(""), "かなしい");
    const cut = build(two([n("C", "か"), n("D", "な"), r()], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    eq(cut.chunks.map((c) => c.score.SCORE.map((e) => e.kana).join("")).join("|"), "かな|しい");
    eq(cut.tracks[0].kind, "clips");
  });
  it("块的位置：t0 = 第一个音 − 提前量；范围从提前量起、到最后一块的尾巴", () => {
    const t = build(two([n("C", "か"), n("D", "な"), r()], [n("E", "し"), n("F", "い")]), "tsukuyomi");
    assert(Math.abs(t.chunks[0].t0 - (0 - LEAD_IN)) < 1e-9); assert(Math.abs(t.chunks[1].t0 - (3 * Q - LEAD_IN)) < 1e-9, `第二句从第 3 拍起（${t.chunks[1].t0}）`);
    assert(Math.abs(t.range.from + LEAD_IN) < 1e-9, "范围头 = −提前量"); assert(t.range.to > t.total, "范围尾含最后一块的尾巴"); assert(Math.abs(t.total - 5 * Q) < 1e-9);
  });
  it("内容键里没有位置：前面多一个休止，键不变（歌词移位再复原照样命中）", () => {
    const a = build(two([n("C", "か"), n("D", "な")], []), "tsukuyomi"), b = build(two([r(), n("C", "か"), n("D", "な")], []), "tsukuyomi");
    eq(a.chunks[0].key, b.chunks[0].key); assert(Math.abs(b.chunks[0].t0 - a.chunks[0].t0 - Q) < 1e-9, "只是位置挪了一拍");
  });
  it("一整首 = 一块", () => {
    const s = two([n("C", "か"), r()], [n("E", "し")]);
    const t = buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => ({ ...info("tsukuyomi"), chunk: "whole" }), hum: "n", singOpt: {} });
    eq(t.chunks.length, 1);
  });
});

describe("时间线：乐器 / 光标 / 纸", () => {
  it("SoundFont：音符的秒数、预设下标、tie 并成一个音", () => {
    const s = two([n("C"), n("D"), { ...n("D"), tie: true } as Token], [n("E")]);   // tie 在后一个音上 = 接着前一个
    const t = build(s, "soundfont"), tr = t.tracks[0];
    assert(tr.kind === "sf"); if (tr.kind !== "sf") return;
    eq(tr.notes.length, 3); eq(tr.notes[0].preset, 3); eq(tr.notes[0].key, 60);
    assert(Math.abs(tr.notes[1].t0 - Q) < 1e-9 && Math.abs(tr.notes[1].t1 - 3 * Q) < 1e-9, "连音线并成 2 拍");
    assert(Math.abs(tr.notes[2].t0 - 3 * Q) < 1e-9, "第二张纸的音接在后面");
    eq(t.range.from, 0); assert(Math.abs(t.range.to - 4 * Q) < 1e-9);
  });
  it("光标 ↔ 秒：第二张纸的第一个音 = 第一张纸的长度；locate 落回那张纸的 tick", () => {
    const s = two([n("C"), n("D")], [n("E"), n("F")]);
    const t = build(s, "soundfont"), pid = s.parts[0].id, e = s.song.papers[1].tracks[pid].find((x) => x.kind === "note")!;
    assert(Math.abs((t.secondsOfToken(pid, e.id) ?? -1) - 2 * Q) < 1e-9);
    const at = t.locate(2.5 * Q)!;
    eq(at.paperId, s.song.papers[1].id); eq(at.tick, Math.floor(0.5 * TPQ));
    eq(t.papers.length, 2); assert(Math.abs(t.papers[1].t0 - 2 * Q) < 1e-9);
  });
  it("没人上场 = unplayable，不出声不替补", () => {
    const t = build(two([n("C")], []), "unknown");
    eq(t.tracks.length, 0); eq(t.unplayable.length, 1);
  });
  it("多声部：第二位歌手只在第二张纸上，秒数照样对齐", () => {
    let st: EditorState = initState(); st = addPaper(st);
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" });   // 当前 = 第二张
    const [p1, p2] = st.song.papers;
    const song: Song = { ...st.song, papers: [{ ...p1, tracks: { P1: [...head(p1.tracks.P1), n("C"), n("D")] } }, { ...p2, tracks: { P1: [...head(p2.tracks.P1), n("E")], P2: [...head(p2.tracks.P1), n("G")] } }] };
    const t = buildTimeline({ song, order: song.papers.map((p) => p.id), parts: st.song.parts, info: () => info("soundfont"), hum: "n", singOpt: {} });
    const p2t = t.tracks.find((x) => x.id === "P2")!; assert(p2t.kind === "sf"); if (p2t.kind !== "sf") return;
    assert(Math.abs(p2t.notes[0].t0 - 2 * Q) < 1e-9, "P2 的音从第二张纸起");
  });
});

describe("时间线：谱位置 → 秒（放着的时候换时间线用）", () => {
  it("secondsAt = secondsOfToken 的反面；反复里同一处两遍 = 取离 near 近的那一遍", () => {
    let st: EditorState = initState();
    const pid = st.song.parts[0].id, p1 = st.song.papers[0];
    const bar = (repeat: "start" | "end"): Token => ({ kind: "bar", id: nid++, repeat }) as unknown as Token;
    const notes = [n("C"), n("D"), n("E"), n("F")];
    const plain = { song: { ...st.song, papers: [{ ...p1, tracks: { [pid]: [...head(p1.tracks[pid]), ...notes] } }] }, parts: st.song.parts };
    const t = build(plain, "soundfont");
    for (const [k, tok] of notes.entries()) { const a = t.secondsOfToken(pid, tok.id), b = t.secondsAt(p1.id, k * TPQ, 0); assert(a !== null && b !== null && Math.abs(a - b) < 1e-9, `第 ${k} 个音 ${a} vs ${b}`); }
    eq(t.secondsAt("nope", 0, 0), null);
    const rep = { song: { ...st.song, papers: [{ ...p1, tracks: { [pid]: [...head(p1.tracks[pid]), bar("start"), ...notes, bar("end")] } }] }, parts: st.song.parts };
    const t2 = build(rep, "soundfont");
    const first = t2.secondsAt(p1.id, TPQ, 0), second = t2.secondsAt(p1.id, TPQ, 10);
    assert(first !== null && second !== null && Math.abs(first - Q) < 1e-9 && Math.abs(second - 5 * Q) < 1e-9, `两遍：${first} / ${second}`);
    const back = t2.locate(5 * Q);   // 第二遍的秒 → 纸自己的 tick（以前回的是展开后的 tick 8400，超出纸长、播放头画不出来）
    assert(back !== null && back.paperId === p1.id && back.tick === TPQ, `第二遍 locate 回纸内 tick：${JSON.stringify(back)}`);
  });
});

// 歌开头的琶音（v0.16.1，2026-11-07 by Claude Opus 5.5；家族周账 F-209，user 11-07「琶音…如果是在曲子的第一个音的话，它不会正确播放出来，它会合在一起」→ 选 A「允许在 0 之前开始滚」）：
//   旋律在第一拍（0），低音在 0 之前；时间线从最早的那个音起（录音房「从头放」从这里开始，所以真的滚得开）
describe("时间线：歌开头的琶音", () => {
  it("低音在 0 之前、旋律在 0；范围从最早的音起；不写琶音 = 范围照旧从 0 起", () => {
    const chord = (art?: string[]): Token => ({ kind: "note", id: nid++, pitch: { step: "G", alter: 0, octave: 4 }, chord: [{ step: "E", alter: 0, octave: 4 }, { step: "C", alter: 0, octave: 4 }], dur: TPQ, lyric: null, ...(art ? { art } : {}) } as Token);
    const t = build(two([chord(["arpeggio"]), n("C")], []), "soundfont"), tr0 = t.tracks[0] as { notes: { t0: number; key: number }[] };
    const first = tr0.notes.slice(0, 3).map((x) => +x.t0.toFixed(3));
    eq(JSON.stringify(first), JSON.stringify([-2 * lightMarks(spec).arpeggioSec, -lightMarks(spec).arpeggioSec, 0].map((x) => +x.toFixed(3))), "从低到高：−2 格、−1 格、0");
    assert(Math.abs(t.range.from - first[0]) < 1e-9, `范围从最早的音起（${t.range.from}）`);
    const plain = build(two([chord(), n("C")], []), "soundfont");
    eq(plain.range.from, 0, "不写琶音：范围从 0 起");
  });
});

// 7-N（2026-11-12 Claude Opus 5.5（MoonSinger小弟））：时间线这一层的接线——按力度敲的、认滚奏的演奏者（真的 SoundFont 插件），滚奏的每一下拿到当时的力度；
//   表说认（滚奏、音内渐强在滚奏上）= 出声真变。L 这里用深度 800 的曲线（velDb；真库的那一份在 test/sf-velcurve.test.ts 拿引擎核）。
import { depthCurve } from "../src/score/perform.ts";
describe("时间线：滚奏的每一下（7-N）", () => {
  const roll = (extra: Token[], art: string[]) => { const st0 = initState(), pid = st0.song.parts[0].id, p1 = st0.song.papers[0];
    const toks = [...head(p1.tracks[pid]), ...extra, { kind: "note", id: nid++, pitch: { step: "D", alter: 0, octave: 2 }, dur: 4 * TPQ, lyric: null, art } as Token, { kind: "dyn", id: nid++, value: "f" } as Token, n("D")];
    const song = { ...st0.song, papers: [{ ...p1, tracks: { [pid]: toks } }] };
    const t = buildTimeline({ song, order: [p1.id], parts: st0.song.parts, info: () => ({ ...info("soundfont"), spec: { ...spec, rollHz: 8 }, velDb: depthCurve(800) }), hum: "n", singOpt: {} });
    return (t.tracks[0] as unknown as { notes: { t0: number; vel?: number }[] }).notes.filter((x) => x.t0 < 4 * Q - 1e-6).map((x) => Math.round((x.vel ?? 0) * 127));
  };
  it("渐强盖在滚奏上 = 每一下的力度一路往上；没写 = 每一下一样", () => {
    const up = roll([{ kind: "dyn", id: nid++, value: "p" } as Token, { kind: "hairpin", id: nid++, dir: "cresc" } as Token], ["roll"]), flat = roll([{ kind: "dyn", id: nid++, value: "p" } as Token], ["roll"]);
    assert(up.length > 8 && up.every((v, k) => k === 0 || v >= up[k - 1]!) && up[up.length - 1]! > up[0]!, `渐强：${up.join(" ")}`);
    assert(flat.every((v) => v === flat[0]), `没写：${flat.join(" ")}`);
  });
  it("音内渐强在鼓的滚奏上：每一下从低长到写的力度（鼓本来做不到音内变强，滚奏例外）", () => {
    const g = roll([{ kind: "dyn", id: nid++, value: "mf" } as Token], ["roll", "swellUp"]);
    assert(g[0]! < 60 && g[g.length - 1]! <= 80 && g[g.length - 1]! > g[0]! && g.every((v, k) => k === 0 || v >= g[k - 1]!), `< ：${g.join(" ")}`);
  });
});
