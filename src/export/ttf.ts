// 从兄弟仓 WebXiaoHeiWu src/export/ttf.ts 原样拷来（2026-10-08 深夜 by Claude Opus 5.5，WXHW 提交 f099221；作者 Claude Fable 5.1）。MoonSinger 的 PDF 导出用它解析 / 取子集 / 按词选读音。
// 改这份之前想想要不要两边一起改（以后可以抽成家族库）。
// TrueType（glyf 轮廓）最小解析 + 子集器——给 PDF 嵌字用。纯函数，零 DOM。created 2026-09-30 by Claude Fable 5.1
//   user 2026-09-30「老老实实做 pdf 吧」「先把 pdf 导出给做出来」。PDF 不嵌字体，读者设备没这款字体就是方块；整本嵌进去又是 7 MB——所以只嵌用到的字形。
//   只吃 glyf 轮廓的 TTF（sfnt 0x00010000 / 'true'）；CFF（'OTTO'）响亮拒绝——CFF 子集化是另一个量级的活，小的 CFF 字体将来整个嵌。
//   子集策略 = **字形号不动**：没用到的字形在 glyf 里清空（loca 相邻两项相等），用到的原样拷（复合字形把部件递归带上）。
//   这样 PDF 里 CID = 原字形号、CIDToGIDMap /Identity，不用重排号也不用改任何引用；代价是 loca / hmtx 仍是全表（几万项重复值，Flate 一压就没了）。
//   产出的字体只含 PDF 的 CIDFontType2 需要的表：head hhea maxp hmtx loca glyf（+ 原字体里有的 cvt fpgm prep）；cmap / name / post / OS/2 不带。

export interface TtfFont {
  unitsPerEm: number;
  /** hhea 的上下伸（字体单位）。注音字体会把拼音带算进去——排版别用它定汉字位置，用 inkOf。 */
  ascender: number; descender: number;
  capHeight: number;
  bbox: [number, number, number, number];
  numGlyphs: number;
  /** PostScript 名（name id 6；没有就 "Font"）。只含可打印 ASCII。 */
  psName: string;
  /** 码点 → 字形号；0 = 这款字体里没有。 */
  glyphId(codePoint: number): number;
  /** 字形的前进宽（字体单位）。 */
  advance(gid: number): number;
  /** 字形墨迹框 [xMin, yMin, xMax, yMax]（字体单位）；空字形 → null。 */
  inkOf(gid: number): [number, number, number, number] | null;
  /** 只留这些字形（外加 .notdef 与复合字形的部件）的 TTF。字形号不变。 */
  subset(gids: Iterable<number>): Uint8Array;
  /** 一串字 → 一串字形号（一个码点一个）。先查 cmap，再做 GSUB 的 `rclt`（上下文必换）——注音字体靠它按词给多音字选读音（「银行」的行 ≠ 「行走」的行）。
   *  没有 rclt 的字体 = 逐字查 cmap。只做一对一替换，所以长度不变。 */
  shape(text: string): number[];
  /** 把按上下文选好的读音**写进文字里**：哪个字的字形被 rclt 换了，就在它后面补一个变体选择符（cmap 14；萌神给每个读音都留了一个，U+E01E0 起）。
   *  给不做 rclt 的排字引擎用——实测 Chromium 的 canvas 画字不做上下文替换，但认变体选择符（2026-10-01，`tmp/round0930/probe-canvas-rclt.mjs`）。
   *  before / after = 这一行在段落里的前文 / 后文（只参与选读音，不出现在结果里）。选择符不占宽度。没有 rclt 的字体 → 原样返回。 */
  annotate(text: string, before?: string, after?: string): string;
  /** 这款字体有没有 rclt（有 = 逐行单独排会丢掉跨行的上下文，调用方要把前后文一起给）。 */
  contextual: boolean;
  /** rclt 里遇到的、这个引擎不认识的查找表种类（空 = 全认识）。不为空 = 个别读音可能选错，调用方该如实说。 */
  shapeSkipped: string[];
}

const u16 = (b: Uint8Array, o: number): number => (b[o]! << 8) | b[o + 1]!;
const i16 = (b: Uint8Array, o: number): number => { const v = u16(b, o); return v & 0x8000 ? v - 0x10000 : v; };
const u32 = (b: Uint8Array, o: number): number => ((b[o]! << 24) | (b[o + 1]! << 16) | (b[o + 2]! << 8) | b[o + 3]!) >>> 0;
const tagAt = (b: Uint8Array, o: number): string => String.fromCharCode(b[o]!, b[o + 1]!, b[o + 2]!, b[o + 3]!);

export class NotTrueTypeError extends Error { override name = "NotTrueTypeError"; }

export function parseTtf(bytes: Uint8Array): TtfFont {
  if (bytes.length < 12) throw new NotTrueTypeError("font file too short");
  const sfnt = u32(bytes, 0);
  if (tagAt(bytes, 0) === "OTTO") throw new NotTrueTypeError("CFF-flavoured OpenType (OTTO) is not supported; a glyf-outline TrueType font is required");
  if (sfnt !== 0x00010000 && tagAt(bytes, 0) !== "true") throw new NotTrueTypeError(`not a TrueType font (sfnt version 0x${sfnt.toString(16)})`);
  const tables = new Map<string, { off: number; len: number }>();
  const n = u16(bytes, 4);
  for (let i = 0; i < n; i++) { const r = 12 + 16 * i; tables.set(tagAt(bytes, r), { off: u32(bytes, r + 8), len: u32(bytes, r + 12) }); }
  const need = (tag: string) => { const t = tables.get(tag); if (!t) throw new NotTrueTypeError(`missing '${tag}' table`); return t; };
  const head = need("head"), hhea = need("hhea"), maxp = need("maxp"), hmtx = need("hmtx"), loca = need("loca"), glyf = need("glyf"), cmap = need("cmap");
  const unitsPerEm = u16(bytes, head.off + 18), longLoca = i16(bytes, head.off + 50) === 1;
  const bbox: [number, number, number, number] = [i16(bytes, head.off + 36), i16(bytes, head.off + 38), i16(bytes, head.off + 40), i16(bytes, head.off + 42)];
  const ascender = i16(bytes, hhea.off + 4), descender = i16(bytes, hhea.off + 6), numHMetrics = u16(bytes, hhea.off + 34);
  const numGlyphs = u16(bytes, maxp.off + 4);
  const os2 = tables.get("OS/2");
  const capHeight = os2 && os2.len >= 90 && u16(bytes, os2.off) >= 2 ? i16(bytes, os2.off + 88) : Math.round(ascender * 0.8);

  // ── name id 6（PostScript 名）──
  let psName = "Font";
  const nameT = tables.get("name");
  if (nameT) {
    const cnt = u16(bytes, nameT.off + 2), so = nameT.off + u16(bytes, nameT.off + 4);
    for (let i = 0; i < cnt; i++) {
      const r = nameT.off + 6 + 12 * i; if (u16(bytes, r + 6) !== 6) continue;
      const pid = u16(bytes, r), len = u16(bytes, r + 8), o = so + u16(bytes, r + 10);
      let s = "";
      if (pid === 3 || pid === 0) for (let k = 0; k + 1 < len; k += 2) s += String.fromCharCode(u16(bytes, o + k));
      else for (let k = 0; k < len; k++) s += String.fromCharCode(bytes[o + k]!);
      s = s.replace(/[^A-Za-z0-9\-]/g, ""); if (s) { psName = s; break; }
    }
  }

  // ── cmap：优先 format 12（全 Unicode），其次 format 4（BMP）──
  let f12 = -1, f4 = -1, f14 = -1;
  const nSub = u16(bytes, cmap.off + 2);
  for (let i = 0; i < nSub; i++) {
    const r = cmap.off + 4 + 8 * i, pid = u16(bytes, r), s = cmap.off + u32(bytes, r + 4), fmt = u16(bytes, s);
    if (fmt === 12 && (pid === 3 || pid === 0)) f12 = s;
    else if (fmt === 4 && (pid === 3 || pid === 0) && f4 < 0) f4 = s;
    else if (fmt === 14) f14 = s;
  }
  if (f12 < 0 && f4 < 0) throw new NotTrueTypeError("no usable cmap subtable (format 4 or 12)");
  const glyphId = (cp: number): number => {
    if (f12 >= 0) {
      let lo = 0, hi = u32(bytes, f12 + 12) - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1, g = f12 + 16 + 12 * mid, a = u32(bytes, g), e = u32(bytes, g + 4); if (cp < a) hi = mid - 1; else if (cp > e) lo = mid + 1; else { const gid = u32(bytes, g + 8) + (cp - a); return gid < numGlyphs ? gid : 0; } }
      return 0;
    }
    if (cp > 0xffff) return 0;
    const segX2 = u16(bytes, f4 + 6), ends = f4 + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
    let lo = 0, hi = segX2 / 2 - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, e = u16(bytes, ends + 2 * mid);
      if (cp > e) { lo = mid + 1; continue; }
      const a = u16(bytes, starts + 2 * mid);
      if (cp < a) { hi = mid - 1; continue; }
      const ro = u16(bytes, ranges + 2 * mid);
      if (ro === 0) return (cp + u16(bytes, deltas + 2 * mid)) & 0xffff;
      const g = u16(bytes, ranges + 2 * mid + ro + 2 * (cp - a));
      return g === 0 ? 0 : (g + u16(bytes, deltas + 2 * mid)) & 0xffff;
    }
    return 0;
  };

  const advance = (gid: number): number => u16(bytes, hmtx.off + 4 * Math.min(Math.max(gid, 0), numHMetrics - 1));
  /** 字形在 glyf 里的 [起, 止)（相对 glyf 表头）。 */
  const span = (gid: number): [number, number] => longLoca
    ? [u32(bytes, loca.off + 4 * gid), u32(bytes, loca.off + 4 * gid + 4)]
    : [u16(bytes, loca.off + 2 * gid) * 2, u16(bytes, loca.off + 2 * gid + 2) * 2];
  const inkOf = (gid: number): [number, number, number, number] | null => {
    if (gid < 0 || gid >= numGlyphs) return null;
    const [a, e] = span(gid); if (e <= a) return null;
    const o = glyf.off + a; return [i16(bytes, o + 2), i16(bytes, o + 4), i16(bytes, o + 6), i16(bytes, o + 8)];
  };

  function subset(gids: Iterable<number>): Uint8Array {
    // 闭包：.notdef + 用到的 + 复合字形的部件（递归）
    const keep = new Set<number>([0]); const todo: number[] = [];
    for (const g of gids) if (g > 0 && g < numGlyphs && !keep.has(g)) { keep.add(g); todo.push(g); }
    todo.push(0);
    while (todo.length) {
      const g = todo.pop()!; const [a, e] = span(g); if (e - a < 10) continue;
      let o = glyf.off + a; if (i16(bytes, o) >= 0) continue;   // 简单字形
      o += 10;
      for (;;) {
        const flags = u16(bytes, o), comp = u16(bytes, o + 2); o += 4;
        if (comp < numGlyphs && !keep.has(comp)) { keep.add(comp); todo.push(comp); }
        o += flags & 0x0001 ? 4 : 2;                                  // ARG_1_AND_2_ARE_WORDS
        if (flags & 0x0008) o += 2; else if (flags & 0x0040) o += 4; else if (flags & 0x0080) o += 8;   // 缩放 / 2×2
        if (!(flags & 0x0020)) break;                                  // MORE_COMPONENTS
      }
    }
    // 新 glyf + 长格式 loca（每个字形 4 字节对齐）
    let total = 0;
    for (const g of keep) { const [a, e] = span(g); total += (e - a + 3) & ~3; }
    const newGlyf = new Uint8Array(total), newLoca = new Uint8Array(4 * (numGlyphs + 1));
    const dv = new DataView(newLoca.buffer);
    let pos = 0;
    for (let g = 0; g < numGlyphs; g++) {
      dv.setUint32(4 * g, pos);
      if (keep.has(g)) { const [a, e] = span(g); newGlyf.set(bytes.subarray(glyf.off + a, glyf.off + e), pos); pos += (e - a + 3) & ~3; }
    }
    dv.setUint32(4 * numGlyphs, pos);
    const newHead = bytes.slice(head.off, head.off + head.len);
    newHead[8] = newHead[9] = newHead[10] = newHead[11] = 0;   // checkSumAdjustment 先清零
    newHead[50] = 0; newHead[51] = 1;                           // indexToLocFormat = long
    const out: [string, Uint8Array][] = [["glyf", newGlyf], ["head", newHead], ["hhea", bytes.subarray(hhea.off, hhea.off + hhea.len)], ["hmtx", bytes.subarray(hmtx.off, hmtx.off + hmtx.len)], ["loca", newLoca], ["maxp", bytes.subarray(maxp.off, maxp.off + maxp.len)]];
    for (const t of ["cvt ", "fpgm", "prep"]) { const x = tables.get(t); if (x) out.push([t, bytes.subarray(x.off, x.off + x.len)]); }
    out.sort((p, q) => (p[0] < q[0] ? -1 : 1));
    return assembleSfnt(out);
  }

  const rclt = buildRclt(bytes, tables.get("GSUB"));
  const shape = (text: string): number[] => { const g: number[] = []; for (const ch of text) g.push(glyphId(ch.codePointAt(0)!)); if (rclt) rclt.apply(g); return g; };

  /** cmap 14 反查：码点 + 字形号 → 变体选择符；没有 → 0。选择符一共没几个（萌神 9 个），逐个二分。 */
  const u24 = (o: number): number => (bytes[o]! << 16) | (bytes[o + 1]! << 8) | bytes[o + 2]!;
  const selectorFor = (cp: number, gid: number): number => {
    if (f14 < 0) return 0;
    for (let i = 0, n = u32(bytes, f14 + 6); i < n; i++) {
      const r = f14 + 10 + 11 * i, nd = u32(bytes, r + 7); if (!nd) continue;
      const t = f14 + nd; let lo = 0, hi = u32(bytes, t) - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1, m = t + 4 + 5 * mid, v = u24(m); if (cp < v) hi = mid - 1; else if (cp > v) lo = mid + 1; else { if (u16(bytes, m + 3) === gid) return u24(r); break; } }
    }
    return 0;
  };
  const annotate = (text: string, before = "", after = ""): string => {
    if (!rclt) return text;
    const chars = [...text], skipN = [...before].length, g = shape(before + text + after);
    let out = "";
    chars.forEach((ch, k) => { const cp = ch.codePointAt(0)!, got = g[skipN + k]!; out += ch; if (got !== glyphId(cp)) { const vs = selectorFor(cp, got); if (vs) out += String.fromCodePoint(vs); } });
    return out;
  };

  return { unitsPerEm, ascender, descender, capHeight, bbox, numGlyphs, psName, glyphId, advance, inkOf, subset, shape, annotate, contextual: !!rclt, shapeSkipped: rclt ? rclt.skipped : [] };
}

// ── GSUB `rclt`（v2.3.21；created 2026-10-01 by Claude Fable 5.1）──────────────────────────────────────────────
//   只为注音字体（萌神）：汉字字形自带拼音，多音字的别的读音是另一个字形，靠 rclt 的「链式上下文替换」按前后的字换过去。
//   认的查找表：1（单替换，格式 1 / 2）、6（链式上下文，格式 2 按类 / 格式 3 按覆盖表）、7（扩展壳）。别的 → 记进 skipped、跳过。
//   语义照 OpenType：查找表按 LookupList 的序号依次整串过一遍；每个位置试各子表，头一个匹配的生效；链式匹配上了就跳过整段输入。
//   不管 script / language（把所有 rclt 特性的查找表并起来）、不管 lookupFlag 的忽略规则（这类字体里没有要忽略的标记）。
type Cov = (gid: number) => number;
function buildRclt(b: Uint8Array, t: { off: number; len: number } | undefined): { apply(g: number[]): void; skipped: string[] } | null {
  if (!t || t.len < 10) return null;
  const base = t.off, featureList = base + u16(b, base + 6), lookupList = base + u16(b, base + 8);
  const wanted = new Set<number>();
  for (let i = 0, n = u16(b, featureList); i < n; i++) {
    const r = featureList + 2 + 6 * i; if (tagAt(b, r) !== "rclt") continue;
    const f = featureList + u16(b, r + 4);
    for (let k = 0, m = u16(b, f + 2); k < m; k++) wanted.add(u16(b, f + 4 + 2 * k));
  }
  if (!wanted.size) return null;
  const skipped: string[] = [];
  const skip = (what: string): null => { if (!skipped.includes(what)) skipped.push(what); return null; };

  const coverage = (o: number): Cov => {
    const fmt = u16(b, o), n = u16(b, o + 2);
    if (fmt === 1) return (g) => { let lo = 0, hi = n - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, v = u16(b, o + 4 + 2 * mid); if (g < v) hi = mid - 1; else if (g > v) lo = mid + 1; else return mid; } return -1; };
    return (g) => { let lo = 0, hi = n - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, r = o + 4 + 6 * mid, a = u16(b, r), e = u16(b, r + 2); if (g < a) hi = mid - 1; else if (g > e) lo = mid + 1; else return u16(b, r + 4) + (g - a); } return -1; };
  };
  const classDef = (o: number | null): ((gid: number) => number) => {
    if (o == null) return () => 0;
    const fmt = u16(b, o);
    if (fmt === 1) { const start = u16(b, o + 2), n = u16(b, o + 4); return (g) => (g >= start && g < start + n ? u16(b, o + 6 + 2 * (g - start)) : 0); }
    const n = u16(b, o + 2);
    return (g) => { let lo = 0, hi = n - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, r = o + 4 + 6 * mid, a = u16(b, r), e = u16(b, r + 2); if (g < a) hi = mid - 1; else if (g > e) lo = mid + 1; else return u16(b, r + 4); } return 0; };
  };

  /** 一张子表：在 g[i] 上试一次；匹配并改了 → 吃掉的输入长度（≥ 1），否则 0。 */
  type Sub = (g: number[], i: number) => number;
  const lookupCache = new Map<number, Sub[]>();
  const applyAt = (lookup: number, g: number[], i: number): number => { for (const s of subsOf(lookup)) { const n = s(g, i); if (n) return n; } return 0; };
  const records = (o: number, count: number, g: number[], i: number): void => { for (let k = 0; k < count; k++) { const seq = u16(b, o + 4 * k), lk = u16(b, o + 4 * k + 2); if (i + seq < g.length) applyAt(lk, g, i + seq); } };

  function subsOf(lookup: number): Sub[] {
    let subs = lookupCache.get(lookup); if (subs) return subs;
    subs = []; lookupCache.set(lookup, subs);
    if (lookup >= u16(b, lookupList)) return subs;
    const lo = lookupList + u16(b, lookupList + 2 + 2 * lookup); let type = u16(b, lo);
    for (let k = 0, n = u16(b, lo + 4); k < n; k++) {
      let st = lo + u16(b, lo + 6 + 2 * k), ty = type;
      if (ty === 7) { ty = u16(b, st + 2); st = st + u32(b, st + 4); }
      const sub = makeSub(ty, st); if (sub) subs.push(sub);
    }
    return subs;
  }
  function makeSub(type: number, o: number): Sub | null {
    const fmt = u16(b, o);
    if (type === 1) {
      const cov = coverage(o + u16(b, o + 2));
      if (fmt === 1) { const delta = u16(b, o + 4); return (g, i) => { if (cov(g[i]!) < 0) return 0; g[i] = (g[i]! + delta) & 0xffff; return 1; }; }
      if (fmt === 2) return (g, i) => { const c = cov(g[i]!); if (c < 0 || c >= u16(b, o + 4)) return 0; g[i] = u16(b, o + 6 + 2 * c); return 1; };
      return skip(`single substitution format ${fmt}`);
    }
    if (type === 6 && fmt === 2) {
      const off = (k: number): number | null => { const v = u16(b, o + k); return v ? o + v : null; };
      const cov = coverage(o + u16(b, o + 2)), back = classDef(off(4)), input = classDef(off(6)), ahead = classDef(off(8)), nSets = u16(b, o + 10);
      return (g, i) => {
        if (cov(g[i]!) < 0) return 0;
        const cls = input(g[i]!); if (cls >= nSets) return 0;
        const so = u16(b, o + 12 + 2 * cls); if (!so) return 0;
        const set = o + so;
        rules: for (let r = 0, nr = u16(b, set); r < nr; r++) {
          let p = set + u16(b, set + 2 + 2 * r);
          const nb = u16(b, p); p += 2;
          if (nb > i) continue;
          for (let k = 0; k < nb; k++) if (back(g[i - 1 - k]!) !== u16(b, p + 2 * k)) continue rules;
          p += 2 * nb;
          const ni = u16(b, p); p += 2;
          if (i + ni > g.length) continue;
          for (let k = 1; k < ni; k++) if (input(g[i + k]!) !== u16(b, p + 2 * (k - 1))) continue rules;
          p += 2 * (ni - 1);
          const na = u16(b, p); p += 2;
          if (i + ni + na > g.length) continue;
          for (let k = 0; k < na; k++) if (ahead(g[i + ni + k]!) !== u16(b, p + 2 * k)) continue rules;
          p += 2 * na;
          records(p + 2, u16(b, p), g, i);
          return Math.max(1, ni);
        }
        return 0;
      };
    }
    if (type === 6 && fmt === 3) {
      let p = o + 2;
      const list = (): Cov[] => { const n = u16(b, p); p += 2; const out: Cov[] = []; for (let k = 0; k < n; k++) out.push(coverage(o + u16(b, p + 2 * k))); p += 2 * n; return out; };
      const back = list(), input = list(), ahead = list(); const nRec = u16(b, p), rec = p + 2;
      if (!input.length) return null;
      return (g, i) => {
        if (back.length > i || i + input.length + ahead.length > g.length) return 0;
        for (let k = 0; k < input.length; k++) if (input[k]!(g[i + k]!) < 0) return 0;
        for (let k = 0; k < back.length; k++) if (back[k]!(g[i - 1 - k]!) < 0) return 0;
        for (let k = 0; k < ahead.length; k++) if (ahead[k]!(g[i + input.length + k]!) < 0) return 0;
        records(rec, nRec, g, i);
        return input.length;
      };
    }
    return skip(`lookup type ${type} format ${fmt}`);
  }

  const order = [...wanted].sort((x, y) => x - y);
  return { skipped, apply(g) { for (const lk of order) { for (let i = 0; i < g.length;) { const n = applyAt(lk, g, i); i += n || 1; } } } };
}

function checksum(b: Uint8Array): number {
  let sum = 0; const n = b.length & ~3;
  for (let i = 0; i < n; i += 4) sum = (sum + u32(b, i)) >>> 0;
  if (b.length & 3) { let last = 0; for (let i = n; i < b.length; i++) last |= b[i]! << (24 - 8 * (i - n)); sum = (sum + (last >>> 0)) >>> 0; }
  return sum;
}
/** 拼一个 sfnt：表目录按 tag 排好、每张表 4 字节对齐、head.checkSumAdjustment 回填。 */
function assembleSfnt(tables: [string, Uint8Array][]): Uint8Array {
  const n = tables.length; let e = 0; while ((1 << (e + 1)) <= n) e++;
  const headerLen = 12 + 16 * n; let total = headerLen;
  for (const [, d] of tables) total += (d.length + 3) & ~3;
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x00010000); dv.setUint16(4, n); dv.setUint16(6, (1 << e) * 16); dv.setUint16(8, e); dv.setUint16(10, n * 16 - (1 << e) * 16);
  let off = headerLen, headOff = -1;
  tables.forEach(([tag, d], i) => {
    const r = 12 + 16 * i;
    for (let k = 0; k < 4; k++) out[r + k] = tag.charCodeAt(k);
    dv.setUint32(r + 4, checksum(d)); dv.setUint32(r + 8, off); dv.setUint32(r + 12, d.length);
    out.set(d, off); if (tag === "head") headOff = off;
    off += (d.length + 3) & ~3;
  });
  if (headOff >= 0) dv.setUint32(headOff + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out;
}
