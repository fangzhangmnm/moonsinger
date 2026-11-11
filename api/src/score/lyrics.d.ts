import { type EditorState, type NoteTok, type Token } from "./song.ts";
export interface Syl {
    text: string;
    hyph: boolean;
    joinPrev?: boolean;
}
export declare const MELISMA_MARK = "\u30FC";
/** 一个音上几个音节之间的连字弧（数据里的分隔）。 */
export declare const ELISION = "\u203F";
/** 纸上怎么写：中日文两个字之间不画弧，拉丁字母之间画「‿」。 */
export declare const lyricShow: (s: string) => string;
/** 歌词框里怎么写：连字弧写回「+」（好改）。 */
export declare const lyricEdit: (s: string) => string;
/** 整段都是小字（っ / ゃゅょ / ぁぃぅぇぉ…）：唱的时候自己不成拍，归前一个音节（lab-score.ts）。促音 = っ / ッ（唱出来是前一个音节后面的一下停顿）。
 *  打字照原样（输入法上屏几次、小字落在哪个音上就在哪个音上；user 2026-10-08「我大tsu小tsu大yo小yo确实分不清」——不替人改歌词，唱的那一路兜住）。 */
export declare const isSmallKana: (s: string) => boolean;
export declare const isSokuon: (s: string) => boolean;
export declare function splitSyllables(text: string): Syl[];
declare const lyricSlot: (t: Token) => t is NoteTok;
/** 从下标 start 起（含）往后把音节贴到音符上；不够就在末尾补空音高的新音。返回新状态 + 最后贴到的下标。 */
export declare function distributeFrom(st: EditorState, start: number, syl: Syl[]): {
    st: EditorState;
    last: number;
};
/** 一整行歌词贴到谱上（粘贴用）：光标后第一个音起；光标在末尾时从第一个还没有歌词的音起。光标不动（詞先之后接着用数字填音高）。 */
export declare function applyLyricLine(st: EditorState, text: string): EditorState;
/** 「+」开头的那个字并进下标 i 之前最近的那个有歌词的音（歌词框已经跳到下一个音了）；前面没有 = 原样。 */
export declare function joinIntoPrev(st: EditorState, i: number, text: string): EditorState;
/** 「合」：下标 i 那个音的字并进前一个有字的音（一个音上几个字），这一句（到下一个休止为止）后面的字依次往前挪一个音、这一句最后一个音空出来
 *  （user「打完回头改同意。这里的心流反而是输入。所以不应该提前按」：打字照常自动分，回头点一个字再合）。这个音 / 前一个音没有字（或是拖腔）= 原样。 */
export declare function mergeIntoPrev(st: EditorState, i: number): EditorState;
/** 长按一个字拖（2026-10-08 Opus 5.5；user「歌词的合能不能也改成长按拖动。不然每次点文本框是超级麻烦的」）：下标 i 那个音上的字挪 k 个音（k > 0 往后、k < 0 往前），
 *  一步一步走（见 stepRight / stepLeft），都只在这一句里（句号是边界）。「合」了就停（字已经不单独在一个音上了）；推不动也停。
 *  返回 at = 字现在在哪个音、done = 实际走了几步（< |k| = 没走完，调用方说一声）。 */
export declare function moveSyllable(st: EditorState, i: number, k: number): {
    st: EditorState;
    at: number;
    done: number;
};
/** 下一个能放歌词的音（跳过休止、小节线、调号、tie 音）；没有 = -1。 */
export declare function nextLyricSlot(tokens: Token[], i: number): number;
export declare function prevLyricSlot(tokens: Token[], i: number): number;
export { lyricSlot };
