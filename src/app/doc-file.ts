// doc-file.ts —— 无地逃生口的文件那一层：选文件打开、存回原文件、存一份副本、拖进来、双击打开。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」。照 WeebPaint 无地（src/local-file-session.ts）：
//   桌面 Chromium 有 File System Access（showOpenFilePicker / showSaveFilePicker）→ 拿到文件句柄，Ctrl+S 存回原文件；
//   iPad / Safari 没有 → 打开 = 选文件（<input type=file>），存 = 交给宿主做下载 / 分享（这里返回 null，宿主自己弹面板）。
//   只在用户手势里调用（选文件的系统面板要手势）。不碰 store、不碰 IndexedDB / localStorage（无地 = 零持久化，家族「无库不长 gallery」）。
// v0.3.0（2026-10-07，edited by Claude Fable 5.1；user「把无地做完美」）：
//   · 写回前陈旧对表（WeebPaint 0819 spec §7「原位写回前查 lastModified」）：FS Access 没有 etag，mtime 是零成本的新鲜度检查——
//     打开 / 每次写回记一次 lastModified（Picked.mtime / mtime()），再写之前 isStale 比一次，变了 = 文件在外面被改过 → 宿主问人再覆盖。
//   · 拖进来打开（grabDrop / fromGrab）：桌面 Chromium 用 getAsFileSystemHandle 拿句柄 = 有家；别的浏览器只有 File = 没家。
//   · 安装成 PWA 后双击 .mxl 打开（manifest file_handlers → launchQueue，consumeLaunchFiles；照 WeebPaint）。

export interface FileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: BlobPart): Promise<void>; close(): Promise<void> }>;
}
/** 拿到手的一个文件：字节 + （桌面 Chromium）句柄 + 打开那一刻的 lastModified（没有句柄的 = 只是参考，不会再写回）。 */
export interface Picked { name: string; bytes: Uint8Array; handle: FileHandle | null; mtime: number | null }

const TYPES = [{ description: "MusicXML 乐谱（MoonSinger 存成 .mxl）", accept: {
  "application/vnd.recordare.musicxml": [".mxl"], "application/vnd.recordare.musicxml+xml": [".musicxml", ".xml"] } }];
const ACCEPT = ".mxl,.musicxml,.xml";
/** 认不认这个文件名（打开 / 拖进来 / 双击都看它）。 */
export const accepts = (name: string): boolean => /\.(mxl|musicxml|xml)$/i.test(name);
type G = { showOpenFilePicker?: (o: unknown) => Promise<FileHandle[]>; showSaveFilePicker?: (o: unknown) => Promise<FileHandle> };
const g = globalThis as unknown as G;
const topLevel = () => { try { return window.self === window.top; } catch { return false; } };   // 跨域 iframe 里系统面板会被拦
export const canPickOpen = () => topLevel() && typeof g.showOpenFilePicker === "function";
export const canPickSave = () => topLevel() && typeof g.showSaveFilePicker === "function";
const aborted = (e: unknown) => (e as { name?: string }).name === "AbortError";

async function fromFile(f: File, handle: FileHandle | null): Promise<Picked> {
  return { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), handle, mtime: f.lastModified };
}

/** 选一个文件打开。null = 用户取消了（AbortError ≠ 环境不支持——取消就到此为止，不降级再弹 input）。 */
export async function pickOpen(): Promise<Picked | null> {
  if (canPickOpen()) {
    let hs: FileHandle[];
    try { hs = await g.showOpenFilePicker!({ types: TYPES, multiple: false, excludeAcceptAllOption: false }); }
    catch (e) { if (aborted(e)) return null; throw e; }
    return readHandle(hs[0]);
  }
  return new Promise((resolve, reject) => {   // iPad / Safari：选文件；取消时浏览器什么都不告诉我们（这个 promise 就不了了之）
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ACCEPT; inp.hidden = true;
    inp.addEventListener("change", async () => {
      const f = inp.files?.[0]; inp.remove();
      if (!f) { resolve(null); return; }
      try { resolve(await fromFile(f, null)); } catch (e) { reject(e); }
    }, { once: true });
    document.body.append(inp);
    inp.click();
  });
}

/** 读一个句柄（选的 / 拖的 / 双击的都走这）：字节 + 打开那一刻的 mtime。 */
export async function readHandle(h: FileHandle): Promise<Picked> {
  return fromFile(await h.getFile(), h);
}

/** 问用户存到哪（桌面 Chromium）。null = 用户取消了；没有这个能力时不要调（canPickSave() 先判）。必须在用户手势里调（先开框再编码）。 */
export async function pickSave(suggestedName: string): Promise<FileHandle | null> {
  try { return await g.showSaveFilePicker!({ suggestedName, types: TYPES }); }
  catch (e) { if (aborted(e)) return null; throw e; }
}

/** 把字节写进这个文件（整份覆盖；createWritable = 浏览器先写临时文件、close 时原子替换）。 */
export async function writeTo(h: FileHandle, bytes: Uint8Array): Promise<void> {
  const w = await h.createWritable();
  await w.write(bytes as unknown as BlobPart);
  await w.close();
}

/** 句柄现在的 lastModified（写前对表用）。读不到（句柄失效等）→ null，调用方自己决定敢不敢写。 */
export async function mtime(h: FileHandle): Promise<number | null> {
  try { return (await h.getFile()).lastModified; } catch { return null; }
}
/** 陈旧对表：上次看到的和现在的都在、而且不一样 = 文件在外面被改过。任一边不知道（null）= 不算陈旧（不拿「不知道」吓人）。 */
export const isStale = (seen: number | null, now: number | null): boolean => seen != null && now != null && seen !== now;

/** 拖进来的文件：⚠ 必须在 drop 事件里**同步**调（事件返回 / 第一个 await 之后 dataTransfer.items 就空了）——
 *  这里只同步抓住 File 和句柄的 promise，真正读字节在 fromGrab 里 await。只认第一个认得的文件；没有 = null（不拦这次 drop）。 */
export interface Grab { file: File; handle: Promise<FileHandle | null> }
export function grabDrop(dt: DataTransfer): Grab | null {
  type Item = DataTransferItem & { getAsFileSystemHandle?: () => Promise<({ kind: string } & FileHandle) | null> };
  for (const it of [...(dt.items ?? [])] as Item[]) {
    if (it.kind !== "file") continue;
    const file = it.getAsFile();
    if (!file || !accepts(file.name)) continue;
    const handle = it.getAsFileSystemHandle
      ? it.getAsFileSystemHandle().then((h) => (h && h.kind === "file" ? h : null), () => null)
      : Promise.resolve(null);
    return { file, handle };
  }
  for (const file of [...(dt.files ?? [])]) if (accepts(file.name)) return { file, handle: Promise.resolve(null) };   // 没有 items 的老浏览器
  return null;
}
export async function fromGrab(gr: Grab): Promise<Picked> {
  return fromFile(gr.file, await gr.handle);
}

/** 安装态 PWA 的「双击 .mxl 用 MoonSinger 打开」（manifest file_handlers）。浏览器缓存 launch 事件，boot 后再 setConsumer 也收得到。
 *  非安装态 / 不支持 → 静默 no-op。 */
export function consumeLaunchFiles(cb: (h: FileHandle) => void): void {
  const lq = (globalThis as unknown as { launchQueue?: { setConsumer(f: (p: { files?: unknown[] }) => void): void } }).launchQueue;
  if (!lq) return;
  lq.setConsumer((p) => { for (const f of p.files ?? []) { const h = f as FileHandle; if (accepts(h.name)) cb(h); } });
}
