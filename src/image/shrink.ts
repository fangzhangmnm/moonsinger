// shrink.ts —— 参考窗图片的「压一下」：长边封顶 + 调色板 PNG。created 2026-10-09 by Claude Opus 5.5
// user「不过我们mp3其实默认不压，导入的时候有一个对话框告诉你大小，然后问你要不要压。图片也一样」（默认原样存，用户选了才压）。
// 解码 = src/image/codec.ts（唯一 canvas 点）；缩图 = @internal/gallery 的纯函数（面积平均）；编码 = vendored UPNG（256 色调色板——谱面截图多半黑白，压得最狠；照片会有色带，用户看了估计再选）。
import { areaResampleRgba, fitWithin } from "@internal/gallery";
import { decodeToRgba, encodePng } from "./codec.ts";

export const REF_IMAGE_EDGE = 2048;   // 长边上限（px）：iPad 截图 2048 × 2732 缩到 1533 × 2048，谱上的字还看得清
export const REF_IMAGE_COLORS = 256;

/** 图片字节 → PNG（长边 ≤ edge、调色板 colors 色；透明照旧透明）。 */
export async function shrinkImage(blob: Blob, edge = REF_IMAGE_EDGE, colors = REF_IMAGE_COLORS): Promise<{ png: Uint8Array; w: number; h: number }> {
  const src = await decodeToRgba(blob), t = fitWithin(src.w, src.h, edge);
  const px = t.w === src.w && t.h === src.h ? new Uint8ClampedArray(src.data) : areaResampleRgba(src.data, src.w, src.h, t.w, t.h);
  return { png: await encodePng(px, t.w, t.h, colors), w: t.w, h: t.h };
}
