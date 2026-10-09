// 参考窗的宿主适配层。created 2026-10-08 深夜 by Claude Opus 5.5（v0.8 参考窗纪元；对齐稿 = ai-docs/20261008-reference-window-alignment.md）
// user：「现在最卫生的是reference window然后还有实时预览」「mp3可以暂缓。现在主要就是对着截图打谱哈哈哈」
//   「文字也支持，反正就是无脑一包直接用。文字比如一些和声之类的东西都蛮有用的」。
//
// 参考窗本体 = 家族共享库 @internal/reference-window（牌组模型 + 默认视图 <wp-reference-window>）。**本文件是 MoonSinger 里唯一认识那个库的地方**
//   （test/reference-guard.test.ts 守着），样板 = WXHW src/reference-host.ts：
//   · 卡：库现有的图片卡 / 文字卡整包收（截图、和声笔记）；live / 链接卡这一版不接，别的种类库原样带着
//   · 存：`.moonsinger/references/` 整个目录（manifest.json + 每张卡的字节）经库的 encodeDeck / decodeDeck 进出，本文件只搬字节；
//     不放进 extras（extras 进撤销快照——参考窗不进撤销，同 WXHW），宿主拿 files() / rev() 存、拿 apply() 开
//   · 脏：加 / 删 / 挪卡 = 正经改动（编好字节之后 rev +1、onCards() 通知宿主）；开关窗 / 挪窗 / 翻卡 = 视图态（宿主存时顺手捞，不标脏）
//   · 清单比库新（DeckManifestTooNewError）→ 目录原样带着、存的时候原样写回、明说；不吞、不猜
//   · 图片原样存（家规「字节进出不走 canvas」；库也说没编码器就留原字节）；单张超过 4 MB 先问一句「存进歌里 / 取消」（家族批过的提醒线）
//   · 粘贴看焦点：窗有焦点 = 贴进窗；没有 = 宿主照旧（谱里贴简谱文字）
import "@internal/reference-window";
import type { WpReferenceWindow, RefMenuPort, RefPanelRect } from "@internal/reference-window";
import { encodeDeck, decodeDeck, mimeForName, DeckManifestTooNewError } from "@internal/reference-window/deck";
import { togglePopupMenu } from "@internal/workbench-elements";

const APP = "moonsinger";                          // 目录 = .moonsinger/references/（库按 app 名算）
const KINDS = ["image", "text"] as const;          // 这个宿主画得出来的；其余的库原样带着
export const BIG_BYTES = 4 * 1024 * 1024;          // 单张超过这么大先问（技术方案批过的 4 MB 提醒线）
/** 窗的位置 / 开着没有（视图态：存进 score.json 的 view.ref，不标脏、不进撤销）。 */
export interface RefPanel { open: boolean; left: number; top: number; width: number; height: number }

export interface ReferenceHostDeps {
  info(text: string): void;
  error(text: string): void;
  /** 顶栏下缘（浮窗不往上越过它）。 */
  topFloor(): number;
  /** 屏底被占掉的高度（竖屏时 pad 那一块 + iOS 键盘把视口顶起的一截）：拖 / 缩放 / 钳制都留出它，右下角的把手不躲到 pad 底下。 */
  bottomFloor(): number;
  /** 关窗 / Esc 之后焦点还给谱。 */
  focusScore(): void;
  /** 单张很大：问一句（应用内面板，不用系统对话框）。 */
  confirmBig(name: string, bytes: number): Promise<boolean>;
  /** 卡片变了、字节已经编好（files() / rev() 已是新的）：宿主标脏、通知存档节律。 */
  onCards(): void;
}

export function createReferenceHost(d: ReferenceHostDeps) {
  const el = document.createElement("wp-reference-window") as WpReferenceWindow;
  el.className = "ref-window";
  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.multiple = true; fileInput.hidden = true; fileInput.accept = "image/*,.txt,.md,text/plain,text/markdown";
  document.body.append(el, fileInput);

  let encoded: Record<string, Uint8Array> = {};      // 现在要存的那份字节（路径 → 字节；路径都在 .moonsinger/references/ 下）
  let rev = 0;                                         // 卡片改动的修订号（宿主拿它判脏）
  let seq = 0;                                         // 编码排队：后来的赢
  let carried = false;                                 // 清单比库新：encoded 是原样带着的，不从牌组重编
  let applying = false;                                // apply 期间牌组的 reset 不算用户改动
  let placed = false;                                  // 这首歌里开过窗（没开过 = view 里不写 ref）
  let pending: Promise<void> = Promise.resolve();

  // ── 注入 ──
  el.menuPort = ((o) => togglePopupMenu(o)) as RefMenuPort;
  el.setAttribute("no-cloud", "");                     // 不从云盘选图（歌库不是图库；iPad 的「文件」已经能挑相册 / OneDrive）
  el.labels = {
    load: "导入图片 / 文字…", paste: "粘贴", oneToOne: "原尺寸", del: "删掉这张", delConfirm: "再点一次删掉", closeWin: "收起参考窗",
    prev: "上一张", next: "下一张", menu: "参考窗菜单", move: "拖动", resize: "改大小", resizeAria: "改大小",
    moveEarlier: "往前挪", moveLater: "往后挪", jump: "跳到…", kindNames: { image: "图片", text: "文字" }, linkMissing: "内容不在了",
  };
  const syncFloor = () => { el.topFloor = d.topFloor(); el.bottomFloor = d.bottomFloor(); if (el.open) el.reclamp(); };
  window.addEventListener("resize", syncFloor);

  // ── 牌组变化 → 编字节 → 脏 ──
  const reencode = () => {
    const my = ++seq;
    pending = (async () => {
      const out: Record<string, Uint8Array> = {};
      for (const [path, blob] of encodeDeck(el.deck.snapshot(), { app: APP })) out[path] = new Uint8Array(await blob.arrayBuffer());
      if (my !== seq) return;   // 又改过了：让后来的那次落
      encoded = out; carried = false; rev++;
      d.onCards();
    })();
  };
  el.deck.onChange((what) => { if (!applying && what.type === "cards") reencode(); });
  el.addEventListener("openchange", () => { if (el.open) { placed = true; syncFloor(); } });
  el.addEventListener("rectchange", () => { placed = true; });

  // ── ＋ 菜单 / 粘贴 / 拖放 ──
  el.addEventListener("requestload", () => { fileInput.value = ""; fileInput.click(); });
  fileInput.addEventListener("change", () => { const files = [...(fileInput.files ?? [])]; if (files.length) void importFiles(files); });
  el.addEventListener("requestpaste", () => { void pasteFromClipboard(); });
  window.addEventListener("paste", (e) => {   // 粘贴看焦点（库 0.3.1）：窗有焦点 → 文件 / 文字进窗；没有 → 不管，宿主的粘贴照旧
    if (!el.hasFocus) return;
    const cd = e.clipboardData; if (!cd) return;
    e.preventDefault(); e.stopPropagation();
    const files = [...cd.files];
    if (files.length) { void importFiles(files); return; }
    const text = cd.getData("text/plain");
    if (text.trim()) { el.addText(text, { name: "" }); el.open = true; return; }
    d.error("剪贴板里没有图片或文字");
  }, true);
  el.addEventListener("dragover", (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; } });
  el.addEventListener("drop", (e) => { const files = [...(e.dataTransfer?.files ?? [])]; if (!files.length) return; e.preventDefault(); e.stopPropagation(); void importFiles(files); });
  el.addEventListener("notice", (e) => {
    const n = (e as CustomEvent).detail as { level: string; code: string; name?: string; message: string };
    d.error(n.code === "decode-failed" ? `这张图这个浏览器打不开${n.name ? `：${n.name}` : ""}` : `参考窗：${n.message}`);
  });
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); d.focusScore(); } });   // Esc = 焦点回谱（窗留着）

  async function importFiles(files: File[]): Promise<void> {
    let added = 0;
    for (const f of files) {
      if (f.type.startsWith("text/") || /\.(txt|md)$/i.test(f.name)) { el.addText(await f.text(), { name: f.name }); added++; continue; }
      if (!f.type.startsWith("image/")) { d.error(`认不出：${f.name}（参考窗收图片和文字）`); continue; }
      if (f.size > BIG_BYTES && !(await d.confirmBig(f.name, f.size))) continue;
      el.deck.add({ kind: "image", bytes: f, mime: f.type, name: f.name });
      added++;
    }
    if (added) { el.open = true; el.focus({ preventScroll: true }); d.info(`参考窗：加了 ${added} 张`); }
  }
  async function pasteFromClipboard(): Promise<void> {
    try {
      for (const it of await navigator.clipboard.read()) {
        const img = it.types.find((x) => x.startsWith("image/"));
        if (img) { await importFiles([new File([await it.getType(img)], `粘贴.${img.split("/")[1] ?? "png"}`, { type: img })]); return; }
        if (it.types.includes("text/plain")) { const text = await (await it.getType("text/plain")).text(); if (text.trim()) { el.addText(text, { name: "" }); el.open = true; return; } }
      }
      d.error("剪贴板里没有图片或文字");
    } catch {
      try { const text = await navigator.clipboard.readText(); if (text.trim()) { el.addText(text, { name: "" }); el.open = true; return; } } catch { /* 浏览器不给读 */ }
      d.error("读不了剪贴板：点一下参考窗，再按 Ctrl / ⌘+V");
    }
  }

  return {
    /** 现在要存的字节（路径 → 字节）。 */
    files: (): Record<string, Uint8Array> => encoded,
    /** 卡片改动的修订号。 */
    rev: () => rev,
    /** 编码还在跑的话等它（存之前调，免得刚加的卡没赶上）。 */
    settled: () => pending,
    /** 开一首歌：files = 歌里 `.moonsinger/references/` 下的全部字节；panel = 视图态里记的窗（没有 = 收着）。 */
    async apply(files: Record<string, Uint8Array>, panel: RefPanel | null): Promise<void> {
      seq++; applying = true; carried = false; encoded = { ...files }; placed = !!panel;
      try {
        if (!Object.keys(files).length) el.deck.clear();
        else el.deck.restore(await decodeDeck({ app: APP, knownKinds: KINDS, getFile: (p) => { const b = files[p]; return b ? new Blob([b as unknown as BlobPart], { type: mimeForName(p) }) : null; } }));
      } catch (e) {
        el.deck.clear();
        if (e instanceof DeckManifestTooNewError) { carried = true; d.error(`这首歌的参考窗是更新版本的 app 存的（参考清单第 ${e.fileVersion} 版，这一版认到第 ${e.libVersion} 版）：原样留着、存的时候原样写回，这里先不显示`); }
        else { carried = true; d.error(`参考窗读不出来：${(e as Error).message}（字节原样留着、存的时候原样写回）`); }
      } finally { applying = false; }
      if (panel) el.rect = { left: panel.left, top: panel.top, width: panel.width, height: panel.height };
      el.open = !!panel?.open && !carried;
      if (el.open) syncFloor();
    },
    /** 视图态：开过窗才有。 */
    panel(): RefPanel | null { if (!placed) return null; const r: RefPanelRect = el.rect; return { open: el.open, left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; },
    /** 菜单入口：开 = 顺手给焦点（开窗 → Ctrl+V 一步到位）；关 = 焦点回谱。 */
    toggle(): void {
      if (carried) { d.error("这首歌的参考窗是更新版本的 app 存的，这一版先不显示（原样留着）"); return; }
      el.open = !el.open;
      if (el.open) { placed = true; syncFloor(); el.focus({ preventScroll: true }); } else d.focusScore();
    },
    isOpen: () => el.open,
    hasFocus: () => el.hasFocus,
    count: () => el.deck.cards().length,
    /** pad 露 / 收、视口变了之后宿主调。 */
    relayout: syncFloor,
    /** 测试用：导入（同菜单那条路）。 */
    importFiles,
    el,
  };
}
export type ReferenceHost = ReturnType<typeof createReferenceHost>;
