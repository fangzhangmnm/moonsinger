// fit-wide.ts —— 字放不下的控件跟着字变宽（统筹 2026-11-12：按钮的字不折行不变（7-R）；放不下 = 控件跟着字变宽，一排放不下就整颗换到下一排，字不许伸出控件外；
//   中文界面的样子不许因此变）。画完量一下：只有字真的伸出了控件的地方才动，放得下的（中文全部）一个不碰。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   起因：英文界面巡检（test/e2e/i18n-en.mjs）红的 4 处——iPad mini 竖屏「声部管理」那一排三颗钮、手机「设置」里「重开小月相引擎」。

/** 这颗控件里的字有多宽（px，和巡检同一把尺子：字的墨框）+ 左右内边距和边框 = 放下它要多宽。 */
function needW(b: HTMLElement): number {
  const r = document.createRange(); r.selectNodeContents(b);
  const cs = getComputedStyle(b), pad = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
  return r.getBoundingClientRect().width + pad("padding-left") + pad("padding-right") + pad("border-left-width") + pad("border-right-width");
}
/** 字伸出了边框（和巡检同一个判断：字的墨框宽 > 控件宽减边框 + 1.5）。只吃掉一点内边距、没出边框的不算（中文那几颗就是这样，不碰）。 */
function overflows(b: HTMLElement): boolean {
  const r = document.createRange(); r.selectNodeContents(b);
  const cs = getComputedStyle(b), border = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
  return r.getBoundingClientRect().width > b.getBoundingClientRect().width - border + 1.5;
}

/** root 下面：① 设置一行的控件区（.wbe-row-ctl，界面零件库的一项一行）里有字伸出去的 = 控件区换到说明下面、可以占满一整行（靠右）；
 *  ② 一排等宽格子（.pm-acts）里最长那颗放不下 = 格子的最小宽改成它的宽（格子少几列、整颗换到下一排；中文放得下 = 照旧 118）。 */
export function fitWide(root: ParentNode): void {
  for (const ctl of root.querySelectorAll<HTMLElement>(".wbe-row-ctl")) {
    if (!ctl.getClientRects().length) continue;   // 没显示的那一页：切过去的时候再量
    ctl.classList.remove("is-wide"); ctl.parentElement?.classList.remove("is-wrap");
    const over = [...ctl.querySelectorAll<HTMLElement>(".btn")].some(overflows);
    ctl.classList.toggle("is-wide", over); ctl.parentElement?.classList.toggle("is-wrap", over);
  }
  for (const g of root.querySelectorAll<HTMLElement>(".pm-acts")) {
    if (!g.getClientRects().length) continue;
    g.style.removeProperty("--pm-col");
    const btns = [...g.querySelectorAll<HTMLElement>(".btn")];
    if (!btns.some(overflows)) continue;
    g.style.setProperty("--pm-col", `${Math.ceil(Math.max(...btns.map(needW)))}px`);
  }
}
