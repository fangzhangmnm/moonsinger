// chord-pin.test.ts —— 人挑过的和弦读法（v0.16.87）：挑 → 照写的标、对不上 = 灰 +「?」不删、单音旋律照写、
//   存了再开还在（MusicXML 原生 <harmony>）、别人谱里的和弦记号接到音上（标在长音中间 / 休止上的丢掉并数出来）、移调跟着挪、换调号级数重算。
// created 2026-11-10 by Claude Opus 5.5。user 11-09 拍「输入法候选」、11-10「一同意」「三可以接」；设计稿 ai-docs/20261110-wave2-four-designs.md 第四节。
import { describe, it, eq, assert } from "./runner.mjs";
import { harmonyTags, harmonyTheory } from "../src/theory/index.ts";
import { initState, tr, headLen, TPQ, setChordPin, transposePapers, setHeaderAt, headerSpot, type Token, type Song, type NoteTok } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { readMusicXml } from "../src/format/musicxml.ts";
import { spellMidi } from "../src/score/pitch.ts";

const th = harmonyTheory();
let id = 9500;
const nn = (m: number, chord: number[] = [], extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: TPQ, lyric: null, ...extra }) as Token;
const head = () => { const t = tr(initState()); return t.slice(0, headLen(t)); };
const labels = (toks: Token[]) => harmonyTags(th, { tokens: toks }).map((x) => th.label(x.read)).join(" ");
const songOf = (body: Token[]) => { const st = initState(); const p = st.song.papers[0]; return { ...st, song: { ...st.song, papers: [{ ...p, tracks: { [st.song.parts[0].id]: [...head(), ...body] } }] } }; };
const save = (s: Song) => saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-11-10T00:00:00.000Z" });

describe("挑读法：照写的标", () => {
  it("C E G A 自动 = I6；挑 Am7/C（候选里有）= vi7/1，不灰", () => {
    const st = songOf([nn(60, [64, 67, 69])]), toks = tr(st), i = headLen(toks);
    eq(labels(toks), "I6");
    const rd = harmonyTags(th, { tokens: toks })[0].read, am = rd.all.find((g) => g.name === "Am7/C");
    assert(!!am, "候选里有 Am7/C");
    const st2 = setChordPin(st, st.song.papers[0].id, st.song.parts[0].id, i, th.pinOf(am!));
    const r2 = harmonyTags(th, { tokens: tr(st2) })[0].read;
    eq(th.label(r2), "vi7/1"); eq(r2.pinned, true); eq(r2.stale, undefined);
    eq(r2.auto && th.label(r2.auto), "I6", "自动认的留着（候选 / 改回自动用）");
  });
  it("改回自动 = 音上的和弦名去掉", () => {
    const st = songOf([nn(60, [64, 67], { harm: { root: { step: "A", alter: 0 }, kind: "min" } })]), i = headLen(tr(st));
    const st2 = setChordPin(st, st.song.papers[0].id, st.song.parts[0].id, i, null);
    assert(!(tr(st2)[i] as NoteTok).harm, "去掉了"); eq(labels(tr(st2)), "I");
  });
  it("音改了、挑的不在候选里 = 照样标、带「?」、不删（C E G 上写着 Am）", () => {
    const toks = [...head(), nn(60, [64, 67], { harm: { root: { step: "A", alter: 0 }, kind: "min" } })];
    const r = harmonyTags(th, { tokens: toks })[0].read;
    eq(th.label(r), "vi?"); eq(r.stale, true); eq(r.all[0].name, "Am");
  });
  it("旋律里一个单音写着和弦（认不出和弦）= 照写的标、不灰", () => {
    const toks = [...head(), nn(64, [], { harm: { root: { step: "C", alter: 0 }, kind: "maj" } }), nn(65)];
    const tags = harmonyTags(th, { tokens: toks });
    eq(tags.length, 1); eq(th.label(tags[0].read), "I"); eq(tags[0].read.stale, undefined);
  });
  it("这一版不认识的种类（别的软件写的 other + 字）= 只写和弦名，不算级数", () => {
    const toks = [...head(), nn(60, [], { harm: { root: { step: "C", alter: 0 }, kind: "?7#11" } })];
    eq(labels(toks), "C7#11");
  });
});

describe("挑读法：跟着谱走", () => {
  it("整首移高一个全音：Am7/C → Bm7/D（和音一起挪）", () => {
    const st = songOf([nn(60, [64, 67, 69], { harm: { root: { step: "A", alter: 0 }, kind: "m7", bass: { step: "C", alter: 0 } } })]);
    const mv = transposePapers(st, [st.song.papers[0].id], { semis: 2 }), h = (tr(mv)[headLen(tr(mv))] as NoteTok).harm!;
    eq(`${h.root.step}${h.root.alter} ${h.kind} ${h.bass?.step}${h.bass?.alter}`, "B0 m7 D0");
  });
  it("只换调号：和弦名不变、级数按新调号算（C 调的 I → G 调的 IV）", () => {
    const st = songOf([nn(48, [], { harm: { root: { step: "C", alter: 0 }, kind: "maj" } }), nn(55)]);
    const st2 = setHeaderAt(st, st.song.papers[0].id, st.song.parts[0].id, headerSpot(tr(st), 0), { key: 1 });
    eq((tr(st2)[headLen(tr(st2))] as NoteTok).harm!.root.step, "C"); eq(labels(tr(st2)), "IV");
  });
});

describe("挑读法：存进歌里", () => {
  it("存了再开还在；文件里是 <harmony>；没挑过的歌不写 <harmony>", () => {
    const st = songOf([nn(60, [64, 67, 69], { harm: { root: { step: "A", alter: 0 }, kind: "m7", bass: { step: "C", alter: 0 } } }), nn(62, [65, 69])]);
    const bytes = save(st.song), back = openBytes("x.mxl", bytes).song;
    const h = (back.papers[0].tracks[back.parts[0].id].find((t) => t.kind === "note") as NoteTok).harm;
    eq(JSON.stringify(h), JSON.stringify({ root: { step: "A", alter: 0 }, kind: "m7", bass: { step: "C", alter: 0 } }));
    const plain = songOf([nn(60, [64, 67])]), xml = new TextDecoder().decode(save(plain.song));
    assert(!/<harmony>/.test(xml), "没挑过 = 不写");
  });
});

describe("接别人谱里的和弦记号（user 11-10「三可以接」）", () => {
  const xml = (body: string) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>x</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${body}</measure></part></score-partwise>`;
  const note = (step: string, dur = 1) => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${dur}</duration><voice>1</voice><type>quarter</type></note>`;
  const harm = (root: string, kind: string, extra = "") => `<harmony><root><root-step>${root}</root-step></root><kind>${kind}</kind>${extra}</harmony>`;
  const pins = (x: string) => { const r = readMusicXml(xml(x)); return { pins: r.parts[0].tokens.filter((t) => t.kind === "note").map((t) => ((t as NoteTok).harm ? `${(t as NoteTok).harm!.root.step}:${(t as NoteTok).harm!.kind}` : "-")).join(" "), dropped: r.dropped }; };
  it("标在音开头的 = 挂到那个音上（C 大三、G 属七）", () => {
    eq(pins(harm("C", "major") + note("E") + note("G") + harm("G", "dominant") + note("F") + note("D")).pins, "C:maj - G:7 -");
  });
  it("标在长音中间（<offset>）/ 后面是休止 = 丢掉并数出来", () => {
    const r = pins(note("E", 2) + harm("F", "major", "<offset>1</offset>") + `<note><rest/><duration>1</duration><voice>1</voice></note>` + harm("G", "major") + `<note><rest/><duration>1</duration><voice>1</voice></note>`);
    eq(r.pins, "-"); eq(Object.values(r.dropped).reduce((a, b) => a + b, 0), 2);
  });
  it("带 <degree> 的（只读种类会读错）= 不接、数出来", () => {
    const r = pins(harm("C", "dominant", "<degree><degree-value>11</degree-value><degree-alter>1</degree-alter><degree-type>add</degree-type></degree>") + note("E"));
    eq(r.pins, "-"); assert(Object.keys(r.dropped).some((k) => k.includes("和弦记号")), "数出来了");
  });
});
