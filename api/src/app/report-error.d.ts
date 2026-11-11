export type ErrorLevel = "error" | "warning" | "info" | "log";
export declare function reportError(err: unknown, level?: ErrorLevel): void;
/** 面包屑（不是错误）：boot / auth / doc / gallery / sync / sw 的时间线，只进黑匣子。 */
export declare const diagNote: (tag: string, msg: string) => void;
export declare const diagText: () => string;
export declare const diagCount: () => number;
export declare const diagClear: () => void;
/** boot 第一件事：黑匣子落到 device-kv 器官（同步、不靠 IDB）、收 index.html 内联脚本排队的早期错误、接 window error / unhandledrejection、页面生命周期面包屑。 */
export declare function initBlackBox(version: string): void;
