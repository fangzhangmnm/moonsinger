// test/chord-text.test.ts —— 和弦标里的升降号贴着它所属的字（v0.17.34，统筹 134f74e4 第 3 条）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：四种位置（根音字母后面 B♭、级数前面 ♭VII、变化音数字前面 ♭5 / ♯9、低音字母后面 /B♭）——升降号和所属的字之间看得见的缝（墨到墨）= tight，
//   不大于这款字字和字之间看得见的缝的中位；另一边 = loose（比所属的那边宽：读成「B♭ 7」不是「B ♭7」）；补粗之后主笔画 = 旁边字竖笔的 0.9；
//   回来的宽 = 画出来的（最后一段的墨 + 它自己的右留白）；没有升降号的整串 = 一段字（和改之前一样）。
import { describe, it, eq, assert } from "./runner.mjs";
import { chordTextLayout, chordTextPrims, type ChordPiece } from "../src/render/chord-text.ts";
import { CHORD_ADV, CHORD_SB, CHORD_STEM } from "../src/render/chord-text.gen.ts";
import { CHORD_ACC_GAP } from "../src/look/text.ts";
import { ACC_GLYPH } from "../src/render/jianpu/glyphs.ts";
import { SMALL_STEM_K } from "../src/render/text/index.ts";

const FS = 20, near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;
/** 一段的墨：字 = 起点 + 左留白 … 终点 − 右留白；升降号 = 它自己的墨（x … x + w）。 */
const ink = (p: ChordPiece): [number, number] => p.kind === "acc" ? [p.x, p.x + p.w] : [p.x + (CHORD_SB[[...p.s][0]!]?.[0] ?? 0) * FS, p.x + p.w - (CHORD_SB[[...p.s].at(-1)!]?.[1] ?? 0) * FS];
/** 第 k 段（升降号）和左右邻居之间看得见的缝（字号的倍数）。 */
const gaps = (pcs: ChordPiece[], k: number) => ({ left: k > 0 ? (ink(pcs[k]!)[0] - ink(pcs[k - 1]!)[1]) / FS : null, right: k + 1 < pcs.length ? (ink(pcs[k + 1]!)[0] - ink(pcs[k]!)[1]) / FS : null });
/** 这款字字和字之间看得见的缝（和弦标里常见的几对）的中位。 */
const MEDIAN = (() => { const pairs = ["ma", "aj", "VI", "II", "m7", "di", "im", "su", "us", "dd", "d9", "69", "7/"].map(([a, b]) => CHORD_SB[a!]![1] + CHORD_SB[b!]![0]); pairs.sort((x, y) => x - y); return pairs[pairs.length >> 1]!; })();

describe("和弦标的升降号贴着所属的字（四种位置）", () => {
  const cases: [string, number, "left" | "right"][] = [["B♭7", 1, "left"], ["♭VII7", 0, "right"], ["F♯m7♭5", 1, "left"], ["F♯m7♭5", 3, "right"], ["V7♯9", 1, "right"], ["C/B♭", 1, "left"], ["I/♭3", 1, "right"]];
  for (const [label, k, owner] of cases) it(`${label}：第 ${k + 1} 段（${owner === "left" ? "属于前面的字母" : "属于后面的字"}）`, () => {
    const { pieces } = chordTextLayout(label, FS), p = pieces[k]!;
    assert(p.kind === "acc", JSON.stringify(pieces.map((x) => x.kind)));
    const g = gaps(pieces, k), own = owner === "left" ? g.left : g.right, other = owner === "left" ? g.right : g.left;
    assert(own !== null && own <= MEDIAN + 1e-9, `所属那边的缝 ${own} ≤ 字距中位 ${MEDIAN}`);
    assert(own! >= 0, `所属那边的缝不是负的（不压字）：${own}`);
    if (other !== null) assert(other > own!, `另一边的缝 ${other} 比所属那边 ${own} 宽`);
  });
  it("所属那边看得见的缝 = tight（字自带的留白小于 tight 时补到 tight）；另一边 = loose", () => {
    const b = chordTextLayout("B♭7", FS).pieces, g = gaps(b, 1);
    assert(near(g.left!, Math.max(CHORD_ACC_GAP.tight, CHORD_SB.B![1])), `B♭ ${g.left}`); assert(near(g.right!, Math.max(CHORD_ACC_GAP.loose, CHORD_SB["7"]![0])), `♭7 ${g.right}`);
    const v = gaps(chordTextLayout("♭VII", FS).pieces, 0); assert(near(v.right!, Math.max(CHORD_ACC_GAP.tight, CHORD_SB.V![0])), `♭V ${v.right}`);
  });
  it("补粗：升降号这一家的主笔画补到旁边字（衬线半粗）竖笔的 0.9（7-P 那条，只是竖笔换成和弦标这款字的）", () => {
    for (const p of chordTextLayout("B♭F♯", FS).pieces) if (p.kind === "acc") {
      const g = Object.values(ACC_GLYPH).find((x) => x.ch === p.ch)!, dom = (g.dom + p.stroke) * p.em;   // 这个字形自己的主笔画 + 描边（描边里已经含「同一家先看齐」那一截）
      assert(near(dom, SMALL_STEM_K * CHORD_STEM * FS, 1e-6), `${p.ch}：主笔画 ${dom.toFixed(3)} vs 目标 ${(SMALL_STEM_K * CHORD_STEM * FS).toFixed(3)}`);
    }
  });
  it("宽 = 画出来的：最后一段的终点；没有升降号的整串 = 一段字、宽 = 字宽表加起来", () => {
    const L = chordTextLayout("F♯m7♭5", FS), last = L.pieces.at(-1)!; assert(near(L.w, last.x + last.w), `${L.w}`);
    const one = chordTextLayout("IV7 · ii", FS); eq(one.pieces.length, 1); assert(near(one.w, [..."IV7 · ii"].reduce((w, c) => w + CHORD_ADV[c]! * FS, 0)));
  });
  it("图元：字一段一个 text（类原样）、升降号一个 glyph（类把 chord-tag 换成 chord-acc，修饰类跟着）；升降号的墨顶在大写字母顶上面一点", () => {
    const { prims } = chordTextPrims("B♭7", 100, 50, FS, "chord-tag is-pinned");
    eq(prims.map((p) => p.t).join(","), "text,glyph,text"); eq(prims[1]!.cls, "chord-acc is-pinned"); eq(prims[0]!.cls, "chord-tag is-pinned");
    assert(prims[0]!.t === "text" && prims[0]!.s === "B" && prims[2]!.t === "text" && prims[2]!.s === "7");
  });
});
