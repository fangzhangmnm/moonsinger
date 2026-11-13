import type { EditLock } from "./edit-lock.ts";
export interface EditLockDoorDeps {
    lock: EditLock;
    /** 门插在谁前面（#stage）。 */
    before: HTMLElement;
    /** 开着的这首在歌库里的身份；不在歌库 → null。 */
    activeIdentifier(): string | null;
    /** 「接着改」：解锁歌库里的这首（图库库的动词，成没成它自己会说）。 */
    unlock(identifier: string): Promise<boolean>;
    /** 「存一版再改」：先存一版，成了才解锁。 */
    saveVersionThenUnlock(identifier: string): Promise<boolean>;
}
export interface EditLockDoor {
    /** 按现在的锁态和家重画（换歌之后叫：锁态没变但钮的个数可能变了）。 */
    sync(): void;
    /** 「接着改」= 门上那颗钮的同一个动作。别处一颗「解锁」钮（「这首歌」面板顶上那一行，v0.17.27）点了调它；**只许挂在人的点击上**（test/edit-lock-guard.test.mjs 钉调用点）。 */
    continueEdit(): void;
}
export declare function initEditLockDoor(d: EditLockDoorDeps): EditLockDoor;
