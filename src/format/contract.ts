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

/** 这一版能读写的各份文件的版本号（改格式 = 这里 +1 + migrate + 冻结样本；守卫测试盯着）。
 *  lounge 2（2026-10-07 深夜，user「现在开始好好做乐器这个数据结构，不要偷懒」）：候选从「月读形状 + 贴字段」改成按引擎分的乐器。 */
export const FORMAT = { manifest: 1, score: 1, lounge: 2, studio: 1 } as const;
export type FormatFile = keyof typeof FORMAT;

// ═══ 现役（project.ts 写的就是这些）═══════════════════════════════════════════════════════

/** `.moonsinger/manifest.json`：总目录。 */
export interface ManifestV1 {
  format: "moonsinger";
  version: 1;
  app: string;                         // 写它的 app 版本（如 v0.4.3-2026-10-07）
  saved: string;                       // ISO 时刻
  files: Record<string, number>;       // `.moonsinger/` 下每份文件 → 它的版本号（"score.json" / "studio.json" / "lounge/r1.json"…）
  /** 2026-10-07 加（可选，不升版本）：歌里嵌的音源字节（契约 §10.2 样本类 by value）。path 相对 zip 根（`.moonsinger/sounds/<sha256>.sf2`）。 */
  sounds?: { path: string; sha256: string; bytes: number }[];
}

/** `.moonsinger/score.json`：谱的扩展（MusicXML 装不下的）。按声部 id / 音符 id / 小节序号挂注，不复制谱的内容。 */
export interface ScoreExtV1 {
  version: 1;
  parts: { id: string; role: string; mic: string }[];   // 声部 → 角色 id → 麦克风 id（user「每个谱号的前面选」）
  manualBars: Record<string, number[]>;                   // 声部 id → 哪些小节线是人插的（小节序号，0 起）；自动的不进数据
  unwritten: string[];                                    // 还没写音高的音（MusicXML 里的 note id）
}

/** `.moonsinger/studio.json`：录音房。 */
export interface StudioV1 {
  version: 1;
  mics: { id: string; name: string; gainDb: number; pan: number }[];   // pan −1…1（写 MusicXML 时 ×90）
}

// ─── 休息室 v2（现役）：角色 = 谱上的功能位；候选 = 谁来演 + 怎么出声 ─────────────────────────
// 三样东西（契约草稿 §1）：谱（声部各自选角色、选麦克风）/ 休息室（角色 → 候选，手动选上场的；下线的留着不删）/ 录音房（电线）。
// 「贝斯手不是贝斯」：角色是功能（Vocals / Guitar…，带 MusicXML 官方乐器语义 id），候选是演奏者 + 他手里的乐器配置。
// 每个候选 by value 带全纯函数要的一切（§8）：乐器（按引擎分）、默认数、力度表、演奏法、校准、链、署名、规格。不依赖 app 里的默认表。

export type Hum = "la" | "n" | "u" | "o" | "a";
export type Dynamic = "pp" | "p" | "mp" | "mf" | "f" | "ff";

export interface LoungeRoleV2 {
  version: 2;
  id: string;                          // "r1"
  name: string;                        // 谱上写的角色名（<part-name>）
  sound: string;                       // MusicXML 官方乐器语义 id（<instrument-sound>，src/score/roles.ts）
  active: string;                      // 上场的候选 id（人选的；上不了场 = 不出声、报错、人换，不自动替补）
  candidates: CandidateV2[];
}
export interface CandidateV2 {
  id: string;                          // "c1"…（c1 / c2 = 新歌默认的月读完整 / 元音版）
  name: string;                        // 候选的名字（不上谱）
  instrument: InstrumentV2;            // 谁来演、怎么出声（按引擎分；不认识的引擎原样写回）
  gm: { program: number | null; variant: string | null };   // 写给别的软件看的（MusicXML <midi-program> 1 起 / <virtual-instrument>）
  calibrationDb: number;               // 响度校准（看得见、能调的默认，不偷偷自动）
  defaults: Record<string, number>;    // 一个音没画曲线时用的默认数（by value）：参数名 → 值，单位同 curves.json 的 units
  dynamicsDb: Record<Dynamic, number>; // 谱上记号 ↔ 曲线的换算表（by value）：力度字母 → dB
  articulation: { staccatoGate: number; tenutoGate: number; accentDb: number };   // 跳音 / 保持吃掉多长（0–1）；重音加多少 dB
  chain: FxV2[];                       // 跟着演奏者走的效果（琴箱 / 音箱 / 琶音器；留位，现在空）
  credit: Credit;                      // 署名 / 许可证快照 by value（署名义务跟音源走）
  spec: Spec;                          // §10.6 vault：这个乐器怎么出声——标准格式只写名字版本；我们写的指向源码出处 + README 章节
  engines?: Record<string, unknown>;   // v1 的「引擎参数按引擎名分组」；别的工具 / 旧版写的，原样写回
}
/** 乐器 = 按引擎分的判别联合。每种引擎自带自己的配置（月读才有「哼的字」，SoundFont 才有 bank / program）。 */
export type InstrumentV2 =
  | { engine: "tsukuyomi"; model: { pack: string; sha256: string }; hum: Hum }        // 月读完整：piper（时长接管）+ WORLD；model = 家族模型包（packId = manifest 的 sha256）
  | { engine: "vowel-sampler"; table: "builtin"; hum: Hum }                            // 月读元音版（轻量）：app 随带的元音表（assets/preview/）
  | { engine: "soundfont"; bank: number; program: number; source: Sf2Source }         // SoundFont 2 的一个预设（TinySoundFont 出声）
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
export interface FxV2 { id: string; kind: string; engine: string; params: Record<string, unknown>; owner: string }   // owner = 设备主人（候选 id / 总线 id）

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
//   ③ 纸 = 曲段，存法 B：一张纸一份 MusicXML（`.moonsinger/papers/<id>.musicxml`，元数据每纸自带）+ 一份派生压平的 score.musicxml 给别的软件。
//   ④ 休息室是歌的一部分（不做跨歌笔架）；新建角色从 app 内置预设 by value 拷进歌；渲染 = 纯函数(文件)。

/** score.json 第 2 版：纸的顺序表 + 声部并集；打击乐声部另一种记谱（user「鼓是最优先的」）。 */
export interface ScoreExtV2 {
  version: 2;
  /** 顺序里的纸（纸 = 曲段）：file = 这张纸的 MusicXML 路径；manualBars = 声部 id → 这张纸里人插的小节线（纸内序号）；unwritten = 这张纸还没写音高的音。自动小节线只画不存（0.2.x 现状）。 */
  papers: { id: string; file: string; manualBars: Record<string, number[]>; unwritten: string[] }[];
  parts: { id: string; role: string; mic: string; kind: "pitched" | "percussion" }[];   // 歌级并集；某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part
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
export interface StudioV2 {
  version: 2;
  mics: { id: string; name: string; gainDb: number; pan: number; to: string }[];          // to = 总线 id 或 "master"
  buses: { id: string; name: string; gainDb: number; pan: number; chain: FxV2[]; to: string }[];
  master: { gainDb: number; chain: FxV2[] };
  sidechains?: { from: string; to: string; fx: string }[];
  recordings?: { id: string; audio: string; startSec: number; inSec: number; outSec: number; gainDb: number }[];   // audio = attachments/audio/<id>.<ext>
}
