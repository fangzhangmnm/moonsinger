// press-rules.ts —— 谱面上「谁亮框、按下去动了做什么、轻点做什么」（选中规则单行这一版；设计 = ai-docs/20261113-selection-rules-design.md 第一节 user 同意的表、第五节九条）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。纯函数，score-view 的按下 / 移动 / 抬手都问这里。
//   一句话（user 同意的）：亮着框的就是选中的，选中的才能拖，点空白取消。
//   亮框三种来源：鼠标悬浮（临时的，移开就灭）；点一下（留住）；拉框或拖把手（一段 = 选区）。
//   长按只出菜单（按在音上 = 选区菜单；记号上 = 它的小菜单；空白 = 空白菜单），不再选中 / 拿起来。

export type Pointer = "mouse" | "pen" | "touch";
/** 按在什么上：音或休止 / 能拿起来挪的记号（力度、渐强渐弱、风格…）/ 演奏法（跳音、重音…，只能点）/ 别的（空白）。 */
export type Target = "note" | "mark" | "art" | "blank";

/** 这东西现在亮不亮框：点亮的（留住的）、在选区里、鼠标正悬浮在它上面（只有鼠标有悬浮）。 */
export function isLit(o: { pointer: Pointer; sticky: boolean; inSel: boolean; hovered: boolean }): boolean {
  return o.sticky || o.inSel || (o.pointer === "mouse" && o.hovered);
}

/** 按下之后动了（过了抖动的门槛）：
 *  drag = 拖这个音（上下改音高，同原来的拖法）；lift = 拿起这个记号挪；box = 从按下的地方拉框；scroll = 滚动谱面。
 *  手指直接在谱上拖永远是滚动（亮着框的音 / 记号用框边的把手拖）。没亮框的东西 = 和空白一样。canDrag = 这个模式 / 修改锁让不让拖。 */
export function onMove(o: { pointer: Pointer; target: Target; lit: boolean; canDrag: boolean }): "drag" | "lift" | "box" | "scroll" {
  if (o.pointer === "touch") return "scroll";
  if (o.lit && o.canDrag && o.target === "note") return "drag";
  if (o.lit && o.canDrag && o.target === "mark") return "lift";
  return "box";
}

/** 没动就松手（轻点）：light = 让它亮框（音 / 休止顺带把光标放到它后面）；menu = 开它的小菜单；caret = 点空白（取消选择、放光标）。
 *  记号点一下先亮框，亮着再点 = 小菜单（鼠标悬浮着就算亮着 = 一下就开，和原来一样）；演奏法点一下 = 亮框 + 一句说明（宿主说）。 */
export function onTap(o: { target: Target; lit: boolean }): "light" | "menu" | "caret" {
  if (o.target === "blank") return "caret";
  if (o.target === "mark" && o.lit) return "menu";
  return "light";
}

/** 手指点亮的东西旁边出不出拖的把手（音 = 上下改音高；记号 = 左右挪）。canDrag = 模式 / 修改锁让不让拖。 */
export function wantsGrip(o: { pointer: Pointer; target: Target; canDrag: boolean }): boolean {
  return o.pointer === "touch" && o.canDrag && (o.target === "note" || o.target === "mark");
}
