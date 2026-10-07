// names.ts —— 没填歌名时的默认文件名 = 家族约定 `yyyymmdd-hex4`（如 20261007-a1b2）。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「纸张的最上面加一个可选的歌名吧，未来也是文件名，用同样的yyyymmdd hash的默认规范；看一下隔壁怎么做的」。
// 隔壁：WeebPaint src/naming.ts galleryDefaultName（源头）、CatsUp src/config.ts defaultDocName、WXHW src/doc-model.ts makeDocName
//   （「有名保名，无名日期」；hex4 用 crypto.getRandomValues）——本地日期 + 半角 - + 4 位小写 hex，不叫「未命名」。
// 家族共享库 @internal/gallery 有同一个 galleryDefaultName()；MoonSinger 接 gallery（存档接 store）时换成它，这份删掉。
export function defaultStem(now = new Date()): string {
  const z = (n: number) => String(n).padStart(2, "0");
  let r: number;
  try { r = crypto.getRandomValues(new Uint16Array(1))[0]; } catch { r = Math.floor(Math.random() * 0x10000); }
  return `${now.getFullYear()}${z(now.getMonth() + 1)}${z(now.getDate())}-${r.toString(16).padStart(4, "0")}`;
}
/** 歌名 → 能当文件名的样子（去掉文件系统不认的字符）；空 = 空。 */
export const fileSafe = (s: string): string => s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").trim();
/** 导出一份副本时的文件名 = `名-YYYYMMDD-HHMM`（WeebPaint 0825 拍板「下载版本 = 名-YYYYMMDD-HHMM」；分钟粒度，同一分钟再导就让系统补 (1)）。
 *  added 2026-10-07 by Claude Fable 5.1（v0.3.0 导出 hub「存一份 .mxl 副本」）。 */
export function stampedCopy(stem: string, now = new Date()): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${stem}-${now.getFullYear()}${z(now.getMonth() + 1)}${z(now.getDate())}-${z(now.getHours())}${z(now.getMinutes())}`;
}
