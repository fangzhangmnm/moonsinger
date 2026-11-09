// svg-groups.test.ts —— toSvgParts 的分组（W-17 智能重画第一刀）：每个图元恰好进一组、组内先后不变、歌名在杂项组、一行谱一组；toSvg = 开 + 组 + 收。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, setNote, tr, type EditorState } from "../src/score/song.ts";
import { engrave, LYRIC_EM } from "../src/render/engrave.ts";
import { toSvg, toSvgParts, primSvg } from "../src/render/svg.ts";

const song = (n: number) => { let st = initState(); st = { ...st, song: { ...st.song, title: "月亮" } }; for (let i = 0; i < n; i++) st = writeDegree(st, (i % 7) + 1, "near"); return st; };
const lay = (st: EditorState, width = 420) => engrave(st.song, { width, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * LYRIC_EM * 10, chrome: { tail: 2.6, famGap: 0.8, navRoom: 16 }, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } });

describe("SVG 按行谱分组（W-17）", () => {
  it("页框一律进杂项组（第 0 组，垫在最底下）：页的中点落在某一行里也一样（v0.16.57，user「paged模式为什么有几行没显示」）", () => {
    const sys = (top: number, bottom: number, k: number) => ({ top, staffTop: top + 40, bottom, paper: "p", part: "v", sys: k, staff: 1 as const });
    const l = { width: 300, height: 1200, sp: 10, pageX: { left: 20, right: 20 }, systems: [sys(80, 200, 0), sys(560, 700, 1), sys(720, 860, 2)],
      prims: [{ t: "rect", x: -20, y: 600, w: 340, h: 300, cls: "page ann" }, { t: "glyph", x: 10, y: 600, ch: "\u{E050}", cls: "clef" }, { t: "glyph", x: 10, y: 640, ch: "\u{E0A4}", cls: "note" }, { t: "glyph", x: 10, y: 780, ch: "\u{E0A4}", cls: "note" }] } as never;
    const g = toSvgParts(l).groups;   // 页框 600–900，中点 750 落在第 3 行（720–860）里
    assert(/class="page ann"/.test(g[0]!), "页框在第 0 组");
    assert(!g.slice(1).some((x) => /class="page/.test(x)), "别的组里没有页框");
    assert(/class="note/.test(g[2]!) && /class="note/.test(g[3]!), "两行的音各在自己的组（画在页框上面）");
  });
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
  it("改一个音的音高（不加临时记号 = 不重排）= 只有那一行的组变；光标不进排版 = 同一首谱怎么排都一样", () => {
    const st = song(40), a = toSvgParts(lay(st)), b = toSvgParts(lay(setNote(st, 10, { pitch: { step: "A", alter: 0, octave: 4 } })));
    eq(a.open, b.open); eq(a.groups.length, b.groups.length);
    const changed = a.groups.map((g, k) => (g !== b.groups[k] ? k : -1)).filter((k) => k >= 0);
    assert(changed.length >= 1 && changed.length <= 2, `变的组：${changed.join(",")}`);
    assert(!changed.includes(0), "杂项组没变");
    const c = toSvgParts(lay({ ...st, caret: 4 }));
    eq(c.groups.join(""), a.groups.join(""), "挪光标：一组都不变（光标在 ink 层）");
  });
});
