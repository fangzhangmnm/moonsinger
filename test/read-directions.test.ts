// 读别家的谱时认不得的方向记号按种类数出来（踏板 11-1 第一笔；统筹 2026-11-12 裁定）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   原来踏板（<pedal>）、<sound> 里的踏板（damper / soft / sostenuto-pedal）、dolce 这类文字整个静默丢掉，「读不了的」计数是空的——
//   和「读不了的东西数出来报给人，不静默丢」的老规矩不符。守：① 别家谱里这几种按种类数出来 ② 认得的（速度的文字、反复的字、风格）不算
//   ③ 自家文件（用全的测试歌：风格、反复、速度、力度、八度线…都有）存了再读，一样都不报。
import { describe, it, eq, assert } from "./runner.mjs";
import { readMusicXml } from "../src/format/musicxml.ts";
import { saveMxl, openBytes } from "../src/format/project.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { asFrozen } from "./fixtures/layout/cases.ts";
import { sampleExtras } from "./fixtures/format/sample-song.ts";

const N = (s: string) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const dir = (x: string, snd = "") => `<direction placement="below"><direction-type>${x}</direction-type>${snd}</direction>`;
const xml = (body: string) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Pno</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${body}</measure></part></score-partwise>`;

describe("读别家的谱：认不得的方向记号按种类数出来（踏板 11-1 第一笔）", () => {
  it("踏板读成记号（11-1 第二步起）；表情文字、排练记号、别的：各数各的；音一个不少", () => {
    const r = readMusicXml(xml(
      dir('<pedal type="start" line="yes"/>') + N("C") + dir('<pedal type="change" line="yes"/>') + N("D") + dir('<pedal type="stop" line="yes"/>') + N("E") +
      dir("<words>una corda</words>", '<sound soft-pedal="yes"/>') + dir("<words>dolce</words>") + dir("<rehearsal>A</rehearsal>") + dir("<eyeglasses/>") + N("F")));
    eq(r.parts[0]!.tokens.filter((t) => t.kind === "pedal").map((t) => `${(t as { which: string }).which}:${(t as { act: string }).act}`).join(" "), "sustain:down sustain:change sustain:up soft:down", "延音开始 / 换 / 抬 + <sound soft-pedal> 的弱音");
    eq(r.dropped["踏板记号"], undefined, "读进来了，不再算读不了的");
    eq(r.dropped["文字记号（如 dolce、rit.）"], 1, "dolce（una corda 跟着弱音踏板认走了）");
    eq(r.dropped["排练记号"], 1); eq(r.dropped["别的方向记号"], 1, "eyeglasses");
    eq(r.parts[0]!.tokens.filter((t) => t.kind === "note").length, 4, "音一个不少");
  });
  it("认得的不算：速度带的文字（Allegro）、D.C. / Fine 这类跳转的字", () => {
    const r = readMusicXml(xml(
      dir("<words>Allegro</words><metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome>", '<sound tempo="120"/>') + N("C") +
      dir("<words>D.C. al Fine</words>", '<sound dacapo="yes"/>') + N("D")));
    eq(Object.keys(r.dropped).length, 0, JSON.stringify(r.dropped));
  });
  it("自家文件（用全的测试歌）存了再读：一样都不报「没有读进来」", () => {
    const song = asFrozen(fullSong()), o = openBytes("t.mxl", saveMxl({ song, hum: song.hum, extras: sampleExtras(song), app: "test", date: "2026-11-12T00:00:00.000Z" }));
    assert(!o.notices.some((n) => n.includes("没有读进来")), o.notices.join(" | "));
  });
});
