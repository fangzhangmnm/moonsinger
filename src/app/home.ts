// home.ts —— 这首歌的家：三种家互斥 + 存 / 改名 / 离开 / 安家的**唯一入口**（F-49「家」收成 Home 接口）。
//   created 2026-10-21 by Claude Fable 5.1（doc 这一刀 ai-docs/20261016-document-single-entry.md §5 留的下一刀；家族周账 F-49，user 10-17「家：这个算本周的欠债，记账，下周fable弄」；
//   策划 + 现状 / 提案 .h = ai-docs/20261021-home-interface.md）。
//   以前（v0.13.9 及之前）main.ts 里是一个口袋对象 doc = { stem, named, handle, mtime, identifier, pendingHome }，三种家的 if 链散在 fileSave / smartSave / homeNow /
//   leaveCurrent / openStoreDoc / newStoreSong / saveIntoGallery / renameActive / afterGalleryClosed / openGallery / signOutFlow … 十几处各写各的，漏一处就是一种家走错路。
//   现在：家 = 一个判别联合（消费点 switch + assertNever，加第四种家时 tsc 逐点报错）；改家只有这里的动词；
//   「离开歌库那条路 = 放下 editor-session 的身份」在换家那一处守（以前从歌库里的歌直接开本机文件不放，es 还举着旧身份——推要是没推上，下一次 pagehide 会把本机文件的字节写进上一首）。
//   纯模块：不碰 DOM、不碰持久化、不 import store / editor-session（全经 ports 注入；node 能跑，test/home.test.ts 钉 家 × 动词 的矩阵）。
//   同形：WeebPaint src/doc-home.ts（gallery / file / transient + 持权动词）。家族语义：保存 = 回家（一个动作）、导出 = 寄明信片（永不清 dirty，不经这里）。
import type { FileHandle } from "./doc-file.ts";
import { fileSafe } from "./names.ts";

/** 一首歌任一时刻恰好有一个家。 */
export type Home =
  | { kind: "gallery"; identifier: string }                      // 歌库里的一首：store 身份（`夹/主干.mxl`）；自动存 + consent 制推云（editor-session 承重）
  | { kind: "file"; handle: FileHandle; mtime: number | null }   // 本机文件（桌面 Chromium 的句柄）：「存」= 写回去；mtime = 打开 / 上次写回时它的 lastModified（写前对表）
  | { kind: "none"; pendingFolder: string | null };              // 还没家。pendingFolder ≠ null = 歌库里「新建」出来的空谱（首笔安家：第一笔编辑才铸身份进这个夹）

/** 消费点 exhaustive 守卫：switch 落到这儿 = 联合类型加了新成员而这个消费点没跟上。 */
export function assertNever(x: never): never { throw new Error("[home] non-exhaustive switch: " + JSON.stringify(x)); }

export type RenameResult = { ok: true; oldKept?: boolean } | { ok: false; where: "cloud" | "local" };

/** 宿主注入的四条路：歌库（editor-session + store）/ 本机文件（doc-file）/ 身份拼法 / 问人与副作用。这里零 DOM、零持久化。 */
export interface HomePorts {
  gallery: {
    /** 「存」在歌库里 = 宿主的 smart save（forceSaveAndPush + 登录提示 + 回话都归宿主）。 */
    save(): Promise<void>;
    flushLocal(): Promise<void>;
    flushAndPush(): Promise<void>;
    markDirty(): void;
    adopted(id: string, o: { create: true }): void;
    release(): void;
    rename(to: string): Promise<RenameResult>;
    occupied(id: string): Promise<boolean>;
  };
  file: {
    canPickSave(): boolean;
    pickSave(suggestedName: string): Promise<FileHandle | null>;
    writeTo(h: FileHandle, bytes: Uint8Array): Promise<void>;
    mtime(h: FileHandle): Promise<number | null>;
    isStale(seen: number | null, now: number | null): boolean;
  };
  ids: { join(folder: string, stem: string): string; parse(id: string): { folder: string; stem: string } | null };
  /** 文件名后缀（.mxl）：给人看的名字用。 */
  suffix: string;
  /** 这首歌现在的 .mxl 字节。 */
  bytes(): Uint8Array;
  /** 改过没存？（文档的脏 = D.dirty()） */
  dirty(): boolean;
  /** 纸上的歌名（可空；没存过时文件名跟着它）。 */
  title(): string;
  /** 新的默认名 `yyyymmdd-hex4`（撞名时拿它的 hex4）。 */
  freshStem(): string;
  ask: {
    /** 「改过还没存，<what>会丢掉」：true = 丢掉继续（宿主的面板自带「先存」，那条路由宿主自己走）。 */
    discard(what: string): Promise<boolean>;
    /** 本机文件在外面被改过：true = 照样覆盖。 */
    overwriteStale(fileName: string): Promise<boolean>;
  };
  /** 没有句柄这回事的设备（iPad / Safari）：递出下载 / 分享面板；点了才算存了（onSaved）。 */
  offerDownload(bytes: Uint8Array, name: string, onSaved: () => void): void;
  /** 落盘成功 = 基线换成现在（D.markSaved）。 */
  markSaved(): void;
  /** 离开时推不上 / 安家落盘失败：报出去（不吞）。 */
  report(e: unknown, level: "warning" | "error"): void;
  /** 家换了（宿主：告诉 store 谁开着、上次开着哪首的指针、重画顶栏）。 */
  onHome(prev: Home, next: Home): void;
  /** 文件名换了（宿主：重画顶栏）。 */
  onName(): void;
}

export type SaveOutcome =
  | { k: "blank" }                       // 等着安家的空谱：没什么可存（宿主诚实回话，不塞空壳）
  | { k: "gallery" }                     // 走了歌库那条（gallery.save 自己说话）
  | { k: "written"; name: string }       // 写回 / 安家成了
  | { k: "declined" }                    // 文件在外面被改过、人没让覆盖
  | { k: "cancelled" }                   // 保存框取消了（AbortError ≠ 环境不支持，不降级弹下载）
  | { k: "offered"; name: string };      // 递出了下载 / 分享面板（点了才算存了）
export type RenameOutcome =
  | { k: "renamed"; stem: string; oldKept: boolean }
  | { k: "same" }                        // 空名 / 没变
  | { k: "fileHome"; name: string }      // 本机文件的名字浏览器改不了，在文件管理器里改
  | { k: "taken"; where: "cloud" | "local" };
export type IntoGalleryOutcome =
  | { k: "blank" }                       // 等着安家的空谱还没有笔
  | { k: "settled"; identifier: string } // 等着安家的空谱有笔了 = 安家
  | { k: "moved"; identifier: string; flushed: boolean };   // 无地稿 / 本机文件的稿放进了歌库；flushed=false = 落盘报了错、身份留着等下一轮自动存

export interface HomeKeeper {
  readonly home: Home;
  /** 文件名主干（歌名在谱里，和文件名分开；user「之后各管各的同意」）。 */
  readonly stem: string;
  /** 文件名定下来了没（存过 / 打开的 / 改过名的 = true；没存过 = 跟着歌名走）。 */
  readonly named: boolean;
  /** 歌库里的身份；不在歌库 = null。 */
  identifier(): string | null;
  /** 等着安家的空谱？ */
  pending(): boolean;
  /** 显示 / 存档用的名字：没存过 = 年月日-歌名（没歌名 = 默认名）；定下来的 = stem。 */
  name(): string;
  /** 带后缀的文件名（本机文件 = 句柄的名字）。 */
  fileName(): string;
  /** 换歌：整个家换掉（歌库 → 别处 = 放下 es 的身份）。 */
  load(home: Home, o: { stem: string; named: boolean }): void;
  /** 存 = 回家，一个动作：歌库 = smart save；本机文件 = 写回（写前 mtime 对表）；还没家 = 安家（保存框 / 下载）；等着安家的空谱 = 有笔先安家再走歌库的存。 */
  save(): Promise<SaveOutcome>;
  /** 改文件名：歌库 = store tryMove（撞名不覆盖）；还没家 = 只改下次存的名字；本机文件 = 改不了。 */
  rename(raw: string): Promise<RenameOutcome>;
  /** 离开现在这首（切歌 / 新建 / 打开别的 / 进歌库）：等着安家的有笔先安家；歌库 = 先落盘 + 推（不问）；本机文件 / 无地 = 改过没存先问。
   *  nextIsGallery = 要切到歌库里另一首：es.open 自己会先存旧的（退出语义），这里不重复推。 */
  leave(what: string, o?: { nextIsGallery?: boolean }): Promise<boolean>;
  /** 首笔安家：等着安家的空谱铸身份（文件名 = 歌名或默认名，撞名加 -hex4）→ es 接管（首存 mode:"new"）→ 立刻落本地。单飞；途中换了歌就作罢。 */
  settle(): Promise<void>;
  /** 等着安家的空谱已经有了第一笔 → 先安家（切歌 / 存 / 新建之前；不然那几笔会当无地稿被问「丢掉？」）。 */
  settleIfEdited(): Promise<void>;
  /** 把手里这首（无地 / 本机文件）放进歌库（文件名沿用；撞名加 -hex4）。等着安家的空谱 = 有笔就安家，没笔不塞空壳。 */
  intoGallery(folder: string): Promise<IntoGalleryOutcome>;
  /** 放下歌库里的身份（进歌库 / 被挪夹 / 进了回收站 / 退出登录）→ 还没家。不在歌库 = no-op。 */
  release(): void;
  /** 内容变了（1 s 心跳 + 每次 commit）：歌库 = 告诉 es（autosave 节律）；等着安家的空谱 = 安家。 */
  noteChanged(): void;
}

export function createHome(init: { home: Home; stem: string; named: boolean }, ports: HomePorts): HomeKeeper {
  let home = init.home, stem = init.stem, named = init.named;
  const same = (a: Home, b: Home): boolean =>
    a.kind === "gallery" ? b.kind === "gallery" && a.identifier === b.identifier
    : a.kind === "file" ? b.kind === "file" && a.handle === b.handle
    : b.kind === "none" && a.pendingFolder === b.pendingFolder;
  /** 换家的唯一出口：歌库 → 别处 = 放下 es 的身份（autosave 绝不能把新内容写进上一首）；然后宿主的副作用。 */
  function setHome(next: Home): void {
    const prev = home;
    if (same(prev, next)) { home = next; return; }
    home = next;
    if (prev.kind === "gallery" && next.kind !== "gallery") ports.gallery.release();
    ports.onHome(prev, next);
  }
  function setName(s: string, n: boolean): void { if (s === stem && n === named) return; stem = s; named = n; ports.onName(); }
  const name = (): string => { const t = fileSafe(ports.title()); return named || !t ? stem : `${stem.slice(0, 8)}-${t}`; };
  /** 存好了：文件名从此定下来（之后和歌名各管各的）。 */
  const fixName = (): void => setName(name(), true);
  const stemOfFile = (fileName: string): string => fileName.replace(/\.(mxl|musicxml|xml)$/i, "");
  const stemOfId = (id: string): string => ports.ids.parse(id)?.stem ?? id;
  const pending = (): boolean => home.kind === "none" && home.pendingFolder != null;
  /** 铸身份：文件名 = 歌名或默认名；撞名加 -hex4，不加序号（WXHW user 2026-09-10「我最讨厌 123 这种的序号焦虑」）。 */
  async function mint(folder: string): Promise<string> {
    const base = name();
    let id = ports.ids.join(folder, base);
    for (let n = 0; n < 50 && (await ports.gallery.occupied(id)); n++) id = ports.ids.join(folder, `${base}-${ports.freshStem().slice(9)}`);
    return id;
  }
  /** 身份到手 → 家 = 歌库、名字定下来、es 接管（首存 mode:"new" 撞名不覆盖）→ 立刻落本地（歌库里马上看得见）。
   *  落盘报了错：身份留着、es 还脏，下一轮 autosave 再试（首笔安家和「存进歌库」同一条政策；以前「存进歌库」把身份退回去、es 却还举着新名字 = 半截回滚）。 */
  async function adopt(id: string): Promise<boolean> {
    setHome({ kind: "gallery", identifier: id });
    setName(stemOfId(id), true);
    ports.gallery.adopted(id, { create: true });
    try { await ports.gallery.flushLocal(); return true; }
    catch (e) { ports.report(e, "error"); return false; }
  }
  let homing: Promise<void> | null = null;
  function settle(): Promise<void> {
    if (homing) return homing;
    const h = home;
    if (h.kind !== "none" || h.pendingFolder == null) return Promise.resolve();
    homing = (async () => {
      const id = await mint(h.pendingFolder!);
      if (home !== h) return;   // 途中换了歌（新建 / 开别的）= 作罢
      await adopt(id);
    })().finally(() => { homing = null; });
    return homing;
  }
  const settleIfEdited = (): Promise<void> => (pending() && ports.dirty() ? settle() : Promise.resolve());

  async function save(): Promise<SaveOutcome> {
    if (pending()) { if (!ports.dirty()) return { k: "blank" }; await settle(); }   // 空谱诚实回话（WeebPaint blankNothingToSave）；有笔先安家再走歌库的存
    const h = home;
    switch (h.kind) {
      case "gallery": await ports.gallery.save(); return { k: "gallery" };
      case "file": {
        // 写之前对一次 mtime，文件在外面被改过就先问（0819 spec §7「原位写回前查 lastModified」）
        const now = await ports.file.mtime(h.handle);
        if (ports.file.isStale(h.mtime, now) && !(await ports.ask.overwriteStale(h.handle.name))) return { k: "declined" };
        await ports.file.writeTo(h.handle, ports.bytes());
        if (home === h) { home = { kind: "file", handle: h.handle, mtime: await ports.file.mtime(h.handle) }; fixName(); ports.markSaved(); }   // 写的间隙没换家才记（换了家 = 别把别人的名字标成存好了）
        return { k: "written", name: h.handle.name };
      }
      case "none": {
        // 还没有家 = 安家：桌面 Chromium 先开系统保存框（在手势里；取消 = 到此为止，不降级弹下载），再编码、写、认领句柄。
        if (ports.file.canPickSave()) {
          const handle = await ports.file.pickSave(name() + ports.suffix);
          if (!handle) return { k: "cancelled" };
          await ports.file.writeTo(handle, ports.bytes());
          setHome({ kind: "file", handle, mtime: await ports.file.mtime(handle) });
          setName(stemOfFile(handle.name) || stem, true);
          ports.markSaved();
          return { k: "written", name: handle.name };
        }
        // iPad / Safari 没有句柄这回事 = 下载或分享一个 .mxl 到「文件」里，点了才算存了（这台设备上下载就是存——没有别的家可回）
        const fileName = name() + ports.suffix;
        ports.offerDownload(ports.bytes(), fileName, () => { fixName(); ports.markSaved(); });
        return { k: "offered", name: fileName };
      }
      default: return assertNever(h);
    }
  }

  async function rename(raw: string): Promise<RenameOutcome> {
    const s = fileSafe(raw), h = home;
    switch (h.kind) {
      case "file": return { k: "fileHome", name: h.handle.name };
      case "none": if (!s || s === name()) return { k: "same" }; setName(s, true); return { k: "renamed", stem: s, oldKept: false };
      case "gallery": {
        const p = ports.ids.parse(h.identifier);
        if (!p || !s || s === p.stem) return { k: "same" };
        const to = ports.ids.join(p.folder, s);
        const r = await ports.gallery.rename(to);   // tryMove：撞名不覆盖、旧名进回收站
        if (!r.ok) return { k: "taken", where: r.where };
        setHome({ kind: "gallery", identifier: to });
        setName(s, true);
        return { k: "renamed", stem: s, oldKept: !!r.oldKept };
      }
      default: return assertNever(h);
    }
  }

  async function leave(what: string, o: { nextIsGallery?: boolean } = {}): Promise<boolean> {
    await settleIfEdited();
    const h = home;
    switch (h.kind) {
      case "gallery":
        if (!o.nextIsGallery) { try { await ports.gallery.flushAndPush(); } catch (e) { ports.report(e, "warning"); } }   // 自动存的东西没什么可丢：落盘 + 推，不问
        return true;
      case "file": case "none": return ports.dirty() ? ports.ask.discard(what) : true;
      default: return assertNever(h);
    }
  }

  async function intoGallery(folder: string): Promise<IntoGalleryOutcome> {
    if (pending()) {
      if (!ports.dirty()) return { k: "blank" };
      await settle();
      return home.kind === "gallery" ? { k: "settled", identifier: home.identifier } : { k: "blank" };
    }
    const id = await mint(folder);
    const flushed = await adopt(id);
    return { k: "moved", identifier: id, flushed };
  }

  function release(): void { if (home.kind === "gallery") setHome({ kind: "none", pendingFolder: null }); }
  function noteChanged(): void {
    if (home.kind === "gallery") { if (ports.dirty()) ports.gallery.markDirty(); }
    else if (pending() && ports.dirty()) void settle();
  }

  return {
    get home() { return home; }, get stem() { return stem; }, get named() { return named; },
    identifier: () => (home.kind === "gallery" ? home.identifier : null),
    pending, name,
    fileName: () => (home.kind === "file" ? home.handle.name : name() + ports.suffix),
    load: (h, o) => { setHome(h); setName(o.stem, h.kind === "none" ? o.named : true); },
    save, rename, leave, settle, settleIfEdited, intoGallery, release, noteChanged,
  };
}
