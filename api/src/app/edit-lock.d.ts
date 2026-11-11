import type { LocusKind } from "../score/history.ts";
/** 库的锁面（@internal/store 2.3.x 的 files 那几样；结构类型，测试可 mock）。 */
export interface LockStore {
    lockByDefault: boolean;
    unlockOf(identifier: string): unknown;
    watchUnlocks(cb: (live: unknown[]) => void): () => void;
}
/** 开着的这首歌的家（src/app/home.ts 的 Home 的投影：这里只要知道是哪一种、身份 / 句柄是谁）。 */
export type LockHome = {
    kind: "gallery";
    identifier: string;
} | {
    kind: "file";
    handle: object;
} | {
    kind: "none";
};
export interface EditLockDeps {
    /** 现在挂着的库的锁面；没有库 → null。 */
    store(): LockStore | null;
    /** 开着的这首歌的家。 */
    home(): LockHome;
    /** 歌库里刚新建、还没首存的那首（它还不在库里，谈不上锁；首存之后库发一枚解锁）。 */
    createPending(): boolean;
    /** 正在装入文档（装入不算改）。 */
    loading(): boolean;
}
export type LockState = "none" | "locked" | "unlocked";
export interface EditLock {
    /** 开着的这首歌和这把锁的关系。none = 这把锁不管它（没有家 / 刚新建还没存 / 库没开锁）。 */
    state(): LockState;
    /** 开着的这首歌此刻是不是锁着。 */
    locked(): boolean;
    /** 现在有没有东西可以「锁上」：开着一首已经存在的歌，而且它此刻解着。 */
    canLockNow(): boolean;
    /** 现在开着的是不是硬盘上的单个文件（门据此只给一个钮）。 */
    isLocalFile(): boolean;
    /** 保存这一层用：歌库里的这个身份是不是锁着（editor-session 按「要存的那个身份」问，不按「开着的这首」）。 */
    identifierLocked(identifier: string): boolean;
    /** 写入口：这一类操作此刻让不让做。让 → null；不让 → 原因（并让门闪一下）。没锁：都放。锁着：表里的看法放行，其余一律拒。装入期间放行。 */
    writeGate(kind: LocusKind): string | null;
    /** 「接着改」：解锁现在开着的这个硬盘文件，管到关掉 / 换开别的为止。**只在人点钮时调。** 开着的不是硬盘文件 → false。 */
    unlockLocalFile(): boolean;
    /** 这个句柄算解着：新歌刚存成的文件（人自己那一下保存建出来的）。不是解锁的口：只许 home 的安家那一处调，而且要在把家换成这个文件之前、同一个同步段里调。 */
    keepLocalFileUnlocked(handle: object): void;
    /** 「锁上」现在开着的这个硬盘文件（调之前调用方已经把改动写回去了）。 */
    lockLocalFile(): void;
    /** 蹭到了：让门闪一下（不弹任何东西）。 */
    flash(): void;
    onFlash(fn: () => void): () => void;
    /** 锁态变了（换歌 / 解锁 / 锁上 / 过期 / 换库）→ 回调现在的锁态。 */
    onChange(fn: (locked: boolean, state: LockState) => void): () => void;
    /** 对一下：库换了就重订解锁的订阅；锁态变了就通知。换歌、装入完、存完、换库之后调；多调无害。 */
    refresh(): void;
}
export declare function createEditLock(d: EditLockDeps): EditLock;
