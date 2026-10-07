// lab-score.ts —— 一串 token → Lab 唱法吃的乐谱结构（Lab/20261005 月读第一首/score.mjs 的格式）。created 2026-10-06 by Claude Opus 5.5
// 格式（sing.mjs 头注释）：每个唱出来的音节一条 { kana, notes: [[midi, 八分音符数]…], rest?: 八分音符数 }，
//   一个音节拖过几个音 = notes 里几项（うさぎ 的 は）；另有一整句 TEXT 喂给 piper 注音：休止处「、」、句末「。」，
//   sing.mjs 会去掉标点再注音，并要求 TEXT 里的音节数 == 条目数。
// 映射：歌词「ー」= 拖腔、tie 音 → 并进前一个音节的 notes；休止 → 加到前一个音节的 rest；小节线、调号、拍号不进（只是记谱）；
//   速度：Lab 格式只有一个速度 → TEMPO_QUARTER = 第一个音处的速度，后面换了速度的音按比例换算成「那个速度下的八分音符数」；
//   空音高 → 有效音高（继承上一个）；空歌词 → 这首歌的「哼的字」（默认 la = 「ら」/「啦」，同 SynthV 的默认 la；
//   user 2026-10-06「我日语能力还没进prealpha哦，没歌词输入的话月读念什么」「哼歌会用什么」→ 开关「同意」）。
// 开头的休止 Lab 格式表达不了（它有固定的 leadIn），第一版直接丢掉。

import { midiOf } from "./pitch.ts";
import { type Song, type Hum, TPQ, effectivePitch, isTimed, timeline } from "./song.ts";
import { MELISMA_MARK } from "./lyrics.ts";

export interface LabEntry { kana: string; notes: [number, number][]; rest?: number; hum?: boolean; hyph?: boolean }   // hyph = 英文：这个词没完（下一条接着拼）   // hum = 没写歌词、唱「哼的字」（核心的 humNasal / humConsMin 只管这些）
export type SingLang = "ja" | "zh" | "en";
export interface LabScore { SCORE: LabEntry[]; TEXT: string; TEMPO_QUARTER: number; LANG: SingLang }

/** 「哼的字」四档在两种语言里的字：la 舌尖起音、节奏最清楚；n 闭嘴哼（同高的几个音会连成一个）；u = Ooh；a = Ahh（GM 人声兜底的两个元音）。 */
// 英文歌里：la / hum / ooh / oh / ah（「mm」「hmm」词典里没有元音唱不出来，嗯 只好用 hum）
export const HUM_SYLLABLE: Record<Hum, Record<SingLang, string>> = { la: { ja: "ら", zh: "啦", en: "la" }, n: { ja: "ん", zh: "嗯", en: "hum" }, u: { ja: "う", zh: "呜", en: "ooh" }, o: { ja: "お", zh: "哦", en: "oh" }, a: { ja: "あ", zh: "啊", en: "ah" } };

export function toLabScore(song: Song, lang: SingLang = "ja"): LabScore {
  const eighth = TPQ / 2, tl = timeline(song), base = tl[0]?.bpm ?? 90;
  const bpmOf = new Map(tl.map((x) => [x.index, x.bpm]));
  const out: LabEntry[] = [];
  song.tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const len = (t.dur / eighth) * (base / bpmOf.get(i)!);
    if (t.kind === "rest") { const last = out[out.length - 1]; if (last) last.rest = (last.rest ?? 0) + len; return; }
    const midi = midiOf(effectivePitch(song.tokens, i));
    const last = out[out.length - 1];
    // 拖腔（ー / ~）和连音线连着的音（tie）都并进上一个音节：同一个字唱过几个音 / 同一个音连下去
    if ((t.lyric === MELISMA_MARK || t.tie) && last && !last.rest) { last.notes.push([midi, len]); return; }
    const lyric = t.lyric && t.lyric !== MELISMA_MARK ? t.lyric : null;
    out.push(lyric ? { kana: lyric, notes: [[midi, len]], ...(lang === "en" && t.hyph ? { hyph: true } : {}) } : { kana: HUM_SYLLABLE[song.hum ?? "la"][lang], notes: [[midi, len]], hum: true });
  });
  const TEXT = lang === "en"   // 英文：音节按 hyph 拼回单词、空格隔开（核心自己从 SCORE 拼词，TEXT 只给人看 / 日志）
    ? out.map((e) => e.kana + (e.hyph ? "" : " ")).join("").trim()
    : out.map((e, k) => e.kana + (e.rest ? "、" : k === out.length - 1 ? "。" : "")).join("");
  return { SCORE: out, TEXT, TEMPO_QUARTER: base, LANG: lang };
}
