// ring.ts —— 踏板 11-3：一位 SoundFont 乐手没写踏板记号时留不留住音的「出厂」值 + 依据（一处算：上场那一刻、读老文件的门口、乐器页「照这件乐器出厂的」都问它）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）；统筹「踏板 11-3 的数据定了」（user 2026-11-13「好，可以，就那么办」）+ 答两问（a473c126）。
//   判据（user 同日）：「关键是看人类的意图吧…钢琴的踏板和竖琴的踏板的区别，就是一个是你不自动停是一个意图，一个是需要一起停是一个意图」——
//   止音要人特意做的（竖琴、筝…）= 留住；留住要人特意做的（钢琴）= 不留。名单 = 音乐目录概念上的 ring 栏，构建时烤成 ring.gen.ts（同着力点表）。
//   名单里没有的、自己的音源文件 = 不留。名单在 user 点头之前是空的（= 每位都不留，和 11-3 之前的出声一样）。
import { RING_FREE } from "./ring.gen.ts";
import { GS_LIBRARY_ID } from "./library-ids.ts";

/** 歌里存的两个值：留住音 / 不留（articulation.pedal）。 */
export type PedalDefault = "down" | "up";
export const PEDAL_DEFAULTS: readonly PedalDefault[] = ["down", "up"];
/** 出厂是哪一边 + 为什么：free = 目录标了不去管它就一直响（why = 目录里那句，中 / 英）；unmarked = 目录没标；own = 自己的音源文件（目录不认识它）。 */
export interface RingFactory { pedal: PedalDefault; reason: "free" | "unmarked" | "own"; why: { readonly zh: string; readonly en: string } | null }
/** 这位的音色（库 + bank / program，鼓件带 note）→ 出厂值。 */
export function ringFactory(src: { library: string | null; bank: number; program: number; note?: number }): RingFactory {
  if (src.library !== GS_LIBRARY_ID) return { pedal: "up", reason: "own", why: null };
  const w = RING_FREE[`${src.bank}:${src.program}${src.note !== undefined ? `:${src.note}` : ""}`];
  return w ? { pedal: "down", reason: "free", why: w } : { pedal: "up", reason: "unmarked", why: null };
}
