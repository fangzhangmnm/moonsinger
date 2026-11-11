import { type Pitch } from "../score/pitch.ts";
import { type Scale } from "../score/scales.ts";
import { type EditorState } from "../score/song.ts";
import type { PadMusic } from "../keyboard/pad.ts";
/** 五度圈，♭ 多 → C → ♯ 多；旋钮 / 滚轮里反过来放（大的在上：1=F♯ … 1=C … 1=G♭）。 */
export declare const KEY_CIRCLE: number[];
/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
export declare function homeTonic(fifths: number): number;
/** 音名的人话写法：C♯4 / B♭3。 */
export declare const pretty: (p: Pitch) => string;
/** pad 上有调号以外的音：手动拨的调 / 调式有音不在谱上这里的调号里（1=C 多利亚 / 小调 / 羽调式在 C 大调里 = 没有：同一个 1=、换个主音；1=G 在 C 大调里 = F♯ 不在；布鲁斯带 ♭3 ♭7 = 有）。 */
export declare function outsideKey(sc: Scale, f: number, keySig: number): boolean;
/** 宿主这边多知道的几样（写谱 / 出声要音高；旋钮第 i 档是哪个调）；键盘拿到的只是 PadMusic 那部分。 */
export interface PadMusicHost extends PadMusic {
    /** 第 k 级是哪个音（宿主写谱 / 出声用；键盘不碰）。 */
    pitchAt(k: number): Pitch;
    /** 旋钮 / 滚轮第 i 档 = 哪个调 / 哪个调式（调式第 0 档 = "auto" = 跟谱）。 */
    fifthsAt(i: number): number;
    scaleIdAt(i: number): string;
}
export declare function createPadMusic(get: () => EditorState): PadMusicHost;
