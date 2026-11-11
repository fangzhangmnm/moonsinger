import { type EditorState } from "../score/song.ts";
import type { Layout } from "../render/engrave.ts";
/** 这一句引擎念成什么（v0.9.34）：parts = 每个音节的音素，at = 框里这个字是第几个（-1 = 对不上、不标）；note = 前面那句话。 */
export interface LyricReading {
    parts: string[];
    at: number;
    note: string;
}
interface Host {
    get(): EditorState;
    set(next: EditorState, opts?: {
        gesture?: string;
    }): void;
    lyricHint?(i: number): string | null;
    lyricReading?(i: number): LyricReading | null;
}
export declare class LyricEditor {
    private parent;
    private host;
    private layout;
    private rerender;
    private input;
    /** 「合」：这个字并进前一个音（回头改用；打字的时候框在空的音上，它不出来）。 */
    private merge;
    /** 框上面的小字：这个音的字台上这位唱不出来的那句话（纪律「做不到的一律画灰 + 明说」；2026-10-08 Opus 5.5）。 */
    private hint;
    /** 框下面的小字：这一句月读念成什么（v0.9.34；全假名时助词 は 会被注成 ha，看得见才改得了）。 */
    private reading;
    private index;
    system: number;
    constructor(parent: HTMLElement, host: Host, layout: () => Layout | null, rerender: () => void);
    get open(): boolean;
    /** 在下标 i 的音下面打开（框里放着它现在的字，全选，方便直接改写）。 */
    openAt(i: number): void;
    /** 重画之后把框挪回那个音下面。 */
    reposition(): void;
    /** 点「合」：框里改过的先贴上，再把这个字并进前一个音、这一句后面的字往前挪；框留在这个音上（现在是挪过来的字）。 */
    private mergeNow;
    /** 把框里的字贴到当前这个音（可能一次贴好几个音节，往后挪），并跳到下一个空位。 */
    private place;
    private slotText;
    /** 输入法选定 / 直接打字之后：中日文字立刻贴；拖腔记号立刻贴；英文等空格或「-」。 */
    private absorb;
    /** 键盘路由来的动作（src/keyboard/keys.ts 的「歌词框」那几行）。返回 false = 这一下不归歌词框管（让输入框照常打字）。 */
    act(a: "commit" | "cancel" | "next" | "prev" | "hyphen" | "back"): boolean;
    /** 前后挪一个歌词位（不贴字）。 */
    private step;
    /** 框里有字就照原样贴到当前这个音（不往后挪）；空框 = 清掉这个音的字。 */
    private commitOnly;
    commitAndClose(): void;
    close(): void;
}
export {};
