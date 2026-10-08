// cover.ts —— 任一图片字节 → 封面 PNG（`Thumbnails/thumbnail.png` 的规格，WXHW ADR-0012 / ORA 同款）。created 2026-10-08 by Claude Fable 5.1
//   ≤ 256²、≤ 70 KB（store getPeek 尾窗 80 KB 减 central directory 一次命中）、白底；腰封一行写进 PNG 的 iTXt `Description`
//   （一次尾读同时拿到封面与腰封；任何看图软件直接能读）。缩图 / 压预算 = @internal/gallery 的纯函数；解码 = src/image/codec.ts（唯一 canvas 点）。
import { makeThumbAdaptive, withPngText, PNG_BLURB_KEYWORD, THUMB_MAX_BYTES } from "@internal/gallery";
import { decodeToRgba, type RgbaImage } from "./codec.ts";

/** 图片字节（jpeg / png / webp / gif…）→ 封面 PNG；blurb = 腰封（null = 不写）。 */
/** 居中裁成正方形（唱片封面是方的；长边两头各切掉一截，不拉伸）。已经是方的原样返回。 */
export function cropSquare(img: RgbaImage): RgbaImage {
  const { w, h } = img;
  if (w === h) return img;
  const n = Math.min(w, h), x0 = (w - n) >> 1, y0 = (h - n) >> 1, out = new Uint8ClampedArray(n * n * 4), src = img.data;
  for (let y = 0; y < n; y++) out.set(src.subarray(((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + n) * 4), y * n * 4);
  return { w: n, h: n, data: out };
}
export async function makeCoverPng(bytes: Uint8Array, blurb: string | null = null): Promise<Uint8Array> {
  const rgba = cropSquare(await decodeToRgba(new Blob([bytes as unknown as BlobPart])));
  // 同步 encodePng：makeThumbAdaptive 要同步编码器，UPNG 惰性装好后同步调（先 await 一次装模块）
  const { default: UPNG } = await import("../../vendor/upng/upng.esm.js");
  const r = makeThumbAdaptive(rgba, { encodePng: (px, w, h, colors) => new Uint8Array(UPNG.encode([new Uint8Array(px).buffer], w, h, colors)), keepAlpha: false, maxBytes: THUMB_MAX_BYTES });
  return blurb ? withPngText(r.png, PNG_BLURB_KEYWORD, blurb) : r.png;
}

/** 封面 PNG 换一条腰封（作者行）：先删旧的同关键字块再写（withPngText 的语义），所以每次存都可以重写、不会越写越多。null = 去掉腰封。 */
export const coverWithBlurb = (png: Uint8Array, blurb: string | null): Uint8Array => withPngText(png, PNG_BLURB_KEYWORD, blurb && blurb.trim() ? blurb.trim() : null);
