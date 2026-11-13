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

/** INFO 块里给人看的字（SoundFont 2.04 §5）：INAM 名字、IENG 作者、ICOP 版权、ICMT 注释（GeneralUser GS 把许可证写在这里）。没有的不出现。 */
export function sf2Info(input: Uint8Array): { name?: string; engineer?: string; copyright?: string; comment?: string; product?: string } {
  const bytes = plain(input), { info } = parse(bytes), dv = new DataView(info.buffer, info.byteOffset, info.byteLength);
  const out: Record<string, string> = {}, map: Record<string, string> = { INAM: "name", IENG: "engineer", ICOP: "copyright", ICMT: "comment", IPRD: "product" };
  let p = 12;   // 跳过 LIST + size + "INFO"
  while (p + 8 <= info.length) {
    const id = tag(info, p), size = dv.getUint32(p + 4, true), key = map[id];
    if (key) { let s = ""; for (let i = 0; i < size && info[p + 8 + i]; i++) s += String.fromCharCode(info[p + 8 + i]); out[key] = s.trim(); }
    p += 8 + size + (size & 1);
  }
  return out;
}

/** 一块 sf2 给人看的名字（施工单 13-2，统筹「13 开工前…五件的回话」第 2 条）：只读开头的 INFO 和结尾的预设表两小段，不把整块读进内存；
 *  拼成一个没有采样的小 sf2，交给上面现成的 sf2Info / listSf2Presets 读。preset = 第一个预设的名字（切下来的一块通常只有一个），library = INFO 里的 INAM。
 *  read(start, end) = 读 [start, end) 这一段字节；size = 整块多大。读不出（不是 sf2、缺块）= null。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。 */
export async function sf2Label(read: (start: number, end: number) => Promise<Uint8Array>, size: number): Promise<{ preset?: string; library?: string; presets: number } | null> {
  try {
    const head = await read(0, Math.min(12, size));
    if (head.length < 12 || tag(head, 0) !== "RIFF" || tag(head, 8) !== "sfbk") return null;
    let info: Uint8Array | null = null, pdta: Uint8Array | null = null, o = 12;
    while (o + 12 <= size && !(info && pdta)) {
      const h = await read(o, o + 12), len = new DataView(h.buffer, h.byteOffset, h.byteLength).getUint32(4, true);
      if (tag(h, 0) === "LIST" && (tag(h, 8) === "INFO" || tag(h, 8) === "pdta")) { const whole = await read(o, o + 8 + len); if (tag(h, 8) === "INFO") info = whole; else pdta = whole; }
      o += 8 + len + (len & 1);
    }
    if (!info || !pdta) return null;
    const empty = new Uint8Array([..."LIST"].map((c) => c.charCodeAt(0)).concat([12, 0, 0, 0], [..."sdtasmpl"].map((c) => c.charCodeAt(0)), [0, 0, 0, 0]));
    const body = info.length + empty.length + pdta.length, mini = new Uint8Array(12 + body), dv = new DataView(mini.buffer);
    mini.set([..."RIFF"].map((c) => c.charCodeAt(0)), 0); dv.setUint32(4, 4 + body, true); mini.set([..."sfbk"].map((c) => c.charCodeAt(0)), 8);
    mini.set(info, 12); mini.set(empty, 12 + info.length); mini.set(pdta, 12 + info.length + empty.length);
    const presets = listSf2Presets(mini), name = sf2Info(mini).name;
    return { ...(presets[0]?.name ? { preset: presets[0].name.trim() } : {}), ...(name ? { library: name } : {}), presets: presets.length };
  } catch { return null; }
}

/** 这件乐器（一个预设；给了 key = 只看盖到这个键的区）的「力度深度」：库给每个区写的「力度 → 初始衰减」调制器的量（cB），照 FluidSynth 合
 *  （施工单 9-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；引擎那一半 = vendor/tsf/patch-tsf.py 补丁 2，两边同一套规矩）：
 *  规范默认 960（来源 0x0502 = 力度、负向、单极、凹，量来源 = 无）；乐器一级同源的盖掉它（区里的盖过全局区的），预设一级同源的加上去（量 0 不加）。
 *  响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)；0 = 按多重都一样响。回不重复、从小到大的几个数（一般一件乐器一个数；鼓组按鼓件不同）；没有这个预设 = null。 */
/** SF2 规范的放法下，库写的深度 d（cB）让「力度减半」轻多少 dB（乐器页的说明用；响度 = d ÷ 960 × 40·log10(力度 ÷ 127)，960 = 规范默认）。这条公式只住在 gm/ 这一层（16-4 守卫）。 */
export const sf2HalfVelocityDb = (depth: number): number => (depth / 960) * 40 * Math.log10(2);
export function sf2VelocityDepths(input: Uint8Array, bank: number, program: number, key?: number): number[] | null {
  const bytes = plain(input), { pdta } = parse(bytes), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (c: Chunk, rec: number, i: number, at: number) => dv.getUint16(c.off + i * rec + at, true);
  const bagOf = (hdr: PdtaName, i: number) => u16(pdta[hdr], REC[hdr], i, hdr === "phdr" ? 24 : 20);
  /** 一个区：它的生成器（op → 原始 16 位）和「力度 → 衰减」同源调制器的量（没写 = undefined）。 */
  const zone = (bagName: "pbag" | "ibag", genName: "pgen" | "igen", modName: "pmod" | "imod", z: number) => {
    const g0 = u16(pdta[bagName], 4, z, 0), g1 = u16(pdta[bagName], 4, z + 1, 0), m0 = u16(pdta[bagName], 4, z, 2), m1 = u16(pdta[bagName], 4, z + 1, 2);
    const gens = new Map<number, number>(); let amt: number | undefined;
    for (let g = g0; g < g1; g++) gens.set(u16(pdta[genName], 4, g, 0), u16(pdta[genName], 4, g, 2));
    for (let m = m0; m < m1; m++) {
      const o = pdta[modName].off + m * 10;
      if (dv.getUint16(o, true) === 0x0502 && dv.getUint16(o + 2, true) === 48 && dv.getUint16(o + 6, true) === 0) amt = dv.getInt16(o + 4, true);   // 同一个区里重复的：后面的算数
    }
    return { gens, amt };
  };
  const range = (gens: Map<number, number>, glob?: Map<number, number>): [number, number] => { const r = gens.get(43) ?? glob?.get(43); return r === undefined ? [0, 127] : [r & 0xff, r >> 8]; };
  const nP = pdta.phdr.size / REC.phdr - 1;
  let pi = -1; for (let i = 0; i < nP; i++) if (u16(pdta.phdr, REC.phdr, i, 22) === bank && u16(pdta.phdr, REC.phdr, i, 20) === program) { pi = i; break; }
  if (pi < 0) return null;
  const out = new Set<number>(), hit = (r: [number, number]) => key === undefined || (key >= r[0] && key <= r[1]);
  let pGlob: ReturnType<typeof zone> | null = null;
  for (let z = bagOf("phdr", pi); z < bagOf("phdr", pi + 1); z++) {
    const pz = zone("pbag", "pgen", "pmod", z), inst = pz.gens.get(GEN_INSTRUMENT);
    if (inst === undefined) { if (z === bagOf("phdr", pi)) pGlob = pz; continue; }
    const pr = range(pz.gens, pGlob?.gens); if (!hit(pr)) continue;
    const pAmt = pz.amt ?? pGlob?.amt ?? 0;
    let iGlob: ReturnType<typeof zone> | null = null;
    for (let iz = bagOf("inst", inst); iz < bagOf("inst", inst + 1); iz++) {
      const zz = zone("ibag", "igen", "imod", iz);
      if (!zz.gens.has(GEN_SAMPLE_ID)) { if (iz === bagOf("inst", inst)) iGlob = zz; continue; }
      const ir = range(zz.gens, iGlob?.gens);
      if (!hit(ir) || ir[1] < pr[0] || ir[0] > pr[1]) continue;
      out.add((zz.amt ?? iGlob?.amt ?? 960) + pAmt);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** 「这一下力度让它多响」的那一项（7-N，2026-11-12；统筹选 A）：引擎（vendor/tsf/patch-tsf.py 补丁 2，照 FluidSynth）对每个响的区实际施加的初始衰减（dB），逐区照搬同一套规矩——
 *  发生器（预设一级 + 乐器一级，区里的盖全局区的）× 0.04 dB/cB；「→ 初始衰减」调制器（默认 0x0502 / 960，乐器一级同源盖、预设一级同源加、量 0 不加；来源 = 力度 / 键号 / 无），
 *  按 FluidSynth 的映射算（凹 / 凸表、单极夹 127/128）；和夹在 0–144 dB。
 *  · `regions(key, vel)` = 这个键、这个力度会响的每一个区各自的衰减（dB，引擎 tsf_region_attenuation 的值；test/sf-velcurve.test.ts 拿引擎本身逐格核）。
 *  · `at(key, vel)` = L：这一下的响度（dB，≤ 0）。只有一层响 = −那一层的衰减（和引擎逐值相同）；几层同时响 = 按功率加 10·log10(Σ 10^(−衰减÷10))——
 *    **假定每层的采样一样响**（采样本身多响看不到；GS 里有 2.3% 的「键 × 力度」是几层叠着、深度又不一样，名单在施工记录 7-N）。没有区 = null（这个键不出声）。
 *  · 不进歌的文件；准备声音时从库的字节算，按键懒算、算过的记着。 */
export interface VelCurve { at(key: number, vel: number): number | null; regions(key: number, vel: number): number[] }
type AttMod = { src: number; amtSrc: number; trans: number; amount: number };
type CurveRegion = { lokey: number; hikey: number; lovel: number; hivel: number; genDb: number; mods: AttMod[] };
const ATT = 48, KEY_RANGE = 43, VEL_RANGE = 44;
/** 同一个区里 / 区盖全局区：同源（两个来源都一样）的换掉，否则接上；只有线性 / 绝对值两种变换，别的 = 这条不起作用（同 FluidSynth）。 */
function putMod(list: AttMod[], m: AttMod): void {
  const a = m.trans !== 0 && m.trans !== 2 ? { ...m, amount: 0, trans: 0 } : m;
  const i = list.findIndex((x) => x.src === a.src && x.amtSrc === a.amtSrc);
  if (i >= 0) list[i] = { ...list[i]!, trans: a.trans, amount: a.amount }; else if (list.length < 8) list.push({ ...a });
}
const cTab = (i: number) => (i <= 0 ? 0 : i >= 127 ? 1 : (-400 / 960) * Math.log10((127 - i) / 127));
const vTab = (i: number) => (i <= 0 ? 0 : i >= 127 ? 1 : 1 - cTab(127 - i));
const interp = (tab: (i: number) => number, x: number) => { const i = Math.trunc(x); if (x < 0) return 0; if (i >= 127) return 1; return tab(i) + (tab(i + 1) - tab(i)) * (x - i); };
/** 一个来源 → 0–1 / −1–1（fluid_mod_transform_source_value，range 128）；null = 引擎没有这个来源的状态（MIDI 控制器 / 触后 / 弯音），这条跳过。 */
function mapSrc(op: number, key: number, vel: number): number | null {
  const index = op & 0x7f, type = op >> 10, top = 127 / 128;
  if (op & 0x80) return null;
  if (index === 0) return 1;
  let v: number;
  if (index === 2) v = vel; else if (index === 3) v = key; else return null;
  if (type > 3) return null;
  const n = v / 128, inv = 1 - 1 / 128 - n;
  if (!(op & 0x200)) {
    v = op & 0x100 ? inv : n;
    if (type === 1) v = Math.min(interp(cTab, 128 * v), top); else if (type === 2) v = Math.min(interp(vTab, 128 * v), top); else if (type === 3) v = v >= 0.5 ? 1 : 0;
  } else {
    const b = op & 0x100 ? inv : n;
    v = b === top ? b : -1 + 2 * b;
    if (type === 1) v = v >= 0 ? Math.min(interp(cTab, 128 * v), top) : -interp(cTab, -128 * v);
    else if (type === 2) v = v >= 0 ? Math.min(interp(vTab, 128 * v), top) : -interp(vTab, -128 * v);
    else if (type === 3) v = v >= 0 ? 1 : -1;
  }
  return v;
}
function regionAtt(r: CurveRegion, key: number, vel: number): number {
  let cb = 0;
  for (const m of r.mods) { const a = mapSrc(m.src, key, vel), b = mapSrc(m.amtSrc, key, vel); if (a === null || b === null) continue; let o = m.amount * a * b; if (m.trans === 2 && o < 0) o = -o; cb += o; }
  const db = r.genDb + cb * 0.1;
  return db < 0 ? 0 : db > 144 ? 144 : db;
}
/** 一个预设的 L（没有这个预设 = null）。 */
export function sf2VelocityCurve(input: Uint8Array, bank: number, program: number): VelCurve | null {
  const bytes = plain(input), { pdta } = parse(bytes), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (c: Chunk, rec: number, i: number, at: number) => dv.getUint16(c.off + i * rec + at, true);
  const bagOf = (hdr: PdtaName, i: number) => u16(pdta[hdr], REC[hdr], i, hdr === "phdr" ? 24 : 20);
  type Zone = { gens: Map<number, number>; mods: AttMod[] };
  const zone = (bagName: "pbag" | "ibag", genName: "pgen" | "igen", modName: "pmod" | "imod", z: number, base?: Zone): Zone => {
    const gens = new Map(base?.gens ?? []), mods = (base?.mods ?? []).map((m) => ({ ...m }));
    for (let g = u16(pdta[bagName], 4, z, 0); g < u16(pdta[bagName], 4, z + 1, 0); g++) gens.set(u16(pdta[genName], 4, g, 0), u16(pdta[genName], 4, g, 2));
    for (let m = u16(pdta[bagName], 4, z, 2); m < u16(pdta[bagName], 4, z + 1, 2); m++) {
      const o = pdta[modName].off + m * 10;
      if (dv.getUint16(o + 2, true) === ATT) putMod(mods, { src: dv.getUint16(o, true), amtSrc: dv.getUint16(o + 6, true), trans: dv.getUint16(o + 8, true), amount: dv.getInt16(o + 4, true) });
    }
    return { gens, mods };
  };
  const range = (z: Zone, op: number): [number, number] => { const r = z.gens.get(op); return r === undefined ? [0, 127] : [r & 0xff, r >> 8]; };
  const s16 = (z: Zone, op: number) => { const r = z.gens.get(op) ?? 0; return r >= 0x8000 ? r - 0x10000 : r; };
  const nP = pdta.phdr.size / REC.phdr - 1;
  let pi = -1; for (let i = 0; i < nP; i++) if (u16(pdta.phdr, REC.phdr, i, 22) === bank && u16(pdta.phdr, REC.phdr, i, 20) === program) { pi = i; break; }
  if (pi < 0) return null;
  const regions: CurveRegion[] = [];
  let pGlob: Zone | undefined;
  for (let z = bagOf("phdr", pi); z < bagOf("phdr", pi + 1); z++) {
    const pz = zone("pbag", "pgen", "pmod", z, pGlob), inst = pz.gens.get(GEN_INSTRUMENT);
    if (inst === undefined) { if (z === bagOf("phdr", pi)) pGlob = pz; continue; }
    const [pk0, pk1] = range(pz, KEY_RANGE), [pv0, pv1] = range(pz, VEL_RANGE);
    let iGlob: Zone | undefined;
    for (let iz = bagOf("inst", inst); iz < bagOf("inst", inst + 1); iz++) {
      const zz = zone("ibag", "igen", "imod", iz, iGlob);
      if (!zz.gens.has(GEN_SAMPLE_ID)) { if (iz === bagOf("inst", inst)) iGlob = zz; continue; }
      const [k0, k1] = range(zz, KEY_RANGE), [v0, v1] = range(zz, VEL_RANGE);
      if (k1 < pk0 || k0 > pk1 || v1 < pv0 || v0 > pv1) continue;   // 同 tsf.h：预设区的键 / 力度范围是筛子
      const mods: AttMod[] = [{ src: 0x0502, amtSrc: 0, trans: 0, amount: 960 }];   // 默认的「力度 → 衰减」；乐器一级同源的只换量、预设一级同源的量相加（量 0 跳过）
      for (const m of zz.mods) { const j = mods.findIndex((x) => x.src === m.src && x.amtSrc === m.amtSrc); if (j >= 0) mods[j] = { ...mods[j]!, amount: m.amount }; else if (mods.length < 8) mods.push({ ...m }); }
      for (const m of pz.mods) { if (m.amount === 0) continue; const j = mods.findIndex((x) => x.src === m.src && x.amtSrc === m.amtSrc); if (j >= 0) mods[j] = { ...mods[j]!, amount: mods[j]!.amount + m.amount }; else if (mods.length < 8) mods.push({ ...m }); }
      const g = (s16(zz, ATT) + s16(pz, ATT)) * 0.04;
      regions.push({ lokey: Math.max(k0, pk0), hikey: Math.min(k1, pk1), lovel: Math.max(v0, pv0), hivel: Math.min(v1, pv1), genDb: g < -144 ? -144 : g > 144 ? 144 : g, mods });
    }
  }
  const byKey = new Map<number, CurveRegion[]>();   // 按键懒算、算过的记着
  const onKey = (key: number) => { let r = byKey.get(key); if (!r) { r = regions.filter((x) => key >= x.lokey && key <= x.hikey); byKey.set(key, r); } return r; };
  const sounding = (key: number, vel: number) => { const v = Math.trunc(vel); return onKey(key).filter((r) => v >= r.lovel && v <= r.hivel).map((r) => regionAtt(r, key, vel)); };
  return {
    regions: sounding,
    at(key, vel) { const a = sounding(key, vel); if (!a.length) return null; return a.length === 1 ? -a[0]! : 10 * Math.log10(a.reduce((s, x) => s + 10 ** (-x / 10), 0)); },
  };
}
