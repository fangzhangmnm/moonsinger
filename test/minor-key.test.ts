// minor-key.test.ts —— 调号上的「小调」（v0.16.83）：级数从 la 数、存了再开还在、大调的歌存出来一个字节不变、照抄调号的地方一起带。
// created 2026-11-10 by Claude Opus 5.5。user 11-09「同意，反正你需要选调号，就是在选调号的时候强制一起选。不过关系大小调对齐…切换大小调会很方便」；
//   设计稿 ai-docs/20261110-wave2-four-designs.md 第二节（Claude Fable 5.2）。
import { describe, it, eq, assert } from "./runner.mjs";
import { western } from "../src/theory/western.ts";
import { harmonyTags } from "../src/theory/index.ts";
import { initState, tr, headLen, TPQ, headerSpot, headerVals, setHeaderAt, setPaperHeadMinor, addPaper, addPart, setMark, writeKey, transposePapers, type Token, type Song, type KeyTok } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
import { markText, parseMark } from "../src/score/marks.ts";
import { spellMidi, keyText } from "../src/score/pitch.ts";

let id = 9100;
const nn = (m: number, chord: number[] = []): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), ...(chord.length ? { chord: chord.map((x) => spellMidi(x, 0)) } : {}), dur: TPQ, lyric: null }) as Token;
const save = (s: Song) => saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-11-10T00:00:00.000Z" });
const firstKey = (t: Token[]): KeyTok => t.find((x) => x.kind === "key") as KeyTok;
const paperOf = (s: Song) => s.papers[0].id, partOf = (s: Song) => s.parts[0].id;
/** 这条 track 开头一处切成小调。 */
const toMinor = (st: ReturnType<typeof initState>, minor = true) => setHeaderAt(st, paperOf(st.song), partOf(st.song), headerSpot(tr(st), 0), { minor });

describe("小调：级数从 la 数（人写明，分析不猜）", () => {
  it("a 小调里 Am / Dm / E = i / iv / V；同样的音在 C 大调 = vi / ii / III", () => {
    const st = initState(), head = tr(st).slice(0, headLen(tr(st)));
    const body = [nn(57, [60, 64]), nn(62, [65, 69]), nn(52, [56, 59])];
    eq(harmonyTags(western, { tokens: [...head, ...body] }).map((x) => western.label(x.read)).join(" "), "vi ii III");
    const minorHead = head.map((t) => (t.kind === "key" ? { ...t, mode: "minor" as const } : t));
    eq(harmonyTags(western, { tokens: [...minorHead, ...body] }).map((x) => western.label(x.read)).join(" "), "i iv V");
  });
  it("中途换回大调（同一个调号）：从那里起又从 do 数", () => {
    const st = initState(), head = tr(st).slice(0, headLen(tr(st))).map((t) => (t.kind === "key" ? { ...t, mode: "minor" as const } : t));
    const out = harmonyTags(western, { tokens: [...head, nn(57, [60, 64]), { kind: "key", id: id++, fifths: 0 } as Token, nn(57, [60, 64])] });
    eq(out.map((x) => western.label(x.read)).join(" "), "i vi");
  });
});

describe("小调：存进歌里", () => {
  it("大调的歌存出来不写 <mode>（老歌字节不变）；小调写 <mode>minor</mode>，存了再开还是小调", () => {
    const st = initState();
    const xmlOf = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
    assert(!/<mode>/.test(xmlOf(save(st.song))), "大调不该写 <mode>");
    const m = toMinor(st);
    assert(m !== st, "切小调要改状态");
    const back = openBytes("x.mxl", save(m.song)).song;
    eq(firstKey(back.papers[0].tracks[partOf(back)]).mode, "minor");
    eq(firstKey(openBytes("x.mxl", save(st.song)).song.papers[0].tracks[partOf(st.song)]).mode, undefined);
  });
  it("切大小调不动任何音；再切回大调 = 调号上没有 mode 这一项", () => {
    let st = initState();
    st = toMinor(st);
    const v = headerVals(tr(st), headerSpot(tr(st), 0));
    eq(v.minor, true); eq(v.key, 0);
    st = toMinor(st, false);
    assert(!("mode" in firstKey(tr(st))), "大调不该留 mode");
  });
  it("换调号不换大小调（a 小调 → 一个升号 = e 小调）", () => {
    let st = toMinor(initState());
    st = setHeaderAt(st, paperOf(st.song), partOf(st.song), headerSpot(tr(st), 0), { key: 1 });
    const k = firstKey(tr(st)); eq(k.fifths, 1); eq(k.mode, "minor");
  });
  it("记号框的小格只给升降号 = 照原来的大小调；打「6=E」= e 小调、「1=G」= G 大调", () => {
    let st = toMinor(initState());
    const i = tr(st).findIndex((t) => t.kind === "key");
    st = setMark(st, i, { kind: "key", fifths: 2 });
    eq(firstKey(tr(st)).mode, "minor"); eq(markText(firstKey(tr(st))), "6=B");
    eq(JSON.stringify(parseMark("key", "6=E")), JSON.stringify({ kind: "key", fifths: 1, mode: "minor" }));
    st = setMark(st, i, parseMark("key", "1=G")!);
    assert(!firstKey(tr(st)).mode, "1=G 是大调");
  });
});

describe("小调：照抄调号的地方一起带", () => {
  it("新的一段、新放进来的声部、中途插的调号：大小调跟着", () => {
    let st = toMinor(initState());
    st = addPaper(st);
    const p2 = st.song.papers[1];
    eq(firstKey(p2.tracks[partOf(st.song)]).mode, "minor");
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, p2.id);
    const p2b = st.song.papers[1];
    eq(Object.keys(p2b.tracks).length, 2);
    for (const t of Object.values(p2b.tracks)) eq(firstKey(t).mode, "minor");
    const st2 = writeKey({ ...st, at: { paper: p2b.id, part: partOf(st.song) }, caret: tr({ ...st, at: { paper: p2b.id, part: partOf(st.song) } }).length, sel: null }, 3);
    const ks = tr(st2).filter((t) => t.kind === "key") as KeyTok[];
    eq(ks[ks.length - 1].fifths, 3); eq(ks[ks.length - 1].mode, "minor");
  });
  it("整首移调：调号跟着挪、大小调不变", () => {
    const st = toMinor(initState());
    const moved = transposePapers(st, [paperOf(st.song)], { semis: 2 });
    const k = firstKey(tr(moved)); eq(k.mode, "minor"); eq(k.fifths, 2);
  });
  it("app 内复制粘贴的文字：小调写 [6=A]，读回来还是小调", () => {
    const st = toMinor(initState());
    const txt = toJianpu([...tr(st), nn(57)], 0);   // 只有记号没有音的一段文字不认（别把聊天当谱），带一个音
    assert(txt.includes("[6=A]"), `应写 [6=A]：${txt}`);
    const back = fromJianpu(txt, 0);
    assert(!!back && back.some((t) => t.kind === "key" && t.mode === "minor"), "读回来要是小调");
  });
});

describe("小调：纸开头切 = 这一段调号一样的声部一起切", () => {
  it("两个声部同调号 → 一起切（n = 2）；调号不一样的不动", () => {
    let st = initState();
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, paperOf(st.song));
    const [a, b] = st.song.parts.map((p) => p.id);
    let r = setPaperHeadMinor(st, paperOf(st.song), a, true);
    eq(r.n, 2);
    for (const t of Object.values(r.st.song.papers[0].tracks)) eq(firstKey(t).mode, "minor");
    // b 换成一个升号，再把 a 切回大调：b 不动
    st = setHeaderAt(r.st, paperOf(st.song), b, headerSpot(r.st.song.papers[0].tracks[b], 0), { key: 1 });
    r = setPaperHeadMinor(st, paperOf(st.song), a, false);
    eq(r.n, 1);
    assert(!firstKey(r.st.song.papers[0].tracks[a]).mode, "a 回到大调");
    eq(firstKey(r.st.song.papers[0].tracks[b]).mode, "minor");
  });
  it("谱上的淡字：keyText 小调写 6=", () => { eq(keyText(0, true), "6=A"); eq(keyText(-3, true), "6=C"); eq(keyText(1), "1=G"); });
});
