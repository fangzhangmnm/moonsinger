// svg-groups.test.ts —— toSvgParts 的分组（W-17 智能重画第一刀）：每个图元恰好进一组、组内先后不变、歌名在杂项组、一行谱一组；toSvg = 开 + 组 + 收。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, setNote, tr, type EditorState } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";
import { wrapTitle } from "../src/render/frame/furniture.ts";
import { toSvg, toSvgParts, primSvg } from "../src/render/svg.ts";
import { createTextMeasure, LYRIC_EM } from "../src/render/text/index.ts";

const song = (n: number) => { let st = initState(); st = { ...st, song: { ...st.song, title: "月亮" } }; for (let i = 0; i < n; i++) st = writeDegree(st, (i % 7) + 1, "near"); return st; };
const lay = (st: EditorState, width = 420) => engrave(st.song, { width, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], measure: createTextMeasure((s: string) => s.length * LYRIC_EM * 10), chrome: { tail: 2.6, famGap: 0.8, navRoom: 16 }, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } });

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

describe("歌名折行（v0.16.58，user 11-09「曲名应该能换行」）", () => {
  const W = (t: string) => [...t].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 20 : 10), 0);   // 方块字 20、拉丁 10
  it("放得下 = 一行；有空格先在空格断；一个词太长按字断；行首不放标点 / 小写假名", () => {
    eq(wrapTitle("月亮", W, 100).join("|"), "月亮");
    eq(wrapTitle("陽だまり道とれんちょん 简单笛子版", W, 240).join("|"), "陽だまり道とれんちょん|简单笛子版");
    eq(wrapTitle("一二三四五六七八九十", W, 100).join("|"), "一二三四五|六七八九十");
    const r = wrapTitle("あいうえおっかきく", W, 100);
    assert(r.every((l) => !/^[っゃゅょ、。]/.test(l)), `行首有小写假名：${r.join("|")}`);
    assert(r.every((l) => W(l) <= 100), `每行放得下：${r.join("|")}`);
  });
  it("排版：太长的歌名折成几行、都在纸里；作者栏 / 谱跟着往下让", () => {
    const mk = (title: string) => { let st = initState(); st = { ...st, song: { ...st.song, title, credits: "词：某人" } }; for (let i = 0; i < 8; i++) st = writeDegree(st, (i % 7) + 1, "near"); return lay(st, 300); };
    const a = mk("短"), b = mk("这是一个非常非常非常非常非常非常长的歌名需要折行才放得下");
    const ts = (l: ReturnType<typeof lay>) => l.prims.filter((p) => p.t === "text" && p.cls === "song-title") as { x: number; y: number; s: string; size: number }[];
    eq(ts(a).length, 1);
    assert(ts(b).length >= 2, `折成了 ${ts(b).length} 行`);
    for (const t of ts(b)) { const w = (t.s.length * 20 * t.size * 1.08) / (LYRIC_EM * 10); assert(t.x - w / 2 >= 0 && t.x + w / 2 <= 300, `「${t.s}」伸出纸`); }
    const cy = (l: ReturnType<typeof lay>) => (l.prims.find((p) => p.t === "text" && p.cls === "credits") as { y: number }).y;
    assert(cy(b) > cy(a) + 1, `作者栏往下让了（${cy(a)} → ${cy(b)}）`);
    assert(b.systems[0]!.staffTop > a.systems[0]!.staffTop + 1, "第一行谱往下让了");
  });
});
