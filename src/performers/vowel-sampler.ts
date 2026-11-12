// vowel-sampler.ts —— 演奏者插件：小月相（元音版）= app 随带的元音表（assets/preview/）在录音房里实时合成，只哼不唱字。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
import { _t } from "../i18n/index.ts";
import { registerPerformer } from "./registry.ts";
import { HUM_KANA } from "../engine/timeline.ts";
import type { NoteEv } from "../engine/studio.ts";
import { TSUKUYOMI_RANGE } from "./tsukuyomi.ts";
import { BUILTIN_CALIBRATION_DB } from "../format/performance.ts";

export const vowelSampler = registerPerformer({
  guid: "b9d4e7a2-51c6-4f0b-8e3d-7a9c2f6b1d58", kind: "performer", name: "vowel-sampler", version: 1, label: _t("小月相（元音）"),
  description: _t("小月相的元音采样：按下即响、任何设备都能跑"),
  sound: "notes", poly: false, lyrics: "hum", hintRange: TSUKUYOMI_RANGE,
  // 和乐器同一条 lightMarks（跳音截短 / 呼吸收短 / 保持·连线 = 不留缝）；气声 / 出声的换气只有完整版做得到；琶音 = 单声
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost"],
  connected: false, dynamics: "gain", grooveCategory: "voice", removable: false,
  velocityDepth: 800,   // 同小月相（施工单 9-4 第 4 条）
  defaultCalibrationDb: () => BUILTIN_CALIBRATION_DB["vowel-sampler"],   // 9-3：内置预设表里她那一格
  info: () => ({ gm: null, chunk: "phrase" }),
  prepare: async (ctx) => { await ctx.ensureVowels(); },
  track: ({ id, notes, gain, chain, hum, info }) => ({
    track: { id, kind: "vowel", kana: HUM_KANA[hum ?? "n"], notes: notes.map((n): NoteEv => ({ t0: n.t0, t1: n.t1, key: n.midi, vel: n.vel ?? info.velocity, preset: 0 })), gain, ...(chain?.length ? { chain } : {}) },
  }),
  audition: ({ kana, dyn }) => ({ inst: { kind: "vowel", kana }, key: (m) => m, vel: 1, gainDb: dyn.dB }),
});
