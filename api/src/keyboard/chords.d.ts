export declare const CHORD_WIN = 80;
export declare const CHORD_MS = 50;
export interface Press {
    readonly t: number;
}
export type ChordWhy = "keyUp" | "rootUp" | "both" | "force";
/** B 落下那一刻：和根音几乎同时（头）= 马上叠；否则观望。 */
export declare const chordHead: (root: Press, b: Press, win?: number) => boolean;
/** 观望要等多久（从 B 落下起，ms）：一起按着一超过「根音单独按着的时长」就该定了（+5 ms 余量）。 */
export declare const chordBothAfterMs: (root: Press, b: Press) => number;
/** 观望中的 B 怎么定。why = 谁先发生：B 松 / 根音松 / 到时候了（两个都还按着才算，不然 null = 等别的事件）/ 又按了下一个键或失焦。 */
export declare function chordVerdict(root: Press, b: Press, now: number, why: ChordWhy, rootHeld: boolean, keyHeld: boolean): "chord" | "two" | null;
/** 单音乐器：还有键按着、离上一次按下不到 ms = 这一下算同时按（挡掉）。 */
export declare const monoClash: (heldCount: number, lastAt: number, now: number, ms?: number) => boolean;
