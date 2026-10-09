// 编排（2026-10-08 深夜 Opus 5.5）：名字 / 序号 + ×N + 括号 + 一个放在最后的循环段 [ … ]。user「a flat 编排 list 同意」「有12房子，master list能调用A.1 x3 A.2 x5这样吗？也许不要弄得太复杂」「无穷循环和循环走带都做」
import { describe, it, eq } from "./runner.mjs";
import { parseArrangement, playOrder, loopPlan, loopWindow } from "../src/score/arrange.ts";
import type { PaperSeg } from "../src/score/song.ts";

const paper = (id: string, name: string, hidden = false): PaperSeg => ({ id, name, tracks: {}, ...(hidden ? { hidden: true } : {}) });
const papers = [paper("p1", "前奏"), paper("p2", "A"), paper("p3", "A1"), paper("p4", "A2"), paper("p5", "尾", true)];
const names = (ids: string[]) => ids.map((id) => papers.find((p) => p.id === id)!.name).join(" ");

describe("编排", () => {
  it("不写 = 每张纸按顺序各放一遍（隐藏的不放）", () => { const a = parseArrangement("", papers); eq(names(a.order), "前奏 A A1 A2"); eq(a.explicit, false); });
  it("房子：前奏 (A A1)×3 (A A2)×2 尾——显式写了隐藏的纸也放", () => {
    const a = parseArrangement("前奏 (A A1)×3 (A A2)×2 尾", papers);
    eq(names(a.order), "前奏 A A1 A A1 A A1 A A2 A A2 尾"); eq(a.issues.length, 0); eq(a.loop, null);
  });
  it("x / X / * 都认；序号也认；、 , → 当分隔", () => eq(names(parseArrangement("1→A x2、(3,4)*2", papers).order), "前奏 A A A1 A2 A1 A2"));
  it("嵌套照样展开", () => eq(names(parseArrangement("((A A1)×2 A2)×2", papers).order), "A A1 A A1 A2 A A1 A A1 A2"));
  it("循环段：前面放一遍，[ ] 里的循环", () => {
    const a = parseArrangement("前奏 [A A1]", papers);
    eq(names(a.order), "前奏"); eq(names(a.loop!), "A A1"); eq(names(playOrder(a)), "前奏 A A1");
  });
  it("写错的：找不到的纸 / 循环段后面还有 / 括号不配 / 次数不对 = 说为什么，能放的照放", () => {
    const a = parseArrangement("前奏 B [A] 尾 (A", papers);
    eq(names(a.order), "前奏"); eq(names(a.loop!), "A");
    const whys = a.issues.map((x) => x.why).join(" | ");
    eq(/没有叫「B」/.test(whys) && /循环段只能放在最后/.test(whys), true, whys);
    eq(parseArrangement("A×0", papers).issues.length, 1);
  });
});

describe("编排：存、放、导出", () => {
  /** 两张纸：第一张一个音（A），第二张两个音（B）。 */
  const two = async () => {
    const { initState, writeDegree, addPaper, setPaperName, tr: _t } = await import("../src/score/song.ts");
    let st = writeDegree(initState(), 1, "near");
    st = setPaperName(st, st.song.papers[0].id, "A");
    st = addPaper(st); st = setPaperName(st, st.song.papers[1].id, "B");
    st = { ...st, at: { ...st.at, paper: st.song.papers[1].id }, caret: 3 };
    st = writeDegree(writeDegree(st, 2, "near"), 3, "near");
    void _t; return st;
  };
  it("setArrangement：去掉两头空格；写空 = 删掉这个字段；没变 = 同一个状态", async () => {
    const { setArrangement, songOnlyPaper } = await import("../src/score/song.ts");
    const st = await two(), a = setArrangement(st, "  A×2 B ");
    eq(a.song.arrangement, "A×2 B"); eq(setArrangement(a, "A×2 B"), a);
    eq("arrangement" in setArrangement(a, "  ").song, false);
    eq("arrangement" in songOnlyPaper(a.song, a.song.papers[0].id), false, "本段 = 只这一张，编排不管");
  });
  it("压平照编排：A×2 B = A 的音出两遍（抄的那遍 id 是新的），B 一遍", async () => {
    const { setArrangement, flattenPart } = await import("../src/score/song.ts");
    const { songPlayOrder } = await import("../src/score/arrange.ts");
    const st = setArrangement(await two(), "A×2 B"), f = flattenPart(st.song, st.at.part, { order: songPlayOrder(st.song) });
    eq(f.starts.map((s) => s.paper.name).join(" "), "A A B");
    const notes = f.tokens.filter((t) => t.kind === "note");
    eq(notes.length, 4); eq(new Set(f.tokens.map((t) => t.id)).size, f.tokens.length, "id 不重复");
  });
  it("存 / 开往返：编排那一行留着；派生的 score.musicxml 按编排展开（循环段写一遍）", async () => {
    const { setArrangement } = await import("../src/score/song.ts");
    const { saveMxl, openBytes, emptyExtras } = await import("../src/format/project.ts");
    const { unzipSync, strFromU8 } = await import("../vendor/fflate/fflate.esm.js");
    const st = setArrangement(await two(), "B [A]");
    const bytes = saveMxl({ song: st.song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08" });
    eq(openBytes("x.mxl", bytes).song.arrangement, "B [A]");
    const flat = strFromU8(unzipSync(bytes)["score.musicxml"]);
    eq([...flat.matchAll(/<step>([A-G])</g)].map((m) => m[1]).join(" "), "D E C", "B 的两个音在前，A 的在后");
    eq([...flat.matchAll(/<rehearsal[^>]*>([^<]*)</g)].map((m) => m[1]).join(" "), "A", "第二段起写排练记号 = 曲段名");
    eq("arrangement" in openBytes("x.mxl", saveMxl({ song: (await two()).song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08" })).song, false, "没写 = 不落字段");
  });
});

describe("循环放（loopPlan / loopWindow）", () => {
  it("写了循环段：前面一遍 + 循环段两遍；没写 = 整首两遍；本段（只一张纸）= 这一张两遍", () => {
    const a = loopPlan({ arrangement: "前奏 [A A1]", papers });
    eq(names(a.order), "前奏 A A1 A A1"); eq(a.intro, 1); eq(a.body, 2);
    const b = loopPlan({ papers });
    eq(names(b.order), "前奏 A A1 A2 前奏 A A1 A2"); eq(b.intro, 0); eq(b.body, 4);
    eq(names(loopPlan({ papers: [papers[1]] }).order), "A A");
  });
  it("循环区间 = 第二遍（谱上的秒）：前奏 3 拍 + 循环段 2 拍，速度 90 → 第二遍从 (3+2)×⅔ 秒到 (3+4)×⅔ 秒", async () => {
    const { initState, writeDegree, addPaper, setPaperName, setArrangement, flattenPart, tempoMapOf } = await import("../src/score/song.ts");
    let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } };
    for (const d of [1, 2, 3]) st = writeDegree(st, d, "near");
    st = setPaperName(st, st.song.papers[0].id, "前奏"); st = addPaper(st); st = setPaperName(st, st.song.papers[1].id, "B");
    st = { ...st, at: { ...st.at, paper: st.song.papers[1].id }, caret: 3 };
    for (const d of [4, 5]) st = writeDegree(st, d, "near");
    st = setArrangement(st, "前奏 [B]");
    const plan = loopPlan(st.song), f = flattenPart(st.song, st.song.parts[0].id, { order: plan.order, tempo: true });
    const w = loopWindow(f.tokens, tempoMapOf(st.song, plan.order), f.starts, plan)!;
    const q = 60 / 90, near = (x: number, y: number) => Math.abs(x - y) < 1e-9;
    eq(near(w.start, 5 * q) && near(w.end, 7 * q), true, `${w.start} / ${w.end}`);
  });
  it("循环段一个音都没有 = 不循环（null）", () => eq(loopWindow([], [], [{ index: 0 }, { index: 0 }], { intro: 0, body: 1 }), null));
});
