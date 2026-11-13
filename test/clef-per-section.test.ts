// clef-per-section.test.ts —— 每一段自己选谱号（v0.16.88）：自动什么时候变大谱表（例子表 = 验收）、三段三种谱号存了再开、
//   压平件里一行的那几段音都在上面一行、老写法（score minor < 4，谱号 / 大谱表 / 自动八度线挂在声部上）读进来搬到每一段、新段 / 放进来的声部照抄、手动挪上下行 = 定成手选。
// created 2026-11-10 by Claude Opus 5.5。user 11-09「staves的逻辑能不能收到clef里面…收到前面的per sheet而不是跟着歌手。只有shared staves有」
//   「可以高音低音grand用户每个sheet选」「一开始是auto，auto也会自动变成grand，你看一下是什么规则」；11-10「一同意」。设计稿 ai-docs/20261110-wave2-four-designs.md 第一节。
import { describe, it, eq, assert } from "./runner.mjs";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";
import { initState, tr, TPQ, addPart, addPaper, addTrack, removeTrack, setClefChoice, clefChoiceOf, setPaperLook, toggleStaff, setFocus, headClefOf, type Token, type Song, type EditorState } from "../src/score/song.ts";
import { resolveSongLooks } from "../src/score/clef.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { readMusicXml } from "../src/format/musicxml.ts";
import { spellMidi } from "../src/score/pitch.ts";

let id = 9800;
const nn = (m: number, chord: number[] = []): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: TPQ / 2, lyric: null }) as Token;
const head = () => tr(initState()).slice(0, 3);
const one = (midis: (number | number[])[]): Song => { const st = initState(); return { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [st.song.parts[0].id]: [...head(), ...midis.map((m) => (Array.isArray(m) ? nn(m[0], m.slice(1)) : nn(m)))] } }] }; };
const lookOf = (s: Song, paper = s.papers[0].id, part = s.parts[0].id) => resolveSongLooks(s).get(paper)!.get(part)!;
const save = (s: Song) => saveMxl({ song: s, extras: emptyExtras(), app: "t", date: "2026-11-10T00:00:00.000Z" });
const rep = <T,>(xs: T[], n: number): T[] => Array.from({ length: n }, () => xs).flat();

describe("自动什么时候变大谱表（设计稿第一节的例子表）", () => {
  it("唱的旋律 G3–E5、偶尔低于中央 C = 高音谱号一行", () => { const l = lookOf(one(rep([67, 69, 72, 74, 76, 64, 62, 55, 59, 60], 2))); eq(l.staves, 1); eq(l.clef, "G"); });
  it("吉他（低音区 / 高音偏多）都是一行（自动不把吉他变两行）", () => {
    const low = lookOf(one(rep([40, 45, 47, 50, 52, 55, 57, 59, 62, 64], 2))); eq(low.staves, 1);   // 挑哪个单谱号是原来的自动谱号算法（这一版没动；低音区挑低音谱号）
    const high = lookOf(one(rep([40, 47, 52, 55, 59, 64, 67, 71, 76, 64], 2))); eq(high.staves, 1);
  });
  it("大提琴 C2–A3 = 低音谱号一行", () => { const l = lookOf(one(rep([36, 43, 48, 52, 55, 57, 50, 45], 2))); eq(l.staves, 1); eq(l.clef, "F"); });
  it("钢琴两只手（低音 + 上面的旋律）= 大谱表", () => { const l = lookOf(one(rep([[36], [84], [43], [79], [40], [81], [48], [76]], 2) as number[][])); eq(l.staves, 2); eq(l.grand, "auto"); });
  it("只有 5 个音，上下各几个 = 不变大谱表（音太少）", () => { eq(lookOf(one([36, 84, 43, 79, 40])).staves, 1); });
  it("手写了中途换谱号 = 人在管谱号，自动不插手", () => {
    const s = one(rep([[36], [84], [43], [79]], 3) as number[][]), t = s.papers[0].tracks[s.parts[0].id];
    t.splice(5, 0, { kind: "clef", id: 1, clef: "F" } as Token);
    eq(lookOf(s).staves, 1);
  });
});

describe("每一段自己选", () => {
  it("A 段高音、B 段大谱表、C 段低音：存了再开一样；压平件两行写、A / C 的音都在上面一行", () => {
    let st = initState();
    const P = st.song.parts[0].id, body = () => [nn(60), nn(64), nn(48), nn(67)];
    st = addPaper(st); st = addPaper(st);
    const [a, b, c] = st.song.papers.map((p) => p.id);
    st = { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { [P]: [...p.tracks[P], ...body()] } })) } };
    st = setClefChoice(st, a, P, "G"); st = setClefChoice(st, b, P, "grand"); st = setClefChoice(st, c, P, "F");
    const bytes = save(st.song), back = openBytes("x.mxl", bytes).song;
    eq(back.papers.map((p) => clefChoiceOf(p, P)).join(" "), "G grand F");
    const z = unzipSync(bytes), flat = strFromU8(z["score.musicxml"]);
    assert(/<staves>2<\/staves>/.test(flat), "压平件两行");
    const pa = strFromU8(z[`.moonsinger/papers/${a}.musicxml`]), pb = strFromU8(z[`.moonsinger/papers/${b}.musicxml`]);
    assert(!/<staves>/.test(pa) && /<staves>2<\/staves>/.test(pb), "每段的正本：只有手选大谱表的那一段写两行");
    const firstNotes = flat.split("<note").slice(1, 5).map((x) => /<staff>(\d)<\/staff>/.exec(x)?.[1]).join("");
    eq(firstNotes, "1111", "A 段（一行）的音都在上面一行");
  });
  it("自动变出来的大谱表不写进每段的正本（旧版本打开不会整首变大谱表）", () => {
    const s = one(rep([[36], [84], [43], [79], [40], [81], [48], [76]], 2) as number[][]);
    eq(lookOf(s).grand, "auto");
    const z = unzipSync(save(s)), per = strFromU8(z[`.moonsinger/papers/${s.papers[0].id}.musicxml`]);
    assert(!/<staves>/.test(per), "正本一行"); assert(/<staves>2<\/staves>/.test(strFromU8(z["score.musicxml"])), "压平件两行");
  });
  it("这一段关了自动八度线：只关这一段；存了再开还在", () => {
    let st = initState(); st = addPaper(st);
    const P = st.song.parts[0].id, [a, b] = st.song.papers.map((p) => p.id);
    st = setPaperLook(st, a, P, { autoOttava: false });
    const back = openBytes("x.mxl", save(st.song)).song;
    eq(back.papers.find((p) => p.id === a)!.looks?.[P]?.autoOttava, false); eq(back.papers.find((p) => p.id === b)!.looks, undefined);
  });
  it("新的一段照抄上一段的选择（手选的谱号 = 上一段结尾用着的那个；大谱表照抄）", () => {
    let st = initState(); const P = st.song.parts[0].id;
    st = setClefChoice(st, st.song.papers[0].id, P, "F"); st = addPaper(st);
    eq(clefChoiceOf(st.song.papers[1], P), "F");
    st = setClefChoice(st, st.song.papers[1].id, P, "grand"); st = addPaper(st);
    eq(clefChoiceOf(st.song.papers[2], P), "grand");
  });
  it("把声部放进一段 = 照它前面最近出现的那一段的选择", () => {
    let st = initState(); const P1 = st.song.parts[0].id;
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, st.song.papers[0].id);
    st = setClefChoice(st, st.song.papers[0].id, "P2", "G8vb");
    st = addPaper(st); st = removeTrack(st, st.song.papers[1].id, "P2");
    eq(st.song.papers[1].tracks.P2, undefined);
    st = addTrack(st, st.song.papers[1].id, "P2");
    eq(clefChoiceOf(st.song.papers[1], "P2"), "G8vb"); void P1;
  });
  it("自动变出来的大谱表上手动把音挪到另一行 = 这一段定成手选的大谱表", () => {
    const s = one(rep([[36], [84], [43], [79], [40], [81], [48], [76]], 2) as number[][]);
    let st: EditorState = setFocus({ ...initState(), song: s }, s.papers[0].id, s.parts[0].id, 4);
    eq(clefChoiceOf(st.song.papers[0], s.parts[0].id), "auto");
    st = toggleStaff(st, 2);
    eq(clefChoiceOf(st.song.papers[0], s.parts[0].id), "grand");
  });
});

describe("老写法（score minor < 4）：声部上的老键不理，每段照它自己的 MusicXML 写的读（第 16 条，2026-11-12）", () => {
  it("声部上的谱号 F（老写法）不理：没明写 \"auto\" = 每段第一个 <clef> 写什么就是什么；大谱表只有写了 <staves>2 的那一段；声部上的「关自动八度线」不理", () => {
    let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, st.song.papers[0].id); st = addPaper(st);
    const [a, b] = st.song.papers.map((p) => p.id), P1 = st.song.parts[0].id;
    st = setClefChoice(st, a, "P2", "grand");   // 新写法只在 a 段写 <staves>2
    const z = unzipSync(save(st.song)), sj = JSON.parse(strFromU8(z[".moonsinger/score.json"]));
    sj.minor = 3; sj.parts = sj.parts.map((p: { id: string }) => (p.id === P1 ? { ...p, clef: "F" } : { ...p, autoOttava: false }));
    z[".moonsinger/score.json"] = strToU8(JSON.stringify(sj));
    const back = openBytes("x.mxl", zipSync(z)).song;
    eq(back.papers.map((p) => headClefOf(p.tracks[P1])).join(" "), "G G", "P1：每段 MusicXML 第一个 <clef> 写的是高音 = 纸头高音谱号（声部上的 F 不理）");
    eq(back.papers.map((p) => clefChoiceOf(p, "P2")).join(" "), "grand auto", "P2：只有写了 <staves>2 的那一段是大谱表");
    eq(back.papers.map((p) => p.looks?.P2?.autoOttava).join(" "), " ", "P2：声部上的「关自动八度线」不理");
  });
  it("新写法（minor 4）：只有那一段是大谱表", () => {
    let st = initState(); st = addPaper(st); const P = st.song.parts[0].id, [a] = st.song.papers.map((p) => p.id);
    st = setClefChoice(st, a, P, "grand");
    eq(openBytes("x.mxl", save(st.song)).song.papers.map((p) => clefChoiceOf(p, P)).join(" "), "grand auto");
  });
});

describe("score.json 每段 / 每个声部条目里不认识的键：更新的版本写的按 id 原样带回；同一版本的不写（第 16 条 16-3）", () => {
  const roundTrip = (bump: number) => {
    const st = initState(), bytes = save(st.song), z = unzipSync(bytes), sj = JSON.parse(strFromU8(z[".moonsinger/score.json"]));
    sj.minor = (sj.minor ?? 0) + bump; sj.papers[0].futureThing = { a: 1 }; sj.papers[0].phrases = { [st.song.parts[0].id]: [1] }; sj.parts[0].futureVoice = "x";
    z[".moonsinger/score.json"] = strToU8(JSON.stringify(sj));
    const o = openBytes("x.mxl", zipSync(z));
    return JSON.parse(strFromU8(unzipSync(saveMxl({ song: o.song, extras: o.extras, app: "t", date: "2026-11-10T00:00:00.000Z" }))[".moonsinger/score.json"]));
  };
  it("更新的版本（小版本更大）在 papers[0] / parts[0] 里写了这一版不认识的键 → 打开再存还在（退役的 phrases 在更新的版本里也算不认识的，一样原样带回）", () => {
    const again = roundTrip(1);
    eq(JSON.stringify(again.papers[0].futureThing), JSON.stringify({ a: 1 })); eq(again.parts[0].futureVoice, "x"); eq(JSON.stringify(again.papers[0].phrases), JSON.stringify({ P1: [1] }));
  });
  it("同一版本的文件里不认识的键 = 现行格式里没有定义 = 存的时候不写", () => {
    const again = roundTrip(0);
    eq(again.papers[0].futureThing, undefined); eq(again.parts[0].futureVoice, undefined); eq(again.papers[0].phrases, undefined);
  });
});

// 2026-11-10 Claude Fable 5.2 复查 v0.16.88
describe("大谱表那一段里的换谱号记号：存了不丢（原来写的时候跳过）", () => {
  const withMid = (): EditorState => {
    let st = initState(); const P = st.song.parts[0].id, a = st.song.papers[0].id;
    st = { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { [P]: [...p.tracks[P], nn(48), nn(50), { kind: "clef", id: id++, clef: "G" } as Token, nn(72), nn(74)] } })) } };
    return setClefChoice(st, a, P, "F");
  };
  const kinds = (s: Song) => s.papers[0].tracks[s.parts[0].id].map((t) => (t.kind === "clef" ? `clef:${t.clef}` : t.kind)).join(" ");
  it("手选低音 + 中途换高音 → 改成大谱表 → 存了再开：中途那个记号还在；再改回自动 = 它照样起作用", () => {
    const st = withMid(), P = st.song.parts[0].id, a = st.song.papers[0].id;
    const g = setClefChoice(st, a, P, "grand");
    eq(kinds(g.song), "key time tempo note note clef:G note note", "内存里：纸头的手选谱号去掉，中途的留着");
    const back = openBytes("x.mxl", save(g.song)).song;
    eq(clefChoiceOf(back.papers[0], P), "grand"); eq(kinds(back), "key time tempo note note clef:G note note", "存了再开还在");
    const z = unzipSync(save(g.song));
    assert(/<clef number="1"><sign>G<\/sign>/.test(strFromU8(z[`.moonsinger/papers/${a}.musicxml`]).split("</attributes>").slice(1).join("")), "正本里写成上面那一行的换谱号");
    assert(!/<clef number="1"><sign>G<\/sign><line>2<\/line><\/clef><\/attributes><note/.test(strFromU8(z["score.musicxml"])), "压平件整首两行时先不带（和原来一样）");
    const auto = setClefChoice({ ...st, song: back }, a, P, "auto");
    eq(kinds(auto.song), "key time tempo note note clef:G note note");
  });
  it("别人的钢琴谱：上面一行中途换谱号 = 读成记号；下面一行的 = 数出来报，不悄悄丢", () => {
    const xml = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1">` +
      `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>` +
      `<note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>` +
      `<attributes><clef number="1"><sign>F</sign><line>4</line></clef></attributes>` +
      `<note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>` +
      `<attributes><clef number="2"><sign>G</sign><line>2</line></clef></attributes>` +
      `<note><pitch><step>E</step><octave>3</octave></pitch><duration>2</duration><voice>1</voice><type>half</type><staff>1</staff></note></measure></part></score-partwise>`;
    const r = readMusicXml(xml), toks = r.parts[0].tokens;
    eq(toks.filter((t) => t.kind === "clef").map((t) => (t as { clef: string }).clef).join(" "), "F");
    eq(Object.entries(r.dropped).map(([k, n]) => `${k}×${n}`).join(" "), "大谱表下面一行的换谱号×1");
  });
  it("score.json 里这个声部没明写 clef \"auto\"：文件里第一个 <clef> 写什么就是什么（第 16 条：「自动」只在明写了的地方算，不猜）", () => {
    const s = one(rep([36, 43, 48, 52, 55, 57, 50, 45], 2)); eq(lookOf(s).clef, "F");
    const z = unzipSync(save(s)), sj = JSON.parse(strFromU8(z[".moonsinger/score.json"]));
    assert(sj.minor >= 4, `新写法（minor ≥ 4），实得 ${sj.minor}`); sj.parts = sj.parts.map(({ clef: _c, ...p }: { clef: string }) => p);
    z[".moonsinger/score.json"] = strToU8(JSON.stringify(sj));
    eq(clefChoiceOf(openBytes("x.mxl", zipSync(z)).song.papers[0], s.parts[0].id), "F");
    eq(clefChoiceOf(openBytes("x.mxl", save(s)).song.papers[0], s.parts[0].id), "auto", "明写了 auto（这一版存的都写）= 自动");
  });
});
