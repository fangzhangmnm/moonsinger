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
import { MELISMA_MARK, ELISION, isSmallKana, isSokuon } from "./lyrics.ts";
import { SING_MARKS, type SingMark } from "../format/performance.ts";

export interface LabEntry { kana: string; notes: [number, number][]; rest?: number; hum?: boolean; hyph?: boolean; before?: "^" | "v" | "O" }   // before = 这个字前面的记号（唱法核心：v = 换一口气，从前一个音末尾偷时间）   // hyph = 英文：这个词没完（下一条接着拼）   // hum = 没写歌词、唱「哼的字」（核心的 humNasal / humConsMin 只管这些）
export type SingLang = "ja" | "zh" | "en";
export interface LabScore { SCORE: LabEntry[]; TEXT: string; TEMPO_QUARTER: number; LANG: SingLang }

/** 「哼的字」四档在两种语言里的字：la 舌尖起音、节奏最清楚；n 闭嘴哼（同高的几个音会连成一个）；u = Ooh；a = Ahh（GM 人声兜底的两个元音）。 */
// 英文歌里：la / hum / ooh / oh / ah（「mm」「hmm」词典里没有元音唱不出来，嗯 只好用 hum）
export const HUM_SYLLABLE: Record<Hum, Record<SingLang, string>> = { la: { ja: "ら", zh: "啦", en: "la" }, n: { ja: "ん", zh: "嗯", en: "hum" }, u: { ja: "う", zh: "呜", en: "ooh" }, o: { ja: "お", zh: "哦", en: "oh" }, a: { ja: "あ", zh: "啊", en: "ah" } };

/** tokens = 一个声部（压平后的一串）；tempoMap = 第一个声部的速度表（这个声部不是第一个时给，自己串里的速度记号不算数）。 */
/** range = 只出这一段的 token（下标 [from, to)；月读分段唱用，见 singChunks）——速度、没写音高的音照样按整串的上下文算。不给 = 整串。 */
export function toLabScore(tokens: Token[], hum: Hum, lang: SingLang = "ja", tempoMap?: TempoMap, sing: Record<string, SingMark | null> = SING_MARKS, range?: readonly [number, number]): LabScore {
  const inRange = (i: number) => !range || (i >= range[0] && i < range[1]);
  const eighth = TPQ / 2, tl = timeline(tokens, tempoMap), base = tl.find((x) => inRange(x.index))?.bpm ?? 90;
  const bpmOf = new Map(tl.map((x) => [x.index, x.bpm]));
  const out: LabEntry[] = [];
  // 记号 → 唱法核心认的字前记号（v = 换气 / O = 大口换气 / ^ = 顿一下不换气）：怎么对应是这位演奏者自己的配置（候选 sing，by value；没写 = SING_MARKS），
  //   不写死在这里（2026-10-08 user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」；「跳音就是顿一下」「嗯重音也顿」「月读在那儿换气」）。
  //   at = this：这个字自己前面；at = next：下一个字前面。同一个字前面几个记号撞了：换气（v / O 本来就带空当）优先于 ^。
  //   拖着的同一个字（连音线 / 拖腔）前面放不了；跳到「下一个字」的那种，后面紧跟着的还是同一个字 = 放不了（顿不开）。
  const pick = (a: "^" | "v" | "O" | null, b: "^" | "v" | "O") => (!a ? b : a === "^" ? b : a);
  let nextMark: "^" | "v" | "O" | null = null, thisMark: "^" | "v" | "O" | null = null;
  const push = (e: LabEntry) => { const m = thisMark && nextMark ? pick(thisMark, nextMark) : thisMark ?? nextMark; if (m) e.before = m; nextMark = thisMark = null; out.push(e); };
  const nextTimed = (i: number) => { for (let j = i + 1; j < tokens.length; j++) { const u = tokens[j]; if (isTimed(u)) return u; } return null; };
  tokens.forEach((t, i) => {
    if (!isTimed(t) || !inRange(i)) return;
    const arts = t.kind === "note" ? artOf(t) : [], held = (u: Token | null) => u?.kind === "note" && (u.tie || u.lyric === MELISMA_MARK);
    thisMark = null;
    if (t.kind === "note" && !held(t)) for (const a of arts) { const s = sing[a]; if (s && s.at === "this") thisMark = pick(thisMark, s.mark); }
    one(t, i); thisMark = null;
    if (t.kind === "note" && !held(nextTimed(i))) for (const a of arts) { const s = sing[a]; if (s && s.at === "next") nextMark = pick(nextMark, s.mark); }
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
    // 小字自己占了一个音（っ / ゃ…；输入法分两次上屏、或者人就这么写）：唱法核心按读音数音节，っ 不是唱出来的音节、ゃ 不单独成拍——
    //   不并 = 「score 比 text 多几个音节」整段不出声（2026-10-08 user 报「90 sung syllables in the text, 92 in the score」：ふって / でっかい 的 っ 各占了一个音）。
    //   っ = 前一个音节后面停这么长（一下顿、不换气：下一个字前面「^」）；ゃ… = 前一个音节拖过这个音。前面没有音节（开头）= 当休止。
    if (isSmallKana(lyric)) {
      if (!last) return;
      if (isSokuon(lyric)) { last.kana += lyric; last.rest = (last.rest ?? 0) + len; nextMark = nextMark === "v" || nextMark === "O" ? nextMark : "^"; return; }
      if (!last.rest) { last.kana += lyric; last.notes.push([midi, len]); return; }
    }
    // 一个音上几个音节（「+」连着的，如 だ‿ん）：这个音平分给它们，一个音节一条（user 点头「唱的时候把这个音的时值切成几段，先按平均分」）；连着的小字并进前一个（ふ‿っ = ふっ）
    const parts = lyric.split(ELISION).filter(Boolean).reduce<string[]>((a, k) => (a.length && isSmallKana(k) ? [...a.slice(0, -1), a[a.length - 1] + k] : [...a, k]), []);
    parts.forEach((kana, k) => push({ kana, notes: [[midi, len / parts.length]], ...(lang === "en" && t.hyph && k === parts.length - 1 ? { hyph: true } : {}) }));
  }
  const TEXT = lang === "en"   // 英文：音节按 hyph 拼回单词、空格隔开（核心自己从 SCORE 拼词，TEXT 只给人看 / 日志）
    ? out.map((e) => e.kana + (e.hyph ? "" : " ")).join("").trim()
    : out.map((e, k) => e.kana + (e.rest ? "、" : k === out.length - 1 ? "。" : "")).join("");
  return { SCORE: out, TEXT, TEMPO_QUARTER: base, LANG: lang };
}

/** 月读分段唱（2026-10-08 深夜 Opus 5.5；user「对我也觉得分开唱复用」「月读至少拆成句级别」「开关是歌手的属性，可以有不同的粒度」）：
 *  一口气唱完一整首 = 唱法核心整段算（piper 一次念完、WORLD 整段分析 + 重唱），长歌把 iPad 的内存撑爆（团子大家族 195.6 s 必崩）；
 *  分段 = 一段唱完就放掉（峰值 = 最长那段），重复的段 / 没改的句子按内容复用。whole = 一整首；sheet = 每张纸；phrase = 每张纸里再在够长的休止处切。
 *  返回 token 下标范围 [from, to)；没有音的段不要。 */
export type SingChunkMode = "phrase" | "sheet" | "whole";
export const PHRASE_REST_SEC = 0.25;   // 这么长以上的休止（连着几个休止加起来）= 一句的边界：那里本来就没声音，切开听不出接缝
export function singChunks(tokens: Token[], tempoMap: TempoMap | undefined, bounds: readonly number[], mode: SingChunkMode): [number, number][] {
  if (mode === "whole") return tokens.some((t) => t.kind === "note") ? [[0, tokens.length]] : [];
  const cuts = new Set(bounds.filter((b) => b > 0 && b < tokens.length));
  if (mode === "phrase") {
    let rest = 0;
    for (const x of timeline(tokens, tempoMap)) {
      if (x.tok.kind === "rest") { rest += x.t1 - x.t0; continue; }
      if (rest >= PHRASE_REST_SEC) cuts.add(x.index);
      rest = 0;
    }
  }
  const starts = [0, ...[...cuts].sort((a, b) => a - b)];
  return starts.map((a, k) => [a, starts[k + 1] ?? tokens.length] as [number, number]).filter(([a, b]) => tokens.slice(a, b).some((t) => t.kind === "note"));
}
