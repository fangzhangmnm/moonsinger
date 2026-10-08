// sf-key.ts —— 谱上写的音 → SoundFont 该敲哪个键（纯函数，离线渲染和键盘试听共用）。created 2026-10-08 by Claude Opus 5.5
// 三种情况（演奏者 by value 带着的，契约 InstrumentV2 soundfont 的 note / sfx + 候选的 transpose）：
//   ① 固定键（note）：鼓件；音效默认也是——每个音都敲原速键（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关」）。
//   ② 音高对齐（sfx.align）：音效关掉固定原速、想用它弹旋律时，按写的音反算键，让谱上的音 = 听到的音
//      （user「碰到猫叫歌才关，但这个时候也许需要音高修正」）。GS 的音效每升一个键音高只升 centsPerKey 音分（多为 50），
//      所以是斜率 100 / centsPerKey 的直线，不是平移：键 = 原速键 + (写的音 − 原速时听到的音高) × 100 / centsPerKey。数据 = 仓鼠 v8 的 sampleKey（TSF 实测）。
//   ③ 其余：写的音 + 修八度 / 移调（transpose，默认 0）。
export interface SfxInfo { key: number; midi?: number; centsPerKey?: number; align?: boolean }
export interface SfKeyInst { note?: number; sfx?: SfxInfo }

/** 写的音（MIDI）→ 敲的键（0–127）。 */
export function sfKey(written: number, inst: SfKeyInst, transpose = 0): number {
  if (inst.note !== undefined) return inst.note;
  const s = inst.sfx, w = written + transpose;
  const k = s?.align && s.midi !== undefined && s.centsPerKey ? Math.round(s.key + ((w - s.midi) * 100) / s.centsPerKey) : w;
  return Math.max(0, Math.min(127, k));
}
/** 这个音效能不能「音高对齐」：原速时有听得出的音高（宽带噪声没有）。 */
export const canAlign = (s: SfxInfo | undefined): boolean => !!s && s.midi !== undefined && !!s.centsPerKey;
