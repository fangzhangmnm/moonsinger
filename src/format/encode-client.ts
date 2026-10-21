// encode-client.ts —— 主线程这边的存档编码口：有 worker 就发过去（src/format/encode-worker.ts），没有 / 坏了就在主线程 saveMxl（行为同 v0.13.x）。
//   created 2026-10-21 by Claude Fable 5.1。一次只允许的事：每个 job 一个 seq，回执按 seq 对号；worker 中途坏了 = 在途的全部改在主线程算一遍（自动存不能因为 worker 没了就丢）。
import { saveMxl, type SaveArgs } from "./project.ts";
import type { EncodeJob, EncodeReply } from "./encode-worker.ts";
import { record } from "../ui/perf-trace.ts";

export interface Encoder {
  /** 一份 .mxl 的字节。主线程上花的只有结构化克隆（歌 + 休息室 + 参考窗的文件）。 */
  encode(args: SaveArgs): Promise<Uint8Array>;
  /** 现在是在 worker 里编码吗（设置页 / 诊断用）。 */
  offMain(): boolean;
}
export function createEncoder(workerUrl: () => URL | null, onFallback: (why: string) => void): Encoder {
  let worker: Worker | null | undefined;   // undefined = 还没试；null = 没有 / 坏了
  let seq = 0;
  const pending = new Map<number, { args: SaveArgs; resolve: (b: Uint8Array) => void; reject: (e: Error) => void }>();
  const drop = (why: string): void => {
    onFallback(why);
    try { worker?.terminate(); } catch { /* ignore */ }
    worker = null;
    for (const [, p] of pending) { try { p.resolve(saveMxl(p.args)); } catch (e) { p.reject(e as Error); } }   // 在途的改在主线程算
    pending.clear();
  };
  const get = (): Worker | null => {
    if (worker !== undefined) return worker;
    worker = null;
    try {
      const url = workerUrl();
      if (!url || typeof Worker === "undefined") return null;
      const w = new Worker(url, { type: "module" });
      w.onmessage = (e: MessageEvent<EncodeReply>) => {
        const p = pending.get(e.data.seq); if (!p) return;
        pending.delete(e.data.seq);
        if ("bytes" in e.data) { record("encode-worker", e.data.ms); p.resolve(e.data.bytes); } else p.reject(new Error(e.data.error));
      };
      w.onerror = (e) => drop(`encode worker error: ${e.message ?? "?"}`);
      worker = w;
    } catch (e) { drop(`encode worker unavailable: ${(e as Error).message}`); }
    return worker;
  };
  return {
    encode: (args) => {
      const w = get();
      if (!w) return Promise.resolve(saveMxl(args));
      return new Promise<Uint8Array>((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { args, resolve, reject });
        const t0 = performance.now();
        try { w.postMessage({ seq: id, args } satisfies EncodeJob); }
        catch (e) { pending.delete(id); drop(`encode postMessage failed: ${(e as Error).message}`); try { resolve(saveMxl(args)); } catch (err) { reject(err as Error); } return; }
        record("encode-post", performance.now() - t0);
      });
    },
    offMain: () => worker != null,
  };
}
