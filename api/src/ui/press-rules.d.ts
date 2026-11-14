import { type Pointer } from "./pointer.ts";
export type { Pointer } from "./pointer.ts";
/** 按在什么上：音或休止 / 能拿起来挪的记号（力度、渐强渐弱、风格…）/ 演奏法（跳音、重音…，只能点）/ 「词」里有字的字（只能点，挪用字下面的两颗小钮）/ 别的（空白）。 */
export type Target = "note" | "mark" | "art" | "lyric" | "blank";
/** 这东西现在亮不亮框：点亮的（留住的）、在选区里、鼠标正悬浮在它上面（只有鼠标有悬浮；字没有悬浮这回事，score-view 不给字报 hovered）。 */
export declare function isLit(o: {
    pointer: Pointer;
    sticky: boolean;
    inSel: boolean;
    hovered: boolean;
}): boolean;
/** 按下之后动了（过了抖动的门槛）：
 *  drag = 拖这个音（上下改音高，同原来的拖法）；lift = 拿起这个记号挪；box = 从按下的地方拉框；scroll = 滚动谱面。
 *  手指直接在谱上拖永远是滚动（亮着框的音 / 记号用框边的把手拖）。没亮框的东西 = 和空白一样。canDrag = 这个模式 / 修改锁让不让拖。
 *  字（lyric）永远不是挪：鼠标、笔 = 拉框，手指 = 滚动（挪字用字下面的两颗小钮，v0.17.57）。 */
export declare function onMove(o: {
    pointer: Pointer;
    target: Target;
    lit: boolean;
    canDrag: boolean;
}): "drag" | "lift" | "box" | "scroll";
/** 没动就松手（轻点）：light = 让它亮框（音 / 休止顺带把光标放到它后面）；menu = 开它的小菜单；edit = 开歌词框改字；caret = 点空白（取消选择、放光标）。
 *  记号点一下先亮框，亮着再点 = 小菜单（鼠标悬浮着就算亮着 = 一下就开，和原来一样）；演奏法点一下 = 亮框 + 一句说明（宿主说）；
 *  字点一下 = 歌词框，亮不亮都一样（v0.17.58；v0.17.57 是先亮框、亮着再点才开，user 否了）。 */
export declare function onTap(o: {
    target: Target;
    lit: boolean;
}): "light" | "menu" | "edit" | "caret";
/** 轻点一个音 / 休止 = 选中它这一个（乙，v0.17.54；user 2026-11-13「点一下音再按音键，是接着写，还是改它本身 应该是改吧」，语气是试探的）；
 *  false = 甲（光标到它后面接着写，v0.17.53 及以前）。只有这一个开关：点了之后落到哪由 src/score/song.ts tapTimed 定。「词」不管这个开关（照旧只放光标）。 */
export declare const TAP_SELECTS = true;
/** 手指点亮的东西旁边出不出拖的把手（音 = 上下改音高；记号 = 左右挪）。canDrag = 模式 / 修改锁让不让拖。字不出把手（挪字用两颗小钮）。 */
export declare function wantsGrip(o: {
    pointer: Pointer;
    target: Target;
    canDrag: boolean;
}): boolean;
/** 按住不动（长按到点）：
 *  select = 只选中它（音 / 休止，和点一下一样，三种指针都是；「词」里点一下是写歌词，长按是唯一的选中办法）；keep = 它已经在选区里 = 选区不变（还是听得见它）；
 *  记号 / 演奏法 = 和点一下一样（照 onTap：没亮 = 亮框，亮着 = 记号的小菜单）；字 = 选中它（亮框 + 两颗小钮，亮着 = 不变；v0.17.58：「词」里点一下是写词，长按是选中）；
 *  blankMenu = 空白：光标放过去 + 空白菜单（手指的右键：没有选区、没处挂小钮）。
 *  v0.17.48–54 长按音 = 选中 + 开选区菜单；v0.17.55 起不开（设计稿第二节第 3 条）。v0.17.57 起长按不再拿起来拖（字、记号），「词」里长按音也不再接着拖扩选（设计稿第八节）。 */
export declare function onHold(o: {
    target: Target;
    inSel: boolean;
    lit?: boolean;
}): "select" | "keep" | "light" | "menu" | "edit" | "blankMenu";
/** 点亮的字下面画不画那两颗小钮（左 = 往前一个音 / 合，右 = 往后一个音；v0.17.57）：三种指针一样，只要亮着的是「词」里有字的字。走不动的那颗画灰（score-view 问 lyrics.ts syllableSteps）。 */
export declare function wantsSylButtons(o: {
    target: Target;
    lit: boolean;
}): boolean;
/** 第二个键（右键）：叫出菜单的明着的一下。音 / 休止 = 不在选区里先只选中它，再开选区菜单（selectMenu）；在选区里 = 直接开（menu）；
 *  记号 = 它的小菜单（markMenu，「符」里）；「词」里有字的字 = 同长按：亮框 + 两颗小钮（light，v0.17.58）；别的 = 空白菜单。只有有第二个键的指针会走到这里。 */
export declare function onSecondary(o: {
    target: "note" | "mark" | "lyric" | "blank";
    inSel: boolean;
}): "selectMenu" | "menu" | "markMenu" | "light" | "blankMenu";
/** 选区带子右端外面画不画那颗小钮（点了 = 选区菜单）：有选区、能写谱的模式里、最近一下的指针没有第二个键（手指、笔）。鼠标用右键和选区条的「操作…」。 */
export declare function wantsSelButton(o: {
    pointer: Pointer;
    hasSel: boolean;
    edit: boolean;
}): boolean;
