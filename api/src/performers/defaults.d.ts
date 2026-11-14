import { type Extras } from "../format/project.ts";
import type { Hum } from "../format/contract.ts";
import type { Catalog } from "../gm/catalog.ts";
import { type DefaultRowDef, type PerformerPlugin } from "./registry.ts";
type Json = Record<string, unknown>;
export interface DefaultDiff {
    id: string;
    label: string;
    keys: readonly string[];
    resettable: boolean;
}
export interface DefaultsReport {
    /** 和现在的默认不一样的行（页面上从上往下的顺序：通用的、这位自己的）。 */
    rows: DefaultDiff[];
    /** 要问音乐目录、目录还没载的行数（先不比；乐器页写「目录载好后再比 n 行」、宿主去载）。 */
    pending: number;
    /** 「现在新上场」那一位（页面拿它算「现在的默认」那一句；没人上场 / 这一版不认识的引擎 = null）。 */
    def: Json | null;
}
/** 这位（台上那位）有哪几行能比：通用的 + 插件自己的，按 when 挑；keys 摊开成路径。 */
export declare function rowsFor(p: PerformerPlugin, cur: Json): (DefaultRowDef & {
    keys: readonly string[];
})[];
/** 台上那位和现在的默认比（一处）。没人上场 / 读不懂的引擎 = 空。catalog = 音乐目录（没载 = null）。 */
export declare function defaultsReport(extras: Extras, role: string, catalog: Catalog | null): DefaultsReport;
/** 乐器页「默认」钮：这一行改回现在的默认（按值抄进文件，一步撤销）。没有这一行 / 只读的那一行 / 要的目录没载 = 原样（null）。 */
export declare function resetRow(extras: Extras, role: string, id: string, catalog: Catalog | null, hum: Hum): Extras | null;
/** 把台上那位整个换成「现在的默认」那一位的休息室（只给页面算「现在的默认」那一句用：同一个显示函数在它上面再跑一次；不进文件）。 */
export declare function defaultExtras(extras: Extras, role: string, def: Json, hum: Hum): Extras;
/** 「缺的数」那一行的「补成现在的默认」（统筹 2026-11-13 第三样）：缺了 / 不是数的那几个键（perfSpecOf 报的问题清单）各补成什么。
 *  值 = 现在新上场会带着的那一位（castNow，同「默认」钮）；只碰问题清单里的键，别的数一个不动。要的目录没载 = 先不补、列在 waiting（宿主去载）。
 *  没人上场 / 规格没毛病 = null。key = 问题清单里的写法（accentDb / dynamicsVel.pp / defaults.velocity），path = 乐手身上的路径。 */
export interface MissingFill {
    fills: {
        key: string;
        path: string;
        value: unknown;
    }[];
    waiting: string[];
}
export declare function missingFillPlan(extras: Extras, role: string, catalog: Catalog | null): MissingFill | null;
/** 照着补（按值抄进文件，宿主一步撤销）。没有能补的 = null。 */
export declare function fillMissing(extras: Extras, role: string, catalog: Catalog | null, hum: Hum): Extras | null;
export {};
