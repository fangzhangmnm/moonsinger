// audio.ts —— 全 app 共用一个 AudioContext（iPad 上要在用户手势里 resume 一次）。created 2026-10-07 by Claude Opus 5.5
// 2026-11-08 Claude Fable 5.1 重理了「叫醒」这件事（user 真机黑匣子，iPad 主屏独立窗）。量到的事实：
//   · 第一次叫醒之后 state 立刻是 running，但 currentTime 要过 1 秒左右才开始走（声音设备在起），之后一两步跳几百毫秒追上；没登录网盘、新歌、小月相也一样。
//   · 页面进后台半秒后一条未接住的报错「InvalidStateError: Failed to start the audio device」：谁读一眼时钟都走 audioCtx()，而它顺手 resume——页面看不见时 iPad 一定拒。
//   · 回前台时 state 写着 running，时钟停在进后台那一刻（会不会自己接着走，日志看不出来）。
// 现在的做法：
//   ① warmAudio()：第一次点屏幕 / 按键盘就建 + 叫醒（main.ts 常驻挂着；之后每次手势发现不在跑也顺手叫），设备尽量在按琴键之前起好。
//   ② 看不见的时候不叫醒；resume 被拒 = 接住、记黑匣子一条。
//   ③ 只记账、不动手：上下文每次换状态记一条；按键那一刻不在跑记一条；state 写着 running 而时钟超过 STUCK_MS 没走记一条、又走了再记一条（createAudioWatch）。
// **撤掉的**（v0.16.26 出过货，v0.16.27 拿掉）：时钟停 1.5 秒就 suspend + resume「踢一脚」。真机上设备本来就要一秒多才起，踢一脚 = 把正在起的设备打断重来，
//   第一个音从等 1 秒变成等 6.7 秒（user 11-08 截图「audio block usual 0 ms / longest 6711 ms」）。没在真机上证实有用的「修法」不许再往这里加。
// 试验开关（默认关，设置 → 开发者）：setKeepAwake = 一个听不见的极轻信号（40 Hz、−86 dB）一直接着扬声器，看能不能让系统不把设备停掉。没证实，所以不默认开。
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
  if (!ctx) { ctx = new AudioContext(); attach(ctx); if (awakeOn) startKeepAwake(ctx); }
  wake(ctx);
  return ctx;
}
/** 只看不建、不叫醒：没建过 = null（手感探针量音频时钟、盯时钟用）。 */
export function audioCtxIfAny(): AudioContext | null { return ctx; }
/** ①：在用户手势里把声音设备提前起好。 */
export function warmAudio(): void { const fresh = !ctx; const c = audioCtx(); if (fresh) noteFn(`warmed on first gesture: ctx ${c.state}, sr ${c.sampleRate}`); }
/** ③ 换状态记一条（只记，不动手）。 */
function attach(c: AudioContext): void {
  let prev = c.state as string;
  c.addEventListener("statechange", () => {
    const s = c.state as string; if (s === prev) return;
    noteFn(`state ${prev} → ${s} (page ${pageHidden() ? "hidden" : "visible"}, t=${c.currentTime.toFixed(2)})`); prev = s;
  });
}
/** ③ 按键那一刻上下文不在跑（这个键多半要晚）——记一条，最多一秒一条。 */
let asleepNotedAt = -1e9;
export function noteKeyAsleep(now: number): void {
  const c = ctx; if (!c || (c.state as string) === "running" || now - asleepNotedAt < 1000) return;
  asleepNotedAt = now; noteFn(`key pressed while ctx ${c.state} (t=${c.currentTime.toFixed(2)})`);
}
/** 试验：保持醒着（默认关）。 */
let awakeOn = false, awakeNodes: { osc: OscillatorNode; gain: GainNode } | null = null;
function startKeepAwake(c: AudioContext): void {
  if (awakeNodes) return;
  const osc = c.createOscillator(), gain = c.createGain();
  osc.frequency.value = 40; gain.gain.value = 0.00005;   // −86 dB：扬声器放不出、耳机里远低于听阈
  osc.connect(gain); gain.connect(c.destination); osc.start();
  awakeNodes = { osc, gain }; noteFn("keep-awake on");
}
export function setKeepAwake(on: boolean): void {
  awakeOn = on;
  if (on) { if (ctx) startKeepAwake(ctx); return; }
  const n = awakeNodes; awakeNodes = null; if (!n) return;
  try { n.osc.stop(); } catch { /* 已停 */ }
  n.osc.disconnect(); n.gain.disconnect(); noteFn("keep-awake off");
}
export const keepAwakeOn = (): boolean => awakeOn;

/** 时钟超过这么久没走才记「停着」（设备正常起要一秒左右，不算）。 */
export const STUCK_MS = 2500;
export interface AudioWatchDeps {
  ctx(): { state: string; currentTime: number } | null;
  hidden(): boolean;
  note(msg: string): void;
}
export type AudioAlive = "none" | "ok" | "wait" | "frozen";
/** ③ 盯时钟（纯逻辑，时间从外面给；test/audio-watch.test.ts）。**只记账，不动上下文**（原来这里会 suspend + resume，真机上帮了倒忙，见文件头）。
 *  check(now)：没上下文 / 看不见 = none；时钟比上次看的时候走了 = ok；state 不是 running = wait（从醒来起算）；running 且超过 STUCK_MS 没走 = frozen（每一回只记一条，又走了再记一条带停了多久）。
 *  arm(now)：从现在重新起算（回前台那一刻叫：后台里时钟本来就不走）。 */
export function createAudioWatch(d: AudioWatchDeps): { check(now: number): AudioAlive; arm(now: number): void } {
  let seenT = -1, seenAt = 0, frozenNoted = false;
  return {
    arm(now) { const c = d.ctx(); seenT = c ? c.currentTime : -1; seenAt = now; frozenNoted = false; },
    check(now) {
      const c = d.ctx(); if (!c || d.hidden()) return "none";
      if (c.currentTime !== seenT) {
        if (frozenNoted) d.note(`clock running again after ${Math.round(now - seenAt)} ms frozen`);
        seenT = c.currentTime; seenAt = now; frozenNoted = false; return "ok";
      }
      if (c.state !== "running") { seenAt = now; return "wait"; }
      if (now - seenAt < STUCK_MS) return "wait";
      if (!frozenNoted) { frozenNoted = true; d.note(`clock frozen ${Math.round(now - seenAt)} ms while state=running (t=${c.currentTime.toFixed(2)})`); }
      return "frozen";
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
