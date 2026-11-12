import { type SelectItem, type SelectFace, type PopupBand } from "@internal/workbench-elements";
export type DropItem = SelectItem;
export interface DropOpts {
    band?: PopupBand;
    face?: SelectFace;
    align?: "left" | "right";
}
/** 写进 innerHTML 的一个下拉：选项、当前值、怎么弹跟着元素走（data-dd），innerHTML 之后 mountDropdowns(容器) 接上。
 *  cls / attrs = 原来写在原生下拉框上的类和 data-*（宿主的皮和事件靠它们认）；title 同时当读屏名。 */
export declare function dropdownHtml(items: readonly DropItem[], value: string, o?: DropOpts & {
    cls?: string;
    attrs?: string;
    title?: string;
    disabled?: boolean;
    id?: string;
}): string;
/** 接上 root 里还没接的下拉（innerHTML 之后叫一次；接过的不重复接）。 */
export declare function mountDropdowns(root: ParentNode): void;
/** 把一颗按钮变成下拉（代码里建的场合）。当前值 = el.value。 */
export declare function dropdown(el: HTMLButtonElement, items: readonly DropItem[], o?: DropOpts): void;
/** 代码里改当前值 / 换一批选项：钮面跟着重画。 */
export declare function setDropdown(el: HTMLElement, o: {
    items?: readonly DropItem[];
    value?: string;
}): void;
/** 现在的选项（测试 / 探针用）。 */
export declare const dropdownItems: (el: HTMLElement) => readonly DropItem[];
/** 这一下按在打开着的下拉列表里吗（列表挂在 body 上，不在宿主的框里）：宿主的「点外面就收」要把它当成里面——不然在面板里开下拉、一选面板先收了。 */
export declare const inDropdownList: (t: EventTarget | null) => boolean;
export declare const keyForList: (e: Event) => boolean;
export declare const isDropdown: (t: EventTarget | null) => boolean;
