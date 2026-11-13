// vowel-sampler.ts —— 演奏者插件：小月相（元音版）= app 随带的元音表（assets/preview/）在录音房里实时合成，只哼不唱字。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
import { _t } from "../i18n/index.ts";
import { registerPerformer } from "./registry.ts";
import { HUM_KANA } from "../engine/timeline.ts";
import type { NoteEv } from "../engine/studio.ts";
import { TSUKUYOMI_RANGE } from "./tsukuyomi.ts";
import { CALIBRATION_DEFAULT_DB, templateCandidate } from "../format/template.ts";

export const vowelSampler = registerPerformer({
  guid: "b9d4e7a2-51c6-4f0b-8e3d-7a9c2f6b1d58", kind: "performer", name: "vowel-sampler", version: 1, label: _t("小月相（元音）"),
  description: _t("小月相的元音采样：按下即响、任何设备都能跑"),
  sound: "notes", poly: false, lyrics: "hum", hintRange: TSUKUYOMI_RANGE,
  // 和乐器同一条 lightMarks（跳音截短 / 呼吸收短 / 保持·连线 = 不留缝）；气声 / 出声的换气只有完整版做得到；琶音 = 单声
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost"],
  connected: false, dynamics: "gain", grooveCategory: "voice", removable: false,
  defaultCalibrationDb: () => CALIBRATION_DEFAULT_DB,   // 现行的那一个默认（第 14 条）
  info: () => ({ gm: null, chunk: "phrase" }),
  castNow: () => ({ cand: templateCandidate("vowel-sampler"), pending: [] }),   // 「现在的默认」（16-6）= 模板那一位
  prepare: async (ctx) => { await ctx.ensureVowels(); },
  track: ({ id, notes, gain, chain, hum, info }) => ({
    track: { id, kind: "vowel", kana: HUM_KANA[hum ?? "n"], notes: notes.map((n): NoteEv => ({ t0: n.t0, t1: n.t1, key: n.midi, vel: n.vel ?? info.velocity, preset: 0 })), gain, ...(chain?.length ? { chain } : {}) },
  }),
  audition: ({ kana, dyn }) => ({ inst: { kind: "vowel", kana }, key: (m) => m, vel: 1, gainDb: dyn.dB }),
  // 元音表的满音量（16-4 B，统筹 2026-11-12 夜：元音版不加键，照实写一行只读）：表是离线预先唱好、随 app 带着的（scripts/gen-preview-vowels.mjs），生成时整张缩到峰值 0.8
  inspector: () => [{ label: _t("元音表的满音量"), control: `<b class="ip-val">${_t("峰值 0.8（−1.9 dB）")}</b>`,
    note: _t("元音版的声音是预先唱好、随 app 带着的一张元音表；生成那张表的时候整张缩到最响的一下 = 满幅的 0.8。这是这个库自己的满音量，这里不能调；上面「响度」那一行在它之上管这位乐手整体多响") }],
  onInspector: () => null,
});
