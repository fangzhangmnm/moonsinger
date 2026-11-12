// 踏板：「键按多久」（src/score/pedal.ts）+ 接进时间线 + 录音房的追音（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；设计 = ai-docs/20261112-pedals-and-ring-design.md）
//   守：规矩一（每张纸开头抬着、纸尾还踩着 = 纸尾抬起）、二（写的结尾落在踩着的一段里 = 到抬起 / 换踏板才松；那一刻键还按着的不受影响）、三（同音高再弹松旧的）、
//   七（不跨纸）、八（从中间起放：只靠踏板留着的，会衰减的乐器不补按、不衰减的照补）；不认踏板的演奏者照写的；四个八度的半音阶一直踩着一个音不丢。
import { describe, it, eq, assert } from "./runner.mjs";
import { performerOf, performers } from "../src/performers/index.ts";
import { initState, addPaper, TPQ, DEFAULT_BPM, PEDAL_KINDS, tr, insertPedal, pedalDownAt, annihilate, editMarkAt, moveMark, symBackspace, ensureStartDyns, type EditorState, type Token, type Song, type PaperSeg, type PartDef, type PedalTok } from "../src/score/song.ts";
import { emptyExtras, activePerfSpec } from "../src/format/project.ts";
import { buildTimeline, LEAD_IN, type PerformerInfo } from "../src/engine/timeline.ts";
import { sustainSpans, holdBySustain } from "../src/score/pedal.ts";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { Studio, BLOCK, type TrackSpec } from "../src/engine/studio.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { headTokens } from "../src/score/song.ts";
import { clipFrom, pasteTokens } from "../src/score/clipboard.ts";
import { engrave } from "../src/render/engrave.ts";
import { editorBase } from "./fixtures/layout/cases.ts";
import { openBytes } from "../src/format/project.ts";
import { FORMAT_MINOR } from "../src/format/contract.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL | string): Uint8Array };

let nid = 9100;
const n = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", dur = TPQ, octave = 4): Token => ({ kind: "note", id: nid++, pitch: { step, alter: 0, octave }, dur, lyric: null });
const ped = (act: PedalTok["act"], which: PedalTok["which"] = "sustain"): Token => ({ kind: "pedal", id: nid++, which, act });
const Q = 60 / DEFAULT_BPM;
const spec = activePerfSpec(emptyExtras(), "r");
const info = (engine: PerformerInfo["engine"]): PerformerInfo => ({ engine, plugin: performerOf(engine), spec, velocity: 0.8, transpose: 0, gm: engine === "soundfont" ? { sha: "S", presetIndex: 3 } : null, chunk: "phrase", follow: () => 0 });
const two = (a: Token[], b: Token[]): { song: Song; parts: PartDef[] } => {
  let st: EditorState = initState(); st = addPaper(st);
  const [p1, p2] = st.song.papers, pid = st.song.parts[0]!.id;
  const papers: PaperSeg[] = [{ ...p1!, tracks: { [pid]: [...p1!.tracks[pid]!.slice(0, 3), ...a] } }, { ...p2!, tracks: { [pid]: [...p2!.tracks[pid]!.slice(0, 3), ...b] } }];
  return { song: { ...st.song, papers }, parts: st.song.parts };
};
const notesOf = (s: { song: Song; parts: PartDef[] }, engine: PerformerInfo["engine"]) => {
  const t = buildTimeline({ song: s.song, order: s.song.papers.map((p) => p.id), parts: s.parts, info: () => info(engine), hum: "n", singOpt: { leadIn: LEAD_IN } });
  return (t.tracks[0] as { notes: { t0: number; t1: number; key?: number; w1?: number }[] }).notes;
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("踏板 · 键按多久（规矩一、二、三、七）", () => {
  it("踩下 → 写的结尾延到抬起那一刻；抬起之后的照写的；记下写的结尾（w1）", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), ped("up"), n("E")], [n("F")]), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q) && near(ns[0]!.w1!, Q), `C 留到 D 结束（抬起挂在 E 上 = 2 拍处）：${ns[0]!.t1 / Q} 拍`);
    assert(near(ns[1]!.t1, 2 * Q) && ns[1]!.w1 === undefined, "D 写的结尾正好就是抬起那一刻 = 照写的（不算留长）");
    assert(near(ns[2]!.t1, 3 * Q) && ns[2]!.w1 === undefined, "抬起之后的 E 照写的");
  });
  it("换踏板：那一刻之前留着的全松、接着踩着；那一刻键还按着的不受影响", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D", 2 * TPQ), ped("change"), n("E"), ped("up"), n("F")], []), "soundfont");
    // C(0–1) D(1–3) 换(3) E(3–4) 抬(4) F(4–5)
    assert(near(ns[0]!.t1, 3 * Q), "C 留到换踏板那一刻（3 拍）"); assert(near(ns[1]!.t1, 3 * Q) && ns[1]!.w1 === undefined, "D 写的结尾正好是换的那一刻 = 照写的");
    assert(near(ns[2]!.t1, 4 * Q), "E 写的结尾正好是抬起 = 4 拍"); assert(near(ns[3]!.t1, 5 * Q), "F 照写的");
  });
  it("同音高再弹：被踏板留着的那个在那一刻松（规矩三）", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), n("C"), n("E"), ped("up"), n("F")], []), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q) && near(ns[0]!.w1!, Q), `第一个 C 留到第二个 C 弹下（2 拍）：${ns[0]!.t1 / Q}`);
    assert(near(ns[2]!.t1, 4 * Q), "第二个 C 留到抬起（4 拍）"); assert(near(ns[1]!.t1, 4 * Q), "D 留到抬起");
  });
  it("每张纸开头抬着、纸尾还踩着 = 纸尾抬起（不跨纸，规矩一 / 七）；纸尾的踏板记号挂在纸尾那一刻", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D")], [n("E"), n("F"), ped("down"), ped("up")]), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q), "第一张纸 C 留到纸尾（2 拍），不留进第二张"); assert(near(ns[2]!.t1, 3 * Q) && near(ns[3]!.t1, 4 * Q), "第二张纸照写的（纸尾踩下又抬起 = 没有音被留住）");
    const pp = two([ped("down"), n("C")], [n("D"), ped("down")]).song.papers.map((p) => p.tracks[Object.keys(p.tracks)[0]!]!), sp = sustainSpans(pp.flat(), undefined, [0, pp[0]!.length]);
    eq(sp.length, 2, "纸尾踩下 = 一段零长的（纸尾抬）");
  });
  it("不起作用的（已经踩着又踩、没踩就抬）不改状态；持音 / 弱音这一刀不管", () => {
    const ns = notesOf(two([ped("up"), ped("down"), n("C"), ped("down"), n("D"), ped("up"), n("E"), ped("down", "sostenuto"), n("F")], []), "soundfont");
    assert(near(ns[0]!.t1, 2 * Q), "C 留到真正的抬起（2 拍）"); assert(near(ns[3]!.t1, 4 * Q), "持音这一刀不起作用");
  });
  it("反复跳回去：补上跳到的那一刻的踏板状态（第一遍结尾踩着的不带进第二遍）", () => {
    const bar = (repeat: "start" | "end"): Token => ({ kind: "bar", id: nid++, repeat }) as Token;
    const ns = notesOf(two([bar("start"), ped("down"), n("C"), n("D"), bar("end")], []), "soundfont");
    eq(ns.length, 4, "展开成两遍");
    assert(near(ns[1]!.t1, 2 * Q), `第一遍的 D 在跳回去那一刻松（2 拍），不留到第二遍再弹 D：${ns[1]!.t1 / Q} 拍`);
    assert(near(ns[2]!.t1, 4 * Q), "第二遍的 C 被第二遍的踩下留到纸尾");
  });
  it("不认踏板的演奏者（元音版）照写的", () => {
    const ns = notesOf(two([ped("down"), n("C"), n("D"), ped("up"), n("E")], []), "vowel-sampler");
    assert(near(ns[0]!.t1, Q), "元音版照写的");
  });
  it("表说认 = 出声真变了：每位注册的乐手 × 三种踏板（画灰的依据是它；不许声明了不出声）", () => {
    for (const pl of performers()) for (const which of PEDAL_KINDS) {
      const claims = !!pl.pedals?.includes(which);
      if (pl.sound !== "notes") { assert(!claims, `${pl.name} 不走音符表，不能声明认 ${which}`); continue; }
      const ns = notesOf(two([ped("down", which), n("C"), n("D"), ped("up", which), n("E")], []), pl.name as PerformerInfo["engine"]);
      const played = !near(ns[0]!.t1, Q);
      eq(played, claims, `${pl.name} × ${which}：声明${claims ? "认" : "不认"}，出声${played ? "变了" : "没变"}`);
    }
  });
  it("没写踏板 = 一个音都不变（旧歌逐样本不变的前提）", () => {
    const toks = [n("C"), n("D"), n("C")], a = holdBySustain([{ midi: 60, t0: 0, t1: 1 }], sustainSpans(toks, undefined));
    eq(JSON.stringify(a), JSON.stringify([{ midi: 60, t0: 0, t1: 1 }]));
  });
});

describe("踏板 · 录音房（规矩八、半音阶不丢音）", async () => {
  const SR = 48000, wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)), sf2 = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
  const studio = async () => { const s = new Studio(SR, await instantiateTsf(wasm), () => {}); s.handle({ type: "bank", sha: "F", bytes: sf2 }); return s; };
  const run = (s: Studio, secs: number) => { const L = new Float32Array(BLOCK), R = new Float32Array(BLOCK); for (let i = 0; i < Math.round(secs * SR); i += BLOCK) s.render(L, R, BLOCK); };
  const active = (s: Studio) => { const t = (s as unknown as { tracks: Map<string, { sf: { player: unknown } | null }> }).tracks.get("p")!; return (s as unknown as { tsf: { active(p: unknown): number } }).tsf.active(t.sf!.player); };
  const track = (notes: TrackSpec extends infer T ? T extends { kind: "sf"; notes: infer N } ? N : never : never, decays: boolean): TrackSpec => ({ id: "p", kind: "sf", sha: "F", notes, gain: null, ...(decays ? { decays: true as const } : {}) });
  it("四个八度的半音阶一直踩着：48 个键一个不丢（同时发声上限 256）", async () => {
    const raw = Array.from({ length: 48 }, (_, k) => ({ midi: 36 + k, t0: k * 0.05, t1: k * 0.05 + 0.04 }));
    const held = holdBySustain(raw, [{ down: 0, up: 10, changes: [] }]);
    const s = await studio(); s.handle({ type: "timeline", tl: { tracks: [track(held.map((x) => ({ t0: x.t0, t1: x.t1, key: x.midi, vel: 0.8, preset: 0, ...(x.w1 !== undefined ? { w1: x.w1 } : {}) })), false)], range: { from: 0, to: 10 }, loop: false } });
    s.handle({ type: "play" }); run(s, 3);
    assert(active(s) >= 48, `3 秒时还在响的发声 ${active(s)}（应 ≥ 48）`);
  });
  it("从中间起放：只靠踏板留着的音——会衰减的乐器不补按、不衰减的照补；写的时值盖住起点的照补", async () => {
    const held = holdBySustain([{ midi: 60, t0: 0, t1: 0.5 }, { midi: 64, t0: 0, t1: 3 }], [{ down: 0, up: 4, changes: [] }]);
    const at1 = async (decays: boolean) => { const s = await studio(); s.handle({ type: "timeline", tl: { tracks: [track(held.map((x) => ({ t0: x.t0, t1: x.t1, key: x.midi, vel: 0.8, preset: 0, ...(x.w1 !== undefined ? { w1: x.w1 } : {}) })), decays)], range: { from: 0, to: 5 }, loop: false } }); s.handle({ type: "play", at: 1 }); run(s, 0.01); return active(s); };
    const d = await at1(true), k = await at1(false);
    assert(d > 0 && k === 2 * d, `会衰减的补了 ${d} 个发声（= 一个音：写的时值盖住起点的 E）、不衰减的 ${k} 个（= 两个音）`);
  });
});

describe("踏板 · MusicXML 往返（11-1 第二步）", () => {
  it("三种踏板（含换踏板、纸尾的）写出去再读回来：记号和位置一样；延音带 <pedal>、持音用 number 2、弱音是 una corda / tre corde", () => {
    const toks: Token[] = [...headTokens({}).map((t) => ({ ...t, id: nid++ }) as Token), ped("down"), n("C"), ped("change"), n("D"), ped("up"), ped("down", "sostenuto"), n("E"), ped("up", "sostenuto"), ped("down", "soft"), n("F"), ped("up", "soft"), ped("down")];
    const w = writeMusicXml({ parts: [{ info: { id: "P1", name: "Pno", instrumentName: "Piano", sound: "keyboard.piano", program: 0 }, tokens: toks }] }, { software: "test", date: "2026-11-12" });
    assert(w.xml.includes('<pedal type="start" number="1"') && w.xml.includes('<pedal type="change" number="1"') && w.xml.includes('<pedal type="sostenuto" number="2"') && w.xml.includes("una corda") && w.xml.includes("tre corde"), "写法");
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    const sig = (ts: readonly Token[]) => ts.filter((t) => t.kind === "pedal" || t.kind === "note").map((t) => (t.kind === "pedal" ? `${t.which}:${t.act}` : "n")).join(" ");
    eq(sig(r.parts[0]!.tokens), sig(toks)); eq(Object.keys(r.dropped).length, 0, JSON.stringify(r.dropped));
  });
  it("写出去的每个踏板自己说清是哪一种、踩下 / 抬起 / 换踏板（设计第 13 节）：把别的踏板全删掉、只留它一个读回来，意思一样", () => {
    const marks = [ped("down"), ped("change"), ped("up"), ped("down", "sostenuto"), ped("up", "sostenuto"), ped("down", "soft"), ped("up", "soft"), ped("change")];
    const toks: Token[] = [...headTokens({}).map((t) => ({ ...t, id: nid++ }) as Token), ...marks.flatMap((m) => [m, n("C")])];
    const w = writeMusicXml({ parts: [{ info: { id: "P1", name: "Pno", instrumentName: "Piano", sound: "keyboard.piano", program: 0 }, tokens: toks }] }, { software: "test", date: "2026-11-12" });
    const dirs = w.xml.match(/<direction placement="below">(?:(?!<\/direction>).)*?(?:<pedal |pedal\.soft)(?:(?!<\/direction>).)*?<\/direction>/gs) ?? [];
    eq(dirs.length, marks.length, "每个踏板一个方向");
    dirs.forEach((d, k) => {
      const only = dirs.reduce((x, o, j) => (j === k ? x : x.replace(o, "")), w.xml);
      const got = readMusicXml(only, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0]!.tokens.filter((t): t is PedalTok => t.kind === "pedal");
      eq(got.map((t) => `${t.which}:${t.act}`).join(), `${(marks[k] as PedalTok).which}:${(marks[k] as PedalTok).act}`, `第 ${k + 1} 个单独读`);
    });
  });
});

describe("踏板 · 格式（score minor 9）", () => {
  it(`谱 minor = ${FORMAT_MINOR.score}；冻结样本（minor/score-9）读回来延音踏板原样（踩下 → 换 → 抬起），没有「读不了的」`, () => {
    eq(FORMAT_MINOR.score >= 9, true);
    const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL("./fixtures/format/minor/score-9/sample.mxl", import.meta.url))));
    const toks = Object.values(o.song.papers[0]!.tracks)[0]!;
    eq(toks.filter((t) => t.kind === "pedal").map((t) => `${(t as PedalTok).which}:${(t as PedalTok).act}`).join(" "), "sustain:down sustain:change sustain:up");
    assert(!o.notices.some((x) => x.includes("没有读进来")), o.notices.join(" | "));
  });
});

// ── 第四步：输入（符号层「踏板」、点记号换 / 删、长按拖、符号退格、删音湮灭；设计稿第 6 节）──
const st0 = (body: Token[], caret?: number): EditorState => {
  const s = initState(), pid = s.song.parts[0]!.id, p = s.song.papers[0]!, h = p.tracks[pid]!.slice(0, 3), toks = [...h, ...body];
  return { ...s, song: { ...s.song, papers: [{ ...p, tracks: { [pid]: toks } }] }, caret: caret === undefined ? toks.length : 3 + caret, sel: null, nextId: 99000 };
};
const tk = (s: EditorState) => tr(s).slice(3).map((t) => (t.kind === "pedal" ? `${t.act === "down" ? "v" : t.act === "up" ? "^" : "~"}` : t.kind === "note" ? (t as { pitch: { step: string } }).pitch.step : t.kind)).join(" ");
describe("踏板 · 输入（11-1 第四步）", () => {
  it("写完一个音按踩下 = 从这个音起（挂在光标前那个音前面）；同一个音上再按一次 = 去掉；换成别的动作 = 改", () => {
    let s = st0([n("C"), n("D")]);
    const a = insertPedal(s, "sustain", "down"); eq(a.did, "added"); eq(tk(a.st), "C v D"); assert(!a.idle);
    eq(insertPedal(a.st, "sustain", "down").did, "removed"); eq(tk(insertPedal(a.st, "sustain", "down").st), "C D");
    const c = insertPedal(a.st, "sustain", "up"); eq(c.did, "changed"); eq(tk(c.st), "C ^ D"); eq(c.idle, "notDown", "改成抬起之后前面没踩 = 不起作用");
    s = st0([n("C"), n("D")], 1); eq(tk(insertPedal(s, "sustain", "down").st), "v C D", "光标在第一个音后面 = 挂在它上面");
  });
  it("不起作用的照写、回 idle：踩着又踩 = already，没踩就抬 = notDown；没踩就换 = 踩下（不算不起作用）", () => {
    eq(insertPedal(st0([ped("down"), n("C"), n("D")]), "sustain", "down").idle, "already");
    eq(insertPedal(st0([n("C"), n("D")]), "sustain", "up").idle, "notDown");
    assert(!insertPedal(st0([n("C"), n("D")]), "sustain", "change").idle);
    eq(pedalDownAt(tr(st0([ped("down"), n("C"), ped("change"), n("D"), ped("up"), n("E")])), 3 + 4, "sustain"), true);
    eq(pedalDownAt(tr(st0([ped("down"), n("C"), ped("up"), n("D")])), 3 + 4, "sustain"), false);
  });
  it("有选区 = 把这一段踩住：选区第一个音前面踩下、选区后面抬起", () => {
    const s = { ...st0([n("C"), n("D"), n("E"), n("F")]), sel: { from: 4, to: 6 } };
    const r = insertPedal(s, "sustain", "down"); eq(r.did, "span"); eq(tk(r.st), "C v D E ^ F");
  });
  it("删音湮灭：删掉了中间的音、踩下和抬起之间一个音都没有了 = 两个都去掉；换踏板紧跟抬起 = 去掉换；踩下紧跟换 = 去掉换；抬起紧跟踩下 = 等于换踏板，不动", () => {
    /** a、b 两个踏板记号中间原来隔着一个音、删掉了：湮灭之后剩什么。 */
    const k = (a: Token, b: Token) => { const mid = n("C"), z = n("B"), before = [a, mid, b, z]; return annihilate([a, b, z], before).tokens.map((t) => (t.kind === "pedal" ? t.act : "n")).join(" "); };
    eq(k(ped("down"), ped("up")), "n"); eq(k(ped("change"), ped("up")), "up n"); eq(k(ped("down"), ped("change")), "down n"); eq(k(ped("up"), ped("down")), "up down n");
    eq(k(ped("down"), ped("up", "sostenuto")), "down up n", "不同的踏板不互相湮灭");
  });
  it("本来就挨着的（别家谱读进来的、手写的）不湮灭：删别处的音、挪别的记号都不碰它们", () => {
    const d = ped("down"), u = ped("up"), x = n("C"), y = n("D");
    eq(annihilate([d, u, x], [d, u, x, y]).tokens.length, 3, "删的是后面的 D：前面挨着的踩下抬起不动");
    eq(annihilate([d, u, x]).tokens.length, 3, "不给删之前的串（挪记号）= 踏板不湮灭");
  });
  it("点记号的小菜单：换成踩下 / 抬起 / 换踏板，或删掉；长按拖 = 挪到别的音起；符号退格先删挂在光标前那个音上的踏板", () => {
    const s = st0([ped("down"), n("C"), n("D"), n("E")]);
    eq(tk(editMarkAt(s, 3, { act: "change" })), "~ C D E"); eq(tk(editMarkAt(s, 3, null)), "C D E");
    eq(tk(moveMark(s, 3, 3 + 3).st), "C D v E");
    eq(tk(symBackspace(st0([n("C"), ped("down"), n("D")]))), "C D");
  });
  it("挂在后面那个音上的记号一处定义（isPhraseMark 含踏板）：复制带上第一个音身上的踏板、打开时纸头那一串力度挪到最前、詞先填空音跳过踏板", () => {
    const s = { ...st0([n("C"), ped("down"), n("D"), n("E")]), sel: { from: 5, to: 7 } };
    eq(clipFrom(s), 4, "选区从 D 起 = 带上 D 前面的踏板");
    const s2 = st0([{ kind: "groove", id: nid++, style: "pop" } as Token, { kind: "dyn", id: nid++, value: "mp" } as Token, ped("down"), n("C")]);
    const o = ensureStartDyns(s2.song, 99500, { reorder: true }), pid = s2.song.parts[0]!.id;
    eq(o.song.papers[0]!.tracks[pid]!.slice(3).map((t) => t.kind).join(" "), "dyn groove pedal note");
  });
});

// ── 踏板记号各自写明意思（设计第 13 节；user 11-12「踏板不能只写switch而是写清楚上下这样才鲁棒」）──
//   随便删掉 / 挪走 / 复制粘贴一个踏板记号：其余记号各自存的意思（哪一种、踩下 / 抬起 / 换踏板）一个不变，变的只有起不起作用。
describe("踏板 · 各自写明意思（删 / 挪 / 复制一个，别的不变）", () => {
  const mk = () => [ped("down"), n("C"), ped("change"), n("D"), ped("down"), n("E"), ped("up"), n("F"), ped("up"), n("G"), ped("down", "sostenuto"), n("A"), ped("up", "sostenuto"), n("B")];
  const meaning = (s: EditorState) => new Map(tr(s).filter((t): t is PedalTok => t.kind === "pedal").map((t) => [t.id, `${t.which}:${t.act}`] as const));
  const sameOthers = (a: EditorState, b: EditorState, skip: number, tag: string) => { const A = meaning(a), B = meaning(b); for (const [id, m] of A) if (id !== skip && B.has(id)) eq(B.get(id), m, `${tag}：记号 ${id} 的意思变了`); for (const id of A.keys()) if (id !== skip) assert(B.has(id), `${tag}：记号 ${id} 不见了`); };
  it("删掉任何一个（点记号「删掉」、符号退格）：别的记号一个不少、意思不变", () => {
    const s = st0(mk()), toks = tr(s);
    toks.forEach((t, i) => { if (t.kind !== "pedal") return; sameOthers(s, editMarkAt(s, i, null), t.id, `删 #${i}`); });
    toks.forEach((t, i) => { if (t.kind !== "pedal") return; const at = { ...s, caret: toks.findIndex((x, k) => k > i && x.kind === "note") + 1 }; sameOthers(at, symBackspace(at), t.id, `符号退格删 #${i}`); });
  });
  it("挪走任何一个到任何一个音上（长按拖）：别的记号一个不少、意思不变（挪记号不湮灭踏板）", () => {
    const s = st0(mk()), toks = tr(s), notes = toks.map((t, k) => (t.kind === "note" ? k : -1)).filter((k) => k >= 0);
    toks.forEach((t, i) => { if (t.kind !== "pedal") return; for (const to of notes) sameOthers(s, moveMark(s, i, to).st, t.id, `挪 #${i} → ${to}`); });
  });
  it("复制粘贴一段（带着踏板）：原来的不变；贴进去的是写明的同一个意思（不按贴到的地方重新解读）", () => {
    const s = st0(mk()), toks = tr(s), from = toks.findIndex((t) => t.kind === "pedal" && t.act === "change"), to = from + 4;   // 换踏板 D 踩下 E
    const clip = toks.slice(from, to), pasted = pasteTokens({ ...s, caret: toks.length, sel: null }, clip);
    sameOthers(s, pasted, -1, "粘贴");
    const tail = tr(pasted).slice(toks.length).filter((t): t is PedalTok => t.kind === "pedal").map((t) => t.act).join(" ");
    eq(tail, clip.filter((t): t is PedalTok => t.kind === "pedal").map((t) => t.act).join(" "), "贴进去的踏板记号和复制的一样（换踏板 / 踩下）");
  });
  it("变的只有起不起作用：删掉踩下之后，后面那个抬起变成「没踩就抬」——出声照写的、谱上画灰", () => {
    const s = st0([ped("down"), n("C"), n("D"), ped("up"), n("E")]), up = tr(s)[3 + 3] as PedalTok;
    const after = editMarkAt(s, 3, null), i = tr(after).findIndex((t) => t.id === up.id);
    eq((tr(after)[i] as PedalTok).act, "up", "抬起还是抬起");
    eq(pedalDownAt(tr(after), i, "sustain"), false, "前面没踩 = 这个抬起不起作用");
    const L = engrave(after.song, editorBase(after.song, ["P"]));
    const ink = L.prims.filter((p) => p.tok === up.id);
    assert(ink.length > 0 && ink.every((p) => /(^|\s)art-mute(\s|$)/.test(p.cls ?? "")), "谱上画灰（灰「✱」）");
    const before = engrave(s.song, editorBase(s.song, ["P"])).prims.filter((p) => p.tok === up.id);
    assert(before.length > 0 && before.every((p) => !/(^|\s)art-mute(\s|$)/.test(p.cls ?? "")), "删之前是起作用的钩（不灰）");
  });
});
