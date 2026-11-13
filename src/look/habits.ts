// src/look/habits.ts —— 这台设备的习惯（施工单第 18 条，第三次重写那一版）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-13：「你这些辅助功能，嗯，还是正交吧，就是说从要不要移调这个算一个单独的开关。然后你喜欢看什么谱，算一个单独的开关。
//     可能我们确实不适合做这种直接根据你看什么谱去判断，这个不就是刻板偏见吗？」「…所以说就是问两样，一个是你习惯看什么谱，一个是你要不要移调。」
//   · 三层，各管各的：歌里这一项选过 → 照歌的；歌里是 "default" → 这台设备上这一项的习惯；设备上没选 → 软件的默认（BASE_DEFAULTS）。
//   · **每样习惯只盖它自己那一项，不从一样推另一样**（defaultsFor 按 HABIT_KEYS 一项一项盖；test/look-habits.test.ts 钉住）。
//   · 现在三样：看什么谱、要不要移调辅助、中央 C 叫 C 几（统筹 b149a4d9：user 要它也做成习惯、上卡）。和弦辅助不问、不做成习惯（软件的默认就是开）。加一样 = HABIT_KEYS 多一个名字 + 设备上一个键 + 设置里一行 + 卡上一段。
//   · 这里纯：不读设备、不碰界面。设备上记的由 app 读（main.ts），随「当时的情况」（LookContext）交给 lookOf / defaultText。
//   · 存文件只用不带习惯的那一份（project.ts 的 lookOf(song)）：习惯怎么换，存出来的文件一个字节都不变。
import { NOTATIONS, MIDDLE_C_NAMES, type NotationId } from "../score/song-view.ts";
import type { PaperKind, Density } from "../score/paper.ts";

/** 「跟着软件」时各项是什么（歌里某一项是 "default" 时用）。 */
export interface LookDefaults {
  notation: NotationId; viewInC: boolean; middleC: number; chordTags: boolean; expressions: boolean;
  barNumbers: "line" | "off"; lyricFit: "rhythm" | "lyrics"; paper: PaperKind; density: Density;
}
/** 软件的默认（第 17 条起的「跟着软件」）。读别家的谱认「哪一档算跟着软件」也只用这一份。 */
export const BASE_DEFAULTS: LookDefaults = { notation: "staff", viewInC: false, middleC: 4, chordTags: true, expressions: true, barNumbers: "line", lyricFit: "rhythm", paper: "A5", density: "cozy" };

/** 能当习惯的几项（各记各的）。 */
export const HABIT_KEYS = ["notation", "viewInC", "middleC"] as const;
export type HabitKey = (typeof HABIT_KEYS)[number];
/** 这台设备上的习惯：每一项 = 没选（不在里面），或者一个具体的值。 */
export type Habits = { readonly [K in HabitKey]?: LookDefaults[K] };
/** 当时的情况（不在文件里；17-0 提案留的口子）：这台设备上的习惯。不给 = 都没选 = 软件的默认。 */
export interface LookContext { readonly habits?: Habits }

/** 这一次「跟着软件」用哪一张表：软件的默认，每样选了的习惯只盖它自己那一项。 */
export function defaultsFor(ctx?: LookContext): LookDefaults {
  const h = ctx?.habits; if (!h) return BASE_DEFAULTS;
  let d: LookDefaults = BASE_DEFAULTS;
  for (const k of HABIT_KEYS) { const v = h[k]; if (v !== undefined) d = { ...d, [k]: v }; }
  return d;
}

/** 设备上记的那个字 ↔ 习惯的值。认不出的字（以后的版本记的、手改的）= 没选（不猜、不换成别的）。 */
export const HABIT_CODEC: { readonly [K in HabitKey]: { parse(raw: string | null): LookDefaults[K] | undefined; write(v: LookDefaults[K]): string } } = {
  notation: { parse: (raw) => (NOTATIONS as readonly string[]).includes(raw ?? "") ? (raw as NotationId) : undefined, write: (v) => v },
  viewInC: { parse: (raw) => (raw === "on" ? true : raw === "off" ? false : undefined), write: (v) => (v ? "on" : "off") },
  middleC: { parse: (raw) => { const n = Number(raw); return raw && MIDDLE_C_NAMES.includes(n) ? n : undefined; }, write: (v) => String(v) },
};
/** 设备键值里的名字（不用以前的 view-in-c / chord-tags：意思不一样，不读它们、不转换）。 */
export const HABIT_DEVICE_KEY: { readonly [K in HabitKey]: string } = { notation: "habit-notation", viewInC: "habit-transpose-aid", middleC: "habit-middle-c" };
/** 从设备上读这几样习惯（read = 设备键值的读；纯：给什么读什么）。认不出的 = 没选。 */
export function habitsFrom(read: (key: string) => string | null): Habits {
  const h: { -readonly [K in HabitKey]?: LookDefaults[K] } = {};
  for (const k of HABIT_KEYS) pickHabit(h, k, read);
  return h;
}
function pickHabit<K extends HabitKey>(h: { -readonly [Q in HabitKey]?: LookDefaults[Q] }, k: K, read: (key: string) => string | null): void {
  const v = HABIT_CODEC[k].parse(read(HABIT_DEVICE_KEY[k])); if (v !== undefined) h[k] = v as never;
}
/** 「这台设备问过了」（第一次打开的卡点了「好」或「以后再说」）。 */
export const HABITS_ASKED_KEY = "habits-asked";
