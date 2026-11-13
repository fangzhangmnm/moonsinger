// 渐强渐弱（< >）= 记号：从它后面第一个音起，连续变到同一张纸里下一个力度记号生效的那个音；先遇到另一个渐强渐弱 / 都没有 = 走一档。
// created 2026-10-08 by Claude Opus 5.5（v0.7.1 是「音上的标记」，v0.7.6 改成记号）。user「所以<>是一个语义，就是从这一刻开始连续变到下一个强度/速度标记？」
//   「大于小于号不用精确指定范围，而是读最近的pf」「过渡到这张纸的结尾 嗯，不读下一张纸…走一档也行，更合理，需要向用户披露」「力度就是velocity」。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, tr, toggleHairpin, setHairpinTarget, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { dynLevels, noteVelocities, gainSegments, hairpinEnd } from "../src/score/perform.ts";
import { DYNAMICS_VEL } from "../src/format/template.ts";
import { gainSpec, velSpec } from "./fixtures/spec.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
import { apply } from "../src/score/commands.ts";
import { paperOf as paperOfA5 } from "../src/score/paper.ts"; const A5_PAPER = paperOfA5("A5");   // writeMusicXml 要一张算好的纸（第 17 条 17-1：不垫默认）

const meta = { software: "test", date: "2026-10-08" };
const info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
const STEP = velSpec().wedgeStepVel;
let nid = 900;
const dyn = (v: "pp" | "p" | "mp" | "f") => ({ kind: "dyn", id: nid++, value: v }) as Token;
const pin = (dir: "cresc" | "dim") => ({ kind: "hairpin", id: nid++, dir }) as Token;
const note = () => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null }) as Token;
/** 谱头（调 / 拍 / 速度 90）+ items（"n" = 一个四分音符，别的 = 原样的记号）。 */
const line = (items: (Token | "n")[]): Token[] => [...tr(initState()).slice(0, 3), ...items.map((x) => (x === "n" ? note() : x))];
const notes = (toks: Token[]) => toks.flatMap((t, i) => (t.kind === "note" ? [i] : []));
const sv = velSpec(), sg = gainSpec();   // 力度那一路 / 音量那一路

describe("渐强渐弱：编辑（记号）", () => {
  it("放在光标前那个音上（从这个音起；2026-10-08 user「做」）；再点同方向 = 去掉；反方向 = 换；光标还在那个音后面", () => {
    let st: EditorState = initState(); st = writeDegree(st, 1, "near");
    const n0 = tr(st).length;
    st = toggleHairpin(st, "cresc"); eq(tr(st).length, n0 + 1); eq(tr(st)[st.caret - 2].kind, "hairpin"); eq(tr(st)[st.caret - 1].kind, "note", "光标还在音后面");
    st = toggleHairpin(st, "dim"); eq((tr(st)[st.caret - 2] as { dir: string }).dir, "dim", "反方向 = 换");
    st = toggleHairpin(st, "dim"); eq(tr(st).length, n0, "同方向 = 去掉");
    st = apply(st, { k: "wedge", w: "cresc" }); eq(tr(st).at(-2)!.kind, "hairpin", "符号层命令走同一个");
  });
});

describe("渐强渐弱：力度怎么过渡（dynLevels）", () => {
  it("有终点：mp < (两个音) f → 从第一个音的音头线性变到 f 生效那个音的音头；之后停在 f", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", dyn("f"), "n", "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, b, c, d] = notes(toks);
    eq(L.get(a)!.at0, 64); eq(L.get(b)!.at0, 80); eq(L.get(c)!.at0, 96); eq(L.get(d)!.at0, 96);
  });
  it("都没有 = 到纸尾、走一档（+16），按时长线性", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", "n", "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, b, c, d] = notes(toks);
    eq(L.get(a)!.at0, 64); eq(L.get(b)!.at0, 68); eq(L.get(c)!.at0, 72); eq(L.get(d)!.at0, 76); eq(L.get(d)!.at1, 80);
  });
  it("先遇到另一个渐强渐弱 = 到那儿为止、走一档（< > 两个音一起鼓一下）", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", pin("dim"), "n", "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, , c, d] = notes(toks);
    eq(L.get(a)!.at0, 64); eq(L.get(c)!.at0, 80, "到第二个记号那儿 = 高了一档"); eq(L.get(d)!.at0, 72, "再往回走");
  });
  it("不读下一张纸：这张纸里没终点 = 走一档，下一张纸的 f 不算", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", dyn("f"), "n"]), bound = notes(toks)[2] - 1;   // 假装 f 和第三个音在下一张纸
    eq(hairpinEnd(toks, notes(toks)[0] - 1, [0, bound]).kind, "end");
    eq(dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP, [0, bound]).get(notes(toks)[1])!.at1, 80, "纸尾 = mp 走一档");
  });
  it("方向和终点反着 = 方向说了算：mp > f → 先往下走一档（p）、到 f 突变（subito；user「记号的方向说了算…同意」）", () => {
    const toks = line([dyn("mp"), pin("dim"), "n", "n", dyn("f"), "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, b, c] = notes(toks);
    eq(L.get(a)!.at0, 64); assert(L.get(b)!.at0 < 64, "往下走（不是往上）"); eq(L.get(b)!.at1, 48, "走到一档 = p"); eq(L.get(c)!.at0, 96, "到 f 突变");
  });
  it("终点和现在一样（f > f）= 也是走一档再回来", () => {
    const toks = line([dyn("f"), pin("dim"), "n", "n", dyn("f"), "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [, b, c] = notes(toks);
    eq(L.get(b)!.at1, 80); eq(L.get(c)!.at0, 96);
  });
  it("渐强后面接更弱的：mp < p → 先往上一档、到 p 突变下去（贝多芬的 cresc. … subito p）", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", dyn("pp"), "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, b, c] = notes(toks);
    eq(L.get(a)!.at0, 64); assert(L.get(b)!.at0 > 64, "往上走"); eq(L.get(b)!.at1, 80); eq(L.get(c)!.at0, 33, "到 pp 突变");
  });
  it("它和终点之间一个音都没有 = 不起作用", () => {
    const toks = line(["n", pin("cresc"), dyn("f"), "n"]), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), [a, b] = notes(toks);
    eq(L.get(a)!.at0, 80); eq(L.get(b)!.at0, 96);
  });
  it("力度（按力度敲的）按音头；音量曲线那一路一个音里面也走；按力度敲的 = 音量曲线不再管力度", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", dyn("f"), "n"]), V = noteVelocities(toks, undefined, sv, 80 / 127), [a, b, c] = notes(toks);
    eq(Math.round(V.get(a)! * 127), 64); eq(Math.round(V.get(b)! * 127), 80); eq(Math.round(V.get(c)! * 127), 96);
    const g = gainSegments(toks, undefined, sg)!;
    const inA = g.filter((x) => x.t1 <= 0.67 && x.dB > -100).map((x) => x.dB);
    assert(inA.length > 1 && inA[inA.length - 1] > inA[0], "第一个音里面 dB 往上走");
    eq(gainSegments(toks, undefined, sv), null, "按力度敲的不双算");
  });
});

describe("渐强渐弱：MusicXML / 简谱文字", () => {
  it("记号 → <wedge> start，终点那个力度记号前 stop；读回来是同一个位置的记号", () => {
    const toks = line([dyn("mp"), pin("cresc"), "n", "n", dyn("f"), "n"]), w = writeMusicXml({ paper: A5_PAPER, parts: [{ info, tokens: toks }] }, meta);
    eq((w.xml.match(/<wedge type="crescendo"/g) ?? []).length, 1); eq((w.xml.match(/<wedge type="stop"/g) ?? []).length, 1);
    assert(w.xml.indexOf('<wedge type="stop"') < w.xml.indexOf("<f/>"), "stop 在 f 前面");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens;
    eq(back.slice(3).map((t) => (t.kind === "hairpin" ? `<${t.dir}>` : t.kind === "dyn" ? t.value : t.kind[0])).join(" "), "mp <cresc> n n f n");
  });
  it("一直到谱尾：结尾补 stop", () => {
    const w = writeMusicXml({ paper: A5_PAPER, parts: [{ info, tokens: line(["n", pin("dim"), "n", "n"]) }] }, meta);
    eq((w.xml.match(/<wedge type="diminuendo"/g) ?? []).length, 1); eq((w.xml.match(/<wedge type="stop"/g) ?? []).length, 1);
  });
  it("简谱文字：[<] / [>] 往返", () => {
    const toks = line(["n", pin("cresc"), "n"]), txt = toJianpu(toks.slice(3), 0);
    assert(txt.includes("[<]"), txt);
    eq(fromJianpu(txt, 0)!.filter((t) => t.kind === "hairpin").length, 1);
  });
});

describe("力度记号落在光标前那个音（2026-10-08 深夜，user「力度改成落在光标前那个音（和音头记号一样） 做」）", () => {
  it("写完一个音按 f = 这个音起是 f；再按 f = 去掉；光标在最前面 = 后面第一个音", async () => {
    const { setDynSel, dynMarkSel, setCaret } = await import("../src/score/song.ts");
    let st: EditorState = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    const n2 = tr(st).length - 1;
    st = apply(st, { k: "dyn", v: "f" });
    eq(tr(st)[st.caret - 2].kind, "dyn", "f 在第二个音前面"); eq(st.caret, tr(st).length, "光标还在最后");
    eq(dynMarkSel(st), "f");
    st = apply(st, { k: "dyn", v: "f" }); eq(tr(st).some((t) => t.kind === "dyn"), false, "再按 = 去掉");
    st = setCaret(st, 3); st = setDynSel(st, "p");
    eq(tr(st)[3].kind, "dyn", "最前面 = 第一个音前面"); void n2;
  });
});

describe("渐强渐弱：「变到」（7-N 补；终点写到发夹现在结束的地方，终点就是一个普通的力度记号）", () => {
  const stOf = (items: (Token | "n")[]): EditorState => { const st = initState(), toks = line(items); return { ...st, song: { ...st.song, papers: [{ ...st.song.papers[0]!, tracks: { [st.at.part]: toks } }] }, caret: toks.length, nextId: 5000 }; };
  const kinds = (st: EditorState) => tr(st).slice(3).map((t) => (t.kind === "dyn" ? `dyn:${(t as { value: string }).value}` : t.kind)).join(" ");
  it("一个音的滚奏：ppp < (一个音) + 选 fff = 最后一个音后面放一个 fff；这个音从 ppp 涨到 fff（音头 ppp、音尾 fff）", () => {
    const st = stOf([{ kind: "dyn", id: 1, value: "ppp" } as Token, pin("cresc"), "n"]), r = setHairpinTarget(st, 4, "fff");
    eq(r.did, "end"); eq(kinds(r.st), "dyn:ppp hairpin note dyn:fff");
    const toks = tr(r.st), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, STEP), lv = L.get(notes(toks)[0]!)!;
    eq(lv.at0, DYNAMICS_VEL.ppp, "音头 = ppp"); eq(lv.at1, DYNAMICS_VEL.fff, "音尾 = fff");
  });
  it("后面本来有力度记号：选一档 = 改它、不多出一个；选同一档 = 不动", () => {
    const st = stOf([dyn("mp"), pin("cresc"), "n", "n", dyn("f"), "n"]), r = setHairpinTarget(st, 4, "ff");
    eq(r.did, "changed"); eq(kinds(r.st), "dyn:mp hairpin note note dyn:ff note");
    eq(setHairpinTarget(r.st, 4, "ff").did, "none");
  });
  it("选回「走一档」= 去掉挂在这一段结尾的那个；终点还管着后面的音 = 不动（blocked）", () => {
    const placed = setHairpinTarget(stOf([dyn("pp"), pin("cresc"), "n", "n"]), 4, "f").st;
    eq(kinds(placed), "dyn:pp hairpin note note dyn:f");
    const back = setHairpinTarget(placed, 4, null); eq(back.did, "removed"); eq(kinds(back.st), "dyn:pp hairpin note note");
    const mid = stOf([dyn("pp"), pin("cresc"), "n", dyn("f"), "n"]), b2 = setHairpinTarget(mid, 4, null);
    eq(b2.did, "blocked"); assert(b2.st === mid, "原样");
  });
  it("结束在下一条发夹前 = 在那儿放一个（下一条发夹从它起）", () => {
    const r = setHairpinTarget(stOf([dyn("p"), pin("cresc"), "n", "n", pin("dim"), "n"]), 4, "f");
    eq(r.did, "beforeHairpin"); eq(kinds(r.st), "dyn:p hairpin note note dyn:f hairpin note");
  });
  it("MusicXML 往返：放在结尾的力度记号读回来还在结尾", () => {
    const toks = tr(setHairpinTarget(stOf([dyn("pp"), pin("cresc"), "n"]), 4, "f").st), w = writeMusicXml({ paper: A5_PAPER, parts: [{ info, tokens: toks }] }, meta);
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens;
    eq(back.filter((t) => t.kind === "note" || t.kind === "dyn" || t.kind === "hairpin").map((t) => (t.kind === "dyn" ? `dyn:${t.value}` : t.kind)).join(" "), "dyn:pp hairpin note dyn:f");
  });
});
