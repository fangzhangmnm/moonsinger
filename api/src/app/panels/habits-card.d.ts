import { type RawMeasure } from "../../render/text/index.ts";
import { type Habits, type HabitKey } from "../../look/index.ts";
/** 第三行起的小下拉（中央 C 叫…）：宿主出的行（和设置「界面」页同一个函数）+ 装好下拉 / 「?」+ 读回选了什么。 */
export interface HabitRows {
    html(current: Habits): string;
    mount(root: HTMLElement): void;
    /** 读这几行现在选着的（没选 = 不在里面）。 */
    read(root: HTMLElement): Habits;
    /** 哪几样走小下拉（「好」时卡上的格子 / 钮只管自己那两样，这几样照下拉读）。 */
    keys: readonly HabitKey[];
}
export interface HabitsCardDeps {
    /** 量字的尺子（和谱面同一把：score-view rawMeasure）。 */
    measure: RawMeasure;
    /** 打开时亮着的（设备上现在的习惯）。 */
    current: Habits;
    rows: HabitRows;
    /** 「好」：chosen = 选了的那几样（没选的不在里面）。 */
    done(chosen: Habits): void;
    /** 「以后再说」。 */
    later(): void;
    /** Esc / 点外面。 */
    dismissed(): void;
}
export interface HabitsCard {
    close(): void;
    readonly el: HTMLElement;
}
export declare function openHabitsCard(d: HabitsCardDeps): HabitsCard;
