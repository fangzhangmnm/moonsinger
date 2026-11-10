// render-cache-idb.ts —— 渲染缓存（src/app/render-cache.ts）在浏览器里的存储口：一个单独的设备库（IndexedDB）。created 2026-11-10 by Claude Fable 5.2
//   库名 = `config.ts CACHE_DBS.renders`（<app>-<guid>.renders，家族命名规矩：前缀就是归属）。可再生派生缓存，user 2026-11-09 批（「软件在设备上记着不就行了？…相当于记着的是缓存同意」）；
//   CLAUDE.md 持久层白名单表登记、test/storage-whitelist.test.mjs 守；还原出厂时一起清（src/app/factory-reset.ts OWN_DBS）。
//   三张表：meta（记录，不带字节：开机只读这张就知道记着哪些）/ bytes（mp3 字节，按 key）/ links（歌库里的身份 → 记录 + 文件戳）。
//   没有 IndexedDB / 打不开（隐私模式、配额）= 抛给上层：上层退回只在这次打开里记着（memoryRenderStore），照常能用。
import { CACHE_DBS } from "../config.ts";
import type { RenderCacheStore, RenderLink, RenderMeta } from "./render-cache.ts";

const RENDERS_DB = CACHE_DBS.renders, VERSION = 1;
const linkId = (home: string, identifier: string): string => `${home}\n${identifier}`;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(RENDERS_DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      if (!db.objectStoreNames.contains("bytes")) db.createObjectStore("bytes");
      if (!db.objectStoreNames.contains("links")) db.createObjectStore("links", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("[render-cache] cannot open the device cache"));
    req.onblocked = () => reject(new Error("[render-cache] the device cache is blocked by another tab"));
  });
}
const done = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error("[render-cache] transaction aborted")); });
const got = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });

/** 浏览器里的存储口。库懒开（第一次用才开；开过就留着这一个连接）。 */
export function idbRenderStore(): RenderCacheStore {
  let dbp: Promise<IDBDatabase> | null = null;
  const db = (): Promise<IDBDatabase> => (dbp ??= openDb().catch((e) => { dbp = null; throw e; }));
  return {
    async load() {
      const d = await db(), tx = d.transaction(["meta", "links"], "readonly");
      const [metas, links] = await Promise.all([got(tx.objectStore("meta").getAll() as IDBRequest<RenderMeta[]>), got(tx.objectStore("links").getAll() as IDBRequest<(RenderLink & { id: string })[]>)]);
      return { metas, links: links.map(({ id: _id, ...l }) => l) };
    },
    async put(meta, bytes) {
      const d = await db(), tx = d.transaction(["meta", "bytes"], "readwrite");
      tx.objectStore("meta").put(meta); tx.objectStore("bytes").put(bytes, meta.key);
      await done(tx);
    },
    async bytes(key) { const d = await db(); const v = await got(d.transaction("bytes", "readonly").objectStore("bytes").get(key) as IDBRequest<Uint8Array | undefined>); return v ? new Uint8Array(v) : null; },
    async touch(meta) { const d = await db(), tx = d.transaction("meta", "readwrite"); tx.objectStore("meta").put(meta); await done(tx); },
    async remove(key) { const d = await db(), tx = d.transaction(["meta", "bytes"], "readwrite"); tx.objectStore("meta").delete(key); tx.objectStore("bytes").delete(key); await done(tx); },
    async putLink(link) { const d = await db(), tx = d.transaction("links", "readwrite"); tx.objectStore("links").put({ ...link, id: linkId(link.home, link.identifier) }); await done(tx); },
    async removeLink(home, identifier) { const d = await db(), tx = d.transaction("links", "readwrite"); tx.objectStore("links").delete(linkId(home, identifier)); await done(tx); },
    async clear() { const d = await db(), tx = d.transaction(["meta", "bytes", "links"], "readwrite"); for (const s of ["meta", "bytes", "links"]) tx.objectStore(s).clear(); await done(tx); },
  };
}
