// audio.ts —— 全 app 共用一个 AudioContext（iPad 上要在用户手势里 resume 一次）。created 2026-10-07 by Claude Opus 5.5
// 2026-11-08 Claude Fable 5.1 重理了「叫醒」这件事（user 真机黑匣子，iPad 主屏独立窗 v0.16.25）：
//   ① 第一次按键时才建上下文：state 立刻是 running，但 currentTime 整整 1 秒不走（声音设备在起），之后两步各跳 344 / 243 ms 追上——「按下要等快一秒才出声」就是这一秒。
//      → warmAudio()：第一次点屏幕任何地方就建 + 叫醒（main.ts 挂在 window 上，只一次），设备提前起好，不等到第一个键。
//   ② 页面进后台半秒后一条未接住的报错「InvalidStateError: Failed to start the audio device」：谁读一眼时钟都走 audioCtx()，而它顺手 resume——页面看不见时 iPad 一定拒。
//      → 看不见的时候不叫醒；resume 被拒 = 接住、记黑匣子一条（不再是未接住的报错）。
//   ③ 回前台时 state 写着 running，时钟却停在 34 秒前（「说在跑、其实停着」）。会不会自己接着走，那份日志看不出来。
//      → createAudioWatch：回前台 / 按键之后盯一小会儿，state 是 running 而时钟超过 STUCK_MS 没走 = 先 suspend 再 resume 踢一脚（网页音频在 iOS 上的老办法），踢没踢、踢完走没走都进黑匣子。
//   没做：踢了还不走就整个重建上下文（录音房的 worklet / 音色库 / 唱好的块都要重装，等真机上看到「踢了也不走」再做）。
let ctx: AudioContext | null = null;
let noteFn: (msg: string) => void = () => {};
/** 黑匣子的口（main.ts 接 diagNote("audio", …)）。 */
export function onAudioNote(f: (msg: string) => void): void { noteFn = f; }
const pageHidden = (): boolean => typeof document !== "undefined" && document.visibilityState === "hidden";
let rejectNoted = "";
function wake(c: AudioContext): void {
  if (pageHidden()) return;   // ②
  if (c.state === "suspended" || (c.state as string) === "interrupted") {   // iPad 切后台回来 = interrupted（Safari 的非标准状态）
    c.resume().catch((e) => { const m = String((e as Error)?.message ?? e); if (m !== rejectNoted) { rejectNoted = m; noteFn(`resume rejected: ${m}`); } });
  }
}
export function audioCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  wake(ctx);
  return ctx;
}
/** 只看不建、不叫醒：没建过 = null（手感探针量音频时钟、盯时钟用）。 */
export function audioCtxIfAny(): AudioContext | null { return ctx; }
/** ①：在用户手势里把声音设备提前起好。 */
export function warmAudio(): void { const fresh = !ctx; const c = audioCtx(); if (fresh) noteFn(`warmed on first gesture: ctx ${c.state}, sr ${c.sampleRate}`); }

/** 时钟超过这么久没走才算「停着」。刚建好的上下文设备要起 ~1 s（①），比它短会把正在起的设备踢断。 */
export const STUCK_MS = 1500;
/** 踢一脚之后至少隔这么久再踢。 */
export const KICK_EVERY_MS = 4000;
export interface AudioWatchDeps {
  ctx(): { state: string; currentTime: number; suspend(): Promise<void>; resume(): Promise<void> } | null;
  hidden(): boolean;
  note(msg: string): void;
}
export type AudioAlive = "none" | "ok" | "wait" | "kicked";
/** ③ 盯时钟（纯逻辑，时间从外面给；test/audio-watch.test.ts）。
 *  check(now)：没上下文 / 看不见 = none；时钟比上次看的时候走了 = ok；state 不是 running = 交给 wake（这里只重新起算）；running 且超过 STUCK_MS 没走 = 踢一脚（kicked）。
 *  arm(now)：从现在重新起算（回前台那一刻叫：后台里时钟本来就不走，不能算进「停了多久」）。 */
export function createAudioWatch(d: AudioWatchDeps): { check(now: number): AudioAlive; arm(now: number): void } {
  let seenT = -1, seenAt = 0, kickedAt = -1e9, kicks = 0, frozenNoted = false;
  return {
    arm(now) { const c = d.ctx(); seenT = c ? c.currentTime : -1; seenAt = now; },
    check(now) {
      const c = d.ctx(); if (!c || d.hidden()) return "none";
      if (c.currentTime !== seenT) {
        if (kicks && frozenNoted) { d.note(`clock running again after ${kicks} kick(s)`); }
        seenT = c.currentTime; seenAt = now; kicks = 0; frozenNoted = false; return "ok";
      }
      if (c.state !== "running") { seenAt = now; return "wait"; }   // suspended / interrupted：wake() 的事，醒来之后才开始算「停了多久」
      if (now - seenAt < STUCK_MS || now - kickedAt < KICK_EVERY_MS) return "wait";
      kickedAt = now; kicks++; frozenNoted = true;
      d.note(`clock frozen ${Math.round(now - seenAt)} ms while state=running → suspend + resume (kick ${kicks})`);
      void c.suspend().then(() => c.resume()).catch((e) => d.note(`kick failed: ${String((e as Error)?.message ?? e)}`));
      return "kicked";
    },
  };
}
/** 全 app 那一个（盯的就是上面的 ctx）。 */
export const audioWatch = createAudioWatch({ ctx: () => ctx, hidden: pageHidden, note: (m) => noteFn(m) });

// 准备期间让声音一直醒着（2026-10-08 by Claude Opus 5.5；user「月读第一次渲染好了没有声音，需要重新点一次play」）：
//   第一次唱要下模型、起引擎，几十秒；准备完再开播时早已不在点按的手势里，iPad 可能已经把声音收起来了 = 那一下没声、要再点一次。
//   做法：在手势里起一个输出 0 的源接到扬声器，真开播（或出错）时停掉。不出声，只是不让声音睡着。
let keep: ConstantSourceNode | null = null;
export function holdAudio(): void {
  if (keep) return;
  const c = audioCtx(), s = c.createConstantSource();
  s.offset.value = 0; s.connect(c.destination); s.start(); keep = s;
}
export function releaseAudio(): void {
  const s = keep; keep = null; if (!s) return;
  try { s.stop(); } catch { /* 已停 */ }
  s.disconnect();
}
