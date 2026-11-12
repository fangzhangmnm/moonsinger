// 一组比一页高 = 在行和行之间断开、接到下一页（施工单 7-V，user 2026-11-12「只能接到下一页啦」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   用全的测试歌（十个声部一组，比 A5 一页能放的高）× 三种谱 × 印 / 分页预览，对抗性地查：
//   ① 每一行都整个落在它那一页能放字的地方里（不伸出纸底、不压页边）；② 同一组断开的几截：行和行不相叠、一截在一页上，下一页那一截从页顶接着；
//   ③ 接过来的那几行下面，后面的内容从它下面接着排（不叠回去）；④ 行首连着几条谱的那根竖线每一页各画各的，不跨过两页之间；
//   ⑤ 印出来的东西每一样都落在某一页里（PDF 按 y 分页：落在两页之间那条缝里的 = 不印，原来伸出纸底的那几行就是这么丢的）；
//   ⑥ 小节线的横向位置：同一组分在两页上的两截一样（本来就是同一组的列）；⑦ 一块自己就比一页高（极端）：放在页顶照实伸出去，后面的从它下面接着排，不相叠；
//   ⑧ 状态那一串有「有一组比一页高，接到了下一页」（不印），没有断开的版面没有它。
import { describe, it, assert, eq } from "./runner.mjs";
import { engrave, type EngraveOpts, type Layout, type Prim } from "../src/render/engrave.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { asFrozen } from "./fixtures/layout/cases.ts";
import type { Song } from "../src/score/song.ts";

const has = (p: Prim, c: string) => new RegExp(`(^|\\s)${c}(\\s|$)`).test(p.cls ?? "");
/** PDF 分页认的那个 y（src/export/score-pdf.ts：线取上端、路径取起点、别的取 y）。 */
const y0Of = (p: Prim) => (p.t === "line" ? Math.min(p.y1, p.y2) : p.t === "path" ? Number(/M\s*-?[\d.]+[ ,]+(-?[\d.]+)/.exec(p.d)?.[1] ?? NaN) : (p as { y: number }).y);
const pageOf = (L: Layout, y: number) => L.pages.findIndex((p) => y >= p.top && y < p.top + p.h);
const groupsOf = (L: Layout) => { const g = new Map<string, number[]>(); L.systems.forEach((b, i) => { const k = `${b.paper}:${b.sys}`; g.set(k, [...(g.get(k) ?? []), i]); }); return g; };

function songOf(name: string): Song {
  const [nota, view] = name.split(" · ") as ["staff" | "jianpu" | "letters", string], v = FULL_VIEWS.find((x) => x.name === view)!, s0 = { ...asFrozen(fullSong()), notation: nota } as Song;
  return v.song ? v.song(s0) : s0;
}
function layouts(): { name: string; L: Layout; o: EngraveOpts }[] {
  const out: { name: string; L: Layout; o: EngraveOpts }[] = [];
  for (const nota of ["staff", "jianpu", "letters"] as const) for (const v of FULL_VIEWS.filter((x) => x.name === "print" || x.name === "edit-pages")) {
    const s0 = { ...asFrozen(fullSong()), notation: nota } as Song, s = v.song ? v.song(s0) : s0, o = v.opts(s);
    out.push({ name: `${nota} · ${v.name}`, L: engrave(s, o), o });
  }
  return out;
}

describe("一组比一页高 = 在行和行之间断开、接到下一页（7-V）", () => {
  const all = layouts();
  it("用全的测试歌在分页的版面里真有断开的组（不然下面几条什么都没查）", () => {
    for (const { name, L } of all) assert([...groupsOf(L).values()].some((rs) => new Set(rs.map((r) => pageOf(L, L.systems[r]!.top))).size > 1), `${name}：没有一组分在两页上`);
  });
  it("① 每一行都整个落在它那一页能放字的地方里；② 断开的几截行和行不相叠；③ 后面的内容从它下面接着排", () => {
    for (const { name, L, o } of all) {
      const pg = o.page!, sp = L.sp;
      L.systems.forEach((b, i) => {
        const k = pageOf(L, b.top); assert(k >= 0, `${name}：第 ${i} 行不在任何一页里`);
        const P = L.pages[k]!, cTop = P.top + pg.t * sp, cBot = P.top + (pg.h - pg.b) * sp;
        assert(b.top >= cTop - 0.5 && b.bottom <= cBot + 0.5, `${name}：第 ${i} 行（${b.top.toFixed(0)}–${b.bottom.toFixed(0)}）伸出了第 ${k + 1} 页能放字的地方（${cTop.toFixed(0)}–${cBot.toFixed(0)}）`);
        if (i > 0) assert(b.top >= L.systems[i - 1]!.bottom - 0.5, `${name}：第 ${i} 行和上一行叠在一起`);
      });
    }
  });
  it("④ 行首连着几条谱的竖线每一页各画各的；⑤ 印出来的东西每一样都落在某一页里", () => {
    for (const { name, L } of all) {
      for (const p of L.prims) {
        if (has(p, "ann") || has(p, "page")) continue;
        const y = y0Of(p); if (Number.isNaN(y)) continue;
        assert(pageOf(L, y) >= 0, `${name}：${p.t} ${p.cls ?? ""} 在 y=${y.toFixed(0)}，不在任何一页里（PDF 不印）`);
        if (p.t === "line" && p.x1 === p.x2) assert(pageOf(L, Math.min(p.y1, p.y2)) === pageOf(L, Math.max(p.y1, p.y2) - 0.01), `${name}：竖线 ${p.cls ?? ""}（y ${p.y1.toFixed(0)}–${p.y2.toFixed(0)}）跨过了两页之间`);
      }
    }
  });
  it("⑥ 断开不挪横向：每一行的小节线、音的横坐标和同样的参数不分页时一模一样（同一组分在两页上的两截本来就是同一组的列）", () => {
    for (const { name, L, o } of all) {
      const { page: _p, ...rest } = o, C = engrave(songOf(name), rest as EngraveOpts);
      eq(C.systems.length, L.systems.length, `${name}：不分页时行数不一样`);
      const key = (X: Layout) => [...X.bars.map((b) => `${b.system}:${b.x.toFixed(2)}`), ...X.notes.map((n) => `${n.system}:${n.index}:${n.x.toFixed(2)}`)].sort().join(" ");
      eq(key(L), key(C), `${name}：分页 / 不分页时小节线或音的横坐标不一样`);
    }
  });
  it("⑧ 状态那一串：断开了 = 有「有一组比一页高，接到了下一页」；连续排（不分页）= 没有", () => {
    for (const { name, L } of all) assert(L.statusHints.some((h) => h.items.some((i) => i.kind === "tallGroup")), `${name}：没有那一条提示`);
    const s0 = asFrozen(fullSong()), cont = engrave(s0, FULL_VIEWS.find((v) => v.name === "edit-all")!.opts(s0));
    assert(!cont.statusHints.some((h) => h.items.some((i) => i.kind === "tallGroup")), "连续排的版面里出现了这一条");
  });
  it("⑦ 一块自己就比一页高（极端）：放在页顶照实伸出去，后面的从它下面接着排、不相叠；状态那一串照样有那一条", () => {
    const s0 = asFrozen(fullSong()), v = FULL_VIEWS.find((x) => x.name === "print")!, o0 = v.opts(s0), pg = o0.page!;
    const tiny = { ...pg, h: pg.t + pg.b + 3 };   // 能放字的地方只有 3 个线间距：比哪一行都矮
    const L = engrave(s0, { ...o0, page: tiny });
    L.systems.forEach((b, i) => { if (i > 0) assert(b.top >= L.systems[i - 1]!.bottom - 0.5, `第 ${i} 行和上一行叠在一起（${b.top.toFixed(0)} < ${L.systems[i - 1]!.bottom.toFixed(0)}）`); });
    const firstOnPage = L.systems.filter((b, i) => i === 0 || pageOf(L, b.top) !== pageOf(L, L.systems[i - 1]!.top));
    assert(firstOnPage.length > 1, "极端情形里没翻过页");
    assert(L.statusHints.some((h) => h.items.some((i) => i.kind === "tallGroup")), "没有那一条提示");
    eq(L.papers.filter((p) => !p.hidden).every((p) => p.bottom >= p.top), true, "纸的上下沿乱了");
  });
});
