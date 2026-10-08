// 修的记号（跳音 / 重音 / 保持 / 呼吸 + 力度）：编辑、MusicXML 往返、存 → 开、出声的数。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08 拍「挂在音上 + 选区条」「月读在那儿换气」。守的：art 挂在音上、力度是不占时值的 token；MusicXML 原生（articulations / dynamics / breath-mark）；
//   旧谱（没有这些）出声逐样本不变（gainSegments = null）。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, writeRest, writeBar, select, tr, toggleArtSel, artStateSel, setDynSel, dynMarkSel, toggleBreath, dynAt, withArt, firstTrack, songOf, headTokens, tempoMapOf,
  type NoteTok, type Token, type EditorState } from "../src/score/song.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { gainSegments, noteEnd } from "../src/score/perform.ts";
import { MARK_DEFAULTS } from "../src/format/performance.ts";
const ACCENT_SEC = MARK_DEFAULTS.accentSec;
import { applyGain } from "../src/audio/mix.ts";
import { DYNAMICS_DB, ARTICULATION } from "../src/format/performance.ts";

const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
const SPEC = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb };
/** 四个四分音符 C D E F（光标在最后）。 */
function four(): EditorState { let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } }; for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return st; }
const noteIdx = (st: EditorState) => tr(st).flatMap((t, i) => (t.kind === "note" ? [i] : []));
const meta = { software: "test", date: "2026-10-08" };
const info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };

describe("修：编辑（song.ts）", () => {
  it("选区里切演奏法：都没有 → 都加；都有 → 都去；有的有 = some", () => {
    let st = four(); const [a, b] = noteIdx(st);
    st = select(st, a, b + 1);
    eq(artStateSel(st).staccato, "none");
    st = toggleArtSel(st, "staccato"); eq(artStateSel(st).staccato, "all");
    deq((tr(st)[a] as NoteTok).art, ["staccato"]);
    st = select(st, a, a + 1); st = toggleArtSel(st, "staccato");
    st = select(st, a, b + 1); eq(artStateSel(st).staccato, "some");
    st = toggleArtSel(st, "staccato"); eq(artStateSel(st).staccato, "all", "some → 都加上");
    st = toggleArtSel(st, "staccato"); eq((tr(st)[a] as NoteTok).art, undefined, "都去掉 = 没有 art 字段（存档不多空数组）");
  });
  it("演奏法按 ARTS 的顺序、不重复", () => {
    const t: NoteTok = { kind: "note", id: 1, pitch: null, dur: 1680, lyric: null };
    deq(withArt(withArt(withArt(t, "breath", true), "staccato", true), "staccato", true).art, ["staccato", "breath"]);
  });
  it("力度：选区开头放一个；再放 = 改它；去掉；选区还盖着同样的音", () => {
    let st = four(); const [, b, c] = noteIdx(st);
    st = select(st, b, c + 1);
    st = setDynSel(st, "f");
    const k = tr(st).findIndex((t) => t.kind === "dyn");
    eq(k, b, "插在选区开头"); eq(dynMarkSel(st), "f");
    eq(tr(st)[st.sel!.from].kind, "note", "选区还从那个音起"); eq(st.sel!.to - st.sel!.from, 2);
    st = setDynSel(st, "p"); eq(tr(st).filter((t) => t.kind === "dyn").length, 1, "改，不再插一个"); eq(dynMarkSel(st), "p");
    eq(dynAt(tr(st), noteIdx(st)[0]), "mf", "力度记号前面的音 = mf"); eq(dynAt(tr(st), noteIdx(st)[3]), "p");
    st = setDynSel(st, null); eq(tr(st).some((t) => t.kind === "dyn"), false); eq(tr(st)[st.sel!.from].kind, "note");
  });
  it("呼吸（pad 符号层）：光标前那个音切；前面是休止 = null", () => {
    let st = four();
    st = toggleBreath(st)!; const last = noteIdx(st)[3];
    deq((tr(st)[last] as NoteTok).art, ["breath"]);
    st = toggleBreath(st)!; eq((tr(st)[last] as NoteTok).art, undefined, "再点 = 去掉");
    st = writeBar(st); st = toggleBreath(st)!; deq((tr(st)[last] as NoteTok).art, ["breath"], "隔着小节线也算");
    st = writeRest(st); eq(toggleBreath(st), null, "前面是休止");
  });
});

describe("修：MusicXML（musicxml.ts）", () => {
  it("强音 = <strong-accent/>，往返原样回来", () => {
    let st = four(); const [a] = noteIdx(st);
    st = select(st, a, a + 1); st = toggleArtSel(st, "marcato");
    const toks = tr(st), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(w.xml.includes("<strong-accent/>"), "强音没写");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note");
    deq((back[0] as NoteTok).art, ["marcato"]);
  });
  it("往返：演奏法 / 力度 / 呼吸都原样回来；力度在谱上方", () => {
    let st = four(); const [a, b, , d] = noteIdx(st);
    st = select(st, a, b + 1); st = toggleArtSel(st, "accent"); st = toggleArtSel(st, "staccato");
    st = select(st, b, b + 1); st = setDynSel(st, "ff");
    st = select(st, d + 1, d + 2); st = toggleArtSel(st, "tenuto"); st = toggleArtSel(st, "breath");
    const toks = tr(st), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(w.xml.includes(`<direction placement="above"><direction-type><dynamics><ff/></dynamics></direction-type></direction>`), "力度没写对");
    assert(/<articulations><staccato\/><accent\/><\/articulations>/.test(w.xml), "演奏法没写对");
    assert(w.xml.includes("<breath-mark/>"), "呼吸没写");
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    const back = r.parts[0].tokens;
    deq(back.filter((t) => t.kind === "note").map((t) => (t as NoteTok).art ?? []), toks.filter((t) => t.kind === "note").map((t) => (t as NoteTok).art ?? []));
    deq(back.map((t) => t.kind), toks.map((t) => t.kind), "token 顺序（力度在那个音前面）");
    eq(Object.keys(r.dropped).length, 0);
  });
  it("跨小节线被拆开的音：跳音在第一段、呼吸在最后一段，读回来并成一个音", () => {
    let st = initState(); st = { ...st, input: { ...st.input, unit: 4 } };   // 二分
    st = writeDegree(st, 1, "near"); st = { ...st, input: { ...st.input, unit: 5 } }; st = writeDegree(st, 2, "near");   // 二分 + 全音符 = 跨过第一条小节线
    const i = noteIdx(st)[1]; st = select(st, i, i + 1); st = toggleArtSel(st, "staccato"); st = toggleArtSel(st, "breath");
    const w = writeMusicXml({ parts: [{ info, tokens: tr(st) }] }, meta);
    const pieces = [...w.xml.matchAll(/<note id="n\d+(-2)?">[\s\S]*?<\/note>/g)].map((m) => m[0]).filter((x) => x.includes("<step>D</step>"));
    eq(pieces.length, 2, "拆成两段");
    assert(pieces[0].includes("<staccato/>") && !pieces[0].includes("breath-mark"), "第一段：跳音"); assert(pieces[1].includes("<breath-mark/>") && !pieces[1].includes("staccato"), "最后一段：呼吸");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note") as NoteTok[];
    eq(back.length, 2); deq(back[1].art, ["staccato", "breath"]);
  });
  it("别家谱：ppp → pp、fff → ff；sfz / 不认的演奏法数出来报；和弦里每个音都标的并到一个音", () => {
    const x = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part></part-list><part id="P1"><measure number="1">
<attributes><divisions>1</divisions></attributes>
<direction><direction-type><dynamics><ppp/></dynamics></direction-type></direction>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><notations><articulations><staccato/></articulations></notations></note>
<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><notations><articulations><staccato/><accent/></articulations></notations></note>
<direction><direction-type><dynamics><fff/></dynamics></direction-type></direction>
<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><notations><articulations><strong-accent/></articulations></notations></note>
<direction><direction-type><dynamics><sfz/></dynamics></direction-type></direction>
<note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><notations><articulations><spiccato/></articulations></notations></note>
<direction><direction-type><dynamics><rfz/></dynamics></direction-type></direction>
<note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><notations><dynamics><fp/></dynamics></notations></note>
</measure></part></score-partwise>`;
    const r = readMusicXml(x), toks = r.parts[0].tokens;
    deq(toks.filter((t) => t.kind === "dyn").map((t) => (t as { value: string }).value), ["pp", "ff"]);
    deq((toks.find((t) => t.kind === "note") as NoteTok).art, ["staccato", "accent"], "和弦音的重音并上来");
    eq(r.dropped["力度记号（这一版不认的，如 sfz）"], 1, "rfz 不认"); eq(r.dropped["演奏法记号（这一版不认的）"], 1, "spiccato 不认");
    const ns = toks.filter((t) => t.kind === "note") as NoteTok[];
    deq(ns[1].art, ["marcato"], "strong-accent = 强音（2026-10-08 起认）");
    deq(ns[2].art, ["sfz"], "音前面方向里的 sfz = 挂到这个音上（2026-10-08 起认）");
    deq(ns[3].art, ["fp"], "音上的 <notations><dynamics><fp/> = 强后即弱");
  });
  it("大谱表：<staff> 写在 <type> 后面（MusicXML 4.0 的元素顺序）", () => {
    const st = four();
    const w = writeMusicXml({ parts: [{ info: { ...info, staves: 2 }, tokens: tr(st) }] }, meta);
    const n = /<note id="n\d+">[\s\S]*?<\/note>/.exec(w.xml)![0];
    assert(n.indexOf("<type>") < n.indexOf("<staff>"), n);
  });
  it("这首歌的许可：<identification><rights> 存 → 开原样（user 2026-10-08「用户自己写的那一部分，用户可以选」）", () => {
    const st = four(), song = { ...st.song, rights: "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/" };
    const bytes = saveMxl({ song, hum: "n", extras: emptyExtras(), app: "test", date: meta.date });
    eq(openBytes("x.mxl", bytes).song.rights, song.rights);
    const w = writeMusicXml({ rights: "a & b", parts: [{ info, tokens: tr(st) }] }, meta);
    assert(/<identification><rights>a &amp; b<\/rights><encoding>/.test(w.xml), "rights 要在 encoding 前面（MusicXML 4.0 顺序）");
    eq(readMusicXml(w.xml).rights, "a & b");
  });
  it("存 → 开（.mxl）：art / 力度原样", () => {
    let st = four(); const [a] = noteIdx(st);
    st = select(st, a, a + 1); st = toggleArtSel(st, "tenuto"); st = setDynSel(st, "mp");
    const o = openBytes("x.mxl", saveMxl({ song: st.song, hum: "n", extras: emptyExtras(), app: "test", date: meta.date }));
    const back = firstTrack(o.song);
    eq(back.filter((t) => t.kind === "dyn").length, 1); deq((back.find((t) => t.kind === "note") as NoteTok).art, ["tenuto"]);
  });
});

describe("修：出声的数（perform.ts / lab-score / mix）", () => {
  it("没有力度 / 重音 = null（旧谱逐样本不变）；只有 mf = null", () => {
    let st = four(); eq(gainSegments(tr(st), undefined, SPEC), null);
    st = select(st, noteIdx(st)[0], noteIdx(st)[0] + 1); st = setDynSel(st, "mf"); eq(gainSegments(tr(st), undefined, SPEC), null);
    st = toggleArtSel(st, "staccato"); eq(gainSegments(tr(st), undefined, SPEC), null, "跳音给乐器 = 截短，不走曲线");
  });
  it("力度 f = +6 dB；重音 = 音头 ACCENT_SEC 再加 accentDb", () => {
    let st = four(); const [, b] = noteIdx(st);
    st = select(st, b, b + 1); st = setDynSel(st, "f"); st = toggleArtSel(st, "accent");
    const segs = gainSegments(tr(st), undefined, SPEC)!;
    eq(segs[0].dB, 0, "第一个音 mf");
    const acc = segs.find((s) => s.dB === DYNAMICS_DB.f + ARTICULATION.accentDb)!;
    assert(!!acc && Math.abs(acc.t1 - acc.t0 - ACCENT_SEC) < 1e-9, "重音段"); eq(segs[segs.length - 1].dB, DYNAMICS_DB.f, "后面的音还是 f");
  });
  it("月读的跳音 = 下一个字前「^」顿一下（唱法核心认的记号；user「跳音就是顿一下」）；同一处有呼吸 = 按呼吸；后面是同一个字（连音线）= 不顿", () => {
    let st = four(); const [a, b] = noteIdx(st); st = select(st, a, a + 1); st = toggleArtSel(st, "staccato");
    deq(toLabScore(tr(st), "n").SCORE.map((e) => e.before ?? null), [null, "^", null, null]);
    eq(toLabScore(tr(st), "n").SCORE[0].rest, undefined, "不切时值、不加休止");
    let both = toggleArtSel(st, "breath"); deq(toLabScore(tr(both), "n").SCORE.map((e) => e.before ?? null), [null, "v", null, null], "跳音 + 呼吸 = 按呼吸");
    const toks = tr(st).slice(); toks[b] = { ...(toks[b] as NoteTok), tie: true };
    assert(!toLabScore(toks, "n").SCORE.some((e) => e.before === "^"), "连着下一个音 = 不顿");
  });
  it("月读的重音 / 强音 = 这个字自己前面「^」（user「嗯重音也顿」）；前面一个音有呼吸 = 按呼吸", () => {
    let st = four(); const [, b, c] = noteIdx(st);
    st = select(st, b, b + 1); st = toggleArtSel(st, "accent"); st = select(st, c, c + 1); st = toggleArtSel(st, "marcato");
    deq(toLabScore(tr(st), "n").SCORE.map((e) => e.before ?? null), [null, "^", "^", null]);
    st = select(st, b, b + 1); st = toggleArtSel(st, "breath");
    deq(toLabScore(tr(st), "n").SCORE.map((e) => e.before ?? null), [null, "^", "v", null], "第二个音有呼吸 → 第三个字前按呼吸");
  });
  it("乐器 / 元音版的跳音 = 截短；呼吸 = 收短一口气（关着 = 不收）", () => {
    eq(noteEnd(0, 1, ["staccato"], { staccatoGate: 0.5, breath: false }), 0.5);
    eq(noteEnd(0, 1, ["breath"], { staccatoGate: 0.5, breath: true }), 1 - 0.16); eq(noteEnd(0, 1, ["breath"], { staccatoGate: 0.5, breath: false }), 1, "breath 关着（试听 / 听开头不落记号）= 不收短");
  });
  it("月读的呼吸 = 下一个字前「v」；没有呼吸 = 不多任何字段", () => {
    let st = four(); const plain = toLabScore(tr(st), "n");
    assert(plain.SCORE.every((e) => e.before === undefined), "没有呼吸不该有 before");
    st = select(st, noteIdx(st)[1], noteIdx(st)[1] + 1); st = toggleArtSel(st, "breath");
    deq(toLabScore(tr(st), "n").SCORE.map((e) => e.before ?? null), [null, null, "v", null]);
  });
  it("applyGain：曲线全 0 dB = 原样（±1e-6）；静音段收到 0；不改原数组", () => {
    const sr = 1000, x = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i / 7));
    const same = applyGain(x, sr, 0, [{ t0: 0, t1: 1, dB: 0 }]);
    assert(same.every((v, i) => Math.abs(v - x[i]) < 1e-6), "0 dB 变了");
    const g = applyGain(x, sr, 0, [{ t0: 0, t1: 0.5, dB: 0 }, { t0: 0.5, t1: 1, dB: -Infinity }]);
    assert(Math.abs(g[900]) < 1e-6, "静音段没收到 0"); assert(x[900] !== 0, "原数组被改了");
  });
  it("剪贴板文字：力度 = [mf]，贴回来还是力度", () => {
    const toks: Token[] = [...headTokens(), { kind: "dyn", id: 9, value: "mf" }, { kind: "note", id: 10, pitch: { step: "C", alter: 0, octave: 4 }, dur: 1680, lyric: null }];
    const s = toJianpu(toks.slice(3), 0); assert(s.startsWith("[mf] "), s);
    deq(fromJianpu(s, 0)!.map((t) => t.kind), ["dyn", "note"]);
  });
});
void songOf; void tempoMapOf;
