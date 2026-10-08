// 连线（连断第 2 步）：编辑（选区 / 符号层）+ MusicXML 原生 <slur> 往返。created 2026-10-08 by Claude Opus 5.5
// user「连和断，嗯就是我想的，能做吗」「连断 预设 都同意」：底色归演奏者（articulation.gapSec，见 honors.test.ts），谱上的连线只改局部。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, writeRest, select, tr, toggleSlurSel, toggleSlurBefore, slurStateSel, type NoteTok, type EditorState } from "../src/score/song.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";

const meta = { software: "test", date: "2026-10-08" };
const info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
function four(): EditorState { let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } }; for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return st; }
const noteIdx = (st: EditorState) => tr(st).flatMap((t, i) => (t.kind === "note" ? [i] : []));
const slurs = (st: EditorState) => noteIdx(st).map((i) => !!(tr(st)[i] as NoteTok).slur);

describe("连线：编辑", () => {
  it("选中三个音 = 前两个连到下一个；再点 = 去掉；只选一个 = 它连到下一个", () => {
    let st = four(); const [a, , c] = noteIdx(st);
    st = toggleSlurSel(select(st, a, c + 1));
    eq(JSON.stringify(slurs(st)), "[true,true,false,false]");
    eq(slurStateSel(st), "all");
    st = toggleSlurSel(st); eq(JSON.stringify(slurs(st)), "[false,false,false,false]", "都连着 = 去掉");
    st = toggleSlurSel(select(st, c, c + 1)); eq(JSON.stringify(slurs(st)), "[false,false,true,false]", "只选一个");
  });
  it("符号层：光标前那个音连到下一个；再点 = 去掉；前面是休止 = null", () => {
    let st = four(); st = toggleSlurBefore(st)!;
    eq(JSON.stringify(slurs(st)), "[false,false,false,true]");
    st = toggleSlurBefore(st)!; eq(JSON.stringify(slurs(st)), "[false,false,false,false]");
    eq(toggleSlurBefore(writeRest(st)), null);
  });
});

describe("连线：MusicXML（musicxml.ts）", () => {
  it("往返：一串连着的 = start 在头一个、stop 在被连到的那个；读回来一样", () => {
    let st = four(); const [a, b] = noteIdx(st);
    st = toggleSlurSel(select(st, a, b + 2));   // 1、2 连到 3
    const toks = tr(st), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    eq((w.xml.match(/<slur type="start"/g) ?? []).length, 1); eq((w.xml.match(/<slur type="stop"/g) ?? []).length, 1);
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    eq(JSON.stringify(r.parts[0].tokens.filter((t) => t.kind === "note").map((t) => !!(t as NoteTok).slur)), JSON.stringify(slurs(st)));
    eq(Object.keys(r.dropped).length, 0);
  });
  it("最后一个音标了「连到下一个」但后面没有音 = 不写（不留没有 stop 的 start）", () => {
    let st = four(); st = toggleSlurBefore(st)!;
    const w = writeMusicXml({ parts: [{ info, tokens: tr(st) }] }, meta);
    assert(!w.xml.includes("<slur"), "不该写 slur");
  });
  it("别家谱：两条连线首尾相接（同一个音上 stop + start）= 连成一串", () => {
    let st = four(); const [a, b, c, d] = noteIdx(st);
    st = toggleSlurSel(select(st, a, b + 1)); st = toggleSlurSel(select(st, c, d + 1));   // 1→2、3→4
    const w = writeMusicXml({ parts: [{ info, tokens: tr(st) }] }, meta);
    // 把 2 上的 stop 后面补一个 start（别家常这么写：一个音既是这条的尾、又是下一条的头）
    const xml = w.xml.replace(/<slur type="stop" number="1"\/>/, `<slur type="stop" number="1"/><slur type="start" number="1"/>`);
    const r = readMusicXml(xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    eq(JSON.stringify(r.parts[0].tokens.filter((t) => t.kind === "note").map((t) => !!(t as NoteTok).slur)), "[true,true,true,false]");
  });
});
