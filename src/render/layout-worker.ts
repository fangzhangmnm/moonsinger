// layout-worker.ts —— 排版进 worker：engrave（排版）+ toSvgParts（SVG 串化）在这条线程上跑，主线程只收「SVG 分组字符串 + 命中数据」。
//   created 2026-10-21 by Claude Fable 5.1（user 10-21「排版搬到后台线程…这个活也加进去，而且不止这个，好好的看一下性能，怎么样大歌能做到实时输入演奏，尽量做到音游级别的延迟」；
//   量与前提 = ai-docs/20261017-input-latency-probe.md §6–§7½：大歌一键 engrave 28–87 ms + 串化 7 ms 占着主线程，快弹时下一个键要等它们跑完（28–51 ms）——这是音游级延迟唯一剩下的坎）。
//   协议：主线程发 LayoutJob（seq + song 的结构化克隆 + 排版选项 + 歌词字号），这里回 LayoutReply（同 seq + parts + 去掉闭包的 Layout）；主线程按 seq 丢掉作废的回执。
//   量字宽：OffscreenCanvas 上同一串字体（src/render/lyric-font.ts；2026-10-17 核过和主线程逐位相同）。没有 OffscreenCanvas 的浏览器 = 主线程不建这个 worker（score-view 走原来的同步路）。
//   纯函数 runLayoutJob 单独导出（node 测试喂一把假尺子）；self.onmessage 只在 worker 环境里挂。
import { engrave, stripLayoutFns, type EngraveOpts, type LayoutData } from "./engrave.ts";
import { toSvgParts } from "./svg.ts";
import { measurerOn } from "./lyric-font.ts";
import type { Song } from "../score/song.ts";

export interface LayoutJob { seq: number; song: Song; opts: Omit<EngraveOpts, "measureLyric">; font: string }
export type SvgParts = { open: string; groups: string[]; close: string };
export type LayoutReply = { seq: number; parts: SvgParts; data: LayoutData; ms: number } | { seq: number; error: string };

export function runLayoutJob(job: LayoutJob, measure: (s: string) => number, now: () => number = () => performance.now()): LayoutReply {
  const t0 = now();
  const L = engrave(job.song, { ...job.opts, measureLyric: measure });
  const parts = toSvgParts(L);
  return { seq: job.seq, parts, data: stripLayoutFns(L), ms: now() - t0 };
}

type WorkerSelf = { postMessage(m: unknown): void; onmessage: ((e: MessageEvent<LayoutJob>) => void) | null };
if (typeof document === "undefined" && typeof self !== "undefined" && typeof (self as unknown as WorkerSelf).postMessage === "function" && typeof OffscreenCanvas !== "undefined") {
  const ws = self as unknown as WorkerSelf;
  const ctx = new OffscreenCanvas(1, 1).getContext("2d")!;
  ws.onmessage = (e) => {
    const job = e.data;
    try { ws.postMessage(runLayoutJob(job, measurerOn(ctx, job.font))); }
    catch (err) { ws.postMessage({ seq: job.seq, error: String((err as Error)?.stack ?? err) } satisfies LayoutReply); }
  };
}
