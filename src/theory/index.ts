// theory/index.ts —— 乐理：和声的读法是一个能整块换的模块。created 2026-11-10 by Claude Opus 5.5
//   user 11-10：「乐理引擎可以拆出一个单独的可热插拔的模块 因为可能不同文明他们用的和声理论都不一样」（总表第 33 条，愿望单 W-55 有原话）。
//   门面（外面只认这些）：一种理论 = 给它一个声部在一个曲段里的音（一条 track），它说哪几个音底下标什么（tagsOf）、谱上写什么字（label）、
//   点开候选时每个读法怎么说（explain / howTo）。读法是纯数据（能进 worker、能结构化克隆），带着自己是哪种理论（theory）——点开时找回同一种理论来解释。
//   每个声部各认各的，不把几个声部合起来读（user 11-10「我还是希望它的局域性好一点，所以说可能还是每个声部单独做吧」）。
//   现在只有一种：western = 西方功能和声的罗马数字级数（src/theory/western.ts）。以后加别的 = 写一个同样门面的文件、登记进 THEORIES；
//   挑哪一种的开关（歌里 / 设备上）等真有第二种时再定。
import type { Token } from "../score/song.ts";
import { western } from "./western.ts";

/** 一个读法（候选）。label = 谱上写的短字；name = 点开时写在旁边的全名；cost 越小越像（同分 = 打平）。各理论可以多带自己的字段（纯数据）。 */
export interface HarmonyGuess { label: string; name: string; cost: number }
/** 读出来的结果：best = 第一候选；ties = 和它打平的（含它自己）；all = 全部候选（按先后）；theory = 哪种理论读的。 */
export interface HarmonyRead<G extends HarmonyGuess = HarmonyGuess> { theory: string; best: G; ties: G[]; all: G[] }
/** 一条 track：一张纸（曲段）里一个声部的记号串 + 每个位置的调（几个升降号）。 */
export interface TrackInput { tokens: readonly Token[]; keyAt(index: number): number; /** 这个声部认不认「拆开弹的和弦」（声部开关，v0.16.73；没给 = 认）。 */ broken?: boolean }
export interface HarmonyTheory {
  id: string;
  /** 这条 track 里要标的音（记号下标）→ 读法。纯函数（排版 worker 里跑）。 */
  tagsOf(track: TrackInput): { index: number; read: HarmonyRead }[];
  /** 谱上写的那一行字。 */
  label(read: HarmonyRead): string;
  /** 点开候选时：顶上那句「怎么认的」、每个读法后面的小字。界面上跑（可以用 _t）。 */
  howTo(read?: HarmonyRead): string;
  explain(guess: HarmonyGuess): string[];
}

export const THEORIES: Record<string, HarmonyTheory> = { [western.id]: western };
export const DEFAULT_THEORY = western.id;
/** 按 id 找理论；不认识的 id（别的版本加的）= 默认那一种。 */
export const harmonyTheory = (id: string = DEFAULT_THEORY): HarmonyTheory => THEORIES[id] ?? THEORIES[DEFAULT_THEORY]!;
