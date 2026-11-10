// edit-lock.ts —— 开着的这首歌此刻让不让改（家族「源文件原则上只读：手动解锁才能改」= 修改锁）。created 2026-11-10 by Claude Fable 5.2
//   user 2026-11-08：「默认的文件你根本不能编辑，一编辑就报错，一保存就报错，然后都是灰的…得手动的解锁才行」
//   「到时候演示所的设计得设计的非常的瑞士奶酪…甚至是我们在库这一层里面本身拒绝写入」（演示所 = 演示锁，语音）。
//   家族标准 = 家族根 ai-docs/20261108-edit-lock-standard.md；写歌的设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md；样板 = WeebPaint src/edit-lock.ts。
//
// **两个问题，各只有一处回答：**
//   「这首歌锁着吗」        → 这里的 locked()。每次问都现算，不记状态，不会失步。
//   「这个操作锁着能做吗」  → src/app/edit-lock-table.ts 那张表。这里的 writeGate(kind) 是查它的写入口那一头。
// 各道都来问这两处，不各写各的判断：
//   ① 界面：键盘总闸（src/app/input-gate.ts 的 locked 口）、谱面的规则、面板淡一档（main.ts 按 locked() 摆）；
//   ② 写入口：src/app/document.ts D.commit → writeGate(kind)；③ 撤销重做：按要翻的那一格的类别问同一个 writeGate；
//   ④ 保存：歌库 = editor-session 的 editLocked（问 identifierLocked）；硬盘上的单个文件 = src/app/home.ts 的 save / leave（问 locked）。**这一层不看表：锁着一个字节都不写。**
//   ⑤ 库：@internal/store 的 lockByDefault，独立成立。
// 锁着 = 库开了 lockByDefault ∧ 开着的歌住在歌库里 ∧ 不是刚新建还没首存的 ∧ 这台设备上没有活着的解锁；
//   或者开着的是硬盘上的单个文件、这一次打开还没解。还没有家的新歌：这把锁不管。
// 解锁只许由人的手势发起：这里没有任何解锁歌库里的歌的口（那在门的钮和歌库的菜单里，走图库库）；unlockLocalFile 只许门的钮调（test/edit-lock-guard.test.mjs 钉）。
// 纯模块：不碰 DOM、不碰持久化、不 import 宿主；依赖全注入（node 能跑，test/edit-lock.test.ts）。
import type { LocusKind } from "../score/history.ts";
import { isLookOp } from "./edit-lock-table.ts";

/** 库的锁面（@internal/store 2.3.x 的 files 那几样；结构类型，测试可 mock）。 */
export interface LockStore { lockByDefault: boolean; unlockOf(identifier: string): unknown; watchUnlocks(cb: (live: unknown[]) => void): () => void }
/** 开着的这首歌的家（src/app/home.ts 的 Home 的投影：这里只要知道是哪一种、身份 / 句柄是谁）。 */
export type LockHome = { kind: "gallery"; identifier: string } | { kind: "file"; handle: object } | { kind: "none" };

export interface EditLockDeps {
  /** 现在挂着的库的锁面；没有库 → null。 */
  store(): LockStore | null;
  /** 开着的这首歌的家。 */
  home(): LockHome;
  /** 歌库里刚新建、还没首存的那首（它还不在库里，谈不上锁；首存之后库发一枚解锁）。 */
  createPending(): boolean;
  /** 正在装入文档（装入不算改）。 */
  loading(): boolean;
}
export type LockState = "none" | "locked" | "unlocked";
export interface EditLock {
  /** 开着的这首歌和这把锁的关系。none = 这把锁不管它（没有家 / 刚新建还没存 / 库没开锁）。 */
  state(): LockState;
  /** 开着的这首歌此刻是不是锁着。 */
  locked(): boolean;
  /** 现在有没有东西可以「锁上」：开着一首已经存在的歌，而且它此刻解着。 */
  canLockNow(): boolean;
  /** 现在开着的是不是硬盘上的单个文件（门据此只给一个钮）。 */
  isLocalFile(): boolean;
  /** 保存这一层用：歌库里的这个身份是不是锁着（editor-session 按「要存的那个身份」问，不按「开着的这首」）。 */
  identifierLocked(identifier: string): boolean;
  /** 写入口：这一类操作此刻让不让做。让 → null；不让 → 原因（并让门闪一下）。没锁：都放。锁着：表里的看法放行，其余一律拒。装入期间放行。 */
  writeGate(kind: LocusKind): string | null;
  /** 「接着改」：解锁现在开着的这个硬盘文件，管到关掉 / 换开别的为止。**只在人点钮时调。** 开着的不是硬盘文件 → false。 */
  unlockLocalFile(): boolean;
  /** 这个句柄算解着：新歌刚存成的文件（人自己那一下保存建出来的）。不是解锁的口：只许 home 的安家那一处调，而且要在把家换成这个文件之前、同一个同步段里调。 */
  keepLocalFileUnlocked(handle: object): void;
  /** 「锁上」现在开着的这个硬盘文件（调之前调用方已经把改动写回去了）。 */
  lockLocalFile(): void;
  /** 蹭到了：让门闪一下（不弹任何东西）。 */
  flash(): void;
  onFlash(fn: () => void): () => void;
  /** 锁态变了（换歌 / 解锁 / 锁上 / 过期 / 换库）→ 回调现在的锁态。 */
  onChange(fn: (locked: boolean, state: LockState) => void): () => void;
  /** 对一下：库换了就重订解锁的订阅；锁态变了就通知。换歌、装入完、存完、换库之后调；多调无害。 */
  refresh(): void;
}

export function createEditLock(d: EditLockDeps): EditLock {
  // 硬盘上的单个文件（user 2026-11-08：「硬盘上的一个文件，如果能实现这个功能的话，我觉得也可以」「就取决于这个锁跟着是谁」）：
  //   它不经过库，库那一片奶酪没有；锁跟着**这一次打开的这个文件**（按句柄认）——打开默认锁着，人点「接着改」解锁，管到关掉 / 换开别的为止，不往任何地方记
  //   （单个文件没有可靠的身份，只有文件名；按名字记一天会认错文件）。导出、另存副本不归锁管 = 逃生口。
  let localUnlocked: object | null = null;
  let watched: LockStore | null = null, unwatch: (() => void) | null = null;
  let last: LockState = "none";
  const changeFns = new Set<(locked: boolean, state: LockState) => void>(), flashFns = new Set<() => void>();

  function state(): LockState {
    const h = d.home();
    if (h.kind === "file") return localUnlocked === h.handle ? "unlocked" : "locked";   // 硬盘上的单个文件：只看这一次打开解没解
    if (h.kind !== "gallery") return "none";
    const st = d.store(); if (!st || !st.lockByDefault || d.createPending()) return "none";
    return st.unlockOf(h.identifier) ? "unlocked" : "locked";
  }
  const locked = (): boolean => state() === "locked";
  function flash(): void { for (const f of flashFns) { try { f(); } catch { /* 闪不闪不许影响调用方 */ } } }
  function refresh(): void {
    const st = d.store();
    if (st !== watched) {
      unwatch?.(); unwatch = null; watched = st;
      if (st?.lockByDefault) unwatch = st.watchUnlocks(() => refresh());   // 解 / 锁 / 过期 / 改名：库会叫
    }
    const h = d.home();
    if (localUnlocked && !(h.kind === "file" && h.handle === localUnlocked)) localUnlocked = null;   // 那个文件已经不开着了：解锁到此为止
    const now = state();
    if (now === last) return;
    last = now;
    for (const f of changeFns) { try { f(now === "locked", now); } catch { /* 监听者出错不许影响锁 */ } }
  }
  return {
    state, locked,
    canLockNow: () => state() === "unlocked",
    isLocalFile: () => d.home().kind === "file",
    identifierLocked: (identifier) => { const st = d.store(); return !!st && st.lockByDefault && !st.unlockOf(identifier); },
    writeGate(kind) {
      if (d.loading() || !locked()) return null;
      if (isLookOp(kind)) return null;
      flash();
      return "edit-locked";
    },
    unlockLocalFile() { const h = d.home(); if (h.kind !== "file") return false; localUnlocked = h.handle; refresh(); return true; },
    keepLocalFileUnlocked(handle) { localUnlocked = handle; },   // 不在这里 refresh：调用方紧接着（同一个同步段里）把家换成这个文件，那一下的 refresh 才对账；先对账会因为「它还没开着」把这一笔清掉
    lockLocalFile() { localUnlocked = null; refresh(); },
    flash,
    onFlash: (fn) => { flashFns.add(fn); return () => flashFns.delete(fn); },
    onChange: (fn) => { changeFns.add(fn); return () => changeFns.delete(fn); },
    refresh,
  };
}
