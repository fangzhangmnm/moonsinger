// 纸测试：A4 / A5 / A6 认档、别的纸原样留着、存进 MusicXML <defaults> 往返；17-1 起纸张存选择（"default" 或选的那一种）。
// created 2026-10-07 by Claude Opus 5.5（user「嗯A4 A5 A6三种，可以定」「默认A5同意」；数据契约草稿 §6¾）
import { describe, it, eq, assert } from "./runner.mjs";
import { PAPER_KINDS } from "../src/score/paper.ts";
import { paperOf, detectPaper, lineSp } from "../src/look/paper.ts";
import { emptySong, initState, setPaper, firstTrack } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { lookOf, followDefault } from "../src/look/index.ts";
import { writeMusicXml } from "../src/format/musicxml.ts";

const save = (song: ReturnType<typeof emptySong>) => saveMxl({ song, extras: emptyExtras(), app: "v0.0.0-test", date: "2026-10-07" });
const PART = { id: "P1", name: "主唱", instrumentName: "月读", sound: "voice.vocals", program: 55 };
const doc = (song: ReturnType<typeof emptySong>) => ({ title: song.title, paper: lookOf(song).paper, credits: song.credits, parts: [{ info: PART, tokens: firstTrack(song) }] });

describe("纸", () => {
  it("一行多宽：纸越大放得越多，A5 放得进 iPad mini 竖屏（11 px 一格）", () => {
    const w = (k: (typeof PAPER_KINDS)[number]) => lineSp(paperOf(k));
    assert(w("A3L") > w("A4") && w("A4") > w("A5") && w("A5") > w("A6"), PAPER_KINDS.map((k) => w(k).toFixed(1)).join(" > "));
    assert(w("A5") * 11 <= 744 - 8, `A5 = ${(w("A5") * 11).toFixed(0)} px`);
    // 谱的大小（staffMm）：谱小了一行放得多，纸的宽度不变（user 2026-10-08「排版引擎还是要支持小字号…交响总谱」）
    assert(lineSp(paperOf("A3L", "compact")) > lineSp(paperOf("A3L")) * 1.3, "紧凑（5 mm 的谱）一行放得多");
  });
  it("认档：差 2 mm 内算同一档；Letter = 其他（原样留着）", () => {
    const m = { l: 10, r: 10, t: 10, b: 10 };
    eq(detectPaper(210.5, 296, m).kind, "A4"); eq(detectPaper(148, 210, m).kind, "A5"); eq(detectPaper(105, 148, m).kind, "A6");
    const letter = detectPaper(215.9, 279.4, m); eq(letter.kind, "other"); eq(Math.round(letter.widthMm), 216);
  });
  it("纸张存选择（第 17 条 17-1）：选了 A4 = 存 A4、打开还是 A4；选 A5 也是选过的；跟着软件 = 存 \"default\"、打开还是跟着软件（画的时候 = A5）", () => {
    let st = setPaper(initState(), "A4");
    eq(JSON.stringify(openBytes("x.mxl", save(st.song)).song.paper), JSON.stringify({ kind: "A4" }));
    st = setPaper(st, "A5"); eq(JSON.stringify(st.song.paper), JSON.stringify({ kind: "A5" }), "选了 A5 = 写 A5");
    eq(JSON.stringify(openBytes("x.mxl", save(st.song)).song.paper), JSON.stringify({ kind: "A5" }), "选过的 A5 往返");
    const f = { ...st, song: followDefault(st.song, "paper") }, back = openBytes("x.mxl", save(f.song)).song;
    eq(back.paper, "default", "跟着软件往返"); eq(lookOf(back).paper.kind, "A5", "画的时候 = A5");
    const xml = writeMusicXml(doc(emptySong()), { software: "t", date: "d" }).xml;
    assert(/<identification>[\s\S]*<\/identification>\s*<defaults>[\s\S]*<\/defaults>\s*<part-list>/.test(xml), "<defaults> 在 identification 和 part-list 之间（schema 顺序）");
  });
  it("别的软件的纸：按它自己的 scaling 换算、Letter 原样写回", () => {
    const xml = writeMusicXml(doc(emptySong()), { software: "t", date: "d" }).xml
      .replace(/<defaults>[\s\S]*<\/defaults>/, "<defaults><scaling><millimeters>7.056</millimeters><tenths>40</tenths></scaling><page-layout><page-height>1584</page-height><page-width>1224</page-width><page-margins type=\"both\"><left-margin>85</left-margin><right-margin>85</right-margin><top-margin>85</top-margin><bottom-margin>85</bottom-margin></page-margins></page-layout></defaults>");
    const o = openBytes("letter.musicxml", new TextEncoder().encode(xml));
    const c = o.song.paper as { kind: string; widthMm: number; heightMm: number };
    eq(c.kind, "other"); eq(Math.round(c.widthMm), 216, "别家的大小按值带着");
    eq(Math.round(lookOf(openBytes("x.mxl", save(o.song)).song).paper.heightMm), 279, "再存一遍还是 Letter");
  });
});

// 作者栏 = 纯文本、所见即所得（user「你权衡一个plain multiline text vs自动识别（但是这样有hidden convention）」→ AI 选纯文本）。edited by Claude Opus 5.5 2026-10-07
import { setCredits } from "../src/score/song.ts";
describe("作者栏", () => {
  it("一块纯文本：存进 <credit><credit-words>（在 defaults 和 part-list 中间）、打开还是那几行；头尾空行和行尾空白去掉；清空 = 不记", () => {
    let st = setCredits(initState(), "\n麻枝准 词曲  \n某人 编曲\n\n");
    eq(st.song.credits, "麻枝准 词曲\n某人 编曲");
    const xml = writeMusicXml(doc(st.song), { software: "t", date: "2026-10-07" }).xml;
    assert(/<\/defaults>\s*<credit page="1"><credit-words[^>]*justify="right"[^>]*>麻枝准 词曲\n某人 编曲/.test(xml) && /<\/credit>\s*<part-list>/.test(xml), "credit 的位置和内容");
    eq(openBytes("x.mxl", save(st.song)).song.credits, st.song.credits);
    st = setCredits(st, "  \n "); eq(st.song.credits, undefined);
  });
  it("只有 <creator> 的（v0.2.23 存的 / 别的软件）：照当时纸上的样子拼成几行", () => {
    const xml = writeMusicXml(doc(initState().song), { software: "t", date: "2026-10-07" }).xml
      .replace("<identification>", '<identification><creator type="composer">麻枝准</creator><creator type="lyricist">麻枝准</creator><creator type="arranger">某人</creator>');
    eq(openBytes("a.musicxml", new TextEncoder().encode(xml)).song.credits, "麻枝准 词曲\n某人 编曲");
  });
});
