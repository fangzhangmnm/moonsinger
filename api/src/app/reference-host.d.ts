import "@internal/reference-window";
import type { WpReferenceWindow, RefImportQuestion, RefImportChoice } from "@internal/reference-window";
export declare const ASK_ABOVE: number;
export declare const RAM_ABOVE: number;
export type { RefImportQuestion, RefImportChoice };
/** 窗的位置 / 开着没有（视图态：存进 score.json 的 view.ref，不标脏、不进撤销）。 */
export interface RefPanel {
    open: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
}
export interface ReferenceHostDeps {
    info(text: string): void;
    error(text: string): void;
    /** 顶栏下缘（浮窗不往上越过它）。 */
    topFloor(): number;
    /** 屏底被占掉的高度（竖屏时 pad 那一块 + iOS 键盘把视口顶起的一截）：拖 / 缩放 / 钳制都留出它，右下角的把手不躲到 pad 底下。 */
    bottomFloor(): number;
    /** 关窗 / Esc 之后焦点还给谱。 */
    focusScore(): void;
    /** 文件超过 1 MB：问存 / 压 / 只放内存 / 算了（应用内面板，不用系统对话框）。 */
    askImport(q: RefImportQuestion): Promise<RefImportChoice>;
    /** 卡片变了、字节已经编好（files() / rev() 已是新的）：宿主标脏、通知存档节律。 */
    onCards(): void;
    /** 修改锁（2026-11-10，参考窗 0.6.0 的 canEdit 口；家族修改锁标准「跟着文档存、但不进撤销的东西也要过同一处」）：现在让不让加 / 删 / 挪卡。
     *  翻页、缩放、开关窗不问（纯粹是看）。不给 = 永远让。 */
    canEdit?(): boolean;
    /** 被拒了（窗里的挪卡 / 删卡，或者从这头加卡）：宿主让门闪一下。 */
    onEditRefused?(): void;
}
export declare function createReferenceHost(d: ReferenceHostDeps): {
    /** 现在要存的字节（路径 → 字节）。 */
    files: () => Record<string, Uint8Array>;
    /** 卡片改动的修订号。 */
    rev: () => number;
    /** 编码还在跑的话等它（存之前调，免得刚加的卡没赶上）。 */
    settled: () => Promise<void>;
    /** 开一首歌：files = 歌里 `.moonsinger/references/` 下的全部字节；panel = 视图态里记的窗（没有 = 收着）。 */
    apply(files: Record<string, Uint8Array>, panel: RefPanel | null): Promise<void>;
    /** 视图态：开过窗才有。 */
    panel(): RefPanel | null;
    /** 菜单入口：开 = 顺手给焦点（开窗 → Ctrl+V 一步到位）；关 = 焦点回谱。 */
    toggle(): void;
    isOpen: () => boolean;
    hasFocus: () => boolean;
    count: () => number;
    /** pad 露 / 收、视口变了之后宿主调。 */
    relayout: () => void;
    /** 测试用：导入（同菜单那条路）。 */
    importFiles: (files: File[]) => Promise<void>;
    el: WpReferenceWindow;
};
export type ReferenceHost = ReturnType<typeof createReferenceHost>;
