import { type TextMeasure } from "./text/index.ts";
import { type Lang } from "../i18n/index.ts";
import { type Song, type Token, type Focus, type Staff } from "../score/song.ts";
import { type PercInfo } from "../gm/percussion.ts";
import type { Ink } from "./frame/cell.ts";
import { type HarmonyRead } from "../theory/index.ts";
import { type RowKind } from "./notations.ts";
/** tok = 这个图元属于哪个 token（id）：写字头 / 选区 / 强调色不进排版，score-view 按 data-tok 在 DOM 上开关 class（W-17 第 1 刀，2026-10-15）。 */
export type Prim = {
    t: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
    cls?: string;
    tok?: number;
} | {
    t: "glyph";
    x: number;
    y: number;
    ch: string;
    cls?: string;
    size?: number;
    tok?: number; /** 描边补粗（字号的几成；7-P：Bravura 的 ♭ 缩小了主笔画不够粗，按算出来的补；屏幕 SVG 和 PDF 同一个数）。 */
    stroke?: number;
} | {
    t: "text";
    x: number;
    y: number;
    s: string;
    cls?: string;
    size?: number;
    anchor?: "start" | "middle" | "end";
    tok?: number; /** 横向压窄（以 x 为中心；1 = 不压）：紧凑档的歌词 0.85（刀 2，user 11-09「可以」）。 */
    sx?: number;
} | {
    t: "path";
    d: string;
    cls?: string;
    tok?: number;
} | {
    t: "rect";
    x: number;
    y: number;
    w: number;
    h: number;
    cls?: string;
    tok?: number;
};
/** 要画的一个声部（顺序 = 总谱从上到下；隐藏的不在这里）。 */
export interface PartView {
    id: string;
    name: string;
    abbr?: string;
    colorIdx?: number;
    empty?: boolean;
    first?: boolean; /** 只有合租叠出来的虚拟行用（v0.16.88 起真声部的谱号 / 大谱表按段算，见 resolveSongLooks）。 */
    staves?: 2;
    hidden?: boolean;
    badges?: string[];
    mono?: boolean;
    xHead?: boolean;
    perc?: PartPerc;
    ignores?: readonly string[];
    lyricMute?: ReadonlySet<number>;
    noLyrics?: string;
    /** 台上那位的音域（MIDI；宿主从演奏者 / 乐器目录查好，排版不认识乐器目录）：简谱每一行的八度基准按它定；没有 = 按写的音「点最少」（第五刀 5-4）。 */
    range?: {
        lo: number;
        hi: number;
    };
    /** 整套鼓：这位用到的鼓件（MIDI 鼓键）→ 名字（宿主按界面语言从鼓谱表 src/gm/percussion.gen.ts 取好，排版只管印）。简谱整套鼓的图例用（5-6，统筹裁定）。 */
    kitNames?: Readonly<Record<number, string>>;
}
/** 台上那位是鼓 / 音效（v0.10.27；src/gm/percussion.ts percKindOf）：kit = 整套鼓（写的音高 = 敲哪个鼓，五线鼓谱）；one = 固定敲一件（一线谱）。 */
export type PartPerc = {
    kind: "kit";
} | {
    kind: "one";
    info: PercInfo;
    key: number;
};
export interface EngraveOpts {
    width: number;
    sp: number;
    at: Focus;
    /** 写字头在光标所在声部的尾巴后面（写着写着往后长）：最后一行照旧画到右边（写的地方）。光标 / 选区 / 写字头的蓝 / 强调色都不进排版——
     *  排版只看谱，score-view 在 ink 层画光标和选区带、按 data-tok 开关 class（W-17 第 1 刀，2026-10-15 Claude Fable 5.1）。 */
    tailOpen?: boolean;
    parts: PartView[];
    /** 量字的尺子（文字模块 src/render/text/：宿主 createTextMeasure(原始尺子)，一次排版一把）。 */
    measure: TextMeasure;
    /** 编辑器要排版留的地方（刀 1，2026-11-08 Opus 5.5；施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §3.1）：只是尺寸，画什么归覆盖层（src/ui/score-overlay.ts）。
     *  印 / PDF = 不给。underPaper = 每张纸底下留一条多高（sp；虚线框「＋ 声部」那一截，分页时不留）；tail = 整首最下面留一条多高（「＋ 新曲段」；分页 = 最后一页纸外面、只撑高画布）；
     *  famGap = 合租展开着的一家，名字和谱之间多让多少（括号）；navRoom = 多张纸时曲段名那一条右边给曲段控件让多宽（只缩曲段名的点击框）。 */
    chrome?: {
        underPaper?: number;
        tail?: number;
        famGap?: number;
        navRoom?: number;
    };
    /** 合租的每一家都叠起来、不看光标在哪（v0.10.29：听模式；user「每一家点开收拢的ux怎么算」→ AI 提「听模式里所有家一律叠起来 / 写的模式光标在哪家哪家展开」→「12 同意」）。 */
    foldAll?: boolean;
    autoBars?: boolean;
    /** 分页排法（user 2026-10-08「显示法还加一个分页？可以预览打印，要求和之后生成的pdf wysiwyg」）：按纸高分页、画页框 + 页码；h = 整页高、l r t b = 四边边距（sp）。没有 = 连续（一张长纸）。 */
    page?: {
        h: number;
        l: number;
        r: number;
        t: number;
        b: number;
    };
    /** 只画这一张纸（曲段）：视图范围「本段」（user 2026-10-08「不同曲段应该是不同页，而不是一起显示」「视图里面应该也有个连续和分段」）。 */
    onlyPaper?: string;
    /** 横卷（v0.9.35；user 2026-10-10「那个无限往右的总谱模式也做一下」）：不折行，每张纸一行、一直往右；width 只管歌名 / 作者栏 / 纸的控件那一屏，
     *  排出来的 Layout.width = 最长那张纸的右端（+ 尾巴，光标停在最后能接着点）。 */
    scroll?: boolean;
    /** 连续排法的纸边距（sp）：和分页同一张纸的几何，只是不断页（user 2026-10-08「连续和分页看到的行宽应该是一样的」「连续只是没有了断页，但是每一行还是一样的」）。 */
    margins?: {
        l: number;
        r: number;
        t: number;
        b: number;
    };
    /** 字的尺子比谱的尺子大多少（刀 2；src/score/paper.ts textScaleOf：舒适 = 1、紧凑 = 1.4）：歌名 / 作者栏 / 编排 / 曲段名、声部名 / 简写、歌词、速度 / 风格 / 反复的字、
     *  「1=F」、小节号、和弦级数、页码，连同它们周围留的地方，都按 sp × textScale 量；字形、线、cresc. / 8va / 「吸」/ 推定的灰字照旧跟谱。量字的换算在文字模块里（measure.width）。没给 = 1。 */
    textScale?: number;
    /** 界面语言（谱面分家施工单 1b-3）：排版里要写的几个字（「编排」、编排写错的说明、换气后面的「吸 / 深吸」）按它翻。明着传，排版不读这一页的当前语言（设计稿第 3.9 节守卫 8：同样的输入出同样的版面）。 */
    locale: Lang;
    /** 只给测试用（刀 4b 守卫「注解不改版面」）：注解（ann）一个都不画。开关两边可印的图元必须逐个相同——注解只看天际线、不写。 */
    __noAnn?: boolean;
    /** 测试用（第八刀守卫 2）：数字行每个音 / 休止的盒子——墨迹框、它自己的图元（数字行的单位，相对这一列）、这一段占到多宽。 */
    __cells?: (c: {
        tok?: number;
        box: Ink;
        prims: Prim[];
        row: number;
        ox: number;
        unit: number;
        wall: number;
    }) => void;
    /** 测试 / 样张用：数字行的小节线高度临时换一种（7-I 并排图），盖过排版参数表的 barSpan。 */
    __barSpan?: "body" | "notes" | "fixed";
}
/** 一条谱行（某张纸、某行、某个声部）：top/bottom = 这一条占的竖直范围（含歌词）。staffTop / staff = 五线谱这一行自己的数据（staff/geometry.ts StaffRowData；挪成行的 data 归第二刀）。 */
export interface SystemBox {
    top: number;
    staffTop: number;
    bottom: number;
    paper: string;
    part: string;
    sys: number;
    staff: Staff; /** 这一行用哪种画法（谱面分家第四刀；每一行都写）：staffTop = 这一行的原点（五线谱 = 第五线）。 */
    kind: RowKind; /** 五线谱右端（px；播放时的小节底色右边界用，v0.10.12）。 */
    x1?: number;
    /** 这一行谱上真有墨的上下沿（px）：音（含叠着的房客）、符干、跳音 / 重音、力度那几道、八度线、歌词；不含速度 / 风格记号（那是整张谱的）。播放的灰块按这个（v0.10.26）。 */
    inkTop?: number;
    inkBottom?: number;
    /** 数字行的八度基准（第几个八度的音不加点；谱面分家第四刀 4-6：鬼音符照它加点）。五线谱的行没有。 */
    octBase?: number;
    /** 字母谱的行（7-B）：中央 C 叫 C 几——鬼音符照它写成 C-4 这种（不画点）。别的行没有。 */
    middleC?: number;
    /** 这一行行里的尺寸比例（排版参数表行一级 scale；不是 1 才写）：主线程几何（光标 / 鬼音符 / 选区带）按它取。 */
    scale?: number;
}
export interface HitNote {
    index: number;
    system: number;
    x: number;
    y: number;
    w: number;
    d: number; /** 合租的声部 2（v0.10.28）：下标指这条虚拟 track（`…~v2`），不是这一行那一位的。 */
    part?: string;
}
export interface Slot {
    caret: number;
    system: number;
    x: number;
    end?: true; /** 补齐的淡色小节的开头：点这里 = 光标在尾巴 + 先补这么长（tick）的休止再写（v0.10.6）。 */
    lead?: number;
}
/** 光标画在哪（W-17 第 1 刀：排版不认光标，只给出每个 caret 位置该画的地方，score-view 按 EditorState 挑）：老规矩 = 同一 tick 上排在小节线 / 记号后面、音前面；
 *  end = 点在行末放的（画在上一行末尾）；lead = 补齐的小节里；shift = 那里的谱号 / 八度线位移（鬼音符用）。 */
export interface CaretHead {
    caret: number;
    system: number;
    x: number;
    shift: number;
    end?: true;
    lead?: number;
}
export interface LyricHit {
    index: number;
    system: number;
    x: number;
    y: number;
    tight?: true;
}
/** 记号（调号 / 拍号 / 速度）的点击区域（px）：点了就地改。谱头的调号 = 谱号 + 调号那一块（C 大调没有升降号也点得到）。 */
export type PartToggle = "muted" | "solo" | "hidden" | "only";
export type PartToggles = Record<PartToggle, boolean>;
/** 名字那一栏至少多宽（sp）：屏幕上覆盖层在名字上面放两颗 3.0 的大钮（src/ui/score-overlay.ts TG_BTN）；PDF 照样这么宽 = 预览的版面 = PDF（屏幕和 PDF 同一条规矩；刀 1 起这只是一个几何常数，排版器不画钮）。 */
export interface MarkHit {
    index: number;
    kind: "key" | "time" | "tempo";
    system: number;
    x: number;
    y: number;
    w: number;
    h: number;
}
/** 谱号 / 八度线的点击区域（v0.9.28）：start = 每行开头的谱号（index = 管着它的谱号记号，−1 = 声部自己的谱号）；mid = 行中间的谱号记号；ottava = 八度线开头的字。 */
export interface ClefHit {
    kind: "start" | "mid" | "ottava";
    paper: string;
    part: string;
    index: number;
    system: number;
    x: number;
    y: number;
    w: number;
    h: number; /** 自动画的八度线（v0.9.37）：index = −1，这一段的起止下标和几度。 */
    run?: {
        from: number;
        to: number;
        shift: 1 | 2 | -1;
    };
}
/** 力度记号 / 渐强渐弱的点击区域（px）：点 = 小菜单（改 / 删），长按拖 = 挪到别的音上（2026-10-08 Opus 5.5）。渐强渐弱跨行 = 每行一块。 */
export interface DynHit {
    index: number;
    kind: "dyn" | "hairpin" | "groove" | "nav";
    system: number;
    x: number;
    y: number;
    w: number;
    h: number;
}
/** 休止的位置（px）：力度记号 / 渐强渐弱能拖到休止上（2026-10-08 user「力度符号应该能拖动到休止符上」）。 */
export interface RestHit {
    index: number;
    system: number;
    x: number;
    y: number;
    w: number;
}
/** 纸面最上面的歌名那一条（点了就地改）。 */
export interface TitleHit {
    x: number;
    y: number;
    w: number;
    h: number;
    baseline: number;
    size: number;
}
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface Layout {
    prims: Prim[];
    width: number;
    height: number;
    sp: number;
    /** 字的尺子（px）= sp × textScale（刀 2）：覆盖层的钮、提示字、虚线框的字按它，紧凑档不跟着谱缩。 */
    tp: number;
    /** 和弦里主音以外的那几个符头（播放时一起亮；不进 notes——点 / 拖还是按整个音；v0.10.23，user「音符高亮忘了做和弦的其他音的高亮」）。 */
    chordHeads: {
        index: number;
        system: number;
        x: number;
        y: number;
        w: number;
        part?: string;
    }[];
    /** 和弦级数的点击框 + 认出来的候选（这首歌开着和弦标级数才有；点了 = 候选小菜单）。 */
    chordTags: {
        x: number;
        y: number;
        w: number;
        h: number;
        read: HarmonyRead; /** 哪一行（systems[system] 的 paper / part）、那条 track 第几个 token（挑读法写回去用，v0.16.87）。 */
        system: number;
        index: number; /** index 指的是哪一位的 track（合租一家合起来认的级数画在这一家最下面那一行，挑读法写回的那个音可能是别的一位的；没写 = 这一行那一位，第五刀 5-4）。 */
        part?: string;
    }[];
    /** 每张纸第一行各位的名字块（刀 1 锚点）：x0 = 色点左边、x1 = 最长那行名字的右边、top = 第一行名字的上沿（px）。覆盖层把两颗大钮摆在它上面、整排对它居中。 */
    names: {
        paper: string;
        part: string;
        x0: number;
        x1: number;
        top: number;
    }[];
    /** 合租叠起来的谱行（下标 = systems 里的）：只读——点了不写、不放光标，点名字拆开（v0.10.25，user「host也应该只读，只有展开时才能编辑」）。 */
    sharedRows: number[];
    /** 合租叠起来的那一行画的是哪条虚拟 track（键 = "纸 id:主人 id"；v0.10.28，src/score/merge.ts）：这一行点击区的下标指的是它，不是主人自己的 track。 */
    virtual: Record<string, Token[]>;
    /** 每个小节在哪（v0.10.28）：这张纸上的 tick 区间 + 画在哪一行（systems 下标）、小节里第一个东西的 x（px）。播放的小节底色按播放的 tick 查这个——
     *  不再按「最晚开始的那个音」找（跨小节的长音 / 连音线后半截没有自己的点击区，小节底色就停在上一小节；user「小节高亮也算错了…碰到跨小节的音小节高亮没有update」）。 */
    measures: {
        paper: string;
        t0: number;
        t1: number;
        row: number;
        x: number;
    }[];
    /** 合租展开着的那一家（v0.10.29；刀 1 起只是锚点 = chrome.famGap 给了才有）：这一家的几行在哪（括号由覆盖层画，点它 = 光标挪出这一家）。user「把这一家的几行括在一起…点这条括号等于「光标挪到这一家后面紧挨着的那位」…可以」。 */
    families: {
        paper: string;
        host: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
    systems: SystemBox[];
    notes: HitNote[];
    slots: Slot[];
    heads: CaretHead[];
    lyrics: LyricHit[];
    marks: MarkHit[];
    dyns: DynHit[];
    rests: RestHit[];
    title: TitleHit;
    clefs: ClefHit[];
    arrangement: TitleHit | null;
    credits: Box | null;
    /** 作者栏第一行在哪（刀 1 锚点）：x = 右端（靠右写）、y = 基线、size = 字号（px）。空着时覆盖层在这里写浅色提示「作者」、点它 = 改作者栏。 */
    creditsLine: {
        x: number;
        y: number;
        size: number;
    };
    /** 版心的左右（px；刀 1 锚点）：纸角的小钮、曲段控件靠它右端摆。 */
    content: {
        left: number;
        right: number;
    };
    /** 调号位置上没有升降号的那几处（刀 1 锚点；专业模式，按 C 调看时没有）：覆盖层在这里写淡的「1=C」，点它 = 谱头面板。x / y = 字的起点和基线（px）。 */
    /** s = 写什么（「1=C」/ 小调「6=A」；v0.16.83）。 */
    /** 「演奏法和表情：不显示」的淡提示（7-G 重做，user 11-12：原来的「折叠 N」小标「又不好懂，而且位置也错了，又还和别人打架」）：整首一个，第一行谱头那一行的右端；
     *  不印的提示（只躲不推、躲开歌名 / 作者栏 / 曲段名那一条）；覆盖层照它画字，点了 = 页面设置「看谱」页落在那一项。只在不显示、整首确有收起来的记号时有。 */
    foldHint: {
        system: number;
        x: number;
        y: number;
        size: number;
        s: string;
    } | null;
    keyHints: {
        system: number;
        index: number; /** 它指的那个调号 token 的 id（守卫 4：编辑器里的提示也算画出来了，第五刀 5-3）。 */
        tok?: number;
        x: number;
        y: number;
        size: number;
        s: string;
    }[];
    /** 整首最下面留的那一条（chrome.tail 给了才有）：覆盖层在里面画「＋ 新曲段」。 */
    tail: (Box & {
        paper: string;
    }) | null;
    /** 每行每根小节线的 x（px；播放时的小节底色用，v0.10.12；只是多带的数据，不改任何位置）。 */
    bars: {
        system: number;
        x: number;
    }[];
    parts: (Box & {
        paper: string;
        part: string;
    })[];
    /** 每张纸：曲段名那一条（shown = 画了）、占的竖直范围。刀 1 起曲段控件（‹ k/n › 只看本段 ⋯）归覆盖层，这里只给锚点：
     *  under = 纸底下留的那一条（chrome.underPaper，虚线框）；hidden = 这张纸隐藏着（全部视图里不排、不占地方：top = bottom，v0.16.34 起；原来折叠成一条）；note = 本段视图里隐藏纸顶上那一条说明；
     *  empty = 这张纸上没有声部时空着的那一条；hiddenParts = 这张纸上有、但隐藏着（不排、不占地方）的声部（覆盖层的「隐藏 N」）。 */
    papers: {
        id: string;
        title: (TitleHit & {
            shown: boolean;
        });
        top: number;
        bottom: number;
        under?: Box;
        hidden?: boolean;
        note?: Box;
        empty?: Box;
        hiddenParts: string[]; /** 演奏法和表情不显示时，这张纸上看得见的声部折叠了几处（7-G；覆盖层的「折叠 N」小标）。没有 = 0 处或显示着。 */
        folded?: number;
    }[];
    pageX: {
        left: number;
        right: number;
    };
    pages: {
        top: number;
        h: number;
    }[];
    shortBars: number;
    /** 每行歌词的基线 y（px；2026-10-21）。 */
    lyricYs: number[];
}
/** 排版：只出平数据（屏幕上同步那条路、worker、PDF、测试都是这一份）。 */
export declare function engrave(song: Song, o: EngraveOpts): Layout;
export type { Token };
