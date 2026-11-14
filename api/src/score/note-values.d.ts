/** 一个长度是哪种音符：base = 六种里的第几种（短 → 长）、dotted = 带不带附点。不是这十二种之一 = null（连音、拼起来的长度）。 */
export declare function lenShape(len: number): {
    base: number;
    dotted: boolean;
} | null;
/** 文件里的时值名（view.pad.unit）：六个音符名，或者前面带 dotted-。没有名字 = null（存的时候这一项不写，不猜一个近的）。 */
export declare function lenName(len: number): string | null;
/** 反过来：时值名 → 长度；不认识 = null（读的时候那一项用默认）。 */
export declare function lenOfName(name: unknown): number | null;
/** 文件里能写的所有时值名（六个 + 六个带附点的）。 */
export declare const LEN_NAMES: readonly string[];
/** 键面上的图：SMuFL 音符（符干朝上），带附点 = 后面一个附点。不是这十二种之一 = 空串。 */
export declare function lenGlyph(len: number): string;
/** 人话名：「四分」「附点四分」。不是这十二种之一 = 按四分音符的几分之几说。 */
export declare function lenLabel(len: number): string;
/** 这个拍号里长短旋钮上的档（短 → 长，长度 tick）。算法 = 文件头那条规矩。 */
export declare function lenSteps(beats: number, beatType: number): number[];
/** 旋钮上实际摆的：这个拍号的档；正选着的长度不在表上 = 按长短插进去（软件不替人换档，旋钮照实显示它）。 */
export declare function lenChoices(steps: readonly number[], cur: number): number[];
/** 沿这个拍号的表走一档（dir = −1 短 / +1 长）：不在表上的长度 = 往那个方向找最近的一档；到头 = null。 */
export declare function stepLen(steps: readonly number[], cur: number, dir: -1 | 1): number | null;
/** 「/2」减半之后多长：长度的一半；不到三十二分（或不是整数 tick）= null（减不了，和原来一样）。 */
export declare function halfLen(len: number): number | null;
