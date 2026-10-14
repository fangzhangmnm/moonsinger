// svg-groups.test.ts —— toSvgParts 的分组（W-17 智能重画第一刀）：每个图元恰好进一组、组内先后不变、歌名在杂项组、一行谱一组；toSvg = 开 + 组 + 收。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, tr, type EditorState } from "../src/score/song.ts";
import { engrave, LYRIC_EM } from "../src/render/engrave.ts";
import { toSvg, toSvgParts, primSvg } from "../src/render/svg.ts";

const song = (n: number) => { let st = initState(); st = { ...st, song: { ...st.song, title: "月亮" } }; for (let i = 0; i < n; i++) st = writeDegree(st, (i % 7) + 1); return st; };
const lay = (st: EditorState, width = 420) => engrave(st.song, { width, sp: 10, at: st.at, caret: 3, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * LYRIC_EM * 10, titlePlaceholder: true, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } });

describe("SVG 按行谱分组（W-17）", () => {
  it("每个图元恰好进一组、组内先后 = 排版时的先后；组数 = 行数 + 1；toSvg = 开 + 组 + 收", () => {
    const st = song(40), l = lay(st), parts = toSvgParts(l);
    assert(l.systems.length >= 3, `要多于两行（${l.systems.length}）`);
    eq(parts.groups.length, l.systems.length + 1);
    const n = (v: number) => (Math.round(v * 100) / 100).toString(), fs = n(40), lfs = n(LYRIC_EM * 10), rx = n(6);
    const all = l.prims.map((p) => primSvg(p, fs, lfs, rx));
    const used = new Array(all.length).fill(false); let total = 0;
    for (const g of parts.groups) {
      const inner = g.replace(/^<g data-sys="-?\d+">/, "").replace(/<\/g>$/, "");
      let pos = 0, last = -1;
      while (pos < inner.length) {   // 组里的元素一个个对回 prims：下一个匹配的下标必须比上一个大（组内先后不变）
        let k = all.findIndex((e, i) => !used[i] && i > last && inner.startsWith(e, pos));
        if (k < 0) k = all.findIndex((e, i) => !used[i] && inner.startsWith(e, pos));
        assert(k >= 0, `组里有对不上的元素：${inner.slice(pos, pos + 60)}`);
        assert(k > last, `组内先后乱了：${k} 在 ${last} 之后`);
        used[k] = true; last = k; pos += all[k].length; total++;
      }
    }
    eq(total, l.prims.length, "每个图元恰好一次");
    assert(used.every(Boolean), "没有漏的");
    eq(toSvg(l), parts.open + parts.groups.join("") + parts.close);
    assert(/月亮/.test(parts.groups[0]), "歌名在杂项组（第 0 组）");
    assert(parts.groups.slice(1).every((g) => /class="note/.test(g) || /class="staff/.test(g)), "每一行的组里有谱线 / 音");
  });
  it("只挪光标 = 只有光标那一行的组变", () => {
    const st = song(40), a = toSvgParts(lay(st)), b = toSvgParts(engrave(st.song, { width: 420, sp: 10, at: st.at, caret: 4, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * LYRIC_EM * 10, titlePlaceholder: true, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } }));
    eq(a.open, b.open); eq(a.groups.length, b.groups.length);
    const changed = a.groups.map((g, k) => (g !== b.groups[k] ? k : -1)).filter((k) => k >= 0);
    assert(changed.length >= 1 && changed.length <= 2, `变的组：${changed.join(",")}`);
    assert(!changed.includes(0), "杂项组没变");
  });
});
