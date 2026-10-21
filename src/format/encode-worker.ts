// encode-worker.ts —— 存档编码进 worker：saveMxl（MusicXML 串化 + zip）在这条线程上跑；主线程只递 SaveArgs（结构化克隆）、收回字节。
//   created 2026-10-21 by Claude Fable 5.1（音游级延迟那一刀的第二件：自动存每 2 s 一次，大歌（1204 token）saveMxl 在主线程要 20–60 ms——实时演奏时这就是每两秒一次的卡顿）。
//   纯函数 runEncodeJob 单独导出（node 测试）；self.onmessage 只在 worker 环境里挂。saveMxl 抛的错（定稿着内容却变了 = 第 ③ 层护栏）原样带回，主线程再抛给 editor-session。
import { saveMxl, type SaveArgs } from "./project.ts";

export type EncodeJob = { seq: number; args: SaveArgs };
export type EncodeReply = { seq: number; bytes: Uint8Array; ms: number } | { seq: number; error: string };

export function runEncodeJob(job: EncodeJob, now: () => number = () => performance.now()): EncodeReply {
  const t0 = now();
  try { return { seq: job.seq, bytes: saveMxl(job.args), ms: now() - t0 }; }
  catch (e) { return { seq: job.seq, error: (e as Error)?.message ?? String(e) }; }
}

type WorkerSelf = { postMessage(m: unknown, transfer?: Transferable[]): void; onmessage: ((e: MessageEvent<EncodeJob>) => void) | null };
if (typeof document === "undefined" && typeof self !== "undefined" && typeof (self as unknown as WorkerSelf).postMessage === "function") {
  const ws = self as unknown as WorkerSelf;
  ws.onmessage = (e) => { const r = runEncodeJob(e.data); if ("bytes" in r) ws.postMessage(r, [r.bytes.buffer]); else ws.postMessage(r); };
}
