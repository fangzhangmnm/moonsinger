// pdf.ts —— 最小 PDF 写出器（谱用）。created 2026-10-09 by Claude Opus 5.5（user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）。
// 骨架 = 兄弟仓 WebXiaoHeiWu src/export/pdf.ts（Claude Fable 5.1，2026-09-30）：对象、流（Flate）、页树、一款子集 TrueType（Type0 / CIDFontType2 / Identity-H，
//   字形号 = CID、ToUnicode 让阅读器能选中 / 复制 / 搜索歌词）。谱另外要的三样是这里加的：
//   · 路径（谱线以外的一切：符杠、连音线、发夹、花括号…）：子路径 = 直线 / 二次 / 三次曲线 / 闭合，填充或描边（线宽、虚线、圆头）；
//   · 音乐字形：Bravura 的轮廓（构建时提出来的 vendor/fonts/bravura/outlines.json），一个字一个 Form XObject（一页几百个符头只存一份轮廓），摆的时候只给变换；
//     不在 PDF 里嵌 Bravura（它是 CFF 轮廓，ttf.ts 不吃；画成路径对任何阅读器都一样）；
//   · 文字的粗 / 斜：只嵌一款字体，粗 = 填充 + 同色细描边（Tr 2），斜 = 倾斜矩阵。
// 坐标：调用方用「左上角为原点、y 向下」的页面坐标（pt），这里翻成 PDF 的左下角原点。纯函数，零 DOM。
import { zlibSync } from "../../vendor/fflate/fflate.esm.js";
import type { TtfFont } from "./ttf.ts";

export type Rgb = [number, number, number];   // 0..1
/** 路径的一段（页面坐标）。 */
export type Seg = { k: "M" | "L"; x: number; y: number } | { k: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number } | { k: "Z" };
export type PdfOp =
  | { op: "rect"; x: number; y: number; w: number; h: number; color: Rgb }
  | { op: "line"; x1: number; y1: number; x2: number; y2: number; color: Rgb; width: number; dash?: number[]; round?: boolean }
  | { op: "path"; segs: Seg[]; color: Rgb; fill: boolean; width?: number; dash?: number[]; round?: boolean }
  | { op: "glyph"; code: string; x: number; y: number; size: number; color: Rgb }   // code = SMuFL 码位的十六进制（"E050"）；y = 基线；size = 字号（pt，一个 em）
  | { op: "text"; x: number; y: number; text: string; size: number; color: Rgb; bold?: boolean; italic?: boolean };
export interface PdfPage { w: number; h: number; ops: PdfOp[] }
export interface PdfDoc { title: string; pages: PdfPage[]; producer?: string; created?: Date }
/** 音乐字形的轮廓：outlines.json 的形状（字体单位、y 向上；d = SVG 路径）。 */
export interface MusicOutlines { unitsPerEm: number; glyphs: Record<string, { adv: number; d: string }> }
export interface PdfStats { glyphs: number; missing: string[]; missingMusic: string[]; fontBytes: number }

const enc = new TextEncoder();
const num = (v: number): string => (Math.round(v * 1000) / 1000).toString();
const hex4 = (v: number): string => (v & 0xffff).toString(16).padStart(4, "0").toUpperCase();
const hexString = (s: string): string => { let out = "<FEFF"; for (let i = 0; i < s.length; i++) out += hex4(s.charCodeAt(i)); return out + ">"; };
const rgb = (c: Rgb, stroke: boolean) => `${num(c[0])} ${num(c[1])} ${num(c[2])} ${stroke ? "RG" : "rg"}`;

/** SVG 路径（字体单位的 M L H V Q C Z，绝对坐标；fontTools SVGPathPen 的输出会用 H / V）→ PDF 路径指令（原样坐标，不翻 y：字形用 cm 摆）。
 *  认不出的命令 → 抛错（不静默画缺一笔；2026-10-09 抓到过：漏了 V / H，速度记号的四分音符没了符干）。 */
export function svgToPdfPath(d: string): string {
  const t = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0, cmd = "", cx = 0, cy = 0, sx = 0, sy = 0, out = "";
  const n = () => Number(t[i++]);
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i]!)) cmd = t[i++]!;
    switch (cmd) {
      case "M": cx = sx = n(); cy = sy = n(); out += `${num(cx)} ${num(cy)} m `; cmd = "L"; break;
      case "L": cx = n(); cy = n(); out += `${num(cx)} ${num(cy)} l `; break;
      case "H": cx = n(); out += `${num(cx)} ${num(cy)} l `; break;
      case "V": cy = n(); out += `${num(cx)} ${num(cy)} l `; break;
      case "C": { const a = n(), b = n(), c = n(), e = n(); cx = n(); cy = n(); out += `${num(a)} ${num(b)} ${num(c)} ${num(e)} ${num(cx)} ${num(cy)} c `; break; }
      case "Q": { const qx = n(), qy = n(), x = n(), y = n(); out += `${num(cx + (2 / 3) * (qx - cx))} ${num(cy + (2 / 3) * (qy - cy))} ${num(x + (2 / 3) * (qx - x))} ${num(y + (2 / 3) * (qy - y))} ${num(x)} ${num(y)} c `; cx = x; cy = y; break; }
      case "Z": out += "h "; cx = sx; cy = sy; cmd = ""; break;
      default: throw new Error(`svgToPdfPath: unsupported path command "${cmd || t[i]}"`);
    }
  }
  return out;
}

/** 写成 PDF 字节。font = 解析好的 TTF（文字嵌它的子集）；music = 音乐字形轮廓。 */
export function writePdf(doc: PdfDoc, font: TtfFont, music: MusicOutlines, opts: { stats?: PdfStats } = {}): Uint8Array {
  const chunks: Uint8Array[] = []; let length = 0;
  const offsets: number[] = [0];
  const push = (d: Uint8Array | string): void => { const b = typeof d === "string" ? enc.encode(d) : d; chunks.push(b); length += b.length; };
  const reserve = (): number => { offsets.push(-1); return offsets.length - 1; };
  const begin = (n: number): void => { offsets[n] = length; push(`${n} 0 obj\n`); };
  const obj = (n: number, body: string): void => { begin(n); push(body + "\nendobj\n"); };
  const stream = (n: number, dict: string, data: Uint8Array): void => { const body = zlibSync(data); begin(n); push(`<< ${dict} /Filter /FlateDecode /Length ${body.length} >>\nstream\n`); push(body); push("\nendstream\nendobj\n"); };

  push("%PDF-1.7\n%âãÏÓ\n");
  const catalog = reserve(), pagesObj = reserve(), fontObj = reserve(), cidObj = reserve(), descObj = reserve(), fileObj = reserve(), uniObj = reserve(), infoObj = reserve();
  const used = new Map<number, number>(), missing = new Set<string>(), missingMusic = new Set<string>();
  const forms = new Map<string, number>();   // 音乐字形 → Form XObject 对象号
  const pageObjs = doc.pages.map(() => reserve());
  const em = music.unitsPerEm;
  doc.pages.forEach((page, pi) => {
    const H = page.h; let c = ""; const xobj = new Set<string>();
    for (const o of page.ops) {
      if (o.op === "rect") c += `${rgb(o.color, false)} ${num(o.x)} ${num(H - o.y - o.h)} ${num(o.w)} ${num(o.h)} re f\n`;
      else if (o.op === "line") c += `${rgb(o.color, true)} ${num(o.width)} w ${o.round ? 1 : 0} J [${(o.dash ?? []).map(num).join(" ")}] 0 d ${num(o.x1)} ${num(H - o.y1)} m ${num(o.x2)} ${num(H - o.y2)} l S\n`;
      else if (o.op === "path") {
        let p = "";
        for (const s of o.segs) p += s.k === "Z" ? "h " : s.k === "C" ? `${num(s.x1)} ${num(H - s.y1)} ${num(s.x2)} ${num(H - s.y2)} ${num(s.x)} ${num(H - s.y)} c ` : `${num(s.x)} ${num(H - s.y)} ${s.k === "M" ? "m" : "l"} `;
        c += o.fill ? `${rgb(o.color, false)} ${p}f\n` : `${rgb(o.color, true)} ${num(o.width ?? 1)} w ${o.round ? 1 : 0} J ${o.round ? 1 : 0} j [${(o.dash ?? []).map(num).join(" ")}] 0 d ${p}S\n`;
      } else if (o.op === "glyph") {
        const g = music.glyphs[o.code];
        if (!g) { missingMusic.add(o.code); continue; }
        let n = forms.get(o.code); if (n === undefined) { n = reserve(); forms.set(o.code, n); }
        xobj.add(o.code);
        const s = o.size / em;
        c += `q ${rgb(o.color, false)} ${num(s)} 0 0 ${num(s)} ${num(o.x)} ${num(H - o.y)} cm /G${o.code} Do Q\n`;
      } else {
        let hex = "";
        const chars = [...o.text], shaped = font.shape(o.text);
        chars.forEach((ch, k) => { const cp = ch.codePointAt(0)!, g = shaped[k] ?? 0; if (g === 0 && ch.trim()) missing.add(ch); if (!used.has(g)) used.set(g, cp); hex += hex4(g); });
        if (!hex) continue;
        const tm = o.italic ? `1 0 0.2 1 ${num(o.x)} ${num(H - o.y)} Tm` : `1 0 0 1 ${num(o.x)} ${num(H - o.y)} Tm`;
        const bold = o.bold ? ` 2 Tr ${num(o.size * 0.035)} w ${rgb(o.color, true)}` : " 0 Tr";
        c += `BT /F1 ${num(o.size)} Tf ${rgb(o.color, false)}${bold} ${tm} <${hex}> Tj ET\n`;
      }
    }
    const content = reserve();
    stream(content, "", enc.encode(c));
    const xo = xobj.size ? ` /XObject << ${[...xobj].map((code) => `/G${code} ${forms.get(code)} 0 R`).join(" ")} >>` : "";
    obj(pageObjs[pi]!, `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${num(page.w)} ${num(page.h)}] /Resources << /Font << /F1 ${fontObj} 0 R >>${xo} >> /Contents ${content} 0 R >>`);
  });
  // 音乐字形：Form XObject（字体单位；颜色跟着摆它时的填充色走——这里不设颜色）
  for (const [code, n] of forms) {
    const g = music.glyphs[code]!;
    stream(n, `/Type /XObject /Subtype /Form /BBox [-${em * 2} -${em * 2} ${em * 4} ${em * 4}]`, enc.encode(`${svgToPdfPath(g.d)}f\n`));
  }
  obj(pagesObj, `<< /Type /Pages /Kids [${pageObjs.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjs.length} >>`);

  // 文字字体：子集 + 宽度表 + ToUnicode（同 WXHW）
  const k = 1000 / font.unitsPerEm, sc = (v: number): number => Math.round(v * k);
  const gids = [...used.keys()].sort((a, b) => a - b), sub = font.subset(gids);
  const tagSeed = gids.reduce((a, g) => (a * 31 + g) >>> 0, gids.length);
  let prefix = ""; for (let i = 0, v = tagSeed; i < 6; i++) { prefix += String.fromCharCode(65 + (v % 26)); v = Math.floor(v / 26) + i * 7; }
  const base = `${prefix}+${font.psName}`;
  let W = ""; for (let i = 0; i < gids.length;) { let j = i; const ws: number[] = []; while (j < gids.length && gids[j] === gids[i]! + (j - i)) { ws.push(sc(font.advance(gids[j]!))); j++; } W += `${gids[i]} [${ws.join(" ")}] `; i = j; }
  stream(fileObj, `/Length1 ${sub.length}`, sub);
  obj(descObj, `<< /Type /FontDescriptor /FontName /${base} /Flags 4 /FontBBox [${font.bbox.map(sc).join(" ")}] /ItalicAngle 0 /Ascent ${sc(font.ascender)} /Descent ${sc(font.descender)} /CapHeight ${sc(font.capHeight)} /StemV 80 /FontFile2 ${fileObj} 0 R >>`);
  obj(cidObj, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${base} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descObj} 0 R /DW 1000 /W [ ${W}] /CIDToGIDMap /Identity >>`);
  let cmapText = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
  const pairs = gids.filter((g) => g !== 0).map((g) => { const cp = used.get(g)!; const u = cp > 0xffff ? hex4(0xd800 + ((cp - 0x10000) >> 10)) + hex4(0xdc00 + ((cp - 0x10000) & 0x3ff)) : hex4(cp); return `<${hex4(g)}> <${u}>`; });
  for (let i = 0; i < pairs.length; i += 100) { const part = pairs.slice(i, i + 100); cmapText += `${part.length} beginbfchar\n${part.join("\n")}\nendbfchar\n`; }
  cmapText += "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n";
  stream(uniObj, "", enc.encode(cmapText));
  obj(fontObj, `<< /Type /Font /Subtype /Type0 /BaseFont /${base} /Encoding /Identity-H /DescendantFonts [${cidObj} 0 R] /ToUnicode ${uniObj} 0 R >>`);

  const pdfDate = (d: Date): string => { const p2 = (v: number): string => String(v).padStart(2, "0"); const off = -d.getTimezoneOffset(), sign = off < 0 ? "-" : "+", ao = Math.abs(off); return `D:${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}${sign}${p2(Math.floor(ao / 60))}'${p2(ao % 60)}'`; };
  obj(infoObj, `<< /Title ${hexString(doc.title)} /Producer ${hexString(doc.producer ?? "MoonSinger")}${doc.created ? ` /CreationDate (${pdfDate(doc.created)})` : ""} >>`);
  obj(catalog, `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
  const xrefAt = length, count = offsets.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(xref); push(`trailer\n<< /Size ${count} /Root ${catalog} 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
  if (opts.stats) { opts.stats.glyphs = gids.length; opts.stats.missing = [...missing]; opts.stats.missingMusic = [...missingMusic]; opts.stats.fontBytes = sub.length; }
  const out = new Uint8Array(length); let p = 0;
  for (const cnk of chunks) { out.set(cnk, p); p += cnk.length; }
  return out;
}
