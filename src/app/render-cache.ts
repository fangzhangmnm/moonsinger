// render-cache.ts —— 这台设备上记着的渲好的声音（「渲染缓存」）。created 2026-11-10 by Claude Fable 5.2
//   user 2026-11-09：「不是说渲染 MP 三，而是说完全不应该保管理 MP 三…因为你要管理 MP3，又要管理原文件，这就很乱，而且有重复，容易误删误看」
//   「哎，可以啊，软件在设备上记着不就行了？…相当于记着的是缓存同意」（= 家规「可再生派生缓存逐案批」的那一句批准）
//   「我们真正托底的是这份谱子…当年的声音确实不用太焦虑」；11-10：「对，以后统一不存mp3，旧的也删掉」「以及本地歌缓存？最好能有锁屏播放？这样我可以听歌」。
//   设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md 第九节。
//
// 它是什么：一份**清了能重来**的设备缓存（数据公民等级 = 三等「可再得」：歌在，再渲一遍就有）。不是作品、不同步、不进歌库的文件列表、人看不到任何多出来的文件。
//   存 = 贴好标签的 mp3 字节（歌名 / 作者 / 许可 / 署名 / 封面，就是导出给出去的那一份）+ 一小条记录。
// 钥匙分两层：
//   · 准的一层 `keyOf`：出声内容的指纹（src/format/final.ts contentFingerprint）+ 音质 + 进了哪些声部 + 标签上的歌名。内容没变 → 再导出、再分享直接拿。
//   · 快的一层「挂名」`link`：歌库里的身份 → 哪一条记录 + 那一刻这个文件的「戳」（歌库宿主按文件的总目录现算，文件每存一次都变）。
//       歌库不用打开歌：卡片上的文件戳 = 挂名时记的戳 → 这份声音就是这个文件的。戳对不上 = 文件在别处被改过 / 存过了，这个挂名不算数（不删，等下一次在歌里存 / 渲的时候重新挂）。
// 上限：最近用过的 N 首（main.ts 给 20；user 11-09「同意」），超了丢最久没用的，挂在它上面的名一起丢。
// 记录里记着是哪一版渲染核心渲的（core）：歌库里听不挑版本（「当年的声音不用太焦虑」）；导出 / 分享要不要认旧版本渲的由调用方定（main.ts：核心变了就重渲）。
// 纯逻辑 + 注入的存储口：node 直测（test/render-cache.test.ts）；浏览器里的存储 = src/app/render-cache-idb.ts。
import { sha256TextSync } from "../format/sha256-sync.ts";

/** 歌文件的「戳」= 它的总目录（`.moonsinger/manifest.json`）文本的哈希。总目录里记着存的时刻，文件每存一次都变；歌库尾读一次就拿得到，不用打开歌。
 *  编辑器这头（存完之后）和歌库那头（列卡片的时候）算的是同一个函数，才对得上。 */
export const stampOf = (manifestText: string): string => sha256TextSync(manifestText).slice(0, 32);
/** 总目录在歌文件（zip）里的位置。 */
export const MANIFEST_ENTRY = ".moonsinger/manifest.json";

export interface RenderMeta {
  key: string;
  fingerprint: string;
  quality: string;
  /** 进了这份声音的声部 id（排过序）。 */
  parts: string[];
  /** 真出了声的角色 id（署名推演用）。 */
  roles: string[];
  secs: number; kbps: number; stereo: boolean;
  /** 循环那一圈在这份声音里的起止秒（按谱：第一张纸头 / 循环段头 → 谱的结尾，不含余音；src/core/render.ts loopSpanOf）。
   *  2026-11-11 起渲的才有；没有（之前渲的、老文件里搬来的）= 歌库循环按整个文件绕（要等余音放完）。 */
  loop?: { start: number; end: number };
  /** mp3 的字节数（带标签）。 */
  size: number;
  /** 标签上写的歌名（没有歌名时 = 文件名）。 */
  title: string;
  /** 渲的时刻 / 最近一次用的时刻（毫秒）。 */
  at: number; used: number;
  /** 渲的时候的 app 版本和渲染核心。 */
  app: string; core: { version: string; hash: string };
}
/** 歌库里的一个身份挂在哪条记录上。home = 哪个家（网盘 = "default"，文件夹 = 它的 id；同名的歌在两个家里不是一回事）。 */
export interface RenderLink { home: string; identifier: string; key: string; stamp: string }
/** 存储口（浏览器 = IndexedDB；测试 = 内存）。 */
export interface RenderCacheStore {
  load(): Promise<{ metas: RenderMeta[]; links: RenderLink[] }>;
  put(meta: RenderMeta, bytes: Uint8Array): Promise<void>;
  bytes(key: string): Promise<Uint8Array | null>;
  touch(meta: RenderMeta): Promise<void>;
  remove(key: string): Promise<void>;
  putLink(link: RenderLink): Promise<void>;
  removeLink(home: string, identifier: string): Promise<void>;
  clear(): Promise<void>;
}
export interface RenderCache {
  /** 索引装好了（开机后空闲时装一次；装好之前 find / linkOf 都是空的 = 当没记着）。 */
  ready(): Promise<void>;
  keyOf(o: { fingerprint: string; quality: string; parts: readonly string[]; title: string }): string;
  /** 这一条记着吗（只看索引，同步）。 */
  find(key: string): RenderMeta | null;
  /** 同一份内容（指纹）记着的里面最近用过的那一条（不挑音质 / 声部；歌库里听用它）。同步。 */
  latestFor(fingerprint: string): RenderMeta | null;
  /** 取出字节（顺便记一次「用过」）。索引里有、字节却没了 = 这条作废、回 null。 */
  take(key: string): Promise<{ meta: RenderMeta; bytes: Uint8Array } | null>;
  /** 记下一份刚渲好的（超了上限丢最久没用的）。存不进去 = 抛给调用方（它照常把声音给人，只是下次要重渲）。 */
  put(meta: Omit<RenderMeta, "key" | "size" | "at" | "used">, bytes: Uint8Array): Promise<RenderMeta>;
  /** 歌库里的这个身份现在挂着哪条记录（没有 / 那条记录已经丢了 = null）。同步。 */
  linkOf(home: string, identifier: string): (RenderLink & { meta: RenderMeta }) | null;
  /** 挂名：这个身份的文件（此刻的戳）就是这条记录的内容。记录不在 = 不挂、回 false。 */
  link(home: string, identifier: string, key: string, stamp: string): Promise<boolean>;
  unlink(home: string, identifier: string): Promise<void>;
  /** 身份换了名字（改名 / 挪夹）：挂名跟过去（戳不变：字节没动）。 */
  renamed(home: string, from: string, to: string): Promise<void>;
  /** 设置页显示用。 */
  stats(): { count: number; bytes: number; max: number };
  /** 设置页的列表（v0.16.101，user 11-11「看得见、删得掉 同意」）：每条记录 + 挂在它名下的歌库身份；最近用过的在前。同步。 */
  list(): { meta: RenderMeta; links: RenderLink[] }[];
  /** 删一条（字节 + 挂在它名下的名字一起）。 */
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  /** 索引变了（多了一条 / 丢了一条 / 挂名变了）→ 回调（歌库卡片上的 ▶ 跟着重算）。 */
  onChange(fn: () => void): () => void;
}

const linkId = (home: string, identifier: string): string => `${home}\n${identifier}`;

export function createRenderCache(store: RenderCacheStore, o: { max: number; now: () => number; report?: (e: unknown) => void }): RenderCache {
  const metas = new Map<string, RenderMeta>(), links = new Map<string, RenderLink>();
  const fns = new Set<() => void>();
  const changed = (): void => { for (const f of fns) { try { f(); } catch { /* 监听者出错不许影响缓存 */ } } };
  const soft = (p: Promise<unknown>): Promise<void> => p.then(() => undefined, (e) => { o.report?.(e); });   // 记不进 / 删不掉：缓存而已，报进黑匣子、不拦人
  let loading: Promise<void> | null = null;
  function ready(): Promise<void> {
    loading ??= store.load().then((d) => {
      for (const m of d.metas) if (!metas.has(m.key)) metas.set(m.key, m);
      for (const l of d.links) { const id = linkId(l.home, l.identifier); if (!links.has(id)) links.set(id, l); }
      changed();
    }, (e) => { o.report?.(e); });   // 读不出来 = 当空的用（下次渲了再记）
    return loading;
  }
  async function drop(key: string): Promise<void> {
    metas.delete(key);
    for (const [id, l] of links) if (l.key === key) { links.delete(id); await soft(store.removeLink(l.home, l.identifier)); }
    await soft(store.remove(key));
  }
  async function evict(): Promise<void> {
    while (metas.size > o.max) {
      let oldest: RenderMeta | null = null;
      for (const m of metas.values()) if (!oldest || m.used < oldest.used) oldest = m;
      if (!oldest) return;
      await drop(oldest.key);
    }
  }
  return {
    ready,
    keyOf: (k) => JSON.stringify([k.fingerprint, k.quality, [...k.parts].sort(), k.title]),
    find: (key) => metas.get(key) ?? null,
    latestFor: (fingerprint) => { let best: RenderMeta | null = null; for (const m of metas.values()) if (m.fingerprint === fingerprint && (!best || m.used > best.used)) best = m; return best; },
    async take(key) {
      await ready();
      const meta = metas.get(key); if (!meta) return null;
      let bytes: Uint8Array | null = null;
      try { bytes = await store.bytes(key); } catch (e) { o.report?.(e); }
      if (!bytes || bytes.length !== meta.size) { await drop(key); changed(); return null; }   // 字节没了 / 对不上：这条作废（清了能重来）
      meta.used = o.now(); await soft(store.touch(meta));
      return { meta, bytes };
    },
    async put(m, bytes) {
      await ready();
      const t = o.now();
      const meta: RenderMeta = { ...m, parts: [...m.parts].sort(), key: JSON.stringify([m.fingerprint, m.quality, [...m.parts].sort(), m.title]), size: bytes.length, at: t, used: t };
      await store.put(meta, bytes);
      metas.set(meta.key, meta);
      await evict();
      changed();
      return meta;
    },
    linkOf(home, identifier) {
      const l = links.get(linkId(home, identifier)); if (!l) return null;
      const meta = metas.get(l.key); return meta ? { ...l, meta } : null;
    },
    async link(home, identifier, key, stamp) {
      await ready();
      if (!metas.has(key)) return false;
      const l: RenderLink = { home, identifier, key, stamp }, cur = links.get(linkId(home, identifier));
      if (cur && cur.key === key && cur.stamp === stamp) return true;
      links.set(linkId(home, identifier), l);
      await soft(store.putLink(l));
      changed();
      return true;
    },
    async unlink(home, identifier) {
      await ready();
      if (!links.delete(linkId(home, identifier))) return;
      await soft(store.removeLink(home, identifier));
      changed();
    },
    async renamed(home, from, to) {
      await ready();
      const l = links.get(linkId(home, from)); if (!l) return;
      links.delete(linkId(home, from)); await soft(store.removeLink(home, from));
      const next: RenderLink = { ...l, identifier: to };
      links.set(linkId(home, to), next); await soft(store.putLink(next));
      changed();
    },
    stats: () => { let bytes = 0; for (const m of metas.values()) bytes += m.size; return { count: metas.size, bytes, max: o.max }; },
    list: () => [...metas.values()].sort((a, b) => b.used - a.used).map((meta) => ({ meta, links: [...links.values()].filter((l) => l.key === meta.key) })),
    async remove(key) { await ready(); if (!metas.has(key)) return; await drop(key); changed(); },
    async clear() { await ready(); metas.clear(); links.clear(); await store.clear(); changed(); },
    onChange: (fn) => { fns.add(fn); return () => fns.delete(fn); },
  };
}

/** 内存里的存储口（测试用；浏览器里没有 IndexedDB 时也用它 = 只在这次打开里记着）。 */
export function memoryRenderStore(): RenderCacheStore {
  const metas = new Map<string, RenderMeta>(), blobs = new Map<string, Uint8Array>(), links = new Map<string, RenderLink>();
  return {
    load: async () => ({ metas: [...metas.values()].map((m) => ({ ...m })), links: [...links.values()].map((l) => ({ ...l })) }),
    put: async (m, b) => { metas.set(m.key, { ...m }); blobs.set(m.key, b); },
    bytes: async (k) => blobs.get(k) ?? null,
    touch: async (m) => { if (metas.has(m.key)) metas.set(m.key, { ...m }); },
    remove: async (k) => { metas.delete(k); blobs.delete(k); },
    putLink: async (l) => { links.set(linkId(l.home, l.identifier), { ...l }); },
    removeLink: async (h, i) => { links.delete(linkId(h, i)); },
    clear: async () => { metas.clear(); blobs.clear(); links.clear(); },
  };
}
