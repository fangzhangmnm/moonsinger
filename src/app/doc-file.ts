// doc-file.ts —— 无地逃生口的文件那一层：选文件打开、存回原文件 / 另存为。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」。照 WeebPaint 无地（src/local-file-session.ts）：
//   桌面 Chromium 有 File System Access（showOpenFilePicker / showSaveFilePicker）→ 拿到文件句柄，Ctrl+S 存回原文件；
//   iPad / Safari 没有 → 打开 = 选文件（<input type=file>），存 = 交给宿主做下载 / 分享（这里返回 null，宿主自己弹面板）。
//   只在用户手势里调用（选文件的系统面板要手势）。不碰 store、不碰 IndexedDB / localStorage（无地 = 零持久化，家族「无库不长 gallery」）。

export interface FileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: BlobPart): Promise<void>; close(): Promise<void> }>;
}
export interface Picked { name: string; bytes: Uint8Array; handle: FileHandle | null }

const TYPES = [{ description: "MusicXML 乐谱（MoonSinger 存成 .mxl）", accept: {
  "application/vnd.recordare.musicxml": [".mxl"], "application/vnd.recordare.musicxml+xml": [".musicxml", ".xml"] } }];
const ACCEPT = ".mxl,.musicxml,.xml";
type G = { showOpenFilePicker?: (o: unknown) => Promise<FileHandle[]>; showSaveFilePicker?: (o: unknown) => Promise<FileHandle> };
const g = globalThis as unknown as G;
const topLevel = () => { try { return window.self === window.top; } catch { return false; } };   // 跨域 iframe 里系统面板会被拦
export const canPickOpen = () => topLevel() && typeof g.showOpenFilePicker === "function";
export const canPickSave = () => topLevel() && typeof g.showSaveFilePicker === "function";
const aborted = (e: unknown) => (e as { name?: string }).name === "AbortError";

/** 选一个文件打开。null = 用户取消了。 */
export async function pickOpen(): Promise<Picked | null> {
  if (canPickOpen()) {
    let hs: FileHandle[];
    try { hs = await g.showOpenFilePicker!({ types: TYPES, multiple: false, excludeAcceptAllOption: false }); }
    catch (e) { if (aborted(e)) return null; throw e; }
    const f = await hs[0].getFile();
    return { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), handle: hs[0] };
  }
  return new Promise((resolve, reject) => {   // iPad / Safari：选文件；取消时浏览器什么都不告诉我们（这个 promise 就不了了之）
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ACCEPT; inp.hidden = true;
    inp.addEventListener("change", async () => {
      const f = inp.files?.[0]; inp.remove();
      if (!f) { resolve(null); return; }
      try { resolve({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), handle: null }); } catch (e) { reject(e); }
    }, { once: true });
    document.body.append(inp);
    inp.click();
  });
}

/** 另存为：问用户存到哪（桌面 Chromium）。null = 用户取消了；没有这个能力时不要调（canPickSave() 先判）。 */
export async function pickSave(suggestedName: string): Promise<FileHandle | null> {
  try { return await g.showSaveFilePicker!({ suggestedName, types: TYPES }); }
  catch (e) { if (aborted(e)) return null; throw e; }
}

/** 把字节写进这个文件（整份覆盖）。 */
export async function writeTo(h: FileHandle, bytes: Uint8Array): Promise<void> {
  const w = await h.createWritable();
  await w.write(bytes as unknown as BlobPart);
  await w.close();
}
