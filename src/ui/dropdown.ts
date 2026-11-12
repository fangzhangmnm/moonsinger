// dropdown.ts —— 本仓的下拉框：界面零件库的下拉标准件（@internal/workbench-elements 0.3.0 select-field）套一层「像原生下拉框一样用」的接法。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟；施工单 7-T）。
//   规矩（本仓 CLAUDE.md「界面的规矩」，user 2026-11-12「我们的下拉框全都不要用 iPad 默认的，都用我们 UI 库里面自带的」）：src / index.html 里不许有原生的下拉框元素（结构守卫 test/no-native-select.test.ts）。
//   接法和原来的原生下拉框一样：下拉 = 一颗 <button>，当前值在它的 value 上；选了一项 = 改 value + 冒泡一个 change 事件——
//   原来「监听 change、读 e.target.value / dataset」的代码一行不用改。代码里改值 / 改选项 = setDropdown（钮面跟着重画）。
//   弹层默认压在面板（sheet）那一层上面（band modal = --z-sheet）：本仓的下拉有的在设置面板里，有的在谱面上，统一放最上面那一层。
import { mountSelectField, currentPopupMenu, type SelectItem, type SelectFace, type PopupBand, type SelectField } from "@internal/workbench-elements";
/** 进属性的字（选项是 JSON，放在 data-dd="…" 里）。 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type DropItem = SelectItem;
export interface DropOpts { band?: PopupBand; face?: SelectFace; align?: "left" | "right" }
const STATE = new WeakMap<HTMLElement, { items: DropItem[]; f: SelectField }>();

/** 写进 innerHTML 的一个下拉：选项、当前值、怎么弹跟着元素走（data-dd），innerHTML 之后 mountDropdowns(容器) 接上。
 *  cls / attrs = 原来写在原生下拉框上的类和 data-*（宿主的皮和事件靠它们认）；title 同时当读屏名。 */
export function dropdownHtml(items: readonly DropItem[], value: string, o: DropOpts & { cls?: string; attrs?: string; title?: string; disabled?: boolean; id?: string } = {}): string {
  const spec = { items, band: o.band, face: o.face, align: o.align };
  return `<button type="button"${o.id ? ` id="${esc(o.id)}"` : ""} class="dd${o.cls ? ` ${o.cls}` : ""}" data-dd="${esc(JSON.stringify(spec))}" value="${esc(value)}"${o.title ? ` title="${esc(o.title)}"` : ""}${o.attrs ? ` ${o.attrs}` : ""}${o.disabled ? " disabled" : ""}></button>`;
}
/** 接上 root 里还没接的下拉（innerHTML 之后叫一次；接过的不重复接）。 */
export function mountDropdowns(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>("button[data-dd]").forEach((el) => {
    const spec = JSON.parse(el.dataset.dd!) as DropOpts & { items: DropItem[] };
    el.removeAttribute("data-dd");
    dropdown(el, spec.items, spec);
  });
}
/** 把一颗按钮变成下拉（代码里建的场合）。当前值 = el.value。 */
export function dropdown(el: HTMLButtonElement, items: readonly DropItem[], o: DropOpts = {}): void {
  const st = { items: [...items] } as { items: DropItem[]; f: SelectField };
  st.f = mountSelectField(el, {
    items: () => st.items, value: () => el.value,
    onChange: (v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); },
    band: o.band ?? "modal", ...(o.align ? { align: o.align } : {}), ...(o.face ? { face: o.face } : {}), ...(el.title ? { ariaLabel: el.title } : {}),
  });
  STATE.set(el, st);
}
/** 代码里改当前值 / 换一批选项：钮面跟着重画。 */
export function setDropdown(el: HTMLElement, o: { items?: readonly DropItem[]; value?: string }): void {
  const st = STATE.get(el); if (!st) throw new Error("setDropdown: not a mounted dropdown");
  if (o.items) st.items = [...o.items];
  if (o.value !== undefined) (el as HTMLButtonElement).value = o.value;
  st.f.refresh();
}
/** 现在的选项（测试 / 探针用）。 */
export const dropdownItems = (el: HTMLElement): readonly DropItem[] => STATE.get(el)?.items ?? [];
/** 这一下按在打开着的下拉列表里吗（列表挂在 body 上，不在宿主的框里）：宿主的「点外面就收」要把它当成里面——不然在面板里开下拉、一选面板先收了。 */
export const inDropdownList = (t: EventTarget | null): boolean => t instanceof Element && !!t.closest(".popup-menu");
/** 键盘归谁（原生下拉框打开时浏览器自己吃键，现在要明着让）：
 *  ① 列表开着的时候按的键归列表（上下键、回车、Esc 都是库的弹层处理的，Esc 收的只是列表）——在文档的捕获阶段、库的监听之前记下来
 *    （库的监听只在列表开着时才挂，比这个晚挂 = 排在后面）；宿主的全局键盘看到记过的就不接（不然 Esc 会连面板一起收、上下键会挪谱上的光标）。
 *  ② 焦点停在下拉那颗按钮上：空格 / 回车是打开它，不是播放——宿主当成「表单控件拿着焦点」。 */
const LIST_KEYS = new WeakSet<Event>();
if (typeof document !== "undefined") document.addEventListener("keydown", (e) => { if (currentPopupMenu()) LIST_KEYS.add(e); }, true);
export const keyForList = (e: Event): boolean => LIST_KEYS.has(e);
export const isDropdown = (t: EventTarget | null): boolean => t instanceof HTMLElement && t.classList.contains("dd");
