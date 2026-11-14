export interface ScreenRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
/** 菜单（w × h）摆在哪：at = 叫出它的那一点（左上角往那儿靠）；avoid = 要躲开的框（屏幕坐标）；view = 窗口大小；m = 离窗口边至少多远。
 *  没有要躲的（或都在窗口外）= 原来的摆法：at 下面，放不下翻到上面。covers = 四个方向都放不下、只好盖着。 */
export declare function placeMenu(size: {
    w: number;
    h: number;
}, at: {
    x: number;
    y: number;
}, avoid: readonly ScreenRect[], view: {
    w: number;
    h: number;
}, m?: number): {
    x: number;
    y: number;
    covers: boolean;
};
