/** 这一版能读写的各份文件的版本号（改格式 = 这里 +1 + migrate + 冻结样本；守卫测试盯着）。
 *  lounge 2（2026-10-07 深夜，user「现在开始好好做乐器这个数据结构，不要偷懒」）：候选从「月读形状 + 贴字段」改成按引擎分的乐器。
 *  manifest 2 / score 2（2026-10-08，0.5.0 多声部多纸，存法 B）：纸的顺序表 + 声部并集；每张纸一份 MusicXML 正本，score.musicxml 变派生件。 */
export declare const FORMAT: {
    readonly manifest: 2;
    readonly score: 2;
    readonly lounge: 2;
    readonly studio: 2;
};
export type FormatFile = keyof typeof FORMAT;
/** 家族格式版本纪律（2026-10-21，家族根 ai-docs/20261021-format-version-discipline.md；user「版本纪律能做成 catsup moonsinger 一样不同 component 有自己的拍子…这个变成全家的版本纪律」「三级语义 同意」）：
 *  `version` = major（整数拍照旧：不可兼容 / 重大安全问题才 +1；老读者只认它，比自己新 = 拒开），再加两个可选整数键 `minor` / `patch`（缺 = 0）：
 *  minor +1 = 加了可选字段 / 新的子表 / 新的默认行为（老读者能开能改能存、未知键原样带回、告诉用户一次）；patch +1 = 写法 / 默认值修正（老读者静默）。
 *  minor 1 = 追认 major 2 之后加过的所有可选字段（2026-10-08 → 10-21：manifest 的 core / final / finalRev / sounds；score 的 view / arrangement / lyricFit / barNumbers / parts.clef / host / autoOttava、
 *  papers 的 phrases / swells / hidden；lounge 的 articulation / chain / defaults 那些；studio v2 的 master.chain / bypass / sends / dry…）——以前写的文件没有这两个键 = 0.0，读起来一样。
 *  出声内容的指纹（渲染缓存的钥匙；以前是定稿的记录）不看 minor / patch（project.ts fpTextOf）。改 minor / patch 不用迁移、不用冻结样本，只跑 freeze-format-sample 更新形状快照。added 2026-10-21 by Claude Fable 5.1 */
/** score minor 2（v0.16.73，2026-11-09 Claude Opus 5.5）：parts[].brokenChords（可选，只写 false = 这位不认分解和弦）——老版本读进来会丢掉它（parts 按歌重建），所以照纪律 +1、让老版本提示一次。 */
/** score minor 3（v0.16.83，2026-11-10 Claude Opus 5.5；user 11-10 同意往歌里加）：调号上的「小调」= 每张纸 MusicXML 里 <key><mode>minor</mode>（大调照旧不写）。
 *  老版本读进来当大调、存一次就没了（音不丢），所以 +1、让老版本提示一次。这一轮后面几样（挑过的和弦名、每段的谱号 / 大谱表）也算在 minor 3 里。 */
/** score minor 4（v0.16.88，2026-11-10 Claude Opus 5.5；user 11-10「一同意」）：谱号 / 大谱表 / 自动八度线从声部搬到每一段——
 *  手选的大谱表 = 那张纸自己的 <staves>2（以前每张纸都写）、这一段关了自动八度线 = papers[].autoOttava（声部 id → false）、手选的谱号 = 纸头谱号记号；
 *  parts[].clef 照旧写 "auto"（给旧版本看），parts[].autoOttava 不再写。读：minor < 4 = 老写法，搬到每一段（project.ts songFromReads）。
 *  旧版本打开：手选了大谱表的声部整首成大谱表、每段关的自动八度线回到开着，音不丢，提示一次。 */
/** 复查（2026-11-10 Claude Fable 5.2；user「看一下文件格式的设计是否干净，还是乱。吃书是允许的」）——拿正式版 v0.15.5、v0.16.82、v0.16.87 的真代码当读者 / 写者跑过，结论和补的几处：
 *  · 「一个声部在一段里怎么画」分三处放，各有出处，不合并：手选的谱号 = 纸头的谱号记号（v0.9.28「只改这张纸」起就是这个写法，老歌里已经有）；手选的大谱表 = 那张纸 MusicXML 的 <staves>2（标准写法）；
 *    关自动八度线 = papers[].autoOttava（MusicXML 说不了「别自动画」）。自动挑出来的（谱号 / 大谱表 / 八度线）一律不算数据：正本里写的是挑好的结果或者不写，读的时候不认。
 *  · 旧版本开了新歌再存一次，实测会丢的（比上一段写的多）：小调、和弦名（旧版本会说「和弦记号 N 处没读进来」）、每段关的自动八度线；
 *    哪一段手选了大谱表 → 那个声部每一段都成大谱表，**并且这个声部每一段的谱号记号（纸头手选的、中途换的）都没了**（旧版本写大谱表时不写谱号记号）。音、歌词不丢。这就是 minor 的代价，旧版本改不了。
 *  · 大谱表那一段里的谱号记号：这一版起照写照读（<clef number="1">，musicxml.ts）——原来写的时候跳过，选过大谱表再存一次就悄悄没了。画大谱表时仍然不看它。
 *  · 没有标准名的和弦种类（7sus4 / add9 / 6/9 / 7♭9…）在 <kind text="…">other</kind> 里写的字 = 一张冻住的表（theory/western.ts XML_OTHER_TEXT），和谱上显示的字分开。
 *  · 没有改 major，也没有改 minor：补的都是「读得更多 / 不再丢」，v0.16.88–90 那一天存的歌照样开。 */
/** score minor 5（谱面分家第三刀，2026-11-11 Claude Opus 5.5；user 11-11 夜「可以」= 把四样显示设置存进歌文件、都可选、没写就按默认、小版本号加一）：
 *  这首歌怎么看 = 顶层 notation（谱种，只写不是五线谱的；不认识的值原样带回）/ chordTags（只写 false = 不标和弦级数）/ viewInC（只写 true = 按 C 调看）+ parts[].chords（这条轨的和弦选项，
 *  只写不是 auto 的："stacked" = 只认叠在一起的、"fold" = 折叠成和弦名；不认识的值原样带回）。读 / 改 / 没写的意思只在 src/score/song-view.ts（没写 = 五线谱 / 标 / 不按 / auto，冻住不变）。
 *  parts[].brokenChords（minor 2）退役：读成 chords: "stacked"，不再写。
 *  旧版本打开：顶层三个键在 score.json 里原样带回（未知键直通），chords 按声部 id 原样带回（minor 4 起的读者），画的时候按五线谱、标和弦级数、不按 C 调看、也认拆开弹的；
 *  minor 2–4 的读者看不到「只认叠在一起的」（它们只认 brokenChords）。提示一次，音不丢。
 *  会丢的一种（知道、接受；统筹 2026-11-11 审第三刀）：新版存了 chords: "stacked" → 老版打开、把「分解和弦」关了又开 → 老版不写 brokenChords、chords 原样带回
 *  → 新版读成只认叠着的（老版最后那次改动丢了）。只写 chords 不两份都写，是为了不留两份真相。
 *  **chordTags、viewInC 永远是布尔**（统筹 2026-11-11 定）：以后要加花样（比如标和弦名）就加新键，不改这两个键的类型——这一版的读法是「不是 false / true 就当没写」、
 *  而且不带回，将来谁改了类型，这一版存一遍就丢了。notation、chords 是字符串，不认识的值原样带回，没有这个问题。
 *  viewInC 原名 inC（第三刀当天改名，带 inC 的文件一份都没出过门）：和设备上原来的键 view-in-c、setter setViewInC 统一。 */
export declare const FORMAT_MINOR: Readonly<Record<FormatFile, number>>;
/** manifest patch 1（v0.16.97，2026-11-10 Claude Fable 5.2；user 11-07「定稿取消，换修改锁」、11-10「对，以后统一不存mp3，旧的也删掉」）：这一版起**不再写** `final` / `finalRev`
 *  和 `.moonsinger/final.mp3` 这个 entry。少写一样东西、别的一个键没动：老版本读到 = 没有定稿记录 = 没定稿，照常开（所以是 patch、老读者静默）；
 *  这一版读老文件 = 认得它们，mp3 交给宿主搬进设备缓存（project.ts LegacyMp3），再存就不带了。 */
export declare const FORMAT_PATCH: Readonly<Record<FormatFile, number>>;
/** `.moonsinger/manifest.json`：总目录。 */
export interface ManifestV2 {
    format: "moonsinger";
    version: 2;
    app: string;
    saved: string;
    files: Record<string, number>;
    derived: string[];
    /** 2026-10-07 加（可选）：歌里嵌的音源字节（契约 §10.2 样本类 by value）。path 相对 zip 根（`.moonsinger/sounds/<sha256>.sf2`）。 */
    sounds?: {
        path: string;
        sha256: string;
        bytes: number;
    }[];
    /** 2026-10-16 加（可选，不升版本；Claude Fable 5.1，W-38）：渲染核心的版本 + 哈希，**每次保存都记**（user 2026-10-13「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」）。
     *  version 人定（src/core/version.ts CORE_VERSION）；hash = 构建时按核心源码（src/core src/engine src/singer src/performers src/score src/gm src/format + vendor/world vendor/tsf + assets/preview）算的 sha256 前 16 位（scripts/core-hash.mjs）。 */
    core?: {
        version: string;
        hash: string;
    };
    /** 2026-10-16 加（可选）：定稿过几次。**2026-11-10 起不再写**（定稿退役，manifest patch 1）；老文件里有 = 读的时候不看、再存不带。 */
    finalRev?: number;
    /** 2026-10-16 加（可选）：定稿记录（src/format/final.ts FinalRecord）+ zip 里的 `.moonsinger/final.mp3`（定稿那一刻渲染的 mp3，不压缩）。
     *  **2026-11-10 起不再写**（定稿退役，manifest patch 1）。老文件里有：记录像样 ∧ mp3 在 ∧ fingerprint 和文件里的内容对得上 = 那份 mp3 交给宿主搬进设备缓存；
     *  别的情况当它不存在（不报错、不拒开）。两种情况再存都不带。歌库里还没重新存过的老文件，封面上照旧能按 entry 名尾读那份 mp3 来听。 */
    final?: unknown;
}
/** `.moonsinger/score.json` 第 2 版：纸的顺序表 + 声部并集（存法 B，§6¾）。按声部 id / 音符 id / 小节序号挂注，不复制谱的内容。 */
export interface ScoreExtV2 {
    version: 2;
    /** 顺序里的纸（纸 = 曲段）：file = 这张纸的 MusicXML 正本（`.moonsinger/papers/<id>.musicxml`）；manualBars = 声部 id → 这张纸里人插的小节线（小节序号，1 起）；
     *  unwritten = 这张纸还没写音高的音（note id）。自动小节线只画不存（0.2.x 现状）。曲段名在那份 MusicXML 的 <movement-title>。
     *  MusicXML 正本里我们自己认 id 的两样（别的软件照常显示；自家读回来按 id 认出来，不加 JSON 字段、不升版本）：
     *  渐到 = 虚线 <wedge id="ramp-…">；风格记号（拍子轻重，2026-10-08 深夜 Opus 5.5）= <direction><words id="groove.<预设 id>.<幅度百分数>.<token id>">名字</words>。
     *  谱内反复 / 跳转（2026-10-09 Opus 5.5；不升版本：MusicXML 原生、老版本 app 读到 = 不认的元素）：|: / :| / :|: = <barline location="left|right"> 的
     *  <repeat direction="forward|backward" times>（纸头的 |: 不开空小节）；房子 = <barline location="left"><ending number="1, 2" type="start">，被 :| 收 = stop、最后一个 = discontinue；
     *  Segno / Coda = <direction><direction-type><segno|coda id="nav.<种类>.<token id>"/></direction-type><sound segno|coda/>；Fine / To Coda / D.C.… / D.S.… = <words id="nav.…">字</words> +
     *  <sound fine | tocoda | dacapo | dalsegno>。纸的正本里是记号；派生的压平件 score.musicxml 已经按结构展开（没有这些记号）。
     *  老版本的 app 读到它们 = 当普通的发夹 / 文字忽略（风格记号会丢——老版本本来就不会放拍子轻重）。
     *  气声 / 出声的换气（2026-10-10 Opus 5.5；不升版本：MusicXML 原生）：气声 = <notehead>x</notehead>（和幽灵音一起 = <notehead parentheses="yes">x</notehead>；
     *  别家谱的 × 符头读进来也是气声——乐器不认、画灰，不影响出声）；出声的换气 = <breath-mark/> 后面紧跟 <other-articulation>inhale | inhale-big</other-articulation>
     *  （别的软件照样认得是换气；老版本的 app 读到 = 「不认的演奏法」数出来报，呼吸照旧）。 */
    papers: {
        id: string;
        file: string;
        manualBars: Record<string, number[]>;
        unwritten: string[];
        hidden?: boolean; /** 退役（v0.16.86，句号整个去掉）：老歌里有，读的时候丢掉，不再写。 */
        phrases?: Record<string, number[]>; /** v0.16.88（score minor 4，可选）：这一段关了自动八度线的声部（声部 id → false）。 */
        autoOttava?: Record<string, false>;
        /** 音内的力度起伏（2026-10-08 加，可选；MusicXML 里表达不了音内的发夹）：声部 id → 音的 id → "<" / ">" / "<>"。 */
        swells?: Record<string, Record<string, "<" | ">" | "<>">>;
    }[];
    /** 视图态（2026-10-08 加，可选；src/score/desk.ts）：怎么看 / 怎么听这首——范围 / 排法 / 在哪张纸 / 每个声部的隐藏·只看·静音·独奏。**存时顺手捞进来、改了不标脏、不进 undo**（照 WeebPaint desk）。只写非默认值；没有 = 全默认。 */
    view?: ViewV1;
    /** 编排（2026-10-08 深夜加，可选，不升版本；Opus 5.5）：一行字，按什么顺序放哪几张纸（曲段名 / 序号、×N、括号、最后一个 [循环段]；src/score/arrange.ts）。没有 = 每张纸各放一遍。 */
    arrangement?: string;
    /** 歌词怎么排（v0.9.40 加，可选，不升版本；Opus 5.5）：只写 "lyrics"（按歌词：长字把音推开）；没写 = 按节奏（音的位置只看时值，歌词让路；默认）。 */
    lyricFit?: "lyrics";
    /** 小节号（v0.9.42 加，可选，不升版本；Opus 5.5）：只写 "off"（不印）；没写 = 每行开头印。 */
    barNumbers?: "off";
    /** 音距（v0.16.34 加，可选，不升版本；Claude Opus 5.5）：只写 "tight"（紧）；没写 = 正常（短音符压紧）。
     *  **v0.16.43 起不再起作用**：音距跟版式走（舒适 = 正常、紧凑 = 紧；user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」），这个字段读到照样原样带着、写回，界面上没有开关了。
     *  v0.16.33 在开发版上待过一小时的 denseShort（"off" = 原来的松排法，那一档已经拿掉）读的时候丢掉、按正常排。 */
    spacing?: "tight";
    /** 歌级声部并集（总谱从上到下）：声部 → 角色 id → 麦克风 id；某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part。kind 留给打击乐记谱（现在都是 pitched）。
     *  **声部就是歌手**（2026-10-08 Opus 5.5，user「嗯声部就是歌手」）：role 在 parts 里唯一（读到共用的 = 后面那个拆成一位新歌手，见 project.ts finish）；
     *  一张纸上一位歌手最多一行（tracks 按声部 id 记，天然如此）；跨纸按声部 id 接；mic 可以几位歌手共用（歌手认领麦克风）。不改形状、不升版本。 */
    /** clef（v0.9.28，可选）：声部自己的谱号，"auto" = 自动（MusicXML 里写的是挑好的那个）。autoOttava（v0.9.37，可选，只写 false）：这位不要自动八度线（没写 = 开）。都不升版本。
     *  v0.16.88（score minor 4）起这两个只是老写法：clef 一律写 "auto"、autoOttava 不写，按段的在 papers[] 和每段的谱里；minor < 4 的文件读的时候搬到每一段。 */
    parts: {
        id: string;
        role: string;
        mic: string;
        kind: "pitched" | "percussion";
        clef?: string;
        autoOttava?: false;
        /** 2026-10-10 加（可选，不升版本；Opus 5.5）：合租——画在哪位（主人）的谱线上；主人自己不能是房客（读的时候不合规矩 = 丢掉这个字段）。user「合租还是有主人吧」。 */
        host?: string;
        /** v0.16.73 加（可选，只写 false；score minor 2）：这位不认分解和弦（没写 = 认）。score minor 5 起退役：读成 chords: "stacked"，不再写。 */
        brokenChords?: false;
        /** score minor 5（谱面分家第三刀）：这条轨的和弦选项，只写不是 auto 的——"stacked" = 只认叠在一起的和弦、"fold" = 折叠成和弦名（第五刀）。不认识的值原样带回。 */
        chords?: string;
    }[];
    /** score minor 5（谱面分家第三刀；src/score/song-view.ts）：这首歌怎么看。都可选、只写不是「没写的意思」的值：
     *  notation = 谱种（"jianpu"…；没写 = 五线谱；不认识的值原样带回）；chordTags = false（没写 = 标和弦级数）；viewInC = true（没写 = 不按 C 调看）。chordTags / viewInC 永远是布尔（上面 minor 5 那段）。
     *  不进 view（视图态）：它们决定这首歌怎么印，进撤销、会标脏；归修改锁的「看法」（锁着能切，锁着期间不写）。 */
    notation?: string;
    chordTags?: false;
    viewInC?: true;
}
export interface ManifestV1 {
    format: "moonsinger";
    version: 1;
    app: string;
    saved: string;
    files: Record<string, number>;
    sounds?: {
        path: string;
        sha256: string;
        bytes: number;
    }[];
}
/** 第 1 版的 score.json：一张纸、整首一份 score.musicxml 就是正本。 */
/** 视图态（推荐稿）。全是可选、只写非默认值；读的一方宽容（不认识的忽略）。 */
export interface ViewV1 {
    scope?: "all";
    pageFlow?: true; /** 排法「横卷」（v0.9.35 加，可选、不升版本；Opus 5.5；和 pageFlow 互斥，只写 true）。 */
    scroll?: true;
    paper?: string;
    parts?: Record<string, {
        hidden?: true;
        only?: true;
        muted?: true;
        solo?: true;
    }>;
    mp3?: "small";
    /** 2026-10-08 深夜 / 10-09 加（可选，不升版本；Opus 5.5）：ref = 参考窗的窗（开着没有 + 位置 / 大小，CSS px；开过窗才写）；
     *  pdf = 乐谱 PDF 的字体（只写非默认的「拼音」）。pad = pad 的状态（同日更早加的，见 desk.ts；v0.16.9 起写了 fifths / scale = 手动拨的「1=」，都没写 = 跟谱——不加字段）。 */
    pad?: Record<string, unknown>;
    ref?: {
        open?: true;
        left: number;
        top: number;
        width: number;
        height: number;
    };
    pdf?: "pinyin";
    /** 2026-10-10 加（可选，不升版本；Opus 5.5）：存的时候在哪个模式（只写非默认的；打开 = 进这个模式，成品曲存在「听」= 打开就是听、不怕误触；user「打开时记住上次的模式」）。 */
    mode?: "lyrics" | "symbols" | "listen";
    /** 2026-11-07 加（可选，不升版本；Claude Opus 5.5）：乐器目录在这首歌里翻到哪（src/score/desk.ts FinderMemo；只写不是默认的）——排序 / 每种排序展开的组 / 滚到哪 / 点开的那件 / 试听的那位。
     *  user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置」。 */
    finder?: {
        mode?: string;
        open?: Record<string, string>;
        scroll?: number;
        row?: string;
        pick?: string;
    };
}
export interface ScoreExtV1 {
    version: 1;
    parts: {
        id: string;
        role: string;
        mic: string;
    }[];
    manualBars: Record<string, number[]>;
    unwritten: string[];
}
/** `.moonsinger/studio.json`：录音房。 */
/** 录音房 v1（只给迁移对照；migrate/index.ts studioV1toV2）。 */
export interface StudioV1 {
    version: 1;
    mics: {
        id: string;
        name: string;
        gainDb: number;
        pan: number;
    }[];
    master?: {
        gainDb: number;
        limiter: boolean;
    };
}
/** 录音房 v2（2026-10-10 刀 4；user「轨还是和乐手是两个概念」）：轨是通用的条——乐手的通道（kind mic，谱上声部 `part.mic` 指着它）、总线（kind bus，没有乐手；混响 / 延迟这类「留在屋里的」）、
 *  以后的素材轨。每条：增益 / 声像 / 效果链 / 发送（推子之后发到哪条总线多少）/ 去哪（"master" 或总线 id）。总轨：增益 / 限幅 / 链。老文件（v1）读进来 = 每个麦克风一条 mic 轨、空链、直通总轨。 */
export interface StudioTrackV2 {
    id: string;
    kind: "mic" | "bus";
    name: string;
    gainDb: number;
    pan: number;
    chain: FxV2[];
    sends: {
        to: string;
        gainDb: number;
    }[];
    to: string;
    /** 2026-10-10 加（可选，不升版本；Opus 5.5）：混音轨整条旁通——链上的插件全跳过，推子 / 声像 / 出到 / 发送照旧；只写 true（user「混音轨和每个插件都可以toggle bypass」）。 */
    bypass?: true;
}
export interface StudioV2 {
    version: 2;
    tracks: StudioTrackV2[];
    master: {
        gainDb: number;
        limiter: boolean;
        chain: FxV2[];
    };
}
export type Hum = "la" | "n" | "u" | "o" | "a";
export type Dynamic = "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff";
export interface LoungeRoleV2 {
    version: 2;
    id: string;
    name: string;
    sound: string;
    active: string;
    candidates: CandidateV2[];
    /** 2026-10-07 加（可选，不升版本）：角色是什么乐器**概念**——百科的多重编号束 + 名字 by value（user「乐器的百科全书」「多重编号」）。
     *  sound（MusicXML id）仍是导出给别的软件看的；concept 是真身份，目录（vendor/instruments/）常改也不影响歌。 */
    concept?: {
        ids: {
            wikidata: string | null;
            local: string | null;
            musicxml: string | null;
            gm: {
                program: number;
                bank: number;
            }[];
            hs: string | null;
        };
        name: {
            zh: string;
            en: string;
            ja?: string;
        };
    };
}
export interface CandidateV2 {
    id: string;
    name: string;
    /** 2026-11-08 加（可选，不升版本；Claude Opus 5.5）：从乐器目录上场时，这一位是作为哪件乐器上的（角色名 / MusicXML sound / 概念，= withRoleConcept 那一份）。
     *  在乐器页点回它 = 角色跟着换回这件乐器（user 11-07：先选长笛再选人声，点回长笛那颗谱上还写着 Voice）。没有（旧候选 / 自己的 .sf2）= 宿主按目录反查或不动。
     *  旧 app 不认它也照常开存（候选整份写回），只是点回旧候选时名字不跟——就是它原来的样子。 */
    castAs?: {
        name: string;
        sound: string | null;
        concept: NonNullable<LoungeRoleV2["concept"]>;
    };
    /** 2026-11-09 加（可选，不升版本；Claude Opus 5.5，施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §5 R1）：换上台那一刻这位的「设置指纹」
     *  （project.ts settingsPrint：去掉 id / castAs / asCast 后按键名排序的 JSON 的 sha256 前 16 位）。现在的指纹还等于它 = 换上来以后没调过 = 换乐器时下台就删掉。
     *  没有这个字段（旧歌 / 旧版 app 造的）= 当作调过 = 留着。旧 app 不认它、原样写回：设置变了指纹就对不上，所以不会把调过的当成没调过。内置两位（c1 / c2）不写。 */
    asCast?: string;
    instrument: InstrumentV2;
    gm: {
        program: number | null;
        variant: string | null;
    };
    calibrationDb: number;
    /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：修八度 / 移调（半音）——SoundFont 出声时敲「写的音 + transpose」。默认没有 = 0；
     *  只给少数本身就差八度的音色兜底（GS 32 Guitar Harmonics 高两个八度、18 / 19 风琴听着低一个八度），不自动套用（user「大部分情况不应该动，是worst case兜底」）。 */
    transpose?: number;
    defaults: Record<string, number>;
    dynamicsDb: Record<Dynamic, number>;
    /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：SoundFont 演奏者的力度记号 → MIDI 力度（1–127）。有这张表 = 力度记号 / 重音 / 强音走力度
     *  （accentVel / marcatoVel 加在上面），不再走 dB；没有 = 照旧（旧候选）。articulation 同时加了 marcatoDb（强音，dB 那一路）/ accentVel / marcatoVel。 */
    dynamicsVel?: Record<Dynamic, number>;
    articulation: {
        staccatoGate: number;
        tenutoGate: number;
        accentDb: number;
        gapSec?: number;
        marcatoDb?: number;
        accentVel?: number;
        marcatoVel?: number;
        accentSec?: number;
        breathSec?: number;
        breathShare?: number;
        gapShare?: number;
        wedgeStepDb?: number;
        wedgeStepVel?: number;
        sfzDb?: number;
        sfzVel?: number;
        sfzSec?: number;
        fpSec?: number;
        swellDb?: number;
        /** 能不能在一个音里面变强（2026-10-08 加，可选）：false = 按下去就自然衰减（钢琴 / 吉他 / 打击）——音内渐强 / 鼓起画灰、明说；音内渐弱照做。没写 = 能。
         *  SoundFont 新候选按仓鼠 v11 的 sustain（sustained = 能）by value 抄进来。 */
        canSwell?: boolean;
    };
    /** 2026-10-08 加（可选）：月读——谱上的记号变成唱法核心哪个字前记号（^ / v / O）、放在这个字还是下一个字前面；没写 = performance.ts SING_MARKS。 */
    sing?: Record<string, {
        mark: "^" | "v" | "O";
        at: "this" | "next";
    } | null>;
    chain: FxV2[];
    credit: Credit;
    spec: Spec;
    engines?: Record<string, unknown>;
}
/** 乐器 = 按引擎分的判别联合。每种引擎自带自己的配置（月读才有「哼的字」，SoundFont 才有 bank / program）。 */
export type InstrumentV2 = {
    engine: "tsukuyomi";
    model: {
        pack: string;
        sha256: string;
    };
    hum: Hum;
    /** 2026-10-08 深夜加（可选，不升版本；Opus 5.5）：分段唱——"phrase" 每句（在休止处切）/ "sheet" 每张纸 / "whole" 一整首；没写 = phrase。
     *  user「开关是歌手的属性，可以有不同的粒度」；src/score/lab-score.ts singChunks。 */
    chunk?: "phrase" | "sheet" | "whole";
} | {
    engine: "vowel-sampler";
    table: "builtin";
    hum: Hum;
} | {
    engine: "soundfont";
    bank: number;
    program: number;
    note?: number;
    source: Sf2Source;
    /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：音效（GS GM 116–128）上场时从目录按值抄的——key = 原速键、midi = 原速时听到的最强频率（有音高才有）、
     *  centsPerKey = 每键几音分；align = 关掉固定原速后按写的音反算键（src/gm/sf-key.ts）。user「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」。 */
    sfx?: {
        key: number;
        midi?: number;
        centsPerKey?: number;
        align?: boolean;
    };
} | {
    engine: "unknown";
    [k: string]: unknown;
};
/** SoundFont 的来源（契约 §10.2 样本类 by value）。
 *  embedded = 子集字节在歌里的路径（强引用，默认）；null = **弱引用**（user 2026-10-07：大的可以不嵌，「允许一个弱引用自己去官方和人的地方拉」）——
 *  歌里只记整包 sha256 + (bank, program) + 子集 sha256，要出声时按顺序找：歌里 → 本次内存 → 家族音源库（按整包 sha256 对条目）→ 人的文件（核 sha256）；
 *  都找不到 = 没人上场、报错、人换（= 换人的窄接口，瑞士奶酪第二层；第一层 = 哈希钉死）。子集化确定性 → 找到整包就能切出逐字节相同的子集（核 subsetSha256）。 */
export interface Sf2Source {
    embedded: string | null;
    subsetBytes: number;
    subsetSha256: string;
    origin: {
        name: string;
        fileSha256: string;
        bytes: number;
        library?: string;
    };
}
export interface Credit {
    attribution: string[];
    license: {
        name: string;
        url?: string;
        text?: string;
        textSha256?: string;
    };
}
export type Spec = {
    kind: "standard";
    name: string;
    version: string;
} | {
    kind: "ours";
    doc: string;
    source: {
        repo: string;
        ref: string;
        path: string;
    };
} | {
    kind: "unknown";
};
/** 一个效果（2026-10-10 刀 4 定形；原草稿的 engine / owner 去掉——引擎随 app 发、主人就是它在哪条链上）：kind 见 src/engine/fx.ts FX_KINDS（eq / comp / delay / reverb / gain…；
 *  不认识的 = 不出声、原样带着、界面画灰）；params 按 kind 的参数表（量纲 / 公式在那张表里，vault 自描述）；on = false 旁通；key = 压缩器的侧链来源（轨 id）。 */
export interface FxV2 {
    id: string;
    kind: string;
    on?: boolean;
    params: Record<string, number>;
    key?: string;
    note?: string;
}
export interface LoungeRoleV1 {
    version: 1;
    id: string;
    name: string;
    sound: string;
    active: string;
    candidates: CandidateV1[];
}
export interface CandidateV1 {
    id: string;
    name: string;
    gm: {
        program: number | null;
        variant: string | null;
    };
    hum?: Hum;
    calibrationDb: number;
    chain: unknown[];
    engines: Record<string, unknown>;
    source?: {
        kind: "sf2";
        embedded: string | null;
        bank: number;
        program: number;
        origin: Sf2Source["origin"];
        subsetBytes: number;
        subsetSha256?: string;
    };
    credit?: Credit;
    spec?: Spec;
}
/** `.moonsinger/curves.json`（新文件）：曲线 = 真相。按音符 id；时间 = 音里 0–1；数值**绝对**、单位写明（SI 兜底）。 */
export interface CurvesV1 {
    version: 1;
    /** 每个参数的单位（第 7 题三类 + SI 兜底）：音量 "dB"、音高 "cent"（相对谱上写的音）、音色旋钮 "knob"（−1…+1，0 = 候选本色）、其余 SI 单位名。 */
    units: Record<string, CurveUnit>;
    /** 音符 id → 参数名 → 折线点 [t(0–1), value]。没有这条曲线的音 = 用候选快照里的默认数（CandidateV2.defaults）。 */
    notes: Record<string, Record<string, [number, number][]>>;
}
export type CurveUnit = "dB" | "cent" | "knob" | (string & {});
/** studio.json 第 2 版：麦克风 → 总线 → 总输出；侧链；人录的音频（§8，非破坏性）。时间线自动化（按小节:拍）以后加。 */
