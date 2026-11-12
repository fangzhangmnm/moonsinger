import { type HarmonyRead, type HarmonyTheory } from "./index.ts";
import { type Token } from "../score/song.ts";
/** 一处标签：index = owner 那条 track 里那个音的下标（人挑的读法写在它身上）；at = 画在哪一位的那一行（一家 = 最下面那一位；不在一家 = 自己）。 */
export interface PlacedTag {
    index: number;
    read: HarmonyRead;
    at: string;
}
/** 一张纸上要认的：parts = 声部（按歌里的先后 = 排版上从上到下）：id + 这张纸上的 track（要显示的那一份，按 C 调看时已经换过）+ 认不认拆开弹的；
 *  families = 合租的一家（按歌里的先后，打头的在前），只列这张纸上在场、要认的；两位以上才算一家。 */
export interface PaperHarmonyInput {
    parts: readonly {
        id: string;
        tokens: readonly Token[];
        broken: boolean;
    }[];
    families: readonly (readonly string[])[];
}
/** 一张纸：每一位（owner）→ 它身上要标的那几处。 */
export declare function paperHarmony(theory: HarmonyTheory, input: PaperHarmonyInput): Map<string, PlacedTag[]>;
