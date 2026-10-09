// score-pdf.ts —— 谱 → PDF（分页排版的那一套，原样印出来）。created 2026-10-09 by Claude Opus 5.5
// user「自己写pdf，然后字体可以选普通的和那个拼音可爱的，记得看一下那个拼音的的字高是怎么算的。歌词用字体。」「然后另外一个很快要的是pdf导出哈哈哈」。
// 做法：用屏幕上分页视图同一个排版函数（engrave，所见即所得），单位直接取「点」（一个线间距 = 这张纸的 spMm 毫米），所以排出来的页 = 纸的真实大小；
//   量歌词宽度用这款字体自己的字宽（不是浏览器的系统字体）——PDF 里的字和排版对得上。图元逐个翻成 PDF 指令（pdf.ts）：
//   · 音乐字形 = Bravura 轮廓（vendor/fonts/bravura/outlines.json）画成路径；文字（歌词 / 歌名 / 速度 / 风格…）= 嵌这款字体的子集（阅读器里能选中复制）；
//   · 编辑器专用的不印（曲段控件、光标、选区、隐藏声部的细行、占位灰字、AI 推定的灰字、速度变化的 ↑↓、句号…）；「不认」的灰（演奏者不认的记号、
//     唱不出的歌词）印成黑的——那是给写谱的人看的披露，不是谱面内容。
// 萌神拼音的字高：字体自报的上伸把拼音带算进去了（hhea 1300），不能拿来定汉字位置；按字形墨迹（ttf.ts inkOf）量「国」——拼音画在汉字上方，
//   歌词行在谱下面，所以歌词行往下让出「拼音字体的墨迹顶 − 黑体的墨迹顶」那一截（engrave lyricRaise）。同 WXHW v2.3.13 的结论。
import { engrave, LYRIC_EM, type Prim, type PartView } from "../render/engrave.ts";
import type { Song } from "../score/song.ts";
import { paperOf, DEFAULT_PAPER, spMm, lineSp } from "../score/paper.ts";
import { writePdf, type PdfOp, type PdfPage, type Seg, type MusicOutlines, type PdfStats, type Rgb } from "./pdf.ts";
import type { TtfFont } from "./ttf.ts";

export type PdfFontId = "sans" | "pinyin";
const PT_PER_MM = 72 / 25.4;
const INK: Rgb = [0.1, 0.1, 0.1];
/** 编辑器专用、不印的样式类（任一个命中就不印）。 */
const SKIP = new Set(["paper-chip", "paper-chip-text", "paper-chip-icon", "part-stub", "part-stub-line", "hidden-note", "warn", "selbox", "caret", "nav-text", "part-badge",
  "tempo-change", "dyn-implied", "arr-issue", "arr-empty", "empty", "phrase-mark", "page", "in-span"]);
/** 描边的路径（其余路径都是填充）：屏幕上的线宽是固定 px（谱间距 ~10 px 时），这里按谱间距等比换。 */
const STROKE: Record<string, { w: number; dash?: number[]; round?: boolean }> = { tie: { w: 1.4 }, slur: { w: 1.3 }, hairpin: { w: 1.1 }, "tuplet-bracket": { w: 1 }, brace: { w: 2.2, round: true } };
const BOLD = new Set(["song-title", "tempo-word", "paper-name", "groove-mark", "part-name"]), ITALIC = new Set(["groove-mark", "dyn-word"]);

/** 一串字在这款字体里多宽（em；按 shape 出来的字形——注音字体按词换的字形宽度一样）。 */
export function textEm(font: TtfFont, s: string): number { return font.shape(s).reduce((a, g) => a + font.advance(g), 0) / font.unitsPerEm; }
/** 选了萌神拼音时歌词行要往下让多少（sp）：「国」的墨迹顶，拼音字体比黑体高出来的那一截。黑体 = 0。 */
export function lyricRaiseOf(font: TtfFont, ref: TtfFont | null): number {
  if (!ref) return 0;
  const top = (f: TtfFont) => { const ink = f.inkOf(f.glyphId(0x56fd)); return ink ? ink[3] / f.unitsPerEm : 0; };
  return Math.max(0, top(font) - top(ref)) * LYRIC_EM;
}

/** SVG 路径（engrave 画的：M / L / Q / C / Z，绝对坐标；H / V 也认）→ 页面坐标的段（平移 dx, dy）。 */
export function segsOf(d: string, dx: number, dy: number): Seg[] {
  const t = d.match(/[MLQCZHVmlqczhv]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [], out: Seg[] = [];
  let i = 0, cmd = "", cx = 0, cy = 0, sx = 0, sy = 0;
  const n = () => Number(t[i++]);
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i]!)) cmd = t[i++]!.toUpperCase();
    if (cmd === "M") { cx = sx = n(); cy = sy = n(); out.push({ k: "M", x: cx + dx, y: cy + dy }); cmd = "L"; }
    else if (cmd === "L") { cx = n(); cy = n(); out.push({ k: "L", x: cx + dx, y: cy + dy }); }
    else if (cmd === "H") { cx = n(); out.push({ k: "L", x: cx + dx, y: cy + dy }); }
    else if (cmd === "V") { cy = n(); out.push({ k: "L", x: cx + dx, y: cy + dy }); }
    else if (cmd === "C") { const a = n(), b = n(), c = n(), e = n(); cx = n(); cy = n(); out.push({ k: "C", x1: a + dx, y1: b + dy, x2: c + dx, y2: e + dy, x: cx + dx, y: cy + dy }); }
    else if (cmd === "Q") { const qx = n(), qy = n(), x = n(), y = n(); out.push({ k: "C", x1: cx + (2 / 3) * (qx - cx) + dx, y1: cy + (2 / 3) * (qy - cy) + dy, x2: x + (2 / 3) * (qx - x) + dx, y2: y + (2 / 3) * (qy - y) + dy, x: x + dx, y: y + dy }); cx = x; cy = y; }
    else if (cmd === "Z") { out.push({ k: "Z" }); cx = sx; cy = sy; cmd = ""; }
    else i++;
  }
  return out;
}

export interface ScorePdfArgs { song: Song; parts: PartView[]; font: TtfFont; /** 黑体（量拼音字体的字高用；font 本身就是黑体 = 传 null） */ ref: TtfFont | null; music: MusicOutlines; title: string; created?: Date }
/** 排版 + 翻成 PDF。返回字节、页数、缺字（这款字体里没有的字 / 轮廓里没有的音乐字形——调用方如实说）。 */
export function scorePdf(a: ScorePdfArgs): { bytes: Uint8Array; pages: number; stats: PdfStats } {
  const paper = a.song.paper ?? paperOf(DEFAULT_PAPER), mm = spMm(paper), sp = mm * PT_PER_MM, m = paper.marginMm;
  const page = { h: paper.heightMm / mm, l: m.l / mm, r: m.r / mm, t: m.t / mm, b: m.b / mm };
  const lyricPx = LYRIC_EM * sp;
  const L = engrave(a.song, { width: lineSp(paper) * sp, sp, at: { paper: a.song.papers[0]!.id, part: a.song.parts[0]!.id }, caret: -1, sel: null, parts: a.parts,
    measureLyric: (s) => textEm(a.font, s) * lyricPx, titlePlaceholder: false, autoBars: true, justWrote: false, page, lyricRaise: lyricRaiseOf(a.font, a.ref) });
  const W = paper.widthMm * PT_PER_MM, H = paper.heightMm * PT_PER_MM, dx = L.pageX.left;
  const pages: PdfPage[] = L.pages.map(() => ({ w: W, h: H, ops: [] }));
  const pageOf = (y: number) => { for (let k = 0; k < L.pages.length; k++) if (y >= L.pages[k]!.top && y < L.pages[k]!.top + L.pages[k]!.h) return k; return -1; };
  const scaleW = sp / 10;   // 屏幕上的固定线宽（px，谱间距 ~10 px）→ 按谱间距等比
  const em = a.music.unitsPerEm;
  for (const p of L.prims) {
    if (p.t === "icon") continue;
    const cls = (p.cls ?? "").split(/\s+/).filter(Boolean);
    if (cls.some((c) => SKIP.has(c))) continue;
    const y0 = p.t === "line" ? Math.min(p.y1, p.y2) : p.t === "path" ? Number(/M\s*-?[\d.]+[ ,]+(-?[\d.]+)/.exec(p.d)?.[1] ?? NaN) : p.y;
    const k = pageOf(y0); if (k < 0) continue;
    const top = L.pages[k]!.top, ops = pages[k]!.ops;
    ops.push(...toOps(p, cls, dx, top));
  }
  function toOps(p: Prim, cls: string[], ox: number, top: number): PdfOp[] {
    switch (p.t) {
      case "line": return [{ op: "line", x1: p.x1 + ox, y1: p.y1 - top, x2: p.x2 + ox, y2: p.y2 - top, color: INK, width: p.w }];
      case "rect": return [{ op: "rect", x: p.x + ox, y: p.y - top, w: p.w, h: p.h, color: INK }];
      case "path": {
        const st = cls.map((c) => STROKE[c]).find(Boolean), segs = segsOf(p.d, ox, -top);
        return st ? [{ op: "path", segs, color: INK, fill: false, width: st.w * scaleW, ...(cls.includes("ramp") ? { dash: [4 * scaleW, 3 * scaleW] } : {}), ...(st.round ? { round: true } : {}) }] : [{ op: "path", segs, color: INK, fill: true }];
      }
      case "glyph": {
        const size = p.size ?? 4 * sp, out: PdfOp[] = [];
        let x = p.x + ox;
        for (const ch of p.ch) { const code = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0"); out.push({ op: "glyph", code, x, y: p.y - top, size, color: INK }); x += ((a.music.glyphs[code]?.adv ?? 0) / em) * size; }
        return out;
      }
      case "text": {
        const size = p.size ?? lyricPx, w = textEm(a.font, p.s) * size, anchor = p.anchor ?? "middle";
        const x = p.x + ox - (anchor === "middle" ? w / 2 : anchor === "end" ? w : 0);
        return [{ op: "text", x, y: p.y - top, text: p.s, size, color: INK, ...(cls.some((c) => BOLD.has(c)) ? { bold: true } : {}), ...(cls.some((c) => ITALIC.has(c)) ? { italic: true } : {}) }];
      }
      default: return [];
    }
  }
  const stats: PdfStats = { glyphs: 0, missing: [], missingMusic: [], fontBytes: 0 };
  const bytes = writePdf({ title: a.title, pages, producer: "MoonSinger", ...(a.created ? { created: a.created } : {}) }, a.font, a.music, { stats });
  return { bytes, pages: pages.length, stats };
}
