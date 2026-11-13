/** root 下面：① 设置一行的控件区（.wbe-row-ctl，界面零件库的一项一行）里有字伸出去的 = 控件区换到说明下面、可以占满一整行（靠右）；
 *  ② 一排等宽格子（.pm-acts）里最长那颗放不下 = 格子的最小宽改成它的宽（格子少几列、整颗换到下一排；中文放得下 = 照旧 118）。 */
export declare function fitWide(root: ParentNode): void;
