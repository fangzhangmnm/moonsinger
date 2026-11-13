// tsukuyomi.ts —— 演奏者插件：小月相（つくよみちゃん）完整版 = piper（时长接管）+ WORLD，按句出块（慢引擎）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   她是第一公民（默认演奏者、UX 为她服务），但在代码里只是这张表里的一项：时间线 / 录音房 / 胶水只看 sound / poly / lyrics…，不看名字。
//   唱法核心在 src/singer/sing-core.mjs；块的内容键 / 分段唱在 src/engine/timeline.ts（chunks 模式由时间线统一出块，插件只报能力 + 分段唱粒度）。
//   按键试听 = 元音表（v0.10.43；user「月读预览应该是每种哼法只有一个cache」），播放照旧完全版。
import { _t } from "../i18n/index.ts";
import { registerPerformer } from "./registry.ts";
import { activeSingChunk, activeSingCore, withSingChunk, withSingCore, type SingCoreKey } from "../format/project.ts";
import { TSUKUYOMI_DEFAULTS, CALIBRATION_DEFAULT_DB } from "../format/performance.ts";

/** 她的音域（A3–E5）：pad 键底部的提示；元音版同。 */
export const TSUKUYOMI_RANGE = { lo: 57, hi: 76, who: _t("小月相") } as const;

/** 乐器页「高级：唱法核心的旋钮」（存进候选的 defaults，by value、走 undo；2026-10-15 user「齐平和其他的也都放在高级设置里面可以持久化」）。why = 物理意义（探针 ai-docs/20261013-dango-c10-pop-probe.md §5 / §6）。 */
export const SING_CORE_ROWS: { key: SingCoreKey; label: string; values: number[]; names?: Record<number, string>; why: string }[] = [
  { key: "level", label: _t("齐平"), values: [0, 0.4, 0.8], names: { 0: _t("关") }, why: _t("每个字的响度往整句的中位数拉几成：关 = 照念的时候自己的轻重（字和字之间响度不可控）；0.8 = 拉八成（默认；2026-10-14 到 10-17 默认关过）。团子 C 段第 10 小节「そ」的破音是齐平「每字重起」在字的边界上跳出来的台阶，「连续」不跳") },
  { key: "levelContinuous", label: _t("齐平过渡"), values: [0, 1], names: { 0: _t("每字重起"), 1: _t("连续") }, why: _t("齐平开着时增益怎么从一个字换到下一个字：每字重起 = 在每个字的元音起点从 0 起、30 ms 内爬到这个字的目标，辅音不加；连续 = 从前一个字的增益起，经过辅音到元音起点后 30 ms 平滑过渡到这个字的") },
  { key: "levelMaxDb", label: _t("齐平上限"), values: [6, 12], names: { 6: "6 dB", 12: "12 dB" }, why: _t("齐平最多把一个字拉几 dB") },
  { key: "cleanMax", label: _t("借元音门槛"), values: [0.3, 0.4, 0.5], why: _t("一个字自己最干净那三分之一帧的杂度超过这个数 = 当它是气声念的，拿同一句里别的干净的同元音来唱（「そ」是 0.34）") },
  { key: "breath", label: _t("气息"), values: [0, 0.5, 1], names: { 0: _t("实声"), 1: _t("照念的") }, why: _t("合成前把每帧每个频段的杂度压到这个元音最干净那几帧的程度：0 = 全压成实声，1 = 照 piper 念出来的留着") },
];

export const tsukuyomi = registerPerformer({
  guid: "6f2c9a1e-3b7d-4e58-9c0a-2d5b8f1e7a41", kind: "performer", name: "tsukuyomi", version: 1, label: _t("小月相"),
  description: _t("小月相本人（つくよみちゃん；第一次要加载约 65 MB）"),
  sound: "chunks", poly: false, lyrics: "words", hintRange: TSUKUYOMI_RANGE,
  // 跳音 / 重音 / 强音 / 呼吸 / 气声 / 出声的换气 = 唱法核心（lab-score 带进唱谱）；力度类 = 音量曲线；连线 / 保持不认（本来就连着唱，连断第 3 步）；琶音 = 单声唱不了和弦
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale"],
  connected: true, dynamics: "gain", grooveCategory: "voice", removable: false,
  // 力度深度 800（施工单 9-4 第 4 条，统筹定；user 2026-11-12「小月相要不要也用库里多数乐器的那个深度 什么乐器的逻辑最像人声？你想想」）：
  //   GS 里三个人声类音色（Concert Choir / Voice Oohs / Synth Voice）都写 800，和长笛、双簧管、小提琴一样，而且亮度不随力度变——她的力度也是只变响度
  // 块乘多少（9-3，原来是 src/engine/timeline.ts 的 SUNG_GAIN，数不变）：唱法核心 raw 输出的补偿——刀 0 量的 raw 峰值 ≈ 0.42（うさぎ 0.419 / 団子 0.412）→ 乘到 0.89
  //   （原整首归一化的目标；按句出块后不再整首归一化，句与句的强弱照原样）
  chunkGain: 0.89 / 0.42,
  defaultCalibrationDb: () => CALIBRATION_DEFAULT_DB,   // 现行的那一个默认（第 14 条）
  info: ({ extras, role }) => ({ gm: null, chunk: activeSingChunk(extras, role), singOpt: activeSingCore(extras, role) }),   // 旋钮按值在候选里（乐器页「高级」）→ 进块的内容键
  prepare: async () => { /* 引擎预热 / 模型包下载在工作道里按需做（singer.warm / 第一次唱），不在这里 */ },
  audition: ({ kana, dyn }) => ({ inst: { kind: "vowel", kana }, key: (m) => m, vel: 1, gainDb: dyn.dB }),
  /** 乐器页里她自己的行（2026-10-15 刀 5 之一，原 main.ts drawInst 里的那两段原样搬来）：「高级」折叠里的唱法核心旋钮 + 末尾的分段唱。 */
  inspector: ({ extras, role, chip }) => {
    const cur = activeSingCore(extras, role), sc = activeSingChunk(extras, role);
    return [
      ...SING_CORE_ROWS.map((x) => ({ label: x.label, control: x.values.map((v) => chip(`core:${x.key}:${v}`, `${x.names?.[v] ?? v}${v === TSUKUYOMI_DEFAULTS[x.key] ? _t("（默认）") : ""}`, cur[x.key] === v, _t("改了用到的句子会重唱；存进歌里、能撤销"))).join(""), note: x.why, place: "adv" as const })),
      // 分段唱（这位演奏者的属性；user「开关是歌手的属性，可以有不同的粒度」）：长歌一口气唱完会撑爆 iPad 的内存；分段 = 一段唱完就放掉，重复的段 / 没改的句子直接复用
      { label: _t("分段唱"), control: (([["phrase", _t("每句"), _t("在休止处切（休止 ≥ 0.25 秒）：内存最省，改一句只重唱那一句")], ["sheet", _t("每张纸"), _t("一张纸一段")], ["whole", _t("一整首"), _t("一口气唱完（以前的唱法；长歌在 iPad 上可能内存不够）")]] as const)).map(([v, l, t]) => chip(`chunk:${v}`, l, sc === v, t)).join(""),
        note: sc === "whole" ? _t("一口气唱完：句和句之间唱法最连贯，但长歌在 iPad 上可能内存不够") : _t("分段唱：一段唱完就放掉，重复的段 / 没改的句子直接拿上次的；段和段之间切在休止 / 纸界，整首最后统一音量"), place: "tail" as const },
    ];
  },
  onInspector: (v, { extras, role, hum, roleLabel }) => {
    const rn = roleLabel;
    if (v.startsWith("core:")) { const [, key, val] = v.split(":"), x = SING_CORE_ROWS.find((e) => e.key === key), n = Number(val); return x ? { extras: withSingCore(extras, role, x.key, n, hum), label: `「${rn}」${x.label}：${x.names?.[n] ?? n}` } : null; }
    if (v.startsWith("chunk:")) { const c = v.slice(6) as "phrase" | "sheet" | "whole"; return { extras: withSingChunk(extras, role, c, hum), label: _t("「{rn}」分段唱：{p}", { rn, p: c === "phrase" ? _t("每句") : c === "sheet" ? _t("每张纸") : _t("一整首") }) }; }
    return null;
  },
});
