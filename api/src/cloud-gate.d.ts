export type GateReason = "expired" | "offline" | "noResponse";
export type GatePhase = "open" | "checking" | "blocked";
/** 常驻条三态：不显示 / 离线（带份数）/ 已连上正在补传。 */
export type BarState = "hidden" | "offline" | "syncing";
export declare function isUserOffline(): boolean;
export declare function rawOnline(): boolean;
/** 浏览器说有网 ∧ 人没选离线。原来散在各处的 `navigator.onLine` 云端判断都换成它（选了离线 = 一条网都不打）。 */
export declare function cloudOnline(): boolean;
export declare function onUserOfflineChange(f: () => void): () => void;
export interface AuthFailure {
    where: string;
    name: string;
    code: string;
    sub: string;
    reason: GateReason;
}
export declare function parseAuthFailure(message: string): AuthFailure | null;
/** 从库的日志行里捡原因码（不是这种行 = 不管）。回 true = 认出来了。 */
export declare function noteAuthFailure(message: string): AuthFailure | null;
export interface GateUi {
    checking(onEscape: () => void): void;
    blocked(reason: GateReason, on: {
        signIn: () => void;
        offline: () => void;
    }): void;
    /** 只关闸门自己那层（别的面——库的冲突面——不碰）。 */
    release(): void;
    /** 锁屏位上现在是别人的面（库的冲突面）：别抢。 */
    foreignFaceUp(): boolean;
    bar(state: BarState): void;
}
export interface CloudGateDeps {
    ui: GateUi;
    hasHome(): boolean;
    signedIn(): boolean;
    /** 静默续签一次。 */
    renew(): Promise<boolean>;
    /** 问云端一次；回库的终态串（"cloud-error" = 没问成）。 */
    check(): Promise<string | undefined>;
    /** 连上之后补一轮（快进 / 推开着的 / 排队回放 / 「去处理」）。 */
    catchUp(): Promise<void>;
    /** 交互登录。true = 已起跳（页面要走了）。 */
    signIn(): Promise<boolean | null>;
    /** 问云端一次，**不经 store**（选了离线时 store 不出网）：抛 / 不答 = 还没回来。令牌可能是缓存的，续签成功说明不了网通（设计稿 §3，WeebPaint 实测）。 */
    reachable?(): Promise<unknown>;
    /** 放行了（没走 catchUp 的那种：一路顺利）：app 看要不要问「回来问一次」。 */
    afterPass?(): void;
    /** 定时器（默认 setInterval；测试给假时钟）。 */
    every?(ms: number, fn: () => void): () => void;
    offlineRetryMs?: number;
    /** 页面看得见吗（藏着不试：回前台那一下会试）。 */
    pageVisible?(): boolean;
    note(line: string): void;
    now?(): number;
    timeoutMs?: number;
}
export interface CloudGate {
    phase(): GatePhase;
    /** 罩 / 闸在上面（不许把焦点还给纸）。 */
    locked(): boolean;
    /** 开机（initAuth 落地后调）。 */
    boot(): Promise<void>;
    /** 醒来。lock = 先罩住（离开得久）；不罩 = 悄悄核，只有没连上才弹闸。 */
    wake(lock: boolean): Promise<void>;
    /** 网回来了。回 true = 闸门接手了（调用方别再走老路）。 */
    netBack(): boolean;
    netLost(): void;
    authChanged(signedIn: boolean, reason?: string): void;
    /** 云钮「重新连接」。 */
    reconnect(): Promise<void>;
    /** 给库的 offlineEscape 接缝（§4）：闸门在场时，库里那条「问云端」跟闸门的逃生钮赛跑，不另开一张面。 */
    storeEscape(): {
        probe: Promise<unknown>;
        settle: () => void;
    } | null;
}
export declare function createCloudGate(d: CloudGateDeps): CloudGate;
