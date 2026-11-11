export declare const REF_IMAGE_EDGE = 2048;
export declare const REF_IMAGE_COLORS = 256;
/** 图片字节 → PNG（长边 ≤ edge、调色板 colors 色；透明照旧透明）。 */
export declare function shrinkImage(blob: Blob, edge?: number, colors?: number): Promise<{
    png: Uint8Array;
    w: number;
    h: number;
}>;
