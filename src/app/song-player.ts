// song-player.ts —— 歌库的播放器：一个 <audio> + 系统媒体控件（锁屏 / 控制中心 / 耳机键 / 键盘媒体键）。created 2026-10-16 by Claude Opus 5.5
//   user 2026-10-16「至少在gallery侧能做到锁屏播放吗（可以选择是否loop）」→「那么只做歌库的锁屏，做干净点」「歌库里面可以设置循环与否」。
//   为什么是 <audio> 不是 Web Audio：iPad 一锁屏就把 Web Audio 掐掉（编辑器的实时引擎就是这样，那边不做）；媒体元素在主屏 PWA 里锁屏照放。
//   iPad 的坑（家族 Background Radio docs/20260524-media-session.md、20260524-ios-safari-pwa-quirks.md 记的）在这里一次收掉：
//   ① 只认手指点下那一刻的 play()；取 mp3 要等（云端走网络）→ 点下时先 arm()：空放一小段静音，这个元素拿到许可，取到了再换真的；
//   ② 锁屏按钮在开始放之前登记 iPad 可能不认 → 每首第一次 playing 时才登记；
//   ③ 播放 / 暂停、进度（含循环绕回开头）都报给系统，锁屏上的按钮和进度条才对得上、能拖。
//   循环 = 这次打开有效（同编辑器的「循环」，不进存储）；锁屏上系统没有循环钮，在播放条上开好再锁屏。
//   从头放 = restart()（2026-10-17 by Claude Opus 5.5；user「gallery播放没有从头再来的功能，我有时候想从头听」→ 播放条加键「做」）：播放条的 |▶ 和锁屏 / 耳机的「上一首」都走它。
//   不碰界面：播放条归宿主（gallery-host.ts），这里只出状态 + onChange。

export interface SongTrack {
  /** 谁在放（歌库 = 身份）；toggle / 状态按它认。 */
  key: string;
  /** mp3 字节（type 由调用方给，歌库 = audio/mpeg）。 */
  blob: Blob;
  title: string;
  artist?: string;
  album?: string;
  /** 封面图；没有 = 用 fallbackArtwork（app 图标）。 */
  cover?: Blob | null;
}
export interface SongPlayerState {
  /** 装着哪首（null = 没有，播放条收起）。 */
  key: string | null;
  paused: boolean;
  time: number;
  duration: number;
  loop: boolean;
}
/** playing = 在放；blocked = 浏览器没让自己开始放（装好了、暂停着，点播放条上的 ▶ 就放）；replaced = 等的时候被下一首 / 停顶掉了。 */
export type PlayResult = "playing" | "blocked" | "replaced";

export interface SongPlayerDeps {
  /** 测试注入假的；不给 = new Audio()。 */
  audio?: HTMLAudioElement;
  /** 不给 = navigator.mediaSession（没有就只在 app 里放）；null = 不接系统控件。 */
  mediaSession?: MediaSession | null;
  makeMetadata?: (init: MediaMetadataInit) => MediaMetadata;
  /** 没封面时锁屏上的图（绝对地址）。 */
  fallbackArtwork?: MediaImage[];
  /** 放的途中坏了（文件坏 / 解不了）：已经停了，告诉人一声。 */
  onError?: (message: string) => void;
}

/** 锁屏上「快退 / 快进」一下的秒数（系统没给 seekOffset 时）。 */
const SEEK_STEP_SECS = 10;

export function createSongPlayer(deps: SongPlayerDeps = {}) {
  const audio = deps.audio ?? new Audio();
  audio.preload = "auto";
  const ms: MediaSession | null = deps.mediaSession !== undefined ? deps.mediaSession
    : (typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null);
  const makeMetadata = deps.makeMetadata ?? ((init: MediaMetadataInit) => new MediaMetadata(init));
  let track: SongTrack | null = null;   // 真装着的那首（arm 的静音不算：事件一律不认）
  let url: string | null = null;
  let loop = false;
  let blessed = false;   // 这个元素在手势里放成功过 = 以后不用再 arm
  let announced = false; // 这首登记过锁屏没有
  let artwork: MediaImage[] | null = null;
  let lastTime = 0;
  let silentUrl: string | null = null;
  const listeners = new Set<() => void>();
  const emit = () => { for (const f of listeners) { try { f(); } catch { /* 一个听众坏了不拖累别的 */ } } };

  const setAction = (a: MediaSessionAction, f: MediaSessionActionHandler | null) => { try { ms?.setActionHandler(a, f); } catch { /* 这个浏览器不认这个动作 */ } };
  const setPlaybackState = (s: MediaSessionPlaybackState) => { try { if (ms) ms.playbackState = s; } catch { /* 无妨 */ } };
  function setMetadata(): void {
    if (!ms || !track) return;
    try { ms.metadata = makeMetadata({ title: track.title, artist: track.artist ?? "", album: track.album ?? "", artwork: artwork ?? deps.fallbackArtwork ?? [] }); } catch { /* 无妨 */ }
  }
  function pushPosition(): void {
    if (!ms || !track) return;
    const d = audio.duration;
    if (!Number.isFinite(d) || d <= 0) return;   // 系统要 duration > 0、position ≤ duration，不然抛
    try { ms.setPositionState?.({ duration: d, position: Math.min(Math.max(0, audio.currentTime), d), playbackRate: audio.playbackRate || 1 }); } catch { /* 老 Safari 没有 */ }
  }
  function seek(to: number): void {
    if (!track) return;
    const d = audio.duration;
    audio.currentTime = Math.max(0, Number.isFinite(d) ? Math.min(to, d) : to);
  }
  /** 第一次 playing 时登记锁屏（太早 iPad 不认）。只有一首：「上一首」= 从头放（同音乐 app 的 ⏮）、不画下一首；给快退 / 快进 / 拖进度。
   *  iPad 锁屏登记了「上一首」左边那颗会从快退换成 ⏮（进度条照样能拖）。 */
  function announce(): void {
    if (!ms || !track) return;
    setMetadata();
    setAction("play", () => resume());
    setAction("pause", () => audio.pause());
    setAction("stop", () => stop());
    setAction("seekto", (e) => { if (e.seekTime != null) seek(e.seekTime); });
    setAction("seekbackward", (e) => seek(audio.currentTime - (e.seekOffset || SEEK_STEP_SECS)));
    setAction("seekforward", (e) => seek(audio.currentTime + (e.seekOffset || SEEK_STEP_SECS)));
    setAction("previoustrack", () => restart()); setAction("nexttrack", null);
    announced = true;
  }
  function unannounce(): void {
    if (!ms) return;
    for (const a of ["play", "pause", "stop", "seekto", "seekbackward", "seekforward", "previoustrack"] as MediaSessionAction[]) setAction(a, null);
    try { ms.metadata = null; } catch { /* 无妨 */ }
    setPlaybackState("none");
  }
  /** 卸下装着的那首（先清 track：元素复位时冒出来的事件不认）。 */
  function unload(): void {
    track = null; announced = false; artwork = null; lastTime = 0;
    audio.pause(); audio.removeAttribute("src"); audio.load();
    if (url) { URL.revokeObjectURL(url); url = null; }
  }

  audio.addEventListener("playing", () => { if (!track) return; if (!announced) announce(); setPlaybackState("playing"); pushPosition(); emit(); });
  audio.addEventListener("pause", () => { if (!track) return; setPlaybackState("paused"); pushPosition(); emit(); });
  audio.addEventListener("loadedmetadata", () => { if (track) { pushPosition(); emit(); } });
  audio.addEventListener("seeked", () => { if (track) { lastTime = audio.currentTime; pushPosition(); emit(); } });
  // 循环绕回开头不一定有 seeked：时间往回跳了就重报一次进度（锁屏的进度条是系统按上次报的自己往前推的）
  audio.addEventListener("timeupdate", () => { if (!track) return; const t = audio.currentTime; if (t + 1 < lastTime) pushPosition(); lastTime = t; emit(); });
  audio.addEventListener("ended", () => { if (track) emit(); });   // 没开循环：放完停在结尾，再点 ▶ 从头放
  audio.addEventListener("error", () => { if (!track) return; stop(); deps.onError?.("这份 mp3 放不了（文件坏了？）"); });

  /** 在点击里同步调（取 mp3 之前）：空放一小段静音，让 iPad 给这个元素放的许可。拿到过就不再做。 */
  function arm(): void {
    if (blessed) return;
    if (track) stop();   // 装着却没拿到许可的那首（blocked）：换成静音去拿
    silentUrl ??= URL.createObjectURL(silentWav());
    audio.loop = false;
    audio.src = silentUrl;
    void audio.play()?.then(() => { blessed = true; }, () => { /* 没拿到：play() 时再说 */ });
  }
  /** 换上这首并开始放。 */
  async function play(t: SongTrack): Promise<PlayResult> {
    unload();
    track = t;
    url = URL.createObjectURL(t.blob);
    audio.src = url; audio.loop = loop;
    if (t.cover) void artworkOf(t.cover).then((a) => { if (track !== t || !a) return; artwork = a; if (announced) setMetadata(); }, () => { /* 封面读不了 = 用 app 图标 */ });
    emit();
    try { await audio.play(); blessed = true; return "playing"; }
    catch (e) {
      if (track !== t) return "replaced";
      if ((e as { name?: string })?.name === "NotAllowedError") { emit(); return "blocked"; }
      stop(); throw e;
    }
  }
  function resume(): void {
    if (!track) return;
    void audio.play().then(() => { blessed = true; }, () => emit());
  }
  function toggle(): void { if (!track) return; if (audio.paused) resume(); else audio.pause(); }
  /** 从头放：回到开头、放着 / 停着 / 放完了都接着放。 */
  function restart(): void { if (!track) return; seek(0); resume(); }
  function stop(): void { const had = track != null; unload(); unannounce(); if (had) emit(); }
  function setLoop(on: boolean): void { loop = on; if (track) audio.loop = on; emit(); }
  const state = (): SongPlayerState => ({ key: track?.key ?? null, paused: !track || audio.paused, time: track ? audio.currentTime : 0, duration: track ? audio.duration : NaN, loop });
  return {
    arm, play, toggle, restart, stop, setLoop, state,
    /** 在放的那首（暂停 / 没装 = null）。 */
    playing: (): string | null => (track && !audio.paused ? track.key : null),
    onChange(fn: () => void): () => void { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
export type SongPlayer = ReturnType<typeof createSongPlayer>;

/** 一小段静音 WAV（16-bit 单声道）：arm() 拿许可用。 */
export function silentWav(ms = 50, sampleRate = 8000): Blob {
  const n = Math.round(sampleRate * ms / 1000), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const tag = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  tag(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); tag(8, "WAVE");
  tag(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  tag(36, "data"); v.setUint32(40, n * 2, true);
  return new Blob([buf], { type: "audio/wav" });
}

/** 封面 → 锁屏的图。用 data: 地址不用 blob:（锁屏那边不一定在这个页面里取图，字节带在地址里最稳）；PNG 读得出尺寸就写上。 */
export async function artworkOf(cover: Blob): Promise<MediaImage[] | null> {
  const u8 = new Uint8Array(await cover.arrayBuffer());
  if (!u8.length) return null;
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  const type = cover.type || "image/png";
  const img: MediaImage = { src: `data:${type};base64,${btoa(s)}`, type };
  const isPng = u8.length >= 24 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47;
  if (isPng) { const dv = new DataView(u8.buffer, u8.byteOffset); img.sizes = `${dv.getUint32(16)}x${dv.getUint32(20)}`; }
  return [img];
}
