// edit-lock-door.ts —— 那扇门：开着的歌锁着时，谱的上沿一条「锁着：接着改 / 存一版再改」。created 2026-11-10 by Claude Fable 5.2
//   user 2026-11-08：「解锁的时候…两个选项，一个是直接 in place 的编辑，一个是创建一个新的」「随手锁一下，就跟汽车…按下车钥匙滴滴一下，这种随手的习惯…能随手打开」
//   家族标准（家族根 ai-docs/20261108-edit-lock-standard.md）：不问「确定吗」；蹭到了只让它闪一下，不弹东西；锁着是常态、画面本身不变灰。
//   样板 = WeebPaint src/edit-lock-door.ts。和它不一样的一处：WeebPaint 的门住在通知栈里；写歌的通知栈在谱的底边（竖屏 = 键盘上沿），
//     常驻一条会一直盖着正在看的那一行，所以这里是 #app 里自己的一行（顶栏和谱之间），不盖任何东西（设计稿 14.2 第 5 条）。
// **解锁只在人点这两个钮时发生**（test/edit-lock-guard.test.mjs 钉：src 里调解锁的地方只有这里和歌库卡片的菜单）。
//   歌库里的歌：两个钮（接着改 / 存一版再改）；硬盘上的单个文件：一个钮（它旁边没有歌库可以放一版；要留底用导出里的「存一份副本」）。
import { _t } from "../i18n/index.ts";
import { iconHtml } from "../ui/icon.ts";
import type { EditLock } from "./edit-lock.ts";

export interface EditLockDoorDeps {
  lock: EditLock;
  /** 门插在谁前面（#stage）。 */
  before: HTMLElement;
  /** 开着的这首在歌库里的身份；不在歌库 → null。 */
  activeIdentifier(): string | null;
  /** 「接着改」：解锁歌库里的这首（图库库的动词，成没成它自己会说）。 */
  unlock(identifier: string): Promise<boolean>;
  /** 「存一版再改」：先存一版，成了才解锁。 */
  saveVersionThenUnlock(identifier: string): Promise<boolean>;
}
export interface EditLockDoor {
  /** 按现在的锁态和家重画（换歌之后叫：锁态没变但钮的个数可能变了）。 */
  sync(): void;
}

export function initEditLockDoor(d: EditLockDoorDeps): EditLockDoor {
  const el = document.createElement("div");
  el.id = "lockBar"; el.className = "lock-bar"; el.hidden = true; el.setAttribute("role", "status");
  d.before.parentElement!.insertBefore(el, d.before);
  let busy = false, drawnFor = "";
  function sync(): void {
    const locked = d.lock.locked(), local = d.lock.isLocalFile();
    el.hidden = !locked;
    const key = `${locked}|${local}`;
    if (!locked || key === drawnFor) { if (!locked) drawnFor = ""; return; }
    drawnFor = key;
    el.innerHTML = `<span class="lock-bar-what">${iconHtml("lock")}<span>${_t("锁着")}</span></span>` +
      `<button type="button" class="btn primary" data-v="continue" title="${_t("解锁，接着改这一首。放着一天不动会自己锁上；随时能在三条杠里「锁上」")}">${_t("接着改")}</button>` +
      (local ? "" : `<button type="button" class="btn" data-v="version" title="${_t("先把现在的样子存一版留底（收在歌库里这首歌的卡片下面），再解锁接着改")}">${_t("存一版再改")}</button>`);
  }
  el.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (!v || busy) return;
    if (d.lock.isLocalFile()) { if (v === "continue") d.lock.unlockLocalFile(); return; }
    const id = d.activeIdentifier(); if (!id) return;
    busy = true;
    void (v === "version" ? d.saveVersionThenUnlock(id) : d.unlock(id)).catch(() => false).finally(() => { busy = false; });   // 成没成图库库都说过了；解成了 → 库的 watchUnlocks → 锁态变 → 门收掉
  });
  d.lock.onChange(() => sync());
  d.lock.onFlash(() => {
    if (!d.lock.locked()) return;
    sync();
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");   // 重新触发一次动画
  });
  sync();
  return { sync };
}
