// sounds.ts —— 音源从哪来 + 弱引用怎么解析（家族音源库 pwa-sounds = 黄线白名单 ③：只读 GET、到手核目录钉的 sha256；ADR-0006 ③ 反弃坑：出厂预填、设置里能改）。
// created 2026-10-15 by Claude Fable 5.1（刀 4 音源来源接缝：从 src/app/main.ts 原样搬来，行为不变；user 2026-10-08「我后悔自动 embed 音源了，改成弱引用吧，app 可以自己找吗」）。
//   解析链：歌里嵌的 → 本次已解析的（session）→ 设备留着的子集 → 设备留着的整包 / 家族音源库（按整包 sha256 对条目）→ 切子集核 sha256 → 都没有 = 抛错（没人上场、报出来、人换；不替补）。
import { SOUNDS, SOUNDS_SOURCE_DEFAULT, type SoundEntry } from "../gm/sounds.gen.ts";
import { cachedSound, rememberSound } from "../gm/sound-cache.ts";
import { subsetSf2 } from "../gm/sf2-subset.ts";
import type { GmCandidate } from "../format/project.ts";
import { sha256Hex } from "./sha256.ts";

export interface SoundSources {
  /** 设置里填的音源库来源（这次打开里有效；空 = 出厂默认）。 */
  source: string;
  /** 逐个试的地址：同一个网站下的 pwa-sounds/ 先，再设置里的。 */
  bases(): string[];
  /** 从音源库拿一个文件：逐个地址试，流式读（报进度），到手对目录里钉的 sha256（不对 = 不用、报出来）；核过才留在设备上。 */
  fetchSound(e: SoundEntry, onProgress: (done: number) => void): Promise<Uint8Array>;
  /** 拿到一个 SoundFont 候选的子集字节（弱引用解析链）；都找不到 = 抛错。 */
  resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
  /** 本次打开里解析到 / 加进来的子集（subsetSha256 → 字节）：keep = 记下（马上能响）；drop = 忘掉（人给了新文件，下次重新解析）。 */
  session: { keep(sha256: string, bytes: Uint8Array): void; drop(sha256: string): void; has(sha256: string): boolean; get(sha256: string): Uint8Array | undefined };
}

export function createSoundSources(o: { progress(msg: string): void; /** 报错里提到的「谁」：光标所在声部的名字（原来的措辞）。 */ roleLabel(): string }): SoundSources {
  // 音源库（pwa-sounds）同样一套：先找同源 pwa-sounds/，再用设置里的；只在这次打开里有效
  let source = SOUNDS_SOURCE_DEFAULT;
  const bases = () => [...new Set([new URL("pwa-sounds", location.href).href, source.trim().replace(/\/+$/, "") || SOUNDS_SOURCE_DEFAULT])];
  /** 弱引用解析到的子集（本次打开；subsetSha256 → 字节）。 */
  const session = new Map<string, Uint8Array>();
  /** 从音源库拿一个文件：逐个地址试，流式读（报进度），到手对目录里钉的 sha256（不对 = 不用、报出来）。 */
  async function fetchSound(e: SoundEntry, onProgress: (done: number) => void): Promise<Uint8Array> {
    const hit = await cachedSound(e.sha256); if (hit) return hit;   // 本次内存 / 持久缓存 `pwa-sounds`（user「可以缓存指定的包，不然没网的时候很麻烦」）
    let last = "";
    for (const base of bases()) {
      try {
        const res = await fetch(`${base}/${e.file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const out = new Uint8Array(e.bytes); let o = 0;
        const rd = res.body?.getReader();
        if (!rd) { const b = new Uint8Array(await res.arrayBuffer()); if (b.length !== e.bytes) throw new Error(`大小不对（${b.length} ≠ ${e.bytes}）`); out.set(b); o = b.length; }
        else for (;;) { const { done, value } = await rd.read(); if (done) break; if (o + value.length > e.bytes) throw new Error("比目录里说的大"); out.set(value, o); o += value.length; onProgress(o); }
        if (o !== e.bytes) throw new Error(`大小不对（${o} ≠ ${e.bytes}）`);
        const got = await sha256Hex(out);
        if (got !== e.sha256) throw new Error(`内容和目录里钉的不一样（sha256 ${got.slice(0, 12)}… ≠ ${e.sha256.slice(0, 12)}…），没有用它`);
        await rememberSound(e.sha256, out, true);   // 核过了才留；第一次下载就留在设备上（user「每次加乐器都会重新下一下GS」）
        return out;
      } catch (err) { last = `${base}：${(err as Error).message}`; }
    }
    throw new Error(`「${e.name}」拿不到（试过 ${bases().join("、")}）。最后一次：${last}。可以在设置里换音源库来源，或从本机 .sf2 文件选。`);
  }
  /** 拿到一个 SoundFont 候选的子集字节（契约 Sf2Source）：歌里嵌的 → 本次已解析的 → 弱引用去找整包（本次内存 / 持久缓存 / 家族音源库按整包 sha256 对条目）→ 切子集、核 sha256。
   *  都找不到 = 抛错（没人上场、报出来、人换 = 换人的窄接口）；人也可以在歌手牌里「找文件…」把整包给它。 */
  async function resolveGmBytes(g: GmCandidate): Promise<Uint8Array> {
    if (g.bytes) return g.bytes;
    if (g.path) throw new Error(`「${g.name}」的声音（${g.path}）没随这首歌带来`);
    const have = session.get(g.subsetSha256); if (have) return have;
    const kept = await cachedSound(g.subsetSha256);   // 设备上留着的子集（自己的 .sf2 加进来时 / 解包时留的；按子集 sha256 存，取出来核过）
    if (kept) { session.set(g.subsetSha256, kept); return kept; }
    let bank = await cachedSound(g.origin.fileSha256);
    if (!bank) {
      const e = Object.values(SOUNDS).find((x) => x.sha256 === g.origin.fileSha256);
      if (e) { try { bank = await fetchSound(e, (done) => o.progress(`找「${g.name}」的声音：下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`)); } finally { o.progress(""); } }
    }
    if (!bank) throw new Error(`「${g.name}」的声音没随歌带（弱引用），这台设备和家族音源库里也没有它来自的「${g.origin.name}」（sha256 ${g.origin.fileSha256.slice(0, 12)}…）。点谱前面的「${o.roleLabel()}」，给它「找文件…」，或换一个「谁来演」`);
    const subset = subsetSf2(bank, [{ bank: g.bank, program: g.program }]), sha = await sha256Hex(subset);
    if (sha !== g.subsetSha256) throw new Error(`从「${g.origin.name}」切出来的「${g.name}」和歌里记的不一样（sha256 ${sha.slice(0, 12)}… ≠ ${g.subsetSha256.slice(0, 12)}…），没有用它`);
    session.set(g.subsetSha256, subset);
    return subset;
  }
  return {
    get source() { return source; },
    set source(v: string) { source = v.trim() || SOUNDS_SOURCE_DEFAULT; },
    bases, fetchSound, resolveGmBytes,
    session: { keep: (k, b) => { session.set(k, b); }, drop: (k) => { session.delete(k); }, has: (k) => session.has(k), get: (k) => session.get(k) },
  };
}
