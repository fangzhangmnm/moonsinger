import { type NotationId } from "../score/song-view.ts";
import type { PaperKind, Density } from "../score/paper.ts";
/** 「跟着软件」时各项是什么（歌里某一项是 "default" 时用）。 */
export interface LookDefaults {
    notation: NotationId;
    viewInC: boolean;
    middleC: number;
    chordTags: boolean;
    expressions: boolean;
    barNumbers: "line" | "off";
    lyricFit: "rhythm" | "lyrics";
    paper: PaperKind;
    density: Density;
}
/** 软件的默认（第 17 条起的「跟着软件」）。读别家的谱认「哪一档算跟着软件」也只用这一份。 */
export declare const BASE_DEFAULTS: LookDefaults;
/** 能当习惯的几项（各记各的）。 */
export declare const HABIT_KEYS: readonly ["notation", "viewInC", "middleC"];
export type HabitKey = (typeof HABIT_KEYS)[number];
/** 这台设备上的习惯：每一项 = 没选（不在里面），或者一个具体的值。 */
export type Habits = {
    readonly [K in HabitKey]?: LookDefaults[K];
};
/** 当时的情况（不在文件里；17-0 提案留的口子）：这台设备上的习惯。不给 = 都没选 = 软件的默认。 */
export interface LookContext {
    readonly habits?: Habits;
}
/** 这一次「跟着软件」用哪一张表：软件的默认，每样选了的习惯只盖它自己那一项。 */
export declare function defaultsFor(ctx?: LookContext): LookDefaults;
/** 设备上记的那个字 ↔ 习惯的值。认不出的字（以后的版本记的、手改的）= 没选（不猜、不换成别的）。 */
export declare const HABIT_CODEC: {
    readonly [K in HabitKey]: {
        parse(raw: string | null): LookDefaults[K] | undefined;
        write(v: LookDefaults[K]): string;
    };
};
/** 设备键值里的名字（不用以前的 view-in-c / chord-tags：意思不一样，不读它们、不转换）。 */
export declare const HABIT_DEVICE_KEY: {
    readonly [K in HabitKey]: string;
};
/** 从设备上读这几样习惯（read = 设备键值的读；纯：给什么读什么）。认不出的 = 没选。 */
export declare function habitsFrom(read: (key: string) => string | null): Habits;
/** 「这台设备问过了」（第一次打开的卡点了「好」或「以后再说」）。 */
export declare const HABITS_ASKED_KEY = "habits-asked";
