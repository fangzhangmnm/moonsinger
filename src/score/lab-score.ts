// lab-score.ts —— 一串 token → Lab 唱法吃的乐谱结构（Lab/20261005 月读第一首/score.mjs 的格式）。created 2026-10-06 by Claude Opus 5.5
// 格式（sing.mjs 头注释）：每个唱出来的音节一条 { kana, notes: [[midi, 八分音符数]…], rest?: 八分音符数 }，
//   一个音节拖过几个音 = notes 里几项（うさぎ 的 は）；另有一整句 TEXT 喂给 piper 注音：休止处「、」、句末「。」，
//   sing.mjs 会去掉标点再注音，并要求 TEXT 里的音节数 == 条目数。
// 映射：一个音上几个音节（「+」连着的，数据里「‿」）= 平分这个音、一个音节一条；歌词「ー」= 拖腔、tie 音 → 并进前一个音节的 notes；休止 → 加到前一个音节的 rest；小节线、调号、拍号不进（只是记谱）；
//   速度：Lab 格式只有一个速度 → TEMPO_QUARTER = 第一个音处的速度，后面换了速度的音按比例换算成「那个速度下的八分音符数」；
//   空音高 → 有效音高（继承上一个）；空歌词 → 这首歌的「哼的字」（默认 n =「ん」/「嗯」，user 2026-10-07「默认嗯」；原来默认 la，同 SynthV；
//   user 2026-10-06「我日语能力还没进prealpha哦，没歌词输入的话月读念什么」「哼歌会用什么」→ 开关「同意」）。
// 开头的休止 Lab 格式表达不了（它有固定的 leadIn），第一版直接丢掉。

import { midiOf } from "./pitch.ts";
import { type Token, type Hum, type TempoMap, TPQ, effectivePitch, isTimed, timeline, artOf } from "./song.ts";
import { MELISMA_MARK, ELISION } from "./lyrics.ts";

export interface LabEntry { kana: string; notes: [number, number][]; rest?: number; hum?: boolean; hyph?: boolean; before?: "^" | "v" | "O" }   // before = 这个字前面的记号（唱法核心：v = 换一口气，从前一个音末尾偷时间）   // hyph = 英文：这个词没完（下一条接着拼）   // hum = 没写歌词、唱「哼的字」（核心的 humNasal / humConsMin 只管这些）
export type SingLang = "ja" | "zh" | "en";
export interface LabScore { SCORE: LabEntry[]; TEXT: string; TEMPO_QUARTER: number; LANG: SingLang }

/** 「哼的字」四档在两种语言里的字：la 舌尖起音、节奏最清楚；n 闭嘴哼（同高的几个音会连成一个）；u = Ooh；a = Ahh（GM 人声兜底的两个元音）。 */
// 英文歌里：la / hum / ooh / oh / ah（「mm」「hmm」词典里没有元音唱不出来，嗯 只好用 hum）
export const HUM_SYLLABLE: Record<Hum, Record<SingLang, string>> = { la: { ja: "ら", zh: "啦", en: "la" }, n: { ja: "ん", zh: "嗯", en: "hum" }, u: { ja: "う", zh: "呜", en: "ooh" }, o: { ja: "お", zh: "哦", en: "oh" }, a: { ja: "あ", zh: "啊", en: "ah" } };

/** tokens = 一个声部（压平后的一串）；tempoMap = 第一个声部的速度表（这个声部不是第一个时给，自己串里的速度记号不算数）。 */
export function toLabScore(tokens: Token[], hum: Hum, lang: SingLang = "ja", tempoMap?: TempoMap, marks?: { staccatoGate: number }): LabScore {
  const eighth = TPQ / 2, tl = timeline(tokens, tempoMap), base = tl[0]?.bpm ?? 90;
  const bpmOf = new Map(tl.map((x) => [x.index, x.bpm]));
  const out: LabEntry[] = [];
  // 呼吸（2026-10-08，user 拍「月读在那儿换气」）：挂了 breath 的音 → 下一个字前面一个「v」（唱法核心从这个音末尾偷一口气的空当）
  let breathNext = false;
  const push = (e: LabEntry) => { if (breathNext) { e.before = "v"; breathNext = false; } out.push(e); };
  // 跳音（2026-10-08，user「月读的跳音效果很差，不应该是切音频，而是看一下语音引擎后段里面她认什么修饰符号」）：唱法核心认的是谱上的休止（rest，
  //   核心自己做收尾的淡出、下一个字的辅音照常预备）——跳音 = 这个音唱 staccatoGate 那么长，剩下的变成休止；后面那个音还是同一个字（连音线 / 拖腔）= 不切
  const nextTimed = (i: number) => { for (let j = i + 1; j < tokens.length; j++) { const u = tokens[j]; if (isTimed(u)) return u; } return null; };
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    one(t, i);
    if (t.kind === "note" && artOf(t).includes("breath")) breathNext = true;
    if (marks && t.kind === "note" && artOf(t).includes("staccato")) {
      const nx = nextTimed(i), held = nx?.kind === "note" && (nx.tie || nx.lyric === MELISMA_MARK), last = out[out.length - 1], piece = last?.notes[last.notes.length - 1];
      if (!held && last && piece && !last.rest) { const cut = piece[1] * (1 - Math.max(0.05, Math.min(1, marks.staccatoGate))); if (cut > 0) { piece[1] -= cut; last.rest = cut; } }
    }
  });
  function one(t: Token & { dur: number }, i: number): void {
    const len = (t.dur / eighth) * (base / bpmOf.get(i)!);
    if (t.kind === "rest") { const last = out[out.length - 1]; if (last) last.rest = (last.rest ?? 0) + len; return; }
    if (t.kind !== "note") return;
    const midi = midiOf(effectivePitch(tokens, i));
    const last = out[out.length - 1];
    // 拖腔（ー / ~）和连音线连着的音（tie）都并进上一个音节：同一个字唱过几个音 / 同一个音连下去
    if ((t.lyric === MELISMA_MARK || t.tie) && last && !last.rest) { last.notes.push([midi, len]); return; }
    const lyric = t.lyric && t.lyric !== MELISMA_MARK ? t.lyric : null;
    if (!lyric) { push({ kana: HUM_SYLLABLE[hum ?? "n"][lang], notes: [[midi, len]], hum: true }); return; }
    // 一个音上几个音节（「+」连着的，如 だ‿ん）：这个音平分给它们，一个音节一条（user 点头「唱的时候把这个音的时值切成几段，先按平均分」）
    const parts = lyric.split(ELISION).filter(Boolean);
    parts.forEach((kana, k) => push({ kana, notes: [[midi, len / parts.length]], ...(lang === "en" && t.hyph && k === parts.length - 1 ? { hyph: true } : {}) }));
  }
  const TEXT = lang === "en"   // 英文：音节按 hyph 拼回单词、空格隔开（核心自己从 SCORE 拼词，TEXT 只给人看 / 日志）
    ? out.map((e) => e.kana + (e.hyph ? "" : " ")).join("").trim()
    : out.map((e, k) => e.kana + (e.rest ? "、" : k === out.length - 1 ? "。" : "")).join("");
  return { SCORE: out, TEXT, TEMPO_QUARTER: base, LANG: lang };
}
