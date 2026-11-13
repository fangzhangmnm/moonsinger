// 测试用的「力度 → dB」曲线：SoundFont 规范的放法（SF2.01 8.4.1，「力度 → 初始衰减」调制器；深度 960 = 规范默认）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   src 里不再有这条公式（第 16 条 16-4）：按力度敲的乐器在 app 里用音色库自己写的深度算出来的 L（gm/sf2-subset.ts），按音量走的小月相 / 元音版用她身上的 dB 表。
//   测试要一条确定的按力度敲的曲线时用这里的。
import type { VelDb } from "../../src/score/perform.ts";
export const sf2Db = (vel: number, depth = 960): number => (depth / 960) * 40 * Math.log10(Math.max(1, Math.min(127, vel)) / 127);
export const sf2Curve = (depth = 960): VelDb => (_midi, vel) => sf2Db(vel, depth);
