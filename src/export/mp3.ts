// mp3.ts —— 主线程这边：起一个 mp3 编码 worker，编完就关（重资源等有意图才加载：点导出才下这个 worker）。created 2026-10-07 by Claude Opus 5.5
// user「mp3不行吗，嫌弃胖子」：22050 Hz 单声道 64 kbps，60 秒约 0.5 MB（WAV 约 2.6 MB）。
import type { Mp3Reply, Mp3Request } from "./mp3-worker.ts";

export function encodeMp3(samples: Float32Array, sr: number, kbps = 64): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((ok, fail) => {
    const w = new Worker(new URL(`./${__MP3_WORKER__}`, import.meta.url), { type: "module" });
    w.onmessage = (ev: MessageEvent<Mp3Reply>) => { w.terminate(); if (ev.data.ok) ok(ev.data.bytes); else fail(new Error(ev.data.message)); };
    w.onerror = (e) => { w.terminate(); fail(new Error(e.message || "mp3 编码 worker 出错")); };
    const req: Mp3Request = { samples: samples.slice(), sr, kbps };   // 拷一份再转移，原样本（缓存里的）不动
    w.postMessage(req, [req.samples.buffer]);
  });
}
