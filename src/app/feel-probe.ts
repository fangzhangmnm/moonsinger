// feel-probe.ts —— 手感探针：在**用户的设备上**量「手指按下 → 主线程接到 → 音交给声音线程」这两段，以及主线程 / 音频时钟的停顿，超标 = 露出数字 + 进黑匣子。
// created 2026-11-08 by Claude Fable 5.1。起因：user 11-08「键盘延迟非常高」「按下音之后，基本要几乎等一秒才会有发声」——同一台 iPad 上 itch 的 v0.15.4 不慢、同一版在 PC 上不慢、
//   放歌不慢、重启 iPad 没用；代码里按下 → 出声这条路（pad → pad-host → sound.down → worklet，每 128 个采样一块）没有能攒一秒的环节，无头浏览器量到 2–8 ms；
//   浏览器报的输出延迟（AudioContext.outputLatency / getOutputTimestamp）在 iPad 的 WebKit 上永远是 0，靠不住。所以不猜：把三段时间在设备上量出来给人看。
// 量什么（都是纯时间差，不读 DOM）：
//   · queue   = 事件的 timeStamp → 主线程开始处理（主线程之前在忙什么，这一下就排多久）
//   · toSound = 主线程开始处理 → 音交给声音线程（pad / 宿主 / 翻译层这一段花多久）
//   · stall   = 两帧之间最长的空档（主线程被谁卡住了多久；只在探针醒着时量）
//   · audioStep = 音频时钟（AudioContext.currentTime）一步跳多大（系统给的输出块多大：块大 = 按下再快也要等它）
// 什么时候醒：第一次按键起，按键后 20 s 没再按 = 睡（不常驻 rAF；家规「启动速度优先」）。
// 怎么露：任何一项超过门槛 → report(text)，宿主显示一行小字（点一下这次就不再显示）+ 黑匣子一条；都回到门槛下 5 s → report(null) 收起。

export interface FeelHost {
  /** 音频时钟（没建 = null，不为了量而建）。 */
  audioNow(): { t: number; state: string; sr: number } | null;
  /** 露 / 收（text = null 收起）。 */
  report(text: string | null): void;
  /** 黑匣子一条（已经节流过了）。 */
  note(msg: string): void;
  /** 人话一行：数字已经取整、单位 ms。 */
  text(r: FeelReading): string;
}
export interface FeelReading { queue: number; toSound: number; stall: number; audioStep: number }
export interface FeelProbe {
  /** pad 音键 pointerdown 那一刻叫：ts = 事件的 timeStamp。 */
  touch(ts: number): void;
  /** 音交给声音线程了（宿主 sound.down 之后叫）。 */
  sound(): void;
  /** 现在的读数（设置页 / 测试看；没醒过 = null）。 */
  reading(): FeelReading | null;
}

/** 门槛（ms）：超过 = 人能感觉到、该说出来。queue / toSound 80 = 两个动画帧还多；stall 150 = 一下明显的卡；audioStep 150 = 系统给的声音块比正常（iPad ≈ 3–12 ms）大了一个量级。 */
export const FEEL_LIMITS = { queue: 80, toSound: 80, stall: 150, audioStep: 150 } as const;
const AWAKE_MS = 20_000, CALM_MS = 5_000, WINDOW_MS = 5_000;
/** 事件 timeStamp 和 performance.now() 同一条时间轴才能相减（老 WebKit 给的是 epoch 毫秒 = 差出十几亿）：不合理 = 不算这一项。 */
export function queueDelay(now: number, ts: number): number | null { const d = now - ts; return d >= 0 && d < 60_000 ? d : null; }

export function createFeelProbe(host: FeelHost, now: () => number = () => performance.now(), raf: (cb: () => void) => void = (cb) => { requestAnimationFrame(cb); }): FeelProbe {
  let awake = false, lastTouchAt = 0, pending: { at: number } | null = null;
  let last: FeelReading | null = null;
  const q: number[] = [], s: number[] = [];   // 最近几下按键
  const gaps: { at: number; v: number }[] = [], steps: { at: number; v: number }[] = [];   // 最近 WINDOW_MS 的空档 / 音频步
  let prevFrame = 0, prevAudio: number | null = null, prevAudioAt = 0;
  let shown = false, calmSince = 0, lastNoted = "";
  const trim = (xs: { at: number; v: number }[], t: number) => { while (xs.length && xs[0].at < t - WINDOW_MS) xs.shift(); };
  const maxOf = (xs: { at: number; v: number }[]) => xs.reduce((m, x) => Math.max(m, x.v), 0);
  const med = (xs: number[]) => { if (!xs.length) return 0; const a = [...xs].sort((x, y) => x - y); return a[a.length >> 1]; };
  function read(): FeelReading { return { queue: Math.round(med(q)), toSound: Math.round(med(s)), stall: Math.round(maxOf(gaps)), audioStep: Math.round(maxOf(steps)) }; }
  function over(r: FeelReading): boolean { return r.queue > FEEL_LIMITS.queue || r.toSound > FEEL_LIMITS.toSound || r.stall > FEEL_LIMITS.stall || r.audioStep > FEEL_LIMITS.audioStep; }
  function judge(t: number): void {
    const r = read(); last = r;
    if (over(r)) {
      calmSince = 0; shown = true; host.report(host.text(r));
      const a = host.audioNow(), key = `${r.queue}|${r.toSound}|${r.stall}|${r.audioStep}`;
      if (key !== lastNoted) { lastNoted = key; host.note(`key queue ${r.queue} ms, to sound ${r.toSound} ms, max stall ${r.stall} ms, audio step ${r.audioStep} ms${a ? ` (ctx ${a.state}, sr ${a.sr})` : ""}`); }
    } else if (shown) { if (!calmSince) calmSince = t; if (t - calmSince > CALM_MS) { shown = false; calmSince = 0; host.report(null); } }
  }
  function frame(): void {
    const t = now();
    if (!awake) return;
    if (prevFrame) { const g = t - prevFrame; if (g > 40) gaps.push({ at: t, v: g }); }   // 正常一帧 16 ms；> 40 才记（省内存）
    prevFrame = t;
    const a = host.audioNow();
    if (a) {
      if (prevAudio !== null && a.t !== prevAudio) { steps.push({ at: t, v: (a.t - prevAudio) * 1000 }); prevAudioAt = t; }
      else if (prevAudio !== null && a.t === prevAudio && prevAudioAt && t - prevAudioAt > 150) { steps.push({ at: t, v: t - prevAudioAt }); }   // 时钟还没跳：已经停了这么久（跳出来之前就能看见）
      prevAudio = a.t; if (!prevAudioAt) prevAudioAt = t;
    }
    trim(gaps, t); trim(steps, t);
    if (t - lastTouchAt > AWAKE_MS) { awake = false; prevFrame = 0; prevAudio = null; prevAudioAt = 0; if (shown) { shown = false; host.report(null); } return; }
    judge(t);
    raf(frame);
  }
  return {
    touch(ts) {
      const t = now(); lastTouchAt = t; pending = { at: t };
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
