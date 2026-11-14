// ring.ts —— 踏板 11-3：一位 SoundFont 乐手没写踏板记号时留不留住音的「出厂」值 + 依据（一处算：上场那一刻、读老文件的门口、乐器页「照这件乐器出厂的」都问它）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）；统筹「踏板 11-3 的数据定了」（user 2026-11-13「好，可以，就那么办」）+ 答两问（a473c126）。
//   判据（user 同日）：「关键是看人类的意图吧…钢琴的踏板和竖琴的踏板的区别，就是一个是你不自动停是一个意图，一个是需要一起停是一个意图」——
//   止音要人特意做的（竖琴、筝…）= 留住；留住要人特意做的（钢琴）= 不留。名单 = 音乐目录概念上的 ring 栏，构建时烤成 ring.gen.ts（同着力点表）。
//   名单里没有的、自己的音源文件 = 到点释放。名单 v0.17.43 起 = 目录 v16 的 47 个概念（本尊音色烤进 ring.gen.ts）+ 整套鼓那 11 套（下面 RING_FREE_KITS）。
import { RING_FREE } from "./ring.gen.ts";
import { GS_LIBRARY_ID } from "./library-ids.ts";

/** 歌里存的两个值：留住音 / 不留（articulation.pedal）。 */
export type PedalDefault = "down" | "up";
export const PEDAL_DEFAULTS: readonly PedalDefault[] = ["down", "up"];
/** 出厂是哪一边 + 为什么：free = 目录标了不去管它就一直响（why = 目录里那句，中 / 英）；unmarked = 目录没标；own = 自己的音源文件（目录不认识它）。 */
export interface RingFactory { pedal: PedalDefault; reason: "free" | "unmarked" | "own"; why: { readonly zh: string; readonly en: string } | null }
/** 整套鼓（128 号库、没固定敲哪一件）= 一位乐手打全套。目录里没有「整套鼓」这个概念、gm-map 也没有不带 note 的那一行，所以在这里明写（v0.17.43；统筹 c5c742ac「怎么进表我定」）。
 *  只列 GS 2.0.3 里 27–87 号键不松键全都会自己停的 11 套（TinySoundFont 实测，施工单第 6 节）；SFX 套（128:56，14 个键循环着一直响）、CM-64/32L 套（128:127，82 / 86 / 87 循环）不进。 */
export const RING_FREE_KITS: readonly number[] = [0, 1, 2, 8, 16, 24, 25, 26, 32, 40, 48];
const KIT_WHY = { zh: "整套鼓：每一件（鼓、镲、小打击乐）敲了都响到自己停，没人会按住让它停；一个默认管全套。", en: "Whole drum kit: every piece (drums, cymbals, small percussion) rings until it dies away by itself; nobody holds it to stop the sound. One default covers the whole kit." } as const;   // i18n-keep：同目录的 why，中英两份按界面语言挑一边
/** 这位的音色（库 + bank / program，鼓件带 note）→ 出厂值。 */
export function ringFactory(src: { library: string | null; bank: number; program: number; note?: number }): RingFactory {
  if (src.library !== GS_LIBRARY_ID) return { pedal: "up", reason: "own", why: null };
  if (src.bank === 128 && src.note === undefined) return RING_FREE_KITS.includes(src.program) ? { pedal: "down", reason: "free", why: KIT_WHY } : { pedal: "up", reason: "unmarked", why: null };
  const w = RING_FREE[`${src.bank}:${src.program}${src.note !== undefined ? `:${src.note}` : ""}`];
  return w ? { pedal: "down", reason: "free", why: w } : { pedal: "up", reason: "unmarked", why: null };
}
