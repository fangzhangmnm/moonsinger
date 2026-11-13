// test/acc-color.test.ts —— 音头是什么颜色，它自己的升降号就是什么颜色（v0.17.36；user 11-13「如果音是灰色的话，它对应的升降号也应该对齐是灰色」）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。五线谱：单声乐器的声部里叠着的下面那几个音画灰（chord-mute）、不认的气声画灰（art-mute）——
//   它们自己的升降号（同一个 token、同一个高度）带一样的画灰类；没画灰的音，升降号也不带。简谱那边 jp-acc.chord-mute 早就是这样。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, TPQ, type Token } from "../src/score/song.ts";
import type { Pitch } from "../src/score/pitch.ts";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { GLYPH } from "../src/render/smufl.ts";
import { editorBase } from "./fixtures/layout/cases.ts";

const ACC = new Set<string>([GLYPH.accidentalSharp, GLYPH.accidentalFlat, GLYPH.accidentalNatural, GLYPH.accidentalDoubleSharp, GLYPH.accidentalDoubleFlat]);
const MUTES = ["chord-mute", "art-mute"];
const muteOf = (p: Prim) => MUTES.filter((m) => new RegExp(`(^|\\s)${m}(\\s|$)`).test(p.cls ?? "")).join(",");
const P = (step: string, octave: number, alter = 0): Pitch => ({ step: step as Pitch["step"], alter, octave });
function layout(mono: boolean) {
  const st = initState(), chord = { kind: "note", id: 700, pitch: P("C", 5), chord: [P("F", 4, 1), P("B", 3, -1)], dur: TPQ, lyric: null } as unknown as Token;
  const song = withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), chord]);
  const o = editorBase(song, ["P"]) as unknown as { parts: { mono?: boolean }[] };
  o.parts = o.parts.map((v) => ({ ...v, mono }));
  return engrave(song, o as never);
}
/** 每个符头配它自己的升降号（同一个 token、同一个 y）。 */
const pairs = (L: ReturnType<typeof engrave>) => {
  const glyphs = L.prims.filter((p): p is Extract<Prim, { t: "glyph" }> => p.t === "glyph");
  return glyphs.filter((p) => /(^|\s)note(\s|$)/.test(p.cls ?? "")).map((h) => ({ head: h, acc: glyphs.find((a) => ACC.has(a.ch) && a.tok === h.tok && Math.abs(a.y - h.y) < 1e-6) ?? null }));
};

describe("音头是什么颜色，它自己的升降号就是什么颜色（五线谱）", () => {
  it("单声乐器：叠着的下面两个音（F♯、B♭）画灰，它们的升降号跟着灰；最上面那个不灰", () => {
    const ps = pairs(layout(true)), withAcc = ps.filter((x) => x.acc);
    eq(withAcc.length, 2, "F♯ 和 B♭ 各一个升降号");
    for (const { head, acc } of withAcc) eq(muteOf(acc!), muteOf(head), `升降号 ${acc!.ch.codePointAt(0)!.toString(16)} 的画灰类 = 它的符头的`);
    assert(withAcc.every((x) => muteOf(x.head) === "chord-mute"), "下面两个音是灰的");
    eq(ps.filter((x) => muteOf(x.head) === "").length, 1, "最上面那个不灰");
  });
  it("能叠音的乐器：一个都不灰，升降号也不带画灰类（类和改之前一样）", () => {
    for (const { head, acc } of pairs(layout(false))) { eq(muteOf(head), ""); if (acc) eq(muteOf(acc), ""); }
  });
});
