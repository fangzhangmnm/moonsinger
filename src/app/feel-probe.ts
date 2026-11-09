// feel-probe.ts —— 手感探针：在**用户的设备上**量「手指按下 → 主线程接到 → 音交给声音线程」这两段，以及主线程 / 音频时钟的停顿，超标 = 露出数字 + 进黑匣子。
// created 2026-11-08 by Claude Fable 5.1。起因：user 11-08「键盘延迟非常高」「按下音之后，基本要几乎等一秒才会有发声」——同一台 iPad 上 itch 的 v0.15.4 不慢、同一版在 PC 上不慢、
//   放歌不慢、重启 iPad 没用；代码里按下 → 出声这条路（pad → pad-host → sound.down → worklet，每 128 个采样一块）没有能攒一秒的环节，无头浏览器量到 2–8 ms；
//   浏览器报的输出延迟（AudioContext.outputLatency / getOutputTimestamp）在 iPad 的 WebKit 上永远是 0，靠不住。所以不猜：把三段时间在设备上量出来给人看。
// 量什么（都是纯时间差，不读 DOM）：
//   · queue   = 事件的 timeStamp → 主线程开始处理（主线程之前在忙什么，这一下就排多久）
//   · toSound = 主线程开始处理 → 音交给声音线程（pad / 宿主 / 翻译层这一段花多久）
//   · stall   = 两帧之间最长的空档（主线程被谁卡住了多久；只在探针醒着时量）
//   · audioStep = 音频时钟（AudioContext.currentTime）一步跳多大（系统给的输出块多大：块大 = 按下再快也要等它）
//   · audioTypical = 音频时钟**平常**一步多大（最近几秒里在走的那些步的中位数）。2026-11-08 Fable 加：user 真机第一张截图「声音块 243 ms」分不清是哪一种——
//       平常一步就是二百多 = 系统给的输出块大（每个音都晚）；平常十几毫秒、只有最长那一下二百多 = 声音刚起来 / 被打断时停了一下（只晚那一个音）。两个数分开报才定得了案。
//       每帧看一次时钟，所以正常读数 ≈ 一帧（16–17 ms），不是真实的块大小（3–12 ms）；块比一帧大时才等于块大小。
// 什么时候醒：第一次按键起，按键后 20 s 没再按 = 睡（不常驻 rAF；家规「启动速度优先」）。
// 怎么露：任何一项超过门槛 → report(text)，宿主显示一行小字（点一下这次就不再显示）+ 黑匣子一条；都回到门槛下 5 s → report(null) 收起。

export interface FeelHost {
  /** 音频时钟（没建 = null，不为了量而建）。 */
  audioNow(): { t: number; state: string; sr: number; info?: string; /** 排着的声音大约多少毫秒（宿主算，src/singer/audio.ts ⑤；量不出 = null）。 */ queued?: number | null } | null;   // info = 黑匣子里多带的一句（浏览器报的延迟、是不是独立窗…），探针不读
  /** 露 / 收（text = null 收起）。 */
  report(text: string | null): void;
  /** 黑匣子一条（已经节流过了）。 */
  note(msg: string): void;
  /** 人话一行：数字已经取整、单位 ms。late = 有一项超了门槛（没超、只是「一直显示」开着 = false）。 */
  text(r: FeelReading, late: boolean): string;
  /** 「一直显示」开着（查延迟时：不超门槛也露数字）。 */
  always?(): boolean;
}
export interface FeelReading { queue: number; toSound: number; stall: number; audioStep: number; audioTypical: number; /** 排着的声音（ms；量不出 = null）：听到的比按下晚这么多，而别的几项都看不出来。 */ queued: number | null }
export interface FeelProbe {
  /** pad 音键 pointerdown 那一刻叫：ts = 事件的 timeStamp。 */
  touch(ts: number): void;
  /** 音交给声音线程了（宿主 sound.down 之后叫）。 */
  sound(): void;
  /** 现在的读数（设置页 / 测试看；没醒过 = null）。 */
  reading(): FeelReading | null;
}

/** 门槛（ms）：超过 = 人能感觉到、该说出来。queue / toSound 80 = 两个动画帧还多；stall 150 = 一下明显的卡；audioStep 150 = 系统给的声音块比正常（iPad ≈ 3–12 ms）大了一个量级。 */
//   audioTypical 60（2026-11-08 加）：每帧看一次时钟，正常读数 ≈ 一帧（16–17 ms）；平常一步就六十多 = 系统一次要三千个采样上下，按键已经拖手，但到不了 audioStep 的 150。
export const FEEL_LIMITS = { queue: 80, toSound: 80, stall: 150, audioStep: 150, audioTypical: 60, queued: 100 } as const;
const AWAKE_MS = 20_000, CALM_MS = 5_000, WINDOW_MS = 5_000;
/** 事件 timeStamp 和 performance.now() 同一条时间轴才能相减（老 WebKit 给的是 epoch 毫秒 = 差出十几亿）：不合理 = 不算这一项。 */
export function queueDelay(now: number, ts: number): number | null { const d = now - ts; return d >= 0 && d < 60_000 ? d : null; }

export function createFeelProbe(host: FeelHost, now: () => number = () => performance.now(), raf: (cb: () => void) => void = (cb) => { requestAnimationFrame(cb); }): FeelProbe {
  let awake = false, lastTouchAt = 0, pending: { at: number } | null = null;
  let last: FeelReading | null = null;
  const q: number[] = [], s: number[] = [];   // 最近几下按键
  const gaps: { at: number; v: number }[] = [], steps: { at: number; v: number }[] = [], adv: { at: number; v: number }[] = [];   // 最近 WINDOW_MS 的空档 / 音频步（含「停了这么久」）/ 只算在走的那些步
  let prevFrame = 0, prevAudio: number | null = null, prevAudioAt = 0;
  let shown = false, calmSince = 0, lastNoted = "", lastNoteAt = -1e9, worst: FeelReading | null = null;
  const trim = (xs: { at: number; v: number }[], t: number) => { while (xs.length && xs[0].at < t - WINDOW_MS) xs.shift(); };
  const maxOf = (xs: { at: number; v: number }[]) => xs.reduce((m, x) => Math.max(m, x.v), 0);
  const med = (xs: number[]) => { if (!xs.length) return 0; const a = [...xs].sort((x, y) => x - y); return a[a.length >> 1]; };
  function read(): FeelReading { return { queue: Math.round(med(q)), toSound: Math.round(med(s)), stall: Math.round(maxOf(gaps)), audioStep: Math.round(maxOf(steps)), audioTypical: Math.round(med(adv.map((x) => x.v))), queued: host.audioNow()?.queued ?? null }; }
  function over(r: FeelReading): boolean { return r.queue > FEEL_LIMITS.queue || r.toSound > FEEL_LIMITS.toSound || r.stall > FEEL_LIMITS.stall || r.audioStep > FEEL_LIMITS.audioStep || r.audioTypical > FEEL_LIMITS.audioTypical || (r.queued ?? 0) > FEEL_LIMITS.queued; }
  let sess = { keys: 0, stall: 0, step: 0 };   // 这一段按键（醒着的这一回）：按了几下、最坏到多少——睡的时候记一条，不管超没超（黑匣子里每段都有数）
  function judge(t: number): void {
    const r = read(); last = r;
    sess.stall = Math.max(sess.stall, r.stall); sess.step = Math.max(sess.step, r.audioStep);
    if (!over(r) && host.always?.()) { shown = true; calmSince = 0; host.report(host.text(r, false)); return; }
    if (over(r)) {
      calmSince = 0; shown = true; host.report(host.text(r, true));
      const a = host.audioNow(), key = `${r.queue}|${r.toSound}|${r.stall}|${r.audioStep}|${r.audioTypical}|${Math.round((r.queued ?? 0) / 50)}`;
      if (!worst || r.audioStep > worst.audioStep || r.stall > worst.stall || r.queue > worst.queue || r.toSound > worst.toSound) worst = r;
      // 黑匣子最多半秒一条（v0.16.25 一次停一秒 = 每帧一条、五十条数数；收起时另记一条「最坏到多少」）
      if (key !== lastNoted && t - lastNoteAt >= 500) { lastNoted = key; lastNoteAt = t; host.note(`key queue ${r.queue} ms, to sound ${r.toSound} ms, max stall ${r.stall} ms, audio step typical ${r.audioTypical} ms / max ${r.audioStep} ms, queued ${r.queued ?? "?"} ms${a ? ` (ctx ${a.state}, sr ${a.sr}${a.info ? `, ${a.info}` : ""})` : ""}`); }
    } else if (shown) { if (!calmSince) calmSince = t; if (t - calmSince > CALM_MS) { shown = false; calmSince = 0; host.report(null);
      if (worst) { host.note(`calm again; worst: key queue ${worst.queue} ms, to sound ${worst.toSound} ms, max stall ${worst.stall} ms, audio step max ${worst.audioStep} ms`); worst = null; } } }
  }
  function frame(): void {
    const t = now();
    if (!awake) return;
    if (prevFrame) { const g = t - prevFrame; if (g > 40) gaps.push({ at: t, v: g }); }   // 正常一帧 16 ms；> 40 才记（省内存）
    prevFrame = t;
    const a = host.audioNow();
    if (a) {
      if (prevAudio !== null && a.t !== prevAudio) { const v = (a.t - prevAudio) * 1000; steps.push({ at: t, v }); adv.push({ at: t, v }); prevAudioAt = t; }
      else if (prevAudio !== null && a.t === prevAudio && prevAudioAt && t - prevAudioAt > 150) { steps.push({ at: t, v: t - prevAudioAt }); }   // 时钟还没跳：已经停了这么久（跳出来之前就能看见）
      prevAudio = a.t; if (!prevAudioAt) prevAudioAt = t;
    }
    trim(gaps, t); trim(steps, t); trim(adv, t);
    if (t - lastTouchAt > AWAKE_MS) {
      awake = false; prevFrame = 0; prevAudio = null; prevAudioAt = 0; if (shown) { shown = false; host.report(null); }
      const r = read(), a = host.audioNow();
      if (sess.keys) host.note(`session: ${sess.keys} keys, queue ${r.queue} ms, to sound ${r.toSound} ms, max stall ${sess.stall} ms, audio step typical ${r.audioTypical} ms / max ${sess.step} ms, queued ${r.queued ?? "?"} ms${a ? ` (ctx ${a.state}, sr ${a.sr}${a.info ? `, ${a.info}` : ""})` : ""}`);
      sess = { keys: 0, stall: 0, step: 0 }; worst = null;
      return;
    }
    judge(t);
    raf(frame);
  }
  return {
    touch(ts) {
      const t = now(); lastTouchAt = t; pending = { at: t }; sess.keys++;
      const d = queueDelay(t, ts); if (d !== null) { q.push(d); if (q.length > 8) q.shift(); }
      if (!awake) { awake = true; prevFrame = 0; prevAudio = null; prevAudioAt = 0; raf(frame); }
    },
    sound() {
      if (!pending) return; const d = now() - pending.at; pending = null;
      if (d >= 0 && d < 60_000) { s.push(d); if (s.length > 8) s.shift(); }
    },
    reading: () => last,
  };
}
