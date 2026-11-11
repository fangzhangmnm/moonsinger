/** right 给了 = 立体声（left / right 等长）；没给 = 单声道（left）。 */
export interface Mp3Request {
    left: Float32Array;
    right?: Float32Array;
    sr: number;
    kbps: number;
    /** 备用版：主线程读好的 LAME 胶水（lame.mjs 的字节）+ wasm（data: 起的线程联不了网；2026-11-03）。没给 = 自己按网址载（官网 / itch）。 */
    lame?: {
        js: ArrayBuffer;
        wasm: ArrayBuffer;
    };
}
export type Mp3Reply = {
    ok: true;
    bytes: Uint8Array<ArrayBuffer>;
} | {
    ok: false;
    message: string;
};
