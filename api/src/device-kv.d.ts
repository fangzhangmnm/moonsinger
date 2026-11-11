/** 这一页开局时 localStorage 用不用得了（Safari 双击打开 / 存储被禁 = 不能 → 全程只在内存）。 */
export declare function deviceKvUsable(): boolean;
/** 写不进、退到内存时通知一声（只一个听众 = persistence.ts）。 */
export declare function onDeviceKvFallback(cb: (why: string) => void): void;
export declare function deviceKvGet(key: string): string | null;
/** v=null 删键。写失败（配额 / 隐私模式中途翻脸）→ 落内存层，绝不 throw（device 层是便利不是红线）。 */
export declare function deviceKvSet(key: string, v: string | null): void;
export declare function deviceKvGetJson<T>(key: string, fallback: T): T;
export declare function deviceKvSetJson(key: string, v: unknown): void;
/** 还原出厂：清掉本 app 前缀下全部 localStorage 键（localStorage 只准本文件碰）。返回删掉的键数。 */
export declare function deviceKvWipeAll(): number;
