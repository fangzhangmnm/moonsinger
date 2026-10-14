// tsukuyomi.ts —— 演奏者插件：小月相（つくよみちゃん）完整版 = piper（时长接管）+ WORLD，按句出块（慢引擎）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   她是第一公民（默认演奏者、UX 为她服务），但在代码里只是这张表里的一项：时间线 / 录音房 / 胶水只看 sound / poly / lyrics…，不看名字。
//   唱法核心在 src/singer/sing-core.mjs；块的内容键 / 分段唱在 src/engine/timeline.ts（chunks 模式由时间线统一出块，插件只报能力 + 分段唱粒度）。
//   按键试听 = 元音表（v0.10.43；user「月读预览应该是每种哼法只有一个cache」），播放照旧完全版。
import { registerPerformer } from "./registry.ts";
import { activeSingChunk, activeSingCore } from "../format/project.ts";

/** 她的音域（A3–E5）：pad 键底部的提示；元音版同。 */
export const TSUKUYOMI_RANGE = { lo: 57, hi: 76, who: "小月相" } as const;

export const tsukuyomi = registerPerformer({
  guid: "6f2c9a1e-3b7d-4e58-9c0a-2d5b8f1e7a41", kind: "performer", name: "tsukuyomi", version: 1, label: "小月相",
  description: "小月相本人（つくよみちゃん；第一次要加载约 65 MB）",
  sound: "chunks", poly: false, lyrics: "words", hintRange: TSUKUYOMI_RANGE,
  // 跳音 / 重音 / 强音 / 呼吸 / 气声 / 出声的换气 = 唱法核心（lab-score 带进唱谱）；力度类 = 音量曲线；连线 / 保持不认（本来就连着唱，连断第 3 步）；琶音 = 单声唱不了和弦
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale"],
  connected: true, dynamics: "gain", grooveCategory: "voice", removable: false,
  info: ({ extras, role }) => ({ gm: null, chunk: activeSingChunk(extras, role), singOpt: activeSingCore(extras, role) }),   // 旋钮按值在候选里（乐器页「高级」）→ 进块的内容键
  prepare: async () => { /* 引擎预热 / 模型包下载在工作道里按需做（singer.warm / 第一次唱），不在这里 */ },
  audition: ({ kana, dyn }) => ({ inst: { kind: "vowel", kana }, key: (m) => m, vel: 1, gainDb: dyn.dB }),
});
