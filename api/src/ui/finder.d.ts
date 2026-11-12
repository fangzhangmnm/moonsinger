import { type FinderMemo } from "../score/desk.ts";
import { type Concept, type Provider } from "../gm/catalog.ts";
export type FinderPick = {
    kind: "gs";
    concept: Concept;
    provider: Provider;
} | {
    kind: "voice";
    concept: Concept;
    light?: true;
} | OwnPick;
/** 自己的 .sf2 文件里的一件（v0.16.37，施工单 §4.3）：字节留在宿主，目录只拿预设清单。没有乐器概念（目录不认识这件），谱上的名字不跟着换。 */
export interface OwnPick {
    kind: "sf2";
    bank: number;
    program: number;
    name: string;
}
/** 打开的 .sf2 文件：文件名 + 里面的预设（bank 128 = 鼓组）。 */
export interface OwnFile {
    name: string;
    presets: {
        bank: number;
        program: number;
        name: string;
    }[];
}
/** 点开的那件乐器目录里没有谁能演 = 试听键盘静音（不是还弹着上一件的声音；v0.15.7，家族周账 F-210，user 11-07「如果选中的那个类别里面没有合适的音源的时候，我在即兴的时候应该是静音，而不是显示弹在上一个音源」）。 */
export type FinderNobody = {
    kind: "none";
    concept: Concept;
};
export interface FinderHost {
    roleLabel(): string;
    audition(p: FinderPick | FinderNobody | null): Promise<void>;
    playHead(p: FinderPick): Promise<void>;
    cast(p: FinderPick): Promise<void>;
    /** 先不换，加成新声部试试（v0.16.63，user 11-09 定的：「台下」不做，只补这颗小钮）：加一个声部放它、开「弹」。没有 = 不出这颗钮（「＋ 新声部」那一路本来就是新的）。 */
    tryNew?(p: FinderPick): Promise<void>;
    canTryNew?(): boolean;
    close(): void;
    togglePad(): void;
    /** 关目录时：这一份记忆（翻到哪）变了。即兴 = 宿主存到设备上；歌里的 = 宿主存歌时顺手带（v0.16.6）。 */
    memoChanged?(ctx: FinderCtx, m: FinderMemo): void;
    /** 这首歌的乐器预设（目录顶上第二排；v0.16.38 = 施工单 §5 R4：本声部台上那位 + 调过的，别的声部调过的）。on = 正在台上；here = 本声部的；
     *  from = 在哪个声部上（别的声部的格子角上写）；removable = 能删；icon = 乐器图标的编号（目录 sprite 里的，没有 = 首字）。 */
    used?(): PresetTile[];
    /** 点了本声部的一位 = 换上（角色名 / 乐器跟着换回，同 v0.16.15）。 */
    useCandidate?(id: string): void;
    /** 拷一份到本声部、换上（别的声部的 = R5；本声部的「复制一份」= R6）。 */
    copyPreset?(role: string, id: string): void;
    /** 删本声部的一位（R7：台上的、内置的不能删；它嵌在歌里的声音一起丢；能撤销）。 */
    removeCandidate?(id: string): void;
    /** 顶条「打开 .sf2…」：宿主开选文件框；读好了调 setOwnFile 把清单交回来。 */
    ownSf2?(): void;
    /** 常用一行（设备设置；没有 = DEFAULT_PINS）/ 改了存回去。 */
    pins?(): PinTile[];
    setPins?(p: PinTile[]): void;
}
/** 常用一行的一格（v0.16.36；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §4.1 / §9）：c = 乐器概念的编号，job = 它管哪一层（只有默认那几格写）。
 *  记在设备上、跟人走，不跟歌走（user 11-09「置顶…跟着用户设置走，就不跟着歌走」）；每一格能换成任何乐器、能拿掉，不按种类拦（「用哪个你别护栏」）。 */
export interface PinTile {
    c: string;
    job?: PinJob;
}
/** 「这首歌的乐器预设」一格。 */
export interface PresetTile {
    role: string;
    id: string;
    name: string;
    on: boolean;
    here: boolean;
    from: string;
    removable: boolean;
    icon?: string;
}
export type PinJob = "melody" | "harmony" | "melody2" | "accomp" | "pad" | "rhythm" | "bass";
/** 默认七格 = 摸每一层最顺手的那件（user 11-09「那几个钦定的乐器，实际上就是摸某个东西最有用的」「合成器就是弦乐…还是用最经典的」）。
 *  节奏那一格：目录里还没有「整套鼓组」这一条（鼓的设计排在后面），先放小鼓。 */
export declare const DEFAULT_PINS: readonly PinTile[];
/** 记忆归谁：歌里打开的 = 这首歌（文件里）；歌库「即兴」打开的 = 这台设备（app）。user 11-07「即兴的滚动归 App 记，然后文件内的滚动归文件记」。 */
export type FinderCtx = "song" | "impro";
export declare class Finder {
    readonly el: HTMLDivElement;
    private cat;
    private mode;
    private scrollY;
    private q;
    private openG;
    private opened;
    private selected;
    private loading;
    private playOnly;
    private ctx;
    private memos;
    private host;
    private swallow;
    private replacing;
    private own;
    /** 隐藏找不到的乐器（目录里没有谁能演它、平替也没有 = 不列）；记在这台设备上，默认开（v0.16.56，user 11-09「选乐器的时候加一个隐藏找不到（包括平替）的乐器的选项。然后默认开」「免得一开始几个都是not avaliable now」）。 */
    private hideNone;
    constructor(parent: HTMLElement, host: FinderHost);
    get isOpen(): boolean;
    /** 把现在的字段收进这一份记忆 / 从记忆放回字段。 */
    private stash;
    private unstash;
    /** 宿主存歌 / 存设备时取（开着的话先把现在翻到哪收进来）。 */
    memo(ctx: FinderCtx): FinderMemo;
    /** 换歌 / 开机时放回（null = 新的：按年代、全收着、在顶上）。 */
    restore(ctx: FinderCtx, m: FinderMemo | null): void;
    /** 顶条「键盘」钮亮不亮（宿主在键盘开 / 关时告诉它）。 */
    setPadShown(on: boolean): void;
    show(o?: {
        playOnly?: boolean;
    }): Promise<void>;
    /** 换上一件乐器之后（目录不关，v0.16.35）：顶条的名字和「这首歌里用过的」那一排跟着变。 */
    refresh(): void;
    hide(): void;
    /** 宿主读好了一个 .sf2（null = 收起这一组）：列表最上面出现「⟨文件名⟩（N 件）」，滚到顶上。 */
    setOwnFile(f: OwnFile | null): void;
    private pickOf;
    private onClick;
    private pinsNow;
    /** 一格点下去用谁：人声类 = 小月相；别的 = 目录里第一位能演的（本尊在前）；都没有 = null。 */
    private pinPick;
    private pinKey;
    /** 常用一行（v0.16.36）：一样大的格子横着排（放不下横着滑；家规：按钮堆看到就改成格子）——图标 + 名字 + 管哪一层。点 = 换上（弹着玩 = 试听）。 */
    renderPins(): void;
    private tapPin;
    private presetOf;
    private presets;
    private pinTarget;
    /** 长按 / 右键的小菜单（浮在那一格 / 那一行下面）。 */
    private pinMenu;
    private pinAct;
    /** 顶上第二排「这首歌的乐器预设」（歌里打开的才有；弹着玩没有）：和常用一行一样大的格子（图标 + 名字）。
     *  点本声部的一格 = 换上；点别的声部的（角上写「在 ⟨声部⟩ 上」）= 拷一份过来换上，那边不动；长按 / 右键 = 复制一份 / 删掉（v0.16.38，施工单 §4.1 / §5）。 */
    renderUsed(): void;
    render(): void;
    /** 一位能演的（一行）：名字 + 小字 + 「▶ 听开头」「选这个」。目录里的提供者和自己文件里的那几件共用（v0.16.37）。 */
    private provHtml;
    /** 打开的 .sf2 那一组（列表最上面；施工单 §4.3）：按 乐器 / 变体 / 鼓组 分小节，一件一行；点一行 = 试听，「选这个」= 换上。
     *  搜索框里有字 = 只列名字里有它的。组头的 × = 收起这一组（字节一起放掉）。 */
    private ownHtml;
    /** 重画，把 sel 选中的那个元素钉在屏幕上原来的位置（只滚列表自己）。 */
    private renderPinned;
    /** 重画，但把 anchor 这件乐器的那一行钉在屏幕上原来的位置（user 2026-10-08「换乐器玩，弹几下，选乐器滚动会跳到别的地方去」：
     *  点另一件 = 上面展开的那件收起，整张列表往上缩，原来又用 scrollIntoView 去追选中项、在 iPad 上还会连外层一起滚——手指底下那行就跑了）。
     *  reveal = 刚展开的：它的「谁能演」露不全就往上挪一点，但这一行不挪到组头底下。只滚列表自己。 */
    private renderAnchored;
    /** 手风琴：展开 / 收起一组（只能开一组）。展开 = 那一组的组头滚到列表顶上；收起 = 组头留在屏幕上原来的位置。 */
    private toggleGroup;
    /** 列表滚到第 k 组的组头（只滚列表自己，不用 scrollIntoView——它会连带滚外层）；收着的先展开（手风琴）。 */
    private jumpTo;
    /** 跳转下拉显示「现在在哪一组」（组头顶到列表顶的最后一组）。滚到底时：最后几组短、组头顶不到列表顶——人刚选的那组比算出来的靠后就留着它，不往回弹。 */
    private markJump;
    private rowHtml;
}
