export declare const SAFE_ID: RegExp;
export declare const isSafeId: (x: unknown) => x is string;
type Json = Record<string, unknown>;
export type IdKind = "paper" | "part" | "role" | "track" | "candidate" | "fx" | "fxKind";
/** 自家文件的几份 JSON（已经升到这一版的形状）里所有当编号用的字段：哪一类有几个不合规矩。空 = 都好。 */
export declare function badIds(scoreExt: Json | null | undefined, lounge: Record<string, Json>, studio: Json | null | undefined): Partial<Record<IdKind, number>>;
/** 别的软件存的谱：声部编号不合规矩的换成没用过的 P<n>（合规矩的原样留着）。 */
export declare function safePartIds<T extends {
    info: {
        id: string;
    };
}>(parts: readonly T[]): T[];
/** 视图态（score.json 的 view）里按编号挂的两样：在哪张纸、每个声部的显示 / 出声开关。不合规矩的那几条丢掉（视图态本来就是「读的一方宽容」，丢了 = 回到默认）。 */
export declare function safeView(view: Record<string, unknown> | null): Record<string, unknown> | null;
export {};
