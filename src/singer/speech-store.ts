// speech-store.ts —— 念缓存的持久层：全局池（跨歌共用），IndexedDB `moonsinger-speech`，住在月读的 worker 里。
// created 2026-10-10 by Claude Fable 5.1
// user 2026-10-10「代价约每首32MB 建议一个全局池by key and model config hash而不是每首歌」（之前两次问过「念缓存持久化到 IDB 要不要做」）。
// · 可再生派生缓存（家规：逐案批 = 这一条；独立 DB、MoonSinger 自己前缀、不进 store、全删无损——重念就回来）。
// · 键 = 模型配置（语音包 + 运行时包的 packId，模型换了旧键自然不命中）+ 内容键的 sha256（内容键 = 音素 id / 韵律 / 念的参数 / 分析参数，见 speech-cache.ts）；
//   值 = 念的音频（Float32）或分析（f0 Float64 + sp / ap bf16）；每条带 bytes / at（最近用过）；超预算按 at 淘汰最久没用的。
// · 字节不离开设备；主线程只看大小 / 清空（设置里）。没有 IndexedDB（node / 被禁）= 只用内存，唱照常。

export type StoredEntry =
  | { kind: "p"; k: string; bytes: number; audio: Float32Array; durations?: Float32Array }
  | { kind: "a"; k: string; bytes: number; meta: Record<string, unknown>; f0: Float64Array; sp: Uint16Array; ap: Uint16Array };
export interface SpeechStore {
  get(key: string): Promise<StoredEntry | null>;
  /** 写一条（同键覆盖）；写完超预算 = 淘汰最久没用的（不淘汰刚写的这条）。 */
  put(key: string, e: StoredEntry): Promise<void>;
  /** 以 prefix 开头的全部（同一句念的几份分析）。 */
  scan(prefix: string): Promise<{ key: string; e: StoredEntry }[]>;
  touch(key: string): Promise<void>;
  info(): Promise<{ bytes: number; entries: number; budget: number }>;
  clear(): Promise<void>;
  setBudget(b: number): void;
}

type Rec = { key: string; at: number } & StoredEntry;
const STORE = "entries", META = "meta", DB_VERSION = 1;

const req = <T>(r: IDBRequest<T>): Promise<T> => new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error ?? new Error("idb")); });
const done = (tx: IDBTransaction): Promise<void> => new Promise((ok, fail) => { tx.oncomplete = () => ok(); tx.onerror = () => fail(tx.error ?? new Error("idb tx")); tx.onabort = () => fail(tx.error ?? new Error("idb abort")); });
const strip = (r: Rec): StoredEntry => { const { key: _k, at: _a, ...e } = r; void _k; void _a; return e as StoredEntry; };

/** 打开（没有 IndexedDB / 打不开 = null，调用方退回只用内存）。 */
export async function openSpeechStore(name: string, budget: number): Promise<SpeechStore | null> {
  const idb = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  if (!idb) return null;
  let db: IDBDatabase;
  try {
    db = await new Promise<IDBDatabase>((ok, fail) => {
      const r = idb.open(name, DB_VERSION);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "key" }).createIndex("at", "at"); if (!d.objectStoreNames.contains(META)) d.createObjectStore(META, { keyPath: "key" }); };
      r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error ?? new Error("idb open")); r.onblocked = () => fail(new Error("idb blocked"));
    });
  } catch { return null; }
  let budgetNow = budget;
  const total = async (tx: IDBTransaction): Promise<number> => ((await req(tx.objectStore(META).get("total"))) as { bytes?: number } | undefined)?.bytes ?? 0;
  const setTotal = (tx: IDBTransaction, bytes: number) => tx.objectStore(META).put({ key: "total", bytes: Math.max(0, bytes) });
  return {
    async get(key) {
      const tx = db.transaction(STORE, "readonly"), r = (await req(tx.objectStore(STORE).get(key))) as Rec | undefined;
      return r ? strip(r) : null;
    },
    async put(key, e) {
      const tx = db.transaction([STORE, META], "readwrite"), s = tx.objectStore(STORE);
      const old = (await req(s.get(key))) as Rec | undefined;
      let t = (await total(tx)) - (old?.bytes ?? 0) + e.bytes;
      s.put({ key, at: Date.now(), ...e } satisfies Rec);
      if (t > budgetNow) {   // 淘汰最久没用的，直到预算内（刚写的这条不动）
        const cur = s.index("at").openCursor();
        await new Promise<void>((ok, fail) => {
          cur.onerror = () => fail(cur.error ?? new Error("idb cursor"));
          cur.onsuccess = () => { const c = cur.result; if (!c || t <= budgetNow) { ok(); return; } const r = c.value as Rec; if (r.key !== key) { t -= r.bytes; c.delete(); } c.continue(); };
        });
      }
      setTotal(tx, t);
      await done(tx);
    },
    async scan(prefix) {
      const tx = db.transaction(STORE, "readonly");
      const rs = (await req(tx.objectStore(STORE).getAll(IDBKeyRange.bound(prefix, prefix + "￿")))) as Rec[];
      return rs.map((r) => ({ key: r.key, e: strip(r) }));
    },
    async touch(key) {
      const tx = db.transaction(STORE, "readwrite"), s = tx.objectStore(STORE), r = (await req(s.get(key))) as Rec | undefined;
      if (r) { r.at = Date.now(); s.put(r); }
      await done(tx);
    },
    async info() {
      const tx = db.transaction([STORE, META], "readonly");
      const [bytes, entries] = await Promise.all([total(tx), req(tx.objectStore(STORE).count())]);
      return { bytes, entries, budget: budgetNow };
    },
    async clear() {
      const tx = db.transaction([STORE, META], "readwrite"); tx.objectStore(STORE).clear(); setTotal(tx, 0); await done(tx);
    },
    setBudget(b) { budgetNow = b; },
  };
}

/** 内存版（测试 / 没有 IndexedDB 时想要同样语义的地方）。 */
export function memorySpeechStore(budget: number): SpeechStore {
  const m = new Map<string, Rec>(); let bytes = 0, budgetNow = budget;
  return {
    async get(key) { const r = m.get(key); return r ? strip(r) : null; },
    async put(key, e) {
      const old = m.get(key); if (old) { bytes -= old.bytes; m.delete(key); }
      m.set(key, { key, at: Date.now(), ...e }); bytes += e.bytes;
      if (bytes > budgetNow) for (const [k, r] of [...m].sort((a, b) => a[1].at - b[1].at)) { if (bytes <= budgetNow) break; if (k === key) continue; m.delete(k); bytes -= r.bytes; }
    },
    async scan(prefix) { return [...m].filter(([k]) => k.startsWith(prefix)).map(([key, r]) => ({ key, e: strip(r) })); },
    async touch(key) { const r = m.get(key); if (r) r.at = Date.now(); },
    async info() { return { bytes, entries: m.size, budget: budgetNow }; },
    async clear() { m.clear(); bytes = 0; },
    setBudget(b) { budgetNow = b; },
  };
}
