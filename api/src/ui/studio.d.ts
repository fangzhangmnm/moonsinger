import type { FxV2 } from "../format/contract.ts";
import { type Params } from "./plugins.ts";
export interface StudioStrip {
    id: string;
    name: string;
    performer: string;
    gainDb: number;
    pan: number;
    muted: boolean;
    solo: boolean;
    refs: number;
    color?: string;
    /** 上场那位乐手自己的「响度」（dB，候选的 calibrationDb；乐器页「响度」那一行）：渲染时和推子相加。不是 0 = 推子旁边照实写出来（第 14 条：推子写 0、实际轻 6 dB 是看不见的那一处）。 */
    performerDb: number;
}
export interface StudioHost {
    strips(): StudioStrip[];
    setGain(id: string, dB: number): void;
    setPan(id: string, pan: number): void;
    toggleMute(id: string): void;
    toggleSolo(id: string): void;
    play(): void;
    close(): void;
    /** 删一位一张纸都不在的歌手（歌手管理；纸上不删）。 */
    deletePart(id: string): void;
    /** 去这位歌手的乐器页、落在「响度」那一行（推子旁边「乐手 −6 dB」那颗钮）。 */
    openPerformer(id: string): void;
    /** 总轨（2026-10-10 刀 3）：增益 dB + 母线限幅开关；进歌（studio.json master）。 */
    master(): {
        gainDb: number;
        limiter: boolean;
    };
    setMasterGain(dB: number): void;
    toggleLimiter(): void;
    /** 效果全关（A/B；这次打开里有效）：插件和发送不响，推子 / 声像 / 出到 / 限幅留着。 */
    bypass(): boolean;
    setBypass(on: boolean): void;
    /** 一条轨的效果链（MASTER = 总轨；别的 = 歌手的 id / 混音轨的 id）。 */
    chain(track: string): FxV2[];
    /** 这一格送进录音房的样子（自动低切换成这位最低的音算出来的 Hz、延迟跟速度换成毫秒）：曲线 / 读数照这个画，和听到的一致。 */
    resolve(track: string, fx: FxV2): FxV2;
    /** 改一条轨的效果链（进 undo；merge = 连续拖同一个旋钮并成一步的键）。 */
    setChain(track: string, chain: FxV2[], label: string, merge?: string): void;
    /** 压缩「被谁压」能选的轨（除了自己；没有 = 这条轨上的压缩器只听自己）。 */
    keyTracks(track: string): {
        id: string;
        name: string;
    }[];
    buses(): {
        id: string;
        name: string;
        gainDb: number;
        pan: number;
        bypass: boolean;
        muted?: boolean;
    }[];
    /** 混音轨静音（v0.10.35，视图态；不进文件）。 */
    toggleBusMute?(id: string): void;
    /** 混音轨整条旁通（插件全跳过，推子 / 声像 / 发送照旧；v0.10.23）。 */
    setBusBypass(id: string, on: boolean): void;
    addBus(): string;
    removeBus(id: string): void;
    renameBus(id: string, name: string): void;
    /** 混音轨往前 / 往后挪一位（只在混音轨之间）。 */
    moveBus(id: string, dir: -1 | 1): void;
    /** 歌手往前 / 往后挪一位 = 谱上声部的顺序（混音台和五线谱是同一个顺序；v0.10.17，user「混音台里面还是应该支持歌手顺序排序」）。 */
    movePart(id: string, dir: -1 | 1): void;
    setBusGain(id: string, dB: number): void;
    setBusPan(id: string, pan: number): void;
    /** 出到哪（"master" / 路由轨 id）。 */
    outTo(track: string): string;
    setOutTo(track: string, to: string): void;
    /** 推子后发给哪些路由轨。 */
    sends(track: string): {
        to: string;
        gainDb: number;
    }[];
    setSends(track: string, sends: {
        to: string;
        gainDb: number;
    }[], label: string, merge?: string): void;
    /** 这条轨能出到 / 发给的路由轨（不含自己、不含会接成环的）。 */
    targets(track: string): {
        id: string;
        name: string;
    }[];
    /** 换页了（宿主据此开关录音房的频谱：只有 EQ 页看得见才算；user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）。 */
    tabChanged?(tab: MixTab): void;
    /** 贴底时显示几排卡片（v0.16.14，同小键盘的「行」；user 11-07「混音应该和键盘一样，也可以显示能显示几列卡，但是看一下屏幕高度上限」）：
     *  "auto" = 半屏放得下的最多排（原来的样子）；数字 = 就这么多排，但最多到屏幕高度上限（谱至少还露一条）。宿主记在设备上。 */
    rowsPref?(): number | "auto";
    setRowsPref?(v: number | "auto"): void;
}
export declare const MASTER = "__master";
export type MixTab = "basic" | "eq" | "comp" | "send" | "chain";
/** 李萨如图的底：竖线 = 单声道、横线 = 反相；左上 / 右上 = 只有左 / 右声道。 */
/** 卡片背景画李萨如图的几页（基础 / 发送 / 链；v0.16.82，user「发送」「链」两页也要）。统计照旧只在混音台开着、页面看得见、在这几页时算（main.ts syncSpectrum）。 */
export declare const STEREO_TABS: ReadonlySet<string>;
export declare class Studio {
    private host;
    readonly el: HTMLDivElement;
    private tab;
    /** 每一格自己记着用一键还是全量（卡片里切，不是全局切；user「一键和全量应该是卡片内部切，而不是全局切。每个卡片记住自己是一键还是全量」）。
     *  没切过 = 读得回一键就一键、读不回（在全量里调过）就全量；这次打开里有效。 */
    private cardMode;
    /** 「链」页顶上展开着的插件面板：哪条轨的哪一格。 */
    private open;
    private addFor;
    private menuOpen;
    private target;
    private shown;
    private raf;
    private lastTick;
    private lastMeter;
    /** EQ 页卡片背景的频谱（v0.10.11）：每条轨平滑后的 96 个频带（dB）。 */
    private specShown;
    /** 仪表（v0.10.16；user「三个页同意」）：平均电平 = 均方按 0.3 s 平滑；压缩页 = 压了多少（涨得快、每秒回 20 dB）；基础页总轨 / 混音轨 = 李萨如图 + 左右相关。读数一秒刷 4 次（不闪）。 */
    private msTarget;
    private msShown;
    private grTarget;
    private grShown;
    private corrShown;
    private lastText;
    private full;
    private shownRows;
    private capRows;
    /** 插件参数的剪贴板（v0.10.23；user「待会：效果器预设可以拷贝，类似Unity的component，尽量严格一点避免混淆。不读快捷键」）：
     *  拷 = 这一格的种类 + 全部参数（不拷开 / 关、不拷「被谁压」）；粘参数 = 只能粘到同一种插件上（覆盖参数，开关 / 被谁压照旧）；粘成新的一格 = 链尾加一格。这次打开里有效、没有快捷键。 */
    private fxClip;
    private clipBtns;
    /** 压缩页：每条轨最近 COMP_HIST 段（~21 ms 一段）的 [进峰值, 出峰值, 压了多少 dB]。 */
    private compHist;
    /** 差设备（v0.10.17；user「以及注意一下差设备上的性能影响」）：① 只算 / 只画看得见的卡片（混音台里滚出去的不算 FFT、不画李萨如图）；
     *  ② 背景统计按花的时间自己降频：最近平均一次超过 4 ms = 隔一帧画一帧（最多 4 帧画 1 帧），降到 1.5 ms 以下再恢复。 */
    private seen;
    private io;
    private bgCost;
    private bgSkip;
    private bgN;
    private budgeted;
    private watchCards;
    private shownCard;
    constructor(parent: HTMLElement, host: StudioHost);
    get isOpen(): boolean;
    get currentTab(): MixTab;
    show(): void;
    hide(): void;
    /** 录音房报的峰值（0–1；总轨 = 出声口；tracks = 每条轨 / 混音轨推子后）。 */
    meter(peak: number, tracks?: Record<string, number>, ms?: Record<string, number>, gr?: Record<string, number>, cl?: Record<string, [number, number]>): void;
    /** 录音房拷来的最近一段采样（每条轨 / 混音轨 / 总轨）→ EQ 页卡片背景的频谱面。只在 EQ 页、混音台看得见时录音房才发。 */
    spectrum(sr: number, tracks: Record<string, Float32Array>): void;
    private drawSpectrum;
    /** 总轨 / 混音轨推子后的左右采样 → 基础页卡片背景的李萨如图 + 左右相关（v0.10.16；user「声像对应的是莉萨如图吗？」「三个页同意」）。
     *  竖着 = 中 (L+R)/√2、横着 = (R−L)/√2（只有左 = 左上斜线）：竖线 = 单声道、越圆越宽、横着 = 反相。形状看的是左右关系，不看多响：按这一帧最大的那下缩放（太小的不放大）。 */
    stereo(tracks: Record<string, {
        L: Float32Array;
        R: Float32Array;
    }>): void;
    private drawStereo;
    /** 压缩页卡片背景：进来的电平 = 底下一片淡的、出去的 = 一根线、压了多少 = 从顶上往下垂的线、阈值 = 虚线（电平 −48…0 dBFS 映到卡片高度；压了多少 0…−24 dB 映到上半截）。 */
    private drawComp;
    private compSvg;
    /** 这一格 EQ 的响应曲线（±18 dB 映到卡片高度，中线 = 0 dB）。 */
    private curvePath;
    private specSvg;
    private tick;
    private targetOf;
    private onClick;
    private onInput;
    private onChange;
    /** 一条轨显示的格子：歌手轨 / 混音轨没有默认 EQ 那一格 = 补一个虚的（平，不在文件里）。 */
    private slots;
    private slotOf;
    private onBus;
    private trackName;
    private toggleOpen;
    private modeOf;
    /** 一键 | 全量 两个小钮（卡片上摊开的那一块、「链」页顶上的面板都用这一份）。 */
    private modeSeg;
    private addFx;
    /** 改一格（虚的默认 EQ = 第一次改的时候写进链的最前面）。 */
    private patch;
    private deleteFx;
    private simpleNow;
    /** 一键改一个控件：在当前读数上改这一个（读不出 = 在全量里调过 = 从一键的默认起），按公式写回全量参数。 */
    private simpleSet;
    /** 全量面板里关掉「自动低切」/ 把「跟速度」拨到 0 的那一刻（统筹 2026-11-12 夜「v0.17.14 收」补的一件）：把关之前面板上正显示的那个算出来的数写进 hpHz / timeMs，
     *  和关开关同一步撤销——不然这次打开里刚开的、没存过的那一格，关掉后会落回内存里一个没在用的旧数（存过再开的则停在存的时候写的数上：同一个动作两种结果）。一键面板不走这里。 */
    private keepShown;
    private fullSet;
    /** 一格的控件（一键 / 全量）：「链」页顶上的面板和 EQ / 压缩页卡片上摊开的共用。 */
    private controlsHtml;
    /** EQ / 压缩页：这条轨上第一格这种插件，摊在卡片上（没有 = 「＋」）。 */
    private inlineHtml;
    /** 出到 + 发送（歌手轨和路由轨都有；总轨没有）。 */
    /** 这条轨上断了的引用（第 16 条「断了要看得见」，统筹 2026-11-12：在人会去修它的那一页那一格写清；卡片上只一行「有 N 处断了」）：
     *  出到 / 发送去的混音轨不在或接成环（判法和录音房同一个 busLinkStates）、被谁压的那条轨不在。page = 去哪一页修。 */
    private brokenOf;
    /** 卡片名字下面一行「有 N 处断了」（三种算进同一个数）；点了 = 去第一处所在的页。没有 = 不写。 */
    private brokenLine;
    private routeHtml;
    private chipsHtml;
    private renderPanel;
    private renderBar;
    /** 「⋯」里排数那一行的字和能不能按（fitHeight 算完 / 菜单画完都调）。 */
    private syncRowsCtl;
    /** 一张卡片：顶上一条峰值细线 + 名字 + 这一页的内容。 */
    private card;
    /** 贴底（混音台在底下，默认）：高度 = 顶上两条 + 正好 N 排卡片（N = 半屏放得下的最多排，至少一排；卡片不多 = 有几排就几排），不再切在第二排中间。
     *  v0.10.38；user「混音台的高度是怎么决定的，现在怎么不三不四的」→「按整排卡片对齐，最高半屏；iPad mini 上就是一排」「好」。横屏 / 全屏 = 不管（CSS）。 */
    private fitHeight;
    /** 底座贴底 ↔ 贴右边翻了（main.ts syncDock）：重新按整排对齐 / 放开。 */
    relayout(): void;
    render(): void;
}
export type { Params };
