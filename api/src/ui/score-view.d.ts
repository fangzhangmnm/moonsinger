import { type EditorState } from "../score/song.ts";
import { type Pitch } from "../score/pitch.ts";
import type { HarmonyRead } from "../theory/index.ts";
import { type Layout, type PartView, type ClefHit } from "../render/engrave.ts";
import { type RawMeasure } from "../render/text/index.ts";
import { LyricEditor } from "./lyric-editor.ts";
import { MarkEditor } from "./mark-editor.ts";
import { TitleEditor } from "./title-editor.ts";
import { type ModeRules } from "../app/workspace.ts";
type At = {
    x: number;
    y: number;
};
/** 「按在什么上了」（谱面分家第二刀：原来 9 个「点了开菜单」的回调 + focus 并成这一个事件；宿主按 kind 开菜单 / 面板 / 让键盘让位）。
 *  点在谱面上哪儿、按的是什么，由谱面判；按了之后做什么，由宿主定。 */
export type ScorePress = 
/** 五线谱像文本框（user「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：staff = 点在谱上（音 / 空白 / 框选）；text = 打开了要系统键盘的框（歌词 / 歌名）。记号框不算（触屏上不弹系统键盘）。 */
{
    kind: "staff" | "text";
}
/** 歌手牌：某张纸第一行某条谱左边的声部名点了（那条已经成了光标所在的 track）。 */
 | {
    kind: "part";
    paper: string;
    part: string;
    box?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}
/** 空白处长按 / 电脑右键（光标已经放到那里了）；row = 这一行里光标所在 track 的音的下标范围（这行没音 = null）。 */
 | {
    kind: "blank";
    at: At;
    row: {
        from: number;
        to: number;
    } | null;
}
/** 长按 / 右键选区里的音（光标所在 track 的）：开选区菜单。 */
 | {
    kind: "selection";
    at: At;
}
/** 力度记号 / 渐强渐弱点了（或长按原地松手）：开小菜单（那条 track 已经是光标所在的了）。 */
 | {
    kind: "mark";
    index: number;
    at: At;
}
/** 点了谱号（行首 / 行中间）或八度线开头的字（v0.9.28）。 */
 | {
    kind: "clef";
    hit: ClefHit;
    at: At;
}
/** 点中谱上的调号 / 拍号（v0.16.8）：开谱头面板（谱号 / 调号 / 拍号 / 速度同一个面板）；速度照旧开记号框，不发这个。 */
 | {
    kind: "header";
    paper: string;
    part: string;
    index: number;
    at: At;
}
/** 点了谱上的和弦级数：宿主开一个小菜单列候选（at = 标的下沿中点）。 */
 | {
    kind: "chordTag";
    read: HarmonyRead;
    at: At;
    where: {
        paper: string;
        part: string;
        index: number;
    } | null;
}
/** 标题下面靠右的作词 / 作曲点了。 */
 | {
    kind: "credits";
}
/** 听模式里长按 / 右键谱面（轻点不跳播，防误触；user 2026-10-10「听模式也不应该误触摸导致跳播。可以还是用长按/右键context menu」）：
 *  点在音 / 休止上 = index（它所在的声部）；空白 = caret（那一行光标会落的位置）；tick = 点的那一刻（这张纸上；补齐的空小节 / 合租叠起来的行都算对）。宿主开小菜单（从这儿放…）。 */
 | {
    kind: "listen";
    at: At;
    target: {
        paper: string;
        part: string;
        index: number | null;
        caret: number;
        tick: number;
    };
};
/** 怎么画、画什么（每次排版 / 打开歌词框都问）：这次打开、这台设备上的看法（不进歌文件的）+ 声部的情况（谁在演、隐藏、单声…）。
 *  这首歌自己的显示设置（谱种 / 和弦标级数 / 按 C 调看 / 每轨和弦选项）不在这里：在歌里，谱面读 songViewOf(get().song)（谱面分家第三刀）。 */
export interface ScoreLook {
    /** 要画的声部（隐藏的不在里面；顺序 = 总谱从上到下）。 */
    parts(): PartView[];
    /** 按拍号自动画小节线开着没有（默认开）。 */
    autoBars?(): boolean;
    /** 范围：segment = 一次只看光标所在的那张纸（曲段），‹ › 翻；all = 全部（隐藏的纸折叠着）。 */
    scope?(): "all" | "segment";
    /** 屏幕放不下纸的时候：true = 按屏宽重新折行；false（默认）= 不折行、整张纸按比例缩小（行和纸上一模一样）。 */
    reflow?(): boolean;
    /** 排法：true = 分页（按纸的真实高度分页、画页框，所见即所得）；false = 连续（同一张纸的几何，只是不断页）。 */
    pages?(): boolean;
    /** 排法「横卷」（v0.9.35）：每张纸一行、一直往右，谱面板横着滚；打字 / 放的时候横着跟；歌手名钉在屏幕左边。 */
    scroll?(): boolean;
    /** 排谱按多宽算（px）：横屏时键盘 / 混音台在右边一栏，收起来谱面变宽——按「它在」的宽度排，切键盘（符号 → 打字…）时谱的大小不跳（v0.10.33）。没给 = 谱面多宽就多宽。 */
    layoutWidth?(): number;
    /** 电脑宽屏：没设过缩放时默认按纸的实际大小（100%）显示，不撑满行宽（v0.16.49）。没给 = 自动大小。 */
    actualSizeByDefault?(): boolean;
    /** 缩放变了（物理倍数；null = 自动）：宿主按设备记住（device-kv），下次开 app 还是这个大小（2026-10-21 user「缩放跨会话记住，按设备存」）。 */
    rememberZoom?(phys: number | null): void;
    /** 歌词框上面的小字：光标所在那条下标 i 的歌词台上这位唱不出来的那句话；唱得出来 = null。 */
    lyricHint?(i: number): string | null;
    /** 歌词框下面的小字：光标所在那条下标 i 那个字所在这一句月读念成什么（v0.9.34）；不是月读 / 引擎还没起来 = null。 */
    lyricReading?(i: number): import("./lyric-editor.ts").LyricReading | null;
}
/** 试听（谱面上按住 / 拖的那个音）。 */
export interface ScoreSound {
    /** 唱下标 i 那个音（光标所在那条 track 的）：hold = 按住一直响（等 release），否则响一下。 */
    audition(i: number, hold?: boolean): void;
    /** 拖音高时换到下标 i 的新音高（新的顶掉旧的；怎么顶由采样器定：滑过去或重新起音）。 */
    glide(i: number): void;
    release(): void;
}
/** 谱面向 app 要的（谱面分家第二刀，设计稿第 3.2 节「收窄之后是五样」）：① 编辑状态的读和写 ② 怎么画 ③ 试听 ④ 按在什么上了 ⑤ 说一句话；外加一条出口：排好了交锚点给上面那一层。
 *  谱面改谱只走核心的词：用 song.ts / commands.ts 的纯函数算好整份编辑状态，交给 set。 */
export interface ScoreViewHost {
    /** ① 编辑状态。gesture = 连续动作的名字（拖 = "drag"）：宿主的 undo 把它们并成一步。 */
    get(): EditorState;
    set(next: EditorState, opts?: {
        gesture?: string;
    }): void;
    /** ② 怎么画、画什么（这次打开 / 这台设备上的看法）。这首歌自己的显示设置不在这里：在歌里，谱面读 songViewOf(get().song)。 */
    look: ScoreLook;
    /** 在哪儿排（谱面分家第三刀从 look 里单拎出来）——排版 worker：地址（dist/layout-worker-<hash>.mjs；构建时 define 进主 bundle；没给 / 浏览器没有 OffscreenCanvas = 排版留在主线程）+ 建不起来 / 中途坏了（之后一直走主线程）时宿主记进黑匣子。2026-10-21 */
    worker?: {
        url(): string | URL | null;
        failed?(why: string): void;
    };
    /** ③ 试听。 */
    sound?: ScoreSound;
    /** ④ 按在什么上了。 */
    press?(e: ScorePress): void;
    /** ⑤ 说一声（拖歌词挪不动、挪力度记号顶掉了原来的）。 */
    notice?(text: string): void;
    /** 排好了、画完了（每次 render 末尾）：宿主拿这份排版的锚点摆谱面上面那一层（编辑器的钮 / 框 / 提示，src/ui/score-overlay.ts；刀 1，2026-11-08）。 */
    onAnchors?(L: Layout): void;
}
export declare class ScoreView {
    private el;
    private host;
    layout: Layout | null;
    private sheet;
    private ink;
    /** 覆盖层的容器（刀 1）：和 ink 一样挪到版心、坐标 = 排版的 px；不接点（里面的 .ov-i 才接，谱面的手势跳过它们）。 */
    readonly overlayRoot: HTMLDivElement;
    private ctx;
    /** wait = 鼠标：长按到点之前不拖（v0.9.39；user 2026-10-10「这样吧，还是普通拖动，音也是，但是鼠标的时候也需要长按」——拖动太容易误触）。 */
    private drag;
    private finger;
    /** 框选 = 鼠标短按就拖（v0.9.39；user「不，框选是普通短按拖动，这样才能有差别」「不然我框选会误触拖动」）：从空白、音、记号、字上短按拖都是框选；长按之后拖才是拿起来挪。
     *  last = 上一次框出来的结果（没变就不重设 = 不重排；user「鼠标框选有点卡」）；raf = 合并到每帧一次。 */
    private box;
    private boxEl;
    private tail;
    /** 按下去还没松（手指 / 笔 / 鼠标都走它）：判轻点 / 长按 / 拖。hit = 按在哪个音上（null = 空白）。 */
    private press;
    /** 拿起来拖着的字 / 记号：st0 = 拿起来之前（每一下都从它重算，谱上实时是挪过去的样子）；targets = 拿起来时这条 track 上能落的音（下标 + 位置，拖的时候不跟着重排跳）；
     *  src / cur = 原来 / 现在落在第几个；moved = 指针动过（没动 = 原地松手）。 */
    /** 正拖着的东西的 token id（画成强调色；拿起来那一刻就亮）。 */
    private hot;
    /** 点开的记号管的那一段音（染强调色；小菜单收起就清）。 */
    private span;
    setSpan(sp: {
        from: number;
        to: number;
    } | null): void;
    /** 开这条 track 上第 index 个 token（力度 / 渐强渐弱 / 风格记号）的小菜单（刚插进去的风格记号用）；谱上没画出来 = false。 */
    menuFor(index: number): boolean;
    private lift;
    private selDrag;
    private handles;
    private handleDrag;
    private touches;
    /** 捏合（2026-10-10 v0.9.27 重做；user「ipad可以放的很大，就和pdf浏览器一样，懂了吗。可以横着滚」+ 查案「iPad 捏合缩放卡」）：
     *  手势中只改 transform（合成器缩放，不重排、不读布局），一帧最多一次；松手才落成 CSS zoom（重排一次）并滚到让那个点还在手指下面。
     *  d0 = 起手两指距离；z0 = 起手的 zoom；sx / sy = 两指中点下面那个纸面点（sheet 坐标、原大）；left / top = 起手时 sheet 在屏幕上的位置；k = 现在相对 z0 的倍数；mx / my = 现在的两指中点。 */
    private pinch;
    private zoom;
    private zoomPhys;
    private spAuto;
    private physPx;
    private zoomBtn;
    readonly lyrics: LyricEditor;
    readonly marks: MarkEditor;
    readonly title: TitleEditor;
    /** ④ 按在什么上了 → 宿主。 */
    private tell;
    constructor(el: HTMLElement, host: ScoreViewHost);
    /** 五线谱间距（px）和纸面宽（px）：触屏 11、鼠标 10 一格（× 这张纸的谱大小 / 默认档——谱小了一格就小、纸的宽度不变）；纸的版心放得下 = 严格按纸（纸居中、四周是桌面），
     *  放不下（手机）：默认不折行 = 整张纸按比例缩小；选了「折行」= 按屏宽重新折行，窄屏（< 420）一格跟着宽度小一点、最小 8.5（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）。
     *  纸 = 这首歌的纸张（src/score/paper.ts，默认 A5；user「五线谱宽度：要不还是按照固定物理页框？」「看一下webxiaoheiwu屏幕太宽的时候行宽会有max」）。 */
    private frame;
    /** 谱面多宽时自动大小一格几 px（宿主判底座贴不贴边用：按贴底时的全宽算，和用户的缩放无关；2026-10-21）。 */
    spaceAt(avail: number): number;
    private frameAt;
    /** 量文字宽的原始尺子（这串字、歌词那款字、px 那么大 = 多宽 px）：屏幕和 PDF 共用这一把——PDF 用它排版，和分页预览一模一样（2026-10-09 user「pdf画出来和开分页预览的不一样…做到除了控件和提示外的wysiwyg」）。字体串和换算在文字模块（src/render/text/measure.ts；worker 同一串）。 */
    get rawMeasure(): RawMeasure;
    private raw;
    /** 排版这一半（engrave + 缓存），画是另一半（render）。谁要最新的排版就叫它——歌词框 / 记号框 / head() / E2E 钩子——不用等到下一帧画；
     *  render() 画之前也先叫它。同一份 EditorState 问第二次 = 直接回上次的（不读 DOM、不算键）；谱 / 几何都没变 = 回缓存（W-17 第 1 刀）。
     *  2026-10-17 Fable：画合并到下一帧之后（main.ts queuePaint），状态改了到画之间这一小段，排版照样拿得到最新的。 */
    layoutNow(force?: boolean): Layout;
    /** 排版的几何与选项（layoutNow 的同步路和 renderAsync 的 worker 路共用一份）：frame（谱大小 / 纸宽 / 分页）+ 缓存键 + engrave 的选项（不含量字宽的闭包，worker 自己配）。 */
    private geo;
    private worker;
    private seq;
    private pending;
    private queued;
    private workerParts;
    private needPaint;
    private workerOrNull;
    private dropWorker;
    /** 画（给下一帧用的异步入口）：排版现成就画，不现成交给 worker、回来再画。 */
    renderAsync(): void;
    private post;
    private onReply;
    private layoutSt;
    private frameNow;
    private paintedSt;
    /** 这份状态已经画过了（main.ts 的下一帧画用：中途有人显式 render 过就不再画一遍）。 */
    paintedFor(st: EditorState): boolean;
    render(): void;
    private ghostEl;
    private ghostP;
    /** 打开原来的速度框（记号框）：先把光标换到那条（纸 / 歌手），再按下标开；fresh = 刚插进去的（不改就收起 = 撤掉）。谱头面板「速度」那一行用（v0.16.12）。 */
    openMarkEditor(paperId: string, partId: string, index: number, fresh?: boolean): void;
    showGhost(ps: Pitch[]): void;
    private drawGhost;
    private playheadEl;
    private barEl;
    private barKey;
    /** 你刚在谱上动过（写 / 改 / 挪光标）：几秒内播放不拽视图（v0.10.12；user「检测到用户在折腾谱子的时候需要hold住播放页面跟随？」→ AI 建议「你正在改谱时先不跟」→「12都同意」）。 */
    private userEditAt;
    noteUserEdit(): void;
    private hlEls;
    private playP;
    private startP;
    private startEl;
    /** 这一下点的是哪一层（模式的规则表，src/app/workspace.ts；2026-10-10 user「模式！音，歌词，强度和articulation！」→ 音 / 词 / 符 + 听）。
     *  听（edit = false）：谱面不写——轻点 = 告诉宿主「从这儿放」，拖 = 滚动，别的手势都不接。 */
    rules: ModeRules;
    /** 自动翻（2026-10-10 user「...里面加自动滚动，你思考下怎么对齐不会觉得别扭」「自动滚动默认开」）：放着的时候谱跟着正在放的那一行滚。
     *  不逐帧跟：只在那一行换行、并且出了舒服区（屏幕上沿往下 5% 到 80%）时，平滑滚到让它落在上方两成处（下面能看见接下来几行）；你刚自己滚过（滚轮 / 手指）4 秒内不跟，不抢。 */
    autoFollow: boolean;
    private playSysKey;
    private userScrollAt;
    private lockTap;
    private roGesture;
    private roAt;
    private inSharedRow;
    private holdPid;
    /** 播放头（实时试听「谱上跟着亮」，2026-10-09 Claude Fable 5.1）：p = 哪张纸的第几个 tick（纸自己的，反复已折回去；src/engine/timeline.ts locate）；null = 收起。
     *  只挪一条线，不重排、不动滚动。位置 = 这张纸第一行那条 track 上「起点 ≥ tick 的第一个音」的光标位 → slot 的 x；行高 = 那一行的谱表范围。 */
    /** 播放线（2026-10-10 Opus 5.5；user「首先是线，和光标用不一样的颜色，然后对齐是和所有track里面最后面的一个音符对齐，取max，然后唱到的音符试着高亮一下。看效果好不好」）：
     *  x = 这一行所有声部里、此刻已经开始的音中最晚开始的那个（取 max）；线从这一行最上面那条谱画到最下面那条；每个声部正在响的音高亮。
     *  颜色走 CSS（.playhead / .play-hl，和光标的 --accent 分开）。暂停着也留着（续播从这儿）。 */
    setPlayhead(p: {
        paperId: string;
        tick: number;
    } | null, ahead?: {
        paperId: string;
        tick: number;
    } | null): void;
    /** 自动翻：正在放的那一行（纸面坐标 top..bottom）出了舒服区 = 平滑滚到它在屏幕上方两成处。 */
    private turnedKey;
    /** 翻到接下来那一行：已经整个看得见 = 不动；和现在这一行一起放得下（它在下面）= 这一行贴顶、两行都在；放不下 = 它贴顶（这一行翻走了，像翻谱）——
     *  但放到这一行最后一个音之前不这么翻（onLast = false = 先等，返回 false，下一帧再来）。远的（编排跳回去）= 先瞬移再平滑。返回 true = 办完了（翻了 / 不用翻）。 */
    private turnTo;
    /** 跳到正在放的地方（长按 / 右键 |▶ 的菜单；v0.10.21，user「播放的...可以支持跳转到当前播放的地方」）：不管刚才是不是自己滚过，滚过去、接着跟。 */
    revealPlayhead(): boolean;
    private followPlay;
    /** 小节底色闪一下（长跳转到了）。 */
    private flashBar;
    /** 横卷的自动翻（v0.9.35）：正在放的音（纸面 x）出了舒服区（屏幕左边 5% 到 80%）= 平滑滚到它在左边两成处；你刚自己滚过 4 秒内不跟。 */
    private followPlayX;
    /** 横卷：歌手名钉在屏幕左边（v0.9.35；10-10 问答「横卷没有行首，左边的名字会滚走，横卷里名字应该钉在屏幕左边、贴着每条谱的左上」）。
     *  纸上原来的名字照画（滚到最左边时看得见）；滚开了才露出钉住的这一列。只看、不接点（点名字 = 滚回左边点纸上那个）。 */
    private hscroll;
    private pinEl;
    private drawPins;
    private placePins;
    /** 这张纸 tick 那一刻每个声部（排出来的每一行）正在放的 token：下标、开始的 tick、画出来的位置（音 / 休止）。 */
    /** 播放的 tick 在哪个小节（Layout.measures；v0.10.28）。 */
    private barAt;
    private soundingAt;
    /** 开播的起点（小节头；2026-10-10 user「编辑的时候光标动但是播放头不动」「大部分时候可以小节级别的开始精度」）：一面小旗，颜色和光标 / 播放线都不一样。null = 没设（从头）。 */
    setStartMark(p: {
        paperId: string;
        tick: number;
    } | null): void;
    private drawStartMark;
    /** 光标 / 选区 / 编辑框在哪（变了才跟）。 */
    private baseKey;
    private followKey;
    private caretSeen;
    /** 上一次画的时候每一行（纸 | 声部 | 第几行 | 第几张谱表）的第五线 y（px）：钉住正在写的那一行用（防抖，user 11-09「屏幕上把你正在写的那一行钉住不动 同意」）。 */
    private pinPrev;
    /** 换歌这类重画不钉（main.ts loadDoc 叫）：下一次画只记、不补。 */
    forgetPin(): void;
    /** 光标所在的那一行在新的排版里挪了多少，滚动就跟着补多少，它在屏幕上不动——上面的行长高 / 这一行自己上面长高，眼前都不跳。
     *  只在能写的模式、光标那一行本来就看得见、挪动不到半屏时补；没有光标（有选区）/ 新排版里找不到同一行 = 不补。纯视图：不碰排版。 */
    private pinRow;
    private holdView;
    private heldBase;
    /** 光标画在上一行末尾（点在上一行行末放的）：记着是哪个光标位置（纸|声部|下标），光标一挪就失效；不进文件、不进 undo（2026-10-10 user「然后我希望光标能同时支持一行的末尾和下一行的开头两个位置取决于点在哪里」）。 */
    private caretEnd;
    /** 上一次画的 SVG（开标签 + 每行谱一组），逐组比、只换变了的（W-17）。 */
    private svgParts;
    /** 排版缓存（W-17 第 1 刀，2026-10-15）：谱（引用）+ 排版用到的选项没变 = 不重排（engrave 是整首算的那 20 多毫秒）；
     *  光标 / 选区带在 ink 层画，写字头的蓝 / 选中 / 强调色按 data-tok 在 SVG 元素上开关 class（decorate）。 */
    private geoSong;
    private geoKey;
    private tokEls;
    private decorated;
    private caretEl;
    private selEls;
    /** 能点、能选的东西 = 音 + 休止（user 2026-10-08「为什么休止符没法选择，休止符就这么没有人权吗，我感觉编辑的心智模型里面休止符也应该和普通音符没区别」）。
     *  休止没有音高：d = NaN（笔 / 鼠标按住拖只改时值、不出声）。 */
    private get hits();
    /** 这个命中记录是不是光标所在那条 track 的。 */
    private onTrack;
    /** 光标画在哪（W-17 第 1 刀：不进排版，从落点 slots 里查）：这条 track 上这个 caret 的落点；补齐的小节里 = lead 那个；点在行末放的（caretEnd）= end 那个。
     *  大谱表：两张谱表各一个落点，光标跟着前一个音在哪张。有选区 / 还没排好 = null。shift = 那里的谱号 / 八度线位移（鬼音符用）。 */
    head(): {
        system: number;
        x: number;
        shift: number;
    } | null;
    /** 写字头的蓝（cur）/ 选中（sel）/ 拖着的（hot）/ 点开的记号管的那几个音（in-span）：按 data-tok 在 SVG 元素上开关 class，不重排、不换 SVG。
     *  哪些元素吃哪个 class 照原来排版时的规矩：cur 不给歌词；hot 只给歌词 / 力度 / 风格 / 反复 / 渐强渐弱的字和线；in-span 只给符头。 */
    private decorate;
    /** 光标：ink 层里一个 svg 的一根线（同原来排版画的：落点 x + 0.1sp，从第 42 级到第 26 级）；听模式 CSS 藏起来。 */
    private drawCaret;
    /** 选区 = 淡蓝带子（user 2026-10-08「选区画成一条淡蓝的带子盖住那几个音」）：每行一条，从选中的第一个东西到最后一个（音 / 休止 / 记号），
     *  高 = 第五线上面两格到歌词行下面一点（同原来排版画的 selbox）；ink 层的 div，乘底（mix-blend-mode）压在谱上不盖墨。 */
    private drawSel;
    /** 选区两端的棒棒糖把手：第一个 / 最后一个选中的音的下面（歌词行再往下一点）。 */
    private placeHandles;
    /** 光标那一行滚进视野（软键盘弹出 / 收起时宿主调）。 */
    followNow(): void;
    /** 光标（选中 = 它的第一个音；开着歌词 / 记号框 = 那一行）在哪一行。 */
    private caretSystem;
    /** 光标那一行有没有一部分在视野里（没有光标 / 还没排好 = 算在）。 */
    private caretVisible;
    /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
    private follow;
    /** 指针 → 纸面坐标（纸可能居中在桌面上：按纸自己的位置算；放大了除回去）。 */
    /** 纸面上的框 → 屏幕坐标（local 的反过来）。 */
    private clientBox;
    private local;
    /** 原大时纸（含边距）有多宽（px，render 里记）：捏合最多放到它和屏幕一样宽。 */
    private paperW;
    /** 最多放大几倍（同 PDF 阅读器：可以比屏幕宽、横着滚；user 2026-10-10「ipad可以放的很大，就和pdf浏览器一样」——取代 v0.9.19 的「最多到纸和屏幕一样宽」）。 */
    private maxZoom;
    private minZoom;
    /** 物理倍数 ↔ 乘在 sheet 上的倍数（自动大小 = 1）。 */
    private mulOf;
    private physOf;
    private clampMul;
    /** 没设过缩放时的大小（乘在 sheet 上的倍数）：电脑宽屏 = 纸的实际大小（100%），放不下原大就按屏宽（v0.16.49，user 11-09「电脑屏幕宽屏上应该默认是100%而不是行宽占满」）；别的 = 自动（1）。 */
    private defMul;
    zoomLevel(): number;
    /** 现在的物理倍数（1 = 纸的实际尺寸）、自动大小折成几倍物理、记住的那个（null = 自动）。 */
    zoomInfo(): {
        phys: number;
        auto: number;
        saved: number | null;
    };
    /** 开机：按这台设备记住的物理倍数（null = 自动）摆好，下一次排版落实（宿主从 device-kv 读；2026-10-21 user「缩放跨会话记住，按设备存」）。 */
    restoreZoom(phys: number | null): void;
    zoomIn(): void;
    zoomOut(): void;
    zoomReset(): void;
    private zoomStep;
    /** frame 变了（窗口 / 底座 / 纸 / 密度）：记住的物理倍数不变，乘在 sheet 上的倍数跟着重算（自动 = 1）；读数 / 靠左横滚跟着。 */
    private syncZoom;
    private paintZoomUi;
    /** 谱面板中心下面那个纸面点（键盘缩放 / 回自动用的锚；同 PDF 阅读器：以视口中心缩放，不跳到左上角）。 */
    private centerAnchor;
    private lastTap;
    /** 听模式的手指轻点：是不是双击（上一下没点中控件、隔得近）= 放大 2 倍 / 回自动，以这一点为锚。 */
    private doubleTapZoom;
    private pinchStart;
    private pinchMove;
    private pinchEnd;
    /** 放大 / 缩小到倍数 z（1 = 自动大小；物理倍数 = physOf(z)，记进 zoomPhys、报给宿主按设备存）；anchor = 屏幕上这个点下面的纸面点保持不动（null = 以谱面板中心为锚，同 PDF 阅读器；2026-10-21 之前 null = 跳回左上角）。 */
    private setZoom;
    /** y 落在哪条谱行（行与行之间的空隙归上面那条；都不是 = 最近的一条）。 */
    private rowAt;
    /** 光标到这条谱行的 track（点哪条谱写哪条）。 */
    private focusRow;
    private down;
    /** 按下：开长按计时（0.42 s 不动 = 长按）。 */
    private armPress;
    /** 名字下面的大钮（点一下 = 隐藏 / 静音；长按 / 右键 = 只看 / 独奏）。 */
    private cancelPress;
    /** 长按到点：按在音上 = 选中它、进选区态（不抬手接着拖 = 扩选）；空白处 = 光标放到那里 + 小菜单（粘贴 / 插记号 / 全选…；user 2026-10-08「空白长按可以黏贴或者类似的右键上下文菜单」）。 */
    private longPress;
    /** 长按选中按着的那个音（不抬手接着拖 = 扩选）。 */
    private selectHeld;
    /** 点在叠起来的那一行上：光标去这一家在这一行的那位（主人 / 在场打头的那位），落在点的那个时刻（点在音上 = 它后面，同平常点音）→ 整家拆开。 */
    private expandFamilyAt;
    /** 合租展开着的一家左边那条括号（v0.10.29；刀 1 起括号在覆盖层，点了调这里）：光标挪到这一家后面紧挨着的那位（不在任何一家里的；后面没有 = 前面最近的那位）→ 这一家叠回去。
     *  user「把这一家的几行括在一起…点这条括号等于「光标挪到这一家后面紧挨着的那位」…可以」。视图不跟过去（同点名字）。 */
    leaveFamily(paper: string, host: string): void;
    /** 歌手牌（每张纸第一行各条谱左边的声部名）：开轨的小卡——光标换到那条（setFocus 放在那条的最后），但视图不跟过去
     *  （user 2026-10-08「按vocal字弹track窗的时候页面滚动会乱」）。左键 / 右键（2026-10-10 user「右键歌手名应该也是弹歌手选项，和左键一样」）/ 听模式都走这里。 */
    private openPartAt;
    /** 这条声部台上那位不唱字？是 = 说一次为什么（同一位歌手只说一次，换了再说）。 */
    private noLyricsSaid;
    private noLyricsHere;
    /** 「词」里点了一个音：开它的歌词框（休止没有歌词 = false，照常放光标）。 */
    private openLyricOn;
    /** 听模式的长按 / 右键：点在音 / 休止上 = 它；空白 = 那一行光标会落的位置。不改光标、不改谱，只告诉宿主开小菜单。 */
    private listenMenu;
    /** 这条 track（真的 / 合租虚拟的那几条）第 i 个之前一共多少 tick。 */
    private tickIn;
    /** 合租叠起来的那一行（v0.10.28）：点击区的下标指虚拟 track（主人那条 / `主人~lo` / `…~v2`） → 换成主人自己 track 里同一时刻的那个下标（按 tick 对）。不是叠起来的 = 原样。 */
    private realIndex;
    /** 空白处长按 / 右键：收起编辑框、光标放到那里（同轻点空白），再告诉宿主开小菜单。row = 这一行里光标所在 track 的音的下标范围。 */
    private blankPress;
    /** 按在能拿起来拖的东西上：力度记号 / 渐强渐弱（在它的框里）先；歌词的字（不在音上时，同轻点的判法）。记号框开着 = 这一下是收框，不拿。 */
    private grabAt;
    /** 歌词那一行上点中的字：按每一行自己的歌词基线找（没写歌词的行比歌词基线矮，光看 rowAt 会落到下一行——2026-10-08 E2E 抓到）。
     *  命中带往下放宽一点：手指点在字下面也算；离最近的字 4 个间距以内。 */
    private lyricAt;
    /** 点中的力度记号 / 渐强渐弱（手指放宽几个像素）。 */
    private dynHitAt;
    /** 力度记号 / 渐强渐弱的小菜单：先把光标换到那条 track，再告诉宿主（开在记号下面）。 */
    private markMenu;
    /** 拿起来（长按到点 / 笔鼠标按住动了）：收起编辑框、停掉滚动，记下这条 track 上能落的音。编辑框收起时可能改了谱（贴字 / 插句号）= 按原位置重新找一次。 */
    private startLift;
    /** 拖着走：指针（减去拿起来时和那个音的错位）最近的那个音 = 落点；换了落点就从拿起来之前的谱重算一次（谱上实时是挪过去的样子）。 */
    private dragLift;
    /** 松手：没动 = 歌词 → 选中这个音（同长按音；再拖把手扩选），记号 → 小菜单；动了 = 已经挪好了，挪不动 / 顶掉了别的说一声。 */
    private endLift;
    /** 点中了哪个音（光标所在 track 或别的 track 都算；别的 track 的音 = 先把焦点换过去）。 */
    private noteAt;
    /** 离指针最近的、光标所在 track 上的音（扩选用）：先按行（指针所在行；不是这条 track 的行就取最近的一行），再按 x。 */
    private noteNear;
    /** 谱头那一块里离点最近的谱号 / 调号 / 拍号（只看这一行的：行首谱号 kind start + 记号 key / time）。块 = 这些框横向的并、上下各多 1.2 线距；点不在块里 = null。 */
    private headerHitAt;
    /** 点中了谱号 / 记号（调号 / 拍号 / 速度）：谱号 → onClef；记号 → 谱头面板（换到那条 track 再开）。 */
    private openHeaderHit;
    /** 笔 / 鼠标在空白处按下没拖就松手：落在谱头放宽的那一圈里 = 点谱头（按下那一刻不抢，好让从这儿拖出框选）。 */
    private boxTap;
    private inBox;
    /** 一次轻点：记号 → 记号框；歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）。点中了东西返回 true；落在空白处返回 false（调用方决定放光标还是框选）。 */
    /** view = 听模式：只认看谱的那些（纸的设置 / 翻纸 / 本段 / 歌手牌），写谱的（歌名 / 作者栏 / 编排 / 曲段名 / 纸的菜单 / 新纸）不接。 */
    /** loose = 谱头放宽的那一圈也算（v0.16.7）。笔 / 鼠标按下那一刻传 false：从那一圈按下去拖 = 照样框选，没拖就松手才算点谱头（boxTap，v0.16.8）。 */
    private tap;
    /** 轻点在音上（手指 / 笔 / 鼠标）：光标放到它后面（Shift = 把选中扩到它）。 */
    private tapNote;
    /** 这一行（谱行）上有没有「行末」落点给这个光标位置（= 它本来画在下一行开头）。 */
    private endSlotOn;
    /** 放光标 + 记住画在行末还是行首。状态没变（光标本来就在这儿）但画法变了 = 自己重画。 */
    private putCaret;
    /** 空白处放光标（轻点 / 长按 / 右键 / 框选没框住）：那条谱最近的落点，行末的落点 = 画在行末。 */
    private placeCaretAt;
    private slotAt;
    /** 空白处 → 那条谱最近的光标落点（= 写；点哪条谱光标就到哪条）。 */
    private caretAt;
    /** 框选：框住的音（音头中心在框里；只算框起点那条谱的）从第一个到最后一个选成一段；一个都没框住 = 回到起点的光标。 */
    private boxSelect;
    private move;
    private up;
}
export {};
