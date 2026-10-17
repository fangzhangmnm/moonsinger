// mp3-worker.ts —— 在 worker 里把样本编成 mp3（不卡界面）。created 2026-10-07 by Claude Opus 5.5；立体声 2026-10-08 by Claude Opus 5.5（导出面板「标准」档）
// 2026-10-17 Claude Fable 5.1：编码器换成真 LAME（vendor/lame/lame.mjs + lame.wasm，libmp3lame 3.100 + 我们的 lame-glue.c，LGPL v2；user「lamejs一口气修」）——
//   原来 vendored 的 lamejs（纯 JS 移植）写死左右各编各的 + 关比特池、比特池那段移植是坏的，同一份团子 128k 对源 SNR 16.8 dB；真 LAME 联合立体声 + 比特池 24.2 dB（128k）/ 29.4 dB（192k），
//   编码还快 3–6 倍，直接吃 float 不先转 16 位。查案 = ai-docs/20261017-final-mp3-quality.md。
//   emscripten 产物带 node 分支，不进打包：运行时按地址载（同 src/singer/worker.ts 载 WORLD 的做法），wasm 由它自己从同目录取；点导出 / 定稿才加载。
import { encodeAll, type LameModule } from "./lame.ts";

/** right 给了 = 立体声（left / right 等长）；没给 = 单声道（left）。 */
export interface Mp3Request { left: Float32Array; right?: Float32Array; sr: number; kbps: number }
export type Mp3Reply = { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false; message: string };

const LAME_URL = new URL("../vendor/lame/lame.mjs", import.meta.url);   // 相对 dist/mp3-worker-<hash>.mjs
let lameP: Promise<LameModule> | null = null;
const lame = (): Promise<LameModule> => (lameP ??= import(/* @vite-ignore */ LAME_URL.href).then((m: { default: () => Promise<LameModule> }) => m.default()));

self.onmessage = async (ev: MessageEvent<Mp3Request>) => {
  try {
    const { left, right, sr, kbps } = ev.data, M = await lame();
    const out = encodeAll(M, { channels: right ? 2 : 1, sr, kbps, joint: true }, left, right);
    const bytes = new Uint8Array(new ArrayBuffer(out.length)); bytes.set(out);
    (self as unknown as Worker).postMessage({ ok: true, bytes } satisfies Mp3Reply, [bytes.buffer]);
  } catch (e) {
    (self as unknown as Worker).postMessage({ ok: false, message: (e as Error).message } satisfies Mp3Reply);
  }
};
