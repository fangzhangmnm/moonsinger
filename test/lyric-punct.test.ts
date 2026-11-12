// 歌词里的标点（7-M，2026-11-12；user「标点符号既然没有语义，能不能不影响居中线地跟着上一个词？中文英文都一样」「我们的标点符号是纯cosmetic的，不影响articulation，也不应该灰」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。施工单 7-M 第二稿：标点留在歌词里、悬挂（居中只按字）、送去唱之前去掉、不画灰；格式 score minor 7。
import { describe, it, eq, assert } from "./runner.mjs";
const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
import { splitSyllables, lyricHang, lyricCore } from "../src/score/lyrics.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { lyricIssues } from "../src/score/lyric-check.ts";
import { initState, TPQ, type Token, type Song } from "../src/score/song.ts";
import { setNotation } from "../src/score/song-view.ts";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { openBytes } from "../src/format/project.ts";
import { FORMAT_MINOR } from "../src/format/contract.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

const P = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4) => ({ step, alter: 0, octave });
let nid = 9100;
const n = (lyric: string | null, dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: P("E", 5), dur, lyric }) as Token;
const songOf = (lyrics: (string | null)[], notation: "staff" | "jianpu", dur = TPQ): { song: Song; at: { paper: string; part: string } } => {
  const st = initState(), p0 = st.song.papers[0]!, a = st.at.part;
  let song: Song = { ...st.song, papers: [{ ...p0, tracks: { ...p0.tracks, [a]: [...p0.tracks[a]!.slice(0, 3), ...lyrics.map((l) => n(l, dur))] } }] };
  song = setNotation({ ...st, song }, notation).song;
  return { song, at: st.at };
};
const M = createTextMeasure((s: string) => [...s].reduce((w, c) => w + (c.charCodeAt(0) > 255 ? 16 : 9), 0));
const lay = (lyrics: (string | null)[], notation: "staff" | "jianpu", dur = TPQ) => { const { song, at } = songOf(lyrics, notation, dur); return engrave(song, { width: 900, sp: 10, locale: "zh", at, parts: [{ id: at.part, name: "V", first: true }], measure: M, autoBars: true } as never); };
const lyricPrims = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /^lyric\b/.test(p.cls ?? ""));
const wPx = (p: Extract<Prim, { t: "text" }>, s = p.s) => M.widthPx(s, p.size ?? 16, 10, 1) * (p.sx ?? 1);
/** 字（不带标点）的中心在哪：整串的左边 + 前挂宽 + 字宽的一半。 */
const coreCenter = (p: Extract<Prim, { t: "text" }>) => { const h = lyricHang(p.s); return p.x - wPx(p) / 2 + wPx(p, h.lead) + wPx(p, h.core) / 2; };

describe("歌词里的标点（7-M）", () => {
  it("切音节：标点留在字里——结尾的挂在前一个音节后面、开头的挂在后一个前面；全是标点 = 自己一个音节", () => {
    deq(splitSyllables("sky, the moon.").map((s) => s.text), ["sky,", "the", "moon."]);
    deq(splitSyllables("hap-py,").map((s) => [s.text, s.hyph]), [["hap", true], ["py,", false]]);
    deq(splitSyllables("「糕，」甜").map((s) => s.text), ["「糕，」", "甜"]);
    deq(splitSyllables("“Hi!”").map((s) => s.text), ["“Hi!”"]);
    deq(splitSyllables("，").map((s) => s.text), ["，"]);
    deq(splitSyllables("lovin’ you").map((s) => s.text), ["lovin’", "you"], "英文词里的「’」是字的一部分，不当标点");
  });
  it("拆：前挂 / 字 / 后挂；送去唱的那一份 = 去掉标点（「+」连着的几段各自去）；全是标点 = 空", () => {
    deq(lyricHang("「糕，」"), { lead: "「", core: "糕", trail: "，」" });
    deq(lyricHang("sky,"), { lead: "", core: "sky", trail: "," });
    deq(lyricHang("，"), { lead: "", core: "", trail: "" });
    eq(lyricCore("だ,‿ん。"), "だ‿ん"); eq(lyricCore("…"), "");
  });
  it("不影响唱：同一句带不带标点，唱谱一模一样（块的内容键 = 这份唱谱的 JSON，所以不会因为加了标点重唱）；全是标点的音 = 哼", () => {
    const toks = (ls: (string | null)[]) => ls.map((l) => n(l));
    deq(toLabScore(toks(["sky,", "the", "moon."]), "n", "en"), toLabScore(toks(["sky", "the", "moon"]), "n", "en"), "英文");
    deq(toLabScore(toks(["「糕，」", "甜。"]), "n", "zh"), toLabScore(toks(["糕", "甜"]), "n", "zh"), "中文");
    deq(toLabScore(toks(["そ、", "ら。"]), "n", "ja"), toLabScore(toks(["そ", "ら"]), "n", "ja"), "日文");
    deq(toLabScore(toks(["，"]), "n", "zh"), toLabScore(toks([null]), "n", "zh"), "全是标点 = 当成没有字");
  });
  it("不画灰：唱不唱得出来不看标点", () => {
    eq(lyricIssues([n("糕，"), n("「甜」")], "words", "zh").size, 0, "中文");
    eq(lyricIssues([n("sky,"), n("moon!")], "words", "en").size, 0, "英文");
    eq(lyricIssues([n("そ、")], "words", "ja").size, 0, "日文");
    eq(lyricIssues([n("糕，"), n("sky,")], "words", "zh").size, 1, "真唱不出来的照旧画灰（中文段里的英文词）");
  });
  for (const notation of ["staff", "jianpu"] as const) it(`悬挂（${notation === "staff" ? "五线谱" : "简谱"}）：「sky,」和「sky」、「糕，」和「糕」字的中心在同一个位置；显示照样带标点；带标点的不压下一个字`, () => {
    for (const [a, b] of [["sky,", "sky"], ["糕，", "糕"], ["「糕」", "糕"]] as const) {
      const pa = lyricPrims(lay([null, a, null], notation).prims), pb = lyricPrims(lay([null, b, null], notation).prims);
      eq(pa.find((p) => p.s.includes(b))!.s, a, "显示带着标点");
      assert(Math.abs(coreCenter(pa.find((p) => p.s.includes(b))!) - coreCenter(pb.find((p) => p.s === b)!)) < 0.01, `${a} 的字和 ${b} 对齐`);
    }
    for (const dur of [TPQ, TPQ / 2]) {   // 放得下的地方一律不压；八分那么密、收到最窄还放不下 = 原来的规矩：照写、标挤（歌词框说「挤了」），这一对不算
      const L = lay(["sky,", "the", "moon.", "糕，", "甜"], notation, dur), ps = lyricPrims(L.prims), tight = (p: Extract<Prim, { t: "text" }>) => L.lyrics.some((h) => Math.abs(h.x - p.x) < 1e-6 && h.tight);
      for (let i = 0; i + 1 < ps.length; i++) if (!(tight(ps[i]!) && tight(ps[i + 1]!))) assert(ps[i]!.x + wPx(ps[i]!) / 2 <= ps[i + 1]!.x - wPx(ps[i + 1]!) / 2 + 0.01, `「${ps[i]!.s}」压到了「${ps[i + 1]!.s}」`);
      if (dur === TPQ) assert(!L.lyrics.some((h) => h.tight), "四分音符：一个都不挤");
    }
  });
  it(`格式：score minor ${FORMAT_MINOR.score}；冻结样本（minor/score-7）读回来标点原样，唱谱里没有`, () => {
    eq(FORMAT_MINOR.score >= 7, true);
    const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL("fixtures/format/minor/score-7/sample.mxl", import.meta.url))));
    const ls = o.song.papers.flatMap((p) => Object.values(p.tracks).flat()).flatMap((t) => (t.kind === "note" && t.lyric ? [t.lyric] : []));
    assert(ls.includes("py,") && ls.includes("你。"), `读回来：${ls.join(" ")}`);
  });
});
