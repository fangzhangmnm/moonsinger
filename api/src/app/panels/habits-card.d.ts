import { type RawMeasure } from "../../render/text/index.ts";
import { type Song } from "../../score/song.ts";
import { type NotationId } from "../../score/song-view.ts";
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
/** 预览图的基准大小（css px）：真排版按这么大放（统筹 d871aadf）；格子窄了（放不下时「整数格 + 半格」）整张跟着等比缩（统筹 1dda0433）。 */
export declare const PREVIEW_W = 150, PREVIEW_H = 92;
/** 预览那一句：C 大调四个四分音符 1 2 3 5，带重音、两个跳音、一条连线、一个换气、mp 渐强到 f，每个音一个字的歌词；不要速度的字（统筹 d871aadf）。
 *  排得紧一点（音符密度「紧凑」= 这一句自己的设置，不是把谱缩小：线距照旧 8）。 */
export declare function previewSong(): Song;
/** 用这种谱真排那一句，放进 PREVIEW_W × PREVIEW_H：一个排版 px = 一个 css px，墨迹大了就整张等比缩到刚好放下（只缩不放大），左右上下按墨迹居中。 */
export declare function previewSvg(notation: NotationId, measure: RawMeasure): string;
export declare function openHabitsCard(d: HabitsCardDeps): HabitsCard;
