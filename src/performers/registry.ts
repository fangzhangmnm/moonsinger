// registry.ts —— 演奏者插件的注册表（ADR-0004 `ai-docs/adr/0004-plugins-at-five-seams-core-stays.md`：插件只挂五处接缝，这里是「出声」那一处）。
//   created 2026-10-14 by Claude Fable 5.1（屎山维护纪元刀 1：唱歌 / 播放胶水抽出 main.ts 的同时建这张表；
//   user 2026-10-14「在系统里只是注册表里的一项 对！！！」「每个插件实例一个地址 种类:名字@版本」「插件建议用一个内部的guid，然后加上英文名用来故障恢复自愈」）。
//
// 规矩：
//   · 一个演奏者插件 = guid（出生时定、永不改）+ 英文名（人读的、故障恢复用）+ 版本（整数）；地址写成 `performer:<name>@<version>`。
//   · 歌里存地址 + by-value 参数（现在 = CandidateV2.instrument，engine 字段 = 英文名；套 guid 壳是格式那一刀的事，这里先按名字解析）。
//   · 代码里不许再按引擎名分支（`engine === "tsukuyomi"` 这类）；要知道「这位能什么」就问插件的能力字段，要让它干活就调它的方法。
//   · 认不出的（engine 不在表里）= null：时间线报「还没有人上场」、不出声、不替补（10-07 纪律）。
//   · 版本比歌里记的新 = 画灰 + 提示「升级到 @N？」，user 点了才跑插件自带的迁移；**不静默换**（user 2026-10-14「插件升级了是变灰提示你按升级，而不是静默换」）。
//     解析四种情况（对版本 / 待升级 / 同名顶上要人确认 / 认不出）在 ADR-0004 §2.2；带 guid 的壳和版本比对等格式那一刀套上去再做，现在歌里还只有引擎名。
//     怎么露出来（一张清单 / 常驻角标 / 开歌一条 toast / 导出面板一行；patch-minor-major 落在迁移步骤上；旧 app 开新歌逐轨灰）= ADR-0004 §2.2½（user 2026-10-14「一套机制、四个出口 同意」），还没落地。
import type { Extras, GmCandidate } from "../format/project.ts";
import type { VelCurve } from "../gm/sf2-subset.ts";
import type { Catalog } from "../gm/catalog.ts";
import type { Hum } from "../format/contract.ts";
import type { FxV2 } from "../format/contract.ts";
import type { PerformerInfo } from "../engine/timeline.ts";
import type { TrackSpec, GainSeg, AuditionInst } from "../engine/studio.ts";
import type { Mark } from "../score/perform.ts";
import type { PercKind } from "../gm/percussion.ts";

/** 唱不唱字：words = 唱歌词；hum = 只哼（歌词画灰「只哼」）；none = 乐器，不唱。 */
export type LyricsAbility = "words" | "hum" | "none";
/** pad 键底部提示的音域（人声固定；乐器看目录 = null，由界面另查）。 */
export type FixedRange = { lo: number; hi: number; who: string } | null;
/** 时间线交给插件的一个音（秒；力度已按谱算好）。 */
export interface LightNote { midi: number; t0: number; t1: number; vel?: number; /** 写的结尾（只有被踏板留长了的才有，score/pedal.ts；追音用，规矩八）。 */ w1?: number }
/** 只要知道「哪首歌的哪个角色」的调用都用这个。 */
export interface RoleCtx { extras: Extras; role: string }
/** 出声前准备要用的东西（胶水给；插件只拿它要的）。 */
export interface PrepareCtx extends RoleCtx {
  engine: { hasBank(sha: string): boolean; bank(sha: string, bytes: Uint8Array): Promise<void> };
  resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
  ensureVowels(): Promise<void>;
}
/** 载进录音房的库能问什么（引擎本身就满足它）：预设下标；L 曲线（7-N：从库的字节算、按键懒算；库没载 = null）。 */
export interface BankLookup { presetIndex(sha: string, bank: number, program: number): number; velCurve(sha: string, bank: number, program: number): VelCurve | null }
export interface InfoCtx extends RoleCtx, BankLookup {}
export interface TrackCtx { id: string; notes: LightNote[]; gain: GainSeg[] | null; chain?: FxV2[]; hum: Hum; info: PerformerInfo }
export type TrackResult = { track: TrackSpec; from?: number } | { unplayable: string };
/** 按键试听（弹 / 写音 / 拖音高的预听）：光标处的力度已算好（vel = MIDI 力度 0–1，有力度表的用；dB = 音量，没有的用）；kana = 这首歌哼的字。 */
export interface AuditionCtx extends RoleCtx {
  kana: string;
  dyn: { vel: number; dB: number };
  engine: { hasBank(sha: string): boolean; presetIndex(sha: string, bank: number, program: number): number };
  /** 库还没载好：这一下丢掉、顺手去载（试听要即时，迟到的音更烦）。 */
  ensureBank(): void;
}
/** 试听用谁出声；gainDb = 力度带来的那部分（通道的增益 / 声像归轨，胶水加）。null = 这一下不出声。 */
export type AuditionTarget = { inst: AuditionInst; key: (midi: number) => number; vel: number; gainDb: number };
/** 谱上怎么画这位（只是画法，数据不动）：xHead = 固定敲一个键 → × 符头；perc = 鼓 / 音效 → 鼓谱。 */
export type Notation = { xHead?: true; perc?: PercKind };
/** 乐器页「怎么演」里这位自报的一行（ADR-0004 §2.5「槽旁的参数行由插件自报，不是 main.ts 写死」；2026-10-15 刀 5 之一）：
 *  control / note = HTML 片段（宿主的 row() 排版；按钮带 data-v，按到了回 onInspector）；place = 放哪：主块（默认）/ 「高级」折叠 / 末尾。 */
/** 乐器页上的一行。id = 和「现在的默认」比的那一行（DefaultRowDef.id，16-6；不比的行不给）；value = 这一行的值写成一句话（「现在的默认」那一句用同一个函数在默认的那一位上再算一次）。 */
export interface InspectorRow { label: string; control: string; note?: string; place?: "adv" | "tail"; id?: string; value?: string }
type Cand = Record<string, unknown>;
/** 乐器页上能和「现在的默认」比的一行（16-6，统筹 2026-11-13）。keys = 候选身上这一行管的路径（点分；整张表 / 整个数组也行），每个会改声音的键恰好落在一行上
 *  （守卫 test/performer-defaults.test.ts：按「这位的声音变不变」核）。when = 这位有没有这一行（按能力字段和台上这位的身份，不按引擎名）。
 *  要问音乐目录、目录还没载的那几行 = 插件 castNow 报 pending（先不比）。resettable: false = 只标出来、没有「默认」钮（这位自己的效果：没有编辑入口，清了界面上做不回来）。
 *  same = 怎么算一样（没给 = 逐字节比 JSON）。reset = 改回默认要连带改别的（没给 = 把 keys 从默认那一位原样抄过来）。 */
export interface DefaultRowDef {
  id: string; label: () => string; keys: readonly string[];
  when?(p: PerformerPlugin, cur: Cand): boolean;
  resettable?: false;
  same?(cur: Cand, def: Cand): boolean;
  reset?(extras: Extras, role: string, def: Cand, hum: Hum): Extras;
}
export interface InspectorCtx extends RoleCtx {
  hum: Hum;
  /** 这个声部显示成什么（宿主从唯一出口 src/format/part-show.ts 拿，12-4；插件不自己拼声部名）。撤销的话里用。 */
  roleLabel: string;
  /** 音乐目录（载好了才有；没载 = 行里少几句说明，宿主载好会重画）。 */
  catalog: Catalog | null;
  esc(s: string): string;
  /** 一个选项钮（亮 = 现在是它）。 */
  chip(v: string, label: string, on: boolean, title?: string): string;
  /** 这次打开里手边有的子集字节（找到过 / 加进来的；歌里嵌的在候选的 bytes 里）。没有 = undefined（声音载好后宿主会重画）。 */
  bankBytes(sha256: string): Uint8Array | undefined;
}
/** 行里的按钮按到了：改成什么（休息室新值 + undo 的话 + 连续拖并成一步的 gesture + 要不要把正在响的停掉）。 */
export interface InspectorChange { extras: Extras; label: string; gesture?: string; silence?: boolean }

export interface PerformerPlugin {
  readonly guid: string;
  readonly kind: "performer";
  /** 英文名 = 歌里 `instrument.engine` 的值（第一版参数里的引擎名就是它）。 */
  readonly name: string;
  readonly version: number;
  /** 界面上的名字（中文）。 */
  readonly label: string;
  /** 候选 chip 的悬浮说明（一句话：是谁、代价是什么）。 */
  readonly description: string;
  /** 出声方式：chunks = 慢引擎按句出块（时间线出 ChunkPlan、worker 唱、录音房放块）；notes = 快引擎音符表（录音房里实时合成）。 */
  readonly sound: "chunks" | "notes";
  /** 能不能叠音（pad 叠键、两键同按、时间线的和弦）。 */
  readonly poly: boolean;
  readonly lyrics: LyricsAbility;
  readonly hintRange: FixedRange;
  /** 认哪些记号（不认的谱上画灰 + 明说；`test/honors.test.ts` 核「表说认 = 出声真变了」）。 */
  readonly honors: readonly Mark[];
  /** 认哪几种踏板（没写 = 都不认 → 踏板记号画灰、明说）。只写出声真接了的：11-1 = 延音；持音、弱音 11-2。test/pedal.test.ts 核「表说认 = 出声真变了」。 */
  readonly pedals?: readonly import("../score/song.ts").PedalKind[];
  /** 本来就连着唱（连线 / 保持对它没意义，断句用呼吸）→ 这两个记号画灰的理由是 "sung" 而不是 "gap"。 */
  readonly connected: boolean;
  /** 力度怎么落：velocity = 按下那一下的 MIDI 力度（候选带力度表 dynamicsVel，深度是库给每件乐器写的、引擎自己读，vendor/tsf/patch-tsf.py 补丁 2）；
   *  gain = 音量曲线（dB）乘在声音上（候选带 dB 表 dynamicsDb，16-4）。乐器页按这个摆哪一行；存档按这个分这位身上写哪些键（format/project.ts dynPathOf / ART_KEYS_BY）。
   *  **这个字段是格式契约的一部分**（统筹 2026-11-12 夜）：它决定歌里这位身上写哪些键、不写哪些键，所以一个引擎名走哪条路永远不变——想换路 = 换一个新的引擎名
   *  （同「键的意思永远不变」）。守卫：test/art-keys-by-path.test.ts 把现有三个引擎各走哪条路钉住。 */
  readonly dynamics: "velocity" | "gain";
  /** 新上场的这位默认的「响度」（calibrationDb，dB）：插件 / 库自己报（9-3；user「是不同库之间需要调」）。library = 候选的 origin.library（SoundFont 按库；
   *  别的引擎不看）。乐器页的「默认」钮回到它。库和库之间只在这一个数上对齐；混音台的推子是这首歌的决定，不算。 */
  defaultCalibrationDb(library: string | null): number;
  /** 拍子轻重预设的类别：voice = 人声一档；gm = 按 GM 音色家族 / 鼓件（要 gm 参数）。 */
  readonly grooveCategory: "voice" | "gm";
  /** 能不能从休息室删掉（第一公民的两位不删；带自己字节的乐器能删）。 */
  readonly removable: boolean;
  /** 出声参数里这位自己的那部分（gm / 分段唱 / 着力点）；通用部分（力度表 / 校准 / 修八度 / 链 / 拍子轻重）胶水填。 */
  info(ctx: InfoCtx): Pick<PerformerInfo, "gm" | "chunk" | "hitSec" | "singOpt" | "velDb" | "outputGainDb" | "missing">;
  /** 出声前准备：库进录音房 / 元音表。抛错 = 这位出不了声（胶水报出来、这个声部不出声、其余照放）。 */
  prepare(ctx: PrepareCtx): Promise<void>;
  /** notes 模式：音符表 → 这位的轨（chunks 模式没有这一步，时间线自己出块）。 */
  track?(ctx: TrackCtx): TrackResult;
  /** 谱上怎么画（没有 = 普通符头、普通谱）。 */
  notation?(ctx: RoleCtx): Notation;
  /** 按键试听用谁出声（没有 = 这位不能试听）。 */
  audition?(ctx: AuditionCtx): AuditionTarget | null;
  /** 这位「现在新上场」会带着什么（16-6）：模板 + 音乐目录按值抄的那几样 + 库报的响度。cur = 台上这位（身份——库、音色、固定敲哪个键——照它）。
   *  目录没载、又要靠它的那几样 = pending 里列出路径（那几行先不比、不算）。乐器页的「现在的默认」、「默认」钮、混音台「乐手 N 处不同」都问它（performers/defaults.ts）。 */
  castNow(cur: Cand, catalog: Catalog | null): { cand: Cand; pending: readonly string[] };
  /** 这位自己的、能和「现在的默认」比的行（16-6；通用的那几行在 performers/defaults.ts）。id 和 inspector 那几行的 id 对上。 */
  readonly defaultRows?: readonly DefaultRowDef[];
  /** 乐器页「怎么演」里这位自己的参数行（通用的——响度 / 音和音之间 / 力度记号 dB 表 / 哼的字——宿主按能力字段摆）。 */
  inspector?(ctx: InspectorCtx): InspectorRow[];
  /** 自己那几行的按钮按到了（data-v）：改成什么；不认识 = null。 */
  onInspector?(v: string, ctx: InspectorCtx): InspectorChange | null;
}

const byName = new Map<string, PerformerPlugin>();
const byGuid = new Map<string, PerformerPlugin>();
export function registerPerformer(p: PerformerPlugin): PerformerPlugin {
  if (byName.has(p.name) || byGuid.has(p.guid)) throw new Error(`performer plugin registered twice: ${p.name} / ${p.guid}`);
  byName.set(p.name, p); byGuid.set(p.guid, p);
  return p;
}
/** 按英文名（= 歌里的 engine 字段）找插件；不认识 = null。 */
export function performerOf(engine: string | null | undefined): PerformerPlugin | null { return (engine && byName.get(engine)) || null; }
export function performerByGuid(guid: string): PerformerPlugin | null { return byGuid.get(guid) ?? null; }
export function performers(): readonly PerformerPlugin[] { return [...byName.values()]; }
/** 地址：`performer:<name>@<version>`（ADR-0004 §2.2）。 */
export const addressOf = (p: PerformerPlugin): string => `${p.kind}:${p.name}@${p.version}`;
