// mp3.ts —— 主线程这边：起一个 mp3 编码 worker，编完就关（重资源等有意图才加载：点导出才下这个 worker）。created 2026-10-07 by Claude Opus 5.5
// user「mp3不行吗，嫌弃胖子」：最初只有单声道 64 kbps（60 秒约 0.5 MB）。2026-10-08 导出面板（user「好，同意」）：标准 = 立体声 128 kbps（约 1 MB / 分钟，默认）/ 小文件 = 单声道 64 kbps。
import type { Mp3Reply, Mp3Request } from "./mp3-worker.ts";

export type Mp3Quality = "standard" | "small";
export const MP3_QUALITY: Record<Mp3Quality, { label: string; note: string; stereo: boolean; kbps: number }> = {
  standard: { label: "标准", note: "立体声 128k，约 1 MB / 分钟", stereo: true, kbps: 128 },
  small: { label: "小文件", note: "单声道 64k，约 0.5 MB / 分钟", stereo: false, kbps: 64 },
};

/** 立体声（right 给了）或单声道。样本拷一份再转移给 worker，原样本（缓存里的）不动。 */
export function encodeMp3(left: Float32Array, right: Float32Array | null, sr: number, kbps = 64): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((ok, fail) => {
    const w = new Worker(new URL(`./${__MP3_WORKER__}`, import.meta.url), { type: "module" });
    w.onmessage = (ev: MessageEvent<Mp3Reply>) => { w.terminate(); if (ev.data.ok) ok(ev.data.bytes); else fail(new Error(ev.data.message)); };
    w.onerror = (e) => { w.terminate(); fail(new Error(e.message || "mp3 编码 worker 出错")); };
    const req: Mp3Request = { left: left.slice(), ...(right ? { right: right.slice() } : {}), sr, kbps };
    w.postMessage(req, [req.left.buffer, ...(req.right ? [req.right.buffer] : [])]);
  });
}
