// audio.ts —— 全 app 共用一个 AudioContext（iPad 上要在用户手势里 resume 一次）。created 2026-10-07 by Claude Opus 5.5
// 2026-11-08 Claude Fable 5.1 重理了「叫醒」这件事（user 真机黑匣子，iPad 主屏独立窗）。量到的事实：
//   · 第一次叫醒之后 state 立刻是 running，但 currentTime 要过 1 秒左右才开始走（声音设备在起），之后一两步跳几百毫秒追上；没登录网盘、新歌、小月相也一样。
//   · 页面进后台半秒后一条未接住的报错「InvalidStateError: Failed to start the audio device」：谁读一眼时钟都走 audioCtx()，而它顺手 resume——页面看不见时 iPad 一定拒。
//   · 回前台时 state 写着 running，时钟停在进后台那一刻（会不会自己接着走，日志看不出来）。
// 现在的做法：
//   ① warmAudio()：第一次点屏幕 / 按键盘就建 + 叫醒（main.ts 常驻挂着；之后每次手势发现不在跑也顺手叫），设备尽量在按琴键之前起好。
//   ② 看不见的时候不叫醒；resume 被拒 = 接住、记黑匣子一条。
//   ③ 只记账、不动手：上下文每次换状态记一条；按键那一刻不在跑记一条；state 写着 running 而时钟超过 STUCK_MS 没走记一条、又走了再记一条（createAudioWatch）。
// **撤掉的**（v0.16.26 出过货，v0.16.27 拿掉）：时钟停 1.5 秒就 suspend + resume「踢一脚」——没在真机上证实有用就出了货。
//   更正（v0.16.28）：当时把 user 截图里的「longest 6711 ms」算在它头上，是错的——那份黑匣子里那十秒上下文一直是 interrupted，踢一脚只在 running 时动手，没碰过它。
//   真实情况 = 第一次按键 resume 了、系统没理，十秒后第二次按键才醒。所以 ④：手势里叫醒之后没醒 = 接着每 300 ms 再叫，叫 10 秒（只 resume，不 suspend）。
// ⑤ 排队（v0.16.28；user 11-08「截屏上显示的延迟不算太高，但是我听到的很慢，就至少有三百到七百毫秒」）：
//   设备刚起来时音频时钟先停一会儿、再一口气跳几百毫秒（第一份黑匣子：停 1 秒，跳 344 + 243）。一口气跳 = 一瞬间多算了半秒声音，它们排着队播，之后每个音都排在后面
//   = 听到的晚半秒，而时钟、主线程、每一步看起来都正常（WebKit 的 getOutputTimestamp / outputLatency 也不报这一段）。「切后台回来声音比高亮慢一拍」同理。
//   量法：时钟开始走的那一刻记一个锚点，之后「时钟走了多少 − 墙上过了多少」= 多算出来、还排着的量（audioQueuedMs）。
//   清法：flushAudio() = suspend 完了再 resume（把排着的扔掉重新起）。
//   默认自动清（user 11-08「除了验证之外，你也顺便修…给我一个开关，就是恢复旧的错误的模式，然后…我能直接用新的就可以写了，然后我顺便用旧的错误模式加 log 也帮你测一下」）：
//     起来之后量到多算了 AUTO_FLUSH_MS 以上 = 清一次、重新量；连着清 2 次还是多 = 不再清（免得来回重启），记一条。设置 → 开发者能关（= 以前的样子，只量、只记）。
//     这仍然是没在真机上证实过的修法——所以每一步都进黑匣子：start burst（多算了多少）、flush requested、清完之后的 start burst。
// 试验开关（默认关，设置 → 开发者）：setKeepAwake = 一个听不见的极轻信号（40 Hz、−86 dB）一直接着扬声器，看能不能让系统不把设备停掉。没证实，所以不默认开。
let ctx: AudioContext | null = null;
let noteFn: (msg: string) => void = () => {};
/** 黑匣子的口（main.ts 接 diagNote("audio", …)）。 */
export function onAudioNote(f: (msg: string) => void): void { noteFn = f; }
const pageHidden = (): boolean => typeof document !== "undefined" && document.visibilityState === "hidden";
let rejectNoted = "";
const asleep = (c: AudioContext): boolean => c.state === "suspended" || (c.state as string) === "interrupted";   // iPad 切后台回来 = interrupted（Safari 的非标准状态）
function resumeOnce(c: AudioContext): void {
  c.resume().catch((e) => { const m = String((e as Error)?.message ?? e); if (m !== rejectNoted) { rejectNoted = m; noteFn(`resume rejected: ${m}`); } });
}
let retryTimer: ReturnType<typeof setInterval> | undefined, retryUntil = 0;
function wake(c: AudioContext): void {
  if (pageHidden()) return;   // ②
  if (!asleep(c)) return;
  resumeOnce(c);
  // ④ 这一下没醒（真机上见过 interrupted 十秒不理）= 接着叫，不等下一次按键
  retryUntil = performance.now() + 10_000;
  if (retryTimer === undefined) retryTimer = setInterval(() => {
    if (!asleep(c) || pageHidden() || performance.now() > retryUntil) { clearInterval(retryTimer); retryTimer = undefined; return; }
    resumeOnce(c);
  }, 300);
}
export function audioCtx(): AudioContext {
  if (!ctx) { ctx = new AudioContext(); attach(ctx); if (awakeOn) startKeepAwake(ctx); armQueue("created"); }
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
    if (s === "running") { const mine = performance.now() - flushAt < 5000; if (!mine) autoCount = 0; armQueue(mine ? "flush" : "running"); }   // 重新起了一次 = 重新量这一次多算了多少；不是我们自己清出来的 = 自动清的次数从头算
  });
}

// ── ⑤ 排队：时钟比墙上的钟多走了多少 ──────────────────────────────────────────────
/** 纯逻辑（test/audio-queue.test.ts）：一下一下喂（墙上的毫秒，音频时钟的秒）。arm = 等时钟下一次动，动之前最后一下当锚点；
 *  queued = 从锚点起 时钟走的 − 墙上过的（ms）。时钟停过、没追回来 = 那一段是断音不是排队，记进 slack 抵掉，不让它把后来的排队盖住。 */
export function createQueueMeter(): { arm(): void; feed(now: number, ct: number): void; queued(now: number, ct: number): number | null; burst(): number | null } {
  let pending = true, last: { at: number; ct: number } | null = null, anchor: { at: number; ct: number } | null = null, slack = 0, burstMs: number | null = null;
  const raw = (now: number, ct: number): number => (ct - anchor!.ct) * 1000 - (now - anchor!.at);
  return {
    arm() { pending = true; anchor = null; last = null; slack = 0; burstMs = null; },
    feed(now, ct) {
      if (pending) { if (last && ct !== last.ct) { anchor = last; pending = false; } else { last = { at: now, ct }; return; } }
      if (!anchor) return;
      const q = raw(now, ct); if (q < slack) slack = q;   // 落到锚点后面 = 断过音
      if (burstMs === null && now - anchor.at >= BURST_SETTLE_MS) burstMs = Math.round(q - slack);   // 起来一小会儿后定下「这一次多算了多少」（真机上那一口气在几十毫秒里跳完）
    },
    queued(now, ct) { return anchor ? Math.max(0, Math.round(raw(now, ct) - slack)) : null; },
    burst: () => burstMs,
  };
}
/** 时钟开始走之后过这么久，定下这一次多算了多少。 */
export const BURST_SETTLE_MS = 600;
/** 多算了这么多以上 = 清。 */
export const AUTO_FLUSH_MS = 120;
/** 自动清：量到多算了就清不清（纯逻辑）。连着 2 次清完还是多 = 不再清。 */
export function shouldAutoFlush(burstMs: number, on: boolean, doneInARow: number): boolean { return on && burstMs > AUTO_FLUSH_MS && doneInARow < 2; }
let autoFlush = true, autoCount = 0, flushAt = -1e9;
export function setAutoFlush(on: boolean): void { autoFlush = on; noteFn(`auto-flush ${on ? "on" : "off (old behaviour: measure only)"}`); }
export const autoFlushOn = (): boolean => autoFlush;
const queue = createQueueMeter();
let queueTimer: ReturnType<typeof setInterval> | undefined, queueUntil = 0, burstNoted = true;
/** 起了一次 / 清了一次之后盯 20 秒：等时钟动、量这一次多算了多少，记一条。之后 audioQueuedMs 随问随算（不用一直开着定时器）。 */
let queueWhy = "";
function armQueue(why: string): void {
  queueWhy = why;
  queue.arm(); burstNoted = false; queueUntil = performance.now() + 20_000;
  if (queueTimer !== undefined) return;
  queueTimer = setInterval(() => {
    const c = ctx, now = performance.now();
    if (!c || now > queueUntil) { clearInterval(queueTimer); queueTimer = undefined; return; }
    if (pageHidden()) return;
    queue.feed(now, c.currentTime);
    const b = queue.burst();
    if (b !== null && !burstNoted) {
      burstNoted = true;
      const go = shouldAutoFlush(b, autoFlush, autoCount);
      noteFn(`start burst (${queueWhy}): rendered ahead ≈ ${b} ms${go ? " → auto-flush" : b > AUTO_FLUSH_MS ? (autoFlush ? ` (auto-flush gave up after ${autoCount})` : " (auto-flush off)") : ""}`);
      if (go) { autoCount++; flushAudio("auto"); } else if (b <= AUTO_FLUSH_MS) autoCount = 0;
    }
  }, 40);
}
/** 现在大约排着多少毫秒（还没量出来 / 没在跑 = null）。 */
export function audioQueuedMs(): number | null {
  const c = ctx; if (!c || (c.state as string) !== "running") return null;
  const now = performance.now(); queue.feed(now, c.currentTime);
  return queue.queued(now, c.currentTime);
}
/** 清掉排着的：suspend 完了再 resume；重新起来时（statechange → running）重新量。who = 谁要清的（auto / tap）。 */
export function flushAudio(who: "auto" | "tap" = "tap"): void {
  const c = ctx; if (!c || (c.state as string) !== "running") return;
  noteFn(`flush requested (${who}; queued ≈ ${audioQueuedMs() ?? "?"} ms)`);
  flushAt = performance.now(); if (who === "tap") autoCount = 0;
  void c.suspend().then(() => c.resume()).catch((e) => noteFn(`flush failed: ${String((e as Error)?.message ?? e)}`));
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
