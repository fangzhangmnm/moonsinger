// view-in-c.ts —— 按 C 调看（辅助模式，v0.16.10）：显示用的整首谱换算。纯函数，只给排版用；谱的数据、存档、PDF、出声都不经过这里。
// created 2026-11-07 by Claude Opus 5.5。user 11-07「我需要一个残疾人模式，就是显示的时候按照这个调号的音高显示…F 大调的话。你显示的时候，帮我转到 C 大调上面，
//   然后在五线谱的右上角写一个一等于 F」「就是它就是一个显示的东西嘛」「我根本看不懂我自己摸的和弦，摸出来是几级和弦，我脑袋根本转不过来」。
// 做法：每个音从它所在的调（光标走到哪个调号管的地方就是哪个调）转到 C——主音之间的音程，就近方向（pitch.ts keyInterval：1=F 往下四度、1=G 往上四度），
//   字母和半音一起走（transposeInterval），所以调里的音还是调里的音、调外的音还带它自己的升降号（G 大调的 F♯ = C 调的 B；G 大调里的 F♮ = B♭）。
//   调号记号 fifths → 0，原来的记在 realFifths（排版在那儿写「1=F」）。token 一个不增不减、id 不变 = 点哪个音还是哪个音。
//   「1」= 调号那个大调的主音（同简谱的 1=F；小调 / 调式也按调号算，不按调式的主音）。鼓（不分音高）不换。
import type { Song, Token, KeyTok } from "./song.ts";
import { type Pitch, keyInterval, transposeInterval } from "./pitch.ts";

export interface KeyTokInC extends KeyTok { realFifths: number }
/** 调号记号原来是几个升降号（没换算过的 = 它自己的）。 */
export const realFifthsOf = (t: KeyTok): number => (t as Partial<KeyTokInC>).realFifths ?? t.fifths;
/** 一个实际音高（在 fifths 那个调里）按 C 调看是哪个音。 */
export function toC(p: Pitch, fifths: number): Pitch {
  if (fifths === 0) return p;
  const iv = keyInterval(fifths, 0);
  return transposeInterval(p, iv.steps, iv.semis);
}
/** 按 C 调看时往上 / 往下挪了几级（拖音高：显示上的第 d 级 − 这个 = 实际的第几级）。 */
export const stepsToC = (fifths: number): number => (fifths === 0 ? 0 : keyInterval(fifths, 0).steps);

/** 一条 track：每个音按它前面最近的调号换到 C；调号记号 → 0 个升降号 + realFifths。 */
export function trackInC(tokens: readonly Token[]): Token[] {
  let f = 0;
  return tokens.map((t): Token => {
    if (t.kind === "key") { f = t.fifths; return { ...t, fifths: 0, realFifths: t.fifths } as KeyTokInC; }
    if (t.kind === "note" && t.pitch && f !== 0) return { ...t, pitch: toC(t.pitch, f), ...(t.chord ? { chord: t.chord.map((c) => toC(c, f)) } : {}) };
    return t;
  });
}
/** 整首：skip(声部 id) = 不换（鼓：写的音高 = 敲哪个鼓）。 */
export function songInC(song: Song, skip: (partId: string) => boolean): Song {
  return { ...song, papers: song.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).map(([id, toks]) => [id, skip(id) ? toks : trackInC(toks)])) })) };
}
