/** 盖层的种类：menu = 小菜单（点外面收）；sheet = 面板（offer：导出 / 设置 / 问一句…）；card = 轨的小卡（非模态，点外面收）。 */
export type OverlayKind = "menu" | "sheet" | "card";
export interface Overlay {
    readonly k: OverlayKind;
    readonly close: () => void; /** 这层自己的重画（轨的小卡：撤销 / 别处改了跟着变）。 */
    readonly redraw?: () => void;
}
/** 整页（盖住谱区的那种，和盖层不是一回事：一次只在一页上）：score = 谱；inst = 乐器页；finder = 乐器目录（playOnly = 从歌库进的只弹着玩，不出「上场」；backToInst = 从乐器页开的，关了回乐器页）。
 *  刀 3 之二（2026-10-14）：原来 main.ts 里五个旗 instShown / finderShown / finderPlayOnly / finderBackToInst（+ trackRedraw）各自维护，从这儿推。 */
export type Page = {
    readonly k: "score";
} | {
    readonly k: "inst";
} | {
    readonly k: "finder";
    readonly playOnly: boolean;
    readonly backToInst: boolean;
};
/** 从页推出来的：pad 只弹不写（锁住）= 不在谱上（乐器页 / 目录开着，弹的是台上 / 试听台上那位）。 */
export declare const padLocked: (p: Page) => boolean;
export interface OverlayRegistry {
    /** 现在开着的那层（没有 = null）。 */
    readonly overlay: Overlay | null;
    /** 开新的 = 旧的先关（调它的 close），再记下这层。 */
    open(next: Overlay): void;
    /** 关现在开着的（没有 = 什么都不做）。 */
    close(): void;
    /** 某一层自己收了（点外面 / Esc / 做完）：只在它还是现在这层时清掉——晚到的 close 不会误清后来开的那层。 */
    closed(close: () => void): void;
    is(k: OverlayKind): boolean;
    /** 现在开着的那层要重画（没有 / 它没有 redraw = 什么都不做）。 */
    redraw(): void;
    /** 现在在哪一页。 */
    readonly page: Page;
    setPage(p: Page): void;
}
export declare function createOverlayRegistry(): OverlayRegistry;
