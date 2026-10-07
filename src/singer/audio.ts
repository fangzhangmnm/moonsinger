// audio.ts —— 全 app 共用一个 AudioContext（iPad 上要在用户手势里 resume 一次）。created 2026-10-07 by Claude Opus 5.5
let ctx: AudioContext | null = null;
export function audioCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
