import { type TtfFont } from "./ttf.ts";
import { type MusicOutlines } from "./pdf.ts";
import type { PdfFontId } from "./score-pdf.ts";
/** 取一款字体（TTF）并解析。拿不到（离线且没缓存）→ 抛错（调用方明说）。 */
export declare function loadPdfFont(id: PdfFontId): Promise<TtfFont>;
export declare function loadMusicOutlines(): Promise<MusicOutlines>;
/** 第一次要下多少（给人看的估计）。 */
export declare const PDF_FONT_MB: Record<PdfFontId, number>;
