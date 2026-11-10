// gallery-host.ts —— 歌库（@internal/gallery 的 MoonSinger 消费面）：独立一屏盖住编辑器，卡片 = 唱片封面。created 2026-10-08 by Claude Fable 5.1
//   抄 WebXiaoHeiWu src/gallery-host.ts（0.7.0 形）。包出屏幕 + 动词 + 数据面；本文件只出：Vue 注入、DocHost（编辑器端口）、policy（一种文档 song = .mxl；
//   缩略图 = 歌 zip 最后一个 entry Thumbnails/thumbnail.png 尾读，WXHW ADR-0012 同款）、chrome（返回 / 云 / 刷新 / 新建 / 回收站 / 设置）。
//   封面的字（歌名 / 日期 / 大小）= src/ui/song-cover.ts 排版进包的两个槽；文案 = 包内 zh 默认 + 几条换成歌库口吻。
//   派生缓存 IDB `moonsinger-thumbs`（user 2026-10-08「没问题」批；CLAUDE.md 持久层白名单表登记）。
import { _t, lang } from "./i18n/index.ts";
import * as VueAll from "../vendor/vue/vue.esm-browser.prod.js";
import { ref } from "../vendor/vue/vue.esm-browser.prod.js";
import { createGallery, humanSize, type CreateGalleryDeps, type GalleryDocHost, type VueRuntime, type GItem, type TileInfo, type TileAction, type VerbStore, type DataFaceStore, type Gallery, type GalleryView, type AsideKind, type AsideScope } from "@internal/gallery";
import { CACHE_DBS } from "./config.ts";
import "./library-home.ts";   // 图库包的名册库名归它配（自家 GUID 前缀）
import { requireStore, auth, hasStore, isSignedIn, homeOnline, folderHome } from "./app-store.ts";
import { currentPolicy } from "./deployment-policy.ts";
import { cloudOffHtml, SITE_TEXT } from "./app/site-hint.ts";
import { THUMBNAIL_ENTRY } from "./format/project.ts";
import { parseFinalRecord, type FinalRecord } from "./format/final.ts";
import { identifiers } from "./identifiers.ts";
import { openConfirmSheet, openInputSheet, openChoiceSheet, withBusy } from "./ui/sheets.ts";
import { iconHtml } from "./ui/icon.ts";
import { coverHtml, placeholderHtml } from "./ui/song-cover.ts";
import { deviceKvGet, deviceKvSet } from "./device-kv.ts";
import { reportError, diagNote } from "./app/report-error.ts";
import { createSongPlayer } from "./app/song-player.ts";
import { stampOf, MANIFEST_ENTRY, type RenderCache } from "./app/render-cache.ts";

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
  /** 顶上挂什么（没有家的披露 / 文件夹权限掉了 / 还有旧歌没搬；一处判定，住 main.ts）。null = 不挂。 */
  homeBar: () => { text: string; buttons: { v: string; label: string }[] } | null;
  /** 顶上那条的钮。**点击同步栈里调**（选文件夹 / 再授权要手势）。 */
  homeAction: (v: string) => void;
  /** 文件夹当家时的名字（不是 = null）：云按钮换成文件夹按钮。 */
  homeLabel: () => string | null;
  openHomeMenu: () => void;
  /** 这台设备上记着的渲好的声音（src/app/render-cache.ts）：封面上的 ▶ 认它的挂名，点了从它那里取字节。 */
  renders: Pick<RenderCache, "linkOf" | "take" | "onChange">;
  onOpened?: () => void;
  onClosed?: () => void;
}
const KV_FOLDER = "gallery-folder";
/** 上次离开时在哪个场景（WeebPaint 行为：从歌库出 → 回来在歌库；从编辑器出 → 回来在编辑器）。 */
const KV_SCENE = "last-scene";
/** 封面尾读（ADR-0012）：Thumbnails/thumbnail.png 是歌 zip 的最后一个 entry（存的时候 STORE 不压）；尾窗 128 KB（central directory + 封面 ≤ 70 KB 一次命中）。 */
const THUMB_PEEK_BYTES = 128 * 1024;
/** 封面上的 ▶（user 2026-10-13「gallery可以试听mp3不用开app」；2026-11-10 定稿退役后换了货源，user「以后统一不存mp3」「本地歌缓存？最好能有锁屏播放？这样我可以听歌」）：
 *  声音 = **这台设备上记着的那一遍**（src/app/render-cache.ts：在歌里导出 / 分享过一次就记着）。歌库不打开歌，靠「文件戳」认：总目录 `.moonsinger/manifest.json` 排在封面前面 = 同一个尾窗里，
 *  它的文本的哈希（stampOf）每存一次都变；卡片的「事实」里带着这个戳（图库包 0.8.0 `policy.facts`，按身份 + 字节版本缓存进 IDB，全删可再生），和挂名时记的戳一样 = 这份声音就是这个文件的 → 画 ▶。
 *  老文件里还带着 mp3 的（退役的定稿：总目录里有 `final`、zip 里有 `.moonsinger/final.mp3`）照旧能听：按 entry 名尾读那一份（本地 = Blob.slice，云端 = byte-range，不整份下载）；这首歌下次存的时候它就不在文件里了。 */
const FACTS_DB = CACHE_DBS.facts;   // 2026-11-03 起带 GUID（原 moonsinger-facts；老库空闲时探到就删，factory-reset.ts dropLegacyCacheDbs）
/** 卡片的事实（我们这边的形状；包不认识它）：stamp = 这个文件的戳；final = 文件里还带着一份 mp3（老文件）。读不到总目录（别的软件的谱）= null。
 *  老版本缓存下来的事实没有 stamp（那时只记定稿）：照样认它的 final；要认设备上记着的声音得等这首歌的事实重取（挂名的那一下宿主会作废它）。 */
type SongFacts = { stamp?: string; final?: { rev: number; secs: number } } | null;
const factsOf = (v: unknown): SongFacts => {
  const o = v as { stamp?: unknown; final?: { rev?: unknown; secs?: unknown } } | null; if (!o || typeof o !== "object") return null;
  const f = o.final && typeof o.final.rev === "number" ? { rev: o.final.rev, secs: Number(o.final.secs ?? 0) } : undefined;
  return { ...(typeof o.stamp === "string" ? { stamp: o.stamp } : {}), ...(f ? { final: f } : {}) };
};
const THUMB_DB = CACHE_DBS.thumbs;   // 2026-11-03 起带 GUID（原 moonsinger-thumbs）
// 包内 zh 默认是 WeebPaint 口吻；会露面的几条换成歌库口吻（其余沿用）。key 必须是包的 GalleryTextKey（类型守着）。
const TEXT: Partial<Record<Parameters<NonNullable<NonNullable<CreateGalleryDeps["text"]>["t"]>>[0], string>> = {
  "gal.empty.none": _t("还没有歌。点「新建」写一首，或把 .mxl 拖进来。"),
  "gal.empty.folder": _t("这个夹里还没有歌。"),
  "gal.empty.trash": _t("回收站是空的。"),
  "gal.tile.active": _t("打开中"),
};

export function initGalleryHost(d: GalleryHostDeps) {
  // 整个 Vue 模块递给图库（2026-11-10，Claude Fable 5.2；家族备忘「页面 CSP」坑 1）：图库的界面是预编译好的 render 函数，要从宿主的 Vue 里拿十几个 helper（openBlock / createElementVNode…）；
  //   只递一部分 = 它退回「运行时编译模板」= 要 eval，被页面安全策略拦下，歌库整个打不开（加策略时无头测试当场抓到）。不许改回只递几样。
  const vue = VueAll as unknown as VueRuntime;   // Teleport：gallery 0.6.2 卡片 ⋯ 菜单搬出卡片
  // 一屏容器 + chrome（不进 index.html：歌库是懒的，没进过歌库的设备连 DOM 都不长）。没有「回到谱」：进歌库 = 放下手里的歌（gallery-first，同 WeebPaint；user 2026-10-08「7 和weebpaint对齐」），出口 = 打开一首 / 新建
  const fullEl = document.createElement("div");
  fullEl.id = "galleryFull"; fullEl.className = "gallery-full"; fullEl.hidden = true;
  fullEl.setAttribute("role", "dialog"); fullEl.setAttribute("aria-modal", "true"); fullEl.setAttribute("aria-label", _t("歌库"));
  fullEl.innerHTML = `<div class="gallery-chrome">` +
    `<div class="gallery-chrome-title">${_t("歌库")}</div><span class="spacer"></span>` +
    // 网盘关着（itch / 备用版）= 云按钮画灰 + 旁边一行「网盘在官网」（家族规则书 §1 第 6 条：入口不许露着却点不动；2026-11-03）
    `<button type="button" class="btn gallery-home-btn" data-v="home" hidden>${iconHtml("folder")}<span class="gallery-home-name"></span></button>` +
    (currentPolicy().cloud ? `<button type="button" class="btn" data-v="cloud" title="${_t("云端：登录 / 退出")}">${iconHtml("cloud")}</button>`
      : `<button type="button" class="btn is-off" data-v="cloud" disabled title="${SITE_TEXT.cloudOffTitle}">${iconHtml("cloud")}</button>${cloudOffHtml()}`) +
    `<button type="button" class="btn" data-v="refresh" title="${_t("刷新云端")}" hidden>${iconHtml("refresh")}</button>` +
    `<button type="button" class="btn gallery-inst" data-v="instruments" title="${_t("即兴：挑乐器、用键盘弹着玩（不写进哪首歌）")}"><span>${_t("即兴")}</span></button>` +
    `<button type="button" class="btn" data-v="new" title="${_t("新建：一首歌 / 一个文件夹")}" aria-haspopup="menu">${iconHtml("new")}<span>${_t("新建")}</span></button>` +
    `<button type="button" class="btn" data-v="aside" title="${_t("回收站和备份箱")}">${iconHtml("trash-can")}</button>` +
    `<button type="button" class="btn" data-v="settings" title="${_t("设置")}">${iconHtml("menu")}</button></div>` +
    // 没有家的披露条（家族 library-needs-a-home §4 第 1 步，工单 H）：不改入口、不删功能，先说实话 + 给出口
    `<div class="gallery-home-bar" hidden><span class="gallery-home-text"></span><span class="spacer"></span><span class="gallery-home-btns"></span></div>` +
    `<div class="gallery-asidebar" hidden><button type="button" class="btn" data-v="files">${iconHtml("back")}<span>${_t("回到歌")}</span></button>` +
    `<div class="gallery-aside-tabs"><button type="button" class="btn gallery-aside-tab" data-v="trash">${iconHtml("trash-can")}<span>${_t("回收站")}</span></button><button type="button" class="btn gallery-aside-tab" data-v="backup">${iconHtml("archive-box")}<span>${_t("备份箱")}</span></button></div>` +
    `<span class="spacer"></span><button type="button" class="btn danger" data-v="empty">${_t("清空")}</button></div>` +
    `<div class="gallery-mount"></div>`;
  document.body.append(fullEl);
  const mountEl = fullEl.querySelector<HTMLElement>(".gallery-mount")!, asideBar = fullEl.querySelector<HTMLElement>(".gallery-asidebar")!;
  const homeBar = fullEl.querySelector<HTMLElement>(".gallery-home-bar")!, homeBtn = fullEl.querySelector<HTMLElement>('[data-v="home"]')!;
  const cloudBtn = fullEl.querySelector<HTMLElement>('[data-v="cloud"]')!, refreshBtn = fullEl.querySelector<HTMLElement>('[data-v="refresh"]')!;

  const storeFace = (): (VerbStore & DataFaceStore) | null => (hasStore() ? (requireStore() as unknown as VerbStore & DataFaceStore) : null);
  const doc: GalleryDocHost = {
    open: async (item: GItem) => { const ok = await d.openAny(item.identifier); if (ok) close(); },
    renameActive: () => d.renameActive(),
    setIdentifier: (id) => d.setIdentifier(id),
    push: async () => { await d.pushNow(); },
    unload: async (item: GItem) => { try { await requireStore().file(item.identifier, { mode: "existing" }).offload(); } catch (e) { reportError(e, "warning"); } },
    exit: async () => { await d.flushLocal(); },
    // gallery 0.9.1：「存一版」拿的是存下来的字节，正开着的那份先落本机（不关它、不推云）。不给 = 那一版是上次存下的样子。
    flush: async () => { await d.flushLocal(); },
    dropCheckpoint: () => {},
    tileAction: (item, facts) => playTile(item.identifier, factsOf(facts)),   // 封面上的 ▶（0.8.0 包画、包接点击、不开卡）
  };
  const zipFile = (id: string) => requireStore().zip(id, { mode: "existing" });
  const storeKey = (): string => folderHome()?.id ?? "default";   // 缩略图 / 事实按家分开（同名的歌在两个家里不是一回事）
  const status = (msg: string, isError?: boolean) => reportError(msg, isError ? "error" : "info");
  const deps: CreateGalleryDeps = {
    vue,
    store: storeFace,
    doc,
    host: {
      signedIn: () => isSignedIn(), online: homeOnline, activeIdentifier: () => d.activeIdentifier(),
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
      tileOverlayHtml: (id: string, item?: TileInfo, facts?: unknown) => coverHtml(identifiers.parse(id)?.stem ?? id, {
        sizeText: item?.size != null ? humanSize(item.size) : undefined,
        editedText: item?.lastModified ? _t("改于 {lastModified}", { lastModified: new Date(item.lastModified).toLocaleString() }) : undefined,
      }),
      // 有声音可听的歌：右下角 ▶，在放的那首 = ⏸（user 2026-10-16「播放中时play按钮没有变」）；事实没到 = 不画；这台设备没记着、文件里也没带 = 不画。
      //   跟着变：包在 Vue 的 computed 里算这个函数，读了 playTick / renderTick（同一个 Vue 的 ref）= 包记住这两个依赖：在放哪首变了、设备上记着的东西变了，各 +1 就重算。
      //   靠的是包「在响应式里调 tileAction」这一点（d.ts：事实到了会重算）；包要是改了，E2E render-cache.mjs「卡片 ▶ 跟着变」会红。
      tileAction: (id: string, _info: TileInfo, facts: unknown): TileAction | null => {
        void playTick.value; void renderTick.value;
        const src = soundOf(id, factsOf(facts)); if (!src) return null;
        return player.playing() === id ? { icon: "pause", title: _t("暂停（底边播放条上也能控）"), state: "ready" }
          : { icon: "play", title: src.k === "device" ? _t("听这台设备上记着的那一遍（{p} 秒）", { p: src.secs.toFixed(0) }) : _t("听歌里带着的那份 mp3（{p} 秒）", { p: src.secs.toFixed(0) }), state: "ready" };
      },
    },
    policy: {
      isImage: () => false,
      // 缩略图：fetch = store getPeek 按身份尾读（source 必填：cloud 绝不落回本地）。null = 到达了但没有（进缓存、显示底色）；抛 = 够不着（不缓存）。
      thumbs: { kinds: ["song"], dbName: THUMB_DB, galleryId: storeKey, fetch: (id, source) => zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: THUMBNAIL_ENTRY, source }) },
      // 事实（0.8.0）：尾读总目录 → 这个文件的戳 + 里面还带不带 mp3；null = 读到了、但没有总目录（别的软件的谱，进缓存）；抛 = 够不着（不缓存，下次再问）
      facts: { kinds: ["song"], dbName: FACTS_DB, galleryId: storeKey, fetch: async (id, source) => { const m = await peekManifest(id, source); return m ? { stamp: m.stamp, ...(m.final ? { final: { rev: m.final.rev, secs: m.final.mp3.secs } } : {}) } : null; } },
    },
    tile: { aspect: 1 },   // 唱片封面 = 方图（user 2026-10-08「我们这个应该是唱片封面，是矩形的」）
    folderMemory: { get: () => deviceKvGet(KV_FOLDER) ?? "", set: (p) => deviceKvSet(KV_FOLDER, p || null) },
    isGalleryVisible: () => document.body.dataset.mode === "gallery",
    reportError: (e, level) => reportError(e, level ?? "error"),
    reloadApp: () => location.reload(),
    text: { lang: lang(), t: (key) => TEXT[key] },
  };
  let gallery: Gallery | null = null;
  /** 这首的总目录（尾读一次；source 同缩略图：本地优先 / 只看云端）：文件戳 + 老文件里那份 mp3 的记录（没有 = null）。没有总目录 = null；云端不可达 = 抛 → 包不记，下次再问。 */
  async function peekManifest(id: string, source: "local" | "cloud" = "local"): Promise<{ stamp: string; final: FinalRecord | null } | null> {
    const b = await zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: MANIFEST_ENTRY, source });
    if (!b) return null;
    const text = await b.text();
    let final: FinalRecord | null = null;
    try { final = parseFinalRecord((JSON.parse(text) as { final?: unknown }).final); } catch { /* 总目录读不懂：只有戳 */ }
    return { stamp: stampOf(text), final };
  }
  /** 这张卡现在有什么声音可听：这台设备上记着的那一遍（挂名的戳 = 这个文件此刻的戳）优先；否则文件里还带着的那份（老文件）；都没有 = null。 */
  function soundOf(id: string, f: SongFacts): { k: "device"; key: string; secs: number } | { k: "embedded"; secs: number } | null {
    const link = d.renders.linkOf(storeKey(), id);
    if (link && f?.stamp && link.stamp === f.stamp) return { k: "device", key: link.key, secs: link.meta.secs };
    return f?.final ? { k: "embedded", secs: f.final.secs } : null;
  }
  // ── 迷你播放条（歌库底边）：|▶ 从头放、▶ / ⏸、歌名、时间、循环、✕。出声 = src/app/song-player.ts（<audio> + 系统媒体控件：主屏 PWA 锁屏照放，锁屏 / 控制中心 / 耳机键能控）──
  //   user 2026-10-16「至少在gallery侧能做到锁屏播放吗（可以选择是否loop）」「歌库里面可以设置循环与否」：循环 = 播放条上的开关，这次打开有效，锁屏下照样绕回开头。
  const playerEl = document.createElement("div");
  playerEl.className = "ms-player"; playerEl.hidden = true;
  playerEl.innerHTML = `<button type="button" class="btn" data-p="restart" title="${_t("从头放（锁屏 / 耳机的「上一首」也是）")}">${iconHtml("play-from-start")}</button>` +   // user 2026-10-17「gallery播放没有从头再来的功能，我有时候想从头听」：加键不做手势（歌库只有接着 / 从头两样，藏进手势就找不到）
    `<button type="button" class="btn ms-player-toggle" data-p="toggle" title="${_t("放 / 暂停")}">${iconHtml("pause")}</button>` +
    `<span class="ms-player-title"></span><span class="ms-player-time">0:00 / 0:00</span>` +
    `<button type="button" class="btn ms-player-loop" data-p="loop" aria-pressed="false">${_t("循环")}</button>` +
    `<button type="button" class="btn" data-p="close" title="${_t("停")}">${iconHtml("x")}</button>`;
  fullEl.append(playerEl);
  const appIcon = (file: string, sizes: string) => ({ src: new URL(file, document.baseURI).href, sizes, type: "image/png" });
  const player = createSongPlayer({ fallbackArtwork: [appIcon("icon-512.png", "512x512"), appIcon("icon-192.png", "192x192")], onError: (msg) => status(msg, true) });
  let barTitle = "";
  const fmtTime = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
  function drawPlayer(): void {
    const s = player.state();
    playerEl.hidden = s.key == null;
    if (s.key == null) return;
    playerEl.querySelector<HTMLElement>(".ms-player-title")!.textContent = barTitle;
    playerEl.querySelector<HTMLElement>(".ms-player-time")!.textContent = `${fmtTime(s.time)} / ${fmtTime(s.duration)}`;
    playerEl.querySelector<HTMLElement>(".ms-player-toggle")!.innerHTML = iconHtml(s.paused ? "play" : "pause");
    const loopBtn = playerEl.querySelector<HTMLElement>(".ms-player-loop")!;
    loopBtn.classList.toggle("is-on", s.loop); loopBtn.setAttribute("aria-pressed", String(s.loop));
    loopBtn.title = s.loop ? _t("单曲循环：开着（放完从头再放，锁屏也一样）") : _t("单曲循环：关着（放完就停）");
  }
  const playTick = ref(0);   // 在放哪首（含暂停）变了才 +1：卡片上的 ▶ / ⏸ 重算（进度每秒几跳不碰它，不然整个网格跟着重算）
  const renderTick = ref(0);   // 设备上记着的声音变了（多记了一遍 / 丢了一条 / 挂名变了）：哪些卡有 ▶ 重算
  d.renders.onChange(() => { renderTick.value++; });
  let tickedFor: string | null = null;
  player.onChange(() => { const k = player.playing(); if (k !== tickedFor) { tickedFor = k; playTick.value++; } drawPlayer(); });
  const NO_SOUND = (): string => _t("这台设备上还没有这首歌渲好的声音：打开它，「导出…」里导一次歌声（mp3），之后封面上就能直接听。");
  /** 点了封面上的 ▶（包只在 tileAction 给了钮的卡上画它；facts = 包缓存的事实）：取声音放；再点同一首 = 放 / 暂停。 */
  async function playTile(id: string, facts: SongFacts): Promise<void> {
    if (player.state().key === id) { player.toggle(); return; }
    const src = soundOf(id, facts);
    if (!src) { status(NO_SOUND()); return; }
    player.arm();   // 还在点击里：先拿 iPad 放的许可（下面要等取字节，等完就不算点击了）
    const stem = identifiers.parse(id)?.stem ?? id;
    try {
      const got = await withBusy(_t("取「{stem}」的声音…", { stem }), async (): Promise<{ blob: Blob; album: string } | null> => {
        if (src.k === "device") {
          const r = await d.renders.take(src.key);   // 字节没了（被清过）= 这条作废，卡片上的 ▶ 跟着收掉
          return r ? { blob: new Blob([r.bytes as unknown as BlobPart], { type: "audio/mpeg" }), album: _t("这台设备上记着的那一遍") } : null;
        }
        const m = await peekManifest(id);
        if (!m?.final) { void gallery?.facts?.invalidate(id); return null; }   // 事实过期了（那份 mp3 已经不在文件里）：清掉让包重问
        const blob = await zipFile(id).getPeek({ bytesLength: THUMB_PEEK_BYTES, zipEntry: m.final.mp3.path, source: "local" });
        if (!blob || blob.size !== m.final.mp3.bytes) throw new Error(_t("mp3 没取到（{blob}）", { blob: blob ? `${blob.size} ≠ ${m.final.mp3.bytes}` : _t("空") }));
        return { blob: new Blob([blob], { type: "audio/mpeg" }), album: _t("歌里带着的那份 mp3") };
      });
      if (!got) { status(NO_SOUND()); return; }
      const cover = (await gallery?.thumbs?.read(id).catch(() => null))?.blob ?? null;   // 锁屏上的图 = 歌库缓存着的封面（没有 = app 图标）
      barTitle = stem;
      const r = await player.play({ key: id, blob: got.blob, title: stem, artist: "MoonSinger", album: got.album, cover });
      if (r === "blocked") status(_t("没能自己开始放：点底边播放条上的 ▶"));
      diagNote("gallery", `play ${src.k} ${id} (${got.blob.size} B) → ${r}`);
    } catch (e) { reportError(e, "warning"); status(_t("放不了：{Error}", { Error: (e as Error).message ?? String(e) }), true); player.stop(); }
  }
  playerEl.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-p]")?.dataset.p; if (!v) return;
    if (v === "toggle") player.toggle(); else if (v === "restart") player.restart(); else if (v === "loop") player.setLoop(!player.state().loop); else if (v === "close") player.stop();
  });
  /** 新建文件夹（2026-10-10 user「gallery怎么没接新建文件夹的功能，这个应该只是接线吧，不过小心一点」）：照 WeebPaint gallery-shell 的接法——
   *  名字先查合法（OneDrive 不收的字符）→ 锁屏 → store 的唯一占用检查（files.occupied：同名文件 / 夹占着就说）→ store.files.newFolder（库内单飞；离线也能建，回线补建）→ 刷新歌库。
   *  只建在现在这个夹里；app 不碰云端、不自己拼请求。 */
  const warn = (msg: string) => reportError(msg, "warning");   // 名字不对 / 占了 = 提醒（不是出错）
  async function newFolder(): Promise<void> {
    if (!hasStore()) { warn(_t("歌库还没接上，建不了文件夹")); return; }
    const g = ensureMounted();
    const name = await openInputSheet(_t("新建文件夹"), { defaultValue: _t("新文件夹"), placeholder: _t("文件夹名") });
    if (name == null) return;
    const n = name.trim();
    if (!n) { warn(_t("文件夹名不能空着")); return; }
    if (/[\\/:*?"<>|]/.test(n) || /^[.\s]|[.\s]$/.test(n)) { warn(_t("文件夹名里不能有 / \\ : * ? \" < > |，也不能用点或空格开头 / 结尾（OneDrive 不收）")); return; }
    const here = g.handle.getFolder(), full = here ? `${here}/${n}` : n;
    await withBusy(_t("新建文件夹「{n}」…", { n }), async () => {
      if (await requireStore().files.occupied(full)) { warn(_t("「{n}」这个名字已经有了（同名的歌或文件夹）", { n })); return; }
      try { await requireStore().files.newFolder(full); status(_t("建好了文件夹「{n}」", { n })); diagNote("gallery", `new folder ${full}`); }
      catch (e) { reportError(e, "warning"); status(_t("新建文件夹没成功：{Error}", { Error: (e as Error).message ?? String(e) }), true); }
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
    m.innerHTML = `<button type="button" class="btn ctx-item" data-v="new-song">${iconHtml("new")}<span>${_t("新建歌")}</span></button>` +
      `<button type="button" class="btn ctx-item" data-v="new-folder" title="${_t("在现在这个夹里")}">${iconHtml("create-folder")}<span>${_t("新建文件夹…")}</span></button>`;
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
    else if (v === "home") d.openHomeMenu();
    else if ((e.target as HTMLElement).closest(".gallery-home-btns")) d.homeAction(v);
  });
  /** 云按钮的样子跟登录态走（图标 + 「已登录」态）。 */
  function renderCloud(): void {
    const bar = d.homeBar();
    homeBar.hidden = !bar;
    if (bar) {
      homeBar.querySelector(".gallery-home-text")!.textContent = bar.text;
      const btns = homeBar.querySelector<HTMLElement>(".gallery-home-btns")!;
      btns.replaceChildren(...bar.buttons.map((b) => { const el = document.createElement("button"); el.type = "button"; el.className = "btn"; el.dataset.v = b.v; el.textContent = b.label; return el; }));
    }
    const folder = d.homeLabel();
    homeBtn.hidden = folder == null;
    if (folder != null) { homeBtn.querySelector(".gallery-home-name")!.textContent = folder; homeBtn.title = _t("歌库在文件夹「{folder}」", { folder }); refreshBtn.hidden = false; if (currentPolicy().cloud) cloudBtn.hidden = true; return; }
    if (!currentPolicy().cloud) { refreshBtn.hidden = true; return; }   // 灰着的那颗不跟登录态变（永远没登录）
    const on = isSignedIn();
    cloudBtn.hidden = false;
    cloudBtn.classList.toggle("is-on", on); cloudBtn.title = on ? _t("云端：已登录{p}", { p: accountName() ? ` ${accountName()}` : "" }) : _t("云端：没登录（歌只在这台设备上）");
    refreshBtn.hidden = !on;
  }
  function accountName(): string { try { const a = auth.getActiveAccount() as { username?: string; name?: string } | null; return a?.name || a?.username || ""; } catch { return ""; } }
  auth.onAuthChanged(() => renderCloud());

  let storeChanged = false;
  async function open(): Promise<void> {
    await d.flushLocal();
    const g = ensureMounted();
    document.body.dataset.mode = "gallery";
    fullEl.hidden = false;
    const dir = storeChanged ? "" : deviceKvGet(KV_FOLDER) ?? "";   // 换了家：回根（上个家的夹在这里不一定有）
    if (dir !== g.handle.getFolder()) g.handle.setFolder(dir);
    if (storeChanged) { storeChanged = false; deviceKvSet(KV_FOLDER, null); g.handle.refresh(); }   // 旧 store 上的订阅已经死了
    showAside(null);
    renderCloud();
    deviceKvSet(KV_SCENE, "gallery");
    diagNote("gallery", "open");
    d.onOpened?.();
  }
  function close(): void {
    player.stop();   // 离开歌库 = 停（编辑器里有自己的走带）
    fullEl.hidden = true;
    delete document.body.dataset.mode;
    deviceKvSet(KV_SCENE, null);
    d.onClosed?.();
  }
  const isOpen = () => !fullEl.hidden;
  /** gallery 0.8.8：开歌库直接进「要处理的」视图（顶部横幅 + 每首一粒「处理…」）。登录后发现有没同步好的 → 「去处理」走这里（2026-10-26，家族周账 F-98 / F-88）。 */
  async function openAttention(): Promise<void> { await open(); ensureMounted().handle.setAttentionOnly(true); }
  return {
    open, close, isOpen, renderCloud, openAttention,
    /** 换了家（store 换了实例）：图库的订阅要重来（下次开 = 回根 + 重新列）。 */
    noteStoreChanged: () => { storeChanged = true; if (!fullEl.hidden) { storeChanged = false; deviceKvSet(KV_FOLDER, null); gallery?.handle.setFolder(""); gallery?.handle.refresh(); } },
    setAttentionOnly: (on: boolean) => gallery?.handle.setAttentionOnly(on),
    /** boot 用：上次是在歌库里离开的（刷新 / 关标签 / SW 更新重载）。 */
    wasInGallery: () => deviceKvGet(KV_SCENE) === "gallery",
    refresh: () => gallery?.handle.refresh(),
    setView: (v: GalleryView) => showAside(v === "files" ? null : v),
    getView: (): GalleryView => gallery?.handle.getView() ?? "files",
    emptyAside: (kind: AsideKind, scope: AsideScope) => { const h = ensureMounted().handle; if (kind === "trash") h.emptyTrash(scope); else h.emptyBackup(scope); },
    currentFolder: () => gallery?.handle.getFolder() ?? (deviceKvGet(KV_FOLDER) ?? ""),
    /** 封面变了（存了新封面）：丢掉这首歌的缩略图缓存，下次露面重取。 */
    invalidateThumb: (id: string) => { void gallery?.thumbs?.invalidate(id); void gallery?.facts?.invalidate(id); },   // 封面变了：缩略图和事实都重取
    /** 这首歌的事实重取（设备上记着的声音挂到它名下了 / 摘了：老缓存里的事实可能没有文件戳）。 */
    invalidateFacts: (id: string) => { void gallery?.facts?.invalidate(id); },
    /** 修改锁（gallery 0.9.x 的动词，成没成它自己会说）：解锁 = **只许门的钮调**（src/app/edit-lock-door.ts；歌库卡片的菜单是图库库自己的入口）。 */
    unlockEdit: (id: string): Promise<boolean> => ensureMounted().handle.unlockEdit(id),
    saveVersionThenUnlock: (id: string): Promise<boolean> => ensureMounted().handle.saveVersionThenUnlock(id),
    /** 「锁上」：调用方已经把改动存好了。 */
    lockEdit: (id: string): Promise<void> => ensureMounted().handle.lockEdit(id),
    /** 封面上在放的那首 / 播放器状态（E2E 用）。 */
    playing: () => player.playing(),
    playerState: () => player.state(),
  };
}
export type GalleryHost = ReturnType<typeof initGalleryHost>;
