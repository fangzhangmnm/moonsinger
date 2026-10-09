// 拍子轻重（风格记号；src/score/groove.ts）。created 2026-10-08 深夜 by Claude Opus 5.5
// user「先讨论清楚再做，不同的流派会不一样」→ 风格 = 像速度一样的文字记号、「只对当前sheet有用」「中间换同意」「点开之后可以设置具体的细节」；
//   「预设可以，你给音乐仓鼠发一个工单，做成数据驱动的」（仓鼠 d960331 grooves-v1.json）。
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, initState, tr, type Token, type NoteTok, type Song } from "../src/score/song.ts";
import { classicalWeights, grooveTable, grooveStyle, meterPositions, grooveWeights, grooveMapOf, grooveCategory, followOf, GROOVE_STYLES } from "../src/score/groove.ts";
import { noteVelocities, gainSegments } from "../src/score/perform.ts";
import { DYNAMICS_DB, DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, ARTICULATION, MARK_DEFAULTS } from "../src/format/performance.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL): Uint8Array };
const g = (await import(new URL("../scripts/gen-grooves.mjs", import.meta.url).href)) as { render(): string | null };

let nid = 5000;
const head = () => tr(initState()).slice(0, 3);   // 调 / 拍（4/4）/ 速度 90
const n = (dur = TPQ, extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric: null, ...extra });
const gr = (style: string, amount?: number): Token => ({ kind: "groove", id: nid++, style, ...(amount !== undefined ? { amount } : {}) });
const one = (toks: Token[]): Song => { const s = initState().song; return { ...s, papers: [{ ...s.papers[0], tracks: { [s.parts[0].id]: toks } }] }; };
const full = () => 1;

describe("拍子轻重：数据", () => {
  it("grooves.gen.ts 是最新的（不是就跑 node scripts/gen-grooves.mjs）", () => {
    const out = g.render(); if (out === null) return;
    eq(fs.readFileSync(new URL("../src/score/grooves.gen.ts", import.meta.url)).toString() === out, true);
  });
  it("七个风格；古典层级推出来的 = 仓鼠列的古典表（每个列了的拍号逐格一样）", () => {
    eq(GROOVE_STYLES.map((s) => s.id).join(" "), "none classical pop waltz march swing four-on-the-floor");
    const c = grooveStyle("classical")!;
    for (const [m, v] of Object.entries(c.meters)) { const [b, bt] = m.split("/").map(Number); eq(JSON.stringify(classicalWeights(b, bt)), JSON.stringify(v), m); }
  });
  it("没列的拍号：古典 = 推（5/8 = 两个一组 + 三个一组；3/8 = 三个八分拍）；「无」= 不加；x/32 = 不加", () => {
    eq(JSON.stringify(classicalWeights(5, 8)!.weights), JSON.stringify([1, -0.5, -0.25, -0.5, 0, -0.5, -0.25, -0.5, -0.25, -0.5]));
    eq(classicalWeights(3, 8)!.grid, 6);
    eq(grooveTable(grooveStyle("pop")!, 5, 4)!.derived, true);
    eq(grooveTable(grooveStyle("none")!, 4, 4), null);
    eq(classicalWeights(3, 32), null);
  });
  it("演奏者的类别：月读 / 元音版 = voice；钢琴（0）= piano；贝斯（33）= bass；鼓件（bank 128）= percussion；没人上场 = 不跟", () => {
    eq(grooveCategory("tsukuyomi"), "voice"); eq(grooveCategory("vowel-sampler"), "voice");
    eq(grooveCategory("soundfont", { bank: 0, program: 0 }), "piano"); eq(grooveCategory("soundfont", { bank: 0, program: 33 }), "bass");
    eq(grooveCategory("soundfont", { bank: 128, program: 0 }), "percussion"); eq(grooveCategory("unknown"), null);
    eq(followOf(grooveStyle("pop")!, "bass"), 1); eq(followOf(grooveStyle("pop")!, null), 0);
  });
});

describe("拍子轻重：小节里的位置（同画谱的规矩）", () => {
  it("4/4 四分音符：0 / 1 / 2 / 3 拍，写满自动换小节", () => {
    const toks = [...head(), n(), n(), n(), n(), n()], p = meterPositions(toks);
    eq([3, 4, 5, 6, 7].map((i) => p.get(i)!.pos / TPQ).join(" "), "0 1 2 3 0");
  });
  it("人插的「|」= 新小节；第一小节没写满就碰到「|」= 弱起（按小节尾对齐）", () => {
    const toks = [...head(), n(), { kind: "bar", id: nid++ } as Token, n(), n()], p = meterPositions(toks);
    eq(p.get(3)!.pos / TPQ, 3, "弱起的一拍 = 第四拍"); eq(p.get(5)!.pos, 0);
  });
  it("拍号变 = 新小节、按新拍号数；连过来的音不算音头", () => {
    const toks = [...head(), n(), { kind: "time", id: nid++, beats: 3, beatType: 4 } as Token, n(), n(), n(), n(TPQ, { tie: true }), n()], p = meterPositions(toks);
    eq(p.get(5)!.pos, 0); eq(p.get(5)!.beats, 3); eq(p.has(8), false, "连过来的"); eq(p.get(9)!.pos / TPQ, 1);
  });
  it("每张纸各自从头数（bounds）", () => {
    const toks = [...head(), n(), n(), n(), n()], p = meterPositions(toks, [0, 5]);
    eq(p.get(5)!.pos, 0);
  });
});

describe("拍子轻重：每个音的权重", () => {
  it("流行 4/4：反拍重（二、四拍 1，一、三拍 0.5）；八分的后半拍 = 0（流行里只有十六分轻）；幅度 / 跟多少乘上去", () => {
    const toks = [...head(), gr("pop"), n(), n(), n(), n(), n(TPQ / 2), n(TPQ / 2)], song = one(toks), m = grooveMapOf(song);
    const w = grooveWeights(toks, [0], m, full);
    eq([4, 5, 6, 7].map((i) => w.get(i)).join(" "), "0.5 1 0.5 1"); eq(w.get(8), 0.5, "下一小节第一拍"); eq(w.has(9), false, "权重 0 = 不放");
    const half = grooveWeights(toks, [0], grooveMapOf(one([...head(), gr("pop", 2), ...toks.slice(4)])), () => 0.5);
    eq(half.get(5), 1, "×2 幅度 × 0.5 跟 = 1");
  });
  it("写了音头记号的音 = 写的说了算（不叠）；没写风格 / 「不加轻重」= 没有", () => {
    const toks = [...head(), gr("pop"), n(TPQ, { art: ["accent"] }), n()], w = grooveWeights(toks, [0], grooveMapOf(one(toks)), full);
    eq(w.has(4), false); eq(w.get(5), 1);
    const none = [...head(), n(), gr("none"), n()]; eq(grooveWeights(none, [0], grooveMapOf(one(none)), full).size, 0);
  });
  it("三连音里不在十六分格子上的 = 最轻那一档；中间换风格从那儿起", () => {
    const t3 = (TPQ * 2) / 3, toks = [...head(), gr("classical"), n(t3), n(t3), n(t3), gr("march"), n(), n()], w = grooveWeights(toks, [0], grooveMapOf(one(toks)), full);
    eq(w.get(4), 1); eq(w.get(5), -0.5, "三连音第二个"); eq(w.get(8), 0.75, "换进行曲：第三拍（三连音占了两拍）"); eq(w.get(9), 0.5, "第四拍");
  });
  it("整张纸一起听：写在第二行的风格管第一行；下一张纸回到不加", () => {
    let st = initState(); const s = st.song;
    const p2 = "P2", song: Song = { ...s, parts: [...s.parts, { ...s.parts[0], id: p2, role: "r2", mic: "m2" }],
      papers: [{ ...s.papers[0], tracks: { [s.parts[0].id]: [...head(), n(), n()], [p2]: [...head(), gr("pop"), n(), n()] } }, { ...s.papers[0], id: "p2", tracks: { [s.parts[0].id]: [...head(), n(), n()] } }] };
    void st;
    const m = grooveMapOf(song);
    eq(m.map((x) => `${x.tick / TPQ}:${x.style}`).join(" "), "0:null 0:pop 2:null");
  });
});

describe("拍子轻重：出声", () => {
  const sv = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb, marcatoDb: MARCATO_DB, dynamicsVel: { ...DYNAMICS_VEL }, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL };
  it("力度那一路：w = 1 = 一个次重音（+8），w = −0.5 = 半个弱化（−5）", () => {
    const toks = [...head(), n(), n()], V = noteVelocities(toks, undefined, sv, 80 / 127, undefined, new Map([[3, 1], [4, -0.5]]));
    eq(Math.round(V.get(3)! * 127), 80 + MARK_DEFAULTS.stressVel); eq(Math.round(V.get(4)! * 127), 80 - 5);
  });
  it("dB 那一路（月读）：正的 = 音头加次重音的几分之几；负的 = 整个音轻；没有 = 不碰声音（null）", () => {
    const { dynamicsVel: _v, ...db } = sv, toks = [...head(), n(), n()];
    eq(gainSegments(toks, undefined, db), null);
    const g = gainSegments(toks, undefined, db, undefined, new Map([[3, 1], [4, -1]]))!;
    eq(g[0].dB, MARK_DEFAULTS.stressDb); eq(g.at(-1)!.dB, MARK_DEFAULTS.unstressDb);
  });
});

describe("拍子轻重：存档 / 简谱文字", () => {
  const meta = { software: "test", date: "2026-10-08" }, info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
  it("MusicXML：<words> 写名字、id 带预设和幅度；读回来是同一个记号；别家普通的 <words> 不认", () => {
    const toks = [...head(), gr("pop", 1.5), n(), n()], w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(/<words font-style="italic" id="groove\.pop\.150\.\d+">Style: Pop ×1\.5<\/words>/.test(w.xml), "MusicXML 里写「Style: Pop ×1.5」");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.find((t) => t.kind === "groove");
    eq(JSON.stringify(back && { s: (back as { style: string }).style, a: (back as { amount?: number }).amount }), JSON.stringify({ s: "pop", a: 1.5 }));
    const plain = w.xml.replace(/ id="groove[^"]*"/, "");
    eq(readMusicXml(plain, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.some((t) => t.kind === "groove"), false);
  });
  it("整首存 / 开（.mxl）：风格记号在纸的 MusicXML 正本里、读回来一样；JSON 不多字段", async () => {
    const { saveMxl, openBytes, emptyExtras } = await import("../src/format/project.ts");
    const { unzipSync, strFromU8 } = await import("../vendor/fflate/fflate.esm.js");
    const toks = [...head(), gr("march", 0.5), n(), n()], song = one(toks);
    const bytes = saveMxl({ song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08" }), files = unzipSync(bytes);
    const o = openBytes("x.mxl", bytes), back = o.song.papers[0].tracks[o.song.parts[0].id].filter((t) => t.kind === "groove");
    eq(JSON.stringify(back.map((t) => [(t as { style: string }).style, (t as { amount?: number }).amount])), JSON.stringify([["march", 0.5]]));
    eq(o.notices.length, 0);
    assert(!strFromU8(files[".moonsinger/score.json"]).includes("groove"), "score.json 里没有风格记号");
  });
  it("简谱文字：[G=pop] / [G=waltz:150] 往返", () => {
    const txt = toJianpu([gr("pop"), n(), gr("waltz", 1.5), n()], 0);
    assert(txt.includes("[G=pop]") && txt.includes("[G=waltz:150]"), txt);
    eq(JSON.stringify(fromJianpu(txt, 0)!.filter((t) => t.kind === "groove").map((t) => [(t as { style: string }).style, (t as { amount?: number }).amount ?? 1])), JSON.stringify([["pop", 1], ["waltz", 1.5]]));
  });
});
