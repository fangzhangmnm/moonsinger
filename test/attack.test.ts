// 音头的力度形状：突强 sfz / 强后即弱 fp（和重音 / 强音同一组、互斥）。created 2026-10-08 by Claude Opus 5.5
// user「音头先冲一下，再回落…要，要，我都要」；数从演奏者的配置来（user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, tr, withArt, TPQ, type Token, type NoteTok } from "../src/score/song.ts";
import { dynLevels, noteVelocities, gainSegments } from "../src/score/perform.ts";
import { DYNAMICS_DB, DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, ARTICULATION, MARK_DEFAULTS } from "../src/format/performance.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";

let nid = 500;
const note = (art?: NoteTok["art"]) => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null, ...(art ? { art } : {}) }) as Token;
const dyn = (v: "mf" | "f") => ({ kind: "dyn", id: nid++, value: v }) as Token;
const line = (items: Token[]) => [...tr(initState()).slice(0, 3), ...items];
const notes = (toks: Token[]) => toks.flatMap((t, i) => (t.kind === "note" ? [i] : []));
const db = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb, marcatoDb: MARCATO_DB, ...MARK_DEFAULTS };
const vel = { ...db, dynamicsVel: { ...DYNAMICS_VEL }, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL };

describe("音头那一组：互斥", () => {
  it("开 sfz 就关掉重音；开 fp 就关掉 sfz；跳音不在这一组、不受影响", () => {
    let t = note(["staccato", "accent"]) as NoteTok;
    t = withArt(t, "sfz", true); eq(JSON.stringify(t.art), `["staccato","sfz"]`);
    t = withArt(t, "fp", true); eq(JSON.stringify(t.art), `["staccato","fp"]`);
  });
});

describe("强后即弱 fp", () => {
  it("之后的音都是 p（它也是一个新状态）", () => {
    const toks = line([dyn("mf"), note(), note(["fp"]), note(), note()]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, 16), [a, b, c, d] = notes(toks);
    eq(L.get(a)!.at0, 80); eq(L.get(c)!.at0, 49); eq(L.get(d)!.at0, 49);
    void b;
  });
  it("乐器：音头按 f 的力度弹，音量曲线在 fpSec 里压到 p；月读 / 元音版：音量从 f 落到 p", () => {
    const toks = line([dyn("mf"), note(["fp"]), note()]), [a] = notes(toks);
    eq(Math.round(noteVelocities(toks, undefined, vel, 80 / 127).get(a)! * 127), 96, "音头 = f");
    const gv = gainSegments(toks, undefined, vel)!; assert(gv.at(0)!.dB > gv.find((x) => x.t0 >= MARK_DEFAULTS.fpSec - 1e-9)!.dB, "乐器：压下去");
    const g = gainSegments(toks, undefined, db)!; assert(Math.abs(g[0].dB - DYNAMICS_DB.f) < 1.5 && g.some((x) => Math.abs(x.dB - DYNAMICS_DB.p) < 1e-9), "dB：从 f 落到 p");
  });
});

describe("突强 sfz", () => {
  it("dB 那一路：音头高 sfzDb，sfzSec 里落回当下；力度那一路：+sfzVel", () => {
    const toks = line([dyn("mf"), note(["sfz"]), note()]), [a] = notes(toks);
    const g = gainSegments(toks, undefined, db)!;
    assert(g[0].dB > 6 && g[0].dB <= MARK_DEFAULTS.sfzDb, `音头 ${g[0].dB}`);
    eq(g.filter((x) => x.t0 >= MARK_DEFAULTS.sfzSec - 1e-9 && x.t1 <= 60 / 90 + 1e-9).every((x) => x.dB === 0), true, "落回 mf = 0 dB");
    eq(Math.round(noteVelocities(toks, undefined, vel, 80 / 127).get(a)! * 127), 80 + MARK_DEFAULTS.sfzVel);
  });
});

describe("音头：MusicXML", () => {
  it("sfz / fp 写在 <notations><dynamics>，往返原样", () => {
    const toks = line([note(["sfz"]), note(["fp"])]), info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
    const w = writeMusicXml({ parts: [{ info, tokens: toks }] }, { software: "test", date: "2026-10-08" });
    assert(w.xml.includes("<dynamics><sfz/></dynamics>") && w.xml.includes("<dynamics><fp/></dynamics>"), "写了");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note") as NoteTok[];
    eq(JSON.stringify(back.map((t) => t.art)), `[["sfz"],["fp"]]`);
  });
});
