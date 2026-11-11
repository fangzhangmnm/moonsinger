/** 逐字确认那一句（和 WeebPaint 同一句，全家一个口令）。 */
export declare const CONSENT_PHRASE: string;
/** 自家派生缓存库（白名单表登记的四个；名字唯一来源 = config.ts CACHE_DBS，gallery-host.ts / singer/worker.ts / app/render-cache-idb.ts 引的就是它——test/factory-reset.test.ts 守）。
 *  renders（2026-11-10）= 这台设备上记着的渲好的声音：还原出厂一起清（清了能重来）。 */
export declare const OWN_DBS: readonly ["moonsinger-5b1e7c0a92d34f6e.thumbs", "moonsinger-5b1e7c0a92d34f6e.facts", "moonsinger-5b1e7c0a92d34f6e.speech", "moonsinger-5b1e7c0a92d34f6e.renders"];
export interface FactoryResetDeps {
    /** 进过歌库（store 建着）？ */
    attached(): boolean;
    /** 还没传上去的歌有几首（dirty.count()：从没传过的 + 传过改了没推的合计）。没建 store = 0。 */
    dirtyCount(): Promise<number>;
    /** 手里这首改过还没存？ */
    openUnsaved(): boolean;
    /** 动手之前：放下手里的歌的身份、停掉举着 IDB 连接的东西（小月相 worker 的念缓存）、dispose store（不 drain、不造逃生副本）。 */
    prepare(): Promise<void>;
    /** 只清自己的离线壳（pwa-shell.clearOwnShell）。 */
    clearShell(): Promise<void>;
    info(s: string): void;
    report(e: unknown, level: "warning" | "error" | "log"): void;
}
export type FactoryResetOutcome = "cancelled" | "mismatch" | "blocked" | "done";
/** 派生缓存库改名后的老库（moonsinger-thumbs / facts / speech）：不搬，探到就删。空闲片里一页一次（main.ts）；返回这次删掉的。2026-11-03 家族工单 A2 ⑤ */
export declare function dropLegacyCacheDbs(): Promise<string[]>;
/** 还原出厂主流程（设置 → 开发者 → 「还原出厂设置…」）。全程应用内 sheet。 */
export declare function runFactoryReset(d: FactoryResetDeps): Promise<FactoryResetOutcome>;
