// contract.ts —— `.mxl` 里 `.moonsinger/` 各份 JSON 的形状（人读的 .h；v1 / v2 = 代码现在写的，守卫测试照它查；标「提案」的 = **推荐稿**，不是定稿——
//   user 2026-10-07「fable的任何数据结构契约都只是推荐稿，不对立刻说」：做多轨的 session 对着 0.2.x 的手感用，不对就改、报 user、知会格式 session）。
// created 2026-10-07 by Claude Fable 5.1（user「数据结构你来把关」「碰到格式问题就问你」）；2026-10-07 深夜起契约与编辑器同一个 session 管。
// 来龙去脉与 user 原话 = ai-docs/20261007-data-contract-draft.md（§3 目录表、§7 未定、§8 谁的字节、§10 音源）。
//
// 规矩（CatsUp 立宪，家族持久化向后兼容）：
//   · 每份文件自带 version；改形状 = FORMAT 里 +1 + src/format/migrate/ 加一条纯函数（第 n 版 → 第 n+1 版）+ 旧版冻结样本留在 test/fixtures/format/。
//   · 只加可选字段 = 不升版本（WXHW ADR-0012 修订同款「加法」），但写出来的键集合变了 → 守卫测试红，跑 node scripts/freeze-format-sample.mjs 更新形状快照、审 diff。
//   · 老文件永远能开（读时链式升级），只拒开比 app 新的；不认识的字段 / 文件原样写回。
//   · 守卫 = test/format-guard.test.ts：形状快照、迁移链完整、冻结样本能开。
//   · 参考窗目录 `.moonsinger/references/`（v0.8，2026-10-08 深夜 Opus 5.5；对齐稿 ai-docs/20261008-reference-window-alignment.md）：
//     整个目录归 @internal/reference-window（manifest.json 自带版本号和迁移 + 每张卡一个 r<i>.<ext>），这一层零知识、原样进出（project.ts REFERENCES_DIR）；
//     不列进我们的 manifest、不升 FORMAT；窗的位置在 score.json view.ref（ViewV1 可选字段）。老版本 app 读到 = 当不认识的文件原样写回。

/** 这一版能读写的各份文件的版本号（改格式 = 这里 +1 + migrate + 冻结样本；守卫测试盯着）。
 *  lounge 2（2026-10-07 深夜，user「现在开始好好做乐器这个数据结构，不要偷懒」）：候选从「月读形状 + 贴字段」改成按引擎分的乐器。
 *  manifest 2 / score 2（2026-10-08，0.5.0 多声部多纸，存法 B）：纸的顺序表 + 声部并集；每张纸一份 MusicXML 正本，score.musicxml 变派生件。 */
export const FORMAT = { manifest: 2, score: 2, lounge: 2, studio: 2 } as const;
export type FormatFile = keyof typeof FORMAT;

// ═══ 现役（project.ts 写的就是这些）═══════════════════════════════════════════════════════

/** `.moonsinger/manifest.json`：总目录。 */
export interface ManifestV2 {
  format: "moonsinger";
  version: 2;
  app: string;                         // 写它的 app 版本（如 v0.5.0-2026-10-08）
  saved: string;                       // ISO 时刻
  files: Record<string, number>;       // `.moonsinger/` 下每份文件 → 它的版本号（"score.json" / "studio.json" / "lounge/r1.json"…；"papers/p1.musicxml" 记 0 = 标准件）
  derived: string[];                   // 派生件（zip 根下的路径；自家读时无视、存档时重新生成）：["score.musicxml"]
  /** 2026-10-07 加（可选）：歌里嵌的音源字节（契约 §10.2 样本类 by value）。path 相对 zip 根（`.moonsinger/sounds/<sha256>.sf2`）。 */
  sounds?: { path: string; sha256: string; bytes: number }[];
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
  papers: { id: string; file: string; manualBars: Record<string, number[]>; unwritten: string[]; hidden?: boolean; phrases?: Record<string, number[]>;
    /** 音内的力度起伏（2026-10-08 加，可选；MusicXML 里表达不了音内的发夹）：声部 id → 音的 id → "<" / ">" / "<>"。 */
    swells?: Record<string, Record<string, "<" | ">" | "<>">> }[];   // swells：v0.9.44 起编辑器里是演奏法（Art swellUp / swellDown / swellBoth），存的时候照旧从演奏法取成这张表、读的时候挂回去——文件形状没变   // hidden（2026-10-08 加，可选）= 这张纸不放、不进压平件；phrases（同日加，可选）= 声部 id → 句号跟在哪些 token（id）后面（句号不算打谱符号，不进 MusicXML）
  /** 视图态（2026-10-08 加，可选；src/score/desk.ts）：怎么看 / 怎么听这首——范围 / 排法 / 在哪张纸 / 每个声部的隐藏·只看·静音·独奏。**存时顺手捞进来、改了不标脏、不进 undo**（照 WeebPaint desk）。只写非默认值；没有 = 全默认。 */
  view?: ViewV1;
  /** 编排（2026-10-08 深夜加，可选，不升版本；Opus 5.5）：一行字，按什么顺序放哪几张纸（曲段名 / 序号、×N、括号、最后一个 [循环段]；src/score/arrange.ts）。没有 = 每张纸各放一遍。 */
  arrangement?: string;
  /** 歌词怎么排（v0.9.40 加，可选，不升版本；Opus 5.5）：只写 "lyrics"（按歌词：长字把音推开）；没写 = 按节奏（音的位置只看时值，歌词让路；默认）。 */
  lyricFit?: "lyrics";
  /** 小节号（v0.9.42 加，可选，不升版本；Opus 5.5）：只写 "off"（不印）；没写 = 每行开头印。 */
  barNumbers?: "off";
  /** 歌级声部并集（总谱从上到下）：声部 → 角色 id → 麦克风 id；某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part。kind 留给打击乐记谱（现在都是 pitched）。
   *  **声部就是歌手**（2026-10-08 Opus 5.5，user「嗯声部就是歌手」）：role 在 parts 里唯一（读到共用的 = 后面那个拆成一位新歌手，见 project.ts finish）；
   *  一张纸上一位歌手最多一行（tracks 按声部 id 记，天然如此）；跨纸按声部 id 接；mic 可以几位歌手共用（歌手认领麦克风）。不改形状、不升版本。 */
  /** clef（v0.9.28，可选）：声部自己的谱号，"auto" = 自动（MusicXML 里写的是挑好的那个）。autoOttava（v0.9.37，可选，只写 false）：这位不要自动八度线（没写 = 开）。都不升版本。 */
  parts: { id: string; role: string; mic: string; kind: "pitched" | "percussion"; clef?: string; autoOttava?: false }[];
}

// ─── 第 1 版（只给迁移对照；migrate/index.ts）────────────────────────────────────────────
export interface ManifestV1 { format: "moonsinger"; version: 1; app: string; saved: string; files: Record<string, number>; sounds?: { path: string; sha256: string; bytes: number }[] }
/** 第 1 版的 score.json：一张纸、整首一份 score.musicxml 就是正本。 */
/** 视图态（推荐稿）。全是可选、只写非默认值；读的一方宽容（不认识的忽略）。 */
export interface ViewV1 { scope?: "all"; pageFlow?: true; /** 排法「横卷」（v0.9.35 加，可选、不升版本；Opus 5.5；和 pageFlow 互斥，只写 true）。 */ scroll?: true; paper?: string; parts?: Record<string, { hidden?: true; only?: true; muted?: true; solo?: true }>;
  mp3?: "small";   // mp3 = 导出歌声的音质（只写非默认的「小文件」；2026-10-08 by Claude Opus 5.5，user「音质配置就是应该也跟着吧」）
  /** 2026-10-08 深夜 / 10-09 加（可选，不升版本；Opus 5.5）：ref = 参考窗的窗（开着没有 + 位置 / 大小，CSS px；开过窗才写）；
   *  pdf = 乐谱 PDF 的字体（只写非默认的「拼音」）。pad = pad 的状态（同日更早加的，见 desk.ts）。 */
  pad?: Record<string, unknown>; ref?: { open?: true; left: number; top: number; width: number; height: number }; pdf?: "pinyin";
  /** 2026-10-10 加（可选，不升版本；Opus 5.5）：存的时候在哪个模式（只写非默认的；打开 = 进这个模式，成品曲存在「听」= 打开就是听、不怕误触；user「打开时记住上次的模式」）。 */
  mode?: "lyrics" | "symbols" | "listen" }
export interface ScoreExtV1 {
  version: 1;
  parts: { id: string; role: string; mic: string }[];
  manualBars: Record<string, number[]>;                   // 声部 id → 哪些小节线是人插的
  unwritten: string[];
}

/** `.moonsinger/studio.json`：录音房。 */
/** 录音房 v1（只给迁移对照；migrate/index.ts studioV1toV2）。 */
export interface StudioV1 {
  version: 1;
  mics: { id: string; name: string; gainDb: number; pan: number }[];   // pan −1…1（写 MusicXML 时 ×90）
  master?: { gainDb: number; limiter: boolean };   // v0.9.6 加的可选字段
}
/** 录音房 v2（2026-10-10 刀 4；user「轨还是和乐手是两个概念」）：轨是通用的条——乐手的通道（kind mic，谱上声部 `part.mic` 指着它）、总线（kind bus，没有乐手；混响 / 延迟这类「留在屋里的」）、
 *  以后的素材轨。每条：增益 / 声像 / 效果链 / 发送（推子之后发到哪条总线多少）/ 去哪（"master" 或总线 id）。总轨：增益 / 限幅 / 链。老文件（v1）读进来 = 每个麦克风一条 mic 轨、空链、直通总轨。 */
export interface StudioTrackV2 { id: string; kind: "mic" | "bus"; name: string; gainDb: number; pan: number; chain: FxV2[]; sends: { to: string; gainDb: number }[]; to: string }
export interface StudioV2 {
  version: 2;
  tracks: StudioTrackV2[];
  master: { gainDb: number; limiter: boolean; chain: FxV2[] };
}

// ─── 休息室 v2（现役）：角色 = 谱上的功能位；候选 = 谁来演 + 怎么出声 ─────────────────────────
// 三样东西（契约草稿 §1）：谱（声部各自选角色、选麦克风）/ 休息室（角色 → 候选，手动选上场的；下线的留着不删）/ 录音房（电线）。
//   2026-10-08 Opus 5.5：声部 = 歌手（一个声部一个角色，绑定在歌手上、全曲一份，界面上照旧在谱前面的歌手名那里选）；每张纸上有谁各自定（user「新歌手只出现在当前这张纸嗯」「麦克风由歌手认领嗯」）。
// 「贝斯手不是贝斯」：角色是功能（Vocals / Guitar…，带 MusicXML 官方乐器语义 id），候选是演奏者 + 他手里的乐器配置。
// 每个候选 by value 带全纯函数要的一切（§8）：乐器（按引擎分）、默认数、力度表、演奏法、校准、链、署名、规格。不依赖 app 里的默认表。

export type Hum = "la" | "n" | "u" | "o" | "a";
export type Dynamic = "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff";   // ppp / fff：v0.9.23 加（只加不改；旧演奏者的表里没有 = 按它自己 pp→p / f→ff 的间隔往外推一档）

export interface LoungeRoleV2 {
  version: 2;
  id: string;                          // "r1"
  name: string;                        // 谱上写的角色名（<part-name>）
  sound: string;                       // MusicXML 官方乐器语义 id（<instrument-sound>，src/score/roles.ts）
  active: string;                      // 上场的候选 id（人选的；上不了场 = 不出声、报错、人换，不自动替补）
  candidates: CandidateV2[];
  /** 2026-10-07 加（可选，不升版本）：角色是什么乐器**概念**——百科的多重编号束 + 名字 by value（user「乐器的百科全书」「多重编号」）。
   *  sound（MusicXML id）仍是导出给别的软件看的；concept 是真身份，目录（vendor/instruments/）常改也不影响歌。 */
  concept?: { ids: { wikidata: string | null; local: string | null; musicxml: string | null; gm: { program: number; bank: number }[]; hs: string | null }; name: { zh: string; en: string; ja?: string } };
}
export interface CandidateV2 {
  id: string;                          // "c1"…（c1 / c2 = 新歌默认的月读完整 / 元音版）
  name: string;                        // 候选的名字（不上谱）
  instrument: InstrumentV2;            // 谁来演、怎么出声（按引擎分；不认识的引擎原样写回）
  gm: { program: number | null; variant: string | null };   // 写给别的软件看的（MusicXML <midi-program> 1 起 / <virtual-instrument>）
  calibrationDb: number;               // 响度校准（看得见、能调的默认，不偷偷自动）
  /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：修八度 / 移调（半音）——SoundFont 出声时敲「写的音 + transpose」。默认没有 = 0；
   *  只给少数本身就差八度的音色兜底（GS 32 Guitar Harmonics 高两个八度、18 / 19 风琴听着低一个八度），不自动套用（user「大部分情况不应该动，是worst case兜底」）。 */
  transpose?: number;
  defaults: Record<string, number>;    // 一个音没画曲线时用的默认数（by value）：参数名 → 值，单位同 curves.json 的 units
  dynamicsDb: Record<Dynamic, number>; // 谱上记号 ↔ 曲线的换算表（by value）：力度字母 → dB
  /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：SoundFont 演奏者的力度记号 → MIDI 力度（1–127）。有这张表 = 力度记号 / 重音 / 强音走力度
   *  （accentVel / marcatoVel 加在上面），不再走 dB；没有 = 照旧（旧候选）。articulation 同时加了 marcatoDb（强音，dB 那一路）/ accentVel / marcatoVel。 */
  dynamicsVel?: Record<Dynamic, number>;
  articulation: { staccatoGate: number; tenutoGate: number; accentDb: number; gapSec?: number; marcatoDb?: number; accentVel?: number; marcatoVel?: number;
    accentSec?: number; breathSec?: number; breathShare?: number; gapShare?: number; wedgeStepDb?: number; wedgeStepVel?: number;
    sfzDb?: number; sfzVel?: number; sfzSec?: number; fpSec?: number; swellDb?: number;
    /** 能不能在一个音里面变强（2026-10-08 加，可选）：false = 按下去就自然衰减（钢琴 / 吉他 / 打击）——音内渐强 / 鼓起画灰、明说；音内渐弱照做。没写 = 能。
     *  SoundFont 新候选按仓鼠 v11 的 sustain（sustained = 能）by value 抄进来。 */
    canSwell?: boolean };
  //   2026-10-08 加（可选，不升版本；Claude Opus 5.5；user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）：上面这些 = 记号怎么解读的数，没写 = performance.ts MARK_DEFAULTS
  //   2026-10-08 深夜再加（可选，不升版本；Opus 5.5）：stressDb / stressVel（次重音）、unstressDb / unstressVel（弱化）、ghostDb / ghostVel（幽灵音）——强度的其余几级。
  /** 2026-10-08 加（可选）：月读——谱上的记号变成唱法核心哪个字前记号（^ / v / O）、放在这个字还是下一个字前面；没写 = performance.ts SING_MARKS。 */
  sing?: Record<string, { mark: "^" | "v" | "O"; at: "this" | "next" } | null>;   // 跳音 / 保持吃掉多长（0–1）；重音加多少 dB；
  //   gapSec（2026-10-08 加，可选，不升版本；Claude Opus 5.5）= 连断的底色：不写记号的音之间留多大缝（秒）；连线 / 保持 = 不留；没写 = 0
  chain: FxV2[];                       // 跟着演奏者走的效果（琴箱 / 音箱 / 琶音器；留位，现在空）
  credit: Credit;                      // 署名 / 许可证快照 by value（署名义务跟音源走）
  spec: Spec;                          // §10.6 vault：这个乐器怎么出声——标准格式只写名字版本；我们写的指向源码出处 + README 章节
  engines?: Record<string, unknown>;   // v1 的「引擎参数按引擎名分组」；别的工具 / 旧版写的，原样写回
}
/** 乐器 = 按引擎分的判别联合。每种引擎自带自己的配置（月读才有「哼的字」，SoundFont 才有 bank / program）。 */
export type InstrumentV2 =
  | { engine: "tsukuyomi"; model: { pack: string; sha256: string }; hum: Hum;        // 月读完整：piper（时长接管）+ WORLD；model = 家族模型包（packId = manifest 的 sha256）
      /** 2026-10-08 深夜加（可选，不升版本；Opus 5.5）：分段唱——"phrase" 每句（在休止处切）/ "sheet" 每张纸 / "whole" 一整首；没写 = phrase。
       *  user「开关是歌手的属性，可以有不同的粒度」；src/score/lab-score.ts singChunks。 */
      chunk?: "phrase" | "sheet" | "whole" }
  | { engine: "vowel-sampler"; table: "builtin"; hum: Hum }                            // 月读元音版（轻量）：app 随带的元音表（assets/preview/）
  | { engine: "soundfont"; bank: number; program: number; note?: number; source: Sf2Source;   // SoundFont 2 的一个预设（TinySoundFont 出声）；note = 每个音都敲这个键：鼓件（2026-10-07 加，可选）/ 音效固定原速（2026-10-08）
      /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：音效（GS GM 116–128）上场时从目录按值抄的——key = 原速键、midi = 原速时听到的最强频率（有音高才有）、
       *  centsPerKey = 每键几音分；align = 关掉固定原速后按写的音反算键（src/gm/sf-key.ts）。user「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」。 */
      sfx?: { key: number; midi?: number; centsPerKey?: number; align?: boolean } }
  | { engine: "unknown"; [k: string]: unknown };                                        // 别家谱原来的乐器 / 这一版不认识的：整份原样写回，上场 = 没人、不出声
/** SoundFont 的来源（契约 §10.2 样本类 by value）。
 *  embedded = 子集字节在歌里的路径（强引用，默认）；null = **弱引用**（user 2026-10-07：大的可以不嵌，「允许一个弱引用自己去官方和人的地方拉」）——
 *  歌里只记整包 sha256 + (bank, program) + 子集 sha256，要出声时按顺序找：歌里 → 本次内存 → 家族音源库（按整包 sha256 对条目）→ 人的文件（核 sha256）；
 *  都找不到 = 没人上场、报错、人换（= 换人的窄接口，瑞士奶酪第二层；第一层 = 哈希钉死）。子集化确定性 → 找到整包就能切出逐字节相同的子集（核 subsetSha256）。 */
export interface Sf2Source {
  embedded: string | null;
  subsetBytes: number;
  subsetSha256: string;
  origin: { name: string; fileSha256: string; bytes: number; library?: string };   // 从哪个整包切的；library = 家族音源库 pwa-sounds 的目录 id（音源不是 AI 模型，不走 pwa-models）
}
export interface Credit { attribution: string[]; license: { name: string; url?: string; text?: string; textSha256?: string } }
export type Spec =
  | { kind: "standard"; name: string; version: string }
  | { kind: "ours"; doc: string; source: { repo: string; ref: string; path: string } }   // ref = 版本号 / commit；doc = vault README 的章节锚
  | { kind: "unknown" };
/** 一个效果（2026-10-10 刀 4 定形；原草稿的 engine / owner 去掉——引擎随 app 发、主人就是它在哪条链上）：kind 见 src/engine/fx.ts FX_KINDS（eq / comp / delay / reverb / gain…；
 *  不认识的 = 不出声、原样带着、界面画灰）；params 按 kind 的参数表（量纲 / 公式在那张表里，vault 自描述）；on = false 旁通；key = 压缩器的侧链来源（轨 id）。 */
export interface FxV2 { id: string; kind: string; on?: boolean; params: Record<string, number>; key?: string; note?: string }

// ─── 休息室 v1（只给迁移对照；migrate/index.ts loungeV1toV2）─────────────────────────────────
export interface LoungeRoleV1 { version: 1; id: string; name: string; sound: string; active: string; candidates: CandidateV1[] }
export interface CandidateV1 {
  id: string; name: string;
  gm: { program: number | null; variant: string | null };   // variant "tsukuyomi" / "tsukuyomi-vowels" = 月读的两个候选
  hum?: Hum;                           // 月读的才有
  calibrationDb: number; chain: unknown[]; engines: Record<string, unknown>;
  source?: { kind: "sf2"; embedded: string | null; bank: number; program: number; origin: Sf2Source["origin"]; subsetBytes: number; subsetSha256?: string };   // v0.4.0–0.4.2 的 GM 候选
  credit?: Credit; spec?: Spec;
}

// ═══ 提案（未写入文件；多轨 / 曲线 / 录音房落地时改 FORMAT + migrate + 冻结样本）══════════════════
// user 裁决（2026-10-07，契约草稿 §7.7 / §7.8 / §6¾ / §8）：
//   ① 曲线是真相：绝对值、SI；谱上的 mp / mf / < > / 跳音 / 重音从曲线算出来写进 MusicXML（低保真可视化 + 备份）；默认演绎不藏在 app，
//      一个音没画曲线就用候选快照里写明的默认数。
//   ② 调号 / 拍号 = 各声部自己的画法，不共享、不影响渲染；真相 = 音符 + 小节线（对齐标记）。速度住第一声部、仍是状态机。
//   ③ 纸 = 曲段，存法 B：一张纸一份 MusicXML（`.moonsinger/papers/<id>.musicxml`，元数据每纸自带）+ 一份派生压平的 score.musicxml 给别的软件。（0.5.0 已落地）
//   ④ 休息室是歌的一部分（不做跨歌笔架）；新建角色从 app 内置预设 by value 拷进歌；渲染 = 纯函数(文件)。

// （score.json 第 2 版 2026-10-08 已落地，见上「现役」。）

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
