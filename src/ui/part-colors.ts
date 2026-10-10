// part-colors.ts —— 歌手的颜色（克制的类别色）+ 谱前的简写。纯函数（node 测试 test/part-colors.test.ts）。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-10「我希望有非常克制的color coding， mpl的 tab20？ 然后不同颜色默认绑不同乐器类别」→ AI 提的画法（每行左边细色条 / 名字前小色点 / 播放高亮 / 录音室卡片顶边；音符照旧黑）→ user「乐手名和颜色同意」。
// 类别 = 角色的 MusicXML sound id 的前缀（voice. / keyboard. / pluck. / strings. / brass. / wind. / synth. / drum. / metal. …），不用等目录载进来。

/** matplotlib 的 tab20：十种颜色，每种一深一浅。 */
export const TAB20 = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
  "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"] as const;
/** 类别 → tab20 的第几种颜色（0–9）。 */
const HUE: Record<string, number> = { keys: 0, voice: 1, strings: 2, brass: 3, wind: 4, pluck: 5, synth: 6, perc: 7, mallet: 8, fx: 9 };
export type PartCategory = keyof typeof HUE;
export const CATEGORY_LABEL: Record<string, string> = { keys: "键盘", voice: "人声", strings: "弦乐", brass: "铜管", wind: "木管", pluck: "弹拨", synth: "合成", perc: "打击", mallet: "有音高打击 / 铃", fx: "音效 / 其他" };

/** 角色的 sound id → 类别。 */
export function categoryOfSound(sound: string): PartCategory {
  const head = sound.split(".")[0];
  if (head === "voice") return "voice";
  if (head === "keyboard") return "keys";
  if (head === "pluck") return "pluck";
  if (head === "strings") return "strings";
  if (head === "brass") return "brass";
  if (head === "wind") return "wind";
  if (head === "synth") return "synth";
  if (head === "drum" || head === "rattle" || head === "wood" || head === "percussion") return "perc";
  if (head === "metal" || head === "pitched-percussion") return "mallet";
  return "fx";
}
/** 每个声部在 tab20 里的下标：同一类的第一位用深的，第二位用浅的，再往后轮回去。 */
export function partColorIndices(sounds: readonly string[]): number[] {
  const seen = new Map<PartCategory, number>();
  return sounds.map((s) => { const c = categoryOfSound(s), k = seen.get(c) ?? 0; seen.set(c, k + 1); return HUE[c] * 2 + (k % 2); });
}

/** 合唱 / 人声预设的谱前简写（出版谱的老规矩）。 */
const VOICE_ABBR: Record<string, string> = { Vocals: "Vo.", "Backing Vocals": "B. Vo.", Soprano: "S.", Alto: "A.", Tenor: "T.", Bass: "B." };
/** 名字自己缩短（目录里没有简写、或者用户自己起了名字）：中文 / 日文 = 前两个字；英文一个词 ≤ 5 个字母 = 原样，长的 = 前三个字母加点；几个词 = 首字母加点。 */
export function shortName(name: string): string {
  const t = name.trim(); if (!t) return t;
  if (/[぀-ヿ㐀-鿿가-힯]/.test(t)) return [...t].slice(0, 2).join("");
  const w = t.split(/\s+/).filter(Boolean);
  if (w.length > 1) return w.map((x) => x[0]).join("").toUpperCase() + ".";
  return t.length <= 5 ? t : `${t.slice(0, 3)}.`;
}
/** 谱前的简写：名字就是乐器自己的名字 = 目录给的出版谱简写（仓鼠 v12）；人声预设 = 老规矩；别的（自己起的名字）= 名字缩短。名字后面的号（Vocals 2）跟着。 */
export function partAbbr(label: string, o: { conceptNames?: readonly string[]; conceptAbbr?: string; voice?: boolean }): string {
  const m = / (\d+)$/.exec(label), base = m ? label.slice(0, -m[0].length) : label, num = m ? ` ${m[1]}` : "";
  if (o.conceptAbbr && o.conceptNames?.some((n) => n === base)) return o.conceptAbbr + num;
  if (o.voice && VOICE_ABBR[base]) return VOICE_ABBR[base] + num;
  return shortName(base) + num;
}
