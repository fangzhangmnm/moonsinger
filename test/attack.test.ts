// 音头的力度形状：突强 sfz / 强后即弱 fp（和重音 / 强音同一组、互斥）。created 2026-10-08 by Claude Opus 5.5
// user「音头先冲一下，再回落…要，要，我都要」；数从演奏者的配置来（user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, tr, withArt, swellOf, TPQ, type Token, type NoteTok } from "../src/score/song.ts";
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

describe("音内的起伏（< / > / <>）", () => {
  it("存 → 开：存在 .moonsinger/score.json（按音的 id），原样回来", async () => {
    const { saveMxl, openBytes, emptyExtras } = await import("../src/format/project.ts");
    const { toggleSwell, writeDegree } = await import("../src/score/song.ts");
    let st = initState(); for (const d of [1, 2, 3]) st = writeDegree(st, d, "near");
    st = toggleSwell(st, "<>")!;
    const o = openBytes("x.mxl", saveMxl({ song: st.song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08" }));
    const back = o.song.papers[0].tracks[o.song.parts[0].id].filter((t) => t.kind === "note") as NoteTok[];
    eq(JSON.stringify(back.map((t) => swellOf(t) ?? null)), `[null,null,"<>"]`);
  });
  it("dB 那一路：包络只往下乘（写的力度 = 最高点；user「鼓包改」）：< 从 −swellDb 长到 0；<> 两头 −swellDb、中间 0；能和 fp 叠（fp 之后长回 f，不超过）", () => {
    const D = MARK_DEFAULTS.swellDb, maxOf = (g: { dB: number }[]) => Math.max(...g.map((x) => x.dB));
    const up = gainSegments(line([note()].map((t) => ({ ...(t as NoteTok), art: ["swellUp" as const] }))), undefined, db)!;
    assert(up[0].dB < -D + 0.6 && up.at(-1)!.dB > -0.6 && maxOf(up) <= 1e-9, `< ${up[0].dB} → ${up.at(-1)!.dB}（最高 ${maxOf(up)}）`);
    const bump = gainSegments(line([{ ...(note() as NoteTok), art: ["swellBoth" as const] }]), undefined, db)!, mid = bump[Math.floor(bump.length / 2)].dB;
    assert(mid > bump[0].dB + 3 && mid > bump.at(-1)!.dB + 3 && maxOf(bump) <= 1e-9, "<> 中间高、两头低，最高 = 写的力度");
    const fpUp = gainSegments(line([{ ...(note(["fp"]) as NoteTok), art: ["fp" as const, "swellUp" as const] }]), undefined, db)!;
    assert(fpUp.at(-1)!.dB > DYNAMICS_DB.p + 3 && maxOf(fpUp) <= DYNAMICS_DB.f + 1e-9, "fp 之后长回去，不超过音头的 f");
  });
});

// 强度的阶梯（2026-10-08 深夜 Opus 5.5；user「重音能不能有不同的阶梯…次重音」「各种弱化也做」「音的强度只能有一种，但是可能有很多级」）
describe("强度的阶梯：幽灵音 < 弱化 < 不写 < 次重音 < 重音 < 强音", () => {
  it("一个音只有一种强度（全组互斥）", () => {
    let t = note(["staccato", "accent"]) as NoteTok;
    t = withArt(t, "stress", true); eq(JSON.stringify(t.art), `["staccato","stress"]`);
    t = withArt(t, "ghost", true); eq(JSON.stringify(t.art), `["staccato","ghost"]`);
    t = withArt(t, "marcato", true); eq(JSON.stringify(t.art), `["staccato","marcato"]`);
  });
  it("力度那一路（SoundFont）：一级一级往上", () => {
    const ladder = ["ghost", "unstress", null, "stress", "accent", "marcato"] as const;
    const toks = line([dyn("mf"), ...ladder.map((a) => note(a ? [a] : undefined))]), V = noteVelocities(toks, undefined, vel, 80 / 127), xs = notes(toks).map((i) => Math.round(V.get(i)! * 127));
    eq(JSON.stringify(xs), JSON.stringify([80 + MARK_DEFAULTS.ghostVel, 80 + MARK_DEFAULTS.unstressVel, 80, 80 + MARK_DEFAULTS.stressVel, 80 + ACCENT_VEL, 80 + MARCATO_VEL]));
    for (let k = 1; k < xs.length; k++) assert(xs[k] > xs[k - 1], `第 ${k} 级比前一级重`);
  });
  it("dB 那一路（月读 / 元音版）：弱化 / 幽灵音整个音轻下去，次重音音头加一点", () => {
    const g = (a?: NoteTok["art"]) => gainSegments(line([note(a)]), undefined, db)!;
    assert(g(["ghost"]).every((x) => x.dB === MARK_DEFAULTS.ghostDb), "幽灵音：整个音 ghostDb");
    assert(g(["unstress"]).every((x) => x.dB === MARK_DEFAULTS.unstressDb), "弱化：整个音 unstressDb");
    eq(g(["stress"])[0].dB, MARK_DEFAULTS.stressDb, "次重音：音头");
  });
  it("MusicXML：<stress/> / <unstress/> / 括号符头 往返", () => {
    const info = { id: "P1", name: "V", instrumentName: "月读", sound: "voice.vocals", program: 55 };
    const toks = line([note(["stress"]), note(["unstress"]), note(["ghost"])]), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, { software: "t", date: "2026-10-08" });
    assert(w.xml.includes("<stress/>") && w.xml.includes("<unstress/>") && w.xml.includes('<notehead parentheses="yes">normal</notehead>'), "写出来了");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note") as NoteTok[];
    eq(JSON.stringify(back.map((t) => t.art)), `[["stress"],["unstress"],["ghost"]]`);
  });
});
