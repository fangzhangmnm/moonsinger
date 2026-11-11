/** 内存 → 持久缓存；都没有 = null。持久缓存里的字节先核 sha256 再给（不对 = 删掉、当没有）。 */
export declare function cachedSound(sha256: string): Promise<Uint8Array | null>;
/** 记住一份已核过 sha256 的字节：内存一定；persist = 也进持久缓存（留着离线用）。 */
export declare function rememberSound(sha256: string, bytes: Uint8Array, persist: boolean): Promise<void>;
/** 持久缓存里有哪些（sha256 + 大小）。 */
export declare function listCachedSounds(): Promise<{
    sha256: string;
    bytes: number;
}[]>;
export declare function isSoundPersisted(sha256: string): Promise<boolean>;
/** 从持久缓存和内存里都删掉（人删的）。 */
export declare function forgetSound(sha256: string): Promise<void>;
/** 放掉内存里的整包（user「你需要能手动释放缓存空间」）；持久缓存不动。 */
export declare function releaseSoundMemory(): void;
/** 内存里现在占着多少字节（整包）。 */
export declare function soundMemoryBytes(): number;
/** 站点存储配额（只读显示用；设置「音源库缓存」那行）。没有 API / 失败 = null。 */
export declare function siteStorageEstimate(): Promise<{
    usage: number;
    quota: number;
} | null>;
