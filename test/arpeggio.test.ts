// 琶音（v0.9.45；user「和弦的波浪线还是没有做，做一下，绿袖子要。这个是标准的记号吧」）：演奏法 arpeggio；SoundFont 从低到高依次晚 arpeggioSec；MusicXML <arpeggiate/>。
//   created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, tr, TPQ, type Token, type NoteTok } from "../src/score/song.ts";
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
});
