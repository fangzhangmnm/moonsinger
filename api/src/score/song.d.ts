import { type PaperKind, type Density, type PaperChoice, type Margins } from "./paper.ts";
import { type Dir, type Pitch, type Step } from "./pitch.ts";
import type { GrooveStyle } from "./grooves.gen.ts";
/** 一种风格出声用的五样（16-4 D：score.json grooves 按值存；插风格记号的那一刻从现行预设抄，src/score/groove.ts withGrooveData）。名字不抄（显示照现行的表）。 */
export type GrooveData = Pick<GrooveStyle, "meters" | "phase" | "fallback" | "follow" | "swing">;
/** 一个四分音符的 tick 数。 */
export declare const TPQ = 1680;
/** 第一版拍子单位 = 四分音符（x/4 拍号）。 */
export declare const BEAT = 1680;
export declare const WHOLE: number;
/** 长短六档（plain 值）：三十二分 · 十六分 · 八分 · 四分 · 二分 · 全音符（user「长的话最多全音符同意，再有需求用连音」）。 */
/** 接下来写的长短默认 = 八分（user「默认可以是八分音符吗」）。长短旋钮上有哪几档 = note-values.ts lenSteps（跟光标处的拍号）。 */
export declare const DEFAULT_LEN: number;
/** 连音：n 个占 m 个的位置 → 每个 × m/n（三连 ×⅔、五连 ×⅘、六连 ×⅔（4 拍分 6）、七连 ×4/7）。 */
export declare const TUPLET: Record<number, [number, number]>;
/** 数据上的时值下限 / 上限（下限 = 三十二分七连音；上限 = 四个全音符，再长用连音线）。 */
export declare const MIN_DUR: number;
export declare const MAX_DUR: number;
/** lang = 这个音节唱哪种语言，**只在和自动认的不一样时才有**（持久化第 6 题：存档时每个音节都写明，编辑时自动认、认错了才改；规则见 score/lang.ts）。 */
export interface NoteTok {
    kind: "note";
    id: number;
    pitch: Pitch | null;
    dur: number;
    lyric: string | null;
    hyph?: boolean;
    tie?: boolean;
    staff?: Staff;
    chord?: Pitch[];
    art?: Art[];
    slur?: boolean;
    inhale?: "soft" | "big";
    harm?: ChordPin;
}
/** 人写明的和弦（v0.16.87；user 11-09 拍「输入法候选」= 点开挑一个读法，11-10「一同意」往歌里存、「三可以接」别人谱里的和弦记号）：
 *  根音 + 种类 + 最低音，挂在那个音上（音删了它就没了，撤销一起回来）。kind = 理论里的和弦种类 id（src/theory/western.ts 的表；"5" = 空五度）；
 *  bass 没有 = 和根音一样。级数不存（按这里的调号现算，换调号跟着变）；移调 / 转调跟着音一起挪。MusicXML 原生 <harmony>（紧挨在那个音前面）。
 *  音改了、挑的不再是这几个音认得出的读法 = 照样画（灰 + 「?」）、点开说一声，不自动删、不自动换（不替人判断）。 */
export interface ChordPin {
    root: {
        step: Step;
        alter: number;
    };
    kind: string;
    bass?: {
        step: Step;
        alter: number;
    };
}
/** 和弦名跟着音一起挪（移调 / 转调用；改单个音高不算移调，不挪）。 */
export declare function movePin(t: NoteTok, f: (p: Pitch) => Pitch): NoteTok;
/** 挑一个读法 / 改回自动（null）：那张纸那个声部第 index 个 token（得是音）。一步撤销。 */
export declare function setChordPin(st: EditorState, paperId: string, partId: string, index: number, pin: ChordPin | null): EditorState;
export interface RestTok {
    kind: "rest";
    id: number;
    dur: number;
    staff?: Staff;
}
/** style（v0.9.32）：double = 段落线 ‖（分段，不是两根小节线）；final = 终止线（user「嗯双小节线的语义不是两个小节线，同意你的归类」= 从「反复」菜单进）。和 repeat 不同时有。 */
export interface BarTok {
    kind: "bar";
    id: number;
    repeat?: Repeat;
    times?: number;
    style?: "double" | "final";
}
/** 谱内反复 / 跳转（2026-10-09 Opus 5.5；user「顺便一提谱内的循环和标准的dc这种是不是支持下也不难？…不然遇到弱起什么其实AAABBB不是很方便」
 *  「就是普通记谱软件支持的那种。这样，不超过sheet边界。等参考窗好了当小东西加」）：不跨纸；放的时候按这张纸最上面那位在场歌手那一行的结构展开（src/score/repeats.ts），
 *  别的声部按 tick 跟；MusicXML 原生（<repeat> / <ending> / segno / coda / D.C. / Fine）。 */
export type Repeat = "start" | "end" | "both";
/** ending = 房子（第几遍走这个括号，nums）；其余 = 跳转记号：segno / coda = 位置；fine / toCoda = 跳回来之后在这儿停 / 去 Coda；dc / ds = 在这儿跳回开头 / Segno（al Fine / al Coda = 跳回来之后在 Fine 停 / 在 To Coda 去 Coda）。 */
export type NavWhat = "ending" | "segno" | "coda" | "fine" | "toCoda" | "dc" | "dcFine" | "dcCoda" | "ds" | "dsFine" | "dsCoda";
export interface NavTok {
    kind: "nav";
    id: number;
    what: NavWhat;
    nums?: number[];
}
export declare const NAV_LABEL: Record<Exclude<NavWhat, "ending">, string>;
/** 房子上写的字：[1] → 「1.」，[1, 2] → 「1. 2.」。 */
export declare const endingLabel: (nums: readonly number[] | undefined) => string;
/** mode = 小调（v0.16.83，user 11-09「在选调号的时候强制一起选。不过关系大小调对齐」）：只管和弦级数从 la 数；音、升降号、播放都不变。
 *  没有 = 大调（老歌全是）。MusicXML 原生 <key><mode>minor</mode>。凡是照抄调号的地方（新纸 / 新声部 / 移调 / 复制）一起带。 */
export interface KeyTok {
    kind: "key";
    id: number;
    fifths: number;
    mode?: "minor";
}
export interface TimeTok {
    kind: "time";
    id: number;
    beats: number;
    beatType: number;
}
export interface TempoTok {
    kind: "tempo";
    id: number;
    bpm: number;
}
export type MarkTok = KeyTok | TimeTok | TempoTok;
/** 「修」的记号（2026-10-08 by Claude Opus 5.5；user「呼吸记号 跳音 / 力度这类修的记号进选区条」「flow 还是主旋律，修才管这些」→ 拍「挂在音上 + 选区条」「月读在那儿换气」）：
 *  演奏法 = 挂在音上（art，按 ARTS 的顺序、不重复）；MusicXML <notations><articulations> 原生——呼吸 = <breath-mark/>，挂在呼吸前的那个音上。
 *  出声：跳音 = 截短（候选的 articulation.staccatoGate）、重音 = 音头加 accentDb、保持 = 满长；呼吸 = 月读在下一个字前换一口气（唱法核心的「v」），乐器不受影响。 */
export type Swell = "<" | ">" | "<>";
export declare const SWELL_NAME: Record<Swell, string>;
export type Art = "staccato" | "accent" | "marcato" | "sfz" | "fp" | "tenuto" | "breath" | "stress" | "unstress" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll";
export declare const ARTS: readonly Art[];
export declare const ATTACKS: readonly Art[];
export declare const ART_NAME: Record<Art, string>;
/** 音内的起伏这一组（互斥）：演奏法的值 ↔ 记号（< / > / <>，score.json 和画法用）。 */
export declare const SWELL_ART: Record<Swell, Art>;
export declare const SWELL_ARTS: readonly Art[];
/** 这个音的音内起伏（没有 = undefined）。 */
export declare function swellOf(t: Token | undefined): Swell | undefined;
/** 力度 = 一个记号 token（不占时值，管到下一个力度为止；一首没写 = mf）。MusicXML <direction><dynamics>。出声 = 候选的 dynamicsDb（mf = 0 dB）。 */
export type Dyn = "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff";
export declare const DYNS: readonly Dyn[];
export declare const DEFAULT_DYN: Dyn;
export interface DynTok {
    kind: "dyn";
    id: number;
    value: Dyn;
    ramp?: true;
}
/** 渐强 / 渐弱（2026-10-08 改成记号，Claude Opus 5.5；user「所以<>是一个语义，就是从这一刻开始连续变到下一个强度/速度标记？」「大于小于号不用精确指定范围，而是读最近的pf」）：
 *  状态的过渡——从这儿起连续变到同一张纸里的下一个力度记号；中间又遇到一个渐强渐弱 = 这一段到那儿为止；都没有 = 走一档（演奏者的 wedgeStep），谱上灰字披露。 */
export interface HairpinTok {
    kind: "hairpin";
    id: number;
    dir: "cresc" | "dim";
}
/** 风格记号 = 拍子轻重（2026-10-08 深夜 Opus 5.5；user「先讨论清楚再做，不同的流派会不一样」→ 风格是一个像速度一样的文字记号、「只对当前sheet有用」「中间换同意」
 *  「点开之后可以设置具体的细节」「预设可以…做成数据驱动的」）：从这儿起到这张纸结尾（或下一个风格记号），每个音按它在小节里的位置轻一点 / 重一点
 *  （预设 = 音乐仓鼠的 grooves-vN.json，src/score/groove.ts）。整张纸一起听（写在哪一行都管全部歌手；同一时刻两行都写了 = 上面那行算）。
 *  style = 预设 id（"pop"…；"none" = 这儿起不加）；amount = 幅度（1 = 预设本身；不写 = 1）。不占时值、不占横向地方。MusicXML <direction><words id="groove.…">。 */
export interface GrooveTok {
    kind: "groove";
    id: number;
    style: string;
    amount?: number;
    shift?: true;
}
/** 谱号记号（v0.9.28；user 2026-10-10「谱号的显示模式跟着谱号而不是乐器」「默认自动同意」「加格式同意」）：从这儿起换谱号（只管画，音高数据不动）。
 *  声部自己的谱号（PartDef.clef，没有 = 自动）管每张纸开头；纸中间要换就插这个。MusicXML 原生 <attributes><clef>。 */
export interface ClefTok {
    kind: "clef";
    id: number;
    clef: ClefName;
}
/** 八度线（v0.9.28；user「铃铛会很高。8va可以做了吗」）：从这儿起谱上画低（8va / 15ma）/ 高（8vb）几个八度，直到下一个八度线记号（shift 0 = 结束）；只管画。
 *  shift：1 = 8va（实际高八度）、2 = 15ma、−1 = 8vb、0 = 结束。MusicXML 原生 <octave-shift>。 */
export interface OttavaTok {
    kind: "ottava";
    id: number;
    shift: -1 | 0 | 1 | 2; /** 自动画的（v0.9.37）：只在导出 MusicXML 时临时插进去（带 ms-auto id），谱里永远没有。 */
    auto?: true;
}
/** 踏板记号（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；设计 = ai-docs/20261112-pedals-and-ring-design.md）：不占时值，挂在后面那个音 / 休止上（能挂在一段最后）。
 *  which = 延音 / 持音 / 弱音；act = 踩下 / 抬起 / 换踏板（换 = 只有延音有：这一刻留着的音全松、接着踩着）。按声部、按纸算：每张纸开头三种都是抬着的，纸尾还踩着 = 纸尾抬起。
 *  11-1 只接延音（持音、弱音是 11-2）。 */
export type PedalKind = "sustain" | "sostenuto" | "soft";
/** 三种踏板（画的先后：延音最靠谱）。 */
export declare const PEDAL_KINDS: readonly PedalKind[];
export interface PedalTok {
    kind: "pedal";
    id: number;
    which: PedalKind;
    act: "down" | "up" | "change";
}
export type Token = NoteTok | RestTok | BarTok | MarkTok | DynTok | HairpinTok | GrooveTok | NavTok | ClefTok | OttavaTok | PedalTok;
export type Timed = NoteTok | RestTok;
/** 一个记号的值（不带 id）。 */
export type MarkVal = Omit<KeyTok, "id"> | Omit<TimeTok, "id"> | Omit<TempoTok, "id">;
/** 「哼的字」：跟语言无关的五档，唱的时候按语言换字（lab-score.ts HUM_SYLLABLE）。o = 2026-10-07 加（user「GM不是还有一个ooo吗」「对，哦 / お」）。 */
export type Hum = "la" | "n" | "u" | "o" | "a";
/** 歌级的一个声部（谱上的一行；顺序 = 总谱从上到下）：role = 休息室角色 id（谁来演、叫什么），mic = 录音房麦克风 id。 */
/** 谱号 / 大谱表 / 自动八度线不在声部上了（v0.16.88，每一段自己选：PaperSeg.looks + 纸头的谱号记号；user 11-09「收到前面的per sheet而不是跟着歌手。只有shared staves有」）。 */
export interface PartDef {
    id: string;
    role: string;
    mic: string;
    /** 合租（v0.10.24）：挂在哪位（主人）的谱线上画（主人自己不能再是房客）。只管画：轨 / 乐器 / 混音台照旧各是各的（ai-docs/20261010-shared-staff-percussion-design.md §1）。 */
    host?: string;
    /** 文件里写着、但不成立的合租（主人不在 / 挂自己 / 主人也是房客；第 16 条，2026-11-12）：这一位照没有合租来画（运行时只看 host），名字下面标出来、人去改；
     *  存的时候照原样写回 host（不悄悄丢）。人在歌手牌里改了合租 = 这一项去掉。 */
    hostBroken?: string;
    /** 这条轨的和弦选项（谱面分家第三刀，score minor 5；读 / 改只走 src/score/song-view.ts）：没写 = auto（也认拆开弹的）；"stacked" = 只认叠在一起的。
     *  读文件（src/format/project.ts）：这两档以外的值，文件比这一版新 = 原样留着、存的时候照写；不比这一版新 = 读成 auto（2026-11-13 退役的第三档就走这一条）。
     *  老键 brokenChords 读的时候不理。 */
    chords?: string;
}
/** 谱号：高音 / 高音下加 8（吉他、男高音：实际低八度）/ 上加 8 / 上加 15（钟琴）/ 低音 / 低音下加 8（低音提琴、贝斯）。中音谱号不做（user「中音这个冷门没人用吧」）。 */
export type ClefName = "G" | "G8vb" | "G8va" | "G15ma" | "F" | "F8vb";
export declare const CLEFS: readonly ClefName[];
export type Clef = ClefName;
export type Staff = 1 | 2;
/** 大谱表的分界：中央 C 以下自动落到下谱表（音可以手动指定 staff 覆盖；user 2026-10-08「钢琴这种左右手要两个谱号」「musicxml原生支持那就不纠结了直接上」）。 */
export declare const SPLIT_MIDI = 60;
/** 一张纸 = 一个曲段：name = 曲段名（纸顶那一条，可空）；tracks = 声部 id → 这张纸上这个声部的 token 串（开头三个谱头记号）。 */
/** hidden = 不放（压平 / 播放 / 导出的压平件都跳过）；全部视图里折叠着、翻页能进去（user 2026-10-08）。 */
export interface PaperSeg {
    id: string;
    name: string;
    tracks: Record<string, Token[]>;
    hidden?: boolean;
    /** 这一段里各声部怎么画（v0.16.88；只存不是默认的）：grand = 手选了大谱表；autoOttava: false = 这一段不画自动八度线。手选的单个谱号 = 纸头的谱号记号（不在这里）。 */
    looks?: Record<string, PartLook>;
}
/** 一段 × 一个声部的画法（只存不是默认的；空 = 自动谱号 + 自动八度线开）。 */
export interface PartLook {
    grand?: true;
    autoOttava?: false;
}
/** 谱头面板里谱号那一格（v0.16.88）：自动 / 手选的一个谱号 / 大谱表。 */
export type ClefChoice = "auto" | "grand" | ClefName;
export interface Song {
    /** 歌名（可不填；纸面最上面那一行，存档 = MusicXML <work-title>；user 2026-10-07「纸张的最上面加一个可选的歌名吧，未来也是文件名」）。 */
    title?: string;
    /** 纸张和版式的选择（第 17 条 17-1，score minor 13；存档 = score.json 同名的四个键，MusicXML <defaults> 只是写给别的软件看的）：
     *  每一项 = "default"（跟着软件）或这首歌选的值。"default" 现在等于什么、画的时候到底用哪一张纸，只问 src/look（lookOf(song).paper）；谱这一层不判断。
     *  paper = 纸（四种之一，或者按值带着的「其他」大小）；density = 舒适 / 紧凑；staffMm = 五线谱高（别家的谱带来的、或者以后人自己填的）；marginMm = 四边边距（别家的谱带来的）。整首歌一个。 */
    paper: Choice<PaperChoice>;
    density: Choice<Density>;
    staffMm: Choice<number>;
    marginMm: Choice<Margins>;
    /** 作者栏：一块纯文本、几行都行（作词作曲、演唱、月读的署名、声明…），纸上照写的显示（标题下面靠右）；可不填。
     *  不自动认「作词：」这类写法（user「你权衡一个plain multiline text vs自动识别（但是这样有hidden convention），你看一下怎么办」→ AI 选纯文本、所见即所得）。
     *  存档 = MusicXML <credit><credit-words>（印在页面上的字）。 */
    credits?: string;
    /** 这首歌自己（词 / 曲 / 编——用户写的那部分）的许可，一段文字，用户选或自己写；没有 = 没声明（不替用户选）。
     *  存档 = MusicXML <identification><rights>（标准位置，别的软件也认）；署名推演和 mp3 标签里排第一条（2026-10-08 by Claude Opus 5.5；user「你计算的时候别忘了用户自己写的那一部分，用户可以选」）。 */
    rights?: string;
    /** 编排：按什么顺序放哪几张纸（一行字：曲段名 / 序号、×N、括号、最后一个 [循环段]；src/score/arrange.ts）。没有 = 每张纸按顺序各放一遍。
     *  存档 = score.json 可选字段 arrangement（2026-10-08 深夜 Opus 5.5，user「a flat 编排 list 同意」「编排…就是总paper的顶上说一下…就是一行」）。 */
    arrangement: string;
    /** 歌词怎么排（v0.9.40；user 2026-10-10「先试下你说的两个歌词开关吧，approved」→「默认用修歌词的那个排版方式吧」）：没有 = 按节奏（默认：音的位置只看时值，
     *  歌词让路：借旁边的空 → 小一号 → 上下错开 → 还放不下画灰说「挤了」）；lyrics = 按歌词（长字把音推开，出版谱的老规矩）。存档 = score.json 可选字段 lyricFit（只写 "lyrics"）。 */
    lyricFit: string;
    /** 小节号（v0.9.42；user「小节号要，可以页面设置toggle，默认是每行开头有」）：没有 = 每行开头印；off = 不印。存档 = score.json 可选字段 barNumbers（只写 "off"）。 */
    barNumbers: string;
    /** 这首歌怎么看的几样（谱面分家第三刀起；17-1 起每一项多一个值 "default" = 跟着软件，"default" 现在等于什么只在 src/look）：
     *  notation = 谱种（不认识的原样留着）；chordTags = 和弦标级数；viewInC = 按 C 调看。存档 = score.json 同名的键。 */
    notation: string;
    chordTags: Choice<boolean>;
    /** 和弦辅助写成什么（score minor 14，施工单第 19 条）："degree" = 级数（V7、ii）/ "root" = 根音（G7、Am）/ "default" = 跟着软件（软件的默认 = 级数，设备上能记成习惯）。
     *  标不标照旧是 chordTags；这一项只管标的时候怎么写。比这一版新的文件里的不认识的值原样留着。 */
    chordTagStyle: string;
    viewInC: Choice<boolean>;
    /** 字母谱里中央 C 叫 C 几（score minor 6，7-B）；"default" = 跟着软件（17-1）。 */
    middleC: Choice<number>;
    /** 演奏法和表情显示不显示（score minor 8，7-G）；"default" = 跟着软件（17-1）。只管画：播放照写的来。 */
    expressions: Choice<boolean>;
    /** 谱上的字用哪种语言（score minor 10，施工单 12-4，2026-11-12；user「页面设置是不是也应该有一个语言，影响打印？」）："ui" = 跟着界面；"zh" / "en" = 界面语言里的一种；
     *  不认识的（更新的版本写的）原样留着、写回去，画的时候当跟着界面。只管软件自己生成、印出来的字（声部名是目录 / 预设里的乐器名时、简谱鼓的图例、「编排」、出声的换气「吸 / 深吸」）；
     *  歌词、歌名、作者栏、自己起的声部名不动。**必填**：没写的意思在进门那一处定一次（src/format/project.ts songViewFields：没写 = "ui"），新歌明着写 "ui"；运行时永远有值。读 / 改只走 src/score/song-view.ts。 */
    textLang: string;
    /** 这首歌的风格记号用到的那几种风格，每种出声用的五样（16-4 D，score minor 12；风格 id → GrooveData）。轻重、摇摆、跟多少、小菜单里的说明都只读这一份。
     *  插风格记号 / 换风格的那一刻从现行预设按值抄（withGrooveData，在文档的写入口规整里）；老歌没有 = 读文件的门口从现行预设补。
     *  记号指着的风格这里没有（现行预设里也没有）= 这个记号不起作用、画灰、小菜单里明说，不拿别的风格顶上。 */
    grooves?: Record<string, GrooveData>;
    parts: PartDef[];
    papers: PaperSeg[];
}
/** 光标 / 选中落在哪条 track（哪张纸 × 哪个声部）。 */
export interface Focus {
    paper: string;
    part: string;
}
/** 沿 token 串扫的起点（调号 / 拍号 / 速度）：是不带谱头的片段的起点，不是歌的默认——完整的歌每条轨开头都写着这三样，走不到（契约 contract.ts 写了这一句；
 *  统筹 2026-11-13「v0.17.18 收」①②：tempoAt 那几处、lab-score / chain 里一段没有音时的 90 不动）。 */
export declare const DEFAULT_KEY = 0, DEFAULT_TIME: {
    beats: number;
    beatType: number;
}, DEFAULT_BPM = 90;
/** 新建的谱头（C 大调 / 4/4 / ♩=90）：新歌、新纸、新声部开头写进去的三样，别家的谱没写时读的门口补的也是它（musicxml.ts，打开时说一句）。
 *  模板「谱的扩展」那一块的 head 就是这一个对象（template.ts 原样列出，不另抄）；数和上面扫描的起点是同一组。只给 headTokens 用（守卫 test/template.test.ts）。 */
export declare const NEW_SONG_HEAD: Readonly<{
    fifths: number;
    minor: boolean;
    beats: number;
    beatType: number;
    bpm: number;
}>;
/** 输入状态（不进数据）：写的时候下一个音长什么样。 */
export type Acc = -2 | -1 | 0 | 1 | 2;
export interface InputState {
    len: number;
    tuplet: 0 | 3 | 5 | 6 | 7;
    acc: Acc;
    accMode: "off" | "once" | "lock";
    accAt: number;
    inputFifths: number;
    inputScale: string;
    /** 「1=」跟谱（v0.16.9，user 11-07「键盘就有个自动模式。然后也有个手动覆盖模式…手动覆盖模式的时候，确实有个提示」）：true = 跟光标处的调号（按那个调号的大调排；
     *  一首歌几个调 = 光标走到哪跟到哪），inputFifths / inputScale 不看；false = 手动（拨过 1= 或调式就固定）。取代 10-07「把pad想成一个独立的medo式的输入设备，假设没有谱」。新歌默认 true。 */
    inputAuto: boolean;
}
/** 本次输入记录：退格撤回最后一笔（写字头在，记录就在）。 */
export type LogEntry = {
    k: "ins";
    id: number;
    unit: number;
    ate?: number;
} | {
    k: "fill";
    id: number;
    unit: number;
} | {
    k: "ext";
    id: number;
    by: number;
    ate?: number;
} | {
    k: "tie";
    id: number;
    unit: number;
};
export interface EditorState {
    song: Song;
    at: Focus;
    caret: number;
    sel: {
        from: number;
        to: number;
    } | null;
    nextId: number;
    log: LogEntry[];
    input: InputState;
    /** 点的是声部末尾后面补齐的淡色小节（v0.10.6；user「点小节写这里好」「新轨在显示的时候自动补齐小节号。然后自动补的休止也是自动的淡色」）：
     *  光标在 track 尾巴，下一次写音 / 休止之前先补这么长的休止（tick；按小节切开）。点一下不改谱，写的那一刻才落进去；挪光标 / 选中 / 任何编辑都清掉。 */
    lead?: number;
    /** 选了好几行（v0.17.49，src/score/multi.ts；设计稿第六节）：几行 × 一段时间。只在运行时，不进文件、不进撤销；有它时 sel = null、光标在最上面那行这段时间的开头。
     *  只活一步：提交时新状态带的还是上一个状态那一个 = 收掉（document.ts commit）——只有整块的操作现做一个新的才留下来，别的任何改动（挪光标、点、写）自动退出。 */
    multi?: import("./multi.ts").MultiSel;
}
/** 一条 track 开头的三个谱头记号（id 从 id0 起连着编）：m 里没给的 = 新建的谱头（NEW_SONG_HEAD）。 */
export declare function headTokens(m?: {
    fifths?: number;
    minor?: boolean;
    beats?: number;
    beatType?: number;
    bpm?: number;
}, id0?: number): Token[];
export declare const FIRST_PART = "P1", FIRST_PAPER = "p1";
/** 新歌：一张纸、一个声部（P1 → 角色 r1 → 麦克风 m1），哼的字默认「嗯」（user 2026-10-07「月读不是有啦嗯哦吗，默认嗯」）。 */
/** 一项显示设置的写法（第 17 条 17-1）：没选 = "default"（界面上叫「跟着软件」），选了 = 具体的值。"default" 现在等于什么只在 src/look 里定，谱这一层不判断它。 */
export type Choice<T> = "default" | T;
/** 歌级的显示设置（16-4 A3，score.json 同名键；17-1 起多了纸张和版式的四个键，音距退役）。arrangement 改声音（第 16 条那一侧），只是住在这一组里；textLang 的 "ui" 本身就是跟界面，不加 "default"。 */
export type SongLookKey = "arrangement" | "lyricFit" | "barNumbers" | "notation" | "chordTags" | "chordTagStyle" | "viewInC" | "middleC" | "expressions" | "textLang" | "paper" | "density" | "staffMm" | "marginMm";
/** 新建的歌写进去的歌级显示设置（16-4 A3；模板的「谱的扩展」那一块就是这一个对象——src/format/template.ts 原样列出，不另抄）。
 *  17-1 起：能跟着软件的每一项都是 "default"（第 17 条定下来的第 2 条）；编排空、谱上的字跟着界面。
 *  **只给构造函数用**（emptySong / songOf；守卫 test/template.test.ts：src/score 里这个名字只出现在这两个函数里）。读的一侧（src/look、排版、出声）照歌里写着的读，不碰它。 */
export declare const NEW_SONG_LOOK: Readonly<Pick<Song, SongLookKey>>;
export declare function emptySong(m?: {
    fifths?: number;
    beats?: number;
    beatType?: number;
    bpm?: number;
}): Song;
/** 单 track 的歌（测试 / 读别家单声部谱时顺手用）。 */
export declare function songOf(tokens: Token[], rest?: Partial<Omit<Song, "parts" | "papers">>): Song;
export declare function initInput(): InputState;
/** 整首歌最大的 token id（新 id 从它后面编；所有纸、所有声部一起算，id 全歌唯一）。 */
export declare function maxId(song: Song): number;
/** 第一条有内容的 track（第一张纸上第一个在场的声部）。 */
export declare function firstFocus(song: Song): Focus;
export declare function initState(song?: Song, at?: Focus): EditorState;
/** 某张纸上某声部的 token 串（没有这条 = 空）。 */
export declare function trackOf(song: Song, paper: string, part: string): Token[];
/** 第一张纸上第一个声部的那条（单 track 的歌就是「那串 token」；测试 / 读别家谱用）。 */
export declare const firstTrack: (song: Song) => Token[];
/** 光标所在的那条 track。 */
export declare const tr: (st: EditorState) => Token[];
/** 把一条 track 换掉（纯函数）。 */
export declare function withTrack(song: Song, paper: string, part: string, tokens: Token[]): Song;
/** 换到另一条 track（点了别的谱行 / 别的纸）：清选中、清本次输入记录；caret 默认放到那条的末尾。 */
export declare function setFocus(st: EditorState, paper: string, part: string, caret?: number): EditorState;
export declare const isTimed: (t: Token) => t is Timed;
export declare const isMark: (t: Token) => t is MarkTok;
/** 谱头 = 开头连着的记号；光标最左只能到它后面。 */
export declare function headLen(tokens: Token[]): number;
export declare const isWriting: (st: EditorState) => boolean;
/** 光标前最近的音符 / 休止（跳过小节线、调号）。 */
export declare function currentIndex(st: EditorState): number;
/** 下标 i 之前最近一个有音高的音（就近规则的参照）。 */
export declare function prevPitch(tokens: Token[], i: number): Pitch | null;
/** 空音高的音：显示和播放时沿用前一个有音高的音，什么都没有就是 HOME。 */
export declare function effectivePitch(tokens: Token[], i: number): Pitch;
/** 这个音上的全部音高（最高的在前 = pitch）；没音高 = []。 */
export declare const allPitches: (t: NoteTok) => Pitch[];
/** 一组音高 → 规范形：按 midi 从高到低、同 midi 去重；最高的 = pitch，其余 = chord（只有一个 = 不带 chord）。 */
export declare function withPitches(t: NoteTok, ps: Pitch[]): NoteTok;
/** 叠 / 拿掉一个音高（XOR；最后一个永远留着）。 */
export declare function toggleChordPitch(st: EditorState, i: number, p: Pitch): EditorState;
/** pad 的「叠」：往前一个音（有选中 = 选中的第一个音）上叠（挂着的升降一样用掉）。 */
/** 电脑键盘 Shift+1–7 = 叠一级上去（2026-10-10 user「shift旧的功能不要，shift用来叠音输入和弦，以及pc上面叠功能找不到了」）：
 *  叠到哪个音 = 同 stackPitch（有选区 = 写字头前那个 / 选区第一个音；没有 = 光标前那个音）；音高 = 这一级离那个音现有的几个音里最近的那个的位置（一样近取上面），
 *  所以 C → Shift+3 = E（上面）、G → Shift+3 = E（下面）、C E → Shift+5 = G。已经有这个音 = 去掉（XOR，同 pad「叠」）。 */
export declare function stackDegree(st: EditorState, degree: number): EditorState;
export declare function stackPitch(st: EditorState, pitch0: Pitch): EditorState;
/** 只有这一张纸的歌（本段视图的播放范围；user 2026-10-08「为什么在本段视图下播放还是播放全部了？」）。 */
/** 只要这一张纸（「本段」放 / 导出这一段）。点名要它 = 隐藏的也放（user 2026-10-08「隐藏的歌段在solo预览的时候还是应该可以放的」）：隐藏只管整首放 / 压平件跳过它。 */
export declare const songOnlyPaper: (song: Song, paperId: string) => Song;
/** 下标 i 处（i 之前最近的那个记号）生效的调号 / 拍号 / 速度（一条 track 内）。 */
export declare function keyAt(tokens: Token[], i: number): number;
/** 下标 i 处生效的调号写不写着「小调」。 */
export declare function keyMinorAt(tokens: Token[], i: number): boolean;
export declare function timeAt(tokens: Token[], i: number): {
    beats: number;
    beatType: number;
};
export declare function tempoAt(tokens: Token[], i: number): number;
/** 速度的「语义」：数据只存 bpm（绝对的那个数），词按 bpm 落在哪一档推出来，谱上画「词 ♩ = 数」
 *  （user「速度记号可以用语义+数字吗。绝对零度。」）。typical = 候选里点这个词时给的 bpm；档的边界是常见范围取的整数。 */
export declare const TEMPO_WORDS: {
    from: number;
    it: string;
    zh: string;
    typical: number;
}[];
/** 速度能写多少（♩ = 每分钟几个四分音符）：打字和速度框的滚轮同一个范围（user 2026-10-07「typing到400的话wheel也到400或者都300…反正对齐一点」）。
 *  上限 400：2/2 的快歌「二分音符 = 160」在这里是 ♩ = 320，bebop / 速核也过 300；唱歌本身用不到这么快，但没有技术理由卡。 */
export declare const TEMPO_MIN = 20, TEMPO_MAX = 400;
export declare function tempoWord(bpm: number): {
    it: string;
    zh: string;
};
/** 一拍多少 tick（符杠按拍分组用）：x/2 x/4 x/8 = 那个音符；3/8 6/8 9/8 12/8 这类复拍子 = 附点四分（三个八分连成一组）。
 *  v0.16.6 修：原来是「大于 3」，3/8 被漏掉 = 每个八分各一拍、三个不连（标准写法是一小节三个八分连成一组）；user 11-07「六八拍的支持能帮我补上去吗」核出来的。 */
export declare function beatTicks(beats: number, beatType: number): number;
/** 写的时候「1=」：跟谱 = 光标处的调号；手动 = 拨的那个（v0.16.9；原来这行注释写着「手动设过的，否则跟光标处的调号」但代码一直只有手动）。 */
export declare const inputKey: (st: EditorState) => number;
/** pad 的调式：跟谱 = 大调（调号只记了几个升降号，不知道是哪个调式）；手动 = 选的那个。 */
export declare const inputScaleOf: (st: EditorState) => string;
/** 下一个要写的音的时长 = 当前档 ×（连音比例）。 */
export declare function unitDur(input: InputState): number;
/** 只响不写（即兴）的那个音：带上挂着的 ♯ / ♭，「只管下一个音」的那一次照样用掉（user「升降号为什么对preview没用，也没有ui上面的反应」）。 */
export declare function soundingPitch(st: EditorState, p: Pitch): {
    pitch: Pitch;
    st: EditorState;
};
/** 写一个音（给定音高：pad / 指针）（v0.10.5，ai-docs/20261010-keyboard-selection-rules.md）：
 *  · 光标 = 写音默认覆盖休止（overwriteInsert：光标后紧挨着的休止先吃，不够才推后面的）；
 *  · 只选了一个音 / 休止 = 改这个音（XOR：叠上 / 拿掉，最后一个拿掉 = 一样长的休止，休止上按 = 变回音；mono = 单声乐器的声部，换音高不叠）；
 *  · 选了好几个 = 替换整段（选中的全变休止、收成开头的光标，再按覆盖休止写；新音接过原来第一个音的歌词）。
 *  raw = 音高已经带好了 ♯ / ♭（叠音判据「观望」后补写的那一下：按下时就算过一次 Shift 了），不再套、不再用掉 Shift。 */
export declare function writePitch(st: EditorState, pitch0: Pitch, raw?: boolean, mono?: boolean): EditorState;
/** 写一个音：调里第几级 + 方向（键盘数字 / QWERTYU / Shift；pad 也能走这里）。参照 = 落点前最近一个有音高的音。 */
export declare function writeDegree(st: EditorState, degree: number, dir: Dir, mono?: boolean): EditorState;
export declare function writeRest(st: EditorState): EditorState;
/** 只选了一个音 / 休止（= 改这个音）：它的下标；不是 = -1。选区里不占时值的记号不算。 */
export declare function singleSel(st: EditorState): number;
/** 曲级记号（力度字 / 渐强渐弱 / 风格）跟着它后面那个音（复制、清记号都这么算）。 */
/** 挂在后面那个音上的记号（力度 / 渐强渐弱 / 风格 / 踏板）：它们记在音的前面、管的是那个音起。一处定义——空纸写音落在它们后面、插小节线让到它们后面、
 *  复制带上第一个音身上的、符号退格先删、清掉曲级记号、打开时理顺纸头那一串，都按这一份（2026-11-12 踏板加进来时，四处各抄一份的漏了一处）。 */
export declare const isPhraseMark: (t: Token | undefined) => boolean;
/** 反复小节线（pad 符号层「反复」菜单）：光标紧挨着一条小节线（前面或后面）= 把它改成反复的（|: 和 :| 撞在同一条上 = :|:）；否则在光标处插一条。
 *  repeat = null = 改回普通小节线。times 只给 :|（一共放几遍，2 = 不写）。 */
export declare function setRepeatBar(st: EditorState, repeat: Repeat | null, times?: number): EditorState;
/** 段落线 ‖ / 终止线（v0.9.32）：光标挨着一条小节线（前面或后面）= 把它改成这种（反复去掉）；否则在光标处插一条。null = 改回普通小节线。 */
export declare function setBarStyle(st: EditorState, style: "double" | "final" | null): EditorState;
/** 房子 / 跳转记号：插在光标处（同调号 / 拍号 / 速度，是结构不是表情）。光标后面紧挨着小节线 = 插在小节线后面（房子从下一小节开头起）。 */
export declare function insertNav(st: EditorState, what: NavWhat, nums?: number[]): EditorState;
/** 选区里清掉记号（2026-10-10 user「批量修改，删除曲级（你之前分了曲级vs音符级）力度记号的方法，而不是得一个个手删 场景是我把人声的notes给复制到其他的轨里面之后，
 *  想把之前调校的力度和articulation给删了按新乐器的特性写」）。phrase = 曲级：力度字 / 渐强渐弱 / 渐到 / 风格（选区起点前紧挨着第一个音的也算，同复制）；
 *  note = 音级：演奏法 / 音头 / 音内起伏 / 连线 / 呼吸 / 出声的换气 / 气声；all = 两样。音、歌词、叠音、结构记号（调号拍号速度、反复、句号）不动。没东西可清 = 原样。 */
export declare function clearMarks(st: EditorState, which: "phrase" | "note" | "all"): EditorState;
export declare function writeBar(st: EditorState): EditorState;
/** 一个音的演奏法（按 ARTS 的顺序）。 */
export declare const artOf: (t: NoteTok) => Art[];
/** 开 / 关一种演奏法（空了 = 去掉 art 字段，存档不多出空数组）。 */
export declare function withArt(t: NoteTok, a: Art, on: boolean): NoteTok;
/** 选区里每种演奏法：都有 / 有的有 / 都没有（选区条的开关亮不亮）。 */
export declare function artStateSel(st: EditorState): Record<Art, "all" | "some" | "none">;
/** 选区里的音切一种演奏法：都有 = 都去掉，否则都加上（选区留着，接着改别的）。 */
export declare function toggleArtSel(st: EditorState, a: Art): EditorState;
/** 演奏法（pad 符号层：跳音 / 重音 / 保持 / 呼吸）：有选区 = 选中的音整组切（同选区条「修」）；没选区 = 光标前最近的那个音切
 *  （中间只隔着句号 / 力度 / 小节线这类不占时值的也算）；前面是休止或没有音 = 原样（返回 null 让界面说一声）。 */
export declare function toggleArtBefore(st: EditorState, a: Art): EditorState | null;
export declare const toggleBreath: (st: EditorState) => EditorState | null;
/** 出声的换气（轻吸 / 深吸）：给光标前那个音（有选区 = 选中的音）加一个听得见的呼吸——没有呼吸记号就连逗号一起加上；
 *  已经是这一档 = 整个呼吸去掉（同「再点 = 去掉」）；是另一档 = 换档。前面是休止 / 没有音 = null。 */
export declare function toggleInhaleBefore(st: EditorState, level: "soft" | "big"): EditorState | null;
/** 连线（选区）：选中的音连起来——前 n−1 个标「连到下一个」；只选了一个 = 它连到下一个音。都连着 = 都去掉。没选音 = 原样。 */
export declare function toggleSlurSel(st: EditorState): EditorState;
/** 连线（pad 符号层）：有选区 = 选区那样；没有 = 光标前最近的那个音连到下一个音（再点 = 去掉）；前面是休止 / 没有音 = null。 */
export declare function toggleSlurBefore(st: EditorState): EditorState | null;
/** 选区里的连线状态（「修」那一排的开关）：都连着 / 有些 / 没有。目标 = 同 toggleSlurSel（前 n−1 个；只选一个 = 它自己）。 */
export declare function slurStateSel(st: EditorState): "all" | "some" | "none";
/** 音内的力度起伏（pad 符号层）：有选区 = 选中的音都切成这个（都是 = 去掉）；没有 = 光标前最近的那个音切（再点 = 去掉，换一种 = 换）；前面是休止 / 没音 = null。 */
export declare function toggleSwell(st: EditorState, w: Swell): EditorState | null;
export declare function withSlur(t: NoteTok, on: boolean): NoteTok;
/** 第 i 个 token 那儿生效的力度（往前找最近的力度记号；没有 = mf）。 */
/** 第 i 个 token 那儿生效的力度记号（往前找最近的）；前面一个力度记号都没有 = null（= 用演奏者的默认力度，不当 mf 算）。 */
export declare function dynMarkAt(tokens: Token[], i: number): Dyn | null;
export declare function dynAt(tokens: Token[], i: number): Dyn;
/** 符号层的力度记号 / 渐强渐弱挂在哪个音（或休止）上（2026-10-08 深夜 Opus 5.5；AI 提「力度改成落在光标前那个音（和音头记号一样）」，user「做」）：
 *  有选区 = 选区里第一个音；没选区 = **光标前那个音**（写完一个音按 f = 这个音起是 f，同跳音 / 重音）；光标在最前面（前面没有音）= 后面第一个音。没有音 = -1。 */
export declare function markAnchor(st: EditorState): number;
/** 力度记号放在 markAnchor 那个音上：那儿已经有力度记号 = 改它；value null = 去掉。排在那儿的渐强渐弱前面（「mp <」的顺序）。 */
export declare function setDynSel(st: EditorState, value: Dyn | null, ramp?: boolean): EditorState;
/** 踏板（11-1）：第 at 个 token 之前这一种踏板踩着没有——从这条轨这张纸的开头照记号数（不起作用的不改状态；换踏板 = 踩着）。
 *  默认 = 抬着（乐手的默认 = 11-3，到时候从这里接）。和出声同一个读法（score/pedal.ts sustainSpans）。 */
export declare function pedalDownAt(toks: readonly Token[], at: number, which: PedalKind, startDown?: boolean): boolean;
/** 光标处（markAnchor 那个音）这一种踏板：那个音前面踩着没有（down，不算挂在它身上的那个）+ 它身上已经挂着的这一种的记号（mark）。符号层「踏板」小菜单的字跟着它。 */
export declare function pedalHere(st: EditorState, which: PedalKind, startDown?: boolean): {
    down: boolean;
    mark: PedalTok | null;
} | null;
/** 符号层「踏板」（11-1，设计稿第 6 节）：踏板记号挂在 markAnchor 那个音上（同力度：写完一个音按 = 从这个音起）。
 *  那个音上已经有同一种踏板的记号：同一个动作 = 去掉（再按一下撤回），别的动作 = 改成这个。有选区 = 「把这一段踩住」：选区第一个音前面踩下、选区后面抬起（act 不看）。
 *  回 idle = 写上的那个不起作用（这里本来就踩着又踩 = "already"；本来没踩又抬 = "notDown"）：照写、画灰，调用方说一句为什么。 */
export declare function insertPedal(st: EditorState, which: PedalKind, act: PedalTok["act"], startDown?: boolean): {
    st: EditorState;
    did: "added" | "changed" | "removed" | "span" | "none";
    idle?: "already" | "notDown";
};
/** 渐强 / 渐弱记号放在 markAnchor 那个音上（从这个音起）：那儿已经有同方向的 = 去掉，反方向的 = 换。 */
export declare function toggleHairpin(st: EditorState, dir: "cresc" | "dim"): EditorState;
/** 风格记号（拍子轻重；2026-10-08 深夜 Opus 5.5）：放在光标前那个音上（同力度记号 / 渐强渐弱，markAnchor）——从这个音起到这张纸结尾（或下一个风格记号）。
 *  那儿已经有一个：同一个风格 = 去掉，别的 = 换（幅度留着）。 */
export declare function setGroove(st: EditorState, style: string): EditorState;
/** 渐到（2026-10-08 深夜 Opus 5.5）：下标 i 那个力度记号后面，这张纸里（到 end 为止）下一个力度记号写着渐到、中间没有手写的渐强渐弱 = 它的下标；否则 -1。 */
export declare function rampTarget(tokens: Token[], i: number, end?: number): number;
/** 渐到的起点：下标 j 那个（写着渐到的）力度记号前面，这张纸里（从 start 起）上一个力度记号的下标。
 *  没有 = "none"（前面没有力度记号，渐到不起作用）；中间隔着手写的渐强渐弱 = "hairpin"（手写的说了算，渐到不起作用）。 */
export declare function rampSource(tokens: Token[], j: number, start?: number): number | "none" | "hairpin";
/** markAnchor 那个音上写着的力度记号（没有 = null；选区条 / 符号层上亮哪一个）。 */
export declare function dynMarkSel(st: EditorState): Dyn | null;
/** 纸隐藏 / 显示（隐藏 = 不放；谱上还在、折叠着）。 */
export declare function setPaperHidden(st: EditorState, paperId: string, hidden: boolean): EditorState;
/** 在光标处（有选中 = 选中开头）插一个记号。插的地方前后连着的记号里已有同类 → 改它，不再插一个（谱头就是这样被改的）。
 *  返回记号的下标，fresh = 新插的（界面打开它的编辑框；没改值就关 = 撤掉）。 */
export declare function writeMark(st: EditorState, v: MarkVal): {
    st: EditorState;
    index: number;
    fresh: boolean;
};
/** 换调号（插一个调号记号）。 */
export declare const writeKey: (st: EditorState, fifths: number) => EditorState;
/** 改一个记号的值（种类不变）。输入的「1=」不跟着变（输入设备自己的调）。 */
export declare function setMark(st: EditorState, i: number, v: MarkVal): EditorState;
/** 一处在 track 里的范围 [a, b)；head = 这张纸开头那一处。 */
export interface HeaderSpot {
    a: number;
    b: number;
    head: boolean;
}
/** i 所在 / 紧挨着的那一处：往两边扩到不是谱号 / 调号 / 拍号 / 速度为止；两个音之间的空地 = 空的一处（a = b）。挨着纸开头 = 开头那一处。 */
export declare function headerSpot(tokens: Token[], i: number): HeaderSpot;
/** 这一处写着的（没写 = null）。 */
/** minor = 这一处的调号写着「小调」（没有调号 = null）。 */
export interface HeaderVals {
    clef: ClefName | null;
    key: number | null;
    minor: boolean | null;
    time: {
        beats: number;
        beatType: number;
    } | null;
    tempo: number | null;
}
export declare function headerVals(tokens: Token[], spot: HeaderSpot): HeaderVals;
/** 改这一处：没写的项不动，null = 去掉（开头的调号 / 拍号 / 速度去不掉）。这一处理成 调号 → 拍号 → 速度 → 谱号 的顺序（纸开头只能由调号 / 拍号 / 速度打头），
 *  原来的记号留着 id。改调号 = 它管的音按新调号拼写；改开头的速度 = 这张纸每一行写齐（同 setMark）。光标在这条 track 上 = 跟着挪。 */
export type HeaderPatch = Partial<HeaderVals>;
export declare function setHeaderAt(st: EditorState, paperId: string, partId: string, spot: HeaderSpot, patch: HeaderPatch): EditorState;
/** 纸开头切大调 / 小调（v0.16.83）：这张纸上开头调号和这一行一样的声部一起切（大调小调是这段音乐的事，不是某件乐器的事），
 *  调号不一样的不动。一步撤销（返回一个新状态）；n = 改了几行（含这一行），面板照实说。 */
export declare function setPaperHeadMinor(st: EditorState, paperId: string, partId: string, minor: boolean): {
    st: EditorState;
    n: number;
};
/** 这一段这个声部纸头手选的谱号（纸开头那一处的谱号记号；没有 = null = 自动 / 大谱表）。 */
export declare function headClefOf(tokens: Token[] | undefined): ClefName | null;
/** 换掉一张纸的 looks（空的条目、空的表都不留）。 */
export declare function withLooks(p: PaperSeg, looks: Record<string, PartLook>): PaperSeg;
/** 这一段这个声部怎么画：grand / autoOttava（true = 默认 = 不存）。没变 = 原样（不多记一步撤销）。 */
export declare function setPaperLook(st: EditorState, paperId: string, partId: string, patch: {
    grand?: boolean;
    autoOttava?: boolean;
}): EditorState;
/** 选谱号（v0.16.88，user 11-09「可以高音低音grand用户每个sheet选」「一开始是auto」）：一个谱号 = 纸头写一个谱号记号；自动 / 大谱表 = 纸头不写谱号记号。一步撤销。 */
export declare function setClefChoice(st: EditorState, paperId: string, partId: string, choice: ClefChoice): EditorState;
/** 删一个中途的记号（谱头的删不掉）。 */
export declare function deleteMark(st: EditorState, i: number): EditorState;
/** 「−」：写的时候 = 刚写的那个音加一份它写入时的单位（先吃后面紧挨着的休止，不够才推；v0.10.5）；中间隔着小节线 = 新开一个 tie 着的同音。
 *  half = pad 的「/2」开着：加**半份**（八分 + 半份 = 附点八分；接着再写一个减半的音 = 附点八分 + 十六分，凑满两份原来的）。
 *  只选了一个音 = 长一步（一步 = 长短旋钮现在那一档）；选了好几个 = 不动（整组改时值在选区条里）。 */
export declare function extend(st: EditorState, half?: boolean): EditorState;
/** 退格：只选了一个音 = 短一步（v0.10.5；user「不，我说的就是退格，不过在这个context下面可以改图标」）；选了好几个 = 删选中；
 *  写的时候 = 撤回本次输入记录的最后一笔（写的时候吃掉的休止原样放回去，后面不挪），记录空了就删光标前一个 token。 */
export declare function backspace(st: EditorState): EditorState;
export declare function deleteForward(st: EditorState): EditorState;
/** 长短基线直接设成这么长（pad 的长短旋钮 / 滚轮、/2）。带附点的档不连音：连音顺手去掉（说一句归宿主）。 */
export declare function setLen(st: EditorState, len: number): EditorState;
/** 光标这里（这个声部、光标处的拍号）长短旋钮上的档（短 → 长）。 */
export declare function lenStepsAt(st: EditorState): number[];
/** 长短 = 输入档位（接下来写的长短；沿光标这里的档走一档，不在表上 = 往那个方向最近的一档；到头不动）。有选区也一样——
 *  整组改时值 = 选区菜单 scaleSelDur / setSelDur；2026-10-08 user「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单」。 */
export declare function shorter(st: EditorState): EditorState;
export declare function longer(st: EditorState): EditorState;
/** 选区菜单「÷2 / ×2」：选中的音 / 休止都乘这个数（超出全音符 / 三十二分的那个不动）。 */
export declare function scaleSelDur(st: EditorState, f: 0.5 | 2): EditorState;
/** 附点（选区那一排微调，v0.10.1）：选中的都带附点 = 都去掉；否则不带附点的普通时值都加上（连音等别的时值不动）。 */
export declare function toggleSelDot(st: EditorState): EditorState;
/** 连音：设成 0 / 3 / 5 / 6 / 7（锁定式；候选由界面弹）。 */
export declare function setTuplet(st: EditorState, n: InputState["tuplet"]): EditorState;
/** ♯ / ♭ Shift：关 → 一次；一次且 350 ms 内再点 → 锁；其余 → 关。有选中 = 选中的音直接升降半音。 */
export declare function tapAcc(st: EditorState, acc: Exclude<Acc, 0>, now: number): EditorState;
/** 直接设升降 Shift 的状态（pad 升降键按住 / 滑着换的时候用；accAt 不动，连点判定照旧）。 */
export declare function setAccState(st: EditorState, acc: Acc, mode: InputState["accMode"]): EditorState;
/** 「1=」：只管输入（user「after you change the 1=???, the original inputted note should not be changed」）。 */
export declare function setInputKey(st: EditorState, fifths: number): EditorState;
/** pad 的调式：只管 pad 上排哪些音。 */
export declare function setInputScale(st: EditorState, id: string): EditorState;
/** 选中的音 / 休止全部改成长短旋钮现在那一档（选区菜单「都改成 ♪」；连音跟 pad 现在的连音设置）。 */
export declare function setSelDur(st: EditorState): EditorState;
export declare const stepTarget: (st: EditorState, steps: number) => EditorState;
export declare const alterTarget: (st: EditorState, d: number) => EditorState;
export declare const octaveTarget: (st: EditorState, d: number) => EditorState;
/** 移调：选中的音整体移几个半音，按各自所在的调重新拼写；调号不动。 */
export declare function transposeSel(st: EditorState, semis: number): EditorState;
/** 按调号拼写（选中的一段）：调内的音换成调号里的写法，调外的不动；音高不变（已经写下的谱用它收拾，比如五个升号的调里全写成降号的）。 */
export declare function respellSel(st: EditorState): EditorState;
/** 转调：选中的一段从开头生效的调转到 toFifths——音按两个主音之间的音程挪（就近方向，拼写关系不变），
 *  选中开头的调号改成新调（旁边已有调号 = 改它；从歌开头选 = 改谱头），选中后面插回原来的调（后面本来就有调号的不插）；
 *  选中里面的调号跟着一起挪。选中保持在挪过的那一段上。 */
export declare function modulateSel(st: EditorState, toFifths: number): EditorState;
/** 参照调 = 范围里第一张纸开头、最上面那位在场歌手那一行的调号（同速度记号的规矩）。 */
export declare function scopeKey(song: Song, paperIds: readonly string[]): number;
/** 移调 semis 个半音之后，参照调变成哪个（升降号少的写法）。 */
export declare const keyAfterSemis: (f0: number, semis: number) => number;
/** 几张纸上所有声部一起移调 / 转调。how = { semis }：整体挪几个半音（调号跟着挪，取升降号少的写法；±12 = 挪八度、调号不变）；
 *  { toFifths }：参照调转到这个调（音按两个主音之间的音程挪，就近方向）。范围里每个调号（谱头的、中途的）挪同样的量，
 *  音按同一个音程挪（拼写关系不变），挪完按各自的调号简化拼写。skip = 不动的声部（台上固定敲一个键的：谱上的音高不拿来出声）。
 *  只改音高和调号：不插不删 token，光标 / 选区原样；歌词、记号、谱号、八度线不动。 */
export declare function transposePapers(st: EditorState, paperIds: readonly string[], how: {
    semis: number;
} | {
    toFifths: number;
}, skip?: ReadonlySet<string>): EditorState;
/** 放光标（= 写）：清选中、清本次输入记录。 */
export declare const setCaret: (st: EditorState, caret: number) => EditorState;
/** 光标放到这条 track 尾巴后面补齐的淡色小节里（v0.10.6）：lead = 离尾巴多少 tick（点的那个小节的开头）；0 = 就是尾巴。 */
export declare const setCaretLead: (st: EditorState, lead: number) => EditorState;
/** 在第 i 个 token 前面写音高 p，谱上要画的临时记号（v0.10.23「弹」的鬼音符用；user「鬼音符应该按照对应的谱号和临时升降号来显示升降号。和对应的真音符要一致」）：
 *  和排版（engrave.ts unitsOf）同一个规矩——按调号 + 这一小节里前面同一个音级出现过的临时记号；每小节（自动 / 人插的小节线、换拍号、换调号）重新算；
 *  连音线连过来的、跨过小节线那后半截不算。返回要画的 alter（0 = 还原号）；不用画 = null。 */
export declare function shownAccAt(tokens: Token[], i: number, p: Pitch): number | null;
/** 写之前把 lead 落成休止：先补满尾巴所在的小节，再一小节一个（整小节休止），最后剩的一截。光标在新休止后面。 */
export declare function materializeLead(st: EditorState): EditorState;
/** 选中一段（= 改）。 */
export declare function select(st: EditorState, from: number, to: number): EditorState;
export declare function moveCaret(st: EditorState, d: number): EditorState;
/** 删音之后：不再管任何音的力度记号 / 渐强渐弱「湮灭」（2026-10-08，user「大批量删音的时候会不会堆一堆强度符号…p f删第二个音，会变成，你觉得是p还是f?」）：
 *  两个力度记号之间一个音都没有 = 前面那个不管任何音，去掉，留后面那个（p A f B C 删掉 A、B → 留 f，C 本来就在 f 下面）；
 *  渐强渐弱和它的终点（下一个力度记号 / 下一个渐强渐弱 / 谱尾）之间一个音都没有 = 去掉。返回去掉了几个、各在哪（下标，按原来的串）。 */
export declare function annihilate(tokens: Token[], before?: readonly Token[]): {
    tokens: Token[];
    removed: number[];
};
/** 长按拖力度记号 / 渐强渐弱（2026-10-08 Opus 5.5；user 批「力度和渐强渐弱能长按拖动」）：下标 from 的记号挪到下标 before 那个音（或休止）前面 = 从那个音起。
 *  力度放在那儿已有的渐强渐弱前面（「mp <」的顺序），渐强渐弱放最后；挪完湮灭——落到已经有力度记号的音上 = 挪过去的那个算数、原来那个去掉。
 *  removed = 湮灭掉了几个（调用方说一声）。没挪动（同一个音 / 不是这两种记号）= 原样。选区收掉，光标跟着同一个音。 */
export declare function moveMark(st: EditorState, from: number, before: number): {
    st: EditorState;
    removed: number;
};
/** 力度记号挪到这一段（这张纸这条轨）最后一个音的后面 = 「到这里为止变到这个力度」（7-N，2026-11-12；user 新版 Once upon a Tale：军鼓滚到这张纸结束、后面没有音可以挂 fff）。
 *  出声这一头本来就认（dynLevels：终点后面没有音 = 取前一个音的结尾）；排版两种谱都画、MusicXML 往返还在、删音的湮灭不吃单独挂在最后的——2026-11-12 核过三处。
 *  放在最后一个音 / 休止后面那串记号的最后（这样那里原来有的力度记号被湮灭、挪过去的算数）；后面的小节线照旧在后面。只挪力度记号；已经在那儿 = 原样。 */
export declare function moveMarkToEnd(st: EditorState, from: number): {
    st: EditorState;
    removed: number;
};
/** 这个力度记号是不是已经挂在这一段最后一个音后面（后面没有音 / 休止了）。 */
export declare const markAtEnd: (toks: readonly Token[], i: number) => boolean;
/** 渐强渐弱（手写的发夹）「变到」：把终点的力度写到这条发夹现在结束的地方（7-N 补，统筹 2026-11-12；user「怎么样在后面加一个符号？」）。
 *  终点 = 后面第一个力度记号 / 下一条发夹 / 这一段结尾（同 perform.ts hairpinEnd）。target：
 *  · 一档力度：结束在力度记号上 = 改它的值（changed）；结束在下一条发夹前 = 在那儿放一个（beforeHairpin）；结束在这一段结尾 = 挂在最后一个音后面（end，同「挪到这一段结尾」那一种）。
 *  · null = 走一档（没写终点的做法）：终点是挂在这一段结尾的力度记号 = 去掉它（removed）；终点是还管着后面音的力度记号 = 不动（blocked：去掉它会改到别的音，要用它自己的菜单）。
 *  不加新的存法：终点就是一个普通的力度记号。纯函数，一步。 */
export declare function setHairpinTarget(st: EditorState, i: number, target: Dyn | null): {
    st: EditorState;
    did: "changed" | "beforeHairpin" | "end" | "removed" | "none" | "blocked";
};
/** 点力度记号 / 渐强渐弱的小菜单：改成别的力度 / 换方向；null = 删掉（光标跟着）。 */
export declare function editMarkAt(st: EditorState, i: number, change: {
    value: Dyn;
} | {
    dir: "cresc" | "dim";
} | {
    ramp: boolean;
} | {
    style: string;
} | {
    amount: number;
} | {
    shift: boolean;
} | {
    nav: Exclude<NavWhat, "ending">;
} | {
    nums: number[];
} | {
    act: PedalTok["act"];
} | null): EditorState;
/** 符号模式的退格（2026-10-08，user「退格只删符号或者没符号的时候退一步，不删音符」）：
 *  ① 光标前面紧挨着的不占时值的记号（力度 / 渐强渐弱 / 句号 / 中途的调号拍号速度）→ 删最后一个；
 *  ② 没有 = 挂在光标前那个音上的力度 / 渐强渐弱 / 风格（紧挨在它前面），再是那个音身上的装饰，一次一个、从最外层开始：音内起伏 → 音头（强音 / 重音 / 突强 / 强后即弱）→ 保持 → 跳音 → 气声 → 出声的换气 → 呼吸 → 连线；
 *  ③ 都没有 = 光标往回一步。永远不删音。 */
export declare function symBackspace(st: EditorState): EditorState;
/** Shift+←→：从光标（或已有选中）往一边扩一个 token。 */
export declare function extendSelection(st: EditorState, d: number): EditorState;
/** Shift+Home / Shift+End：从光标（或已有选中的另一头）选到开头 / 末尾（配 Home 就是全选）。 */
export declare function selectToEdge(st: EditorState, d: -1 | 1): EditorState;
/** Esc：写 → 选中光标前那个 token（改）。 */
export declare function escape(st: EditorState): EditorState;
export declare function setNote(st: EditorState, i: number, patch: Partial<Pick<NoteTok, "pitch" | "dur" | "lyric" | "hyph">>): EditorState;
/** 换掉一个音的全部音高（拖和弦里某一个符头 = 只换那一个，别的不动；按高低重排、去重同 withPitches；v0.17.48）。 */
export declare function setPitches(st: EditorState, i: number, ps: Pitch[]): EditorState;
export declare function setDur(st: EditorState, i: number, dur: number): EditorState;
/** 换纸（整首歌一个；17-1）：选了 = 写具体的那一种（选的正好是跟着软件时用的那一张也一样写，「跟着软件」走 src/look withLook）。
 *  **换纸只换纸**：舒适 / 紧凑和谱高原样带着走（统筹 2026-11-12 裁定，施工单 7-C）；边距跟着纸（别家的谱带来的边距换了纸就不算数了 = 回到 "default"）。 */
export declare function setPaper(st: EditorState, kind: PaperKind): EditorState;
/** 舒适 / 紧凑（整首歌一个；17-1）：选了 = 写具体的那一档；谱高回到跟着这一档（别家的谱带来的谱高不再算数）。纸和边距不动。 */
export declare function setDensity(st: EditorState, d: Density): EditorState;
/** 改作者栏（每行去掉行尾空白、去掉头尾空行；全空 = 不填）。 */
export declare function setCredits(st: EditorState, text: string): EditorState;
/** 这首歌自己的许可（空 = 不声明）。 */
export declare function setRights(st: EditorState, text: string): EditorState;
/** 编排那一行（空 = 不写 = 每张纸按顺序各放一遍；src/score/arrange.ts）。 */
export declare function setArrangement(st: EditorState, text: string): EditorState;
export declare function setTitle(st: EditorState, title: string): EditorState;
/** 一张纸的速度看谁：这张纸上在场的、全曲顺序里最上面那位（速度记号只写在它那一行）。 */
export declare function tempoOwner(song: Song, paper: PaperSeg): string | null;
/** 一张纸开头的速度（看 tempoOwner 那一行的谱头）；纸上没人 = null。 */
export declare function sheetStartBpm(song: Song, paper: PaperSeg): number | null;
/** 一张纸结尾生效的速度（tempoOwner 那一行走到底）。 */
export declare function sheetEndBpm(song: Song, paper: PaperSeg): number | null;
/** 加一个声部 = 加一位歌手（**声部就是歌手**：一个声部绑一个角色、一个麦克风，跨纸按它连起来；2026-10-08 user「嗯声部就是歌手」）。
 *  只在 onPaper 这张纸上给它一条只有谱头的 track（谱头抄那张纸第一个在场声部的开头；user「新歌手只出现在当前这张纸嗯」——此前是每张纸都给）；
 *  onPaper = null = 哪张纸都还没有它（「交给新歌手」：接着 rebindTrack 把一条交给它）。在全曲的顺序里排最后。光标跳到它那条（有的话）。
 *  role / mic 的 id 由调用方（休息室 / 录音房）配好。 */
/** after = 插在哪位歌手后面（默认 = 光标所在的那位；找不到 = 加在最后）：user 2026-10-10「加歌手的时候应该是insert next而不是append last」。 */
export declare function addPart(st: EditorState, part: PartDef, onPaper?: string | null, after?: string | null): EditorState;
/** 换绑：这张纸上 from 那一行交给 to 这位歌手（音、歌词、记号原样，只换主人；只改这一张纸。user 2026-10-08「已有的track绑换不同的声部」）。
 *  to 在这张纸上已经有一行 = 两行对调主人（一张纸上一位歌手最多一行；什么都不丢）。光标跟着那一行走（同一个位置）。 */
export declare function rebindTrack(st: EditorState, paperId: string, from: string, to: string): EditorState;
/** 删一个声部（最后一个不能删）：所有纸上它那条一起没了。 */
export declare function removePart(st: EditorState, partId: string): EditorState;
/** 声部上下挪一格（谱上从上到下 = Song.parts 的顺序；user 2026-10-08「声部顺序应该能重排」）。每张纸、每条 track 都不动，只换顺序。
 *  速度只看每张纸最上面那一行（tempoOwner）；挪了谁在最上面，每张纸开头的速度照旧（keepSheetTempos 把各行谱头写齐）。 */
/** 每张纸（曲段）开头强制写明力度（v0.10.39；user wishlist「强制要求开头有力度标记」→「每张纸（曲段）开头，对」）：
 *  每位歌手在每张纸上第一个音之前没有力度记号 = 在第一个音前面补一个——**补的是这里本来就生效的那个**（这位在前一张纸（歌里的顺序）最后一个力度；最前面 = mf，同播放的默认），听起来不变。
 *  **补在哪**（第八刀 8-7，统筹 2026-11-12 定）：第一个音前面紧挨着的那一串曲级记号（渐强渐弱、渐到、风格、力度）的最前面——同一个音前面力度在渐强渐弱前面（挪记号那条老规矩）。
 *  v0.10.39 起补在了第一个音紧前面：那一串里本来有渐强渐弱时就成了「渐强渐弱、力度、音」，渐强渐弱和它的终点（补的力度）之间一个音都没有 = 出声上不起作用，谱上发夹从力度字底下起。
 *  返回补了哪几处（纸 / 歌手 / 下标）。纯函数：main 在每次改谱（update，document 的 normalize）时过一遍；**开歌时不补也不理顺**（第 16 条 16-2 / 16-3：开文件时不顺手改；原来开歌时还会把排在渐强渐弱后面的力度挪到前面，那一支删了）——
 *  改谱的时候不动别的记号的先后（光标前放风格记号再开它的小菜单，靠的就是刚放的那个在原处；E2E groove 抓到的）。 */
export declare function ensureStartDyns(song: Song, nextId: number): {
    song: Song;
    nextId: number;
    added: {
        paper: string;
        part: string;
        index: number;
    }[];
};
/** 一家挨在一起（v0.10.36）：每位主人后面紧跟它的房客（房客之间、各家之间原来的先后不变）。读档 / 挪 / 挂的时候都理一遍——
 *  以前房客没挨着主人时「挪」把它当成单独一块越挪越散，混音台卡片跟着乱序（user「卡片排序在有合租的时候有问题会乱序，可能合租的时候没有正确排好序」）。 */
export declare function familyOrder(parts: readonly PartDef[]): PartDef[];
export declare function movePart(st: EditorState, partId: string, d: -1 | 1): EditorState;
/** 合租：partId 挂到 host 的谱线上（host = null = 搬出来自己一行）。主人不能是房客、不能挂自己、有房客的不能再去当房客；挂上 = 排到主人那一家最后（v0.10.24）。 */
export declare function setPartHost(st: EditorState, partId: string, host: string | null): EditorState;
/** 这张纸上加上某个（歌里已有的）声部：一条只有谱头的 track（谱头抄这张纸第一个在场声部的开头）。user 2026-10-08「每个sheet的track数量当然不同」。 */
export declare function addTrack(st: EditorState, paperId: string, partId: string): EditorState;
/** 这张纸上去掉某个声部的那条 track（纸上最后一条不能去）。声部本身还在歌里（别的纸照旧）。 */
export declare function removeTrack(st: EditorState, paperId: string, partId: string): EditorState;
/** 新的一张纸（接在 after 后面；没给 = 最后；before = 插在 at 前面，v0.16.19 纸 ⋯「在上面插一段」）：每个声部一条只有谱头的 track，谱头照抄上一张纸那个声部结尾时的调号 / 拍号 / 速度
 *  （契约 §6¾：速度每张纸开头明确写一个，新建时照抄上一张纸结尾的；插在第一张前面 = 照抄第一张开头的谱头）。光标跳到新纸上当前声部。 */
export declare function addPaper(st: EditorState, after?: string, before?: string): EditorState;
/** 复制一张纸（v0.16.61，user 11-09「需要加一个duplicate曲段的功能」）：整张纸（所有声部的轨 + 隐藏与否）照抄一份插在它后面；
 *  每个记号换新编号（同一首歌里不重号；记号之间没有按编号互相引用的）；名字 = name（调用方给，界面字「X 副本」）；光标跳到新纸、同一个声部。 */
export declare function duplicatePaper(st: EditorState, paperId: string, name: string): EditorState;
/** 删一张纸（最后一张不能删）。 */
export declare function removePaper(st: EditorState, paperId: string): EditorState;
/** 纸挪一位（上 / 下）。 */
export declare function movePaper(st: EditorState, paperId: string, d: -1 | 1): EditorState;
/** 小节号印不印（v0.9.42；默认每行开头印）。 */
export declare function setBarNumbers(st: EditorState, on: boolean): EditorState;
/** 歌词怎么排（v0.9.40）：按节奏（默认）/ 按歌词。 */
export declare function setLyricFit(st: EditorState, v: "lyrics" | "rhythm"): EditorState;
/** 谱号记号插在光标处（有选区 = 选区开头）；光标前紧挨着就是一个谱号记号 = 改它（v0.9.28）。 */
export declare function insertClef(st: EditorState, clef: ClefName): EditorState;
/** 八度线插在光标处（有选区 = 选区开头起、选区尾结束）；光标前紧挨着就是一个八度线记号 = 改它（v0.9.28）。 */
export declare function insertOttava(st: EditorState, shift: -1 | 0 | 1 | 2): EditorState;
/** 改 / 删某张纸某个声部第 i 个 token（谱号记号 / 八度线记号；null = 删）。光标所在 track 的光标跟着挪。 */
export declare function setDisplayMark(st: EditorState, paperId: string, partId: string, i: number, value: ClefName | -1 | 0 | 1 | 2 | null): EditorState;
/** 大谱表：每个 token 落在上（1）还是下（2）谱表——按音高自动（中央 C 以下 = 下），手动指定的优先；休止 / 记号跟前一个音。单谱表 = 全 1。 */
export declare function autoStaffs(tokens: Token[], staves: 1 | 2): Staff[];
export declare function staffOfTokens(tokens: Token[], staves: 1 | 2): Staff[];
/** 「换谱表」：选中的音 / 刚写的音挪到另一张谱表（手动指定）；已经手动指定的 = 取消指定（回到按音高自动）。 */
export declare function toggleStaff(st: EditorState, staves: 1 | 2): EditorState;
/** 改曲段名（纸顶那一条；空 = 不填）。 */
export declare function setPaperName(st: EditorState, paperId: string, name: string): EditorState;
export interface TimedAt {
    index: number;
    tok: Timed;
    start: number;
    inBar: number;
    bpm: number;
    t0: number;
    t1: number;
    /** 摇摆（v0.9.36）：起 / 止被扭了多少（tick；正 = 往后）。没摇 = 没有这两个字段（旧歌逐样本不变）。月读的唱谱按它换算长度（lab-score.ts）。 */
    dw0?: number;
    dw1?: number;
}
/** 速度表：tick → 从这里起的 bpm（第一个声部压平后的速度记号；其余声部按它算秒数，自己串里的速度记号不算数）。
 *  swing / origin（v0.9.36，摇摆；groove.ts timeMapOf 加）：从这里起一拍里前一个八分占多少（0 = 直），拍的网格从 origin 起数（弱起已经对齐到小节线）。 */
export type TempoMap = {
    tick: number;
    bpm: number;
    swing?: number;
    origin?: number;
}[];
/** 摇摆的时间扭曲（v0.9.36；user 2026-10-10「全量摇摆同意，放在一号轨？」）：一拍（四分音符）里前一个八分占 r（0.5 = 直、≈0.667 = 三连音感），拍头拍尾不动；
 *  拍内分段线性（前半拍拉到 r、后半拍压到 1 − r），十六分跟着一起扭。返回 tick 位置 T 被挪了多少（tick）。三种演奏者（乐器 / 元音版 / 月读）都走这一个。 */
export declare function swingDelta(T: number, origin: number, r: number): number;
export declare function timeline(tokens: Token[], tempoMap?: TempoMap): TimedAt[];
/** 一条 track 的总长（tick）。 */
export declare const trackTicks: (tokens: Token[]) => number;
/** 一张纸的长度 = 上面最长的那条 track（纸界 = 硬对齐点，短的补到这么长）。 */
export declare const paperTicks: (p: PaperSeg) => number;
/** 一个声部压平成一串（播放 / 派生的 score.musicxml 用）：各纸按序接起来，后面纸的谱头记号变成中途的记号；
 *  某张纸没这个声部 = 只有谱头（抄这张纸第一个在场声部的）+ 整纸休止；短的补休止到纸的长度。starts = 每张纸在这串里从哪个下标起。 */
/** opts.order = 编排展开后的放的顺序（纸 id，可以重复；src/score/arrange.ts）：照它接；没给 = 每张不隐藏的纸按顺序各一遍。
 *  同一张纸第二次起：音 / 记号抄一份、换负 id（压平件里 id 不重复；不落地）。 */
export declare function flattenPart(song: Song, partId: string, opts?: {
    tempo?: boolean;
    order?: readonly string[];
}): {
    tokens: Token[];
    starts: {
        index: number;
        paper: PaperSeg;
    }[];
};
/** 第一个声部的速度表（压平后的速度记号按 tick 列出来；别的声部按它算秒数）。 */
export declare function tempoMapOf(song: Song, order?: readonly string[]): TempoMap;
/** 每个小节（两条小节线之间）实际拍数和那里的拍号是否对得上——只用来轻标，不拦（家规：不许规训）。 */
export declare function barFill(tokens: Token[]): {
    from: number;
    to: number;
    ticks: number;
    full: boolean;
}[];
