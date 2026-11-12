/** 「变化」的几档（都是左右手交替 + 随机，只差随机多大）：small = 小，clear = 明显。没有这一项 = 均匀（默认）。以后加「压滚」也在这里加一档。
 *  「明显」是统筹 2026-11-12 加的：小那一档约 ±0.7 dB、±2.5 毫秒，很可能听不出来，user 试了分不清是变化没用还是太小。 */
export type RollVariation = "small" | "clear";
/** 每一档的数（小 = Claude Opus 5.5 起的；明显 = 统筹定的；user 试了再定）：
 *  · hand：双数下（第 2、4、6…下 = 另一只手）比单数下轻多少（力度的比例）——两档一样，不加大（user 说过不要低频的半频波动）；
 *  · vel：每一下的力度再随机乘 1 ± 这么多；
 *  · time：每一下的起点随机挪「一下的间隔」的 ± 这么多（第一下不挪，滚奏从写的那一拍起；最后一下的结尾不挪）。 */
export declare const ROLL_VARIATION: Readonly<Record<RollVariation, {
    hand: number;
    vel: number;
    time: number;
}>>;
/** 0–1 的确定的随机数：种子（音的 id）+ 第几下 + 用途（力度 / 时间各一路，互不牵连）。整数混合（同 murmur3 的收尾），不依赖 Math.random。 */
export declare function rollRand(seed: number, i: number, lane: number): number;
/** 一个滚奏的音切成的一串敲击（起点、终点、力度 0–1 = MIDI ÷ 127）加上变化：起点挪一点、每一下的终点 = 下一下真正的起点（同一个键先松再按，不会把下一下掐掉）、
 *  力度按手和随机乘一点（夹在 1–127 的整数力度上）。没有力度的（按音量曲线的演奏者）只挪时间。输入不改，回新的一串。 */
export declare function varyRoll<T extends {
    t0: number;
    t1: number;
    vel?: number;
}>(hits: readonly T[], seed: number, mode: RollVariation): T[];
