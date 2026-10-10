// 参数行（深模块，created by Claude Opus 5.5 2026-10-10）：名字 + 小方块问号 + 读数 + 控件。
// 滑块的手感全在这里：拖 / 滚轮一格一步 / 双击回默认，三条路都只发 input 事件，宿主照旧只听 input。
// user「鼠标滚轮能不能一格一格滚各种slider，帮助强迫症」「或者你干脆做一个旋钮的深模块」→「我觉得还是滑块吧？」（触屏上滑块直接拖）。
import { wheelSteps } from "./wheel.ts";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** 一行：名字 + 问号（iPad 点了在这一行下面展开说明；桌面悬停也有）+ 读数 + 控件（滑块 / 开关 / 下拉…）。 */
export function paramRow(label: string, hint: string, out: string, control: string, cls = "fx-row"): string {
  return `<div class="param ${cls}" title="${esc(hint)}"><span class="row-lab">${esc(label)}<button class="q" type="button" aria-label="这是什么">?</button> ${out}</span>${control}<div class="row-help">${esc(hint)}</div></div>`;
}

export interface SliderSpec {
  min: number; max: number; step: number; value: number;
  /** 宿主认这根滑块用的属性（`data-gain`、`data-p="hpHz"`…），原样写进去。 */
  attrs: string;
  /** 双击回到的值（滑块上的值）；不给 = 双击不管。 */
  def?: number;
  /** 「双击回 ___」那几个字。 */
  defText?: string;
}
export function slider(s: SliderSpec): string {
  const def = s.def == null || !Number.isFinite(s.def) ? "" : ` data-def="${s.def}" title="双击回 ${esc(s.defText ?? String(s.def))}"`;
  return `<input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}"${def} ${s.attrs} />`;
}

const fire = (t: HTMLInputElement) => { t.dispatchEvent(new Event("input", { bubbles: true })); t.dispatchEvent(new Event("change", { bubbles: true })); };

/** 在根上挂一次（委托，重画不用重挂）：滚轮、双击、问号。 */
export function wireParamRows(root: HTMLElement): void {
  const acc = new WeakMap<HTMLInputElement, number>();
  root.addEventListener("wheel", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "range" || t.disabled) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // 横着划 = 让给外面横着滚卡片
    e.preventDefault();
    const r = wheelSteps(e, acc.get(t) ?? 0); acc.set(t, r.acc);
    if (!r.steps) return;
    const before = t.value;
    if (r.steps < 0) t.stepUp(-r.steps); else t.stepDown(r.steps);   // 往上滚 = 大
    if (t.value !== before) fire(t);
  }, { passive: false });
  root.addEventListener("dblclick", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "range" || t.dataset.def === undefined) return;
    const before = t.value; t.value = t.dataset.def;
    if (t.value !== before) fire(t);
  });
  root.addEventListener("click", (e) => {
    const q = (e.target as HTMLElement).closest(".param .q"); if (!q) return;
    q.closest(".param")!.classList.toggle("show-help");
  });
}
