export declare function defaultStem(now?: Date): string;
/** 歌名 → 能当文件名的样子（去掉文件系统不认的字符）；空 = 空。 */
export declare const fileSafe: (s: string) => string;
/** 导出一份副本时的文件名 = `名-YYYYMMDD-HHMM`（WeebPaint 0825 拍板「下载版本 = 名-YYYYMMDD-HHMM」；分钟粒度，同一分钟再导就让系统补 (1)）。
 *  added 2026-10-07 by Claude Fable 5.1（v0.3.0 导出 hub「存一份 .mxl 副本」）。 */
export declare function stampedCopy(stem: string, now?: Date): string;
