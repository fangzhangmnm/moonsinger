// sheets.ts —— 应用内模态原语：busy 遮罩 / 同步闸（冲突面，不可 dismiss）/ 问一句 / 输入一行 / 选一个。created 2026-10-08 by Claude Fable 5.1
//   抄 WebXiaoHeiWu src/sheets.ts 的形状，DOM 自己造（不靠 index.html 里预埋 id）；样式用本仓已有的 .offer / .offer-card（settings 面板同款）。
//   家规：禁系统 alert / prompt / confirm。busy 与交互 sheet 互斥（WeebPaint 2026-06-12 死锁：遮罩盖住输入框 → await 永不 resolve）：
//   confirm / input / choice 在 busy 期间响亮 throw；gate 不受此限（它就是在 busy 里弹的冲突面）。
//   键盘：开着 sheet 时 Esc = 取消、Enter = 主钮（capture 阶段吃掉，不漏给谱面的路由）。

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// ── busy 遮罩（可重入 ref-count；store 内部也会嵌套调 busy）──
let busyEl: HTMLElement | null = null, busyDepth = 0;
function busyBox(): HTMLElement {
  if (!busyEl) { busyEl = document.createElement("div"); busyEl.className = "busy-overlay"; busyEl.hidden = true; busyEl.innerHTML = `<div class="offer-card busy-card"><div class="busy-spinner"></div><div class="busy-text"></div></div>`; document.body.append(busyEl); }
  return busyEl;
}
export function isBusyActive(): boolean { return busyDepth > 0; }
export async function withBusy<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  const box = busyBox();
  busyDepth++; box.querySelector(".busy-text")!.textContent = label; box.hidden = false;
  try { return await fn(); }
  finally { busyDepth--; if (busyDepth <= 0) { busyDepth = 0; box.hidden = true; } }
}
export function setBusyText(label: string): void { if (busyEl && !busyEl.hidden) busyEl.querySelector(".busy-text")!.textContent = label; }

// ── 同步闸（store 的冲突面 / 「跳过到离线」逃生闸；锁屏 + 有限选项；不可 dismiss；穿透 busy）──
interface GateAction<T> { label: string; value: T; primary?: boolean }
export interface GateOpts<T> { title: string; message: string; note?: string; showSpinner?: boolean; actions: GateAction<T>[] }
let gateEl: HTMLElement | null = null, gatePending: ((v: unknown) => void) | null = null, gateFocusBack: HTMLElement | null = null;
export function lockSyncGate<T = string>({ title, message, note, showSpinner, actions }: GateOpts<T>): Promise<T> {
  // 焦点先拿走：弹出来时常常正在打字，不然键盘隔着遮罩继续往谱里写（WXHW 2026-09-29）。
  const a = document.activeElement;
  if (a instanceof HTMLElement && a !== document.body) { gateFocusBack = a; a.blur(); }
  if (!gateEl) { gateEl = document.createElement("div"); gateEl.className = "offer gate-sheet"; document.body.append(gateEl); }
  gateEl.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(message)}</div>` +
    (showSpinner ? `<div class="busy-spinner"></div>` : "") + `<div class="offer-btns gate-actions"></div>` + (note ? `<div class="offer-msg gate-note">${esc(note)}</div>` : "") + `</div>`;
  const box = gateEl.querySelector(".gate-actions")!;
  return new Promise<T>((resolve) => {
    for (const act of actions) {
      const btn = document.createElement("button"); btn.type = "button"; btn.className = `btn${act.primary ? " primary" : ""}`; btn.textContent = act.label;
      btn.addEventListener("click", () => { unlockSyncGate(); resolve(act.value); });
      box.append(btn);
    }
    gateEl!.hidden = false;
    gatePending = resolve as (v: unknown) => void;
  });
}
export function unlockSyncGate(): void {
  if (gateEl) gateEl.hidden = true;
  gatePending = null;
  const back = gateFocusBack; gateFocusBack = null;
  if (back?.isConnected && (document.activeElement === document.body || document.activeElement == null)) { try { back.focus({ preventScroll: true }); } catch { /* ignore */ } }
}
export function settleSyncGate(value: unknown): void { if (gatePending) { const r = gatePending; unlockSyncGate(); r(value); } }
export const isGateOpen = (): boolean => gatePending != null;

// ── 交互 sheet：一次只开一个；主钮 / 取消 / 背板 / Esc ──
let sheetOpen: (() => void) | null = null;   // 当前 sheet 的取消路径
export const isSheetOpen = (): boolean => sheetOpen != null;
/** 关掉当前开着的交互 sheet（= 取消）。 */
export function closeSheet(): void { sheetOpen?.(); }
function assertNotBusy(what: string): void {
  if (isBusyActive()) throw new Error(`sheet "${what}" opened while the busy overlay is active (would deadlock): move the interaction outside withBusy`);
}
function mount(html: string, onCancel: () => void, onEnter?: () => void): { box: HTMLElement; close: () => void } {
  sheetOpen?.();
  const box = document.createElement("div"); box.className = "offer"; box.innerHTML = `<div class="offer-card">${html}</div>`;
  const onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); }
    else if (e.key === "Enter" && onEnter && !(e.target as HTMLElement)?.closest("textarea")) { e.preventDefault(); e.stopPropagation(); onEnter(); }
    else if (!(e.target as HTMLElement)?.closest("input, textarea")) e.stopPropagation();   // 别的键不漏给谱面
  };
  window.addEventListener("keydown", onKey, true);
  const close = () => { window.removeEventListener("keydown", onKey, true); box.remove(); if (sheetOpen === cancelRef) sheetOpen = null; };
  const cancelRef = () => onCancel();
  sheetOpen = cancelRef;
  box.addEventListener("pointerdown", (e) => { if (e.target === box) { e.preventDefault(); onCancel(); } });
  document.body.append(box);
  return { box, close };
}

export interface ConfirmOpts { okLabel?: string; cancelLabel?: string; danger?: boolean }
/** 问一句：true = 点了 okLabel；取消 / 背板 / Esc = false。 */
export function openConfirmSheet(title: string, message: string, opts: ConfirmOpts = {}): Promise<boolean> {
  assertNotBusy("confirm");
  return new Promise((resolve) => {
    const done = (v: boolean) => { m.close(); resolve(v); };
    const m = mount(`<div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(message)}</div>` +
      `<div class="offer-btns"><button type="button" class="btn" data-v="no">${esc(opts.cancelLabel ?? "算了")}</button><button type="button" class="btn ${opts.danger ? "danger" : "primary"}" data-v="ok">${esc(opts.okLabel ?? "好")}</button></div>`,
      () => done(false), () => done(true));
    m.box.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (v === "ok") done(true); else if (v === "no") done(false); });
    m.box.querySelector<HTMLButtonElement>('[data-v="ok"]')!.focus();
  });
}

export interface InputOpts { defaultValue?: string; placeholder?: string; okLabel?: string; message?: string }
/** 输入一行：字符串 = 确定；null = 取消。 */
export function openInputSheet(title: string, opts: InputOpts = {}): Promise<string | null> {
  assertNotBusy("input");
  return new Promise((resolve) => {
    const done = (v: string | null) => { m.close(); resolve(v); };
    const m = mount(`<div class="offer-title">${esc(title)}</div>` + (opts.message ? `<div class="offer-msg">${esc(opts.message)}</div>` : "") +
      `<label class="set-field"><input class="sheet-input" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" value="${esc(opts.defaultValue ?? "")}" placeholder="${esc(opts.placeholder ?? "")}" /></label>` +
      `<div class="offer-btns"><button type="button" class="btn" data-v="no">算了</button><button type="button" class="btn primary" data-v="ok">${esc(opts.okLabel ?? "好")}</button></div>`,
      () => done(null), () => done(inp.value));
    const inp = m.box.querySelector<HTMLInputElement>("input")!;
    m.box.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (v === "ok") done(inp.value); else if (v === "no") done(null); });
    inp.focus(); inp.select();
  });
}

/** onPick：在点击事件里**同步**调（sheet 关掉之前）——登录跳转这种必须站在用户手势里起跳的动作用它（WeebPaint / WXHW 同款）。 */
export interface Choice<T> { label: string; value: T; primary?: boolean; danger?: boolean; hint?: string; onPick?: () => void }
/** 选一个：value = 点了那个；null = 取消。 */
export function openChoiceSheet<T>(title: string, message: string, choices: Choice<T>[]): Promise<T | null> {
  assertNotBusy("choice");
  return new Promise((resolve) => {
    const done = (v: T | null) => { m.close(); resolve(v); };
    const m = mount(`<div class="offer-title">${esc(title)}</div>` + (message ? `<div class="offer-msg">${esc(message)}</div>` : "") +
      `<div class="sheet-choices">${choices.map((c, i) => `<button type="button" class="btn${c.primary ? " primary" : ""}${c.danger ? " danger" : ""}" data-i="${i}" ${c.hint ? `title="${esc(c.hint)}"` : ""}>${esc(c.label)}</button>`).join("")}</div>` +
      `<div class="offer-btns"><button type="button" class="btn" data-v="no">算了</button></div>`,
      () => done(null));
    m.box.addEventListener("click", (e) => {
      const t = e.target as HTMLElement, b = t.closest<HTMLElement>("[data-i]");
      if (b) { const c = choices[Number(b.dataset.i)]; c.onPick?.(); done(c.value); } else if (t.closest<HTMLElement>("[data-v]")?.dataset.v === "no") done(null);
    });
  });
}
