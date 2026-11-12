// cases.ts —— 刀 1 的版面快照（N1）：三首样张 × 几种视图，排出来的「可印图元 + 锚点」。created 2026-11-08 by Claude Opus 5.5
// 施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §2 N1：编辑器的控件搬出排版器前后，可印的东西逐个相同、锚点表相同。
//   scripts/freeze-layout.mjs 写 test/fixtures/layout/<歌>.<视图>.json；test/engrave-printable.test.ts 逐个比。
//   「可印」= PDF 印的那些（score-pdf.ts isPrinted；图标一律不印）；控件的点击框表（partToggles / paperAdds / nav …）不在快照里——那是要搬走的。
//   量字宽用一把假尺子（两边同一把就行）；坐标取到 0.001 px（重构时运算顺序变了不该算版面变）。
// 仓里不装 @types/node：node:* 走动态 import（同 test/keys.test.ts）
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string };
import { openBytes, partLabels } from "../../../src/format/project.ts";
import { engrave, type EngraveOpts, type Layout, type PartView } from "../../../src/render/engrave.ts";
import { printOpts, isPrinted } from "../../../src/export/score-pdf.ts";
import { paperOf, DEFAULT_PAPER, lineSp, pageGeoOf, textScaleOf } from "../../../src/score/paper.ts";
import type { Song } from "../../../src/score/song.ts";
import { asOpened } from "./opened.ts";
import { createTextMeasure } from "../../../src/render/text/index.ts";

const ROOT = new URL("../../../", import.meta.url);
export const SONGS: Record<string, string> = {
  once: "test/fixtures/songs/once-upon-a-tale.mxl",
  "v2-2-2-2": "test/fixtures/format/v2-2-2-2/sample.mxl",
  "v2-2-2-1": "test/fixtures/format/v2-2-2-1/sample.mxl",
};
/** 夹具里的歌明着写「不标和弦级数」（谱面分家第三刀，2026-11-11）：版面底本 / PDF 指纹是在「排版选项不开和弦级数」时冻的；第三刀起和弦标级数是歌里的设置、没写 = 标，
 *  所以夹具的歌写上 chordTags: false，得到和冻的时候一样的输入，底本不重冻。要看级数的视图自己把它去掉（full.ts inC-chords）。 */
export const asFrozen = (song: Song): Song => (song.chordTags === false ? song : { ...song, chordTags: false });
export function loadSong(key: string): { song: Song; labels: string[] } {
  const o = openBytes(SONGS[key]!.split("/").pop()!, new Uint8Array(fs.readFileSync(new URL(SONGS[key]!, ROOT))));
  return { song: asFrozen(asOpened(o.song)), labels: partLabels(o.song, o.extras) };   // 打开之后的样子（每张纸开头补力度，第八刀 8-7）
}
export const measure = (s: string): number => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 16 : 9), 0);
export const SP = 10;
/** 声部视图：编辑器那份带四颗小钮的状态（刀 1 之后它们不在 PartView 里了——cases 照样给，排版器不认就不认）。hide = 这几位隐藏着。 */
export function views(song: Song, labels: string[], editor: boolean, hide: ReadonlySet<string> = new Set()): PartView[] {
  return song.parts.map((p, k) => ({
    id: p.id, name: labels[k] ?? `P${k + 1}`, colorIdx: k % 10, first: k === 0,
    hidden: hide.has(p.id), badges: [], ...(editor ? { toggles: { muted: false, solo: false, hidden: hide.has(p.id), only: false } } : {}),
  } as PartView));
}
/** song = 排之前先换一下这首歌（比如把纸换成舒适档）；没有 = 原样。 */
type View = { name: string; opts: (song: Song, labels: string[]) => EngraveOpts; song?: (s: Song) => Song };
/** 量字的尺子跟着字的字号（刀 2：紧凑档 ts = 1.4，屏幕 / PDF 量字都按 LYRIC_EM × sp × ts）。 */
export const measureFor = (song: Song) => { const k = textScaleOf(song.paper ?? paperOf(DEFAULT_PAPER)); return (s: string) => measure(s) * k; };
export const editorBase = (song: Song, labels: string[], hide?: ReadonlySet<string>) => {
  const paper = song.paper ?? paperOf(DEFAULT_PAPER), ts = textScaleOf(paper);
  return { width: lineSp(paper) * SP, sp: SP, locale: "zh", at: { paper: song.papers[0]!.id, part: song.parts[0]!.id }, parts: views(song, labels, true, hide), measure: createTextMeasure(measureFor(song)), autoBars: true, ...(ts !== 1 ? { textScale: ts } : {}),
    // 刀 1 前的四个旗（titlePlaceholder / editable / keyHint / paperLabel）和刀 1 后的几何参数 chrome 一起给：新旧两版排版器各认各的，同一份样张两边都能排
    titlePlaceholder: true, editable: true, keyHint: true, paperLabel: "A5", chrome: { underPaper: 2.6, tail: 2.6, famGap: 0.8, navRoom: 16 }, margins: { l: 1.5, r: 1.5, t: 1.5, b: 2 } } as unknown as EngraveOpts;
};
export const VIEWS: View[] = [
  { name: "print", opts: (s, l) => printOpts(s, SP, views(s, l, false), createTextMeasure(measureFor(s)), true) },
  // 刀 2：同一首歌换成舒适档的纸再印（大样张本来是紧凑档）——舒适档版面的基线（字和谱一把尺子，刀 2 前后逐个相同）
  { name: "print-cozy", song: (s) => ({ ...s, paper: { ...(s.paper ?? paperOf(DEFAULT_PAPER)), density: "cozy" as const, staffMm: undefined } }), opts: (s, l) => printOpts(s, SP, views(s, l, false), createTextMeasure(measureFor(s)), true) },
  { name: "edit-seg", opts: (s, l) => ({ ...editorBase(s, l), onlyPaper: s.papers[0]!.id }) },
  { name: "edit-all", opts: (s, l) => editorBase(s, l) },
  { name: "edit-pages", opts: (s, l) => { const b = editorBase(s, l); const { margins: _m, ...rest } = b; return { ...rest, chrome: { tail: 2.6, famGap: 0.8, navRoom: 16 }, page: pageGeoOf(s.paper ?? paperOf(DEFAULT_PAPER)) } as EngraveOpts; } },   // 分页 = 每段底下不留虚线框
  { name: "listen-all", opts: (s, l) => { const { editable: _e, ...b } = editorBase(s, l) as EngraveOpts & { editable?: boolean }; return { ...b, chrome: { famGap: 0.8, navRoom: 16 }, foldAll: true } as EngraveOpts; } },   // 听 = 不留虚线框
  { name: "edit-all-hidden", opts: (s, l) => editorBase(s, l, new Set(s.parts.length > 1 ? [s.parts[1]!.id] : [])) },
];

export const r3 = (v: unknown): unknown => typeof v === "number" ? Math.round(v * 1000) / 1000 : Array.isArray(v) ? v.map(r3) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, r3(x)])) : v;
/** 可印图元（PDF 印的那些）+ 锚点（谱上的东西的位置；控件的点击框表不在里面）。 */
export function snapshot(L: Layout): unknown {
  const printed = L.prims.filter((p) => isPrinted(p.cls)).map((p) => { const { tok: _t, ...q } = p as typeof p & { tok?: number }; return q; });
  return r3({
    width: L.width, height: L.height, sp: L.sp, pageX: L.pageX, pages: L.pages, lyricYs: L.lyricYs,
    systems: L.systems, notes: L.notes, rests: L.rests, chordHeads: L.chordHeads, slots: L.slots, heads: L.heads, lyrics: L.lyrics, marks: L.marks, clefs: L.clefs, dyns: L.dyns,
    chordTags: L.chordTags.map(({ read: _r, ...b }) => b), bars: L.bars, measures: L.measures, sharedRows: L.sharedRows, shortBars: L.shortBars,
    title: L.title, arrangement: L.arrangement, credits: L.credits, parts: L.parts, papers: L.papers.map((p) => ({ id: p.id, title: p.title, top: p.top, bottom: p.bottom })),
    prims: printed,
  });
}
export function caseLayout(songKey: string, view: View): Layout { const { song: s0, labels } = loadSong(songKey), song = view.song ? view.song(s0) : s0; return engrave(song, view.opts(song, labels)); }
export const pdfShaPath = new URL("test/fixtures/layout/pdf-sha256.json", ROOT);
/** PDF 字节的指纹（N2）：真字体（思源黑体）、固定时刻、整首 + 分页，三首歌各一份。刀 1 之后 PDF 的「不印名单」清空，字节不变 = 清空没漏印 / 多印。 */
export async function pdfSha(songKey: string): Promise<string> {
  const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): Uint8Array };
  const { createHash } = (await import("node:crypto" as string)) as { createHash(a: string): { update(b: Uint8Array): { digest(e: string): string } } };
  const { parseTtf } = await import("../../../src/export/ttf.ts");
  const { scorePdf } = await import("../../../src/export/score-pdf.ts");
  font ??= parseTtf(new Uint8Array(gunzipSync(fs.readFileSync(new URL("vendor/fonts/sans.ttf.gz", ROOT)))));
  music ??= JSON.parse(fs.readFileSync(new URL("vendor/fonts/bravura/outlines.json", ROOT), "utf8"));
  const { song, labels } = loadSong(songKey);
  const r = scorePdf({ song, parts: views(song, labels, false), font, music: music!, title: songKey, created: new Date(Date.UTC(2026, 10, 8)), measure: (s: string) => measure(s), autoBars: true });
  return createHash("sha256").update(r.bytes).digest("hex");
}
let font: import("../../../src/export/ttf.ts").TtfFont | undefined, music: import("../../../src/export/pdf.ts").MusicOutlines | undefined;
