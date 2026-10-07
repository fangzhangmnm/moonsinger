// contract.ts —— `.mxl` 里 `.moonsinger/` 各份 JSON 的形状 = 持久化契约（人读的 .h；代码照它写、守卫测试照它查）。
// created 2026-10-07 by Claude Fable 5.1（user「数据结构你来把关」「碰到格式问题就问你」）。
// 来龙去脉与 user 原话 = ai-docs/20261007-data-contract-draft.md（§3 目录表、§7 未定、§8 谁的字节）。
//
// 规矩（CatsUp 立宪，家族持久化向后兼容）：
//   · 每份文件自带 version；改形状 = FORMAT 里 +1 + src/format/migrate/ 加一条纯函数（第 n 版 → 第 n+1 版）+ 旧版冻结样本留在 test/fixtures/format/。
//   · 只加可选字段 = 不升版本（WXHW ADR-0012 修订同款「加法」），但写出来的键集合变了 → 守卫测试红，跑 node scripts/freeze-format-sample.mjs 更新形状快照、审 diff。
//   · 老文件永远能开（读时链式升级），只拒开比 app 新的；不认识的字段 / 文件原样写回。
//   · 守卫 = test/format-guard.test.ts：形状快照、迁移链完整、冻结样本能开。
//
// 本文件分两层：**v1 = 这一版真写进文件的**（project.ts 照它写）；**v2 提案 = 多轨 / 曲线 / by value + 哈希落地时的目标形状**（未写入文件，
//   给做多轨的 session 当 .h；落地时 FORMAT +1、migrate、冻结 v1 样本——user 2026-10-07 三裁：曲线是真相、调号拍号 = 各声部画法、休息室 by value + 音源钉哈希）。

/** 这一版能读写的各份文件的版本号（改格式 = 这里 +1 + migrate + 冻结样本；守卫测试盯着）。 */
export const FORMAT = { manifest: 1, score: 1, lounge: 1, studio: 1 } as const;
export type FormatFile = keyof typeof FORMAT;

// ═══ v1（现役；project.ts 写的就是这些）═════════════════════════════════════════════════

/** `.moonsinger/manifest.json`：总目录。 */
export interface ManifestV1 {
  format: "moonsinger";
  version: 1;
  app: string;                         // 写它的 app 版本（如 v0.3.1-2026-10-07）
  saved: string;                       // ISO 时刻
  files: Record<string, number>;       // `.moonsinger/` 下每份文件 → 它的版本号（"score.json" / "studio.json" / "lounge/r1.json"…）
}

/** `.moonsinger/score.json`：谱的扩展（MusicXML 装不下的）。按声部 id / 音符 id / 小节序号挂注，不复制谱的内容。 */
export interface ScoreExtV1 {
  version: 1;
  parts: { id: string; role: string; mic: string }[];   // 声部 → 角色 id → 麦克风 id（user「每个谱号的前面选」）
  manualBars: Record<string, number[]>;                   // 声部 id → 哪些小节线是人插的（小节序号，0 起）；自动的不进数据
  unwritten: string[];                                    // 还没写音高的音（MusicXML 里的 note id）
}

/** 休息室里一个角色的快照 `.moonsinger/lounge/<角色 id>.json`。 */
export interface LoungeRoleV1 {
  version: 1;
  id: string;                          // "r1"
  name: string;                        // 谱上写的角色名（<part-name>）
  sound: string;                       // MusicXML 官方乐器语义 id（<instrument-sound>，src/score/roles.ts）
  active: string;                      // 上场的候选 id
  candidates: CandidateV1[];
}
export interface CandidateV1 {
  id: string;                          // "c1" 月读完整 / "c2" 月读元音 / "c0" 别家谱原来的乐器
  name: string;                        // 候选的名字（不上谱）
  gm: { program: number | null; variant: string | null };   // GM 号 + 变体名（写进 MusicXML <midi-program> / <virtual-instrument>）
  hum?: "la" | "n" | "u" | "o" | "a";  // 没写歌词的音唱什么（月读的候选才有）
  calibrationDb: number;               // 响度校准（看得见、能调的默认，不偷偷自动）
  chain: unknown[];                    // 跟着演奏者走的效果链（留位，现在空）
  engines: Record<string, unknown>;    // 引擎参数按引擎名分组；不认识的原样写回
}

/** `.moonsinger/studio.json`：录音房。 */
export interface StudioV1 {
  version: 1;
  mics: { id: string; name: string; gainDb: number; pan: number }[];   // pan −1…1（写 MusicXML 时 ×90）
}

// ═══ v2 提案（未写入文件；多轨落地时改 FORMAT + migrate + 冻结 v1 样本）═══════════════════════
// 三条 user 裁决（2026-10-07，契约草稿 §7.7 / §7.8 / §8）：
//   ① 曲线是真相：绝对值、SI；谱上的 mp / mf / < > / 跳音 / 重音从曲线算出来写进 MusicXML（低保真可视化 + 备份）；默认演绎不藏在 app，
//      一个音没画曲线就用候选快照里写明的默认数。
//   ② 调号 / 拍号 = 各声部自己的画法，不共享、不影响渲染；真相 = 音符 + 小节线（对齐标记）。速度、段落记号仍整首一份（待 user 确认）。
//   ③ 休息室是歌的一部分（不做跨歌笔架）；新建角色从 app 内置预设 by value 拷进歌；音源按包名 + sha256 钉；渲染 = 纯函数(文件)。

/** score.json 第 2 版：按声部各自一份；打击乐声部另一种记谱（user「鼓是最优先的」）。调号 / 拍号 token 留在各声部的 MusicXML 里，不进这里。 */
export interface ScoreExtV2 {
  version: 2;
  parts: {
    id: string; role: string; mic: string;
    kind: "pitched" | "percussion";
    manualBars: number[];              // 这个声部人插的小节线（自动小节线要不要物化成存着的 = 契约 §7.8 待定）
    unwritten: string[];               // 这个声部还没写音高的音
  }[];
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

/** 休息室角色快照第 2 版：候选带音源身份（哈希）+ 纯函数要的全部显式数字。 */
export interface LoungeRoleV2 {
  version: 2;
  id: string; name: string; sound: string; active: string;
  candidates: CandidateV2[];
}
export interface CandidateV2 {
  id: string; name: string;
  /** 音源身份：装了且哈希对 = 出声；否则没人上场、不出声、报错、人来换（不自动替补）。字节进不进文件看体积 / 许可证（§8）。 */
  source:
    | { kind: "pack"; pack: string; sha256: string }                                        // 家族模型仓的包（月读）
    | { kind: "gm"; program: number; bank?: number; drums?: boolean; soundfont: { pack: string; sha256: string } }   // GM 音色，soundfont 按哈希钉
    | { kind: "builtin"; name: string };                                                     // app 内置（元音采样器）
  //   sha256 = **包 manifest 的哈希**（家规「app 钉 manifest 的 sha256，不钉网址」；manifest 里才是逐片哈希），不是 sf2 / onnx 单个文件的。
  //   包按家规拆小（「拆小包，包之间互不知道」）：GM 鼓组单独一包、旋律乐器另包；一首歌用到几个包就有几个候选各钉各的。
  /** 署名与许可证 by value（2026-10-07 编辑器 session 问、Fable 定：纯函数(文件) + 「署名义务跟音源走」+ 反弃坑 → 包的主机没了文件也知道该谢谁）。
   *  从包 manifest 的许可证快照抄过来；text 可省（太长时只留 name + url + 文本的 sha256）。 */
  credit: { attribution: string[]; license: { name: string; url?: string; text?: string; textSha256?: string } };
  gm: { program: number | null; variant: string | null };   // 写给别的软件看的（MusicXML）
  hum?: "la" | "n" | "u" | "o" | "a";
  calibrationDb: number;
  /** 一个音没画曲线时用的默认数（by value，不藏在 app）：参数名 → 值，单位同 curves.json 的 units。 */
  defaults: Record<string, number>;
  /** 谱上记号 ↔ 曲线的换算表（by value）：力度字母 → dB；跳音 / 保持吃掉多长（0–1）；重音加多少 dB。曲线 → 记号的量化也查它。 */
  dynamicsDb: Record<"pp" | "p" | "mp" | "mf" | "f" | "ff", number>;
  articulation: { staccatoGate: number; tenutoGate: number; accentDb: number };
  chain: FxV2[];                       // 跟着演奏者走的效果（琴箱 / 音箱 / 琶音器）
  engine: string;                      // 用哪个引擎出声（"piper-world" / "soundfont" / "sampler"…）
  engines: Record<string, unknown>;    // 引擎参数按引擎名分组；不认识的原样写回
}
export interface FxV2 { id: string; kind: string; engine: string; params: Record<string, unknown>; owner: string }   // owner = 设备主人（候选 id / 总线 id）

/** studio.json 第 2 版：麦克风 → 总线 → 总输出；侧链；人录的音频（§8，非破坏性）。时间线自动化（按小节:拍）以后加。 */
export interface StudioV2 {
  version: 2;
  mics: { id: string; name: string; gainDb: number; pan: number; to: string }[];          // to = 总线 id 或 "master"
  buses: { id: string; name: string; gainDb: number; pan: number; chain: FxV2[]; to: string }[];
  master: { gainDb: number; chain: FxV2[] };
  sidechains?: { from: string; to: string; fx: string }[];
  recordings?: { id: string; audio: string; startSec: number; inSec: number; outSec: number; gainDb: number }[];   // audio = attachments/audio/<id>.<ext>
}
