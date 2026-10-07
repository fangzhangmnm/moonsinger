// sf2-subset.ts —— SoundFont 2 子集化：只留几个预设（bank / program）和它们用到的乐器、采样，重写成一个小的、标准的 .sf2。纯函数，Node 里可测。
// created 2026-10-07 by Claude Fable 5.1。契约草稿 §10.2：样本类音源 by value 嵌进歌 = 「只嵌这首歌用到的 preset 及其样本（像 PDF 嵌字体子集）」。
// 规格依据 SoundFont 2.04 spec（RIFF：INFO / sdta{smpl, sm24?} / pdta{phdr pbag pmod pgen inst ibag imod igen shdr}）。
// · 子集出来的声音和整包逐样本相同（test/sf2.test.ts 用 TinySoundFont 核）：采样字节、生成器、调制器全部原样搬，只重编号。
// · INFO 块原样保留（GeneralUser GS 把许可证写在 ICMT 里，跟着子集走——vault 文档要的出处正好在里面）。
// · 24 位的低字节块 sm24 不带（子集降为 16 位；GeneralUser GS 本来就没有）。
// · 确定性：同样的输入 + 同样的预设清单 → 同样的字节（乐器 / 采样按原下标排序）。

export interface Sf2PresetId { bank: number; program: number }
export interface Sf2PresetInfo extends Sf2PresetId { name: string }

const REC = { phdr: 38, pbag: 4, pmod: 10, pgen: 4, inst: 22, ibag: 4, imod: 10, igen: 4, shdr: 46 } as const;
type PdtaName = keyof typeof REC;
const GEN_INSTRUMENT = 41, GEN_SAMPLE_ID = 53;
const ZERO_TAIL = 46;   // spec: at least 46 zero sample points after every sample

interface Chunk { off: number; size: number }   // off = 数据起点（跳过 8 字节头）
interface Parsed { info: Uint8Array; smpl: Chunk; pdta: Record<PdtaName, Chunk> }

const tag = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
/** 同一块内存上的标准 Uint8Array 视图：Node 的 Buffer 把 slice 改成了「不拷贝」，下面 copy() 靠 slice 拷出记录再改，拿到 Buffer 会把调用方的整包改坏。 */
const plain = (b: Uint8Array) => (b.constructor === Uint8Array ? b : new Uint8Array(b.buffer, b.byteOffset, b.byteLength));

function parse(b: Uint8Array): Parsed {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (tag(b, 0) !== "RIFF" || tag(b, 8) !== "sfbk") throw new Error("sf2: not a SoundFont 2 file");
  let info: Uint8Array | null = null, smpl: Chunk | null = null;
  const pdta = {} as Record<PdtaName, Chunk>;
  let o = 12;
  while (o + 8 <= b.length) {
    const id = tag(b, o), size = dv.getUint32(o + 4, true), data = o + 8;
    if (id === "LIST") {
      const kind = tag(b, data);
      if (kind === "INFO") info = b.subarray(o, data + size);
      else {
        let p = data + 4;
        while (p + 8 <= data + size) {
          const sid = tag(b, p), ssize = dv.getUint32(p + 4, true);
          if (kind === "sdta" && sid === "smpl") smpl = { off: p + 8, size: ssize };
          if (kind === "pdta" && sid in REC) pdta[sid as PdtaName] = { off: p + 8, size: ssize };
          p += 8 + ssize + (ssize & 1);
        }
      }
    }
    o = data + size + (size & 1);
  }
  if (!info || !smpl) throw new Error("sf2: missing INFO or sample data");
  for (const k of Object.keys(REC) as PdtaName[]) if (!pdta[k]) throw new Error(`sf2: missing ${k}`);
  return { info, smpl, pdta };
}

const nameOf = (b: Uint8Array, o: number) => { let s = ""; for (let i = 0; i < 20 && b[o + i]; i++) s += String.fromCharCode(b[o + i]); return s; };

/** 列出一个 sf2 里的预设（不含末尾的 EOP）。 */
export function listSf2Presets(input: Uint8Array): Sf2PresetInfo[] {
  const bytes = plain(input);
  const { pdta } = parse(bytes), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = pdta.phdr.size / REC.phdr - 1, out: Sf2PresetInfo[] = [];
  for (let i = 0; i < n; i++) { const o = pdta.phdr.off + i * REC.phdr; out.push({ name: nameOf(bytes, o), program: dv.getUint16(o + 20, true), bank: dv.getUint16(o + 22, true) }); }
  return out;
}

/** 只留 want 里的预设。缺的预设 = 抛错（调用方决定怎么报）。 */
export function subsetSf2(input: Uint8Array, want: readonly Sf2PresetId[]): Uint8Array {
  const bytes = plain(input);
  const { info, smpl, pdta } = parse(bytes), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = (k: PdtaName) => pdta[k].size / REC[k];
  const at = (k: PdtaName, i: number) => pdta[k].off + i * REC[k];
  const u16 = (k: PdtaName, i: number, field: number) => dv.getUint16(at(k, i) + field, true);
  // 1. 选预设
  const nP = count("phdr") - 1;
  const wantKey = new Set(want.map((w) => `${w.bank}:${w.program}`));
  const presets: number[] = [];
  for (let i = 0; i < nP; i++) if (wantKey.has(`${u16("phdr", i, 22)}:${u16("phdr", i, 20)}`)) presets.push(i);
  const found = new Set(presets.map((i) => `${u16("phdr", i, 22)}:${u16("phdr", i, 20)}`));
  const missing = [...wantKey].filter((k) => !found.has(k));
  if (missing.length) throw new Error(`sf2: presets not in this bank: ${missing.join(", ")}`);
  // 2. 预设 → 乐器
  const instSet = new Set<number>();
  for (const i of presets) for (let b = u16("phdr", i, 24); b < u16("phdr", i + 1, 24); b++)
    for (let g = u16("pbag", b, 0); g < u16("pbag", b + 1, 0); g++) if (u16("pgen", g, 0) === GEN_INSTRUMENT) instSet.add(u16("pgen", g, 2));
  const insts = [...instSet].sort((a, b) => a - b), instMap = new Map(insts.map((v, i) => [v, i]));
  // 3. 乐器 → 采样（含立体声另一半）
  const nS = count("shdr") - 1, sampleSet = new Set<number>();
  for (const j of insts) for (let b = u16("inst", j, 20); b < u16("inst", j + 1, 20); b++)
    for (let g = u16("ibag", b, 0); g < u16("ibag", b + 1, 0); g++) if (u16("igen", g, 0) === GEN_SAMPLE_ID) sampleSet.add(u16("igen", g, 2));
  for (const s of [...sampleSet]) { const type = u16("shdr", s, 44), link = u16("shdr", s, 42); if ((type & 0x0e) && link < nS) sampleSet.add(link); }
  const samples = [...sampleSet].sort((a, b) => a - b), sampleMap = new Map(samples.map((v, i) => [v, i]));
  // 4. 重写 pdta
  const out: Record<PdtaName, number[]> = { phdr: [], pbag: [], pmod: [], pgen: [], inst: [], ibag: [], imod: [], igen: [], shdr: [] };
  const copy = (k: PdtaName, i: number, patch?: (rec: Uint8Array) => void) => { const rec = bytes.slice(at(k, i), at(k, i) + REC[k]); patch?.(rec); out[k].push(...rec); };
  const w16 = (rec: Uint8Array, o: number, v: number) => { rec[o] = v & 0xff; rec[o + 1] = (v >> 8) & 0xff; };
  const w32 = (rec: Uint8Array, o: number, v: number) => { w16(rec, o, v & 0xffff); w16(rec, o + 2, (v >>> 16) & 0xffff); };
  let nBag = 0, nGen = 0, nMod = 0;
  for (const i of presets) {
    copy("phdr", i, (r) => w16(r, 24, nBag));
    for (let b = u16("phdr", i, 24); b < u16("phdr", i + 1, 24); b++) {
      copy("pbag", b, (r) => { w16(r, 0, nGen); w16(r, 2, nMod); }); nBag++;
      for (let g = u16("pbag", b, 0); g < u16("pbag", b + 1, 0); g++) { copy("pgen", g, (r) => { if (u16("pgen", g, 0) === GEN_INSTRUMENT) w16(r, 2, instMap.get(u16("pgen", g, 2))!); }); nGen++; }
      for (let m = u16("pbag", b, 2); m < u16("pbag", b + 1, 2); m++) { copy("pmod", m); nMod++; }
    }
  }
  copy("phdr", nP, (r) => w16(r, 24, nBag));   // EOP
  out.pbag.push(...new Uint8Array(REC.pbag)); const pb = out.pbag.length - REC.pbag; out.pbag[pb] = nGen & 0xff; out.pbag[pb + 1] = nGen >> 8; out.pbag[pb + 2] = nMod & 0xff; out.pbag[pb + 3] = nMod >> 8;
  out.pgen.push(...new Uint8Array(REC.pgen)); out.pmod.push(...new Uint8Array(REC.pmod));
  nBag = 0; nGen = 0; nMod = 0;
  for (const j of insts) {
    copy("inst", j, (r) => w16(r, 20, nBag));
    for (let b = u16("inst", j, 20); b < u16("inst", j + 1, 20); b++) {
      copy("ibag", b, (r) => { w16(r, 0, nGen); w16(r, 2, nMod); }); nBag++;
      for (let g = u16("ibag", b, 0); g < u16("ibag", b + 1, 0); g++) { copy("igen", g, (r) => { if (u16("igen", g, 0) === GEN_SAMPLE_ID) w16(r, 2, sampleMap.get(u16("igen", g, 2))!); }); nGen++; }
      for (let m = u16("ibag", b, 2); m < u16("ibag", b + 1, 2); m++) { copy("imod", m); nMod++; }
    }
  }
  copy("inst", count("inst") - 1, (r) => w16(r, 20, nBag));   // EOI
  out.ibag.push(...new Uint8Array(REC.ibag)); const ib = out.ibag.length - REC.ibag; out.ibag[ib] = nGen & 0xff; out.ibag[ib + 1] = nGen >> 8; out.ibag[ib + 2] = nMod & 0xff; out.ibag[ib + 3] = nMod >> 8;
  out.igen.push(...new Uint8Array(REC.igen)); out.imod.push(...new Uint8Array(REC.imod));
  // 5. 采样：切出每段 + 46 个零，shdr 里的位置重算
  const pieces: Uint8Array[] = []; let pos = 0;
  const u32 = (k: PdtaName, i: number, field: number) => dv.getUint32(at(k, i) + field, true);
  for (const s of samples) {
    const start = u32("shdr", s, 20), end = u32("shdr", s, 24), len = end - start;
    copy("shdr", s, (r) => {
      w32(r, 20, pos); w32(r, 24, pos + len); w32(r, 28, pos + (u32("shdr", s, 28) - start)); w32(r, 32, pos + (u32("shdr", s, 32) - start));
      const link = u16("shdr", s, 42), ns = sampleMap.get(link);
      if (ns === undefined) { w16(r, 42, 0); w16(r, 44, 1); } else w16(r, 42, ns);   // 另一半没进来 = 当单声道
    });
    pieces.push(bytes.subarray(smpl.off + start * 2, smpl.off + end * 2), new Uint8Array(ZERO_TAIL * 2));
    pos += len + ZERO_TAIL;
  }
  copy("shdr", nS);   // EOS
  // 6. 拼 RIFF
  const chunk = (id: string, data: Uint8Array | number[]): Uint8Array => {
    const d = data instanceof Uint8Array ? data : Uint8Array.from(data), pad = d.length & 1;
    const r = new Uint8Array(8 + d.length + pad); r.set([...id].map((c) => c.charCodeAt(0)), 0); new DataView(r.buffer).setUint32(4, d.length, true); r.set(d, 8); return r;
  };
  const list = (kind: string, parts: Uint8Array[]): Uint8Array => chunk("LIST", concat([Uint8Array.from([...kind].map((c) => c.charCodeAt(0))), ...parts]));
  const sdta = list("sdta", [chunk("smpl", concat(pieces))]);
  const pdtaOut = list("pdta", (Object.keys(REC) as PdtaName[]).map((k) => chunk(k, out[k])));
  const body = concat([Uint8Array.from([..."sfbk"].map((c) => c.charCodeAt(0))), info, sdta, pdtaOut]);
  return chunk("RIFF", body);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, p) => s + p.length, 0), r = new Uint8Array(n); let o = 0;
  for (const p of parts) { r.set(p, o); o += p.length; }
  return r;
}
