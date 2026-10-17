// lame.ts —— 真 LAME（vendor/lame/lame.wasm，libmp3lame 3.100 + lame-glue.c）的 JS 接口：开编码器、喂 float 采样、收 mp3 字节。created 2026-10-17 by Claude Fable 5.1
//   取代 vendored lamejs（纯 JS 移植：写死左右各编各的 + 关比特池，比特池那段移植是坏的；查案 = ai-docs/20261017-final-mp3-quality.md，user「lamejs一口气修」）。
//   模块实例由调用方给（worker 从 vendor/lame/lame.mjs 运行时载、node 测试直接 import），这里只管堆上搬数据，不碰 fetch / 路径。
//   联合立体声 + 比特池都开（真 LAME 两样都正常）；CBR、不写 Xing / Info 帧（文件头就是第一帧，ID3 由 app 自己贴）；直接吃 float −1…1，不先转 16 位。

/** emscripten 的 createLame() 出来的模块里用到的那几样。 */
export interface LameModule {
  HEAPF32: Float32Array; HEAPU8: Uint8Array;
  _malloc(n: number): number; _free(p: number): void;
  _mg_open(channels: number, sr: number, kbps: number, joint: number, quality: number): number;
  _mg_encode(gf: number, l: number, r: number, n: number, out: number, outsize: number): number;
  _mg_flush(gf: number, out: number, outsize: number): number;
  _mg_close(gf: number): void;
  _mg_delay(gf: number): number;
}

export interface EncoderOpts { channels: 1 | 2; sr: number; kbps: number; /** 联合立体声（默认开；单声道不管）。 */ joint?: boolean; /** LAME 的 -q：0 最好 … 9 最快；默认 2（= -h）。 */ quality?: number }

/** 一台编码器：encode() 喂一块（左 / 右等长；单声道只给左），flush() 收尾，close() 释放。每块的输出字节自己攒。 */
export interface Mp3Encoder {
  encode(left: Float32Array, right?: Float32Array): Uint8Array;
  flush(): Uint8Array;
  close(): void;
  /** 编码器延迟（样本数；LAME = 576，解码器自己再加 529）。 */
  readonly delay: number;
}

const BLOCK = 1152 * 16;

export function createMp3Encoder(M: LameModule, o: EncoderOpts): Mp3Encoder {
  const gf = M._mg_open(o.channels, o.sr, o.kbps, o.joint === false ? 0 : 1, o.quality ?? 2);
  if (!gf) throw new Error(`lame: init failed (${o.channels} ch, ${o.sr} Hz, ${o.kbps} kbps)`);
  let cap = BLOCK, pl = M._malloc(cap * 4), pr = o.channels === 2 ? M._malloc(cap * 4) : 0, osz = Math.ceil(1.25 * cap + 7200), po = M._malloc(osz), closed = false;
  const grow = (n: number) => { if (n <= cap) return; M._free(pl); if (pr) M._free(pr); M._free(po); cap = n; pl = M._malloc(cap * 4); pr = o.channels === 2 ? M._malloc(cap * 4) : 0; osz = Math.ceil(1.25 * cap + 7200); po = M._malloc(osz); };
  const take = (k: number): Uint8Array => { if (k < 0) throw new Error(`lame: encode error ${k}`); return M.HEAPU8.slice(po, po + k); };
  return {
    encode(left, right) {
      if (closed) throw new Error("lame: encoder closed");
      if (o.channels === 2 && (!right || right.length !== left.length)) throw new Error("lame: stereo needs left / right of equal length");
      const out: Uint8Array[] = []; let total = 0;
      for (let i = 0; i < left.length; i += BLOCK) {   // 分块搬：块大小固定，堆上的缓冲不随歌长涨
        const n = Math.min(BLOCK, left.length - i); grow(n);
        M.HEAPF32.set(left.subarray(i, i + n), pl >> 2); if (pr) M.HEAPF32.set(right!.subarray(i, i + n), pr >> 2);
        const b = take(M._mg_encode(gf, pl, pr, n, po, osz)); if (b.length) { out.push(b); total += b.length; }
      }
      if (out.length === 1) return out[0];
      const all = new Uint8Array(total); let p = 0; for (const b of out) { all.set(b, p); p += b.length; } return all;
    },
    flush() { if (closed) throw new Error("lame: encoder closed"); return take(M._mg_flush(gf, po, osz)); },
    close() { if (closed) return; closed = true; M._mg_close(gf); M._free(pl); if (pr) M._free(pr); M._free(po); },
    get delay() { return M._mg_delay(gf); },
  };
}

/** 一口气编完：left（+ right）→ 整个 mp3 字节。 */
export function encodeAll(M: LameModule, o: EncoderOpts, left: Float32Array, right?: Float32Array): Uint8Array {
  const enc = createMp3Encoder(M, o);
  try {
    const body = enc.encode(left, right), tail = enc.flush();
    if (!tail.length) return body;
    const all = new Uint8Array(body.length + tail.length); all.set(body, 0); all.set(tail, body.length); return all;
  } finally { enc.close(); }
}
