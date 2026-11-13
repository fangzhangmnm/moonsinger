/** 月读的音域 A3–E5（MIDI）：键底部画细条提示，音域外不拦、不变灰。宿主不给提示音域时（hintRange 没接）用它。 */
/** 提示音域：谁在弹（宿主说）+ 她 / 它的音域（MIDI，含两端）。null = 不画提示。 */
export type HintRange = {
    lo: number;
    hi: number;
    who: string;
    title?: string; /** 「现在谁在弹」的身份（宿主给；变了 = 窗口跟过去一次）。 */
    key?: string;
} | null;
/** 一个音键（调式梯子上第 k 级）长什么样：简谱数字（含 ♯♭）、八度点（正 = 上面几个、负 = 下面几个）、绝对名、MIDI（只拿来比「按着的」和音域提示）。 */
/** 键上的一行字（第 19 条：宿主算好、键盘只画）：一个名字（「E♭4」「C♯4」，宿主写好的字），或一个级数（数字 + 高低点 + 前面的临时升降号）。
 *  键盘不知道这是什么谱、换没换调、名字是实际的还是照谱上画的——这些都在宿主那一处（src/app/pad-music.ts keyFaces）。 */
export type KeyFace = {
    name: string;
} | {
    deg: string;
    oct: number;
    acc?: string;
};
/** 一个音键：大字一行、小字一行（谁大谁小、写什么由宿主定）。 */
export interface KeyFaces {
    big: KeyFace;
    small: KeyFace;
}
export interface PadCell extends KeyFaces {
    midi: number; /** 这一格是「1」（宿主说了算）：键顶上一道短横，像电脑键盘 F / J 上的小凸起（v0.16.10，user 11-07「形状上面挑」）。 */
    tonic?: boolean;
}
/** 音乐知识（宿主注入，src/app/pad-music.ts）：方法都读「现在」的调 / 调式，pad 不缓存；sig() 变了 = 网格重建。以后的和弦键盘 = 另一个 PadMusic。 */
export interface PadMusic {
    sig(): string;
    cell(k: number): PadCell;
    /** 第 k 级临时升 / 降 a 之后键上两行写什么（升降滑的时候、电脑键盘挂着 ♯ / ♭ 时；规矩同 cell：宿主一处算）。 */
    altered(k: number, a: number): KeyFaces;
    /** 网格的锚点（第几级）：绝对 = 中央 C 那一行（或它上面第一个调式音）；首调 = 主音。 */
    anchor(layout: "absolute" | "movable"): number;
    /** 「1=」旋钮：每一档的字（大的在上）+ 现在是第几档 + 旋钮上的人话名（提示用）+ 挂在旋钮角上的小标（宿主算好的字和说明；没有 = 不挂。
     *  v0.16.9：手动拨的「1=」和谱上这里的调号不一样时挂「手动」——什么时候挂、挂什么字全归宿主，键盘只画）。 */
    keyChoices(): {
        items: string[];
        index: number;
        name: string;
        tags?: readonly {
            text: string;
            title: string;
        }[];
    };
    /** 「1=」点开的两列滚轮：调 / 调式（拨了一列，键盘重读一遍、把另一列挪到宿主给的现值）。 */
    keyDrum(): {
        keys: {
            items: string[];
            index: number;
        };
        scales: {
            items: string[];
            index: number;
        };
    };
    /** 「⋯」里插记号钮上的现值：调号（人话调名）/ 拍号 / 速度。 */
    marksHere(): {
        key: string;
        beats: number;
        beatType: number;
        bpm: number;
    };
}
/** 谱的输入态里键盘要看的那几样（宿主每次给快照）。 */
export interface PadView {
    unit: number;
    tuplet: number;
    acc: number;
    accMode: "off" | "once" | "lock";
    one: boolean;
    hasSel: boolean;
    /** 只选了一个音（叠亮着）时它现在的几个音高（MIDI 号）：键盘把对应的键描一圈，看得见和弦里已经有哪些（v0.16.5，user 11-07「stack模式已经有的键能高亮吗」）。键盘只比号，不懂和弦。 */
    chord?: readonly number[];
}
/** 升降键选的是哪一种：𝄪 ♯ ♭ 𝄫。 */
export type AccSel = -2 | -1 | 1 | 2;
export interface PadHost {
    view(): PadView;
    music: PadMusic;
    isImpro(): boolean;
    autoBars(): boolean;
    staves(): number;
    canStack(): boolean;
    /** 符号格的状态：off = 台上这位不认（画灰 + 「不认」，照样能写）；on = 现在生效的那个（力度）。不给 = 都正常。 */
    keyState?(id: string): {
        off?: boolean;
        on?: boolean;
    } | undefined;
    /** 键底部细条提示的音域 = 现在谁在弹（2026-10-08 by Claude Opus 5.5；user「试弹的时候键盘上的音域没有跟进」）：宿主说；不知道 / 不接 = null 不画（键盘不认识任何演奏者，ADR-0004）。 */
    hintRange?(): HintRange;
    /** 音键按下（第 k 级，id = 哪根手指）：写（不在「弹」时）+ 响都归宿主；回 false = 这一下不收（单音乐器几乎同时按下的第二根手指）：不亮、不记滑动。 */
    onNoteDown(k: number, id: string): boolean;
    /** 音键 pointerdown 那一刻（事件的 timeStamp）：手感探针量「按下 → 主线程接到」（v0.16.23）；不给 = 不量。键盘只报时刻，不懂量。 */
    onTouch?(ts: number): void;
    onNoteUp(id: string): void;
    onAlter(id: string, alt: -1 | 0 | 1): void;
    /** 写字键 / 符号格 / 「⋯」里的记号：按键 id（PAD_KEY_IDS），翻译成命令 / 插记号 / 开菜单归宿主；mods.ramp = 「渐到」亮着。 */
    onKey(id: string, mods: {
        ramp: boolean;
    }): void;
    onUnit(unit: number): void;
    onTuplet(n: 0 | 3 | 5 | 6 | 7): void;
    /** 「1=」旋钮 / 滚轮选了第 i 档（哪个调 / 哪个调式归 music）。 */
    onPick(knob: "key" | "scale", i: number): void;
    onAutoBars(on: boolean): void;
    onHide(): void;
    onHalf(down: boolean): void;
    onStack(down: boolean): void;
    onAccShift(phase: "down" | "slide" | "up", acc: AccSel): void;
    onImpro(): void;
    /** 音键 ↔ 符号格（第一排「弹」左边，两面同一个位置；v0.10.37：「符」不再是模式条上的一个模式）。 */
    onKbSwitch?(): void;
}
export declare class Pad {
    private el;
    private host;
    private rowShift;
    /** 上一次重画时「谁在弹」（提示音域的 key）。变了 = 窗口跟过去一次（v0.16.23；user 11-08「换歌手、换乐器的时候…默认音域，它没有跟上来…瑞士奶酪看一下…应该是推还是拉」）：
     *  拉 + 对账——不靠每个改动的地方记得推 follow；null = 还没记过（开歌后第一次重画只记下、不挪，照存的窗口）。 */
    private hintKey;
    private cols;
    private rowsSetting;
    private layoutMode;
    private swipeMode;
    /** 符号层开着（像 iOS 键盘翻到 .?123 那一页：表情记号）。只有 caps：点「符」进来就一直留着，再点（键上写「音」）回音键
     *  （2026-10-09 user「符号键盘应该只有caps模式没有shift模式」；10-08 起是 Shift 逻辑——点一下写一个就回音键、连点两下锁住，user 那时说「符号输入也应该有capslock」）。 */
    /** 符号层开没开 = 底座在不在「符」（2026-10-10 起由宿主的模式定，src/app/workspace.ts；pad 上的「符」键摘掉了——user「键盘的模式键是不是能摘下来」）。「弹」开着 = 照样是音键。 */
    private symWanted;
    private get symbols();
    /** 宿主（模式）开 / 关符号层。 */
    setSymbols(on: boolean): void;
    /** 键上大字写什么（v0.16.10，设备上的看谱方式；user 11-07「专业模式是大写是绝对，小写是相对，然后这个助残模式是大写是相对，小写是绝对」「键盘的键位不能动」）：
     *  abs = 大字音名、小字级数；deg = 大字级数、小字音名。只换字的大小，键的位置一个不动。 */
    /** 符号层现在在哪一页（pad 头那一排换成三个标签；user 2026-10-08「pad 头那一排在符号层里换成分页标签 可以」）：收起再开 / 点了记号重画都还在这一页（以前格子一重画就滚回顶上，user「切换符号键盘的时候翻页会乱」）。 */
    private symPage;
    private symBuilt;
    /** 「渐到」先点它、再点一个力度 = 这个力度从上一个力度记号渐变过来（2026-10-08 深夜，user「渐到 做」）。Shift 逻辑（2026-10-09，user「然后软键盘到时候加一个toggle渐进到的标签，这样可以快速键盘输入」）：
     *  点一下 = 下一个力度是渐到；连点两下 = 锁住（之后写的力度都是渐到，「力度」标签上挂着「渐到」）；再点 = 关。 */
    private ramp;
    private mode;
    private gridFor;
    private toolsFor;
    /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮。 */
    private held;
    /** 正在音键上滑的手指（pointerId → 起点 y、当前升降、哪个键）。 */
    private swipes;
    /** 网格上每个键（调式梯子上的第 k 级）长什么样（music.cell 的快照，网格建的时候取）。 */
    private keys;
    /** 升降键选的是哪一种（滑着换；记住，下次按还是它）。 */
    private accSel;
    constructor(el: HTMLElement, host: PadHost);
    private rows;
    /** 音域窗口第 shift 档的范围文字「最低–最高」（user「G4也谜语人，应该是xx-xx」）。 */
    private spanText;
    /** 同上，画在旋钮 / 滚轮里：放得下就一行「F3–G5」；太窄就两行，下面那行是低的那头（user「也许上下两个吧，下面是lower bound」）。 */
    private spanHtml;
    /** 音域旋钮窄到一行写不下（手机 / 桌面的窄 pad）。 */
    private rangeNarrow;
    /** 音域窗口第 shift 档时，左下那个键在调式梯子上是第几级：绝对 = 那一行从 C4（或它上面第一个调式音）起；
     *  首调 = 从主音起（小调 / 羽调式从 6 起）；中央那一行默认在中线下面一行。锚点是音乐知识（music.anchor），几何在这儿。 */
    private baseAt;
    /** 一个按键往外发（写字键 / 符号格 / 「⋯」里的记号）：带上「渐到」亮不亮。 */
    private key;
    /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。
     *  三块各管各的：最上面一排旋钮或候选（模式 / 有没有选中变了才重建）、写字键一排（只建一次）、音键网格（调 / 音域 / 布局变了才重建）——
     *  旋钮上滑着的时候值一直在变、网格跟着重建，旋钮那个元素不动，手指不会丢。 */
    render(): void;
    /** 符号格下面还有几个键没露出来（一半以上在可见区下面的算）：有 = 底边渐隐 + 底下正中一颗「▾ 还有 N 个」；没有 / 不在符号层 = 都收起。 */
    private syncMore;
    /** 这一页符号格的状态签名（谁不认 / 谁亮着）：变了就重建格子。 */
    private symStates;
    private cands;
    /** 最上面一排：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块（user「...和左右应该宽度和高度差不多，其他的也许adaptive一些」）；
     *  「⋯」/ 移调点开后整排换成候选。（试过放 pad 最下面，user「别扭，还是放在上面吧」） */
    private buildHead;
    /** 键盘布局对话框（「⋯ → 布局…」）：行 / 列 = 加减号步进（user 2026-10-08「…优化一下，比如变成加减号」），二选一 = 分段钮。
     *  点了马上生效（对话框靠上、键盘在下面看得见），好 / 点外面 / Esc 收起。 */
    private openLayout;
    /** 符号层（user 2026-10-08「呼吸的话我建议就是特殊符号吧，专门的特殊符号，软键盘里面后面有一个符号模式」「速度符号调号符号也都在里面…row col 超了可以拖动滚」）：
     *  和音键一样大的格子，多了往下滚；点一个 = 做那件事，符号层留着（只有 caps，2026-10-09）。 */
    private buildSymbols;
    private hint;
    /** 音域窗口最低那个键的 MIDI（存进歌的 desk）；默认那一档 = null。 */
    rangeLow(): number | null;
    /** 开歌：按存的最低键挑最近的那一档（null = 默认那一档）。不重画（宿主接着 render）。 */
    setRangeLow(low: number | null): void;
    /** 音域窗口挪到最能盖住 [lo, hi] 的那一档（重叠最多；一样多取中心最近的）。试听换了乐器时宿主调（「跟进」）；人自己拨旋钮照旧。 */
    follow(lo: number, hi: number): void;
    /** 最能盖住 [lo, hi] 的那一档（重叠最多；一样多取中心最近的）。 */
    private shiftFor;
    private buildGrid;
    /** 滑 = 滚键盘：手指按着不抬、滑进另一个音键 = 前一个键抬起、新键按下（钢琴上刮过去那种；写的时候一路写、弹的时候一路响）。
     *  键上有指针捕获，所以用 elementFromPoint 找手指下面的键；监听挂在 window 上。 */
    private glideStart;
    private refresh;
    private on;
    private back;
    /** 选区条上的「移调」：打开和「1=」旋钮同一个候选面板（有选中时那个旋钮本来就是它）。 */
    /** 值旋钮的一串值，大的在上（升号多 / 长的 / 音域高的在上）+ 现在是第几个 + 选第 i 个（立刻生效）。 */
    private knobList;
    /** 按下一个旋钮。「⋯」/ 移调（有选中）= 整排换成候选。值旋钮：
     *  · 按住上下滑 = 就在这一格里滚，像汽车里程表——旋钮变成一扇窗，滚轮藏在后面，窗里只露一格，滚的时候上下格从窗边滑进来；
     *    内容跟着手指走（往下拉 = 上面大的进窗）；**一次最多一格**，滑过半格值就生效；松手立刻停，不吸附、不放动画
     *    （user「in place的时候一次最多一格，这样方便快速swipe几次就是几格」）
     *    （user「我希望手指松了立刻停，不要顿一下，这是快速输入。要不还是做成in place 滑动只在窗格里面预览？」
     *     「in place滚的时候应该是原来的钮变成一个窗，滚轮藏在下面，就像汽车里程表一样」）。
     *  · 只是点一下（没滑）= 松手时展开滚轮（drum.ts）点选 / 原生滚动。 */
    /** 鼠标滚轮拨旋钮（2026-10-10 user「键盘上面那些可以滚的东西的鼠标滚轮操作也做一下」）：往下滚 = 同手指往上推一格；触控板的小 delta 攒够一格才动。 */
    private wheelAcc;
    private knobWheel;
    /** 滚轮在键上（v0.10.23；user「待会：鼠标滚轮可以滚动音符键盘以及其他键盘的row」）：音键 = 和音域旋钮一样，一格挪一排；
     *  符号层 = 一格滚一排格子（格子多了本来就在里面滚，原来按像素滚）。横着划不管。 */
    private gridWheel;
    private knobDown;
    /** 点一下值旋钮：在它上面展开滚轮。旋钮够宽（iPad）= 几列分旋钮的宽；太窄（iPhone）= 每列按放得下的宽来，比旋钮宽
     *  （user「如果是iphone等太窄的时候弹出来的窗可以宽一点」）。长短那根旁边并一根连音的，连音画成真的一组小蝌蚪、跟着长短变。 */
    private openDrumFor;
    /** /2 的样子：once = 浅亮（下一个音减半）、lock = 深亮（锁住）。 */
    showHalf(m: "off" | "once" | "lock"): void;
    /** 某个来源（手指 / 电脑键盘的键）按下了某个音（MIDI）：pad 上同音高的键亮着，直到 showUp（调式里没有这个音 = 不亮）。 */
    showDown(midi: number, id: string): void;
    showUp(id: string): void;
    clearHeld(): void;
}
