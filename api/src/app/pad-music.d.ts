import { type Pitch } from "../score/pitch.ts";
import { type Scale } from "../score/scales.ts";
import { type EditorState } from "../score/song.ts";
import type { PadMusic, KeyFaces } from "../keyboard/pad.ts";
/** 五度圈，♭ 多 → C → ♯ 多；旋钮 / 滚轮里反过来放（大的在上：1=F♯ … 1=C … 1=G♭）。 */
export declare const KEY_CIRCLE: number[];
/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
export declare function homeTonic(fifths: number): number;
/** 「这个键写什么」只有这一处（第 19 条；统筹 a6be57e4）：键上的大字 = 这个键的音在光标这里、这个声部上，排版会把它画成的那个名字。
 *  · 移调辅助起作用（五线谱、不是打击乐的行）：大字 = 音按光标这里的调号拼写（落进谱时的写法 keySpell）再换到 C（toC，和排版、鬼音符同一个换法），
 *    小字 = 实际的音名。和键盘自己的「1=」无关（谱降 E、键盘手动 1=G：G4 那个键大字 E4、小字 G4）。
 *  · 别的时候（排版不换的地方）：大字 = 实际的音名，小字 = 级数（照旧）。
 *  名字一律走音名那一个出口（noteName，八度照「中央 C 叫 C 几」）。升降滑出来的那个音（altered）同一条规矩，两行一起变。 */
export declare function keyFaces(p: Pitch, degree: {
    deg: string;
    oct: number;
    acc?: string;
}, o: {
    inC: boolean;
    fifths: number;
    middleC: number;
}): KeyFaces;
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
/** middleC = 中央 C 叫 C 几（这首歌的，跟着设备的习惯；第 18 条）：键上的字、音域旋钮照它写。
 *  inC = 移调辅助在光标这个声部上起不起作用（五线谱、开着、不是打击乐的行；宿主判，第 19 条）：起作用 = 键上大字照谱上换到 C 调画成的名字写。 */
export declare function createPadMusic(get: () => EditorState, middleC: () => number, inC?: () => boolean): PadMusicHost;
