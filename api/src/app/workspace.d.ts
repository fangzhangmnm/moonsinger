/** 音 = 写音（音 / 休止 / 小节线；pad 音键）；词 = 写歌词；符 = 一切不占时值的记号（力度 / 渐强渐弱 / 演奏法 / 调号拍号速度 / 反复 / 风格 / 句号；pad 符号格）；听 = 锁住谱只听。 */
export type Mode = "notes" | "lyrics" | "symbols" | "listen";
export declare const MODES: readonly Mode[];
/** 模式条上的钮（v0.10.37）：音 / 词 / 听——「符」不再是一个模式，是「音」里的另一面键盘（小键盘顶上「符 / 音」切；user「音和符应该只是是个模式，你看一下切换放哪里，反正不应该用模式来切」）。 */
export declare const MODE_BAR: readonly Mode[];
/** 模式条上哪个钮亮：用符号格时「音」亮。 */
export declare const barMode: (m: Mode) => Mode;
export declare const MODE_LABEL: Record<Mode, string>;
/** 模式钮的图标：窄（32 px），放不下英文单词，中英文都用图标（user 2026-11-04「能图标就不文字」）。 */
export declare const MODE_ICON: Record<Mode, string>;
export declare const MODE_TITLE: Record<Mode, string>;
/** 一个模式下谱面的每种手势归谁（score-view 只看这个）。 */
export interface ModeRules {
    /** 能改谱（false = 听：轻点只认看谱的、不跳播；长按 / 右键 = 从这儿放的小菜单；拖 = 滚动；别的不接）。 */
    edit: boolean;
    /** 笔 / 鼠标按在音上拖 = 改音高 / 时值。 */
    noteDrag: boolean;
    /** 点音 / 歌词位 = 开歌词框；按住字拖 = 挪 / 合。 */
    lyrics: boolean;
    /** 点力度记号 / 渐强渐弱 / 调号拍号速度 / 反复 / 风格 = 它的菜单或框；按住拖 = 挪。 */
    symbols: boolean;
    /** 退格删什么。 */
    backspace: "notes" | "lyrics" | "symbols" | null;
}
export declare const RULES: Record<Mode, ModeRules>;
/** 修改锁锁着时的谱面规则（2026-11-10，Claude Fable 5.2；家族修改锁标准第 ① 道）：能放光标、能选中（复制是逃生口）、能看；
 *  拖音 / 歌词框 / 记号的菜单和挪动 / 退格都不接——手势不许做到一半才在写入口被拒。听模式本来就什么都不接，原样。 */
export declare const lockedRules: (r: ModeRules) => ModeRules;
/** 底座（pad 那个位子）：音键 / 符号格 / 录音室 / 空（收起）。录音室不是键盘，但占同一个位子、和键盘互斥。 */
export type Dock = "keys" | "symbols" | "studio" | "none";
export interface WorkspaceState {
    mode: Mode;
    /** 键盘收起了：只由手动的钮改（pad 的「收起」、底下的「键盘」、点亮着的模式钮、「弹」、进模式）；点谱 / 点空白不改（v0.16.55，user 11-09
     *  「选中音符的时候不应该自动弹键盘，键盘是不是应该只手动toggle比较好？」「鼠标点空白不应该出键盘，不然电脑上很难受」）。 */
    collapsed: boolean;
    /** 打字中（歌词 / 歌名 / 作者栏的框开着，系统键盘要上来）：键盘暂时让开，不动 collapsed；点回谱上 = 回到手动设的样子（user 早先「键盘输入歌词的时候音乐键盘应该hide」）。 */
    aside?: boolean;
    /** 试音中（乐器目录 / 乐器页开着：底座放音键，只弹不写）。 */
    tryout: boolean;
}
/** 底座放什么：试音 > 收起 > 按模式——每个模式自己的键盘（v0.10.2；user「能不能混音台就是听的键盘，不用单独一个键，就是不同功能有不同键盘。歌词的时候是ipad键盘」）：
 *  音 = 音键、符 = 符号格、听 = 混音台、词 = 空（用系统键盘）。 */
export declare function dockOf(s: WorkspaceState): Dock;
/** 这个模式底下有东西可收起 / 弹出吗（底下那粒 tab 露不露；听 = 混音台）。 */
export declare const hasKeys: (m: Mode) => boolean;
/** 底座（键盘 / 混音台）贴右边一栏的判断。默认贴底（user 2026-10-21「ui默认键盘在下面，就是很长很宽的屏幕，键盘，混音台，都在下面」）；
 *  同日下午 user「实在做不到再贴右边。比如只能看到一行谱子」→ 取代上午那版的固定阈值「横屏且 ≤ 720 高放左边」：
 *  贴底之后谱面剩下的高看不到 SIDE_DOCK_LINES 行谱（一行谱 ≈ LINE_SP 个线间距：五线 4 + 上下留白 + 歌词，单声部）= 只剩约一行 → 底座改贴**右边**；
 *  屏幕不够宽放右边一栏（竖屏 / 手机竖着）= 照旧贴底。底座的高按键盘贴底时量（混音台跟键盘同一个判断，切模式底座不跳）；
 *  一格几 px 按贴底时谱面的自动大小算（和用户的缩放无关）——所以只跟设备（屏幕大小 + 键盘排数）走，不跟歌走。
 *  styles.css 那一档的规则全挂在 #stage[data-side="right"] 上（main.ts syncDock 写；test/dock-layout.test.ts 守着 CSS 里不再有按长宽比 / 高度分的底座 @media）。added 2026-10-21 by Claude Fable 5.1 */
export declare const SIDE_DOCK_W = 340, SIDE_DOCK_LINES = 2, LINE_SP = 14, SIDE_DOCK_MIN_SCORE_W = 360;
export declare function sideDock(stageW: number, stageH: number, dockH: number, spPx: number): boolean;
/** 现在底座在右边一栏吗（main.ts syncDock 算好写在 #stage 的 data-side 上；studio.ts / layoutWidth 读这里，不自己算）。 */
export declare const sideDocked: (stage: HTMLElement | null | undefined) => boolean;
