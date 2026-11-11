export interface DrumColumn {
    items: string[];
    index: number;
    width: number;
    title?: string;
    loop?: boolean;
}
export interface DrumOpts {
    onChange(col: number, index: number): void;
    onClose?(): void;
}
/** setItems：换某一列的内容（位置不变）——长短一变，连音那列的小蝌蚪跟着变（user「三联五联的小蝌蚪应该跟着base时值adaptive的变」）。
 *  setIndex：把某一列滚到第 i 格、不回报 onChange（拨了一列、宿主那边另一列的现值跟着变了：「1=」拨了调 = 调式那列从「跟谱」挪到大调，v0.16.9）。 */
export interface DrumHandle {
    close(): void;
    setItems(col: number, items: string[]): void;
    setIndex(col: number, i: number): void;
}
/** 在 anchor（旋钮）那里展开：选中带对着旋钮（旋钮在最下面一排时放不下，就整根往上挪）。同时只开一根，再开会先收起旧的。 */
export declare function openDrum(anchor: HTMLElement, cols: DrumColumn[], o: DrumOpts): DrumHandle;
export declare const closeDrum: () => void | undefined;
export interface WheelOpts {
    items: string[];
    index: number;
    row?: number;
    visible?: number;
    loop?: boolean;
    onChange(i: number): void;
    onPick?(i: number): void;
}
export interface WheelHandle {
    setItems(items: string[]): void;
    scrollTo(i: number): void;
}
/** 一根滚轮（浏览器原生滚动 + 吸附：手感 = 系统里别的列表；慢拖微调、一甩靠惯性滑一大段）。弹出的滚轮（上面）和速度面板里嵌着的共用一份。
 *  col = 一个 class 为 drum-col 的空元素（CSS 管滚动和吸附），高度 = row × visible。停在中间那格 = 选中，一变就 onChange；点一格 = onPick。 */
export declare function mountWheel(col: HTMLElement, c: WheelOpts): WheelHandle;
