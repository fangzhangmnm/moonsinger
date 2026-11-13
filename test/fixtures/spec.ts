// 测试用的出声规格（PerfSpec）：按力度路各一份，数全抄模板（format/template.ts）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   16-4 A 起出声那一层的规格每个数必填、没有默认；测试要哪一路就从这里拿一份，再盖上自己要试的那几个数。
import { TEMPLATE } from "../../src/format/template.ts";
import type { GainSpec, VelSpec } from "../../src/score/perform.ts";
const L = TEMPLATE.lounge;
/** 按音量走的（小月相 / 元音版那一路）。 */
export const gainSpec = (over: Partial<GainSpec> = {}): GainSpec => ({ path: "gain", ...L.articulation.gain, dynamicsDb: { ...L.dynamicsDb }, sing: structuredClone(L.sing), ...over });
/** 按力度敲的（SoundFont 那一路）。 */
export const velSpec = (over: Partial<VelSpec> = {}): VelSpec => ({ path: "velocity", ...L.articulation.velocity, dynamicsVel: { ...L.dynamicsVel }, sing: {}, ...over });
