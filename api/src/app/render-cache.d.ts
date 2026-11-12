/** 歌文件的「戳」= 它的总目录（`.moonsinger/manifest.json`）文本的哈希。总目录里记着存的时刻，文件每存一次都变；歌库尾读一次就拿得到，不用打开歌。
 *  编辑器这头（存完之后）和歌库那头（列卡片的时候）算的是同一个函数，才对得上。 */
export declare const stampOf: (manifestText: string) => string;
/** 总目录在歌文件（zip）里的位置。 */
export declare const MANIFEST_ENTRY = ".moonsinger/manifest.json";
export interface RenderMeta {
    key: string;
    fingerprint: string;
    quality: string;
    /** 进了这份声音的声部 id（排过序）。 */
    parts: string[];
    /** 真出了声的角色 id（署名推演用）。 */
    roles: string[];
    secs: number;
    kbps: number;
    stereo: boolean;
    /** 循环那一圈在这份声音里的起止秒（按谱：第一张纸头 / 循环段头 → 谱的结尾，不含余音；src/core/render.ts loopSpanOf）。
     *  2026-11-11 起渲的才有；没有（之前渲的、老文件里搬来的）= 歌库循环按整个文件绕（要等余音放完）。 */
    loop?: {
        start: number;
        end: number;
    };
    /** mp3 的字节数（带标签）。 */
    size: number;
    /** 标签上写的歌名（没有歌名时 = 文件名）。 */
    title: string;
    /** 渲的时刻 / 最近一次用的时刻（毫秒）。 */
    at: number;
    used: number;
    /** 渲的时候的 app 版本和渲染核心。 */
    app: string;
    core: {
        version: string;
        hash: string;
    };
}
/** 这一遍是旧版本的渲染核心渲的（7-S，2026-11-12；user「以及加一个删旧渲染缓存和删缓存的功能」）：判法 = 记录里的核心哈希和现在的不一样。
 *  旧的照样能听（歌库里「当年的声音不用太焦虑」），只是标出来、能一键删；不自动删（自动只许拦、不许替人管）。 */
export declare const renderedByOldCore: (meta: Pick<RenderMeta, "core">, core: {
    hash: string;
}) => boolean;
/** 歌库里的一个身份挂在哪条记录上。home = 哪个家（网盘 = "default"，文件夹 = 它的 id；同名的歌在两个家里不是一回事）。 */
export interface RenderLink {
    home: string;
    identifier: string;
    key: string;
    stamp: string;
}
/** 存储口（浏览器 = IndexedDB；测试 = 内存）。 */
export interface RenderCacheStore {
    load(): Promise<{
        metas: RenderMeta[];
        links: RenderLink[];
    }>;
    put(meta: RenderMeta, bytes: Uint8Array): Promise<void>;
    bytes(key: string): Promise<Uint8Array | null>;
    touch(meta: RenderMeta): Promise<void>;
    remove(key: string): Promise<void>;
    putLink(link: RenderLink): Promise<void>;
    removeLink(home: string, identifier: string): Promise<void>;
    clear(): Promise<void>;
}
export interface RenderCache {
    /** 索引装好了（开机后空闲时装一次；装好之前 find / linkOf 都是空的 = 当没记着）。 */
    ready(): Promise<void>;
    keyOf(o: {
        fingerprint: string;
        quality: string;
        parts: readonly string[];
        title: string;
    }): string;
    /** 这一条记着吗（只看索引，同步）。 */
    find(key: string): RenderMeta | null;
    /** 同一份内容（指纹）记着的里面最近用过的那一条（不挑音质 / 声部；歌库里听用它）。同步。 */
    latestFor(fingerprint: string): RenderMeta | null;
    /** 取出字节（顺便记一次「用过」）。索引里有、字节却没了 = 这条作废、回 null。 */
    take(key: string): Promise<{
        meta: RenderMeta;
        bytes: Uint8Array;
    } | null>;
    /** 记下一份刚渲好的（超了上限丢最久没用的）。存不进去 = 抛给调用方（它照常把声音给人，只是下次要重渲）。 */
    put(meta: Omit<RenderMeta, "key" | "size" | "at" | "used">, bytes: Uint8Array): Promise<RenderMeta>;
    /** 歌库里的这个身份现在挂着哪条记录（没有 / 那条记录已经丢了 = null）。同步。 */
    linkOf(home: string, identifier: string): (RenderLink & {
        meta: RenderMeta;
    }) | null;
    /** 挂名：这个身份的文件（此刻的戳）就是这条记录的内容。记录不在 = 不挂、回 false。 */
    link(home: string, identifier: string, key: string, stamp: string): Promise<boolean>;
    unlink(home: string, identifier: string): Promise<void>;
    /** 身份换了名字（改名 / 挪夹）：挂名跟过去（戳不变：字节没动）。 */
    renamed(home: string, from: string, to: string): Promise<void>;
    /** 设置页显示用。 */
    stats(): {
        count: number;
        bytes: number;
        max: number;
    };
    /** 设置页的列表（v0.16.101，user 11-11「看得见、删得掉 同意」）：每条记录 + 挂在它名下的歌库身份；最近用过的在前。同步。 */
    list(): {
        meta: RenderMeta;
        links: RenderLink[];
    }[];
    /** 删一条（字节 + 挂在它名下的名字一起）。 */
    remove(key: string): Promise<void>;
    /** 旧版本的渲染核心渲的有几条、共多大（renderedByOldCore；设置页那颗钮上写）。同步。 */
    oldStats(core: {
        hash: string;
    }): {
        count: number;
        bytes: number;
    };
    /** 一键删掉旧版本的渲染核心渲的（字节 + 挂名一起）；回删了几条、多大。 */
    removeOld(core: {
        hash: string;
    }): Promise<{
        count: number;
        bytes: number;
    }>;
    clear(): Promise<void>;
    /** 索引变了（多了一条 / 丢了一条 / 挂名变了）→ 回调（歌库卡片上的 ▶ 跟着重算）。 */
    onChange(fn: () => void): () => void;
}
export declare function createRenderCache(store: RenderCacheStore, o: {
    max: number;
    now: () => number;
    report?: (e: unknown) => void;
}): RenderCache;
/** 内存里的存储口（测试用；浏览器里没有 IndexedDB 时也用它 = 只在这次打开里记着）。 */
export declare function memoryRenderStore(): RenderCacheStore;
