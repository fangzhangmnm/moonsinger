// gallery-host.ts —— 歌库（@internal/gallery 的 MoonSinger 消费面）：独立一屏盖住编辑器，卡片 = 唱片封面。created 2026-10-08 by Claude Fable 5.1
//   抄 WebXiaoHeiWu src/gallery-host.ts（0.7.0 形）。包出屏幕 + 动词 + 数据面；本文件只出：Vue 注入、DocHost（编辑器端口）、policy（一种文档 song = .mxl；
//   缩略图 = 歌 zip 最后一个 entry Thumbnails/thumbnail.png 尾读，WXHW ADR-0012 同款）、chrome（返回 / 云 / 刷新 / 新建 / 回收站 / 设置）。
//   封面的字（歌名 / 日期 / 大小）= src/ui/song-cover.ts 排版进包的两个槽；文案 = 包内 zh 默认 + 几条换成歌库口吻。
//   派生缓存 IDB `moonsinger-thumbs`（user 2026-10-08「没问题」批；CLAUDE.md 持久层白名单表登记）。
import { createApp, defineComponent, reactive, ref, computed, watch, onMounted, onUnmounted, nextTick, Teleport } from "../vendor/vue/vue.esm-browser.prod.js";
import { createGallery, humanSize, type CreateGalleryDeps, type GalleryDocHost, type VueRuntime, type GItem, type TileInfo, type TileAction, type VerbStore, type DataFaceStore, type Gallery, type GalleryView, type AsideKind, type AsideScope } from "@internal/gallery";
import { requireStore, auth, hasStore, isSignedIn } from "./app-store.ts";
import { THUMBNAIL_ENTRY, FINAL_MP3_ENTRY } from "./format/project.ts";
import { parseFinalRecord, type FinalRecord } from "./format/final.ts";
import { identifiers } from "./identifiers.ts";
import { openConfirmSheet, openInputSheet, openChoiceSheet, withBusy } from "./ui/sheets.ts";
import { iconHtml } from "./ui/icon.ts";
import { coverHtml, placeholderHtml } from "./ui/song-cover.ts";
import { deviceKvGet, deviceKvSet } from "./device-kv.ts";
import { reportError, diagNote } from "./app/report-error.ts";

export interface GalleryHostDeps {
  activeIdentifier: () => string | null;
  /** 打开一个身份（歌库点卡片）。返回 true = 编辑器已切过去。 */
  openAny: (identifier: string) => Promise<boolean>;
  /** 打开中的那首被歌库挪了夹（字节已在新身份下）：编辑器放下旧身份、按新身份重开（绝不把旧名字写回去）。 */
  setIdentifier: (identifier: string) => void;
  /** 编辑器自己的改名 UI；返回新身份，没改 → null。 */
  renameActive: () => Promise<string | null>;
  pushNow: () => Promise<void>;
  flushLocal: () => Promise<void>;
  /** 「新建」：在歌库里新建一首（空谱）并打开。 */
  newSong: () => Promise<void>;
  openSettings: () => void;
  /** 「即兴」（原「乐器」，v0.9.41 user「gallery乐器改成即兴」）：歌库上面开乐器目录，只弹着玩、不写进哪首歌（user 2026-10-08「歌库应该有一个专门的乐器目录的入口」）。 */
  openInstruments: () => void;
  /** 云按钮：登录 / 退出 / 账号（宿主的 auth 菜单）。 */
  openCloudMenu: (anchor: HTMLElement) => void;
  onOpened?: () => void;
  onClosed?: () => void;
}
const KV_FOLDER = "gallery-folder";
/** 上次离开时在哪个场景（WeebPaint 行为：从歌库出 → 回来在歌库；从编辑器出 → 回来在编辑器）。 */
const KV_SCENE = "last-scene";
/** 封面尾读（ADR-0012）：Thumbnails/thumbnail.png 是歌 zip 的最后一个 entry（存的时候 STORE 不压）；尾窗 128 KB（central directory + 封面 ≤ 70 KB 一次命中）。 */
const THUMB_PEEK_BYTES = 128 * 1024;
/** 定稿（W-38；user 2026-10-13「gallery可以试听mp3不用开app」）：总目录 `.moonsinger/manifest.json` 排在封面前面 = 同一个尾窗里，按 entry 名抓来看有没有 `final`
 *  = 图库包 0.8.0 的「事实」（`policy.facts`，包按身份 + 字节版本缓存进 IDB `moonsinger-facts`、全删可再生、到了响应式重画；user 2026-10-16「图库包批了」）；
 *  有 = 卡片右下角一粒 ▶（`ui.tileAction`，包画、包接点击、不开卡），点了按 entry 名抓 `.moonsinger/final.mp3`（不压缩；本地 = Blob.slice，云端 = byte-range，不整份下载）放给你听。 */
const MANIFEST_ENTRY = ".moonsinger/manifest.json";
const FACTS_DB = "moonsinger-facts";
/** 卡片的事实（我们这边的形状；包不认识它）：定稿了 = { final: { rev, secs } }；没定稿 = null。 */
type SongFacts = { final: { rev: number; secs: number } } | null;
const factsOf = (v: unknown): SongFacts => { const f = (v as { final?: { rev?: unknown; secs?: unknown } } | null)?.final; return f && typeof f.rev === "number" ? { final: { rev: f.rev, secs: Number(f.secs ?? 0) } } : null; };
const THUMB_DB = "moonsinger-thumbs";
// 包内 zh 默认是 WeebPaint 口吻；会露面的几条换成歌库口吻（其余沿用）。key 必须是包的 GalleryTextKey（类型守着）。
const TEXT: Partial<Record<Parameters<NonNullable<NonNullable<CreateGalleryDeps["text"]>["t"]>>[0], string>> = {
  "gal.empty.none": "还没有歌。点「新建」写一首，或把 .mxl 拖进来。",
  "gal.empty.folder": "这个夹里还没有歌。",
  "gal.empty.trash": "回收站是空的。",
  "gal.tile.active": "打开中",
};

export function initGalleryHost(d: GalleryHostDeps) {
  const vue = { createApp, defineComponent, reactive, ref, computed, watch, onMounted, onUnmounted, nextTick, Teleport } as unknown as VueRuntime;   // Teleport：gallery 0.6.2 卡片 ⋯ 菜单搬出卡片
  // 一屏容器 + chrome（不进 index.html：歌库是懒的，没进过歌库的设备连 DOM 都不长）。没有「回到谱」：进歌库 = 放下手里的歌（gallery-first，同 WeebPaint；user 2026-10-08「7 和weebpaint对齐」），出口 = 打开一首 / 新建
  const fullEl = document.createElement("div");
  fullEl.id = "galleryFull"; fullEl.className = "gallery-full"; fullEl.hidden = true;
  fullEl.setAttribute("role", "dialog"); fullEl.setAttribute("aria-modal", "true"); fullEl.setAttribute("aria-label", "歌库");
  fullEl.innerHTML = `<div class="gallery-chrome">` +
    `<div class="gallery-chrome-title">歌库</div><span class="spacer"></span>` +
    `<button type="button" class="btn" data-v="cloud" title="云端：登录 / 退出">${iconHtml("cloud")}</button>` +
    `<button type="button" class="btn" data-v="refresh" title="刷新云端" hidden>${iconHtml("refresh")}</button>` +
    `<button type="button" class="btn gallery-inst" data-v="instruments" title="即兴：挑乐器、用键盘弹着玩（不写进哪首歌）"><span>即兴</span></button>` +
    `<button type="button" class="btn" data-v="new" title="新建：一首歌 / 一个文件夹" aria-haspopup="menu">${iconHtml("new")}<span>新建</span></button>` +
    `<button type="button" class="btn" data-v="aside" title="回收站和备份箱">${iconHtml("trash-can")}</button>` +
    `<button type="button" class="btn" data-v="settings" title="设置">${iconHtml("menu")}</button></div>` +
    `<div class="gallery-asidebar" hidden><button type="button" class="btn" data-v="files">${iconHtml("back")}<span>回到歌</span></button>` +
    `<div class="gallery-aside-tabs"><button type="button" class="btn gallery-aside-tab" data-v="trash">${iconHtml("trash-can")}<span>回收站</span></button><button type="button" class="btn gallery-aside-tab" data-v="backup">${iconHtml("archive-box")}<span>备份箱</span></button></div>` +
    `<span class="spacer"></span><button type="button" class="btn danger" data-v="empty">清空</button></div>` +
    `<div class="gallery-mount"></div>`;
  document.body.append(fullEl);
  const mountEl = fullEl.querySelector<HTMLElement>(".gallery-mount")!, asideBar = fullEl.querySelector<HTMLElement>(".gallery-asidebar")!;
  const cloudBtn = fullEl.querySelector<HTMLElement>('[data-v="cloud"]')!, refreshBtn = fullEl.querySelector<HTMLElement>('[data-v="refresh"]')!;

  const storeFace = (): (VerbStore & DataFaceStore) | null => (hasStore() ? (requireStore() as unknown as VerbStore & DataFaceStore) : null);
  const doc: GalleryDocHost = {
    open: async (item: GItem) => { const ok = await d.openAny(item.identifier); if (ok) close(); },
    renameActive: () => d.renameActive(),
    setIdentifier: (id) => d.setIdentifier(id),
    push: async () => { await d.pushNow(); },
    unload: async (item: GItem) => { try { await requireStore().file(item.identifier, { mode: "existing" }).offload(); } catch (e) { reportError(e, "warning"); } },
    exit: async () => { await d.flushLocal(); },
    dropCheckpoint: () => {},
    tileAction: (item, facts) => playTile(item.identifier, factsOf(facts)),   // 封面上的 ▶（0.8.0 包画、包接点击、不开卡）
  };
  const zipFile = (id: string) => requireStore().zip(id, { mode: "existing" });
  const status = (msg: string, isError?: boolean) => reportError(msg, isError ? "error" : "info");
  const deps: CreateGalleryDeps = {
    vue,
    store: storeFace,
    doc,
    host: {
      signedIn: () => isSignedIn(), online: () => (typeof navigator === "undefined" || navigator.onLine !== false), activeIdentifier: () => d.activeIdentifier(),
      confirm: (title, msg) => openConfirmSheet(title, msg),
      input: (title, def, opts) => openInputSheet(title, { defaultValue: def, placeholder: opts?.placeholder }),
      chooseFolder: (title, msg, options) => openChoiceSheet<string>(title, msg, options.map((o) => ({ label: o.label, value: o.value }))),
      status,
      busy: (label, fn) => withBusy(label, fn),
    },
    // 封面 = 两层（排版在 ui/song-cover.ts）：底下一层 = 封面图，没有图就是一块按歌名选的底色（占位槽）；上面一层印歌名 / 日期 / 大小，**有没有图都一样印**。
    ui: {
      iconHtml: (name, opts) => iconHtml(name, opts),
      tilePlaceholderHtml: (id) => placeholderHtml(identifiers.parse(id)?.stem ?? id),
      tileOverlayHtml: (id: string, item?: TileInfo) => coverHtml(identifiers.parse(id)?.stem ?? id, {
        sizeText: item?.size != null ? humanSize(item.size) : undefined,
        editedText: item?.lastModified ? `改于 ${new Date(item.lastModified).toLocaleString()}` : undefined,
      }),
      // 定稿了的歌：右下角 ▶（事实没到 = 不画；没定稿 = 不画）
      tileAction: (id: string, _info: TileInfo, facts: unknown): TileAction | null => { const f = factsOf(facts); return f ? { icon: "play", title: `听定稿的 mp3（第 ${f.final.rev} 版，${f.final.secs.toFixed(0)} 秒）${playingId === id && !audio.paused ? " · 正在放" : ""}`, state: "ready" } : null; },
    },
    policy: {
      isImage: () => false,
      // 缩略图：fetch = store getPeek 按身份尾读（source 必填：cloud 绝不落回本地）。null = 到达了但没有（进缓存、显示底色）；抛 = 够不着（不缓存）。
      thumbs: { kinds: ["song"], dbName: THUMB_DB, fetch: (id, source) => zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: THUMBNAIL_ENTRY, source }) },
      // 事实（0.8.0）：尾读总目录看有没有定稿记录；null = 确定没定稿（进缓存）；抛 = 够不着（不缓存，下次再问）
      facts: { kinds: ["song"], dbName: FACTS_DB, fetch: async (id, source) => { const rec = await peekFinal(id, source); return rec ? { final: { rev: rec.rev, secs: rec.mp3.secs } } : null; } },
    },
    tile: { aspect: 1 },   // 唱片封面 = 方图（user 2026-10-08「我们这个应该是唱片封面，是矩形的」）
    folderMemory: { get: () => deviceKvGet(KV_FOLDER) ?? "", set: (p) => deviceKvSet(KV_FOLDER, p || null) },
    isGalleryVisible: () => document.body.dataset.mode === "gallery",
    reportError: (e, level) => reportError(e, level ?? "error"),
    reloadApp: () => location.reload(),
    text: { lang: "zh", t: (key) => TEXT[key] },
  };
  let gallery: Gallery | null = null;
  /** 这首的总目录里有没有定稿记录（尾读一次；source 同缩略图：本地优先 / 只看云端）。云端不可达 = 抛 → 包不记，下次再问。 */
  async function peekFinal(id: string, source: "local" | "cloud" = "local"): Promise<FinalRecord | null> {
    const b = await zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: MANIFEST_ENTRY, source });
    if (!b) return null;
    try { return parseFinalRecord((JSON.parse(await b.text()) as { final?: unknown }).final); } catch { return null; }
  }
  // ── 迷你播放条（歌库底边）：▶ / ⏸、歌名、时间、循环、✕；Media Session 让锁屏 / 耳机键也能控（后台能不能放 iPad 上没验）──
  const playerEl = document.createElement("div");
  playerEl.className = "ms-player"; playerEl.hidden = true;
  playerEl.innerHTML = `<button type="button" class="btn ms-player-toggle" data-p="toggle" title="放 / 暂停">${iconHtml("pause")}</button>` +
    `<span class="ms-player-title"></span><span class="ms-player-time">0:00 / 0:00</span>` +
    `<button type="button" class="btn ms-player-loop" data-p="loop" title="单曲循环">循环</button>` +
    `<button type="button" class="btn" data-p="close" title="停">${iconHtml("x")}</button>`;
  fullEl.append(playerEl);
  const audio = new Audio(); audio.preload = "auto";
  let playingId: string | null = null, objectUrl: string | null = null;
  const fmtTime = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
  const drawPlayer = () => {
    playerEl.querySelector<HTMLElement>(".ms-player-time")!.textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
    playerEl.querySelector<HTMLElement>(".ms-player-toggle")!.innerHTML = iconHtml(audio.paused ? "play" : "pause");
    playerEl.querySelector<HTMLElement>(".ms-player-loop")!.classList.toggle("is-on", audio.loop);
  };
  audio.addEventListener("timeupdate", drawPlayer); audio.addEventListener("play", drawPlayer); audio.addEventListener("pause", drawPlayer); audio.addEventListener("loadedmetadata", drawPlayer);
  audio.addEventListener("error", () => { status("这份 mp3 放不了（文件坏了？）", true); stopPlayer(); });
  function stopPlayer(): void {
    audio.pause(); audio.removeAttribute("src"); audio.load();
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    playingId = null; playerEl.hidden = true; drawPlayer();
    try { if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none"; } catch { /* 没有也行 */ }
  }
  /** 点了封面上的 ▶（包只在定稿了的卡上画它；facts = 包缓存的事实）：抓 mp3 放；再点同一首 = 放 / 暂停。 */
  async function playTile(id: string, facts: SongFacts): Promise<void> {
    if (playingId === id) { if (audio.paused) void audio.play(); else audio.pause(); return; }
    if (!facts) { status("这首还没定稿：打开它，三条杠里「定稿…」——定稿后封面上就能直接听。"); return; }
    const stem = identifiers.parse(id)?.stem ?? id;
    try {
      const b = await withBusy(`取「${stem}」的 mp3…`, async () => {
        const rec = await peekFinal(id);
        if (!rec) { void gallery?.facts?.invalidate(id); return null; }   // 事实过期了（改稿后还没重取）：清掉让包重问
        const blob = await zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: rec.mp3.path, source: "local" });
        if (!blob || blob.size !== rec.mp3.bytes) throw new Error(`mp3 没取到（${blob ? `${blob.size} ≠ ${rec.mp3.bytes}` : "空"}）`);
        return { rec, blob };
      });
      if (!b) { status("这首还没定稿：打开它，三条杠里「定稿…」——定稿后封面上就能直接听。"); return; }
      stopPlayer();
      objectUrl = URL.createObjectURL(new Blob([b.blob], { type: "audio/mpeg" }));
      audio.src = objectUrl; playingId = id;
      playerEl.querySelector<HTMLElement>(".ms-player-title")!.textContent = `${stem} · 定稿 ${b.rec.rev}`;
      playerEl.hidden = false;
      try {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({ title: stem, album: "MoonSinger" });
          navigator.mediaSession.setActionHandler("play", () => { void audio.play(); }); navigator.mediaSession.setActionHandler("pause", () => audio.pause()); navigator.mediaSession.setActionHandler("stop", () => stopPlayer());
        }
      } catch { /* 没有 Media Session 也行 */ }
      await audio.play();
      diagNote("gallery", `play final ${id} (${b.blob.size} B)`);
    } catch (e) { reportError(e, "warning"); status(`放不了：${(e as Error).message ?? String(e)}`, true); stopPlayer(); }
  }
  playerEl.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-p]")?.dataset.p; if (!v) return;
    if (v === "toggle") { if (audio.paused) void audio.play(); else audio.pause(); } else if (v === "loop") { audio.loop = !audio.loop; drawPlayer(); } else if (v === "close") stopPlayer();
  });
  /** 新建文件夹（2026-10-10 user「gallery怎么没接新建文件夹的功能，这个应该只是接线吧，不过小心一点」）：照 WeebPaint gallery-shell 的接法——
   *  名字先查合法（OneDrive 不收的字符）→ 锁屏 → store 的唯一占用检查（files.occupied：同名文件 / 夹占着就说）→ store.files.newFolder（库内单飞；离线也能建，回线补建）→ 刷新歌库。
   *  只建在现在这个夹里；app 不碰云端、不自己拼请求。 */
  const warn = (msg: string) => reportError(msg, "warning");   // 名字不对 / 占了 = 提醒（不是出错）
  async function newFolder(): Promise<void> {
    if (!hasStore()) { warn("歌库还没接上，建不了文件夹"); return; }
    const g = ensureMounted();
    const name = await openInputSheet("新建文件夹", { defaultValue: "新文件夹", placeholder: "文件夹名" });
    if (name == null) return;
    const n = name.trim();
    if (!n) { warn("文件夹名不能空着"); return; }
    if (/[\\/:*?"<>|]/.test(n) || /^[.\s]|[.\s]$/.test(n)) { warn("文件夹名里不能有 / \\ : * ? \" < > |，也不能用点或空格开头 / 结尾（OneDrive 不收）"); return; }
    const here = g.handle.getFolder(), full = here ? `${here}/${n}` : n;
    await withBusy(`新建文件夹「${n}」…`, async () => {
      if (await requireStore().files.occupied(full)) { warn(`「${n}」这个名字已经有了（同名的歌或文件夹）`); return; }
      try { await requireStore().files.newFolder(full); status(`建好了文件夹「${n}」`); diagNote("gallery", `new folder ${full}`); }
      catch (e) { reportError(e, "warning"); status(`新建文件夹没成功：${(e as Error).message ?? String(e)}`, true); }
    });
    g.handle.refresh();
  }
  function ensureMounted(): Gallery { if (!gallery) gallery = createGallery(mountEl, deps); return gallery; }
  function showAside(kind: AsideKind | null): void {
    asideBar.hidden = kind == null;
    for (const b of asideBar.querySelectorAll<HTMLElement>(".gallery-aside-tab")) b.classList.toggle("is-on", b.dataset.v === kind);
    ensureMounted().handle.setView(kind ?? "files");
  }
  let newMenu: HTMLElement | null = null;
  const outsideNew = (e: PointerEvent) => { const t = e.target as HTMLElement; if (newMenu && !newMenu.contains(t) && !t.closest('[data-v="new"]')) closeNewMenu(); };
  function closeNewMenu(): void { newMenu?.remove(); newMenu = null; document.removeEventListener("pointerdown", outsideNew, true); }
  function openNewMenu(btn: HTMLElement): void {
    if (newMenu) { closeNewMenu(); return; }
    const m = document.createElement("div"); newMenu = m;
    m.className = "track-card ctx-menu gallery-new-menu"; m.setAttribute("role", "menu");
    m.innerHTML = `<button type="button" class="btn ctx-item" data-v="new-song">${iconHtml("new")}<span>新建歌</span></button>` +
      `<button type="button" class="btn ctx-item" data-v="new-folder" title="在现在这个夹里">${iconHtml("create-folder")}<span>新建文件夹…</span></button>`;
    fullEl.append(m);
    const r = btn.getBoundingClientRect(), w = m.offsetWidth;
    Object.assign(m.style, { position: "fixed", top: `${r.bottom + 4}px`, left: `${Math.max(8, Math.min(r.right - w, innerWidth - w - 8))}px` });
    setTimeout(() => { if (newMenu === m) document.addEventListener("pointerdown", outsideNew, true); }, 0);
  }
  fullEl.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (!v) return;
    if (v === "cloud") d.openCloudMenu(cloudBtn);
    else if (v === "refresh") gallery?.handle.refresh();
    else if (v === "new") openNewMenu((e.target as HTMLElement).closest<HTMLElement>("[data-v]")!);   // 「新建」= 小菜单（v0.9.41；user「gallery的新建按钮应该是一个菜单，里面有新建歌和文件夹」，同 WeebPaint 图库的「＋」）
    else if (v === "new-song") { closeNewMenu(); void d.newSong(); }
    else if (v === "new-folder") { closeNewMenu(); void newFolder(); }
    else if (v === "instruments") d.openInstruments();
    else if (v === "aside") showAside("trash");
    else if (v === "files") showAside(null);
    else if (v === "trash" || v === "backup") showAside(v);
    else if (v === "empty") { const h = ensureMounted().handle, cur = h.getView(); if (cur === "trash") h.emptyTrash(); else if (cur === "backup") h.emptyBackup(); }
    else if (v === "settings") d.openSettings();
  });
  /** 云按钮的样子跟登录态走（图标 + 「已登录」态）。 */
  function renderCloud(): void {
    const on = isSignedIn();
    cloudBtn.classList.toggle("is-on", on); cloudBtn.title = on ? `云端：已登录${accountName() ? ` ${accountName()}` : ""}` : "云端：没登录（歌只在这台设备上）";
    refreshBtn.hidden = !on;
  }
  function accountName(): string { try { const a = auth.getActiveAccount() as { username?: string; name?: string } | null; return a?.name || a?.username || ""; } catch { return ""; } }
  auth.onAuthChanged(() => renderCloud());

  async function open(): Promise<void> {
    await d.flushLocal();
    const g = ensureMounted();
    document.body.dataset.mode = "gallery";
    fullEl.hidden = false;
    const dir = deviceKvGet(KV_FOLDER) ?? "";
    if (dir !== g.handle.getFolder()) g.handle.setFolder(dir);
    showAside(null);
    renderCloud();
    deviceKvSet(KV_SCENE, "gallery");
    diagNote("gallery", "open");
    d.onOpened?.();
  }
  function close(): void {
    stopPlayer();   // 离开歌库 = 停（编辑器里有自己的走带）
    fullEl.hidden = true;
    delete document.body.dataset.mode;
    deviceKvSet(KV_SCENE, null);
    d.onClosed?.();
  }
  const isOpen = () => !fullEl.hidden;
  return {
    open, close, isOpen, renderCloud,
    /** boot 用：上次是在歌库里离开的（刷新 / 关标签 / SW 更新重载）。 */
    wasInGallery: () => deviceKvGet(KV_SCENE) === "gallery",
    refresh: () => gallery?.handle.refresh(),
    setView: (v: GalleryView) => showAside(v === "files" ? null : v),
    getView: (): GalleryView => gallery?.handle.getView() ?? "files",
    emptyAside: (kind: AsideKind, scope: AsideScope) => { const h = ensureMounted().handle; if (kind === "trash") h.emptyTrash(scope); else h.emptyBackup(scope); },
    currentFolder: () => gallery?.handle.getFolder() ?? (deviceKvGet(KV_FOLDER) ?? ""),
    /** 封面变了（存了新封面）：丢掉这首歌的缩略图缓存，下次露面重取。 */
    invalidateThumb: (id: string) => { void gallery?.thumbs?.invalidate(id); void gallery?.facts?.invalidate(id); },   // 封面 / 定稿变了：缩略图和事实都重取
    /** 封面上在放的那首（E2E 用）。 */
    playing: () => (playingId && !audio.paused ? playingId : null),
  };
}
export type GalleryHost = ReturnType<typeof initGalleryHost>;
