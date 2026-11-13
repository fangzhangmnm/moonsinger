export type BuiltinLib = "voice" | "gs";
/** 被删了的那一句（不出声的清单里的原因、worker 报回来的错，同一句）。 */
export declare const removedWhy: (lib: BuiltinLib) => string;
/** 缺的东西怎么办：在 = 用；不在、没被删 = 自己下载（照原来）；不在、被删了 = 不下载，报「被删了」。 */
export declare const packPlan: (ready: boolean, removed: boolean) => "use" | "download" | "removed";
