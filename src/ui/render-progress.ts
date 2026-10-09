// render-progress.ts —— 渲染进度条（顶栏底边一条细线）。created 2026-10-08 深夜 by Claude Opus 5.5
// user「其实我一直不爽渲染没有加进度条，以后mp3导出还是有渲染的，加一下进度条」「那么顺便做一个渲染进度条」。
// 不许谎报（家规「不许煤气灯」）：渲染按「单元」走（一个声部 / 以后一段纸 = 一格；最后混音一格）——做完的格子实心；
//   正在做的那一格是流动的条纹（只说「在干活」，不假装百分比）；只有真知道百分比的时候（下载模型）那一格才按比例填。
export class RenderProgress {
  private el: HTMLDivElement; private fill: HTMLDivElement; private cur: HTMLDivElement;
  private total = 0; private done = 0;
  constructor(parent: HTMLElement) {
    this.el = document.createElement("div"); this.el.className = "render-bar"; this.el.hidden = true; this.el.setAttribute("role", "progressbar");
    this.fill = document.createElement("div"); this.fill.className = "rb-fill";
    this.cur = document.createElement("div"); this.cur.className = "rb-cur";
    this.el.append(this.fill, this.cur); parent.append(this.el);
  }
  /** 开始：一共几格。 */
  start(units: number): void { this.total = Math.max(1, units); this.done = 0; this.el.hidden = false; this.draw(null); }
  /** 当前这一格知道百分比了（0–1；下载）。null = 不知道（条纹）。 */
  frac(f: number | null): void { if (!this.el.hidden) this.draw(f); }
  /** 这一格做完。 */
  next(): void { this.done = Math.min(this.total, this.done + 1); this.draw(null); }
  /** 收起。 */
  end(): void { this.el.hidden = true; }
  get running(): boolean { return !this.el.hidden; }
  private draw(f: number | null): void {
    const w = 100 / this.total, left = this.done * w;
    this.fill.style.width = `${left + (f !== null ? f * w : 0)}%`;
    this.cur.style.left = `${left}%`; this.cur.style.width = `${this.done < this.total ? w : 0}%`;
    this.cur.classList.toggle("known", f !== null);
    this.el.setAttribute("aria-valuenow", String(Math.round(left + (f ?? 0) * w)));
  }
}
