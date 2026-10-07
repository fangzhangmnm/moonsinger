// 纸测试：A4 / A5 / A6 认档、别的纸原样留着、存进 MusicXML <defaults> 往返、默认 A5 不多出字段。
// created 2026-10-07 by Claude Opus 5.5（user「嗯A4 A5 A6三种，可以定」「默认A5同意」；数据契约草稿 §6¾）
import { describe, it, eq, assert } from "./runner.mjs";
import { paperOf, detectPaper, lineSp, PAPER_KINDS } from "../src/score/paper.ts";
import { emptySong, initState, setPaper } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { writeMusicXml } from "../src/format/musicxml.ts";

const save = (song: ReturnType<typeof emptySong>) => saveMxl({ song, hum: song.hum, quality: "full", extras: emptyExtras(), app: "v0.0.0-test", date: "2026-10-07" });
const PART = { id: "P1", name: "主唱", instrumentName: "月读", sound: "voice.vocals", program: 55 };

describe("纸", () => {
  it("一行多宽：纸越大放得越多，A5 放得进 iPad mini 竖屏（11 px 一格）", () => {
    const w = PAPER_KINDS.map((k) => lineSp(paperOf(k)));
    assert(w[0] > w[1] && w[1] > w[2], w.join(" > "));
    assert(w[1] * 11 <= 744 - 8, `A5 = ${(w[1] * 11).toFixed(0)} px`);
  });
  it("认档：差 2 mm 内算同一档；Letter = 其他（原样留着）", () => {
    const m = { l: 10, r: 10, t: 10, b: 10 };
    eq(detectPaper(210.5, 296, m).kind, "A4"); eq(detectPaper(148, 210, m).kind, "A5"); eq(detectPaper(105, 148, m).kind, "A6");
    const letter = detectPaper(215.9, 279.4, m); eq(letter.kind, "other"); eq(Math.round(letter.widthMm), 216);
  });
  it("存进 <defaults>、打开还是那张纸；默认 A5 不多出字段", () => {
    let st = setPaper(initState(), "A4");
    eq(openBytes("x.mxl", save(st.song)).song.paper?.kind, "A4");
    st = setPaper(st, "A5"); eq(st.song.paper, undefined, "换回 A5 = 没有字段");
    eq(openBytes("x.mxl", save(st.song)).song.paper, undefined, "A5 往返不多出字段");
    const xml = writeMusicXml(emptySong(), PART, { software: "t", date: "d" }).xml;
    assert(/<identification>[\s\S]*<\/identification>\s*<defaults>[\s\S]*<\/defaults>\s*<part-list>/.test(xml), "<defaults> 在 identification 和 part-list 之间（schema 顺序）");
  });
  it("别的软件的纸：按它自己的 scaling 换算、Letter 原样写回", () => {
    const xml = writeMusicXml(emptySong(), PART, { software: "t", date: "d" }).xml
      .replace(/<defaults>[\s\S]*<\/defaults>/, "<defaults><scaling><millimeters>7.056</millimeters><tenths>40</tenths></scaling><page-layout><page-height>1584</page-height><page-width>1224</page-width><page-margins type=\"both\"><left-margin>85</left-margin><right-margin>85</right-margin><top-margin>85</top-margin><bottom-margin>85</bottom-margin></page-margins></page-layout></defaults>");
    const o = openBytes("letter.musicxml", new TextEncoder().encode(xml));
    eq(o.song.paper?.kind, "other"); eq(Math.round(o.song.paper!.widthMm), 216);
    eq(Math.round(openBytes("x.mxl", save(o.song)).song.paper!.heightMm), 279, "再存一遍还是 Letter");
  });
});
