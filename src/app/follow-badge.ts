// follow-badge.ts —— 设置每一行后面那枚「跟着谁」的小图标（施工单第 20 条 20-4；设计 = ai-docs/20261113-settings-follow-whom-design.md 第四节，user 2026-11-13 逐行同意）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   三种：这首歌（音符，页面设置只在标题旁标一次）/ 你的歌库（唱片箱）/ 这台设备（屏幕）。悬停 = title；iPad 没有悬停 = 点一下说出那句话（宿主给怎么说）。
//   只标「会记住东西」的行；版本、长文、还原出厂这种不记东西的行不标。
import { _t } from "../i18n/index.ts";

export type Follow = "song" | "account" | "device";
const ICON: Record<Follow, string> = { song: "music-note", account: "music-library", device: "device" };
/** 那句话（设计稿第四节的表；「跟歌库」那句补了没连歌库时的去处——不连也照样记着，不能让人以为没存）。 */
export const FOLLOW_TEXT: Record<Follow, () => string> = {
  song: () => _t("跟这首歌走，存在歌的文件里"),
  account: () => _t("跟你的歌库走，哪台设备打开都一样（还没连歌库时先记在这台设备上）"),
  device: () => _t("跟这台设备走，不同步"),
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** 名字后面那枚（HTML）。 */
export function followBadge(f: Follow): string {
  const t = esc(FOLLOW_TEXT[f]());
  return `<span class="set-follow" data-follow="${f}" role="img" tabindex="0" aria-label="${t}" title="${t}"><svg class="ico" aria-hidden="true"><use href="#${ICON[f]}"/></svg></span>`;
}
/** 在根上挂一次：点（或回车）那枚 = 说出那句话。回一个解绑。 */
export function wireFollowBadges(root: HTMLElement, say: (text: string) => void): () => void {
  const hit = (e: Event): void => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".set-follow"); if (!b || !root.contains(b)) return;
    if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); e.stopPropagation();
    const f = b.dataset.follow as Follow | undefined; if (f && FOLLOW_TEXT[f]) say(FOLLOW_TEXT[f]());
  };
  root.addEventListener("click", hit, true); root.addEventListener("keydown", hit, true);
  return () => { root.removeEventListener("click", hit, true); root.removeEventListener("keydown", hit, true); };
}
