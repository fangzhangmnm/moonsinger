// audio.ts —— 全 app 共用一个 AudioContext（iPad 上要在用户手势里 resume 一次）。created 2026-10-07 by Claude Opus 5.5
// 2026-11-08 Claude Fable 5.1 重理（user 真机黑匣子，iPad 主屏独立窗；事后调查 = ai-docs/20261108-key-latency-postmortem.md）。
// 病：声音设备有时「起得脏」——上下文说 running 之后设备过一会儿才真的开始要声音，这段时间里渲染那一头已经多算了一截（起得越慢多算得越多：等 0.3 s 多算 224 ms，等 1 s 多算 587 ms）。
//   多算的排着队播，之后每个音都排在它后面 = 听到的晚这么多，直到下一次重起。音频时钟、主线程、每一步看起来都正常；WebKit 的 getOutputTimestamp / outputLatency 不报这一段（0–4 ms）。
//   「切后台回来声音比高亮慢一拍」同一个病。起得干净的那几次（多算 0–3 ms）user「完全好了」「非常的顺手」。
//   **更正（v0.16.32）**：原来这里写「真机证实：224 ms → suspend + resume → 重新量 1 ms，user『延迟好了很多』」——不成立。① 这只表每清一次就从零重新量，清完读到 1–2 ms 是必然的，
//   不说明排着的真被丢掉了；② 对时间，那句「好了很多」说的是紧接着的下一次启动（本来就起得干净）。v0.16.31 真机：两次冷启动多算 906 / 779 ms、都自动清了、表上 2 ms，
//   user「现在好像又变慢了」。推断（没法直接量）：suspend + resume 不丢排着的那一截（WebKit 的出声口 = 一个环形缓冲，读写两头的位置在停 / 起之间都留着）。
// 治：
//   ① 量：createQueueMeter——时钟开始走那一刻记锚点，之后「时钟走的 − 墙上过的」= 排着多少。起来 BURST_SETTLE_MS 后定下这一次多算了多少，黑匣子记一条。
//   ② 清 = flushAudio（suspend 完了再 resume）再量。**永远开着，没有开关**（user 11-08）。两条线（v0.16.31）：
//      · 起来时多算了 FLUSH_NOW_MS（120）以上 = 当场清（真机证实过的做法；连着 2 次清完还是多 = 这一次不再清，不来回重起）。
//      · 排着 FLUSH_IDLE_MS（30）以上、不到 120 = 不当场清（suspend 会把正在响的音硬掐一下），留给空当：宿主在**确认没有音在响**的时候叫 idleFlushAudio
//        （没有键按着、离上次按 / 松 1.5 秒以上、没在放、录音房报的在响的声音数 = 0；最多 10 秒一次）。弹着的中途排队涨上去也走这条。
//      自查（v0.16.30；user 11-08「现在这个版本，我切后台再回来之后，它是直接没有声音了」——原因没从代码里读出来，清是嫌疑之一）：resume 叫出去 1 秒后上下文还没在跑
//      = 走 ③ 接着叫，并且这次打开不再自动清（flushBroken，黑匣子记一条）。回前台时状态没变而时钟不走（设备其实停过）= 再量一次这次起来（audioShown）。
//   ③ 叫醒：第一次点屏幕 / 按键盘就建 + resume（warmAudio；main.ts 常驻挂着，之后每次手势发现不在跑也顺手叫）；看不见的时候不叫（iPad 一定拒，还留下一条报错）；
//      叫了没醒 = 每 300 ms 再叫、叫 10 秒（黑匣子里见过 interrupted 十秒、到下一次按键才醒）。
//   ⑤ 换出声口 reviveAudio（v0.16.32；user 11-08「也给用户一个手动按的按钮吧…如果觉得按键有延迟的话，你按一下」）：把 destination 的声道数改一下再改回来——
//      WebKit / Chromium 在声道数变的时候会把通向硬件的那一段整个重建（新的环形缓冲，旧的连同排着的一起扔）。**没在真机上证实**，这一版先只给两处用：
//      · 设置里的「重启声音」（人按的：觉得晚 / 没声）；
//      · 「写着 running、时钟却不走」（真机 v0.16.31 黑匣子：离开 3 分多钟回来，state 一直 running、时钟停在离开那一刻 20 多秒、按键都没声——
//        叫醒那一套只认 suspended / interrupted，对它一条都不动手）：回前台 1 秒还不走 / 按键时发现不走 = 自动换。
//      换完 0.5 秒时钟还不走 = 退回老办法 suspend + resume；再不走 = 记一条。自动清（②）这一版照旧走 suspend + resume，等这个证实了再换。
//   ⑥ 垫脚（v0.16.32，iPad 才开，设置 → 开发者能关着对照；user 11-08「你试一下吧…我觉得也是启动的问题」）：真正出声的那一个上下文**永远不经历冷启动**。
//      量到的：起得脏的都是冷启动（硬件现起，0.3–1 秒：多算 224 / 587 / 906 / 779 ms）；硬件醒着时再起只要 1–11 ms、多算 0–3 ms。
//      做法：真正的那一个还没起来过的时候，叫醒它 = 先起一个不出声的垫脚上下文，等垫脚的时钟走稳了（硬件醒了）才 resume 真正的那一个；它起来、量完之后把垫脚关掉。
//      垫脚 4 秒起不来 = 不等了，直接起真正的那一个（= 以前的样子）。**没在真机上证实**；黑匣子记 `primer: …` 几行 + 真正那一个的 start burst。
//   ④ 记账（黑匣子 [audio]）：上下文每次换状态、按键那一刻不在跑 / 在跑但时钟没走、每次起来多算了多少 / 设备起了多久、每次清、清完没起来。
// 出过货又撤掉的（没在真机上证实就别往这里加）：v0.16.26 时钟停 1.5 s 就 suspend + resume「踢一脚」（撤于 v0.16.27）；v0.16.27 盯时钟只记账、试验「保持醒着」的听不见的信号、
//   v0.16.28「自动清掉」的开关（三样撤于 v0.16.30：user「多余的补丁…可以撤了」「Auto Clear…这个开关不要，而是一直开的」）。
let ctx: AudioContext | null = null;
let noteFn: (msg: string) => void = () => {};
/** 黑匣子的口（main.ts 接 diagNote("audio", …)）。 */
export function onAudioNote(f: (msg: string) => void): void { noteFn = f; }
const pageHidden = (): boolean => typeof document !== "undefined" && document.visibilityState === "hidden";
const asleep = (c: AudioContext): boolean => c.state === "suspended" || (c.state as string) === "interrupted";   // iPad 切后台回来 = interrupted（Safari 的非标准状态）
let rejectNoted = "";
function resumeOnce(c: AudioContext): void {
  c.resume().catch((e) => { const m = String((e as Error)?.message ?? e); if (m !== rejectNoted) { rejectNoted = m; noteFn(`resume rejected: ${m}`); } });
}
let retryTimer: ReturnType<typeof setInterval> | undefined, retryUntil = 0;
function wake(c: AudioContext): void {
  if (pageHidden() || !asleep(c)) return;
  if (primerPending()) { startPrimer(c); return; }   // ⑥ 还没起来过：先让垫脚把硬件叫醒
  resumeOnce(c);
  retryUntil = performance.now() + 10_000;   // ③ 这一下没醒 = 接着叫，不等下一次按键
  if (retryTimer === undefined) retryTimer = setInterval(() => {
    if (!asleep(c) || pageHidden() || performance.now() > retryUntil) { clearInterval(retryTimer); retryTimer = undefined; return; }
    resumeOnce(c);
  }, 300);
}
export function audioCtx(): AudioContext {
  if (!ctx) { ctx = new AudioContext(); attach(ctx); armQueue("created"); }
  wake(ctx);
  return ctx;
}
/** 只看不建、不叫醒：没建过 = null。 */
export function audioCtxIfAny(): AudioContext | null { return ctx; }
/** ③ 在用户手势里把声音设备提前起好。 */
export function warmAudio(): void { gestureAt ||= performance.now(); const fresh = !ctx; const c = audioCtx(); if (fresh) noteFn(`warmed on first gesture: ctx ${c.state}, sr ${c.sampleRate}`); }

// ── ⑥ 垫脚：真正出声的那一个不经历冷启动（见文件头）──────────────────────────────
let primerUse = false, everRan = false, gestureAt = 0;   // everRan = 真正的那一个的时钟走起来过（之后的叫醒照旧）；gestureAt = 第一次手势（warmAudio 只从手势里叫）
let primer: AudioContext | null = null, primerOk = false, primerFailed = false, primerPoll: ReturnType<typeof setInterval> | undefined;
/** 用不用垫脚（宿主定：iPad 才开；设置 → 开发者能关）。真正的那一个已经起来过 = 这次打开不再有区别。 */
export function setPrimer(on: boolean): void {
  if (primerUse !== on) { primerUse = on; noteFn(`primer ${on ? "on" : "off"}`); }
  // 真正的那一个要在**手势之外**先建好（停着）：在手势里才建的上下文浏览器会当场把它起起来（冷启动），垫脚就来不及了。
  if (on && !ctx && typeof AudioContext !== "undefined") audioCtx();
}
export const primerOn = (): boolean => primerUse;
const primerPending = (): boolean => primerUse && !everRan && !primerOk && !primerFailed;
function startPrimer(real: AudioContext): void {
  if (!primer) {
    try { primer = new AudioContext(); } catch (e) { primerFailed = true; noteFn(`primer: cannot create (${String((e as Error)?.message ?? e)}) → starting the real one directly`); wake(real); return; }
    const p0 = primer; let prev = p0.state as string; noteFn(`primer: created (${prev}); the real one is ${real.state}`);
    p0.addEventListener("statechange", () => { const s = p0.state as string; if (s !== prev) { noteFn(`primer: state ${prev} → ${s}`); prev = s; } });
  }
  const p = primer;
  if (asleep(p)) p.resume().catch(() => { /* 手势外会被拒，下一次手势再叫 */ });
  if (primerPoll !== undefined || (!gestureAt && (p.state as string) !== "running")) return;   // 还没有过手势、垫脚也没在跑 = 没什么可盯的（不从开机起就挂一个 10 ms 的定时器）
  const t0 = p.currentTime, askedAt = performance.now(); let movedAt = 0, lastT = t0, lastAt = askedAt;
  primerPoll = setInterval(() => {
    const now = performance.now(), stop = () => { clearInterval(primerPoll); primerPoll = undefined; };
    if (!primerPending() || primer !== p) { stop(); return; }
    if (pageHidden()) return;
    const t = p.currentTime; if (t !== lastT) { lastT = t; lastAt = now; if (!movedAt) movedAt = now; }
    if (movedAt && now - movedAt >= 150 && now - lastAt < 60) {   // 走起来 150 ms 了、还在走 = 那一口气跳完了，硬件醒着
      primerOk = true; stop();
      noteFn(`primer: device up ≈ ${Math.round(movedAt - (gestureAt || askedAt))} ms after the first gesture (primer rendered ${Math.round((t - t0) * 1000)} ms by now) → starting the real one`);
      wake(real); return;
    }
    if (!movedAt && now - (gestureAt || askedAt) > 4000) {
      primerFailed = true; stop();
      noteFn(`primer: no clock 4 s after the first gesture (primer ${p.state}) → starting the real one directly`);
      wake(real);
    }
  }, 10);
}
/** 真正的那一个起来、量完了：垫脚用完，关掉（不留一个一直挂着的上下文）。 */
function retirePrimer(): void {
  const p = primer; primer = null; if (!p) return;
  setTimeout(() => { p.close().then(() => noteFn("primer: closed"), (e) => noteFn(`primer: close failed (${String((e as Error)?.message ?? e)})`)); }, 2000);
}
/** ④ 换状态记一条；重新起了一次 = 重新量。 */
function attach(c: AudioContext): void {
  let prev = c.state as string;
  c.addEventListener("statechange", () => {
    const s = c.state as string; if (s === prev) return;
    noteFn(`state ${prev} → ${s} (page ${pageHidden() ? "hidden" : "visible"}, t=${c.currentTime.toFixed(2)})`); prev = s;
    if (s === "running") { const mine = performance.now() - flushAt < 5000; if (!mine) autoCount = 0; armQueue(mine ? "flush" : "running"); }   // 不是我们自己清出来的那一次 = 清的次数从头算
  });
}
/** ④ 按键那一刻上下文不在跑（这个键多半要晚 / 没声），或者写着 running 而时钟从上一次按键到现在没走过（设备没在要声音 = 没声）——各记一条，最多一秒一条。只记，不动手。 */
let asleepNotedAt = -1e9, keyCt = -1, keyCtAt = 0;
export function noteKeyAsleep(now: number): void {
  const c = ctx; if (!c) return;
  if ((c.state as string) !== "running") { keyCt = -1; if (now - asleepNotedAt >= 1000) { asleepNotedAt = now; noteFn(`key pressed while ctx ${c.state} (t=${c.currentTime.toFixed(2)})`); } return; }
  const t = c.currentTime;
  // ⑤ 回前台时就发现时钟不走、到这次按键还是那个值 = 第一个键就换出声口（在这次按键的手势里），不等第二个键来对比
  if (shownFrozen && shownFrozen.t === t && now - shownFrozen.at > 500) {
    noteFn(`key pressed while clock frozen since coming back ≥ ${Math.round(now - shownFrozen.at)} ms (ctx running, t=${t.toFixed(2)})`);
    keyCt = t; keyCtAt = now; void reviveAudio("frozen-key"); return;
  }
  if (t !== keyCt) { keyCt = t; keyCtAt = now; return; }
  if (now - keyCtAt <= 400) return;
  if (now - asleepNotedAt >= 1000) { asleepNotedAt = now; noteFn(`key pressed while clock frozen ≥ ${Math.round(now - keyCtAt)} ms (ctx running, t=${t.toFixed(2)})`); }
  void reviveAudio("frozen-key");   // ⑤ 两次按键之间时钟没走过 = 这个键没声：换出声口
}

// ── ① 量：时钟比墙上的钟多走了多少 ──────────────────────────────────────────────
/** 纯逻辑（test/audio-queue.test.ts）：一下一下喂（墙上的毫秒，音频时钟的秒）。arm = 等时钟下一次动，动之前最后一下当锚点（误差 = 喂得多密）；
 *  queued = 从锚点起 时钟走的 − 墙上过的（ms）。时钟停过、没追回来 = 那一段是断音不是排队，记进 slack 抵掉，不让它把后来的排队盖住。 */
export function createQueueMeter(): { arm(): void; feed(now: number, ct: number): void; queued(now: number, ct: number): number | null; burst(): number | null; anchorAt(): number | null } {
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
    anchorAt: () => (anchor ? anchor.at : null),   // 时钟开始走的那一刻（墙上的毫秒）
  };
}
/** 时钟开始走之后过这么久，定下这一次多算了多少。 */
export const BURST_SETTLE_MS = 600;
/** 起来时多算了这么多以上 = 当场清（不等空当）。真机上量到的：起得干净 = 1 ms（PC 2–7 ms），起得脏 = 224 / 587 ms；v0.16.28 / 29 就是这条线，清完 user「延迟好了很多」。 */
export const FLUSH_NOW_MS = 120;
/** 排着这么多以上 = 等没有音在响的空当清。user 11-08「手感好的时候它显示都是一毫秒、两毫秒，然后那是手感不好的时候它显示是四十多毫秒」
 *  （哪一个数他自己也不确定；干净时排队读数正好是 1 ms，所以多半是这一项——**没证实**）→ 线划在 30：比干净的读数加量的误差（锚点最多差一个 10 ms 的定时器间隔）高，比四十多低。
 *  v0.16.30 这条线也管当场清；user 用下来「响应延迟非常的顺手，非常的快」。v0.16.31 把 30–120 这一档改成只在空当清：当场清会掐到正在响的音。 */
export const FLUSH_IDLE_MS = 30;
/** 起来之后量到多算了：当场清不清（纯逻辑）。连着 2 次清完还是多 = 这一次不再清。 */
export function shouldAutoFlush(burstMs: number, doneInARow: number): boolean { return burstMs > FLUSH_NOW_MS && doneInARow < 2; }
let autoCount = 0, flushAt = -1e9, flushBroken = false;   // flushBroken = 这次打开里有一次清完没起来：之后不再自动清（点横幅那一行手动清照旧）
const queue = createQueueMeter();
let queueTimer: ReturnType<typeof setInterval> | undefined, queueUntil = 0, burstNoted = true, queueWhy = "", armAt = 0;
/** 起了一次 / 清了一次之后盯 20 秒（10 ms 一下：锚点的误差就是这个间隔）：等时钟动、量这一次多算了多少，记一条、该清就清。之后 audioQueuedMs 随问随算。 */
function armQueue(why: string): void {
  queueWhy = why; armAt = performance.now();
  queue.arm(); burstNoted = false; queueUntil = armAt + 20_000;
  if (queueTimer !== undefined) return;
  queueTimer = setInterval(() => {
    const c = ctx, now = performance.now();
    if (!c || now > queueUntil) { clearInterval(queueTimer); queueTimer = undefined; return; }
    if (pageHidden()) return;
    queue.feed(now, c.currentTime);
    const b = queue.burst();
    if (b !== null && !burstNoted) {
      burstNoted = true; if (!everRan) { everRan = true; retirePrimer(); }
      const go = !flushBroken && shouldAutoFlush(b, autoCount), took = queue.anchorAt();
      noteFn(`start burst (${queueWhy}): device start took ≈ ${took === null ? "?" : Math.max(0, Math.round(took - armAt))} ms, rendered ahead ≈ ${b} ms${go ? " → flush" : flushBroken && b > FLUSH_IDLE_MS ? " (auto flush off this session)" : b > FLUSH_NOW_MS ? ` (gave up after ${autoCount} flushes)` : b > FLUSH_IDLE_MS ? " (will clear when nothing is sounding)" : ""}`);
      if (go && queueWhy === "revive") {   // ⑤ 换完出声口的这一次起来又多算了（硬件是现起的）：这时候硬件醒着，再换一次
        autoCount++; const r = recreateOutput(c); noteFn(`revive: start was dirty (${b} ms) → ${r.how}`); flushAt = now; armQueue("revive");
      } else if (go) { autoCount++; flushAudio("auto"); } else if (b <= FLUSH_NOW_MS) autoCount = 0;
    }
  }, 10);
}
/** 现在大约排着多少毫秒（还没量出来 / 没在跑 = null）。离起来越久越不准：音频的钟和墙上的钟每分钟会差出几毫秒。 */
export function audioQueuedMs(): number | null {
  const c = ctx; if (!c || (c.state as string) !== "running") return null;
  const now = performance.now(); queue.feed(now, c.currentTime);
  return queue.queued(now, c.currentTime);
}
/** ② 清掉排着的：suspend 完了再 resume；重新起来时（statechange → running）重新量。who = 谁要清的。 */
export function flushAudio(who: "auto" | "idle" | "tap" = "tap"): void {
  const c = ctx; if (!c || (c.state as string) !== "running") return;
  noteFn(`flush (${who}; queued ≈ ${audioQueuedMs() ?? "?"} ms)`);
  flushAt = performance.now(); if (who !== "auto") autoCount = 0;
  void c.suspend().then(() => {
    // 自查：resume 叫出去 1 秒后还没在跑（真机上正常 ≈ 20 ms）= 这一次清把设备留在了睡着的状态 → 接着叫（③），这次打开不再自动清
    setTimeout(() => { if (ctx !== c || !asleep(c) || pageHidden()) return; flushBroken = true; noteFn(`flush left ctx ${c.state} for 1 s → waking; auto flush off this session`); wake(c); }, 1000);
    return c.resume();
  }).catch((e) => noteFn(`flush failed: ${String((e as Error)?.message ?? e)}`));
}
/** ① 回前台那一刻叫：上下文写着 running（没有 statechange 可等）而时钟 60 ms 没走 = 设备其实停过、正在重起 → 再量一次这次起来（脏就清）。
 *  状态变过的（interrupted → running）由 statechange 那一次量；时钟本来就在走的不重量（重量会把还排着的忘掉）。 */
export function audioShown(): void {
  const c = ctx; if (!c || (c.state as string) !== "running") return;
  const t0 = c.currentTime, at = performance.now(); frozenTries = 0;
  const still = (): boolean => ctx === c && (c.state as string) === "running" && c.currentTime === t0 && !pageHidden();
  setTimeout(() => { if (!still()) return; shownFrozen = { t: t0, at }; if (performance.now() - armAt > 500) armQueue("visible"); }, 60);
  setTimeout(() => { if (still()) void reviveAudio("frozen-visible"); else if (shownFrozen?.t === t0) shownFrozen = null; }, 1000);   // ⑤ 1 秒了还不走 = 不会自己起来了（短暂离开回来的那几次 60 ms 内就在走）
}
/** 回前台时发现「running 而时钟不走」的那一刻（时钟的值 + 墙上的时间）；时钟动了 = 作废。按键那一头拿它判断「第一个键就该换出声口」。 */
let shownFrozen: { t: number; at: number } | null = null, frozenTries = 0, reviveAt = -1e9;
/** ⑤ 的那一下：把 destination 的声道数改一下再改回来（声道数变 = 浏览器把通向硬件的那一段重建；改回来再建一次，要的就是原来的声道数）。 */
function recreateOutput(c: AudioContext): { ok: boolean; how: string } {
  try {
    const d = c.destination, n = d.channelCount, s = performance.now();
    d.channelCount = n === 1 ? 2 : 1; d.channelCount = n;
    return { ok: true, how: `output re-created in ${Math.round(performance.now() - s)} ms (channels ${n})` };
  } catch (e) { return { ok: false, how: `output re-create failed: ${String((e as Error)?.message ?? e)}` }; }
}
/** ⑤ 换出声口（见文件头）。why = 谁要换的。同一秒半里只换一次；「时钟不走」那两路一次回前台最多自动换 3 次（换不活就别来回折腾，留给人按）。
 *  回的是「换完之后声音时钟在不在走」（0.5 秒后看；不走 = 再试 suspend + resume、1.5 秒后看）。 */
export function reviveAudio(why: "manual" | "frozen-key" | "frozen-visible"): Promise<boolean> {
  const c = ctx, now = performance.now();
  if (!c) return Promise.resolve(false);
  if (now - reviveAt < 1500) return Promise.resolve((c.state as string) === "running");
  if (why !== "manual" && ++frozenTries > 3) return Promise.resolve(false);
  reviveAt = now;
  const t0 = c.currentTime, q = audioQueuedMs();
  if (asleep(c) && !everRan) {   // 还没出过声（人先按了按钮）：没有旧的可换，照常叫醒（走垫脚）就是了
    noteFn(`revive (${why}): ctx ${c.state}, never started → waking`); wake(c);
    return new Promise<boolean>((done) => setTimeout(() => done(ctx === c && (c.state as string) === "running" && c.currentTime !== t0), 2500));
  }
  const { ok, how } = recreateOutput(c);
  noteFn(`revive (${why}): ctx ${c.state}, t=${t0.toFixed(2)}, queued ≈ ${q ?? "?"} ms; ${how}`);
  if (asleep(c)) resumeOnce(c);   // 在手势里的话顺手叫醒
  shownFrozen = null; flushAt = now; autoCount = 0; armQueue("revive");
  const moving = (): boolean => ctx === c && (c.state as string) === "running" && c.currentTime !== t0;
  return new Promise<boolean>((done) => {
    setTimeout(() => {
      if (ctx !== c || pageHidden()) { done(false); return; }
      if (ok && moving()) { noteFn(`revive: clock running (t=${c.currentTime.toFixed(2)})`); done(true); return; }
      noteFn(`revive: clock not running after 500 ms (ctx ${c.state}, t=${c.currentTime.toFixed(2)}) → suspend + resume`);
      void c.suspend().then(() => c.resume()).catch((e) => noteFn(`revive: suspend + resume failed: ${String((e as Error)?.message ?? e)}`));
      setTimeout(() => {
        const m = moving();
        noteFn(m ? `revive: clock running after suspend + resume (t=${c.currentTime.toFixed(2)})` : `revive: still not running (ctx ${ctx === c ? c.state : "gone"}) — the app needs a restart`);
        if (!m && ctx === c) wake(c);
        done(m);
      }, 1500);
    }, 500);
  });
}
/** ② 空当里清：宿主在**确认没有音在响**的时候叫（每秒一次就够；怎么算「没有音在响」是宿主的事，见 main.ts）。排着的超过线、这一次起来已经量完、离上次清超过 10 秒才动手。 */
export function idleFlushAudio(): void {
  if (flushBroken || !burstNoted || performance.now() - flushAt < 10_000 || pageHidden()) return;
  const q = audioQueuedMs(); if (q !== null && q > FLUSH_IDLE_MS) flushAudio("idle");
}

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
