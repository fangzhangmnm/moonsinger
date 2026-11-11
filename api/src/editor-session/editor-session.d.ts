/** app 的编辑引擎暴露给 editor-session 的最小面。本模块不懂内容，只调这几个。 */
export interface EditorAdapter {
    adopt(bytes: Blob, name: string): Promise<void>;
    onChange(cb: () => void): void;
    encode(): Promise<{
        bytes: Blob;
        peek?: Blob | null;
    }>;
    prepare?(): Promise<void>;
    onSaved?(name: string): void;
    canPersist?(): string | null;
    onRefused?(why: string): void;
    editLocked?(name: string): string | null;
}
/** editor-session 消费的 store 最小面（结构类型；真 sync-store 天然满足，测试可 mock）。 */
export type TryMoveResult = {
    ok: true;
    where?: string;
    oldName?: string;
    oldKept?: boolean;
    oldKeptByUser?: boolean;
    oldUnknown?: boolean;
    oldCloudOrphan?: boolean;
    cloudDeferred?: boolean;
} | {
    ok: false;
    reason: "name-collision";
    where: "local" | "cloud";
} | {
    ok: false;
    reason: "cancelled";
};
export interface StoreLike {
    file(name: string, opts: {
        isZip: boolean;
        mode: "new" | "existing";
    }): {
        open(): Promise<Blob | null>;
        save(bytes: Blob, opts?: {
            tryPush?: boolean;
            hint?: unknown;
        }): Promise<{
            pushed: boolean;
            reason?: string;
            resolution?: string;
        }>;
        tryMove(to: string): Promise<TryMoveResult>;
        trash(): Promise<{
            status: string;
        }>;
    };
}
/** app-agnostic 的 autosave / push 策略（每 app 不同 → 注入）。 */
export interface LifecyclePolicy {
    autosaveMs?: number;
    pushOn?: Array<"exit" | "blur" | "idle">;
    idleMs?: number;
}
export interface EditorSessionConfig {
    store: StoreLike;
    editor: EditorAdapter;
    isZip?: boolean;
    policy?: LifecyclePolicy;
}
export interface EditorSession {
    open(name: string): Promise<boolean>;
    adopted(name: string, opts?: {
        create?: boolean;
    }): void;
    markDirty(): void;
    flushLocal(): Promise<void>;
    flushAndPush(): Promise<void>;
    forceSaveAndPush(): Promise<void>;
    rename(newName: string): Promise<TryMoveResult>;
    delete(): Promise<void>;
    currentName(): string | null;
    /** 现在这个身份是 adopted({create:true}) 进来的、还没首存成（它还不在库里；修改锁据此不管它）。 */
    createPending(): boolean;
    release(): void;
    isDirty(): boolean;
    isPushPending(): boolean;
    /** 人按过存、当时没推成、之后没再改（规则书第 15 条 (b)：回来自动续传的依据；isPushPending 每次编辑都为真，分不出这个）。 */
    isPushOwed(): boolean;
    /** 库替这份推上去了（回来问一次 → dirty.pushAll）：别再记着欠一推。内存还脏就不算。 */
    noteExternallyPushed(): void;
    start(): void;
    dispose(): void;
}
export declare function createEditorSession(config: EditorSessionConfig): EditorSession;
