// 气声（× 符头）与出声的换气（轻吸 / 深吸）：编辑、唱谱、MusicXML 往返。created 2026-10-10 by Claude Opus 5.5
// user「x同意，做支持」「气声同意」；「不应该每个逗号都大喘气」= 换气只在明写的地方出声。谁认（只有月读）在 test/honors.test.ts 守着。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, tr, withArt, toggleInhaleBefore, toggleArtBefore, symBackspace, TPQ, type Token, type NoteTok, type EditorState } from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { SING_MARKS } from "../src/format/performance.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";

let nid = 900;
const note = (lyric: string, extra: Partial<NoteTok> = {}) => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric, ...extra }) as Token;
const rest = () => ({ kind: "rest", id: nid++, dur: TPQ }) as Token;
const line = (items: Token[]) => [...tr(initState()).slice(0, 3), ...items];
const stOf = (toks: Token[], caret = toks.length): EditorState => { const st = initState(); return { ...st, caret, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; };
const notesOf = (st: EditorState) => tr(st).filter((t) => t.kind === "note") as NoteTok[];

describe("出声的换气：编辑", () => {
  it("没有呼吸 → 加轻吸 = 逗号 + inhale；再点同一档 = 整个去掉；点另一档 = 换档", () => {
    let st = stOf(line([note("か"), note("な")]), 4);
    st = toggleInhaleBefore(st, "soft")!; let a = notesOf(st)[0]; eq(JSON.stringify(a.art), `["breath"]`); eq(a.inhale, "soft");
    st = toggleInhaleBefore(st, "big")!; a = notesOf(st)[0]; eq(a.inhale, "big"); eq(JSON.stringify(a.art), `["breath"]`);
    st = toggleInhaleBefore(st, "big")!; a = notesOf(st)[0]; eq(a.art, undefined); eq(a.inhale, undefined);
  });
  it("去掉呼吸 = 出声一起去掉；符号退格：先变回静默的呼吸，再去掉逗号", () => {
    eq((withArt(note("か", { art: ["breath"], inhale: "soft" }) as NoteTok, "breath", false) as NoteTok).inhale, undefined);
    let st = stOf(line([note("か", { art: ["breath"], inhale: "big" }), note("な")]), 4);
    st = symBackspace(st); let a = notesOf(st)[0]; eq(a.inhale, undefined); eq(JSON.stringify(a.art), `["breath"]`);
    st = symBackspace(st); a = notesOf(st)[0]; eq(a.art, undefined);
  });
  it("前面是休止 = 不加（null）", () => { eq(toggleInhaleBefore(stOf(line([note("か"), rest()])), "soft"), null); });
});

describe("气声：编辑", () => {
  it("和强度那一组不互斥（幽灵音 + 气声可以同时）；再点去掉", () => {
    let st = stOf(line([note("つ", { art: ["ghost"] })]));
    st = toggleArtBefore(st, "whisper")!; eq(JSON.stringify(notesOf(st)[0].art), `["ghost","whisper"]`);
    st = toggleArtBefore(st, "whisper")!; eq(JSON.stringify(notesOf(st)[0].art), `["ghost"]`);
  });
});

describe("唱谱（月读）", () => {
  it("气声：这个音上唱的字带 whisper（一个音几个字都带；没歌词的哼也带）", () => {
    const s = toLabScore(line([note("て"), note("つ", { art: ["whisper"] }), note("な‿ぎ", { art: ["whisper"] }), note("", { art: ["whisper"] } as Partial<NoteTok>)]), "n");
    eq(JSON.stringify(s.SCORE.map((e) => !!e.whisper)), "[false,true,true,true,true]");
  });
  it("轻吸 = 下一个字前 v + inhale；深吸 = O + inhale；只有呼吸 = v、不出声；隔着休止照样带到下一个字", () => {
    const s = toLabScore(line([note("か", { art: ["breath"], inhale: "soft" }), note("な", { art: ["breath"], inhale: "big" }), note("し", { art: ["breath"] }), note("い", { art: ["breath"], inhale: "soft" }), rest(), note("よ")]), "n", "ja", undefined, SING_MARKS);
    const marks = s.SCORE.map((e) => `${e.before ?? "-"}${e.inhale ? "+" : ""}`);
    eq(marks.join(" "), "- v+ O+ v v+");
  });
  it("分段唱：上一段最后一个音写了出声的换气（段界切在休止处）= 这一段第一个字带上；没写 = 这一段原样（旧的块键不变）", () => {
    const toks = line([note("か"), note("な", { art: ["breath"], inhale: "big" }), rest(), rest(), note("し"), note("い")]);
    const from = toks.findIndex((t) => t.kind === "note" && t.lyric === "し");
    const s = toLabScore(toks, "n", "ja", undefined, SING_MARKS, [from, toks.length]);
    eq(`${s.SCORE[0].before}${s.SCORE[0].inhale ? "+" : ""}`, "O+");
    const plain = line([note("か"), note("な", { art: ["breath"] }), rest(), rest(), note("し"), note("い")]);
    const s2 = toLabScore(plain, "n", "ja", undefined, SING_MARKS, [from, plain.length]);
    eq(s2.SCORE[0].before, undefined, "只有静默的呼吸：第一个字不带记号（和以前一样）");
  });
});

describe("MusicXML 往返", () => {
  it("气声 = <notehead>x</notehead>（和幽灵音一起 = 带括号的 ×）；出声的换气 = <breath-mark/> 旁边 <other-articulation>", () => {
    const info = { id: "P1", name: "V", instrumentName: "月读", sound: "voice.vocals", program: 55 };
    const toks = line([note("つ", { art: ["whisper"] }), note("な", { art: ["ghost", "whisper"] }), note("ぎ", { art: ["breath"], inhale: "soft" }), note("お", { art: ["breath"], inhale: "big" }), note("お", { art: ["breath"] })]);
    const w = writeMusicXml({ parts: [{ info, tokens: toks }] }, { software: "t", date: "2026-10-10" });
    assert(w.xml.includes("<notehead>x</notehead>") && w.xml.includes('<notehead parentheses="yes">x</notehead>'), "× 符头写出来了");
    assert(w.xml.includes("<breath-mark/><other-articulation>inhale</other-articulation>") && w.xml.includes("<other-articulation>inhale-big</other-articulation>"), "出声的换气写出来了");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note") as NoteTok[];
    eq(JSON.stringify(back.map((t) => [t.art ?? null, t.inhale ?? null])), JSON.stringify([[["whisper"], null], [["ghost", "whisper"], null], [["breath"], "soft"], [["breath"], "big"], [["breath"], null]]));
  });
});
