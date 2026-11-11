import { type TextStyle } from "./style.ts";
/** 上沿 a / 下沿 d：离基线多远，字号的倍数。 */
export interface FaceMetrics {
    a: number;
    d: number;
}
/** 排版器估的字的墨迹上下沿（天际线用；行为照旧 = 刀 4 起的那对数）。 */
export declare const INK_EST: FaceMetrics;
/** 这款字真的上沿 / 下沿 = canvas 的 fontBoundingBox（浏览器排一行字用的那一对数；按字体 / 粗细 / 斜体各量一次）。量不到（node、老浏览器）= 0.8 / 0.2（= 原来按「基线约在 0.8 字号」估的那个位置）。 */
export declare function faceMetrics(st: TextStyle): FaceMetrics;
/** HTML 盒子（行高 = 字号 px）的顶放哪，里面那行字的基线才落在 base 上（CSS 行内排版：基线离盒顶 = (行高 + 上沿 − 下沿) / 2）。 */
export declare const boxTopFor: (base: number, px: number, m: FaceMetrics) => number;
