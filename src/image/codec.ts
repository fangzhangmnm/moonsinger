// codec.ts —— 图片解码 / 编码接缝（app 域唯一）。created 2026-10-08 by Claude Fable 5.1（抄 WebXiaoHeiWu src/image/codec.ts 的解码边界）
//   【硬原则】库外不许再为图片建 canvas / 调 createImageBitmap——字节进出一律走这里（家规「字节进出不走 canvas」的唯一豁免点：
//   浏览器解码器 + canvas **读出一次**，之后全字节；重采样 / 压 PNG 在 @internal/gallery 的纯函数里）。
//   user 2026-10-08「缩封面那一次 canvas…老规矩，抽象封装一下只暴露这个压缩功能，以后能用别的平替换」→ 以后换 WASM 解码器只换这一个文件。
import type { RgbaImage } from "@internal/gallery";

export type { RgbaImage };

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  w = Math.max(1, w | 0); h = Math.max(1, h | 0);
  return (typeof OffscreenCanvas !== "undefined") ? new OffscreenCanvas(w, h) : (() => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; })();
}
type Decoded = ImageBitmap | HTMLImageElement;
async function decodeBlob(blob: Blob): Promise<Decoded> {
  // 方向：from-image = 按 EXIF 摆正（现代浏览器默认即如此；显式写上，老引擎不认这个选项就退回无选项）。
  try { return await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions); } catch { /* fall through */ }
  try { return await createImageBitmap(blob); } catch { /* fall through */ }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob); const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image decode failed")); };
    img.src = url;
  });
}
/** 解码边界：浏览器解码 + canvas 读出**一次** → straight RGBA 字节。GIF 取首帧。 */
export async function decodeToRgba(blob: Blob): Promise<RgbaImage> {
  const src = await decodeBlob(blob);
  const w = src.width || (src as HTMLImageElement).naturalWidth, h = src.height || (src as HTMLImageElement).naturalHeight;
  const c = makeCanvas(w, h);
  const cx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
  if (!cx) throw new Error("2d context unavailable");
  cx.drawImage(src as CanvasImageSource, 0, 0);
  const img = cx.getImageData(0, 0, w, h);
  if ("close" in src) try { (src as ImageBitmap).close(); } catch { /* ignore */ }
  return { data: img.data, w, h };
}
/** PNG 编码（vendored UPNG，惰性加载）：colors=0 无损 RGBA8；>0 调色板量化（封面缩略图预算档）。纯 JS，不碰 canvas。 */
export async function encodePng(rgba: Uint8ClampedArray, w: number, h: number, colors: number): Promise<Uint8Array> {
  const { default: UPNG } = await import("../../vendor/upng/upng.esm.js");
  return new Uint8Array(UPNG.encode([new Uint8Array(rgba).buffer], w, h, colors));
}
