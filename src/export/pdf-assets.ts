// pdf-assets.ts —— PDF 导出要的字体 / 音乐字形轮廓：点了导出才取（家规「重资源要等用户有意图才加载」），用完调用方放手（不留在内存里）。
// created 2026-10-09 by Claude Opus 5.5。字体字节 = vendor/fonts/*.ttf.gz（从 WXHW 拷来，见该目录 README）；轮廓 = vendor/fonts/bravura/outlines.json。
// 取过一次之后 service worker 的运行时缓存里有（离线也能导出）；换版本时缓存换代、下次再取一次（同 WXHW）。
import { gunzipSync } from "../../vendor/fflate/fflate.esm.js";
import { parseTtf, type TtfFont } from "./ttf.ts";
import type { MusicOutlines } from "./pdf.ts";
import type { PdfFontId } from "./score-pdf.ts";

async function gunzip(b: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== "undefined") {
    try { return new Uint8Array(await new Response(new Blob([b as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()); }
    catch { /* 流式解不了就同步解 */ }
  }
  return gunzipSync(b);
}
/** 取一款字体（TTF）并解析。拿不到（离线且没缓存）→ 抛错（调用方明说）。 */
export async function loadPdfFont(id: PdfFontId): Promise<TtfFont> {
  const r = await fetch(id === "pinyin" ? "./vendor/fonts/pinyin.ttf.gz" : "./vendor/fonts/sans.ttf.gz");   // 相对路径写成字面量：构建 / SW 扫得到
  if (!r.ok) throw new Error(`字体下不来（${r.status}）`);
  const b = new Uint8Array(await r.arrayBuffer());
  return parseTtf(b[0] === 0x1f && b[1] === 0x8b ? await gunzip(b) : b);   // 有的主机替 .gz 加 Content-Encoding 先解掉：看魔数，别解两次
}
export async function loadMusicOutlines(): Promise<MusicOutlines> {
  const r = await fetch("./vendor/fonts/bravura/outlines.json");
  if (!r.ok) throw new Error(`音乐字形下不来（${r.status}）`);
  return (await r.json()) as MusicOutlines;
}
/** 第一次要下多少（给人看的估计）。 */
export const PDF_FONT_MB: Record<PdfFontId, number> = { sans: 6.3, pinyin: 12.2 };
