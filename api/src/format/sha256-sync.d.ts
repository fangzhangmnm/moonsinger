/** 字节 → sha256 十六进制（64 个字符）。 */
export declare function sha256HexSync(data: Uint8Array): string;
/** 字符串（UTF-8）→ sha256 十六进制。 */
export declare const sha256TextSync: (s: string) => string;
