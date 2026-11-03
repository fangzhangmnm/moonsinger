// mp3-worker.ts —— 在 worker 里把样本编成 mp3（不卡界面）。created 2026-10-07 by Claude Opus 5.5；立体声 2026-10-08 by Claude Opus 5.5（导出面板「标准」档）
// 2026-10-17 Claude Fable 5.1：编码器换成真 LAME（vendor/lame/lame.mjs + lame.wasm，libmp3lame 3.100 + 我们的 lame-glue.c，LGPL v2；user「lamejs一口气修」）——
//   原来 vendored 的 lamejs（纯 JS 移植）写死左右各编各的 + 关比特池、比特池那段移植是坏的，同一份团子 128k 对源 SNR 16.8 dB；真 LAME 联合立体声 + 比特池 24.2 dB（128k）/ 29.4 dB（192k），
//   编码还快 3–6 倍，直接吃 float 不先转 16 位。查案 = ai-docs/20261017-final-mp3-quality.md。
//   emscripten 产物带 node 分支，不进打包：运行时按地址载（同 src/singer/worker.ts 载 WORLD 的做法），wasm 由它自己从同目录取；点导出 / 定稿才加载。
import { encodeAll, type LameModule } from "./lame.ts";

/** right 给了 = 立体声（left / right 等长）；没给 = 单声道（left）。 */
export interface Mp3Request { left: Float32Array; right?: Float32Array; sr: number; kbps: number;
  /** 备用版：主线程读好的 LAME 胶水（lame.mjs 的字节）+ wasm（data: 起的线程联不了网；2026-11-03）。没给 = 自己按网址载（官网 / itch）。 */
  lame?: { js: ArrayBuffer; wasm: ArrayBuffer } }
export type Mp3Reply = { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false; message: string };

const lameUrl = () => new URL("../vendor/lame/lame.mjs", import.meta.url);   // 相对 dist/mp3-worker-<hash>.mjs（只在官网 / itch 算：data: 起的线程 import.meta.url 当不了基址）
let lameP: Promise<LameModule> | null = null;
const lame = (given?: Mp3Request["lame"]): Promise<LameModule> => (lameP ??= (async () => {
  if (!given) return (await import(/* @vite-ignore */ lameUrl().href) as { default: () => Promise<LameModule> }).default();
  const url = URL.createObjectURL(new Blob([given.js], { type: "text/javascript" }));   // data: 起的线程里 import(blob:) 可用（§2.2 实测）
  // 这版 emscripten 胶水不读 Module.wasmBinary（只认 instantiateWasm / locateFile）：字节自己实例化交给它；locateFile 让它别按 import.meta.url 拼网址（blob: 当不了基址）
  type Glue = (o: { instantiateWasm: (imports: WebAssembly.Imports, done: (inst: WebAssembly.Instance) => void) => object; locateFile: (p: string) => string }) => Promise<LameModule>;
  try { return (await import(/* @vite-ignore */ url) as { default: Glue }).default({ locateFile: (p) => p, instantiateWasm: (imports, done) => { void WebAssembly.instantiate(given.wasm, imports).then((r) => done(r.instance)); return {}; } }); }
  finally { URL.revokeObjectURL(url); }
})());

self.onmessage = async (ev: MessageEvent<Mp3Request>) => {
  try {
    const { left, right, sr, kbps } = ev.data, M = await lame(ev.data.lame);
    const out = encodeAll(M, { channels: right ? 2 : 1, sr, kbps, joint: true }, left, right);
    const bytes = new Uint8Array(new ArrayBuffer(out.length)); bytes.set(out);
    (self as unknown as Worker).postMessage({ ok: true, bytes } satisfies Mp3Reply, [bytes.buffer]);
  } catch (e) {
    (self as unknown as Worker).postMessage({ ok: false, message: (e as Error).message } satisfies Mp3Reply);
  }
};
