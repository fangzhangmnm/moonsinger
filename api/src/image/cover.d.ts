import { type RgbaImage } from "./codec.ts";
/** 图片字节（jpeg / png / webp / gif…）→ 封面 PNG；blurb = 腰封（null = 不写）。 */
/** 居中裁成正方形（唱片封面是方的；长边两头各切掉一截，不拉伸）。已经是方的原样返回。 */
export declare function cropSquare(img: RgbaImage): RgbaImage;
export declare function makeCoverPng(bytes: Uint8Array, blurb?: string | null): Promise<Uint8Array>;
/** 封面 PNG 换一条腰封（作者行）：先删旧的同关键字块再写（withPngText 的语义），所以每次存都可以重写、不会越写越多。null = 去掉腰封。 */
export declare const coverWithBlurb: (png: Uint8Array, blurb: string | null) => Uint8Array;
