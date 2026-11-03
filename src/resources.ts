// resources.ts —— 资源读口：「同站点那一份」字节，核过哈希才交出。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 7 步；规则书 §1 第 7 条 / §3 / §3.5）
//   来源自己挑（调用者不问是哪种部署）：
//     官网 / itch = fetch 站点里那个路径（itch 的 zip 里自带一份，同站点先找——src/sources/*.ts 的 bases() 第一个就是它）；
//     备用版（双击打开的文件夹）= 老实脚本：插 <script src="<站内路径>.data.js">（一行 `(self.__pwaData ??= {})["<站内路径>"] = "<base64>";`），
//       载完取字符串、**立刻 delete 掉那个键** → base64 解码 → sha256 → 对上了才交出；file: 写不进 Cache，**文件夹本身就是缓存**，不另存。
//       大于 24 MiB 的文件照 pwa-models 切片：`<站内路径>.<k>.data.js`，键 `<站内路径>#<k>`。
//   哈希从哪来：调用者给（模型包分片 = packs.gen.ts、音源 = sounds.gen.ts、乐器目录 = instruments.gen.ts，都是 app 里钉的）；
//     没给的 app 自带文件（字体、元音表、wasm）在备用版里按打包时记进 index.html 的清单核（和代码同一份信任），官网 / itch 照旧不核（同源的 app 文件）。
//   文件不在 / 哈希不对 = 和官网下载失败同一种错：如实报，不替补（家规）。
import { deployment } from "./deployment.ts";
import { Sha256 } from "@internal/model-packs";

interface LocalEntry { sha256: string; bytes: number; parts: number }
interface LocalBundle { files: Record<string, LocalEntry>; threads: Record<string, string> }
let bundle: LocalBundle | null | undefined;
/** 备用版打包时烤进 index.html 的清单（<script type="application/json" id="ms-local">）：文件的哈希 / 大小 / 几片 + 后台线程的代码。 */
export function localBundle(): LocalBundle | null {
  if (bundle !== undefined) return bundle;
  try { const el = typeof document !== "undefined" ? document.getElementById("ms-local") : null; bundle = el?.textContent ? (JSON.parse(el.textContent) as LocalBundle) : null; }
  catch { bundle = null; }
  return bundle;
}
const fromFolder = (): boolean => deployment() === "local";

/** 站点里的一个路径（index.html 永远在站点根：官网 / dev / itch 的 zip / 备用版文件夹）。 */
export function siteUrl(path: string): URL { return new URL(path, typeof document !== "undefined" ? document.baseURI : "http://localhost/"); }
/** 资源是不是就在本地文件夹里（备用版）：家族共用的 Cache Storage（pwa-models / pwa-sounds）在 file: 里写不进，
 *  界面上「下载 / 导入模型包」「下载留着」这些动作在这里没有意义（设置页按它画灰）。 */
export function resourcesInFolder(): boolean { return fromFolder(); }

export interface GetOpts { sha256?: string; onProgress?: (done: number, total: number) => void }

async function sha256Hex(b: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) { try { return [...new Uint8Array(await subtle.digest("SHA-256", b as unknown as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join(""); } catch { /* 不给用就走 JS 那份 */ } }
  const sha = new Sha256(); for (let o = 0; o < b.length; o += 1 << 20) sha.update(b.subarray(o, Math.min(o + (1 << 20), b.length))); return sha.hex();
}
function fromBase64(s: string): Uint8Array {
  const native = (Uint8Array as unknown as { fromBase64?: (s: string) => Uint8Array }).fromBase64;
  if (native) return native(s);
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
type DataBag = Record<string, string | undefined>;
/** 插一个老实脚本、等它载完、取走那一个键（取完就删，不在全局里留 32 MB 的字符串）。 */
function loadDataScript(src: string, key: string): Promise<string> {
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => {
      s.remove();
      const bag = (globalThis as unknown as { __pwaData?: DataBag }).__pwaData;
      const v = bag?.[key]; if (bag) delete bag[key];
      if (typeof v === "string") ok(v); else fail(new Error(`${src} 载进来了，但里面没有「${key}」`));
    };
    s.onerror = () => { s.remove(); fail(new Error(`备用版文件夹里少了 ${src}（或浏览器不让读）`)); };
    document.head.append(s);
  });
}
const inflight = new Map<string, Promise<Uint8Array>>();
async function readFolder(path: string, opts: GetOpts): Promise<Uint8Array> {
  const e = localBundle()?.files[path];
  if (!e) throw new Error(`备用版里没有 ${path}`);
  const parts: Uint8Array[] = []; let done = 0;
  for (let k = 0; k < e.parts; k++) {
    const b = fromBase64(await loadDataScript(siteUrl(e.parts === 1 ? `${path}.data.js` : `${path}.${k}.data.js`).href, e.parts === 1 ? path : `${path}#${k}`));
    parts.push(b); done += b.length; opts.onProgress?.(done, e.bytes);
  }
  const out = parts.length === 1 ? parts[0]! : (() => { const o = new Uint8Array(done); let at = 0; for (const p of parts) { o.set(p, at); at += p.length; } return o; })();
  const want = opts.sha256 ?? e.sha256;
  if (out.length !== e.bytes || (await sha256Hex(out)) !== want) throw new Error(`${path}：备用版文件夹里的这个文件和 app 里钉的哈希对不上（被改过或坏了）`);
  return out;
}
async function readSite(path: string, opts: GetOpts): Promise<Uint8Array> {
  const r = await fetch(siteUrl(path));
  if (!r.ok) throw new Error(`${path}：HTTP ${r.status}`);
  let out: Uint8Array;
  if (opts.onProgress && r.body) {
    const total = Number(r.headers.get("content-length") ?? 0), reader = r.body.getReader(), chunks: Uint8Array[] = []; let got = 0;
    for (;;) { const { value, done } = await reader.read(); if (done) break; chunks.push(value); got += value.length; opts.onProgress(got, total || got); }
    out = new Uint8Array(got); let at = 0; for (const c of chunks) { out.set(c, at); at += c.length; }
  } else out = new Uint8Array(await r.arrayBuffer());
  if (opts.sha256 && (await sha256Hex(out)) !== opts.sha256) throw new Error(`${path}：和 app 里钉的哈希对不上（被改过或坏了）`);
  return out;
}
/** 站点里那一份字节（官网 / itch = fetch；备用版 = 老实脚本）。给了 sha256 / 备用版 = 核过才交出。 */
export function getBytes(path: string, opts: GetOpts = {}): Promise<Uint8Array> {
  if (!fromFolder()) return readSite(path, opts);
  const key = `${path}|${opts.sha256 ?? ""}`;
  let p = inflight.get(key);
  if (!p) { p = readFolder(path, opts).finally(() => inflight.delete(key)); inflight.set(key, p); }
  return p;
}
export async function getText(path: string, opts: GetOpts = {}): Promise<string> { return new TextDecoder().decode(await getBytes(path, opts)); }
export async function getJson<T>(path: string, opts: GetOpts = {}): Promise<T> { return JSON.parse(await getText(path, opts)) as T; }
