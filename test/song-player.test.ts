// song-player.test.ts —— 歌库播放器（src/app/song-player.ts）：iPad 那几条规矩 + 循环 + 锁屏状态。假的 <audio> / Media Session。created 2026-10-16 by Claude Opus 5.5
import { describe, it, eq, assert, tick } from "./runner.mjs";
import { createSongPlayer, silentWav, artworkOf } from "../src/app/song-player.ts";

/** 假 <audio>：play() 隔一个微任务才开始（同浏览器：事件是排队发的）；block = 浏览器不让放；hold = play() 挂着等测试放行。 */
class FakeAudio extends EventTarget {
  preload = ""; loop = false; paused = true; currentTime = 0; duration = NaN; playbackRate = 1;
  srcs: string[] = []; plays = 0; block = false; hold: { ok: () => void; no: (e: unknown) => void } | null = null; holdNext = false;
  #src = "";
  get src() { return this.#src; }
  set src(v: string) { this.#src = v; this.srcs.push(v); }
  removeAttribute(n: string) { if (n === "src") this.#src = ""; }
  load() { /* 复位 */ }
  fire(t: string) { this.dispatchEvent(new Event(t)); }
  play(): Promise<void> {
    this.plays++;
    if (this.holdNext) { this.holdNext = false; return new Promise((ok, no) => { this.hold = { ok: () => { this.paused = false; this.fire("play"); this.fire("playing"); ok(); }, no }; }); }
    if (this.block) return Promise.reject(new DOMException("not allowed", "NotAllowedError"));
    return Promise.resolve().then(() => { this.paused = false; this.fire("play"); this.fire("playing"); });
  }
  pause() { if (this.paused) return; this.paused = true; this.fire("pause"); }
}
class FakeSession {
  metadata: unknown = null; playbackState = "none";
  handlers = new Map<string, (d: Record<string, unknown>) => void>();
  positions: { duration: number; position: number; playbackRate: number }[] = [];
  setActionHandler(a: string, f: ((d: Record<string, unknown>) => void) | null) { if (f) this.handlers.set(a, f); else this.handlers.delete(a); }
  setPositionState(s: { duration: number; position: number; playbackRate: number }) { this.positions.push(s); }
}
/** 假定时器：记下排了什么，测试自己 run()（不真等）。 */
function fakeTimers() {
  let next = 1; const q = new Map<number, { fn: () => void; ms: number }>();
  return { q, set: (fn: () => void, ms: number) => { const id = next++; q.set(id, { fn, ms }); return id; }, clear: (h: unknown) => { q.delete(h as number); },
    run() { const all = [...q.entries()]; q.clear(); for (const [, t] of all) t.fn(); }, last: () => [...q.values()].pop()?.ms ?? null };
}
function setup(opts: { fallback?: boolean; timers?: ReturnType<typeof fakeTimers> } = {}) {
  const audio = new FakeAudio(), ms = new FakeSession(), errors: string[] = [];
  const player = createSongPlayer({ ...(opts.timers ? { timers: opts.timers } : {}),
    audio: audio as unknown as HTMLAudioElement, mediaSession: ms as unknown as MediaSession,
    makeMetadata: (init) => ({ ...init }) as unknown as MediaMetadata,
    fallbackArtwork: opts.fallback === false ? undefined : [{ src: "https://x/icon-512.png", sizes: "512x512", type: "image/png" }],
    onError: (m) => errors.push(m),
  });
  return { audio, ms, player, errors };
}
const mp3 = () => new Blob([new Uint8Array([0xff, 0xfb, 0x90, 0x00])], { type: "audio/mpeg" });

describe("歌库播放器：没点过 ▶ = 不存在", () => {
  // 2026-11-08 Fable：原来歌库一建就 new Audio()、离开歌库每次 stop() → load() 复位（哪怕从没放过）。歌库只有登录了才有 = 登录了才多出来的唯一一处碰声音的代码。
  it("建播放器不建 <audio>；没装东西时 stop 不建、不碰；第一次 arm / play 才建", async () => {
    const made: FakeAudio[] = [], G = globalThis as unknown as { Audio?: unknown }, old = G.Audio;
    G.Audio = function () { const a = new FakeAudio(); made.push(a); return a; };
    try {
      const ms = new FakeSession();
      const player = createSongPlayer({ mediaSession: ms as unknown as MediaSession, makeMetadata: (init) => ({ ...init }) as unknown as MediaMetadata });
      eq(made.length, 0, "建播放器 = 不建元素"); eq(player.hasElement(), false);
      player.stop(); player.stop(); eq(made.length, 0, "空着 stop = 不建");
      eq(player.state().key, null); eq(player.playing(), null); eq(made.length, 0, "读状态 = 不建");
      player.arm(); eq(made.length, 1, "第一次 arm 才建"); eq(player.hasElement(), true);
      await tick();
    } finally { G.Audio = old; }
  });
  it("给了元素（测试 / 以后的宿主）：没装东西时 stop 不 load、不动系统控件", () => {
    const { audio, ms, player } = setup();
    let loads = 0; (audio as unknown as { load: () => void }).load = () => { loads++; };
    let sets = 0; const set0 = ms.setActionHandler.bind(ms); ms.setActionHandler = (a, f) => { sets++; set0(a, f); };
    player.stop(); player.stop();
    eq(loads, 0, "空着的元素不复位"); eq(sets, 0, "没登记过锁屏 = 不去动它"); eq(audio.srcs.length, 0);
  });
});
const track = (key = "a.mxl", cover: Blob | null = null) => ({ key, blob: mp3(), title: "団子", artist: "MoonSinger", album: "定稿 第 1 版", cover });
const meta = (ms: FakeSession) => ms.metadata as { title?: string; artwork?: { src: string; sizes?: string }[] } | null;

describe("歌库播放器（锁屏）", () => {
  it("arm() 在点击里空放静音拿许可；拿到一次就不再做；事件不当成在放", async () => {
    const { audio, ms, player } = setup();
    player.arm();
    eq(audio.plays, 1); assert(audio.src.startsWith("blob:"), "放的是静音的 blob");
    await tick();
    eq(player.state().key, null, "静音不算装着歌"); eq(ms.handlers.size, 0, "静音不登记锁屏"); eq(ms.playbackState, "none");
    player.arm(); eq(audio.plays, 1, "拿过许可 = 不再空放");
  });
  it("锁屏按钮在开始放之后才登记（iPad 太早不认）；登记了 播放 / 暂停 / 停 / 拖 / 快退快进 / 上一首（= 从头放）、没有下一首", async () => {
    const { audio, ms, player } = setup();
    audio.holdNext = true;
    const p = player.play(track());
    eq(player.state().key, "a.mxl", "装上了"); eq(ms.handlers.size, 0, "还没开始放 = 还没登记");
    audio.hold!.ok(); eq(await p, "playing");
    for (const a of ["play", "pause", "stop", "seekto", "seekbackward", "seekforward", "previoustrack"]) assert(ms.handlers.has(a), `登记了 ${a}`);
    assert(!ms.handlers.has("nexttrack"), "只有一首：不画下一首");
    eq(meta(ms)?.title, "団子"); eq(ms.playbackState, "playing");
  });
  it("播放 / 暂停 / 停 都报给系统；停 = 锁屏控件收走", async () => {
    const { ms, player } = setup();
    await player.play(track());
    player.toggle(); eq(ms.playbackState, "paused"); eq(player.state().paused, true);
    player.toggle(); await tick(); eq(ms.playbackState, "playing");
    player.stop();
    eq(ms.playbackState, "none"); eq(ms.metadata, null); eq(ms.handlers.size, 0); eq(player.state().key, null);
  });
  it("循环：放之前开 = 装上就是循环；放着切 = 马上生效；静音那一下不循环；换一首照样记着", async () => {
    const { audio, player } = setup();
    player.setLoop(true);
    player.arm(); eq(audio.loop, false, "静音不循环");
    await player.play(track()); eq(audio.loop, true);
    player.setLoop(false); eq(audio.loop, false);
    player.setLoop(true); await player.play(track("b.mxl")); eq(audio.loop, true, "换一首还是循环"); eq(player.state().loop, true);
  });
  it("循环按谱切（2026-11-11）：给了循环那一圈 = 放到 end 跳回 start，不等余音；元素自己的 loop 照样开着当兜底", async () => {
    const timers = fakeTimers(), { audio, player } = setup({ timers });
    audio.duration = 12;   // 曲子 1–9 秒，后面 3 秒是余音
    player.setLoop(true);
    await player.play({ ...track(), loopSpan: { start: 1, end: 9 } });
    eq(audio.loop, true, "兜底：定时器没跑上就按整个文件绕");
    assert(timers.q.size === 1 && timers.last()! <= 1000, `开放就排了一个闹钟（最多 1 秒对一次表）：${timers.last()}`);
    audio.currentTime = 8.5; timers.run();
    assert(timers.q.size === 1 && Math.abs(timers.last()! - 500) < 1, `离 end 还有 0.5 秒 = 0.5 秒后再看：${timers.last()}`);
    audio.currentTime = 8.998; timers.run();
    eq(audio.currentTime, 1, "到 end（差不到 5 ms）= 跳回 start");
    audio.currentTime = 10.5; audio.fire("timeupdate");
    eq(audio.currentTime, 1, "已经在余音里（比如拖进度拖过去了）= 马上回 start");
  });
  it("循环按谱切：没开循环 / 暂停着 / 没给那一圈 / 那一圈落在声音外面 = 不跳（照旧放完整个文件）", async () => {
    const timers = fakeTimers(), { audio, player } = setup({ timers });
    audio.duration = 12;
    await player.play({ ...track(), loopSpan: { start: 1, end: 9 } });
    eq(timers.q.size, 0, "没开循环 = 不排闹钟");
    audio.currentTime = 9.5; audio.fire("timeupdate"); eq(audio.currentTime, 9.5, "没开循环 = 放进余音照常");
    player.setLoop(true); eq(audio.currentTime, 1, "开循环那一刻已经在余音里 = 回 start");
    player.toggle(); eq(timers.q.size, 0, "暂停 = 闹钟收掉");
    player.toggle(); await tick(); eq(timers.q.size, 1, "接着放 = 重排");
    await player.play({ ...track("b.mxl"), loopSpan: null }); audio.duration = 12; audio.fire("loadedmetadata");
    eq(timers.q.size, 0, "没给那一圈 = 不排（按整个文件绕）");
    await player.play({ ...track("c.mxl"), loopSpan: { start: 0, end: 30 } }); audio.duration = 12; audio.fire("loadedmetadata");
    eq(timers.q.size, 0, "那一圈比声音还长（对不上）= 不认");
    player.stop(); eq(timers.q.size, 0, "停 = 闹钟收掉");
  });
  it("进度：装好了报一次；循环绕回开头（没有 seeked）时重报；拖进度夹在曲长里", async () => {
    const { audio, ms, player } = setup();
    await player.play(track());
    audio.duration = 30; audio.fire("loadedmetadata");
    const n0 = ms.positions.length; assert(n0 >= 1, "装好就报"); eq(ms.positions[n0 - 1].duration, 30);
    audio.currentTime = 29.8; audio.fire("timeupdate"); eq(ms.positions.length, n0, "往前走不报（系统自己推）");
    audio.currentTime = 0.1; audio.fire("timeupdate"); eq(ms.positions.length, n0 + 1, "绕回开头重报"); eq(ms.positions[n0].position, 0.1);
    ms.handlers.get("seekto")!({ seekTime: 99 }); eq(audio.currentTime, 30, "拖过头 = 结尾");
    audio.currentTime = 5; ms.handlers.get("seekbackward")!({}); eq(audio.currentTime, 0, "快退 10 秒夹在 0");
    ms.handlers.get("seekforward")!({ seekOffset: 3 }); eq(audio.currentTime, 3);
  });
  it("从头放：放着 = 回到 0 接着放；暂停着 / 放完了 = 回到 0 并开始放；锁屏「上一首」同一条；没装 = 什么都不做", async () => {
    const { audio, ms, player } = setup();
    player.restart(); eq(audio.plays, 0, "没装歌：不动");
    await player.play(track()); audio.duration = 30;
    audio.currentTime = 12; player.restart(); await tick();
    eq(audio.currentTime, 0); eq(player.playing(), "a.mxl", "放着照样放");
    audio.currentTime = 20; player.toggle(); eq(player.state().paused, true);
    player.restart(); await tick(); eq(audio.currentTime, 0); eq(player.playing(), "a.mxl", "暂停着 = 从头开始放");
    audio.currentTime = 30; audio.pause(); audio.fire("ended");
    ms.handlers.get("previoustrack")!({}); await tick(); eq(audio.currentTime, 0); eq(player.playing(), "a.mxl", "锁屏「上一首」= 从头放");
    player.stop(); assert(!ms.handlers.has("previoustrack"), "停了收走");
  });
  it("浏览器不让自己开始放 = blocked：装着、暂停着，点 ▶（toggle）再放", async () => {
    const { audio, player } = setup();
    audio.block = true;
    eq(await player.play(track()), "blocked");
    eq(player.state().key, "a.mxl"); eq(player.state().paused, true);
    audio.block = false; player.toggle(); await tick(); await tick();
    eq(player.playing(), "a.mxl");
  });
  it("等的时候被下一首顶掉 = replaced（不报错、不停新的那首）", async () => {
    const { audio, player } = setup();
    audio.holdNext = true;
    const pa = player.play(track("a.mxl"));
    const first = audio.hold!;
    const pb = player.play(track("b.mxl"));
    first.no(new DOMException("interrupted", "AbortError"));
    eq(await pa, "replaced"); eq(await pb, "playing"); eq(player.playing(), "b.mxl");
  });
  it("放的途中坏了 = 停 + 说一声；静音那一下坏了不算", async () => {
    const { audio, player, errors } = setup();
    player.arm(); audio.fire("error"); eq(errors.length, 0, "静音的错不认");
    await player.play(track()); audio.fire("error");
    eq(errors.length, 1); eq(player.state().key, null, "停了");
  });
  it("锁屏的图：有封面 = 封面（data: 地址、PNG 尺寸照写）；没有 = app 图标", async () => {
    const png = new Uint8Array(33); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const dv = new DataView(png.buffer); dv.setUint32(16, 256); dv.setUint32(20, 200);
    const cover = new Blob([png], { type: "image/png" });
    const a = await artworkOf(cover);
    assert(a![0].src.startsWith("data:image/png;base64,"), "data: 地址"); eq(a![0].sizes, "256x200");
    const { ms, player } = setup();
    await player.play(track("a.mxl", cover)); await tick(); await tick();
    assert(meta(ms)!.artwork![0].src.startsWith("data:image/png"), "锁屏上是封面");
    await player.play(track("b.mxl")); await tick();
    eq(meta(ms)!.artwork![0].src, "https://x/icon-512.png", "没封面 = app 图标");
  });
  it("静音 WAV 的头是对的（RIFF / WAVE / data 长度）", async () => {
    const b = new Uint8Array(await silentWav(50, 8000).arrayBuffer()), dv = new DataView(b.buffer);
    const tag = (o: number) => String.fromCharCode(...b.subarray(o, o + 4));
    eq(tag(0), "RIFF"); eq(tag(8), "WAVE"); eq(tag(36), "data");
    eq(dv.getUint32(40, true), 800, "50 ms × 8 kHz × 2 字节"); eq(b.length, 844); eq(dv.getUint32(4, true), b.length - 8);
  });
});
