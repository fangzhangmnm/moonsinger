// 谱号 / 八度线（v0.9.28）：只管画，音高数据不动。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-10「谱号的显示模式跟着谱号而不是乐器，然后先不要双谱线模式，然后加一个可以移八度显示的功能（或者其实这个就是用标准的音乐记号，然后系统自己判断？能不能这样？」
//   →「默认自动同意」「加格式同意」「中音这个冷门没人用吧，即使做，自动也不会选」「铃铛会很高。8va可以做了吗」。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, insertClef, insertOttava, setPartClef, setDisplayMark, tr, TPQ, type Token, type EditorState, type Song } from "../src/score/song.ts";
import { autoClef, startClef, displayStates, resolveSongClefs, CLEF_SHIFT, ledgerLines } from "../src/score/clef.ts";
import { diatonicIndex, type Pitch } from "../src/score/pitch.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { engrave } from "../src/render/engrave.ts";

const S = ["C", "D", "E", "F", "G", "A", "B"] as const;
let nid = 7000;
const n = (step: (typeof S)[number], octave: number): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave }, dur: TPQ, lyric: null });
const run = (oct: number, k: number) => Array.from({ length: k }, (_, i) => n(S[i % 7], oct + Math.floor(i / 7)));
const pos = (toks: Token[]) => toks.flatMap((t) => (t.kind === "note" && t.pitch ? [diatonicIndex(t.pitch as Pitch)] : []));
const head = () => tr(initState()).slice(0, 3);
const stOf = (toks: Token[]): EditorState => { const st = initState(); return { ...st, caret: toks.length, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; };

describe("自动谱号：挑加线最少的", () => {
  it("一般旋律 C4–A5 = 高音；铃 C6–G7 = 高音 15ma；C3–C5 这种宽的男声音域 = 高音 8vb；C3–E4 = 低音；贝斯 E2–E3 = 低音；低音提琴 E1–E2 = 低音 8vb；一直在中央 C 上 = 照样高音", () => {
    eq(autoClef(pos(run(4, 13))), "G");
    eq(autoClef(pos(run(6, 12))), "G15ma");
    eq(autoClef(pos(run(3, 15))), "G8vb");
    eq(autoClef(pos(run(3, 10))), "F");
    eq(autoClef(pos(Array.from({ length: 10 }, () => n("C", 4)))), "G");
    eq(autoClef(pos([n("E", 2), n("G", 2), n("C", 3), n("E", 3)])), "F");
    eq(autoClef(pos([n("E", 1), n("A", 1), n("D", 2), n("E", 2)])), "F8vb");
  });
  it("没有音 = 上一张纸的（没有 = 高音）；滞后：上一张纸的谱号差不多一样好就接着用", () => {
    eq(autoClef([]), "G"); eq(autoClef([], "F"), "F");
    const mid = pos([n("B", 3), n("D", 4)]);   // 高音谱号：B3 一条加线；低音谱号：D4 一条加线——两边差不多
    eq(autoClef(mid), "G"); eq(autoClef(mid, "F"), "F", "上一张是低音，这张两边差不多 = 接着低音");
  });
  it("中音谱号不在里面；加线数：第一线 E4 / 第五线 F5 以内 = 0", () => {
    eq(ledgerLines(30), 0); eq(ledgerLines(38), 0); eq(ledgerLines(28), 1); eq(ledgerLines(40), 1); eq(ledgerLines(43), 2);
    eq(Object.keys(CLEF_SHIFT).sort().join(","), "F,F8vb,G,G15ma,G8va,G8vb");
  });
  it("声部写了谱号 = 它（不自动）；八度线里的音按画出来的位置算", () => {
    eq(startClef([...head(), ...run(6, 12)], "G", null), "G");
    const toks = [...head(), { kind: "ottava", id: 1, shift: 2 } as Token, ...run(6, 12)];
    eq(startClef(toks, undefined, null), "G", "15ma 线里的铃声 = 画出来已经在谱里了，高音谱号就够");
  });
});

describe("每个下标处的谱号 / 八度线", () => {
  it("谱号记号、八度线记号从那儿起管到下一个", () => {
    const toks: Token[] = [...head(), n("C", 5), { kind: "clef", id: 1, clef: "F" }, n("C", 3), { kind: "ottava", id: 2, shift: -1 }, n("C", 2), { kind: "ottava", id: 3, shift: 0 }, n("D", 3)];
    const ds = displayStates(toks, "G");
    eq(ds.clef.slice(3).join(" "), "G F F F F F F"); eq(ds.ott.slice(3).join(" "), "0 0 0 -1 -1 0 0");
  });
  it("整首一路接：没写谱号的声部每张纸自己挑，翻纸有滞后；写了的每张纸都是它", () => {
    const st = initState(), part = st.at.part;
    const song: Song = { ...st.song, papers: [
      { id: "a", name: "A", tracks: { [part]: [...head(), ...run(6, 12)] } },
      { id: "b", name: "B", tracks: { [part]: [...head(), ...run(4, 6)] } },
      { id: "c", name: "C", tracks: { [part]: [...head(), ...run(3, 10)] } },
    ] };
    const r = resolveSongClefs(song);
    eq(["a", "b", "c"].map((p) => r.get(p)?.get(part)).join(" "), "G15ma G F");
    const fixed = resolveSongClefs({ ...song, parts: song.parts.map((p) => ({ ...p, clef: "F" as const })) });
    eq(["a", "b", "c"].map((p) => fixed.get(p)?.get(part)).join(" "), "F F F");
  });
});

describe("编辑：插 / 改 / 删", () => {
  it("插谱号在光标处；紧挨着再插 = 改它；声部谱号 null = 自动", () => {
    let st = stOf([...head(), n("C", 5), n("D", 5)]);
    st = insertClef(st, "F"); eq(tr(st).filter((t) => t.kind === "clef").length, 1);
    st = insertClef(st, "G8vb"); const c = tr(st).filter((t) => t.kind === "clef"); eq(c.length, 1); eq((c[0] as { clef: string }).clef, "G8vb");
    st = setPartClef(st, st.at.part, "F"); eq(st.song.parts[0].clef, "F");
    st = setPartClef(st, st.at.part, null); eq(st.song.parts[0].clef, undefined);
  });
  it("八度线：有选区 = 这一段（开头 + 结束）；改 / 删", () => {
    let st = stOf([...head(), n("C", 6), n("D", 6), n("E", 6), n("C", 5)]);
    st = { ...st, sel: { from: 3, to: 6 } };
    st = insertOttava(st, 1);
    eq(tr(st).slice(3).map((t) => (t.kind === "ottava" ? `o${t.shift}` : "n")).join(" "), "o1 n n n o0 n");
    const i = tr(st).findIndex((t) => t.kind === "ottava" && t.shift === 1);
    st = setDisplayMark(st, st.at.paper, st.at.part, i, 2); eq((tr(st)[i] as { shift: number }).shift, 2);
    st = setDisplayMark(st, st.at.paper, st.at.part, i, null); eq(tr(st).filter((t) => t.kind === "ottava").length, 1);
  });
});

describe("画：同一个实际音高按谱号 / 八度线挪位置（音高数据不动）", () => {
  const ys = (toks: Token[], partClef?: "F" | "G8vb" | "G") => {
    const st = stOf(toks), song = { ...st.song, parts: st.song.parts.map((p) => (partClef ? { ...p, clef: partClef } : p)) };
    const L = engrave(song, { width: 800, sp: 10, at: st.at, caret: -1, sel: null, parts: [{ id: st.at.part, name: "V" }], measureLyric: (s) => s.length * 10 });
    return { L, y: L.notes.map((q) => q.y - L.systems[q.system].staffTop) };   // 相对谱顶（八度线那一道会让整条谱往下挪）
  };
  it("铃 C7：高音 15ma 下画在谱里（不是一串上加线）；写明高音谱号 = 画在很高的地方", () => {
    const auto = ys([...head(), n("C", 7), n("C", 7)]), fixed = ys([...head(), n("C", 7), n("C", 7)], "G");
    assert(auto.L.clefs.length === 1 && auto.L.clefs[0].kind === "start", "行首谱号的点击区域");
    assert(auto.y[0] >= -1, `自动：C7 画在谱里（相对谱顶 ${auto.y[0].toFixed(0)} px）`);
    assert(fixed.y[0] < -40, `写明高音谱号：C7 在谱顶上面很远（${fixed.y[0].toFixed(0)} px）`);
  });
  it("8va 线：线里的音画低一个八度（y 往下挪 3.5 个间距），线外的不动", () => {
    const plain = ys([...head(), n("C", 6), n("C", 6)], "G").y;   // 写明高音谱号（不让自动挑别的，免得两边谱号不一样）
    const o2 = ys([...head(), { kind: "ottava", id: 1, shift: 1 } as Token, n("C", 6), { kind: "ottava", id: 2, shift: 0 } as Token, n("C", 6)], "G").y;
    assert(Math.abs(o2[0] - plain[0] - 35) < 0.5 && Math.abs(o2[1] - plain[1]) < 0.5, `8va 线里 +35 px、线外不动：${plain} vs ${o2}`);
  });
});

describe("MusicXML 往返", () => {
  const info = { id: "P1", name: "V", instrumentName: "月读", sound: "voice.vocals", program: 55 };
  it("八度谱号 = <clef-octave-change>；中间换谱号 = <attributes><clef>；八度线 = <octave-shift>（8va down、8vb up、stop）；直接换一种 = 读回来还是一个记号", () => {
    const toks: Token[] = [...head(), n("C", 4), { kind: "clef", id: 1, clef: "F" }, n("C", 3), { kind: "ottava", id: 2, shift: 1 }, n("C", 3), { kind: "ottava", id: 3, shift: 2 }, n("D", 3), { kind: "ottava", id: 4, shift: 0 }, n("E", 3)];
    const w = writeMusicXml({ parts: [{ info: { ...info, clef: "G8vb" }, tokens: toks }] }, { software: "t", date: "2026-10-10" });
    assert(w.xml.includes("<clef><sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change></clef>"), "开头的八度谱号");
    assert(w.xml.includes("<attributes><clef><sign>F</sign><line>4</line></clef></attributes>"), "中间换低音谱号");
    assert(w.xml.includes('<octave-shift type="down" size="8"/>') && w.xml.includes('<octave-shift type="down" size="15"/>') && w.xml.includes('<octave-shift type="stop" size="15"/>'), "八度线");
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }), back = r.parts[0].tokens;
    eq(r.parts[0].info.clef, "G8vb");
    eq(back.filter((t) => t.kind === "clef" || t.kind === "ottava").map((t) => (t.kind === "clef" ? t.clef : `o${t.shift}`)).join(" "), "F o1 o2 o0");
    eq(JSON.stringify(back.filter((t) => t.kind === "note").map((t) => (t as { pitch: Pitch }).pitch)), JSON.stringify(toks.filter((t) => t.kind === "note").map((t) => (t as { pitch: Pitch }).pitch)), "音高原样（只管画）");
  });
});

describe(".mxl 往返：自动 / 写明的谱号", () => {
  const song = (clef?: "F" | "G") => { const st = stOf([...head(), n("E", 2), n("G", 2), n("C", 3)]); return { ...st.song, parts: st.song.parts.map((p) => (clef ? { ...p, clef } : p)) }; };
  it("自动挑成低音的声部：存 → 开还是自动（MusicXML 里写的是挑好的低音，score.json 记着 auto）", () => {
    const s = song(), o = openBytes("x.mxl", saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-10-10T00:00:00.000Z" }));
    eq(o.song.parts[0].clef, undefined);
    eq(resolveSongClefs(o.song).get(o.song.papers[0].id)?.get(o.song.parts[0].id), "F");
  });
  it("写明高音 / 低音：存 → 开原样", () => {
    for (const c of ["G", "F"] as const) { const s = song(c), o = openBytes("x.mxl", saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-10-10T00:00:00.000Z" })); eq(o.song.parts[0].clef, c); }
  });
});
