import type { RgbaImage } from "@internal/gallery";
export type { RgbaImage };
/** 解码边界：浏览器解码 + canvas 读出**一次** → straight RGBA 字节。GIF 取首帧。 */
export declare function decodeToRgba(blob: Blob): Promise<RgbaImage>;
/** PNG 编码（vendored UPNG，惰性加载）：colors=0 无损 RGBA8；>0 调色板量化（封面缩略图预算档）。纯 JS，不碰 canvas。 */
export declare function encodePng(rgba: Uint8ClampedArray, w: number, h: number, colors: number): Promise<Uint8Array>;
