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
    /** 第一行「语言」（v0.17.37，统筹 42d5f807；user「初始设置第一个是语言，放在看谱前面…加一个图标方便人识别」）：宿主出的那一行 + 装好它。
     *  它不是看谱的习惯（不进 HABIT_KEYS、「好」不写它）；选了 = 宿主马上换界面语言。draft = 卡上现在点着的（换语言要整页重载，宿主带过去、重载完照这个再开）。 */
    lang: {
        html: string;
        mount(root: HTMLElement, draft: () => Habits): void;
    };
}
export interface HabitsCard {
    close(): void;
    readonly el: HTMLElement;
}
/** 卡上摆着哪几样习惯（只有这一份：画卡、「好」写设备都从它来；v0.17.30 收跟进第 1 条）：第一行谱的小卡片、第二行两颗钮、第三行起小下拉。
 *  不在这里的习惯（以后加了、还没上卡的）从卡上点「好」不动它。 */
export declare const CARD_HABITS: {
    readonly lead: "lang";
    readonly tiles: "notation";
    readonly pair: "viewInC";
    readonly rows: readonly ["middleC", "chordTagStyle"];
};
export declare const cardHabitKeys: () => readonly HabitKey[];
export declare function openHabitsCard(d: HabitsCardDeps): HabitsCard;
