import { type MarkTok, type MarkVal } from "./song.ts";
/** 记号 → 框里的字。 */
export declare function markText(t: MarkTok): string;
/** 框里的字 → 记号的值（认不出 = null）。 */
export declare function parseMark(kind: MarkTok["kind"], raw: string): MarkVal | null;
