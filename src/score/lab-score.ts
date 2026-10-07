// lab-score.ts —— 一串 token → Lab 唱法吃的乐谱结构（Lab/20261005 月读第一首/score.mjs 的格式）。created 2026-10-06 by Claude Opus 5.5
// 格式（sing.mjs 头注释）：每个唱出来的音节一条 { kana, notes: [[midi, 八分音符数]…], rest?: 八分音符数 }，
//   一个音节拖过几个音 = notes 里几项（うさぎ 的 は）；另有一整句 TEXT 喂给 piper 注音：休止处「、」、句末「。」，
//   sing.mjs 会去掉标点再注音，并要求 TEXT 里的音节数 == 条目数。
// 映射：歌词「ー」= 拖腔 → 并进前一个音节的 notes；休止 → 加到前一个音节的 rest；小节线不进（只是记谱）；
//   空音高 → 有效音高（继承上一个）；空歌词 → 「ら」（同行默认唱 la，同 SynthV）。
// 开头的休止 Lab 格式表达不了（它有固定的 leadIn），第一版直接丢掉。

import { midiOf } from "./pitch.ts";
import { type Song, TPQ, effectivePitch } from "./song.ts";
import { MELISMA_MARK } from "./lyrics.ts";

export interface LabEntry { kana: string; notes: [number, number][]; rest?: number }
export interface LabScore { SCORE: LabEntry[]; TEXT: string; TEMPO_QUARTER: number; LANG: "ja" | "zh" }

export const DEFAULT_SYLLABLE = { ja: "ら", zh: "啦" } as const;

export function toLabScore(song: Song, lang: "ja" | "zh" = "ja"): LabScore {
  const eighth = TPQ / 2;
  const out: LabEntry[] = [];
  song.tokens.forEach((t, i) => {
    if (t.kind === "bar") return;
    const len = t.dur / eighth;
    if (t.kind === "rest") { const last = out[out.length - 1]; if (last) last.rest = (last.rest ?? 0) + len; return; }
    const midi = midiOf(effectivePitch(song.tokens, i));
    const last = out[out.length - 1];
    if (t.lyric === MELISMA_MARK && last && !last.rest) { last.notes.push([midi, len]); return; }
    out.push({ kana: t.lyric && t.lyric !== MELISMA_MARK ? t.lyric : DEFAULT_SYLLABLE[lang], notes: [[midi, len]] });
  });
  const TEXT = out.map((e, k) => e.kana + (e.rest ? "、" : k === out.length - 1 ? "。" : "")).join("");
  return { SCORE: out, TEXT, TEMPO_QUARTER: song.tempo, LANG: lang };
}
