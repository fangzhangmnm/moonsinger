export type Pointer = "mouse" | "pen" | "touch";
/** 按在什么上：音或休止 / 能拿起来挪的记号（力度、渐强渐弱、风格…）/ 演奏法（跳音、重音…，只能点）/ 别的（空白）。 */
export type Target = "note" | "mark" | "art" | "blank";
/** 这东西现在亮不亮框：点亮的（留住的）、在选区里、鼠标正悬浮在它上面（只有鼠标有悬浮）。 */
export declare function isLit(o: {
    pointer: Pointer;
    sticky: boolean;
    inSel: boolean;
    hovered: boolean;
}): boolean;
/** 按下之后动了（过了抖动的门槛）：
 *  drag = 拖这个音（上下改音高，同原来的拖法）；lift = 拿起这个记号挪；box = 从按下的地方拉框；scroll = 滚动谱面。
 *  手指直接在谱上拖永远是滚动（亮着框的音 / 记号用框边的把手拖）。没亮框的东西 = 和空白一样。canDrag = 这个模式 / 修改锁让不让拖。 */
export declare function onMove(o: {
    pointer: Pointer;
    target: Target;
    lit: boolean;
    canDrag: boolean;
}): "drag" | "lift" | "box" | "scroll";
/** 没动就松手（轻点）：light = 让它亮框（音 / 休止顺带把光标放到它后面）；menu = 开它的小菜单；caret = 点空白（取消选择、放光标）。
 *  记号点一下先亮框，亮着再点 = 小菜单（鼠标悬浮着就算亮着 = 一下就开，和原来一样）；演奏法点一下 = 亮框 + 一句说明（宿主说）。 */
export declare function onTap(o: {
    target: Target;
    lit: boolean;
}): "light" | "menu" | "caret";
/** 手指点亮的东西旁边出不出拖的把手（音 = 上下改音高；记号 = 左右挪）。canDrag = 模式 / 修改锁让不让拖。 */
export declare function wantsGrip(o: {
    pointer: Pointer;
    target: Target;
    canDrag: boolean;
}): boolean;
