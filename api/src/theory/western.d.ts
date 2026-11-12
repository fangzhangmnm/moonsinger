import { type Pitch } from "../score/pitch.ts";
import type { HarmonyTheory, HarmonyGuess, HarmonyRead } from "./index.ts";
export interface ChordGuess extends HarmonyGuess {
    /** 根音（按下的音里那一个的拼法）。 */ root: Pitch;
    /** 最低音。 */ bass: Pitch;
    tpl: string;
    /** 级数写法：V7、ii、♭VII、I/3（= 谱上写的字）。 */ label: string;
    /** 和弦名：G7、Dm、C/E（点开看候选用）。 */ name: string;
    /** 越小越像；同分 = 打平。 */ cost: number;
    /** 省掉了几个可省的音（缺三度也算一个）。 */ omitted: number;
    /** 缺三度：大小三和弦分不出来，大小写按调里的。 */ no3: boolean;
}
export type ChordRead = HarmonyRead<ChordGuess> & {
    mode?: Mode;
};
/** 以 do 为主（大调）还是以 la 为主（小调）。v0.16.83 起由人写明：调号记号上的「小调」（user 11-09「在选调号的时候强制一起选。
 *  不过关系大小调对齐」），从 BarNote.minor 带进来；没写 = 从 do 数（和简谱的习惯一样：1 = do）。分析自己不猜（index.ts 文件头 ③；
 *  v0.16.72 的「最后一个音是 la 就从 la 数」撤了，user 11-09「我直觉觉得不妥」）。 */
export type Mode = "do" | "la";
/** 这个音在 fifths 那个调里是第几级（1–7）+ 比调里那个音高 / 低几个半音（拼法定）。 */
export declare function degreeOf(p: Pitch, fifths: number, mode?: Mode): {
    deg: number;
    acc: number;
};
/** 认和弦：几个音（只有一个音 = null；两个音只认五度和三度 / 六度）+ 调（1= 那个调，几个升降号）。认不出来（表里没有）= null。 */
export declare function readChord(pitches: readonly Pitch[], fifths: number, mode?: Mode): ChordRead | null;
/** 标在谱上的那一行字：打平的用「 / 」连起来（最多两个）。 */
export declare const chordLabel: (r: HarmonyRead) => string;
/** 人能挑的和弦种类（测试守「每一种在文件里都有写法」用）。 */
export declare const PIN_KIND_IDS: readonly string[];
export declare function pinXmlKind(kind: string): {
    value: string;
    text?: string;
};
/** <kind> 的值 + text 属性 → 和弦种类；认不出 = null（调用方数出来报）。 */
export declare function xmlKindToPin(value: string, text: string | undefined): string | null;
/** 这个读法的标准排法（最低音 = 读法里的最低音，八度 = bassOctave；其余各一个、在它上面一个八度之内从低到高）；拼不出来 = null。 */
export declare function voicingOf(g: ChordGuess, bassOctave: number): Pitch[] | null;
/** 这一种理论的门面（src/theory/index.ts HarmonyTheory）。 */
export declare const western: HarmonyTheory;
