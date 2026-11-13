import { type RawMeasure } from "../../render/text/index.ts";
import { type Song } from "../../score/song.ts";
import { type NotationId } from "../../score/song-view.ts";
import { type Habits } from "../../look/index.ts";
export interface HabitsCardDeps {
    /** 量字的尺子（和谱面同一把：score-view rawMeasure）。 */
    measure: RawMeasure;
    /** 现在设备上记着的（设置里改过、卡又出来的时候亮着）。 */
    current: Habits;
    /** 「好」：chosen = 选了的那几样（没选的不在里面）。 */
    done(chosen: Habits): void;
    /** 「以后再说」。 */
    later(): void;
    /** Esc / 点外面：这次收起。 */
    dismissed(): void;
}
export interface HabitsCard {
    close(): void;
}
/** 预览那一句：降 E 大调（三个降号：按 C 调看起作用）、4/4，两小节；力度 mp → 渐强 → f、重音、跳音、连线、呼吸、保持、两个字的歌词。 */
export declare function previewSong(): Song;
/** 用这一种看法真排那一句（照这首歌写明的那几项排：notation / viewInC 都明写，不经过习惯）。 */
export declare function previewSvg(look: {
    notation: NotationId;
    viewInC: boolean;
}, measure: RawMeasure): string;
export declare function openHabitsCard(d: HabitsCardDeps): HabitsCard;
