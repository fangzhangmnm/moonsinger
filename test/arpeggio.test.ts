// 琶音（v0.9.45；user「和弦的波浪线还是没有做，做一下，绿袖子要。这个是标准的记号吧」）：演奏法 arpeggio；SoundFont 从低到高依次晚 arpeggioSec；MusicXML <arpeggiate/>。
//   created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, tr, TPQ, withArt, withPitches, type Token, type NoteTok } from "../src/score/song.ts";
import { lightNotes } from "../src/engine/timeline.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";

let nid = 9900;
const P = (s: string, o: number) => ({ step: s as "C", alter: 0, octave: o });
const chord = (extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: nid++, pitch: P("G", 4), chord: [P("E", 4), P("C", 4)], dur: TPQ, lyric: null, ...extra } as Token);
const head = () => tr(initState()).slice(0, 3);
const marks = { staccatoGate: 0.5, breath: true, gapSec: 0, arpeggioSec: 0.04 };
describe("琶音", () => {
  it("SoundFont：叠音从低到高依次晚 arpeggioSec；不写 = 同时", () => {
    const on = lightNotes([...head(), chord({ art: ["arpeggio"] })], [], true, marks).map((n) => [n.midi, +n.t0.toFixed(3)]);
    eq(JSON.stringify(on.sort((a, b) => a[0] - b[0])), "[[60,0],[64,0.04],[67,0.08]]");
    const off = lightNotes([...head(), chord()], [], true, marks);
    assert(off.every((n) => n.t0 === 0), "不写琶音 = 一起响");
  });
  it("错开最多摊到这个音一半长；单声（只拿最上面那条线）= 不错开", () => {
    const short = lightNotes([...head(), chord({ art: ["arpeggio"], dur: TPQ / 8 })], [], true, { ...marks, arpeggioSec: 1 });
    const len = short[0].t1 - Math.min(...short.map((n) => n.t0)), last = Math.max(...short.map((n) => n.t0));
    assert(last <= len * 0.5 + 1e-9, `最晚的音 ${last} 秒`);
    eq(lightNotes([...head(), chord({ art: ["arpeggio"] })], [], false, marks).length, 1);
  });
  it("MusicXML：和弦里每个音都写 <arpeggiate/>；读回来 = 这个和弦有琶音", () => {
    const info = { id: "P1", name: "Pno", instrumentName: "Piano", sound: "keyboard.piano", program: 1 };
    const w = writeMusicXml({ parts: [{ info, tokens: [...head(), chord({ art: ["arpeggio"] }), chord(), chord(), chord()] }] }, { software: "t", date: "2026-10-10" });
    eq((w.xml.match(/<arpeggiate\/>/g) ?? []).length, 3, "三个音各一个");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note") as NoteTok[];
    eq(JSON.stringify(back.map((t) => (t.art ?? []).includes("arpeggio"))), "[true,false,false,false]");
  });
  it("只挂在和弦上（v0.9.46；user「只有和弦才有，变成单音时自动丢，对吧？」）：单音挂 = 不挂；和弦变成单音 = 自动去掉；别家单音上标的 = 不认", () => {
    const one = { kind: "note", id: nid++, pitch: P("C", 5), dur: TPQ, lyric: null } as NoteTok;
    eq(withArt(one, "arpeggio", true), one, "单音挂琶音 = 原样");
    const ch = withArt(chord() as NoteTok, "arpeggio", true);
    assert(ch.art?.includes("arpeggio"), "和弦挂得上");
    const single = withPitches(ch, [ch.pitch!]);
    assert(!single.art?.includes("arpeggio") && !single.chord, "拿掉叠音变成单音 = 琶音自动去掉");
    const xml = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>whole</type><notations><arpeggiate/></notations></note></measure></part></score-partwise>`;
    const t = readMusicXml(xml).parts[0].tokens.find((x) => x.kind === "note") as NoteTok;
    assert(!t.art?.includes("arpeggio"), "单音上的 <arpeggiate/> 不认");
  });
});
