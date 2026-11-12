// roll-variation.ts —— 滚奏的「变化」（施工单 7-N 第三批：乐器页里的试验选项，默认关）。纯函数；数都写在这一处，乐器页照这里的数说给人听。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-12：「根据游戏里面做枪的经验，应该有variation」→ 听了统筹的四步之后「可以，放在乐手设置里面…然后默认是均匀，12」
//   「默认没有变化，我试了之后告诉你该sunset变化还是默认变化」。所以：默认 = 均匀（不走这里）；选了「左右手交替 + 小随机」才走这里。
//   试验期间这个选项只在这次打开里有效、不进歌、不进撤销（统筹裁定，照 v0.12.4 唱法实验行的做法）；听和导出都带上（同一个时间线）。
//   随机按「这个滚奏的音的 id」定种子：同一首歌每次渲出来一样，离线 = 实时；同一个和弦里几个音同一个种子 = 一起敲。

/** 「变化」的几档（都是左右手交替 + 随机，只差随机多大）：small = 小，clear = 明显。没有这一项 = 均匀（默认）。以后加「压滚」也在这里加一档。
 *  「明显」是统筹 2026-11-12 加的：小那一档约 ±0.7 dB、±2.5 毫秒，很可能听不出来，user 试了分不清是变化没用还是太小。 */
export type RollVariation = "small" | "clear";

/** 每一档的数（小 = Claude Opus 5.5 起的；明显 = 统筹定的；user 试了再定）：
 *  · hand：双数下（第 2、4、6…下 = 另一只手）比单数下轻多少（力度的比例）——两档一样，不加大（user 说过不要低频的半频波动）；
 *  · vel：每一下的力度再随机乘 1 ± 这么多；
 *  · time：每一下的起点随机挪「一下的间隔」的 ± 这么多（第一下不挪，滚奏从写的那一拍起；最后一下的结尾不挪）。 */
export const ROLL_VARIATION: Readonly<Record<RollVariation, { hand: number; vel: number; time: number }>> = {
  small: { hand: 0.03, vel: 0.04, time: 0.03 },
  clear: { hand: 0.03, vel: 0.10, time: 0.08 },
};

/** 0–1 的确定的随机数：种子（音的 id）+ 第几下 + 用途（力度 / 时间各一路，互不牵连）。整数混合（同 murmur3 的收尾），不依赖 Math.random。 */
export function rollRand(seed: number, i: number, lane: number): number {
  let h = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca77) ^ Math.imul(lane + 1, 0xc2b2ae3d)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 一个滚奏的音切成的一串敲击（起点、终点、力度 0–1 = MIDI ÷ 127）加上变化：起点挪一点、每一下的终点 = 下一下真正的起点（同一个键先松再按，不会把下一下掐掉）、
 *  力度按手和随机乘一点（夹在 1–127 的整数力度上）。没有力度的（按音量曲线的演奏者）只挪时间。输入不改，回新的一串。 */
export function varyRoll<T extends { t0: number; t1: number; vel?: number }>(hits: readonly T[], seed: number, mode: RollVariation): T[] {
  const R = ROLL_VARIATION[mode]; if (!R || hits.length < 2) return hits.slice();
  const d = (hits[hits.length - 1]!.t1 - hits[0]!.t0) / hits.length;
  const t0s = hits.map((h, i) => (i === 0 ? h.t0 : h.t0 + R.time * d * (2 * rollRand(seed, i, 1) - 1)));
  return hits.map((h, i) => {
    const out = { ...h, t0: t0s[i]!, t1: i + 1 < hits.length ? t0s[i + 1]! : h.t1 };
    if (h.vel !== undefined) {
      const f = (i % 2 === 1 ? 1 - R.hand : 1) * (1 + R.vel * (2 * rollRand(seed, i, 0) - 1));
      out.vel = Math.max(1, Math.min(127, Math.round(h.vel * 127 * f))) / 127;
    }
    return out;
  });
}
