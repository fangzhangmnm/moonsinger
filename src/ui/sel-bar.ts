// sel-bar.ts —— 选区条：有选区时挂在走带胶囊下面的一条（照 WeebPaint 的上下文条）：全选 / 复制 / 剪切 / 粘贴 / 移调 / 删 / ✕。created 2026-10-08 by Claude Fable 5.1
//   user 2026-10-08「有选区时，胶囊下面出一条选区条…对」「快捷键其实现在我都没用过」（触屏优先；快捷键只是顺手）。
//   没选区但剪贴板里有东西 = 只露「粘贴 / ✕」（贴在光标处；✕ = 忘掉剪贴板）。记号（跳音 / 呼吸…）以后也进这里（user「写完改的」）。
import { iconHtml } from "./icon.ts";

export type SelVerb = "all" | "copy" | "cut" | "paste" | "transpose" | "delete" | "clear" | "forget";
export interface SelBarHost { verb(v: SelVerb): void }

export class SelBar {
  readonly el: HTMLDivElement;
  constructor(parent: HTMLElement, host: SelBarHost) {
    this.el = document.createElement("div"); this.el.className = "sel-bar"; this.el.hidden = true;
    parent.append(this.el);
    this.el.addEventListener("pointerdown", (e) => e.stopPropagation());   // 别让谱面把这一下当点谱
    this.el.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v as SelVerb | undefined; if (v) host.verb(v); });
  }
  /** 画：sel = 有没有选区（几个 token）；clip = 剪贴板里有没有东西；over = 别的全屏视图盖着（藏）。 */
  update(sel: number, clip: boolean, over: boolean): void {
    if (over || (!sel && !clip)) { this.el.hidden = true; return; }
    const b = (v: SelVerb, label: string, icon?: string, cls = "") => `<button type="button" class="btn ${cls}" data-v="${v}">${icon ? iconHtml(icon) : ""}<span>${label}</span></button>`;
    this.el.innerHTML = sel
      ? `<span class="sel-n">${sel} 个</span>` + b("all", "全选") + b("copy", "复制") + b("cut", "剪切") + (clip ? b("paste", "粘贴") : "") + b("transpose", "移调") + b("delete", "删", "trash-can", "danger") + b("clear", "", "x")
      : b("paste", "粘贴到光标处") + b("forget", "", "x");
    this.el.hidden = false;
  }
}
