// sound-cache.ts —— 音源库文件（sf2 等）的缓存：本次打开的内存 + 持久的 Cache Storage `pwa-sounds`（按 sha256 存；和 AI 模型的 `pwa-models` 分开——音源不是 AI 模型）。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「为什么每次加乐器都会重新下一下GS，也许我们还是做一个cache比较好？」「我觉得还是idb有缓存吧，可以缓存指定的包，不然没网的时候很麻烦」。
// · 用的是 Cache Storage 不是 IndexedDB：和模型包同一种机制（iOS 上验证过、按字节存取最省事）；对「没网也能用」的目的一样。
// · 家族共享名 `pwa-sounds`（同域名的兄弟 app 以后也能用同一份 GeneralUser）；app 的「清缓存」不碰它，只在设置里逐条删（家规：共享缓存只能逐包删）。
// · 信任根仍是 app 内嵌目录钉的 sha256：存进去前核过，取出来再核一次（几十毫秒，换一句「字节到手先核」的踏实）。
// · 没有 Cache API（file:// / 隐私模式）= 只有内存，静默降级（这次打开里不重下，下次重下）。
const CACHE = "pwa-sounds";
const keyOf = (sha256: string) => `${location.origin}/__pwa-sounds__/${sha256}`;
const MEM_MAX = 2;   // 内存里最多留几份整包（32 MB 一份）
const memory = new Map<string, Uint8Array>();

const hasCaches = () => typeof caches !== "undefined";
const sha256Hex = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as unknown as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");

function rememberInMemory(sha256: string, bytes: Uint8Array): void {
  memory.delete(sha256); memory.set(sha256, bytes);
  while (memory.size > MEM_MAX) memory.delete(memory.keys().next().value!);
}
/** 内存 → 持久缓存；都没有 = null。持久缓存里的字节先核 sha256 再给（不对 = 删掉、当没有）。 */
export async function cachedSound(sha256: string): Promise<Uint8Array | null> {
  const m = memory.get(sha256); if (m) { rememberInMemory(sha256, m); return m; }
  if (!hasCaches()) return null;
  try {
    const c = await caches.open(CACHE), r = await c.match(keyOf(sha256)); if (!r) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    if ((await sha256Hex(bytes)) !== sha256) { await c.delete(keyOf(sha256)); return null; }
    rememberInMemory(sha256, bytes); return bytes;
  } catch { return null; }
}
/** 记住一份已核过 sha256 的字节：内存一定；persist = 也进持久缓存（留着离线用）。 */
export async function rememberSound(sha256: string, bytes: Uint8Array, persist: boolean): Promise<void> {
  rememberInMemory(sha256, bytes);
  if (!persist || !hasCaches()) return;
  try { const c = await caches.open(CACHE); await c.put(keyOf(sha256), new Response(bytes as unknown as BodyInit, { headers: { "Content-Type": "application/octet-stream", "Content-Length": String(bytes.length) } })); } catch { /* 配额不够等：只在内存里 */ }
}
/** 持久缓存里有哪些（sha256 + 大小）。 */
export async function listCachedSounds(): Promise<{ sha256: string; bytes: number }[]> {
  if (!hasCaches()) return [];
  try {
    const c = await caches.open(CACHE), keys = await c.keys(), out: { sha256: string; bytes: number }[] = [];
    for (const k of keys) {
      const sha256 = k.url.slice(k.url.lastIndexOf("/") + 1), r = await c.match(k);
      out.push({ sha256, bytes: Number(r?.headers.get("Content-Length") ?? 0) });
    }
    return out;
  } catch { return []; }
}
export async function isSoundPersisted(sha256: string): Promise<boolean> {
  if (!hasCaches()) return false;
  try { return !!(await (await caches.open(CACHE)).match(keyOf(sha256))); } catch { return false; }
}
/** 从持久缓存和内存里都删掉（人删的）。 */
export async function forgetSound(sha256: string): Promise<void> {
  memory.delete(sha256);
  if (!hasCaches()) return;
  try { await (await caches.open(CACHE)).delete(keyOf(sha256)); } catch { /* 没有就算了 */ }
}
/** 放掉内存里的整包（user「你需要能手动释放缓存空间」）；持久缓存不动。 */
export function releaseSoundMemory(): void { memory.clear(); }
/** 内存里现在占着多少字节（整包）。 */
export function soundMemoryBytes(): number { let n = 0; for (const b of memory.values()) n += b.length; return n; }
