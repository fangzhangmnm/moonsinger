import { type TtfFont } from "./ttf.ts";
import { type MusicOutlines } from "./pdf.ts";
/** 取歌词 / 文字的字体（思源黑体 TTF）并解析。拿不到（离线且没缓存）→ 抛错（调用方明说）。 */
export declare function loadPdfFont(): Promise<TtfFont>;
export declare function loadMusicOutlines(): Promise<MusicOutlines>;
/** 第一次要下多少（给人看的估计）。 */
export declare const PDF_FONT_MB = 6.3;
