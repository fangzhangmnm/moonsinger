/** emscripten 的 createLame() 出来的模块里用到的那几样。 */
export interface LameModule {
    HEAPF32: Float32Array;
    HEAPU8: Uint8Array;
    _malloc(n: number): number;
    _free(p: number): void;
    _mg_open(channels: number, sr: number, kbps: number, joint: number, quality: number): number;
    _mg_encode(gf: number, l: number, r: number, n: number, out: number, outsize: number): number;
    _mg_flush(gf: number, out: number, outsize: number): number;
    _mg_close(gf: number): void;
    _mg_delay(gf: number): number;
}
export interface EncoderOpts {
    channels: 1 | 2;
    sr: number;
    kbps: number; /** 联合立体声（默认开；单声道不管）。 */
    joint?: boolean; /** LAME 的 -q：0 最好 … 9 最快；默认 2（= -h）。 */
    quality?: number;
}
/** 一台编码器：encode() 喂一块（左 / 右等长；单声道只给左），flush() 收尾，close() 释放。每块的输出字节自己攒。 */
export interface Mp3Encoder {
    encode(left: Float32Array, right?: Float32Array): Uint8Array;
    flush(): Uint8Array;
    close(): void;
    /** 编码器延迟（样本数；LAME = 576，解码器自己再加 529）。 */
    readonly delay: number;
}
export declare function createMp3Encoder(M: LameModule, o: EncoderOpts): Mp3Encoder;
/** 一口气编完：left（+ right）→ 整个 mp3 字节。 */
export declare function encodeAll(M: LameModule, o: EncoderOpts, left: Float32Array, right?: Float32Array): Uint8Array;
