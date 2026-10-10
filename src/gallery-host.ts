// gallery-host.ts —— 歌库（@internal/gallery 的 MoonSinger 消费面）：独立一屏盖住编辑器，卡片 = 唱片封面。created 2026-10-08 by Claude Fable 5.1
//   抄 WebXiaoHeiWu src/gallery-host.ts（0.7.0 形）。包出屏幕 + 动词 + 数据面；本文件只出：Vue 注入、DocHost（编辑器端口）、policy（一种文档 song = .mxl；
//   缩略图 = 歌 zip 最后一个 entry Thumbnails/thumbnail.png 尾读，WXHW ADR-0012 同款）、chrome（返回 / 云 / 刷新 / 新建 / 回收站 / 设置）。
//   封面的字（歌名 / 日期 / 大小）= src/ui/song-cover.ts 排版进包的两个槽；文案 = 包内 zh 默认 + 几条换成歌库口吻。
//   派生缓存 IDB `moonsinger-thumbs`（user 2026-10-08「没问题」批；CLAUDE.md 持久层白名单表登记）。
import { createApp, defineComponent, reactive, ref, computed, watch, onMounted, onUnmounted, nextTick, Teleport } from "../vendor/vue/vue.esm-browser.prod.js";
import { createGallery, humanSize, type CreateGalleryDeps, type GalleryDocHost, type VueRuntime, type GItem, type TileInfo, type VerbStore, type DataFaceStore, type Gallery, type GalleryView, type AsideKind, type AsideScope } from "@internal/gallery";
import { requireStore, auth, hasStore, isSignedIn } from "./app-store.ts";
import { THUMBNAIL_ENTRY } from "./format/project.ts";
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
  /** 「乐器」：歌库上面开乐器目录（只弹着玩，不写进哪首歌；user 2026-10-08「歌库应该有一个专门的乐器目录的入口」）。 */
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
    `<button type="button" class="btn gallery-inst" data-v="instruments" title="乐器目录：浏览、试听、用键盘弹着玩（不写进哪首歌）"><span>乐器</span></button>` +
    `<button type="button" class="btn" data-v="new" title="新建一首">${iconHtml("new")}<span>新建</span></button>` +
    `<button type="button" class="btn" data-v="newfolder" title="新建文件夹（在现在这个夹里）">${iconHtml("create-folder")}</button>` +
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
    },
    policy: {
      isImage: () => false,
      // 缩略图：fetch = store getPeek 按身份尾读（source 必填：cloud 绝不落回本地）。null = 到达了但没有（进缓存、显示底色）；抛 = 够不着（不缓存）。
      thumbs: { kinds: ["song"], dbName: THUMB_DB, fetch: (id, source) => zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: THUMBNAIL_ENTRY, source }) },
    },
    tile: { aspect: 1 },   // 唱片封面 = 方图（user 2026-10-08「我们这个应该是唱片封面，是矩形的」）
    folderMemory: { get: () => deviceKvGet(KV_FOLDER) ?? "", set: (p) => deviceKvSet(KV_FOLDER, p || null) },
    isGalleryVisible: () => document.body.dataset.mode === "gallery",
    reportError: (e, level) => reportError(e, level ?? "error"),
    reloadApp: () => location.reload(),
    text: { lang: "zh", t: (key) => TEXT[key] },
  };
  let gallery: Gallery | null = null;
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
  fullEl.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (!v) return;
    if (v === "cloud") d.openCloudMenu(cloudBtn);
    else if (v === "refresh") gallery?.handle.refresh();
    else if (v === "new") void d.newSong();
    else if (v === "newfolder") void newFolder();
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
    invalidateThumb: (id: string) => { void gallery?.thumbs?.invalidate(id); },
  };
}
export type GalleryHost = ReturnType<typeof initGalleryHost>;
