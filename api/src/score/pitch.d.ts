export declare const STEPS: readonly ["C", "D", "E", "F", "G", "A", "B"];
export type Step = (typeof STEPS)[number];
/** 带拼写的绝对音高。alter：-2..2（重降..重升）；octave：科学音高记号（中央 C = C4）。 */
export interface Pitch {
    step: Step;
    alter: number;
    octave: number;
}
export type Dir = "near" | "up" | "down";
/** 月读说话音高中位 ≈ 295 Hz ≈ D4（Lab 实测，README「月读说话的音高」）——没有上一个音时的参照。 */
export declare const HOME: Pitch;
export declare const stepIndex: (s: Step) => number;
/** MIDI 号（中央 C = 60）。 */
export declare function midiOf(p: Pitch): number;
/** 五线谱上的位置（每级 +1，C4 = 28）：比较「就近」和画谱都用它。 */
export declare function diatonicIndex(p: Pitch): number;
/** 调号（fifths：-7..7，同 MusicXML <key><fifths>）给这个音级的默认升降。 */
export declare function keyAlter(step: Step, fifths: number): number;
/** 调号里「1」的音级（大调主音；小调主音是 6，账本 §7「6 当主音」）。每升一个五度往上走 4 级。 */
export declare function tonicStepIndex(fifths: number): number;
/** 从五线谱位置 + 调号造一个音（升降照调号）。 */
export declare function fromDiatonic(d: number, fifths: number): Pitch;
/** 调里第几级（1–7）→ 五线谱上的音级下标。 */
export declare function degreeStepIndex(degree: number, fifths: number): number;
/** 把「第几级」放到具体的八度：就近 / 往上 / 往下（参照 = 上一个有音高的音，没有就是 HOME）。 */
export declare function placeDegree(degree: number, fifths: number, prev: Pitch | null, dir: Dir): Pitch;
/** 上下挪一级（↑↓）：升降回到调号默认。 */
export declare function stepBy(p: Pitch, steps: number, fifths: number): Pitch;
/** 挪半音（Shift+↑↓）：音级不动，只改升降，夹在 -2..2。 */
export declare function alterBy(p: Pitch, d: number): Pitch;
/** 按调拼写一个 MIDI 音：调内音用调里的拼法；调外音按方向（prefer 1 = ♯、-1 = ♭；默认升号调用 ♯、降号调用 ♭）。 */
export declare function spellMidi(midi: number, fifths: number, prefer?: 1 | -1): Pitch;
/** 按谱上的调号简化拼写：这个音（同音换写后）在调号里 = 用调号的写法；不在调里 = 照原样（人写的 ♯ / ♭ 不动）。
 *  例：五个升号的调里 A♭ = G♯（不挂临时记号）；G♮ 不在调里 = 还是 G♮。user 2026-10-08「升降号的歧义导致的没有自动简化怎么办」。
 *  重升 / 重降不动：单个 ♯ / ♭ 多半只是在 pad 上够黑键，𝄪 / 𝄫 一定是有意的拼法（升 G 小调的导音 F𝄪）。 */
export declare function keySpell(p: Pitch, fifths: number): Pitch;
/** 移几个半音，按调重新拼写（Shift+↑↓、移调的半音 / 全音）：往上用 ♯、往下用 ♭，调内音用调里的拼法（C 大调 E 升半音 = F，不是 E♯）。 */
export declare function transposeSemis(p: Pitch, semis: number, fifths: number): Pitch;
/** 按音程移（转调用）：字母走 steps 级、音高走 semis 个半音——拼写关系不变（F♯ 上大二度 = G♯，不是 A♭）。 */
export declare function transposeInterval(p: Pitch, steps: number, semis: number): Pitch;
/** 从调 f0 转到调 f1：主音之间的音程（就近方向，-6..+6 个半音）+ 字母走几级。 */
export declare function keyInterval(f0: number, f1: number): {
    steps: number;
    semis: number;
};
/** 挪八度（Alt+↑↓）。 */
export declare function octaveBy(p: Pitch, d: number): Pitch;
export declare function pitchName(p: Pitch): string;
export declare const samePitch: (a: Pitch | null, b: Pitch | null) => boolean;
/** 调名（「1=」后面那个字母）：五度数 → 名字（-7 … 7）。pad、谱面、记号编辑框共用。 */
export declare const KEY_LABEL: Record<number, string>;
/** 同一个调号的关系小调（la 是哪个音；v0.16.83）：C 大调 ↔ a 小调。 */
export declare const MINOR_LABEL: Record<number, string>;
/** 谱上 / 记号框里写的「1=C」/「6=A」（小调写 la 是哪个音）。 */
export declare const keyText: (fifths: number, minor?: boolean) => string;
