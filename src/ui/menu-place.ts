// menu-place.ts —— 小菜单摆在哪：不盖住要躲的东西（选区的带子）。纯函数。
// created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟）。设计 = ai-docs/20261114-pointer-rules-design.md 第二节第 5 条：
//   先试带子下面，放不下试上面，再试左右；都放不下才允许盖。右键、选区旁的小钮、选区条的「操作…」三条路都照这条摆。
//   起因 = user 2026-11-14 在 iPad 上选中一个音，选区菜单盖在了选区上（截图）。

export interface ScreenRect { left: number; top: number; right: number; bottom: number }

/** 菜单（w × h）摆在哪：at = 叫出它的那一点（左上角往那儿靠）；avoid = 要躲开的框（屏幕坐标）；view = 窗口大小；m = 离窗口边至少多远。
 *  没有要躲的（或都在窗口外）= 原来的摆法：at 下面，放不下翻到上面。covers = 四个方向都放不下、只好盖着。 */
export function placeMenu(size: { w: number; h: number }, at: { x: number; y: number }, avoid: readonly ScreenRect[], view: { w: number; h: number }, m = 8): { x: number; y: number; covers: boolean } {
  const { w, h } = size, gap = 8;
  const cx = (x: number) => Math.max(m, Math.min(x, view.w - w - m)), cy = (y: number) => Math.max(m, Math.min(y, view.h - h - m));
  const seen = avoid.filter((r) => r.right > 0 && r.bottom > 0 && r.left < view.w && r.top < view.h && r.right > r.left && r.bottom > r.top);
  if (!seen.length) { let y = at.y + gap; if (y + h > view.h - m) y = at.y - h - gap; return { x: cx(at.x), y: cy(y), covers: false }; }
  const u = seen.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }));
  const below = u.bottom + gap; if (below + h <= view.h - m) return { x: cx(at.x), y: below, covers: false };
  const above = u.top - gap - h; if (above >= m) return { x: cx(at.x), y: above, covers: false };
  const right = u.right + gap; if (right + w <= view.w - m) return { x: right, y: cy(at.y), covers: false };
  const left = u.left - gap - w; if (left >= m) return { x: left, y: cy(at.y), covers: false };
  let y = at.y + gap; if (y + h > view.h - m) y = at.y - h - gap;
  return { x: cx(at.x), y: cy(y), covers: true };
}
